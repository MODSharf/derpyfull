// src/components/ClientForm.js
import React, { useState, useEffect, useCallback } from 'react';
import { createClient, updateClient } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

/**
 * ClientForm Component
 * A form for adding new clients or editing existing ones.
 * It can optionally wrap itself in a <form> tag or rely on a parent form.
 *
 * Props:
 * - onClientSaved: Callback function executed after a client is successfully saved (added or updated).
 * This function will be called with the saved client data.
 * - clientId: The ID of the client to edit. If null, a new client is being added.
 * - initialData: Initial data to pre-fill the form when editing an existing client.
 * - wrapInForm: Boolean. If true (default), the component renders its own <form> tag.
 * If false, it expects a parent component to provide the <form> tag.
 * - onSubmit: Function. If `wrapInForm` is false, this function is called when the form is submitted.
 * It receives the formData and the internal submit handler to be called by the parent.
 * - onCancel: Function. Callback for the cancel button.
 */
function ClientForm({ onClientSaved, clientId, initialData, wrapInForm = true, onSubmit, onCancel }) {
  const { authToken } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Effect to populate form data when initialData or clientId changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        phone: initialData.phone || '',
        email: initialData.email || '',
        address: initialData.address || '',
      });
    } else {
      // Clear form for new client
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
      });
    }
    setErrors({}); // Clear errors when initialData changes
  }, [initialData, clientId]);

  // Handle input changes
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    // Clear specific error when user starts typing
    if (errors[name]) {
      setErrors((prevErrors) => ({ ...prevErrors, [name]: undefined }));
    }
  }, [errors]);

  // Internal submission logic
  const internalHandleSubmit = useCallback(async () => {
    setLoading(true);
    setErrors({}); // Clear previous errors

    if (!authToken) {
      showToast('خطأ: لا يوجد توكن مصادقة. يرجى تسجيل الدخول.', 'error');
      setLoading(false);
      return;
    }

    try {
      let response;
      if (clientId) {
        // Update existing client
        response = await updateClient(authToken, clientId, formData);
        showToast('تم تحديث العميل بنجاح!', 'success');
      } else {
        // Create new client
        response = await createClient(authToken, formData);
        showToast('تم إضافة العميل بنجاح!', 'success');
      }
      console.log('Client saved:', response);
      if (onClientSaved) {
        onClientSaved(response); // Notify parent component with the new client data
      }
    } catch (err) {
      console.error('Error saving client:', err);
      let errorMessages = {};
      try {
        const parsedError = JSON.parse(err.message);
        if (typeof parsedError === 'object' && parsedError !== null) {
          Object.keys(parsedError).forEach(key => {
            errorMessages[key] = parsedError[key].join(' ');
          });
        } else {
          errorMessages = { general: err.message };
        }
      } catch (parseErr) {
        errorMessages = { general: err.message };
      }
      setErrors(errorMessages);
      showToast(errorMessages.general || 'فشل حفظ العميل. يرجى التحقق من البيانات.', 'error');
    } finally {
      setLoading(false);
    }
  }, [authToken, clientId, formData, onClientSaved, showToast]);

  // If not wrapping in a form, pass the internal submit handler to the parent
  useEffect(() => {
    if (!wrapInForm && onSubmit) {
      onSubmit(internalHandleSubmit);
    }
  }, [wrapInForm, onSubmit, internalHandleSubmit]);

  // Render content wrapped in a form or just the content
  const formContent = (
    <div className="space-y-6"> {/* This div replaces the form tag if wrapInForm is false */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          اسم العميل <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className={`w-full p-3 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
        />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
          رقم الهاتف
        </label>
        <input
          type="text"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className={`w-full p-3 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
        />
        {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          البريد الإلكتروني
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className={`w-full p-3 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
        />
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
          العنوان
        </label>
        <textarea
          id="address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          rows="3"
          className={`w-full p-3 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
        ></textarea>
        {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
      </div>

      {errors.general && <p className="text-red-500 text-sm text-center">{errors.general}</p>}

      <div className="flex justify-end space-x-4 space-x-reverse">
        <button
          type="button"
          onClick={onCancel || (() => onClientSaved && onClientSaved())} // Use onCancel prop if provided, else fallback
          className="px-6 py-3 bg-gray-300 text-gray-800 font-semibold rounded-md shadow-md hover:bg-gray-400 transition duration-300 ease-in-out transform hover:scale-105"
          disabled={loading}
        >
          إلغاء
        </button>
        <button
          type={wrapInForm ? "submit" : "button"} // If not wrapped, it's a button, parent form will handle submit
          onClick={wrapInForm ? undefined : internalHandleSubmit} // If not wrapped, trigger internal submit manually
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700 transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center"
          disabled={loading}
        >
          {loading && (
            <svg className="animate-spin h-5 w-5 text-white mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {clientId ? 'تحديث العميل' : 'إضافة العميل'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-white p-8 rounded-lg shadow-xl max-w-2xl mx-auto my-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
        {clientId ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}
      </h2>
      {wrapInForm ? (
        <form onSubmit={internalHandleSubmit} className="space-y-6">
          {formContent}
        </form>
      ) : (
        formContent
      )}
    </div>
  );
}

export default ClientForm;
