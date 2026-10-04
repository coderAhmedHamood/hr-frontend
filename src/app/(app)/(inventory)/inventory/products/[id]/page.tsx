import { ProductDetailPage } from '@/features/catalog';

type Props = { params: Promise<{ id: string }> };

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <ProductDetailPage productId={id} />;
}
