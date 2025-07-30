# Backend API (Django REST Framework)

## English

### Overview
This directory contains the Django REST Framework (DRF) backend API for the Studio Management System. It provides the data models, business logic, and API endpoints that the frontend application consumes. It handles authentication, authorization, data storage, and PDF generation for receipts and invoices.

### Key Features
*   **RESTful API:** Provides well-defined endpoints for all data operations.
*   **Authentication & Authorization:** Uses Token-based authentication and role-based authorization for secure access.
*   **Data Models:** Defines models for Clients, Print Jobs, Photo Sessions, Photographers, Photography Packages, Payment Receipts, Users, Profiles, and Roles.
*   **PDF Generation:** Generates printable receipts and invoices using WeasyPrint.
*   **Filtering & Search:** Supports filtering and searching on various API endpoints.

### Technologies Used
*   **Framework:** Django, Django REST Framework
*   **Database:** SQLite (for development; easily configurable for PostgreSQL/MySQL in production)
*   **Authentication:** Django REST Framework Token Authentication
*   **PDF Generation:** WeasyPrint
*   **Filtering:** Django Filter

### Setup and Installation

To get the backend API running, follow these steps:

1.  **Navigate to the `stapi` directory:**
    ```bash
    cd stapi
    ```

2.  **Create a virtual environment (recommended):**
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
    ```

3.  **Install dependencies:**
    ```bash
    pip install -r reqer.txt
    ```

4.  **Apply database migrations:**
    ```bash
    python manage.py migrate
    ```

5.  **Create a superuser (for Django Admin access):**
    ```bash
    python manage.py createsuperuser
    ```
    Follow the prompts to create an admin user.

### Running the Application

After installation and configuration, you can start the Django development server:

```bash
python manage.py runserver
```

The API will typically be accessible at `http://localhost:8000/api/`.

### Project Structure
*   `stapi/`: Main Django project settings.
    *   `settings.py`: Django project settings, including DRF configurations.
    *   `urls.py`: Main URL routing for the project.
*   `print/`: Django app containing core models, views, serializers, and migrations.
    *   `models.py`: Database models (Clients, Print Jobs, Photo Sessions, etc.).
    *   `api_views.py`: Django REST Framework ViewSets for API endpoints.
    *   `serializers.py`: Data serializers for converting models to JSON and vice-versa.
    *   `admin.py`: Django Admin configurations.
    *   `urls.py`: URL routing for the `print` app's API endpoints.
    *   `signals.py`: Django signals for specific events.
    *   `migrations/`: Database migration files.
    *   `templates/`: HTML templates for PDF generation.
    *   `static/`: Static files (e.g., fonts, images) used in PDF generation.
*   `db.sqlite3`: SQLite database file (for development).
*   `reqer.txt`: List of Python dependencies.

### Contribution

When contributing to the backend, please adhere to Django and DRF best practices. Ensure all new features are covered by tests and that migrations are properly generated and applied.

---

## العربية

### نظرة عامة
يحتوي هذا الدليل على واجهة برمجة التطبيقات (API) الخلفية المبنية باستخدام Django REST Framework لنظام إدارة الاستوديو. يوفر نماذج البيانات، منطق الأعمال، ونقاط نهاية API التي يستهلكها تطبيق الواجهة الأمامية. يتعامل مع المصادقة، التفويض، تخزين البيانات، وتوليد ملفات PDF للإيصالات والفواتير.

### الميزات الرئيسية
*   **واجهة برمجة تطبيقات RESTful:** توفر نقاط نهاية محددة جيدًا لجميع عمليات البيانات.
*   **المصادقة والتفويض:** تستخدم المصادقة المستندة إلى التوكن والتفويض المستند إلى الأدوار للوصول الآمن.
*   **نماذج البيانات:** تحدد نماذج للعملاء، طلبات الطباعة، جلسات التصوير، المصورين، باقات التصوير، إيصالات الدفع، المستخدمين، الملفات الشخصية، والأدوار.
*   **توليد ملفات PDF:** تولد إيصالات وفواتير قابلة للطباعة باستخدام WeasyPrint.
*   **التصفية والبحث:** تدعم التصفية والبحث في نقاط نهاية API المختلفة.

### التقنيات المستخدمة
*   **الإطار:** Django، Django REST Framework
*   **قاعدة البيانات:** SQLite (للتطوير؛ قابلة للتكوين بسهولة لـ PostgreSQL/MySQL في الإنتاج)
*   **المصادقة:** مصادقة التوكن في Django REST Framework
*   **توليد ملفات PDF:** WeasyPrint
*   **التصفية:** Django Filter

### الإعداد والتثبيت

لتشغيل واجهة برمجة التطبيقات الخلفية، اتبع هذه الخطوات:

1.  **انتقل إلى دليل `stapi`:**
    ```bash
    cd stapi
    ```

2.  **إنشاء بيئة افتراضية (موصى به):**
    ```bash
    python -m venv venv
    source venv/bin/activate  # على Windows، استخدم `venv\Scripts\activate`
    ```

3.  **تثبيت التبعيات:**
    ```bash
    pip install -r reqer.txt
    ```

4.  **تطبيق ترحيلات قاعدة البيانات:**
    ```bash
    python manage.py migrate
    ```

5.  **إنشاء مستخدم خارق (للوصول إلى لوحة إدارة Django):**
    ```bash
    python manage.py createsuperuser
    ```
    اتبع التعليمات لإنشاء مستخدم إداري.

### تشغيل التطبيق

بعد التثبيت والتكوين، يمكنك بدء خادم تطوير Django:

```bash
python manage.py runserver
```

ستكون واجهة برمجة التطبيقات متاحة عادةً على `http://localhost:8000/api/`.

### هيكل المشروع
*   `stapi/`: إعدادات مشروع Django الرئيسية.
    *   `settings.py`: إعدادات مشروع Django، بما في ذلك تكوينات DRF.
    *   `urls.py`: توجيه URL الرئيسي للمشروع.
*   `print/`: تطبيق Django يحتوي على النماذج الأساسية، طرق العرض، المحولات، والترحيلات.
    *   `models.py`: نماذج قاعدة البيانات (العملاء، طلبات الطباعة، جلسات التصوير، إلخ).
    *   `api_views.py`: ViewSets لـ Django REST Framework لنقاط نهاية API.
    *   `serializers.py`: محولات البيانات لتحويل النماذج إلى JSON والعكس.
    *   `admin.py`: تكوينات إدارة Django.
    *   `urls.py`: توجيه URL لنقاط نهاية API لتطبيق `print`.
    *   `signals.py`: إشارات Django لأحداث محددة.
    *   `migrations/`: ملفات ترحيل قاعدة البيانات.
    *   `templates/`: قوالب HTML لتوليد ملفات PDF.
    *   `static/`: ملفات ثابتة (مثل الخطوط، الصور) المستخدمة في توليد ملفات PDF.
*   `db.sqlite3`: ملف قاعدة بيانات SQLite (للتطوير).
*   `reqer.txt`: قائمة تبعيات بايثون.

### المساهمة

عند المساهمة في الواجهة الخلفية، يرجى الالتزام بأفضل ممارسات Django و DRF. تأكد من تغطية جميع الميزات الجديدة بالاختبارات وأن الترحيلات يتم إنشاؤها وتطبيقها بشكل صحيح.
