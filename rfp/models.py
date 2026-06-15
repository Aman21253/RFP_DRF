from django.db import models
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password, check_password
import random


# =============================================================================
# ORGANIZATION
# =============================================================================

class Organization(models.Model):
    name = models.CharField(max_length=255)

    slug = models.SlugField(
        unique=True,
        db_index=True,
    )

    email = models.EmailField()

    phone = models.CharField(
        max_length=20,
        blank=True,
        null=True,
    )

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


# =============================================================================
# ORGANIZATION ADMIN  (1-to-1: one Django User is the admin of one Org)
# =============================================================================

class OrganizationAdmin(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="organization_admin",
    )

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="admins",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} - {self.organization.name}"


# =============================================================================
# AUTH CONFIG  (1-to-1 extension of Organization for 2FA settings)
# =============================================================================

class AuthConfig(models.Model):
    organization = models.OneToOneField(
        Organization,
        on_delete=models.CASCADE,
        related_name="auth_config",
    )

    enable_vendor_2fa = models.BooleanField(default=True)

    otp_expiry_minutes = models.PositiveSmallIntegerField(default=10)

    def __str__(self):
        return f"Auth Config - {self.organization.name}"


# =============================================================================
# CATEGORY
# =============================================================================

class Category(models.Model):

    class Status(models.TextChoices):
        ACTIVE   = "ACTIVE",   "Active"
        INACTIVE = "INACTIVE", "Inactive"

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="categories",
    )

    name = models.CharField(max_length=255)

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("organization", "name")

    def __str__(self):
        return self.name


# =============================================================================
# VENDOR
# =============================================================================

class Vendor(models.Model):

    class ApprovalStatus(models.TextChoices):
        PENDING  = "PENDING",  "Pending"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="vendors",
    )

    first_name = models.CharField(max_length=255)

    last_name = models.CharField(
        max_length=255,
        blank=True,
    )

    email = models.EmailField(unique=True)

    contact = models.CharField(
        max_length=20,
        unique=True,
    )

    revenue_last_3_years_lakhs = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
    )

    employees_count = models.IntegerField(
        null=True,
        blank=True,
    )

    gst_no = models.CharField(max_length=50, blank=True)
    pan_no = models.CharField(max_length=50, blank=True)

    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        related_name="vendors",
    )

    status = models.CharField(
        max_length=20,
        choices=ApprovalStatus.choices,
        default=ApprovalStatus.PENDING,
    )

    # Google Authenticator (TOTP)
    google_auth_enabled = models.BooleanField(default=False)
    google_auth_secret = models.CharField(
        max_length=64,
        blank=True,
        null=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()


# =============================================================================
# RFP  (Request for Proposal)
# =============================================================================

class RFP(models.Model):

    class Status(models.TextChoices):
        OPEN   = "OPEN",   "Open"
        CLOSED = "CLOSED", "Closed"

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="rfps",
    )

    title = models.CharField(max_length=255)

    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name="rfps",
    )

    last_date = models.DateField()

    min_amount = models.DecimalField(max_digits=12, decimal_places=2)
    max_amount = models.DecimalField(max_digits=12, decimal_places=2)

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.OPEN,
    )

    assigned_vendors = models.ManyToManyField(
        Vendor,
        related_name="rfps",
        blank=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


# =============================================================================
# QUOTE
# =============================================================================

class Quote(models.Model):
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="quotes",
    )

    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.CASCADE,
        related_name="quotes",
    )

    rfp = models.ForeignKey(
        RFP,
        on_delete=models.CASCADE,
        related_name="quotes",
    )

    amount = models.DecimalField(max_digits=12, decimal_places=2)

    remarks = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("vendor", "rfp")

    def __str__(self):
        return f"{self.vendor} - {self.rfp}"


# =============================================================================
# QUOTE ITEM
# =============================================================================

class QuoteItem(models.Model):
    quote = models.ForeignKey(
        Quote,
        on_delete=models.CASCADE,
        related_name="items",
    )

    item_name    = models.CharField(max_length=255)
    vendor_price = models.DecimalField(max_digits=12, decimal_places=2)
    quantity     = models.IntegerField(default=1)

    def __str__(self):
        return self.item_name

    @property
    def total_price(self):
        return self.vendor_price * self.quantity


# =============================================================================
# ACTIVITY LOG
# =============================================================================

class ActivityLog(models.Model):

    class ActionType(models.TextChoices):
        # Auth
        LOGIN_SUCCESS            = "LOGIN_SUCCESS"
        LOGIN_FAILED             = "LOGIN_FAILED"
        ADMIN_LOGIN              = "ADMIN_LOGIN"
        LOGIN_OTP_SENT           = "LOGIN_OTP_SENT"
        LOGIN_OTP_RESENT         = "LOGIN_OTP_RESENT"
        OTP_SENT                 = "OTP_SENT"
        OTP_FAILED               = "OTP_FAILED"
        PASSWORD_RESET           = "PASSWORD_RESET"
        PASSWORD_RESET_OTP_SENT  = "PASSWORD_RESET_OTP_SENT"
        PASSWORD_RESET_SUCCESS   = "PASSWORD_RESET_SUCCESS"
        # Registration
        REGISTER_VENDOR          = "REGISTER_VENDOR"
        REGISTER_ORGANIZATION    = "REGISTER_ORGANIZATION"
        # Categories
        CATEGORY_CREATED         = "CATEGORY_CREATED"
        CATEGORY_UPDATED         = "CATEGORY_UPDATED"
        CATEGORY_STATUS_UPDATED  = "CATEGORY_STATUS_UPDATED"
        # Vendors
        VENDOR_APPROVED          = "VENDOR_APPROVED"
        VENDOR_REJECTED          = "VENDOR_REJECTED"
        VENDOR_STATUS_UPDATED    = "VENDOR_STATUS_UPDATED"
        # RFP
        RFP_CREATED              = "RFP_CREATED"
        RFP_UPDATED              = "RFP_UPDATED"
        RFP_STATUS_UPDATED       = "RFP_STATUS_UPDATED"

    class Severity(models.TextChoices):
        INFO     = "INFO"
        WARNING  = "WARNING"
        CRITICAL = "CRITICAL"

    organization = models.ForeignKey(
        Organization,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    user_email = models.EmailField(null=True, blank=True)

    role = models.CharField(max_length=30, blank=True, null=True)

    action = models.CharField(
        max_length=100,
        choices=ActionType.choices,
    )

    severity = models.CharField(
        max_length=20,
        choices=Severity.choices,
        default=Severity.INFO,
    )

    model_name = models.CharField(max_length=100)
    object_id = models.PositiveIntegerField()
    endpoint = models.CharField(max_length=255, null=True, blank=True)
    request_method = models.CharField(max_length=10, null=True, blank=True)
    description = models.TextField(blank=True, null=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    details = models.JSONField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

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


# =============================================================================
# LOGIN OTP
# =============================================================================

class LoginOTP(models.Model):

    class OTPType(models.TextChoices):
        LOGIN          = "LOGIN",          "Login"
        PASSWORD_RESET = "PASSWORD_RESET", "Password Reset"

    email = models.EmailField(db_index=True)

    otp = models.CharField(max_length=255)

    otp_type = models.CharField(
        max_length=30,
        choices=OTPType.choices,
        default=OTPType.LOGIN,
    )

    attempts = models.PositiveSmallIntegerField(default=0)
    max_attempts = models.PositiveSmallIntegerField(default=5)

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

    # ------------------------------------------------------------------
    # Static helpers
    # ------------------------------------------------------------------

    @staticmethod
    def generate_otp():
        """Return a 6-digit numeric OTP string."""
        return str(random.randint(100000, 999999))

    @staticmethod
    def hash_otp(otp):
        """Hash the raw OTP using Django's password hasher."""
        return make_password(otp)

    def verify_otp(self, raw_otp):
        """Verify a candidate OTP against the stored hash."""
        return check_password(raw_otp, self.otp)