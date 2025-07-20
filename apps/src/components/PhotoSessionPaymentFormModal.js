// src/components/PhotoSessionPaymentFormModal.js
import React, { useState, useEffect, useCallback } from 'react';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { getPhotoSessionById, addPaymentToPhotoSession } from '../services/apiService'; // استخدام دوال جلسات التصوير
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

/**
 * PhotoSessionPaymentFormModal Component
 * A modal form to add a new payment for a specific photo session.
 * It fetches the photo session details to display current amounts and remaining balance.
 *
 * Props:
 * - isOpen: Boolean to control modal visibility.
 * - onClose: Function to call when the modal should be closed.
 * - photoSessionId: The ID of the photo session to which the payment is being added.
 * - onPaymentSuccess: Function to call after a successful payment to refresh data.
 */
function PhotoSessionPaymentFormModal({ isOpen, onClose, photoSessionId, onPaymentSuccess }) {
  const { authToken } = useAuth();
  const { showToast } = useToast();

  const [photoSessionDetails, setPhotoSessionDetails] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash'); // Default payment method
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch photo session details when the modal opens or photoSessionId changes
  useEffect(() => {
    if (isOpen && photoSessionId && authToken) {
      const fetchDetails = async () => {
        setLoading(true);
        setError(null);
        try {
          const data = await getPhotoSessionById(authToken, photoSessionId);
          setPhotoSessionDetails(data);
          // Set payment amount to remaining amount by default, ensuring it's a number
          // Use parseFloat to convert to number, and handle potential NaN with || 0
          setPaymentAmount(parseFloat(data.remaining_amount || 0).toFixed(2));
        } catch (err) {
          console.error('Error fetching photo session details for payment:', err);
          setError(`فشل جلب تفاصيل جلسة التصوير: ${err.message}`);
          showToast(`فشل جلب تفاصيل جلسة التصوير: ${err.message}`, 'error');
        } finally {
          setLoading(false);
        }
      };
      fetchDetails();
    } else {
      // Reset state when modal closes
      setPhotoSessionDetails(null);
      setPaymentAmount('');
      setPaymentMethod('cash');
      setNotes('');
      setError(null);
    }
  }, [isOpen, photoSessionId, authToken, showToast]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    // Ensure paymentAmount is a valid number
    const parsedPaymentAmount = parseFloat(paymentAmount);
    if (isNaN(parsedPaymentAmount) || parsedPaymentAmount <= 0) {
      setError('يرجى إدخال مبلغ دفعة صحيح وموجب.');
      setIsSubmitting(false);
      return;
    }

    if (photoSessionDetails) {
      const remaining = parseFloat(photoSessionDetails.remaining_amount || 0);
      if (parsedPaymentAmount > remaining) {
        setError(`المبلغ المدفوع (${parsedPaymentAmount.toFixed(2)}) يتجاوز المبلغ المتبقي (${remaining.toFixed(2)}).`);
        setIsSubmitting(false);
        return;
      }
    }


    try {
      const paymentData = {
        amount: parsedPaymentAmount, // Use the parsed amount
        payment_method: paymentMethod,
        notes: notes,
      };
      await addPaymentToPhotoSession(authToken, photoSessionId, paymentData);
      onPaymentSuccess(); // Notify parent component of success
    } catch (err) {
      console.error('Error adding payment:', err);
      const errorMessage = err.message || 'حدث خطأ غير متوقع أثناء إضافة الدفعة.';
      setError(errorMessage);
      showToast(`فشل إضافة الدفعة: ${errorMessage}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [paymentAmount, paymentMethod, notes, authToken, photoSessionId, photoSessionDetails, onPaymentSuccess, showToast]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition"
          title="إغلاق"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">إضافة دفعة لجلسة التصوير</h2>

        {loading && (
          <div className="text-center py-5">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900 mx-auto"></div>
            <p className="text-gray-700 mt-3">جاري تحميل تفاصيل الجلسة...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-center" role="alert">
            <strong className="font-bold">خطأ!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        {!loading && photoSessionDetails && (
          <div className="mb-6 bg-blue-50 p-4 rounded-md border border-blue-200">
            <p className="text-gray-700 mb-2">
              <span className="font-semibold">جلسة رقم:</span> {photoSessionDetails.receipt_number}
            </p>
            <p className="text-gray-700 mb-2">
              <span className="font-semibold">العميل:</span> {photoSessionDetails.client?.name || 'N/A'}
            </p>
            <p className="text-gray-700 mb-2">
              <span className="font-semibold">المبلغ الكلي:</span> {parseFloat(photoSessionDetails.total_amount || 0).toFixed(2)}
            </p>
            <p className="text-gray-700 mb-2">
              <span className="font-semibold">المبلغ المدفوع سابقاً:</span> {parseFloat(photoSessionDetails.paid_amount || 0).toFixed(2)}
            </p>
            <p className="text-lg font-bold text-red-600">
              <span className="font-semibold">المبلغ المتبقي:</span> {parseFloat(photoSessionDetails.remaining_amount || 0).toFixed(2)}
            </p>
          </div>
        )}

        {!loading && !photoSessionDetails && !error && (
          <div className="text-center py-5 text-gray-600">
            <p>لا يمكن جلب تفاصيل جلسة التصوير.</p>
          </div>
        )}

        {!loading && photoSessionDetails && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Payment Amount */}
            <div>
              <label htmlFor="paymentAmount" className="block text-sm font-medium text-gray-700 mb-1">
                مبلغ الدفعة <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="paymentAmount"
                name="paymentAmount"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                step="0.01"
                min="0.01"
                required
              />
            </div>

            {/* Payment Method */}
            <div>
              <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-1">
                طريقة الدفع
              </label>
              <select
                id="paymentMethod"
                name="paymentMethod"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="cash">نقداً</option>
                <option value="bank_transfer">تحويل بنكي</option>
                <option value="mobile_money">دفع إلكتروني</option>
                <option value="card">بطاقة ائتمان/خصم</option>
              </select>
            </div>

            {/* Notes */}
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
              disabled={isSubmitting}
              className={`w-full flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${
                isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              } transition duration-300`}
            >
              {isSubmitting ? (
                <svg className="animate-spin h-5 w-5 text-white mr-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : null}
              تسجيل الدفعة
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default PhotoSessionPaymentFormModal;
