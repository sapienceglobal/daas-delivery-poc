const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.lassiloungeny.com';

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/merchant/',
          '/restaurant-panel/',
          '/checkout/',
          '/profile/',
          '/orders/',
          '/login',
          '/reset-password/',
          '/verify-otp/',
          '/payment-success/',
          '/payment-cancel/',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
