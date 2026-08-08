'use client';

import React from 'react';
import { useMerchantContext } from '@/context/MerchantContext';
import LoyaltyRewardsView from '@/components/merchant/LoyaltyRewardsView';
import { PageLoader } from '@/components/ui';

export default function MerchantLoyaltyPage() {
  const { restaurant, globalLoading } = useMerchantContext();

  if (globalLoading) return <PageLoader text="Loading Loyalty Rewards..." />;

  return <LoyaltyRewardsView restaurant={restaurant} />;
}
