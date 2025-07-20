// src/components/ClientList.js
import React, { useState, useEffect, useCallback } from 'react';
import ClientForm from './ClientForm';
import ClientDetailsModal from './ClientDetailsModal';
import { getClients, deleteClient, getClientById } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
// import { useToast } from '../contexts/ToastContext'; // Removed useToast as it's not used here
import {
  PencilIcon,
  TrashIcon,
  PlusCircleIcon,
  EyeIcon, // For viewing client details
} from '@heroicons/react/24/solid';
import ConfirmationModal from './ConfirmationModal'; // Import ConfirmationModal

/**
 * ClientList Component
 * Manages the display, search, addition, editing, and deletion of clients.
 */
function ClientList() {
  const { authToken, isManager } = useAuth();
  // const { showToast } = useToast(); // Removed useToast as it's not used here

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingClientId, setEditingClientId] = useState(null);
  const [initialClientFormData, setInitialClientFormData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(null);

  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [clientToDeleteId, setClientToDeleteId] = useState(null);


  const fetchClients = useCallback(async () => {
    if (!authToken) {
      setError('لا يوجد توكن مصادقة. يرجى تسجيل الدخول.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getClients(authToken, searchTerm);
      setClients(data);
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError(`فشل جلب العملاء: ${err.message}`);
      // showToast(`فشل جلب العملاء: ${err.message}`, 'error'); // If useToast was used, it would be here
    } finally {
      setLoading(false);
    }
  }, [authToken, searchTerm]); // Removed showToast from dependencies

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleAddClientClick = () => {
    setShowAddForm(true);
    setEditingClientId(null);
    setInitialClientFormData(null);
  };

  const handleClientSaved = () => {
    setShowAddForm(false);
    setEditingClientId(null);
    setInitialClientFormData(null);
    fetchClients();
  };

  const handleEditClient = useCallback(async (clientId) => {
    if (!authToken) {
      // showToast('خطأ: لا يوجد توكن مصادقة. يرجى تسجيل الدخول.', 'error'); // If useToast was used, it would be here
      return;
    }
    setLoading(true);
    try {
      const clientDetails = await getClientById(authToken, clientId);
      setInitialClientFormData(clientDetails);
      setEditingClientId(clientId);
      setShowAddForm(true);
    } catch (err) {
      console.error('Error fetching client details for edit:', err);
      // showToast(`فشل جلب تفاصيل العميل للتعديل: ${err.message}`, 'error'); // If useToast was used, it would be here
    } finally {
      setLoading(false);
    }
  }, [authToken]); // Removed showToast from dependencies

  // Confirmation for deletion
  const confirmDelete = useCallback((clientId) => {
    setClientToDeleteId(clientId);
    setShowConfirmDeleteModal(true);
  }, []);

  const handleDeleteClient = useCallback(async () => {
    if (!clientToDeleteId) return;

    if (!authToken) {
      // showToast('خطأ: لا يوجد توكن مصادقة. يرجى تسجيل الدخول.', 'error'); // If useToast was used, it would be here
      setShowConfirmDeleteModal(false);
      return;
    }
    setLoading(true);
    try {
      await deleteClient(authToken, clientToDeleteId);
      // showToast('تم حذف العميل بنجاح!', 'success'); // If useToast was used, it would be here
      fetchClients();
    } catch (err) {
      console.error('Error deleting client:', err);
      // showToast(`فشل حذف العميل: ${err.message}`, 'error'); // If useToast was used, it would be here
    } finally {
      setLoading(false);
      setShowConfirmDeleteModal(false);
      setClientToDeleteId(null);
    }
  }, [authToken, clientToDeleteId, fetchClients]); // Removed showToast from dependencies

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleViewClientDetails = useCallback((clientId) => {
    setSelectedClientId(clientId);
    setShowDetailsModal(true);
  }, []);

  const handleCloseDetailsModal = useCallback(() => {
    setShowDetailsModal(false);
    setSelectedClientId(null);
  }, []);


  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Conditional rendering for ClientForm */}
      {(showAddForm || editingClientId) ? (
        <ClientForm
          onClientSaved={handleClientSaved}
          clientId={editingClientId}
          initialData={initialClientFormData}
          isManager={isManager}
        />
      ) : (
        <>
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <h2 className="text-3xl font-extrabold text-gray-900">إدارة العملاء</h2>
            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
              <input
                type="text"
                placeholder="البحث بالاسم، الهاتف، البريد..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 w-full md:w-64"
              />
              <button
                onClick={handleAddClientClick}
                className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700 transition duration-300 ease-in-out transform hover:scale-105"
              >
                <PlusCircleIcon className="h-5 w-5 ml-2" />
                إضافة عميل جديد
              </button>
            </div>
          </div>

          {loading && (
            <div className="text-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
              <p className="text-gray-700 mt-4">جاري تحميل العملاء...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-center" role="alert">
              <strong className="font-bold">خطأ!</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          )}

          {!loading && !error && clients.length === 0 && (
            <div className="text-center py-10 text-gray-600">
              <p className="text-xl">لا توجد عملاء لعرضهم.</p>
              <p className="mt-2">ابدأ بإضافة عميل جديد!</p>
            </div>
          )}

          {!loading && !error && clients.length > 0 && (
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الاسم
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الهاتف
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      البريد الإلكتروني
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      تاريخ الإنشاء
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {clients.map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {client.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {client.phone || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {client.email || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {new Date(client.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleViewClientDetails(client.id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="عرض التفاصيل"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                          {isManager && (
                            <>
                              <button
                                onClick={() => handleEditClient(client.id)}
                                className="text-yellow-600 hover:text-yellow-900"
                                title="تعديل"
                              >
                                <PencilIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => confirmDelete(client.id)}
                                className="text-red-600 hover:text-red-900"
                                title="حذف"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </>
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

      {/* Client Details Modal */}
      {showDetailsModal && (
        <ClientDetailsModal
          isOpen={showDetailsModal}
          onClose={handleCloseDetailsModal}
          clientId={selectedClientId}
        />
      )}

      {/* Confirmation Modal for Deletion */}
      <ConfirmationModal
        isOpen={showConfirmDeleteModal}
        onClose={() => setShowConfirmDeleteModal(false)}
        onConfirm={handleDeleteClient}
        title="تأكيد الحذف"
        message="هل أنت متأكد أنك تريد حذف هذا العميل نهائيًا؟ هذا الإجراء لا يمكن التراجع عنه وسيحذف جميع طلبات الطباعة المرتبطة به."
        confirmButtonText="حذف"
        confirmButtonColorClass="bg-red-600 hover:bg-red-700"
      />
    </div>
  );
}

export default ClientList;
