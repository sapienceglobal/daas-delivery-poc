import './globals.css';
import Script from 'next/script';
import { Providers } from '@/components/shared/Providers';
import SiteChrome from '@/components/shared/SiteChrome';
import ScrollToTop from '@/components/shared/ScrollToTop';

const isLassiLounge = process.env.NEXT_PUBLIC_SINGLE_RESTAURANT_MODE === 'true';
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.lassiloungeny.com';
export const metadata = {
  metadataBase: new URL(siteUrl),
  
  // 1. Title Template: Har page ka title automatically set hoga (e.g., "Menu | Lassi Lounge NY")
  title: {
    default: isLassiLounge 
      ? 'Lassi Lounge NY | Authentic Indian Restaurant & Delivery' 
      : 'Restaurant Commerce Platform',
    template: isLassiLounge 
      ? '%s | Lassi Lounge NY' 
      : '%s | Restaurant Platform',
  },
  
  // SEO Description
  description: isLassiLounge
    ? 'Experience the best authentic Indian cuisine at Lassi Lounge in New York. Order online for fast delivery, easy pickup, or reserve a table for dine-in.'
    : 'Order food from your favorite local restaurants — delivery, pickup, or dine-in.',
  
  // keywords
  keywords: isLassiLounge
    ? ['Indian restaurant NY', 'Lassi Lounge New York', 'Authentic Indian food', 'Indian food delivery NY', 'best lassi in NY', 'dine-in Indian restaurant', 'curry', 'biryani', 'lassiloungeny']
    : ['food delivery', 'restaurant', 'ordering', 'pickup', 'dine-in'],
  
  // canonical URL
  alternates: {
    canonical: '/',
  },
  
  // robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  
  // 6. OpenGraph: WhatsApp, Facebook, Instagram pe link share karne par kaisa dikhega
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: isLassiLounge ? 'Lassi Lounge NY' : 'Restaurant Commerce Platform',
    title: isLassiLounge ? 'Lassi Lounge NY | Authentic Indian Cuisine' : 'Restaurant Commerce Platform',
    description: isLassiLounge
      ? 'Experience authentic Indian cuisine at Lassi Lounge in New York. Order online for delivery or pickup.'
      : 'Order food from your favorite local restaurants.',
    images: [
      {
        url: '/assets/images/branded/lassi-lounge/og-image.png',
        width: 1200,
        height: 630,
        alt: isLassiLounge ? 'Lassi Lounge NY - Authentic Indian Food' : 'Restaurant Cover Image',
      },
    ],
  },
  
  // twitter Card
  twitter: {
    card: 'summary_large_image',
    title: isLassiLounge ? 'Lassi Lounge NY | Authentic Indian Cuisine' : 'Restaurant Commerce Platform',
    description: isLassiLounge
      ? 'Order the best Indian food in New York from Lassi Lounge. Delivery, pickup, and reservations available.'
      : 'Order food from your favorite local restaurants.',
    images: ['/assets/images/branded/lassi-lounge/og-image.png'],
  },
  
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({ children }) {
  const brand = isLassiLounge ? 'lassi-lounge' : null;

  return (
    <html lang="en" data-brand={brand} suppressHydrationWarning>
      <head>
        {/* Google Ads (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-17610513177"
          strategy="afterInteractive"
        />
        <Script id="google-gtag" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-17610513177');
          `}
        </Script>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Dancing+Script:wght@400..700&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet" />

        {/* JSON-LD Structured Data for Google Rich Results */}
        {isLassiLounge && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'Restaurant',
                name: 'Lassi Lounge NY',
                image: `${siteUrl}/assets/images/branded/lassi-lounge/og-image.png`,
                url: siteUrl,
                telephone: '+1 347-233-3733',
                address: {
                  '@type': 'PostalAddress',
                  streetAddress: '9408 118th St',
                  addressLocality: 'South Richmond Hill',
                  addressRegion: 'NY',
                  postalCode: '11419',
                  addressCountry: 'US',
                },
                servesCuisine: 'Indian',
                priceRange: '$$',
                acceptsReservations: 'True',
                menu: `${siteUrl}/menu`,
                openingHoursSpecification: [
                  {
                    '@type': 'OpeningHoursSpecification',
                    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
                    opens: '11:00',
                    closes: '22:00',
                  },
                ],
              }),
            }}
          />
        )}
      </head>
      <body className="grid-bg min-h-screen bg-brand-bg text-brand-text antialiased selection:bg-brand-cyan selection:text-brand-bg"
        style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }} suppressHydrationWarning>
        <Providers>
          <ScrollToTop />
          {/* Decorative background glow elements */}
          <div className="pointer-events-none fixed left-[10%] top-[5%] -z-10 h-[350px] w-[350px] rounded-full bg-brand-cyan/10 opacity-40 blur-[80px]" />
          <div className="pointer-events-none fixed right-[15%] bottom-[10%] -z-10 h-[400px] w-[400px] rounded-full bg-brand-blue/10 opacity-30 blur-[100px]" />

          <SiteChrome>
            {/* Industry Standard: flex-1 ensures this container pushes the footer to the bottom */}
            <main className="flex-1 flex flex-col w-full relative">
              {children}
            </main>
          </SiteChrome>
        </Providers>
      </body>
    </html>
  );
}