# C:\Users\SAMAH\Downloads\api\stapi\print\models.py

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from decimal import Decimal # Import Decimal for financial calculations

# ===========================================================================
# نموذج الملف الشخصي للمستخدم (لربط الدور بالمستخدم)
# ===========================================================================
class Profile(models.Model):
    USER_ROLES = (
        ('manager', 'مدير'),
        ('employee', 'موظف'),
    )
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=10, choices=USER_ROLES, default='employee')

    def __str__(self):
        return f"{self.user.username}'s Profile ({self.get_role_display()})"

# ===========================================================================
# نموذج العميل
# ===========================================================================
class Client(models.Model):
    name = models.CharField(max_length=255, verbose_name='اسم العميل')
    phone = models.CharField(max_length=20, unique=True, blank=True, null=True, verbose_name='رقم الهاتف')
    email = models.EmailField(max_length=255, blank=True, null=True, verbose_name='البريد الإلكتروني')
    address = models.TextField(blank=True, null=True, verbose_name='العنوان')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاريخ الإنشاء')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='تاريخ آخر تحديث')

    class Meta:
        verbose_name = 'العميل'
        verbose_name_plural = 'العملاء'
        ordering = ['-created_at']

    def __str__(self):
        return self.name

# ===========================================================================
# نموذج طلب الطباعة
# ===========================================================================
class PrintJob(models.Model):
    STATUS_CHOICES = (
        ('pending', 'قيد الانتظار'),
        ('in_progress', 'قيد التنفيذ'),
        ('completed', 'مكتملة'),
        ('ready_for_delivery', 'جاهزة للتسليم'),
        ('delivered', 'تم التسليم'),
        ('cancelled', 'ملغاة'),
        ('partially_paid', 'مدفوعة جزئياً'), # حالة جديدة
    )
    PRINT_TYPE_CHOICES = (
        ('digital', 'طباعة رقمية'),
        ('offset', 'طباعة أوفست'),
        ('large_format', 'طباعة كبيرة الحجم'),
        ('screen_printing', 'طباعة سلك سكرين'),
        ('other', 'أخرى'),
    )
    SIZE_CHOICES = (
        ('A4', 'A4'),
        ('A3', 'A3'),
        ('A2', 'A2'),
        ('A1', 'A1'),
        ('custom', 'مقاس خاص'),
    )

    receipt_number = models.CharField(max_length=50, unique=True, blank=True, null=True, verbose_name='رقم الإيصال')
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='print_jobs', verbose_name='العميل')
    print_type = models.CharField(max_length=50, choices=PRINT_TYPE_CHOICES, verbose_name='نوع الطباعة')
    size = models.CharField(max_length=50, choices=SIZE_CHOICES, verbose_name='المقاس')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='المبلغ الإجمالي')
    paid_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, verbose_name='المبلغ المدفوع')
    delivery_date = models.DateField(verbose_name='تاريخ التسليم المتوقع')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name='الحالة')
    notes = models.TextField(blank=True, null=True, verbose_name='ملاحظات')
    issued_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='issued_print_jobs', verbose_name='صدر عن')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاريخ الإنشاء')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='تاريخ آخر تحديث')

    class Meta:
        verbose_name = 'طلب طباعة'
        verbose_name_plural = 'طلبات الطباعة'
        ordering = ['-created_at']

    def __str__(self):
        return f"طلب طباعة #{self.receipt_number or self.id} - {self.client.name}"

    @property
    def remaining_amount(self):
        return self.total_amount - self.paid_amount

    def save(self, *args, **kwargs):
        if not self.receipt_number:
            # توليد رقم إيصال فريد بناءً على التاريخ والوقت ومعرف الكائن
            now = timezone.now()
            # حفظ مبدئي للحصول على self.id
            super().save(*args, **kwargs) 
            self.receipt_number = f"PRN-{now.strftime('%Y%m%d%H%M%S')}-{self.id}"
            self.save(update_fields=['receipt_number']) # حفظ مرة أخرى لتحديث رقم الإيصال
        else:
            super().save(*args, **kwargs)

# ===========================================================================
# نموذج باقة التصوير (جديد) - تم إضافة الحقول هنا
# ===========================================================================
class PhotographyPackage(models.Model):
    name = models.CharField(max_length=255, verbose_name='اسم الباقة')
    description = models.TextField(blank=True, null=True, verbose_name='الوصف')
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='السعر')
    # الحقول التي كانت مفقودة وتسببت في الخطأ:
    num_photos_digital = models.IntegerField(default=0, verbose_name='عدد الصور الرقمية المضمنة')
    num_photos_printed = models.IntegerField(default=0, verbose_name='عدد الصور المطبوعة المضمنة')
    includes_album = models.BooleanField(default=False, verbose_name='يتضمن ألبوم')
    includes_frame = models.BooleanField(default=False, verbose_name='يتضمن إطار')
    
    is_active = models.BooleanField(default=True, verbose_name='نشطة')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاريخ الإنشاء')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='تاريخ آخر تحديث')

    class Meta:
        verbose_name = 'باقة تصوير'
        verbose_name_plural = 'باقات التصوير'
        ordering = ['name']

    def __str__(self):
        return self.name

# ===========================================================================
# نموذج المصور (جديد)
# ===========================================================================
class Photographer(models.Model):
    name = models.CharField(max_length=255, verbose_name='اسم المصور')
    phone = models.CharField(max_length=20, blank=True, null=True, unique=True, verbose_name='رقم الهاتف')
    email = models.EmailField(max_length=255, blank=True, null=True, verbose_name='البريد الإلكتروني')
    specialization = models.CharField(max_length=100, blank=True, null=True, verbose_name='التخصص')
    is_active = models.BooleanField(default=True, verbose_name='نشط')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاريخ الإنشاء')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='تاريخ آخر تحديث')

    class Meta:
        verbose_name = 'المصور'
        verbose_name_plural = 'المصورون'
        ordering = ['name']

    def __str__(self):
        return self.name

# ===========================================================================
# نموذج جلسة التصوير (تعديلات وإضافات جديدة)
# ===========================================================================
class PhotoSession(models.Model):
    STATUS_CHOICES = (
        ('scheduled', 'مجدولة'),
        ('in_progress', 'قيد التنفيذ'),
        ('completed', 'مكتملة'),
        ('delivered', 'تم التسليم'),
        ('cancelled', 'ملغاة'),
        ('processing', 'قيد المعالجة'), 
        ('ready_for_delivery', 'جاهزة للتسليم'), 
        ('partially_paid', 'مدفوعة جزئياً'), 
    )
    # خيارات جديدة لحالة التعديل/المعالجة
    EDITING_STATUS_CHOICES = (
        ('not_started', 'لم تبدأ'),
        ('in_shooting', 'قيد التصوير'), 
        ('in_editing', 'قيد التعديل'),
        ('in_printing', 'قيد الطباعة'), 
        ('completed', 'تم الانتهاء'),
    )
    # خيارات جديدة لنوع الحدث/التصوير
    EVENT_TYPE_CHOICES = (
        ('wedding', 'زفاف'),
        ('portrait', 'بورتريه'),
        ('product', 'منتجات'),
        ('event', 'فعالية'),
        ('other', 'أخرى'),
    )

    receipt_number = models.CharField(max_length=50, unique=True, blank=True, null=True, verbose_name='رقم إيصال الجلسة')
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='photo_sessions', verbose_name='العميل')
    package = models.ForeignKey(PhotographyPackage, on_delete=models.SET_NULL, null=True, blank=True, related_name='sessions', verbose_name='الباقة')
    photographer = models.ForeignKey(Photographer, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_sessions', verbose_name='المصور المعين')
    session_date = models.DateField(verbose_name='تاريخ الجلسة')
    session_time = models.TimeField(blank=True, null=True, verbose_name='وقت الجلسة')
    location = models.CharField(max_length=255, blank=True, null=True, verbose_name='الموقع')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='المبلغ الإجمالي')
    paid_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, verbose_name='المبلغ المدفوع')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled', verbose_name='الحالة')
    notes = models.TextField(blank=True, null=True, verbose_name='ملاحظات')
    
    # --- الحقول الجديدة المتفق عليها ---
    event_type = models.CharField(max_length=50, choices=EVENT_TYPE_CHOICES, blank=True, null=True, verbose_name='نوع الحدث/التصوير')
    final_delivery_date = models.DateField(blank=True, null=True, verbose_name='تاريخ التسليم النهائي')
    num_digital_photos_delivered = models.IntegerField(default=0, blank=True, null=True, verbose_name='عدد الصور الرقمية المسلمة')
    num_printed_photos_delivered = models.IntegerField(default=0, blank=True, null=True, verbose_name='عدد الصور المطبوعة المسلمة')
    photo_serial_number = models.CharField(max_length=100, blank=True, null=True, verbose_name='رقم مسلسل الصورة')
    final_gallery_link = models.URLField(max_length=255, blank=True, null=True, verbose_name='رابط المعرض النهائي')
    editing_status = models.CharField(max_length=20, choices=EDITING_STATUS_CHOICES, default='not_started', verbose_name='حالة التعديل/المعالجة')
    agreement_notes = models.TextField(blank=True, null=True, verbose_name='ملاحظات الاتفاقية')
    # --- نهاية الحقول الجديدة ---

    digital_photos_delivered = models.BooleanField(default=False, verbose_name='تم تسليم الصور الرقمية')
    printed_photos_delivered = models.BooleanField(default=False, verbose_name='تم تسليم الصور المطبوعة')
    album_delivered = models.BooleanField(default=False, verbose_name='تم تسليم الألبوم')
    frame_delivered = models.BooleanField(default=False, verbose_name='تم تسليم الإطار')
    issued_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='issued_photo_sessions', verbose_name='صدر عن')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاريخ الإنشاء')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='تاريخ آخر تحديث')

    class Meta:
        verbose_name = 'جلسة تصوير'
        verbose_name_plural = 'جلسات التصوير'
        ordering = ['-session_date', '-session_time']

    def __str__(self):
        return f"جلسة تصوير #{self.receipt_number or self.id} - {self.client.name} - {self.session_date}"

    @property
    def remaining_amount(self):
        return self.total_amount - self.paid_amount

    def save(self, *args, **kwargs):
        if not self.receipt_number:
            now = timezone.now()
            # حفظ مبدئي للحصول على self.id قبل توليد receipt_number
            super().save(*args, **kwargs) 
            self.receipt_number = f"PHO-{now.strftime('%Y%m%d%H%M%S')}-{self.id}"
            self.save(update_fields=['receipt_number']) # حفظ مرة أخرى لتحديث رقم الإيصال
        else:
            super().save(*args, **kwargs)

# ===========================================================================
# نموذج إيصال الدفع (تعديل: إضافة علاقة لجلسات التصوير)
# ===========================================================================
class PaymentReceipt(models.Model):
    RECEIPT_TYPE_CHOICES = (
        ('printing', 'طباعة'),
        ('photography', 'تصوير'), # نوع جديد
    )
    PAYMENT_METHOD_CHOICES = (
        ('cash', 'نقداً'),
        ('bank_transfer', 'تحويل بنكي'),
        ('mobile_money', 'دفع إلكتروني'),
        ('card', 'بطاقة ائتمان/خصم'),
        ('other', 'أخرى'),
    )

    receipt_number = models.CharField(max_length=50, unique=True, blank=True, null=True, verbose_name='رقم الإيصال')
    # علاقة ForeignKey لطلب الطباعة (اختيارية) - تم تغيير on_delete
    printing = models.ForeignKey(PrintJob, on_delete=models.SET_NULL, null=True, blank=True, related_name='payment_receipts', verbose_name='طلب الطباعة')
    # علاقة ForeignKey لجلسة التصوير (اختيارية) - تم تفعيلها وتغيير on_delete
    photography_session = models.ForeignKey(PhotoSession, on_delete=models.SET_NULL, null=True, blank=True, related_name='payment_receipts', verbose_name='جلسة التصوير')
    
    receipt_type = models.CharField(max_length=20, choices=RECEIPT_TYPE_CHOICES, verbose_name='نوع الإيصال')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='المبلغ الكلي للدفعة')
    paid_amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='المبلغ المدفوع فعلياً') 
    payment_method = models.CharField(max_length=50, choices=PAYMENT_METHOD_CHOICES, verbose_name='طريقة الدفع')
    notes = models.TextField(blank=True, null=True, verbose_name='ملاحظات')
    issued_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='issued_receipts', verbose_name='صدر عن')
    date_issued = models.DateTimeField(auto_now_add=True, verbose_name='تاريخ الإصدار')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='تاريخ آخر تحديث')

    class Meta:
        verbose_name = 'إيصال دفع'
        verbose_name_plural = 'إيصالات الدفع'
        ordering = ['-date_issued']

    def __str__(self):
        return f"إيصال #{self.receipt_number or self.id} - {self.paid_amount}"

    def save(self, *args, **kwargs):
        if not self.receipt_number:
            now = timezone.now()
            # توليد رقم إيصال بناءً على النوع
            if self.receipt_type == 'printing':
                prefix = "RCPT-PRN"
            elif self.receipt_type == 'photography':
                prefix = "RCPT-PHO"
            else:
                prefix = "RCPT" 
            
            # حفظ مبدئي للحصول على self.id قبل توليد receipt_number
            super().save(*args, **kwargs) 
            self.receipt_number = f"{prefix}-{now.strftime('%Y%m%d%H%M%S')}-{self.id}"
            self.save(update_fields=['receipt_number']) # حفظ مرة أخرى لتحديث رقم الإيصال
        else:
            super().save(*args, **kwargs)

# ===========================================================================
# نموذج التنبيهات (Alerts) - لم يتم استخدامه بعد ولكن معرف للرجوع إليه
# ===========================================================================
class Alert(models.Model):
    ALERT_TYPES = (
        ('low_stock', 'نقص مخزون'),
        ('overdue_payment', 'دفعة متأخرة'),
        ('new_job', 'طلب جديد'),
        ('other', 'أخرى'),
    )
    message = models.TextField(verbose_name='الرسالة')
    alert_type = models.CharField(max_length=50, choices=ALERT_TYPES, default='other', verbose_name='نوع التنبيه')
    is_read = models.BooleanField(default=False, verbose_name='تمت القراءة')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاريخ الإنشاء')
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='alerts', verbose_name='المستخدم المستهدف')

    class Meta:
        verbose_name = 'تنبيه'
        verbose_name_plural = 'تنبيهات'
        ordering = ['-created_at']

    def __str__(self):
        return f"تنبيه ({self.get_alert_type_display()}): {self.message[:50]}..."

# ===========================================================================
# نموذج الحجز (مثال - إذا كنت ستضيفه لاحقًا)
# ===========================================================================
# class Booking(models.Model):
#     client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='bookings', verbose_name='العميل')
#     booking_date = models.DateField(verbose_name='تاريخ الحجز')
#     booking_time = models.TimeField(verbose_name='وقت الحجز')
#     service_type = models.CharField(max_length=100, verbose_name='نوع الخدمة') 
#     total_amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='المبلغ الإجمالي للحجز')
#     paid_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, verbose_name='المبلغ المدفوع للحجز')
#     notes = models.TextField(blank=True, null=True, verbose_name='ملاحظات الحجز')
#     status = models.CharField(max_length=20, default='scheduled', verbose_name='حالة الحجز') 
#     issued_by = models.CharField(max_length=100, blank=True, null=True, verbose_name='صدر عن')
#     created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاريخ الإنشاء')
#     updated_at = models.DateTimeField(auto_now=True, verbose_name='آخر تحديث')

#     class Meta:
#         verbose_name = 'حجز'
#         verbose_name_plural = 'الحجوزات'
#         ordering = ['-created_at']

#     def __str__(self):
#         return f"حجز لـ {self.client.name} في {self.booking_date}"
