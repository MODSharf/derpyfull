import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getRoles, getPermissions, updateRolePermissions } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

function RolePermissionManagement() {
  const { t } = useTranslation();
  const { authToken } = useAuth();
  const { showToast } = useToast();

  const [roles, setRoles] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [rolePermissions, setRolePermissions] = useState(new Set()); // Using a Set for efficient lookup
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const fetchInitialData = useCallback(async () => {
    if (!authToken) {
      setError('Authentication token missing.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [rolesData, permissionsData] = await Promise.all([
        getRoles(authToken),
        getPermissions(authToken),
      ]);
      setRoles(rolesData.results || rolesData); // Adjust based on API response structure
      setAllPermissions(permissionsData.results || permissionsData); // Adjust based on API response structure
    } catch (err) {
      console.error('Error fetching initial data:', err);
      setError(`Failed to load roles or permissions: ${err.message}`);
      showToast(`Failed to load data: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [authToken, showToast]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleRoleSelect = useCallback(async (roleId) => {
    const role = roles.find(r => r.id === parseInt(roleId));
    setSelectedRole(role);
    if (role) {
      try {
        setLoading(true);
        const permissionsData = await getPermissions(authToken, role.id); // Fetch permissions for the selected role
        setRolePermissions(new Set(permissionsData.map(p => `${p.content_type.app_label}.${p.codename}`)));
      } catch (err) {
        console.error('Error fetching role permissions:', err);
        setError(`Failed to load role permissions: ${err.message}`);
        showToast(`Failed to load role permissions: ${err.message}`, 'error');
      } finally {
        setLoading(false);
      }
    } else {
      setRolePermissions(new Set());
    }
  }, [roles, authToken, showToast]);

  const handlePermissionChange = useCallback((e) => {
    const { value, checked } = e.target;
    setRolePermissions(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(value);
      } else {
        newSet.delete(value);
      }
      return newSet;
    });
  }, []);

  const handleSavePermissions = useCallback(async () => {
    if (!selectedRole) return;
    setIsSaving(true);
    setError(null);
    try {
      const permissionsToSave = Array.from(rolePermissions); // Convert Set to Array
      await updateRolePermissions(authToken, selectedRole.id, permissionsToSave);
      showToast('Permissions updated successfully!', 'success');
    } catch (err) {
      console.error('Error saving permissions:', err);
      setError(`Failed to save permissions: ${err.message}`);
      showToast(`Failed to save permissions: ${err.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  }, [authToken, selectedRole, rolePermissions, showToast]);

  if (loading) {
    return <div className="text-center py-10">Loading permissions data...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Manage Role Permissions</h2>

      <div className="mb-6">
        <label htmlFor="role-select" className="block text-sm font-medium text-gray-700 mb-2">
          Select a Role:
        </label>
        <select
          id="role-select"
          onChange={(e) => handleRoleSelect(e.target.value)}
          className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          value={selectedRole ? selectedRole.id : ''} // Use value for controlled component
        >
          <option value="" disabled>-- Choose a Role --</option>
          {roles.map(role => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
      </div>

      {selectedRole && (
        <div>
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Permissions for {selectedRole.name}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-md border border-gray-200">
            {allPermissions.map(perm => (
              <div key={perm.id} className="flex items-center">
                <input
                  type="checkbox"
                  id={`perm-${perm.id}`}
                  value={`${perm.content_type.app_label}.${perm.codename}`}
                  checked={rolePermissions.has(`${perm.content_type.app_label}.${perm.codename}`)}
                  onChange={handlePermissionChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor={`perm-${perm.id}`} className="ml-2 text-sm text-gray-900">
                  {t(`permission_${perm.codename}`, perm.name)} ({perm.content_type.app_label}.{perm.codename})
                </label>
              </div>
            ))}
          </div>

          <div className="mt-6 text-right">
            <button
              onClick={handleSavePermissions}
              disabled={isSaving}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700 transition duration-300 ease-in-out transform hover:scale-105"
            >
              {isSaving ? 'Saving...' : 'Save Permissions'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default RolePermissionManagement;
