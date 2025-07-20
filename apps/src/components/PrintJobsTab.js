// src/components/PrintJobsTab.js
import React, { useState, useEffect, useCallback } from 'react';
import PrintJobForm from './PrintJobForm';
import PaymentFormModal from './PaymentFormModal';
import PaymentReceiptsListModal from './PaymentReceiptsListModal'; // المكون الجديد لعرض قائمة الإيصالات
import ConfirmationModal from './ConfirmationModal'; // مكون التأكيد

import { 
  getPrintJobs, 
  deletePrintJob, 
  getPrintJobById, 
  downloadPaymentReceiptPdf, // تم تغيير الاسم هنا
  generatePrintInvoicePdf, // دالة توليد الفاتورة النهائية
} from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  PencilIcon,
  TrashIcon,
  // DocumentTextIcon, // Removed: 'DocumentTextIcon' is defined but never used
  PlusCircleIcon,
  TableCellsIcon,
  ListBulletIcon,
  CurrencyDollarIcon, // لأيقونة الدفع
  ReceiptPercentIcon, // لأيقونة الفاتورة النهائية
  DocumentDuplicateIcon, // لأيقونة قائمة الإيصالات
} from '@heroicons/react/24/solid';

/**
 * PrintJobsTab Component
 * Manages the display, search, addition, editing, and deletion of print jobs.
 * Allows switching between card view and list view.
 * Now also supports adding new payments to existing print jobs,
 * viewing all payment receipts for a job, and generating a final invoice.
 *
 * Props:
 * - onViewClientDetails: Function to open the client details modal, passed from AppContent.
 */
function PrintJobsTab({ onViewClientDetails }) {
  const { authToken, isManager } = useAuth();
  const { showToast } = useToast();

  const [printJobs, setPrintJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingJobId, setEditingJobId] = useState(null);
  const [initialJobFormData, setInitialJobFormData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('list');

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPrintJobForPayment, setSelectedPrintJobForPayment] = useState(null);

  const [showReceiptsListModal, setShowReceiptsListModal] = useState(false); // حالة لعرض قائمة الإيصالات
  const [selectedPrintJobForReceipts, setSelectedPrintJobForReceipts] = useState(null); // الطلب المحدد لعرض إيصالاته

  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false); // حالة لمودال التأكيد
  const [jobToDeleteId, setJobToDeleteId] = useState(null); // معرف الطلب المراد حذفه

  const getStatusColorClass = useCallback((status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'in_progress':
        return 'text-blue-600';
      case 'pending':
        return 'text-orange-500';
      case 'cancelled':
        return 'text-red-600';
      case 'partially_paid': // New status for partially paid jobs
        return 'text-purple-600';
      default:
        return 'text-gray-700';
    }
  }, []);

  const fetchPrintJobs = useCallback(async () => {
    if (!authToken) {
      setError('لا يوجد توكن مصادقة. يرجى تسجيل الدخول.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getPrintJobs(authToken, searchTerm);
      setPrintJobs(data);
    } catch (err) {
      console.error('Error fetching print jobs:', err);
      setError(`فشل جلب طلبات الطباعة: ${err.message}`);
      showToast(`فشل جلب طلبات الطباعة: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [authToken, searchTerm, showToast]);

  useEffect(() => {
    fetchPrintJobs();
  }, [fetchPrintJobs]);

  const handleAddPrintJobClick = () => {
    setShowAddForm(true);
    setEditingJobId(null);
    setInitialJobFormData(null);
  };

  const handlePrintJobSaved = () => {
    setShowAddForm(false);
    setEditingJobId(null);
    setInitialJobFormData(null);
    fetchPrintJobs();
  };

  const handleEditPrintJob = useCallback(async (jobId) => {
    if (!authToken) {
      showToast('خطأ: لا يوجد توكن مصادقة. يرجى تسجيل الدخول.', 'error');
      return;
    }
    setLoading(true);
    try {
      const jobDetails = await getPrintJobById(authToken, jobId);
      setInitialJobFormData(jobDetails);
      setEditingJobId(jobId);
      setShowAddForm(true);
    } catch (err) {
      console.error('Error fetching print job details for edit:', err);
      showToast(`فشل جلب تفاصيل طلب الطباعة للتعديل: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [authToken, showToast]);

  // دالة لفتح مودال التأكيد قبل الحذف
  const confirmDelete = useCallback((jobId) => {
    setJobToDeleteId(jobId);
    setShowConfirmDeleteModal(true);
  }, []);

  // دالة لتنفيذ الحذف بعد التأكيد
  const handleDeletePrintJob = useCallback(async () => {
    if (!jobToDeleteId) return; // تأكد أن هناك معرف للوظيفة المراد حذفها

    if (!authToken) {
      showToast('خطأ: لا يوجد توكن مصادقة. يرجى تسجيل الدخول.', 'error');
      setShowConfirmDeleteModal(false); // إغلاق المودال
      return;
    }
    setLoading(true);
    try {
      await deletePrintJob(authToken, jobToDeleteId);
      showToast('تم حذف طلب الطباعة بنجاح!', 'success');
      fetchPrintJobs();
    } catch (err) {
      console.error('Error deleting print job:', err);
      showToast(`فشل حذف طلب الطباعة: ${err.message}`, 'error');
    } finally {
      setLoading(false);
      setShowConfirmDeleteModal(false); // إغلاق المودال بعد الحذف أو الخطأ
      setJobToDeleteId(null); // إعادة تعيين معرف الوظيفة
    }
  }, [authToken, jobToDeleteId, fetchPrintJobs, showToast]);

  // Removed: 'handleDownloadSingleReceipt' is assigned a value but never used
  // const handleDownloadSingleReceipt = useCallback(async (receiptId) => {
  //   if (!authToken) {
  //     showToast('خطأ: لا يوجد توكن مصادقة. يرجى تسجيل الدخول.', 'error');
  //     return;
  //   }
  //   try {
  //     await downloadPaymentReceiptPdf(authToken, receiptId);
  //     showToast('تم تنزيل إيصال الدفعة بنجاح!', 'success');
  //   } catch (err) {
  //     console.error('Error downloading single receipt:', err);
  //     showToast(`فشل تنزيل إيصال الدفعة: ${err.message}`, 'error');
  //   }
  // }, [authToken, showToast]);

  // دالة لتنزيل الفاتورة النهائية لطلب الطباعة
  const handleGenerateFinalInvoice = useCallback(async (printJobId) => {
    if (!authToken) {
      showToast('خطأ: لا يوجد توكن مصادقة. يرجى تسجيل الدخول.', 'error');
      return;
    }
    try {
      await generatePrintInvoicePdf(authToken, printJobId);
      showToast('تم تنزيل الفاتورة النهائية بنجاح!', 'success');
    } catch (err) {
      console.error('Error generating final invoice:', err);
      showToast(`فشل تنزيل الفاتورة النهائية: ${err.message}`, 'error');
    }
  }, [authToken, showToast]);

  // دالة لفتح مودال قائمة الإيصالات
  const handleViewReceiptsList = useCallback((job) => {
    setSelectedPrintJobForReceipts(job);
    setShowReceiptsListModal(true);
  }, []);

  // دالة لإغلاق مودال قائمة الإيصالات
  const handleCloseReceiptsListModal = useCallback(() => {
    setShowReceiptsListModal(false);
    setSelectedPrintJobForReceipts(null);
  }, []);


  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleAddPaymentClick = useCallback((job) => {
    setSelectedPrintJobForPayment(job);
    setShowPaymentModal(true);
  }, []);

  const handleClosePaymentModal = useCallback(() => {
    setShowPaymentModal(false);
    setSelectedPrintJobForPayment(null);
  }, []);

  const handlePaymentSuccess = useCallback(() => {
    fetchPrintJobs();
    handleClosePaymentModal();
  }, [fetchPrintJobs, handleClosePaymentModal]);

  const formatDate = (dateString) => {
    if (!dateString) return 'غير محدد';
    try {
      return new Date(dateString).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Conditional rendering for PrintJobForm */}
      {(showAddForm || editingJobId) ? (
        <PrintJobForm
          onPrintJobSaved={handlePrintJobSaved}
          printJobId={editingJobId}
          initialData={initialJobFormData}
          isManager={isManager}
        />
      ) : (
        <>
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <h2 className="text-3xl font-extrabold text-gray-900">طلبات الطباعة</h2>
            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
              <input
                type="text"
                placeholder="البحث بالاسم، الرقم، الحالة..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 w-full md:w-64"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-3 rounded-md shadow-sm transition duration-200 ${
                    viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  title="عرض البطاقات"
                >
                  <TableCellsIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-3 rounded-md shadow-sm transition duration-200 ${
                    viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  title="عرض القائمة"
                >
                  <ListBulletIcon className="h-5 w-5" />
                </button>
              </div>
              <button
                onClick={handleAddPrintJobClick}
                className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700 transition duration-300 ease-in-out transform hover:scale-105"
              >
                <PlusCircleIcon className="h-5 w-5 ml-2" />
                إضافة طلب طباعة جديد
              </button>
            </div>
          </div>

          {loading && (
            <div className="text-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
              <p className="text-gray-700 mt-4">جاري تحميل طلبات الطباعة...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-center" role="alert">
              <strong className="font-bold">خطأ!</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          )}

          {!loading && !error && printJobs.length === 0 && (
            <div className="text-center py-10 text-gray-600">
              <p className="text-xl">لا توجد طلبات طباعة لعرضها.</p>
              <p className="mt-2">ابدأ بإضافة طلب طباعة جديد!</p>
            </div>
          )}

          {!loading && !error && printJobs.length > 0 && (
            viewMode === 'grid' ? (
              // Card View
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {printJobs.map((job) => (
                  <div key={job.id} className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-800 mb-2 truncate">
                        طلب رقم: {job.receipt_number || job.id}
                      </h3>
                      <p className="text-gray-700 mb-1">
                        <span className="font-semibold">العميل:</span>{' '}
                        {job.client ? (
                          <button
                            onClick={() => onViewClientDetails(job.client.id)}
                            className="text-blue-600 hover:text-blue-800 font-semibold underline focus:outline-none"
                            title={`عرض تفاصيل العميل ${job.client.name}`}
                          >
                            {job.client.name}
                          </button>
                        ) : (
                          'غير معروف'
                        )}
                      </p>
                      <p className="text-gray-700 mb-1">
                        <span className="font-semibold">النوع:</span> {job.print_type_display}
                      </p>
                      <p className="text-gray-700 mb-1">
                        <span className="font-semibold">الحجم:</span> {job.size_display}
                      </p>
                      <p className="text-gray-700 mb-1">
                        <span className="font-semibold">المبلغ الكلي:</span> {parseFloat(job.total_amount).toFixed(2)}
                      </p>
                      <p className="text-gray-700 mb-1">
                        <span className="font-semibold">المبلغ المدفوع:</span> {parseFloat(job.paid_amount).toFixed(2)}
                      </p>
                      <p className="text-gray-700 mb-1">
                        <span className="font-semibold">المبلغ المتبقي:</span> {parseFloat(job.remaining_amount).toFixed(2)}
                      </p>
                      <p className="text-gray-700 mb-1">
                        <span className="font-semibold">تاريخ التسليم:</span> {formatDate(job.delivery_date)}
                      </p>
                      <p className="text-gray-700 mb-1">
                        <span className="font-semibold">الحالة:</span>{' '}
                        <span className={`font-semibold ${getStatusColorClass(job.status)}`}>
                          {job.status_display}
                        </span>
                      </p>
                      {job.notes && (
                        <p className="text-gray-700 mb-1">
                          <span className="font-semibold">ملاحظات:</span> {job.notes}
                        </p>
                      )}
                    </div>
                    <div className="bg-gray-100 p-4 flex justify-end gap-3 border-t border-gray-200">
                      {parseFloat(job.remaining_amount) > 0 && (
                        <button
                          onClick={() => handleAddPaymentClick(job)}
                          className="flex items-center px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-200 text-sm"
                          title="إضافة دفعة"
                        >
                          <CurrencyDollarIcon className="h-4 w-4 ml-1" />
                          دفعة
                        </button>
                      )}
                      {/* New button for viewing all receipts */}
                      <button
                        onClick={() => handleViewReceiptsList(job)}
                        className="flex items-center px-3 py-1.5 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition duration-200 text-sm"
                        title="عرض الإيصالات"
                      >
                        <DocumentDuplicateIcon className="h-4 w-4 ml-1" />
                        إيصالات
                      </button>
                      {/* New button for generating final invoice */}
                      {parseFloat(job.remaining_amount) === 0 && (
                        <button
                          onClick={() => handleGenerateFinalInvoice(job.id)}
                          className="flex items-center px-3 py-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition duration-200 text-sm"
                          title="فاتورة نهائية"
                        >
                          <ReceiptPercentIcon className="h-4 w-4 ml-1" />
                          فاتورة
                        </button>
                      )}
                      <button
                        onClick={() => handleEditPrintJob(job.id)}
                        className="flex items-center px-3 py-1.5 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition duration-200 text-sm"
                        title="تعديل"
                      >
                        <PencilIcon className="h-4 w-4 ml-1" />
                        تعديل
                      </button>
                      <button
                        onClick={() => confirmDelete(job.id)} //* استخدام دالة التأكيد */}
                        className="flex items-center px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 transition duration-200 text-sm"
                        title="حذف"
                      >
                        <TrashIcon className="h-4 w-4 ml-1" />
                        حذف
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // List View
              <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الرقم
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        العميل
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        النوع
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الحجم
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        المبلغ الكلي
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        المدفوع
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        المتبقي
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        تاريخ التسليم
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الحالة
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الإجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {printJobs.map((job) => (
                      <tr key={job.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {job.receipt_number || job.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {job.client ? (
                            <button
                              onClick={() => onViewClientDetails(job.client.id)}
                              className="text-blue-600 hover:text-blue-800 font-semibold underline focus:outline-none"
                              title={`عرض تفاصيل العميل ${job.client.name}`}
                            >
                              {job.client.name}
                            </button>
                          ) : (
                            'غير معروف'
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {job.print_type_display}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {job.size_display}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {parseFloat(job.total_amount).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {parseFloat(job.paid_amount).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {parseFloat(job.remaining_amount).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {formatDate(job.delivery_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          <span className={`font-semibold ${getStatusColorClass(job.status)}`}>
                            {job.status_display}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex gap-2">
                            {parseFloat(job.remaining_amount) > 0 && (
                              <button
                                onClick={() => handleAddPaymentClick(job)}
                                className="text-blue-600 hover:text-blue-900"
                                title="إضافة دفعة"
                              >
                                <CurrencyDollarIcon className="h-5 w-5" />
                              </button>
                            )}
                            {/* New button for viewing all receipts */}
                            <button
                              onClick={() => handleViewReceiptsList(job)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="عرض الإيصالات"
                            >
                              <DocumentDuplicateIcon className="h-5 w-5" />
                            </button>
                            {/* New button for generating final invoice */}
                            {parseFloat(job.remaining_amount) === 0 && (
                              <button
                                onClick={() => handleGenerateFinalInvoice(job.id)}
                                className="text-purple-600 hover:text-purple-900"
                                title="فاتورة نهائية"
                              >
                                <ReceiptPercentIcon className="h-5 w-5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleEditPrintJob(job.id)}
                              className="text-yellow-600 hover:text-yellow-900"
                              title="تعديل"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => confirmDelete(job.id)} //* استخدام دالة التأكيد */}
                              className="text-red-600 hover:text-red-900"
                              title="حذف"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedPrintJobForPayment && (
        <PaymentFormModal
          isOpen={showPaymentModal}
          onClose={handleClosePaymentModal}
          printJobId={selectedPrintJobForPayment.id}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* Payment Receipts List Modal */}
      {showReceiptsListModal && selectedPrintJobForReceipts && (
        <PaymentReceiptsListModal
          isOpen={showReceiptsListModal}
          onClose={handleCloseReceiptsListModal}
          printJobId={selectedPrintJobForReceipts.id}
        />
      )}

      {/* Confirmation Modal for Deletion */}
      <ConfirmationModal
        isOpen={showConfirmDeleteModal}
        onClose={() => setShowConfirmDeleteModal(false)}
        onConfirm={handleDeletePrintJob}
        title="تأكيد الحذف"
        message="هل أنت متأكد أنك تريد حذف طلب الطباعة هذا نهائيًا؟ لا يمكن التراجع عن هذا الإجراء."
        confirmButtonText="حذف"
        confirmButtonColorClass="bg-red-600 hover:bg-red-700"
      />
    </div>
  );
}

export default PrintJobsTab;
