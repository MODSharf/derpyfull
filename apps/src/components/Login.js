// src/components/Login.js
import React, { useState, useCallback } from 'react';
// لا نحتاج لاستيراد `login` من `apiService` هنا مباشرة،
// لأننا سنستخدم دالة `login` من `useAuth`
// import { login } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext'; // استيراد useAuth hook

/**
 * Login Component
 * Handles user authentication (login).
 *
 * Props:
 * - showToast: Function to display toast notifications.
 * Note: onLoginSuccess is now handled internally by AuthContext's login logic.
 */
function Login({ showToast }) { // <--- تأكد من استقبال showToast هنا
  // جلب دالة `login` من سياق المصادقة، بالإضافة إلى `setAuthToken`, `setIsManager`, `setCurrentUser`
  // على الرغم من أن `login` الجديدة في السياق ستتولى معظم هذا.
  const { login: authContextLogin } = useAuth(); // إعادة تسمية `login` لتجنب التعارض

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // استخدام دالة `login` من سياق المصادقة
      await authContextLogin(username, password);
      //showToast('تم تسجيل الدخول بنجاح!', 'success');
      // لا حاجة لاستدعاء onLoginSuccess هنا، لأن AuthContext يتولى تحديث الحالة
    } catch (err) {
      console.error('Login error:', err);
      // حاول تحليل رسالة الخطأ إذا كانت JSON
      let errorMessage = 'فشل تسجيل الدخول. يرجى التحقق من اسم المستخدم وكلمة المرور.';
      try {
        const parsedError = JSON.parse(err.message);
        if (parsedError.non_field_errors) {
          errorMessage = parsedError.non_field_errors[0];
        } else if (parsedError.detail) {
          errorMessage = parsedError.detail;
        } else {
          errorMessage = err.message;
        }
      } catch (parseErr) {
        errorMessage = err.message; // إذا لم يكن JSON، استخدم الرسالة الأصلية
      }
      setError(errorMessage);
      //showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  //}, [username, password, authContextLogin, showToast]); // <--- إضافة authContextLogin و showToast إلى dependencies
  }, [username, password, authContextLogin]); // <--- إضافة authContextLogin و showToast إلى dependencies

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-6">تسجيل الدخول</h2>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">خطأ!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              اسم المستخدم
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="أدخل اسم المستخدم"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              كلمة المرور
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="أدخل كلمة المرور"
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white ${
                loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              } transition duration-300`}
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-white mr-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : null}
              {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
