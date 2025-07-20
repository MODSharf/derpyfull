// src/components/ManagementTab.js
import React, { useState } from 'react';
import UserManagement from './UserManagement';
import PhotographyPackageManagement from './PhotographyPackageManagement';
import PhotographerManagement from './PhotographerManagement'; // NEW: Import the new component

import {
  UsersIcon, // أيقونة لإدارة المستخدمين
  PhotoIcon, // أيقونة لإدارة الباقات
  UserGroupIcon, // NEW: أيقونة لإدارة المصورين (أو CameraIcon, UserCircleIcon)
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
          onClick={() => setActiveSubTab('photographers')} // NEW: Add photographers tab
          className={`flex items-center px-6 py-3 text-center font-medium text-lg rounded-t-lg transition-colors duration-200
            ${activeSubTab === 'photographers' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'}
          `}
        >
          <UserGroupIcon className="h-6 w-6 ml-2" /> {/* NEW: Icon for photographers */}
          المصورون
        </button>
      </div>

      {/* Conditional rendering of sub-tab content */}
      {activeSubTab === 'users' && (
        <UserManagement showToast={showToast} />
      )}
      {activeSubTab === 'packages' && (
        <PhotographyPackageManagement showToast={showToast} />
      )}
      {activeSubTab === 'photographers' && ( // NEW: Render PhotographerManagement
        <PhotographerManagement showToast={showToast} />
      )}
    </div>
  );
}

export default ManagementTab;
