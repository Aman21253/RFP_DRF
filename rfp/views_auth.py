from datetime import timedelta
import pyotp
import qrcode
import base64
from io import BytesIO

from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from django.db import transaction

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from rest_framework_simplejwt.tokens import RefreshToken

from .utils import create_activity_log
from .models import (
    Vendor,
    AuthConfig,
    LoginOTP,
    Category,
    Organization,
    OrganizationAdmin,
)
from .serializers import (
    LoginSerializer,
    OTPVerifySerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
)


# =============================================================================
# HELPERS
# =============================================================================

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access":  str(refresh.access_token),
    }


def get_auth_config(organization):
    """Fetch (or lazily create) the AuthConfig for an organisation."""
    cfg, _ = AuthConfig.objects.get_or_create(
        organization=organization,
        defaults={
            "enable_vendor_2fa":  True,
            "otp_expiry_minutes": 10,
        },
    )
    return cfg


def send_otp_email(email, otp, subject="Your Login OTP"):
    send_mail(
        subject=subject,
        message=f"Your OTP is: {otp}\n\nDo not share this with anyone.",
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=False,
    )


# =============================================================================
# VENDOR REGISTRATION
# =============================================================================

@api_view(["POST"])
@permission_classes([AllowAny])
def register_api(request):
    data             = request.data
    email            = (data.get("email") or "").strip().lower()
    password         = data.get("password")
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
    category    = Category.objects.filter(id=category_id, status="ACTIVE").first()

    if not category:
        return Response(
            {"error": "Please select a valid category."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        with transaction.atomic():
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
            organization=category.organization,
            status="PENDING",
        )

        create_activity_log(
            user=user,
            action="REGISTER_VENDOR",
            model_name="Vendor",
            object_id=vendor.id,
            description="New vendor registered — awaiting approval.",
            details={"email": vendor.email},
            ip_address=request.META.get("REMOTE_ADDR"),
            organization=vendor.organization,
        )

        return Response(
            {
                "message": "Vendor registered successfully. Wait for admin approval.",
                "vendor": {
                    "id":     vendor.id,
                    "email":  vendor.email,
                    "status": vendor.status,
                },
            },
            status=status.HTTP_201_CREATED,
        )

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# =============================================================================
# ORGANIZATION REGISTRATION
# =============================================================================

@api_view(["POST"])
@permission_classes([AllowAny])
def organization_register_api(request):
    company_name  = request.data.get("company_name",  "").strip()
    company_email = request.data.get("company_email", "").strip().lower()
    company_phone = request.data.get("company_phone", "").strip()
    admin_email   = request.data.get("admin_email",   "").strip().lower()
    password      = request.data.get("password")
    confirm_password = request.data.get("confirm_password")

    if not company_name:
        return Response(
            {"error": "Company name is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if password != confirm_password:
        return Response(
            {"error": "Passwords do not match."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if User.objects.filter(username=admin_email).exists():
        return Response(
            {"error": "Admin email already exists."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    slug = company_name.lower().replace(" ", "-")

    if Organization.objects.filter(slug=slug).exists():
        return Response(
            {"error": "Organization already exists."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    with transaction.atomic():
        organization = Organization.objects.create(
            name=company_name,
            slug=slug,
            email=company_email,
            phone=company_phone,
            is_active=True,
        )
    
        admin_user = User.objects.create_user(
            username=admin_email,
            email=admin_email,
            password=password,
            is_staff=True,
        )
    
        OrganizationAdmin.objects.create(
            user=admin_user,
            organization=organization,
        )
    
        AuthConfig.objects.create(
            organization=organization,
            enable_vendor_2fa=True,
            otp_expiry_minutes=10,
        )

    create_activity_log(
        user=admin_user,
        action="REGISTER_ORGANIZATION",
        model_name="Organization",
        object_id=organization.id,
        description="New organisation registered.",
        details={"organization": organization.name},
        ip_address=request.META.get("REMOTE_ADDR"),
        organization=organization,
    )

    return Response(
        {
            "message":           "Organization created successfully.",
            "organization_id":   organization.id,
            "organization_name": organization.name,
        },
        status=status.HTTP_201_CREATED,
    )


# =============================================================================
# PUBLIC CATEGORIES
# =============================================================================

@api_view(["GET"])
@permission_classes([AllowAny])
def public_categories_api(request):
    organization_slug = request.GET.get("organization")

    if not organization_slug:
        return Response(
            {"error": "Organization slug is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    categories = Category.objects.filter(
        status="ACTIVE",
        organization__slug=organization_slug,
    ).values("id", "name")

    return Response(list(categories), status=status.HTTP_200_OK)


# =============================================================================
# LOGIN
# =============================================================================

@api_view(["POST"])
@permission_classes([AllowAny])
def login_api(request):
    serializer = LoginSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    user = serializer.validated_data["user"]

    # ── Admin login ───────────────────────────────────────────────────────────
    if user.is_staff or user.is_superuser:
        tokens    = get_tokens_for_user(user)
        org_admin = OrganizationAdmin.objects.filter(
            user=user
        ).select_related("organization").first()

        create_activity_log(
            user=user,
            action="ADMIN_LOGIN",
            model_name="User",
            object_id=user.id,
            ip_address=request.META.get("REMOTE_ADDR"),
            organization=org_admin.organization if org_admin else None,
        )

        return Response(
            {
                "message":      "Admin login successful.",
                "tokens":       tokens,
                "role":         "admin",
                "organization": {
                    "id":   org_admin.organization.id,
                    "name": org_admin.organization.name,
                    "slug": org_admin.organization.slug,
                } if org_admin else None,
            },
            status=status.HTTP_200_OK,
        )

    # ── Vendor login ──────────────────────────────────────────────────────────
    vendor = Vendor.objects.filter(email=user.username).select_related("organization").first()

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

    # Google Authenticator flow — skip email OTP
    if vendor.google_auth_enabled and vendor.google_auth_secret:
        return Response(
            {
                "message":              "Google Authenticator required.",
                "requires_google_auth": True,
                "email":                user.username,
            },
            status=status.HTTP_200_OK,
        )

    cfg = get_auth_config(vendor.organization)

    # Email OTP 2FA
    if cfg.enable_vendor_2fa:
        LoginOTP.objects.filter(email=user.username, is_used=False).update(is_used=True)

        otp        = LoginOTP.generate_otp()
        hashed_otp = LoginOTP.hash_otp(otp)
        expires_at = timezone.now() + timedelta(minutes=cfg.otp_expiry_minutes)

        otp_obj = LoginOTP.objects.create(
            email=user.username,
            otp=hashed_otp,
            otp_type=LoginOTP.OTPType.LOGIN,
            expires_at=expires_at,
            is_used=False,
            ip_address=request.META.get("REMOTE_ADDR"),
            user_agent=request.META.get("HTTP_USER_AGENT"),
        )

        create_activity_log(
            user=user,
            action="LOGIN_OTP_SENT",
            model_name="LoginOTP",
            object_id=otp_obj.id,
            details={"email": user.username},
            ip_address=request.META.get("REMOTE_ADDR"),
            organization=vendor.organization,
        )

        try:
            send_otp_email(user.username, otp)
        except Exception as e:
            return Response(
                {"error": f"OTP email failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {"message": "OTP sent successfully.", "email": user.username},
            status=status.HTTP_200_OK,
        )

    # No 2FA — direct JWT
    tokens = get_tokens_for_user(user)
    create_activity_log(
        user=user,
        action="LOGIN_SUCCESS",
        model_name="User",
        object_id=user.id,
        ip_address=request.META.get("REMOTE_ADDR"),
        organization=vendor.organization,
    )
    return Response(
        {"message": "Login successful.", "tokens": tokens, "role": "vendor"},
        status=status.HTTP_200_OK,
    )


# =============================================================================
# VERIFY OTP
# =============================================================================

@api_view(["POST"])
@permission_classes([AllowAny])
def verify_otp_api(request):
    serializer = OTPVerifySerializer(data=request.data)

    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    email = serializer.validated_data["email"]
    otp   = serializer.validated_data["otp"]

    otp_obj = (
        LoginOTP.objects
        .filter(email=email, otp_type=LoginOTP.OTPType.LOGIN, is_used=False)
        .order_by("-created_at")
        .first()
    )

    if not otp_obj:
        return Response({"error": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)

    if timezone.now() > otp_obj.expires_at:
        return Response({"error": "OTP expired."}, status=status.HTTP_400_BAD_REQUEST)

    if otp_obj.attempts >= otp_obj.max_attempts:
        return Response(
            {"error": "Maximum OTP attempts exceeded."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not otp_obj.verify_otp(otp):
        otp_obj.attempts += 1
        otp_obj.save(update_fields=["attempts"])
        return Response({"error": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)

    otp_obj.is_used = True
    otp_obj.save(update_fields=["is_used"])

    user = User.objects.filter(username=email).first()

    if not user:
        return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

    vendor = Vendor.objects.filter(email=email).select_related("organization").first()

    create_activity_log(
        user=user,
        action="LOGIN_SUCCESS",
        model_name="User",
        object_id=user.id,
        details={"email": email},
        ip_address=request.META.get("REMOTE_ADDR"),
        organization=vendor.organization if vendor else None,
    )

    tokens = get_tokens_for_user(user)
    return Response(
        {"message": "OTP verified successfully.", "tokens": tokens, "role": "vendor"},
        status=status.HTTP_200_OK,
    )


# =============================================================================
# RESEND OTP
# =============================================================================

@api_view(["POST"])
@permission_classes([AllowAny])
def resend_otp_api(request):
    email = (request.data.get("email") or "").strip().lower()

    if not email:
        return Response({"error": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.filter(username=email).first()
    if not user:
        return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

    vendor = Vendor.objects.filter(email=email).select_related("organization").first()
    if not vendor:
        return Response(
            {"error": "Vendor profile not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    cfg = get_auth_config(vendor.organization)

    LoginOTP.objects.filter(email=email, is_used=False).update(is_used=True)

    otp        = LoginOTP.generate_otp()
    hashed_otp = LoginOTP.hash_otp(otp)
    expires_at = timezone.now() + timedelta(minutes=cfg.otp_expiry_minutes)

    otp_obj = LoginOTP.objects.create(
        email=email,
        otp=hashed_otp,
        otp_type=LoginOTP.OTPType.LOGIN,
        expires_at=expires_at,
        is_used=False,
        ip_address=request.META.get("REMOTE_ADDR"),
        user_agent=request.META.get("HTTP_USER_AGENT"),
    )

    create_activity_log(
        user=user,
        action="LOGIN_OTP_RESENT",
        model_name="LoginOTP",
        object_id=otp_obj.id,
        details={"email": email},
        ip_address=request.META.get("REMOTE_ADDR"),
        organization=vendor.organization,
    )

    try:
        send_otp_email(email, otp, subject="Your Login OTP (Resent)")
    except Exception as e:
        return Response(
            {"error": f"OTP resend failed: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return Response({"message": "OTP resent successfully."}, status=status.HTTP_200_OK)


# =============================================================================
# FORGOT PASSWORD
# =============================================================================

@api_view(["POST"])
@permission_classes([AllowAny])
def forgot_password_api(request):
    serializer = ForgotPasswordSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    email = serializer.validated_data["email"]
    user  = User.objects.filter(email=email).first()

    if not user:
        return Response({"error": "Email not registered."}, status=status.HTTP_404_NOT_FOUND)

    LoginOTP.objects.filter(email=email, is_used=False).update(is_used=True)

    vendor = Vendor.objects.filter(email=email).select_related("organization").first()

    if vendor and vendor.organization:
        cfg             = get_auth_config(vendor.organization)
        expiry_minutes  = cfg.otp_expiry_minutes
        organization    = vendor.organization
    else:
        expiry_minutes  = 10
        organization    = None

    otp        = LoginOTP.generate_otp()
    hashed_otp = LoginOTP.hash_otp(otp)
    expires_at = timezone.now() + timedelta(minutes=expiry_minutes)

    otp_obj = LoginOTP.objects.create(
        email=email,
        otp=hashed_otp,
        otp_type=LoginOTP.OTPType.PASSWORD_RESET,
        expires_at=expires_at,
        is_used=False,
        ip_address=request.META.get("REMOTE_ADDR"),
        user_agent=request.META.get("HTTP_USER_AGENT"),
    )

    create_activity_log(
        user=user,
        action="PASSWORD_RESET_OTP_SENT",
        model_name="LoginOTP",
        object_id=otp_obj.id,
        details={"email": email},
        ip_address=request.META.get("REMOTE_ADDR"),
        organization=organization,
    )

    try:
        send_otp_email(email, otp, subject="Your Password Reset OTP")
    except Exception as e:
        return Response(
            {"error": f"Password reset OTP email failed: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return Response({"message": "Password reset OTP sent successfully."}, status=status.HTTP_200_OK)


# =============================================================================
# RESET PASSWORD
# =============================================================================

@api_view(["POST"])
@permission_classes([AllowAny])
def reset_password_api(request):
    serializer = ResetPasswordSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    email        = serializer.validated_data["email"]
    otp          = serializer.validated_data["otp"]
    new_password = serializer.validated_data["new_password"]

    otp_obj = (
        LoginOTP.objects
        .filter(email=email, otp_type=LoginOTP.OTPType.PASSWORD_RESET, is_used=False)
        .order_by("-created_at")
        .first()
    )

    if not otp_obj:
        return Response({"error": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)

    if timezone.now() > otp_obj.expires_at:
        return Response({"error": "OTP expired."}, status=status.HTTP_400_BAD_REQUEST)

    if not otp_obj.verify_otp(otp):
        return Response({"error": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.filter(email=email).first()
    if not user:
        return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

    user.set_password(new_password)
    user.save()

    otp_obj.is_used = True
    otp_obj.save(update_fields=["is_used"])

    create_activity_log(
        user=user,
        action="PASSWORD_RESET_SUCCESS",
        model_name="User",
        object_id=user.id,
        details={"email": email},
        ip_address=request.META.get("REMOTE_ADDR"),
    )

    return Response({"message": "Password reset successful."}, status=status.HTTP_200_OK)


# =============================================================================
# SETUP GOOGLE AUTHENTICATOR
# =============================================================================

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def setup_google_auth_api(request):
    user   = request.user
    vendor = Vendor.objects.filter(email=user.username).first()

    if not vendor:
        return Response({"error": "Vendor not found."}, status=status.HTTP_404_NOT_FOUND)

    secret   = pyotp.random_base32()
    totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
        name=vendor.email,
        issuer_name=getattr(settings, "APP_NAME", "RFP_SaaS"),
    )

    qr     = qrcode.make(totp_uri)
    buffer = BytesIO()
    qr.save(buffer, format="PNG")
    qr_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

    # Save secret (not yet active — vendor must verify first)
    vendor.google_auth_secret = secret
    vendor.save(update_fields=["google_auth_secret"])

    return Response(
        {
            "message":  "Scan the QR code in Google Authenticator, then verify with a code.",
            "qr_code":  f"data:image/png;base64,{qr_base64}",
            "secret":   secret,
        },
        status=status.HTTP_200_OK,
    )


# =============================================================================
# VERIFY GOOGLE AUTHENTICATOR SETUP
# =============================================================================

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def verify_google_auth_api(request):
    user      = request.user
    totp_code = request.data.get("totp_code", "").strip()

    if not totp_code:
        return Response({"error": "TOTP code is required."}, status=status.HTTP_400_BAD_REQUEST)

    vendor = Vendor.objects.filter(email=user.username).first()
    if not vendor:
        return Response({"error": "Vendor not found."}, status=status.HTTP_404_NOT_FOUND)

    if not vendor.google_auth_secret:
        return Response(
            {"error": "Please call setup-google-auth first."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    totp = pyotp.TOTP(vendor.google_auth_secret)

    if not totp.verify(totp_code, valid_window=1):
        return Response(
            {"error": "Invalid TOTP code. Please try again."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    vendor.google_auth_enabled = True
    vendor.save(update_fields=["google_auth_enabled"])

    create_activity_log(
        user=user,
        action="LOGIN_SUCCESS",
        model_name="Vendor",
        object_id=vendor.id,
        description="Google Authenticator setup completed.",
        details={"email": vendor.email},
        ip_address=request.META.get("REMOTE_ADDR"),
        organization=vendor.organization,
    )

    return Response(
        {"message": "Google Authenticator enabled successfully. Use it on your next login."},
        status=status.HTTP_200_OK,
    )


# =============================================================================
# GOOGLE LOGIN VERIFY  (mid-login, no JWT yet)
# =============================================================================

@api_view(["POST"])
@permission_classes([AllowAny])
def google_login_verify_api(request):
    email     = (request.data.get("email")      or "").strip().lower()
    totp_code = (request.data.get("totp_code")  or "").strip()

    if not email or not totp_code:
        return Response(
            {"error": "Email and TOTP code are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    vendor = Vendor.objects.filter(email=email).select_related("organization").first()
    if not vendor:
        return Response({"error": "Vendor not found."}, status=status.HTTP_404_NOT_FOUND)

    if not vendor.google_auth_enabled or not vendor.google_auth_secret:
        return Response(
            {"error": "Google Authenticator is not enabled for this account."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    totp = pyotp.TOTP(vendor.google_auth_secret)

    if not totp.verify(totp_code, valid_window=1):
        create_activity_log(
            user=None,
            action="LOGIN_FAILED",
            model_name="Vendor",
            object_id=vendor.id,
            details={"reason": "invalid_totp", "email": email},
            ip_address=request.META.get("REMOTE_ADDR"),
            organization=vendor.organization,
        )
        return Response({"error": "Invalid TOTP code."}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.filter(username=email).first()
    if not user:
        return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

    tokens = get_tokens_for_user(user)

    create_activity_log(
        user=user,
        action="LOGIN_SUCCESS",
        model_name="User",
        object_id=user.id,
        details={"method": "google_authenticator", "email": email},
        ip_address=request.META.get("REMOTE_ADDR"),
        organization=vendor.organization,
    )

    return Response(
        {
            "message": "Google Authenticator login successful.",
            "tokens":  tokens,
            "role":    "vendor",
        },
        status=status.HTTP_200_OK,
    )