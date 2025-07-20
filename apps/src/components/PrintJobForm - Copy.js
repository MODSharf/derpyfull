// src/components/PrintJobForm.js
import React, { useState, useEffect } from 'react';

// ===========================================================================
// إعدادات الـ API (تأكد من مطابقتها لإعداداتك في App.js)
// ===========================================================================
const API_BASE_URL = 'http://127.0.0.1:8000/api'; 
const AUTH_TOKEN = '5883c31e0d03358c3afc822c1e73109b70990fae'; // <--- **استبدل هذا بالتوكن الفعلي**

// المكون PrintJobForm
// يتلقى 'onJobAdded' (لإعادة التحميل بعد الإضافة/التعديل)
// و 'jobId' (معرف الطلب إذا كان في وضع التعديل)
// و 'initialData' (البيانات الأولية لملء النموذج في وضع التعديل)
function PrintJobForm({ onJobAdded, jobId, initialData }) {
  // حالة المكون لتخزين بيانات النموذج
  const [formData, setFormData] = useState({
    client_id: '',
    print_type: '',
    size: '',
    delivery_date: '',
    pickup_date: '',
    total_amount: '',
    paid_amount: '',
    notes: '',
  });

  // حالة لتخزين قائمة العملاء التي سيتم جلبها من الـ API
  const [clients, setClients] = useState([]);
  // حالة لتتبع ما إذا كانت قائمة العملاء قيد التحميل
  const [loadingClients, setLoadingClients] = useState(true);
  // حالة لتخزين أي أخطاء تحدث أثناء جلب العملاء
  const [clientsError, setClientsError] = useState(null);

  // حالة لرسائل الخطأ الخاصة بالنموذج (من الـ API)
  const [formErrors, setFormErrors] = useState({});
  // حالة لتتبع ما إذا كان النموذج قيد الإرسال
  const [isSubmitting, setIsSubmitting] = useState(false);
  // حالة لرسائل الخطأ العامة للإرسال
  const [submissionError, setSubmissionError] = useState(null);
  // حالة لرسالة النجاح بعد الإرسال
  const [successMessage, setSuccessMessage] = useState(null); 

  // ===========================================================================
  // جلب قائمة العملاء عند تحميل المكون
  // ===========================================================================
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoadingClients(true);
        setClientsError(null);

        const response = await fetch(`${API_BASE_URL}/clients/`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${AUTH_TOKEN}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'فشل في جلب قائمة العملاء.');
        }

        const data = await response.json();
        setClients(data.results);
        if (data.results.length > 0 && !initialData) {
          setFormData(prevData => ({ ...prevData, client_id: data.results[0].id }));
        }
      } catch (err) {
        console.error("خطأ في جلب العملاء:", err);
        setClientsError(err.message);
      } finally {
        setLoadingClients(false);
      }
    };

    fetchClients();
  }, [initialData]); 

  // ===========================================================================
  // ملء النموذج بالبيانات الأولية عند التعديل
  // ===========================================================================
  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        total_amount: String(initialData.total_amount),
        paid_amount: String(initialData.paid_amount),
        client_id: initialData.client_id || (clients.length > 0 ? clients[0].id : ''),
      });
    } else {
      setFormData({
        client_id: clients.length > 0 ? clients[0].id : '',
        print_type: '',
        size: '',
        delivery_date: '',
        pickup_date: '',
        total_amount: '',
        paid_amount: '',
        notes: '',
      });
    }
    setFormErrors({}); 
    setSubmissionError(null); 
    setSuccessMessage(null); 
  }, [initialData, clients]); 

  // ===========================================================================
  // معالجة تغييرات حقول النموذج
  // ===========================================================================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
    setFormErrors(prevErrors => ({
      ...prevErrors,
      [name]: undefined 
    }));
    setSubmissionError(null); 
    setSuccessMessage(null); 
  };

  // ===========================================================================
  // معالجة إرسال النموذج (إضافة أو تعديل)
  // ===========================================================================
  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setIsSubmitting(true);
    setFormErrors({}); 
    setSubmissionError(null); 
    setSuccessMessage(null); 

    const method = jobId ? 'PATCH' : 'POST'; 
    const url = jobId ? `${API_BASE_URL}/printjobs/${jobId}/` : `${API_BASE_URL}/printjobs/`;

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${AUTH_TOKEN}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Submission Error:", errorData);

        if (response.status === 400) {
          setFormErrors(errorData); 
        } else {
          setSubmissionError(errorData.detail || 'حدث خطأ غير متوقع أثناء حفظ الطلب.');
        }
        return; 
      }

      const updatedOrNewPrintJob = await response.json();
      console.log('Print Job saved successfully:', updatedOrNewPrintJob);

      const successMsg = jobId ? 'تم تعديل طلب الطباعة بنجاح!' : 'تم إضافة طلب الطباعة بنجاح!';
      setSuccessMessage(successMsg); 

      if (!jobId) {
        setFormData({
          client_id: clients.length > 0 ? clients[0].id : '',
          print_type: '',
          size: '',
          delivery_date: '',
          pickup_date: '',
          total_amount: '',
          paid_amount: '',
          notes: '',
        });
      }

      // استدعاء onJobAdded بعد تأخير قصير للسماح للمستخدم برؤية رسالة النجاح
      setTimeout(() => {
        if (onJobAdded) {
          onJobAdded(successMsg); // <--- تمرير رسالة النجاح إلى المكون الأب
        }
      }, 1500); 

      // فتح الإيصال PDF في تبويبة جديدة (فقط عند الإضافة)
      if (updatedOrNewPrintJob.id && !jobId) { 
        setTimeout(() => { 
          window.open(`${API_BASE_URL}/printjobs/${updatedOrNewPrintJob.id}/generate_pdf_receipt/`, '_blank');
        }, 300);
      }

    } catch (err) {
      console.error("Network or unexpected error:", err);
      setSubmissionError('حدث خطأ في الشبكة أو خطأ غير متوقع. الرجاء المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false); 
    }
  };

  // ===========================================================================
  // عرض واجهة المستخدم للنموذج
  // ===========================================================================
  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto my-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        {jobId ? 'تعديل طلب الطباعة' : 'إضافة طلب طباعة جديد'}
      </h2>

      {/* Display errors for fetching clients */}
      {clientsError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">خطأ في جلب العملاء:</strong>
          <span className="block sm:inline"> {clientsError}</span>
        </div>
      )}

      {/* Display general submission error */}
      {submissionError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">خطأ في الإرسال:</strong>
          <span className="block sm:inline"> {submissionError}</span>
        </div>
      )}

      {/* Display success message */}
      {successMessage && ( 
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">نجاح:</strong>
          <span className="block sm:inline"> {successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Client field */}
        <div>
          <label htmlFor="client_id" className="block text-sm font-medium text-gray-700">العميل</label>
          {loadingClients ? (
            <p className="text-gray-500">جاري تحميل العملاء...</p>
          ) : (
            <select
              id="client_id"
              name="client_id"
              value={formData.client_id}
              onChange={handleChange}
              className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm ${formErrors.client_id ? 'border-red-500' : ''}`}
              required
            >
              {clients.length === 0 ? (
                <option value="">لا يوجد عملاء متاحون</option>
              ) : (
                clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name} - {client.phone}
                  </option>
                ))
              )}
            </select>
          )}
          {formErrors.client_id && <p className="mt-1 text-sm text-red-600">{formErrors.client_id}</p>}
        </div>

        {/* Print Type field */}
        <div>
          <label htmlFor="print_type" className="block text-sm font-medium text-gray-700">نوع الطباعة</label>
          <select
            id="print_type"
            name="print_type"
            value={formData.print_type}
            onChange={handleChange}
            className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm ${formErrors.print_type ? 'border-red-500' : ''}`}
            required
          >
            <option value="">اختر نوع الطباعة</option>
            <option value="album">ألبوم</option>
            <option value="wood_tablo">تابلو خشب</option>
            <option value="canvas">كانفاس</option>
            <option value="frame">إطار</option>
            <option value="photo_paper">ورق صور</option>
            <option value="other">أخرى</option>
          </select>
          {formErrors.print_type && <p className="mt-1 text-sm text-red-600">{formErrors.print_type}</p>}
        </div>

        {/* Size field */}
        <div>
          <label htmlFor="size" className="block text-sm font-medium text-gray-700">الحجم</label>
          <select
            id="size"
            name="size"
            value={formData.size}
            onChange={handleChange}
            className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm ${formErrors.size ? 'border-red-500' : ''}`}
            required
          >
            <option value="">اختر الحجم</option>
            <option value="small_album">ألبوم صغير (20x20)</option>
            <option value="large_album">ألبوم كبير (30x30)</option>
            <option value="30x40">30×40 سم</option>
            <option value="40x60">40×60 سم</option>
            <option value="50x70">50×70 سم</option>
            <option value="60x90">60×90 سم</option>
            <option value="A4">A4</option>
            <option value="A3">A3</option>
            <option value="other">أخرى</option>
          </select>
          {formErrors.size && <p className="mt-1 text-sm text-red-600">{formErrors.size}</p>}
        </div>

        {/* Delivery Date field */}
        <div>
          <label htmlFor="delivery_date" className="block text-sm font-medium text-gray-700">تاريخ التسليم المتوقع</label>
          <input
            type="date"
            id="delivery_date"
            name="delivery_date"
            value={formData.delivery_date}
            onChange={handleChange}
            className={`mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 ${formErrors.delivery_date ? 'border-red-500' : ''}`}
            required
          />
          {formErrors.delivery_date && <p className="mt-1 text-sm text-red-600">{formErrors.delivery_date}</p>}
        </div>

        {/* Pickup Date field */}
        <div>
          <label htmlFor="pickup_date" className="block text-sm font-medium text-gray-700">تاريخ الاستلام الفعلي (اختياري)</label>
          <input
            type="date"
            id="pickup_date"
            name="pickup_date"
            value={formData.pickup_date}
            onChange={handleChange}
            className={`mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 ${formErrors.pickup_date ? 'border-red-500' : ''}`}
          />
          {formErrors.pickup_date && <p className="mt-1 text-sm text-red-600">{formErrors.pickup_date}</p>}
        </div>

        {/* Total Amount field */}
        <div>
          <label htmlFor="total_amount" className="block text-sm font-medium text-gray-700">المبلغ الإجمالي</label>
          <input
            type="number"
            id="total_amount"
            name="total_amount"
            value={formData.total_amount}
            onChange={handleChange}
            step="0.01" 
            className={`mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 ${formErrors.total_amount ? 'border-red-500' : ''}`}
            required
          />
          {formErrors.total_amount && <p className="mt-1 text-sm text-red-600">{formErrors.total_amount}</p>}
        </div>

        {/* Paid Amount field */}
        <div>
          <label htmlFor="paid_amount" className="block text-sm font-medium text-gray-700">المبلغ المدفوع</label>
          <input
            type="number"
            id="paid_amount"
            name="paid_amount"
            value={formData.paid_amount}
            onChange={handleChange}
            step="0.01" 
            className={`mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 ${formErrors.paid_amount ? 'border-red-500' : ''}`}
            required
          />
          {formErrors.paid_amount && <p className="mt-1 text-sm text-red-600">{formErrors.paid_amount}</p>}
        </div>

        {/* Notes field */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">ملاحظات (اختياري)</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="3"
            className={`mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 ${formErrors.notes ? 'border-red-500' : ''}`}
          ></textarea>
          {formErrors.notes && <p className="mt-1 text-sm text-red-600">{formErrors.notes}</p>}
        </div>

        {/* Submit button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={isSubmitting || loadingClients} 
          >
            {isSubmitting ? 'جاري الحفظ...' : (jobId ? 'تعديل الطلب' : 'إضافة طلب طباعة')}
          </button>
        </div>
      </form>
    </div>
  );
}

export default PrintJobForm;
