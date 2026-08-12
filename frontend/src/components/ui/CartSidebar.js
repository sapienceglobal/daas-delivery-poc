'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { X, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Button from './Button';

const getDishImage = (itemName = '') => {
  const name = itemName.toLowerCase();
  if (name.includes('butter chicken')) return '/images/branded/lassi-lounge/dishes/butter-chicken.jpg';
  if (name.includes('rogan josh') || name.includes('lamb')) return '/images/branded/lassi-lounge/dishes/lamb-rogan-josh.jpg';
  if (name.includes('paneer tikka')) return '/images/branded/lassi-lounge/dishes/paneer-tikka.jpg';
  if (name.includes('biryani')) return '/images/branded/lassi-lounge/dishes/chicken-biryani.jpg';
  if (name.includes('dal makhani')) return '/images/branded/lassi-lounge/dishes/dal-makhani.jpg';
  if (name.includes('lassi')) return '/images/branded/lassi-lounge/dishes/mango-lassi.jpg';
  if (name.includes('roll') || name.includes('spring')) return '/images/branded/lassi-lounge/dishes/veg-spring-rolls.png';
  if (name.includes('tikka masala')) return 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=400&q=80';
  if (name.includes('palak paneer')) return 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=400&q=80';
  if (name.includes('naan') || name.includes('bread')) return 'https://images.unsplash.com/photo-1605333396914-22b0c36b1328?auto=format&fit=crop&w=400&q=80';
  if (name.includes('corn')) return 'https://images.unsplash.com/photo-1626804475297-41609ea004eb?auto=format&fit=crop&w=400&q=80';
  return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80';
};

export default function CartSidebar() {
  const { isCartOpen, closeCart, items, subtotal, updateQuantity, removeItem } = useCart();
  const router = useRouter();
  const [touchStartY, setTouchStartY] = useState(null);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (isCartOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      setDragY(0); // Reset when closed
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isCartOpen]);

  const handleTouchStart = (e) => {
    setTouchStartY(e.touches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (touchStartY === null) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY;
    // Only allow dragging downwards
    if (diff > 0) {
      setDragY(diff);
    }
  };

  const handleTouchEnd = (e) => {
    if (touchStartY === null) return;
    
    setIsDragging(false);
    
    // If swiped down by more than 100px, close the cart
    if (dragY > 100) {
      closeCart();
    } else {
      // Spring back
      setDragY(0);
    }
    
    setTouchStartY(null);
  };

  const handleCheckout = () => {
    closeCart();
    router.push('/checkout');
  };

  const backdropClass = isCartOpen
    ? "opacity-100 pointer-events-auto"
    : "opacity-0 pointer-events-none";

  const sidebarClass = isCartOpen
    ? "translate-y-0 sm:translate-x-0"
    : "translate-y-[150%] sm:translate-y-0 sm:translate-x-full";

  // Disable transition during drag so it sticks exactly to the finger
  const transitionClass = isDragging ? "" : "transition-transform duration-slow ease-in-out";

  return (
    <div className={`fixed inset-0 z-[100] ${isCartOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/60 transition-opacity duration-slow ease-in-out ${backdropClass}`}
        onClick={closeCart}
      />

      {/* Sidebar / Bottom Sheet */}
      <div 
        className={`absolute bottom-0 sm:top-0 right-0 w-full h-[85vh] sm:h-full sm:w-[400px] bg-background shadow-2xl flex flex-col rounded-t-[24px] sm:rounded-none transform ${transitionClass} ${sidebarClass}`}
        style={{ transform: dragY > 0 && typeof window !== 'undefined' && window.innerWidth < 640 ? `translateY(${dragY}px)` : undefined }}
      >
        
        {/* Mobile handle indicator & Swipe Area */}
        <div 
          className="sm:hidden w-full flex justify-center pt-3 pb-1 touch-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-12 h-1.5 bg-[#e5e7eb] rounded-full"></div>
        </div>

        {/* Header */}
        <div 
          className="flex items-center justify-between p-4 pt-2 sm:pt-4 border-b border-border touch-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <h2 className="text-xl font-heading font-bold text-text flex items-center gap-2">
            <ShoppingBag size={22} className="text-primary-600" />
            Your Cart
          </h2>
          <button 
            onClick={closeCart}
            className="p-2 bg-[#f3f4f6] hover:bg-[#e5e7eb] text-[#1a1a1a] rounded-full transition-colors shadow-sm ll-interactive"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 pr-2 flex flex-col gap-4 ll-soft-scroll">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center opacity-70">
              <ShoppingBag size={48} className="mb-4 text-border" />
              <p className="font-semibold text-lg">Your cart is empty</p>
              <p className="text-sm">Looks like you haven't added anything yet.</p>
              <Button 
                onClick={closeCart} 
                variant="outline" 
                className="mt-6"
              >
                Continue Shopping
              </Button>
            </div>
          ) : (
            items.map((item, index) => (
              <div key={`${item.menuItemId}-${index}`} className="flex gap-4 p-3 bg-surface rounded-xl border border-border">
                <div className="w-16 h-16 rounded-lg bg-border/30 overflow-hidden shrink-0 relative">
                  {item.image || getDishImage(item.name) ? (
                    <Image src={item.image || getDishImage(item.name)} alt={item.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-accent-100/50" />
                  )}
                </div>
                
                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-sm line-clamp-1">{item.name}</h4>
                      {item.selectedSize && (
                        <p className="text-xs opacity-70">{item.selectedSize.name}</p>
                      )}
                      {item.addOns?.length > 0 && (
                        <p className="text-[10px] opacity-70 mt-0.5 line-clamp-1">
                          + {item.addOns.map(a => a.name).join(', ')}
                        </p>
                      )}
                    </div>
                    <span className="font-bold text-sm text-primary-600 shrink-0 ml-2">
                      ${(item.lineTotal || ((item.price || 0) * (item.quantity || 1))).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center border border-primary-600/30 rounded-md bg-white">
                      <button 
                        onClick={() => {
                          const currentQty = item.quantity || item.qty || 1;
                          if (currentQty > 1) updateQuantity(index, currentQty - 1);
                          else removeItem(index);
                        }}
                        className="px-2 py-1 text-primary-600 hover:bg-primary-50 transition-colors"
                      >
                        <Minus size={14} strokeWidth={2.5} />
                      </button>
                      <span className="px-2 text-xs font-bold w-6 text-center text-black">{item.quantity || item.qty || 1}</span>
                      <button 
                        onClick={() => updateQuantity(index, (item.quantity || item.qty || 1) + 1)}
                        className="px-2 py-1 text-primary-600 hover:bg-primary-50 transition-colors"
                      >
                        <Plus size={14} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-4 border-t border-border bg-surface/50 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-4 text-sm font-semibold">
              <span className="opacity-70">Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <Button 
              onClick={handleCheckout} 
              variant="primary" 
              className="w-full py-4 text-base font-bold shadow-lg"
            >
              Proceed to Checkout
              <ArrowRight size={18} className="ml-2" />
            </Button>
          </div>
        )}
        
      </div>
    </div>
  );
}
