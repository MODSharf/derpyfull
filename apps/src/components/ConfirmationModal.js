// src/components/ConfirmationModal.js
import React from 'react';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';

/**
 * ConfirmationModal Component
 * A reusable modal for confirming actions (e.g., deletion).
 *
 * Props:
 * - isOpen: Boolean to control modal visibility.
 * - onClose: Function to close the modal (e.g., when clicking outside or cancel).
 * - onConfirm: Function to execute when the action is confirmed.
 * - title: Title of the confirmation modal.
 * - message: Message to display to the user.
 * - confirmButtonText: Text for the confirm button.
 * - cancelButtonText: Text for the cancel button.
 * - confirmButtonColorClass: Tailwind CSS class for confirm button color (e.g., 'bg-red-600').
 */
function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "تأكيد الإجراء",
  message = "هل أنت متأكد أنك تريد المتابعة بهذا الإجراء؟",
  confirmButtonText = "تأكيد",
  cancelButtonText = "إلغاء",
  confirmButtonColorClass = "bg-red-600 hover:bg-red-700",
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition"
          title="إغلاق"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-yellow-500" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">{title}</h3>
          <div className="mt-2">
            <p className="text-sm text-gray-500">{message}</p>
          </div>
        </div>

        <div className="mt-5 sm:mt-6 flex justify-end gap-3">
          <button
            type="button"
            className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
            onClick={onClose}
          >
            {cancelButtonText}
          </button>
          <button
            type="button"
            className={`inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white ${confirmButtonColorClass} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:text-sm`}
            onClick={onConfirm}
          >
            {confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationModal;
