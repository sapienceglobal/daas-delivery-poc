'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, UtensilsCrossed } from 'lucide-react';
import PopOutCapsuleImage from './PopOutCapsuleImage';

/**
 * AllCategoriesModal
 * Web counterpart to Flutter's `MenuCategoriesPopup` / All Categories Bottom Sheet.
 * Displays all categories in a clean, responsive 3D Pop-Out grid.
 */
export default function AllCategoriesModal({
  isOpen,
  onClose,
  categories = [],
  selectedCategoryId,
  onSelectCategory,
  title = 'All Categories',
}) {
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => {
      const name = (c.name || c.label || '').toLowerCase();
      return name.includes(q);
    });
  }, [categories, search]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-[#fcfaf5] border border-[#ebdcc1] rounded-t-[2rem] sm:rounded-3xl w-full max-w-3xl max-h-[85vh] sm:max-h-[88vh] overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-250 text-[#1a1a1a]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#ebdcc1]/80 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#7a0b10]/10 text-[#7a0b10] flex items-center justify-center font-bold">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-black text-lg text-[#0e0d0c] tracking-tight flex items-center gap-2">
                <span>{title}</span>
                <span className="text-[11px] font-sans font-bold px-2 py-0.5 rounded-full bg-[#e8a020]/15 text-[#92400e] border border-[#e8a020]/30">
                  {categories.length} Categories
                </span>
              </h3>
              <p className="text-[11px] text-[#6b7280]">
                Select a category to explore dishes
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#6b7280] hover:text-[#0e0d0c] hover:bg-[#f3ece6] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 pt-4 pb-2 bg-[#fcfaf5]">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search category (e.g. Biryani, Thali, Momos)..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#ebdcc1] rounded-xl text-xs sm:text-sm text-[#1a1a1a] placeholder-[#9ca3af] focus:outline-none focus:border-[#7a0b10] focus:ring-2 focus:ring-[#7a0b10]/10 transition-all shadow-2xs"
            />
          </div>
        </div>

        {/* Content Body / Responsive Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          {filteredCategories.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-x-2 gap-y-6 sm:gap-x-4 sm:gap-y-8 justify-items-center">
              {filteredCategories.map((cat) => {
                const id = cat._id || cat.id || cat.name;
                const isSelected = selectedCategoryId === id;

                return (
                  <PopOutCapsuleImage
                    key={id}
                    category={cat}
                    width={72}
                    isSelected={isSelected}
                    itemCount={cat.items?.length}
                    onClick={() => {
                      onSelectCategory(cat);
                      onClose();
                    }}
                  />
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-[#6b7280]">
              <p className="text-sm font-bold">No categories matching &quot;{search}&quot;</p>
              <button
                onClick={() => setSearch('')}
                className="mt-2 text-xs font-bold text-[#7a0b10] hover:underline"
              >
                Clear search
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#ebdcc1]/80 bg-white/70 flex items-center justify-between text-xs text-[#6b7280]">
          <span className="font-medium text-[#6b7280]">
            Select any category to view items
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#f3ece6] hover:bg-[#ebdcc1] text-[#0e0d0c] font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
