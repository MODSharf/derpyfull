import React, { useState, useEffect, useCallback } from 'react';
import * as apiService from '../services/apiService';

const DetailItem = ({ label, value }) => (
    <div className="mb-2">
        <span className="font-semibold text-gray-600">{label}:</span>
        <span className="ml-2 text-gray-800">{value}</span>
    </div>
);

const NotificationDetailsModal = ({ notification, onClose, show }) => {
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchDetails = useCallback(async () => {
        if (!notification || !notification.related_object_details) return;

        setLoading(true);
        setError(null);
        try {
            const authToken = localStorage.getItem('authToken'); // Retrieve authToken here
            const { type, id } = notification.related_object_details;
            let response;
            if (type === 'printjob') {
                response = await apiService.getPrintJob(authToken, id);
            } else if (type === 'photosession') {
                response = await apiService.getPhotoSession(authToken, id);
            }
            setDetails(response);
        } catch (err) {
            setError('Failed to fetch details. Please try again later.');
            console.error('Error fetching notification details:', err);
        }
        setLoading(false);
    }, [notification]);

    useEffect(() => {
        if (show) {
            fetchDetails();
        }
    }, [show, fetchDetails]);

    if (!show) {
        return null;
    }

    const renderDetails = () => {
        if (!details) return null;

        const { type } = notification.related_object_details;

        if (type === 'printjob') {
            return (
                <>
                    <DetailItem label="Receipt Number" value={details.receipt_number} />
                    <DetailItem label="Client Name" value={details.client?.name} />
                    <DetailItem label="Print Type" value={details.print_type_display} />
                    <DetailItem label="Size" value={details.size_display} />
                    <DetailItem label="Delivery Date" value={new Date(details.delivery_date).toLocaleDateString()} />
                    <DetailItem label="Status" value={details.status_display} />
                    <DetailItem label="Created At" value={new Date(details.created_at).toLocaleString()} />
                    <DetailItem label="Updated At" value={new Date(details.updated_at).toLocaleString()} />
                </>
            );
        }

        if (type === 'photosession') {
            return (
                <>
                    <DetailItem label="Receipt Number" value={details.receipt_number} />
                    <DetailItem label="Client Name" value={details.client?.name} />
                    <DetailItem label="Package Name" value={details.package?.name || 'N/A'} />
                    <DetailItem label="Photographer Name" value={details.photographer?.name || 'Not Assigned'} />
                    <DetailItem label="Session Date" value={new Date(details.session_date).toLocaleDateString()} />
                    <DetailItem label="Session Time" value={details.session_time} />
                    <DetailItem label="Status" value={details.status_display} />
                    <DetailItem label="Event Type" value={details.event_type} />
                    <DetailItem label="Final Delivery Date" value={details.final_delivery_date ? new Date(details.final_delivery_date).toLocaleDateString() : 'N/A'} />
                    <DetailItem label="Photo Serial Number" value={details.photo_serial_number || 'N/A'} />
                    <DetailItem label="Final Gallery Link" value={details.final_gallery_link || 'N/A'} />
                    <DetailItem label="Editing Status" value={details.editing_status} />
                    <DetailItem label="Created At" value={new Date(details.created_at).toLocaleString()} />
                    <DetailItem label="Updated At" value={new Date(details.updated_at).toLocaleString()} />
                </>
            );
        }

        return <p>Unknown notification type.</p>;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Notification Details</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
                </div>
                
                {loading && <div className="text-center p-4">Loading...</div>}
                {error && <div className="text-center p-4 text-red-500">{error}</div>}
                
                {details && (
                    <div>
                        <div className="mb-4 border-b pb-2">
                            <h3 className="text-lg font-semibold text-blue-600">{details.client?.name}</h3>
                            <p className="text-sm text-gray-500">{details.client?.phone}</p>
                        </div>
                        {renderDetails()}
                    </div>
                )}

                <div className="mt-6 text-right">
                    <button 
                        onClick={onClose} 
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotificationDetailsModal;
