// src/components/PrintJobForm.js
import React, { useState, useEffect, useCallback, useRef } from 'react'; // Added useRef
import { getClients, createPrintJob, updatePrintJob } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import ClientForm from './ClientForm'; // استيراد مكون ClientForm
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/solid'; // أيقونة لزر إضافة عميل جديد و XMarkIcon للإغلاق

/**
 * PrintJobForm Component
 * A form for adding new print jobs or editing existing ones.
 * Now includes the ability to add a new client directly from the form.
 *
 * Props:
 * - onPrintJobSaved: Callback function to execute after a print job is successfully saved.
 * - printJobId: The ID of the print job to edit (if in edit mode).
 * - initialData: Initial data to pre-fill the form (for editing).
 * - isManager: Boolean indicating if the current user is a manager.
 */
function PrintJobForm({ onPrintJobSaved, printJobId, initialData, isManager }) {
  const { authToken } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    client: '', // سيبقى هذا الاسم في حالة الـ formData لتطابق الـ select
    print_type: '',
    size: '',
    total_amount: '',
    paid_amount: '',
    delivery_date: '',
    status: 'pending', // Default status
    notes: '',
  });
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false); // حالة جديدة للتحكم في مودال إضافة العميل

  // Ref to hold the ClientForm's internal submit function
  const clientFormSubmitHandlerRef = useRef(null); // Added for ClientForm submission

  // تعريف خيارات نوع الطباعة والحجم هنا لتتوافق مع models.py
  const PRINT_TYPE_OPTIONS = [
    { value: 'digital', label: 'طباعة رقمية' },
    { value: 'offset', label: 'طباعة أوفست' },
    { value: 'large_format', label: 'طباعة كبيرة الحجم' },
    { value: 'screen_printing', label: 'طباعة سلك سكرين' },
    { value: 'other', label: 'أخرى' },
  ];

  const SIZE_OPTIONS = [
    { value: 'A4', label: 'A4' },
    { value: 'A3', label: 'A3' },
    { value: 'A2', label: 'A2' },
    { value: 'A1', label: 'A1' },
    { value: 'custom', label: 'مقاس خاص' },
  ];

  const STATUS_OPTIONS = [
    { value: 'pending', label: 'قيد الانتظار' },
    { value: 'in_progress', label: 'قيد التنفيذ' },
    { value: 'completed', label: 'مكتملة' },
    { value: 'ready_for_delivery', label: 'جاهزة للتسليم' },
    { value: 'delivered', label: 'تم التسليم' },
    { value: 'cancelled', label: 'ملغاة' },
    { value: 'partially_paid', label: 'مدفوعة جزئياً' }, // تأكد من تطابق هذه الحالة مع models.py
  ];

  // دالة لجلب العملاء (يمكن إعادة استخدامها)
  const fetchClients = useCallback(async () => {
    if (!authToken) {
      setError('لا يوجد توكن مصادقة. يرجى تسجيل الدخول.');
      setLoading(false);
      return;
    }
    setLoading(true); // Set loading to true before fetching
    try {
      const data = await getClients(authToken);
      setClients(data.results || data); // Assuming API returns {results: [...]} or direct array
      console.log('Clients fetched:', data.results || data); // Debugging: Check fetched clients
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError(`فشل جلب العملاء: ${err.message}`);
      showToast(`فشل جلب العملاء: ${err.message}`, 'error');
    } finally {
      setLoading(false); // Set loading to false after fetching
    }
  }, [authToken, showToast]);

  // Fetch clients on component mount
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Populate form with initial data when in edit mode
  useEffect(() => {
    if (initialData) {
      setFormData({
        client: initialData.client?.id || '', // استخدام client.id لتعيين القيمة في الـ select
        print_type: initialData.print_type || '',
        size: initialData.size || '',
        total_amount: initialData.total_amount || '',
        paid_amount: initialData.paid_amount || '',
        delivery_date: initialData.delivery_date || '',
        status: initialData.status || 'pending',
        notes: initialData.notes || '',
      });
    } else {
      // Reset form for new job if initialData is null
      setFormData({
        client: '',
        print_type: '',
        size: '',
        total_amount: '',
        paid_amount: '',
        delivery_date: '',
        status: 'pending',
        notes: '',
      });
    }
  }, [initialData]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!authToken) {
      showToast('خطأ: لا يوجد توكن مصادقة. يرجى تسجيل الدخول.', 'error');
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      let response;
      const dataToSubmit = {
        ...formData,
        // Ensure numeric fields are parsed correctly
        total_amount: parseFloat(formData.total_amount),
        paid_amount: parseFloat(formData.paid_amount),
        // <--- التعديل هنا: إرسال client_id بدلاً من client
        client_id: parseInt(formData.client, 10), // استخدام client_id
      };
      // حذف حقل 'client' الأصلي لتجنب إرساله مرتين أو بأسماء مختلفة
      delete dataToSubmit.client;


      if (printJobId) {
        // In edit mode
        // If not a manager, only allow status update
        if (!isManager) {
          response = await updatePrintJob(authToken, printJobId, { status: dataToSubmit.status });
          showToast('تم تحديث حالة الطلب بنجاح. التعديلات الأخرى تتطلب موافقة المدير.', 'success');
        } else {
          // Manager can update all fields
          response = await updatePrintJob(authToken, printJobId, dataToSubmit);
          showToast('تم تحديث طلب الطباعة بنجاح!', 'success');
        }
      } else {
        // In add mode (only managers or specific roles can add, assuming employees don't add directly)
        response = await createPrintJob(authToken, dataToSubmit);
        showToast('تم حفظ طلب الطباعة بنجاح!', 'success');
      }

      console.log('Print job saved:', response);
      onPrintJobSaved(); // Call callback to refresh list or close form
    } catch (err) {
      console.error('Error saving print job:', err);
      // حاول تحليل رسالة الخطأ إذا كانت JSON
      let errorMessage = 'فشل حفظ طلب الطباعة. خطأ غير معروف.';
      try {
        const errorData = JSON.parse(err.message);
        if (errorData.client_id) {
          errorMessage = `خطأ العميل: ${errorData.client_id.join(', ')}`;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else {
          errorMessage = err.message;
        }
      } catch (parseErr) {
        errorMessage = err.message; // إذا لم يكن JSON، استخدم الرسالة الأصلية
      }
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [authToken, formData, printJobId, onPrintJobSaved, showToast, isManager]);

  // Handle submission of the ClientForm within the modal
  const handleSubmitClientForm = useCallback(async (e) => {
    e.preventDefault(); // Prevent default form submission
    if (clientFormSubmitHandlerRef.current) {
      await clientFormSubmitHandlerRef.current(); // Call the internal submit function of ClientForm
    }
  }, []);

  // Handle cancel of the ClientForm within the modal
  const handleCancelClientForm = useCallback(() => {
    setShowAddClientModal(false); // Just close the modal
  }, []);

  // دالة تُستدعى عند إضافة عميل جديد بنجاح من المودال
  const handleClientAdded = useCallback(async (newClient) => {
    console.log('New client added (from ClientForm):', newClient); // Debugging: check what newClient contains
    setShowAddClientModal(false); // إغلاق مودال إضافة العميل

    // Fetch clients again to ensure the new client is in the list
    // This is crucial for the <select> element to have the new option
    await fetchClients();

    // After fetching clients, set the new client's ID to formData.client
    // This should now correctly select the newly added client in the dropdown
    if (newClient && newClient.id) {
      setFormData(prevData => {
        console.log('Setting formData client to:', newClient.id.toString()); // Debugging: confirm ID being set
        return {
          ...prevData,
          client: newClient.id.toString(), // تحديد العميل الجديد في الـ select
        };
      });
    }
  }, [fetchClients, showToast]);


  if (loading) {
    return (
      <div className="text-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="text-gray-700 mt-4">جاري تحميل البيانات...</p>
      </div>
    );
  }

  if (error && !loading) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-center" role="alert">
        <strong className="font-bold">خطأ!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  // Determine if a field should be read-only/disabled
  const isFieldDisabled = (fieldName) => {
    // If not a manager and it's an existing job (edit mode)
    if (!isManager && printJobId) {
      // Allow status to be editable for employees
      return fieldName !== 'status';
    }
    // If it's a new job (add mode), all fields should be editable (assuming only managers add new jobs)
    // Or if it's a manager, all fields are editable
    return false;
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-xl max-w-4xl mx-auto">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-6 text-center">
        {printJobId ? 'تعديل طلب الطباعة' : 'إضافة طلب طباعة جديد'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client */}
        <div>
          <label htmlFor="client" className="block text-sm font-medium text-gray-700 mb-1">
            العميل
          </label>
          <div className="flex items-center gap-2">
            <select
              id="client"
              name="client"
              value={formData.client}
              onChange={handleChange}
              required
              className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              disabled={isFieldDisabled('client')}
            >
              <option value="">اختر عميل...</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
            {/* زر إضافة عميل جديد */}
            {!isFieldDisabled('client') && ( // لا تظهر الزر إذا كان حقل العميل معطلاً
              <button
                type="button"
                onClick={() => setShowAddClientModal(true)}
                className="mt-1 p-3 bg-green-500 text-white rounded-md shadow-sm hover:bg-green-600 transition duration-300 ease-in-out transform hover:scale-105"
                title="إضافة عميل جديد"
              >
                <PlusIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Print Type */}
        <div>
          <label htmlFor="print_type" className="block text-sm font-medium text-gray-700 mb-1">
            نوع الطباعة
          </label>
          <select
            id="print_type"
            name="print_type"
            value={formData.print_type}
            onChange={handleChange}
            required
            className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            disabled={isFieldDisabled('print_type')}
          >
            <option value="">اختر نوع الطباعة...</option>
            {PRINT_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Size */}
        <div>
          <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-1">
            الحجم
          </label>
          <select
            id="size"
            name="size"
            value={formData.size}
            onChange={handleChange}
            className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            disabled={isFieldDisabled('size')}
          >
            <option value="">اختر الحجم...</option>
            {SIZE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Total Amount */}
        <div>
          <label htmlFor="total_amount" className="block text-sm font-medium text-gray-700 mb-1">
            المبلغ الكلي
          </label>
          <input
            type="number"
            id="total_amount"
            name="total_amount"
            value={formData.total_amount}
            onChange={handleChange}
            required
            step="0.01"
            className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            disabled={isFieldDisabled('total_amount')}
          />
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
            required
            step="0.01"
            className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            disabled={isFieldDisabled('paid_amount')}
          />
        </div>

        {/* Delivery Date */}
        <div>
          <label htmlFor="delivery_date" className="block text-sm font-medium text-gray-700 mb-1">
            تاريخ التسليم
          </label>
          <input
            type="date"
            id="delivery_date"
            name="delivery_date"
            value={formData.delivery_date}
            onChange={handleChange}
            className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            disabled={isFieldDisabled('delivery_date')}
          />
        </div>

        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            الحالة
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            required
            className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            disabled={!isManager && !printJobId}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
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
            className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            disabled={isFieldDisabled('notes')}
          ></textarea>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <button
            type="button"
            onClick={onPrintJobSaved} // This acts as a cancel button
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
            {isSubmitting ? 'جاري الحفظ...' : (printJobId ? 'حفظ التعديلات' : 'إضافة طلب')}
          </button>
        </div>
      </form>

      {/* Modal for adding a new client */}
      {showAddClientModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
            <button
              onClick={handleCancelClientForm} // Use the new handleCancelClientForm
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition"
              title="إغلاق"
            >
              <XMarkIcon className="h-6 w-6" /> {/* Use XMarkIcon for closing */}
            </button>
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center border-b pb-3">
              إضافة عميل جديد
            </h2>
            {/* Wrap ClientForm in its own <form> */}
            <form onSubmit={handleSubmitClientForm} className="space-y-6">
              <ClientForm
                onClientSaved={handleClientAdded}
                wrapInForm={false} // <--- IMPORTANT: Tell ClientForm NOT to wrap itself in a form
                onSubmit={(submitFn) => (clientFormSubmitHandlerRef.current = submitFn)} // Pass submitFn via ref
                onCancel={handleCancelClientForm} // Pass onCancel to ClientForm
              />
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default PrintJobForm;
