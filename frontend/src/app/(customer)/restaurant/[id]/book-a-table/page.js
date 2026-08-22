'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import BookTablePage from '@/components/book-table/BookTablePage';

const SINGLE_MODE = process.env.NEXT_PUBLIC_SINGLE_RESTAURANT_MODE === 'true';

function Redirect({ to }) {
  const router = useRouter();
  useEffect(() => { router.replace(to); }, []);
  return null;
}

export default function BookATableRoute() {
  const { id } = useParams();

  // clean URL: /book-a-table (no restaurant slug needed in single mode)
  if (SINGLE_MODE) return <Redirect to="/book-a-table" />;

  return <BookTablePage restaurantId={id} />;
}
