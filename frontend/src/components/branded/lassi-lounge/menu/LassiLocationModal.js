import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Clock, X } from 'lucide-react';
import { footerContent } from '../config';
import { useBrand } from '@/context/BrandContext';

export default function LassiLocationModal({ isOpen, onClose }) {
  const { brand } = useBrand();
  
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(false);
  
  const address = brand?.address || footerContent.findUs.address;
  const phone = brand?.phone || footerContent.findUs.phone;
  const email = brand?.email || footerContent.findUs.email;
  
  // transitions
  useEffect(() => {
    let timeoutId;
    if (isOpen) {
      setMounted(true);
      timeoutId = setTimeout(() => setShow(true), 10);
    } else {
      setShow(false);
      timeoutId = setTimeout(() => setMounted(false), 300);
    }
    return () => clearTimeout(timeoutId);
  }, [isOpen]);

  const handleClose = () => {
    setShow(false);
    setTimeout(() => onClose(), 300);
  };

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    if (show) {
      document.addEventListener('keydown', handleEsc);
    }
    return () => document.removeEventListener('keydown', handleEsc);
  }, [show]);
  
  // format hours
  const getDynamicHours = () => {
    if (!brand?.operatingHours) return footerContent.hours;
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const formatted = [];
    let currentGroup = null;

    const formatTime = (time24) => {
      const [h, m] = time24.split(':');
      const hour = parseInt(h, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${m} ${ampm}`;
    };

    for (let i = 0; i < days.length; i++) {
      const day = days[i];
      const hrs = brand.operatingHours[day];
      
      const timeString = !hrs?.isClosed && hrs?.open && hrs?.close 
        ? `${formatTime(hrs.open)} - ${formatTime(hrs.close)}`
        : 'Closed';

      if (!currentGroup) {
        currentGroup = { startDay: day, endDay: day, time: timeString };
      } else if (currentGroup.time === timeString) {
        currentGroup.endDay = day;
      } else {
        formatted.push(currentGroup);
        currentGroup = { startDay: day, endDay: day, time: timeString };
      }
    }
    if (currentGroup) formatted.push(currentGroup);

    return formatted.map(g => {
      const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
      const dayStr = g.startDay === g.endDay ? capitalize(g.startDay) : `${capitalize(g.startDay)} - ${capitalize(g.endDay.substring(0, 3))}`;
      return { day: dayStr, time: g.time };
    });
  };

  const displayHours = getDynamicHours();

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-4">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-out ${show ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />
      
      {/* Modal Content */}
      <div className={`relative z-10 w-full sm:max-w-xl bg-[#fcfbf9] text-[#1a1a1a] sm:rounded-[24px] rounded-t-[24px] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[95vh] transition-all duration-300 ease-out ${show ? 'opacity-100 translate-y-0 sm:scale-100' : 'opacity-0 translate-y-8 sm:translate-y-4 sm:scale-95'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-white border-b border-[#f3f4f6] shadow-sm z-10">
          <h2 className="text-[20px] font-black text-[#4a0b0d] tracking-tight uppercase">
            Restaurant Location
          </h2>
          <button 
            onClick={handleClose}
            className="p-2 text-[#4b5563] hover:text-[#4a0b0d] hover:bg-[#fef2f2] rounded-full transition-all"
          >
            <X className="h-6 w-6" strokeWidth={2.5} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 ll-soft-scroll">
          
          {/* Map Embed */}
          <div className="w-full h-40 sm:h-48 rounded-2xl overflow-hidden border-2 border-white shadow-md bg-[#f3f4f6] shrink-0 mb-6 relative">
            <iframe 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              loading="lazy" 
              allowFullScreen 
              src={`https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
              className="absolute inset-0"
            ></iframe>
          </div>

          {/* Info Cards */}
          <div className="flex flex-col gap-4">
            
            <div className="flex items-start gap-4 p-4 bg-white border border-[#e5e7eb] rounded-2xl shadow-sm">
              <div className="w-10 h-10 rounded-full bg-[#fef2f2] flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-[#c67a3f]" />
              </div>
              <div className="flex flex-col min-w-0 pt-0.5">
                <span className="text-[11px] font-black text-[#9ca3af] uppercase tracking-widest mb-1">Address</span>
                <span className="text-[15px] font-bold text-[#1f2937] leading-snug">{address}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <a href={`tel:${phone}`} className="flex items-center gap-4 p-4 bg-white border border-[#e5e7eb] hover:border-[#c67a3f]/60 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                <div className="w-10 h-10 rounded-full bg-[#fef2f2] group-hover:bg-[#ffedd5] transition-colors flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-[#c67a3f]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-black text-[#9ca3af] uppercase tracking-widest mb-1">Phone</span>
                  <span className="text-[15px] font-bold text-[#1f2937] leading-tight group-hover:text-[#4a0b0d] transition-colors">{phone}</span>
                </div>
              </a>
              <a href={`mailto:${email}`} className="flex items-center gap-4 p-4 bg-white border border-[#e5e7eb] hover:border-[#c67a3f]/60 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                <div className="w-10 h-10 rounded-full bg-[#fef2f2] group-hover:bg-[#ffedd5] transition-colors flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-[#c67a3f]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-black text-[#9ca3af] uppercase tracking-widest mb-1">Email</span>
                  <span className="text-[15px] font-bold text-[#1f2937] leading-tight truncate group-hover:text-[#4a0b0d] transition-colors">{email}</span>
                </div>
              </a>
            </div>

            <div className="flex flex-col gap-3 p-5 bg-white border border-[#e5e7eb] rounded-2xl shadow-sm mt-2">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-[#fef2f2] flex items-center justify-center">
                  <Clock className="w-4 h-4 text-[#c67a3f]" />
                </div>
                <span className="text-[14px] font-black text-[#4a0b0d] uppercase tracking-wide">Hours</span>
              </div>
              <div className="space-y-2.5">
                {displayHours.map((row, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[14px]">
                    <span className="font-bold text-[#6b7280]">{row.day}</span>
                    <span className="font-semibold text-[#1f2937]">{row.time}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
