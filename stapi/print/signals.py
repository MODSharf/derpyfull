from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import PrintJob, PhotoSession, Alert

@receiver(post_save, sender=PrintJob)
def handle_print_job_delivered(sender, instance, created, **kwargs):
    if not created and instance.status == 'delivered':
        # Find related alerts and mark them as read or delete them
        # Assuming alerts are linked by receipt_number in their message or a direct foreign key
        # For now, we'll mark as read based on receipt number in message
        Alert.objects.filter(message__icontains=instance.receipt_number).update(is_read=True)

@receiver(post_save, sender=PhotoSession)
def handle_photo_session_delivered(sender, instance, created, **kwargs):
    if not created and instance.status == 'delivered':
        # Find related alerts and mark them as read or delete them
        Alert.objects.filter(message__icontains=instance.receipt_number).update(is_read=True)