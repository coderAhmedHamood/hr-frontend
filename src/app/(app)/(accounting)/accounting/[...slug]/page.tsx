import { redirect } from 'next/navigation';
import { AccountingWorkspacePage } from '@/features/accounting/workspaces/components/accounting-workspace-page';
import { getAccountingWorkspace } from '@/features/accounting/workspaces/constants/accounting-workspaces';

export default async function AccountingCatchAllPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const config = getAccountingWorkspace(slug);

  if (!config) redirect('/accounting');

  return <AccountingWorkspacePage config={config} />;
}
