'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui';

export default function RootRedirector() {
  const router = useRouter();
  const { user, isMerchant, isAdmin, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      router.push('/login');
    } else if (isAdmin) {
      router.push('/admin');
    } else if (isMerchant) {
      router.push('/merchant');
    } else {
      router.push('/customer');
    }
  }, [isAuthenticated, isMerchant, isAdmin, loading, router]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <Skeleton className="h-12 w-48" />
      <Skeleton className="h-4 w-64" />
    </div>
  );
}
