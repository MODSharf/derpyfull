from django.core.management.base import BaseCommand
from django.contrib.auth.models import Permission, Group
from print.models import Role

class Command(BaseCommand):
    help = 'Assigns the change_user_permissions permission to the manager role'

    def handle(self, *args, **options):
        try:
            manager_role = Role.objects.get(name='manager')
            group, created = Group.objects.get_or_create(name=manager_role.name)
            change_user_permissions = Permission.objects.get(codename='change_user_permissions')
            group.permissions.add(change_user_permissions)
            self.stdout.write(self.style.SUCCESS('Successfully assigned change_user_permissions to manager group'))
        except Role.DoesNotExist:
            self.stdout.write(self.style.ERROR('Manager role does not exist'))
        except Permission.DoesNotExist:
            self.stdout.write(self.style.ERROR('change_user_permissions permission does not exist'))
