# Studio Management System

## English

### Project Overview
This project is a comprehensive Studio Management System designed to streamline operations for photography and printing services. It features a robust backend API built with Django REST Framework and a dynamic frontend user interface developed using React. The system facilitates client management, print job tracking, photo session scheduling, payment processing, and provides reporting capabilities.

### Key Features
*   **Client Management:** Add, view, edit, and delete client information.
*   **Print Job Management:** Track print orders from scheduling to delivery, including financial status.
*   **Photo Session Management:** Schedule and manage photography sessions, packages, and photographers.
*   **Payment Tracking:** Record and manage payments for both print jobs and photo sessions.
*   **User and Role Management:** Secure authentication and authorization with distinct roles (e.g., Manager, Receptionist).
*   **Reporting & Statistics:** Overview of business performance, job statuses, and financial summaries.
*   **Alerts & Notifications:** System-generated alerts for new jobs and status changes.

### Technologies Used
*   **Backend:** Python, Django, Django REST Framework, SQLite (development), WeasyPrint (PDF generation)
*   **Frontend:** JavaScript, React.js, Tailwind CSS, Recharts (for charting)
*   **Database:** SQLite (development)
*   **Authentication:** Django REST Framework Token Authentication

### Setup and Installation

To set up the project locally, you need to clone the repository and then set up both the backend and frontend components.

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd derpyfull
    ```

2.  **Backend Setup:** Refer to `stapi/README.md` for detailed instructions.
3.  **Frontend Setup:** Refer to `apps/README.md` for detailed instructions.

### Running the Application

After setting up both the backend and frontend, you can run the application:

1.  **Start Backend Server:**
    ```bash
    cd stapi
    python manage.py runserver
    ```
2.  **Start Frontend Development Server:**
    ```bash
    cd apps
    npm start
    ```

The application should then be accessible in your web browser, typically at `http://localhost:3000`.

### Project Structure
*   `apps/`: Contains the React frontend application.
*   `stapi/`: Contains the Django REST Framework backend API.

---

## العربية

### نظرة عامة على المشروع
هذا المشروع هو نظام شامل لإدارة الاستوديو مصمم لتبسيط العمليات لخدمات التصوير والطباعة. يتميز بواجهة برمجة تطبيقات (API) قوية مبنية باستخدام Django REST Framework وواجهة مستخدم ديناميكية تم تطويرها باستخدام React. يسهل النظام إدارة العملاء، تتبع طلبات الطباعة، جدولة جلسات التصوير، معالجة المدفوعات، ويوفر إمكانيات إعداد التقارير.

### الميزات الرئيسية
*   **إدارة العملاء:** إضافة، عرض، تعديل، وحذف معلومات العملاء.
*   **إدارة طلبات الطباعة:** تتبع طلبات الطباعة من الجدولة إلى التسليم، بما في ذلك الحالة المالية.
*   **إدارة جلسات التصوير:** جدولة وإدارة جلسات التصوير، الباقات، والمصورين.
*   **تتبع المدفوعات:** تسجيل وإدارة المدفوعات لكل من طلبات الطباعة وجلسات التصوير.
*   **إدارة المستخدمين والأدوار:** مصادقة وتفويض آمنان بأدوار مميزة (مثل المدير، موظف الاستقبال).
*   **التقارير والإحصائيات:** نظرة عامة على أداء العمل، حالات الطلبات، وملخصات مالية.
*   **التنبيهات والإشعارات:** تنبيهات يتم إنشاؤها بواسطة النظام للطلبات الجديدة وتغييرات الحالة.

### التقنيات المستخدمة
*   **الواجهة الخلفية (Backend):** بايثون، جانغو، جانغو ريست فريم وورك، SQLite (للتطوير)، WeasyPrint (لتوليد ملفات PDF)
*   **الواجهة الأمامية (Frontend):** جافاسكريبت، React.js، Tailwind CSS، Recharts (للرسم البياني)
*   **قاعدة البيانات:** SQLite (للتطوير)
*   **المصادقة:** مصادقة التوكن في Django REST Framework

### الإعداد والتثبيت

لإعداد المشروع محليًا، تحتاج إلى استنساخ المستودع ثم إعداد مكونات الواجهة الخلفية والأمامية.

1.  **استنساخ المستودع:**
    ```bash
    git clone <repository_url>
    cd derpyfull
    ```

2.  **إعداد الواجهة الخلفية:** ارجع إلى `stapi/README.md` للحصول على تعليمات مفصلة.
3.  **إعداد الواجهة الأمامية:** ارجع إلى `apps/README.md` للحصول على تعليمات مفصلة.

### تشغيل التطبيق

بعد إعداد كل من الواجهة الخلفية والأمامية، يمكنك تشغيل التطبيق:

1.  **تشغيل خادم الواجهة الخلفية:**
    ```bash
    cd stapi
    python manage.py runserver
    ```
2.  **تشغيل خادم تطوير الواجهة الأمامية:**
    ```bash
    cd apps
    npm start
    ```

يجب أن يكون التطبيق متاحًا بعد ذلك في متصفح الويب الخاص بك، عادةً على `http://localhost:3000`.

### هيكل المشروع
*   `apps/`: يحتوي على تطبيق React للواجهة الأمامية.
*   `stapi/`: يحتوي على واجهة برمجة تطبيقات (API) الواجهة الخلفية المبنية بـ Django REST Framework.
