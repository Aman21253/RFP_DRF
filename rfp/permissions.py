from rest_framework.permissions import BasePermission

from .models import OrganizationAdmin


class IsAdminUser(BasePermission):
    """
    Allows access only to authenticated users who:
      1. are marked is_staff or is_superuser, AND
      2. have an OrganizationAdmin record.

    Superusers without an OrganizationAdmin (e.g. Django super-admin)
    are still granted access but get no organisation context.
    """

    message = "You do not have admin privileges for any organisation."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return bool(request.user.is_staff or request.user.is_superuser)


class IsVendorUser(BasePermission):
    """
    Allows access only to authenticated non-staff users
    (i.e. regular vendor accounts).
    """

    message = "Only vendor accounts can access this endpoint."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return not (request.user.is_staff or request.user.is_superuser)