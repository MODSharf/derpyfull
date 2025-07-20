# stapi/print/signals.py

from django.db.models.signals import post_save
from django.contrib.auth.models import User
from django.dispatch import receiver
from .models import Profile

# @receiver(post_save, sender=User)
# def create_or_update_user_profile(sender, instance, created, **kwargs):
#     """
#     Signal to create or update a Profile object whenever a User object is saved.
#     Ensures a Profile exists for every User, but avoids creating duplicates
#     when an inline formset (like in Django Admin) is also creating one.
#     This signal is now commented out because ProfileInline in admin.py
#     handles the creation of Profile objects for users created via the admin.
#     If you need automatic profile creation outside of admin, consider
#     handling it in your API serializers or views.
#     """
#     Profile.objects.get_or_create(user=instance)

# يمكنك حذف الكود أعلاه بالكامل أو تركه معلقًا كما هو موضح.
# الأهم هو ألا يتم تشغيل هذا الـ signal.
