import { Phone, Mail } from 'lucide-react';

export default function SupportCard({ isSingleRestaurantMode }) {
  return (
    <div className="rounded-2xl border border-[#e5e7eb] bg-[#ffffff] p-6 shadow-sm font-sans space-y-4">
      <div>
        <h4 className="font-bold text-[18px] font-serif text-[#7a0b10] mb-0.5">Need Help?</h4>
        <p className="text-[14px] font-medium text-[#4b5563]">We're here for you</p>
      </div>
      
      <div className="space-y-3 pt-1">
        <a 
          href={isSingleRestaurantMode ? 'tel:5166120300' : 'tel:18005550199'} 
          className="flex items-center gap-3 hover:underline text-[#1a1a1a] group"
        >
          <Phone className="w-4 h-4 text-[#7a0b10] group-hover:opacity-80 transition-opacity" strokeWidth={2} />
          <span className="font-bold text-[14px]">
            {isSingleRestaurantMode ? '(516) 612-0300' : '1 (800) 555-0199'}
          </span>
        </a>
        <a
          href={isSingleRestaurantMode ? 'mailto:info@lassilounge.com' : 'mailto:support@daasplatform.com'}
          className="flex items-center gap-3 hover:underline text-[#1a1a1a] group"
        >
          <Mail className="w-4 h-4 text-[#7a0b10] group-hover:opacity-80 transition-opacity" strokeWidth={2} />
          <span className="font-bold text-[14px]">
            {isSingleRestaurantMode ? 'info@lassilounge.com' : 'support@daasplatform.com'}
          </span>
        </a>
      </div>
    </div>
  );
}