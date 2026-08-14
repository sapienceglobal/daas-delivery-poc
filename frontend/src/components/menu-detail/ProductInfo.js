'use client';

import { useState, useRef, useEffect } from 'react';
import { Star, Leaf, Flame, Clock, Heart, ChevronLeft, ChevronRight } from 'lucide-react';

const MOCK_THUMBNAILS = [
  'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=600&q=80', // Paneer tikka
  'https://images.unsplash.com/photo-1626804475297-41609ea004eb?auto=format&fit=crop&w=600&q=80', // Mint chutney
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80', // Alternate view
  'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=600&q=80', // Tandoor / Grill
  'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=600&q=80', // Curry samosa side
];

export default function ProductInfo({ item, isSingleRestaurant, isFavorite, onToggleFavorite }) {
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      const activeElement = scrollRef.current.children[activeImageIdx];
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeImageIdx]);

  const getDishImage = (itemName) => {
    const name = itemName.toLowerCase();
    if (name.includes('butter chicken')) return '/images/branded/lassi-lounge/dishes/butter-chicken.png';
    if (name.includes('cheese naan')) return '/images/branded/lassi-lounge/dishes/cheese-naan.jpg';
    if (name.includes('chicken pakora')) return '/images/branded/lassi-lounge/dishes/chicken-pakora.jpg';
    if (name.includes('chicken tikka masala')) return '/images/branded/lassi-lounge/dishes/chicken-tikka-masala.jpg';
    if (name.includes('garlic naan')) return '/images/branded/lassi-lounge/dishes/garlic-naan.png';
    if (name.includes('kesar badam') || name.includes('badam milk') || name.includes('kesarbadammilk')) return '/images/branded/lassi-lounge/dishes/kesar-badam-milk.jpg';
    if (name.includes('rogan josh') || name.includes('lamb')) return '/images/branded/lassi-lounge/dishes/lamb-rogan-josh.jpg';
    if (name.includes('masala chai') || name.includes('tea')) return '/images/branded/lassi-lounge/dishes/masala-chai.jpg';
    if (name.includes('salt lassi') || name.includes('salted lassi')) return '/images/branded/lassi-lounge/dishes/salt-lassi.jpg';
    if (name.includes('sweet lassi')) return '/images/branded/lassi-lounge/dishes/sweet-lassi.jpg';
    if (name.includes('mango lassi')) return '/images/branded/lassi-lounge/dishes/mango-lassi.jpg';
    if (name.includes('samosa')) return '/images/branded/lassi-lounge/dishes/samosa.jpg';
    if (name.includes('tandoori chiken') || name.includes('tandoori chicken')) return '/images/branded/lassi-lounge/dishes/tandoori-chiken.png';
    if (name.includes('paneer tikka')) return '/images/branded/lassi-lounge/dishes/paneer-tikka.jpg';
    if (name.includes('tandoori roti')) return '/images/branded/lassi-lounge/dishes/tandoori-roti.png';
    if (name.includes('biryani')) return '/images/branded/lassi-lounge/dishes/chicken-biryani.jpg';
    if (name.includes('dal makhani')) return '/images/branded/lassi-lounge/dishes/dal-makhani.jpg';
    if (name.includes('roll') || name.includes('spring')) return '/images/branded/lassi-lounge/dishes/veg-spring-rolls.png';
    return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80';
  };

  const images = [getDishImage(item.name), ...MOCK_THUMBNAILS.slice(1)];

  const handlePrev = () => {
    setActiveImageIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveImageIdx((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left 5 Columns: Image Carousel */}
      <div className="lg:col-span-5 space-y-4">
        {/* Main Image Wrapper */}
        <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden shadow-sm bg-[#f3f4f6] group border border-[#e5e7eb]">
          <img
            src={images[activeImageIdx]}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* Favorite heart on image */}
          <button
            onClick={onToggleFavorite}
            className="absolute top-4 right-4 p-2.5 bg-[#1a1a1a]/40 border border-[#ffffff]/30 backdrop-blur-sm rounded-full shadow-md text-[#ffffff] hover:text-[#ef4444] transition-colors"
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-[#ef4444] text-[#ef4444]' : ''}`} strokeWidth={2} />
          </button>
        </div>

        {/* Thumbnail gallery */}
        <div className="flex items-center gap-2 relative select-none">
          <button
            onClick={handlePrev}
            className="w-8 h-8 rounded-full border border-[#e5e7eb] bg-[#ffffff] hover:bg-[#f9fafb] flex items-center justify-center text-[#4b5563] shadow-sm shrink-0 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <div 
            ref={scrollRef}
            className="flex-1 flex gap-2 overflow-x-auto py-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImageIdx(idx)}
                className={`relative aspect-[4/3] w-16 md:w-20 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                  activeImageIdx === idx
                    ? isSingleRestaurant
                      ? 'border-[#7a0b10] scale-[1.02]'
                      : 'border-[#6b52ff] scale-[1.02]'
                    : 'border-transparent hover:border-[#d1d5db]'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>

          <button
            onClick={handleNext}
            className="w-8 h-8 rounded-full border border-[#e5e7eb] bg-[#ffffff] hover:bg-[#f9fafb] flex items-center justify-center text-[#4b5563] shadow-sm shrink-0 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Right 7 Columns: Product details text */}
      <div className="lg:col-span-7 space-y-5 lg:pl-4">
        <div className="space-y-3">
          <h1 className="text-3xl md:text-[40px] font-bold font-serif text-[#1a1a1a] tracking-tight leading-none">
            {item.name}
          </h1>
          
          {/* Star ratings */}
          <div className="flex items-center gap-2.5">
            <div className="flex text-[#e8a020]">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${i < 4 ? 'fill-current' : 'text-[#d1d5db] fill-[#d1d5db]'}`}
                />
              ))}
            </div>
            <span className="text-[13px] font-medium text-[#6b7280]">4.6 (128 Reviews)</span>
          </div>
        </div>

        {/* Price */}
        <div className={`text-[28px] font-bold ${isSingleRestaurant ? 'text-[#7a0b10]' : 'text-[#6b52ff]'}`}>
          ${item.price?.toFixed(2)}
        </div>

        {/* Description */}
        {item.description && (
          <p className="text-[14px] leading-relaxed text-[#4b5563] font-medium max-w-[90%]">
            {item.description}
          </p>
        )}

        {/* Attributes row */}
        <div className="flex flex-wrap gap-3 pt-3 pb-5 text-[14px] font-medium text-[#1a1a1a]">
          {item.isVeg ? (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#dcfce7] text-[#166534] font-bold border border-[#bbf7d0] shadow-sm">
              <Leaf className="w-4 h-4 fill-current text-[#16a34a]" />
              Veg
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#fee2e2] text-[#991b1b] font-bold border border-[#fecaca] shadow-sm">
              <div className="w-2.5 h-2.5 rounded-full bg-[#dc2626]"></div>
              Non-Veg
            </span>
          )}

          {typeof item.isSpicy !== 'undefined' && (
            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold border shadow-sm ${item.isSpicy ? 'bg-[#ffedd5] text-[#9a3412] border-[#fed7aa]' : 'bg-[#f3f4f6] text-[#374151] border-[#e5e7eb]'}`}>
              <Flame className={`w-4 h-4 ${item.isSpicy ? 'text-[#ea580c]' : 'text-[#6b7280]'}`} />
              {item.isSpicy ? 'Spicy' : 'Mild'}
            </span>
          )}

          {item.preparationTime && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#dbeafe] text-[#1e40af] font-bold border border-[#bfdbfe] shadow-sm">
              <Clock className="w-4 h-4 text-[#2563eb]" />
              {item.preparationTime} mins
            </span>
          )}

          {item.cookingMethod && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f3e8ff] text-[#6b21a8] font-bold border border-[#e9d5ff] shadow-sm">
              <span className="flex items-center shrink-0 text-[#9333ea]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20M17 5H7a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3Z"/></svg>
              </span>
              {item.cookingMethod}
            </span>
          )}
        </div>

        {/* Ingredients section */}
        {item.ingredients && item.ingredients.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-[#e5e7eb]">
            <h3 className={`text-[20px] font-bold font-serif mt-4 ${isSingleRestaurant ? 'text-[#7a0b10]' : 'text-[#6b52ff]'}`}>
              Ingredients
            </h3>
            <p className="text-[14px] text-[#4b5563] leading-relaxed font-medium">
              {Array.isArray(item.ingredients) ? item.ingredients.join(', ') : item.ingredients}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}