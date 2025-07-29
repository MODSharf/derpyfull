import React, { useState, useEffect, useCallback } from 'react';
import * as apiService from '../services/apiService';
import NotificationDetailsModal from './NotificationDetailsModal'; // Import the modal
import { BellIcon } from '@heroicons/react/24/outline';

const Alerts = ({ showToast }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State for the modal
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchNotifications = useCallback(async () => {
        try {
            const authToken = localStorage.getItem('authToken');
            const data = await apiService.getAlerts(authToken);
            setNotifications(data.results || data);
        } catch (err) {
            setError('Failed to fetch notifications.');
            console.error(err);
        }
    }, []);

    useEffect(() => {
        setLoading(true);
        fetchNotifications().finally(() => setLoading(false));

        const intervalId = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
        return () => clearInterval(intervalId); // Cleanup on unmount
    }, [fetchNotifications]);

    const handleMarkAsRead = async (id) => {
        try {
            const authToken = localStorage.getItem('authToken');
            await apiService.markAlertAsRead(authToken, id);
            setNotifications(prev => 
                prev.map(n => n.id === id ? { ...n, is_read: true } : n)
            );
        } catch (err) {
            showToast('Failed to mark notification as read.', 'error');
            console.error(err);
        }
    };

    const handleViewDetails = (notification) => {
        if (!notification.is_read) {
            handleMarkAsRead(notification.id);
        }
        setSelectedNotification(notification);
        setIsModalOpen(true);
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Notifications</h1>
            {loading ? (
                <div className="px-4 py-2 text-gray-500">Loading...</div>
            ) : error ? (
                <div className="px-4 py-2 text-red-500">{error}</div>
            ) : notifications.length === 0 ? (
                <div className="px-4 py-2 text-gray-500">No notifications.</div>
            ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <div className="p-4 text-sm text-gray-700">
                        <p className="font-semibold mb-2">Color Key:</p>
                        <ul className="list-disc list-inside">
                            <li className="text-red-700">Late: <span className="bg-red-100 px-2 rounded"></span></li>
                            <li className="text-yellow-700">Upcoming: <span className="bg-yellow-100 px-2 rounded"></span></li>
                            <li className="text-green-700">Today: <span className="bg-green-100 px-2 rounded"></span></li>
                            <li className="text-blue-700">Unread: <span className="bg-blue-50 px-2 rounded"></span></li>
                        </ul>
                    </div>
                    <ul className="divide-y divide-gray-200">
                        {notifications.map(notification => (
                            <li key={notification.id} className={`px-4 py-4 ${!notification.is_read ? 'bg-blue-50' : ''} ${notification.derived_status_category === 'late' ? 'bg-red-100' : notification.derived_status_category === 'upcoming' ? 'bg-yellow-100' : notification.derived_status_category === 'today' ? 'bg-green-100' : ''}`}>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            {notification.client_name} - {notification.job_type_display} - {notification.next_action_status}
                                        </p>
                                        {notification.job_type && notification.receipt_number && (
                                            <p className="mt-1 text-xs text-gray-600">
                                                {notification.job_type.charAt(0).toUpperCase() + notification.job_type.slice(1)}: {notification.receipt_number}
                                            </p>
                                        )}
                                    </div>
                                    <div className="ml-2 flex-shrink-0 flex">
                                        <button 
                                            onClick={() => handleViewDetails(notification)}
                                            className="text-sm font-medium text-blue-600 hover:text-blue-500"
                                        >
                                            View Details
                                        </button>
                                        {!notification.is_read && (
                                            <button 
                                                onClick={() => handleMarkAsRead(notification.id)}
                                                className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700"
                                            >
                                                Mark as Read
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-2 text-sm text-gray-500">
                                    {new Date(notification.created_at).toLocaleString()}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <NotificationDetailsModal 
                show={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                notification={selectedNotification} 
            />
        </div>
    );}
;

export default Alerts;
