import type { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'سياسة الخصوصية | روز',
  description:
    'سياسة الخصوصية لمنصة روز للموارد البشرية — كيف نجمع بياناتك ونستخدمها ونحميها.',
};

const LAST_UPDATED = '18 سبتمبر 2026';

type DataRow = {
  type: string;
  purpose: string;
  linked: string;
};

const DATA_ROWS: DataRow[] = [
  { type: 'الاسم والبريد الإلكتروني ورقم الهاتف والعنوان', purpose: 'التعريف بالموظف وإدارة ملفه الوظيفي', linked: 'نعم' },
  { type: 'الموقع الجغرافي (دقيق، أثناء الاستخدام فقط)', purpose: 'التحقق من تسجيل الحضور داخل موقع العمل', linked: 'نعم' },
  { type: 'الملفات التي ترفعها أنت (مستندات، سندات قبض، مخالصات)', purpose: 'معالجة الطلبات الإدارية والمالية', linked: 'نعم' },
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
        <p className="text-sm font-medium text-primary">
          روز للموارد البشرية — منصة الموارد البشرية للمنشآت
        </p>
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
              &quot;روز للموارد البشرية&quot; (&quot;التطبيق&quot;) هو واجهة الموظف في منصة برمجية
              لإدارة الموارد البشرية، تقدّمها روز التجارية بنظام الاشتراك للمنشآت. تشترك في
              المنصة منشآت مستقلة على اختلاف أحجامها وقطاعاتها، ولكل منشأة مشتركة بيئة منفصلة
              تمامًا ببياناتها ومستخدميها وسياساتها وفروعها.
            </p>
            <p>
              يوفّر التطبيق خدمات الموارد البشرية الذاتية — تسجيل الحضور، طلبات الإجازات والعمل
              الإضافي، عرض الرواتب، والتوقيع الإلكتروني على المستندات الإدارية. توضّح هذه السياسة
              ما هي البيانات التي يجمعها التطبيق وكيف نستخدمها ونحميها.
            </p>
          </Section>

          <Section title="أدوار معالجة البيانات">
            <p>
              <strong className="text-foreground">المنشأة المشتركة</strong> التي تعمل لديها هي
              المتحكّم في البيانات: هي التي تُنشئ حسابك، وتحدّد بياناتك الوظيفية، وتملك سجلات
              توظيفك ورواتبك.
            </p>
            <p>
              و<strong className="text-foreground">روز التجارية</strong> تعمل معالِجًا للبيانات
              نيابة عن تلك المنشأة، ووفق اتفاقية الاشتراك المبرمة معها. لا نستخدم بياناتك لأي غرض
              خاص بنا.
            </p>
          </Section>

          <Section title="من يستطيع استخدام التطبيق">
            <p>
              التطبيق متاح للتنزيل للجميع من متاجر التطبيقات دون أي قيد أو دعوة. غير أن الدخول
              إليه يتطلب حسابًا، ولا يتضمن التطبيق تسجيلًا ذاتيًا: تُنشئ إدارة الموارد البشرية في
              المنشأة التي تعمل لديها حسابك من لوحة التحكم، وتسلّمك بيانات الدخول.
            </p>
            <p>
              خيار &quot;تفعيل الحساب&quot; في شاشة الدخول ليس تسجيلًا جديدًا — هو فقط لتعيين كلمة
              مرور لحساب أنشأته إدارتك مسبقًا، ولا يُنشئ حسابًا لبريد غير مسجّل.
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

          <Section title="ما لا نجمعه ولا نصل إليه">
            <ul className="list-disc space-y-2 pr-5">
              <li>
                لا يستخدم التطبيق <strong className="text-foreground">الكاميرا</strong>، ولا يصل
                إلى <strong className="text-foreground">معرض الصور</strong>، ولا يطلب إذنًا لأيٍّ
                منهما. ترفع مرفقاتك عبر مُنتقي الملفات في نظام تشغيل جهازك، وأنت من يختار الملف.
              </li>
              <li>
                لا نجمع أي <strong className="text-foreground">بيانات حيوية (بيومترية)</strong>،
                ولا نستخدم التعرّف على الوجه. أما بصمة الجهاز (Face ID / Touch ID) إن استُخدمت
                للدخول السريع فتبقى داخل جهازك ولا تصلنا.
              </li>
              <li>
                لا نتتبّع موقعك في الخلفية، ولا في أي وقت خارج لحظة تسجيل الحضور أو الانصراف.
              </li>
            </ul>
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
              المنصة، وبيانات كل منشأة معزولة عن غيرها، ولا يطّلع على بياناتك إلا أنت وموظفو
              الموارد البشرية المخوّلون في المنشأة التي تعمل لديها.
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
              بما أن حسابك مرتبط بعلاقة التوظيف مع المنشأة التي تعمل لديها، تتم إدارة بياناتك —
              بما في ذلك حذفها — من قِبل إدارة الموارد البشرية في تلك المنشأة، سواء بناءً على طلبك
              أو عند انتهاء علاقة العمل، وذلك وفق الأنظمة المعمول بها في المملكة العربية السعودية
              بخصوص حفظ سجلات التوظيف والرواتب.
            </p>
            <p>
              يمكنك أيضًا مراسلتنا مباشرة عبر البيانات أدناه، وسنحيل طلبك إلى منشأتك ونتابعه.
            </p>
          </Section>

          <Section title="حقوقك">
            <p>
              وفق نظام حماية البيانات الشخصية السعودي (PDPL)، لك الحق في الوصول إلى بياناتك،
              وتصحيحها، وطلب حذفها، والاعتراض على معالجتها. تُوجَّه هذه الطلبات إلى المتحكّم في
              البيانات — أي المنشأة التي تعمل لديها — أو إلينا وسنتولّى إحالتها.
            </p>
          </Section>

          <Section title="أمان البيانات">
            <p>
              نطبّق إجراءات تقنية وتنظيمية معقولة لحماية بياناتك من الوصول أو الاستخدام غير
              المصرّح به، بما يشمل تشفير الاتصال بين التطبيق والخادم وربط الجلسة بجهازك.
            </p>
          </Section>

          <Section title="الأطفال">
            <p>
              المنصة أداة عمل موجّهة للموظفين، وليست موجّهة للأطفال دون 16 عامًا، ولا نجمع
              بياناتهم عن قصد.
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
