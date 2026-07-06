'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Compass, LifeBuoy } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Next.js renders this for any URL that matches no route at all. Styled to match
 * this app's visual identity (glass-card, gold accent, primary/gold glow, luxe
 * shadow, Rubik display font) instead of Next's plain built-in 404 page.
 */
export default function NotFound() {
  const router = useRouter();

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background p-4" dir="rtl">
      {/* Soft ambient glow — same primary/gold palette as the rest of the app */}
      <div className="pointer-events-none absolute -top-24 right-1/4 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />

      <div className="relative z-10 flex w-full max-w-lg flex-col items-center text-center animate-fade-in">
        <h1 className="font-display bg-gradient-to-br from-primary via-primary-700 to-gold bg-clip-text text-8xl font-black leading-none tracking-tight text-transparent sm:text-9xl">
          404
        </h1>

        <div className="glass-card mt-6 w-full rounded-2xl p-8 shadow-luxe">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 animate-pulse-soft">
            <Compass className="h-6 w-6 text-primary" />
          </div>

          <h2 className="font-arabic-display text-xl font-bold text-foreground">الصفحة غير موجودة</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            الرابط الذي حاولت الوصول إليه غير موجود، أو تم نقله، أو حُذف.
          </p>

          <div className="gold-accent-line mx-auto my-5 h-px w-16" />

          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button asChild variant="luxe" size="sm">
              <Link href="/">الصفحة الرئيسية</Link>
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => router.back()}>
              <ArrowRight className="h-3.5 w-3.5" />
              الرجوع
            </Button>
          </div>

          <Link
            href="/support"
            className="mt-5 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <LifeBuoy className="h-3.5 w-3.5" />
            التواصل مع الدعم الفني
          </Link>
        </div>
      </div>
    </div>
  );
}
