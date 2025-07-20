# C:\Users\SAMAH\Downloads\api\stapi\print\admin.py

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin # استيراد UserAdmin الأصلي
from django.contrib.auth.models import User
# استيراد النماذج الجديدة: PhotographyPackage, Photographer, PhotoSession
from .models import Client, PrintJob, PaymentReceipt, Profile, PhotographyPackage, Photographer, PhotoSession

    # ===========================================================================
    # تسجيل النماذج في لوحة الإدارة
    # ===========================================================================

    # تسجيل نموذج العميل
@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ('name', 'phone', 'email', 'created_at')
    search_fields = ('name', 'phone', 'email')
    list_filter = ('created_at',)
    ordering = ('-created_at',)

    # تسجيل نموذج طلب الطباعة
@admin.register(PrintJob)
class PrintJobAdmin(admin.ModelAdmin):
    list_display = ('receipt_number', 'client', 'print_type', 'size', 'total_amount', 'paid_amount', 'remaining_amount', 'status', 'delivery_date', 'issued_by')
    list_filter = ('status', 'print_type', 'size', 'delivery_date')
    search_fields = ('receipt_number', 'client__name', 'notes', 'issued_by')
    raw_id_fields = ('client',) # لتحسين أداء اختيار العميل إذا كان هناك عدد كبير من العملاء
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)
    readonly_fields = ('remaining_amount', 'receipt_number', 'issued_by') # جعل هذه الحقول للقراءة فقط في لوحة الإدارة

    # تسجيل نموذج إيصال الدفع
@admin.register(PaymentReceipt)
class PaymentReceiptAdmin(admin.ModelAdmin):
    # تم إزالة 'booking' من list_display و raw_id_fields
    list_display = ('receipt_number', 'receipt_type', 'printing', 'total_amount', 'paid_amount', 'payment_method', 'issued_by', 'date_issued')
    list_filter = ('receipt_type', 'payment_method', 'date_issued')
    search_fields = ('receipt_number', 'issued_by', 'notes')
    raw_id_fields = ('printing',) # تم إزالة 'booking'
    ordering = ('-date_issued',)
    readonly_fields = ('date_issued',) # تاريخ الإصدار يتم تعيينه تلقائياً

    # ===========================================================================
    # تسجيل نماذج قسم التصوير الجديدة (جديد)
    # ===========================================================================

@admin.register(PhotographyPackage)
class PhotographyPackageAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'num_photos_digital', 'num_photos_printed', 'includes_album', 'includes_frame')
    search_fields = ('name', 'description')
    list_filter = ('includes_album', 'includes_frame')
    ordering = ('name',)

@admin.register(Photographer)
class PhotographerAdmin(admin.ModelAdmin):
    list_display = ('name', 'phone', 'email', 'specialization')
    search_fields = ('name', 'phone', 'email', 'specialization')
    ordering = ('name',)

@admin.register(PhotoSession)
class PhotoSessionAdmin(admin.ModelAdmin):
    list_display = ('receipt_number', 'client', 'package', 'photographer', 'session_date', 'total_amount', 'paid_amount', 'remaining_amount', 'status', 'issued_by')
    list_filter = ('status', 'session_date', 'package', 'photographer')
    search_fields = ('receipt_number', 'client__name', 'location', 'notes')
    raw_id_fields = ('client', 'package', 'photographer') # لتحسين الأداء
    date_hierarchy = 'session_date'
    ordering = ('-session_date', '-session_time')
    readonly_fields = ('remaining_amount', 'receipt_number', 'issued_by') # جعل هذه الحقول للقراءة فقط

    # ===========================================================================
    # دمج Profile مع User في لوحة الإدارة
    # ===========================================================================

    # تعريف Inline لنموذج Profile
class ProfileInline(admin.StackedInline): # أو admin.TabularInline إذا كنت تفضل تخطيطًا مضغوطًا
    model = Profile
    can_delete = False # لا تسمح بحذف ملف التعريف بشكل منفصل عن المستخدم
    verbose_name_plural = 'الملف الشخصي' # اسم القسم في لوحة الإدارة

    # إعادة تسجيل نموذج User في لوحة الإدارة لإضافة ProfileInline
class UserAdmin(BaseUserAdmin):
    inlines = (ProfileInline,) # إضافة الـ inline هنا
    # يمكنك تخصيص list_display, fieldsets, add_fieldsets هنا إذا أردت
    # للحفاظ على حقول User الأصلية، يمكنك نسخها من BaseUserAdmin
        # مثال:
        # list_display = BaseUserAdmin.list_display + ('is_staff', 'is_active', 'profile_role')
        # def profile_role(self, obj):
        #     return obj.profile.get_role_display()
        # profile_role.short_description = 'الدور'
        
        # إذا كنت تريد إضافة حقل الدور إلى قائمة العرض للمستخدمين
    def get_list_display(self, request):
            # إضافة 'profile_role' إلى قائمة العرض الافتراضية
        return BaseUserAdmin.list_display + ('profile_role',)

    def profile_role(self, obj):
            # التأكد من وجود ملف تعريف قبل محاولة الوصول إلى الدور
        return obj.profile.get_role_display() if hasattr(obj, 'profile') else 'غير محدد'
    profile_role.short_description = 'الدور'


    # إلغاء تسجيل UserAdmin الأصلي وإعادة تسجيله بنسختنا المخصصة
admin.site.unregister(User)
admin.site.register(User, UserAdmin)

    # تسجيل نموذج Booking (إذا كان موجودًا)
    # @admin.register(Booking)
    # class BookingAdmin(admin.ModelAdmin):
    #     list_display = ('client', 'booking_date', 'booking_time', 'service_type', 'total_amount', 'paid_amount', 'status')
    #     list_filter = ('status', 'booking_date', 'service_type')
    #     search_fields = ('client__name', 'notes')
    #     raw_id_fields = ('client',)
    #     date_hierarchy = 'booking_date'
    #     ordering = ('-booking_date', '-booking_time')
