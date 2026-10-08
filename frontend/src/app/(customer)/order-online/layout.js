const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.lassiloungeny.com';

export const metadata = {
  title: 'Order Online | Lassi Lounge NY',
  description:
    'Order authentic Indian food online from Lassi Lounge NY. Fast delivery and easy pickup in NY.',
  alternates: {
    canonical: `${siteUrl}/menu`,
  },
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: 'Order Online | Lassi Lounge NY',
    description:
      'Order authentic Indian food online from Lassi Lounge NY. Fast delivery and easy pickup in NY.',
    url: `${siteUrl}/menu`,
  },
};

export default function OrderOnlineLayout({ children }) {
  return children;
}
