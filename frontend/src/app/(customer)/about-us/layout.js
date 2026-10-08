import { getPageMetadata } from '@/lib/pageSeo';

export async function generateMetadata() {
  return getPageMetadata('/about-us');
}

export default function AboutUsLayout({ children }) {
  return children;
}
