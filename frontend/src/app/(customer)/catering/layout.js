import { getPageMetadata } from '@/lib/pageSeo';

export async function generateMetadata() {
  return getPageMetadata('/catering');
}

export default function CateringLayout({ children }) {
  return children;
}
