'use client';

import { useState, useEffect } from 'react';
import { ChefHat, Flame, Users, Sparkles } from 'lucide-react';
import { isRestaurantOpenNow } from '@/lib/formatters';
import { restaurantAPI } from '@/lib/api';

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

const DAYS_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  let h = parseInt(hours, 10);
  if (isNaN(h)) return timeStr;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${minutes || '00'} ${ampm}`;
};

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const getGroupedHours = (operatingHours, openTime, closeTime) => {
  if (!operatingHours || Object.keys(operatingHours).length === 0) {
    if (openTime && closeTime) {
      return [{ day: 'Monday - Sunday', time: `${formatTime(openTime)} - ${formatTime(closeTime)}`, isClosed: false }];
    }
    return [
      { day: 'Monday - Thursday', time: '11:30 AM - 10:00 PM', isClosed: false },
      { day: 'Friday - Saturday', time: '11:30 AM - 11:00 PM', isClosed: false },
      { day: 'Sunday', time: '12:00 PM - 10:00 PM', isClosed: false },
    ];
  }

  const groups = [];
  let currentGroup = null;

  for (let i = 0; i < DAYS_ORDER.length; i++) {
    const day = DAYS_ORDER[i];
    const hrs = operatingHours[day];

    const isClosed = !hrs || hrs.isClosed;
    const timeStr = (!isClosed && hrs?.open && hrs?.close)
      ? `${formatTime(hrs.open)} - ${formatTime(hrs.close)}`
      : 'Closed';

    if (!currentGroup) {
      currentGroup = { startDay: day, endDay: day, time: timeStr, isClosed };
    } else if (currentGroup.time === timeStr) {
      currentGroup.endDay = day;
    } else {
      groups.push(currentGroup);
      currentGroup = { startDay: day, endDay: day, time: timeStr, isClosed };
    }
  }
  if (currentGroup) groups.push(currentGroup);

  return groups.map(g => {
    const dayStr = g.startDay === g.endDay 
      ? capitalize(g.startDay) 
      : `${capitalize(g.startDay)} - ${capitalize(g.endDay)}`;
    return { day: dayStr, time: g.time, isClosed: g.isClosed };
  });
};

export default function WhyDineWithUs({ restaurant }) {
  const [fetchedRest, setFetchedRest] = useState(null);

  useEffect(() => {
    if (!restaurant) {
      restaurantAPI.getById('lassi-lounge')
        .then(res => { if (res.data) setFetchedRest(res.data); })
        .catch(err => console.error('Failed to load restaurant timings:', err));
    }
  }, [restaurant]);

  const activeRest = restaurant || fetchedRest;
  const hoursList = getGroupedHours(
    activeRest?.operatingHours,
    activeRest?.openTime,
    activeRest?.closeTime
  );

  const isOpenNow = activeRest?.operatingHours 
    ? isRestaurantOpenNow(activeRest.operatingHours, activeRest.timezone) 
    : null;

  return (
    <div className="bg-white rounded-2xl border border-[#eadfdb] shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-5 md:p-8">
      
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
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full border border-[#eadfdb] flex items-center justify-center shrink-0">
               <ClockIcon className="h-4 w-4 text-[#7a0b10]" strokeWidth={2} />
            </div>
            <h3 className="text-[18px] font-serif font-black text-[#7a0b10]">Restaurant Timings</h3>
          </div>
          {isOpenNow !== null && (
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 border ${
              isOpenNow 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isOpenNow ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              {isOpenNow ? 'Open Now' : 'Closed'}
            </span>
          )}
        </div>
        
        <div className="space-y-3">
          {hoursList.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center text-[13px]">
              <span className="font-bold text-[#1a1a1a]">{item.day}</span>
              <span className={`font-medium ${item.isClosed ? 'text-rose-600 font-semibold' : 'text-[#4b5563]'}`}>
                {item.time}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

// simple clock icon specifically for the timings section
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
      <polyline points="12 6 12 16 14" />
    </svg>
  );
}
