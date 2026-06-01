from django.db import models
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password, check_password
import random

class Category(models.Model):

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE"
        INACTIVE = "INACTIVE"

    name = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Vendor(models.Model):

    class ApprovalStatus(models.TextChoices):
        PENDING = "PENDING"
        APPROVED = "APPROVED"
        REJECTED = "REJECTED"

    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255, blank=True)

    email = models.EmailField(unique=True)
    contact = models.CharField(max_length=20, unique=True)

    revenue_last_3_years_lakhs = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    employees_count = models.IntegerField(null=True, blank=True)

    gst_no = models.CharField(max_length=50, blank=True)
    pan_no = models.CharField(max_length=50, blank=True)

    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name="vendors")

    status = models.CharField(max_length=20, choices=ApprovalStatus.choices, default=ApprovalStatus.PENDING)
    google_auth_enabled = models.BooleanField(default=False)

    google_auth_secret = models.CharField(
        max_length=64,
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class RFP(models.Model):

    class Status(models.TextChoices):
        OPEN = "OPEN"
        CLOSED = "CLOSED"

    title = models.CharField(max_length=255)

    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="rfps")

    last_date = models.DateField()

    min_amount = models.DecimalField(max_digits=12, decimal_places=2)
    max_amount = models.DecimalField(max_digits=12, decimal_places=2)

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)

    assigned_vendors = models.ManyToManyField(Vendor, related_name="rfps")

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class Quote(models.Model):
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name="quotes")
    rfp = models.ForeignKey(RFP, on_delete=models.CASCADE, related_name="quotes")
    amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    remarks = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.vendor} - {self.rfp}"


class QuoteItem(models.Model):

    quote = models.ForeignKey(Quote, on_delete=models.CASCADE, related_name="items")

    item_name = models.CharField(max_length=255)

    vendor_price = models.DecimalField(max_digits=12, decimal_places=2)

    quantity = models.IntegerField(default=1)

    def __str__(self):
        return self.item_name


class AuthConfig(models.Model):
    enable_vendor_2fa = models.BooleanField(default=True)
    otp_expiry_minutes = models.IntegerField(default=10)

    def __str__(self):
        return "Auth Configuration"


class ActivityLog(models.Model):

    class ActionType(models.TextChoices):
        LOGIN_SUCCESS = "LOGIN_SUCCESS"
        LOGIN_FAILED = "LOGIN_FAILED"
        OTP_SENT = "OTP_SENT"
        OTP_FAILED = "OTP_FAILED"
        PASSWORD_RESET = "PASSWORD_RESET"
        CATEGORY_CREATED = "CATEGORY_CREATED"
        CATEGORY_UPDATED = "CATEGORY_UPDATED"
        VENDOR_APPROVED = "VENDOR_APPROVED"
        VENDOR_REJECTED = "VENDOR_REJECTED"
        RFP_CREATED = "RFP_CREATED"
        RFP_UPDATED = "RFP_UPDATED"

    class Severity(models.TextChoices):
        INFO = "INFO"
        WARNING = "WARNING"
        CRITICAL = "CRITICAL"

    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    user_email = models.EmailField(
        null=True,
        blank=True
    )

    role = models.CharField(
        max_length=30,
        blank=True,
        null=True
    )

    action = models.CharField(
        max_length=100,
        choices=ActionType.choices
    )

    severity = models.CharField(
        max_length=20,
        choices=Severity.choices,
        default=Severity.INFO
    )

    model_name = models.CharField(
        max_length=100
    )

    object_id = models.PositiveIntegerField()
    endpoint = models.CharField(
        max_length=255,
        null=True,
        blank=True
    )

    request_method = models.CharField(
        max_length=10,
        null=True,
        blank=True
    )

    description = models.TextField(
        blank=True,
        null=True
    )

    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True
    )

    details = models.JSONField(
        null=True,
        blank=True
    )

    timestamp = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["timestamp"]),
            models.Index(fields=["action"]),
            models.Index(fields=["model_name"]),
            models.Index(fields=["user"]),
            models.Index(fields=["ip_address"]),
        ]

    def __str__(self):
        return f"{self.action} - {self.model_name}"

class LoginOTP(models.Model):

    class OTPType(models.TextChoices):

        LOGIN = "LOGIN"

        PASSWORD_RESET = "PASSWORD_RESET"

    email = models.EmailField(db_index=True)

    otp = models.CharField(max_length=255)

    otp_type = models.CharField(

        max_length=30,

        choices=OTPType.choices,

        default=OTPType.LOGIN,

    )

    attempts = models.IntegerField(default=0)
    max_attempts = models.IntegerField(default=5)
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)

    class Meta:

        indexes = [

            models.Index(fields=["email"]),

            models.Index(fields=["expires_at"]),

        ]

    def __str__(self):

        return f"{self.email} - {self.otp_type}"

    @staticmethod

    def generate_otp():
        return str(random.randint(100000, 999999))

    @staticmethod

    def hash_otp(otp):
        return make_password(otp)

    def verify_otp(self, raw_otp):
        return check_password(raw_otp, self.otp)