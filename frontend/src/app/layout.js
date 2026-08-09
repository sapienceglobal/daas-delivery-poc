import './globals.css';
import { Providers } from '@/components/shared/Providers';
import SiteChrome from '@/components/shared/SiteChrome';
import ScrollToTop from '@/components/shared/ScrollToTop';

const isLassiLounge = process.env.NEXT_PUBLIC_SINGLE_RESTAURANT_MODE === 'true';

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://195.35.20.207:3001'),
  title: isLassiLounge ? 'Lassi Lounge' : 'Restaurant Commerce Platform',
  description: isLassiLounge
    ? 'Authentic Indian restaurant — order online, reserve a table, or get delivery.'
    : 'Order food from your favorite local restaurants — delivery, pickup, or dine-in.',
  keywords: 'food delivery, restaurant, ordering, DoorDash, pickup, dine-in',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: isLassiLounge ? 'Lassi Lounge' : 'Restaurant Commerce Platform',
    description: isLassiLounge
      ? 'Authentic Indian restaurant — order online, reserve a table, or get delivery.'
      : 'Order food from your favorite local restaurants — delivery, pickup, or dine-in.',
    images: ['/assets/images/branded/lassi-lounge/og-image.png'],
  },
};

export default function RootLayout({ children }) {
  const brand = isLassiLounge ? 'lassi-lounge' : null;

  return (
    <html lang="en" data-brand={brand} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Dancing+Script:wght@400..700&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet" />
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