'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useCart } from '@/context/CartContext';
import {
  X,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Clock,
  Trash2,
  UtensilsCrossed,
  MessageSquarePlus,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { isRestaurantOpenNow, isWithin15MinsOfClosing } from '@/lib/formatters';
import { trackBeginCheckout } from '@/lib/analytics';
import { resolveImageUrl } from '@/lib/slugUtils';

const getDishImage = (itemName = '') => {
  const name = itemName.toLowerCase();
  if (name.includes('butter chicken')) return '/images/branded/lassi-lounge/dishes/butter-chicken.jpg';
  if (name.includes('rogan josh') || name.includes('lamb')) return '/images/branded/lassi-lounge/dishes/lamb-rogan-josh.jpg';
  if (name.includes('paneer tikka') || name.includes('paneer')) return '/images/branded/lassi-lounge/dishes/paneer-tikka.jpg';
  if (name.includes('biryani') || name.includes('rice')) return '/images/branded/lassi-lounge/dishes/chicken-biryani.jpg';
  if (name.includes('dal makhani') || name.includes('dal')) return '/images/branded/lassi-lounge/dishes/dal-makhani.jpg';
  if (name.includes('mango lassi')) return '/images/branded/lassi-lounge/dishes/mango-lassi.jpg';
  if (name.includes('sweet lassi')) return '/images/branded/lassi-lounge/dishes/sweet-lassi.jpg';
  if (name.includes('salt') || name.includes('lassi')) return '/images/branded/lassi-lounge/dishes/salt-lassi.jpg';
  if (name.includes('spring') || name.includes('roll')) return '/images/branded/lassi-lounge/dishes/veg-spring-rolls.png';
  if (name.includes('tikka masala')) return '/images/branded/lassi-lounge/dishes/chicken-tikka-masala.jpg';
  if (name.includes('samosa') || name.includes('chaat') || name.includes('pakora')) return '/images/branded/lassi-lounge/dishes/samosa.jpg';
  if (name.includes('cheese naan')) return '/images/branded/lassi-lounge/dishes/cheese-naan.jpg';
  if (name.includes('garlic naan') || name.includes('naan') || name.includes('roti') || name.includes('bread')) return '/images/branded/lassi-lounge/dishes/garlic-naan.png';
  if (name.includes('chai') || name.includes('tea')) return '/images/branded/lassi-lounge/dishes/masala-chai.jpg';
  if (name.includes('milk') || name.includes('badam')) return '/images/branded/lassi-lounge/dishes/kesar-badam-milk.jpg';
  if (name.includes('tandoori chicken') || name.includes('chiken')) return '/images/branded/lassi-lounge/dishes/tandoori-chiken.png';
  return '/images/branded/lassi-lounge/dishes/butter-chicken.jpg';
};

const isNonVegItem = (item) => {
  if (item.isVeg === false) return true;
  if (item.isVeg === true) return false;
  return /chicken|lamb|mutton|meat|fish|shrimp|prawn|egg|tandoori chicken|rogan josh/i.test(item.name || '');
};

export default function CartSidebar() {
  const {
    isCartOpen,
    closeCart,
    items,
    itemCount,
    subtotal,
    updateQuantity,
    removeItem,
    clearCart,
    specialInstructions,
    setSpecialInstructions,
    restaurant,
  } = useCart();

  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [touchStartY, setTouchStartY] = useState(null);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (specialInstructions && !showNotes) {
      setShowNotes(true);
    }
  }, [specialInstructions, showNotes]);

  useEffect(() => {
    if (isCartOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      setDragY(0);
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isCartOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isCartOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') closeCart();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isCartOpen, closeCart]);

  const handleTouchStart = (e) => {
    setTouchStartY(e.touches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (touchStartY === null) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY;
    if (diff > 0) {
      setDragY(diff);
    }
  };

  const handleTouchEnd = () => {
    if (touchStartY === null) return;
    setIsDragging(false);
    if (dragY > 100) {
      closeCart();
    } else {
      setDragY(0);
    }
    setTouchStartY(null);
  };

  const handleCheckout = () => {
    try {
      trackBeginCheckout(items, subtotal);
    } catch (trackErr) {
      console.warn('Failed to track begin_checkout:', trackErr);
    }
    closeCart();
    router.push('/checkout');
  };

  const handleBrowseMenu = () => {
    closeCart();
    router.push('/menu');
  };

  const backdropClass = isCartOpen
    ? 'opacity-100 pointer-events-auto'
    : 'opacity-0 pointer-events-none';

  const sidebarClass = isCartOpen
    ? 'translate-y-0 sm:translate-x-0'
    : 'translate-y-[105%] sm:translate-y-0 sm:translate-x-full';

  const transitionClass = isDragging
    ? ''
    : 'transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]';

  const isClosed =
    restaurant?.operatingHours &&
    !isRestaurantOpenNow(restaurant.operatingHours, restaurant.timezone);

  const cartMarkup = (
    <div
      className={`fixed inset-0 z-[99990] ${isCartOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
      aria-hidden={!isCartOpen}
    >
      {/* Dark Translucent Backdrop (Covers entire screen including sticky header) */}
      <div
        className={`absolute inset-0 bg-[#1A0D07]/65 backdrop-blur-[2px] transition-opacity duration-300 ${backdropClass}`}
        onClick={closeCart}
      />

      {/* Right-Side Drawer / Mobile Bottom Sheet */}
      <aside
        role="dialog"
        aria-label="Shopping Cart"
        className={`absolute bottom-0 right-0 w-full h-[88vh] max-h-[92dvh] sm:inset-y-0 sm:top-0 sm:bottom-0 sm:h-full sm:max-h-none sm:w-[430px] bg-[#FDF7EE] shadow-[-12px_0_40px_rgba(26,13,7,0.35)] border-l border-[#EADBC8] flex flex-col rounded-t-[28px] sm:rounded-none overflow-hidden transform ${transitionClass} ${sidebarClass}`}
        style={{
          transform:
            dragY > 0 && typeof window !== 'undefined' && window.innerWidth < 640
              ? `translateY(${dragY}px)`
              : undefined,
        }}
      >
        {/* Royal Maroon & Gold Header */}
        <div
          className="relative bg-gradient-to-r from-[#4A070C] via-[#6B0D14] to-[#4A070C] text-white px-5 pt-3 sm:pt-4 pb-4 border-b border-[#F5B53D]/30 shrink-0"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Mobile Drag Handle */}
          <div className="sm:hidden w-full flex justify-center pb-2.5 touch-none">
            <div className="w-11 h-1.5 bg-white/30 rounded-full" />
          </div>

          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#F8C454] to-[#D48228] text-[#4A070C] flex items-center justify-center shadow-[0_4px_12px_rgba(245,181,61,0.3)] shrink-0">
                <ShoppingBag size={18} className="sm:hidden" strokeWidth={2.4} />
                <ShoppingBag size={20} className="hidden sm:block" strokeWidth={2.4} />
              </div>
              <div className="min-w-0 flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-none shrink-0 font-sans">
                  My Order
                </h2>
                {itemCount > 0 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#F5B53D] text-[#4A070C] text-[10px] sm:text-[11px] font-black tracking-wide whitespace-nowrap shrink-0">
                    {itemCount} {itemCount === 1 ? 'Item' : 'Items'}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    clearCart();
                    toast.success('Cart cleared', { duration: 1500 });
                  }}
                  className="px-2 sm:px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[#FDE6C4] hover:text-white text-[11px] sm:text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                  title="Clear all items"
                >
                  <Trash2 size={13} />
                  <span>Clear</span>
                </button>
              )}
              <button
                type="button"
                onClick={closeCart}
                aria-label="Close cart drawer"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <X size={18} strokeWidth={2.4} />
              </button>
            </div>
          </div>
        </div>

        {/* Cart Items Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5 [scrollbar-width:thin]">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4 py-8">
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-b from-[#FFFDF9] to-[#F6E3C6] border-2 border-[#EAD4B4] shadow-[0_8px_24px_rgba(122,11,16,0.10)] flex items-center justify-center mb-5">
                <UtensilsCrossed size={38} className="text-[#7A0B10]" strokeWidth={1.8} />
                <span className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-[#F5B53D] text-[#4A070C] text-xs font-black flex items-center justify-center shadow">
                  0
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-extrabold text-[#1C1917] tracking-tight font-sans">
                Your Cart is Empty
              </h3>
              <p className="text-sm text-[#6B5E53] mt-2 max-w-[280px] leading-relaxed">
                Craving rich Butter Chicken, aromatic Biryani, crispy Garlic Naan, or refreshing Mango Lassi? Add your favourites to get started!
              </p>

              <button
                type="button"
                onClick={handleBrowseMenu}
                className="mt-6 inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-b from-[#7A0B10] to-[#5C0612] hover:from-[#5C0612] hover:to-[#4A070C] text-white text-sm font-bold shadow-[0_8px_20px_rgba(122,11,16,0.3)] transition-all hover:-translate-y-0.5 cursor-pointer"
              >
                <span>Explore Full Menu</span>
                <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <>
              {items.map((item, index) => {
                const qty = item.quantity || item.qty || 1;
                const basePrice = Number(item.selectedSize?.price ?? item.price ?? 0);
                const addOnTotal = (item.addOns || []).reduce((s, a) => s + (Number(a.price) || 0), 0);
                const unitPrice = basePrice + addOnTotal;
                const lineTotal = item.lineTotal || unitPrice * qty;
                const imgSrc = resolveImageUrl(item.image) || getDishImage(item.name);
                const isNonVeg = isNonVegItem(item);

                return (
                  <div
                    key={`${item.menuItemId || item._id || item.name}-${index}`}
                    className="bg-white rounded-2xl p-3.5 border border-[#EADBC8] shadow-[0_4px_14px_rgba(92,6,18,0.06)] hover:border-[#D9B894] transition-all flex gap-3.5"
                  >
                    {/* Dish Image */}
                    <div className="relative w-[74px] h-[74px] rounded-xl overflow-hidden bg-[#2A1810] border border-[#F0E6D8] shrink-0">
                      <img
                        src={imgSrc}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const fallback = getDishImage(item.name);
                          if (!e.currentTarget.src.endsWith(fallback)) {
                            e.currentTarget.src = fallback;
                          }
                        }}
                      />
                      {/* Veg / Non-Veg Indicator Badge */}
                      <span
                        className={`absolute bottom-1.5 left-1.5 w-4 h-4 bg-white/95 rounded-[3px] border flex items-center justify-center shadow-xs ${
                          isNonVeg ? 'border-[#C0262D]' : 'border-[#16A34A]'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isNonVeg ? 'bg-[#C0262D]' : 'bg-[#16A34A]'
                          }`}
                        />
                      </span>
                    </div>

                    {/* Dish Details & Controls */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="font-bold text-[15px] text-[#1C1917] leading-snug truncate font-sans">
                            {item.name}
                          </h4>
                          {item.selectedSize && (
                            <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-[#FDF3E3] text-[#7A0B10] text-[11px] font-semibold">
                              Size: {item.selectedSize.name || item.selectedSize.label}
                            </span>
                          )}
                          {item.addOns?.length > 0 && (
                            <p className="text-[11px] text-[#6B5E53] mt-0.5 line-clamp-1">
                              + {item.addOns.map((a) => a.name).join(', ')}
                            </p>
                          )}
                          <p className="text-[11px] text-[#8C827A] mt-0.5">
                            ${unitPrice.toFixed(2)} each
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-black text-[15px] text-[#7A0B10] block">
                            ${lineTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Bottom Row: Remove & Live + / - Stepper */}
                      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-[#F5ECE0]">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-xs font-semibold text-[#8C827A] hover:text-[#C0262D] flex items-center gap-1 transition-colors cursor-pointer"
                          aria-label={`Remove ${item.name}`}
                        >
                          <Trash2 size={13} />
                          <span>Remove</span>
                        </button>

                        <div className="flex items-center h-8 rounded-lg bg-[#7A0B10] text-white overflow-hidden shadow-sm">
                          <button
                            type="button"
                            onClick={() => {
                              if (qty > 1) updateQuantity(index, qty - 1);
                              else removeItem(index);
                            }}
                            className="w-8 h-full flex items-center justify-center hover:bg-black/20 active:scale-95 transition cursor-pointer"
                            aria-label={`Decrease quantity of ${item.name}`}
                          >
                            <Minus size={13} strokeWidth={3} />
                          </button>
                          <span className="min-w-[28px] text-center text-xs font-extrabold select-none">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(index, qty + 1)}
                            className="w-8 h-full flex items-center justify-center hover:bg-black/20 active:scale-95 transition cursor-pointer"
                            aria-label={`Increase quantity of ${item.name}`}
                          >
                            <Plus size={13} strokeWidth={3} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Special Cooking Instructions */}
              <div className="bg-white rounded-2xl border border-[#EADBC8] p-3.5 shadow-[0_2px_10px_rgba(92,6,18,0.04)]">
                <button
                  type="button"
                  onClick={() => setShowNotes((prev) => !prev)}
                  className="w-full flex items-center justify-between text-left text-xs font-bold text-[#7A0B10] cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <MessageSquarePlus size={15} />
                    <span>Add Special Cooking Instructions</span>
                  </span>
                  <span className="text-[11px] text-[#6B5E53] underline">
                    {showNotes ? 'Hide' : specialInstructions ? 'Edit' : 'Optional'}
                  </span>
                </button>

                {showNotes && (
                  <textarea
                    rows={2}
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="e.g. Make it medium spicy, extra mint chutney, less sugar in mango lassi..."
                    className="mt-2.5 w-full rounded-xl border border-[#E5D5C0] bg-[#FDF9F3] px-3 py-2 text-xs text-[#1C1917] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#7A0B10]"
                  />
                )}
              </div>

              {/* Quick Link to Add More Dishes */}
              <button
                type="button"
                onClick={handleBrowseMenu}
                className="w-full py-2.5 rounded-xl border border-dashed border-[#C99158] bg-[#FFF9F0] hover:bg-[#FDF0DC] text-[#7A0B10] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus size={14} strokeWidth={2.5} />
                <span>Add More Dishes from Menu</span>
              </button>
            </>
          )}
        </div>

        {/* Footer / Bill Summary & Checkout CTA */}
        {items.length > 0 && (
          <div className="bg-[#FFFDF9] border-t border-[#EADBC8] px-5 pt-3.5 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] sm:pb-6 space-y-3 shrink-0 shadow-[0_-8px_24px_rgba(92,6,18,0.06)]">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-[#57534E]">Item Subtotal</span>
                <span className="font-black text-lg text-[#1C1917]">${subtotal.toFixed(2)}</span>
              </div>
              <p className="text-[11px] text-[#8C827A]">
                Taxes, delivery fee &amp; coupons are calculated at checkout.
              </p>
            </div>

            {isClosed ? (
              <div className="p-3.5 bg-[#FEF2F2] border border-[#FECACA] rounded-xl flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-[#FEE2E2] flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="w-4 h-4 text-[#DC2626]" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-[12px] font-extrabold uppercase tracking-wider text-[#991B1B] mb-0.5">
                    {isWithin15MinsOfClosing(restaurant.operatingHours, restaurant.timezone)
                      ? 'Closing Soon'
                      : 'Restaurant Closed'}
                  </div>
                  <p className="text-[12px] text-[#7F1D1D] font-medium leading-snug">
                    {isWithin15MinsOfClosing(restaurant.operatingHours, restaurant.timezone)
                      ? "We're wrapping up for the day! New orders close 15 minutes before closing time."
                      : 'The restaurant is currently closed. Please check back during operating hours.'}
                  </p>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleCheckout}
                className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-[#7A0B10] via-[#5C0612] to-[#7A0B10] hover:from-[#5C0612] hover:to-[#4A070C] text-white font-bold text-sm sm:text-base shadow-[0_8px_22px_rgba(122,11,16,0.35)] flex items-center justify-between transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <span>Proceed to Checkout</span>
                </span>
                <span className="flex items-center gap-2 bg-black/20 px-3 py-1 rounded-lg text-sm font-extrabold text-[#F5B53D]">
                  <span>${subtotal.toFixed(2)}</span>
                  <ArrowRight size={16} className="text-white" />
                </span>
              </button>
            )}
          </div>
        )}
      </aside>
    </div>
  );

  if (!mounted) return null;
  return createPortal(cartMarkup, document.body);
}
