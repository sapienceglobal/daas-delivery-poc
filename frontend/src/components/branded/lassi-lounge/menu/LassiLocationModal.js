import React from 'react';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { PortalModal } from '@/components/ui';
import { footerContent } from '../config';
import { useBrand } from '@/context/BrandContext';

export default function LassiLocationModal({ isOpen, onClose }) {
  const { brand } = useBrand();
  
  const address = brand?.address || footerContent.findUs.address;
  const phone = brand?.phone || footerContent.findUs.phone;
  const email = brand?.email || footerContent.findUs.email;
  
  // Format hours
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

  return (
    <PortalModal isOpen={isOpen} onClose={onClose} title="Restaurant Location">
      <div className="flex flex-col gap-5 p-2">
        {/* Map Embed */}
        <div className="w-full h-48 sm:h-56 rounded-xl overflow-hidden border border-[#e5e7eb] shadow-inner bg-gray-100 shrink-0">
          <iframe 
            width="100%" 
            height="100%" 
            style={{ border: 0 }} 
            loading="lazy" 
            allowFullScreen 
            src={`https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
          ></iframe>
        </div>

        {/* Info Cards */}
        <div className="flex flex-col gap-3">
          
          <div className="flex items-start gap-3 bg-[#f8f5f0] p-3.5 rounded-xl border border-[#F0E6D8]">
            <MapPin className="w-5 h-5 text-[#c67a3f] shrink-0 mt-0.5" />
            <div className="flex flex-col">
              <span className="text-[13px] font-bold text-[#1a1a1a] uppercase tracking-wider mb-0.5">Address</span>
              <span className="text-[14px] text-[#4a4a4a] leading-snug">{address}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a href={`tel:${phone}`} className="flex items-center gap-3 bg-[#f8f5f0] p-3.5 rounded-xl border border-[#F0E6D8] hover:border-[#c67a3f]/40 transition-colors">
              <Phone className="w-5 h-5 text-[#c67a3f] shrink-0" />
              <div className="flex flex-col">
                <span className="text-[12px] font-bold text-[#1a1a1a] uppercase tracking-wider mb-0.5">Phone</span>
                <span className="text-[14px] text-[#4a4a4a] leading-tight">{phone}</span>
              </div>
            </a>
            <a href={`mailto:${email}`} className="flex items-center gap-3 bg-[#f8f5f0] p-3.5 rounded-xl border border-[#F0E6D8] hover:border-[#c67a3f]/40 transition-colors">
              <Mail className="w-5 h-5 text-[#c67a3f] shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-[12px] font-bold text-[#1a1a1a] uppercase tracking-wider mb-0.5">Email</span>
                <span className="text-[14px] text-[#4a4a4a] leading-tight truncate">{email}</span>
              </div>
            </a>
          </div>

          <div className="flex flex-col gap-2 bg-[#f8f5f0] p-4 rounded-xl border border-[#F0E6D8] mt-2">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-[#c67a3f]" />
              <span className="text-[13px] font-bold text-[#1a1a1a] uppercase tracking-wider">Hours</span>
            </div>
            {displayHours.map((row, idx) => (
              <div key={idx} className="flex justify-between items-center text-[13px]">
                <span className="font-semibold text-[#4a4a4a]">{row.day}</span>
                <span className="text-[#6b7280]">{row.time}</span>
              </div>
            ))}
          </div>

        </div>
      </div>
    </PortalModal>
  );
}
