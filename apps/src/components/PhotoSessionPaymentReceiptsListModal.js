// src/components/PhotoSessionPaymentReceiptsListModal.js
import React, { useState, useEffect, useCallback } from 'react';
import { XMarkIcon, DocumentArrowDownIcon } from '@heroicons/react/24/solid';
import { getPhotoSessionPaymentReceipts, downloadPaymentReceiptPdf } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

/**
 * PhotoSessionPaymentReceiptsListModal Component
 * A modal to display a list of all payment receipts for a specific photo session.
 * Allows downloading individual receipts.
 *
 * Props:
 * - isOpen: Boolean to control modal visibility.
 * - onClose: Function to call when the modal should be closed.
 * - photoSessionId: The ID of the photo session whose receipts are to be displayed.
 */
function PhotoSessionPaymentReceiptsListModal({ isOpen, onClose, photoSessionId }) {
  const { authToken } = useAuth();
  const { showToast } = useToast();

  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch payment receipts for the given photo session
  useEffect(() => {
    if (isOpen && photoSessionId && authToken) {
      const fetchReceipts = async () => {
        setLoading(true);
        setError(null);
        try {
          // Note: The backend's add_payment for photo sessions currently
          // creates a PaymentReceipt with receipt_type='photography'
          // but the ForeignKey to PhotoSession is still commented out in models.py.
          // Once the ForeignKey is active, you can filter by photography_session=photoSessionId
          // For now, this will fetch all photography receipts.
          const data = await getPhotoSessionPaymentReceipts(authToken, photoSessionId);
          setReceipts(data);
        } catch (err) {
          console.error('Error fetching photo session receipts:', err);
          setError(`فشل جلب إيصالات الدفع: ${err.message}`);
          showToast(`فشل جلب إيصالات الدفع: ${err.message}`, 'error');
        } finally {
          setLoading(false);
        }
      };
      fetchReceipts();
    } else {
      setReceipts([]); // Clear receipts when modal closes
      setError(null);
    }
  }, [isOpen, photoSessionId, authToken, showToast]);

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
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition"
          title="إغلاق"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">إيصالات الدفع لجلسة التصوير</h2>

        {loading && (
          <div className="text-center py-5">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900 mx-auto"></div>
            <p className="text-gray-700 mt-3">جاري تحميل الإيصالات...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-center" role="alert">
            <strong className="font-bold">خطأ!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        {!loading && !error && receipts.length === 0 && (
          <div className="text-center py-10 text-gray-600">
            <p className="text-lg">لا توجد إيصالات دفع مسجلة لهذه الجلسة.</p>
          </div>
        )}

        {!loading && !error && receipts.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-3 px-4 text-right text-sm font-semibold text-gray-600 uppercase tracking-wider">
                    رقم الإيصال
                  </th>
                  <th className="py-3 px-4 text-right text-sm font-semibold text-gray-600 uppercase tracking-wider">
                    المبلغ
                  </th>
                  <th className="py-3 px-4 text-right text-sm font-semibold text-gray-600 uppercase tracking-wider">
                    طريقة الدفع
                  </th>
                  <th className="py-3 px-4 text-right text-sm font-semibold text-gray-600 uppercase tracking-wider">
                    التاريخ
                  </th>
                  <th className="py-3 px-4 text-right text-sm font-semibold text-gray-600 uppercase tracking-wider">
                    بواسطة
                  </th>
                  <th className="py-3 px-4 text-right text-sm font-semibold text-gray-600 uppercase tracking-wider">
                    إجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {receipts.map((receipt) => (
                  <tr key={receipt.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-gray-800">
                      {receipt.receipt_number}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-gray-700 font-semibold">
                      {parseFloat(receipt.paid_amount).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-gray-700">
                      {receipt.get_payment_method_display}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-gray-700">
                      {new Date(receipt.date_issued).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-gray-700">
                      {receipt.issued_by_username || 'N/A'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-left">
                      <button
                        onClick={() => handleDownloadReceipt(receipt.id)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-100 transition"
                        title="تنزيل الإيصال PDF"
                      >
                        <DocumentArrowDownIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default PhotoSessionPaymentReceiptsListModal;
