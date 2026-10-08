import HomePageClient from './HomePageClient';
import { getPageMetadata } from '@/lib/pageSeo';

/**
 * Server Component for the Home / Landing Page.
 * Dynamically retrieves editable SEO settings from backend (PageSeo)
 * with robust hardcoded fallbacks and on-demand ISR revalidation.
 */
export async function generateMetadata() {
  return getPageMetadata('/');
}

export default function HomePage() {
  return <HomePageClient />;
}
