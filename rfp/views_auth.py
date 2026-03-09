from datetime import timedelta
import random

from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Vendor, AuthConfig, LoginOTP, Category
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    OTPVerifySerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
)


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }


def get_auth_config():
    cfg, _ = AuthConfig.objects.get_or_create(
        id=1,
        defaults={
            "enable_vendor_2fa": True,
            "otp_expiry_minutes": 10,
        }
    )
    return cfg


def send_otp_email(email, otp, subject="Your Login OTP"):
    send_mail(
        subject=subject,
        message=f"Your OTP is: {otp}",
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=False,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def register_api(request):
    data = request.data

    email = (data.get("email") or "").strip().lower()
    password = data.get("password")
    confirm_password = data.get("confirm_password")

    if password != confirm_password:
        return Response(
            {"error": "Passwords do not match."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if User.objects.filter(username=email).exists():
        return Response(
            {"error": "Email already exists."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if Vendor.objects.filter(email=email).exists():
        return Response(
            {"error": "Vendor email already exists."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if Vendor.objects.filter(contact=data.get("phone")).exists():
        return Response(
            {"error": "Phone number already exists."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    category_id = data.get("category_id")
    category = Category.objects.filter(id=category_id, status="ACTIVE").first()

    if not category:
        return Response(
            {"error": "Please select a valid category."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=data.get("first_name", ""),
            last_name=data.get("last_name", ""),
        )

        vendor = Vendor.objects.create(
            first_name=data.get("first_name", ""),
            last_name=data.get("last_name", ""),
            email=email,
            contact=data.get("phone", ""),
            revenue_last_3_years_lakhs=data.get("revenue") or None,
            employees_count=data.get("employees") or None,
            gst_no=data.get("gst_no", ""),
            pan_no=data.get("pan_no", ""),
            category=category,
            status="PENDING",
        )

        return Response(
            {
                "message": "Vendor registered successfully. Wait for admin approval.",
                "vendor": {
                    "id": vendor.id,
                    "email": vendor.email,
                    "status": vendor.status,
                },
            },
            status=status.HTTP_201_CREATED,
        )

    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_400_BAD_REQUEST,
        )

@api_view(["GET"])
@permission_classes([AllowAny])
def public_categories_api(request):
    categories = Category.objects.filter(status="ACTIVE").values("id", "name")
    return Response(list(categories), status=status.HTTP_200_OK)

@api_view(["POST"])
@permission_classes([AllowAny])
def login_api(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data["user"]

        # admin direct login
        if user.is_staff or user.is_superuser:
            tokens = get_tokens_for_user(user)
            return Response(
                {
                    "message": "Admin login successful.",
                    "tokens": tokens,
                    "role": "admin",
                },
                status=status.HTTP_200_OK,
            )

        vendor = Vendor.objects.filter(email=user.username).first()

        if not vendor:
            return Response(
                {"error": "Vendor profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if vendor.status != "APPROVED":
            return Response(
                {"error": "Vendor is not approved yet."},
                status=status.HTTP_403_FORBIDDEN,
            )

        cfg = get_auth_config()

        if cfg.enable_vendor_2fa:
            LoginOTP.objects.filter(email=user.username, is_used=False).update(is_used=True)

            otp = LoginOTP.generate_otp()
            expires_at = timezone.now() + timedelta(minutes=cfg.otp_expiry_minutes)

            LoginOTP.objects.create(
                email=user.username,
                otp=otp,
                expires_at=expires_at,
                is_used=False,
            )

            try:
                send_otp_email(user.username, otp)
            except Exception as e:
                return Response(
                    {"error": f"OTP email failed: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            return Response(
                {
                    "message": "OTP sent successfully.",
                    "email": user.username,
                },
                status=status.HTTP_200_OK,
            )

        tokens = get_tokens_for_user(user)
        return Response(
            {
                "message": "Login successful.",
                "tokens": tokens,
                "role": "vendor",
            },
            status=status.HTTP_200_OK,
        )

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([AllowAny])
def verify_otp_api(request):
    serializer = OTPVerifySerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data["email"]
        otp = serializer.validated_data["otp"]

        otp_obj = (
            LoginOTP.objects
            .filter(email=email, otp=otp, is_used=False)
            .order_by("-created_at")
            .first()
        )

        if not otp_obj:
            return Response(
                {"error": "Invalid OTP."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if timezone.now() > otp_obj.expires_at:
            return Response(
                {"error": "OTP expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        otp_obj.is_used = True
        otp_obj.save()

        user = User.objects.filter(username=email).first()
        if not user:
            return Response(
                {"error": "User not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        tokens = get_tokens_for_user(user)
        return Response(
            {
                "message": "OTP verified successfully.",
                "tokens": tokens,
                "role": "vendor",
            },
            status=status.HTTP_200_OK,
        )

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([AllowAny])
def resend_otp_api(request):
    email = request.data.get("email")

    if not email:
        return Response({"error": "Email is required."}, status=400)

    user = User.objects.filter(username=email).first()
    if not user:
        return Response({"error": "User not found."}, status=404)

    cfg = get_auth_config()

    LoginOTP.objects.filter(email=email, is_used=False).update(is_used=True)

    otp = LoginOTP.generate_otp()
    expires_at = timezone.now() + timedelta(minutes=cfg.otp_expiry_minutes)

    LoginOTP.objects.create(
        email=email,
        otp=otp,
        expires_at=expires_at,
        is_used=False,
    )

    try:
        send_otp_email(email, otp, subject="Your Login OTP (Resent)")
    except Exception as e:
        return Response(
            {"error": f"OTP resend failed: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return Response({"message": "OTP resent successfully."}, status=200)


@api_view(["POST"])
@permission_classes([AllowAny])
def forgot_password_api(request):
    serializer = ForgotPasswordSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data["email"]

        user = User.objects.filter(email=email).first()
        if not user:
            return Response(
                {"error": "Email not registered."},
                status=status.HTTP_404_NOT_FOUND,
            )

        LoginOTP.objects.filter(email=email, is_used=False).update(is_used=True)

        otp = str(random.randint(100000, 999999))
        expires_at = timezone.now() + timedelta(minutes=10)

        LoginOTP.objects.create(
            email=email,
            otp=otp,
            expires_at=expires_at,
            is_used=False,
        )

        try:
            send_otp_email(email, otp, subject="Your Password Reset OTP")
        except Exception as e:
            return Response(
                {"error": f"Password reset OTP email failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response({"message": "Password reset OTP sent successfully."}, status=200)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([AllowAny])
def reset_password_api(request):
    serializer = ResetPasswordSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data["email"]
        otp = serializer.validated_data["otp"]
        new_password = serializer.validated_data["new_password"]

        otp_obj = (
            LoginOTP.objects
            .filter(email=email, otp=otp, is_used=False)
            .order_by("-created_at")
            .first()
        )

        if not otp_obj:
            return Response({"error": "Invalid OTP."}, status=400)

        if timezone.now() > otp_obj.expires_at:
            return Response({"error": "OTP expired."}, status=400)

        user = User.objects.filter(email=email).first()
        if not user:
            return Response({"error": "User not found."}, status=404)

        user.set_password(new_password)
        user.save()

        otp_obj.is_used = True
        otp_obj.save()

        return Response({"message": "Password reset successful."}, status=200)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)