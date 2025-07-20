# print_management/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views # لـ schema_view
from . import api_views # <--- استيراد api_views

# إنشاء راوتر لـ API ViewSets
router = DefaultRouter()
router.register(r'clients', api_views.ClientViewSet)
router.register(r'printjobs', api_views.PrintJobViewSet)
router.register(r'receipts', api_views.PaymentReceiptViewSet)

urlpatterns = [
    # مسارات الـ API (سيتم إضافة الـ ViewSets هنا)
    path('api/', include(router.urls)),
    # مسار لتوثيق Swagger/OpenAPI
    path('swagger/', views.schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', views.schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),

    # مسارات الواجهة الأمامية التقليدية (إذا كنت تخطط للاحتفاظ بها أو استخدامها لأغراض معينة)
    # path('printjobs/', views.printjob_list, name='printjob_list'),
    # path('printjobs/add/', views.add_printjob, name='add_printjob'),
    # path('receipt/<str:id_type>/<int:record_id>/', views.generate_receipt_pdf, name='generate_receipt_pdf'),
]
