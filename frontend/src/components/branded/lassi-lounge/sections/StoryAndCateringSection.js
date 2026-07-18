import ImageBadge from '@/components/ui/ImageBadge';
import StorySection from './StorySection';
import CateringSection from './CateringSection';
import { storyContent } from '../config';

export default function StoryAndCateringSection() {
  return (

    <section className="bg-background-alt w-full pt-8 pb-12">
      <div className="mx-auto max-w-7xl px-4 md:px-8">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 items-stretch rounded-lg overflow-hidden shadow-xl">


          <StorySection />


          <ImageBadge
            image={storyContent.image}
            badge={storyContent.badge}
            rounded={false}
          />


          <CateringSection />

        </div>
      </div>
    </section>
  );
}