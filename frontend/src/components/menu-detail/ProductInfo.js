'use client';

import { useState } from 'react';
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

  const getDishImage = (itemName) => {
    const name = itemName.toLowerCase();
    if (name.includes('butter chicken')) return '/images/branded/lassi-lounge/dishes/butter-chicken.jpg';
    if (name.includes('rogan josh') || name.includes('lamb')) return '/images/branded/lassi-lounge/dishes/lamb-rogan-josh.jpg';
    if (name.includes('paneer tikka')) return '/images/branded/lassi-lounge/dishes/paneer-tikka.jpg';
    if (name.includes('biryani')) return '/images/branded/lassi-lounge/dishes/chicken-biryani.jpg';
    if (name.includes('dal makhani')) return '/images/branded/lassi-lounge/dishes/dal-makhani.jpg';
    if (name.includes('lassi')) return '/images/branded/lassi-lounge/dishes/mango-lassi.jpg';
    if (name.includes('roll') || name.includes('spring')) return '/images/branded/lassi-lounge/dishes/veg-spring-rolls.png';
    return item.image || MOCK_THUMBNAILS[0];
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
          
          <div className="flex-1 flex gap-2 overflow-x-auto scrollbar-none py-1">
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
        <p className="text-[14px] leading-relaxed text-[#4b5563] font-medium max-w-[90%]">
          {item.description || 'Delectable and cooked to perfection using the finest spices and recipes.'}
        </p>

        {/* Attributes row */}
        <div className="grid grid-cols-2 gap-y-4 gap-x-2 pt-3 pb-5 text-[14px] font-medium text-[#1a1a1a]">
          <div className="flex items-center gap-2">
            <Leaf className="w-4.5 h-4.5 text-[#16a34a] stroke-[2.5]" />
            <span>{item.isVeg ? 'Veg' : 'Non Veg'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Flame className="w-4.5 h-4.5 text-[#dc2626] stroke-[2.5]" />
            <span>{item.isSpicy ? 'Medium Spicy' : 'Mild'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4.5 h-4.5 text-[#e8a020] stroke-[2.5]" />
            <span>{item.preparationTime ? `${item.preparationTime} mins` : '25-30 mins'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#7a0b10] flex items-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20M17 5H7a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3Z"/></svg>
            </span>
            <span>{item.cookingMethod || 'Tandoor Grilled'}</span>
          </div>
        </div>

        {/* Ingredients section */}
        <div className="space-y-1.5 pt-2 border-t border-[#e5e7eb]">
          <h3 className={`text-[20px] font-bold font-serif mt-4 ${isSingleRestaurant ? 'text-[#7a0b10]' : 'text-[#6b52ff]'}`}>
            Ingredients
          </h3>
          <p className="text-[14px] text-[#4b5563] leading-relaxed font-medium">
            {item.ingredients || 'Paneer, Yogurt, Ginger Garlic Paste, Lemon Juice, Garam Masala, Turmeric, Red Chili Powder, Cumin Powder, Coriander Powder, Salt, Kasuri Methi, Mustard Oil, Capsicum, Onion.'}
          </p>
        </div>
      </div>
    </div>
  );
}