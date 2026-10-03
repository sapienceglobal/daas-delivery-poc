'use client';

import { useParams } from 'next/navigation';
import ItemDetailContent from '@/components/menu-detail/ItemDetailContent';

export default function BrandedItemDetailPage() {
  const params = useParams();
  const itemId = params?.itemId;
  const restaurantId = process.env.NEXT_PUBLIC_BRANDED_RESTAURANT_ID || 'lassi-lounge';

  return <ItemDetailContent restaurantId={restaurantId} itemId={itemId} />;
}