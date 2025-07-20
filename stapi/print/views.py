#C:\Users\SAMAH\Downloads\api\stapi\print\views.py
from django.shortcuts import render

# print_management/views.py
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi


# ... (يمكنك إضافة دوال الـ HTML التقليدية هنا لاحقًا إذا أردت)
# مثال:
# from django.shortcuts import render
# def dashboard(request):
#     return render(request, 'print_management/dashboard.html')



# print_management/views.py (لا يوجد تغييرات جوهرية، فقط للتأكد من وجوده)


# إعدادات توثيق Swagger/OpenAPI
schema_view = get_schema_view(
   openapi.Info(
      title="Creative Studio API",
      default_version='v1',
      description="API لإدارة العملاء، طلبات الطباعة، والإيصالات لاستوديو إبداعي.",
      terms_of_service="[https://www.google.com/policies/terms/](https://www.google.com/policies/terms/)",
      contact=openapi.Contact(email="contact@yourstudio.com"),
      license=openapi.License(name="BSD License"),
   ),
   public=True,
   permission_classes=(permissions.AllowAny,),
)

