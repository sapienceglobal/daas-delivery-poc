import React from 'react';
import Image from 'next/image';
import { Heart, Briefcase, PartyPopper, ChevronRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import { cateringContent } from '../config';

const SERVICE_ICONS = {
  weddings: Heart,
  'corporate-events': Briefcase,
  'private-parties': PartyPopper,
};

export default function CateringSection() {
  const { eyebrowScript, heading, description, cta, services, image } = cateringContent;

  return (

    <div className="relative w-full h-full flex flex-col justify-center overflow-hidden">
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes="(min-width: 1024px) 33vw, 100vw"
        className="object-cover -z-10 object-right"
      />
      
      <div className="absolute inset-0 bg-gradient-to-r from-primary-900 via-primary-900/90 to-transparent -z-10" />

      <div className="relative p-6 md:p-8 lg:p-10 w-full z-10">
        <p className="text-3xl text-accent-500 mb-2" style={{ fontFamily: 'var(--font-script)' }}>
          {eyebrowScript}
        </p>
        
        <h2 className="font-heading font-black text-3xl md:text-4xl leading-tight text-white uppercase mb-4 max-w-[280px]">
          {heading}
        </h2>
        
        <p className="text-white text-sm font-medium leading-relaxed mb-8 max-w-[280px]">
          {description}
        </p>

        <Button
          href={cta.href}
          variant="custom"
          className="bg-accent-500 hover:bg-accent-600 text-black font-bold text-xs uppercase tracking-widest py-3.5 px-6 rounded-md shadow-md inline-flex items-center gap-2 self-start transition-colors"
        >
          {cta.label} <ChevronRight size={16} strokeWidth={2.5} />
        </Button>

        <div className="flex items-start justify-between mt-8 w-full max-w-sm">
          {services.map((service, index) => {
            const Icon = SERVICE_ICONS[service.id] ?? Heart;
            return (
              <React.Fragment key={service.id}>
                <div className="flex flex-col items-center gap-3 text-center flex-1">
                  <Icon size={30} className="text-accent-500" strokeWidth={1.5} />
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest leading-tight">
                    {service.label}
                  </span>
                </div>
                {index < services.length - 1 && (
                  <div className="w-px h-10 bg-white/20 mx-2 mt-1" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}