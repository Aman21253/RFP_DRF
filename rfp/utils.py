from .models import ActivityLog


def create_activity_log(
    user,
    action,
    model_name=None,
    object_id=None,
    description="",
    details=None,
    ip_address=None,
):

    ActivityLog.objects.create(
        user=user,
        role=(
            "ADMIN"
            if user.is_staff or user.is_superuser
            else "VENDOR"
        ),
        action=action,
        model_name=model_name,
        object_id=object_id,
        description=description,
        details=details or {},
        ip_address=ip_address,
    )