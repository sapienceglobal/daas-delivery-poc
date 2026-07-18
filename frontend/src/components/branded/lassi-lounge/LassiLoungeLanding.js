import HomeTopSection from './sections/HomeTopSection';
import SignatureDishesSection from './sections/SignatureDishesSection';
import StoryAndCateringSection from './sections/StoryAndCateringSection';
import TestimonialsSection from './sections/TestimonialsSection';
import TrustFeaturesStrip from './sections/TrustFeaturesStrip';

/**
 * LassiLoungeLanding — pure composition layer, no markup of its own.
 * Rendered from src/app/customer/page.js when
 * NEXT_PUBLIC_SINGLE_RESTAURANT_MODE=true.
 *
 * COMPLETE — every section from the reference screenshot is now wired,
 * top to bottom.
 */
export default function LassiLoungeLanding() {
  return (
    <div className="ll-page-enter">
      <HomeTopSection/>
      <div className="ll-reveal"><SignatureDishesSection /></div>
      <div className="ll-reveal"><StoryAndCateringSection /></div>
      <div className="ll-reveal"><TestimonialsSection /></div>
      <div className="ll-reveal"><TrustFeaturesStrip /></div>
    </div>
  );
}
