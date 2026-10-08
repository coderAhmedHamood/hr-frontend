import { CustodyDetailPage } from '@/features/expenses/components/custody-page';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CustodyDetailPage id={decodeURIComponent(id)} />;
}
