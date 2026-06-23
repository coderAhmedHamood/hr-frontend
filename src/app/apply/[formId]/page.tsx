import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';

export default function ApplyPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="py-12 space-y-3">
          <p className="text-sm text-muted-foreground">
            رابط التقديم القديم غير متاح. استخدم رابط الوظيفة العام:
          </p>
          <p className="text-xs font-mono text-muted-foreground">/f/اسم-الوظيفة</p>
          <Link href="/hr/recruitment/ats-admin" className="text-sm text-primary hover:underline">
            العودة إلى إدارة الوظائف
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
