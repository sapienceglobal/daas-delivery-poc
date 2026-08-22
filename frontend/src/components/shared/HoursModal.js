'use client';

import { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';

// format time from 24h to 12h
const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  let h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${minutes} ${ampm}`;
};

// subtract minutes from 24h format (HH:mm)
const subtractMinutes = (timeStr, mins) => {
  if (!timeStr || typeof timeStr !== 'string') return timeStr;
  const parts = timeStr.split(':');
  if (parts.length !== 2) return timeStr;
  const [hours, minutes] = parts.map(Number);
  if (isNaN(hours) || isNaN(minutes)) return timeStr;
  
  let totalMinutes = hours * 60 + minutes - mins;
  if (totalMinutes < 0) totalMinutes += 24 * 60;
  
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMins = totalMinutes % 60;
  return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
};

export default function HoursModal({ isOpen, onClose, brand }) {
  const [openSection, setOpenSection] = useState('lassi-lounge');
  
  // animation states
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      // small delay to allow mount before triggering transition
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsVisible(true));
      });
    } else {
      setIsVisible(false);
      // wait for exit animation to finish before unmounting
      const timer = setTimeout(() => setIsMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isMounted) return null;

  // generate 7-day schedule starting from TODAY
  const generateDynamicHours = (closeOffsetMinutes = 0) => {
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayIndex = new Date().getDay(); 
    
    const orderedDays = [
      ...daysOfWeek.slice(todayIndex),
      ...daysOfWeek.slice(0, todayIndex)
    ];

    return orderedDays.map(day => {
      const dbDay = brand?.operatingHours?.[day];
      let timeStr = 'Closed';
      
      if (dbDay && !dbDay.isClosed && dbDay.open && dbDay.close) {
        const closingTime = closeOffsetMinutes > 0 ? subtractMinutes(dbDay.close, closeOffsetMinutes) : dbDay.close;
        timeStr = `${dbDay.open} - ${closingTime}`; 
      } else if (!brand?.operatingHours) {
        const closingTime = closeOffsetMinutes > 0 ? subtractMinutes('22:00', closeOffsetMinutes) : '22:00';
        timeStr = `11:30 - ${closingTime}`;
      }

      const dayName = day.charAt(0).toUpperCase() + day.slice(1);
      
      return { day: dayName, time: timeStr, isClosed: timeStr === 'Closed' };
    });
  };

  const lassiHours = generateDynamicHours(0);
  const deliveryHours = generateDynamicHours(15);
  const takeoutHours = generateDynamicHours(0);

  const sections = [
    { id: 'lassi-lounge', title: 'Lassi Lounge', hoursData: lassiHours },
    { id: 'delivery', title: 'Delivery', hoursData: deliveryHours },
    { id: 'take-out', title: 'Take Out', hoursData: takeoutHours }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div 
        className={`relative w-full max-w-sm bg-white text-[#1a1a1a] rounded-lg shadow-xl overflow-hidden flex flex-col transition-all duration-300 ease-out transform ${
          isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'
        }`}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e7eb] bg-white relative z-10">
          <h2 className="text-xl font-normal text-[#1a1a1a]">Hours</h2>
          <button 
            type="button"
            onClick={onClose}
            className="text-[#6b7280] hover:text-[#1a1a1a] transition-colors"
          >
            <X className="w-5 h-5 font-light" strokeWidth={1.5} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col bg-white">
          {sections.map((section, idx) => {
            const isExpanded = openSection === section.id;
            const secHours = section.hoursData;
            const todaySecHours = secHours[0];
            const isSecClosed = todaySecHours.isClosed;
            const secStatusText = isSecClosed ? 'Closed' : 'Open';
            const secSubText = isSecClosed 
              ? (secHours.find(d => !d.isClosed)?.time.split(' - ')[0] || 'Unknown') 
              : 'Close at ' + todaySecHours.time.split(' - ')[1];

            return (
              <div key={section.id} className={`border-b border-[#e5e7eb] last:border-none transition-colors duration-300 ${isExpanded ? 'bg-[#eeeeee]' : 'bg-white'}`}>
                <button
                  type="button"
                  onClick={() => setOpenSection(isExpanded ? null : section.id)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left focus:outline-none relative z-10"
                >
                  <span className="text-[15px] font-normal text-[#1a1a1a]">{section.title}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[15px] font-bold ${isSecClosed ? 'text-[#d0150f]' : 'text-[#2f8a42]'}`}>
                      {secStatusText}
                    </span>
                    <ChevronDown className={`w-5 h-5 text-[#6b7280] transition-transform duration-300 ${isExpanded ? 'rotate-180' : 'rotate-0'}`} strokeWidth={1.5} />
                  </div>
                </button>

                {/* Animated Accordion Content */}
                <div 
                  className={`grid transition-all duration-300 ease-in-out ${
                    isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="px-6 pb-6 pt-1">
                      <p className="text-[15px] mb-5">
                        <span className={isSecClosed ? 'text-[#d0150f]' : 'text-[#2f8a42]'}>{secStatusText}</span>
                        <span className="text-[#1a1a1a]"> · {isSecClosed ? 'Opens ' : ''}{secSubText}</span>
                      </p>
                      <ul className="space-y-2">
                        {secHours.map((slot, index) => (
                          <li key={slot.day} className="flex justify-between text-[15px]">
                            <span className={index === 0 ? 'font-bold text-[#1a1a1a]' : 'text-[#6b7280] font-normal'}>
                              {slot.day}
                            </span>
                            <span className={index === 0 ? 'font-bold text-[#1a1a1a]' : 'text-[#6b7280] font-normal'}>
                              {slot.time}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
