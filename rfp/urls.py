from django.urls import path

from .views_auth import (
    register_api,
    login_api,
    verify_otp_api,
    resend_otp_api,
    forgot_password_api,
    reset_password_api,

    # Google Authenticator
    setup_google_auth_api,
    verify_google_auth_api,
    google_login_verify_api,
)

from .views_admin import (
    admin_create_rfp_api,
    admin_vendors_by_category_api,
    activity_logs_api,
    categories_api,
    category_toggle_api,
    vendors_api,
    vendor_toggle_api,
    rfp_api,
    rfp_toggle_api,
    reports_api,
)

from .views_vendor import (
    vendor_dashboard_api,
    vendor_rfp_list_api,
    vendor_quotes_api,
    vendor_apply_quote_api,
)

from rfp import views_auth

urlpatterns = [

    # =========================
    # Authentication
    # =========================

    path("auth/register/", register_api),
    path("auth/login/", login_api),

    path("auth/verify-otp/", verify_otp_api),
    path("auth/resend-otp/", resend_otp_api),

    path("auth/forgot-password/", forgot_password_api),
    path("auth/reset-password/", reset_password_api),

    # Google Authenticator

    path(
        "auth/setup-google-auth/",
        setup_google_auth_api,
        name="setup-google-auth",
    ),

    path(
        "auth/verify-google-auth/",
        verify_google_auth_api,
        name="verify-google-auth",
    ),

    path(
        "auth/google-login-verify/",
        google_login_verify_api,
        name="google-login-verify",
    ),

    # =========================
    # Admin
    # =========================

    path("admin/categories/", categories_api),
    path("admin/categories/<int:pk>/", category_toggle_api),

    path("admin/vendors/", vendors_api),
    path("admin/vendors/<int:pk>/", vendor_toggle_api),

    path("admin/rfp/", rfp_api),
    path("admin/rfp/<int:pk>/", rfp_toggle_api),

    path(
        "admin/vendors/category/<int:category_id>/",
        admin_vendors_by_category_api,
    ),

    path(
        "admin/rfp/create/",
        admin_create_rfp_api,
    ),

    path(
        "admin/activity-logs/",
        activity_logs_api,
    ),

    path(
        "admin/reports/",
        reports_api,
    ),

    # =========================
    # Public
    # =========================

    path(
        "public/categories/",
        views_auth.public_categories_api,
        name="public-categories",
    ),

    # =========================
    # Vendor
    # =========================

    path(
        "vendor/dashboard/",
        vendor_dashboard_api,
    ),

    path(
        "vendor/rfp/",
        vendor_rfp_list_api,
    ),

    path(
        "vendor/rfp/<int:rfp_id>/quote/",
        vendor_apply_quote_api,
    ),

    path(
        "vendor/quotes/",
        vendor_quotes_api,
    ),
]