'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    // Scroll to top on every route change
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' // 'smooth' can sometimes look jarring on page load
    });
  }, [pathname]);

  return null;
}
