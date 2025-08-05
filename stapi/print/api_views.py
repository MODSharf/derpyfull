from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from .permissions import CanChangeUserPermissions
from django.shortcuts import get_object_or_404
from django.urls import reverse
from django.conf import settings
from django.template.loader import render_to_string
from weasyprint import HTML, CSS
from django.contrib.staticfiles.storage import staticfiles_storage
from django.utils import timezone
import json
from decimal import Decimal
import qrcode
import io
import base64
from django.http import HttpResponse

from rest_framework.views import APIView
from rest_framework.authentication import TokenAuthentication
from rest_framework.authtoken.models import Token

from django.contrib.auth.models import User, Permission, Group
from django.db import models
from django.db.models import Q

# استيراد النماذج
from .models import Client, PrintJob, PaymentReceipt, Profile, Role, PhotographyPackage, Photographer, PhotoSession, Alert, PrintJobItem
# استيراد Serializers
from .serializers import (
    ClientSerializer, PrintJobSerializer, PaymentReceiptSerializer, UserSerializer,
    ProfileSerializer, RoleSerializer, PhotographyPackageSerializer, PhotographerSerializer, PhotoSessionSerializer, AlertSerializer,
    PermissionSerializer, ContentTypeSerializer, GroupSerializer, PrintJobItemSerializer
)

# Helper function for QR code generation
def generate_qr_code_base64(data):
    qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_L, box_size=10, border=4)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode()

# ===========================================================================
# ViewSet لعرض جميع الصلاحيات المتاحة
# ===========================================================================
class PermissionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PermissionSerializer
    permission_classes = [IsAuthenticated] # Allow any authenticated user to see the list of permissions
    pagination_class = None # Disable pagination for this viewset

    def get_queryset(self):
        # Filter permissions to only include those from the 'print' app
        return Permission.objects.filter(content_type__app_label='print').select_related('content_type').order_by('content_type__model', 'codename')


# ===========================================================================
# View لإدارة تسجيل الخروج (Logout)
# ===========================================================================
class LogoutView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            request.user.auth_token.delete()
            return Response(status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ===========================================================================
# View لبيانات المستخدم الحالي (CurrentUserView) - مفصولة عن UserViewSet
# ===========================================================================
class CurrentUserView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


# ===========================================================================
# ViewSet للمستخدمين (Users) - تم التعديل لصلاحيات أكثر مرونة
# ===========================================================================
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().select_related('profile').order_by('username')
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Allow users with 'print.view_user_list' to see all users
        if self.request.user.has_perm('print.view_user_list'):
            return User.objects.all().select_related('profile').order_by('username')
        # Otherwise, users can only see their own profile
        return User.objects.filter(id=self.request.user.id).select_related('profile')

    def perform_create(self, serializer):
        # Check for 'print.add_user' permission to create any user
        if not self.request.user.has_perm('print.add_user'):
            raise serializers.ValidationError({"detail": "ليس لديك صلاحية لإنشاء مستخدمين."}) # Changed from "ليس لديك صلاحية لإنشاء مستخدمين." to "ليس لديك صلاحية لإنشاء مستخدمين."

        roles_data = self.request.data.get('roles', [])
        # If trying to assign 'manager' role, check for 'print.change_user_roles' permission
        if 'manager' in roles_data and not self.request.user.has_perm('print.change_user_roles'):
            raise serializers.ValidationError({"detail": "ليس لديك صلاحية لإنشاء مستخدم بدور مدير."}) # Changed from "ليس لديك صلاحية لإنشاء مستخدم بدور مدير." to "ليس لديك صلاحية لإنشاء مستخدم بدور مدير."
        serializer.save()

    def perform_update(self, serializer):
        # Check if the user is trying to update another user and if they have permission
        if self.get_object() != self.request.user and not self.request.user.has_perm('print.change_user_roles'):
            raise serializers.ValidationError({"detail": "ليس لديك صلاحية لتعديل مستخدمين آخرين."}) # Changed from "ليس لديك صلاحية لتعديل مستخدمين آخرين." to "ليس لديك صلاحية لتعديل مستخدمين آخرين."

        if 'roles' in self.request.data:
            new_roles = self.request.data['roles']
            current_user_profile = self.get_object().profile if hasattr(self.get_object(), 'profile') else None
            current_user_roles = [role.name for role in current_user_profile.roles.all()] if current_user_profile else []

            # If not authorized to change roles, ensure no roles are changed
            if not self.request.user.has_perm('print.change_user_roles'):
                if set(new_roles) != set(current_user_roles):
                    raise serializers.ValidationError({"detail": "ليس لديك صلاحية لتغيير دور المستخدم."}) # Changed from "ليس لديك صلاحية لتغيير دور المستخدم." to "ليس لديك صلاحية لتغيير دور المستخدم."
            else:
                # If the user is trying to remove their own manager role, ensure at least one manager remains
                if self.get_object() == self.request.user and 'manager' not in new_roles:
                    if User.objects.filter(profile__roles__name='manager').count() <= 1:
                        raise serializers.ValidationError({"detail": "يجب أن يكون هناك مدير واحد على الأقل في النظام."}) # Changed from "يجب أن يكون هناك مدير واحد على الأقل في النظام." to "يجب أن يكون هناك مدير واحد على الأقل في النظام."
        serializer.save()

    def perform_destroy(self, instance):
        # Check for 'print.delete_user' permission
        if not self.request.user.has_perm('print.delete_user'):
            raise serializers.ValidationError({"detail": "ليس لديك صلاحية لحذف المستخدمين."}) # Changed from "ليس لديك صلاحية لحذف المستخدمين." to "ليس لديك صلاحية لحذف المستخدمين."

        # Ensure at least one manager remains if trying to delete a manager
        if hasattr(instance, 'profile') and instance.profile.roles.filter(name='manager').exists():
            if User.objects.filter(profile__roles__name='manager').count() <= 1:
                raise serializers.ValidationError({"detail": "لا يمكن حذف المدير الأخير في النظام."}) # Changed from "لا يمكن حذف المدير الأخير في النظام." to "لا يمكن حذف المدير الأخير في النظام."
        instance.delete()

# ===========================================================================
# ViewSet للعملاء
# ===========================================================================
class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['name', 'phone', 'email']

    def get_queryset(self):
        if self.request.user.has_perm('print.view_client'):
            queryset = super().get_queryset()
            search_term = self.request.query_params.get('search', None)
            if search_term:
                queryset = queryset.filter(
                    Q(name__icontains=search_term) |
                    Q(phone__icontains=search_term) |
                    Q(email__icontains=search_term)
                )
            return queryset
        return Client.objects.none() # Return empty if no permission

    def perform_create(self, serializer):
        if not self.request.user.has_perm('print.add_client'):
            raise serializers.ValidationError({"detail": "ليس لديك صلاحية لإنشاء عملاء."}) # Changed from "ليس لديك صلاحية لإنشاء عملاء." to "ليس لديك صلاحية لإنشاء عملاء."
        serializer.save()

    def perform_update(self, serializer):
        if not self.request.user.has_perm('print.change_client'):
            raise serializers.ValidationError({"detail": "ليس لديك صلاحية لتعديل العملاء."}) # Changed from "ليس لديك صلاحية لتعديل العملاء." to "ليس لديك صلاحية لتعديل العملاء."
        serializer.save()

    def perform_destroy(self, instance):
        if not self.request.user.has_perm('print.delete_client'):
            raise serializers.ValidationError({"detail": "ليس لديك صلاحية لحذف العملاء."}) # Changed from "ليس لديك صلاحية لحذف العملاء." to "ليس لديك صلاحية لحذف العملاء."
        instance.delete()

    @action(detail=True, methods=['get'])
    def printjobs(self, request, pk=None):
        if not self.request.user.has_perm('print.view_printjob'):
            return Response({'detail': 'ليس لديك صلاحية لعرض طلبات الطباعة.'}, status=status.HTTP_403_FORBIDDEN)
        client = self.get_object()
        print_jobs = client.print_jobs.all()
        serializer = PrintJobSerializer(print_jobs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def receipts(self, request, pk=None):
        if not self.request.user.has_perm('print.view_paymentreceipt'):
            return Response({'detail': 'ليس لديك صلاحية لعرض الإيصالات.'}, status=status.HTTP_403_FORBIDDEN)
        client = self.get_object()
        receipts = PaymentReceipt.objects.filter(Q(printing__client=client) | Q(photography_session__client=client)).distinct().order_by('-date_issued')
        serializer = PaymentReceiptSerializer(receipts, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='photosessions')
    def photosessions(self, request, pk=None):
        if not self.request.user.has_perm('print.view_photosession'):
            return Response({'detail': 'ليس لديك صلاحية لعرض جلسات التصوير.'}, status=status.HTTP_403_FORBIDDEN)
        client = self.get_object()
        photo_sessions = client.photo_sessions.all().order_by('-created_at')
        serializer = PhotoSessionSerializer(photo_sessions, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='total-remaining-amount-combined')
    def total_remaining_amount_combined(self, request, pk=None):
        if not self.request.user.has_perm('print.view_client'): # Or a more specific permission for reports
            return Response({'detail': 'ليس لديك صلاحية لعرض ملخص المبالغ.'}, status=status.HTTP_403_FORBIDDEN)
        client = self.get_object()
        total_remaining_print_jobs = sum(job.remaining_amount for job in client.print_jobs.all())
        total_remaining_photo_sessions = sum(session.remaining_amount for session in client.photo_sessions.all())
        total_combined_remaining = total_remaining_print_jobs + total_remaining_photo_sessions
        return Response({'total_remaining_amount': total_combined_remaining})

# ===========================================================================
# ViewSet لعناصر طلب الطباعة (جديد)
# ===========================================================================
class PrintJobItemViewSet(viewsets.ModelViewSet):
    queryset = PrintJobItem.objects.all().select_related('print_job')
    serializer_class = PrintJobItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Allow users to view items only for print jobs they can access
        if self.request.user.has_perm('print.view_printjobitem'):
            return super().get_queryset()
        return PrintJobItem.objects.none()

    def perform_create(self, serializer):
        if not self.request.user.has_perm('print.add_printjobitem'):
            raise serializers.ValidationError({"detail": "ليس لديك صلاحية لإنشاء عناصر طلبات طباعة."}) # Changed from "ليس لديك صلاحية لإنشاء عناصر طلبات طباعة." to "ليس لديك صلاحية لإنشاء عناصر طلبات طباعة."
        serializer.save()

    def perform_update(self, serializer):
        if not self.request.user.has_perm('print.change_printjobitem'):
            raise serializers.ValidationError({"detail": "ليس لديك صلاحية لتعديل عناصر طلبات الطباعة."}) # Changed from "ليس لديك صلاحية لتعديل عناصر طلبات الطباعة." to "ليس لديك صلاحية لتعديل عناصر طلبات الطباعة."
        serializer.save()

    def perform_destroy(self, instance):
        if not self.request.user.has_perm('print.delete_printjobitem'):
            raise serializers.ValidationError({"detail": "ليس لديك صلاحية لحذف عناصر طلبات الطباعة."}) # Changed from "ليس لديك صلاحية لحذف عناصر طلبات الطباعة." to "ليس لديك صلاحية لحذف عناصر طلبات الطباعة."
        instance.delete()

# ===========================================================================
# ViewSet لطلبات الطباعة
# ===========================================================================
class PrintJobViewSet(viewsets.ModelViewSet):
    queryset = PrintJob.objects.all().select_related('client', 'issued_by').prefetch_related('items').order_by('-created_at')
    serializer_class = PrintJobSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status', 'client__name', 'receipt_number'] # Removed print_type and size

    def get_queryset(self):
        queryset = super().get_queryset()
        search_term = self.request.query_params.get('search', None)
        if search_term:
            queryset = queryset.filter(
                Q(receipt_number__icontains=search_term) |
                Q(client__name__icontains=search_term) |
                Q(notes__icontains=search_term)
            )
        return queryset

    def perform_create(self, serializer):
        if not self.request.user.has_perm('print.add_printjob'):
            raise serializers.ValidationError({"detail": "ليس لديك صلاحية لإنشاء طلبات طباعة."}) # Changed from "ليس لديك صلاحية لإنشاء طلبات طباعة." to "ليس لديك صلاحية لإنشاء طلبات طباعة."
        
        # The serializer's create method now handles nested items and initial saving
        print_job = serializer.save(issued_by=self.request.user)

        # Refresh the print_job instance from the database to ensure properties are up-to-date
        print_job.refresh_from_db()

        # Initial payment handling (if any)
        initial_paid_amount = Decimal(str(self.request.data.get('paid_amount', 0))) # Get paid_amount from request data
        
        # Ensure initial_paid_amount does not exceed total_amount
        if initial_paid_amount > print_job.total_amount:
            initial_paid_amount = print_job.total_amount

        if initial_paid_amount > 0:
            PaymentReceipt.objects.create(
                receipt_type='printing',
                printing=print_job,
                total_amount=print_job.total_amount, # Use calculated total_amount from PrintJob
                paid_amount=initial_paid_amount,
                payment_method='cash',
                notes='دفعة أولية عند إنشاء طلب الطباعة',
                issued_by=self.request.user
            )
        
        # Create an alert for the new print job
        alert = Alert.objects.create(
            message=f"تم إنشاء طلب طباعة جديد للعميل {print_job.client.name} برقم إيصال {print_job.receipt_number}.",
            alert_type='new_job',
        )
        # Assign alert to specific roles
        printer_role = Role.objects.get(name='printer')
        manager_role = Role.objects.get(name='manager')
        alert.roles.add(printer_role, manager_role)

    def perform_update(self, serializer):
        if not self.request.user.has_perm('print.change_printjob'):
            raise serializers.ValidationError({"detail": "ليس لديك صلاحية لتعديل طلبات الطباعة."}) # Changed from "ليس لديك صلاحية لتعديل طلبات الطباعة." to "ليس لديك صلاحية لتعديل طلبات الطباعة."
        # The serializer's update method now handles nested items
        serializer.save()

    def perform_destroy(self, instance):
        if not self.request.user.has_perm('print.delete_printjob'):
            raise serializers.ValidationError({"detail": "ليس لديك صلاحية لحذف طلبات الطباعة."}) # Changed from "ليس لديك صلاحية لحذف طلبات الطباعة." to "ليس لديك صلاحية لحذف طلبات الطباعة."
        instance.delete()

    @action(detail=True, methods=['post'], url_path='add-payment')
    def add_payment(self, request, pk=None):
        if not self.request.user.has_perm('print.add_paymentreceipt'):
            return Response({'detail': 'ليس لديك صلاحية لإضافة دفعات.'}, status=status.HTTP_403_FORBIDDEN)
        print_job = self.get_object()
        amount = request.data.get('amount')
        payment_method = request.data.get('payment_method', 'cash')
        notes = request.data.get('notes', '')

        if not amount or not isinstance(amount, (int, float, str)) or Decimal(str(amount)) <= 0:
            return Response({'detail': 'مبلغ الدفعة مطلوب ويجب أن يكون رقماً موجباً.'}, status=status.HTTP_400_BAD_REQUEST)

        amount = Decimal(str(amount))

        if amount > print_job.remaining_amount:
            return Response({'detail': f'المبلغ المدفوع ({amount}) يتجاوز المبلغ المتبقي ({print_job.remaining_amount}).'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            PaymentReceipt.objects.create(
                receipt_type='printing',
                printing=print_job,
                total_amount=print_job.total_amount,
                paid_amount=amount,
                payment_method=payment_method,
                notes=notes,
                issued_by=request.user
            )

            # The paid_amount on PrintJob is now a property, so no need to update it directly
            # print_job.paid_amount += amount 
            if print_job.remaining_amount <= 0: # Check remaining_amount after new payment
                print_job.financial_status = 'completed' # Changed from 'paid' to 'completed'
            print_job.save() # Save to trigger financial_status update

            return Response({'detail': 'تمت إضافة الدفعة بنجاح.', 'new_paid_amount': print_job.paid_amount}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'], url_path='payment-receipts')
    def payment_receipts_list(self, request, pk=None):
        print_job = self.get_object()
        receipts = print_job.payment_receipts.all().order_by('-date_issued')
        serializer = PaymentReceiptSerializer(receipts, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='generate-final-invoice')
    def generate_final_invoice(self, request, pk=None):
        if not self.request.user.has_perm('print.view_printjob'): # Or a more specific permission like 'print.generate_printjob_invoice'
            return Response({'detail': 'ليس لديك صلاحية لإنشاء الفواتير.'}, status=status.HTTP_403_FORBIDDEN)
        print_job = self.get_object()
        if print_job.remaining_amount > 0:
            return Response({'detail': 'لا يمكن إنشاء فاتورة نهائية قبل دفع المبلغ بالكامل.'}, status=status.HTTP_400_BAD_REQUEST)

        company_info = {
            'name': 'استوديو الإبداع',
            'address': 'شارع الفن، مدينة الإبداع، 12345',
            'phone': '01001234567',
            'email': 'info@creative-studio.com',
            'website': 'www.creative-studio.com',
            'tax_id': 'VAT123456789',
        }
        company_logo_static_url = staticfiles_storage.url('images/logo.png')
        qr_data = f"Print Job: {print_job.receipt_number}\nClient: {print_job.client.name}\nTotal: {print_job.total_amount}\nPaid: {print_job.paid_amount}"
        qr_code_base64 = generate_qr_code_base64(qr_data) # Use helper function

        context = {
            'print_job': print_job,
            'client': print_job.client,
            'company': company_info,
            'company_logo_absolute_url': company_logo_static_url,
            'qr_code_base64': qr_code_base64,
            'receipts': print_job.payment_receipts.all().order_by('date_issued'),
        }
        html_string = render_to_string('print/print_invoice_template.html', context)
        html = HTML(string=html_string, base_url=request.build_absolute_uri('/'))
        pdf_file = html.write_pdf()
        response = HttpResponse(pdf_file, content_type='application/pdf')
        file_name = f"final_invoice_printjob_{print_job.receipt_number}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{file_name}"'
        return response


# ===========================================================================
# ViewSet لإيصالات الدفع
# ===========================================================================
class PaymentReceiptViewSet(viewsets.ModelViewSet):
    queryset = PaymentReceipt.objects.all().select_related('printing', 'photography_session', 'issued_by').order_by('-date_issued')
    serializer_class = PaymentReceiptSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['receipt_type', 'payment_method', 'issued_by__username', 'receipt_number']

    def perform_create(self, serializer):
        if not self.request.user.has_perm('print.add_paymentreceipt'):
            raise serializers.ValidationError({"detail": "ليس لديك صلاحية لإنشاء إيصالات دفع."}) # Changed from "ليس لديك صلاحية لإنشاء إيصالات دفع." to "ليس لديك صلاحية لإنشاء إيصالات دفع."
        serializer.save(issued_by=self.request.user)

    def perform_update(self, serializer):
        if not self.request.user.has_perm('print.change_paymentreceipt'):
            raise serializers.ValidationError({"detail": "ليس لديك صلاحية لتعديل إيصالات الدفع."}) # Changed from "ليس لديك صلاحية لتعديل إيصالات الدفع." to "ليس لديك صلاحية لتعديل إيصالات الدفع."
        serializer.save()

    def perform_destroy(self, instance):
        if not self.request.user.has_perm('print.delete_paymentreceipt'):
            raise serializers.ValidationError({"detail": "ليس لديك صلاحية لحذف إيصالات الدفع."}) # Changed from "ليس لديك صلاحية لحذف إيصالات الدفع." to "ليس لديك صلاحية لحذف إيصالات الدفع."
        instance.delete()

    @action(detail=True, methods=['get'], url_path='generate-pdf-receipt')
    def generate_pdf_receipt(self, request, pk=None):
        if not self.request.user.has_perm('print.view_paymentreceipt'):
            return Response({'detail': 'ليس لديك صلاحية لعرض إيصالات الدفع.'}, status=status.HTTP_403_FORBIDDEN)
        receipt = self.get_object()
        company_info = {
            'name': 'استوديو الإبداع',
            'address': 'شارع الفن، مدينة الإبداع، 12345',
            'phone': '01001234567',
            'email': 'info@creative-studio.com',
            'website': 'www.creative-studio.com',
            'tax_id': 'VAT123456789',
        }
        company_logo_static_url = staticfiles_storage.url('images/logo.png')
        # Use receipt.paid_amount and receipt.total_amount for QR data
        qr_data = f"Receipt: {receipt.receipt_number}\nPaid: {receipt.paid_amount}\nTotal: {receipt.total_amount}\nMethod: {receipt.payment_method}"
        qr_code_base64 = generate_qr_code_base64(qr_data) # Use helper function

        context = {
            'receipt': receipt,
            'printing': receipt.printing,
            'photography_session': receipt.photography_session,
            'company': company_info,
            'company_logo_absolute_url': company_logo_static_url,
            'qr_code_base64': qr_code_base64,
            'remaining_amount': receipt.printing.remaining_amount if receipt.printing else (receipt.photography_session.remaining_amount if receipt.photography_session else Decimal('0.00')),
        }
        html_string = render_to_string('print/printing_receipt_template.html', context)
        html = HTML(string=html_string, base_url=request.build_absolute_uri('/'))
        pdf_file = html.write_pdf()
        response = HttpResponse(pdf_file, content_type='application/pdf')
        file_name = f"payment_receipt_{receipt.receipt_number}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{file_name}"'
        return response

# ===========================================================================
# ViewSet لباقات التصوير
# ===========================================================================
class PhotographyPackageViewSet(viewsets.ModelViewSet):
    queryset = PhotographyPackage.objects.all().order_by('price')
    serializer_class = PhotographyPackageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.has_perm('print.view_photographypackage'):
            return PhotographyPackage.objects.all().order_by('price')
        return PhotographyPackage.objects.none() # Return an empty queryset if not authorized to view all

    def perform_create(self, serializer):
        if not self.request.user.has_perm('print.add_photographypackage'):
            raise serializers.ValidationError({"detail": "ليس لديك صلاحية لإنشاء باقات تصوير جديدة."}) # Changed from "ليس لديك صلاحية لإنشاء باقات تصوير جديدة." to "ليس لديك صلاحية لإنشاء باقات تصوير جديدة."
        serializer.save()

    def perform_update(self, serializer):
        if not self.request.user.has_perm('print.change_photographypackage'):
            raise serializers.ValidationError({"detail": "ليس لديك صلاحية لتعديل باقات التصوير."}) # Changed from "ليس لديك صلاحية لتعديل باقات التصوير." to "ليس لديك صلاحية لتعديل باقات التصوير."
        serializer.save()

    def perform_destroy(self, instance):
        if not self.request.user.has_perm('print.delete_photographypackage'):
            raise serializers.ValidationError({"detail": "ليس لديك صلاحية لحذف باقات التصوير."}) # Changed from "ليس لديك صلاحية لحذف باقات التصوير." to "ليس لديك صلاحية لحذف باقات التصوير."
        instance.delete()


# ===========================================================================
# ViewSet للمصورين
# ===========================================================================
class PhotographerViewSet(viewsets.ModelViewSet):
    queryset = Photographer.objects.all().order_by('name')
    serializer_class = PhotographerSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.has_perm('print.view_photographer'):
            return Photographer.objects.all().order_by('name')
        return Photographer.objects.none() # Return an empty queryset if not authorized to view all

    def perform_create(self, serializer):
        if not self.request.user.has_perm('print.add_photographer'):
            raise serializers.ValidationError({"detail": "ليس لديك صلاحية لإنشاء مصورين جدد."}) # Changed from "ليس لديك صلاحية لإنشاء مصورين جدد." to "ليس لديك صلاحية لإنشاء مصورين جدد."
        serializer.save()

    def perform_update(self, serializer):
        if not self.request.user.has_perm('print.change_photographer'):
            raise serializers.ValidationError({"detail": "ليس لديك صلاحية لتعديل المصورين."}) # Changed from "ليس لديك صلاحية لتعديل المصورين." to "ليس لديك صلاحية لتعديل المصورين."
        serializer.save()

    def perform_destroy(self, instance):
        if not self.request.user.has_perm('print.delete_photographer'):
            raise serializers.ValidationError({"detail": "ليس لديك صلاحية لحذف المصورين."}) # Changed from "ليس لديك صلاحية لحذف المصورين." to "ليس لديك صلاحية لحذف المصورين."
        instance.delete()


# ===========================================================================
# ViewSet لجلسات التصوير
# ===========================================================================
class PhotoSessionViewSet(viewsets.ModelViewSet):
    queryset = PhotoSession.objects.all().select_related('client', 'package', 'photographer', 'issued_by').order_by('-created_at')
    serializer_class = PhotoSessionSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status', 'client__name', 'package__name', 'photographer__name', 'receipt_number', 'session_date']

    def get_queryset(self):
        queryset = super().get_queryset()
        search_term = self.request.query_params.get('search', None)
        if search_term:
            queryset = queryset.filter(
                Q(receipt_number__icontains=search_term) |
                Q(client__name__icontains=search_term) |
                Q(location__icontains=search_term) |
                Q(notes__icontains=search_term)
            )
        return queryset

    def perform_create(self, serializer):
        if not self.request.user.has_perm('print.add_photosession'):
            raise serializers.ValidationError({"detail": "ليس لديك صلاحية لإنشاء جلسات تصوير."}) # Changed from "ليس لديك صلاحية لإنشاء جلسات تصوير." to "ليس لديك صلاحية لإنشاء جلسات تصوير."
        photo_session = serializer.save(issued_by=self.request.user)
        initial_paid_amount = photo_session.paid_amount
        if initial_paid_amount > 0:
            PaymentReceipt.objects.create(
                receipt_type='photography',
                photography_session=photo_session,
                total_amount=photo_session.total_amount, # NEW: Pass total_amount
                paid_amount=initial_paid_amount, # Changed from amount to paid_amount
                payment_method='cash',
                notes='دفعة أولية عند إنشاء جلسة التصوير',
                issued_by=self.request.user
            )
        # Create an alert for the new photo session
        alert = Alert.objects.create(
            message=f"تم إنشاء جلسة تصوير جديدة للعميل {photo_session.client.name} برقم إيصال {photo_session.receipt_number}.",
            alert_type='new_job',
            # user=self.request.user, # Remove direct user assignment
        )
        # Assign alert to specific roles
        photographer_role = Role.objects.get(name='photographer')
        manager_role = Role.objects.get(name='manager')
        alert.roles.add(photographer_role, manager_role)

    def perform_update(self, serializer):
        if not self.request.user.has_perm('print.change_photosession'):
            raise serializers.ValidationError({"detail": "ليس لديك صلاحية لتعديل جلسات التصوير."}) # Changed from "ليس لديك صلاحية لتعديل جلسات التصوير." to "ليس لديك صلاحية لتعديل جلسات التصوير."
        serializer.save()

    def perform_destroy(self, instance):
        if not self.request.user.has_perm('print.delete_photosession'):
            raise serializers.ValidationError({"detail": "ليس لديك صلاحية لحذف جلسات التصوير."}) # Changed from "ليس لديك صلاحية لحذف جلسات التصوير." to "ليس لديك صلاحية لحذف جلسات التصوير."
        instance.delete()

    @action(detail=True, methods=['post'], url_path='add-payment')
    def add_payment(self, request, pk=None):
        if not self.request.user.has_perm('print.add_paymentreceipt'):
            return Response({'detail': 'ليس لديك صلاحية لإضافة دفعات.'}, status=status.HTTP_403_FORBIDDEN)
        photo_session = self.get_object()
        amount = request.data.get('amount')
        payment_method = request.data.get('payment_method', 'cash')
        notes = request.data.get('notes', '')

        if not amount or not isinstance(amount, (int, float, str)) or Decimal(str(amount)) <= 0:
            return Response({'detail': 'مبلغ الدفعة مطلوب ويجب أن يكون رقماً موجباً.'}, status=status.HTTP_400_BAD_REQUEST)

        amount = Decimal(str(amount))

        if amount > photo_session.remaining_amount:
            return Response({'detail': f'المبلغ المدفوع ({amount}) يتجاوز المبلغ المتبقي ({photo_session.remaining_amount}).'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            PaymentReceipt.objects.create(
                receipt_type='photography',
                photography_session=photo_session,
                total_amount=photo_session.total_amount, # NEW: Pass total_amount
                paid_amount=amount, # Changed from amount to paid_amount
                payment_method=payment_method,
                notes=notes,
                issued_by=request.user
            )

            photo_session.paid_amount += amount
            if photo_session.remaining_amount <= 0:
                photo_session.financial_status = 'paid'
            photo_session.save()

            # Note: The original code returned a serializer for 'receipt'.
            # Since we just created a receipt, we should fetch and serialize it.
            # Or, if the frontend doesn't strictly need the receipt object back,
            # we can just return a success message. For now, let's simplify.
            return Response({'detail': 'تمت إضافة الدفعة بنجاح.', 'new_paid_amount': photo_session.paid_amount}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'], url_path='payment-receipts')
    def payment_receipts_list(self, request, pk=None):
        photo_session = self.get_object()
        receipts = photo_session.payment_receipts.all().order_by('-date_issued')
        serializer = PaymentReceiptSerializer(receipts, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='generate-booking-receipt')
    def generate_booking_receipt(self, request, pk=None):
        if not self.request.user.has_perm('print.view_photosession'): # Or a more specific permission
            return Response({'detail': 'ليس لديك صلاحية لإنشاء إيصالات الحجز.'}, status=status.HTTP_403_FORBIDDEN)
        photo_session = self.get_object()
        company_info = {
            'name': 'استوديو الإبداع',
            'address': 'شارع الفن، مدينة الإبداع، 12345',
            'phone': '01001234567',
            'email': 'info@creative-studio.com',
            'website': 'www.creative-studio.com',
            'tax_id': 'VAT123456789',
        }
        company_logo_static_url = staticfiles_storage.url('images/logo.png')
        qr_data = f"Booking: {photo_session.receipt_number}\nClient: {photo_session.client.name}\nDate: {photo_session.session_date}\nPaid: {photo_session.paid_amount}"
        qr_code_base64 = generate_qr_code_base64(qr_data) # Use helper function

        context = {
            'photo_session': photo_session,
            'client': photo_session.client,
            'company': company_info,
            'company_logo_absolute_url': company_logo_static_url,
            'qr_code_base64': qr_code_base64,
            'receipts': photo_session.payment_receipts.all().order_by('date_issued'),
            'booking_receipt_color': '#FFD700',
        }
        html_string = render_to_string('print/photo_booking_receipt_template.html', context)
        html = HTML(string=html_string, base_url=request.build_absolute_uri('/'))
        pdf_file = html.write_pdf()
        response = HttpResponse(pdf_file, content_type='application/pdf')
        file_name = f"booking_receipt_photosession_{photo_session.receipt_number}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{file_name}"'
        return response

    @action(detail=True, methods=['get'], url_path='generate-final-invoice')
    def generate_final_invoice(self, request, pk=None):
        if not self.request.user.has_perm('print.view_photosession'): # Or a more specific permission
            return Response({'detail': 'ليس لديك صلاحية لإنشاء الفواتير.'}, status=status.HTTP_403_FORBIDDEN)
        photo_session = self.get_object()
        if photo_session.remaining_amount > 0:
            return Response({'detail': 'لا يمكن إنشاء فاتورة نهائية قبل دفع المبلغ بالكامل.'}, status=status.HTTP_400_BAD_REQUEST)

        company_info = {
            'name': 'استوديو الإبداع',
            'address': 'شارع الفن، مدينة الإبداع، 12345',
            'phone': '01001234567',
            'email': 'info@creative-studio.com',
            'website': 'www.creative-studio.com',
            'tax_id': 'VAT123456789',
        }
        company_logo_static_url = staticfiles_storage.url('images/logo.png')
        qr_data = f"Photo Session: {photo_session.receipt_number}\nClient: {photo_session.client.name}\nTotal: {photo_session.total_amount}\nPaid: {photo_session.paid_amount}"
        qr_code_base64 = generate_qr_code_base64(qr_data) # Use helper function

        context = {
            'photo_session': photo_session,
            'client': photo_session.client,
            'company': company_info,
            'company_logo_absolute_url': company_logo_static_url,
            'qr_code_base64': qr_code_base64,
            'receipts': photo_session.payment_receipts.all().order_by('date_issued'),
            'final_receipt_color': '#ADD8E6',
        }
        html_string = render_to_string('print/photo_final_receipt_template.html', context)
        html = HTML(string=html_string, base_url=request.build_absolute_uri('/'))
        pdf_file = html.write_pdf()
        response = HttpResponse(pdf_file, content_type='application/pdf')
        file_name = f"final_receipt_photosession_{photo_session.receipt_number}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{file_name}"'
        return response

# ===========================================================================
# ViewSet لملفات التعريف (Profiles) - يستخدم بشكل أساسي لإدارة الأدوار
# ===========================================================================
from .permissions import CanChangeUserPermissions

class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated, CanChangeUserPermissions]

    @action(detail=True, methods=['get', 'put'], url_path='permissions')
    def permissions(self, request, pk=None):
        role = self.get_object()
        group, created = Group.objects.get_or_create(name=role.name)

        if request.method == 'GET':
            # Return all permissions associated with this role's group
            serializer = PermissionSerializer(group.permissions.all(), many=True)
            return Response(serializer.data)

        elif request.method == 'PUT':
            # Update permissions for this role's group
            permission_codenames = request.data.get('permissions', []) # Expects a list of codenames
            if not isinstance(permission_codenames, list):
                return Response({'detail': "'permissions' must be a list of permission codenames."}, status=status.HTTP_400_BAD_REQUEST)

            # Clear existing permissions and set new ones
            group.permissions.clear()
            for codename in permission_codenames:
                try:
                    app_label, codename_only = codename.split('.')
                    permission = Permission.objects.get(codename=codename_only, content_type__app_label=app_label)
                    group.permissions.add(permission)
                except Permission.DoesNotExist:
                    return Response({'detail': f'Permission with codename {codename} does not exist.'}, status=status.HTTP_400_BAD_REQUEST)
                except ValueError:
                    return Response({'detail': f'Invalid permission codename format: {codename}. Expected app_label.codename.'}, status=status.HTTP_400_BAD_REQUEST)

            serializer = GroupSerializer(group) # Re-serialize the group to show updated permissions
            return Response(serializer.data)


# ===========================================================================
# ViewSet لملفات التعريف (Profiles) - يستخدم بشكل أساسي لإدارة الأدوار
# ===========================================================================
class ProfileViewSet(viewsets.ModelViewSet):
    queryset = Profile.objects.all().select_related('user').order_by('user__username')
    serializer_class = ProfileSerializer
    permission_classes = [IsAdminUser]
    filterset_fields = ['roles__name', 'user__username']


# ===========================================================================
# ViewSet للتنبيهات (Alerts)
# ===========================================================================
class AlertViewSet(viewsets.ModelViewSet):
    queryset = Alert.objects.all()
    serializer_class = AlertSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """ 
        This view should return a list of all the alerts
        for the currently authenticated user based on their roles.
        """
        user_roles = self.request.user.profile.roles.all()
        alerts = Alert.objects.filter(roles__in=user_roles).order_by('-created_at').distinct()
        print(f"DEBUG: get_queryset for user {self.request.user.username} (roles: {user_roles}) returning {alerts.count()} alerts.")
        return alerts

    @action(detail=True, methods=['post'], url_path='mark-as-read')
    def mark_as_read(self, request, pk=None):
        alert = self.get_object()
        alert.is_read = True
        alert.save()
        return Response(status=status.HTTP_204_NO_CONTENT)