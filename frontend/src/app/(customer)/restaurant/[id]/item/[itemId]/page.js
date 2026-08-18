'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ItemDetailContent from '@/components/menu-detail/ItemDetailContent';

// This file goes at: app/restaurant/[id]/item/[itemId]/page.js
// (replace whatever currently lives there)

const SINGLE_MODE = process.env.NEXT_PUBLIC_SINGLE_RESTAURANT_MODE === 'true';

function Redirect({ to }) {
  const router = useRouter();
  useEffect(() => { router.replace(to); }, []);
  return null;
}

export default function ItemDetailPage() {
  const { id: restaurantId, itemId } = useParams();

  // Single-restaurant deployments use the clean /item/[itemId] URL instead.
  if (SINGLE_MODE) return <Redirect to={`/item/${itemId}`} />;

  return <ItemDetailContent restaurantId={restaurantId} itemId={itemId} />;
}