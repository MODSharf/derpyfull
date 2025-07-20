// src/components/PaymentFormModal.js
import React, { useState, useEffect, useCallback } from 'react';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { getPrintJobById, addPaymentToPrintJob } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

/**
 * PaymentFormModal Component
 * A modal form to add a new payment for a specific print job.
 * It fetches the print job details to display current amounts and remaining balance.
 *
 * Props:
 * - isOpen: Boolean to control modal visibility.
 * - onClose: Function to call when the modal should be closed.
 * - printJobId: The ID of the print job to which the payment is being added.
 * - onPaymentSuccess: Function to call after a successful payment to refresh data.
 */
function PaymentFormModal({ isOpen, onClose, printJobId, onPaymentSuccess }) {
  const { authToken } = useAuth();
  const { showToast } = useToast();

  const [printJobDetails, setPrintJobDetails] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash'); // Default payment method
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch print job details when the modal opens or printJobId changes
  useEffect(() => {
    if (isOpen && printJobId && authToken) {
      const fetchDetails = async () => {
        setLoading(true);
        setError(null);
        try {
          const data = await getPrintJobById(authToken, printJobId);
          setPrintJobDetails(data);
          // Optionally pre-fill paymentAmount with remaining_amount if it's the final payment
          setPaymentAmount(data.remaining_amount ? parseFloat(data.remaining_amount).toFixed(2) : '');
        } catch (err) {
          console.error('Error fetching print job details for payment:', err);
          setError(`فشل جلب تفاصيل طلب الطباعة: ${err.message}`);
          showToast(`فشل جلب تفاصيل طلب الطباعة: ${err.message}`, 'error');
        } finally {
          setLoading(false);
        }
      };
      fetchDetails();
    } else {
      // Reset form when modal closes
      setPrintJobDetails(null);
      setPaymentAmount('');
      setPaymentMethod('cash');
      setNotes('');
      setError(null);
    }
  }, [isOpen, printJobId, authToken, showToast]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError(null);

    if (!authToken) {
      showToast('خطأ: لا يوجد توكن مصادقة. يرجى تسجيل الدخول.', 'error');
      return;
    }
    if (!printJobId) {
      showToast('خطأ: لم يتم تحديد طلب الطباعة.', 'error');
      return;
    }
    if (parseFloat(paymentAmount) <= 0 || isNaN(parseFloat(paymentAmount))) {
      setError('يرجى إدخال مبلغ دفع صالح وموجب.');
      showToast('يرجى إدخال مبلغ دفع صالح وموجب.', 'error'); // Show toast as well
      return;
    }
    if (printJobDetails && parseFloat(paymentAmount) > parseFloat(printJobDetails.remaining_amount)) {
      const errorMessage = `المبلغ المدفوع ${parseFloat(paymentAmount).toFixed(2)} يتجاوز المبلغ المتبقي ${parseFloat(printJobDetails.remaining_amount).toFixed(2)}.`;
      setError(errorMessage);
      showToast(errorMessage, 'error'); // Show toast as well
      return;
    }

    setLoading(true);
    try {
      const paymentData = {
        amount: parseFloat(paymentAmount),
        payment_method: paymentMethod,
        notes: notes,
      };
      await addPaymentToPrintJob(authToken, printJobId, paymentData);
      showToast('تم تسجيل الدفعة بنجاح!', 'success');
      onPaymentSuccess(); // Notify parent to refresh data
      onClose(); // Close the modal
    } catch (err) {
      console.error('Error adding payment:', err);
      const errorMessage = `فشل تسجيل الدفعة: ${err.message}`;
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  }, [authToken, printJobId, paymentAmount, paymentMethod, notes, printJobDetails, onPaymentSuccess, onClose, showToast]);

  if (!isOpen) {
    return null;
  }

  // Define payment methods as per your Django model's choices
  const paymentMethods = [
    { value: 'cash', label: 'نقداً' },
    { value: 'bank_transfer', label: 'تحويل بنكي' },
    { value: 'card', label: 'بطاقة ائتمان/خصم' },
    { value: 'cheque', label: 'شيك' },
    { value: 'online', label: 'دفع إلكتروني' },
  ];

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 transition duration-200"
          title="إغلاق"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">إضافة دفعة لطلب الطباعة</h2>

        {loading && !printJobDetails && ( // Only show loading when initially fetching details
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="text-gray-700 mt-2">جاري تحميل تفاصيل الطلب...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">خطأ!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        {printJobDetails && (
          <div className="mb-6 bg-gray-50 p-4 rounded-md border border-gray-200">
            <p className="text-gray-700 mb-2">
              <span className="font-semibold">طلب رقم:</span> {printJobDetails.receipt_number || printJobDetails.id}
            </p>
            <p className="text-gray-700 mb-2">
              <span className="font-semibold">العميل:</span> {printJobDetails.client?.name || 'غير معروف'}
            </p>
            <p className="text-gray-700 mb-2">
              <span className="font-semibold">المبلغ الكلي:</span>{' '}
              <span className="font-bold text-blue-600">{parseFloat(printJobDetails.total_amount).toFixed(2)}</span>
            </p>
            <p className="text-gray-700 mb-2">
              <span className="font-semibold">المبلغ المدفوع سابقاً:</span>{' '}
              <span className="font-bold text-green-600">{parseFloat(printJobDetails.paid_amount).toFixed(2)}</span>
            </p>
            <p className="text-gray-700 mb-2">
              <span className="font-semibold">المبلغ المتبقي:</span>{' '}
              <span className="font-bold text-red-600">{parseFloat(printJobDetails.remaining_amount).toFixed(2)}</span>
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="paymentAmount" className="block text-sm font-medium text-gray-700 mb-1">
              مبلغ الدفعة الجديد <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="paymentAmount"
              name="paymentAmount"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              step="0.01"
              min="0.01"
              required
              className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-lg"
              placeholder="أدخل مبلغ الدفعة"
            />
          </div>

          <div>
            <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-1">
              طريقة الدفع <span className="text-red-500">*</span>
            </label>
            <select
              id="paymentMethod"
              name="paymentMethod"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              required
              className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {paymentMethods.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              ملاحظات (اختياري)
            </label>
            <textarea
              id="notes"
              name="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="3"
              className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="أضف أي ملاحظات حول الدفعة..."
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${
              loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            } transition duration-300`}
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white mr-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : null}
            {loading ? 'جاري التسجيل...' : 'تسجيل الدفعة'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default PaymentFormModal;
