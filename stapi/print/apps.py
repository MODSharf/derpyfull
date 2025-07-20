# stapi/print/apps.py

from django.apps import AppConfig


class PrintConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'print'
    verbose_name = 'إدارة الطباعة والتصوير' # اسم عرض التطبيق

    def ready(self):
        """
        Import signals when the app is ready.
        """
        import print.signals # noqa: F401
