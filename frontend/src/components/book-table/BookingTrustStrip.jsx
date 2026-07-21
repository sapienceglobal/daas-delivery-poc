'use client';

import { CalendarDays, MailCheck, Users, ThumbsUp } from 'lucide-react';

const BADGES = [
  {
    icon: CalendarDays,
    title: 'Easy Booking',
    desc: 'Book your table in just a few clicks.',
  },
  {
    icon: MailCheck,
    title: 'Instant Confirmation',
    desc: 'Get confirmation on your email instantly.',
  },
  {
    icon: Users,
    title: 'Flexible Options',
    desc: 'Choose your preferred seating & time.',
  },
  {
    icon: ThumbsUp,
    title: 'Hassle-Free Experience',
    desc: "Enjoy your meal, we'll take care of the rest.",
  }
];

export default function BookingTrustStrip() {
  return (
    <section className="bg-[#fffcf8] border-y border-[#f0e6e2] py-10 mt-10 w-full">
      <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 divide-y sm:divide-y-0 sm:divide-x divide-[#eadfdb]">
        {BADGES.map((badge, idx) => {
          const Icon = badge.icon;
          return (
            <div key={idx} className={`flex items-start gap-4 ${idx > 0 ? 'pt-6 sm:pt-0 sm:pl-8' : ''}`}>
              <Icon className="h-9 w-9 text-[#7a0b10] shrink-0" strokeWidth={1.5} />
              <div>
                <h4 className="text-[14px] font-black text-[#1a1a1a] mb-1">{badge.title}</h4>
                <p className="text-[13px] font-medium text-[#6b7280] leading-snug pr-4">{badge.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
