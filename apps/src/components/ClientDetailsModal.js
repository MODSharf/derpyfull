// src/components/ClientDetailsModal.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  XMarkIcon, PhoneIcon, EnvelopeIcon, MapPinIcon, DocumentTextIcon,
  CurrencyDollarIcon, PrinterIcon, CameraIcon, ReceiptPercentIcon, BookOpenIcon,
  CalendarDaysIcon, ClockIcon, MapIcon, TagIcon, UserIcon, PhotoIcon,
  CubeIcon, LinkIcon, ClipboardDocumentListIcon, ChatBubbleBottomCenterTextIcon,
  CheckCircleIcon, XCircleIcon // For delivered status
} from '@heroicons/react/24/solid';
import {
  getClientById,
  getClientPrintJobs,
  getClientPaymentReceipts,
  getClientTotalRemainingAmountCombined,
  getClientPhotoSessions,
  downloadPaymentReceiptPdf,
  generatePrintInvoicePdf,
  generatePhotoBookingReceiptPdf,
  generatePhotoInvoicePdf,
  updatePrintJob, // NEW: Import updatePrintJob
  updatePhotoSession, // NEW: Import updatePhotoSession
} from '../services/apiService';
import { useAuth } from '../contexts/AuthContext'; // NEW: Import useAuth
import { useToast } from '../contexts/ToastContext';

/**
 * ClientDetailsModal Component
 * Displays detailed information about a specific client,
 * including their print jobs, photo sessions, payment receipts, and total remaining amount.
 * Allows managers to change the status of print jobs and photo sessions directly.
 *
 * Props:
 * - isOpen: Boolean to control modal visibility.
 * - onClose: Function to call when the modal should be closed.
 * - clientId: The ID of the client whose details are to be displayed.
 * - initialTab: (Optional) String, specifies which tab to open initially ('printing' or 'photography'). Defaults to 'printing'.
 */
function ClientDetailsModal({ isOpen, onClose, clientId, initialTab = 'printing' }) {
  const { authToken, isManager } = useAuth(); // NEW: Get isManager from AuthContext
  const { showToast } = useToast();
  const [clientDetails, setClientDetails] = useState(null);
  const [clientPrintJobs, setClientPrintJobs] = useState([]);
  const [clientPhotoSessions, setClientPhotoSessions] = useState([]);
  const [clientPaymentReceipts, setClientPaymentReceipts] = useState([]);
  const [totalRemainingAmount, setTotalRemainingAmount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(initialTab);

  // Define status choices (must match backend models.py for values, display names can be custom)
  const PRINT_JOB_STATUS_CHOICES = {
    'pending': 'قيد الانتظار',
    'in_progress': 'قيد التنفيذ',
    'completed': 'مكتملة',
    'ready_for_delivery': 'جاهزة للتسليم',
    'delivered': 'تم التسليم',
    'cancelled': 'ملغاة',
    'partially_paid': 'مدفوعة جزئياً',
  };

  const PHOTO_SESSION_STATUS_CHOICES = {
    'scheduled': 'مجدولة',
    'in_progress': 'قيد التنفيذ',
    'completed': 'مكتملة',
    'delivered': 'تم التسليم',
    'cancelled': 'ملغاة',
    'processing': 'قيد المعالجة',
    'ready_for_delivery': 'جاهزة للتسليم',
    'partially_paid': 'مدفوعة جزئياً',
  };

  const fetchData = useCallback(async () => {
    if (!authToken || !clientId) {
      setError('Authentication token or Client ID is missing.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const details = await getClientById(authToken, clientId);
      setClientDetails(details);

      const printJobs = await getClientPrintJobs(authToken, clientId);
      setClientPrintJobs(printJobs);

      const photoSessions = await getClientPhotoSessions(authToken, clientId);
      setClientPhotoSessions(photoSessions);

      const receipts = await getClientPaymentReceipts(authToken, clientId);
      setClientPaymentReceipts(receipts);

      const remainingAmountData = await getClientTotalRemainingAmountCombined(authToken, clientId);
      setTotalRemainingAmount(remainingAmountData.total_remaining_amount);

    } catch (err) {
      console.error('Error fetching client details and related data:', err);
      setError(`فشل جلب تفاصيل العميل والبيانات المرتبطة: ${err.message}`);
      showToast(`فشل جلب تفاصيل العميل والبيانات المرتبطة: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [authToken, clientId, showToast]);

  useEffect(() => {
    if (isOpen) {
      fetchData();
      setActiveTab(initialTab);
    } else {
      // Reset state when modal closes
      setClientDetails(null);
      setClientPrintJobs([]);
      setClientPhotoSessions([]);
      setClientPaymentReceipts([]);
      setTotalRemainingAmount(null);
      setError(null);
      setLoading(true);
      setActiveTab('printing'); // Reset to default tab
    }
  }, [isOpen, fetchData, initialTab]);

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

  const handleGeneratePrintFinalInvoice = useCallback(async (printJobId) => {
    if (!authToken) {
      showToast('خطأ: لا يوجد توكن مصادقة. يرجى تسجيل الدخول.', 'error');
      return;
    }
    try {
      await generatePrintInvoicePdf(authToken, printJobId);
      showToast('تم تنزيل فاتورة الطباعة النهائية بنجاح!', 'success');
    } catch (err) {
      console.error('Error generating final print invoice:', err);
      showToast(`فشل تنزيل فاتورة الطباعة النهائية: ${err.message}`, 'error');
    }
  }, [authToken, showToast]);

  const handleGeneratePhotoBookingReceipt = useCallback(async (sessionId) => {
    if (!authToken) {
      showToast('خطأ: لا يوجد توكن مصادقة. يرجى تسجيل الدخول.', 'error');
      return;
    }
    try {
      showToast('جاري تنزيل إيصال حجز التصوير...', 'info');
      await generatePhotoBookingReceiptPdf(authToken, sessionId);
      showToast('تم تنزيل إيصال حجز التصوير بنجاح!', 'success');
    } catch (err) {
      console.error('Error generating photo booking receipt:', err);
      showToast(`فشل تنزيل إيصال حجز التصوير: ${err.message}`, 'error');
    }
  }, [authToken, showToast]);

  const handleGeneratePhotoFinalInvoice = useCallback(async (sessionId) => {
    if (!authToken) {
      showToast('خطأ: لا يوجد توكن مصادقة. يرجى تسجيل الدخول.', 'error');
      return;
    }
    try {
      await generatePhotoInvoicePdf(authToken, sessionId);
      showToast('تم تنزيل فاتورة جلسة التصوير النهائية بنجاح!', 'success');
    } catch (err) {
      console.error('Error generating photo final invoice:', err);
      showToast(`فشل تنزيل فاتورة جلسة التصوير النهائية: ${err.message}`, 'error');
    }
  }, [authToken, showToast]);

  // NEW: Handle status change for Print Jobs
  const handlePrintJobStatusChange = useCallback(async (jobId, newStatus) => {
    if (!authToken) {
      showToast('خطأ: لا يوجد توكن مصادقة. يرجى تسجيل الدخول.', 'error');
      return;
    }
    try {
      await updatePrintJob(authToken, jobId, { status: newStatus });
      showToast('تم تحديث حالة طلب الطباعة بنجاح!', 'success');
      fetchData(); // Re-fetch all data to update the UI
    } catch (err) {
      console.error('Error updating print job status:', err);
      showToast(`فشل تحديث حالة طلب الطباعة: ${err.message}`, 'error');
    }
  }, [authToken, showToast, fetchData]);

  // NEW: Handle status change for Photo Sessions
  const handlePhotoSessionStatusChange = useCallback(async (sessionId, newStatus) => {
    if (!authToken) {
      showToast('خطأ: لا يوجد توكن مصادقة. يرجى تسجيل الدخول.', 'error');
      return;
    }
    try {
      await updatePhotoSession(authToken, sessionId, { status: newStatus });
      showToast('تم تحديث حالة جلسة التصوير بنجاح!', 'success');
      fetchData(); // Re-fetch all data to update the UI
    } catch (err) {
      console.error('Error updating photo session status:', err);
      showToast(`فشل تحديث حالة جلسة التصوير: ${err.message}`, 'error');
    }
  }, [authToken, showToast, fetchData]);


  // Helper function to get badge classes based on status
  const getStatusBadgeClass = useCallback((status) => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
      case 'processing':
      case 'in_shooting':
      case 'raw_material_uploaded':
      case 'in_editing':
      case 'ready_for_review':
      case 'ready_for_printing':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
      case 'scheduled':
        return 'bg-orange-100 text-orange-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'partially_paid':
        return 'bg-purple-100 text-purple-800';
      case 'ready_for_delivery':
        return 'bg-teal-100 text-teal-800';
      case 'not_started':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return '-';
      }
      return date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
      console.error("Error formatting date:", e);
      return '-';
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '-';
    return timeString.substring(0, 5);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition"
          title="إغلاق"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center border-b pb-3">
          تفاصيل العميل
        </h2>

        {loading && (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="text-gray-700 mt-4">جاري تحميل تفاصيل العميل...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-center" role="alert">
            <strong className="font-bold">خطأ!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        {!loading && !error && clientDetails && (
          <div className="space-y-6">
            {/* Client Basic Info */}
            <div className="bg-gray-50 p-4 rounded-md shadow-sm border border-gray-200">
              <p className="text-gray-800 font-semibold text-lg mb-2">{clientDetails.name}</p>
              {clientDetails.phone && (
                <div className="flex items-center text-gray-700 mb-1">
                  <PhoneIcon className="h-5 w-5 text-gray-500 ml-2" />
                  <span>{clientDetails.phone}</span>
                  <a href={`tel:${clientDetails.phone}`} className="mr-2 text-blue-600 hover:underline" title="اتصال مباشر">
                    (اتصال)
                  </a>
                </div>
              )}
              {clientDetails.email && (
                <div className="flex items-center text-gray-700 mb-1">
                  <EnvelopeIcon className="h-5 w-5 text-gray-500 ml-2" />
                  <span>{clientDetails.email}</span>
                  <a href={`mailto:${clientDetails.email}`} className="mr-2 text-blue-600 hover:underline" title="إرسال بريد إلكتروني">
                    (بريد)
                  </a>
                </div>
              )}
              {clientDetails.address && (
                <div className="flex items-start text-gray-700">
                  <MapPinIcon className="h-5 w-5 text-gray-500 ml-2 mt-1" />
                  <span>{clientDetails.address}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-3 mt-3">
                <p className="text-gray-600 text-sm">
                  تاريخ الإنشاء: {new Date(clientDetails.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Total Remaining Amount */}
            {totalRemainingAmount !== null && (
              <div className="bg-yellow-50 p-4 rounded-md shadow-sm border border-yellow-200 flex items-center justify-between">
                <p className="text-yellow-800 font-bold text-lg">
                  إجمالي المبلغ المتبقي على جميع الطلبات:
                </p>
                <span className="text-yellow-900 font-extrabold text-xl">
                  {parseFloat(totalRemainingAmount).toFixed(2)} SAR
                </span>
              </div>
            )}

            {/* Tabs for Printing and Photography */}
            <div className="flex border-b border-gray-200 mb-4">
              <button
                onClick={() => setActiveTab('printing')}
                className={`py-2 px-4 text-center text-lg font-medium ${activeTab === 'printing' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                طلبات الطباعة ({clientPrintJobs.length})
              </button>
              <button
                onClick={() => setActiveTab('photography')}
                className={`py-2 px-4 text-center text-lg font-medium ${activeTab === 'photography' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                جلسات التصوير ({clientPhotoSessions.length})
              </button>
              <button
                onClick={() => setActiveTab('receipts')}
                className={`py-2 px-4 text-center text-lg font-medium ${activeTab === 'receipts' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                الإيصالات ({clientPaymentReceipts.length})
              </button>
            </div>

            {/* Content based on active tab */}
            {activeTab === 'printing' && (
              <div className="bg-white p-4 rounded-md shadow-md border border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2 flex items-center">
                  <PrinterIcon className="h-6 w-6 ml-2 text-blue-600" />
                  طلبات الطباعة المرتبطة
                </h3>
                {clientPrintJobs.length === 0 ? (
                  <p className="text-gray-600 text-center py-4">لا توجد طلبات طباعة لهذا العميل.</p>
                ) : (
                  <div className="max-h-80 overflow-y-auto">
                    {clientPrintJobs.map((job) => (
                      <div key={job.id} className="border-b border-gray-100 last:border-b-0 py-3 flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-gray-800">
                            طلب رقم: {job.receipt_number || job.id}
                          </p>
                          <p className="text-gray-600 text-sm">
                            النوع: {job.print_type_display} | الحجم: {job.size_display}
                          </p>
                          <p className="text-gray-600 text-sm">
                            المبلغ الكلي: {parseFloat(job.total_amount).toFixed(2)} | المدفوع: {parseFloat(job.paid_amount).toFixed(2)} | المتبقي: {parseFloat(job.remaining_amount).toFixed(2)}
                          </p>
                          {isManager ? ( // NEW: Allow managers to change status
                                <select
                                  value={job.status}
                                  onChange={(e) => handlePrintJobStatusChange(job.id, e.target.value)}
                                  className="block w-40 mt-2 rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-sm"
                                >
                                  {Object.entries(PRINT_JOB_STATUS_CHOICES).map(([key, value]) => (
                                    <option key={key} value={key}>{value}</option>
                                  ))}
                                </select>
                              ) : (
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(job.status)} mt-2`}>
                                  {job.status_display}
                                </span>
                              )}
                        </div>
                        <div className="flex gap-2">
                          {parseFloat(job.remaining_amount) === 0 && (
                            <button
                              onClick={() => handleGeneratePrintFinalInvoice(job.id)}
                              className="p-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition"
                              title="تنزيل فاتورة نهائية للطباعة"
                            >
                              <DocumentTextIcon className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'photography' && (
              <div className="bg-white p-4 rounded-md shadow-md border border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2 flex items-center">
                  <CameraIcon className="h-6 w-6 ml-2 text-red-600" />
                  جلسات التصوير المرتبطة
                </h3>
                {clientPhotoSessions.length === 0 ? (
                  <p className="text-gray-600 text-center py-4">لا توجد جلسات تصوير لهذا العميل.</p>
                ) : (
                  <div className="max-h-80 overflow-y-auto">
                    {clientPhotoSessions.map((session) => (
                      <div key={session.id} className="border-b border-gray-100 last:border-b-0 py-3">
                        {/* Session Basic Details */}
                        <div className="bg-gray-50 p-3 rounded-md mb-3 border border-gray-100">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 mb-2">
                                <p className="font-semibold text-gray-800 flex items-center">
                                    <TagIcon className="h-5 w-5 text-gray-500 ml-2" />
                                    جلسة رقم: {session.receipt_number || session.id}
                                </p>
                                <p className="text-gray-700 flex items-center">
                                    <UserIcon className="h-5 w-5 text-gray-500 ml-2" />
                                    المصور: {session.photographer?.name || 'غير محدد'}
                                </p>
                                <p className="text-gray-700 flex items-center">
                                    <CalendarDaysIcon className="h-5 w-5 text-gray-500 ml-2" />
                                    التاريخ: {formatDate(session.session_date)}
                                </p>
                                <p className="text-gray-700 flex items-center">
                                    <ClockIcon className="h-5 w-5 text-gray-500 ml-2" />
                                    الوقت: {formatTime(session.session_time) || '-'}
                                </p>
                                <p className="text-gray-700 flex items-center">
                                    <PhotoIcon className="h-5 w-5 text-gray-500 ml-2" />
                                    مسلسل الصور: {session.photo_serial_number}
                                </p>
                                <p className="text-gray-700 flex items-center">
                                    <MapIcon className="h-5 w-5 text-gray-500 ml-2" />
                                    الموقع: {session.location || '-'}
                                </p>
                                <p className="text-gray-700 flex items-center">
                                    <CubeIcon className="h-5 w-5 text-gray-500 ml-2" />
                                    الباقة: {session.package?.name || 'غير محددة'}
                                </p>
                                <p className="text-gray-700 flex items-center col-span-2">
                                    <TagIcon className="h-5 w-5 text-gray-500 ml-2" />
                                    نوع الحدث: {session.event_type_display || 'غير محدد'}
                                </p>
                            </div>
                        </div>

                        {/* Financial Details */}
                        <div className="bg-blue-50 p-3 rounded-md mb-3 border border-blue-100">
                            <p className="text-gray-700 font-semibold flex items-center">
                                <CurrencyDollarIcon className="h-5 w-5 text-gray-500 ml-2" />
                                المبلغ الكلي: {parseFloat(session.total_amount).toFixed(2)}
                            </p>
                            <p className="text-gray-700 font-semibold flex items-center">
                                <CurrencyDollarIcon className="h-5 w-5 text-gray-500 ml-2" />
                                المدفوع: {parseFloat(session.paid_amount).toFixed(2)}
                            </p>
                            <p className="text-red-600 font-bold text-lg flex items-center">
                                <CurrencyDollarIcon className="h-5 w-5 text-red-600 ml-2" />
                                المتبقي: {parseFloat(session.remaining_amount).toFixed(2)}
                            </p>
                        </div>

                        {/* Status and Progress */}
                        <div className="bg-green-50 p-3 rounded-md mb-3 border border-green-100">
                            <p className="mb-2">
                                <span className="font-semibold text-gray-700 ml-2">الحالة:</span>
                                {isManager ? ( // NEW: Allow managers to change status
                                    <select
                                        value={session.status}
                                        onChange={(e) => handlePhotoSessionStatusChange(session.id, e.target.value)}
                                        className="block w-40 mt-2 rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-sm"
                                    >
                                        {Object.entries(PHOTO_SESSION_STATUS_CHOICES).map(([key, value]) => (
                                            <option key={key} value={key}>{value}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(session.status)}`}>
                                        {session.status_display}
                                    </span>
                                )}
                            </p>
                            <p className="mb-2">
                                <span className="font-semibold text-gray-700 ml-2">حالة التعديل:</span>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(session.editing_status)}`}>
                                    {session.editing_status_display}
                                </span>
                            </p>
                            {session.final_delivery_date && (
                                <p className="text-gray-600 text-sm flex items-center mb-1">
                                    <CalendarDaysIcon className="h-5 w-5 text-gray-500 ml-2" />
                                    تاريخ التسليم النهائي: {formatDate(session.final_delivery_date)}
                                </p>
                            )}
                            {session.num_digital_photos_delivered > 0 && (
                                <p className="text-gray-600 text-sm flex items-center mb-1">
                                    <PhotoIcon className="h-5 w-5 text-gray-500 ml-2" />
                                    صور رقمية مسلمة: {session.num_digital_photos_delivered}
                                </p>
                            )}
                            {session.num_printed_photos_delivered > 0 && (
                                <p className="text-gray-600 text-sm flex items-center mb-1">
                                    <PrinterIcon className="h-5 w-5 text-gray-500 ml-2" />
                                    صور مطبوعة مسلمة: {session.num_printed_photos_delivered}
                                </p>
                            )}
                            {session.photo_serial_number && (
                                <p className="text-gray-600 text-sm flex items-center mb-1">
                                    <TagIcon className="h-5 w-5 text-gray-500 ml-2" />
                                    رقم مسلسل الصورة: {session.photo_serial_number}
                                </p>
                            )}
                            {session.final_gallery_link && (
                                <p className="text-gray-600 text-sm flex items-center col-span-2">
                                    <LinkIcon className="h-5 w-5 text-blue-600 ml-2" />
                                    رابط المعرض:
                                    <a href={session.final_gallery_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate mr-1">
                                        {session.final_gallery_link}
                                    </a>
                                </p>
                            )}
                        </div>

                        {/* Delivery Status Checkboxes with icons */}
                        <div className="bg-indigo-50 p-3 rounded-md mb-3 border border-indigo-100">
                            <p className="text-gray-700 text-sm flex items-center mb-1">
                                {session.digital_photos_delivered ? <CheckCircleIcon className="h-5 w-5 text-green-500 ml-2" /> : <XCircleIcon className="h-5 w-5 text-red-500 ml-2" />}
                                تم تسليم الصور الرقمية
                            </p>
                            <p className="text-gray-700 text-sm flex items-center mb-1">
                                {session.printed_photos_delivered ? <CheckCircleIcon className="h-5 w-5 text-green-500 ml-2" /> : <XCircleIcon className="h-5 w-5 text-red-500 ml-2" />}
                                تم تسليم الصور المطبوعة
                            </p>
                            <p className="text-gray-700 text-sm flex items-center mb-1">
                                {session.album_delivered ? <CheckCircleIcon className="h-5 w-5 text-green-500 ml-2" /> : <XCircleIcon className="h-5 w-5 text-red-500 ml-2" />}
                                تم تسليم الألبوم
                            </p>
                            <p className="text-gray-700 text-sm flex items-center">
                                {session.frame_delivered ? <CheckCircleIcon className="h-5 w-5 text-green-500 ml-2" /> : <XCircleIcon className="h-5 w-5 text-red-500 ml-2" />}
                                تم تسليم الإطار
                            </p>
                        </div>


                        {/* Notes Section */}
                        {(session.agreement_notes || session.notes) && (
                            <div className="bg-yellow-50 p-3 rounded-md mb-3 border border-yellow-100">
                                {session.agreement_notes && (
                                    <p className="text-gray-600 text-sm mb-1 flex items-start">
                                        <ChatBubbleBottomCenterTextIcon className="h-5 w-5 text-gray-500 ml-2 mt-0.5" />
                                        <span className="font-semibold">ملاحظات الاتفاقية:</span> {session.agreement_notes}
                                    </p>
                                )}
                                {session.notes && (
                                    <p className="text-gray-600 text-sm flex items-start">
                                        <ChatBubbleBottomCenterTextIcon className="h-5 w-5 text-gray-500 ml-2 mt-0.5" />
                                        <span className="font-semibold">ملاحظات عامة:</span> {session.notes}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-2 mt-4 border-t pt-4 border-gray-200">
                            <button
                                onClick={() => handleGeneratePhotoBookingReceipt(session.id)}
                                className="p-2 bg-yellow-500 text-white rounded-full hover:bg-yellow-600 transition"
                                title="تنزيل إيصال حجز التصوير"
                            >
                                <BookOpenIcon className="h-5 w-5" />
                            </button>
                            {parseFloat(session.remaining_amount) === 0 && (
                                <button
                                    onClick={() => handleGeneratePhotoFinalInvoice(session.id)}
                                    className="p-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition"
                                    title="تنزيل فاتورة نهائية للتصوير"
                                >
                                    <ReceiptPercentIcon className="h-5 w-5" />
                                </button>
                            )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'receipts' && (
              <div className="bg-white p-4 rounded-md shadow-md border border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2 flex items-center">
                  <CurrencyDollarIcon className="h-6 w-6 ml-2 text-green-600" />
                  إيصالات الدفع المرتبطة ({clientPaymentReceipts.length})
                </h3>
                {clientPaymentReceipts.length === 0 ? (
                  <p className="text-gray-600 text-center py-4">لا توجد إيصالات دفع لهذا العميل.</p>
                ) : (
                  <div className="max-h-60 overflow-y-auto">
                    {clientPaymentReceipts.map((receipt) => (
                      <div key={receipt.id} className="border-b border-gray-100 last:border-b-0 py-3 flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-gray-800">
                            إيصال رقم: {receipt.receipt_number || receipt.id}
                          </p>
                          <p className="text-gray-600 text-sm">
                            النوع: {receipt.receipt_type_display}
                          </p>
                          <p className="text-gray-600 text-sm">
                            المبلغ المدفوع: {parseFloat(receipt.paid_amount).toFixed(2)}
                          </p>
                          <p className="text-gray-600 text-sm">
                            تاريخ: {new Date(receipt.date_issued).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {receipt.notes && (
                            <p className="text-gray-600 text-sm">
                              ملاحظات: {receipt.notes}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDownloadReceipt(receipt.id)}
                          className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition"
                          title="تنزيل الإيصال"
                        >
                          <DocumentTextIcon className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {!loading && !error && !clientDetails && (
          <div className="text-center py-10 text-gray-600">
            <p className="text-lg">لا يمكن العثور على تفاصيل العميل.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ClientDetailsModal;
