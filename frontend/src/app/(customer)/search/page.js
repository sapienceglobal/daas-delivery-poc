import { Suspense } from 'react';
import SearchScreenView from '@/components/search/SearchScreenView';

export const metadata = {
  title: 'Search Dishes & Categories | Lassi Lounge NY',
  description: 'Search our full menu of delicious dishes, categories, and royal Indian delicacies. Order online for delivery or pickup.',
};

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF3E8] flex items-center justify-center">
          <div className="w-10 h-10 border-3 border-[#7A0B10] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SearchScreenView />
    </Suspense>
  );
}

