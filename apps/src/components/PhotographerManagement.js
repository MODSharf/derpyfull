// src/components/PhotographerManagement.js
import React, { useState, useEffect, useCallback } from 'react';
import { getPhotographers, createPhotographer, updatePhotographer, deletePhotographer } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import ConfirmationModal from './ConfirmationModal';
import PhotographerForm from './PhotographerForm'; // NEW: Will create this component

import {
  PlusCircleIcon,
  PencilIcon,
  TrashIcon,
  UserCircleIcon, // أيقونة للمصور
  PhoneIcon, // أيقونة للهاتف
  EnvelopeIcon, // أيقونة للبريد الإلكتروني
} from '@heroicons/react/24/solid';

/**
 * PhotographerManagement Component
 * Manages the display, addition, editing, and deletion of photographers.
 * Accessible only by managers.
 *
 * Props:
 * - showToast: Function to display toast notifications.
 */
function PhotographerManagement({ showToast }) {
  const { authToken } = useAuth();
  const [photographers, setPhotographers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showPhotographerFormModal, setShowPhotographerFormModal] = useState(false);
  const [editingPhotographerId, setEditingPhotographerId] = useState(null);
  const [initialPhotographerData, setInitialPhotographerData] = useState(null);

  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [photographerToDelete, setPhotographerToDelete] = useState(null);

  // Function to fetch photographers from the API
  const fetchPhotographers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedPhotographers = await getPhotographers(authToken);
      setPhotographers(fetchedPhotographers);
    } catch (err) {
      console.error('Error fetching photographers:', err);
      setError(err.message);
      showToast(`فشل جلب المصورين: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [authToken, showToast]);

  useEffect(() => {
    fetchPhotographers();
  }, [fetchPhotographers]);

  // Handle opening the Add/Edit Photographer form
  const handleAddPhotographer = () => {
    setEditingPhotographerId(null);
    setInitialPhotographerData(null);
    setShowPhotographerFormModal(true);
  };

  const handleEditPhotographer = (photographer) => {
    setEditingPhotographerId(photographer.id);
    setInitialPhotographerData(photographer);
    setShowPhotographerFormModal(true);
  };

  // Handle closing the Add/Edit Photographer form
  const handleClosePhotographerFormModal = () => {
    setShowPhotographerFormModal(false);
    setEditingPhotographerId(null);
    setInitialPhotographerData(null);
  };

  // Handle photographer saved (add or update)
  const handlePhotographerSaved = () => {
    showToast(`تم حفظ المصور بنجاح!`, 'success');
    fetchPhotographers(); // Refresh the list
    handleClosePhotographerFormModal();
  };

  // Handle initiating photographer deletion
  const confirmDeletePhotographer = (photographer) => {
    setPhotographerToDelete(photographer);
    setShowConfirmDeleteModal(true);
  };

  // Handle actual photographer deletion
  const handleDeletePhotographer = async () => {
    if (!photographerToDelete) return;

    try {
      await deletePhotographer(authToken, photographerToDelete.id);
      showToast('تم حذف المصور بنجاح!', 'success');
      fetchPhotographers(); // Refresh the list
    } catch (err) {
      console.error('Error deleting photographer:', err);
      showToast(`فشل حذف المصور: ${err.message}`, 'error');
    } finally {
      setShowConfirmDeleteModal(false);
      setPhotographerToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px] bg-gray-50 rounded-lg p-4">
        <div className="text-xl font-semibold text-gray-700">جاري تحميل المصورين...</div>
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
        <h3 className="text-2xl font-semibold text-gray-800">إدارة المصورين</h3>
        <button
          onClick={handleAddPhotographer}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full shadow-lg flex items-center transition duration-300 transform hover:scale-105"
        >
          <PlusCircleIcon className="h-5 w-5 ml-2" />
          إضافة مصور جديد
        </button>
      </div>

      {photographers.length === 0 ? (
        <p className="text-center text-gray-600 text-lg py-10 bg-gray-50 rounded-lg">لا يوجد مصورون لعرضهم حاليًا.</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  اسم المصور
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  رقم الهاتف
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  البريد الإلكتروني
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {photographers.map((photographer) => (
                <tr key={photographer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <div className="flex items-center">
                      <UserCircleIcon className="h-5 w-5 text-gray-500 ml-2" />
                      {photographer.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <div className="flex items-center">
                      <PhoneIcon className="h-4 w-4 text-gray-400 ml-1" />
                      {photographer.phone || 'لا يوجد'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <div className="flex items-center">
                      <EnvelopeIcon className="h-4 w-4 text-gray-400 ml-1" />
                      {photographer.email || 'لا يوجد'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2 space-x-reverse">
                      <button
                        onClick={() => handleEditPhotographer(photographer)}
                        className="text-indigo-600 hover:text-indigo-900 p-2 rounded-full hover:bg-indigo-100 transition"
                        title="تعديل المصور"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => confirmDeletePhotographer(photographer)}
                        className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-100 transition"
                        title="حذف المصور"
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

      {/* Photographer Form Modal */}
      {showPhotographerFormModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
            <button
              onClick={handleClosePhotographerFormModal}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition"
              title="إغلاق"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              {editingPhotographerId ? 'تعديل المصور' : 'إضافة مصور جديد'}
            </h2>
            <PhotographerForm
              onPhotographerSaved={handlePhotographerSaved}
              onCancel={handleClosePhotographerFormModal}
              photographerId={editingPhotographerId}
              initialData={initialPhotographerData}
            />
          </div>
        </div>
      )}

      {/* Confirmation Modal for Deletion */}
      <ConfirmationModal
        isOpen={showConfirmDeleteModal}
        onClose={() => setShowConfirmDeleteModal(false)}
        onConfirm={handleDeletePhotographer}
        title="تأكيد الحذف"
        message={photographerToDelete ? `هل أنت متأكد أنك تريد حذف المصور "${photographerToDelete.name}" نهائيًا؟ لا يمكن التراجع عن هذا الإجراء.` : 'هل أنت متأكد أنك تريد حذف هذا المصور نهائيًا؟ لا يمكن التراجع عن هذا الإجراء.'}
        confirmButtonText="حذف"
        confirmButtonColorClass="bg-red-600 hover:bg-red-700"
      />
    </div>
  );
}

export default PhotographerManagement;
