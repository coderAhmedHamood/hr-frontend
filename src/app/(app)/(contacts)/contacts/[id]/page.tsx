import { PartnerDetailPage } from '@/features/contacts/admin/partners/components/partner-detail-page';

type Props = { params: Promise<{ id: string }> };

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <PartnerDetailPage partnerId={id} />;
}
