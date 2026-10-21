'use client';
import React from 'react';
import Link from 'next/link';

/**
 * Global StatCard component matching original clean layout with full Dark/Light theme support.
 * 
 * Supports both original props (title, iconColor, iconBg, trend, footer, onClick)
 * and new props (label, color, up, href).
 */
export default function StatCard({ 
  title, 
  label,
  value, 
  icon: Icon, 
  iconColor, 
  iconBg, 
  color,
  trend,
  up,
  footer,
  loading = false,
  href,
  onClick
}) {
  const displayTitle = title || label;

  // Resolve styling for icon container
  let boxStyle = 'bg-brand/10 text-brand';
  if (color) {
    boxStyle = color;
  } else if (iconBg && iconColor) {
    boxStyle = `${iconBg} ${iconColor}`;
  } else if (iconBg) {
    boxStyle = `${iconBg} text-brand`;
  }

  // Parse trend data
  let trendDirection = null;
  let trendValue = '';
  let trendSubtitle = '';

  if (trend && typeof trend === 'object') {
    trendDirection = trend.direction;
    trendValue = trend.value || '';
    trendSubtitle = trend.subtitle || '';
  } else if (typeof trend === 'string') {
    trendValue = trend;
    trendDirection = up === true ? 'up' : up === false ? 'down' : 'neutral';
  }

  // Adaptive font sizing based on length so numbers NEVER truncate
  const valString = String(value ?? '');
  const valLength = valString.length;

  let valSizeClasses = 'text-xl sm:text-2xl';
  if (valLength > 11) {
    valSizeClasses = 'text-sm sm:text-base';
  } else if (valLength > 8) {
    valSizeClasses = 'text-base sm:text-lg xl:text-xl';
  } else if (valLength > 6) {
    valSizeClasses = 'text-lg sm:text-xl xl:text-2xl';
  }

  const CardContent = (
    <div 
      onClick={onClick}
      className={`bg-admin-card p-3 sm:p-3.5 xl:p-4 rounded-2xl border border-admin-border shadow-xs flex flex-col justify-between relative overflow-hidden group hover:shadow-md hover:border-admin-border-light transition-all duration-200 select-none min-h-[96px] sm:min-h-[104px] h-full ${
        (href || onClick) ? 'cursor-pointer hover:-translate-y-0.5' : ''
      }`}
    >
      {/* Background decorative soft blur circle */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-16 h-16 bg-brand/10 dark:bg-brand/15 rounded-full translate-x-1/3 opacity-30 dark:opacity-20 pointer-events-none group-hover:scale-125 transition-transform duration-500 blur-sm" />
      
      {/* Top Details Row: Icon + Title & Value */}
      <div className="flex items-start gap-2.5 sm:gap-3 relative z-10">
        <div className={`w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-xl ${boxStyle} flex items-center justify-center shrink-0 shadow-2xs mt-0.5`}>
          {Icon && <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />}
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span 
            className="text-[11px] sm:text-xs font-bold text-admin-text-secondary leading-snug line-clamp-2"
            title={displayTitle}
          >
            {displayTitle}
          </span>
          <span 
            className={`${valSizeClasses} font-black text-admin-text font-outfit tracking-tight whitespace-nowrap overflow-visible mt-0.5 leading-tight`}
            title={valString}
          >
            {loading ? '...' : value}
          </span>
        </div>
      </div>
      
      {/* Bottom Trend or Footer */}
      {(trendValue || footer) && (
        <div className="relative z-10 mt-2 pt-1.5 border-t border-admin-border/40 flex items-center justify-between gap-1 text-[11px] font-bold">
          {trendValue && (
            <span className={`inline-flex items-center gap-1 font-semibold whitespace-nowrap ${
              trendDirection === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 
              trendDirection === 'down' ? 'text-rose-600 dark:text-rose-400' : 
              'text-admin-text-muted'
            }`}>
              {trendDirection === 'up' && '↑ '}
              {trendDirection === 'down' && '↓ '}
              {trendValue}
              {trendSubtitle && <span className="text-admin-text-muted font-normal ml-0.5">{trendSubtitle}</span>}
            </span>
          )}
          {footer && <div className="text-admin-text-muted font-normal whitespace-nowrap">{footer}</div>}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {CardContent}
      </Link>
    );
  }

  return CardContent;
}
