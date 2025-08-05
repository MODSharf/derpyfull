from django.utils import timezone
import re
from rest_framework import serializers
from django.contrib.auth.models import User, Permission, ContentType, Group

class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = '__all__'
 # Import Permission model
from django.contrib.contenttypes.models import ContentType
from .models import Client, PrintJob, PaymentReceipt, Profile, Role, PhotographyPackage, Photographer, PhotoSession, Alert, PrintJobItem


class PermissionSerializer(serializers.ModelSerializer):
    app_label = serializers.CharField(source='content_type.app_label', read_only=True)

    class Meta:
        model = Permission
        fields = ('id', 'name', 'codename', 'app_label')


class ContentTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContentType
        fields = ('id', 'app_label', 'model')


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = '__all__'


# ===========================================================================
# 1. User Serializer (لجلب بيانات المستخدم الأساسية وإنشاء/تحديث Profile)
# ===========================================================================
class UserSerializer(serializers.ModelSerializer):
    roles = serializers.SlugRelatedField(
        many=True,
        read_only=True,
        slug_field='name',
        source='profile.roles'
    )
    user_permissions = serializers.SerializerMethodField() # NEW: Field for user permissions
    is_staff = serializers.BooleanField(read_only=True) # NEW: Expose is_staff
    is_superuser = serializers.BooleanField(read_only=True) # NEW: Expose is_superuser

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'roles', 'password', 'is_staff', 'is_superuser', 'user_permissions']
        extra_kwargs = {
            'password': {'write_only': True, 'required': False},
            'email': {'required': False, 'allow_blank': True},
            'first_name': {'required': False, 'allow_blank': True},
            'last_name': {'required': False, 'allow_blank': True},
        }
        read_only_fields = ['roles', 'is_staff', 'is_superuser', 'user_permissions']

    def get_user_permissions(self, obj):
        # Get all permissions for the user, including those from groups/roles
        if obj.is_anonymous:
            return []
        return list(obj.get_all_permissions())

    def create(self, validated_data):
        roles_data = self.context['request'].data.get('roles', [])
        password = validated_data.pop('password', None)
        user = User.objects.create(**validated_data)
        if password:
            user.set_password(password)
            user.save()
        profile = Profile.objects.create(user=user)
        roles = Role.objects.filter(name__in=roles_data)
        profile.roles.set(roles)
        return user

    def update(self, instance, validated_data):
        roles_data = self.context['request'].data.get('roles')
        if roles_data is not None:
            profile = instance.profile
            roles = Role.objects.filter(name__in=roles_data)
            profile.roles.set(roles)

        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

# ===========================================================================
# 2. Profile Serializer (لإدارة ملفات تعريف المستخدمين - يستخدم بشكل أساسي داخليًا)
# ===========================================================================
class ProfileSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)
    roles = serializers.StringRelatedField(many=True, read_only=True)

    class Meta:
        model = Profile
        fields = ['id', 'user', 'roles']
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
    photography_session_paid_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    photography_session_remaining_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)


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
class PrintJobItemSerializer(serializers.ModelSerializer):
    print_type_display = serializers.CharField(source='get_print_type_display', read_only=True)
    size_display = serializers.CharField(source='get_size_display', read_only=True)
    material_display = serializers.CharField(source='get_material_display', read_only=True)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = PrintJobItem
        fields = '__all__'
        read_only_fields = ['print_job']


# ===========================================================================
# 7. Print Job Serializer
# ===========================================================================
class PrintJobSerializer(serializers.ModelSerializer):
    client = ClientSerializer(read_only=True)
    client_id = serializers.PrimaryKeyRelatedField(queryset=Client.objects.all(), source='client', write_only=True)

    status_display = serializers.CharField(source='get_status_display', read_only=True)
    financial_status_display = serializers.CharField(source='get_financial_status_display', read_only=True)

    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    paid_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    remaining_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    payment_receipts = PaymentReceiptSerializer(many=True, read_only=True)
    items = PrintJobItemSerializer(many=True, required=False) # Nested serializer for items

    issued_by_username = serializers.CharField(source='issued_by.username', read_only=True)

    class Meta:
        model = PrintJob
        fields = [
            'id', 'receipt_number', 'client', 'client_id', 
            'total_amount', 'paid_amount', 'remaining_amount',
            'delivery_date', 'status', 'status_display', 'notes', 'design_file_info', 
            'financial_status', 'financial_status_display', 'issued_by',
            'issued_by_username', 'created_at', 'updated_at', 'payment_receipts', 'items'
        ]
        read_only_fields = ['receipt_number', 'created_at', 'updated_at', 'issued_by', 'total_amount', 'paid_amount', 'remaining_amount']

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        
        # Create PrintJob instance first to get a primary key
        print_job = PrintJob.objects.create(**validated_data)
        
        # Create PrintJobItem instances and link them to the PrintJob
        for item_data in items_data:
            PrintJobItem.objects.create(print_job=print_job, **item_data)

        # Generate receipt number and update financial status after items are created
        if not print_job.receipt_number:
            now = timezone.now()
            print_job.receipt_number = f"PRN-{now.strftime('%Y%m%d%H%M%S')}-{print_job.id}"
        
        # Update financial status based on calculated total and paid amounts
        if print_job.total_amount > 0 and print_job.paid_amount >= print_job.total_amount:
            print_job.financial_status = 'completed'
        else:
            print_job.financial_status = 'incomplete'

        print_job.save(update_fields=['receipt_number', 'financial_status'])

        return print_job

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)

        # Update simple fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Handle nested items
        if items_data is not None:
            instance.items.all().delete() # Clear existing items
            for item_data in items_data:
                PrintJobItem.objects.create(print_job=instance, **item_data)

        # Update financial status after items are updated
        if instance.total_amount > 0 and instance.paid_amount >= instance.total_amount:
            instance.financial_status = 'completed'
        else:
            instance.financial_status = 'incomplete'

        instance.save() # Save to trigger financial_status update

        return instance

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
    financial_status = serializers.CharField(source='get_financial_status_display', read_only=True)

    remaining_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    issued_by_username = serializers.CharField(source='issued_by.username', read_only=True)

    def get_financial_status_display(self, obj):
        return obj.get_financial_status_display()

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
            'financial_status',
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

# ===========================================================================
# 9. Notification Serializer
# ===========================================================================
class AlertSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)
    related_object_details = serializers.SerializerMethodField()
    derived_status_category = serializers.SerializerMethodField()
    client_name = serializers.SerializerMethodField()
    next_action_status = serializers.SerializerMethodField()
    job_type_display = serializers.SerializerMethodField()

    class Meta:
        model = Alert
        fields = [
            'id', 'message', 'alert_type', 'is_read',
            'created_at', 'user', 'user_username', 'related_object_details',
            'derived_status_category', 'client_name', 'next_action_status', 'job_type_display'
        ]
        read_only_fields = [
            'id', 'message', 'alert_type', 'created_at', 'user', 'user_username',
            'related_object_details', 'derived_status_category', 'client_name', 'next_action_status', 'job_type_display'
        ]

    def get_related_object_details(self, obj):
        # Extract receipt number from the message
        match = re.search(r'برقم إيصال (PHO-[0-9]{14}-[0-9]+|PRN-[0-9]{14}-[0-9]+)\.', obj.message)
        if match:
            receipt_number = match.group(1)
            if receipt_number.startswith('PHO-'):
                try:
                    photosession = PhotoSession.objects.get(receipt_number=receipt_number)
                    return {'type': 'photosession', 'id': photosession.id, 'receipt_number': photosession.receipt_number}
                except PhotoSession.DoesNotExist:
                    pass
            elif receipt_number.startswith('PRN-'):
                try:
                    printjob = PrintJob.objects.get(receipt_number=receipt_number)
                    return {'type': 'printjob', 'id': printjob.id, 'receipt_number': printjob.receipt_number}
                except PrintJob.DoesNotExist:
                    pass
        return None

    def _get_related_object(self, obj):
        details = self.get_related_object_details(obj)
        if details:
            obj_type = details['type']
            obj_id = details['id']
            if obj_type == 'photosession':
                try:
                    return PhotoSession.objects.get(id=obj_id)
                except PhotoSession.DoesNotExist:
                    pass
            elif obj_type == 'printjob':
                try:
                    return PrintJob.objects.get(id=obj_id)
                except PrintJob.DoesNotExist:
                    pass
        return None

    def get_client_name(self, obj):
        related_obj = self._get_related_object(obj)
        if related_obj and hasattr(related_obj, 'client') and related_obj.client:
            return related_obj.client.name
        return None

    def get_next_action_status(self, obj):
        related_obj = self._get_related_object(obj)
        if related_obj:
            if isinstance(related_obj, PrintJob):
                if related_obj.status == 'pending':
                    return "Ready for Printing"
                elif related_obj.status == 'in_printing':
                    return "In Printing"
                elif related_obj.status == 'in_packaging':
                    return "In Packaging"
                elif related_obj.status == 'ready_for_delivery':
                    return "Ready for Delivery"
                elif related_obj.status == 'delivered':
                    return "Delivered"
                elif related_obj.status == 'cancelled':
                    return "Cancelled"
                else:
                    return "Status Unknown"
            elif isinstance(related_obj, PhotoSession):
                if related_obj.status == 'scheduled':
                    return "Ready for Photography"
                elif related_obj.status == 'in_shooting':
                    return "In Shooting"
                elif related_obj.status == 'in_editing':
                    return "Ready for Editing"
                elif related_obj.status == 'in_printing':
                    return "Ready for Printing"
                elif related_obj.status == 'ready_for_delivery':
                    return "Ready for Delivery"
                elif related_obj.status == 'delivered':
                    return "Delivered"
                # If status is not one of the above, it might be 'cancelled' or an unexpected state
                elif related_obj.status == 'cancelled':
                    return "Cancelled"
                else:
                    return "Status Unknown"
        return "Status Unknown"

    def get_job_type_display(self, obj):
        related_obj = self._get_related_object(obj)
        if related_obj:
            if isinstance(related_obj, PrintJob):
                # For PrintJob, get print types from its items
                item_print_types = [item.get_print_type_display() for item in related_obj.items.all()]
                return ", ".join(item_print_types) if item_print_types else "Print Job"
            elif isinstance(related_obj, PhotoSession):
                return related_obj.get_event_type_display() or related_obj.package.name if related_obj.package else "Photo Session"
        return "N/A"

    def get_derived_status_category(self, obj):
        related_object_details = self.get_related_object_details(obj)
        if related_object_details:
            obj_type = related_object_details['type']
            obj_id = related_object_details['id']
            today = timezone.localdate()

            if obj_type == 'photosession':
                try:
                    photosession = PhotoSession.objects.get(id=obj_id)
                    target_date = photosession.session_date
                    if target_date == today:
                        return 'today'
                    elif target_date > today:
                        return 'upcoming'
                    else:
                        return 'late'
                except PhotoSession.DoesNotExist:
                    pass
            elif obj_type == 'printjob':
                try:
                    printjob = PrintJob.objects.get(id=obj_id)
                    target_date = printjob.delivery_date
                    if target_date == today:
                        return 'today'
                    elif target_date > today:
                        return 'upcoming'
                    else:
                        return 'late'
                except PrintJob.DoesNotExist:
                    pass
        return 'other'

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if 'related_object_details' not in data or data['related_object_details'] is None:
            data['related_object_details'] = self.get_related_object_details(instance)
        return data