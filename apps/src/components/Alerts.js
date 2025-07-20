// src/components/Alerts.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  ExclamationCircleIcon,
  InformationCircleIcon,
  ClockIcon, // For overdue/upcoming
  CalendarDaysIcon, // For upcoming
  CurrencyDollarIcon, // For unpaid
  CameraIcon, // For photo session alerts
  PrinterIcon, // For print job alerts
} from '@heroicons/react/24/solid';

// ===========================================================================
// إعدادات الـ API (تأكد من مطابقتها لإعداداتك في App.js)
// ===========================================================================
const API_BASE_URL = 'http://127.0.0.1:8000/api';

// المكون Alerts
// يتلقى 'showToast' لعرض الإشعارات
function Alerts({ showToast }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // دالة لجلب طلبات الطباعة وجلسات التصوير وتوليد التنبيهات
  const fetchAlerts = useCallback(async () => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      setError('لا يوجد توكن مصادقة. الرجاء تسجيل الدخول.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Token ${authToken}`
      };

      // جلب جميع طلبات الطباعة
      const printJobsResponse = await fetch(`${API_BASE_URL}/printjobs/`, { headers });
      if (!printJobsResponse.ok) {
        const errorData = await printJobsResponse.json();
        throw new Error(errorData.detail || 'فشل في جلب طلبات الطباعة للتنبيهات.');
      }
      const printJobsData = await printJobsResponse.json();
      const printJobs = printJobsData.results;

      // جلب جميع جلسات التصوير
      const photoSessionsResponse = await fetch(`${API_BASE_URL}/photosessions/`, { headers });
      if (!photoSessionsResponse.ok) {
        const errorData = await photoSessionsResponse.json();
        throw new Error(errorData.detail || 'فشل في جلب جلسات التصوير للتنبيهات.');
      }
      const photoSessionsData = await photoSessionsResponse.json();
      const photoSessions = photoSessionsData.results;

      const today = new Date();
      today.setHours(0, 0, 0, 0); // بداية اليوم الحالي

      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(today.getDate() + 7);
      sevenDaysFromNow.setHours(23, 59, 59, 999); // نهاية اليوم السابع من الآن

      const generatedAlerts = [];

      // --- تنبيهات طلبات الطباعة ---
      printJobs.forEach(job => {
        const deliveryDate = new Date(job.delivery_date);
        deliveryDate.setHours(0, 0, 0, 0);

        // تجاهل الطلبات التي تم تسليمها، إلغاؤها، أو اكتمالها
        if (['delivered', 'cancelled', 'completed'].includes(job.status)) {
          return;
        }

        // تنبيه للطلبات المتأخرة
        if (deliveryDate < today) {
          generatedAlerts.push({
            id: `print-overdue-${job.id}`,
            type: 'error',
            message: `طلب طباعة رقم ${job.receipt_number || job.id} متأخر! تاريخ التسليم كان ${job.delivery_date}.`,
            item: job,
            itemType: 'print_job',
            icon: <PrinterIcon className="w-6 h-6 text-red-500" />
          });
        }
        // تنبيه للطلبات التي اقترب موعد تسليمها (من اليوم حتى 7 أيام قادمة)
        else if (deliveryDate >= today && deliveryDate <= sevenDaysFromNow) {
          generatedAlerts.push({
            id: `print-upcoming-${job.id}`,
            type: 'warning',
            message: `طلب طباعة رقم ${job.receipt_number || job.id} يستحق التسليم قريبًا: ${job.delivery_date}.`,
            item: job,
            itemType: 'print_job',
            icon: <CalendarDaysIcon className="w-6 h-6 text-yellow-500" />
          });
        }
        // تنبيه للطلبات قيد التنفيذ (إذا لم يتم تغطيتها بالفعل كتنبيه متأخر أو قادم)
        else if (job.status === 'in_progress') {
          generatedAlerts.push({
            id: `print-in_progress-${job.id}`,
            type: 'info',
            message: `طلب طباعة رقم ${job.receipt_number || job.id} قيد التنفيذ.`,
            item: job,
            itemType: 'print_job',
            icon: <InformationCircleIcon className="w-6 h-6 text-blue-500" />
          });
        }
      });

      // --- تنبيهات جلسات التصوير ---
      photoSessions.forEach(session => {
        const finalDeliveryDate = session.final_delivery_date ? new Date(session.final_delivery_date) : null;
        if (finalDeliveryDate) {
          finalDeliveryDate.setHours(0, 0, 0, 0);
        }

        // تجاهل الجلسات التي تم تسليمها، إلغاؤها، أو اكتمالها
        if (['delivered', 'cancelled', 'completed'].includes(session.status)) {
          return;
        }

        // تنبيه للجلسات المتأخرة
        if (finalDeliveryDate && finalDeliveryDate < today) {
          generatedAlerts.push({
            id: `photo-overdue-${session.id}`,
            type: 'error',
            message: `جلسة تصوير رقم ${session.receipt_number || session.id} متأخرة! تاريخ التسليم النهائي كان ${session.final_delivery_date}.`,
            item: session,
            itemType: 'photo_session',
            icon: <CameraIcon className="w-6 h-6 text-red-500" />
          });
        }
        // تنبيه للجلسات التي اقترب موعد تسليمها (من اليوم حتى 7 أيام قادمة)
        else if (finalDeliveryDate && finalDeliveryDate >= today && finalDeliveryDate <= sevenDaysFromNow) {
          generatedAlerts.push({
            id: `photo-upcoming-${session.id}`,
            type: 'warning',
            message: `جلسة تصوير رقم ${session.receipt_number || session.id} تستحق التسليم قريبًا: ${session.final_delivery_date}.`,
            item: session,
            itemType: 'photo_session',
            icon: <CalendarDaysIcon className="w-6 h-6 text-yellow-500" />
          });
        }
        // تنبيه للجلسات قيد التعديل/المعالجة
        else if (['in_shooting', 'raw_material_uploaded', 'in_editing', 'ready_for_review', 'ready_for_printing'].includes(session.editing_status)) {
          generatedAlerts.push({
            id: `photo-editing-${session.id}`,
            type: 'info',
            message: `جلسة تصوير رقم ${session.receipt_number || session.id} قيد المعالجة (${session.editing_status_display}).`,
            item: session,
            itemType: 'photo_session',
            icon: <InformationCircleIcon className="w-6 h-6 text-blue-500" />
          });
        }

        // تنبيه للجلسات التي لم يتم دفعها بالكامل (إذا كان هناك مبلغ متبقي)
        if (parseFloat(session.remaining_amount) > 0 && !['delivered', 'cancelled', 'completed'].includes(session.status)) {
          generatedAlerts.push({
            id: `photo-unpaid-${session.id}`,
            type: 'warning', // Can be warning or error depending on urgency
            message: `جلسة تصوير رقم ${session.receipt_number || session.id} لديها مبلغ متبقي: ${parseFloat(session.remaining_amount).toFixed(2)} SAR.`,
            item: session,
            itemType: 'photo_session',
            icon: <CurrencyDollarIcon className="w-6 h-6 text-orange-500" />
          });
        }
      });


      setAlerts(generatedAlerts.sort((a, b) => {
        // ترتيب التنبيهات: الأخطاء أولاً، ثم التحذيرات، ثم المعلومات
        const order = { 'error': 1, 'warning': 2, 'info': 3 };
        return order[a.type] - order[b.type];
      }));

    } catch (err) {
      console.error("خطأ في جلب التنبيهات:", err);
      setError(err.message);
      showToast(`خطأ في جلب التنبيهات: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // جلب التنبيهات عند تحميل المكون
  useEffect(() => {
    fetchAlerts();
    // يمكن إضافة تحديث دوري للتنبيهات هنا، مثلاً كل 5 دقائق
    const intervalId = setInterval(fetchAlerts, 5 * 60 * 1000); // كل 5 دقائق
    return () => clearInterval(intervalId); // تنظيف عند إلغاء تحميل المكون
  }, [fetchAlerts]);

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center bg-gray-100 p-4">
        <div className="text-xl font-semibold text-gray-700">جاري تحميل التنبيهات...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center bg-red-100 p-4 text-center">
        <div className="text-xl font-semibold text-red-700">خطأ: {error}</div>
        <p className="text-red-600 mt-2">
          الرجاء التأكد من أن خادم Django يعمل وأن التوكن صحيح.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto my-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">التنبيهات والمهام القادمة</h2>

      {alerts.length === 0 ? (
        <p className="text-center text-gray-600 text-lg">لا توجد تنبيهات حاليًا. كل شيء على ما يرام!</p>
      ) : (
        <div className="space-y-4">
          {alerts.map(alert => (
            <div
              key={alert.id}
              className={`flex items-center p-4 rounded-lg shadow-sm
                ${alert.type === 'error' ? 'bg-red-100 border border-red-400 text-red-700' : ''}
                ${alert.type === 'warning' ? 'bg-yellow-100 border border-yellow-400 text-yellow-700' : ''}
                ${alert.type === 'info' ? 'bg-blue-100 border border-blue-400 text-blue-700' : ''}
              `}
            >
              {alert.icon} {/* Display the dynamic icon */}
              <p className="text-sm font-medium flex-grow mr-3 rtl:ml-3">{alert.message}</p>
              {/* زر عرض تفاصيل الطلب/الجلسة */}
              {alert.item && (
                <a
                  href={alert.itemType === 'print_job' ? `#print-job-${alert.item.id}` : `#photo-session-${alert.item.id}`}
                  className="ml-4 rtl:mr-4 text-blue-600 hover:underline text-sm whitespace-nowrap"
                  onClick={(e) => {
                    e.preventDefault(); // Prevent default anchor behavior
                    // Here you would typically open a modal or navigate to the specific item's details
                    // For now, we'll just log to console and show a toast
                    showToast(`عرض تفاصيل ${alert.itemType === 'print_job' ? 'طلب الطباعة' : 'جلسة التصوير'} رقم: ${alert.item.id}`, 'info');
                    console.log(`عرض تفاصيل ${alert.itemType === 'print_job' ? 'طلب الطباعة' : 'جلسة التصوير'} رقم:`, alert.item.id);
                    // In a real app, you'd use a prop like onViewPrintJobDetails or onViewPhotoSessionDetails
                  }}
                >
                  عرض التفاصيل
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Alerts;
