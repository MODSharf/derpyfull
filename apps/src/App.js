// src/App.js
import React, { useState, useCallback } from 'react';
import ClientList from './components/ClientList';
import ClientForm from './components/ClientForm';
import Login from './components/Login';
import Reports from './components/Reports';
import Alerts from './components/Alerts';
import ClientDetailsModal from './components/ClientDetailsModal';
import PrintJobsTab from './components/PrintJobsTab';
import PhotographyTab from './components/PhotographyTab';
import ManagementTab from './components/ManagementTab';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider, useToast } from './contexts/ToastContext';

import { getClientById } from './services/apiService';
import { useTranslation } from 'react-i18next'; // NEW: Import useTranslation

import {
  UsersIcon,
  PrinterIcon,
  ChartBarIcon,
  BellIcon,
  ArrowRightOnRectangleIcon,
  PlusCircleIcon,
  CameraIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/solid';

function AppContent() {
  const { isAuthenticated, user, loadingAuth, logout, isManager, authToken } = useAuth();
  const { showToast } = useToast();
  const { t, i18n } = useTranslation(); // NEW: Initialize useTranslation

  const [activeTab, setActiveTab] = useState('print_jobs');
  const [selectedClientForDetails, setSelectedClientForDetails] = useState(null);
  const [clientDetailsInitialTab, setClientDetailsInitialTab] = useState('printing');

  const [showAddClientForm, setShowAddClientForm] = useState(false);
  const [editingClientId, setEditingClientId] = useState(null);
  const [initialClientFormData, setInitialClientFormData] = useState(null);
  const [clientSearchTerm, setClientSearchTerm] = useState('');

  const handleViewClientDetails = useCallback(async (clientId, initialTab = 'printing') => {
    if (!authToken) {
      showToast(t('error_no_auth_token'), 'error'); // Use translation
      return;
    }
    try {
      const data = await getClientById(authToken, clientId);
      setSelectedClientForDetails(data);
      setClientDetailsInitialTab(initialTab);
    } catch (error) {
      console.error('Error fetching client details:', error);
      showToast(t('api_error_fetching_client_details', { error: error.message }), 'error'); // Use translation
    }
  }, [authToken, showToast, t]);

  const handleCloseClientDetailsModal = useCallback(() => {
    setSelectedClientForDetails(null);
    setClientDetailsInitialTab('printing');
  }, []);

  const handleClientSaved = useCallback(() => {
    showToast(t('client_saved_success'), 'success'); // Use translation
    setShowAddClientForm(false);
    setEditingClientId(null);
    setInitialClientFormData(null);
  }, [showToast, t]);

  const handleEditClient = useCallback(async (clientId) => {
    if (!authToken) {
      showToast(t('error_no_auth_token'), 'error'); // Use translation
      return;
    }
    try {
      const clientData = await getClientById(authToken, clientId);
      setInitialClientFormData(clientData);
      setEditingClientId(clientId);
      setShowAddClientForm(true);
    } catch (error) {
      console.error('Error fetching client for edit:', error);
      showToast(t('api_error_fetching_client_details', { error: error.message }), 'error'); // Use translation
    }
  }, [authToken, showToast, t]);

  const handleClientDeleted = useCallback(() => {
    showToast(t('client_deleted_success'), 'success'); // Use translation
  }, [showToast, t]);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  if (loadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-700">{t('loading_auth')}</p> {/* Use translation */}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header and Navigation */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg p-4">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
          <h1 className="text-3xl font-bold mb-3 md:mb-0">
            {t('app_title')}
          </h1>
          {isAuthenticated && user && (
            <div className="text-right text-sm md:text-base">
              <p className="font-semibold">{t('welcome_message', { username: user.username })}</p>
              {user.userRoles && user.userRoles.length > 0 && (
                <p className="text-xs opacity-80">{t('roles_label')}: {user.userRoles.join(', ')}</p>
              )}
            </div>
          )}
          <nav className="flex flex-wrap justify-center md:justify-end gap-3 md:gap-4">
            <button
              onClick={() => setActiveTab('print_jobs')}
              className={`flex items-center px-4 py-2 rounded-full text-lg font-medium transition-all duration-300
                ${activeTab === 'print_jobs' ? 'bg-white text-blue-700 shadow-md' : 'text-white hover:bg-blue-500 hover:bg-opacity-75'}`}
            >
              <PrinterIcon className="h-6 w-6 ml-2" />
              {t('print_jobs_tab')}
            </button>
            <button
              onClick={() => setActiveTab('photography')}
              className={`flex items-center px-4 py-2 rounded-full text-lg font-medium transition-all duration-300
                ${activeTab === 'photography' ? 'bg-white text-blue-700 shadow-md' : 'text-white hover:bg-blue-500 hover:bg-opacity-75'}`}
            >
              <CameraIcon className="h-6 w-6 ml-2" />
              {t('photography_tab')}
            </button>
            <button
              onClick={() => setActiveTab('clients')}
              className={`flex items-center px-4 py-2 rounded-full text-lg font-medium transition-all duration-300
                ${activeTab === 'clients' ? 'bg-white text-blue-700 shadow-md' : 'text-white hover:bg-blue-500 hover:bg-opacity-75'}`}
            >
              <UsersIcon className="h-6 w-6 ml-2" />
              {t('clients_tab')}
            </button>
            {isManager && (
              <button
                onClick={() => setActiveTab('reports')}
                className={`flex items-center px-4 py-2 rounded-full text-lg font-medium transition-all duration-300
                  ${activeTab === 'reports' ? 'bg-white text-blue-700 shadow-md' : 'text-white hover:bg-blue-500 hover:bg-opacity-75'}`}
              >
                <ChartBarIcon className="h-6 w-6 ml-2" />
                {t('reports_tab')}
              </button>
            )}
            {isManager && (
              <button
                onClick={() => setActiveTab('management')}
                className={`flex items-center px-4 py-2 rounded-full text-lg font-medium transition-all duration-300
                  ${activeTab === 'management' ? 'bg-white text-blue-700 shadow-md' : 'text-white hover:bg-blue-500 hover:bg-opacity-75'}`}
              >
                <Cog6ToothIcon className="h-6 w-6 ml-2" />
                {t('management_tab')}
              </button>
            )}
            <button
              onClick={() => setActiveTab('alerts')}
              className={`flex items-center px-4 py-2 rounded-full text-lg font-medium transition-all duration-300
                ${activeTab === 'alerts' ? 'bg-white text-blue-700 shadow-md' : 'text-white hover:bg-blue-500 hover:bg-opacity-75'}`}
            >
              <BellIcon className="h-6 w-6 ml-2" />
              {t('alerts_tab')}
            </button>
            <button
              onClick={logout}
              className="flex items-center px-4 py-2 rounded-full text-lg font-medium bg-red-500 hover:bg-red-600 transition-all duration-300 text-white shadow-md"
            >
              <ArrowRightOnRectangleIcon className="h-6 w-6 ml-2" />
              {t('logout_button')}
            </button>
            {/* Language Switcher */}
            <div className="relative inline-block text-left">
              <select
                onChange={(e) => changeLanguage(e.target.value)}
                value={i18n.language}
                className="block appearance-none w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded-full shadow leading-tight focus:outline-none focus:bg-white focus:border-blue-500"
              >
                <option value="ar">العربية</option>
                <option value="en">English</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-grow container mx-auto p-6">
        {/* Conditional Rendering for Clients Tab */}
        {activeTab === 'clients' && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-semibold text-gray-800">
                {t('client_management_title')}
              </h2>
              <div className="flex items-center space-x-4 space-x-reverse">
                <input
                  type="text"
                  placeholder={t('search_client_placeholder')}
                  value={clientSearchTerm}
                  onChange={(e) => setClientSearchTerm(e.target.value)}
                  className="p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 w-64"
                />
                <button
                  onClick={() => {
                    setShowAddClientForm(true);
                    setEditingClientId(null);
                    setInitialClientFormData(null);
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-full shadow-lg flex items-center transition duration-300 transform hover:scale-105"
                >
                  <PlusCircleIcon className="h-6 w-6 ml-2" />
                  {t('add_new_client_button')}
                </button>
              </div>
            </div>

            {showAddClientForm ? (
              <ClientForm
                onClientSaved={handleClientSaved}
                clientId={editingClientId}
                initialData={initialClientFormData}
              />
            ) : (
              <ClientList
                onEditClient={handleEditClient}
                onClientDeleted={handleClientDeleted}
                showToast={showToast}
                searchTerm={clientSearchTerm}
                isManager={isManager}
                onViewClientDetails={handleViewClientDetails}
              />
            )}
          </>
        )}

        {/* Conditional Rendering for Print Jobs Tab */}
        {activeTab === 'print_jobs' && (
          <PrintJobsTab onViewClientDetails={(clientId) => handleViewClientDetails(clientId, 'printing')} />
        )}

        {/* Conditional Rendering for Photography Tab */}
        {activeTab === 'photography' && (
          <PhotographyTab onViewClientDetails={(clientId) => handleViewClientDetails(clientId, 'photography')} />
        )}

        {/* Reports Tab Content (Manager Only) */}
        {activeTab === 'reports' && isManager && (
          <Reports showToast={showToast} />
        )}
        {activeTab === 'reports' && !isManager && (
          <div className="text-center text-red-600 text-2xl font-semibold p-10">
            {t('no_permission_reports')}
          </div>
        )}

        {/* Alerts Tab Content (Manager and Employee) */}
        {activeTab === 'alerts' && (
          <Alerts showToast={showToast} />
        )}

        {/* NEW: Conditional Rendering for Management Tab (Manager Only) */}
        {activeTab === 'management' && isManager && (
          <ManagementTab showToast={showToast} />
        )}
        {activeTab === 'management' && !isManager && (
          <div className="text-center text-red-600 text-2xl font-semibold p-10">
            {t('no_permission_management')}
          </div>
        )}
      </div>

      {/* Client Details Modal */}
      {selectedClientForDetails && (
        <ClientDetailsModal
          isOpen={!!selectedClientForDetails}
          onClose={handleCloseClientDetailsModal}
          clientId={selectedClientForDetails.id}
          initialTab={clientDetailsInitialTab}
        />
      )}
    </div>
  );
}

// المكون الرئيسي الذي يوفر الـ Contexts
function App() {
  return (
    <ToastProvider>
      <AuthWrapper />
    </ToastProvider>
  );
}

// مكون مساعد لتمرير showToast إلى AuthProvider
function AuthWrapper() {
  const { showToast } = useToast();
  return (
    <AuthProvider showToast={showToast}>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
