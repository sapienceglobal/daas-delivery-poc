'use client';

import { 
  Grid2X2, User, MapPin, ShoppingCart, Heart, CreditCard, 
  Gift, Bell, Users, LogOut, Phone, Calendar
} from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Grid2X2 },
  { id: 'profile', label: 'My Profile', icon: User },
  { id: 'addresses', label: 'My Addresses', icon: MapPin },
  { id: 'orders', label: 'My Orders', icon: ShoppingCart },
  { id: 'reservations', label: 'My Reservations', icon: Calendar },
  { id: 'favorites', label: 'Favorites', icon: Heart },
  { id: 'payments', label: 'Payment Methods', icon: CreditCard },
  { id: 'loyalty', label: 'Loyalty Points', icon: Gift, badge: '120' },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'refer', label: 'Refer & Earn', icon: Users },
  { id: 'logout', label: 'Logout', icon: LogOut },
];

export default function AccountSidebar({ user, activeNav, onNavClick, onOrderNow }) {
  const points = user?.loyaltyPoints || 120;

  return (
    <aside className="space-y-6 lg:sticky lg:top-24 w-full">
      {/* 1. Main Navigation Container */}
      <div className="overflow-hidden rounded-2xl border border-[#eadfdb] bg-white shadow-[0_2px_15px_rgba(0,0,0,0.04)]">
        
        {/* Top User Profile Header Box */}
        <div className="bg-[#600508] p-6 text-white flex items-center gap-4">
          <div className="h-[64px] w-[64px] rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
            <User className="h-9 w-9 text-[#600508]" strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-[17px] font-bold truncate leading-tight tracking-wide">{user?.name || 'John Smith'}</h2>
            <p className="text-[13px] text-white/90 truncate mt-0.5 tracking-wide">{user?.email || 'johnsmith@gmail.com'}</p>
            <p className="text-[13px] text-white/90 mt-1.5 flex items-center gap-1.5 tracking-wide">
              <Phone className="h-3.5 w-3.5" /> {user?.phone || '(516) 612-0300'}
            </p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="py-2.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            const badgeValue = item.id === 'loyalty' ? points : item.badge;

            return (
              <button
                key={item.id}
                onClick={() => onNavClick(item.id)}
                className={`w-full flex items-center justify-between pl-5 pr-6 py-[13px] text-left text-[14.5px] transition-colors border-l-[4px] ${
                  isActive
                    ? 'border-[#7a0b10] bg-[#fcf3e3] text-[#7a0b10] font-bold'
                    : 'border-transparent text-[#333333] font-medium hover:bg-[#fbfaf7]'
                }`}
              >
                <span className="flex items-center gap-4">
                  <Icon 
                    className={`h-[18px] w-[18px] ${isActive ? 'text-[#7a0b10]' : 'text-[#8d1118]'}`} 
                    strokeWidth={isActive ? 2.5 : 1.75} 
                  />
                  {item.label}
                </span>
                
                {badgeValue !== undefined && badgeValue !== null && (
                  <span className="rounded-md bg-[#6b090e] px-2.5 py-1 text-[11px] font-bold text-white leading-none">
                    {badgeValue}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* 2. Side Promo Banner */}
      <div 
        className="relative overflow-hidden rounded-2xl min-h-[310px] p-6 text-white shadow-sm flex flex-col justify-between group cursor-pointer border border-[#eadfdb]" 
        onClick={onOrderNow}
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/branded/lassi-lounge/hero-spread.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#4d0205]/95 via-[#4d0205]/85 to-[#000000]/70" />

        <div className="relative z-10 pt-2">
          <h3 className="font-serif text-[26px] font-black leading-snug tracking-tight">
            Craving something <span className="text-[#f5a623] block mt-0.5">delicious again?</span>
          </h3>
          <p className="mt-3.5 text-[13px] leading-relaxed text-white/95 font-medium max-w-[170px]">
            Reorder your favorites in just a few clicks.
          </p>
          <button
            className="mt-6 rounded-lg bg-[#f5aa1c] px-6 py-2.5 text-[12px] font-black uppercase tracking-wider text-[#1a1a1a] shadow-sm hover:bg-[#df9917] transition-colors"
          >
            ORDER NOW
          </button>
        </div>

        {/* Small Overlay Lassi Glass image (No border to match image) */}
        <div className="relative z-10 self-end mt-2 -mr-3 -mb-2">
          <img
            src="/images/branded/lassi-lounge/dishes/mango-lassi.jpg"
            alt="Lassi"
            className="h-[120px] w-[120px] object-cover object-center rounded-tl-full rounded-tr-full rounded-bl-full drop-shadow-2xl opacity-90"
            style={{ maskImage: 'radial-gradient(circle, black 60%, transparent 100%)' }}
          />
        </div>
      </div>
    </aside>
  );
}