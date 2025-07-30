// src/components/ManagementTab.js
import React, { useState } from 'react';
import UserManagement from './UserManagement';
import PhotographyPackageManagement from './PhotographyPackageManagement';
import PhotographerManagement from './PhotographerManagement';
import RolePermissionManagement from './RolePermissionManagement'; // NEW: Import RolePermissionManagement

import {
  UsersIcon,
  PhotoIcon,
  UserGroupIcon,
  KeyIcon, // NEW: Icon for Roles & Permissions
} from '@heroicons/react/24/solid';

/**
 * ManagementTab Component
 * This component acts as a container for various administrative functionalities,
 * such as user management, photography package management, and photographer management.
 * It uses tabs to switch between different management sections.
 *
 * Props:
 * - showToast: Function to display toast notifications.
 */
function ManagementTab({ showToast }) {
  // State to manage the active sub-tab within the Management section
  const [activeSubTab, setActiveSubTab] = useState('users'); // Default to 'users' tab

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-6xl mx-auto my-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
        لوحة الإدارة
      </h2>

      {/* Sub-tabs for Management */}
      <div className="flex justify-center mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveSubTab('users')}
          className={`flex items-center px-6 py-3 text-center font-medium text-lg rounded-t-lg transition-colors duration-200
            ${activeSubTab === 'users' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'}
          `}
        >
          <UsersIcon className="h-6 w-6 ml-2" />
          المستخدمون
        </button>
        <button
          onClick={() => setActiveSubTab('packages')}
          className={`flex items-center px-6 py-3 text-center font-medium text-lg rounded-t-lg transition-colors duration-200
            ${activeSubTab === 'packages' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'}
          `}
        >
          <PhotoIcon className="h-6 w-6 ml-2" />
          الباقات
        </button>
        <button
          onClick={() => setActiveSubTab('photographers')}
          className={`flex items-center px-6 py-3 text-center font-medium text-lg rounded-t-lg transition-colors duration-200
            ${activeSubTab === 'photographers' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'}
          `}
        >
          <UserGroupIcon className="h-6 w-6 ml-2" />
          المصورون
        </button>
        <button
          onClick={() => setActiveSubTab('roles_permissions')} // NEW: Add Roles & Permissions tab
          className={`flex items-center px-6 py-3 text-center font-medium text-lg rounded-t-lg transition-colors duration-200
            ${activeSubTab === 'roles_permissions' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'}
          `}
        >
          <KeyIcon className="h-6 w-6 ml-2" /> {/* NEW: Icon for Roles & Permissions */}
          الأدوار والصلاحيات
        </button>
      </div>

      {/* Conditional rendering of sub-tab content */}
      {activeSubTab === 'users' && (
        <UserManagement showToast={showToast} />
      )}
      {activeSubTab === 'packages' && (
        <PhotographyPackageManagement showToast={showToast} />
      )}
      {activeSubTab === 'photographers' && (
        <PhotographerManagement showToast={showToast} />
      )}
      {activeSubTab === 'roles_permissions' && (
        <RolePermissionManagement />
      )}
    </div>
  );
}

export default ManagementTab;
