from rest_framework.permissions import BasePermission


class IsAdminUser(BasePermission):

    def has_permission(self, request, view):
        return request.user and request.user.is_staff


class IsVendorUser(BasePermission):

    def has_permission(self, request, view):

        if not request.user.is_authenticated:
            return False

        return not request.user.is_staff