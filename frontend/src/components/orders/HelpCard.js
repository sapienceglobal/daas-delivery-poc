'use client';

import { Phone, MessageSquare, Mail, ChevronRight } from 'lucide-react';

export default function HelpCard({ isSingleRestaurantMode }) {
  const phoneLabel = isSingleRestaurantMode ? '(516) 612-0300' : '1 (800) 555-0199';
  const phoneValue = isSingleRestaurantMode ? '5166120300' : '18005550199';
  const emailValue = isSingleRestaurantMode ? 'info@lassilounge.com' : 'support@daasplatform.com';
  
  // WhatsApp redirect link
  const whatsappUrl = `https://wa.me/${phoneValue.replace(/\D/g, '')}`;

  return (
    <div className="rounded-2xl border border-[#e5e7eb] bg-[#ffffff] p-6 shadow-sm font-sans space-y-4">
      <div>
        <h4 className="font-bold text-[18px] font-serif text-[#7a0b10] mb-0.5">Need Help?</h4>
        <p className="text-[14px] font-medium text-[#4b5563]">We're here for you</p>
      </div>

      <div className="space-y-3 pt-1">
        {/* Call Us Link */}
        <a 
          href={`tel:${phoneValue}`} 
          className="flex items-center justify-between p-3 border border-[#e5e7eb] rounded-xl hover:bg-[#fffaf9] hover:border-[#7a0b10] transition-all text-[#1a1a1a] group"
        >
          <div className="flex items-center gap-3">
            <Phone className="w-4 h-4 text-[#7a0b10]" />
            <div className="text-left">
              <span className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider block leading-none mb-0.5">Call Us</span>
              <span className="font-bold text-[14px]">{phoneLabel}</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#9ca3af] group-hover:text-[#7a0b10] transition-colors" />
        </a>

        {/* WhatsApp Link */}
        <a 
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-3 border border-[#e5e7eb] rounded-xl hover:bg-[#fffaf9] hover:border-[#7a0b10] transition-all text-[#1a1a1a] group"
        >
          <div className="flex items-center gap-3">
            <MessageSquare className="w-4 h-4 text-[#7a0b10]" />
            <div className="text-left">
              <span className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider block leading-none mb-0.5">WhatsApp</span>
              <span className="font-bold text-[14px]">{phoneLabel}</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#9ca3af] group-hover:text-[#7a0b10] transition-colors" />
        </a>

        {/* Email Link */}
        <a 
          href={`mailto:${emailValue}`}
          className="flex items-center justify-between p-3 border border-[#e5e7eb] rounded-xl hover:bg-[#fffaf9] hover:border-[#7a0b10] transition-all text-[#1a1a1a] group"
        >
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-[#7a0b10]" />
            <div className="text-left">
              <span className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider block leading-none mb-0.5">Email Us</span>
              <span className="font-bold text-[14px] truncate max-w-[180px] sm:max-w-none block">{emailValue}</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#9ca3af] group-hover:text-[#7a0b10] transition-colors" />
        </a>
      </div>
    </div>
  );
}
