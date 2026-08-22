'use client';

import { useParams } from 'next/navigation';
import ItemDetailContent from '@/components/menu-detail/ItemDetailContent';

// this file goes at: app/item/[itemId]/page.js
// (replace whatever currently lives there — that version is the one
// missing Reviews / You May Also Like / correct styling)
//
// note: if your existing folder uses a different param name than
// [itemId] (e.g. [id]), either rename the folder to [itemId] to match
// this destructuring, or change `itemId` below to whatever key your
// folder name produces.

export default function BrandedItemDetailPage() {
  const { itemId } = useParams();
  const restaurantId = process.env.NEXT_PUBLIC_BRANDED_RESTAURANT_ID;

  return <ItemDetailContent restaurantId={restaurantId} itemId={itemId} />;
}