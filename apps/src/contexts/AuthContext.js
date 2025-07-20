// src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin, logout as apiLogout, getCurrentUser } from '../services/apiService';
import { useToast } from './ToastContext'; // استيراد useToast

// إنشاء الـ Context
const AuthContext = createContext(null);

/**
 * AuthProvider Component
 * Provides authentication state and functions to its children components.
 * Manages login, logout, user data, and manager status.
 *
 * Props:
 * - showToast: Function to display toast notifications (passed from App.js).
 */
export const AuthProvider = ({ children, showToast }) => {
  // استخدام setAuthTokenState كدالة داخلية لتعيين التوكن في الحالة
  const [authToken, setAuthTokenState] = useState(localStorage.getItem('authToken'));
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!authToken); // حالة لتتبع ما إذا كان المستخدم مصادقًا
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [isManager, setIsManager] = useState(false); // حالة لتحديد ما إذا كان المستخدم مديرًا

  // دالة لتعيين توكن المصادقة وتخزينه في localStorage
  // هذه الدالة هي التي يجب استخدامها لتحديث authToken
  const setAuthToken = useCallback((token) => {
    setAuthTokenState(token);
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }, []);

  // دالة لجلب بيانات المستخدم وتعيين حالة المدير
  const fetchUserData = useCallback(async (token) => {
    if (!token) {
      setUser(null);
      setIsAuthenticated(false);
      setIsManager(false);
      setLoadingAuth(false);
      return;
    }
    try {
      setLoadingAuth(true);
      const userData = await getCurrentUser(token);
      setUser(userData);
      setIsAuthenticated(true);
      // هذا هو السطر الحاسم: استخدم 'profile_role_display' الذي يأتي من الـ backend
      // وتأكد من مطابقة القيمة العربية 'مدير'
      setIsManager(userData.profile_role_display === 'مدير');
      console.log('User Data fetched:', userData); // للمساعدة في التصحيح
      console.log('Is Manager (from profile_role_display):', userData.profile_role_display === 'مدير'); // للمساعدة في التصحيح
    } catch (error) {
      console.error('Failed to fetch user data during authentication:', error);
      showToast(`فشل جلب بيانات المستخدم: ${error.message}. الرجاء تسجيل الدخول مرة أخرى.`, 'error');
      // إذا فشل جلب البيانات، قم بتسجيل الخروج لمنع مشاكل الصلاحيات
      setAuthToken(null); // استخدم دالة setAuthToken الموحدة هنا
      setUser(null);
      setIsAuthenticated(false);
      setIsManager(false);
    } finally {
      setLoadingAuth(false);
    }
  }, [setAuthToken, showToast]); // setAuthToken و showToast كـ dependencies

  // التحميل الأولي: التحقق من التوكن وجلب المستخدم
  useEffect(() => {
    fetchUserData(authToken);
  }, [authToken, fetchUserData]); // إعادة الجلب إذا تغير authToken أو fetchUserData

  // دالة تسجيل الدخول
  const login = useCallback(async (username, password) => {
    setLoadingAuth(true);
    try {
      // apiLogin يعيد الكائن الكامل (token, user_id, username, role)
      const data = await apiLogin(username, password);
      setAuthToken(data.token); // قم بتعيين التوكن فقط، و useEffect سيتولى جلب بيانات المستخدم وتعيين isManager

      showToast('تم تسجيل الدخول بنجاح!', 'success');
      return data; // أعد البيانات الكاملة لـ Login component إذا لزم الأمر
    } catch (error) {
      console.error('AuthContext login error:', error);
      throw error; // إعادة رمي الخطأ ليتم التعامل معه في مكون Login
    } finally {
      setLoadingAuth(false);
    }
  }, [setAuthToken, showToast]); // setAuthToken و showToast كـ dependencies

  // دالة تسجيل الخروج
  const logout = useCallback(async () => {
    setLoadingAuth(true);
    try {
      if (authToken) {
        await apiLogout(authToken);
      }
      setAuthToken(null); // استخدم دالة setAuthToken الموحدة هنا
      setUser(null);
      setIsAuthenticated(false);
      setIsManager(false);
      showToast('تم تسجيل الخروج بنجاح.', 'info');
    } catch (error) {
      console.error('AuthContext logout error:', error);
      showToast('فشل تسجيل الخروج.', 'error');
      throw error;
    } finally {
      setLoadingAuth(false);
    }
  }, [authToken, setAuthToken, showToast]); // authToken, setAuthToken, showToast كـ dependencies

  const contextValue = {
    isAuthenticated, // توفير حالة المصادقة
    authToken,
    user,
    isManager,
    loadingAuth,
    login,
    logout,
    // الدوال setter لم تعد تمرر مباشرة، استخدم الدوال الموحدة (login, logout, setAuthToken)
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook مخصص لاستخدام الـ Context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) { // استخدم undefined بدلاً من !context للتوافق مع بعض البيئات
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
