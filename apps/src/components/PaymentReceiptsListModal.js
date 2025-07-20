// src/components/PaymentReceiptsListModal.js
import React, { useState, useEffect, useCallback } from 'react';
import { getPrintJobPaymentReceipts, downloadPaymentReceiptPdf } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { XMarkIcon, DocumentArrowDownIcon } from '@heroicons/react/24/solid';

/**
 * PaymentReceiptsListModal Component
 * A modal to display a list of payment receipts for a specific print job.
 * Allows downloading individual receipts.
 *
 * Props:
 * - isOpen: Boolean to control modal visibility.
 * - onClose: Function to close the modal.
 * - printJobId: The ID of the print job to fetch receipts for.
 */
function PaymentReceiptsListModal({ isOpen, onClose, printJobId }) {
  const { authToken } = useAuth();
  const { showToast } = useToast();
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReceipts = useCallback(async () => {
    if (!authToken || !printJobId) {
      setError('Authentication token or Print Job ID is missing.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getPrintJobPaymentReceipts(authToken, printJobId);
      setReceipts(data);
    } catch (err) {
      console.error('Error fetching payment receipts:', err);
      setError(`فشل جلب إيصالات الدفع: ${err.message}`);
      showToast(`فشل جلب إيصالات الدفع: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [authToken, printJobId, showToast]);

  useEffect(() => {
    if (isOpen) {
      fetchReceipts();
    }
  }, [isOpen, fetchReceipts]);

  const handleDownloadReceipt = useCallback(async (receiptId) => {
    if (!authToken) {
      showToast('خطأ: لا يوجد توكن مصادقة. يرجى تسجيل الدخول.', 'error');
      return;
    }
    try {
      await downloadPaymentReceiptPdf(authToken, receiptId);
      showToast('تم تنزيل الإيصال بنجاح!', 'success');
    } catch (err) {
      console.error('Error downloading receipt:', err);
      showToast(`فشل تنزيل الإيصال: ${err.message}`, 'error');
    }
  }, [authToken, showToast]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition"
          title="إغلاق"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center border-b pb-3">
          إيصالات الدفع لطلب الطباعة
        </h2>

        {loading && (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="text-gray-700 mt-4">جاري تحميل الإيصالات...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-center" role="alert">
            <strong className="font-bold">خطأ!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        {!loading && !error && receipts.length === 0 && (
          <div className="text-center py-10 text-gray-600">
            <p className="text-lg">لا توجد إيصالات دفع لهذا الطلب حتى الآن.</p>
          </div>
        )}

        {!loading && !error && receipts.length > 0 && (
          <div className="space-y-4">
            {receipts.map((receipt) => (
              <div key={receipt.id} className="bg-gray-50 p-4 rounded-md shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div className="mb-2 sm:mb-0">
                  <p className="text-gray-800 font-semibold">
                    إيصال رقم: {receipt.receipt_number || receipt.id}
                  </p>
                  <p className="text-gray-600 text-sm">
                    المبلغ المدفوع في هذه الدفعة: <span className="font-bold">{parseFloat(receipt.paid_amount).toFixed(2)}</span>
                  </p>
                  <p className="text-gray-600 text-sm">
                    تاريخ الدفعة: {new Date(receipt.date_issued).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-gray-600 text-sm">
                    طريقة الدفع: {receipt.get_payment_method_display || receipt.payment_method}
                  </p>
                  {receipt.notes && (
                    <p className="text-gray-600 text-sm">
                      ملاحظات: {receipt.notes}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDownloadReceipt(receipt.id)}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition duration-200 text-sm"
                  title="تنزيل الإيصال"
                >
                  <DocumentArrowDownIcon className="h-5 w-5 ml-2" />
                  تنزيل إيصال
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PaymentReceiptsListModal;
