import React from 'react';
import { Search, Menu, ShoppingBag, Bell, HelpCircle } from 'lucide-react';
import Image from 'next/image';

export default function DashboardHeader({ user }) {
  return (
    <header className="bg-white h-[72px] border-b border-[#f3f4f6] flex items-center justify-between px-6 sticky top-0 z-20">
      
      {/* Left section */}
      <div className="flex items-center gap-4 flex-1">
        <button className="text-[#6b7280] hover:text-[#374151] md:hidden">
          <Menu className="w-6 h-6" />
        </button>
        
        <div className="relative max-w-md w-full hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" />
          <input 
            type="text" 
            placeholder="Search anything..." 
            className="w-full pl-10 pr-16 py-2.5 bg-[#f9fafb]/50 border border-[#e5e7eb] rounded-lg text-sm text-[#1f2937] focus:outline-none focus:border-brand-cyan/50 focus:bg-white transition-colors"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <span className="text-[10px] font-medium text-[#9ca3af] bg-white border border-[#e5e7eb] px-1.5 py-0.5 rounded shadow-sm">Ctrl</span>
            <span className="text-[10px] font-medium text-[#9ca3af] bg-white border border-[#e5e7eb] px-1.5 py-0.5 rounded shadow-sm">K</span>
          </div>
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-6 shrink-0">
        
        <button className="hidden md:flex items-center gap-2 text-[#4b5563] hover:text-[#111827] transition-colors">
          <ShoppingBag className="w-5 h-5" />
          <span className="text-sm font-medium">New Orders</span>
          <span className="bg-[#8b0000] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ml-1">8</span>
        </button>

        <div className="flex items-center gap-4 border-l border-[#e5e7eb] pl-6">
          <button className="relative text-[#9ca3af] hover:text-[#4b5563] transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1.5 -right-1.5 bg-[#8b0000] text-white text-[9px] font-bold px-1.5 rounded-full border-2 border-white">12</span>
          </button>
          
          <button className="text-[#9ca3af] hover:text-[#4b5563] transition-colors hidden sm:block">
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-3 border-l border-[#e5e7eb] pl-6 cursor-pointer group">
          <div className="w-10 h-10 rounded-full bg-[#f3f4f6] overflow-hidden border border-[#e5e7eb]">
            {/* Placeholder avatar */}
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" alt="Admin" className="w-full h-full object-cover" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-bold text-[#1f2937] leading-tight group-hover:text-brand-cyan transition-colors">Hello, {user?.name || 'Admin'}</p>
            <p className="text-[11px] text-[#9ca3af] font-medium">Super Administrator</p>
          </div>
        </div>
        
      </div>
    </header>
  );
}
