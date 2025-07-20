// src/components/PhotographyPackageForm.js
import React, { useState, useEffect } from 'react';
import { createPhotographyPackage, updatePhotographyPackage } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

/**
 * PhotographyPackageForm Component
 * A form for adding new photography packages or editing existing ones.
 * It handles input fields for package name, description, and price.
 *
 * Props:
 * - onPackageSaved: Callback function to execute after a package is successfully saved.
 * - onCancel: Callback function to execute when the form is cancelled.
 * - packageId: The ID of the package to edit (if in edit mode).
 * - initialData: Initial data to pre-fill the form (for editing).
 */
function PhotographyPackageForm({ onPackageSaved, onCancel, packageId, initialData }) {
  const { authToken } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Populate form with initial data when in edit mode
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        price: initialData.price !== undefined ? String(initialData.price) : '', // Ensure price is string for input
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
      errors.name = 'اسم الباقة مطلوب.';
    }
    if (!formData.price.trim()) {
      errors.price = 'السعر مطلوب.';
    } else if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      errors.price = 'السعر يجب أن يكون رقمًا موجبًا.';
    }
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
      const dataToSubmit = {
        ...formData,
        price: parseFloat(formData.price) // Convert price to number for API
      };

      if (packageId) {
        // Update existing package
        response = await updatePhotographyPackage(authToken, packageId, dataToSubmit);
      } else {
        // Create new package
        response = await createPhotographyPackage(authToken, dataToSubmit);
      }
      onPackageSaved(response); // Call success callback
    } catch (err) {
      console.error('Error saving package:', err);
      // Attempt to parse backend error messages
      let errorMessage = err.message;
      try {
        const errorJson = JSON.parse(err.message);
        if (errorJson.name) errorMessage = `اسم الباقة: ${errorJson.name.join(', ')}`;
        else if (errorJson.price) errorMessage = `السعر: ${errorJson.price.join(', ')}`;
        else if (errorJson.detail) errorMessage = errorJson.detail;
        else errorMessage = JSON.stringify(errorJson);
      } catch (parseError) {
        // If not JSON, use raw error message
      }
      showToast(`فشل حفظ الباقة: ${errorMessage}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">اسم الباقة <span className="text-red-500">*</span></label>
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
        <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">السعر (SAR) <span className="text-red-500">*</span></label>
        <input
          type="number"
          id="price"
          name="price"
          value={formData.price}
          onChange={handleChange}
          step="0.01"
          min="0"
          className={`mt-1 block w-full p-2 border ${formErrors.price ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500`}
          required
        />
        {formErrors.price && <p className="text-red-500 text-xs mt-1">{formErrors.price}</p>}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="3"
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        ></textarea>
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
          {isSubmitting ? 'جاري الحفظ...' : (packageId ? 'حفظ التعديلات' : 'إضافة باقة')}
        </button>
      </div>
    </form>
  );
}

export default PhotographyPackageForm;
