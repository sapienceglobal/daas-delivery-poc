import { Truck, BadgePercent, CreditCard, Headset } from 'lucide-react';
import FeatureIconItem from '@/components/ui/FeatureIconItem';
import { trustFeaturesContent } from '../config';

const FEATURE_ICONS = {
  'fast-delivery': Truck,
  'best-offers': BadgePercent,
  'secure-payment': CreditCard,
  support: Headset,
};

export default function TrustFeaturesStrip() {
  const { features } = trustFeaturesContent;

  return (
    <section className="bg-background-alt on-cream pb-16 pt-6">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        
        <div className="bg-[#FCF9F4] rounded-2xl shadow-sm border border-[#F0E6D8] py-6 flex flex-col lg:flex-row items-center justify-between divide-y lg:divide-y-0 lg:divide-x divide-[#F0E6D8]">
          
          {features.map((feature) => (
            <div key={feature.id} className="flex-1 w-full px-6 py-4 lg:py-0">
              <FeatureIconItem
                icon={FEATURE_ICONS[feature.id] ?? Truck}
                title={feature.title}
                description={feature.description}
              />
            </div>
          ))}
          
        </div>
      </div>
    </section>
  );
}