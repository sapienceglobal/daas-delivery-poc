import { cleanUrl } from '@/lib/slugUtils';

const siteUrl = cleanUrl(process.env.NEXT_PUBLIC_SITE_URL) || 'https://www.lassiloungeny.com';

/**
 * Next.js Robots.txt generation
 * Guides search engine web crawlers (Google, Bing, Yahoo).
 */
export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          // Admin & Merchant Management Panels
          '/admin',
          '/admin/',
          '/merchant',
          '/merchant/',
          '/merchant-portal',
          '/merchant-portal/',
          '/restaurant-panel',
          '/restaurant-panel/',

          // Checkout & Cart paths
          '/cart',
          '/cart/',
          '/checkout',
          '/checkout/',

          // Internal API & Revalidation endpoints
          '/api',
          '/api/',

          // Customer private account / auth paths
          '/profile',
          '/profile/',
          '/orders',
          '/orders/',
          '/login',
          '/login/',
          '/reset-password',
          '/reset-password/',
          '/verify-otp',
          '/verify-otp/',
          '/payment-success',
          '/payment-success/',
          '/payment-cancel',
          '/payment-cancel/',
          '/delete-account',
          '/delete-account/',
          '/merchant-account-deletion',
          '/merchant-account-deletion/',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
