'use client';

import { ChefHat, Flame, Users, Sparkles } from 'lucide-react';

const REASONS = [
  {
    title: 'Authentic Indian Flavors',
    desc: 'Prepared by expert chefs.',
    icon: ChefHat,
  },
  {
    title: 'Warm & Cozy Ambiance',
    desc: 'Perfect for every occasion.',
    icon: Flame,
  },
  {
    title: 'Excellent Service',
    desc: 'We make you feel at home.',
    icon: Users,
  },
  {
    title: 'Memorable Experience',
    desc: 'Great food, great moments.',
    icon: Sparkles,
  }
];

export default function WhyDineWithUs() {
  return (
    <div className="bg-white rounded-2xl border border-[#eadfdb] shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-8">
      
      {/* Header */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <div className="flex items-center">
          <div className="w-6 h-[1px] bg-[#b47b80]"></div>
          <div className="w-1.5 h-1.5 rounded-full border border-[#b47b80] mx-1"></div>
          <div className="w-6 h-[1px] bg-[#b47b80]"></div>
        </div>
        <h3 className="text-[20px] font-serif font-black text-[#7a0b10]">Why Dine With Us?</h3>
        <div className="flex items-center">
          <div className="w-6 h-[1px] bg-[#b47b80]"></div>
          <div className="w-1.5 h-1.5 rounded-full border border-[#b47b80] mx-1"></div>
          <div className="w-6 h-[1px] bg-[#b47b80]"></div>
        </div>
      </div>

      {/* List */}
      <div className="space-y-6">
        {REASONS.map((reason, idx) => {
          const Icon = reason.icon;
          return (
            <div key={idx} className="flex items-start gap-5">
              <div className="h-14 w-14 rounded-full bg-[#fff5f5] flex items-center justify-center shrink-0 border border-[#fce8e8]">
                <Icon className="h-6 w-6 text-[#b47b80]" strokeWidth={1.5} />
              </div>
              <div className="pt-1.5">
                <h4 className="text-[14px] font-black text-[#1a1a1a]">{reason.title}</h4>
                <p className="text-[13px] font-medium text-[#6b7280] mt-0.5">{reason.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Timings Section */}
      <div className="mt-10 pt-8 border-t border-[#eadfdb]">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-8 w-8 rounded-full border border-[#eadfdb] flex items-center justify-center shrink-0">
             <ClockIcon className="h-4 w-4 text-[#7a0b10]" strokeWidth={2} />
          </div>
          <h3 className="text-[18px] font-serif font-black text-[#7a0b10]">Restaurant Timings</h3>
        </div>
        
        <div className="space-y-3">
           <div className="flex justify-between items-center text-[13px]">
              <span className="font-bold text-[#1a1a1a]">Monday - Thursday</span>
              <span className="font-medium text-[#4b5563]">11:30 AM - 10:00 PM</span>
           </div>
           <div className="flex justify-between items-center text-[13px]">
              <span className="font-bold text-[#1a1a1a]">Friday - Saturday</span>
              <span className="font-medium text-[#4b5563]">11:30 AM - 11:00 PM</span>
           </div>
           <div className="flex justify-between items-center text-[13px]">
              <span className="font-bold text-[#1a1a1a]">Sunday</span>
              <span className="font-medium text-[#4b5563]">12:00 PM - 10:00 PM</span>
           </div>
        </div>
      </div>

    </div>
  );
}

// Simple clock icon specifically for the timings section
function ClockIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
