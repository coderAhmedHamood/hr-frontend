'use client';

import * as React from 'react';
import {
  Building2, MapPin, Pencil, UserCircle, ShieldCheck, LogIn,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserProfileTab } from '@/features/hr/organization/contacts/components/user-profile-tab';
import { UserCompaniesPanel } from '@/features/hr/organization/contacts/components/user-companies-panel';
import { UserBranchesPanel } from '@/features/hr/organization/contacts/components/user-branches-panel';
import { useUserDetailModel } from '@/features/hr/organization/contacts/hooks/useUserDetailModel';
import { USER_TYPE_LABELS } from '@/features/hr/organization/contacts/constants/users-directory';
import { getInitials } from '@/shared/utils';
import type { UserResponseDto } from '@/features/hr/organization/lib/api/users';
import type { CompanyResponseDto } from '@/features/hr/organization/lib/api/companies';
import type { BranchResponseDto } from '@/features/hr/organization/lib/api/branches';

type Props = {
  user: UserResponseDto | null;
  companies: CompanyResponseDto[];
  branches: BranchResponseDto[];
  onOpenChange: (open: boolean) => void;
  onEdit: (row: UserResponseDto) => void;
  onUserUpdated?: (user: UserResponseDto) => void;
};

export function UserDetailDialog({
  user,
  companies,
  branches,
  onOpenChange,
  onEdit,
  onUserUpdated,
}: Props) {
  const [tab, setTab] = React.useState('profile');
  const detail = useUserDetailModel(user?.id ?? null, { companies, branches }, onUserUpdated);
  const displayUser = detail.user ?? user;
  const displayName = displayUser?.fullNameAr ?? displayUser?.email ?? 'المستخدم';

  React.useEffect(() => {
    if (user) setTab('profile');
  }, [user?.id]);

  return (
    <Dialog open={!!user} onOpenChange={(v) => !v && onOpenChange(false)}>
      <DialogContent
        dir="rtl"
        className="!flex max-h-[90vh] !flex-col overflow-hidden border-border p-0 text-right sm:max-w-3xl [&>button]:left-4 [&>button]:end-auto"
      >
        <DialogTitle className="sr-only">{displayName}</DialogTitle>
        <DialogDescription className="sr-only">تفاصيل المستخدم</DialogDescription>

        <div className="flex max-h-[90vh] flex-col gap-0 overflow-hidden">

        {/* ── Hero ─────────────────────────────────────────── */}
        <div className="relative shrink-0 bg-gradient-to-l from-primary/8 via-primary/3 to-transparent px-6 pb-5 pt-12">
          {displayUser ? (
            <div className="flex items-start justify-between gap-4">
             <div className="flex min-w-0 flex-1 items-start justify-end gap-4">
                <div className="min-w-0 pt-0.5 text-right">
                  <h2 className="truncate text-lg font-bold leading-tight">{displayName}</h2>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground" dir="ltr">
                    {displayUser.email}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center justify-end gap-1.5">
                    <Badge variant="outline" className="text-[10px]">
                      {USER_TYPE_LABELS[displayUser.userType ?? ''] ?? displayUser.userType ?? '—'}
                    </Badge>
                    {displayUser.isActive ? (
                      <Badge variant="outline" className="border-success/40 bg-success/5 text-success">
                        نشط
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-destructive">
                        غير نشط
                      </Badge>
                    )}
                    {displayUser.isVerified && (
                      <Badge variant="secondary" className="gap-0.5 text-[10px]">
                        <ShieldCheck className="h-3 w-3" /> موثّق
                      </Badge>
                    )}
                    {displayUser.canSignIn && (
                      <Badge variant="secondary" className="gap-0.5 text-[10px]">
                        <LogIn className="h-3 w-3" /> يمكنه الدخول
                      </Badge>
                    )}
                  </div>
                </div>

                <Avatar className="h-16 w-16 shrink-0 shadow-md ring-2 ring-border">
                  {displayUser.avatarUrl
                    ? <AvatarImage src={displayUser.avatarUrl} alt={displayName} />
                    : null}
                  <AvatarFallback className="text-xl font-semibold">
                    {getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>
              </div>
               <Button
                size="sm"
                variant="outline"
                className="h-8 shrink-0 gap-1.5 self-start text-xs"
                onClick={() => { onOpenChange(false); onEdit(displayUser); }}
              >
                <Pencil className="h-3 w-3" />
                تعديل
              </Button>

              
            </div>
          ) : (
            <div className="flex items-start justify-between gap-4">
              <div className="h-8 w-16 shrink-0 animate-pulse rounded bg-muted" />
              <div className="flex flex-1 items-start justify-end gap-4">
                <div className="space-y-2 pt-2 text-right">
                  <div className="ms-auto h-5 w-40 animate-pulse rounded bg-muted" />
                  <div className="ms-auto h-3.5 w-56 animate-pulse rounded bg-muted" />
                  <div className="flex justify-end gap-1.5 pt-1">
                    <div className="h-4 w-16 animate-pulse rounded-full bg-muted" />
                    <div className="h-4 w-10 animate-pulse rounded-full bg-muted" />
                  </div>
                </div>
                <div className="h-16 w-16 shrink-0 animate-pulse rounded-full bg-muted" />
              </div>
            </div>
          )}
        </div>

        {/* ── Tabs ─────────────────────────────────────────── */}
        {displayUser ? (
          <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col">
            {/* Underline-style tab bar */}
            <div className="shrink-0 border-b border-border px-4">
              <TabsList
                dir="rtl"
                className="!flex h-11 w-full !justify-start gap-0 rounded-none bg-transparent p-0"
              >
                <TabsTrigger
                  value="profile"
                  className="h-11 gap-1.5 rounded-none border-b-2 border-transparent px-4 text-sm font-medium text-muted-foreground shadow-none transition-colors data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
                >
                  <UserCircle className="h-4 w-4" />
                  الملف الشخصي
                </TabsTrigger>
                <TabsTrigger
                  value="companies"
                  className="h-11 gap-1.5 rounded-none border-b-2 border-transparent px-4 text-sm font-medium text-muted-foreground shadow-none transition-colors data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
                >
                  <Building2 className="h-4 w-4" />
                  الشركات
                </TabsTrigger>
                <TabsTrigger
                  value="branches"
                  className="h-11 gap-1.5 rounded-none border-b-2 border-transparent px-4 text-sm font-medium text-muted-foreground shadow-none transition-colors data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
                >
                  <MapPin className="h-4 w-4" />
                  الفروع
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Scrollable content */}
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <TabsContent value="profile" className="mt-0">
                <UserProfileTab user={displayUser} />
              </TabsContent>
              <TabsContent value="companies" className="mt-0">
                <UserCompaniesPanel model={detail} />
              </TabsContent>
              <TabsContent value="branches" className="mt-0">
                <UserBranchesPanel model={detail} />
              </TabsContent>
            </div>
          </Tabs>
        ) : (
          <div className="flex flex-1 items-center justify-center py-16 text-sm text-muted-foreground">
            جاري التحميل…
          </div>
        )}

        </div>
      </DialogContent>
    </Dialog>
  );
}
