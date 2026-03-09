from django.contrib import admin
from .models import Category, Vendor, RFP, Quote, QuoteItem, AuthConfig, LoginOTP


admin.site.register(Category)
admin.site.register(Vendor)
admin.site.register(RFP)
admin.site.register(Quote)
admin.site.register(QuoteItem)
admin.site.register(AuthConfig)
admin.site.register(LoginOTP)