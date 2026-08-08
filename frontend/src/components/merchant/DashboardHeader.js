import React from 'react';
import { Search, Menu, ShoppingBag, Bell, HelpCircle } from 'lucide-react';
import Image from 'next/image';

export default function DashboardHeader({ user }) {
  return (
    <header className="bg-white h-[72px] border-b border-[#e5e7eb] flex items-center justify-between px-6 sticky top-0 z-50 shadow-sm">
      
      {/* Left section */}
      <div className="flex items-center gap-4 flex-1">
        <button className="text-[#9ca3af] hover:text-[#111827] md:hidden transition-colors">
          <Menu className="w-6 h-6" />
        </button>
        
        <div className="relative max-w-md w-full hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" />
          <input 
            type="text" 
            placeholder="Search dashboard..." 
            className="w-full pl-10 pr-16 py-2.5 bg-[#f9fafb] border border-[#e5e7eb] rounded-xl text-sm text-[#111827] font-medium focus:outline-none focus:ring-2 focus:ring-[#8b0000]/20 focus:border-[#8b0000]/50 transition-all placeholder:text-[#9ca3af]"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <span className="text-[10px] font-bold text-[#6b7280] bg-white border border-[#e5e7eb] px-1.5 py-0.5 rounded shadow-sm">Ctrl K</span>
          </div>
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-4 shrink-0">
        
        <button className="hidden md:flex items-center gap-2 text-[#4b5563] hover:text-[#111827] hover:bg-[#f9fafb] px-3 py-2 rounded-lg transition-colors border border-transparent hover:border-[#e5e7eb]">
          <ShoppingBag className="w-4 h-4" />
          <span className="text-sm font-bold">New Orders</span>
          <span className="bg-[#8b0000] text-white text-[10px] font-bold px-2 py-0.5 rounded-full ml-1 shadow-sm">8</span>
        </button>

        <div className="flex items-center gap-2 border-l border-[#e5e7eb] pl-4">
          <button className="relative text-[#6b7280] hover:text-[#111827] p-2 hover:bg-[#f9fafb] rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 bg-[#8b0000] w-2 h-2 rounded-full border border-white"></span>
          </button>
          
          <button className="text-[#6b7280] hover:text-[#111827] p-2 hover:bg-[#f9fafb] rounded-lg transition-colors hidden sm:block">
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-3 border-l border-[#e5e7eb] pl-4 cursor-pointer group">
          <div className="rounded-full bg-[#f3f4f6] overflow-hidden border-2 border-transparent group-hover:border-[#8b0000]/20 transition-all flex items-center justify-center" style={{ width: '36px', height: '36px', minWidth: '36px', minHeight: '36px' }}>
            {/* Placeholder avatar */}
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" alt="Admin" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-bold text-[#111827] leading-none group-hover:text-[#8b0000] transition-colors">{user?.name || 'Admin'}</p>
            <p className="text-[11px] text-[#6b7280] font-bold mt-1">Super Administrator</p>
          </div>
        </div>
        
      </div>
    </header>
  );
}
