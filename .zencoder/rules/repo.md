---
description: Repository Information Overview
alwaysApply: true
---

# تقارير وتحليلات الموظفين Information

## Summary
تطبيق ويب لتحليل بيانات الموظفين وعرض تقارير وإحصائيات مختلفة. يدعم استيراد البيانات من ملفات CSV، JSON، وExcel، ويقوم بتحليلها وعرضها في جداول ورسوم بيانية تفاعلية.

## Structure
- **assets/**: المجلد الرئيسي للموارد
  - **css/**: ملفات التنسيق
  - **js/**: ملفات JavaScript
  - **data/**: ملفات البيانات النموذجية
- **html files**: ملفات HTML للصفحات المختلفة (index.html, charts.html, etc.)

## Language & Runtime
**Language**: JavaScript (Frontend)
**Framework**: Vanilla JavaScript
**Libraries**: 
- Chart.js (v4.4.1) - لإنشاء الرسوم البيانية
- PapaParse (v5.3.0) - لتحليل ملفات CSV
- SheetJS (v0.18.5) - لقراءة ملفات Excel

## Dependencies
**Main Dependencies**:
- Chart.js - مكتبة لإنشاء الرسوم البيانية
- PapaParse - مكتبة لتحليل ملفات CSV
- SheetJS (XLSX) - مكتبة لقراءة ملفات Excel

**External Resources**:
- CDN لتحميل المكتبات (Chart.js, PapaParse, SheetJS)

## Key Features
- **استيراد البيانات**: دعم لملفات CSV، JSON، وExcel (XLS/XLSX)
- **تحليل البيانات**: حساب إحصائيات وتجميع البيانات حسب معايير مختلفة
- **عرض الرسوم البيانية**: رسوم بيانية تفاعلية لتوضيح البيانات
- **تصفية وبحث**: إمكانية تصفية البيانات والبحث فيها
- **الهيكل التنظيمي**: عرض الهيكل التنظيمي للشركة بناءً على البيانات
- **واجهة مستخدم RTL**: دعم كامل للغة العربية واتجاه RTL

## Usage & Operations
التطبيق يعمل في المتصفح ويمكن تشغيله بفتح ملف `index.html` مباشرة أو عبر خادم ويب محلي.

**طريقة الاستخدام**:
1. فتح الصفحة الرئيسية (index.html)
2. استيراد ملف بيانات (CSV، JSON، أو Excel)
3. استعراض التقارير والرسوم البيانية المختلفة

**ملاحظة**: بعض الميزات مثل تحميل الملف الافتراضي تتطلب تشغيل التطبيق عبر خادم محلي مثل Live Server في VS Code.

## File Structure
**Main Files**:
- `index.html` - الصفحة الرئيسية للتطبيق
- `assets/js/app.js` - الكود الرئيسي للتطبيق
- `assets/css/styles.css` - أنماط CSS للتطبيق
- `assets/data/sample.csv` - ملف بيانات نموذجي

**HTML Pages**:
- `index.html` - الصفحة الرئيسية
- `charts.html` - صفحة الرسوم البيانية
- `by-dept.html`, `by-gender.html`, `by-nat.html` - صفحات التحليل حسب المعايير المختلفة
- `employees.html` - عرض بيانات الموظفين
- `org.html` - الهيكل التنظيمي

## Data Processing
**Data Format**:
يدعم التطبيق تنسيقات البيانات التالية:
- CSV (مع اكتشاف الفاصل تلقائياً)
- JSON
- Excel (XLS/XLSX)

**Expected Columns**:
- الاسم / name
- المسمى الوظيفي / jobTitle
- القسم / department
- الجنسية / nationality
- الجنس / gender
- سنوات الخبرة / experienceYears
- الراتب الأساسي / baseSalary
- البدلات المختلفة / allowance*

**Data Normalization**:
- حساب إجمالي البدلات
- حساب إجمالي الراتب (أساسي + بدلات)
- تصنيف سنوات الخبرة إلى فئات