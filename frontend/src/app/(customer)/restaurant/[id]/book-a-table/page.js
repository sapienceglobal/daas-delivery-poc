'use client';

import { useParams } from 'next/navigation';
import BookTablePage from '@/components/book-table/BookTablePage';

export default function BookATableRoute() {
  const { id } = useParams();

  // Passing the restaurantId down to the BookTablePage component
  return (
    <BookTablePage restaurantId={id} />
  );
}
