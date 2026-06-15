from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import authenticate

from .models import Category, Vendor, RFP, Quote, QuoteItem, ActivityLog


# =============================================================================
# AUTH
# =============================================================================

class RegisterSerializer(serializers.Serializer):
    first_name       = serializers.CharField(max_length=255)
    last_name        = serializers.CharField(max_length=255, required=False, default="")
    email            = serializers.EmailField()
    phone            = serializers.CharField(max_length=20)
    password         = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    category_id      = serializers.IntegerField()
    revenue          = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, allow_null=True)
    employees        = serializers.IntegerField(required=False, allow_null=True)
    gst_no           = serializers.CharField(max_length=50, required=False, default="")
    pan_no           = serializers.CharField(max_length=50, required=False, default="")

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return attrs


class LoginSerializer(serializers.Serializer):
    email    = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(
            username=attrs["email"].strip().lower(),
            password=attrs["password"],
        )
        if not user:
            raise serializers.ValidationError("Invalid email or password.")
        if not user.is_active:
            raise serializers.ValidationError("This account has been deactivated.")
        attrs["user"] = user
        return attrs


class OTPVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp   = serializers.CharField(max_length=6, min_length=6)


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ResetPasswordSerializer(serializers.Serializer):
    email            = serializers.EmailField()
    otp              = serializers.CharField(max_length=6, min_length=6)
    new_password     = serializers.CharField(min_length=8, write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return attrs


# =============================================================================
# CATEGORY
# =============================================================================

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model  = Category
        fields = ["id", "name", "status", "organization", "created_at"]
        read_only_fields = ["id", "organization", "created_at"]


# =============================================================================
# VENDOR
# =============================================================================

class VendorSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model  = Vendor
        fields = [
            "id",
            "first_name",
            "last_name",
            "email",
            "contact",
            "revenue_last_3_years_lakhs",
            "employees_count",
            "gst_no",
            "pan_no",
            "category",
            "category_name",
            "organization",
            "status",
            "google_auth_enabled",
            "created_at",
        ]
        read_only_fields = ["id", "organization", "status", "created_at"]


# =============================================================================
# RFP
# =============================================================================

class RFPSerializer(serializers.ModelSerializer):
    category_name          = serializers.CharField(source="category.name", read_only=True)
    assigned_vendor_count  = serializers.IntegerField(source="assigned_vendors.count", read_only=True)

    class Meta:
        model  = RFP
        fields = [
            "id",
            "title",
            "category",
            "category_name",
            "last_date",
            "min_amount",
            "max_amount",
            "status",
            "organization",
            "assigned_vendors",
            "assigned_vendor_count",
            "created_at",
        ]
        read_only_fields = ["id", "organization", "status", "assigned_vendors", "created_at"]


# =============================================================================
# QUOTE ITEM
# =============================================================================

class QuoteItemSerializer(serializers.ModelSerializer):
    total_price = serializers.SerializerMethodField()

    class Meta:
        model  = QuoteItem
        fields = ["id", "item_name", "quantity", "vendor_price", "total_price"]
        read_only_fields = ["id"]

    def get_total_price(self, obj):
        return obj.vendor_price * obj.quantity


class QuoteItemWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model  = QuoteItem
        fields = ["item_name", "quantity", "vendor_price"]


# =============================================================================
# QUOTE
# =============================================================================

class QuoteSerializer(serializers.ModelSerializer):
    items        = QuoteItemSerializer(many=True, read_only=True)
    rfp_title    = serializers.CharField(source="rfp.title", read_only=True)
    vendor_name  = serializers.SerializerMethodField()

    class Meta:
        model  = Quote
        fields = [
            "id",
            "rfp",
            "rfp_title",
            "vendor",
            "vendor_name",
            "organization",
            "amount",
            "remarks",
            "created_at",
            "items",
        ]
        read_only_fields = ["id", "vendor", "organization", "created_at"]

    def get_vendor_name(self, obj):
        return obj.vendor.full_name if obj.vendor else ""


# =============================================================================
# ACTIVITY LOG
# =============================================================================

class ActivityLogSerializer(serializers.ModelSerializer):
    user         = serializers.StringRelatedField()
    organization = serializers.StringRelatedField()

    class Meta:
        model  = ActivityLog
        fields = [
            "id",
            "user",
            "user_email",
            "organization",
            "role",
            "action",
            "severity",
            "model_name",
            "object_id",
            "description",
            "ip_address",
            "details",
            "timestamp",
        ]