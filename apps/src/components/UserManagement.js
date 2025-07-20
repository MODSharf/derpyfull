// src/components/UserManagement.js
import React, { useState, useEffect, useCallback } from 'react';
import { getUsers, createUser, updateUser, deleteUser } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import ConfirmationModal from './ConfirmationModal'; // سنستخدم نفس المكون
import UserForm from './UserForm'; // سيتم إنشاء هذا المكون لاحقًا

import {
  PlusCircleIcon,
  PencilIcon,
  TrashIcon,
  UserIcon, // أيقونة للمستخدم
  KeyIcon, // لأيقونة كلمة المرور
  EnvelopeIcon, // للبريد الإلكتروني
} from '@heroicons/react/24/solid';

/**
 * UserManagement Component
 * Manages the display, addition, editing, and deletion of users (employees and managers).
 * Accessible only by managers.
 *
 * Props:
 * - showToast: Function to display toast notifications.
 */
function UserManagement({ showToast }) {
  const { authToken, user: currentUser } = useAuth(); // Get authToken and current user info
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showUserFormModal, setShowUserFormModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [initialUserData, setInitialUserData] = useState(null);

  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Function to fetch users from the API
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedUsers = await getUsers(authToken);
      // Filter out the currently logged-in user from the list
      // This prevents a manager from accidentally deleting or demoting themselves in a way that locks them out
      const filteredUsers = fetchedUsers.filter(u => u.id !== currentUser.user_id);
      setUsers(filteredUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message);
      showToast(`فشل جلب المستخدمين: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [authToken, showToast, currentUser]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle opening the Add/Edit User form
  const handleAddUser = () => {
    setEditingUserId(null);
    setInitialUserData(null);
    setShowUserFormModal(true);
  };

  const handleEditUser = (user) => {
    setEditingUserId(user.id);
    setInitialUserData(user);
    setShowUserFormModal(true);
  };

  // Handle closing the Add/Edit User form
  const handleCloseUserFormModal = () => {
    setShowUserFormModal(false);
    setEditingUserId(null);
    setInitialUserData(null);
  };

  // Handle user saved (add or update)
  const handleUserSaved = () => {
    showToast(`تم حفظ المستخدم بنجاح!`, 'success');
    fetchUsers(); // Refresh the list
    handleCloseUserFormModal();
  };

  // Handle initiating user deletion
  const confirmDeleteUser = (user) => {
    setUserToDelete(user);
    setShowConfirmDeleteModal(true);
  };

  // Handle actual user deletion
  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    // Prevent manager from deleting themselves
    if (userToDelete.id === currentUser.user_id) {
        showToast('لا يمكنك حذف حسابك الخاص!', 'error');
        setShowConfirmDeleteModal(false);
        setUserToDelete(null);
        return;
    }

    try {
      await deleteUser(authToken, userToDelete.id);
      showToast('تم حذف المستخدم بنجاح!', 'success');
      fetchUsers(); // Refresh the list
    } catch (err) {
      console.error('Error deleting user:', err);
      showToast(`فشل حذف المستخدم: ${err.message}`, 'error');
    } finally {
      setShowConfirmDeleteModal(false);
      setUserToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px] bg-gray-50 rounded-lg p-4">
        <div className="text-xl font-semibold text-gray-700">جاري تحميل المستخدمين...</div>
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
        <h3 className="text-2xl font-semibold text-gray-800">إدارة المستخدمين</h3>
        <button
          onClick={handleAddUser}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-full shadow-lg flex items-center transition duration-300 transform hover:scale-105"
        >
          <PlusCircleIcon className="h-5 w-5 ml-2" />
          إضافة مستخدم جديد
        </button>
      </div>

      {users.length === 0 ? (
        <p className="text-center text-gray-600 text-lg py-10 bg-gray-50 rounded-lg">لا يوجد مستخدمون لعرضهم حاليًا.</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  اسم المستخدم
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الدور
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  البريد الإلكتروني
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الاسم الكامل
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <div className="flex items-center">
                      <UserIcon className="h-5 w-5 text-gray-500 ml-2" />
                      {user.username}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${user.profile_role_display === 'مدير' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}
                    >
                      {user.profile_role_display}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <div className="flex items-center">
                      <EnvelopeIcon className="h-4 w-4 text-gray-400 ml-1" />
                      {user.email || 'لا يوجد'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {user.first_name || ''} {user.last_name || ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2 space-x-reverse">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="text-indigo-600 hover:text-indigo-900 p-2 rounded-full hover:bg-indigo-100 transition"
                        title="تعديل المستخدم"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => confirmDeleteUser(user)}
                        className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-100 transition"
                        title="حذف المستخدم"
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

      {/* User Form Modal */}
      {showUserFormModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
            <button
              onClick={handleCloseUserFormModal}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition"
              title="إغلاق"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              {editingUserId ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}
            </h2>
            <UserForm
              onUserSaved={handleUserSaved}
              onCancel={handleCloseUserFormModal}
              userId={editingUserId}
              initialData={initialUserData}
              currentUserRole={currentUser.role} // Pass current user's role for validation
            />
          </div>
        </div>
      )}

      {/* Confirmation Modal for Deletion */}
      <ConfirmationModal
        isOpen={showConfirmDeleteModal}
        onClose={() => setShowConfirmDeleteModal(false)}
        onConfirm={handleDeleteUser}
        title="تأكيد الحذف"
        message={userToDelete ? `هل أنت متأكد أنك تريد حذف المستخدم "${userToDelete.username}" نهائيًا؟ لا يمكن التراجع عن هذا الإجراء.` : 'هل أنت متأكد أنك تريد حذف هذا المستخدم نهائيًا؟ لا يمكن التراجع عن هذا الإجراء.'}
        confirmButtonText="حذف"
        confirmButtonColorClass="bg-red-600 hover:bg-red-700"
      />
    </div>
  );
}

export default UserManagement;
