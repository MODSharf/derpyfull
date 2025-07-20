# creative_studio_api/urls.py (أو stapi/stapi/urls.py في مسارك)

from django.contrib import admin
from django.urls import path, include
from print.views import schema_view # <--- تم تصحيح الاستيراد هنا لـ 'print.views'

from print import api_views 

# استيراد schema_view مباشرة من print.views
# هذا هو التصحيح بناءً على ملاحظتك.
