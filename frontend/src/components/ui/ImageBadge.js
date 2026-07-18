import Image from 'next/image';

export default function ImageBadge({ image, badge, rounded = true }) {
  return (
   
    <div className={`relative w-full h-full overflow-hidden ${rounded ? 'rounded-md' : ''}`}>
      <Image src={image.src} alt={image.alt} fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover" />

      {badge && (
        <div
          className="absolute bottom-6 left-6 w-28 h-28 rounded-full bg-primary-600 text-white
                      flex flex-col items-center justify-center text-center border-[3px] border-accent-400 shadow-lg"
        >
          <span className="font-heading font-black text-2xl leading-none">{badge.value}</span>
          <span className="text-[10px] font-bold uppercase tracking-wide leading-tight mt-1 px-2">
            {badge.label}
          </span>
        </div>
      )}
    </div>
  );
}