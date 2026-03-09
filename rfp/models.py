from django.db import models


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


class LoginOTP(models.Model):

    email = models.EmailField()

    otp = models.CharField(max_length=6)

    created_at = models.DateTimeField(auto_now_add=True)

    expires_at = models.DateTimeField()

    is_used = models.BooleanField(default=False)

    @staticmethod
    def generate_otp():
        import random
        return str(random.randint(100000, 999999))