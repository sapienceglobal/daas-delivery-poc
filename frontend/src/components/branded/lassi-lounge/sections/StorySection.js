import { ChefHat, Leaf, Users, ChevronRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import { storyContent } from '../config';

const FEATURE_ICONS = {
  'authentic-recipes': ChefHat,
  'fresh-ingredients': Leaf,
  'warm-ambience': Users,
};

export default function StorySection() {
  const { eyebrowScript, description, features, cta } = storyContent;

  return (
  
    <div className="bg-background-alt on-cream p-6 md:p-8 lg:p-10 flex flex-col justify-center w-full h-full relative overflow-hidden">
      
      <div 
        className="absolute bottom-0 left-0 w-full h-32 opacity-30 pointer-events-none"
        style={{ 
          backgroundImage: 'url(/images/taj-mahal-sketch.png)', 
          backgroundPosition: 'bottom left',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat'
        }}
      />

      <div className="relative z-10">
        <p
          className="text-3xl text-primary-600 mb-2"
          style={{ fontFamily: 'var(--font-script)' }}
        >
          {eyebrowScript}
        </p>

        <h2 className="font-heading font-black text-3xl md:text-4xl leading-tight mb-4 uppercase">
          <span className="text-text">The Essence Of</span>
          <br />
          <span className="text-primary-600">Authentic India</span>
        </h2>

        <p className="text-text text-sm font-medium leading-relaxed mb-6 max-w-md">
          {description}
        </p>

        <ul className="flex flex-col gap-4 mb-8">
          {features.map((feature) => {
            const Icon = FEATURE_ICONS[feature.id] ?? ChefHat;
            return (
              <li key={feature.id} className="flex items-start gap-4">
                <span className="w-10 h-10 rounded-full border-2 border-primary-700 text-primary-700 flex items-center justify-center shrink-0">
                  <Icon size={20} strokeWidth={2} />
                </span>
                <div>
                  <span className="block text-sm font-bold text-primary-700 uppercase tracking-wide">
                    {feature.title}
                  </span>
                  <span className="block text-xs text-text-secondary mt-1 leading-relaxed">
                    {feature.description}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>

        <Button
          href={cta.href}
          variant="custom"
          className="bg-primary-800 hover:bg-primary-900 text-white font-bold text-xs uppercase tracking-widest py-3.5 px-6 rounded-md shadow-md inline-flex items-center gap-2 self-start transition-colors"
        >
          {cta.label} <ChevronRight size={16} strokeWidth={2.5} />
        </Button>
      </div>
    </div>
  );
}