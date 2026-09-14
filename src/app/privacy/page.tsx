import type { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'سياسة الخصوصية | روز',
  description: 'سياسة الخصوصية لتطبيق روز للموارد البشرية — كيف نجمع بياناتك ونستخدمها ونحميها.',
};

const LAST_UPDATED = '14 سبتمبر 2026';

type DataRow = {
  type: string;
  purpose: string;
  linked: string;
};

const DATA_ROWS: DataRow[] = [
  { type: 'الاسم والبريد الإلكتروني ورقم الهاتف والعنوان', purpose: 'التعريف بالموظف وإدارة ملفه الوظيفي', linked: 'نعم' },
  { type: 'الموقع الجغرافي (دقيق، أثناء الاستخدام فقط)', purpose: 'التحقق من تسجيل الحضور داخل موقع العمل', linked: 'نعم' },
  { type: 'الصور والمرفقات (مستندات، سندات قبض، مخالصات)', purpose: 'معالجة الطلبات الإدارية والمالية', linked: 'نعم' },
  { type: 'المعلومات المالية (الراتب وكشوف الرواتب)', purpose: 'عرض بيانات الراتب الخاصة بالموظف', linked: 'نعم' },
  { type: 'معرّف المستخدم ومعرّف الجهاز', purpose: 'تسجيل الدخول وحماية الجلسة على جهاز الموظف', linked: 'نعم' },
  { type: 'بيانات الأعطال والأداء التقني', purpose: 'اكتشاف الأخطاء وتحسين استقرار التطبيق', linked: 'لا' },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold text-foreground">{title}</h2>
      <div className="space-y-3 text-[15px] leading-7 text-muted-foreground">{children}</div>
    </section>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <header className="mb-10 space-y-2 text-center">
        <p className="text-sm font-medium text-primary">روز — قسم الموارد البشرية</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          سياسة الخصوصية
        </h1>
        <p className="text-sm text-muted-foreground">آخر تحديث: {LAST_UPDATED}</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">نظرة عامة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8 pt-0">
          <Section title="من نحن">
            <p>
              تطبيق &quot;روز للموارد البشرية&quot; (&quot;التطبيق&quot;) هو تطبيق داخلي مخصص حصريًا
              لموظفي شركة Rose Trading، يوفّر خدمات الموارد البشرية الذاتية — تسجيل الحضور، طلبات
              الإجازات والعمل الإضافي، عرض الرواتب، والتوقيع الإلكتروني على المستندات الإدارية.
              توضّح هذه السياسة ما هي البيانات التي يجمعها التطبيق وكيف نستخدمها ونحميها.
            </p>
          </Section>

          <Section title="من يستطيع استخدام التطبيق">
            <p>
              لا يسمح التطبيق بإنشاء حساب عام أو التسجيل الذاتي. تُنشأ الحسابات حصريًا من قِبل
              إدارة الموارد البشرية في Rose Trading لموظفيها، ويتم تسليم بيانات الدخول للموظف
              مباشرة من جهة عمله.
            </p>
          </Section>

          <Section title="البيانات التي نجمعها">
            <p>نجمع البيانات التالية فقط، وجميعها ضرورية لتشغيل ميزات التطبيق:</p>
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full border-collapse text-right text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 font-semibold text-foreground">نوع البيانات</th>
                    <th className="px-4 py-3 font-semibold text-foreground">الغرض</th>
                    <th className="px-4 py-3 font-semibold text-foreground">مرتبطة بهويتك؟</th>
                  </tr>
                </thead>
                <tbody>
                  {DATA_ROWS.map((row) => (
                    <tr key={row.type} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 align-top text-foreground">{row.type}</td>
                      <td className="px-4 py-3 align-top">{row.purpose}</td>
                      <td className="px-4 py-3 align-top">{row.linked}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="كيف نستخدم بياناتك">
            <p>
              تُستخدم جميع البيانات أعلاه فقط لتشغيل ميزات التطبيق (App Functionality) — مثل
              التحقق من الحضور، ومعالجة الطلبات، وعرض كشوف الرواتب، وحماية حسابك. نحن{' '}
              <strong className="text-foreground">لا</strong> نستخدم بياناتك للإعلانات، ولا
              للتسويق لجهات خارجية، ولا لتحليل السلوك لأغراض تجارية.
            </p>
          </Section>

          <Section title="مشاركة البيانات">
            <p>
              لا تتم مشاركة بياناتك مع أي طرف ثالث لأغراض تجارية. تُخزَّن البيانات على خوادم
              مخصصة لشركة Rose Trading، ولا يطّلع عليها إلا الموظف نفسه وموظفو الموارد البشرية
              المخوّلون بحكم عملهم.
            </p>
          </Section>

          <Section title="التتبع (Tracking)">
            <p>
              لا يستخدم التطبيق أي تقنية تتبع عبر تطبيقات أو مواقع أخرى، ولا يشارك بياناتك مع
              شبكات إعلانية أو وسطاء بيانات (Data Brokers)، ولا يحتوي على أي أدوات تحليلات أو
              إعلانات من أطراف ثالثة.
            </p>
          </Section>

          <Section title="الاحتفاظ بالبيانات وحذفها">
            <p>
              بما أن حسابك مرتبط بعلاقة التوظيف مع Rose Trading، تتم إدارة بياناتك — بما في ذلك
              حذفها — من قِبل إدارة الموارد البشرية، سواء بناءً على طلبك أو عند انتهاء علاقة
              العمل، وذلك وفق الأنظمة المعمول بها في المملكة العربية السعودية بخصوص حفظ سجلات
              التوظيف والرواتب. لتقديم طلب بخصوص بياناتك، تواصل معنا عبر البيانات أدناه.
            </p>
          </Section>

          <Section title="أمان البيانات">
            <p>
              نطبّق إجراءات تقنية وتنظيمية معقولة لحماية بياناتك من الوصول أو الاستخدام غير
              المصرّح به، بما يشمل تشفير الاتصال بين التطبيق والخادم وربط الجلسة بجهازك.
            </p>
          </Section>

          <Section title="تحديثات هذه السياسة">
            <p>
              قد نحدّث هذه السياسة من وقت لآخر لتعكس أي تغيير في ممارساتنا أو لأسباب تشغيلية أو
              قانونية. سيظهر تاريخ آخر تحديث أعلى هذه الصفحة دائمًا.
            </p>
          </Section>

          <Section title="التواصل معنا">
            <p>
              لأي استفسار بخصوص هذه السياسة أو بياناتك الشخصية، يمكنك التواصل معنا عبر:{' '}
              <a
                href="mailto:eng.adel.helal91@gmail.com"
                className="font-medium text-primary underline underline-offset-2"
              >
                eng.adel.helal91@gmail.com
              </a>
            </p>
          </Section>
        </CardContent>
      </Card>
    </main>
  );
}
