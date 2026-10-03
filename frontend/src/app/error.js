'use client';

import { useEffect } from 'react';
import ErrorView from '@/components/shared/ErrorView';

// Catches unexpected runtime errors in any page/segment while keeping the
// site header & footer (root layout) intact.
export default function Error({ error, reset }) {
  useEffect(() => {
    // hook point for Sentry / logging service
    console.error('[App Error]', error);
  }, [error]);

  return <ErrorView code={500} onRetry={() => reset()} digest={error?.digest} />;
}
