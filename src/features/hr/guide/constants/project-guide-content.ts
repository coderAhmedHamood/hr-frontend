import type { GuideCategory, GuidePage } from '@/features/hr/guide/types';

export const GUIDE_CATEGORIES: GuideCategory[] = [
  { id: 'prologue', label: 'المقدمة' },
  { id: 'organization', label: 'الهيكل التنظيمي' },
  { id: 'attendance', label: 'الحضور والانصراف' },
  { id: 'leaves', label: 'الإجازات' },
  { id: 'requests', label: 'الطلبات والموافقات' },
  { id: 'discipline', label: 'الانضباط الوظيفي' },
  { id: 'payroll', label: 'الرواتب والعقود' },
  { id: 'recruitment', label: 'التوظيف' },
  { id: 'settings', label: 'الإعدادات والصلاحيات' },
  { id: 'usage', label: 'الاستخدام اليومي' },
];

export const GUIDE_PAGES: GuidePage[] = [
  // ─── المقدمة ─────────────────────────────────────────────────────────────
  {
    slug: 'introduction',
    title: 'مقدمة — لماذا الترتيب مهم؟',
    categoryId: 'prologue',
    why: 'النظام مبني على علاقات بين البيانات: لا يمكن ربط موظف بفرع غير موجود، ولا يمكن اعتماد طلب دون إسناد موافقة، ولا تسجيل مخالفة دون نوع مخالفة معرّف مسبقاً.',
    blocks: [
      {
        id: 'overview',
        title: 'نظرة عامة',
        paragraphs: [
          'دليل روز للموارد البشرية موجّه لمستخدمي النظام (مدير الموارد البشرية، مسؤول التهيئة، المعتمدون). الهدف هو شرح سبب كل خطوة تهيئة وترتيبها قبل الانتقال للخطوة التالية.',
          'اتبع الأقسام في الشريط الجانبي من الأعلى إلى الأسفل عند إطلاق شركة جديدة أو عند تدقيق إعدادات قائمة.',
        ],
      },
      {
        id: 'setup-order',
        title: 'ترتيب التهيئة الموصى به',
        paragraphs: ['نفّذ كل قسم بالترتيب التالي قبل الانتقال للقسم الذي يليه:'],
      },
      {
        id: 'setup-organization',
        title: 'الهيكل التنظيمي',
        bullets: [
          'الفروع',
          'الأقسام',
          'المسميات الوظيفية',
          'الموظفون',
        ],
      },
      {
        id: 'setup-attendance',
        title: 'الحضور والانصراف',
        bullets: [
          'قوالب الشفت',
          'نقاط التسجيل',
          'ربط الشفتات بالموظفين',
          'ربط النقاط بالموظفين',
        ],
      },
      {
        id: 'setup-leaves',
        title: 'الإجازات',
        bullets: [
          'أنواع الإجازات',
          'العطل الرسمية',
          'أرصدة الإجازات',
        ],
      },
      {
        id: 'setup-requests',
        title: 'الطلبات والموافقات',
        bullets: [
          'أنواع الطلبات',
          'إسناد الموافقة',
          'طلبات تصحيح الحضور',
          'طلبات الإجازات',
          'سلف الموظفين',
        ],
      },
      {
        id: 'setup-discipline',
        title: 'الانضباط الوظيفي',
        bullets: [
          'أنواع المخالفات',
          'سجل المخالفات',
        ],
      },
      {
        id: 'setup-other',
        title: 'الرواتب والتوظيف والإعدادات',
        bullets: [
          'عقود العمل وفترات الرواتب',
          'التوظيف',
          'الصلاحيات وإعدادات الموارد البشرية',
        ],
        note: 'تخطّي خطوة مبكراً قد يمنع حفظ السجل التالي أو يجعل الموافقات والطلبات لا تعمل كما هو متوقع.',
      },
      {
        id: 'who',
        title: 'من يهيّئ ماذا؟',
        paragraphs: [
          'مسؤول النظام أو مدير الموارد البشرية يُكمل التهيئة الأساسية (هيكل، حضور، أنواع، موافقات).',
          'المديرون المعتمدون يراجعون الطلبات من نافذة التفاصيل بعد اكتمال إسناد الموافقة.',
          'الموظفون يقدّمون الطلبات بعد أن تكون الأنواع والمسارات جاهزة.',
        ],
      },
    ],
    relatedSlugs: ['branches'],
  },

  // ─── الهيكل التنظيمي ─────────────────────────────────────────────────────
  {
    slug: 'branches',
    title: 'الفروع',
    categoryId: 'organization',
    why: 'الموظف ينتمي لفرع؛ الحضور والطلبات والتقارير تُفلتر حسب الفرع. يجب تعريف الفروع قبل الموظفين.',
    prerequisites: [],
    systemHref: '/hr/organization/branches',
    systemHrefLabel: 'فتح صفحة الفروع',
    blocks: [
      {
        id: 'purpose',
        title: 'الغرض',
        paragraphs: [
          'تمثيل المواقع الجغرافية أو الوحدات التشغيلية (فرع الرياض، فرع جدة، المقر الرئيسي). الفرع يُستخدم لاحقاً في تعيين الموظف وتبديل السياق من قائمة المستخدم.',
        ],
      },
      {
        id: 'fields',
        title: 'الحقول الرئيسية',
        fields: [
          { name: 'اسم الفرع', description: 'اسم واضح للمستخدمين، مثل: فرع الرياض.', required: true },
          { name: 'المدينة', description: 'المدينة التي يقع فيها الفرع.', required: true },
          { name: 'مدير الفرع', description: 'موظف مسؤول (يُربط بعد وجود موظفين — يمكن تحديثه لاحقاً).', required: false },
          { name: 'المقر الرئيسي', description: 'يُميّز الفرع الرئيسي للشركة عند الحاجة.', required: false },
          { name: 'نشط', description: 'إخفاء الفرع من القوائم دون حذف سجلاته التاريخية.', required: false },
        ],
      },
    ],
    relatedSlugs: ['departments'],
  },
  {
    slug: 'departments',
    title: 'الأقسام',
    categoryId: 'organization',
    why: 'تصنيف الموظفين والطلبات والتقارير حسب الهيكل الإداري. يُفضّل إنشاء الأقسام قبل إدخال الموظفين.',
    prerequisites: ['الفروع'],
    systemHref: '/hr/organization/departments',
    systemHrefLabel: 'فتح صفحة الأقسام',
    blocks: [
      {
        id: 'purpose',
        title: 'الغرض',
        paragraphs: [
          'بناء شجرة أقسام (إدارة الموارد البشرية، المالية، العمليات…) مع إمكانية قسم رئيسي وأقسام فرعية.',
        ],
      },
      {
        id: 'fields',
        title: 'الحقول الرئيسية',
        fields: [
          { name: 'اسم القسم (عربي)', description: 'الاسم الظاهر في الملف الوظيفي والتقارير.', required: true },
          { name: 'القسم الأب', description: 'لربط القسم بهيكل تنظيمي هرمي.', required: false },
          { name: 'ترتيب العرض', description: 'يحدد ترتيب الظهور في القوائم.', required: false },
          { name: 'نشط', description: 'الأقسام غير النشطة لا تُختار في النماذج الجديدة.', required: true },
        ],
      },
    ],
    relatedSlugs: ['job-titles'],
  },
  {
    slug: 'job-titles',
    title: 'المسميات الوظيفية',
    categoryId: 'organization',
    why: 'كل موظف يحتاج مسمى وظيفي في تعيينه الوظيفي والعقد. تعريف المسميات مسبقاً يوحّد البيانات.',
    prerequisites: [],
    systemHref: '/hr/organization/job-titles',
    systemHrefLabel: 'فتح المسميات الوظيفية',
    blocks: [
      {
        id: 'fields',
        title: 'الحقول الرئيسية',
        fields: [
          { name: 'اسم المسمى (عربي)', description: 'مثل: محاسب، مدير موارد بشرية.', required: true },
          { name: 'الرمز', description: 'معرّف قصير للتكامل والتقارير.', required: false },
          { name: 'نشط', description: 'إيقاف المسمى يمنع اختياره في التعيينات الجديدة.', required: true },
        ],
      },
    ],
    relatedSlugs: ['employees'],
  },
  {
    slug: 'employees',
    title: 'الموظفون',
    categoryId: 'organization',
    why: 'الموظف هو محور الحضور والإجازات والطلبات والرواتب والمخالفات. لا تُنشأ هذه السجلات قبل وجود فرع وقسم ومسمى.',
    prerequisites: ['فروع', 'أقسام', 'مسميات وظيفية'],
    systemHref: '/hr/organization/employees',
    systemHrefLabel: 'فتح سجل الموظفين',
    blocks: [
      {
        id: 'purpose',
        title: 'الغرض',
        paragraphs: [
          'سجل الموظف يجمع البيانات الشخصية، التعيين (فرع، قسم، مسمى)، وحساب الدخول إن وُجد. المعتمدون في مسارات الموافقة يُختارون من سجل الموظفين.',
        ],
      },
      {
        id: 'fields',
        title: 'الحقول الأساسية عند الإنشاء',
        fields: [
          { name: 'الاسم (عربي)', description: 'الاسم الكامل كما يظهر في النظام.', required: true },
          { name: 'رقم الموظف / المعرف', description: 'معرّف فريد داخل الشركة.', required: true },
          { name: 'الفرع', description: 'يجب أن يكون الفرع مُعرَّفاً مسبقاً.', required: true },
          { name: 'القسم', description: 'يربط الموظف بالهيكل الإداري.', required: true },
          { name: 'المسمى الوظيفي', description: 'من قائمة المسميات المُهيّأة.', required: true },
          { name: 'تاريخ التعيين', description: 'مرجع للخدمة والتقارير.', required: false },
          { name: 'الحالة', description: 'نشط / منتهي — يؤثر على ظهوره في القوائم.', required: true },
        ],
      },
      {
        id: 'link-user',
        title: 'ربط المستخدم',
        paragraphs: [
          'لتمكين الموظف من الدخول والموافقة على الطلبات، يُربط حسابه بمستخدم النظام. المعتمدون في إسناد الموافقة يجب أن يكونوا موظفين معرّفين.',
        ],
      },
    ],
    relatedSlugs: ['shift-templates'],
  },

  // ─── الحضور ──────────────────────────────────────────────────────────────
  {
    slug: 'shift-templates',
    title: 'قوالب الشفت',
    categoryId: 'attendance',
    why: 'تحدد أوقات الدوام الرسمية (دخول، خروج، استراحة). بدون شفت لا يُحسب الحضور ولا تُقبل طلبات التصحيح بمعنى واضح.',
    prerequisites: ['الهيكل التنظيمي الأساسي'],
    systemHref: '/hr/attendance/templates',
    systemHrefLabel: 'فتح قوالب الشفت',
    blocks: [
      {
        id: 'purpose',
        title: 'الغرض',
        paragraphs: [
          'تعريف نمط دوام (صباحي، مسائي، دوام مرن) مع فترات الحضور والانصراف. يُربط لاحقاً بالموظف عبر «ربط الشفتات».',
        ],
      },
      {
        id: 'fields',
        title: 'الحقول الرئيسية',
        fields: [
          { name: 'اسم القالب', description: 'مثل: دوام إداري 8–4.', required: true },
          { name: 'فترات الشفت', description: 'وقت البداية والنهاية لكل فترة ضمن اليوم.', required: true },
          { name: 'نشط', description: 'القوالب غير النشطة لا تُسند لموظفين جدد.', required: true },
        ],
      },
    ],
    relatedSlugs: ['checkpoints'],
  },
  {
    slug: 'checkpoints',
    title: 'نقاط التسجيل',
    categoryId: 'attendance',
    why: 'أماكن أو أجهزة تسجيل الحضور (بوابة، تطبيق، موقع). تُربط بالموظف لمعرفة من أين سُجّل الدخول.',
    prerequisites: ['قوالب الشفت'],
    systemHref: '/hr/attendance/checkpoints',
    systemHrefLabel: 'فتح نقاط التسجيل',
    blocks: [
      {
        id: 'fields',
        title: 'الحقول الرئيسية',
        fields: [
          { name: 'اسم النقطة', description: 'مثل: بوابة المبنى الرئيسي.', required: true },
          { name: 'النوع / الموقع', description: 'حسب إعداد النظام (ثابت، جوال، …).', required: false },
          { name: 'نشط', description: 'تعطيل النقطة يمنع التسجيل منها.', required: true },
        ],
      },
    ],
    relatedSlugs: ['shift-assignment'],
  },
  {
    slug: 'shift-assignment',
    title: 'ربط الشفتات بالموظفين',
    categoryId: 'attendance',
    why: 'يربط كل موظف بقالب شفت فعّال؛ بدون هذا الربط لن يُقارن الحضور الفعلي بالدوام المتوقع.',
    prerequisites: ['موظفون', 'قوالب شفت'],
    systemHref: '/hr/attendance/assignment',
    systemHrefLabel: 'فتح ربط الشفتات',
    blocks: [
      {
        id: 'fields',
        title: 'ما الذي تُدخله؟',
        fields: [
          { name: 'الموظف', description: 'من السجل النشط.', required: true },
          { name: 'قالب الشفت', description: 'من القوالب المُفعّلة.', required: true },
          { name: 'تاريخ البداية', description: 'متى يبدأ تطبيق هذا الشفت على الموظف.', required: true },
        ],
      },
    ],
    relatedSlugs: ['checkpoint-links'],
  },
  {
    slug: 'checkpoint-links',
    title: 'ربط النقاط بالموظفين',
    categoryId: 'attendance',
    why: 'يحدد من أي نقاط يُسمح للموظف بتسجيل الحضور.',
    prerequisites: ['موظفون', 'نقاط تسجيل'],
    systemHref: '/hr/attendance/checkpoint-links',
    systemHrefLabel: 'فتح ربط النقاط',
    blocks: [
      {
        id: 'purpose',
        title: 'الغرض',
        paragraphs: ['بعد اكتمال الربط يبدأ تدفق أحداث الحضور وملخص اليوم في «كشف الحضور».'],
      },
    ],
    relatedSlugs: ['leave-types'],
  },

  // ─── الإجازات ────────────────────────────────────────────────────────────
  {
    slug: 'leave-types',
    title: 'أنواع الإجازات',
    categoryId: 'leaves',
    why: 'عند تقديم طلب إجازة يجب اختيار نوع (سنوية، مرضية، …). بدون أنواع معرّفة لا يُنشأ طلب إجازة صحيح.',
    prerequisites: [],
    systemHref: '/hr/leaves/leave-types',
    systemHrefLabel: 'فتح أنواع الإجازات',
    blocks: [
      {
        id: 'fields',
        title: 'الحقول الرئيسية',
        fields: [
          { name: 'اسم النوع (عربي)', description: 'مثل: إجازة سنوية.', required: true },
          { name: 'الرمز', description: 'يُستخدم في التقارير والربط مع الطلبات.', required: true },
          { name: 'مدفوعة / غير مدفوعة', description: 'يؤثر على الرواتب والسياسات.', required: false },
          { name: 'نشط', description: 'الأنواع غير النشطة لا تظهر عند إنشاء طلب جديد.', required: true },
        ],
      },
    ],
    relatedSlugs: ['public-holidays'],
  },
  {
    slug: 'public-holidays',
    title: 'العطل الرسمية',
    categoryId: 'leaves',
    why: 'تُستثنى من احتساب أيام العمل وتؤثر على أرصدة الإجازات وملخص الحضور.',
    prerequisites: ['أنواع الإجازات'],
    systemHref: '/hr/leaves/public-holidays',
    systemHrefLabel: 'فتح العطل الرسمية',
    blocks: [
      {
        id: 'fields',
        title: 'الحقول الرئيسية',
        fields: [
          { name: 'اسم العطلة', description: 'مثل: عيد الفطر.', required: true },
          { name: 'تاريخ البداية / النهاية', description: 'نطاق أيام العطلة.', required: true },
          { name: 'سنوي متكرر', description: 'إن كان يتكرر كل عام بنفس التاريخ الهجري/الميلادي حسب الإعداد.', required: false },
        ],
      },
    ],
    relatedSlugs: ['leave-balance'],
  },
  {
    slug: 'leave-balance',
    title: 'أرصدة الإجازات',
    categoryId: 'leaves',
    why: 'الموظف لا يستطيع أخذ إجازة سنوية إن لم يكن لديه رصيد. تُضاف الأرصدة بعد تعريف الأنواع.',
    prerequisites: ['أنواع الإجازات', 'موظفون'],
    systemHref: '/hr/leaves/balance-credit',
    systemHrefLabel: 'فتح إضافة رصيد إجازات',
    blocks: [
      {
        id: 'purpose',
        title: 'الغرض',
        paragraphs: [
          'إضافة أو تعديل رصيد موظف لنوع إجازة معيّن (مثلاً 30 يوماً سنوياً). يُراجع الرصيد من صفحة التحليلات قبل اعتماد طلبات طويلة.',
        ],
      },
    ],
    relatedSlugs: ['request-types'],
  },

  // ─── الطلبات والموافقات ──────────────────────────────────────────────────
  {
    slug: 'request-types',
    title: 'أنواع الطلبات',
    categoryId: 'requests',
    why: 'كل طلب (تصحيح حضور، سلفة…) يحتاج نوعاً مسجلاً. تصنيف النوع (حضور / سلف) يحدد أين يظهر ولاحقاً مع أي إسناد موافقة يُربط.',
    prerequisites: ['الهيكل التنظيمي'],
    systemHref: '/hr/requests/request-types',
    systemHrefLabel: 'فتح أنواع الطلبات',
    blocks: [
      {
        id: 'categories',
        title: 'التصنيفات المتاحة',
        paragraphs: [
          'في إعداد أنواع الطلبات يُستخدم التصنيف لتمييز الغرض. إسناد الموافقة يعمل على مستوى فئات: إجازة (leave)، حضور (attendance)، سلف (advance).',
        ],
        bullets: [
          'حضور — لطلبات تصحيح الحضور والانصراف',
          'سلف — مرتبط بسلف الموظفين (إن وُجد نوع طلب للسلف)',
          'الإجازات تستخدم أنواع إجازات منفصلة + طلبات الإجازات',
        ],
      },
      {
        id: 'fields',
        title: 'الحقول الرئيسية',
        fields: [
          { name: 'اسم نوع الطلب (عربي)', description: 'مثل: تصحيح حضور وانصراف.', required: true },
          { name: 'التصنيف', description: 'حضور أو سلف — يحدد مسار الموافقة لاحقاً.', required: true },
          { name: 'ترتيب العرض', description: 'ترتيب الظهور في القوائم.', required: false },
          { name: 'نشط', description: 'الأنواع غير النشطة لا تُختار في طلبات جديدة.', required: true },
        ],
      },
      {
        id: 'before-approval',
        title: 'قبل إسناد الموافقة',
        paragraphs: [
          'أنشئ على الأقل نوع طلب واحد لتصحيح الحضور (تصنيف حضور) قبل الانتقال لصفحة إسناد الموافقة. بدون أنواع لن يكون للإسناد معنى عملي.',
        ],
      },
    ],
    relatedSlugs: ['approval-assignment'],
  },
  {
    slug: 'approval-assignment',
    title: 'إسناد الموافقة',
    categoryId: 'requests',
    why: 'يحدد من يوافق على طلبات الحضور والإجازات والسلف وبأي ترتيب. بدون إسناد نشط لن تظهر أزرار الموافقة للمعتمدين ولن يُرسل مسار المعتمدين (approverStates) بشكل صحيح.',
    prerequisites: ['موظفون (كمعتمدين)', 'أنواع الطلبات / فئات الطلبات'],
    systemHref: '/hr/requests/approval-assignment',
    systemHrefLabel: 'فتح إسناد الموافقة',
    blocks: [
      {
        id: 'categories',
        title: 'فئات الإسناد',
        paragraphs: [
          'يُنشأ إسناد منفصل (أو حسب سياسة الشركة) لكل فئة: attendance للحضور، leave للإجازات، advance للسلف.',
        ],
        bullets: [
          'attendance — طلبات تصحيح الحضور',
          'leave — طلبات الإجازات',
          'advance — سلف الموظفين',
        ],
      },
      {
        id: 'fields',
        title: 'الحقول الرئيسية',
        fields: [
          { name: 'فئة الطلب', description: 'leave | attendance | advance — تُرسل للنظام عند جلب المعتمدين.', required: true },
          { name: 'أنواع الطلبات المشمولة', description: 'ربط الإسناد بأنواع طلبات محددة ضمن الفئة.', required: true },
          { name: 'المعتمدون', description: 'موظفون من السجل — ترتيبهم مهم في الوضع التتابعي.', required: true },
          { name: 'نمط الموافقة', description: 'تتابعي: واحد بعد الآخر. متوازٍ: معاً. موافقة أحد المعتمدين: يكفي موافقة واحدة.', required: true },
          { name: 'نشط', description: 'الإسناد غير النشط يمنع اعتماد الطلبات في هذه الفئة.', required: true },
        ],
      },
      {
        id: 'flow',
        title: 'كيف تعمل الموافقة بعد التهيئة؟',
        paragraphs: [
          'عند فتح تفاصيل طلب قيد الانتظار، يُعرض مسار المعتمدين. المعتمد الحالي فقط يرى أزرار الموافقة والرفض. عند الموافقة يُحدَّث مسار المعتمدين ويُرسل للخادم مع القرار.',
        ],
        note: 'الموافقة تتم من نافذة تفاصيل الطلب بعد الضغط عليه — وليس من صف القائمة مباشرة.',
      },
    ],
    relatedSlugs: ['attendance-corrections'],
  },
  {
    slug: 'attendance-corrections',
    title: 'طلبات تصحيح الحضور',
    categoryId: 'requests',
    why: 'بعد تهيئة الحضور وأنواع الطلبات وإسناد موافقة فئة attendance يستطيع الموظف تقديم تصحيح والمعتمدون اعتماده.',
    prerequisites: ['أنواع طلبات (حضور)', 'إسناد موافقة attendance', 'شفتات وموظفون'],
    systemHref: '/hr/requests/attendance-corrections',
    systemHrefLabel: 'فتح طلبات تصحيح الحضور',
    blocks: [
      {
        id: 'fields',
        title: 'حقول الطلب',
        fields: [
          { name: 'الموظف', description: 'صاحب التصحيح.', required: true },
          { name: 'نوع الطلب', description: 'من أنواع تصنيف حضور.', required: true },
          { name: 'تاريخ اليوم', description: 'اليوم المطلوب تصحيحه.', required: true },
          { name: 'حضور / انصراف مصحح', description: 'الأوقات الصحيحة المطلوب اعتمادها.', required: false },
          { name: 'السبب', description: 'تبرير التصحيح للمعتمد.', required: false },
        ],
      },
      {
        id: 'approval',
        title: 'الاعتماد',
        paragraphs: [
          'اضغط على الطلب لفتح التفاصيل. إن كنت المعتمد التالي في المسار ستظهر موافقة/رفض. بعد اكتمال جميع المعتمدين يصبح الطلب «معتمداً».',
        ],
      },
    ],
    relatedSlugs: ['leave-requests'],
  },
  {
    slug: 'leave-requests',
    title: 'طلبات الإجازات',
    categoryId: 'requests',
    why: 'تجميع طلبات الإجازة واعتمادها عبر مسار فئة leave.',
    prerequisites: ['أنواع إجازات', 'أرصدة', 'إسناد موافقة leave'],
    systemHref: '/hr/requests/unified-management',
    systemHrefLabel: 'فتح إدارة طلبات الإجازات',
    blocks: [
      {
        id: 'fields',
        title: 'حقول الطلب',
        fields: [
          { name: 'الموظف', description: 'مقدّم الطلب.', required: true },
          { name: 'نوع الإجازة', description: 'من أنواع الإجازات المُفعّلة.', required: true },
          { name: 'من / إلى', description: 'نطاق التواريخ.', required: true },
          { name: 'أيام العمل', description: 'يُحسب تلقائياً أو يُدخل حسب السياسة.', required: false },
          { name: 'السبب', description: 'اختياري أو إلزامي حسب سياسة الشركة.', required: false },
        ],
      },
    ],
    relatedSlugs: ['employee-advances'],
  },
  {
    slug: 'employee-advances',
    title: 'سلف الموظفين',
    categoryId: 'requests',
    why: 'تسجيل السلف واعتمادها عبر مسار فئة advance.',
    prerequisites: ['موظفون', 'إسناد موافقة advance'],
    systemHref: '/hr/requests/employee-advances',
    systemHrefLabel: 'فتح سلف الموظفين',
    blocks: [
      {
        id: 'fields',
        title: 'حقول السلفة',
        fields: [
          { name: 'الموظف', description: 'مستفيد السلفة.', required: true },
          { name: 'المبلغ والعملة', description: 'إجمالي السلفة.', required: true },
          { name: 'تاريخ السلفة', description: 'تاريخ الاستحقاق أو الصرف.', required: true },
          { name: 'نوع السلفة', description: 'شخصي، سكني، عاجل…', required: true },
          { name: 'آلية السداد', description: 'عدد أشهر أو قسط شهري محدد.', required: true },
          { name: 'الحالة', description: 'مسودة ← قيد الموافقة ← معتمد ← قيد السداد…', required: true },
        ],
      },
    ],
    relatedSlugs: ['violation-types'],
  },

  // ─── الانضباط ────────────────────────────────────────────────────────────
  {
    slug: 'violation-types',
    title: 'أنواع المخالفات',
    categoryId: 'discipline',
    why: 'قبل تسجيل أي مخالفة يجب تعريف نوعها (تأخر، غياب بدون عذر، …) وربطها بسياسة الجزاء. لا تُسجّل مخالفات قبل الأنواع.',
    prerequisites: ['الهيكل التنظيمي'],
    systemHref: '/hr/discipline/violation-types',
    systemHrefLabel: 'فتح أنواع المخالفات',
    blocks: [
      {
        id: 'fields',
        title: 'الحقول الرئيسية',
        fields: [
          { name: 'اسم النوع (عربي)', description: 'وصف المخالفة للمستخدمين.', required: true },
          { name: 'الدرجة / الخطورة', description: 'تصنيف يؤثر على الجزاء والموافقات.', required: false },
          { name: 'نشط', description: 'الأنواع غير النشطة لا تُستخدم في قضايا جديدة.', required: true },
        ],
      },
    ],
    relatedSlugs: ['violation-cases'],
  },
  {
    slug: 'violation-cases',
    title: 'سجل المخالفات',
    categoryId: 'discipline',
    why: 'تسجيل حالة مخالفة على موظف وربطها بنوع مُعرَّف مسبقاً، ثم إنذار أو جزاء أو تظلم.',
    prerequisites: ['أنواع المخالفات', 'موظفون', 'إسناد موافقة الانضباط (إن وُجد)'],
    systemHref: '/hr/discipline/violation-cases',
    systemHrefLabel: 'فتح سجل المخالفات',
    blocks: [
      {
        id: 'fields',
        title: 'حقول القضية',
        fields: [
          { name: 'الموظف', description: 'الموظف المخالف.', required: true },
          { name: 'نوع المخالفة', description: 'من أنواع المخالفات — إلزامي.', required: true },
          { name: 'تاريخ الواقعة', description: 'متى حدثت المخالفة.', required: true },
          { name: 'الوصف / الملاحظات', description: 'تفاصيل للمراجعة والاعتماد.', required: false },
          { name: 'الحالة', description: 'قيد المراجعة، معتمد، مرفوض…', required: true },
        ],
      },
      {
        id: 'approval',
        title: 'موافقة المخالفات',
        paragraphs: [
          'مسار موافقة الانضباط منفصل عن طلبات الحضور والإجازات. يُعرّف من صفحة إسناد موافقات الانضباط ويُربط بنوع المخالفة.',
        ],
      },
    ],
    relatedSlugs: ['employment-contracts'],
  },

  // ─── الرواتب ─────────────────────────────────────────────────────────────
  {
    slug: 'employment-contracts',
    title: 'عقود العمل',
    categoryId: 'payroll',
    why: 'يربط الموظف ببنود الراتب والبدلات قبل تشغيل دورة رواتب.',
    prerequisites: ['موظفون', 'أنواع بدلات (إن وُجدت)'],
    systemHref: '/hr/contracts/employment',
    systemHrefLabel: 'فتح عقود العمل',
    blocks: [
      {
        id: 'fields',
        title: 'حقول أساسية',
        fields: [
          { name: 'الموظف', description: 'صاحب العقد.', required: true },
          { name: 'تاريخ البداية / النهاية', description: 'مدة العقد.', required: true },
          { name: 'الراتب الأساسي', description: 'أساس احتساب الرواتب.', required: true },
          { name: 'البدلات', description: 'من دليل أنواع البدلات.', required: false },
        ],
      },
    ],
    relatedSlugs: ['payroll-periods'],
  },
  {
    slug: 'payroll-periods',
    title: 'فترات الرواتب',
    categoryId: 'payroll',
    why: 'تجميع احتساب الرواتب شهرياً واعتماد كشوف الصرف.',
    prerequisites: ['عقود عمل', 'موظفون نشطون'],
    systemHref: '/hr/payroll/payroll-periods',
    systemHrefLabel: 'فتح فترات الرواتب',
    blocks: [
      {
        id: 'purpose',
        title: 'الغرض',
        paragraphs: [
          'فتح فترة رواتب لشهر معيّن، إدخال الاستقطاعات والإضافات، ثم اعتماد الكشف وإشعار الموظفين.',
        ],
      },
    ],
    relatedSlugs: ['recruitment-jobs'],
  },

  // ─── التوظيف ─────────────────────────────────────────────────────────────
  {
    slug: 'recruitment-jobs',
    title: 'التوظيف — الوظائف والمتقدمون',
    categoryId: 'recruitment',
    why: 'وحدة مستقلة لإدارة الشواغر ونماذج التقديم ومسار المتقدم حتى التعيين.',
    systemHref: '/hr/recruitment/ats-admin',
    systemHrefLabel: 'فتح إدارة الوظائف',
    blocks: [
      {
        id: 'steps',
        title: 'خطوات التهيئة',
        bullets: [
          'إنشاء وظيفة ونموذج تقديم',
          'تعريف مراحل المسار (Pipeline)',
          'نشر رابط التقديم للمتقدمين',
          'متابعة المتقدمين ونقلهم بين المراحل',
          'عند التعيين: إنشاء سجل موظف في الهيكل التنظيمي',
        ],
      },
    ],
    relatedSlugs: ['permissions'],
  },

  // ─── الإعدادات ───────────────────────────────────────────────────────────
  {
    slug: 'permissions',
    title: 'الصلاحيات والأدوار',
    categoryId: 'settings',
    why: 'تحديد من يرى أي صفحة ومن يستطيع التهيئة مقابل الاعتماد فقط.',
    systemHref: '/hr/permissions/roles',
    systemHrefLabel: 'فتح الأدوار والصلاحيات',
    blocks: [
      {
        id: 'purpose',
        title: 'الغرض',
        paragraphs: [
          'بعد اكتمال التهيئة، امنح صلاحيات التهيئة لفريق الموارد البشرية وصلاحيات الاعتماد للمديرين دون خلط الأدوار.',
        ],
      },
    ],
    relatedSlugs: ['settings-hr'],
  },
  {
    slug: 'settings-hr',
    title: 'إعدادات الموارد البشرية',
    categoryId: 'settings',
    why: 'ضبط سلوك الإشعارات والسياسات العامة للنظام.',
    systemHref: '/hr/settings/hr',
    systemHrefLabel: 'فتح إعدادات HR',
    blocks: [
      {
        id: 'items',
        title: 'ما الذي تُراجعه؟',
        bullets: [
          'إشعارات اعتماد الطلبات والمخالفات',
          'سياسات افتراضية حسب إعداد الشركة',
          'ربط الإعدادات بسير العمل اليومي',
        ],
      },
    ],
    relatedSlugs: ['daily-usage'],
  },

  // ─── الاستخدام ───────────────────────────────────────────────────────────
  {
    slug: 'daily-usage',
    title: 'الاستخدام اليومي',
    categoryId: 'usage',
    why: 'مرجع سريع بعد اكتمال التهيئة.',
    blocks: [
      {
        id: 'requests',
        title: 'الطلبات والموافقات',
        bullets: [
          'افتح قائمة الطلبات (حضور / إجازة / سلف)',
          'اضغط على الطلب لعرض التفاصيل ومسار المعتمدين',
          'إن كنت المعتمد الحالي: موافقة أو رفض من نافذة التفاصيل',
          'بانتظار معتمد سابق في الوضع التتابعي: الزر غير متاح حتى يكمل دوره',
        ],
      },
      {
        id: 'filters',
        title: 'الفلاتر والسياق',
        bullets: [
          'استخدم فلتر الموظف والحالة والتاريخ أعلى الصفحة',
          'بدّل الفرع النشط من قائمة المستخدم عند تعدد الفروع',
          'راجع الدليل من نفس القائمة: «دليل المشروع والتهيئة»',
        ],
      },
      {
        id: 'checks',
        title: 'إذا لم تعمل الموافقة',
        bullets: [
          'تأكد من إسناد موافقة نشط للفئة الصحيحة (leave / attendance / advance)',
          'تأكد أن حسابك مربوط بسجل موظف وأنك ضمن قائمة المعتمدين',
          'في الوضع التتابعي: انتظر موافقة المعتمد السابق',
        ],
      },
    ],
  },
];

export function getCategoryLabel(categoryId: GuideCategory['id']): string {
  return GUIDE_CATEGORIES.find((c) => c.id === categoryId)?.label ?? categoryId;
}

export function getGuidePage(slug: string): GuidePage | undefined {
  return GUIDE_PAGES.find((p) => p.slug === slug);
}

export function getAdjacentGuidePages(slug: string): { prev: GuidePage | null; next: GuidePage | null } {
  const idx = GUIDE_PAGES.findIndex((p) => p.slug === slug);
  if (idx < 0) return { prev: null, next: null };
  return {
    prev: idx > 0 ? GUIDE_PAGES[idx - 1]! : null,
    next: idx < GUIDE_PAGES.length - 1 ? GUIDE_PAGES[idx + 1]! : null,
  };
}

export function getGuidePagesByCategory(categoryId: GuideCategory['id']): GuidePage[] {
  return GUIDE_PAGES.filter((p) => p.categoryId === categoryId);
}

export const DEFAULT_GUIDE_SLUG = 'introduction';
