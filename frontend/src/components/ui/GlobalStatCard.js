import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function GlobalStatCard({ 
  label, 
  value, 
  icon: Icon, 
  trendValue, 
  trendLabel = "vs yesterday",
  color = "green" 
}) {
  const isPositive = trendValue >= 0;
  
  const colorStyles = {
    yellow: { bg: 'bg-[#FFF9E6]', text: 'text-[#F59E0B]', icon: 'text-[#F59E0B]' },
    pink: { bg: 'bg-[#FCE7F3]', text: 'text-[#DB2777]', icon: 'text-[#DB2777]' },
    blue: { bg: 'bg-[#E0F2FE]', text: 'text-[#0284C7]', icon: 'text-[#0284C7]' },
    orange: { bg: 'bg-[#FFEDD5]', text: 'text-[#EA580C]', icon: 'text-[#EA580C]' },
    green: { bg: 'bg-[#DCFCE7]', text: 'text-[#16A34A]', icon: 'text-[#16A34A]' },
    purple: { bg: 'bg-[#F3E8FF]', text: 'text-[#9333EA]', icon: 'text-[#9333EA]' },
  };

  const style = colorStyles[color] || colorStyles.green;

  return (
    <div className="bg-white rounded-[20px] p-5 shadow-sm border border-[#f3f4f6] flex flex-col justify-between h-full">
      <div className="flex items-center gap-4 mb-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${style.bg}`}>
          {Icon && <Icon className={`w-6 h-6 ${style.icon}`} strokeWidth={2} />}
        </div>
        <div>
          <p className="text-[13px] font-semibold text-[#1f2937] tracking-wide mb-0.5">{label}</p>
          <h3 className="text-2xl font-black text-black">{value}</h3>
        </div>
      </div>
      
      {trendValue !== undefined && (
        <div className="flex items-center gap-1.5 mt-auto">
          {isPositive ? (
            <TrendingUp className="w-4 h-4 text-[#22c55e]" strokeWidth={3} />
          ) : (
            <TrendingDown className="w-4 h-4 text-[#ef4444]" strokeWidth={3} />
          )}
          <span className={`text-[13px] font-bold ${isPositive ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
            {isPositive ? '+' : ''}{trendValue}%
          </span>
          <span className="text-[13px] text-[#9ca3af] font-medium">{trendLabel}</span>
        </div>
      )}
    </div>
  );
}
