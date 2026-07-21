'use client';

import { MessageSquare, FileText, CalendarCheck, Utensils, Smile } from 'lucide-react';

const STEPS = [
  {
    num: 1,
    icon: MessageSquare,
    title: 'Share Your Requirements',
    desc: 'Tell us about your event, guest count & preferences.'
  },
  {
    num: 2,
    icon: FileText,
    title: 'Get a Custom Quote',
    desc: "We'll send you a personalized menu & quote."
  },
  {
    num: 3,
    icon: CalendarCheck,
    title: 'Confirm Your Booking',
    desc: 'Confirm your booking with ease.'
  },
  {
    num: 4,
    icon: Utensils,
    title: 'We Prepare & Deliver',
    desc: 'Our team prepares your order fresh and delivers on time.'
  },
  {
    num: 5,
    icon: Smile,
    title: 'Enjoy Your Event',
    desc: 'Sit back, relax and enjoy delicious food.'
  }
];

export default function CateringHowItWorks() {
  return (
    <section className="py-16 max-w-[1200px] mx-auto px-6 border-t border-[#eadfdb] mt-8">
      {/* Header */}
      <div className="flex items-center justify-center gap-4 mb-16">
        <div className="flex items-center">
          <div className="w-8 h-[1px] bg-[#b47b80]"></div>
          <div className="w-1.5 h-1.5 rounded-full border border-[#b47b80] mx-1"></div>
          <div className="w-8 h-[1px] bg-[#b47b80]"></div>
        </div>
        <h3 className="text-[28px] font-serif font-black text-[#1a1a1a] text-center">
          How It Works
        </h3>
        <div className="flex items-center">
          <div className="w-8 h-[1px] bg-[#b47b80]"></div>
          <div className="w-1.5 h-1.5 rounded-full border border-[#b47b80] mx-1"></div>
          <div className="w-8 h-[1px] bg-[#b47b80]"></div>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Connecting Line (Desktop) */}
        <div className="hidden md:block absolute top-10 left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-[#eadfdb] to-transparent z-0"></div>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {STEPS.map((step, idx) => (
            <div key={idx} className="relative z-10 flex flex-col items-center text-center group">
              {/* Number Badge */}
              <div className="w-6 h-6 rounded-full bg-[#7a0b10] text-white flex items-center justify-center text-[10px] font-black absolute -top-3 left-1/2 -translate-x-1/2 z-20 shadow-md">
                {step.num}
              </div>
              
              {/* Icon Container */}
              <div className="w-20 h-20 rounded-2xl bg-white border border-[#eadfdb] shadow-sm flex items-center justify-center mb-5 group-hover:border-[#b47b80] transition-colors">
                <step.icon className="h-8 w-8 text-[#7a0b10]" strokeWidth={1.5} />
              </div>
              
              {/* Text */}
              <h4 className="text-[13px] font-black text-[#1a1a1a] mb-2 leading-tight px-2">{step.title}</h4>
              <p className="text-[12px] font-medium text-[#6b7280] leading-snug px-2">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
