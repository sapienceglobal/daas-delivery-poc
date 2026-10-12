import ReferralLandingClient from '@/components/referral/ReferralLandingClient';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.lassiloungeny.com';

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const rawCode = resolvedParams?.code || '';
  const code = rawCode.trim().toUpperCase();

  return {
    title: `You've Been Invited to Lassi Lounge! | Use Code ${code || 'GIFT'}`,
    description: `A friend invited you to Lassi Lounge NY! Use referral code ${code} to get a special discount on your first order of authentic fresh lassis, rolls & delicious street food.`,
    alternates: {
      canonical: `${siteUrl}/ref/${code}`,
    },
    openGraph: {
      title: `Claim Your Welcome Discount with Code ${code} at Lassi Lounge NY`,
      description: `Join Lassi Lounge today and get a special discount on fresh mango lassis, kathi rolls, and Indian specialties.`,
      url: `${siteUrl}/ref/${code}`,
      siteName: 'Lassi Lounge NY',
      type: 'website',
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function ReferralPage({ params }) {
  const resolvedParams = await params;
  const rawCode = resolvedParams?.code || '';
  const code = rawCode.trim().toUpperCase();

  return <ReferralLandingClient referralCode={code} />;
}
