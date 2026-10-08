import LassiOffersPage from '@/components/branded/lassi-lounge/LassiOffersPage';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.lassiloungeny.com';

export const metadata = {
  title: 'Offers & Deals | Lassi Lounge NY',
  description: 'View active coupons, special promotions, and exclusive discounts for Lassi Lounge NY.',
  alternates: {
    canonical: `${siteUrl}/offers`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function OffersPage() {
  return <LassiOffersPage />;
}
