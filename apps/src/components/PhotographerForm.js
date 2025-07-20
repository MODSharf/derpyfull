// src/components/PhotographerForm.js
import React, { useState, useEffect } from 'react';
import { createPhotographer, updatePhotographer } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

/**
 * PhotographerForm Component
 * A form for adding new photographers or editing existing ones.
 * It handles input fields for photographer name, phone, and email.
 *
 * Props:
 * - onPhotographerSaved: Callback function to execute after a photographer is successfully saved.
 * - onCancel: Callback function to execute when the form is cancelled.
 * - photographerId: The ID of the photographer to edit (if in edit mode).
 * - initialData: Initial data to pre-fill the form (for editing).
 */
function PhotographerForm({ onPhotographerSaved, onCancel, photographerId, initialData }) {
  const { authToken } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Populate form with initial data when in edit mode
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        phone: initialData.phone || '',
        email: initialData.email || '',
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
    // Clear error for the field when it's changed
    if (formErrors[name]) {
      setFormErrors(prevErrors => ({ ...prevErrors, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'اسم المصور مطلوب.';
    }
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'صيغة البريد الإلكتروني غير صحيحة.';
    }
    // يمكنك إضافة المزيد من التحقق لرقم الهاتف إذا لزم الأمر
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast('الرجاء تصحيح الأخطاء في النموذج.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      let response;
      if (photographerId) {
        // Update existing photographer
        response = await updatePhotographer(authToken, photographerId, formData);
      } else {
        // Create new photographer
        response = await createPhotographer(authToken, formData);
      }
      onPhotographerSaved(response); // Call success callback
    } catch (err) {
      console.error('Error saving photographer:', err);
      // Attempt to parse backend error messages
      let errorMessage = err.message;
      try {
        const errorJson = JSON.parse(err.message);
        if (errorJson.name) errorMessage = `اسم المصور: ${errorJson.name.join(', ')}`;
        else if (errorJson.email) errorMessage = `البريد الإلكتروني: ${errorJson.email.join(', ')}`;
        else if (errorJson.phone) errorMessage = `رقم الهاتف: ${errorJson.phone.join(', ')}`;
        else if (errorJson.detail) errorMessage = errorJson.detail;
        else errorMessage = JSON.stringify(errorJson);
      } catch (parseError) {
        // If not JSON, use raw error message
      }
      showToast(`فشل حفظ المصور: ${errorMessage}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">اسم المصور <span className="text-red-500">*</span></label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={`mt-1 block w-full p-2 border ${formErrors.name ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500`}
          required
        />
        {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
        <input
          type="text"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
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
          {isSubmitting ? 'جاري الحفظ...' : (photographerId ? 'حفظ التعديلات' : 'إضافة مصور')}
        </button>
      </div>
    </form>
  );
}

export default PhotographerForm;
