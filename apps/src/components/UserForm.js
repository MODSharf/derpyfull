// src/components/UserForm.js
import React, { useState, useEffect, useCallback } from 'react';
import { createUser, updateUser, getRoles } from '../services/apiService'; // Import getRoles
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

/**
 * UserForm Component
 * A form for adding new users or editing existing ones.
 * It handles input fields for user details and role.
 *
 * Props:
 * - onUserSaved: Callback function to execute after a user is successfully saved.
 * - onCancel: Callback function to execute when the form is cancelled.
 * - userId: The ID of the user to edit (if in edit mode).
 * - initialData: Initial data to pre-fill the form (for editing).
 */
function UserForm({ onUserSaved, onCancel, userId, initialData }) {
  const { authToken, user } = useAuth(); // Get user from useAuth
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    first_name: '',
    last_name: '',
    roles: [], // Changed to an array for multiple roles
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [allRoles, setAllRoles] = useState([]); // State to store all available roles
  const [loadingRoles, setLoadingRoles] = useState(true);

  // Check if current user has permission to change user roles
  const canChangeUserRoles = user?.user_permissions?.includes('print.change_user_roles') || user?.is_superuser || user?.is_staff; // Assuming user_permissions is available

  // Fetch all roles on component mount
  useEffect(() => {
    const fetchAllRoles = async () => {
      try {
        setLoadingRoles(true);
        const rolesData = await getRoles(authToken);
        setAllRoles(rolesData.results || rolesData);
      } catch (err) {
        console.error('Error fetching all roles:', err);
        showToast(`فشل جلب الأدوار: ${err.message}`, 'error');
      } finally {
        setLoadingRoles(false);
      }
    };
    fetchAllRoles();
  }, [authToken, showToast]);

  // Populate form with initial data when in edit mode or initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        username: initialData.username || '',
        email: initialData.email || '',
        first_name: initialData.first_name || '',
        last_name: initialData.last_name || '',
        roles: initialData.roles || [], // Populate with existing roles
        password: '', // Password is not pre-filled for security
      });
    } else {
      // Reset form for new user
      setFormData({
        username: '',
        password: '',
        email: '',
        first_name: '',
        last_name: '',
        roles: [],
      });
    }
  }, [initialData]);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'roles') {
      // Handle multiple checkbox selection for roles
      setFormData(prevData => {
        const newRoles = checked
          ? [...prevData.roles, value]
          : prevData.roles.filter(roleName => roleName !== value);
        return { ...prevData, roles: newRoles };
      });
    } else {
      setFormData(prevData => ({
        ...prevData,
        [name]: value
      }));
    }
    // Clear error for the field when it's changed
    if (formErrors[name]) {
      setFormErrors(prevErrors => ({ ...prevErrors, [name]: '' }));
    }
  }, [formErrors]);

  const validateForm = useCallback(() => {
    const errors = {};
    if (!formData.username.trim()) {
      errors.username = 'اسم المستخدم مطلوب.';
    }
    if (!userId && !formData.password.trim()) { // Password is required only for new users
      errors.password = 'كلمة المرور مطلوبة للمستخدم الجديد.';
    }
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'صيغة البريد الإلكتروني غير صحيحة.';
    }
    // Roles are optional for now, but could add validation if needed
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, userId]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast('الرجاء تصحيح الأخطاء في النموذج.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      let response;
      const dataToSubmit = { ...formData };

      // Remove password if it's empty and we are updating (Django won't update if empty)
      if (userId && !dataToSubmit.password) {
        delete dataToSubmit.password;
      }

      // If current user does not have permission to change roles, remove roles from dataToSubmit
      if (!canChangeUserRoles) {
        delete dataToSubmit.roles; // Prevent unauthorized role changes
      }

      if (userId) {
        // Update existing user
        response = await updateUser(authToken, userId, dataToSubmit);
      } else {
        // Create new user
        response = await createUser(authToken, dataToSubmit);
      }
      onUserSaved(response); // Call success callback
    } catch (err) {
      console.error('Error saving user:', err);
      // Attempt to parse backend error messages
      let errorMessage = err.message;
      try {
        const errorJson = JSON.parse(err.message);
        if (errorJson.username) errorMessage = `اسم المستخدم: ${errorJson.username.join(', ')}`;
        else if (errorJson.email) errorMessage = `البريد الإلكتروني: ${errorJson.email.join(', ')}`;
        else if (errorJson.detail) errorMessage = errorJson.detail;
        else errorMessage = JSON.stringify(errorJson);
      } catch (parseError) {
        // If not JSON, use raw error message
      }
      showToast(`فشل حفظ المستخدم: ${errorMessage}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [authToken, formData, userId, onUserSaved, showToast, validateForm, canChangeUserRoles]);

  if (loadingRoles) {
    return (
      <div className="text-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="text-gray-700 mt-4">جاري تحميل الأدوار...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">اسم المستخدم <span className="text-red-500">*</span></label>
        <input
          type="text"
          id="username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          className={`mt-1 block w-full p-2 border ${formErrors.username ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500`}
          required
        />
        {formErrors.username && <p className="text-red-500 text-xs mt-1">{formErrors.username}</p>}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور {userId ? '(اتركها فارغة لعدم التغيير)' : <span className="text-red-500">*</span>}</label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          className={`mt-1 block w-full p-2 border ${formErrors.password ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500`}
          {...(!userId && { required: true })} // Required only for new users
        />
        {formErrors.password && <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className={`mt-1 block w-full p-2 border ${formErrors.email ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500`}
        />
        {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
      </div>

      <div>
        <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">الاسم الأول</label>
        <input
          type="text"
          id="first_name"
          name="first_name"
          value={formData.first_name}
          onChange={handleChange}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">الاسم الأخير</label>
        <input
          type="text"
          id="last_name"
          name="last_name"
          value={formData.last_name}
          onChange={handleChange}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Role selection, only visible if current user has permission to change roles */}
      {canChangeUserRoles && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">الأدوار</label>
          <div className="mt-1 space-y-2">
            {allRoles.map(role => (
              <div key={role.id} className="flex items-center">
                <input
                  type="checkbox"
                  id={`role-${role.id}`}
                  name="roles"
                  value={role.name} // Use role name as value
                  checked={formData.roles.includes(role.name)}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor={`role-${role.id}`} className="ml-2 block text-sm text-gray-900">
                  {role.name}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-3 space-x-reverse mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          disabled={isSubmitting}
        >
          إلغاء
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'جاري الحفظ...' : (userId ? 'حفظ التعديلات' : 'إضافة مستخدم')}
        </button>
      </div>
    </form>
  );
}

export default UserForm;
