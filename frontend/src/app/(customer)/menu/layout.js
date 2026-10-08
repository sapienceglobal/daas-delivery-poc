import { getPageMetadata } from '@/lib/pageSeo';

export async function generateMetadata() {
  return getPageMetadata('/menu');
}

export default function MenuLayout({ children }) {
  return children;
}
