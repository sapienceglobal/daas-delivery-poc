import ErrorView from '@/components/shared/ErrorView';

// Next.js serves this with a real HTTP 404 status for any unknown route
// and whenever a page calls notFound() (e.g. a deleted menu item).
export const metadata = {
  title: 'Page Not Found',
  description: "Sorry, the page you're looking for doesn't exist. Explore our menu, order online, or book a table.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return <ErrorView code={404} />;
}
