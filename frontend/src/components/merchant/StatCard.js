'use client';
import React from 'react';

/**
 * Global StatCard component for the Merchant Dashboard.
 * 
 * @param {Object} props
 * @param {string} props.title - The title of the stat card (e.g. "Total Revenue")
 * @param {string|number} props.value - The value to display
 * @param {React.ElementType} props.icon - The Lucide icon component to display
 * @param {string} props.iconColor - Tailwind class for icon color (e.g., "text-[#10B981]")
 * @param {string} props.iconBg - Tailwind class for icon background (e.g., "bg-[#ecfdf5]")
 * @param {Object} [props.trend] - Optional trend data
 * @param {string} props.trend.direction - 'up', 'down', or 'neutral'
 * @param {string} props.trend.value - Trend percentage/value (e.g., "14.3%")
 * @param {string} props.trend.subtitle - Subtitle text (e.g., "vs last month")
 */
export default function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  iconColor = "text-[#6b7280]", 
  iconBg = "bg-[#f3f4f6]", 
  trend,
  footer,
  onClick
}) {
  return (
    <div 
      onClick={onClick}
      className={`bg-white p-4 rounded-xl border border-[#e5e7eb] shadow-sm flex flex-col justify-center relative overflow-hidden group hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer hover:border-[#d1d5db]' : ''}`}
    >
      {/* Background decorative circle */}
      <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-16 h-16 ${iconBg} rounded-full translate-x-1/2 opacity-70 group-hover:scale-110 transition-transform duration-500`}></div>
      
      <div className="flex items-center gap-3 mb-2 relative z-10">
        <div className={`w-8 h-8 rounded-full ${iconBg} flex items-center justify-center shrink-0`}>
          {Icon && <Icon className={`w-4 h-4 ${iconColor}`} />}
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-bold text-[#6b7280]">{title}</span>
          <span className="text-2xl font-bold text-[#111827]">{value}</span>
        </div>
      </div>
      
      {trend && (
        <span className={`text-xs font-bold relative z-10 mt-1 ${
          trend.direction === 'up' ? 'text-[#10B981]' : 
          trend.direction === 'down' ? 'text-[#ef4444]' : 'text-[#6b7280]'
        }`}>
          {trend.direction === 'up' ? '↑ ' : trend.direction === 'down' ? '↓ ' : ''}
          {trend.value} <span className="text-[#9ca3af] font-normal">{trend.subtitle}</span>
        </span>
      )}

      {footer && (
        <div className="relative z-10 mt-2">
          {footer}
        </div>
      )}
    </div>
  );
}
