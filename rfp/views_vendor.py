from decimal import Decimal, InvalidOperation

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import Vendor, RFP, Quote


def get_vendor_from_user(user):
    email = (user.email or user.username or "").strip().lower()

    vendor = Vendor.objects.filter(
        email=email
    ).first()

    return vendor


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def vendor_dashboard_api(request):
    if request.user.is_staff or request.user.is_superuser:
        return Response(
            {"error": "Unauthorized"},
            status=status.HTTP_403_FORBIDDEN,
        )

    vendor = get_vendor_from_user(request.user)
    if not vendor:
        return Response(
            {"error": "Vendor profile not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    assigned_rfps_count = RFP.objects.filter(
        status="OPEN",
        assigned_vendors=vendor,
        organization=vendor.organization
    ).count()

    quotes_count = Quote.objects.filter(
        vendor=vendor,
        organization=vendor.organization
    ).count()

    data = {
        "vendor": {
            "id": vendor.id,
            "first_name": vendor.first_name,
            "last_name": vendor.last_name,
            "email": vendor.email,
            "status": vendor.status,
            "category": vendor.category.name if vendor.category else None,
        },
        "summary": {
            "assigned_rfps": assigned_rfps_count,
            "quotes_submitted": quotes_count,
        },
    }
    return Response(data, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def vendor_rfp_list_api(request):
    if request.user.is_staff or request.user.is_superuser:
        return Response(
            {"error": "Unauthorized"},
            status=status.HTTP_403_FORBIDDEN,
        )

    vendor = get_vendor_from_user(request.user)
    if not vendor:
        return Response(
            {"error": "Vendor profile not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    rfps = (

        RFP.objects.select_related("category")
        .filter(
            status="OPEN",
            assigned_vendors=vendor,
            organization=vendor.organization
        )
        .order_by("-id")
    )

    data = [
        {
            "id": rfp.id,
            "title": rfp.title,
            "category": rfp.category.name if rfp.category else "",
            "last_date": rfp.last_date,
            "min_amount": rfp.min_amount,
            "max_amount": rfp.max_amount,
            "status": rfp.status,
        }
        for rfp in rfps
    ]

    return Response(data, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def vendor_quotes_api(request):
    if request.user.is_staff or request.user.is_superuser:
        return Response(
            {"error": "Unauthorized"},
            status=status.HTTP_403_FORBIDDEN,
        )

    vendor = get_vendor_from_user(request.user)
    if not vendor:
        return Response(
            {"error": "Vendor profile not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    quotes = (
        Quote.objects.select_related("rfp", "rfp__category")
        .filter(
            vendor=vendor,
            organization=vendor.organization
        )
        .order_by("-id")
    )

    data = [
        {
            "id": quote.id,
            "rfp": quote.rfp.id if quote.rfp else None,
            "rfp_title": quote.rfp.title if quote.rfp else "",
            "amount": getattr(quote, "amount", None),
            "remarks": getattr(quote, "remarks", ""),
            "created_at": quote.created_at.strftime("%Y-%m-%d %H:%M") if getattr(quote, "created_at", None) else "",
        }
        for quote in quotes
    ]

    return Response(data, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def vendor_apply_quote_api(request, rfp_id):
    if request.user.is_staff or request.user.is_superuser:
        return Response(
            {"error": "Unauthorized"},
            status=status.HTTP_403_FORBIDDEN,
        )

    vendor = get_vendor_from_user(request.user)
    if not vendor:
        return Response(
            {"error": "Vendor profile not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    rfp = RFP.objects.filter(
        id=rfp_id,
        status="OPEN",
        assigned_vendors=vendor,
        organization=vendor.organization
    ).first()

    if not rfp:
        return Response(
            {"error": "Assigned RFP not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    amount = request.data.get("amount")
    remarks = request.data.get("remarks", "")
    
    if amount is None:
        return Response(
            {"error": "Amount is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    
    try:
        amount = Decimal(str(amount))
    except (InvalidOperation, TypeError, ValueError):
        return Response(
            {"error": "Invalid amount."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    
    if amount <= 0:
        return Response(
            {"error": "Amount must be greater than zero."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    quote, created = Quote.objects.get_or_create(
        rfp=rfp,
        vendor=vendor,
        organization=vendor.organization,
        defaults={
            "amount": amount,
            "remarks": remarks,
        },
    )

    if not created:
        quote.amount = amount
        quote.remarks = remarks
        quote.save()

    return Response(
        {
            "message": "Quote submitted successfully.",
            "quote_id": quote.id,
        },
        status=status.HTTP_200_OK,
    )