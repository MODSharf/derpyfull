// src/components/PhotographyPackageManagement.js
import React, { useState, useEffect, useCallback } from 'react';
import { getPhotographyPackages, createPhotographyPackage, updatePhotographyPackage, deletePhotographyPackage } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import ConfirmationModal from './ConfirmationModal'; // سنستخدم نفس المكون
import PhotographyPackageForm from './PhotographyPackageForm'; // سيتم إنشاء هذا المكون لاحقًا

import {
  PlusCircleIcon,
  PencilIcon,
  TrashIcon,
  PhotoIcon, // أيقونة للباقة
  TagIcon, // أيقونة للسعر
  DocumentTextIcon // أيقونة للوصف
} from '@heroicons/react/24/solid';

/**
 * PhotographyPackageManagement Component
 * Manages the display, addition, editing, and deletion of photography packages.
 * Accessible only by managers.
 *
 * Props:
 * - showToast: Function to display toast notifications.
 */
function PhotographyPackageManagement({ showToast }) {
  const { authToken } = useAuth();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showPackageFormModal, setShowPackageFormModal] = useState(false);
  const [editingPackageId, setEditingPackageId] = useState(null);
  const [initialPackageData, setInitialPackageData] = useState(null);

  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState(null);

  // Function to fetch photography packages from the API
  const fetchPackages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedPackages = await getPhotographyPackages(authToken);
      setPackages(fetchedPackages);
    } catch (err) {
      console.error('Error fetching packages:', err);
      setError(err.message);
      showToast(`فشل جلب الباقات: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [authToken, showToast]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  // Handle opening the Add/Edit Package form
  const handleAddPackage = () => {
    setEditingPackageId(null);
    setInitialPackageData(null);
    setShowPackageFormModal(true);
  };

  const handleEditPackage = (pkg) => {
    setEditingPackageId(pkg.id);
    setInitialPackageData(pkg);
    setShowPackageFormModal(true);
  };

  // Handle closing the Add/Edit Package form
  const handleClosePackageFormModal = () => {
    setShowPackageFormModal(false);
    setEditingPackageId(null);
    setInitialPackageData(null);
  };

  // Handle package saved (add or update)
  const handlePackageSaved = () => {
    showToast(`تم حفظ الباقة بنجاح!`, 'success');
    fetchPackages(); // Refresh the list
    handleClosePackageFormModal();
  };

  // Handle initiating package deletion
  const confirmDeletePackage = (pkg) => {
    setPackageToDelete(pkg);
    setShowConfirmDeleteModal(true);
  };

  // Handle actual package deletion
  const handleDeletePackage = async () => {
    if (!packageToDelete) return;

    try {
      await deletePhotographyPackage(authToken, packageToDelete.id);
      showToast('تم حذف الباقة بنجاح!', 'success');
      fetchPackages(); // Refresh the list
    } catch (err) {
      console.error('Error deleting package:', err);
      showToast(`فشل حذف الباقة: ${err.message}`, 'error');
    } finally {
      setShowConfirmDeleteModal(false);
      setPackageToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px] bg-gray-50 rounded-lg p-4">
        <div className="text-xl font-semibold text-gray-700">جاري تحميل الباقات...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] bg-red-100 p-4 text-center rounded-lg">
        <div className="text-xl font-semibold text-red-700">خطأ: {error}</div>
        <p className="text-red-600 mt-2">
          الرجاء التأكد من أن خادم الـ API يعمل بشكل صحيح وأن لديك الصلاحيات اللازمة.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-semibold text-gray-800">إدارة باقات التصوير</h3>
        <button
          onClick={handleAddPackage}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full shadow-lg flex items-center transition duration-300 transform hover:scale-105"
        >
          <PlusCircleIcon className="h-5 w-5 ml-2" />
          إضافة باقة جديدة
        </button>
      </div>

      {packages.length === 0 ? (
        <p className="text-center text-gray-600 text-lg py-10 bg-gray-50 rounded-lg">لا توجد باقات لعرضها حاليًا.</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  اسم الباقة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  السعر (SAR)
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الوصف
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {packages.map((pkg) => (
                <tr key={pkg.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <div className="flex items-center">
                      <PhotoIcon className="h-5 w-5 text-gray-500 ml-2" />
                      {pkg.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <div className="flex items-center">
                      <TagIcon className="h-4 w-4 text-gray-400 ml-1" />
                      {parseFloat(pkg.price).toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">
                    <div className="flex items-center">
                      <DocumentTextIcon className="h-4 w-4 text-gray-400 ml-1" />
                      {pkg.description || 'لا يوجد وصف'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2 space-x-reverse">
                      <button
                        onClick={() => handleEditPackage(pkg)}
                        className="text-indigo-600 hover:text-indigo-900 p-2 rounded-full hover:bg-indigo-100 transition"
                        title="تعديل الباقة"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => confirmDeletePackage(pkg)}
                        className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-100 transition"
                        title="حذف الباقة"
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
      )}

      {/* Photography Package Form Modal */}
      {showPackageFormModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
            <button
              onClick={handleClosePackageFormModal}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition"
              title="إغلاق"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              {editingPackageId ? 'تعديل الباقة' : 'إضافة باقة جديدة'}
            </h2>
            <PhotographyPackageForm
              onPackageSaved={handlePackageSaved}
              onCancel={handleClosePackageFormModal}
              packageId={editingPackageId}
              initialData={initialPackageData}
            />
          </div>
        </div>
      )}

      {/* Confirmation Modal for Deletion */}
      <ConfirmationModal
        isOpen={showConfirmDeleteModal}
        onClose={() => setShowConfirmDeleteModal(false)}
        onConfirm={handleDeletePackage}
        title="تأكيد الحذف"
        message={packageToDelete ? `هل أنت متأكد أنك تريد حذف الباقة "${packageToDelete.name}" نهائيًا؟ لا يمكن التراجع عن هذا الإجراء.` : 'هل أنت متأكد أنك تريد حذف هذه الباقة نهائيًا؟ لا يمكن التراجع عن هذا الإجراء.'}
        confirmButtonText="حذف"
        confirmButtonColorClass="bg-red-600 hover:bg-red-700"
      />
    </div>
  );
}

export default PhotographyPackageManagement;
