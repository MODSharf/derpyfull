// src/components/Reports.js
import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

// المكون Reports
// يتلقى 'showToast' لعرض الإشعارات
function Reports({ showToast }) {
  const { authToken } = useAuth();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeReportTab, setActiveReportTab] = useState('overall'); // 'overall', 'print_jobs', 'photo_sessions'

  // الألوان المستخدمة في الرسوم البيانية
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  // دالة لجلب بيانات التقارير
  const fetchReportData = useCallback(async () => {
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

      // --- جلب بيانات طلبات الطباعة ---
      const printJobsResponse = await fetch(`${API_BASE_URL}/printjobs/`, { headers });
      if (!printJobsResponse.ok) {
        const errorData = await printJobsResponse.json();
        throw new Error(errorData.detail || 'فشل في جلب بيانات طلبات الطباعة للتقارير.');
      }
      const printJobsData = await printJobsResponse.json();
      const printJobs = printJobsData.results;

      // --- جلب بيانات جلسات التصوير ---
      const photoSessionsResponse = await fetch(`${API_BASE_URL}/photosessions/`, { headers });
      if (!photoSessionsResponse.ok) {
        const errorData = await photoSessionsResponse.json();
        throw new Error(errorData.detail || 'فشل في جلب بيانات جلسات التصوير للتقارير.');
      }
      const photoSessionsData = await photoSessionsResponse.json();
      const photoSessions = photoSessionsData.results;

      // --- حساب ملخص طلبات الطباعة ---
      const printJobsStatusSummary = printJobs.reduce((acc, job) => {
        acc[job.status_display] = (acc[job.status_display] || 0) + 1;
        return acc;
      }, {});

      const printJobsTotalAmounts = printJobs.reduce((acc, job) => {
        acc.total = acc.total + parseFloat(job.total_amount);
        acc.paid = acc.paid + parseFloat(job.paid_amount);
        acc.remaining = acc.remaining + parseFloat(job.remaining_amount);
        return acc;
      }, { total: 0, paid: 0, remaining: 0 });

      // تحويل ملخص الحالة إلى تنسيق مناسب للرسم البياني الشريطي
      const printJobsStatusChartData = Object.entries(printJobsStatusSummary).map(([name, value]) => ({ name, value }));
      const printJobsAmountChartData = [
        { name: 'المبلغ الكلي', value: printJobsTotalAmounts.total },
        { name: 'المبلغ المدفوع', value: printJobsTotalAmounts.paid },
        { name: 'المبلغ المتبقي', value: printJobsTotalAmounts.remaining },
      ];


      // --- حساب ملخص جلسات التصوير ---
      const photoSessionsStatusSummary = photoSessions.reduce((acc, session) => {
        acc[session.status_display] = (acc[session.status_display] || 0) + 1;
        return acc;
      }, {});

      const photoSessionsEditingStatusSummary = photoSessions.reduce((acc, session) => {
        acc[session.editing_status_display] = (acc[session.editing_status_display] || 0) + 1;
        return acc;
      }, {});

      const photoSessionsTotalAmounts = photoSessions.reduce((acc, session) => {
        acc.total = acc.total + parseFloat(session.total_amount);
        acc.paid = acc.paid + parseFloat(session.paid_amount);
        acc.remaining = acc.remaining + parseFloat(session.remaining_amount);
        return acc;
      }, { total: 0, paid: 0, remaining: 0 });

      // تحويل ملخص الحالة إلى تنسيق مناسب للرسم البياني الشريطي
      const photoSessionsStatusChartData = Object.entries(photoSessionsStatusSummary).map(([name, value]) => ({ name, value }));
      const photoSessionsEditingStatusChartData = Object.entries(photoSessionsEditingStatusSummary).map(([name, value]) => ({ name, value }));
      const photoSessionsAmountChartData = [
        { name: 'المبلغ الكلي', value: photoSessionsTotalAmounts.total },
        { name: 'المبلغ المدفوع', value: photoSessionsTotalAmounts.paid },
        { name: 'المبلغ المتبقي', value: photoSessionsTotalAmounts.remaining },
      ];


      // --- حساب الملخص العام (Overall) ---
      const overallTotalJobs = printJobs.length + photoSessions.length;
      const overallTotalAmounts = {
        total: printJobsTotalAmounts.total + photoSessionsTotalAmounts.total,
        paid: printJobsTotalAmounts.paid + photoSessionsTotalAmounts.paid,
        remaining: printJobsTotalAmounts.remaining + photoSessionsTotalAmounts.remaining,
      };
      const overallAmountChartData = [
        { name: 'الكلي', value: overallTotalAmounts.total },
        { name: 'المدفوع', value: overallTotalAmounts.paid },
        { name: 'المتبقي', value: overallTotalAmounts.remaining },
      ];

      // دمج ملخصات الحالات العامة للرسم البياني الشريطي العام
      const overallStatusSummary = {};
      for (const status in printJobsStatusSummary) {
        overallStatusSummary[status] = (overallStatusSummary[status] || 0) + printJobsStatusSummary[status];
      }
      for (const status in photoSessionsStatusSummary) {
        overallStatusSummary[status] = (overallStatusSummary[status] || 0) + photoSessionsStatusSummary[status];
      }
      const overallStatusChartData = Object.entries(overallStatusSummary).map(([name, value]) => ({ name, value }));


      setReportData({
        printJobs: {
          total: printJobs.length,
          statusSummary: printJobsStatusSummary,
          totalAmounts: printJobsTotalAmounts,
          statusChartData: printJobsStatusChartData,
          amountChartData: printJobsAmountChartData,
        },
        photoSessions: {
          total: photoSessions.length,
          statusSummary: photoSessionsStatusSummary,
          editingStatusSummary: photoSessionsEditingStatusSummary,
          totalAmounts: photoSessionsTotalAmounts,
          statusChartData: photoSessionsStatusChartData,
          editingStatusChartData: photoSessionsEditingStatusChartData,
          amountChartData: photoSessionsAmountChartData,
        },
        overall: {
          totalJobs: overallTotalJobs,
          totalAmounts: overallTotalAmounts,
          amountChartData: overallAmountChartData,
          statusChartData: overallStatusChartData,
        }
      });

    } catch (err) {
      console.error("خطأ في جلب بيانات التقارير:", err);
      setError(err.message);
      showToast(`خطأ في جلب التقارير: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [authToken, showToast]);

  // جلب بيانات التقارير عند تحميل المكون
  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center bg-gray-100 p-4">
        <div className="text-xl font-semibold text-gray-700">جاري تحميل التقارير...</div>
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

  if (!reportData) {
    return (
      <div className="min-h-full flex items-center justify-center bg-gray-100 p-4">
        <div className="text-xl font-semibold text-gray-700">لا توجد بيانات تقارير لعرضها.</div>
      </div>
    );
  }

  // مكون Tooltip مخصص للرسوم البيانية
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 bg-white border border-gray-300 rounded-md shadow-lg text-right text-gray-800">
          <p className="font-bold text-lg mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={`item-${index}`} style={{ color: entry.color }}>
              {entry.name}: <span className="font-semibold">{entry.value}</span> {label === 'المبالغ' ? 'SAR' : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderOverallReport = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Overall Total Jobs Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 shadow-sm flex flex-col items-center justify-center text-center">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">إجمالي الطلبات والجلسات</h3>
          <p className="text-4xl font-extrabold text-blue-600">{reportData.overall.totalJobs}</p>
        </div>

        {/* Overall Total Amounts Card */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-5 shadow-sm flex flex-col items-center justify-center text-center">
          <h3 className="text-lg font-semibold text-green-800 mb-2">إجمالي المبالغ (الكل)</h3>
          <p className="text-2xl font-bold text-green-600">
            الكلي: {reportData.overall.totalAmounts.total.toFixed(2)} SAR
          </p>
          <p className="text-2xl font-bold text-green-600">
            المدفوع: {reportData.overall.totalAmounts.paid.toFixed(2)} SAR
          </p>
          <p className="text-2xl font-bold text-green-600">
            المتبقي: {reportData.overall.totalAmounts.remaining.toFixed(2)} SAR
          </p>
        </div>

        {/* Individual Totals */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-5 shadow-sm flex flex-col items-center justify-center text-center">
          <h3 className="text-lg font-semibold text-purple-800 mb-2">ملخص الأقسام</h3>
          <p className="text-2xl font-bold text-purple-600">
            طباعة: {reportData.printJobs.total} طلب
          </p>
          <p className="text-2xl font-bold text-purple-600">
            تصوير: {reportData.photoSessions.total} جلسة
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overall Status Bar Chart */}
        <div className="bg-white p-5 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">توزيع الحالات العامة</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportData.overall.statusChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="value" name="عدد الطلبات/الجلسات" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Overall Amounts Pie Chart */}
        <div className="bg-white p-5 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">توزيع المبالغ الإجمالية</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={reportData.overall.amountChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {reportData.overall.amountChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip label="المبالغ" />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );

  const renderPrintJobsReport = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Total Print Jobs Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 shadow-sm flex flex-col items-center justify-center text-center">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">إجمالي طلبات الطباعة</h3>
          <p className="text-4xl font-extrabold text-blue-600">{reportData.printJobs.total}</p>
        </div>

        {/* Print Jobs Total Amounts Card */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-5 shadow-sm flex flex-col items-center justify-center text-center">
          <h3 className="text-lg font-semibold text-green-800 mb-2">إجمالي مبالغ الطباعة</h3>
          <p className="text-2xl font-bold text-green-600">
            الكلي: {reportData.printJobs.totalAmounts.total.toFixed(2)} SAR
          </p>
          <p className="text-2xl font-bold text-green-600">
            المدفوع: {reportData.printJobs.totalAmounts.paid.toFixed(2)} SAR
          </p>
          <p className="text-2xl font-bold text-green-600">
            المتبقي: {reportData.printJobs.totalAmounts.remaining.toFixed(2)} SAR
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Print Jobs Status Bar Chart */}
        <div className="bg-white p-5 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">توزيع حالات طلبات الطباعة</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportData.printJobs.statusChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="value" name="عدد الطلبات" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Print Jobs Amounts Pie Chart */}
        <div className="bg-white p-5 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">توزيع مبالغ الطباعة</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={reportData.printJobs.amountChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {reportData.printJobs.amountChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip label="المبالغ" />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );

  const renderPhotoSessionsReport = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Total Photo Sessions Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 shadow-sm flex flex-col items-center justify-center text-center">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">إجمالي جلسات التصوير</h3>
          <p className="text-4xl font-extrabold text-blue-600">{reportData.photoSessions.total}</p>
        </div>

        {/* Photo Sessions Total Amounts Card */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-5 shadow-sm flex flex-col items-center justify-center text-center">
          <h3 className="text-lg font-semibold text-green-800 mb-2">إجمالي مبالغ التصوير</h3>
          <p className="text-2xl font-bold text-green-600">
            الكلي: {reportData.photoSessions.totalAmounts.total.toFixed(2)} SAR
          </p>
          <p className="text-2xl font-bold text-green-600">
            المدفوع: {reportData.photoSessions.totalAmounts.paid.toFixed(2)} SAR
          </p>
          <p className="text-2xl font-bold text-green-600">
            المتبقي: {reportData.photoSessions.totalAmounts.remaining.toFixed(2)} SAR
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Photo Sessions Status Bar Chart */}
        <div className="bg-white p-5 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">توزيع حالات جلسات التصوير</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportData.photoSessions.statusChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="value" name="عدد الجلسات" fill="#ffc658" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Photo Sessions Editing Status Bar Chart */}
        <div className="bg-white p-5 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">توزيع حالات التعديل</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportData.photoSessions.editingStatusChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="value" name="عدد الجلسات" fill="#ff7300" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Photo Sessions Amounts Pie Chart */}
      <div className="bg-white p-5 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">توزيع مبالغ التصوير</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={reportData.photoSessions.amountChartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {reportData.photoSessions.amountChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip label="المبالغ" />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </>
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-6xl mx-auto my-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">التقارير والإحصائيات</h2>

      {/* Tabs for different reports */}
      <div className="flex justify-center mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveReportTab('overall')}
          className={`py-2 px-4 text-center font-medium text-lg rounded-t-lg transition-colors duration-200
            ${activeReportTab === 'overall' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'}
          `}
        >
          نظرة عامة
        </button>
        <button
          onClick={() => setActiveReportTab('print_jobs')}
          className={`py-2 px-4 text-center font-medium text-lg rounded-t-lg transition-colors duration-200
            ${activeReportTab === 'print_jobs' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'}
          `}
        >
          طلبات الطباعة
        </button>
        <button
          onClick={() => setActiveReportTab('photo_sessions')}
          className={`py-2 px-4 text-center font-medium text-lg rounded-t-lg transition-colors duration-200
            ${activeReportTab === 'photo_sessions' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'}
          `}
        >
          جلسات التصوير
        </button>
      </div>

      {/* Render content based on active tab */}
      {activeReportTab === 'overall' && renderOverallReport()}
      {activeReportTab === 'print_jobs' && renderPrintJobsReport()}
      {activeReportTab === 'photo_sessions' && renderPhotoSessionsReport()}
    </div>
  );
}

export default Reports;
