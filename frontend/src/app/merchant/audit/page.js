'use client';

import { useMerchantContext } from '../../../context/MerchantContext';
import SystemAuditView from '../../../components/merchant/SystemAuditView';
import { PageLoader } from '../../../components/ui';

export default function MerchantAuditPage() {
  const { restaurant, globalLoading } = useMerchantContext();

  if (globalLoading) return <PageLoader />;
  if (!restaurant) return null;

  return (
    <div className="w-full -mx-1 sm:-mx-2 -mt-2 space-y-4 pb-6">
      <SystemAuditView />
    </div>
  );
}
