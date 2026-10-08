import LassiLoyaltyPage from '@/components/branded/lassi-lounge/LassiLoyaltyPage';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.lassiloungeny.com';

export const metadata = {
  title: 'Loyalty Rewards | Lassi Lounge NY',
  description: 'Join Lassi Rewards to earn points, free drinks, and exclusive discounts on every order.',
  alternates: {
    canonical: `${siteUrl}/loyalty`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function LoyaltyPage() {
  return <LassiLoyaltyPage />;
}
