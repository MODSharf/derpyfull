# C:\Users\SAMAH\Downloads\api\stapi\print\api_views.py

from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, IsAdminUser
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

from django.contrib.auth.models import User
from django.db import models
from django.db.models import Q

# استيراد النماذج
from .models import Client, PrintJob, PaymentReceipt, Profile, PhotographyPackage, Photographer, PhotoSession
# استيراد Serializers
from .serializers import (
    ClientSerializer, PrintJobSerializer, PaymentReceiptSerializer, UserSerializer,
    ProfileSerializer, PhotographyPackageSerializer, PhotographerSerializer, PhotoSessionSerializer
)

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
        if self.request.user.is_staff or (hasattr(self.request.user, 'profile') and self.request.user.profile.role == 'manager'):
            return User.objects.all().select_related('profile').order_by('username')
        return User.objects.filter(id=self.request.user.id).select_related('profile')

    def perform_create(self, serializer):
        if not (self.request.user.is_staff or (hasattr(self.request.user, 'profile') and self.request.user.profile.role == 'manager')):
            raise serializers.ValidationError({"detail": "ليس لديك صلاحية لإنشاء مستخدمين."})
        role = self.request.data.get('role', 'employee')
        if role == 'manager' and not (self.request.user.is_staff or (hasattr(self.request.user, 'profile') and self.request.user.profile.role == 'manager')):
            raise serializers.ValidationError({"detail": "ليس لديك صلاحية لإنشاء مستخدم بدور مدير."})
        serializer.save()

    def perform_update(self, serializer):
        is_manager = self.request.user.is_staff or (hasattr(self.request.user, 'profile') and self.request.user.profile.role == 'manager')
        if self.get_object() != self.request.user and not is_manager:
            raise serializers.ValidationError({"detail": "ليس لديك صلاحية لتعديل مستخدمين آخرين."})

        if 'role' in self.request.data:
            new_role = self.request.data['role']
            current_user_profile = self.get_object().profile if hasattr(self.get_object(), 'profile') else None
            current_user_role = current_user_profile.role if current_user_profile else None

            if not is_manager:
                if new_role != current_user_role:
                    raise serializers.ValidationError({"detail": "ليس لديك صلاحية لتغيير دور المستخدم."})
            else:
                if self.get_object() == self.request.user and new_role == 'employee':
                    if User.objects.filter(profile__role='manager').count() <= 1:
                        raise serializers.ValidationError({"detail": "يجب أن يكون هناك مدير واحد على الأقل في النظام."})
        serializer.save()

    def perform_destroy(self, instance):
        if not (self.request.user.is_staff or (hasattr(self.request.user, 'profile') and self.request.user.profile.role == 'manager')):
            raise serializers.ValidationError({"detail": "ليس لديك صلاحية لحذف المستخدمين."})
        if hasattr(instance, 'profile') and instance.profile.role == 'manager':
            if User.objects.filter(profile__role='manager').count() <= 1:
                raise serializers.ValidationError({"detail": "لا يمكن حذف المدير الأخير في النظام."})
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
        queryset = super().get_queryset()
        search_term = self.request.query_params.get('search', None)
        if search_term:
            queryset = queryset.filter(
                Q(name__icontains=search_term) |
                Q(phone__icontains=search_term) |
                Q(email__icontains=search_term)
            )
        return queryset

    @action(detail=True, methods=['get'])
    def printjobs(self, request, pk=None):
        client = self.get_object()
        print_jobs = client.print_jobs.all()
        serializer = PrintJobSerializer(print_jobs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def receipts(self, request, pk=None):
        client = self.get_object()
        receipts = PaymentReceipt.objects.filter(Q(printing__client=client) | Q(photography_session__client=client)).distinct().order_by('-date_issued')
        serializer = PaymentReceiptSerializer(receipts, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='photosessions')
    def photosessions(self, request, pk=None):
        client = self.get_object()
        photo_sessions = client.photo_sessions.all().order_by('-created_at')
        serializer = PhotoSessionSerializer(photo_sessions, many=True)
        return Response(serializer.data) # Fixed: changed serializer_sessions to serializer

    @action(detail=True, methods=['get'], url_path='total-remaining-amount-combined')
    def total_remaining_amount_combined(self, request, pk=None):
        client = self.get_object()
        total_remaining_print_jobs = sum(job.remaining_amount for job in client.print_jobs.all())
        total_remaining_photo_sessions = sum(session.remaining_amount for session in client.photo_sessions.all())
        total_combined_remaining = total_remaining_print_jobs + total_remaining_photo_sessions
        return Response({'total_remaining_amount': total_combined_remaining})

# ===========================================================================
# ViewSet لطلبات الطباعة
# ===========================================================================
class PrintJobViewSet(viewsets.ModelViewSet):
    queryset = PrintJob.objects.all().select_related('client', 'issued_by').order_by('-created_at')
    serializer_class = PrintJobSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status', 'print_type', 'size', 'client__name', 'receipt_number']

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
        print_job = serializer.save(issued_by=self.request.user)
        initial_paid_amount = print_job.paid_amount
        if initial_paid_amount > 0:
            PaymentReceipt.objects.create(
                receipt_type='printing',
                printing=print_job,
                total_amount=print_job.total_amount, # NEW: Pass total_amount
                paid_amount=initial_paid_amount, # Changed from amount to paid_amount
                payment_method='cash',
                notes='دفعة أولية عند إنشاء طلب الطباعة',
                issued_by=self.request.user
            )

    def perform_update(self, serializer):
        serializer.save()

    @action(detail=True, methods=['post'], url_path='add-payment')
    def add_payment(self, request, pk=None):
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
                total_amount=print_job.total_amount, # NEW: Pass total_amount
                paid_amount=amount, # Changed from amount to paid_amount
                payment_method=payment_method,
                notes=notes,
                issued_by=request.user
            )

            print_job.paid_amount += amount
            if print_job.paid_amount >= print_job.total_amount:
                print_job.status = 'completed'
            elif print_job.paid_amount > 0 and print_job.paid_amount < print_job.total_amount:
                print_job.status = 'partially_paid'
            print_job.save()

            # Note: The original code returned a serializer for 'receipt'.
            # Since we just created a receipt, we should fetch and serialize it.
            # Or, if the frontend doesn't strictly need the receipt object back,
            # we can just return a success message. For now, let's simplify.
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
        qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_L, box_size=10, border=4)
        qr.add_data(qr_data)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        qr_code_base64 = base64.b64encode(buffer.getvalue()).decode()

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

    @action(detail=True, methods=['get'], url_path='payment-receipts')
    def payment_receipts_list(self, request, pk=None):
        print_job = self.get_object()
        receipts = print_job.payment_receipts.all().order_by('-date_issued')
        serializer = PaymentReceiptSerializer(receipts, many=True)
        return Response(serializer.data)


# ===========================================================================
# ViewSet لإيصالات الدفع
# ===========================================================================
class PaymentReceiptViewSet(viewsets.ModelViewSet):
    queryset = PaymentReceipt.objects.all().select_related('printing', 'photography_session', 'issued_by').order_by('-date_issued')
    serializer_class = PaymentReceiptSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['receipt_type', 'payment_method', 'issued_by__username', 'receipt_number']

    def perform_create(self, serializer):
        # NEW: Ensure total_amount and paid_amount are handled correctly for direct creation
        # If total_amount is not provided, it might default or need to be calculated
        # For simplicity, we assume it's provided in the serializer data or derived.
        # If creating directly, you might need to ensure these fields are in serializer.validated_data
        # or calculate them based on context.
        # For now, we'll assume the serializer handles it correctly.
        serializer.save(issued_by=self.request.user)

    @action(detail=True, methods=['get'], url_path='generate-pdf-receipt')
    def generate_pdf_receipt(self, request, pk=None):
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
        qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_L, box_size=10, border=4)
        qr.add_data(qr_data)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        qr_code_base64 = base64.b64encode(buffer.getvalue()).decode()

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
        if self.request.user.is_staff or (hasattr(self.request.user, 'profile') and self.request.user.profile.role == 'manager'):
            return PhotographyPackage.objects.all().order_by('price')
        raise Response({"detail": "ليس لديك صلاحية لعرض باقات التصوير."}, status=status.HTTP_403_FORBIDDEN)

    def perform_create(self, serializer):
        if not (self.request.user.is_staff or (hasattr(self.request.user, 'profile') and self.request.user.profile.role == 'manager')):
            raise serializers.ValidationError({"detail": "ليس لديك صلاحية لإنشاء باقات تصوير جديدة."})
        serializer.save()

    def perform_update(self, serializer):
        if not (self.request.user.is_staff or (hasattr(self.request.user, 'profile') and self.request.user.profile.role == 'manager')):
            raise serializers.ValidationError({"detail": "ليس لديك صلاحية لتعديل باقات التصوير."})
        serializer.save()

    def perform_destroy(self, instance):
        if not (self.request.user.is_staff or (hasattr(self.request.user, 'profile') and self.request.user.profile.role == 'manager')):
            raise serializers.ValidationError({"detail": "ليس لديك صلاحية لحذف باقات التصوير."})
        instance.delete()


# ===========================================================================
# ViewSet للمصورين
# ===========================================================================
class PhotographerViewSet(viewsets.ModelViewSet):
    queryset = Photographer.objects.all().order_by('name')
    serializer_class = PhotographerSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff or (hasattr(self.request.user, 'profile') and self.request.user.profile.role == 'manager'):
            return Photographer.objects.all().order_by('name')
        raise Response({"detail": "ليس لديك صلاحية لعرض المصورين."}, status=status.HTTP_403_FORBIDDEN)

    def perform_create(self, serializer):
        if not (self.request.user.is_staff or (hasattr(self.request.user, 'profile') and self.request.user.profile.role == 'manager')):
            raise serializers.ValidationError({"detail": "ليس لديك صلاحية لإنشاء مصورين جدد."})
        serializer.save()

    def perform_update(self, serializer):
        if not (self.request.user.is_staff or (hasattr(self.request.user, 'profile') and self.request.user.profile.role == 'manager')):
            raise serializers.ValidationError({"detail": "ليس لديك صلاحية لتعديل المصورين."})
        serializer.save()

    def perform_destroy(self, instance):
        if not (self.request.user.is_staff or (hasattr(self.request.user, 'profile') and self.request.user.profile.role == 'manager')):
            raise serializers.ValidationError({"detail": "ليس لديك صلاحية لحذف المصورين."})
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

    def perform_update(self, serializer):
        serializer.save()

    @action(detail=True, methods=['post'], url_path='add-payment')
    def add_payment(self, request, pk=None):
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
            if photo_session.paid_amount >= photo_session.total_amount:
                photo_session.status = 'completed'
            elif photo_session.paid_amount > 0 and photo_session.paid_amount < photo_session.total_amount:
                photo_session.status = 'partially_paid'
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
        qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_L, box_size=10, border=4)
        qr.add_data(qr_data)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        qr_code_base64 = base64.b64encode(buffer.getvalue()).decode()

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
        qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_L, box_size=10, border=4)
        qr.add_data(qr_data)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        qr_code_base64 = base64.b64encode(buffer.getvalue()).decode()

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
class ProfileViewSet(viewsets.ModelViewSet):
    queryset = Profile.objects.all().select_related('user').order_by('user__username')
    serializer_class = ProfileSerializer
    permission_classes = [IsAdminUser]
    filterset_fields = ['role', 'user__username']
