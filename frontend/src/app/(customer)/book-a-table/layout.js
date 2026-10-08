const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.lassiloungeny.com';

export const metadata = {
  title: 'Book a Table | Lassi Lounge NY',
  description:
    'Reserve your table at Lassi Lounge NY. Enjoy an authentic Indian dining experience — book online for dine-in, special occasions, or group gatherings.',
  alternates: {
    canonical: `${siteUrl}/book-a-table`,
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Book a Table | Lassi Lounge NY',
    description:
      'Reserve your spot for an authentic Indian dining experience at Lassi Lounge NY.',
    url: `${siteUrl}/book-a-table`,
  },
};

export default function BookATableLayout({ children }) {
  return children;
}
