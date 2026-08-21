'use client';

import { useState } from 'react';
import { useBrand } from '@/context/BrandContext';
import { useCart } from '@/context/CartContext';
import { X } from 'lucide-react';

export default function WhatsAppWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const { brand } = useBrand();
  const { isCartOpen } = useCart();

  const rawPhone = brand?.notificationSettings?.whatsappNumber || brand?.phone || '+1 (347) 755-1370';
  const waNumber = rawPhone.replace(/\D/g, '');

  const openWhatsApp = (text = '') => {
    const url = `https://wa.me/${waNumber}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
    window.open(url, '_blank');
  };

  return (
    <div className={`fixed bottom-[90px] md:bottom-6 z-[90] flex flex-col items-end font-sans transition-all duration-500 ease-in-out
      ${isCartOpen ? 'md:right-[424px] right-6 opacity-0 md:opacity-100 pointer-events-none md:pointer-events-auto' : 'right-6 opacity-100 pointer-events-auto'}
    `}>
      
      {/* Popover */}
      {isOpen && (
        <div className="mb-4 w-[320px] bg-[#ffffff] rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300 border border-[#e5e7eb] origin-bottom-right">
          
          {/* Header - Matching Website Theme */}
          <div className="bg-[#7a0b10] p-5 text-[#ffffff] relative">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-[#ffffff]/80 hover:text-[#ffffff] transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 shrink-0 bg-[#ffffff]/20 rounded-full flex items-center justify-center mt-1">
                <svg className="w-8 h-8 text-[#ffffff]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-[17px] mb-1 leading-tight tracking-wide text-[#ffffff]">Start a Conversation</h3>
                <p className="text-[#ffffff]/90 text-[13px] leading-snug font-medium">Hi! Click one of our member below to chat on WhatsApp</p>
              </div>
            </div>
          </div>
          
          {/* Body */}
          <div className="p-5 bg-[#f9fafb]">
            <p className="text-[12px] text-[#6b7280] mb-4 px-1 font-medium">The team typically replies in a few minutes.</p>
            
            <div className="space-y-3">
              {/* Option 1 */}
              <button 
                onClick={() => openWhatsApp('Hi, I need some help with my order.')}
                className="w-full flex items-center justify-between p-3.5 bg-[#ffffff] rounded-xl shadow-sm hover:shadow-md transition-shadow group border-l-[3px] border-l-[#25D366] border-y border-r border-[#e5e7eb]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#25D366]/10 flex items-center justify-center shrink-0 group-hover:bg-[#25D366]/20 transition-colors">
                    <svg className="w-6 h-6 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-[#1f2937] text-[15px]">Live Chat Support</p>
                    <p className="text-[#6b7280] text-[12px] font-medium">Connect with Our Helpdesk</p>
                  </div>
                </div>
                <svg className="w-6 h-6 text-[#25D366] opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300 mr-1" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/></svg>
              </button>

              {/* Option 2 (Hidden for now)
              <button 
                onClick={() => openWhatsApp('Hi, I am looking for catering services.')}
                className="w-full flex items-center justify-between p-3.5 bg-[#ffffff] rounded-xl shadow-sm hover:shadow-md transition-shadow group border-l-[3px] border-l-[#25D366] border-y border-r border-[#e5e7eb]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#25D366]/10 flex items-center justify-center shrink-0 group-hover:bg-[#25D366]/20 transition-colors">
                    <svg className="w-6 h-6 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-[#1f2937] text-[15px]">Sales Assistance</p>
                    <p className="text-[#6b7280] text-[12px] font-medium">Chat with our Sales Team</p>
                  </div>
                </div>
                <svg className="w-6 h-6 text-[#25D366] opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300 mr-1" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/>
                </svg>
              </button>
              */}
            </div>
          </div>
        </div>
      )}

      {/* Floating Button Container */}
      <div className="flex items-center gap-3 relative group">
        
        {/* Tooltip */}
        {!isOpen && (
          <div className={`absolute ${isCartOpen ? 'left-full ml-4' : 'right-full mr-4'} bg-[#ffffff] py-1.5 px-3 rounded-xl shadow-lg border border-[#e5e7eb] text-sm font-bold text-[#1f2937] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-0`}>
            Need Help? <span className="text-[#7a0b10]">Chat with us</span>
          </div>
        )}

        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`w-[44px] h-[44px] bg-[#7a0b10] text-[#ffffff] rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(122,11,16,0.4)] hover:scale-110 transition-transform z-10 relative ${isOpen ? 'rotate-90' : 'rotate-0'} duration-300`}
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
            </svg>
          )}
        </button>
      </div>

    </div>
  );
}
