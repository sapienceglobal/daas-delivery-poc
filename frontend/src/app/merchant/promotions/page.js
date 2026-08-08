'use client';

import React from 'react';
import { useMerchantContext } from '@/context/MerchantContext';
import PromotionsView from '@/components/merchant/PromotionsView';
import { PageLoader } from '@/components/ui';

export default function MerchantPromotionsPage() {
  const { restaurant, globalLoading } = useMerchantContext();

  if (globalLoading) return <PageLoader text="Loading Promotions..." />;

  return <PromotionsView restaurant={restaurant} />;
}
