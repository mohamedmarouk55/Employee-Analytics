# تقارير وتحليلات الموظفين - الإصدار المحسن 🚀

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-brightgreen)](https://mohamedmarouk55.github.io/Employee-Analytics/)
[![Version](https://img.shields.io/badge/Version-2.0.0-blue)](https://github.com/mohamedmarouk55/Employee-Analytics)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)
[![Arabic Support](https://img.shields.io/badge/Arabic-RTL%20Support-orange)](README.md)

تطبيق ويب متقدم لتحليل بيانات الموظفين وعرض تقارير وإحصائيات مختلفة. يدعم استيراد البيانات من ملفات CSV، JSON، وExcel، ويقوم بتحليلها وعرضها في جداول ورسوم بيانية تفاعلية مع ميزات متقدمة للتصدير والطباعة.

## 🌟 الميزات الجديدة في الإصدار 2.0

### ✨ ميزات أساسية محسنة
- **واجهة مستخدم محسنة** مع تصميم عصري ومتجاوب
- **نظام إشعارات متقدم** لتتبع العمليات والأخطاء
- **دعم المظاهر** (المظهر الليلي والنهاري)
- **تحسينات في الأداء** وسرعة التحميل

### 📊 تحليلات متقدمة
- **تحليل الارتباطات** بين المتغيرات المختلفة
- **رؤى ذكية وتوصيات** مبنية على البيانات
- **تحليل الاتجاهات** والتوزيعات الإحصائية
- **مقارنات متقدمة** بين الأقسام والجنسيات

### 🔧 أدوات التصدير والطباعة
- **تصدير البيانات** إلى CSV و JSON
- **طباعة التقارير** بتنسيق احترافي
- **حفظ الإعدادات** واستيرادها
- **اختصارات لوحة المفاتيح** للعمليات السريعة

### 📱 تحسينات تقنية
- **تصميم متجاوب** يعمل على جميع الأجهزة
- **دعم إمكانية الوصول** (Accessibility)
- **تحسين SEO** ومعايير الويب
- **أمان محسن** في معالجة البيانات

## 🚀 رابط التطبيق المباشر

يمكنك الوصول إلى التطبيق مباشرة عبر الرابط:
**[تقارير وتحليلات الموظفين](https://mohamedmarouk55.github.io/Employee-Analytics/)**

### 🎯 روابط سريعة
- **الإصدار المحسن**: [index-enhanced.html](https://mohamedmarouk55.github.io/Employee-Analytics/index-enhanced.html)
- **الإصدار الكلاسيكي**: [index.html](https://mohamedmarouk55.github.io/Employee-Analytics/index.html)
- **التوثيق**: [Wiki](https://github.com/mohamedmarouk55/Employee-Analytics/wiki)
- **الإصدارات**: [Releases](https://github.com/mohamedmarouk55/Employee-Analytics/releases)

## 📋 المتطلبات

- متصفح ويب حديث يدعم ES6+ (Chrome 60+, Firefox 55+, Safari 12+, Edge 79+)
- اتصال بالإنترنت لتحميل المكتبات الخارجية
- ملف بيانات بصيغة CSV، JSON، أو Excel

## 🛠️ التثبيت والتشغيل

### التشغيل المباشر
1. قم بتحميل الملفات أو استنساخ المستودع:
```bash
git clone https://github.com/mohamedmarouk55/Employee-Analytics.git
cd Employee-Analytics
```

2. افتح الملف `index-enhanced.html` في المتصفح مباشرة

### التشغيل عبر خادم محلي (مُوصى به)
```bash
# باستخدام Node.js
npm install -g http-server
http-server . -p 3000 -o

# أو باستخدام Python
python -m http.server 3000

# أو باستخدام Live Server في VS Code
# قم بتثبيت إضافة Live Server وانقر بالزر الأيمن على index-enhanced.html
```

## 📊 تنسيق البيانات المدعوم

### الأعمدة الأساسية (مطلوبة)
- **الاسم** / `name` - اسم الموظف
- **المسمى الوظيفي** / `jobTitle` - المنصب الوظيفي
- **القسم** / `department` - القسم أو الإدارة
- **الجنسية** / `nationality` - جنسية الموظف
- **الجنس** / `gender` - الجنس (M/F أو ذكر/أنثى)

### الأعمدة الاختيارية
- **سنوات الخبرة** / `experienceYears` - عدد سنوات الخبرة
- **الراتب الأساسي** / `baseSalary` - الراتب الأساسي
- **تاريخ الانضمام** / `joinDate` - تاريخ بدء العمل
- **الموقع** / `location` - موقع العمل
- **المدير المباشر** / `manager` - اسم المدير المباشر

### أعمدة البدلات
يتم اكتشاف أعمدة البدلات تلقائياً إذا كانت تبدأ بـ:
- `بدل` (بدل سكن، بدل مواصلات، إلخ)
- `allowance` (allowanceHousing, allowanceTransport, إلخ)

### مثال على ملف CSV
```csv
name,jobTitle,department,nationality,gender,experienceYears,baseSalary,allowanceHousing,allowanceTransport
أحمد علي,مطور برمجيات,تقنية المعلومات,مصري,ذكر,5,8000,1500,600
سارة نور,أخصائية موارد بشرية,الموارد البشرية,سعودي,أنثى,3,7000,1200,500
محمد خالد,مدير مشروع,تقنية المعلومات,أردني,ذكر,8,12000,2000,800
```

## 🎯 كيفية الاستخدام

### 1. استيراد البيانات
- **السحب والإفلات**: اسحب ملف البيانات وأفلته في المنطقة المخصصة
- **اختيار الملف**: انقر على "اختر ملف" وحدد الملف من جهازك
- **البيانات النموذجية**: انقر على "تحميل البيانات النموذجية" للتجربة

### 2. استعراض التقارير
- **الملخص التنفيذي**: إحصائيات عامة وملخص شامل
- **عرض جميع الموظفين**: جدول تفاعلي مع إمكانيات البحث والفلترة
- **التحليل حسب المعايير**: تقارير مفصلة حسب القسم، الجنسية، والجنس
- **الرسوم البيانية**: مخططات تفاعلية متنوعة

### 3. التحليلات المتقدمة
- **الارتباطات**: تحليل العلاقات بين المتغيرات
- **الاتجاهات**: توزيع البيانات والأنماط
- **الرؤى والتوصيات**: تحليل ذكي مع توصيات عملية

### 4. التصدير والطباعة
- **تصدير البيانات**: حفظ النتائج بصيغة CSV أو JSON
- **طباعة التقارير**: طباعة التقارير بتنسيق احترافي
- **اختصارات سريعة**: `Ctrl+E` للتصدير، `Ctrl+P` للطباعة

## 🔧 الإعدادات المتقدمة

### تخصيص المظهر
- **المظهر الليلي/النهاري**: تبديل سهل بين المظاهر
- **العملة**: دعم عملات متعددة (ريال، درهم، دولار، إلخ)
- **اللغة**: دعم العربية والإنجليزية

### إدارة الإعدادات
- **حفظ الإعدادات**: حفظ تلقائي في المتصفح
- **تصدير الإعدادات**: حفظ الإعدادات في ملف
- **استيراد الإعدادات**: استرداد الإعدادات المحفوظة

## 🛡️ الأمان والخصوصية

- **معالجة محلية**: جميع البيانات تتم معالجتها محلياً في المتصفح
- **عدم إرسال البيانات**: لا يتم إرسال أي بيانات إلى خوادم خارجية
- **حماية البيانات**: تشفير البيانات الحساسة في التخزين المحلي
- **مراجعة الكود**: الكود مفتوح المصدر وقابل للمراجعة

## 🔍 استكشاف الأخطاء

### مشاكل شائعة وحلولها

#### لا يتم تحميل البيانات النموذجية
**السبب**: قيود CORS في المتصفح
**الحل**: استخدم خادم محلي مثل Live Server

#### الرسوم البيانية لا تظهر
**السبب**: مكتبة Chart.js لم يتم تحميلها
**الحل**: تأكد من الاتصال بالإنترنت أو استخدم نسخة محلية

#### مشاكل في قراءة ملفات Excel
**السبب**: مكتبة XLSX لم يتم تحميلها
**الحل**: تأكد من الاتصال بالإنترنت

#### النص العربي يظهر بشكل خاطئ
**السبب**: ترميز الملف غير صحيح
**الحل**: احفظ الملف بترميز UTF-8

## 🚀 النشر على GitHub Pages

### الطريقة الأولى: عبر واجهة GitHub
1. قم بإنشاء مستودع جديد على GitHub
2. ارفع جميع الملفات إلى المستودع
3. انتقل إلى Settings > Pages
4. اختر المصدر: "Deploy from a branch"
5. اختر الفرع: "main" والمجلد: "/ (root)"
6. انقر على "Save"

### الطريقة الثانية: عبر سطر الأوامر
```bash
# تهيئة Git
git init
git add .
git commit -m "Initial commit - Enhanced Employee Analytics v2.0"

# ربط المستودع البعيد
git remote add origin https://github.com/username/Employee-Analytics.git
git branch -M main
git push -u origin main

# تفعيل GitHub Pages (يدوياً من الواجهة)
```

### الطريقة الثالثة: باستخدام GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./
```

## 📚 المكتبات والتقنيات المستخدمة

### المكتبات الخارجية
- **[Chart.js](https://www.chartjs.org/) v4.4.1** - رسوم بيانية تفاعلية
- **[PapaParse](https://www.papaparse.com/) v5.3.0** - تحليل ملفات CSV
- **[SheetJS](https://sheetjs.com/) v0.18.5** - قراءة ملفات Excel

### التقنيات الأساسية
- **HTML5** - هيكل التطبيق
- **CSS3** - التصميم والتنسيق
- **JavaScript ES6+** - المنطق والتفاعل
- **Web APIs** - File API, LocalStorage, Canvas

### ميزات الويب الحديثة
- **Service Workers** - للعمل دون اتصال (قريباً)
- **Web App Manifest** - تطبيق ويب قابل للتثبيت
- **Responsive Design** - تصميم متجاوب
- **Accessibility** - إمكانية الوصول

## 🤝 المساهمة في المشروع

نرحب بمساهماتكم لتطوير المشروع! يمكنكم المساهمة عبر:

### طرق المساهمة
1. **الإبلاغ عن الأخطاء**: افتح Issue جديد
2. **اقتراح ميزات**: شارك أفكارك للتحسين
3. **تطوير الكود**: أرسل Pull Request
4. **تحسين الوثائق**: ساعد في تحسين التوثيق

### خطوات المساهمة
```bash
# استنساخ المشروع
git clone https://github.com/mohamedmarouk55/Employee-Analytics.git
cd Employee-Analytics

# إنشاء فرع جديد
git checkout -b feature/new-feature

# إجراء التعديلات
# ...

# رفع التعديلات
git add .
git commit -m "Add new feature"
git push origin feature/new-feature

# إنشاء Pull Request من واجهة GitHub
```

## 📈 خارطة الطريق

### الإصدار 2.1 (قريباً)
- [ ] دعم قواعد البيانات (MySQL, PostgreSQL)
- [ ] تصدير إلى PDF
- [ ] المزيد من أنواع الرسوم البيانية
- [ ] نظام التنبيهات والتذكيرات

### الإصدار 2.2
- [ ] دعم العمل دون اتصال (PWA)
- [ ] تحليلات الذكاء الاصطناعي
- [ ] لوحة تحكم متقدمة
- [ ] دعم فرق العمل والمشاركة

### الإصدار 3.0
- [ ] تطبيق سطح المكتب (Electron)
- [ ] تطبيق الهاتف المحمول
- [ ] دعم البيانات الضخمة
- [ ] تكامل مع أنظمة HR

## 📞 الدعم والتواصل

### للحصول على المساعدة
- **GitHub Issues**: [رابط المشاكل](https://github.com/mohamedmarouk55/Employee-Analytics/issues)
- **البريد الإلكتروني**: mohamed.mabrouk@example.com
- **التوثيق**: [Wiki المشروع](https://github.com/mohamedmarouk55/Employee-Analytics/wiki)

### وسائل التواصل الاجتماعي
- **LinkedIn**: [Mohamed Mabrouk Attia](https://linkedin.com/in/mohamedmarouk)
- **GitHub**: [@mohamedmarouk55](https://github.com/mohamedmarouk55)

## 📄 الترخيص

هذا المشروع مرخص تحت رخصة MIT - راجع ملف [LICENSE](LICENSE) للتفاصيل.

```
MIT License

Copyright (c) 2024 Mohamed Mabrouk Attia

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 🙏 شكر وتقدير

- **Chart.js Team** - مكتبة الرسوم البيانية الرائعة
- **PapaParse Team** - مكتبة تحليل CSV الممتازة
- **SheetJS Team** - مكتبة قراءة Excel القوية
- **GitHub** - استضافة المشروع والصفحات
- **المجتمع العربي للمطورين** - الدعم والتشجيع

---

<div align="center">

**صُنع بـ ❤️ في مصر**

[⬆️ العودة للأعلى](#تقارير-وتحليلات-الموظفين---الإصدار-المحسن-)

</div>