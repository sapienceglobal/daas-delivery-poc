'use client';

import React from 'react';
import Image from 'next/image';
import { getCategory3DImage } from '@/lib/category3DHelper';

/**
 * PopOutCapsuleImage
 * Web implementation of the Customer Flutter Mobile App's `PopOutCapsuleImage` widget.
 * Features:
 * - Vertical oval capsule backdrop with warm peach-to-white radial gradient (#FDEFD5 -> #FFFFFF)
 * - Elliptical soft contact shadow directly under the floating dish
 * - Floating 3D food cutout that dynamically pops out of the capsule with depth drop-shadow
 * - Interactive hover micro-motion (smooth lift & scale)
 * - Compact uppercase bold typography with active crimson indicator
 */
export default function PopOutCapsuleImage({
  category,
  label,
  imageUrl,
  icon: IconComponent,
  width = 80,
  isSelected = false,
  onClick,
  showLabel = true,
  className = '',
  itemCount,
}) {
  const displayLabel = label || (typeof category === 'object' ? category.name : category) || '';
  const finalImageUrl = imageUrl || getCategory3DImage(category);

  // Aspect ratio 1.25 matching Flutter kOvalAspectRatio
  const ovalHeight = Math.round(width * 1.25);
  // Scale 1.12 matching Flutter kDishScale
  const dishSize = Math.round(width * 1.12);
  // Slight upward pop-out offset
  const dishTopOffset = Math.round((ovalHeight - dishSize) / 2 - width * 0.04);
  // Contact shadow size
  const shadowWidth = Math.round(width * 0.62);

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`group flex flex-col items-center select-none outline-none ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
      style={{ width: `${Math.max(width + 10, 84)}px` }}
    >
      {/* ─── 3D POP-OUT CAPSULE CONTAINER ─── */}
      <div
        className="relative flex items-center justify-center transition-transform duration-300 ease-out group-hover:-translate-y-1"
        style={{ width: `${width}px`, height: `${ovalHeight}px` }}
      >
        {/* 1. Vertical Oval Backdrop with Radial Gradient & Border Glow */}
        <div
          className={`absolute inset-0 rounded-[9999px] transition-all duration-300 ${
            isSelected
              ? 'ring-2 ring-[#7a0b10] border-2 border-[#7a0b10] shadow-[0_8px_22px_rgba(122,11,16,0.24)] scale-[1.02]'
              : 'border border-[#ebdcc1]/70 shadow-[0_4px_16px_rgba(0,0,0,0.06)] group-hover:border-[#e8a020] group-hover:shadow-[0_8px_20px_rgba(232,160,32,0.16)]'
          }`}
          style={{
            background: isSelected
              ? 'radial-gradient(circle at center, #FDE6D2 0%, #FFFFFF 100%)'
              : 'radial-gradient(circle at center, #FDEFD5 0%, #FFFFFF 100%)',
          }}
        />

        {/* 2. Contact Shadow directly below the dish (only for food dishes) */}
        {!IconComponent && (
          <div
            className="absolute pointer-events-none rounded-full transition-opacity duration-300 group-hover:opacity-80"
            style={{
              width: `${shadowWidth}px`,
              height: '7px',
              bottom: `${Math.round(ovalHeight * 0.10)}px`,
              background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0) 75%)',
              filter: 'blur(2.5px)',
            }}
          />
        )}

        {/* 3. Floating 3D Cutout Food Image OR Clean Branded Icon */}
        <div
          className="absolute z-10 pointer-events-none flex items-center justify-center transition-all duration-300 ease-out group-hover:scale-115 group-hover:-translate-y-1.5"
          style={{
            width: `${dishSize}px`,
            height: `${dishSize}px`,
            top: `${dishTopOffset}px`,
          }}
        >
          {IconComponent ? (
            <IconComponent
              className={`w-8 h-8 sm:w-9 sm:h-9 transition-colors duration-300 drop-shadow-sm ${
                isSelected ? 'text-[#7a0b10]' : 'text-[#7a0b10]/85 group-hover:text-[#7a0b10]'
              }`}
            />
          ) : (
            <img
              src={finalImageUrl}
              alt={displayLabel}
              loading="lazy"
              className="w-full h-full object-contain filter drop-shadow-[0_6px_10px_rgba(0,0,0,0.14)] group-hover:drop-shadow-[0_10px_16px_rgba(122,11,16,0.22)] transition-all duration-300"
            />
          )}
        </div>

        {/* Optional Item Count Badge (Top-Right of Capsule) */}
        {typeof itemCount === 'number' && itemCount > 0 && (
          <span
            className={`absolute -top-1 -right-1 z-20 text-[9px] font-black px-1.5 py-0.5 rounded-full border shadow-sm transition-colors ${
              isSelected
                ? 'bg-[#7a0b10] text-white border-white'
                : 'bg-white/95 text-[#6b7280] border-[#ebdcc1] group-hover:text-[#7a0b10] group-hover:border-[#7a0b10]/40'
            }`}
          >
            {itemCount}
          </span>
        )}
      </div>

      {/* ─── LABEL ─── */}
      {showLabel && displayLabel && (
        <div className="mt-2.5 flex flex-col items-center w-full px-0.5">
          <span
            className={`text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-center line-clamp-2 leading-tight transition-colors duration-200 font-sans ${
              isSelected
                ? 'text-[#7a0b10]'
                : 'text-[#1a1a1a] group-hover:text-[#7a0b10]'
            }`}
          >
            {displayLabel}
          </span>

          {/* Active Underline Pill (Matching Flutter App) */}
          {isSelected && (
            <span className="w-4 h-[2.5px] bg-[#7a0b10] rounded-full mt-1.5 animate-in fade-in zoom-in-75 duration-200" />
          )}
        </div>
      )}
    </div>
  );
}
