from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import Category, Vendor, RFP, Quote, QuoteItem



@receiver(post_save, sender=Vendor)
def log_vendor_save(sender, instance, created, **kwargs):
    action = 'created' if created else 'updated'
    pass


@receiver(post_save, sender=RFP)
def log_rfp_save(sender, instance, created, **kwargs):
    action = 'created' if created else 'updated'
    pass


@receiver(post_save, sender=Quote)
def log_quote_save(sender, instance, created, **kwargs):
    action = 'created' if created else 'updated'
    pass


@receiver(post_delete, sender=Category)
def log_category_delete(sender, instance, **kwargs):
    pass


@receiver(post_delete, sender=Vendor)
def log_vendor_delete(sender, instance, **kwargs):
    pass


@receiver(post_delete, sender=RFP)
def log_rfp_delete(sender, instance, **kwargs):
    pass


@receiver(post_delete, sender=Quote)
def log_quote_delete(sender, instance, **kwargs):
    pass