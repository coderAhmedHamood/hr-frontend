'use client';

import Link from 'next/link';
import {
  Briefcase,
  Building2,
  KeyRound,
  Landmark,
  LayoutGrid,
  MapPinned,
  Network,
  Settings,
  Shield,
  Smartphone,
  UserCircle,
} from 'lucide-react';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { Button } from '@/components/ui/button';
import { systemOrganizationRoutes } from '@/features/system/organization/constants/routes';
import {
  systemPermissionsCatalogHref,
  systemPermissionsRolesHref,
} from '@/features/system/permissions/constants/routes';

type QuickLink = {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const STRUCTURE_LINKS: QuickLink[] = [
  {
    title: 'المستخدمون',
    description: 'حسابات الدخول، الشركات، الفروع، والأدوار.',
    href: systemOrganizationRoutes.users,
    icon: UserCircle,
  },
  {
    title: 'موافقة الأجهزة',
    description: 'طلبات ربط جوال أو موقع بعد تغيير الجهاز.',
    href: systemOrganizationRoutes.mobileSerialApprovals,
    icon: Smartphone,
  },
  {
    title: 'المسميات الوظيفية',
    description: 'قوالب المسميات عند إنشاء موظفين جدد.',
    href: systemOrganizationRoutes.jobTitles,
    icon: Briefcase,
  },
  {
    title: 'الفروع',
    description: 'فروع الشركة، المدن، والمديرين.',
    href: systemOrganizationRoutes.branches,
    icon: Building2,
  },
  {
    title: 'الأقسام',
    description: 'شجرة الأقسام والهيكل الداخلي.',
    href: systemOrganizationRoutes.departments,
    icon: Network,
  },
  {
    title: 'الهيكل التنظيمي',
    description: 'خريطة تفاعلية للشركة والفروع والأقسام.',
    href: systemOrganizationRoutes.chart,
    icon: Network,
  },
  {
    title: 'المواقع الجغرافية',
    description: 'دول، مدن، وأحياء — وربطها بالمتجر.',
    href: systemOrganizationRoutes.geo,
    icon: MapPinned,
  },
];

const SETTINGS_LINKS: QuickLink[] = [
  {
    title: 'تطبيقات الشركة',
    description: 'عرض التطبيقات المفعّلة وطلب تفعيل جديد.',
    href: systemOrganizationRoutes.applications,
    icon: LayoutGrid,
  },
  {
    title: 'إعدادات الشركة',
    description: 'الهوية، الألوان، والإعدادات العامة للشركة.',
    href: systemOrganizationRoutes.pagesCompany,
    icon: Landmark,
  },
  {
    title: 'إعدادات النظام',
    description: 'إعدادات HR والنسخ الاحتياطي والإشعارات.',
    href: systemOrganizationRoutes.pagesOrganization,
    icon: Settings,
  },
];

const PERMISSIONS_LINKS: QuickLink[] = [
  {
    title: 'الأدوار',
    description: 'إنشاء الأدوار وربط الصلاحيات بالمستخدمين.',
    href: systemPermissionsRolesHref(),
    icon: Shield,
  },
  {
    title: 'دليل الصلاحيات',
    description: 'شجرة صلاحيات كل تطبيق مفعّل.',
    href: systemPermissionsCatalogHref(),
    icon: KeyRound,
  },
];

function LinkGrid({ items }: { items: QuickLink[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="group flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-4 transition-colors hover:border-primary/35 hover:bg-primary/5"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </span>
              <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">{item.description}</p>
            <Button variant="ghost" size="sm" className="mt-auto w-fit px-0 text-primary">
              فتح
            </Button>
          </Link>
        );
      })}
    </div>
  );
}

export function SystemOverviewPage() {
  return (
    <div className="flex flex-col gap-6">
      <SetPageTitle titleAr="النظام" iconName="Settings" />

      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-foreground">نظرة عامة على النظام</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          إدارة المستخدمين والهيكل التنظيمي والصلاحيات وإعدادات الشركة — من مكان واحد متناسق مع باقي
          التطبيقات.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-foreground">الهيكل التنظيمي</h2>
        <LinkGrid items={STRUCTURE_LINKS} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-foreground">الإعدادات</h2>
        <LinkGrid items={SETTINGS_LINKS} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-foreground">الصلاحيات</h2>
        <LinkGrid items={PERMISSIONS_LINKS} />
      </section>
    </div>
  );
}
