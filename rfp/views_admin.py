from decimal import Decimal, InvalidOperation

from django.db.models import Count, Q
from django.utils import timezone
from django.utils.dateparse import parse_date

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .models import Category, Vendor, RFP, Quote, ActivityLog, OrganizationAdmin
from .permissions import IsAdminUser
from .serializers import (
    CategorySerializer,
    VendorSerializer,
    RFPSerializer,
    ActivityLogSerializer,
)
from .utils import create_activity_log


# =============================================================================
# HELPER
# =============================================================================

def get_admin_organization(user):
    org_admin = (
        OrganizationAdmin.objects
        .select_related("organization")
        .filter(user=user)
        .first()
    )
    return org_admin.organization if org_admin else None


# =============================================================================
# CATEGORIES
# =============================================================================

@api_view(["GET", "POST"])
@permission_classes([IsAdminUser])
def categories_api(request):
    organization = get_admin_organization(request.user)

    if request.method == "GET":
        categories = Category.objects.filter(
            organization=organization
        ).order_by("-id")
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data)

    # POST — create category
    serializer = CategorySerializer(data=request.data)
    if serializer.is_valid():
        category = serializer.save(organization=organization)

        create_activity_log(
            user=request.user,
            action="CATEGORY_CREATED",
            model_name="Category",
            object_id=category.pk,
            description=f"Category '{category.name}' created.",
            ip_address=request.META.get("REMOTE_ADDR"),
            organization=organization,
        )

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([IsAdminUser])
def category_toggle_api(request, pk):
    organization = get_admin_organization(request.user)
    category     = Category.objects.filter(pk=pk, organization=organization).first()

    if not category:
        return Response(
            {"error": "Category not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == "GET":
        return Response(CategorySerializer(category).data)

    if request.method == "PATCH":
        # Toggle ACTIVE / INACTIVE
        category.status = "INACTIVE" if category.status == "ACTIVE" else "ACTIVE"
        category.save(update_fields=["status"])

        create_activity_log(
            user=request.user,
            action="CATEGORY_STATUS_UPDATED",
            model_name="Category",
            object_id=category.pk,
            description=f"Category status changed to {category.status}.",
            details={"status": category.status},
            ip_address=request.META.get("REMOTE_ADDR"),
            organization=organization,
        )

        return Response({"message": "Category updated successfully.", "status": category.status})

    # DELETE
    category.delete()
    return Response({"message": "Category deleted."}, status=status.HTTP_200_OK)


# =============================================================================
# VENDORS
# =============================================================================

@api_view(["GET"])
@permission_classes([IsAdminUser])
def vendors_api(request):
    organization = get_admin_organization(request.user)

    vendors = Vendor.objects.filter(
        organization=organization
    ).select_related("category").order_by("-id")

    # Optional filter by status
    vendor_status = request.GET.get("status")
    if vendor_status:
        vendors = vendors.filter(status__iexact=vendor_status)

    serializer = VendorSerializer(vendors, many=True)
    return Response(serializer.data)


@api_view(["GET", "PATCH"])
@permission_classes([IsAdminUser])
def vendor_toggle_api(request, pk):
    organization = get_admin_organization(request.user)
    vendor       = Vendor.objects.filter(pk=pk, organization=organization).first()

    if not vendor:
        return Response({"error": "Vendor not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        return Response(VendorSerializer(vendor).data)

    # PATCH — cycle PENDING → APPROVED → REJECTED
    new_status = request.data.get("status")

    if new_status and new_status in [
        Vendor.ApprovalStatus.APPROVED,
        Vendor.ApprovalStatus.REJECTED,
        Vendor.ApprovalStatus.PENDING,
    ]:
        vendor.status = new_status
    else:
        # Default toggle: APPROVED ↔ REJECTED
        vendor.status = (
            "REJECTED" if vendor.status == "APPROVED" else "APPROVED"
        )

    vendor.save(update_fields=["status"])

    action = (
        "VENDOR_APPROVED" if vendor.status == "APPROVED"
        else "VENDOR_REJECTED"
    )

    create_activity_log(
        user=request.user,
        action=action,
        model_name="Vendor",
        object_id=vendor.pk,
        description=f"Vendor status changed to {vendor.status}.",
        details={"status": vendor.status, "vendor_email": vendor.email},
        ip_address=request.META.get("REMOTE_ADDR"),
        organization=organization,
    )

    return Response({"message": "Vendor status updated successfully.", "status": vendor.status})


@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_vendors_by_category_api(request, category_id):
    organization = get_admin_organization(request.user)

    if not organization:
        return Response(
            {"error": "Organization admin not found."},
            status=status.HTTP_403_FORBIDDEN,
        )

    vendors = Vendor.objects.filter(
        category_id=category_id,
        status="APPROVED",
        organization=organization,
    ).order_by("-id")

    serializer = VendorSerializer(vendors, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


# =============================================================================
# RFP
# =============================================================================

@api_view(["GET", "POST"])
@permission_classes([IsAdminUser])
def rfp_api(request):
    organization = get_admin_organization(request.user)

    if request.method == "GET":
        rfps = (
            RFP.objects
            .select_related("category")
            .prefetch_related("assigned_vendors")
            .filter(organization=organization)
            .order_by("-id")
        )
        serializer = RFPSerializer(rfps, many=True)
        return Response(serializer.data)

    # POST — create via serializer (basic)
    serializer = RFPSerializer(data=request.data)
    if serializer.is_valid():
        rfp = serializer.save(organization=organization)

        approved_vendors = Vendor.objects.filter(
            category=rfp.category,
            status="APPROVED",
            organization=organization,
        )
        rfp.assigned_vendors.set(approved_vendors)

        create_activity_log(
            user=request.user,
            action="RFP_CREATED",
            model_name="RFP",
            object_id=rfp.pk,
            description=f"RFP '{rfp.title}' created.",
            details={
                "title":                 rfp.title,
                "category":              rfp.category.name,
                "assigned_vendor_count": approved_vendors.count(),
            },
            ip_address=request.META.get("REMOTE_ADDR"),
            organization=organization,
        )

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAdminUser])
def admin_create_rfp_api(request):
    """
    Detailed RFP creation with full validation, optional explicit vendor list,
    and amount range checks.
    """
    organization = get_admin_organization(request.user)

    if not organization:
        return Response({"error": "Unauthorized."}, status=status.HTTP_403_FORBIDDEN)

    data        = request.data
    category_id = data.get("category")
    title       = data.get("title")
    last_date   = data.get("last_date")
    min_amount  = data.get("min_amount")
    max_amount  = data.get("max_amount")
    vendor_ids  = data.get("assigned_vendors", [])

    if not all([title, category_id, last_date, min_amount, max_amount]):
        return Response(
            {"error": "All fields are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    category = Category.objects.filter(
        id=category_id, status="ACTIVE", organization=organization
    ).first()

    if not category:
        return Response({"error": "Invalid category."}, status=status.HTTP_400_BAD_REQUEST)

    parsed_date = parse_date(last_date)
    if not parsed_date:
        return Response({"error": "Invalid last date format."}, status=status.HTTP_400_BAD_REQUEST)

    if parsed_date <= timezone.localdate():
        return Response(
            {"error": "Last date must be a future date."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        min_val = Decimal(str(min_amount))
        max_val = Decimal(str(max_amount))
    except (InvalidOperation, TypeError, ValueError):
        return Response({"error": "Invalid amount format."}, status=status.HTTP_400_BAD_REQUEST)

    if max_val <= min_val:
        return Response(
            {"error": "Maximum amount must be greater than minimum amount."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    rfp = RFP.objects.create(
        category=category,
        title=title,
        last_date=parsed_date,
        min_amount=min_val,
        max_amount=max_val,
        status="OPEN",
        organization=organization,
    )

    # If vendor_ids were provided, use those; otherwise auto-assign approved vendors
    if vendor_ids:
        valid_vendors = Vendor.objects.filter(
            id__in=vendor_ids,
            category=category,
            status="APPROVED",
            organization=organization,
        )
    else:
        valid_vendors = Vendor.objects.filter(
            category=category,
            status="APPROVED",
            organization=organization,
        )

    rfp.assigned_vendors.set(valid_vendors)

    create_activity_log(
        user=request.user,
        action="RFP_CREATED",
        model_name="RFP",
        object_id=rfp.pk,
        description=f"RFP '{rfp.title}' created.",
        details={
            "title":                 rfp.title,
            "category":              rfp.category.name,
            "assigned_vendor_count": valid_vendors.count(),
        },
        ip_address=request.META.get("REMOTE_ADDR"),
        organization=organization,
    )

    return Response(
        {
            "message":               "RFP created successfully.",
            "rfp_id":                rfp.id,
            "assigned_vendor_count": valid_vendors.count(),
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET", "PATCH"])
@permission_classes([IsAdminUser])
def rfp_toggle_api(request, pk):
    organization = get_admin_organization(request.user)
    rfp          = RFP.objects.filter(pk=pk, organization=organization).first()

    if not rfp:
        return Response({"error": "RFP not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        return Response(RFPSerializer(rfp).data)

    rfp.status = "CLOSED" if rfp.status == "OPEN" else "OPEN"
    rfp.save(update_fields=["status"])

    create_activity_log(
        user=request.user,
        action="RFP_STATUS_UPDATED",
        model_name="RFP",
        object_id=rfp.pk,
        description=f"RFP status changed to {rfp.status}.",
        details={"status": rfp.status, "title": rfp.title},
        ip_address=request.META.get("REMOTE_ADDR"),
        organization=organization,
    )

    return Response({"message": "RFP status updated successfully.", "status": rfp.status})


# =============================================================================
# REPORTS
# =============================================================================

@api_view(["GET"])
@permission_classes([IsAdminUser])
def reports_api(request):
    organization = get_admin_organization(request.user)

    data = {
        "total_categories": Category.objects.filter(organization=organization).count(),
        "total_vendors":    Vendor.objects.filter(organization=organization).count(),
        "approved_vendors": Vendor.objects.filter(organization=organization, status="APPROVED").count(),
        "pending_vendors":  Vendor.objects.filter(organization=organization, status="PENDING").count(),
        "rejected_vendors": Vendor.objects.filter(organization=organization, status="REJECTED").count(),
        "total_rfps":       RFP.objects.filter(organization=organization).count(),
        "open_rfps":        RFP.objects.filter(organization=organization, status="OPEN").count(),
        "closed_rfps":      RFP.objects.filter(organization=organization, status="CLOSED").count(),
        "total_quotes":     Quote.objects.filter(organization=organization).count(),
        "category_wise_vendors": list(
            Category.objects.filter(organization=organization)
            .annotate(total=Count("vendors"))
            .values("id", "name", "total")
        ),
        "category_wise_rfps": list(
            Category.objects.filter(organization=organization)
            .annotate(total=Count("rfps"))
            .values("id", "name", "total")
        ),
    }

    return Response(data)


# =============================================================================
# ACTIVITY LOGS
# =============================================================================

@api_view(["GET"])
@permission_classes([IsAdminUser])
def activity_logs_api(request):
    organization = get_admin_organization(request.user)

    logs = ActivityLog.objects.select_related("user").filter(organization=organization)

    # Filters
    action     = request.GET.get("action")
    model_name = request.GET.get("model_name")
    role       = request.GET.get("role")
    start_date = request.GET.get("start_date")
    end_date   = request.GET.get("end_date")
    search     = request.GET.get("search")

    if action:
        logs = logs.filter(action__iexact=action)
    if model_name:
        logs = logs.filter(model_name__iexact=model_name)
    if role:
        logs = logs.filter(role__iexact=role)
    if start_date:
        logs = logs.filter(timestamp__date__gte=start_date)
    if end_date:
        logs = logs.filter(timestamp__date__lte=end_date)
    if search:
        logs = logs.filter(
            Q(user__username__icontains=search) | Q(description__icontains=search)
        )

    logs = logs.order_by("-timestamp")[:200]

    serializer = ActivityLogSerializer(logs, many=True)

    return Response({
        "count":   len(serializer.data),
        "results": serializer.data,
    })