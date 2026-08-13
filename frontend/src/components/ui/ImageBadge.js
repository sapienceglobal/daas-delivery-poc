import Image from 'next/image';

export default function ImageBadge({ image, badge, rounded = true }) {
  return (
   
    <div className={`relative w-full h-full overflow-hidden ${rounded ? 'rounded-md' : ''}`}>
      <Image src={image.src} alt={image.alt} fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover" />

      {badge && (
        <div
          className="absolute bottom-6 left-6 bg-accent-500 text-black font-bold uppercase tracking-widest py-3.5 px-6 rounded-md shadow-md flex items-center gap-2"
        >
          <span className="font-heading font-black text-2xl leading-none">{badge.value}</span>
          <span className="text-xs leading-none">
            {badge.label}
          </span>
        </div>
      )}
    </div>
  );
}