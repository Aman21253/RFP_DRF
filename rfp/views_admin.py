from django.db.models import Count
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .models import Category, Vendor, RFP
from .serializers import CategorySerializer, VendorSerializer, RFPSerializer
from .permissions import IsAdminUser


@api_view(["GET", "POST"])
@permission_classes([IsAdminUser])
def categories_api(request):
    if request.method == "GET":
        categories = Category.objects.all().order_by("-id")
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data)

    serializer = CategorySerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["PATCH"])
@permission_classes([IsAdminUser])
def category_toggle_api(request, pk):
    category = Category.objects.filter(pk=pk).first()
    if not category:
        return Response(
            {"error": "Category not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    category.status = "INACTIVE" if category.status == "ACTIVE" else "ACTIVE"
    category.save()

    return Response({"message": "Category updated successfully."})


@api_view(["GET"])
@permission_classes([IsAdminUser])
def vendors_api(request):
    vendors = Vendor.objects.all().order_by("-id")
    serializer = VendorSerializer(vendors, many=True)
    return Response(serializer.data)


@api_view(["PATCH"])
@permission_classes([IsAdminUser])
def vendor_toggle_api(request, pk):
    vendor = Vendor.objects.filter(pk=pk).first()
    if not vendor:
        return Response(
            {"error": "Vendor not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    vendor.status = "REJECTED" if vendor.status == "APPROVED" else "APPROVED"
    vendor.save()

    return Response({"message": "Vendor status updated successfully."})


@api_view(["GET", "POST"])
@permission_classes([IsAdminUser])
def rfp_api(request):
    if request.method == "GET":
        rfps = RFP.objects.select_related("category").prefetch_related("assigned_vendors").all().order_by("-id")
        serializer = RFPSerializer(rfps, many=True)
        return Response(serializer.data)

    serializer = RFPSerializer(data=request.data)
    if serializer.is_valid():
        rfp = serializer.save()
        
        # Auto-assign all approved vendors from the selected category
        approved_vendors = Vendor.objects.filter(
            category=rfp.category,
            status="APPROVED"
        )
        rfp.assigned_vendors.set(approved_vendors)
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["PATCH"])
@permission_classes([IsAdminUser])
def rfp_toggle_api(request, pk):
    rfp = RFP.objects.filter(pk=pk).first()
    if not rfp:
        return Response(
            {"error": "RFP not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    rfp.status = "CLOSED" if rfp.status == "OPEN" else "OPEN"
    rfp.save()

    return Response({"message": "RFP status updated successfully."})


@api_view(["GET"])
@permission_classes([IsAdminUser])
def reports_api(request):
    data = {
        "total_categories": Category.objects.count(),
        "total_vendors": Vendor.objects.count(),
        "approved_vendors": Vendor.objects.filter(status="APPROVED").count(),
        "pending_vendors": Vendor.objects.filter(status="PENDING").count(),
        "rejected_vendors": Vendor.objects.filter(status="REJECTED").count(),
        "total_rfps": RFP.objects.count(),
        "open_rfps": RFP.objects.filter(status="OPEN").count(),
        "closed_rfps": RFP.objects.filter(status="CLOSED").count(),
        "category_wise_vendors": list(
            Category.objects.annotate(total=Count("vendors")).values("id", "name", "total")
        ),
        "category_wise_rfps": list(
            Category.objects.annotate(total=Count("rfps")).values("id", "name", "total")
        ),
    }
    return Response(data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_vendors_by_category_api(request, category_id):
    if not request.user.is_staff and not request.user.is_superuser:
        return Response(
            {"error": "Unauthorized"},
            status=status.HTTP_403_FORBIDDEN,
        )

    vendors = Vendor.objects.filter(
        category_id=category_id,
        status="APPROVED"
    ).order_by("-id")

    serializer = VendorSerializer(vendors, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def admin_create_rfp_api(request):
    if not request.user.is_staff and not request.user.is_superuser:
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
    vendor_ids = data.get("assigned_vendors", [])

    if not title or not category_id or not last_date or not min_amount or not max_amount:
        return Response(
            {"error": "All fields are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    category = Category.objects.filter(id=category_id, status="ACTIVE").first()
    if not category:
        return Response(
            {"error": "Invalid category."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    rfp = RFP.objects.create(
        category=category,
        title=title,
        last_date=last_date,
        min_amount=min_amount,
        max_amount=max_amount,
        status="OPEN",
    )

    valid_vendors = Vendor.objects.filter(
        id__in=vendor_ids,
        category=category,
        status="APPROVED",
    )

    rfp.assigned_vendors.set(valid_vendors)

    return Response(
        {
            "message": "RFP created successfully.",
            "rfp_id": rfp.id,
            "assigned_vendor_count": valid_vendors.count(),
        },
        status=status.HTTP_201_CREATED,
    )