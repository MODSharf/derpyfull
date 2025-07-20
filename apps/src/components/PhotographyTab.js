// src/components/PhotographyTab.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  getPhotoSessions,
  deletePhotoSession,
  getPhotoSessionById,
  addPaymentToPhotoSession,
  getPhotoSessionPaymentReceipts,
  generatePhotoInvoicePdf, // This is for the final blue receipt/invoice
  generatePhotoBookingReceiptPdf, // NEW: Import the new function for booking receipt
  getPhotographyPackages,
  getPhotographers,
} from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import ConfirmationModal from './ConfirmationModal';
import PhotoSessionForm from './PhotoSessionForm';
import PhotoSessionPaymentFormModal from './PhotoSessionPaymentFormModal';
import PhotoSessionPaymentReceiptsListModal from './PhotoSessionPaymentReceiptsListModal';

import {
  PlusCircleIcon,
  PencilIcon,
  TrashIcon,
  CurrencyDollarIcon,
  DocumentDuplicateIcon,
  ReceiptPercentIcon,
  MagnifyingGlassIcon,
  TableCellsIcon,
  ListBulletIcon,
  BookOpenIcon, // Icon for booking receipt
} from '@heroicons/react/24/solid';

/**
 * PhotographyTab Component
 * Manages the display, search, addition, editing, and deletion of photo sessions.
 * Allows switching between card view and list view.
 * Will also support adding new payments, viewing receipts, and generating invoices for sessions.
 *
 * Props:
 * - onViewClientDetails: Function to open the client details modal, passed from AppContent.
 */
function PhotographyTab({ onViewClientDetails }) {
  const { authToken, isManager } = useAuth();
  const { showToast } = useToast();

  const [photoSessions, setPhotoSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'cards'

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [initialSessionData, setInitialSessionData] = useState(null);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedSessionForPayment, setSelectedSessionForPayment] = useState(null);

  const [showReceiptsListModal, setShowReceiptsListModal] = useState(false);
  const [selectedSessionForReceipts, setSelectedSessionForReceipts] = useState(null);

  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [sessionToDeleteId, setSessionToDeleteId] = useState(null);

  // Fetch photo sessions
  const fetchPhotoSessions = useCallback(async () => {
    if (!authToken) {
      setError('Authentication token is missing.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getPhotoSessions(authToken, searchTerm);
      setPhotoSessions(data);
    } catch (err) {
      console.error('Error fetching photo sessions:', err);
      setError(`فشل جلب جلسات التصوير: ${err.message}`);
      showToast(`فشل جلب جلسات التصوير: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [authToken, searchTerm, showToast]);

  useEffect(() => {
    fetchPhotoSessions();
  }, [fetchPhotoSessions]);

  // Handle session save (add/edit)
  const handleSessionSaved = useCallback(() => {
    setShowAddForm(false);
    setEditingSessionId(null);
    setInitialSessionData(null);
    fetchPhotoSessions(); // Refresh list
    showToast('تم حفظ جلسة التصوير بنجاح!', 'success');
  }, [fetchPhotoSessions, showToast]);

  // Handle edit photo session
  const handleEditPhotoSession = useCallback(async (sessionId) => {
    if (!authToken) {
      showToast('خطأ: لا يوجد توكن مصادقة. يرجى تسجيل الدخول.', 'error');
      return;
    }
    try {
      const sessionData = await getPhotoSessionById(authToken, sessionId);
      setInitialSessionData(sessionData);
      setEditingSessionId(sessionId);
      setShowAddForm(true);
    } catch (err) {
      console.error('Error fetching photo session for edit:', err);
      showToast(`فشل جلب بيانات الجلسة للتعديل: ${err.message}`, 'error');
    }
  }, [authToken, showToast]);

  // Handle delete photo session confirmation
  const confirmDeletePhotoSession = useCallback((sessionId) => {
    setSessionToDeleteId(sessionId);
    setShowConfirmDeleteModal(true);
  }, []);

  // Handle delete photo session
  const handleDeletePhotoSession = useCallback(async () => {
    if (!authToken || !sessionToDeleteId) {
      showToast('خطأ: لا يوجد توكن مصادقة أو معرف جلسة.', 'error');
      return;
    }
    setLoading(true);
    try {
      await deletePhotoSession(authToken, sessionToDeleteId);
      showToast('تم حذف جلسة التصوير بنجاح!', 'success');
      fetchPhotoSessions(); // Refresh list
    } catch (err) {
      console.error('Error deleting photo session:', err);
      showToast(`فشل حذف جلسة التصوير: ${err.message}`, 'error');
    } finally {
      setLoading(false);
      setShowConfirmDeleteModal(false);
      setSessionToDeleteId(null);
    }
  }, [authToken, sessionToDeleteId, fetchPhotoSessions, showToast]);

  // Handle add payment to photo session
  const handleAddPayment = useCallback((session) => {
    setSelectedSessionForPayment(session);
    setShowPaymentModal(true);
  }, []);

  const handlePaymentSuccess = useCallback(() => {
    setShowPaymentModal(false);
    setSelectedSessionForPayment(null);
    fetchPhotoSessions(); // Refresh sessions list to update paid amount/status
    showToast('تم تسجيل الدفعة بنجاح!', 'success');
  }, [fetchPhotoSessions, showToast]);

  const handleClosePaymentModal = useCallback(() => {
    setShowPaymentModal(false);
    setSelectedSessionForPayment(null);
  }, []);

  // Handle view receipts list for photo session
  const handleViewReceipts = useCallback((session) => {
    setSelectedSessionForReceipts(session);
    setShowReceiptsListModal(true);
  }, []);

  const handleCloseReceiptsListModal = useCallback(() => {
    setShowReceiptsListModal(false);
    setSelectedSessionForReceipts(null);
  }, []);

  // Handle generate booking receipt (Yellow) for photo session
  const handleGenerateBookingReceipt = useCallback(async (sessionId) => {
    if (!authToken) {
      showToast('خطأ: لا يوجد توكن مصادقة. يرجى تسجيل الدخول.', 'error');
      return;
    }
    try {
      showToast('جاري تنزيل إيصال حجز التصوير...', 'info');
      await generatePhotoBookingReceiptPdf(authToken, sessionId); // Call the new API function
      showToast('تم تنزيل إيصال حجز التصوير بنجاح!', 'success');
    } catch (err) {
      console.error('Error generating photo booking receipt:', err);
      showToast(`فشل تنزيل إيصال حجز التصوير: ${err.message}`, 'error');
    }
  }, [authToken, showToast]);


  // Handle generate final invoice (Blue) for photo session
  const handleGenerateInvoice = useCallback(async (sessionId) => {
    if (!authToken) {
      showToast('خطأ: لا يوجد توكن مصادقة. يرجى تسجيل الدخول.', 'error');
      return;
    }
    try {
      await generatePhotoInvoicePdf(authToken, sessionId); // This is the existing function for final invoice/receipt
      showToast('تم تنزيل فاتورة جلسة التصوير النهائية بنجاح!', 'success');
    } catch (err) {
      console.error('Error generating photo invoice:', err);
      showToast(`فشل تنزيل فاتورة جلسة التصوير النهائية: ${err.message}`, 'error');
    }
  }, [authToken, showToast]);


  // UPDATED: getStatusColorClass to reflect new statuses
  const getStatusColorClass = useCallback((status) => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return 'text-green-600';
      case 'in_progress':
      case 'processing':
      case 'in_shooting': // New status
      case 'raw_material_uploaded': // New status
      case 'in_editing': // Existing, but now more specific
      case 'ready_for_review': // New status
      case 'ready_for_printing': // New status
        return 'text-blue-600';
      case 'scheduled':
        return 'text-orange-500';
      case 'cancelled':
        return 'text-red-600';
      case 'partially_paid':
        return 'text-purple-600';
      case 'ready_for_delivery':
        return 'text-teal-600';
      case 'not_started': // For editing status
        return 'text-gray-500';
      default:
        return 'text-gray-700';
    }
  }, []);

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Helper function to format time
  const formatTime = (timeString) => {
    if (!timeString) return '-';
    return timeString.substring(0, 5); // Assumes HH:MM:SS format from backend
  };


  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-semibold text-gray-800">إدارة جلسات التصوير</h2>
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="relative">
            <input
              type="text"
              placeholder="بحث عن جلسة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="p-3 pl-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 w-64"
            />
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2" />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              title="عرض كقائمة"
            >
              <ListBulletIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'cards' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              title="عرض كبطاقات"
            >
              <TableCellsIcon className="h-5 w-5" />
            </button>
          </div>
          <button
            onClick={() => {
              setShowAddForm(true);
              setEditingSessionId(null);
              setInitialSessionData(null);
            }}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-full shadow-lg flex items-center transition duration-300 transform hover:scale-105"
          >
            <PlusCircleIcon className="h-6 w-6 ml-2" />
            إضافة جلسة جديدة
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg shadow-inner">
          <PhotoSessionForm
            onSessionSaved={handleSessionSaved}
            sessionId={editingSessionId}
            initialData={initialSessionData}
            isManager={isManager} // Pass isManager prop here */}
          />
        </div>
      )}

      {loading && (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="text-gray-700 mt-4">جاري تحميل جلسات التصوير...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-center" role="alert">
          <strong className="font-bold">خطأ!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {!loading && !error && photoSessions.length === 0 && (
        <div className="text-center py-10 text-gray-600">
          <p className="text-lg">لا توجد جلسات تصوير لعرضها.</p>
          <p className="text-md mt-2">ابدأ بإضافة جلسة تصوير جديدة!</p>
        </div>
      )}

      {!loading && !error && photoSessions.length > 0 && (
        <>
          {viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {photoSessions.map((session) => (
                <div key={session.id} className="bg-gray-50 rounded-lg shadow-md p-6 border border-gray-200 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      جلسة رقم: {session.receipt_number || session.id}
                    </h3>
                    <p className="text-gray-700 mb-1">
                      <span className="font-semibold">العميل:</span>{' '}
                      <button
                        onClick={() => onViewClientDetails(session.client.id, 'photography')} //* ADDED 'photography' tab parameter */}
                        className="text-blue-600 hover:underline"
                        title="عرض تفاصيل العميل"
                      >
                        {session.client.name}
                      </button>
                    </p>
                    <p className="text-gray-700 mb-1">
                      <span className="font-semibold">الباقة:</span>{' '}
                      {session.package ? session.package.name : 'غير محددة'}
                    </p>
                    <p className="text-gray-700 mb-1">
                      <span className="font-semibold">المصور:</span>{' '}
                      {session.photographer ? session.photographer.name : 'غير محدد'}
                    </p>
                    <p className="text-gray-700 mb-1">
                      <span className="font-semibold">التاريخ:</span>{' '}
                      {formatDate(session.session_date)}
                      {session.session_time && ` - ${formatTime(session.session_time)}`}
                    </p>
                    <p className="text-gray-700 mb-1">
                      <span className="font-semibold">المبلغ الكلي:</span> {parseFloat(session.total_amount).toFixed(2)}
                    </p>
                    <p className="text-gray-700 mb-1">
                      <span className="font-semibold">المبلغ المدفوع:</span> {parseFloat(session.paid_amount).toFixed(2)}
                    </p>
                    <p className="text-gray-700 mb-2">
                      <span className="font-semibold">المبلغ المتبقي:</span>{' '}
                      <span className="font-bold text-red-600">{parseFloat(session.remaining_amount).toFixed(2)}</span>
                    </p>
                    <p className={`text-lg font-semibold ${getStatusColorClass(session.status)}`}>
                      الحالة: {session.status_display}
                    </p>
                    {/* --- Display NEW FIELDS in Card View --- */}
                    {session.event_type_display && (
                      <p className="text-gray-700 text-sm mb-1">
                        <span className="font-semibold">نوع الحدث:</span> {session.event_type_display}
                      </p>
                    )}
                    {session.final_delivery_date && (
                      <p className="text-gray-700 text-sm mb-1">
                        <span className="font-semibold">تاريخ التسليم النهائي:</span> {formatDate(session.final_delivery_date)}
                      </p>
                    )}
                    {session.num_digital_photos_delivered > 0 && (
                      <p className="text-gray-700 text-sm mb-1">
                        <span className="font-semibold">صور رقمية مسلمة:</span> {session.num_digital_photos_delivered}
                      </p>
                    )}
                    {session.num_printed_photos_delivered > 0 && (
                      <p className="text-gray-700 text-sm mb-1">
                        <span className="font-semibold">صور مطبوعة مسلمة:</span> {session.num_printed_photos_delivered}
                      </p>
                    )}
                    {session.photo_serial_number && (
                      <p className="text-gray-700 text-sm mb-1">
                        <span className="font-semibold">رقم مسلسل الصورة:</span> {session.photo_serial_number}
                      </p>
                    )}
                    {session.final_gallery_link && (
                      <p className="text-gray-700 text-sm mb-1">
                        <span className="font-semibold">رابط المعرض النهائي:</span>{' '}
                        <a href={session.final_gallery_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                          {session.final_gallery_link}
                        </a>
                      </p>
                    )}
                    {session.editing_status_display && (
                      <p className="text-gray-700 text-sm mb-1">
                        <span className="font-semibold">حالة التعديل:</span> {session.editing_status_display}
                      </p>
                    )}
                    {session.agreement_notes && (
                      <p className="text-gray-700 text-sm mb-1">
                        <span className="font-semibold">ملاحظات الاتفاقية:</span> {session.agreement_notes}
                      </p>
                    )}
                    {/* --- END NEW FIELDS in Card View --- */}
                    {session.notes && (
                      <p className="text-gray-600 text-sm mt-2">
                        <span className="font-semibold">ملاحظات عامة:</span> {session.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex justify-end gap-2 mt-4 border-t pt-4 border-gray-200">
                    {/* Actions for Photo Session */}
                    {isManager && parseFloat(session.remaining_amount) > 0 && (
                      <button
                        onClick={() => handleAddPayment(session)}
                        className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
                        title="إضافة دفعة"
                      >
                        <CurrencyDollarIcon className="h-5 w-5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleViewReceipts(session)}
                      className="p-2 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition"
                      title="عرض الإيصالات"
                    >
                      <DocumentDuplicateIcon className="h-5 w-5" />
                    </button>
                    {/* New button for Booking Receipt (Yellow) */}
                    <button
                      onClick={() => handleGenerateBookingReceipt(session.id)}
                      className="p-2 bg-yellow-500 text-white rounded-full hover:bg-yellow-600 transition"
                      title="تنزيل إيصال حجز"
                    >
                      <BookOpenIcon className="h-5 w-5" />
                    </button>
                    {/* Existing button for Final Invoice/Receipt (Blue) */}
                    {isManager && parseFloat(session.remaining_amount) === 0 && (
                      <button
                        onClick={() => handleGenerateInvoice(session.id)}
                        className="p-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition"
                        title="تنزيل فاتورة نهائية / إيصال تسليم"
                      >
                        <ReceiptPercentIcon className="h-5 w-5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleEditPhotoSession(session.id)}
                      className="p-2 text-yellow-600 hover:text-yellow-900 transition"
                      title="تعديل"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    {isManager && (
                      <button
                        onClick={() => confirmDeletePhotoSession(session.id)}
                        className="p-2 text-red-600 hover:text-red-900 transition"
                        title="حذف"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="py-3 px-4 text-right text-sm font-semibold text-gray-600 uppercase tracking-wider">
                      رقم الجلسة
                    </th>
                    <th className="py-3 px-4 text-right text-sm font-semibold text-gray-600 uppercase tracking-wider">
                      العميل
                    </th>
                    <th className="py-3 px-4 text-right text-sm font-semibold text-gray-600 uppercase tracking-wider">
                      الباقة
                    </th>
                    <th className="py-3 px-4 text-right text-sm font-semibold text-gray-600 uppercase tracking-wider">
                      المصور
                    </th>
                    <th className="py-3 px-4 text-right text-sm font-semibold text-gray-600 uppercase tracking-wider">
                      التاريخ والوقت
                    </th>
                    <th className="py-3 px-4 text-right text-sm font-semibold text-gray-600 uppercase tracking-wider">
                      نوع الحدث
                    </th>
                    <th className="py-3 px-4 text-right text-sm font-semibold text-gray-600 uppercase tracking-wider">
                      المبلغ الكلي
                    </th>
                    <th className="py-3 px-4 text-right text-sm font-semibold text-gray-600 uppercase tracking-wider">
                      المدفوع
                    </th>
                    <th className="py-3 px-4 text-right text-sm font-semibold text-gray-600 uppercase tracking-wider">
                      المتبقي
                    </th>
                    <th className="py-3 px-4 text-right text-sm font-semibold text-gray-600 uppercase tracking-wider">
                      الحالة
                    </th>
                    <th className="py-3 px-4 text-right text-sm font-semibold text-gray-600 uppercase tracking-wider">
                      حالة التعديل
                    </th>
                    <th className="py-3 px-4 text-right text-sm font-semibold text-gray-600 uppercase tracking-wider">
                      تاريخ التسليم النهائي
                    </th>
                    <th className="py-3 px-4 text-right text-sm font-semibold text-gray-600 uppercase tracking-wider">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {photoSessions.map((session) => (
                    <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap text-gray-800">
                        {session.receipt_number || session.id}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <button
                          onClick={() => onViewClientDetails(session.client.id, 'photography')} //* ADDED 'photography' tab parameter */}
                          className="text-blue-600 hover:underline"
                          title="عرض تفاصيل العميل"
                        >
                          {session.client.name}
                        </button>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-gray-700">
                        {session.package ? session.package.name : 'غير محددة'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-gray-700">
                        {session.photographer ? session.photographer.name : 'غير محدد'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-gray-700">
                        {formatDate(session.session_date)}
                        {session.session_time && ` - ${formatTime(session.session_time)}`}
                      </td>
                      {/* --- Display NEW FIELDS in Table View --- */}
                      <td className="py-3 px-4 whitespace-nowrap text-gray-700">
                        {session.event_type_display || '-'}
                      </td>
                      {/* --- END NEW FIELDS in Table View --- */}
                      <td className="py-3 px-4 whitespace-nowrap text-gray-700">
                        {parseFloat(session.total_amount).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-gray-700">
                        {parseFloat(session.paid_amount).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-red-600 font-bold">
                        {parseFloat(session.remaining_amount).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`font-semibold ${getStatusColorClass(session.status)}`}>
                          {session.status_display}
                        </span>
                      </td>
                      {/* --- Display NEW FIELDS in Table View (continued) --- */}
                      <td className="py-3 px-4 whitespace-nowrap text-gray-700">
                        <span className={`font-semibold ${getStatusColorClass(session.editing_status)}`}>
                          {session.editing_status_display || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-gray-700">
                        {formatDate(session.final_delivery_date) || '-'}
                      </td>
                      {/* --- END NEW FIELDS in Table View (continued) --- */}
                      <td className="py-3 px-4 whitespace-nowrap text-left">
                        <div className="flex items-center gap-2">
                          {isManager && parseFloat(session.remaining_amount) > 0 && (
                            <button
                              onClick={() => handleAddPayment(session)}
                              className="text-blue-600 hover:text-blue-900"
                              title="إضافة دفعة"
                            >
                              <CurrencyDollarIcon className="h-5 w-5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleViewReceipts(session)}
                            className="text-gray-600 hover:text-gray-900"
                            title="عرض الإيصالات"
                          >
                            <DocumentDuplicateIcon className="h-5 w-5" />
                          </button>
                          {/* New button for Booking Receipt (Yellow) */}
                          <button
                            onClick={() => handleGenerateBookingReceipt(session.id)}
                            className="text-yellow-500 hover:text-yellow-700"
                            title="تنزيل إيصال حجز"
                          >
                            <BookOpenIcon className="h-5 w-5" />
                          </button>
                          {/* Existing button for Final Invoice/Receipt (Blue) */}
                          {isManager && parseFloat(session.remaining_amount) === 0 && (
                            <button
                              onClick={() => handleGenerateInvoice(session.id)}
                              className="text-purple-600 hover:text-purple-900"
                              title="تنزيل فاتورة نهائية / إيصال تسليم"
                            >
                              <ReceiptPercentIcon className="h-5 w-5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleEditPhotoSession(session.id)}
                            className="text-yellow-600 hover:text-yellow-900"
                            title="تعديل"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          {isManager && (
                            <button
                              onClick={() => confirmDeletePhotoSession(session.id)}
                              className="text-red-600 hover:text-red-900"
                              title="حذف"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Confirmation Modal for Deletion */}
      <ConfirmationModal
        isOpen={showConfirmDeleteModal}
        onClose={() => setShowConfirmDeleteModal(false)}
        onConfirm={handleDeletePhotoSession}
        title="تأكيد الحذف"
        message="هل أنت متأكد أنك تريد حذف جلسة التصوير هذه نهائيًا؟ لا يمكن التراجع عن هذا الإجراء."
        confirmButtonText="حذف"
        confirmButtonColorClass="bg-red-600 hover:bg-red-700"
      />

      {/* Payment Modal */}
      {showPaymentModal && selectedSessionForPayment && (
        <PhotoSessionPaymentFormModal
          isOpen={showPaymentModal}
          onClose={handleClosePaymentModal}
          photoSessionId={selectedSessionForPayment.id}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* Payment Receipts List Modal (now using the actual component) */}
      {showReceiptsListModal && selectedSessionForReceipts && (
        <PhotoSessionPaymentReceiptsListModal
          isOpen={showReceiptsListModal}
          onClose={handleCloseReceiptsListModal}
          photoSessionId={selectedSessionForReceipts.id}
        />
      )}
    </div>
  );
}

export default PhotographyTab;
