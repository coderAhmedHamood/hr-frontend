import { SidebarProvider } from '@/components/layouts/sidebar-context';
import { PageTitleProvider } from '@/components/layouts/page-title-context';
import { FilterPanelProvider } from '@/components/layouts/filter-panel-context';
import { EntityFilterSlotProvider } from '@/components/layouts/entity-filter-slot-context';
import { PageHeaderActionsProvider } from '@/components/layouts/page-header-actions-context';
import { AppEntityFilterRegion } from '@/components/layouts/app-entity-filter-region';
import { Sidebar } from '@/components/layouts/sidebar';
import { Topbar } from '@/components/layouts/topbar';
import { FilterPanel } from '@/components/layouts/filter-panel';
import { Toaster } from 'sonner';
import { AuthenticatedShell } from '@/components/layouts/authenticated-shell';
import { AppErrorBoundary } from '@/components/layouts/app-error-boundary';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <PageTitleProvider>
        <FilterPanelProvider>
          <EntityFilterSlotProvider>
            <PageHeaderActionsProvider>
              <div className="h-screen flex flex-col bg-background overflow-hidden">
                <Topbar />
                <Sidebar />
                <FilterPanel />
                <main className="relative z-0 flex w-full min-w-0 flex-1 flex-col overflow-hidden p-4">
                  <AppEntityFilterRegion />
                  <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto">
                    <AppErrorBoundary>
                    <AuthenticatedShell>{children}</AuthenticatedShell>
                  </AppErrorBoundary>
                  </div>
                </main>
                <Toaster richColors position="top-right" dir="rtl" closeButton />
              </div>
            </PageHeaderActionsProvider>
          </EntityFilterSlotProvider>
        </FilterPanelProvider>
      </PageTitleProvider>
    </SidebarProvider>
  );
}
