const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.lassiloungeny.com';

export const metadata = {
  title: 'Events & Parties | Lassi Lounge NY',
  description:
    'Host special events and private parties at Lassi Lounge NY. Enjoy authentic Indian catering in an elegant setting.',
  alternates: {
    canonical: `${siteUrl}/events`,
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Events & Parties | Lassi Lounge NY',
    description:
      'Celebrate special moments with authentic Indian cuisine at Lassi Lounge NY.',
    url: `${siteUrl}/events`,
  },
};

export default function EventsLayout({ children }) {
  return children;
}
