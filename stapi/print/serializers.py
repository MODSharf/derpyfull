# stapi/print/serializers.py

from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Client, PrintJob, PaymentReceipt, Profile, PhotographyPackage, Photographer, PhotoSession # تم إضافة نماذج التصوير

# ===========================================================================
# 1. User Serializer (لجلب بيانات المستخدم الأساسية وإنشاء/تحديث Profile)
# ===========================================================================
class UserSerializer(serializers.ModelSerializer):
    # يعرض دور المستخدم المقروء بشريًا من Profile
    profile_role_display = serializers.CharField(source='profile.get_role_display', read_only=True)
    # حقل لكتابة الدور عند إنشاء/تحديث المستخدم
    role = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile_role_display', 'role', 'password']
        extra_kwargs = {
            'password': {'write_only': True, 'required': False},
            'email': {'required': False, 'allow_blank': True},
            'first_name': {'required': False, 'allow_blank': True},
            'last_name': {'required': False, 'allow_blank': True},
        }
        # profile_role_display هو حقل للقراءة فقط يعرض الدور
        read_only_fields = ['profile_role_display']

    def create(self, validated_data):
        role = validated_data.pop('role', 'employee') # الدور الافتراضي هو 'employee'
        password = validated_data.pop('password', None)
        user = User.objects.create(**validated_data)
        if password:
            user.set_password(password)
            user.save()
        Profile.objects.create(user=user, role=role)
        return user

    def update(self, instance, validated_data):
        # التعامل مع تحديث الدور
        role = validated_data.pop('role', None)
        if role:
            profile, created = Profile.objects.get_or_create(user=instance)
            profile.role = role
            profile.save()

        # التعامل مع تحديث كلمة المرور
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)

        # تحديث حقول المستخدم الأخرى
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

# ===========================================================================
# 2. Profile Serializer (لإدارة ملفات تعريف المستخدمين - يستخدم بشكل أساسي داخليًا)
# ===========================================================================
class ProfileSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True) # يعرض اسم المستخدم
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = Profile
        fields = ['id', 'user', 'role', 'role_display']
        read_only_fields = ['user']

# ===========================================================================
# 3. Client Serializer
# ===========================================================================
class ClientSerializer(serializers.ModelSerializer):
    total_remaining_amount_on_jobs = serializers.SerializerMethodField()

    class Meta:
        model = Client
        fields = [
            'id', 'name', 'phone', 'email', 'address', 'created_at', 'updated_at',
            'total_remaining_amount_on_jobs',
        ]

    def get_total_remaining_amount_on_jobs(self, obj):
        total_print_remaining = sum(job.remaining_amount for job in obj.print_jobs.all())
        total_photo_remaining = sum(session.remaining_amount for session in obj.photo_sessions.all())
        return total_print_remaining + total_photo_remaining


# ===========================================================================
# 4. Photography Package Serializer
# ===========================================================================
class PhotographyPackageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PhotographyPackage
        fields = '__all__'

# ===========================================================================
# 5. Photographer Serializer
# ===========================================================================
class PhotographerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Photographer
        fields = '__all__'

# ===========================================================================
# 6. Payment Receipt Serializer
# ===========================================================================
class PaymentReceiptSerializer(serializers.ModelSerializer):
    get_payment_method_display = serializers.CharField(read_only=True)
    get_receipt_type_display = serializers.CharField(read_only=True)

    printing_id = serializers.PrimaryKeyRelatedField(source='printing', read_only=True)
    printing_receipt_number = serializers.CharField(source='printing.receipt_number', read_only=True)
    printing_total_amount = serializers.DecimalField(source='printing.total_amount', max_digits=10, decimal_places=2, read_only=True)
    printing_paid_amount = serializers.DecimalField(source='printing.paid_amount', max_digits=10, decimal_places=2, read_only=True)
    printing_remaining_amount = serializers.DecimalField(source='printing.remaining_amount', max_digits=10, decimal_places=2, read_only=True)

    issued_by_username = serializers.CharField(source='issued_by.username', read_only=True)

    photography_session_id = serializers.PrimaryKeyRelatedField(source='photography_session', read_only=True)
    photography_session_receipt_number = serializers.CharField(source='photography_session.receipt_number', read_only=True)
    photography_session_total_amount = serializers.DecimalField(source='photography_session.total_amount', max_digits=10, decimal_places=2, read_only=True)
    photography_session_paid_amount = serializers.DecimalField(source='photography_session.paid_amount', max_digits=10, decimal_places=2, read_only=True)
    photography_session_remaining_amount = serializers.DecimalField(source='photography_session.remaining_amount', max_digits=10, decimal_places=2, read_only=True)


    class Meta:
        model = PaymentReceipt
        fields = [
            'id', 'receipt_number', 'receipt_type', 'get_receipt_type_display',
            'printing', 'total_amount', 'paid_amount', 'date_issued',
            'payment_method', 'get_payment_method_display', 'notes', 'issued_by',
            'issued_by_username',
            'printing_id', 'printing_receipt_number', 'printing_total_amount',
            'printing_paid_amount', 'printing_remaining_amount',
            'photography_session_id', 'photography_session_receipt_number',
            'photography_session_total_amount', 'photography_session_paid_amount',
            'photography_session_remaining_amount',
        ]
        read_only_fields = ['receipt_number', 'date_issued', 'issued_by']


# ===========================================================================
# 7. Print Job Serializer
# ===========================================================================
class PrintJobSerializer(serializers.ModelSerializer):
    client = ClientSerializer(read_only=True)
    client_id = serializers.PrimaryKeyRelatedField(queryset=Client.objects.all(), source='client', write_only=True)

    print_type_display = serializers.CharField(source='get_print_type_display', read_only=True)
    size_display = serializers.CharField(source='get_size_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    remaining_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    payment_receipts = PaymentReceiptSerializer(many=True, read_only=True)

    issued_by_username = serializers.CharField(source='issued_by.username', read_only=True)


    class Meta:
        model = PrintJob
        fields = [
            'id', 'receipt_number', 'client', 'client_id', 'print_type', 'print_type_display',
            'size', 'size_display', 'total_amount', 'paid_amount', 'remaining_amount',
            'delivery_date', 'status', 'status_display', 'notes', 'issued_by',
            'issued_by_username', 'created_at', 'updated_at', 'payment_receipts'
        ]
        read_only_fields = ['receipt_number', 'created_at', 'updated_at', 'issued_by', 'remaining_amount']

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if not representation.get('client'):
            representation['client'] = None
        return representation

# ===========================================================================
# 8. Photo Session Serializer
# ===========================================================================
class PhotoSessionSerializer(serializers.ModelSerializer):
    client = ClientSerializer(read_only=True)
    client_id = serializers.PrimaryKeyRelatedField(queryset=Client.objects.all(), source='client', write_only=True)

    package = PhotographyPackageSerializer(read_only=True)
    package_id = serializers.PrimaryKeyRelatedField(queryset=PhotographyPackage.objects.all(), source='package', write_only=True, required=False, allow_null=True)

    photographer = PhotographerSerializer(read_only=True)
    photographer_id = serializers.PrimaryKeyRelatedField(queryset=Photographer.objects.all(), source='photographer', write_only=True, required=False, allow_null=True)

    status_display = serializers.CharField(source='get_status_display', read_only=True)
    event_type_display = serializers.CharField(source='get_event_type_display', read_only=True)
    editing_status_display = serializers.CharField(source='get_editing_status_display', read_only=True)

    remaining_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    issued_by_username = serializers.CharField(source='issued_by.username', read_only=True)

    class Meta:
        model = PhotoSession
        fields = [
            'id', 'receipt_number', 'client', 'client_id', 'package', 'package_id',
            'photographer', 'photographer_id', 'session_date', 'session_time',
            'location', 'total_amount', 'paid_amount', 'remaining_amount',
            'status', 'status_display', 'notes',
            'event_type', 'event_type_display',
            'final_delivery_date',
            'num_digital_photos_delivered',
            'num_printed_photos_delivered',
            'photo_serial_number',
            'final_gallery_link',
            'editing_status', 'editing_status_display',
            'agreement_notes',
            'digital_photos_delivered',
            'printed_photos_delivered', 'album_delivered', 'frame_delivered',
            'issued_by', 'issued_by_username', 'created_at', 'updated_at'
        ]
        read_only_fields = ['receipt_number', 'created_at', 'updated_at', 'issued_by', 'remaining_amount']

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if not representation.get('client'):
            representation['client'] = None
        if not representation.get('package'):
            representation['package'] = None
        if not representation.get('photographer'):
            representation['photographer'] = None
        return representation
