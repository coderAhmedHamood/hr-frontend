'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, LayoutGrid, LogOut, Moon, Sun } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLogout } from '@/features/auth/hooks/use-logout';
import { useAuthUserDisplay } from '@/features/auth/hooks/use-auth-user-display';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { getBranchAccessLabel } from '@/features/auth/types/access-profile';
import { useDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { useThemeStore } from '@/shared/store/theme-store';
import { isHrAppPath, isLauncherPath } from '@/shared/app-paths';
import { cn } from '@/shared/utils';

type UserMenuDropdownProps = {
  showEmail?: boolean;
  showPhone?: boolean;
  showThemeToggle?: boolean;
  showLogout?: boolean;
  showApplicationsLink?: boolean;
  showGuideLink?: boolean;
  triggerClassName?: string;
  avatarClassName?: string;
};

export function UserMenuDropdown({
  showEmail = true,
  showPhone = true,
  showThemeToggle = true,
  showLogout = true,
  showApplicationsLink = true,
  showGuideLink = true,
  triggerClassName,
  avatarClassName,
}: UserMenuDropdownProps) {
  const pathname = usePathname();
  const inHrApp = isHrAppPath(pathname);
  const resolvedShowGuideLink = showGuideLink ?? inHrApp;
  const resolvedShowApplicationsLink = showApplicationsLink ?? !isLauncherPath(pathname);

  const themeMode = useThemeStore((state) => state.mode);
  const toggleTheme = useThemeStore((state) => state.toggle);
  const { logout, loading: logoutLoading } = useLogout();
  const {
    displayName,
    avatarFallback,
    avatarUrl,
    email,
    phone,
    roleLabel,
    accessProfile,
    activeBranchId,
  } = useAuthUserDisplay();
  const defaultCompanyId = useDefaultCompanyId();
  const setActiveContext = useAuthStore((s) => s.setActiveContext);

  const branches =
    accessProfile?.companies.find((c) => c.companyId === defaultCompanyId)?.branches ?? [];
  const showBranchSelector = branches.length > 1;

  const menuItems = [
    resolvedShowApplicationsLink,
    resolvedShowGuideLink,
    showThemeToggle,
    showLogout,
  ].some(Boolean);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'flex items-center gap-2 rounded-xl px-1.5 py-1 transition-colors outline-none hover:bg-muted/60 focus:outline-none focus-visible:outline-none focus-visible:ring-0 data-[state=open]:outline-none data-[state=open]:ring-0',
            triggerClassName,
          )}
        >
          <Avatar className={cn('h-7 w-7 ring-2 ring-gold/40', avatarClassName)}>
            {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
            <AvatarFallback>{avatarFallback}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold">{displayName}</span>
            {showEmail && email ? (
              <span className="text-xs font-normal text-muted-foreground" dir="ltr">
                {email}
              </span>
            ) : null}
            {showPhone && phone ? (
              <span className="text-xs font-normal text-muted-foreground" dir="ltr">
                {phone}
              </span>
            ) : null}
            {roleLabel ? (
              <span className="text-xs font-normal text-primary">{roleLabel}</span>
            ) : null}
          </div>
        </DropdownMenuLabel>

        {showBranchSelector && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
              الفرع النشط
            </DropdownMenuLabel>
            {branches.map((branch) => (
              <DropdownMenuItem
                key={branch.branchId}
                onSelect={() => {
                  if (defaultCompanyId) setActiveContext(defaultCompanyId, branch.branchId);
                }}
                className={branch.branchId === activeBranchId ? 'bg-primary/10 font-medium' : undefined}
              >
                {branch.branchId === activeBranchId ? '● ' : ''}
                {getBranchAccessLabel(branch)}
              </DropdownMenuItem>
            ))}
          </>
        )}

        {menuItems && <DropdownMenuSeparator />}

        {resolvedShowApplicationsLink && (
          <DropdownMenuItem asChild>
            <Link href="/" className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              <span>التطبيقات</span>
            </Link>
          </DropdownMenuItem>
        )}
        {resolvedShowGuideLink && (
          <DropdownMenuItem asChild>
            <Link href="/hr/guide/introduction" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span>دليل المشروع والتهيئة</span>
            </Link>
          </DropdownMenuItem>
        )}
        {showThemeToggle && (
          <DropdownMenuItem onSelect={toggleTheme}>
            {themeMode === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span>{themeMode === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}</span>
          </DropdownMenuItem>
        )}
        {showLogout && (
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            disabled={logoutLoading}
            onSelect={(e) => {
              e.preventDefault();
              void logout();
            }}
          >
            <LogOut className="h-4 w-4" />
            <span>{logoutLoading ? 'جاري الخروج…' : 'تسجيل الخروج'}</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
