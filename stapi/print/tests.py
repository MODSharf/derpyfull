from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from .models import Role, PhotographyPackage, Photographer, Profile

class PermissionTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create roles
        self.manager_role, _ = Role.objects.get_or_create(name='manager')
        self.receptionist_role, _ = Role.objects.get_or_create(name='receptionist')

        # Create users
        self.admin_user = User.objects.create_superuser('admin', 'admin@example.com', 'adminpassword')
        self.manager_user = User.objects.create_user('manager', 'manager@example.com', 'managerpassword')
        self.receptionist_user = User.objects.create_user('receptionist', 'receptionist@example.com', 'receptionistpassword')
        self.regular_user = User.objects.create_user('regular', 'regular@example.com', 'regularpassword')

        # Assign roles to profiles
        Profile.objects.create(user=self.admin_user).roles.set([self.manager_role]) # Admin also has manager role for testing
        Profile.objects.create(user=self.manager_user).roles.set([self.manager_role])
        Profile.objects.create(user=self.receptionist_user).roles.set([self.receptionist_role])
        Profile.objects.create(user=self.regular_user) # No specific role

        # Get tokens
        self.admin_token = self.get_token(self.admin_user)
        self.manager_token = self.get_token(self.manager_user)
        self.receptionist_token = self.get_token(self.receptionist_user)
        self.regular_token = self.get_token(self.regular_user)

        # Create some test data
        self.package = PhotographyPackage.objects.create(name='Basic Package', price=100.00)
        self.photographer = Photographer.objects.create(name='John Doe')

    def get_token(self, user):
        response = self.client.post('/api/token-auth/', {'username': user.username, 'password': f'{user.username}password'})
        return response.data['token']

    def test_photography_package_list_access(self):
        # Admin/Manager should see all packages
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.admin_token)
        response = self.client.get('/api/photographypackages/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data['results']), 0)

        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.manager_token)
        response = self.client.get('/api/photographypackages/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data['results']), 0)

        # Receptionist/Regular user should not see packages (or see empty list)
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.receptionist_token)
        response = self.client.get('/api/photographypackages/')
        self.assertEqual(response.status_code, status.HTTP_200_OK) # Should be 200, but empty list
        self.assertEqual(len(response.data['results']), 0)

        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.regular_token)
        response = self.client.get('/api/photographypackages/')
        self.assertEqual(response.status_code, status.HTTP_200_OK) # Should be 200, but empty list
        self.assertEqual(len(response.data['results']), 0)

    def test_photographer_list_access(self):
        # Admin/Manager should see all photographers
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.admin_token)
        response = self.client.get('/api/photographers/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data['results']), 0)

        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.manager_token)
        response = self.client.get('/api/photographers/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data['results']), 0)

        # Receptionist/Regular user should not see photographers (or see empty list)
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.receptionist_token)
        response = self.client.get('/api/photographers/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 0)

        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.regular_token)
        response = self.client.get('/api/photographers/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 0)

    def test_user_viewset_access(self):
        # Admin/Manager should see all users
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.admin_token)
        response = self.client.get('/api/users/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data['results']), 0)

        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.manager_token)
        response = self.client.get('/api/users/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data['results']), 0)

        # Regular user should only see their own user data
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.regular_token)
        response = self.client.get('/api/users/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['username'], self.regular_user.username)

    def test_print_job_list_access(self):
        # All authenticated users should see all print jobs (IsAuthenticated)
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.admin_token)
        response = self.client.get('/api/printjobs/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.manager_token)
        response = self.client.get('/api/printjobs/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.receptionist_token)
        response = self.client.get('/api/printjobs/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.regular_token)
        response = self.client.get('/api/printjobs/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_photo_session_list_access(self):
        # All authenticated users should see all photo sessions (IsAuthenticated)
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.admin_token)
        response = self.client.get('/api/photosessions/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.manager_token)
        response = self.client.get('/api/photosessions/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.receptionist_token)
        response = self.client.get('/api/photosessions/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.regular_token)
        response = self.client.get('/api/photosessions/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)