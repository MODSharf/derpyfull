// src/components/PhotoSessionForm.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  getClients,
  getPhotographyPackages,
  getPhotographers,
  createPhotoSession,
  updatePhotoSession
} from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import ClientForm from './ClientForm';
import { PlusIcon, XMarkIcon, ClipboardDocumentIcon } from '@heroicons/react/24/solid'; // Added ClipboardDocumentIcon

/**
 * PhotoSessionForm Component
 * A form for adding new photo sessions or editing existing ones.
 * It fetches clients, photography packages, and photographers to populate dropdowns.
 * Now includes the ability to add a new client directly from the form.
 *
 * Props:
 * - onSessionSaved: Callback function to execute after a photo session is successfully saved.
 * - sessionId: The ID of the photo session to edit (if in edit mode).
 * - initialData: Initial data to pre-fill the form (for editing).
 * - isManager: Boolean indicating if the current user has manager privileges.
 */
function PhotoSessionForm({ onSessionSaved, sessionId, initialData, isManager }) {
  const { authToken } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    client_id: '',
    package_id: '',
    photographer_id: '',
    session_date: '',
    // MODIFIED: Replaced session_time with start and end times
    session_start_time: '',
    session_end_time: '',
    location: '',
    total_amount: '',
    paid_amount: '0.00', // Default to 0.00 for new sessions
    status: 'scheduled', // Default status
    notes: '',
    digital_photos_delivered: false,
    printed_photos_delivered: false,
    album_delivered: false,
    frame_delivered: false,
    event_type: '',
    final_delivery_date: '',
    num_digital_photos_delivered: 0,
    num_printed_photos_delivered: 0,
    photo_serial_number: '',
    final_gallery_link: '',
    editing_status: 'not_started',
    agreement_notes: '',
  });

  const [clients, setClients] = useState([]);
  const [packages, setPackages] = useState([]);
  const [photographers, setPhotographers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [showAddClientModal, setShowAddClientModal] = useState(false);

  const clientFormSubmitHandlerRef = useRef(null);

  const fetchDependencies = useCallback(async () => {
    if (!authToken) {
      showToast('خطأ: لا يوجد توكن مصادقة. يرجى تسجيل الدخول.', 'error');
      setLoading(false);
      return;
    }
    try {
      const [clientsData, packagesData, photographersData] = await Promise.all([
        getClients(authToken),
        getPhotographyPackages(authToken),
        getPhotographers(authToken),
      ]);
      setClients(clientsData);
      setPackages(packagesData);
      setPhotographers(photographersData);
    } catch (err) {
      console.error('Error fetching form dependencies:', err);
      showToast(`فشل جلب البيانات الأساسية للنموذج: ${err.message}`, 'error');
      setErrors({ general: `فشل جلب البيانات: ${err.message}` });
    } finally {
      setLoading(false);
    }
  }, [authToken, showToast]);

  useEffect(() => {
    fetchDependencies();
  }, [fetchDependencies]);

  // Populate form data when initialData or sessionId changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      // Parse session_time into start and end times for existing data
      let start_time = '';
      let end_time = '';
      if (initialData.session_time && initialData.session_time.includes('-')) {
        [start_time, end_time] = initialData.session_time.split('-');
      } else if (initialData.session_time) {
        start_time = initialData.session_time.substring(0, 5); // Fallback if not a range
      }

      setFormData({
        client_id: initialData.client?.id || '',
        package_id: initialData.package?.id || '',
        photographer_id: initialData.photographer?.id || '',
        session_date: initialData.session_date || '',
        session_start_time: start_time, // Set parsed start time
        session_end_time: end_time,     // Set parsed end time
        location: initialData.location || '',
        total_amount: initialData.total_amount || '',
        paid_amount: initialData.paid_amount || '0.00',
        status: initialData.status || 'scheduled',
        notes: initialData.notes || '',
        digital_photos_delivered: initialData.digital_photos_delivered || false,
        printed_photos_delivered: initialData.printed_photos_delivered || false,
        album_delivered: initialData.album_delivered || false,
        frame_delivered: initialData.frame_delivered || false,
        event_type: initialData.event_type || '',
        final_delivery_date: initialData.final_delivery_date || '',
        num_digital_photos_delivered: initialData.num_digital_photos_delivered || 0,
        num_printed_photos_delivered: initialData.num_printed_photos_delivered || 0,
        photo_serial_number: initialData.photo_serial_number || '',
        final_gallery_link: initialData.final_gallery_link || '',
        editing_status: initialData.editing_status || 'not_started',
        agreement_notes: initialData.agreement_notes || '',
      });
    } else {
      // Reset form for new entry if initialData is null
      setFormData({
        client_id: '',
        package_id: '',
        photographer_id: '',
        session_date: '',
        session_start_time: '', // Reset start time
        session_end_time: '',   // Reset end time
        location: '',
        total_amount: '',
        paid_amount: '0.00',
        status: 'scheduled',
        notes: '',
        digital_photos_delivered: false,
        printed_photos_delivered: false,
        album_delivered: false,
        frame_delivered: false,
        event_type: '',
        final_delivery_date: '',
        num_digital_photos_delivered: 0,
        num_printed_photos_delivered: 0,
        photo_serial_number: '',
        final_gallery_link: '',
        editing_status: 'not_started',
        agreement_notes: '',
      });
    }
    setErrors({}); // Clear errors on initial data change
  }, [initialData, sessionId]);

  // useEffect for auto-filling final_delivery_date
  useEffect(() => {
    // Only auto-fill for new sessions AND if session_date is set AND final_delivery_date is empty (or not a valid date)
    if (formData.session_date && !sessionId && !formData.final_delivery_date) {
      const sessionDate = new Date(formData.session_date);
      if (!isNaN(sessionDate.getTime())) { // Check if it's a valid date
        sessionDate.setDate(sessionDate.getDate() + 15); // Add 15 days
        const year = sessionDate.getFullYear();
        const month = String(sessionDate.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
        const day = String(sessionDate.getDate()).padStart(2, '0');
        setFormData(prevData => ({
          ...prevData,
          final_delivery_date: `${year}-${month}-${day}`
        }));
      }
    }
  }, [formData.session_date, sessionId, formData.final_delivery_date]); // Added final_delivery_date to dependency

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => {
      let newData = {
        ...prevData,
        [name]: type === 'checkbox' ? checked : value,
      };

      // Logic for package selection: auto-fill total_amount
      if (name === 'package_id') {
        const selectedPackage = packages.find(pkg => pkg.id === parseInt(value));
        if (selectedPackage) {
          newData.total_amount = parseFloat(selectedPackage.price).toFixed(2); 
        } else {
          newData.total_amount = ''; 
        }
      }
      return newData;
    });
    setErrors((prevErrors) => ({ ...prevErrors, [name]: '' })); // Clear specific error on change
  }, [packages]);

  const validateForm = useCallback(() => {
    const newErrors = {};
    if (!formData.client_id) newErrors.client_id = 'العميل مطلوب.';
    if (!formData.session_date) newErrors.session_date = 'تاريخ الجلسة مطلوب.';
    if (!formData.total_amount || parseFloat(formData.total_amount) <= 0) {
      newErrors.total_amount = 'المبلغ الكلي مطلوب ويجب أن يكون أكبر من صفر.';
    }
    if (parseFloat(formData.paid_amount) > parseFloat(formData.total_amount)) {
      newErrors.paid_amount = 'المبلغ المدفوع لا يمكن أن يتجاوز المبلغ الكلي.';
    }

    // NEW: Validate session time range
    if (formData.session_start_time && formData.session_end_time) {
      if (formData.session_start_time >= formData.session_end_time) {
        newErrors.session_time_range = 'وقت الانتهاء يجب أن يكون بعد وقت البدء.';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setErrors({});
    if (!validateForm()) {
      showToast('يرجى تصحيح الأخطاء في النموذج.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      let response;
      // Combine start and end times into session_time string
      const sessionTimeCombined = (formData.session_start_time && formData.session_end_time)
        ? `${formData.session_start_time}-${formData.session_end_time}`
        : null;

      const dataToSubmit = {
        ...formData,
        total_amount: parseFloat(formData.total_amount),
        paid_amount: parseFloat(formData.paid_amount),
        session_date: formData.session_date,
        session_time: sessionTimeCombined, // Use the combined time string
        location: formData.location || null,
        notes: formData.notes || null,
        package_id: formData.package_id || null,
        photographer_id: formData.photographer_id || null,
        event_type: formData.event_type || null,
        final_delivery_date: formData.final_delivery_date || null,
        num_digital_photos_delivered: formData.num_digital_photos_delivered || 0,
        num_printed_photos_delivered: formData.num_printed_photos_delivered || 0,
        photo_serial_number: formData.photo_serial_number || null,
        final_gallery_link: formData.final_gallery_link || null,
        editing_status: formData.editing_status || 'not_started',
        agreement_notes: formData.agreement_notes || null,
      };

      // Remove individual time fields as they are combined into session_time
      delete dataToSubmit.session_start_time;
      delete dataToSubmit.session_end_time;

      if (sessionId) {
        response = await updatePhotoSession(authToken, sessionId, dataToSubmit);
      } else {
        response = await createPhotoSession(authToken, dataToSubmit);
      }
      onSessionSaved(response);
    } catch (err) {
      console.error('Error saving photo session:', err);
      const errorMessage = err.message || 'حدث خطأ غير متوقع أثناء الحفظ.';
      setErrors({ general: errorMessage });
      showToast(`فشل حفظ جلسة التصوير: ${errorMessage}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [authToken, formData, sessionId, onSessionSaved, showToast, validateForm]);

  const handleSubmitClientForm = useCallback(async (e) => {
    e.preventDefault();
    if (clientFormSubmitHandlerRef.current) {
      await clientFormSubmitHandlerRef.current();
    }
  }, []);

  const handleCancelClientForm = useCallback(() => {
    setShowAddClientModal(false);
  }, []);

  const handleClientAdded = useCallback(async (newClient) => {
    setShowAddClientModal(false);

    if (newClient) {
      showToast('تم إضافة العميل بنجاح!', 'success');
      await fetchDependencies();

      setFormData((prevData) => ({
        ...prevData,
        client_id: newClient.id,
      }));
    }
  }, [showToast, fetchDependencies]);

  // Function to copy final_gallery_link to clipboard
  const handleCopyLinkToClipboard = useCallback(() => {
    if (formData.final_gallery_link) {
      const textarea = document.createElement('textarea');
      textarea.value = formData.final_gallery_link;
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        showToast('تم نسخ رابط المعرض إلى الحافظة!', 'success');
      } catch (err) {
        console.error('Failed to copy link:', err);
        showToast('فشل نسخ الرابط إلى الحافظة.', 'error');
      }
      document.body.removeChild(textarea);
    } else {
      showToast('لا يوجد رابط معرض لنسخه.', 'info');
    }
  }, [formData.final_gallery_link, showToast]);


  if (loading) {
    return (
      <div className="text-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="text-gray-700 mt-4">جاري تحميل البيانات...</p>
      </div>
    );
  }

  const EVENT_TYPE_OPTIONS = [
    { value: '', label: 'اختر نوع الحدث (اختياري)' },
    { value: 'wedding', label: 'زفاف' },
    { value: 'portrait', label: 'بورتريه' },
    { value: 'product', label: 'منتجات' },
    { value: 'event', label: 'فعالية' },
    { value: 'other', label: 'أخرى' },
  ];

  const PHOTO_SESSION_STATUS_OPTIONS = [
    { value: 'scheduled', label: 'مجدولة' },
    { value: 'in_shooting', label: 'قيد التصوير' },
    { value: 'raw_material_uploaded', label: 'تم رفع المواد الخام' },
    { value: 'in_editing', label: 'قيد التعديل' },
    { value: 'ready_for_review', label: 'جاهزة للمراجعة' },
    { value: 'ready_for_printing', label: 'جاهزة للطباعة' },
    { value: 'ready_for_delivery', label: 'جاهزة للتسليم' },
    { value: 'delivered', label: 'تم التسليم' },
    { value: 'partially_paid', label: 'مدفوعة جزئياً' },
    { value: 'completed', label: 'مكتملة (مدفوعة بالكامل)' },
    { value: 'cancelled', label: 'ملغاة' },
  ];

  const EDITING_STATUS_OPTIONS = [
    { value: 'not_started', label: 'لم تبدأ' },
    { value: 'in_shooting', label: 'قيد التصوير' },
    { value: 'in_editing', label: 'قيد التعديل' },
    { value: 'in_printing', label: 'قيد الطباعة' },
    { value: 'completed', label: 'تم الانتهاء' },
  ];


  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {sessionId ? 'تعديل جلسة التصوير' : 'إضافة جلسة تصوير جديدة'}
      </h2>

      {errors.general && (
        <p className="text-red-600 text-center bg-red-100 p-3 rounded-md border border-red-200">
          {errors.general}
        </p>
      )}

      {/* Client Select with Add New Client Button */}
      <div>
        <label htmlFor="client_id" className="block text-sm font-medium text-gray-700 mb-1">
          العميل <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-2">
          <select
            id="client_id"
            name="client_id"
            value={formData.client_id}
            onChange={handleChange}
            className={`mt-1 block w-full p-3 border ${errors.client_id ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
            required
          >
            <option value="">اختر عميل...</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name} ({client.phone})
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowAddClientModal(true)}
            className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition duration-300 transform hover:scale-105"
            title="إضافة عميل جديد"
          >
            <PlusIcon className="h-5 w-5" />
          </button>
        </div>
        {errors.client_id && <p className="mt-1 text-sm text-red-600">{errors.client_id}</p>}
      </div>

      {/* Photography Package Select */}
      <div>
        <label htmlFor="package_id" className="block text-sm font-medium text-gray-700 mb-1">
          باقة التصوير
        </label>
        <select
          id="package_id"
          name="package_id"
          value={formData.package_id}
          onChange={handleChange}
          className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">اختر باقة (اختياري)</option>
          {packages.map((pkg) => (
            <option key={pkg.id} value={pkg.id}>
              {pkg.name} ({parseFloat(pkg.price).toFixed(2)})
            </option>
          ))}
        </select>
      </div>

      {/* Photographer Select - Disabled for employees, enabled for managers */}
      <div>
        <label htmlFor="photographer_id" className="block text-sm font-medium text-gray-700 mb-1">
          المصور المعين
        </label>
        <select
          id="photographer_id"
          name="photographer_id"
          value={formData.photographer_id}
          onChange={handleChange}
          className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          disabled={!isManager} // Disable if not manager
        >
          <option value="">اختر مصور (اختياري)</option>
          {photographers.map((photographer) => (
            <option key={photographer.id} value={photographer.id}>
              {photographer.name}
            </option>
          ))}
        </select>
        {!isManager && (
          <p className="mt-1 text-sm text-gray-500">
            * يمكن للمديرين فقط تعيين المصور بعد إنشاء الجلسة.
          </p>
        )}
      </div>

      {/* Session Date */}
      <div>
        <label htmlFor="session_date" className="block text-sm font-medium text-gray-700 mb-1">
          تاريخ الجلسة <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          id="session_date"
          name="session_date"
          value={formData.session_date}
          onChange={handleChange}
          className={`mt-1 block w-full p-3 border ${errors.session_date ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
          required
        />
        {errors.session_date && <p className="mt-1 text-sm text-red-600">{errors.session_date}</p>}
      </div>

      {/* MODIFIED: Session Time Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="session_start_time" className="block text-sm font-medium text-gray-700 mb-1">
            وقت البدء (اختياري)
          </label>
          <input
            type="time"
            id="session_start_time"
            name="session_start_time"
            value={formData.session_start_time}
            onChange={handleChange}
            className={`mt-1 block w-full p-3 border ${errors.session_time_range ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
          />
        </div>
        <div>
          <label htmlFor="session_end_time" className="block text-sm font-medium text-gray-700 mb-1">
            وقت الانتهاء (اختياري)
          </label>
          <input
            type="time"
            id="session_end_time"
            name="session_end_time"
            value={formData.session_end_time}
            onChange={handleChange}
            className={`mt-1 block w-full p-3 border ${errors.session_time_range ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
          />
        </div>
        {errors.session_time_range && <p className="mt-1 text-sm text-red-600 col-span-2">{errors.session_time_range}</p>}
      </div>

      {/* Location */}
      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
          الموقع (اختياري)
        </label>
        <input
          type="text"
          id="location"
          name="location"
          value={formData.location}
          onChange={handleChange}
          className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="مثال: استوديو، منزل العميل، موقع خارجي"
        />
      </div>

      {/* Total Amount - Read-only if package is selected, editable otherwise */}
      <div>
        <label htmlFor="total_amount" className="block text-sm font-medium text-gray-700 mb-1">
          المبلغ الكلي <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          id="total_amount"
          name="total_amount"
          value={formData.total_amount}
          onChange={handleChange}
          className={`mt-1 block w-full p-3 border ${errors.total_amount ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${formData.package_id ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          step="0.01"
          min="0"
          required
          readOnly={!!formData.package_id} // Read-only if package_id is selected
        />
        {formData.package_id && (
          <p className="mt-1 text-sm text-gray-500">
            * تم تعبئة المبلغ تلقائياً من الباقة المختارة.
          </p>
        )}
        {errors.total_amount && <p className="mt-1 text-sm text-red-600">{errors.total_amount}</p>}
      </div>

      {/* Paid Amount */}
      <div>
        <label htmlFor="paid_amount" className="block text-sm font-medium text-gray-700 mb-1">
          المبلغ المدفوع
        </label>
        <input
          type="number"
          id="paid_amount"
          name="paid_amount"
          value={formData.paid_amount}
          onChange={handleChange}
          className={`mt-1 block w-full p-3 border ${errors.paid_amount ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
          step="0.01"
          min="0"
        />
        {errors.paid_amount && <p className="mt-1 text-sm text-red-600">{errors.paid_amount}</p>}
      </div>

      {/* Status - UPDATED OPTIONS */}
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
          الحالة
        </label>
        <select
          id="status"
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          {PHOTO_SESSION_STATUS_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          ملاحظات
        </label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows="3"
          className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="أضف أي ملاحظات حول جلسة التصوير..."
        ></textarea>
      </div>

      {/* --- NEW FIELDS SECTION --- */}
      <div className="border-t border-gray-200 pt-6 mt-6">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">تفاصيل إضافية للجلسة</h3>

        {/* Event Type */}
        <div>
          <label htmlFor="event_type" className="block text-sm font-medium text-gray-700 mb-1">
            نوع الحدث/التصوير
          </label>
          <select
            id="event_type"
            name="event_type"
            value={formData.event_type}
            onChange={handleChange}
            className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {EVENT_TYPE_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        {/* Final Delivery Date - Auto-filled but editable */}
        <div>
          <label htmlFor="final_delivery_date" className="block text-sm font-medium text-gray-700 mb-1">
            تاريخ التسليم النهائي
          </label>
          <input
            type="date"
            id="final_delivery_date"
            name="final_delivery_date"
            value={formData.final_delivery_date}
            onChange={handleChange}
            className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            * يتم ملؤه تلقائيًا (تاريخ الجلسة + 15 يومًا) ويمكن تعديله.
          </p>
        </div>

        {/* Number of Digital Photos Delivered */}
        <div>
          <label htmlFor="num_digital_photos_delivered" className="block text-sm font-medium text-gray-700 mb-1">
            عدد الصور الرقمية المسلمة (اختياري)
          </label>
          <input
            type="number"
            id="num_digital_photos_delivered"
            name="num_digital_photos_delivered"
            value={formData.num_digital_photos_delivered}
            onChange={handleChange}
            className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            min="0"
          />
        </div>

        {/* Number of Printed Photos Delivered */}
        <div>
          <label htmlFor="num_printed_photos_delivered" className="block text-sm font-medium text-gray-700 mb-1">
            عدد الصور المطبوعة المسلمة (اختياري)
          </label>
          <input
            type="number"
            id="num_printed_photos_delivered"
            name="num_printed_photos_delivered"
            value={formData.num_printed_photos_delivered}
            onChange={handleChange}
            className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            min="0"
          />
        </div>

        {/* Photo Serial Number */}
        <div>
          <label htmlFor="photo_serial_number" className="block text-sm font-medium text-gray-700 mb-1">
            رقم مسلسل الصورة (اختياري)
          </label>
          <input
            type="text"
            id="photo_serial_number"
            name="photo_serial_number"
            value={formData.photo_serial_number}
            onChange={handleChange}
            className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="مثال: PS-2024-001"
          />
        </div>

        {/* Final Gallery Link with Copy Button */}
        <div>
          <label htmlFor="final_gallery_link" className="block text-sm font-medium text-gray-700 mb-1">
            رابط المعرض النهائي (مسار ملف شبكة)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              id="final_gallery_link"
              name="final_gallery_link"
              value={formData.final_gallery_link}
              onChange={handleChange}
              className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="مثال: \\server\share\folder"
            />
            <button
              type="button"
              onClick={handleCopyLinkToClipboard}
              className="p-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition duration-300 transform hover:scale-105"
              title="نسخ الرابط إلى الحافظة"
              disabled={!formData.final_gallery_link}
            >
              <ClipboardDocumentIcon className="h-5 w-5" />
            </button>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            * انسخ هذا المسار والصقه في مستكشف الملفات لفتحه.
          </p>
        </div>

        {/* Editing Status - UPDATED OPTIONS */}
        <div>
          <label htmlFor="editing_status" className="block text-sm font-medium text-gray-700 mb-1">
            حالة التعديل/المعالجة
          </label>
          <select
            id="editing_status"
            name="editing_status"
            value={formData.editing_status}
            onChange={handleChange}
            className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {EDITING_STATUS_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        {/* Agreement Notes */}
        <div>
          <label htmlFor="agreement_notes" className="block text-sm font-medium text-gray-700 mb-1">
            ملاحظات الاتفاقية (اختياري)
          </label>
          <textarea
            id="agreement_notes"
            name="agreement_notes"
            value={formData.agreement_notes}
            onChange={handleChange}
            rows="3"
            className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="أضف أي شروط أو اتفاقيات خاصة..."
          ></textarea>
        </div>
      </div>
      {/* --- END NEW FIELDS SECTION --- */}


      {/* Delivery Status Checkboxes (Existing) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center">
          <input
            id="digital_photos_delivered"
            name="digital_photos_delivered"
            type="checkbox"
            checked={formData.digital_photos_delivered}
            onChange={handleChange}
            className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="digital_photos_delivered" className="ml-2 block text-sm font-medium text-gray-700">
            تم تسليم الصور الرقمية
          </label>
        </div>
        <div className="flex items-center">
          <input
            id="printed_photos_delivered"
            name="printed_photos_delivered"
            type="checkbox"
            checked={formData.printed_photos_delivered}
            onChange={handleChange}
            className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="printed_photos_delivered" className="ml-2 block text-sm font-medium text-gray-700">
            تم تسليم الصور المطبوعة
          </label>
        </div>
        <div className="flex items-center">
          <input
            id="album_delivered"
            name="album_delivered"
            type="checkbox"
            checked={formData.album_delivered}
            onChange={handleChange}
            className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="album_delivered" className="ml-2 block text-sm font-medium text-gray-700">
            تم تسليم الألبوم
          </label>
        </div>
        <div className="flex items-center">
          <input
            id="frame_delivered"
            name="frame_delivered"
            type="checkbox"
            checked={formData.frame_delivered}
            onChange={handleChange}
            className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="frame_delivered" className="ml-2 block text-sm font-medium text-gray-700">
            تم تسليم الإطار
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-4 mt-6">
        <button
          type="button"
          onClick={() => onSessionSaved()}
          className="px-6 py-3 bg-gray-300 text-gray-800 font-semibold rounded-md shadow-md hover:bg-gray-400 transition duration-300 ease-in-out"
          disabled={isSubmitting}
        >
          إلغاء
        </button>
        <button
          type="submit"
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700 transition duration-300 ease-in-out transform hover:scale-105"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'جاري الحفظ...' : (sessionId ? 'حفظ التعديلات' : 'إضافة جلسة')}
        </button>
      </div>

      {/* Modal for adding a new client */}
      {showAddClientModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
            <button
              onClick={handleCancelClientForm}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition"
              title="إغلاق"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">إضافة عميل جديد</h2>
            <form onSubmit={handleSubmitClientForm} className="space-y-6">
              <ClientForm
                onClientSaved={handleClientAdded}
                wrapInForm={false}
                onSubmit={(submitFn) => (clientFormSubmitHandlerRef.current = submitFn)}
                onCancel={handleCancelClientForm}
              />
            </form>
          </div>
        </div>
      )}
    </form>
  );
}

export default PhotoSessionForm;
