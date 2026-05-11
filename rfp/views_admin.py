from django.db.models import Count
from django.utils import timezone
from django.utils.dateparse import parse_date
from decimal import Decimal, InvalidOperation

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .models import (
    Category,
    Vendor,
    RFP,
    ActivityLog,
)

from .utils import create_activity_log

from .serializers import (
    CategorySerializer,
    VendorSerializer,
    RFPSerializer,
    ActivityLogSerializer,
)

from .permissions import IsAdminUser


@api_view(["GET", "POST"])
@permission_classes([IsAdminUser])
def categories_api(request):

    if request.method == "GET":

        categories = Category.objects.all().order_by("-id")

        serializer = CategorySerializer(
            categories,
            many=True
        )

        return Response(serializer.data)

    serializer = CategorySerializer(
        data=request.data
    )

    if serializer.is_valid():

        serializer.save()

        create_activity_log(
            user=request.user,

            action="CATEGORY_CREATED",

            model_name="Category",

            object_id=serializer.instance.pk,

            description="Admin created a category",

            ip_address=request.META.get("REMOTE_ADDR"),
        )

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED
        )

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )


@api_view(["PATCH"])
@permission_classes([IsAdminUser])
def category_toggle_api(request, pk):

    category = Category.objects.filter(
        pk=pk
    ).first()

    if not category:

        return Response(
            {"error": "Category not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    category.status = (
        "INACTIVE"
        if category.status == "ACTIVE"
        else "ACTIVE"
    )

    category.save()

    create_activity_log(
        user=request.user,

        action="CATEGORY_STATUS_UPDATED",

        model_name="Category",

        object_id=category.pk,

        description=f"Category status changed to {category.status}",

        details={
            "status": category.status
        },

        ip_address=request.META.get("REMOTE_ADDR"),
    )

    return Response({
        "message": "Category updated successfully."
    })


@api_view(["GET"])
@permission_classes([IsAdminUser])
def vendors_api(request):

    vendors = Vendor.objects.all().order_by("-id")

    serializer = VendorSerializer(
        vendors,
        many=True
    )

    return Response(serializer.data)


@api_view(["PATCH"])
@permission_classes([IsAdminUser])
def vendor_toggle_api(request, pk):

    vendor = Vendor.objects.filter(
        pk=pk
    ).first()

    if not vendor:

        return Response(
            {"error": "Vendor not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    vendor.status = (
        "REJECTED"
        if vendor.status == "APPROVED"
        else "APPROVED"
    )

    vendor.save()

    create_activity_log(
        user=request.user,

        action="VENDOR_STATUS_UPDATED",

        model_name="Vendor",

        object_id=vendor.pk,

        description=f"Vendor status changed to {vendor.status}",

        details={
            "status": vendor.status,
            "vendor_email": vendor.email,
        },

        ip_address=request.META.get("REMOTE_ADDR"),
    )

    return Response({
        "message": "Vendor status updated successfully."
    })


@api_view(["GET", "POST"])
@permission_classes([IsAdminUser])
def rfp_api(request):

    if request.method == "GET":

        rfps = (
            RFP.objects
            .select_related("category")
            .prefetch_related("assigned_vendors")
            .all()
            .order_by("-id")
        )

        serializer = RFPSerializer(
            rfps,
            many=True
        )

        return Response(serializer.data)

    serializer = RFPSerializer(
        data=request.data
    )

    if serializer.is_valid():

        rfp = serializer.save()

        approved_vendors = Vendor.objects.filter(
            category=rfp.category,
            status="APPROVED"
        )

        rfp.assigned_vendors.set(
            approved_vendors
        )

        create_activity_log(
            user=request.user,

            action="RFP_CREATED",

            model_name="RFP",

            object_id=rfp.pk,

            description="Admin created a new RFP",

            details={
                "title": rfp.title,
                "category": rfp.category.name,
                "assigned_vendor_count": approved_vendors.count(),
            },

            ip_address=request.META.get("REMOTE_ADDR"),
        )

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED
        )

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )


@api_view(["PATCH"])
@permission_classes([IsAdminUser])
def rfp_toggle_api(request, pk):

    rfp = RFP.objects.filter(
        pk=pk
    ).first()

    if not rfp:

        return Response(
            {"error": "RFP not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    rfp.status = (
        "CLOSED"
        if rfp.status == "OPEN"
        else "OPEN"
    )

    rfp.save()

    create_activity_log(
        user=request.user,

        action="RFP_STATUS_UPDATED",

        model_name="RFP",

        object_id=rfp.pk,

        description=f"RFP status changed to {rfp.status}",

        details={
            "status": rfp.status,
            "title": rfp.title,
        },

        ip_address=request.META.get("REMOTE_ADDR"),
    )

    return Response({
        "message": "RFP status updated successfully."
    })


@api_view(["GET"])
@permission_classes([IsAdminUser])
def reports_api(request):

    data = {

        "total_categories": Category.objects.count(),

        "total_vendors": Vendor.objects.count(),

        "approved_vendors": Vendor.objects.filter(
            status="APPROVED"
        ).count(),

        "pending_vendors": Vendor.objects.filter(
            status="PENDING"
        ).count(),

        "rejected_vendors": Vendor.objects.filter(
            status="REJECTED"
        ).count(),

        "total_rfps": RFP.objects.count(),

        "open_rfps": RFP.objects.filter(
            status="OPEN"
        ).count(),

        "closed_rfps": RFP.objects.filter(
            status="CLOSED"
        ).count(),

        "category_wise_vendors": list(
            Category.objects.annotate(
                total=Count("vendors")
            ).values(
                "id",
                "name",
                "total"
            )
        ),

        "category_wise_rfps": list(
            Category.objects.annotate(
                total=Count("rfps")
            ).values(
                "id",
                "name",
                "total"
            )
        ),
    }

    return Response(data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_vendors_by_category_api(
    request,
    category_id
):

    if (
        not request.user.is_staff
        and
        not request.user.is_superuser
    ):

        return Response(
            {"error": "Unauthorized"},
            status=status.HTTP_403_FORBIDDEN,
        )

    vendors = Vendor.objects.filter(
        category_id=category_id,
        status="APPROVED"
    ).order_by("-id")

    serializer = VendorSerializer(
        vendors,
        many=True
    )

    return Response(
        serializer.data,
        status=status.HTTP_200_OK
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def admin_create_rfp_api(request):

    if (
        not request.user.is_staff
        and
        not request.user.is_superuser
    ):

        return Response(
            {"error": "Unauthorized"},
            status=status.HTTP_403_FORBIDDEN,
        )

    data = request.data

    category_id = data.get("category")

    title = data.get("title")

    last_date = data.get("last_date")

    min_amount = data.get("min_amount")

    max_amount = data.get("max_amount")

    vendor_ids = data.get(
        "assigned_vendors",
        []
    )

    if (
        not title
        or
        not category_id
        or
        not last_date
        or
        not min_amount
        or
        not max_amount
    ):

        return Response(
            {"error": "All fields are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    category = Category.objects.filter(
        id=category_id,
        status="ACTIVE"
    ).first()

    if not category:

        return Response(
            {"error": "Invalid category."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    parsed_date = parse_date(last_date)

    if not parsed_date:

        return Response(
            {"error": "Invalid last date format."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:

        min_amount_value = Decimal(
            str(min_amount)
        )

        max_amount_value = Decimal(
            str(max_amount)
        )

    except (
        InvalidOperation,
        TypeError,
        ValueError
    ):

        return Response(
            {"error": "Invalid amount format."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if max_amount_value <= min_amount_value:

        return Response(
            {
                "error":
                "Maximum amount must be greater than minimum amount."
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if parsed_date <= timezone.localdate():

        return Response(
            {
                "error":
                "Last date must be a future date."
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    rfp = RFP.objects.create(
        category=category,

        title=title,

        last_date=parsed_date,

        min_amount=min_amount_value,

        max_amount=max_amount_value,

        status="OPEN",
    )

    valid_vendors = Vendor.objects.filter(
        id__in=vendor_ids,

        category=category,

        status="APPROVED",
    )

    rfp.assigned_vendors.set(
        valid_vendors
    )

    create_activity_log(
        user=request.user,

        action="RFP_CREATED",

        model_name="RFP",

        object_id=rfp.pk,

        description="Admin created a new RFP",

        details={
            "title": rfp.title,
            "category": rfp.category.name,
            "assigned_vendor_count": valid_vendors.count(),
        },

        ip_address=request.META.get("REMOTE_ADDR"),
    )

    return Response(
        {
            "message": "RFP created successfully.",

            "rfp_id": rfp.id,

            "assigned_vendor_count": valid_vendors.count(),
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
@permission_classes([IsAdminUser])
def activity_logs_api(request):

    logs = ActivityLog.objects.select_related(
        "user"
    ).all()

    action = request.GET.get("action")

    model_name = request.GET.get("model_name")

    role = request.GET.get("role")

    start_date = request.GET.get("start_date")

    end_date = request.GET.get("end_date")

    search = request.GET.get("search")

    # FILTER BY ACTION
    if action:
        logs = logs.filter(
            action__iexact=action
        )

    # FILTER BY MODEL
    if model_name:
        logs = logs.filter(
            model_name__iexact=model_name
        )

    # FILTER BY ROLE
    if role:
        logs = logs.filter(
            role__iexact=role
        )

    # FILTER BY DATE RANGE
    if start_date:
        logs = logs.filter(
            timestamp__date__gte=start_date
        )

    if end_date:
        logs = logs.filter(
            timestamp__date__lte=end_date
        )

    # SEARCH BY USERNAME / DESCRIPTION
    if search:
        logs = logs.filter(
            user__username__icontains=search
        ) | logs.filter(
            description__icontains=search
        )

    logs = logs.order_by(
        "-timestamp"
    )[:200]

    serializer = ActivityLogSerializer(
        logs,
        many=True
    )

    return Response({
        "count": logs.count(),
        "results": serializer.data
    })