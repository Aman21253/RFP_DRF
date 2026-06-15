from .models import ActivityLog


def create_activity_log(
    user,
    action,
    model_name=None,
    object_id=None,
    description="",
    details=None,
    ip_address=None,
    organization=None,
):
    """
    Central helper to write an ActivityLog entry.

    Parameters
    ----------
    user         : Django User instance or None (anonymous / system actions)
    action       : One of ActivityLog.ActionType values
    model_name   : String name of the affected model  e.g. "Vendor"
    object_id    : PK of the affected record
    description  : Human-readable sentence about what happened
    details      : Arbitrary dict stored as JSON
    ip_address   : Request IP string  e.g. request.META.get("REMOTE_ADDR")
    organization : Organization instance, if known at call site
    """

    role = "SYSTEM"

    if user:
        role = (
            "ADMIN"
            if (user.is_staff or user.is_superuser)
            else "VENDOR"
        )

    ActivityLog.objects.create(
        user=user,
        user_email=user.email if user else None,
        organization=organization,
        role=role,
        action=action,
        model_name=model_name or "",
        object_id=object_id or 0,
        description=description,
        details=details or {},
        ip_address=ip_address,
    )