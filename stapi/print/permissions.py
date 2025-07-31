from rest_framework import permissions

class CanChangeUserPermissions(permissions.BasePermission):
    """
    Custom permission to only allow users with the 'change_user_permissions' permission to edit roles.
    """

    def has_permission(self, request, view):
        # Read permissions are allowed to any authenticated user, so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to users with the 'change_user_permissions' permission.
        return request.user.has_perm('print.change_user_permissions')
