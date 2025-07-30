# Frontend Application (React)

## English

### Overview
This directory contains the React-based frontend application for the Studio Management System. It provides the user interface for interacting with the backend API, allowing users to manage clients, print jobs, photo sessions, payments, and view reports.

### Key Features
*   User-friendly interface for all system functionalities.
*   Dynamic data display and real-time updates.
*   Role-based access control for UI elements (e.g., Reports, Management sections).
*   Toast notifications for user feedback.

### Technologies Used
*   **Framework:** React.js
*   **Styling:** Tailwind CSS
*   **Charting:** Recharts
*   **State Management:** React Context API (for Auth and Toast)
*   **API Communication:** Fetch API

### Setup and Installation

To get the frontend application running, follow these steps:

1.  **Navigate to the `apps` directory:**
    ```bash
    cd apps
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure API Base URL:**
    Create a `.env` file in the `apps/` directory (if it doesn't exist) and add your backend API URL. Replace `http://localhost:8000` with the actual address of your Django backend.
    ```
    REACT_APP_API_BASE_URL=http://localhost:8000/api
    ```

### Running the Application

After installation and configuration, you can start the development server:

```bash
npm start
```

The application will typically open in your browser at `http://localhost:3000`.

### Project Structure
*   `public/`: Static assets like `index.html`, `favicon.ico`.
*   `src/`: Contains the main React source code.
    *   `components/`: Reusable UI components (e.g., `ClientList.js`, `Reports.js`, `Login.js`).
    *   `contexts/`: React Contexts for global state management (e.g., `AuthContext.js`, `ToastContext.js`).
    *   `services/`: API service calls (e.g., `apiService.js`).
    *   `App.js`: Main application component and routing.
    *   `index.js`: Entry point of the React application.
    *   `index.css`, `App.css`: Global and app-specific styles.

### Contribution

When contributing to the frontend, please adhere to the existing coding style and component structure. Ensure all new features are tested and do not introduce regressions.

---

## العربية

### نظرة عامة
يحتوي هذا الدليل على تطبيق الواجهة الأمامية المبني باستخدام React لنظام إدارة الاستوديو. يوفر واجهة المستخدم للتفاعل مع واجهة برمجة التطبيقات (API) الخلفية، مما يسمح للمستخدمين بإدارة العملاء، طلبات الطباعة، جلسات التصوير، المدفوعات، وعرض التقارير.

### الميزات الرئيسية
*   واجهة سهلة الاستخدام لجميع وظائف النظام.
*   عرض ديناميكي للبيانات وتحديثات في الوقت الفعلي.
*   التحكم في الوصول المستند إلى الأدوار لعناصر واجهة المستخدم (مثل أقسام التقارير والإدارة).
*   إشعارات Toast لتقديم ملاحظات للمستخدم.

### التقنيات المستخدمة
*   **الإطار:** React.js
*   **التصميم:** Tailwind CSS
*   **الرسوم البيانية:** Recharts
*   **إدارة الحالة:** React Context API (للمصادقة والإشعارات)
*   **التواصل مع API:** Fetch API

### الإعداد والتثبيت

لتشغيل تطبيق الواجهة الأمامية، اتبع هذه الخطوات:

1.  **انتقل إلى دليل `apps`:**
    ```bash
    cd apps
    ```

2.  **تثبيت التبعيات:**
    ```bash
    npm install
    ```

3.  **تكوين عنوان URL الأساسي لـ API:**
    أنشئ ملف `.env` في دليل `apps/` (إذا لم يكن موجودًا) وأضف عنوان URL الخاص بواجهة برمجة التطبيقات الخلفية. استبدل `http://localhost:8000` بالعنوان الفعلي لخادم Django الخلفي الخاص بك.
    ```
    REACT_APP_API_BASE_URL=http://localhost:8000/api
    ```

### تشغيل التطبيق

بعد التثبيت والتكوين، يمكنك بدء خادم التطوير:

```bash
npm start
```

سيتم فتح التطبيق عادةً في متصفح الويب الخاص بك على `http://localhost:3000`.

### هيكل المشروع
*   `public/`: الأصول الثابتة مثل `index.html`، `favicon.ico`.
*   `src/`: يحتوي على الكود المصدري الرئيسي لـ React.
    *   `components/`: مكونات واجهة المستخدم القابلة لإعادة الاستخدام (مثل `ClientList.js`، `Reports.js`، `Login.js`).
    *   `contexts/`: سياقات React لإدارة الحالة العامة (مثل `AuthContext.js`، `ToastContext.js`).
    *   `services/`: استدعاءات خدمة API (مثل `apiService.js`).
    *   `App.js`: المكون الرئيسي للتطبيق والتوجيه.
    *   `index.js`: نقطة دخول تطبيق React.
    *   `index.css`، `App.css`: الأنماط العامة والخاصة بالتطبيق.

### المساهمة

عند المساهمة في الواجهة الأمامية، يرجى الالتزام بأسلوب الترميز وهيكل المكونات الحالي. تأكد من اختبار جميع الميزات الجديدة وعدم إدخال أي تراجعات.