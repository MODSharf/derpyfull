// src/contexts/ToastContext.js
import React, { createContext, useContext, useState, useCallback } from 'react';

// 1. إنشاء السياق (Context)
const ToastContext = createContext(null);

/**
 * 2. مكون مزود السياق (Provider)
 * هذا المكون يغلف الأجزاء الأخرى من التطبيق ويوفر لها قيمة السياق (دالة showToast).
 */
export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null); // حالة لتخزين رسالة الـ toast ونوعها

  // دالة لعرض رسالة toast
  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    setToast({ message, type });
    // إخفاء الـ toast بعد مدة محددة
    setTimeout(() => {
      setToast(null);
    }, duration);
  }, []);

  // دالة لإخفاء الـ toast يدوياً (اختياري)
  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  // القيمة التي سيتم توفيرها لجميع المستهلكين (Consumers)
  const contextValue = {
    showToast, // هذه هي الدالة التي كانت تسبب المشكلة
    hideToast,
    toast, // يمكن أيضاً توفير حالة الـ toast نفسها إذا لزم الأمر
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {/* هذا الجزء يعرض رسالة الـ toast الفعلية */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 p-4 rounded-md shadow-lg text-white z-50 transition-all duration-300 transform
            ${toast.type === 'success' ? 'bg-green-500' : ''}
            ${toast.type === 'error' ? 'bg-red-500' : ''}
            ${toast.type === 'info' ? 'bg-blue-500' : ''}
            ${toast.type === 'warning' ? 'bg-orange-500' : ''}
            ${toast.type === 'default' ? 'bg-gray-700' : ''}
            ${toast ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}` // تأثير ظهور/اختفاء
          }
          role="alert"
        >
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
};

/**
 * 3. هوك مخصص (Custom Hook) لاستخدام السياق
 * هذا الهوك يجعل استخدام السياق أسهل وأكثر أماناً.
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === null) {
    // التحقق من أن الهوك يُستخدم داخل ToastProvider
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
