import { PersonDetailPage } from '@/features/expenses/components/people-page';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PersonDetailPage id={decodeURIComponent(id)} />;
}
