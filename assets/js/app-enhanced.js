/*
  تطبيق تقارير وتحليلات الموظفين - الإصدار المحسن
  - يدعم سحب وإفلات/رفع ملف CSV أو JSON أو Excel
  - يحسب إجمالي الراتب (أساسي + جميع البدلات) تلقائياً
  - يولد جداول إحصائية ورسوم بيانية وتوصيات
  - ميزات جديدة: تصدير البيانات، طباعة التقارير، مقارنات متقدمة
*/

// حالة التطبيق المشتركة
const state = {
  rawRows: [],         // البيانات الأصلية كسجلات
  normalized: [],      // بعد التطبيع وإضافة الإجماليات
  columns: [],
  allowanceCols: [],   // أسماء أعمدة البدلات المكتشفة
  charts: {},
  filters: {           // حالة الفلاتر
    search: '',
    department: '',
    jobTitle: '',
    nationality: '',
    gender: '',
    salaryRange: { min: 0, max: 0 }
  },
  settings: {          // إعدادات التطبيق
    theme: 'dark',
    language: 'ar',
    currency: 'SAR',
    dateFormat: 'dd/mm/yyyy'
  }
};

// عناصر DOM
const els = {
  dropZone: document.getElementById('drop-zone'),
  fileInput: document.getElementById('file-input'),
  execSummary: document.getElementById('executive-summary'),
  tables: {
    employees: document.getElementById('employees-table'),
    dept: document.getElementById('dept-table'),
    nat: document.getElementById('nat-table'),
    gender: document.getElementById('gender-table'),
    exp: document.getElementById('exp-table'),
  },
  notifications: document.getElementById('notifications') || createNotificationContainer(),
};

// إنشاء حاوية الإشعارات إذا لم تكن موجودة
function createNotificationContainer() {
  const container = document.createElement('div');
  container.id = 'notifications';
  container.className = 'notifications-container';
  document.body.appendChild(container);
  return container;
}

// نظام الإشعارات
const notifications = {
  show(message, type = 'info', duration = 5000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-message">${message}</span>
        <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;
    
    els.notifications.appendChild(notification);
    
    // إزالة تلقائية
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, duration);
    
    return notification;
  },
  
  success(message) { return this.show(message, 'success'); },
  error(message) { return this.show(message, 'error'); },
  warning(message) { return this.show(message, 'warning'); },
  info(message) { return this.show(message, 'info'); }
};

// تنقل جانبي + إظهار قسم واحد فقط (Single Page)
(function sidebarNav(){
  const buttons = document.querySelectorAll('.menu-item');
  const sections = Array.from(document.querySelectorAll('main > section'));

  function setActive(id){
    buttons.forEach(b => b.classList.remove('active'));
    document.querySelector(`.menu-item[data-section="${id}"]`)?.classList.add('active');
  }
  
  function showOnly(id){
    sections.forEach(s => s.classList.toggle('hidden', s.id !== id));
    setActive(id);
  }
  
  function goTo(id){
    if (!id) id = 'overview';
    showOnly(id);
    // تمرير ناعم لأعلى محتوى الصفحة
    document.querySelector('.main')?.scrollTo({ top: 0, behavior: 'smooth' });
    
    // تحديث URL
    history.pushState(null, null, `#${id}`);
  }

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.section;
      if (id){ goTo(id); }
    });
  });

  function handleHash(){
    const id = (location.hash||'').replace(/^#/, '') || 'overview';
    goTo(id);
  }

  window.addEventListener('hashchange', handleHash);
  window.addEventListener('popstate', handleHash);
  // عند تحميل الصفحة من رابط مباشر
  setTimeout(handleHash, 0);
})();

// أدوات مساعدة محسنة
const utils = {
  // يحاول تحويل النص إلى رقم
  toNumber(v){
    if (v == null) return 0;
    if (typeof v === 'number') return v;
    const cleaned = String(v).replace(/[^\d.-]/g, '');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  },
  
  // CSV مع كشف الفاصل تلقائياً ومعالجة BOM ودعم الاقتباسات
  parseCSV(text){
    const rows = [];
    const norm = text.replace(/\r/g,'').replace(/^\uFEFF/, '');
    const lines = norm.split('\n').filter(l => l.trim().length > 0);
    if (!lines.length) return rows;
    const delim = utils.detectDelimiter(lines);
    const header = utils.splitCSVLine(lines[0], delim);
    for (let i=1;i<lines.length;i++){
      const cols = utils.splitCSVLine(lines[i], delim);
      const obj = {};
      header.forEach((h,idx)=> obj[String(h).trim()] = cols[idx] ?? '');
      rows.push(obj);
    }
    return rows;
  },
  
  splitCSVLine(line, delim = ','){
    const out = [];
    let cur = '';
    let q = false;
    for (let i=0;i<line.length;i++){
      const c = line[i];
      if (c === '"'){
        if (q && line[i+1] === '"'){ cur += '"'; i++; }
        else { q = !q; }
      } else if (c === delim && !q){
        out.push(cur); cur = '';
      } else {
        cur += c;
      }
    }
    out.push(cur);
    return out;
  },
  
  detectDelimiter(lines){
    const cands = [',',';','\t','|'];
    let best = ',', bestScore = -Infinity;
    for (const d of cands){
      const counts = lines.slice(0, Math.min(10, lines.length)).map(l => utils.splitCSVLine(l, d).length);
      const uniq = new Set(counts).size;
      const max = Math.max(...counts);
      const score = (max > 1 ? max : 0) - (uniq - 1);
      if (score > bestScore){ bestScore = score; best = d; }
    }
    return best;
  },
  
  // يكتشف أعمدة البدلات
  allowanceKeys(cols){
    const regex = /^(allowance|بدل)/i;
    return cols.filter(c => regex.test(c) || /allowance/i.test(c));
  },
  
  groupBy(arr, keyFn){
    const m = new Map();
    for (const item of arr){
      const k = keyFn(item);
      const g = m.get(k) || [];
      g.push(item); m.set(k,g);
    }
    return m;
  },
  
  mean(nums){ return nums.length ? nums.reduce((a,b)=>a+b,0)/nums.length : 0; },
  sum(nums){ return nums.reduce((a,b)=>a+b,0); },
  median(nums) {
    const sorted = [...nums].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  },
  
  // تصنيف الخبرة إلى فئات
  expBucket(years){
    const y = Math.max(0, Math.floor(years || 0));
    if (y <= 1) return '0-1 سنة';
    if (y <= 3) return '2-3 سنوات';
    if (y <= 5) return '4-5 سنوات';
    if (y <= 10) return '6-10 سنوات';
    return 'أكثر من 10 سنوات';
  },
  
  formatMoney(v, currency = state.settings.currency){
    const formatter = new Intl.NumberFormat('ar-EG', { 
      maximumFractionDigits: 0,
      style: 'currency',
      currency: currency
    });
    return formatter.format(v);
  },
  
  formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('ar-EG');
  },
  
  // تصدير البيانات إلى CSV
  exportToCSV(data, filename = 'employee_data.csv') {
    if (!data.length) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header] || '';
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    
    notifications.success('تم تصدير البيانات بنجاح');
  },
  
  // تصدير البيانات إلى JSON
  exportToJSON(data, filename = 'employee_data.json') {
    if (!data.length) return;
    
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    
    notifications.success('تم تصدير البيانات بنجاح');
  },
  
  // طباعة التقرير
  printReport(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>تقرير الموظفين</title>
        <style>
          body { font-family: Arial, sans-serif; direction: rtl; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
          th { background-color: #f2f2f2; }
          .no-print { display: none; }
          @media print {
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <h1>تقرير الموظفين</h1>
        <p>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-EG')}</p>
        ${section.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    
    notifications.success('تم إرسال التقرير للطباعة');
  },
  
  // بناء الهيكل التنظيمي
  buildHierarchy(rows, opts={}){
    const get = (r, keys) => keys.find(k=>r[k]!=null && r[k]!=='' && r[k]!==undefined);
    const companyName = opts.companyName || 'شركة الراشد';
    const dKeys   = ['department','القسم','الادارة','الإدارة','ادارة','الإداره'];
    const mKeys   = ['manager','المدير المباشر','المدير'];
    const nameKs  = ['name','الاسم'];
    const jobKs   = ['jobTitle','المسمى الوظيفي','المسمي الوظيفي'];

    // بناء خرائط: قسم → مدير → قائمة موظفين
    const deptMap = new Map();
    for (const r of rows){
      const dept = String(r[get(r, dKeys)] ?? '').trim() || 'غير محدد';
      const mgr  = String(r[get(r, mKeys)] ?? '').trim() || 'بدون مدير';
      const name = String(r[get(r, nameKs)] ?? '').trim();
      const job  = String(r[get(r, jobKs)] ?? '').trim();
      if (!deptMap.has(dept)) deptMap.set(dept, new Map());
      const mgrMap = deptMap.get(dept);
      if (!mgrMap.has(mgr)) mgrMap.set(mgr, []);
      mgrMap.get(mgr).push({ name, job });
    }

    // فرز بالعربية
    const sortAr = (a,b)=> String(a).localeCompare(String(b), 'ar');
    for (const mgrMap of deptMap.values()){
      for (const [mgr, arr] of mgrMap.entries()){
        arr.sort((a,b)=> sortAr(a.name, b.name));
      }
    }

    // بناء عقد الشجرة
    const root = { name: companyName, role: 'الادارة التنفيذية', children: [] };
    const vpNode = { name: 'نائب الرئيس التنفيذي', role: '', children: [] };

    const deptNames = [...deptMap.keys()].sort(sortAr);
    for (const dept of deptNames){
      const deptNode = { name: dept, role: 'ادارة', children: [] };
      const mgrMap = deptMap.get(dept);
      const mgrNames = [...mgrMap.keys()].sort(sortAr);
      for (const mgr of mgrNames){
        const mgrNode = { name: mgr, role: 'مدير مباشر', children: [] };
        const emps = mgrMap.get(mgr);
        for (const e of emps){
          const empName = e.name || '(موظف)';
          mgrNode.children.push({ name: empName, role: e.job || '', children: [] });
        }
        deptNode.children.push(mgrNode);
      }
      vpNode.children.push(deptNode);
    }

    root.children.push(vpNode);
    return root;
  },
  
  // حفظ الإعدادات في localStorage
  saveSettings() {
    localStorage.setItem('employeeAnalyticsSettings', JSON.stringify(state.settings));
  },
  
  // تحميل الإعدادات من localStorage
  loadSettings() {
    const saved = localStorage.getItem('employeeAnalyticsSettings');
    if (saved) {
      try {
        state.settings = { ...state.settings, ...JSON.parse(saved) };
      } catch (e) {
        console.warn('فشل في تحميل الإعدادات المحفوظة');
      }
    }
  }
};

// تحميل الإعدادات عند بدء التطبيق
utils.loadSettings();

// سحب وإفلات محسن
(function initDnD(){
  const dz = els.dropZone;
  
  ['dragenter','dragover'].forEach(ev => {
    dz.addEventListener(ev, e => { 
      e.preventDefault(); 
      dz.classList.add('dragover'); 
    });
  });
  
  ['dragleave','drop'].forEach(ev => {
    dz.addEventListener(ev, e => { 
      e.preventDefault(); 
      dz.classList.remove('dragover'); 
    });
  });
  
  dz.addEventListener('drop', e => {
    const files = Array.from(e.dataTransfer?.files || []);
    if (files.length > 1) {
      notifications.warning('يرجى اختيار ملف واحد فقط');
      return;
    }
    if (files[0]) readFile(files[0]);
  });
  
  els.fileInput.addEventListener('change', e => {
    const file = e.target.files?.[0];
    if (file) readFile(file);
  });
})();

// قراءة ملف محسنة (CSV/JSON/Excel)
function readFile(file){
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (file.size > maxSize) {
    notifications.error('حجم الملف كبير جداً. الحد الأقصى 10 ميجابايت');
    return;
  }
  
  notifications.info('جاري قراءة الملف...');
  
  const reader = new FileReader();
  reader.onload = () => {
    try {
      if (ext === 'json'){
        const text = String(reader.result || '');
        const parsed = JSON.parse(text);
        state.rawRows = Array.isArray(parsed) ? parsed : [parsed];
      } else if (ext === 'xls' || ext === 'xlsx'){
        const data = reader.result; // ArrayBuffer
        parseExcel(data);
      } else {
        // محاولة كشف الترميز
        let text = '';
        try { 
          text = new TextDecoder('utf-8',{fatal:false}).decode(reader.result); 
        } catch { 
          text = String(reader.result || ''); 
        }
        if (/�/.test(text) && typeof TextDecoder !== 'undefined'){
          try { 
            text = new TextDecoder('windows-1256', {fatal:false}).decode(reader.result); 
          } catch {}
        }
        state.rawRows = utils.parseCSV(text);
      }
      
      if (!state.rawRows.length) {
        notifications.error('الملف فارغ أو لا يحتوي على بيانات صالحة');
        return;
      }
      
      normalizeData();
      renderAll();
      notifications.success(`تم تحميل ${state.rawRows.length} سجل بنجاح`);
      
    } catch(e){
      notifications.error('تعذر قراءة الملف: ' + e.message);
    }
  };
  
  reader.onerror = () => {
    notifications.error('حدث خطأ أثناء قراءة الملف');
  };
  
  if (ext === 'xls' || ext === 'xlsx') {
    reader.readAsArrayBuffer(file);
  } else {
    reader.readAsText(file, 'utf-8');
  }
}

// تحليل ملف Excel إلى صفوف JSON
function parseExcel(arrayBuffer){
  if (typeof XLSX === 'undefined') {
    throw new Error('مكتبة XLSX غير محمّلة');
  }
  
  const wb = XLSX.read(arrayBuffer, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
  state.rawRows = rows;
}

// تحميل ملف البيانات الافتراضي
async function loadDefaultExcel(){
  const btn = document.getElementById('btn-load-default');
  if (btn) btn.disabled = true;
  
  try {
    notifications.info('جاري تحميل البيانات النموذجية...');
    const url = 'excel/تقرير الموظفين - 03 Sep 2025.csv';
    const res = await fetch(url);
    
    if (!res.ok) {
      throw new Error('تعذر الوصول للملف. افتح الصفحة عبر خادم محلي لتجاوز قيود المتصفح.');
    }
    
    const text = await res.text();
    state.rawRows = utils.parseCSV(text);
    normalizeData();
    renderAll();
    notifications.success('تم تحميل البيانات النموذجية بنجاح');
    
  } catch(e){
    notifications.error('فشل تحميل ملف البيانات الافتراضي: ' + e.message);
  } finally {
    if (btn) btn.disabled = false;
  }
}

// ربط زر التحميل الافتراضي
(function bindDefaultBtn(){
  document.getElementById('btn-load-default')?.addEventListener('click', loadDefaultExcel);
})();

// تطبيع البيانات محسن
function normalizeData(){
  const rows = Array.isArray(state.rawRows) ? state.rawRows : [];
  if (!rows.length){ 
    state.normalized = []; 
    state.columns = []; 
    return; 
  }

  // كشف أسماء الأعمدة الشائعة
  const cols = Object.keys(rows[0]);
  const nameKeys = ['name','الاسم'];
  const jobKeys = ['jobTitle','المسمى الوظيفي'];
  const deptKeys = ['department','القسم'];
  const natKeys  = ['nationality','الجنسية'];
  const genderKeys=['gender','الجنس'];
  const expKeys  = ['experienceYears','سنوات الخبرة','سنوات خبرة العمل'];
  const baseKeys = ['baseSalary','الراتب الأساسي','الراتب الاساسي','basicSalary'];
  const totalKeys= ['totalComp','الراتب الاجمالي','إجمالي الراتب','إجمالي التعويضات','totalSalary'];
  const idKeys   = ['employeeId','الرقم الوظيفي','رقم الموظف'];
  const joinDateKeys=['joinDate','تاريخ الانضمام','تاريخ الالتحاق'];
  const locationKeys=['location','الموقع','المدينة','الفرع'];
  const managerKeys=['manager','المدير المباشر','المدير'];
  
  const findKey = (cands)=> cands.find(k => cols.includes(k));
  const kName   = findKey(nameKeys)   || nameKeys[0];
  const kJob    = findKey(jobKeys)    || jobKeys[0];
  const kDept   = findKey(deptKeys)   || deptKeys[0];
  const kNat    = findKey(natKeys)    || natKeys[0];
  const kGender = findKey(genderKeys) || genderKeys[0];
  const kExp    = findKey(expKeys)    || expKeys[0];
  const kBase   = findKey(baseKeys)   || baseKeys[0];
  const kTotal  = findKey(totalKeys)  || null;

  // أعمدة البدلات
  const allowanceArabic = ['بدل سكن','بدل مواصلات','بدل إعاشة','بدل اضافي ثابت','بدل طبيعة عمل','بدل ادارة','بدل محروقات','بدل اتصال','أخرى'];
  const allowanceCols = Array.from(new Set(
    utils.allowanceKeys(cols).concat(allowanceArabic).filter(c => cols.includes(c))
  )).filter(c => c !== kBase && c !== kTotal);
  state.allowanceCols = allowanceCols;

  state.normalized = rows.map((r, index) => {
    const base = utils.toNumber(r[kBase]);
    const allowances = allowanceCols.map(c => utils.toNumber(r[c]));
    const allowanceSum = utils.sum(allowances);
    const totalFromCol = kTotal ? utils.toNumber(r[kTotal]) : 0;
    const total = totalFromCol > 0 ? totalFromCol : (base + allowanceSum);
    
    return {
      id: index + 1,
      employeeId: r[findKey(idKeys)] ?? '',
      name: r[kName] ?? '',
      jobTitle: r[kJob] ?? '',
      department: r[kDept] ?? '',
      nationality: r[kNat] ?? '',
      gender: r[kGender] ?? '',
      joinDate: r[findKey(joinDateKeys)] ?? '',
      experienceYears: utils.toNumber(r[kExp]),
      location: r[findKey(locationKeys)] ?? '',
      manager: r[findKey(managerKeys)] ?? '',
      baseSalary: base,
      allowanceTotal: allowanceSum,
      totalComp: total,
      allowanceBreakdown: allowanceCols.reduce((acc, col) => {
        acc[col] = utils.toNumber(r[col]);
        return acc;
      }, {}),
      __orig: r,
    };
  });

  // تحديث نطاق الراتب للفلاتر
  const salaries = state.normalized.map(r => r.totalComp).filter(s => s > 0);
  if (salaries.length) {
    state.filters.salaryRange.min = Math.min(...salaries);
    state.filters.salaryRange.max = Math.max(...salaries);
  }

  // احتفظ بأعمدة الملف الأصلية
  state.columns = cols;
}

// عرض الجداول والرسوم محسن
function renderAll(){
  renderExecutiveSummary();
  renderEmployeesTable();
  renderByDepartment();
  renderByNationality();
  renderByGender();
  renderByExperience();
  renderCharts();
  renderOrgChart();
  renderSalaryAllowanceAnalysis();
  renderAdvancedAnalytics();
}

// الملخص التنفيذي محسن
function renderExecutiveSummary(){
  if (!els.execSummary) return;
  const d = state.normalized;
  
  if (!d.length) {
    els.execSummary.innerHTML = '<div class="small">لا توجد بيانات بعد.</div>';
    return;
  }
  
  const totalEmployees = d.length;
  const avgBase = utils.mean(d.map(x=>x.baseSalary));
  const avgAllw = utils.mean(d.map(x=>x.allowanceTotal));
  const avgTotal = utils.mean(d.map(x=>x.totalComp));
  const medianTotal = utils.median(d.map(x=>x.totalComp));
  const minTotal = Math.min(...d.map(x=>x.totalComp));
  const maxTotal = Math.max(...d.map(x=>x.totalComp));
  
  // إحصائيات إضافية
  const avgExp = utils.mean(d.map(x=>x.experienceYears));
  const deptCount = new Set(d.map(x=>x.department)).size;
  const natCount = new Set(d.map(x=>x.nationality)).size;

  els.execSummary.innerHTML = [
    {label:'عدد الموظفين', value: totalEmployees.toLocaleString('ar-EG')},
    {label:'عدد الأقسام', value: deptCount.toLocaleString('ar-EG')},
    {label:'عدد الجنسيات', value: natCount.toLocaleString('ar-EG')},
    {label:'متوسط سنوات الخبرة', value: avgExp.toFixed(1) + ' سنة'},
    {label:'متوسط الراتب الأساسي', value: utils.formatMoney(avgBase)},
    {label:'متوسط إجمالي البدلات', value: utils.formatMoney(avgAllw)},
    {label:'متوسط إجمالي الراتب', value: utils.formatMoney(avgTotal)},
    {label:'الوسيط لإجمالي الراتب', value: utils.formatMoney(medianTotal)},
    {label:'أدنى إجمالي راتب', value: utils.formatMoney(minTotal)},
    {label:'أعلى إجمالي راتب', value: utils.formatMoney(maxTotal)},
  ].map(s => `<div class="stat"><div class="label">${s.label}</div><div class="value">${s.value}</div></div>`).join('');
}

// عرض جدول الموظفين محسن
function renderEmployeesTable(){
  const t = els.tables.employees;
  if (!t) return;
  
  const d = state.normalized;
  if (!d.length) {
    t.innerHTML = '<div class="small">لا توجد بيانات بعد.</div>';
    return;
  }
  
  // إعداد أدوات التحكم المحسنة
  setupEmployeeControls();
  
  // بناء الجدول
  const origCols = Array.isArray(state.columns) ? state.columns.slice() : [];
  const allowanceSyn = ['إجمالي البدلات','allowanceTotal','Total Allowances'];
  const totalSyn = ['الراتب الاجمالي','إجمالي الراتب','totalSalary','totalComp'];
  const hasAllowanceTotal = origCols.some(c => allowanceSyn.includes(c));
  const hasTotal = origCols.some(c => totalSyn.includes(c));
  const finalCols = origCols.slice();
  if (!hasAllowanceTotal) finalCols.push('إجمالي البدلات');
  if (!hasTotal) finalCols.push('إجمالي الراتب');

  // حالة الترتيب
  let sortState = renderEmployeesTable._sort || { col: null, dir: 1 };

  // بناء رأس الجدول
  t.querySelector('thead').innerHTML = `<tr>${finalCols.map(c=>`<th data-col="${c}" class="sortable">${c} <span class="sort-ind"></span></th>`).join('')}</tr>`;

  function getFilteredData(){
    let rows = d.slice();

    // تطبيق الفلاتر
    const filters = state.filters;
    
    if (filters.search) {
      const qLower = filters.search.toLowerCase();
      rows = rows.filter(r => {
        const o = r.__orig || {};
        return finalCols.some(c => String(o[c] ?? r[c] ?? '').toLowerCase().includes(qLower));
      });
    }
    
    if (filters.department) {
      rows = rows.filter(r => r.department === filters.department);
    }
    
    if (filters.jobTitle) {
      rows = rows.filter(r => r.jobTitle === filters.jobTitle);
    }
    
    if (filters.nationality) {
      rows = rows.filter(r => r.nationality === filters.nationality);
    }
    
    if (filters.gender) {
      rows = rows.filter(r => r.gender === filters.gender);
    }

    // ترتيب
    if (sortState.col) {
      rows.sort((a,b) => compareByCol(a,b,sortState.col,sortState.dir));
    }

    return rows;
  }

  function compareByCol(a,b,col,dir){
    const oa = a.__orig || {}, ob = b.__orig || {};
    const va = oa[col] ?? a[col] ?? '';
    const vb = ob[col] ?? b[col] ?? '';
    const na = utils.toNumber(va);
    const nb = utils.toNumber(vb);
    const aIsNum = Number.isFinite(na) && na !== 0;
    const bIsNum = Number.isFinite(nb) && nb !== 0;
    
    if (aIsNum && bIsNum){
      return (na - nb) * dir;
    }
    return String(va).localeCompare(String(vb), 'ar') * dir;
  }

  function renderBody(){
    const rows = getFilteredData();
    const tbody = t.querySelector('tbody');
    
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="100%" class="text-center">لا توجد نتائج تطابق الفلاتر المحددة</td></tr>';
      return;
    }
    
    tbody.innerHTML = rows.map(r => {
      const orig = r.__orig || {};
      return `<tr>${finalCols.map(c => {
        let val = orig[c];
        if (val == null || val === ''){
          if (allowanceSyn.includes(c) || c === 'إجمالي البدلات') val = utils.formatMoney(r.allowanceTotal);
          else if (totalSyn.includes(c) || c === 'إجمالي الراتب') val = utils.formatMoney(r.totalComp);
          else if (c === 'الاسم' && r.name) val = r.name;
          else if (c === 'المسمى الوظيفي' && r.jobTitle) val = r.jobTitle;
          else if (c === 'القسم' && r.department) val = r.department;
          else if (c === 'الجنسية' && r.nationality) val = r.nationality;
          else if (c === 'الجنس' && r.gender) val = r.gender;
          else if ((c === 'سنوات الخبرة' || c === 'سنوات خبرة العمل') && Number.isFinite(r.experienceYears)) val = r.experienceYears;
          else if ((c === 'الراتب الأساسي' || c === 'الراتب الاساسي') && Number.isFinite(r.baseSalary)) val = utils.formatMoney(r.baseSalary);
          else val = orig[c] ?? '';
        } else {
          if (['الراتب الأساسي','الراتب الاساسي'].includes(c)) val = utils.formatMoney(utils.toNumber(val));
          if (String(c).startsWith('بدل')) val = utils.formatMoney(utils.toNumber(val));
        }
        return `<td>${val ?? ''}</td>`;
      }).join('')}</tr>`;
    }).join('');
    
    // تحديث عداد النتائج
    updateResultsCounter(rows.length, d.length);
  }

  // ربط أحداث الترتيب
  t.querySelectorAll('thead th.sortable').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.getAttribute('data-col');
      if (sortState.col === col){ 
        sortState.dir = -sortState.dir; 
      } else { 
        sortState.col = col; 
        sortState.dir = 1; 
      }
      renderEmployeesTable._sort = sortState;
      
      // تحديث مؤشر السهم
      t.querySelectorAll('thead th .sort-ind').forEach(s=> s.textContent='');
      th.querySelector('.sort-ind').textContent = sortState.dir > 0 ? '▲' : '▼';
      renderBody();
    });
  });

  renderBody();
}

// إعداد أدوات التحكم للموظفين
function setupEmployeeControls() {
  const d = state.normalized;
  
  // البحث
  const searchInput = document.getElementById('emp-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.filters.search = e.target.value.trim();
      renderEmployeesTable();
    });
  }
  
  // فلتر القسم
  const deptFilter = document.getElementById('emp-filter-dept');
  if (deptFilter) {
    const depts = [...new Set(d.map(r => r.department).filter(Boolean))].sort();
    deptFilter.innerHTML = '<option value="">كل الأقسام</option>' + 
      depts.map(dept => `<option value="${dept}">${dept}</option>`).join('');
    
    deptFilter.addEventListener('change', (e) => {
      state.filters.department = e.target.value;
      renderEmployeesTable();
    });
  }
  
  // فلتر المسمى الوظيفي
  const jobFilter = document.getElementById('emp-filter-job');
  if (jobFilter) {
    const jobs = [...new Set(d.map(r => r.jobTitle).filter(Boolean))].sort();
    jobFilter.innerHTML = '<option value="">كل المسميات</option>' + 
      jobs.map(job => `<option value="${job}">${job}</option>`).join('');
    
    jobFilter.addEventListener('change', (e) => {
      state.filters.jobTitle = e.target.value;
      renderEmployeesTable();
    });
  }
  
  // زر إعادة الضبط
  const resetBtn = document.getElementById('emp-reset');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      state.filters = {
        search: '',
        department: '',
        jobTitle: '',
        nationality: '',
        gender: '',
        salaryRange: state.filters.salaryRange
      };
      
      // إعادة ضبط عناصر الواجهة
      if (searchInput) searchInput.value = '';
      if (deptFilter) deptFilter.value = '';
      if (jobFilter) jobFilter.value = '';
      
      renderEmployeesTable();
    });
  }
}

// تحديث عداد النتائج
function updateResultsCounter(filtered, total) {
  let counter = document.getElementById('results-counter');
  if (!counter) {
    counter = document.createElement('div');
    counter.id = 'results-counter';
    counter.className = 'results-counter';
    const controls = document.getElementById('employees-controls');
    if (controls) {
      controls.appendChild(counter);
    }
  }
  
  counter.textContent = `عرض ${filtered.toLocaleString('ar-EG')} من ${total.toLocaleString('ar-EG')} موظف`;
}

// تحليل حسب القسم محسن
function renderByDepartment(){
  const d = state.normalized;
  const m = utils.groupBy(d, x=>x.department || 'غير محدد');
  const rows = [...m.entries()].map(([dept, arr]) => {
    const avgBase = utils.mean(arr.map(x=>x.baseSalary));
    const avgAllw = utils.mean(arr.map(x=>x.allowanceTotal));
    const avgTot  = utils.mean(arr.map(x=>x.totalComp));
    const medianTot = utils.median(arr.map(x=>x.totalComp));
    const avgExp = utils.mean(arr.map(x=>x.experienceYears));
    
    return { 
      dept, 
      count: arr.length, 
      avgBase, 
      avgAllw, 
      avgTot, 
      medianTot,
      avgExp,
      percentage: (arr.length / d.length * 100).toFixed(1)
    };
  }).sort((a,b)=> b.avgTot - a.avgTot);

  const table = els.tables.dept;
  if (!table) return;
  
  // تحديث رأس الجدول
  table.querySelector('thead').innerHTML = `
    <tr>
      <th>القسم</th>
      <th>عدد الموظفين</th>
      <th>النسبة %</th>
      <th>متوسط الخبرة</th>
      <th>متوسط الراتب الأساسي</th>
      <th>متوسط البدلات</th>
      <th>متوسط إجمالي الراتب</th>
      <th>الوسيط للراتب</th>
    </tr>
  `;
  
  table.querySelector('tbody').innerHTML = rows.map(r => `
    <tr>
      <td><strong>${r.dept}</strong></td>
      <td>${r.count.toLocaleString('ar-EG')}</td>
      <td>${r.percentage}%</td>
      <td>${r.avgExp.toFixed(1)} سنة</td>
      <td>${utils.formatMoney(r.avgBase)}</td>
      <td>${utils.formatMoney(r.avgAllw)}</td>
      <td>${utils.formatMoney(r.avgTot)}</td>
      <td>${utils.formatMoney(r.medianTot)}</td>
    </tr>
  `).join('');
}

// تحليل حسب الجنسية محسن
function renderByNationality(){
  const d = state.normalized;
  const m = utils.groupBy(d, x=>x.nationality || 'غير محدد');
  const rows = [...m.entries()].map(([nat, arr]) => {
    const avgTot = utils.mean(arr.map(x=>x.totalComp));
    const avgExp = utils.mean(arr.map(x=>x.experienceYears));
    return { 
      nat, 
      count: arr.length, 
      avgTot,
      avgExp,
      percentage: (arr.length / d.length * 100).toFixed(1)
    };
  }).sort((a,b)=> b.count - a.count);

  const table = els.tables.nat;
  if (!table) return;
  
  table.querySelector('thead').innerHTML = `
    <tr>
      <th>الجنسية</th>
      <th>عدد الموظفين</th>
      <th>النسبة %</th>
      <th>متوسط الخبرة</th>
      <th>متوسط إجمالي الراتب</th>
    </tr>
  `;
  
  table.querySelector('tbody').innerHTML = rows.map(r => `
    <tr>
      <td><strong>${r.nat}</strong></td>
      <td>${r.count.toLocaleString('ar-EG')}</td>
      <td>${r.percentage}%</td>
      <td>${r.avgExp.toFixed(1)} سنة</td>
      <td>${utils.formatMoney(r.avgTot)}</td>
    </tr>
  `).join('');
}

// تحليل حسب الجنس محسن
function renderByGender(){
  const d = state.normalized;
  const m = utils.groupBy(d, x=>x.gender || 'غير محدد');
  const rows = [...m.entries()].map(([g, arr]) => {
    const avgTot = utils.mean(arr.map(x=>x.totalComp));
    const avgExp = utils.mean(arr.map(x=>x.experienceYears));
    return { 
      g, 
      count: arr.length, 
      avgTot,
      avgExp,
      percentage: (arr.length / d.length * 100).toFixed(1)
    };
  }).sort((a,b)=> b.count - a.count);

  const table = els.tables.gender;
  if (!table) return;
  
  table.querySelector('thead').innerHTML = `
    <tr>
      <th>الجنس</th>
      <th>عدد الموظفين</th>
      <th>النسبة %</th>
      <th>متوسط الخبرة</th>
      <th>متوسط إجمالي الراتب</th>
    </tr>
  `;
  
  table.querySelector('tbody').innerHTML = rows.map(r => `
    <tr>
      <td><strong>${r.g}</strong></td>
      <td>${r.count.toLocaleString('ar-EG')}</td>
      <td>${r.percentage}%</td>
      <td>${r.avgExp.toFixed(1)} سنة</td>
      <td>${utils.formatMoney(r.avgTot)}</td>
    </tr>
  `).join('');
}

// تحليل حسب الخبرة
function renderByExperience(){
  const d = state.normalized;
  const m = utils.groupBy(d, x=>utils.expBucket(x.experienceYears));
  const rows = [...m.entries()].map(([bucket, arr]) => {
    const avgBase = utils.mean(arr.map(x=>x.baseSalary));
    const avgAllw = utils.mean(arr.map(x=>x.allowanceTotal));
    const avgTot  = utils.mean(arr.map(x=>x.totalComp));
    const minTot  = Math.min(...arr.map(x=>x.totalComp));
    const maxTot  = Math.max(...arr.map(x=>x.totalComp));
    return { 
      bucket, 
      count: arr.length, 
      avgBase, 
      avgAllw, 
      avgTot, 
      minTot, 
      maxTot,
      percentage: (arr.length / d.length * 100).toFixed(1)
    };
  }).sort((a,b)=> a.bucket.localeCompare(b.bucket, 'ar'));

  const table = els.tables.exp;
  if (!table) return;
  
  table.querySelector('thead').innerHTML = `
    <tr>
      <th>فئة الخبرة</th>
      <th>عدد الموظفين</th>
      <th>النسبة %</th>
      <th>متوسط الراتب الأساسي</th>
      <th>متوسط البدلات</th>
      <th>متوسط إجمالي الراتب</th>
      <th>أدنى راتب</th>
      <th>أعلى راتب</th>
    </tr>
  `;
  
  table.querySelector('tbody').innerHTML = rows.map(r => `
    <tr>
      <td><strong>${r.bucket}</strong></td>
      <td>${r.count.toLocaleString('ar-EG')}</td>
      <td>${r.percentage}%</td>
      <td>${utils.formatMoney(r.avgBase)}</td>
      <td>${utils.formatMoney(r.avgAllw)}</td>
      <td>${utils.formatMoney(r.avgTot)}</td>
      <td>${utils.formatMoney(r.minTot)}</td>
      <td>${utils.formatMoney(r.maxTot)}</td>
    </tr>
  `).join('');
}

// الرسوم البيانية المحسنة
function renderCharts(){
  // تدمير الرسوم السابقة
  Object.values(state.charts).forEach(ch => ch?.destroy?.());
  state.charts = {};
  
  const d = state.normalized;
  if (!d.length) return;

  // رسم توزيع الموظفين حسب القسم
  renderDepartmentChart(d);
  
  // رسم متوسط الراتب حسب الجنس
  renderGenderSalaryChart(d);
  
  // رسوم إضافية
  renderExperienceDistributionChart(d);
  renderSalaryDistributionChart(d);
  renderNationalityChart(d);
}

function renderDepartmentChart(data) {
  const ctx = document.getElementById('chartEmployeesByDept');
  if (!ctx) return;
  
  const m = utils.groupBy(data, x => x.department || 'غير محدد');
  const labels = Array.from(m.keys());
  const values = labels.map(k => (m.get(k) || []).length);
  
  state.charts.empByDept = new Chart(ctx, {
    type: 'bar',
    data: { 
      labels, 
      datasets: [{ 
        label: 'عدد الموظفين', 
        data: values, 
        backgroundColor: '#22c55e',
        borderColor: '#16a34a',
        borderWidth: 1
      }]
    },
    options: { 
      responsive: true, 
      plugins: { 
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              const total = values.reduce((a, b) => a + b, 0);
              const percentage = ((context.parsed.y / total) * 100).toFixed(1);
              return `${context.parsed.y} موظف (${percentage}%)`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  });
}

function renderGenderSalaryChart(data) {
  const ctx = document.getElementById('chartAvgSalaryByGender');
  if (!ctx) return;
  
  const m = utils.groupBy(data, x => x.gender || 'غير محدد');
  const labels = Array.from(m.keys());
  const values = labels.map(k => {
    const arr = m.get(k) || [];
    return Math.round(utils.mean(arr.map(x => x.totalComp)));
  });
  
  state.charts.avgSalaryByGender = new Chart(ctx, {
    type: 'bar',
    data: { 
      labels, 
      datasets: [{ 
        label: 'متوسط الراتب', 
        data: values, 
        backgroundColor: '#3b82f6',
        borderColor: '#2563eb',
        borderWidth: 1
      }]
    },
    options: { 
      responsive: true, 
      plugins: { 
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${utils.formatMoney(context.parsed.y)}`;
            }
          }
        }
      },
      scales: { 
        y: { 
          beginAtZero: true,
          ticks: { 
            callback: v => utils.formatMoney(v) 
          }
        }
      }
    }
  });
}

// رسم شجرة هيكل تنظيمي
function renderOrgChart(){
  const container = document.getElementById('org-tree');
  if (!container) return;
  
  const d = state.normalized;
  if (!d.length){ 
    container.innerHTML = '<div class="small">لا توجد بيانات بعد.</div>'; 
    return; 
  }

  const tree = utils.buildHierarchy(d.map(x=>x.__orig || {}), { companyName: 'شركة الراشد' });
  
  if (!tree.children?.[0]?.children?.length){
    container.innerHTML = '<div class="small">لم يتم العثور على أعمدة قسم في البيانات. تأكد من وجود عمود باسم "القسم" أو "department".</div>';
    return;
  }
  
  container.innerHTML = renderNode(tree);

  function renderNode(node){
    const title = `${node.name}${node.role ? `<span class="org-role">— ${node.role}</span>`:''}`;
    const childrenHtml = (node.children||[]).map(renderNode).join('');
    if (childrenHtml){
      return `<div class="org-branch"><div class="org-node">${title}</div><div class="org-children">${childrenHtml}</div></div>`;
    }
    return `<div class="org-node">${title}</div>`;
  }
}

// تحليل الرواتب والبدلات
function renderSalaryAllowanceAnalysis(){
  const d = state.normalized;
  const allowanceCols = state.allowanceCols || [];
  const section = document.getElementById('salary-allowance');
  if (!section) return;
  
  const contentDiv = section.querySelector('.content');
  if (!d.length){ 
    contentDiv.innerHTML = '<div class="small">لا توجد بيانات.</div>'; 
    return; 
  }

  // ملخصات عامة
  const totalBase = utils.sum(d.map(x=>x.baseSalary));
  const totalAllowances = utils.sum(d.map(x=>x.allowanceTotal));
  const totalComp = utils.sum(d.map(x=>x.totalComp));
  
  contentDiv.innerHTML = `
    <div class="salary-summary">
      <h3>ملخص الرواتب والبدلات</h3>
      <div class="stats-grid">
        <div class="stat">
          <div class="label">إجمالي الرواتب الأساسية</div>
          <div class="value">${utils.formatMoney(totalBase)}</div>
        </div>
        <div class="stat">
          <div class="label">إجمالي البدلات</div>
          <div class="value">${utils.formatMoney(totalAllowances)}</div>
        </div>
        <div class="stat">
          <div class="label">إجمالي التعويضات</div>
          <div class="value">${utils.formatMoney(totalComp)}</div>
        </div>
        <div class="stat">
          <div class="label">نسبة البدلات</div>
          <div class="value">${((totalAllowances / totalComp) * 100).toFixed(1)}%</div>
        </div>
      </div>
    </div>
  `;

  // رسم تفصيل البدلات
  renderAllowanceBreakdownChart(d, allowanceCols);
  renderAllowanceByNationalityChart(d);
}

function renderAllowanceBreakdownChart(data, allowanceCols) {
  const ctx = document.getElementById('chartAllowanceBreakdown');
  if (!ctx || !allowanceCols.length) return;
  
  const totals = allowanceCols.map(col => {
    return utils.sum(data.map(r => r.allowanceBreakdown[col] || 0));
  }).filter(total => total > 0);
  
  const labels = allowanceCols.filter((col, i) => totals[i] > 0);
  
  if (!labels.length) return;
  
  state.charts.allowanceBreakdown = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: totals,
        backgroundColor: [
          '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', 
          '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              const total = totals.reduce((a, b) => a + b, 0);
              const percentage = ((context.parsed / total) * 100).toFixed(1);
              return `${context.label}: ${utils.formatMoney(context.parsed)} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

function renderAllowanceByNationalityChart(data) {
  const ctx = document.getElementById('chartAllowanceByNat');
  if (!ctx) return;
  
  const m = utils.groupBy(data, x => x.nationality || 'غير محدد');
  const natData = [...m.entries()]
    .map(([nat, arr]) => ({
      nat,
      total: utils.sum(arr.map(x => x.allowanceTotal))
    }))
    .filter(item => item.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);
  
  if (!natData.length) return;
  
  const labels = natData.map(item => item.nat);
  const values = natData.map(item => item.total);
  
  state.charts.allowanceByNat = new Chart(ctx, {
    type: 'horizontalBar',
    data: {
      labels,
      datasets: [{
        label: 'إجمالي البدلات',
        data: values,
        backgroundColor: '#f59e0b',
        borderColor: '#d97706',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${utils.formatMoney(context.parsed.x)}`;
            }
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            callback: v => utils.formatMoney(v)
          }
        }
      }
    }
  });
}

// تحليلات متقدمة جديدة
function renderAdvancedAnalytics() {
  // إضافة قسم التحليلات المتقدمة إذا لم يكن موجوداً
  let advancedSection = document.getElementById('advanced-analytics');
  if (!advancedSection) {
    advancedSection = document.createElement('section');
    advancedSection.id = 'advanced-analytics';
    advancedSection.className = 'card';
    advancedSection.innerHTML = `
      <h2>التحليلات المتقدمة</h2>
      <div class="advanced-content">
        <div class="analytics-tabs">
          <button class="tab-btn active" data-tab="correlations">الارتباطات</button>
          <button class="tab-btn" data-tab="trends">الاتجاهات</button>
          <button class="tab-btn" data-tab="insights">الرؤى</button>
        </div>
        <div class="tab-content">
          <div id="correlations-tab" class="tab-panel active"></div>
          <div id="trends-tab" class="tab-panel"></div>
          <div id="insights-tab" class="tab-panel"></div>
        </div>
      </div>
    `;
    document.querySelector('.main').appendChild(advancedSection);
    
    // ربط أحداث التبويبات
    setupAdvancedTabs();
  }
  
  renderCorrelationAnalysis();
  renderTrendAnalysis();
  renderInsights();
}

function setupAdvancedTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');
  
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      
      // إزالة الفئة النشطة من جميع الأزرار والألواح
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));
      
      // إضافة الفئة النشطة للزر واللوح المحددين
      btn.classList.add('active');
      document.getElementById(`${tabId}-tab`).classList.add('active');
    });
  });
}

function renderCorrelationAnalysis() {
  const panel = document.getElementById('correlations-tab');
  if (!panel) return;
  
  const d = state.normalized.filter(r => r.experienceYears > 0 && r.totalComp > 0);
  if (d.length < 2) {
    panel.innerHTML = '<div class="small">بيانات غير كافية لحساب الارتباطات</div>';
    return;
  }
  
  // حساب معامل الارتباط بين الخبرة والراتب
  const expSalaryCorr = calculateCorrelation(
    d.map(r => r.experienceYears),
    d.map(r => r.totalComp)
  );
  
  panel.innerHTML = `
    <div class="correlation-analysis">
      <h3>تحليل الارتباطات</h3>
      <div class="correlation-item">
        <span class="correlation-label">الارتباط بين سنوات الخبرة والراتب:</span>
        <span class="correlation-value ${getCorrelationClass(expSalaryCorr)}">${expSalaryCorr.toFixed(3)}</span>
        <span class="correlation-desc">${getCorrelationDescription(expSalaryCorr)}</span>
      </div>
    </div>
  `;
}

function calculateCorrelation(x, y) {
  const n = x.length;
  const sumX = utils.sum(x);
  const sumY = utils.sum(y);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
  
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  
  return denominator === 0 ? 0 : numerator / denominator;
}

function getCorrelationClass(corr) {
  const abs = Math.abs(corr);
  if (abs >= 0.7) return 'correlation-strong';
  if (abs >= 0.3) return 'correlation-moderate';
  return 'correlation-weak';
}

function getCorrelationDescription(corr) {
  const abs = Math.abs(corr);
  if (abs >= 0.7) return corr > 0 ? 'ارتباط قوي موجب' : 'ارتباط قوي سالب';
  if (abs >= 0.3) return corr > 0 ? 'ارتباط متوسط موجب' : 'ارتباط متوسط سالب';
  return 'ارتباط ضعيف';
}

function renderTrendAnalysis() {
  const panel = document.getElementById('trends-tab');
  if (!panel) return;
  
  panel.innerHTML = `
    <div class="trend-analysis">
      <h3>تحليل الاتجاهات</h3>
      <div class="charts-grid">
        <div class="chart-card">
          <h4>توزيع الخبرة</h4>
          <canvas id="chartExperienceDistribution"></canvas>
        </div>
        <div class="chart-card">
          <h4>توزيع الرواتب</h4>
          <canvas id="chartSalaryDistribution"></canvas>
        </div>
      </div>
    </div>
  `;
  
  // رسم التوزيعات
  setTimeout(() => {
    renderExperienceDistributionChart(state.normalized);
    renderSalaryDistributionChart(state.normalized);
  }, 100);
}

function renderExperienceDistributionChart(data) {
  const ctx = document.getElementById('chartExperienceDistribution');
  if (!ctx) return;
  
  const m = utils.groupBy(data, x => utils.expBucket(x.experienceYears));
  const labels = Array.from(m.keys()).sort();
  const values = labels.map(k => (m.get(k) || []).length);
  
  state.charts.expDistribution = new Chart(ctx, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              const total = values.reduce((a, b) => a + b, 0);
              const percentage = ((context.parsed / total) * 100).toFixed(1);
              return `${context.label}: ${context.parsed} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

function renderSalaryDistributionChart(data) {
  const ctx = document.getElementById('chartSalaryDistribution');
  if (!ctx) return;
  
  // تجميع الرواتب في نطاقات
  const salaries = data.map(r => r.totalComp).filter(s => s > 0).sort((a, b) => a - b);
  const min = Math.min(...salaries);
  const max = Math.max(...salaries);
  const range = max - min;
  const bucketSize = range / 5;
  
  const buckets = [];
  for (let i = 0; i < 5; i++) {
    const start = min + (i * bucketSize);
    const end = i === 4 ? max : start + bucketSize;
    const count = salaries.filter(s => s >= start && s <= end).length;
    buckets.push({
      label: `${utils.formatMoney(start)} - ${utils.formatMoney(end)}`,
      count
    });
  }
  
  state.charts.salaryDistribution = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: buckets.map(b => b.label),
      datasets: [{
        label: 'عدد الموظفين',
        data: buckets.map(b => b.count),
        backgroundColor: '#3b82f6',
        borderColor: '#2563eb',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  });
}

function renderInsights() {
  const panel = document.getElementById('insights-tab');
  if (!panel) return;
  
  const d = state.normalized;
  const insights = generateInsights(d);
  
  panel.innerHTML = `
    <div class="insights-analysis">
      <h3>الرؤى والتوصيات</h3>
      <div class="insights-list">
        ${insights.map(insight => `
          <div class="insight-item ${insight.type}">
            <div class="insight-icon">${getInsightIcon(insight.type)}</div>
            <div class="insight-content">
              <h4>${insight.title}</h4>
              <p>${insight.description}</p>
              ${insight.recommendation ? `<div class="insight-recommendation">${insight.recommendation}</div>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function generateInsights(data) {
  const insights = [];
  
  if (!data.length) return insights;
  
  // تحليل التوزيع الجنسي
  const genderDist = utils.groupBy(data, x => x.gender);
  const genderRatio = genderDist.get('M')?.length / data.length || 0;
  
  if (genderRatio > 0.8) {
    insights.push({
      type: 'warning',
      title: 'عدم توازن في التوزيع الجنسي',
      description: `نسبة الذكور ${(genderRatio * 100).toFixed(1)}% من إجمالي الموظفين`,
      recommendation: 'يُنصح بزيادة التنوع الجنسي في التوظيف'
    });
  }
  
  // تحليل فجوة الرواتب
  const maleAvg = utils.mean(genderDist.get('M')?.map(x => x.totalComp) || []);
  const femaleAvg = utils.mean(genderDist.get('F')?.map(x => x.totalComp) || []);
  
  if (maleAvg > 0 && femaleAvg > 0) {
    const gapPercentage = ((maleAvg - femaleAvg) / femaleAvg * 100);
    if (Math.abs(gapPercentage) > 10) {
      insights.push({
        type: gapPercentage > 0 ? 'warning' : 'info',
        title: 'فجوة في الرواتب بين الجنسين',
        description: `الفرق في متوسط الرواتب: ${Math.abs(gapPercentage).toFixed(1)}%`,
        recommendation: 'مراجعة هيكل الرواتب لضمان العدالة'
      });
    }
  }
  
  // تحليل الخبرة
  const avgExp = utils.mean(data.map(x => x.experienceYears));
  if (avgExp < 3) {
    insights.push({
      type: 'info',
      title: 'قوة عمل شابة',
      description: `متوسط سنوات الخبرة: ${avgExp.toFixed(1)} سنة`,
      recommendation: 'الاستثمار في برامج التدريب والتطوير'
    });
  } else if (avgExp > 10) {
    insights.push({
      type: 'success',
      title: 'قوة عمل ذات خبرة عالية',
      description: `متوسط سنوات الخبرة: ${avgExp.toFixed(1)} سنة`,
      recommendation: 'الاستفادة من الخبرات في برامج الإرشاد'
    });
  }
  
  // تحليل التنوع الجنسياتي
  const nationalityCount = new Set(data.map(x => x.nationality)).size;
  if (nationalityCount > 5) {
    insights.push({
      type: 'success',
      title: 'تنوع جنسياتي عالي',
      description: `${nationalityCount} جنسية مختلفة`,
      recommendation: 'الاستفادة من التنوع الثقافي في الابتكار'
    });
  }
  
  return insights;
}

function getInsightIcon(type) {
  const icons = {
    success: '✅',
    warning: '⚠️',
    info: 'ℹ️',
    error: '❌'
  };
  return icons[type] || 'ℹ️';
}

// إضافة أزرار التصدير والطباعة
function addExportButtons() {
  const sections = ['all-employees', 'by-dept', 'by-nat', 'by-gender'];
  
  sections.forEach(sectionId => {
    const section = document.getElementById(sectionId);
    if (!section) return;
    
    let toolbar = section.querySelector('.section-toolbar');
    if (!toolbar) {
      toolbar = document.createElement('div');
      toolbar.className = 'section-toolbar';
      section.insertBefore(toolbar, section.firstChild.nextSibling);
    }
    
    toolbar.innerHTML = `
      <div class="toolbar-buttons">
        <button class="btn btn-export" onclick="exportSectionData('${sectionId}')">
          📊 تصدير البيانات
        </button>
        <button class="btn btn-print" onclick="utils.printReport('${sectionId}')">
          🖨️ طباعة
        </button>
      </div>
    `;
  });
}

// تصدير بيانات القسم
function exportSectionData(sectionId) {
  const d = state.normalized;
  let data = [];
  let filename = 'employee_data.csv';
  
  switch (sectionId) {
    case 'all-employees':
      data = d.map(r => ({
        'الاسم': r.name,
        'المسمى الوظيفي': r.jobTitle,
        'القسم': r.department,
        'الجنسية': r.nationality,
        'الجنس': r.gender,
        'سنوات الخبرة': r.experienceYears,
        'الراتب الأساسي': r.baseSalary,
        'إجمالي البدلات': r.allowanceTotal,
        'إجمالي الراتب': r.totalComp
      }));
      filename = 'all_employees.csv';
      break;
      
    case 'by-dept':
      const deptMap = utils.groupBy(d, x => x.department || 'غير محدد');
      data = [...deptMap.entries()].map(([dept, arr]) => ({
        'القسم': dept,
        'عدد الموظفين': arr.length,
        'متوسط الراتب الأساسي': utils.mean(arr.map(x => x.baseSalary)).toFixed(2),
        'متوسط البدلات': utils.mean(arr.map(x => x.allowanceTotal)).toFixed(2),
        'متوسط إجمالي الراتب': utils.mean(arr.map(x => x.totalComp)).toFixed(2)
      }));
      filename = 'department_analysis.csv';
      break;
      
    // إضافة حالات أخرى حسب الحاجة
  }
  
  if (data.length) {
    utils.exportToCSV(data, filename);
  }
}

// تهيئة التطبيق
document.addEventListener('DOMContentLoaded', () => {
  // تحميل البيانات النموذجية إذا كانت متاحة
  loadDefaultExcel();
  
  // إضافة أزرار التصدير
  setTimeout(addExportButtons, 1000);
  
  // إعداد اختصارات لوحة المفاتيح
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'e':
          e.preventDefault();
          exportSectionData('all-employees');
          break;
        case 'p':
          e.preventDefault();
          utils.printReport('all-employees');
          break;
      }
    }
  });
});

// تصدير الدوال للاستخدام العام
window.exportSectionData = exportSectionData;
window.utils = utils;
window.state = state;