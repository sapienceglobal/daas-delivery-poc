import { Phone, Mail } from 'lucide-react';

export default function SupportCard({ isSingleRestaurantMode, restaurant }) {
  // Use real backend data if available, fallback to hardcoded if not
  // Prioritize restaurant.phone / restaurant.email as these are what SettingsView updates
  let phoneValue = restaurant?.phone || restaurant?.businessInfo?.businessPhone || (isSingleRestaurantMode ? '5166120300' : '18005550199');
  let emailValue = restaurant?.email || restaurant?.businessInfo?.businessEmail || (isSingleRestaurantMode ? 'info@lassilounge.com' : 'support@daasplatform.com');
  
  // Format phone if it's 10 or 11 digits
  const numericPhone = phoneValue.replace(/\D/g, '');
  let phoneLabel = phoneValue;
  if (numericPhone.length === 10) {
    phoneLabel = `(${numericPhone.substring(0,3)}) ${numericPhone.substring(3,6)}-${numericPhone.substring(6,10)}`;
  } else if (numericPhone.length === 11 && numericPhone.startsWith('1')) {
    phoneLabel = `+1 (${numericPhone.substring(1,4)}) ${numericPhone.substring(4,7)}-${numericPhone.substring(7,11)}`;
  }

  return (
    <div className="rounded-2xl border border-[#e5e7eb] bg-[#ffffff] p-6 shadow-sm font-sans space-y-4">
      <div>
        <h4 className="font-bold text-[18px] font-serif text-[#7a0b10] mb-0.5">Need Help?</h4>
        <p className="text-[14px] font-medium text-[#4b5563]">We're here for you</p>
      </div>
      
      <div className="space-y-3 pt-1">
        <a 
          href={`tel:${numericPhone}`} 
          className="flex items-center gap-3 hover:underline text-[#1a1a1a] group"
        >
          <Phone className="w-4 h-4 text-[#7a0b10] group-hover:opacity-80 transition-opacity" strokeWidth={2} />
          <span className="font-bold text-[14px]">
            {phoneLabel}
          </span>
        </a>
        <a
          href={`mailto:${emailValue}`}
          className="flex items-center gap-3 hover:underline text-[#1a1a1a] group"
        >
          <Mail className="w-4 h-4 text-[#7a0b10] group-hover:opacity-80 transition-opacity" strokeWidth={2} />
          <span className="font-bold text-[14px]">
            {emailValue}
          </span>
        </a>
      </div>
    </div>
  );
}