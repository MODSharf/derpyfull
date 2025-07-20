    // src/services/apiService.js

    // عنوان الـ API الأساسي الخاص بك (تأكد من أنه يشير إلى خادم Django الخاص بك)
    export const API_BASE_URL = 'http://127.0.0.1:8000/api';

    // ===========================================================================
    // وظائف المصادقة (Authentication)
    // ===========================================================================

    export const login = async (username, password) => {
      const response = await fetch(`${API_BASE_URL}/token-auth/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.non_field_errors || 'فشل تسجيل الدخول');
      }
      const data = await response.json();
      return data; // Return full data including token, user_id, username, role
    };

    export const logout = async (authToken) => {
      const response = await fetch(`${API_BASE_URL}/logout/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${authToken}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'فشل تسجيل الخروج');
      }
      return true;
    };

    // تم تحديث هذا المسار لاستدعاء CurrentUserView المنفصلة
    export const getCurrentUser = async (authToken) => {
      const response = await fetch(`${API_BASE_URL}/current-user/`, { // تم تغيير المسار هنا
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${authToken}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'فشل جلب بيانات المستخدم الحالي');
      }
      return await response.json();
    };

    // ===========================================================================
    // وظائف إدارة المستخدمين (User Management Functions) - NEW
    // ===========================================================================

    /**
     * جلب جميع المستخدمين.
     * يتطلب صلاحيات المدير.
     * @param {string} authToken - توكن المصادقة.
     * @returns {Promise<Array>} - مصفوفة من كائنات المستخدمين.
     */
    export const getUsers = async (authToken) => {
      const response = await fetch(`${API_BASE_URL}/users/`, {
        headers: {
          'Authorization': `Token ${authToken}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'فشل جلب المستخدمين');
      }
      const data = await response.json();
      return data.results || data; // التعامل مع الاستجابات المرقّمة وغير المرقّمة
    };

    /**
     * جلب مستخدم محدد بواسطة ID.
     * يتطلب صلاحيات المدير.
     * @param {string} authToken - توكن المصادقة.
     * @param {number} id - معرف المستخدم.
     * @returns {Promise<Object>} - كائن المستخدم.
     */
    export const getUserById = async (authToken, id) => {
      const response = await fetch(`${API_BASE_URL}/users/${id}/`, {
        headers: {
          'Authorization': `Token ${authToken}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'فشل جلب المستخدم');
      }
      return await response.json();
    };

    /**
     * إنشاء مستخدم جديد.
     * يتطلب صلاحيات المدير.
     * @param {string} authToken - توكن المصادقة.
     * @param {Object} userData - بيانات المستخدم الجديد (username, password, email, first_name, last_name, role).
     * @returns {Promise<Object>} - كائن المستخدم الذي تم إنشاؤه.
     */
    export const createUser = async (authToken, userData) => {
      const response = await fetch(`${API_BASE_URL}/users/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${authToken}`,
        },
        body: JSON.stringify(userData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || JSON.stringify(errorData));
      }
      return await response.json();
    };

    /**
     * تحديث مستخدم موجود.
     * يتطلب صلاحيات المدير.
     * @param {string} authToken - توكن المصادقة.
     * @param {number} id - معرف المستخدم.
     * @param {Object} userData - البيانات المحدثة للمستخدم.
     * @returns {Promise<Object>} - كائن المستخدم المحدث.
     */
    export const updateUser = async (authToken, id, userData) => {
      const response = await fetch(`${API_BASE_URL}/users/${id}/`, {
        method: 'PATCH', // استخدام PATCH للتحديث الجزئي
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${authToken}`,
        },
        body: JSON.stringify(userData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || JSON.stringify(errorData));
      }
      return await response.json();
    };

    /**
     * حذف مستخدم.
     * يتطلب صلاحيات المدير.
     * @param {string} authToken - توكن المصادقة.
     * @param {number} id - معرف المستخدم.
     * @returns {Promise<boolean>} - True إذا تم الحذف بنجاح.
     */
    export const deleteUser = async (authToken, id) => {
      const response = await fetch(`${API_BASE_URL}/users/${id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${authToken}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'فشل حذف المستخدم');
      }
      return true;
    };

    // ===========================================================================
    // وظائف العملاء (Clients)
    // ===========================================================================

    export const getClients = async (authToken, searchTerm = '') => {
      const query = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : '';
      const response = await fetch(`${API_BASE_URL}/clients/${query}`, {
        headers: {
          'Authorization': `Token ${authToken}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'فشل جلب العملاء');
      }
      const data = await response.json();
      return data.results || [];
    };

    export const getClientById = async (authToken, id) => {
      const response = await fetch(`${API_BASE_URL}/clients/${id}/`, {
        headers: {
          'Authorization': `Token ${authToken}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'فشل جلب تفاصيل العميل');
      }
      return await response.json();
    };

    export const createClient = async (authToken, clientData) => {
      const response = await fetch(`${API_BASE_URL}/clients/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${authToken}`,
        },
        body: JSON.stringify(clientData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || JSON.stringify(errorData));
      }
      return await response.json();
    };

    export const updateClient = async (authToken, id, clientData) => {
      const response = await fetch(`${API_BASE_URL}/clients/${id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${authToken}`,
        },
        body: JSON.stringify(clientData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || JSON.stringify(errorData));
      }
      return await response.json();
    };

    export const deleteClient = async (authToken, id) => {
      const response = await fetch(`${API_BASE_URL}/clients/${id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${authToken}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'فشل حذف العميل');
      }
      return true;
    };

    /**
     * جلب جميع طلبات الطباعة لعميل محدد.
     * @param {string} authToken - توكن المصادقة.
     * @param {number} clientId - معرف العميل.
     * @returns {Promise<Array>} - مصفوفة من طلبات الطباعة.
     */
    export const getClientPrintJobs = async (authToken, clientId) => {
      const response = await fetch(`${API_BASE_URL}/clients/${clientId}/printjobs/`, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${authToken}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'فشل جلب طلبات الطباعة للعميل');
      }
      return await response.json();
    };

    /**
     * جلب جميع إيصالات الدفع لعميل محدد.
     * @param {string} authToken - توكن المصادقة.
     * @param {number} clientId - معرف العميل.
     * @returns {Promise<Array>} - مصفوفة من إيصالات الدفع.
     */
    export const getClientPaymentReceipts = async (authToken, clientId) => {
      const response = await fetch(`${API_BASE_URL}/clients/${clientId}/receipts/`, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${authToken}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'فشل جلب إيصالات الدفع للعميل');
      }
      return await response.json();
    };

    /**
     * جلب جميع جلسات التصوير لعميل محدد.
     * @param {string} authToken - توكن المصادقة.
     * @param {number} clientId - معرف العميل.
     * @returns {Promise<Array>} - مصفوفة من جلسات التصوير.
     */
    export const getClientPhotoSessions = async (authToken, clientId) => {
      const response = await fetch(`${API_BASE_URL}/clients/${clientId}/photosessions/`, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${authToken}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'فشل جلب جلسات التصوير للعميل');
      }
      return await response.json();
    };

    /**
     * جلب إجمالي المبلغ المتبقي على جميع طلبات الطباعة وجلسات التصوير لعميل محدد.
     * @param {string} authToken - توكن المصادقة.
     * @param {number} clientId - معرف العميل.
     * @returns {Promise<Object>} - كائن يحتوي على total_remaining_amount.
     */
    export const getClientTotalRemainingAmountCombined = async (authToken, clientId) => {
      const response = await fetch(`${API_BASE_URL}/clients/${clientId}/total-remaining-amount-combined/`, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${authToken}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'فشل جلب إجمالي المبلغ المتبقي للعميل');
      }
      return await response.json();
    };


    // ===========================================================================
    // وظائف طلبات الطباعة (Print Jobs)
    // ===========================================================================

    export const getPrintJobs = async (authToken, searchTerm = '') => {
      const query = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : '';
      const response = await fetch(`${API_BASE_URL}/printjobs/${query}`, {
        headers: {
          'Authorization': `Token ${authToken}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'فشل جلب طلبات الطباعة');
      }
      const data = await response.json();
      return data.results || [];
    };

    export const getPrintJobById = async (authToken, id) => {
      const response = await fetch(`${API_BASE_URL}/printjobs/${id}/`, {
        headers: {
          'Authorization': `Token ${authToken}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'فشل جلب تفاصيل طلب الطباعة');
      }
      return await response.json();
    };

    export const createPrintJob = async (authToken, printJobData) => {
      const response = await fetch(`${API_BASE_URL}/printjobs/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${authToken}`,
        },
        body: JSON.stringify(printJobData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || JSON.stringify(errorData));
      }
      return await response.json();
    };

    export const updatePrintJob = async (authToken, id, printJobData) => {
      const response = await fetch(`${API_BASE_URL}/printjobs/${id}/`, {
        method: 'PATCH', // Use PATCH for partial updates
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${authToken}`,
        },
        body: JSON.stringify(printJobData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || JSON.stringify(errorData));
      }
      return await response.json();
    };

    export const deletePrintJob = async (authToken, id) => {
      const response = await fetch(`${API_BASE_URL}/printjobs/${id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${authToken}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'فشل حذف طلب الطباعة');
      }
      return true;
    };

    /**
     * جلب قائمة إيصالات الدفع لطلب طباعة معين.
     * @param {string} authToken - توكن المصادقة.
     * @param {number} printJobId - معرف طلب الطباعة.
     * @returns {Promise<Array>} - مصفوفة من إيصالات الدفع.
     */
    export const getPrintJobPaymentReceipts = async (authToken, printJobId) => {
      const response = await fetch(`${API_BASE_URL}/printjobs/${printJobId}/payment-receipts/`, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${authToken}`,
        },
      });

      if (!response.ok) {
        let errorText = 'خطأ من الخادم.';
        try {
          const errorJson = await response.json();
          errorText = errorJson.detail || JSON.stringify(errorJson);
        } catch (e) {
          errorText = await response.text();
        }
        console.error('API Error Response (Get Print Job Receipts):', errorText);
        throw new Error(`فشل جلب إيصالات الدفع للطلب: ${errorText}`);
      }
      const data = await response.json();
      return data; // هذا endpoint يعيد قائمة مباشرة
    };


    /**
     * توليد وتنزيل إيصال PDF لدفعة محددة (إيصال فردي).
     * @param {string} authToken - توكن المصادقة.
     * @param {number} receiptId - معرف إيصال الدفع.
     * @returns {Promise<boolean>} - True إذا تم التنزيل بنجاح.
     */
    export const downloadPaymentReceiptPdf = async (authToken, receiptId) => {
      const response = await fetch(`${API_BASE_URL}/receipts/${receiptId}/generate-pdf-receipt/`, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${authToken}`,
        },
      });

      if (!response.ok) {
        let errorText = 'خطأ من الخادم.';
        try {
          const errorJson = await response.json();
          errorText = errorJson.detail || JSON.stringify(errorJson);
        } catch (e) {
          errorText = await response.text();
        }
        console.error('API Error Response (Payment Receipt PDF):', errorText);
        throw new Error(`فشل إنشاء إيصال الدفعة: ${errorText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payment_receipt_${receiptId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      return true;
    };

    /**
     * توليد وتنزيل فاتورة نهائية PDF لطلب طباعة معين.
     * @param {string} authToken - توكن المصادقة.
     * @param {number} printJobId - معرف طلب الطباعة.
     * @returns {Promise<boolean>} - True إذا تم التنزيل بنجاح.
     */
    export const generatePrintInvoicePdf = async (authToken, printJobId) => {
      const response = await fetch(`${API_BASE_URL}/printjobs/${printJobId}/generate-final-invoice/`, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${authToken}`,
        },
      });

      if (!response.ok) {
        let errorText = 'خطأ من الخادم.';
        try {
          const errorJson = await response.json();
          errorText = errorJson.detail || JSON.stringify(errorJson);
        } catch (e) {
          errorText = await response.text();
        }
        console.error('API Error Response (Final Invoice PDF):', errorText);
        throw new Error(`فشل إنشاء الفاتورة النهائية: ${errorText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Try to get filename from Content-Disposition header, otherwise use a default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `final_invoice_printjob_${printJobId}.pdf`; // Default filename
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch.length > 1) {
          filename = filenameMatch[1];
        }
      }
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      return true;
    };


    // ===========================================================================
    // وظائف إيصالات الدفع (Payment Receipts)
    // (هذه الوظائف يمكن استخدامها لإدارة إيصالات الدفع بشكل مستقل إذا لزم الأمر،
    // ولكن في سياق هذا السيناريو، نعتمد أكثر على getPrintJobPaymentReceipts
    // و addPaymentToPrintJob)
    // ===========================================================================

    export const getPaymentReceipts = async (authToken, searchTerm = '') => {
      const query = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : '';
      const response = await fetch(`${API_BASE_URL}/paymentreceipts/${query}`, {
        headers: {
          'Authorization': `Token ${authToken}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'فشل جلب إيصالات الدفع');
      }
      const data = await response.json();
      return data.results || [];
    };

    export const getPaymentReceiptById = async (authToken, id) => {
      const response = await fetch(`${API_BASE_URL}/paymentreceipts/${id}/`, {
        headers: {
          'Authorization': `Token ${authToken}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'فشل جلب تفاصيل إيصال الدفع');
      }
      return await response.json();
    };

    export const createPaymentReceipt = async (authToken, receiptData) => {
      const response = await fetch(`${API_BASE_URL}/paymentreceipts/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${authToken}`,
        },
        body: JSON.stringify(receiptData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || JSON.stringify(errorData));
      }
      return await response.json();
    };

    export const updatePaymentReceipt = async (authToken, id, receiptData) => {
      const response = await fetch(`${API_BASE_URL}/paymentreceipts/${id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${authToken}`,
        },
        body: JSON.stringify(receiptData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || JSON.stringify(errorData));
      }
      return await response.json();
    };

    export const deletePaymentReceipt = async (authToken, id) => {
      const response = await fetch(`${API_BASE_URL}/paymentreceipts/${id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${authToken}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'فشل حذف إيصال الدفع');
      }
      return true;
    };

    // وظيفة جديدة لإضافة دفعة لطلب الطباعة
    export const addPaymentToPrintJob = async (authToken, printJobId, paymentData) => {
      try {
        const response = await fetch(`${API_BASE_URL}/printjobs/${printJobId}/add-payment/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${authToken}`,
          },
          body: JSON.stringify(paymentData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || JSON.stringify(errorData));
        }
        return await response.json();
      } catch (error) {
        console.error('Error adding payment to print job:', error);
        throw error;
      }
    };

    // ===========================================================================
    // وظائف قسم التصوير (Photography Section Functions)
    // ===========================================================================

    /**
     * جلب جميع باقات التصوير.
     * @param {string} authToken - توكن المصادقة.
     * @returns {Promise<Array>} - مصفوفة من باقات التصوير.
     */
    export const getPhotographyPackages = async (authToken) => {
      const response = await fetch(`${API_BASE_URL}/photographypackages/`, {
        headers: {
          'Authorization': `Token ${authToken}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'فشل جلب باقات التصوير');
      }
      const data = await response.json();
      // تحسين: التعامل مع الاستجابات المرقّمة وغير المرقّمة
      return data.results || data;
    };

    /**
     * جلب باقة تصوير محددة بواسطة ID.
     * @param {string} authToken - توكن المصادقة.
     * @param {number} id - معرف باقة التصوير.
     * @returns {Promise<Object>} - كائن باقة التصوير.
     */
    export const getPhotographyPackageById = async (authToken, id) => {
      const response = await fetch(`${API_BASE_URL}/photographypackages/${id}/`, {
        headers: {
          'Authorization': `Token ${authToken}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'فشل جلب باقة التصوير');
      }
      return await response.json();
    };

    /**
     * إنشاء باقة تصوير جديدة.
     * @param {string} authToken - توكن المصادقة.
     * @param {Object} packageData - بيانات الباقة الجديدة.
     * @returns {Promise<Object>} - كائن الباقة التي تم إنشاؤها.
     */
    export const createPhotographyPackage = async (authToken, packageData) => {
      const response = await fetch(`${API_BASE_URL}/photographypackages/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${authToken}`,
        },
        body: JSON.stringify(packageData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || JSON.stringify(errorData));
      }
      return await response.json();
    };

    /**
     * تحديث باقة تصوير موجودة.
     * @param {string} authToken - توكن المصادقة.
     * @param {number} id - معرف باقة التصوير.
     * @param {Object} packageData - البيانات المحدثة للباقة.
     * @returns {Promise<Object>} - كائن الباقة المحدثة.
     */
    export const updatePhotographyPackage = async (authToken, id, packageData) => {
      const response = await fetch(`${API_BASE_URL}/photographypackages/${id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${authToken}`,
        },
        body: JSON.stringify(packageData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || JSON.stringify(errorData));
      }
      return await response.json();
    };

    /**
     * حذف باقة تصوير.
     * @param {string} authToken - توكن المصادقة.
     * @param {number} id - معرف باقة التصوير.
     * @returns {Promise<boolean>} - True إذا تم الحذف بنجاح.
     */
    export const deletePhotographyPackage = async (authToken, id) => {
      const response = await fetch(`${API_BASE_URL}/photographypackages/${id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${authToken}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'فشل حذف باقة التصوير');
      }
      return true;
    };

    /**
     * جلب جميع المصورين.
     * @param {string} authToken - توكن المصادقة.
     * @returns {Promise<Array>} - مصفوفة من المصورين.
     */
    export const getPhotographers = async (authToken) => {
      const response = await fetch(`${API_BASE_URL}/photographers/`, {
        headers: {
          'Authorization': `Token ${authToken}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'فشل جلب المصورين');
      }
      const data = await response.json();
      // تحسين: التعامل مع الاستجابات المرقّمة وغير المرقّمة
      return data.results || data;
    };

    /**
     * جلب مصور محدد بواسطة ID.
     * @param {string} authToken - توكن المصادقة.
     * @param {number} id - معرف المصور.
     * @returns {Promise<Object>} - كائن المصور.
     */
    export const getPhotographerById = async (authToken, id) => {
      const response = await fetch(`${API_BASE_URL}/photographers/${id}/`, {
        headers: {
          'Authorization': `Token ${authToken}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'فشل جلب المصور');
      }
      return await response.json();
    };

    /**
     * إنشاء مصور جديد.
     * @param {string} authToken - توكن المصادقة.
     * @param {Object} photographerData - بيانات المصور الجديد.
     * @returns {Promise<Object>} - كائن المصور الذي تم إنشاؤه.
     */
    export const createPhotographer = async (authToken, photographerData) => {
      const response = await fetch(`${API_BASE_URL}/photographers/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${authToken}`,
        },
        body: JSON.stringify(photographerData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || JSON.stringify(errorData));
      }
      return await response.json();
    };

    /**
     * تحديث مصور موجود.
     * @param {string} authToken - توكن المصادقة.
     * @param {number} id - معرف المصور.
     * @param {Object} photographerData - البيانات المحدثة للمصور.
     * @returns {Promise<Object>} - كائن المصور المحدث.
     */
    export const updatePhotographer = async (authToken, id, photographerData) => {
      const response = await fetch(`${API_BASE_URL}/photographers/${id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${authToken}`,
        },
        body: JSON.stringify(photographerData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || JSON.stringify(errorData));
      }
      return await response.json();
    };

    /**
     * حذف مصور.
     * @param {string} authToken - توكن المصادقة.
     * @param {number} id - معرف المصور.
     * @returns {Promise<boolean>} - True إذا تم الحذف بنجاح.
     */
    export const deletePhotographer = async (authToken, id) => {
      const response = await fetch(`${API_BASE_URL}/photographers/${id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${authToken}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'فشل حذف المصور');
      }
      return true;
    };

    /**
     * جلب جميع جلسات التصوير.
     * @param {string} authToken - توكن المصادقة.
     * @param {string} searchTerm - مصطلح البحث (اختياري).
     * @returns {Promise<Array>} - مصفوفة من جلسات التصوير.
     */
    export const getPhotoSessions = async (authToken, searchTerm = '') => {
      const query = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : '';
      const response = await fetch(`${API_BASE_URL}/photosessions/${query}`, {
        headers: {
          'Authorization': `Token ${authToken}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'فشل جلب جلسات التصوير');
      }
      const data = await response.json();
      return data.results || []; // Assuming paginated results
    };

    /**
     * جلب جلسة تصوير محددة بواسطة ID.
     * @param {string} authToken - توكن المصادقة.
     * @param {number} id - معرف جلسة التصوير.
     * @returns {Promise<Object>} - كائن جلسة التصوير.
     */
    export const getPhotoSessionById = async (authToken, id) => {
      const response = await fetch(`${API_BASE_URL}/photosessions/${id}/`, {
        headers: {
          'Authorization': `Token ${authToken}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'فشل جلب جلسة التصوير');
      }
      return await response.json();
    };

    /**
     * إنشاء جلسة تصوير جديدة.
     * @param {string} authToken - توكن المصادقة.
     * @param {Object} sessionData - بيانات جلسة التصوير الجديدة.
     * @returns {Promise<Object>} - كائن الجلسة التي تم إنشاؤها.
     */
    export const createPhotoSession = async (authToken, sessionData) => {
      const response = await fetch(`${API_BASE_URL}/photosessions/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${authToken}`,
        },
        body: JSON.stringify(sessionData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || JSON.stringify(errorData));
      }
      return await response.json();
    };

    /**
     * تحديث جلسة تصوير موجودة.
     * @param {string} authToken - توكن المصادقة.
     * @param {number} id - معرف جلسة التصوير.
     * @param {Object} sessionData - البيانات المحدثة للجلسة.
     * @returns {Promise<Object>} - كائن الجلسة المحدثة.
     */
    export const updatePhotoSession = async (authToken, id, sessionData) => {
      const response = await fetch(`${API_BASE_URL}/photosessions/${id}/`, {
        method: 'PATCH', // Use PATCH for partial updates
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${authToken}`,
        },
        body: JSON.stringify(sessionData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || JSON.stringify(errorData));
      }
      return await response.json();
    };

    /**
     * حذف جلسة تصوير.
     * @param {string} authToken - توكن المصادقة.
     * @param {number} id - معرف جلسة التصوير.
     * @returns {Promise<boolean>} - True إذا تم الحذف بنجاح.
     */
    export const deletePhotoSession = async (authToken, id) => {
      const response = await fetch(`${API_BASE_URL}/photosessions/${id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${authToken}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'فشل حذف جلسة التصوير');
      }
      return true;
    };

    /**
     * إضافة دفعة لجلسة تصوير.
     * @param {string} authToken - توكن المصادقة.
     * @param {number} sessionId - معرف جلسة التصوير.
     * @param {Object} paymentData - بيانات الدفعة (amount, payment_method, notes).
     * @returns {Promise<Object>} - كائن إيصال الدفع الذي تم إنشاؤه.
     */
    export const addPaymentToPhotoSession = async (authToken, sessionId, paymentData) => {
      try {
        const response = await fetch(`${API_BASE_URL}/photosessions/${sessionId}/add-payment/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${authToken}`,
          },
          body: JSON.stringify(paymentData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || JSON.stringify(errorData));
        }
        return await response.json();
      } catch (error) {
        console.error('Error adding payment to photo session:', error);
        throw error;
      }
    };

    /**
     * جلب إيصالات الدفع لجلسة تصوير معينة.
     * @param {string} authToken - توكن المصادقة.
     * @param {number} sessionId - معرف جلسة التصوير.
     * @returns {Promise<Array>} - مصفوفة من إيصالات الدفع.
     */
    export const getPhotoSessionPaymentReceipts = async (authToken, sessionId) => {
      const response = await fetch(`${API_BASE_URL}/photosessions/${sessionId}/payment-receipts/`, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${authToken}`,
        },
      });

      if (!response.ok) {
        let errorText = 'خطأ من الخادم.';
        try {
          const errorJson = await response.json();
          errorText = errorJson.detail || JSON.stringify(errorJson);
        } catch (e) {
          errorText = await response.text();
        }
        console.error('API Error Response (Get Photo Session Receipts):', errorText);
        throw new Error(`فشل جلب إيصالات الدفع لجلسة التصوير: ${errorText}`);
      }
      const data = await response.json();
      return data;
    };

    /**
     * توليد وتنزيل إيصال حجز PDF لجلسة تصوير معينة (الإيصال الأصفر).
     * @param {string} authToken - توكن المصادقة.
     * @param {number} sessionId - معرف جلسة التصوير.
     * @returns {Promise<boolean>} - True إذا تم التنزيل بنجاح.
     */
    export const generatePhotoBookingReceiptPdf = async (authToken, sessionId) => {
      const response = await fetch(`${API_BASE_URL}/photosessions/${sessionId}/generate-booking-receipt/`, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${authToken}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `فشل تنزيل إيصال الحجز: ${response.status} ${response.statusText}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.detail || JSON.stringify(errorJson);
        } catch (e) {
          errorMessage = errorText;
        }
        console.error('API Error Response (Photo Booking Receipt PDF):', errorMessage);
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Try to get filename from Content-Disposition header, otherwise use a default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `booking_receipt_photosession_${sessionId}.pdf`; // Default filename
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch.length > 1) {
          filename = filenameMatch[1];
        }
      }
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      return true;
    };


    /**
     * توليد وتنزيل فاتورة نهائية PDF لجلسة تصوير معينة (الإيصال الأزرق).
     * @param {string} authToken - توكن المصادقة.
     * @param {number} sessionId - معرف جلسة التصوير.
     * @returns {Promise<boolean>} - True إذا تم التنزيل بنجاح.
     */
    export const generatePhotoInvoicePdf = async (authToken, sessionId) => {
      const response = await fetch(`${API_BASE_URL}/photosessions/${sessionId}/generate-final-invoice/`, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${authToken}`,
        },
      });

      if (!response.ok) {
        // Read error response as text if not OK
        const errorText = await response.text();
        let errorMessage = `فشل تنزيل الفاتورة: ${response.status} ${response.statusText}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.detail || JSON.stringify(errorJson);
        } catch (e) {
          errorMessage = errorText;
        }
        console.error('API Error Response (Photo Invoice PDF):', errorMessage);
        throw new Error(errorMessage);
      }

      // If response is OK, it's a PDF blob
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Try to get filename from Content-Disposition header, otherwise use a default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `final_invoice_photosession_${sessionId}.pdf`; // Default filename
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch.length > 1) {
          filename = filenameMatch[1];
        }
      }
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      return true;
    };
    