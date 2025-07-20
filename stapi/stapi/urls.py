    # stapi/urls.py

from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.authtoken import views as auth_views
from print import api_views # تأكد من أن هذا الاستيراد صحيح

    # استيراد schema_view مباشرة من print.views
from print.views import schema_view

    # إنشاء راوتر لـ API ViewSets
router = DefaultRouter()
router.register(r'clients', api_views.ClientViewSet)
router.register(r'printjobs', api_views.PrintJobViewSet)
router.register(r'receipts', api_views.PaymentReceiptViewSet)
router.register(r'users', api_views.UserViewSet)
    # تسجيل ViewSets الجديدة لقسم التصوير
router.register(r'photographypackages', api_views.PhotographyPackageViewSet)
router.register(r'photographers', api_views.PhotographerViewSet)
router.register(r'photosessions', api_views.PhotoSessionViewSet)


urlpatterns = [
    path('admin/', admin.site.urls),
        # مسارات الـ API (ViewSets ونقاط نهاية المصادقة)
    path('api/', include(router.urls)),
    path('api/token-auth/', auth_views.obtain_auth_token, name='api_token_auth'),
    path('api/logout/', api_views.LogoutView.as_view(), name='api_logout'),
        # NEW: مسار مخصص لبيانات المستخدم الحالي
    path('api/current-user/', api_views.CurrentUserView.as_view(), name='current_user'), # إضافة هذا السطر

        # مسار لتوثيق Swagger/OpenAPI
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]
    