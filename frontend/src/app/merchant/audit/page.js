'use client';

import { useMerchantContext } from '../../../context/MerchantContext';
import SystemAuditView from '../../../components/merchant/SystemAuditView';
import { PageLoader } from '../../../components/ui';

export default function MerchantAuditPage() {
  const { restaurant, globalLoading } = useMerchantContext();

  if (globalLoading) return <PageLoader />;
  if (!restaurant) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <SystemAuditView />
    </div>
  );
}
