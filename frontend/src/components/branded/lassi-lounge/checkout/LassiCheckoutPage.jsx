'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShoppingCart,
  MapPin,
  Check,
  Bike,
  Store,
  Home,
  Briefcase,
  Pencil,
  Plus,
  CreditCard,
  Lock,
  ArrowRight,
  Tag,
  X,
  Minus,
  ShieldCheck,
  Star,
  Navigation,
  Loader2,
  Sparkles,
  ChevronRight,
  AlertCircle,
  Award,
} from 'lucide-react';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

import { useCheckoutState } from '@/components/checkout/useCheckoutState';
import { useCheckoutTheme } from '@/components/checkout/useCheckoutTheme';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import LassiAddressModal from '../LassiAddressModal';
import ReviewOrderSection from '@/components/checkout/ReviewOrderSection';
import PaymentSimulatorModal from '@/components/checkout/PaymentSimulatorModal';
import { formatCurrency } from '@/lib/formatters';
import { getDishImage } from '@/components/profile/profileUtils';
import { showToast } from '@/components/ui';

const HERO_BG = '/images/branded/lassi-lounge/hero-spread.jpg';

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

const hasEmoji = (str) => Boolean(str && /[\p{Extended_Pictographic}\p{Emoji_Presentation}]/u.test(str));
const NAME_REGEX = /^[a-zA-Z0-9\s\-'.@_+]+$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default function LassiCheckoutPage() {
  const c = useCheckoutState();
  const t = useCheckoutTheme(c.isSingleRestaurantMode);
  const { user } = useAuth();
  const { specialInstructions, setSpecialInstructions } = useCart();

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [selectedAddressIdx, setSelectedAddressIdx] = useState(0);
  const [showAddressForm, setShowAddressForm] = useState(false);

  // Real DB saved addresses from user profile (empty if not logged in or no saved addresses in DB)
  const savedAddresses = useMemo(() => {
    const rawList = c.user?.savedAddresses || user?.savedAddresses || [];
    if (!Array.isArray(rawList) || rawList.length === 0) return [];
    return rawList.map((a) => {
      const parts = (a.address || '').split(',').map((p) => p.trim());
      return {
        _id: a._id,
        label: a.label || 'Saved Address',
        address: a.address,
        displayLine1: parts.slice(0, Math.max(1, parts.length - 2)).join(', ') || a.address,
        displayLine2: parts.length > 1 ? `${parts.slice(-2).join(', ')}, USA` : 'USA',
        lat: a.lat ?? null,
        lng: a.lng ?? null,
        isDefault: Boolean(a.isDefault),
      };
    });
  }, [c.user?.savedAddresses, user?.savedAddresses]);

  // Card payment fields
  const [kitchenNotes, setKitchenNotes] = useState('');

  // Field validation errors
  const [formErrors, setFormErrors] = useState({});
  const [checkoutCouponError, setCheckoutCouponError] = useState('');

  // Mobile sticky place order bar visibility (auto-hides when scrolled to in-page place order)
  const inPagePlaceOrderRef = useRef(null);
  const [isStickyBarVisible, setIsStickyBarVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const el = inPagePlaceOrderRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const windowHeight = window.innerHeight || document.documentElement.clientHeight;
      // When the top of in-page place order section is within viewport or scrolled past
      const hasReached = rect.top < windowHeight - 40;
      setIsStickyBarVisible(!hasReached);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [c.itemCount, c.total]);

  const clearFieldError = (fieldName) => {
    setFormErrors((prev) => {
      if (!prev[fieldName]) return prev;
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  };

  const handleApplyCheckoutCoupon = async () => {
    if (!c.couponCode?.trim()) {
      setCheckoutCouponError('Please enter a coupon code');
      return;
    }
    setCheckoutCouponError('');
    try {
      await c.handleApplyCoupon();
    } catch (err) {
      setCheckoutCouponError(err?.message || 'Invalid coupon code');
    }
  };

  const validateFields = () => {
    const newErrors = {};

    // 1. Full Name validation
    if (!c.fullName?.trim()) {
      newErrors.fullName = 'Please enter your full name';
    } else if (hasEmoji(c.fullName)) {
      newErrors.fullName = 'Emojis are not allowed in name.';
    } else if (!NAME_REGEX.test(c.fullName.trim())) {
      newErrors.fullName = 'Please use standard letters and numbers only. Special characters are not allowed.';
    } else if (c.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    } else if (c.fullName.trim().length > 50) {
      newErrors.fullName = 'Name must be between 2 and 50 characters';
    }

    // 2. Mobile Phone Number validation
    const rawPhone = c.phone || '';
    const cleanPhone = rawPhone.replace(/\D/g, '');
    if (!rawPhone.trim()) {
      newErrors.phone = 'Please enter your mobile number';
    } else if (hasEmoji(rawPhone)) {
      newErrors.phone = 'Emojis are not allowed in mobile number.';
    } else if (typeof isValidPhoneNumber === 'function' ? !isValidPhoneNumber(rawPhone) : cleanPhone.length < 10) {
      newErrors.phone = 'Please enter a valid, complete phone number.';
    }

    // 3. Email Address validation
    if (!c.email?.trim()) {
      newErrors.email = 'Please enter your email address';
    } else if (hasEmoji(c.email)) {
      newErrors.email = 'Emojis are not allowed in email addresses.';
    } else if (!EMAIL_REGEX.test(c.email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    // 4. Delivery Address validation (if orderType === 'delivery')
    if (c.orderType === 'delivery') {
      const isManualOrNoSaved = savedAddresses.length === 0 || showAddressForm || !c.addressLine1?.trim();

      if (isManualOrNoSaved) {
        if (!c.addressLine1?.trim()) {
          newErrors.addressLine1 = 'Please enter street address';
        }
        if (!c.city?.trim()) {
          newErrors.city = 'Please enter city';
        }
        if (!c.state?.trim()) {
          newErrors.state = 'Please select state';
        }
        const cleanZip = (c.zipCode || '').replace(/\D/g, '');
        if (!c.zipCode?.trim()) {
          newErrors.zipCode = 'Please enter zip code';
        } else if (cleanZip.length < 5) {
          newErrors.zipCode = 'Zip code must be 5 digits';
        }
      } else if (!c.addressLine1?.trim()) {
        newErrors.addressLine1 = 'Please select or enter a delivery address';
      }

      if (c.quoteError) {
        newErrors.quoteError = c.quoteError;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      const firstField = Object.keys(newErrors)[0];
      const el = document.querySelector(`[data-field="${firstField}"], [name="${firstField}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      const firstMsg = newErrors[firstField];
      if (firstMsg) {
        showToast(firstMsg, 'error');
      }
      return false;
    }

    setFormErrors({});
    return true;
  };

  /**
   * Big screen checkout behavior:
   * Clicking "Review Order" validates all fields.
   * On success, opens Step 3 Review Order popup modal where driver tip can be selected,
   * order details can be reviewed, and "Confirm & Place Order" can be tapped.
   */
  const handleReviewOrderClick = async () => {
    if (!validateFields()) return;

    if (c.orderType === 'delivery') {
      let currentLat = c.addressLat;
      let currentLng = c.addressLng;

      if (!c.addressVerified || currentLat === null || currentLng === null) {
        showToast('Please select a valid address from suggestions or pin on map.', 'error');
        return;
      }

      if (c.quoteError) {
        showToast(c.quoteError, 'error');
        return;
      }
    }

    c.setStep(3);
  };

  const handleStep1Click = () => {
    if (typeof c.openCart === 'function') {
      c.openCart();
    } else {
      c.router?.push('/menu');
    }
  };

  const handleStep2Click = () => {
    if (c.step === 3) {
      c.setStep(2);
    }
    const el = document.getElementById('delivery-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 280, behavior: 'smooth' });
    }
  };

  const handleStep3Click = () => {
    handleReviewOrderClick();
  };

  // Auto-select user's default saved address from DB on mount (only if user has saved addresses)
  useEffect(() => {
    if (savedAddresses.length > 0 && !c.addressLine1) {
      const defIdx = Math.max(0, savedAddresses.findIndex((a) => a.isDefault));
      setSelectedAddressIdx(defIdx);
      if (savedAddresses[defIdx]) {
        c.handleSelectSavedAddress(savedAddresses[defIdx]);
      }
    }
  }, [savedAddresses]);

  // Sync kitchen notes
  useEffect(() => {
    if (typeof setSpecialInstructions === 'function') {
      setSpecialInstructions(kitchenNotes.trim());
    }
  }, [kitchenNotes, setSpecialInstructions]);

  const handleSelectAddressCard = (addr, idx) => {
    setSelectedAddressIdx(idx);
    setShowAddressForm(false);
    c.handleSelectSavedAddress(addr);
    clearFieldError('addressLine1');
  };

  // Loyalty calculations
  const loyaltyPoints = Number(user?.loyaltyPoints || c.user?.loyaltyPoints || 0);
  const loyaltyValue = (loyaltyPoints / 100).toFixed(2);

  return (
    <div className="min-h-screen bg-[#FAF3E8] text-[#1A1A1A] flex flex-col font-sans">
      {/* ═══════════════════════════════════════════════════════════════════
          1. HERO BANNER (Matches Bhatura's Layout with Lassi Lounge Brand)
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-[#2A0508] min-h-[250px] sm:min-h-[290px] lg:min-h-[320px] flex items-center">
        <Image
          src={HERO_BG}
          alt="Lassi Lounge NY Checkout"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-40 brightness-75 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#2A0508]/95 via-[#4A090B]/85 to-[#1A0305]/95" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#2A0508]/60 to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-10 sm:py-12 pb-14">
          <div className="max-w-xl">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-xs sm:text-[13px] text-white/85 font-medium mb-2.5">
              <Link href="/" className="hover:text-[#F5B53D] transition-colors">
                Home
              </Link>
              <ChevronRight size={13} className="text-white/60" />
              <Link href="/menu" className="hover:text-[#F5B53D] transition-colors">
                Menu
              </Link>
              <ChevronRight size={13} className="text-white/60" />
              <span className="text-[#F5B53D] font-semibold">Checkout</span>
            </nav>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[#F5B53D] text-[11px] font-bold uppercase tracking-wider mb-2">
              <Sparkles size={12} className="text-[#D4AF37]" />
              <span>100% Secure Checkout</span>
            </div>

            <h1 className="font-['Playfair_Display'] text-4xl sm:text-5xl lg:text-[54px] font-black text-white leading-[1.08] tracking-tight">
              Checkout
            </h1>

            <p className="text-white/90 text-sm sm:text-[15px] leading-relaxed mt-2.5 max-w-[460px]">
              Almost there! Complete your order and indulge in authentic Royal Indian delicacies fresh to your doorstep.
            </p>
          </div>
        </div>

        {/* Smooth Bottom Curve Wave */}
        <div className="absolute bottom-0 left-0 right-0 h-8 sm:h-11 pointer-events-none z-20">
          <svg viewBox="0 0 1440 44" preserveAspectRatio="none" className="w-full h-full">
            <path
              d="M0,26 C180,0 380,4 680,22 C940,37 1180,38 1440,10 L1440,44 L0,44 Z"
              fill="#FAF3E8"
            />
          </svg>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          2. 3-STEP HORIZONTAL PROGRESS STEPPER (Pixel-Perfect & Responsive)
         ═══════════════════════════════════════════════════════════════════ */}
      <section className="bg-[#FAF3E8] pt-4 pb-4 border-b border-[#EFE3D2]">
        <div className="max-w-xl mx-auto px-3 sm:px-6">
          <div className="relative flex items-center justify-between">
            {/* Background Connecting Track Line */}
            <div className="absolute top-[20px] left-[15%] right-[15%] h-[2px] bg-[#E2D6C5] z-0" />
            {/* Active Maroon Progress Line */}
            <div
              className="absolute top-[20px] left-[15%] h-[2.5px] bg-[#7A0B10] z-0 transition-all duration-500 ease-out"
              style={{
                width: c.step === 3 ? '70%' : '35%',
              }}
            />

            {/* Step 1: Cart (Completed) */}
            <button
              type="button"
              onClick={handleStep1Click}
              className="relative z-10 flex flex-col items-center group focus:outline-none flex-1 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-[#7A0B10] text-white flex items-center justify-center shadow-[0_2px_8px_rgba(122,11,16,0.3)] border-2 border-white transition-all group-hover:scale-105">
                <Check size={18} strokeWidth={2.8} />
              </div>
              <span className="text-xs sm:text-sm font-bold text-[#1A1A1A] group-hover:text-[#7A0B10] transition-colors whitespace-nowrap mt-2 text-center">
                1. Cart
              </span>
            </button>

            {/* Step 2: Delivery & Pay (Active on Checkout) */}
            <button
              type="button"
              onClick={handleStep2Click}
              className="relative z-10 flex flex-col items-center group focus:outline-none flex-1 cursor-pointer"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 border-white transition-all group-hover:scale-105 ${
                  c.step < 3
                    ? 'bg-[#7A0B10] text-white shadow-[0_4px_14px_rgba(122,11,16,0.35)] ring-4 ring-[#7A0B10]/15'
                    : 'bg-[#7A0B10] text-white shadow-sm'
                }`}
              >
                {c.step === 3 ? (
                  <Check size={18} strokeWidth={2.8} />
                ) : (
                  <MapPin size={17} strokeWidth={2.2} />
                )}
              </div>
              <span className={`text-xs sm:text-sm font-extrabold whitespace-nowrap transition-colors mt-2 text-center ${
                c.step < 3 ? 'text-[#7A0B10]' : 'text-[#1A1A1A]'
              }`}>
                2. Delivery &amp; Pay
              </span>
            </button>

            {/* Step 3: Review Order (Popup / Final Step) */}
            <button
              type="button"
              onClick={handleStep3Click}
              className="relative z-10 flex flex-col items-center group focus:outline-none flex-1 cursor-pointer"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all group-hover:scale-105 ${
                  c.step === 3
                    ? 'bg-[#7A0B10] border-white text-white shadow-[0_4px_14px_rgba(122,11,16,0.35)] ring-4 ring-[#7A0B10]/15'
                    : 'bg-white border-[#D5C6B4] text-[#8C7E72] shadow-xs'
                }`}
              >
                <Check size={18} strokeWidth={2.5} />
              </div>
              <span className={`text-xs sm:text-sm font-bold whitespace-nowrap transition-colors mt-2 text-center ${
                c.step === 3 ? 'text-[#7A0B10]' : 'text-[#8C7E72] group-hover:text-[#1A1A1A]'
              }`}>
                3. Review Order
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          3. MAIN CHECKOUT CONTENT (2-Column Grid)
         ═══════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 pt-7 pb-24 sm:py-9">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {c.itemCount === 0 ? (
            <div className="bg-white rounded-3xl border border-[#EADBC8] shadow-[0_8px_30px_rgba(122,11,16,0.06)] p-10 sm:p-16 text-center max-w-xl mx-auto my-8">
              <div className="w-20 h-20 rounded-full bg-[#FDF3E7] border border-[#EAD4B4] text-[#7A0B10] flex items-center justify-center mx-auto mb-5">
                <ShoppingCart size={34} strokeWidth={1.8} />
              </div>
              <h2 className="font-['Playfair_Display'] text-3xl font-black text-[#1A1A1A]">
                Your Cart is Empty
              </h2>
              <p className="text-sm text-[#6B5E53] mt-2 max-w-sm mx-auto leading-relaxed">
                Add your favorite Butter Chicken, Biryani, Naan, or refreshing Mango Lassi before proceeding to checkout.
              </p>
              <Link
                href="/menu"
                className="mt-6 inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-[#7A0B10] via-[#5C0612] to-[#4A090B] hover:from-[#5C0612] hover:to-[#7A0B10] text-white text-sm font-bold shadow-[0_8px_20px_rgba(122,11,16,0.3)] transition-all hover:-translate-y-0.5"
              >
                <span>Browse Our Menu</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-7 items-start">
              {/* ─────────────────────────────────────────────────────────────
                  LEFT COLUMN (8 cols): Checkout Details Cards
                 ───────────────────────────────────────────────────────────── */}
              <div id="delivery-section" className="lg:col-span-8 space-y-6">
                {/* ═══ CARD 1: DELIVERY OPTION ═══ */}
                <div className="bg-white rounded-2xl border border-[#EAE0D3] shadow-[0_4px_20px_rgba(40,10,10,0.04)] p-5 sm:p-7">
                  <div className="flex items-center gap-3 pb-4 border-b border-[#F0E6D8]">
                    <div className="w-7 h-7 rounded-full bg-[#7A0B10] text-white text-xs font-black flex items-center justify-center shadow-xs">
                      1
                    </div>
                    <h2 className="font-['Playfair_Display'] text-lg sm:text-xl font-bold text-[#1A1A1A]">
                      Delivery Option
                    </h2>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4">
                    {/* Delivery Tab */}
                    <button
                      type="button"
                      onClick={() => c.setOrderType('delivery')}
                      className={`p-4 sm:p-5 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                        c.orderType === 'delivery'
                          ? 'border-[#7A0B10] bg-[#FDF8EE] shadow-[0_4px_16px_rgba(122,11,16,0.12)]'
                          : 'border-[#EAE0D3] bg-white hover:border-[#D5C4AE]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            c.orderType === 'delivery'
                              ? 'bg-[#7A0B10] text-white'
                              : 'bg-[#F5EDE1] text-[#6B5E53]'
                          }`}
                        >
                          <Bike size={20} strokeWidth={2.2} />
                        </div>
                        {c.orderType === 'delivery' && (
                          <div className="w-5 h-5 rounded-full bg-[#7A0B10] text-white flex items-center justify-center">
                            <Check size={12} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                      <div className="mt-3">
                        <h3 className="font-bold text-sm sm:text-base text-[#1A1A1A]">
                          Delivery
                        </h3>
                        <p className="text-xs text-[#6B5E53] mt-0.5">
                          {c.quoteLoading ? 'Calculating fee...' : c.deliveryFee === 0 ? 'Free Delivery' : 'Delivered hot to your door'}
                        </p>
                      </div>
                      <span className="mt-2.5 inline-block text-[11px] font-bold text-[#7A0B10] bg-[#FCEAE6] px-2 py-0.5 rounded-md w-fit">
                        35-45 mins
                      </span>
                    </button>

                    {/* Pickup Tab */}
                    <button
                      type="button"
                      onClick={() => c.setOrderType('pickup')}
                      className={`p-4 sm:p-5 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                        c.orderType === 'pickup'
                          ? 'border-[#7A0B10] bg-[#FDF8EE] shadow-[0_4px_16px_rgba(122,11,16,0.12)]'
                          : 'border-[#EAE0D3] bg-white hover:border-[#D5C4AE]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            c.orderType === 'pickup'
                              ? 'bg-[#7A0B10] text-white'
                              : 'bg-[#F5EDE1] text-[#6B5E53]'
                          }`}
                        >
                          <Store size={20} strokeWidth={2.2} />
                        </div>
                        {c.orderType === 'pickup' && (
                          <div className="w-5 h-5 rounded-full bg-[#7A0B10] text-white flex items-center justify-center">
                            <Check size={12} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                      <div className="mt-3">
                        <h3 className="font-bold text-sm sm:text-base text-[#1A1A1A]">
                          Store Pickup
                        </h3>
                        <p className="text-xs text-[#6B5E53] mt-0.5">
                          Pick up directly from Lassi Lounge
                        </p>
                      </div>
                      <span className="mt-2.5 inline-block text-[11px] font-bold text-[#16A34A] bg-[#DCFCE7] px-2 py-0.5 rounded-md w-fit">
                        Ready in 20-30 mins
                      </span>
                    </button>
                  </div>
                </div>

                {/* ═══ CARD 2: CONTACT & DELIVERY DETAILS ═══ */}
                <div className="bg-white rounded-2xl border border-[#EAE0D3] shadow-[0_4px_20px_rgba(40,10,10,0.04)] p-5 sm:p-7">
                  <div className="flex items-center gap-3 pb-4 border-b border-[#F0E6D8]">
                    <div className="w-7 h-7 rounded-full bg-[#7A0B10] text-white text-xs font-black flex items-center justify-center shadow-xs">
                      2
                    </div>
                    <h2 className="font-['Playfair_Display'] text-lg sm:text-xl font-bold text-[#1A1A1A]">
                      {c.orderType === 'delivery'
                        ? 'Contact & Delivery Details'
                        : 'Contact & Pickup Details'}
                    </h2>
                  </div>

                  {/* Contact Fields */}
                  <div className="mt-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Full Name */}
                      <div data-field="fullName">
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#6B5E53] mb-1.5">
                          Full Name <span className="text-[#7A0B10]">*</span>
                        </label>
                        <input
                          type="text"
                          name="fullName"
                          autoComplete="name"
                          value={c.fullName}
                          onChange={(e) => {
                            c.setFullName(e.target.value);
                            clearFieldError('fullName');
                          }}
                          placeholder="Enter your full name"
                          className={`w-full h-11 rounded-xl border bg-[#FDFBF8] px-3.5 text-sm text-[#1A1A1A] placeholder-[#A89F91] focus:outline-none focus:ring-2 focus:ring-[#7A0B10]/20 focus:border-[#7A0B10] transition-all ${
                            formErrors.fullName ? 'border-[#DC2626] bg-[#FFF5F5] ring-1 ring-[#DC2626]' : 'border-[#E4D9C8]'
                          }`}
                        />
                        {formErrors.fullName && (
                          <p className="text-xs text-[#DC2626] mt-1.5 font-medium flex items-center gap-1">
                            <AlertCircle size={12} className="shrink-0" />
                            <span>{formErrors.fullName}</span>
                          </p>
                        )}
                      </div>

                      {/* Phone Number */}
                      <div data-field="phone">
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#6B5E53] mb-1.5">
                          Mobile Number <span className="text-[#7A0B10]">*</span>
                        </label>
                        <div
                          className={`h-11 rounded-xl border bg-[#FDFBF8] px-3 flex items-center focus-within:ring-2 focus-within:ring-[#7A0B10]/20 focus-within:border-[#7A0B10] transition-all lassi-phone-wrap ${
                            formErrors.phone ? 'border-[#DC2626] bg-[#FFF5F5] ring-1 ring-[#DC2626]' : 'border-[#E4D9C8]'
                          }`}
                        >
                          <PhoneInput
                            international
                            defaultCountry="US"
                            placeholder="Enter phone number"
                            value={c.phone}
                            onChange={(val) => {
                              c.setPhone(val || '');
                              clearFieldError('phone');
                            }}
                            className="w-full"
                          />
                        </div>
                        {formErrors.phone && (
                          <p className="text-xs text-[#DC2626] mt-1.5 font-medium flex items-center gap-1">
                            <AlertCircle size={12} className="shrink-0" />
                            <span>{formErrors.phone}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Email */}
                    <div data-field="email">
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#6B5E53] mb-1.5">
                        Email Address <span className="text-[#7A0B10]">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        autoComplete="email"
                        value={c.email}
                        onChange={(e) => {
                          c.setEmail(e.target.value);
                          clearFieldError('email');
                        }}
                        placeholder="Enter your email address"
                        className={`w-full h-11 rounded-xl border bg-[#FDFBF8] px-3.5 text-sm text-[#1A1A1A] placeholder-[#A89F91] focus:outline-none focus:ring-2 focus:ring-[#7A0B10]/20 focus:border-[#7A0B10] transition-all ${
                          formErrors.email ? 'border-[#DC2626] bg-[#FFF5F5] ring-1 ring-[#DC2626]' : 'border-[#E4D9C8]'
                        }`}
                      />
                      {formErrors.email && (
                        <p className="text-xs text-[#DC2626] mt-1.5 font-medium flex items-center gap-1">
                          <AlertCircle size={12} className="shrink-0" />
                          <span>{formErrors.email}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* ─── DELIVERY ADDRESS SECTION (If orderType === 'delivery') ─── */}
                  {c.orderType === 'delivery' ? (
                    <div className="mt-6 pt-5 border-t border-[#F0E6D8] space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold uppercase tracking-wider text-[#6B5E53]">
                          Delivery Address <span className="text-[#7A0B10]">*</span>
                        </label>
                        {savedAddresses.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setShowAddressForm(!showAddressForm)}
                            className="text-xs font-bold text-[#7A0B10] hover:text-[#5C0612] flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Pencil size={12} />
                            <span>{showAddressForm ? 'Select Saved Address' : '+ Enter New Address'}</span>
                          </button>
                        )}
                      </div>

                      {/* Saved Addresses List (Cards) - ONLY when user has saved addresses in DB */}
                      {savedAddresses.length > 0 && !showAddressForm && (
                        <div className="space-y-2.5">
                          {savedAddresses.map((addr, idx) => {
                            const isSelected = selectedAddressIdx === idx;
                            const IconComponent =
                              addr.label?.toLowerCase() === 'work'
                                ? Briefcase
                                : addr.label?.toLowerCase() === 'home'
                                ? Home
                                : MapPin;
                            return (
                              <div
                                key={addr._id || `${addr.label}-${idx}`}
                                onClick={() => handleSelectAddressCard(addr, idx)}
                                className={`flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl border cursor-pointer transition-all ${
                                  isSelected
                                    ? 'bg-[#FDF8EE] border-[#7A0B10] shadow-[0_2px_10px_rgba(122,11,16,0.1)]'
                                    : 'bg-white border-[#EAE0D3] hover:border-[#D5C4AE]'
                                }`}
                              >
                                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                                  <div
                                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                                      isSelected
                                        ? 'bg-[#7A0B10] text-white'
                                        : 'bg-[#F5EDE1] text-[#6B5E53]'
                                    }`}
                                  >
                                    <IconComponent size={17} />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-xs sm:text-sm text-[#1A1A1A]">
                                        {addr.label || 'Saved Address'}
                                      </span>
                                      {isSelected && (
                                        <span className="text-[10px] font-bold text-[#7A0B10] bg-[#FCEAE6] px-1.5 py-0.5 rounded">
                                          Deliver Here
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-[#6B5E53] truncate mt-0.5">
                                      {addr.address}
                                    </p>
                                  </div>
                                </div>
                                <div
                                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                    isSelected
                                      ? 'border-[#7A0B10] bg-[#7A0B10] text-white'
                                      : 'border-[#D4C7B8]'
                                  }`}
                                >
                                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Address Input Form - Directly shown if no saved addresses, or when "+ Enter New Address" is clicked */}
                      {(savedAddresses.length === 0 || showAddressForm) && (
                        <div className="bg-[#FAF5EC] rounded-2xl p-4 sm:p-5 border border-[#E8DCCB] space-y-3.5">
                          {/* Street Address & Autocomplete */}
                          <div data-field="addressLine1" className="relative">
                            <label className="block text-xs font-bold uppercase tracking-wider text-[#6B5E53] mb-1">
                              Street Address <span className="text-[#7A0B10]">*</span>
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                name="addressLine1"
                                autoComplete="address-line1"
                                value={c.addressLine1}
                                onChange={(e) => {
                                  c.handleAddressLine1Change(e.target.value);
                                  clearFieldError('addressLine1');
                                }}
                                placeholder="House No., Street Name, or Landmark"
                                className={`w-full h-11 rounded-xl border bg-white pl-10 pr-9 text-sm text-[#1A1A1A] placeholder-[#A89F91] focus:outline-none focus:ring-2 focus:ring-[#7A0B10]/20 focus:border-[#7A0B10] transition-all ${
                                  formErrors.addressLine1 ? 'border-[#DC2626] bg-[#FFF5F5] ring-1 ring-[#DC2626]' : 'border-[#E4D9C8]'
                                }`}
                              />
                              <MapPin size={17} className="absolute left-3.5 top-3.5 text-[#7A0B10]" />
                              {c.addressLine1 && (
                                <button
                                  type="button"
                                  onClick={() => c.handleAddressLine1Change('')}
                                  className="absolute right-3 top-3.5 text-[#8C7E72] hover:text-[#1A1A1A]"
                                >
                                  <X size={15} />
                                </button>
                              )}
                            </div>

                            {/* Autocomplete Suggestions Dropdown */}
                            {c.suggestions?.length > 0 && (
                              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl border border-[#E0D4C2] shadow-xl z-50 overflow-hidden divide-y divide-[#F2EAE0]">
                                {c.suggestions.map((sug, idx) => (
                                  <div
                                    key={idx}
                                    onClick={() => {
                                      c.handleSelectSuggestion(sug);
                                      clearFieldError('addressLine1');
                                    }}
                                    className="p-3 hover:bg-[#FDF8EE] cursor-pointer text-xs sm:text-sm text-[#1A1A1A] flex items-center gap-2.5 transition-colors"
                                  >
                                    <MapPin size={15} className="text-[#7A0B10] shrink-0" />
                                    <span className="truncate">{sug.display_name}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {formErrors.addressLine1 && (
                              <p className="text-xs text-[#DC2626] mt-1.5 font-medium flex items-center gap-1">
                                <AlertCircle size={12} className="shrink-0" />
                                <span>{formErrors.addressLine1}</span>
                              </p>
                            )}
                          </div>

                          {/* Quick Location Buttons: Current GPS & Direct Map Bottom Sheet */}
                          <div className="flex flex-wrap gap-2 pt-1">
                            <button
                              type="button"
                              onClick={c.handleUseCurrentLocation}
                              disabled={c.isLocationLoading}
                              className="px-3 py-1.5 rounded-lg bg-white border border-[#D5C6B4] text-[#7A0B10] text-xs font-bold hover:bg-[#FDF8EE] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                              {c.isLocationLoading ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <Navigation size={13} />
                              )}
                              <span>Use Current Location</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setIsAddressModalOpen(true)}
                              className="px-3 py-1.5 rounded-lg bg-white border border-[#D5C6B4] text-[#856404] text-xs font-bold hover:bg-[#FFFDF4] transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                              <MapPin size={13} />
                              <span>Pin on Map</span>
                            </button>
                          </div>

                          {/* Unit / Apt / Suite */}
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-[#6B5E53] mb-1">
                              Apt / Suite / Floor (Optional)
                            </label>
                            <input
                              type="text"
                              name="addressLine2"
                              autoComplete="address-line2"
                              value={c.addressLine2}
                              onChange={(e) => c.setAddressLine2(e.target.value)}
                              placeholder="e.g. Apt 4B, Floor 2"
                              className="w-full h-10 rounded-xl border border-[#E4D9C8] bg-white px-3.5 text-sm text-[#1A1A1A] placeholder-[#A89F91] focus:outline-none focus:border-[#7A0B10]"
                            />
                          </div>

                          {/* City, State, Zip */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div data-field="city">
                              <label className="block text-xs font-bold uppercase tracking-wider text-[#6B5E53] mb-1">
                                City <span className="text-[#7A0B10]">*</span>
                              </label>
                              <input
                                type="text"
                                name="city"
                                autoComplete="address-level2"
                                value={c.city}
                                onChange={(e) => {
                                  c.setCity(e.target.value);
                                  clearFieldError('city');
                                }}
                                placeholder="Enter city"
                                className={`w-full h-10 rounded-xl border bg-white px-3 text-sm text-[#1A1A1A] placeholder-[#A89F91] focus:outline-none focus:border-[#7A0B10] ${
                                  formErrors.city ? 'border-[#DC2626] ring-1 ring-[#DC2626]' : 'border-[#E4D9C8]'
                                }`}
                              />
                              {formErrors.city && (
                                <p className="text-xs text-[#DC2626] mt-1 font-medium flex items-center gap-1">
                                  <AlertCircle size={12} className="shrink-0" />
                                  <span>{formErrors.city}</span>
                                </p>
                              )}
                            </div>

                            <div data-field="state">
                              <label className="block text-xs font-bold uppercase tracking-wider text-[#6B5E53] mb-1">
                                State <span className="text-[#7A0B10]">*</span>
                              </label>
                              <select
                                value={c.state || 'NY'}
                                name="state"
                                autoComplete="address-level1"
                                onChange={(e) => {
                                  c.setState(e.target.value);
                                  clearFieldError('state');
                                }}
                                className="w-full h-10 rounded-xl border border-[#E4D9C8] bg-white px-3 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#7A0B10]"
                              >
                                {US_STATES.map((st) => (
                                  <option key={st} value={st}>
                                    {st}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div data-field="zipCode">
                              <label className="block text-xs font-bold uppercase tracking-wider text-[#6B5E53] mb-1">
                                Zip Code <span className="text-[#7A0B10]">*</span>
                              </label>
                              <input
                                type="text"
                                name="zipCode"
                                autoComplete="postal-code"
                                maxLength={5}
                                value={c.zipCode}
                                onChange={(e) => {
                                  c.setZipCode(e.target.value.replace(/\D/g, ''));
                                  clearFieldError('zipCode');
                                }}
                                placeholder="Enter zip code"
                                className={`w-full h-10 rounded-xl border bg-white px-3 text-sm text-[#1A1A1A] placeholder-[#A89F91] focus:outline-none focus:border-[#7A0B10] ${
                                  formErrors.zipCode ? 'border-[#DC2626] ring-1 ring-[#DC2626]' : 'border-[#E4D9C8]'
                                }`}
                              />
                              {formErrors.zipCode && (
                                <p className="text-xs text-[#DC2626] mt-1 font-medium flex items-center gap-1">
                                  <AlertCircle size={12} className="shrink-0" />
                                  <span>{formErrors.zipCode}</span>
                                </p>
                              )}
                            </div>
                          </div>

                          {/* If user toggled to new address form from saved addresses, provide back button */}
                          {savedAddresses.length > 0 && showAddressForm && (
                            <div className="pt-2 flex justify-end">
                              <button
                                type="button"
                                onClick={() => setShowAddressForm(false)}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-[#6B5E53] hover:text-[#1A1A1A] hover:bg-white transition-colors cursor-pointer"
                              >
                                Back to Saved Addresses
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Delivery Instructions */}
                      <div className="pt-4 border-t border-[#F0E6D8]">
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#6B5E53] mb-1.5">
                          Delivery Instructions for Driver (Optional)
                        </label>
                        <input
                          type="text"
                          value={c.deliveryInstructions}
                          onChange={(e) => c.setDeliveryInstructions(e.target.value)}
                          placeholder="e.g. Leave with doorman, gate code #1234, ring bell"
                          className="w-full h-11 rounded-xl border border-[#E4D9C8] bg-[#FDFBF8] px-3.5 text-sm text-[#1A1A1A] placeholder-[#A89F91] focus:outline-none focus:border-[#7A0B10]"
                        />
                      </div>

                      {/* Delivery Quote / Minimum Order Error Alert (Matching Big Screen Checkout) */}
                      {c.quoteError && (
                        <div className="p-3.5 bg-[#fef2f2] border border-[#fca5a5] rounded-xl text-[#ef4444] text-xs font-bold flex items-start gap-2.5 animate-in fade-in">
                          <AlertCircle size={15} className="shrink-0 mt-0.5 text-[#ef4444]" />
                          <span className="leading-relaxed">
                            {c.quoteError.toLowerCase().includes('minimum')
                              ? c.quoteError
                              : (typeof c.quoteError === 'string' && c.quoteError !== 'Delivery quote failed'
                                  ? c.quoteError
                                  : 'Delivery is unavailable for this location')}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* ─── PICKUP INSTRUCTIONS ─── */
                    <div className="mt-6 pt-5 border-t border-[#F0E6D8] space-y-4">
                      <div className="bg-[#FAF5EC] rounded-2xl p-4 sm:p-5 border border-[#E8DCCB] flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-[#7A0B10] text-white flex items-center justify-center shrink-0">
                          <Store size={20} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm sm:text-base text-[#1A1A1A]">
                              Lassi Lounge NY — Store Pickup
                            </h4>
                            <span className="text-[10px] font-bold text-[#16A34A] bg-[#DCFCE7] px-2 py-0.5 rounded-full">
                              Open Now
                            </span>
                          </div>
                          <p className="text-xs text-[#6B5E53] mt-1">
                            {c.restaurant?.address || '9408 118th St, South Richmond Hill, NY 11419'}
                          </p>
                          <p className="text-xs text-[#7A0B10] font-semibold mt-1">
                            Phone: {c.restaurant?.phone || '+1 347-233-3733'} • Ready in approx. 20-30 mins
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ═══ CARD 3: PAYMENT METHOD (Matches Lassi Lounge Desktop Direct Stripe Exactly) ═══ */}
                <div className="bg-white rounded-2xl border border-[#EAE0D3] shadow-[0_4px_20px_rgba(40,10,10,0.04)] p-5 sm:p-7">
                  <div className="flex items-center gap-3 pb-4 border-b border-[#F0E6D8]">
                    <div className="w-7 h-7 rounded-full bg-[#7A0B10] text-white text-xs font-black flex items-center justify-center shadow-xs">
                      3
                    </div>
                    <div className="flex-1 flex items-center justify-between">
                      <h2 className="font-['Playfair_Display'] text-lg sm:text-xl font-bold text-[#1A1A1A]">
                        Payment Method
                      </h2>
                      <div className="flex items-center gap-1.5 text-xs text-[#16A34A] font-bold bg-[#DCFCE7] px-2.5 py-1 rounded-full">
                        <Lock size={13} />
                        <span>100% Secure via Stripe</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3.5">
                    {/* Saved Cards (if logged-in user has any saved cards) */}
                    {c.user?.savedCards?.map((card) => {
                      const isSelected = c.paymentMethod === `saved_card_${card._id}`;
                      return (
                        <div
                          key={card._id}
                          onClick={() => c.setPaymentMethod(`saved_card_${card._id}`)}
                          className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                            isSelected
                              ? 'border-[#7A0B10] bg-[#FFF8F8] shadow-sm'
                              : 'border-[#EAE0D3] bg-white hover:border-[#D5C4AE]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                                  isSelected ? 'bg-[#7A0B10] text-white' : 'bg-[#F5EDE1] text-[#6B5E53]'
                                }`}
                              >
                                <CreditCard size={18} />
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-bold text-sm text-[#1A1A1A] truncate">
                                  {card.title || 'Saved Card'}
                                </h4>
                                <p className="text-xs text-[#6B5E53] mt-0.5 capitalize">
                                  {card.brand} •••• {card.last4} (Exp {card.expMonth.toString().padStart(2, '0')}/{card.expYear})
                                </p>
                              </div>
                            </div>
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                isSelected ? 'border-[#7A0B10] bg-[#7A0B10] text-white' : 'border-[#D4C7B8]'
                              }`}
                            >
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Direct Secure Stripe Option (Exact same as Desktop Lassi Lounge!) */}
                    <div
                      onClick={() => c.setPaymentMethod('stripe_online')}
                      className={`p-4 sm:p-5 rounded-xl border-2 transition-all cursor-pointer ${
                        c.paymentMethod === 'stripe_online' || !c.paymentMethod?.startsWith('saved_card_')
                          ? 'border-[#7A0B10] bg-[#FFF8F8] shadow-sm'
                          : 'border-[#EAE0D3] bg-white hover:border-[#D5C4AE]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              c.paymentMethod === 'stripe_online' || !c.paymentMethod?.startsWith('saved_card_')
                                ? 'bg-[#7A0B10] text-white'
                                : 'bg-[#F5EDE1] text-[#6B5E53]'
                            }`}
                          >
                            <CreditCard size={20} />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm sm:text-base text-[#1A1A1A]">
                              Pay with Card / Mobile Wallets
                            </h4>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Lock size={12} className="text-[#15803D]" />
                              <span className="text-xs text-[#15803D] font-bold">100% Secure via Stripe (Apple Pay, Google Pay, Cards)</span>
                            </div>
                          </div>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            c.paymentMethod === 'stripe_online' || !c.paymentMethod?.startsWith('saved_card_')
                              ? 'border-[#7A0B10] bg-[#7A0B10] text-white'
                              : 'border-[#D4C7B8]'
                          }`}
                        >
                          {(c.paymentMethod === 'stripe_online' || !c.paymentMethod?.startsWith('saved_card_')) && (
                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ═══ CARD 4: SPECIAL INSTRUCTIONS ═══ */}
                <div className="bg-white rounded-2xl border border-[#EAE0D3] shadow-[0_4px_20px_rgba(40,10,10,0.04)] p-5 sm:p-7">
                  <div className="flex items-center gap-3 pb-4 border-b border-[#F0E6D8]">
                    <div className="w-7 h-7 rounded-full bg-[#7A0B10] text-white text-xs font-black flex items-center justify-center shadow-xs">
                      4
                    </div>
                    <h2 className="font-['Playfair_Display'] text-lg sm:text-xl font-bold text-[#1A1A1A]">
                      Special Instructions
                    </h2>
                  </div>

                  <div className="mt-5 space-y-4">
                    {/* Kitchen Cooking Notes */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#6B5E53] mb-1.5">
                        Cooking &amp; Allergy Instructions
                      </label>
                      <textarea
                        rows={2}
                        value={kitchenNotes}
                        onChange={(e) => setKitchenNotes(e.target.value)}
                        placeholder="e.g. Medium spice, no onions in raita, nut allergy, extra lemon"
                        className="w-full rounded-xl border border-[#E4D9C8] bg-[#FDFBF8] p-3 text-sm text-[#1A1A1A] placeholder-[#A89F91] focus:outline-none focus:border-[#7A0B10]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ─────────────────────────────────────────────────────────────
                  RIGHT COLUMN (4 cols): Sticky Order Summary & Badges
                 ───────────────────────────────────────────────────────────── */}
              <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-24">
                {/* ═══ ORDER SUMMARY CARD ═══ */}
                <div className="bg-white rounded-2xl border border-[#EAE0D3] shadow-[0_4px_24px_rgba(40,10,10,0.06)] p-5 sm:p-6">
                  {/* Restaurant Header */}
                  <div className="pb-4 border-b border-[#F0E6D8] flex items-center justify-between">
                    <div>
                      <h3 className="font-['Playfair_Display'] text-lg font-bold text-[#1A1A1A]">
                        Lassi Lounge NY
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5 text-xs text-[#6B5E53]">
                        <Star size={13} fill="#F5B53D" className="text-[#F5B53D]" />
                        <span className="font-bold text-[#1A1A1A]">4.9</span>
                        <span>(1,500+ reviews)</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-[#FCEAE6] text-[#7A0B10] text-[11px] font-black uppercase tracking-wider">
                      {c.orderType === 'delivery' ? 'Delivery' : 'Pickup'}
                    </span>
                  </div>

                  {/* Cart Items List with +/- Steppers */}
                  <div className="py-4 space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {c.items?.map((item, idx) => {
                      const itemImg = item.image || getDishImage(item.name);
                      const unitPrice =
                        (item.selectedSize?.price || item.price || 0) +
                        (item.addOns || []).reduce((sum, a) => sum + (a.price || 0), 0);

                      return (
                        <div
                          key={`${item.menuItemId || item._id || item.name}-${idx}`}
                          className="bg-[#FAF5EC] rounded-xl p-3 border border-[#EDE0CE] flex gap-3 items-center"
                        >
                          {/* Dish Image */}
                          <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-[#2A0508] shrink-0">
                            <img
                              src={itemImg}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-xs sm:text-sm text-[#1A1A1A] truncate">
                              {item.name}
                            </h4>
                            {item.selectedSize && (
                              <p className="text-[11px] text-[#6B5E53]">
                                Size: {item.selectedSize.name}
                              </p>
                            )}
                            {item.addOns?.length > 0 && (
                              <p className="text-[10px] text-[#8C7E72] truncate">
                                + {item.addOns.map((a) => a.name).join(', ')}
                              </p>
                            )}
                            <p className="text-xs font-extrabold text-[#7A0B10] mt-0.5">
                              {formatCurrency(item.lineTotal || unitPrice * item.quantity, c.restaurant?.currency)}
                            </p>
                          </div>

                          {/* Stepper */}
                          <div className="flex items-center gap-1.5 bg-white border border-[#E2D4C2] rounded-lg px-1.5 py-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => c.updateQuantity(idx, item.quantity - 1)}
                              className="w-5 h-5 flex items-center justify-center text-[#7A0B10] hover:bg-[#FDF8EE] rounded cursor-pointer"
                              aria-label="Decrease quantity"
                            >
                              <Minus size={12} strokeWidth={2.4} />
                            </button>
                            <span className="text-xs font-bold w-4 text-center text-[#1A1A1A]">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => c.updateQuantity(idx, item.quantity + 1)}
                              className="w-5 h-5 flex items-center justify-center text-[#7A0B10] hover:bg-[#FDF8EE] rounded cursor-pointer"
                              aria-label="Increase quantity"
                            >
                              <Plus size={12} strokeWidth={2.4} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* ═══ LOYALTY POINTS REDEEM BANNER (Lassi Lounge Specific) ═══ */}
                  {loyaltyPoints > 0 && (
                    <div className="mb-4 p-3.5 rounded-xl bg-gradient-to-r from-[#FFF8EE] to-[#FFF1DE] border border-[#F2D7A5] flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-[#D4AF37] text-white flex items-center justify-center shrink-0 shadow-xs">
                          <Award size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#1A1A1A]">
                            Redeem Loyalty Points
                          </p>
                          <p className="text-[11px] text-[#856404] truncate">
                            You have {loyaltyPoints} pts (Save ${loyaltyValue})
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => c.setUseLoyaltyPoints(!c.useLoyaltyPoints)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          c.useLoyaltyPoints
                            ? 'bg-[#16A34A] text-white shadow-xs'
                            : 'bg-white text-[#7A0B10] border border-[#D4AF37] hover:bg-[#FFFDF4]'
                        }`}
                      >
                        {c.useLoyaltyPoints ? 'Applied ✓' : 'Redeem'}
                      </button>
                    </div>
                  )}

                  {/* ═══ COUPON CODE INPUT ═══ */}
                  <div className="py-3 border-t border-[#F0E6D8]">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={c.couponCode}
                          onChange={(e) => {
                            c.setCouponCode(e.target.value.toUpperCase());
                            setCheckoutCouponError('');
                          }}
                          placeholder="Enter Promo Code"
                          className="w-full h-10 rounded-xl border border-[#E4D9C8] bg-[#FDFBF8] pl-9 pr-3 text-xs uppercase tracking-wider font-bold text-[#1A1A1A] placeholder-[#A89F91] focus:outline-none focus:border-[#7A0B10]"
                        />
                        <Tag size={14} className="absolute left-3 top-3 text-[#7A0B10]" />
                      </div>
                      <button
                        type="button"
                        onClick={handleApplyCheckoutCoupon}
                        disabled={c.couponLoading || c.couponApplied}
                        className="px-4 h-10 rounded-xl bg-[#7A0B10] text-white text-xs font-bold hover:bg-[#5C0612] disabled:opacity-50 transition-colors cursor-pointer shrink-0 shadow-xs"
                      >
                        {c.couponLoading ? <Loader2 size={13} className="animate-spin" /> : 'Apply'}
                      </button>
                    </div>

                    {c.couponApplied && (
                      <div className="mt-2.5 p-2 rounded-lg bg-[#DCFCE7] border border-[#BBF7D0] flex items-center justify-between text-xs text-[#16A34A] font-bold">
                        <span>{c.couponCode} Applied (-{formatCurrency(c.couponDiscount, c.restaurant?.currency)})</span>
                        <button
                          type="button"
                          onClick={c.handleRemoveCoupon}
                          className="text-[#16A34A] hover:text-[#15803D]"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}

                    {checkoutCouponError && (
                      <p className="text-xs text-[#DC2626] mt-1.5 font-medium">
                        {checkoutCouponError}
                      </p>
                    )}
                  </div>

                  {/* ═══ BILL BREAKDOWN ═══ */}
                  <div className="py-4 border-t border-[#F0E6D8] space-y-2 text-xs">
                    <div className="flex justify-between text-[#6B5E53]">
                      <span>Item Total ({c.itemCount} items)</span>
                      <span className="font-bold text-[#1A1A1A]">
                        {formatCurrency(c.subtotal, c.restaurant?.currency)}
                      </span>
                    </div>

                    {c.orderType === 'delivery' && (
                      <div className="flex justify-between text-[#6B5E53]">
                        <span>Delivery Fee</span>
                        <span className="font-bold text-[#1A1A1A]">
                          {c.quoteLoading
                            ? 'Calculating...'
                            : c.deliveryFee === 0
                            ? 'FREE'
                            : formatCurrency(c.deliveryFee, c.restaurant?.currency)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between text-[#6B5E53]">
                      <span>Taxes &amp; Fees</span>
                      <span className="font-bold text-[#1A1A1A]">
                        {formatCurrency(c.tax, c.restaurant?.currency)}
                      </span>
                    </div>

                    {c.serviceFee > 0 && (
                      <div className="flex justify-between text-[#6B5E53]">
                        <span>Service Fee</span>
                        <span className="font-bold text-[#1A1A1A]">
                          {formatCurrency(c.serviceFee, c.restaurant?.currency)}
                        </span>
                      </div>
                    )}

                    {c.packagingFee > 0 && (
                      <div className="flex justify-between text-[#6B5E53]">
                        <span>Packaging Fee</span>
                        <span className="font-bold text-[#1A1A1A]">
                          {formatCurrency(c.packagingFee, c.restaurant?.currency)}
                        </span>
                      </div>
                    )}

                    {c.couponApplied && c.couponDiscount > 0 && (
                      <div className="flex justify-between text-[#16A34A] font-bold">
                        <span>Promo Discount</span>
                        <span>-{formatCurrency(c.couponDiscount, c.restaurant?.currency)}</span>
                      </div>
                    )}

                    {c.useLoyaltyPoints && c.loyaltyDiscount > 0 && (
                      <div className="flex justify-between text-[#856404] font-bold">
                        <span>Loyalty Points Discount</span>
                        <span>-{formatCurrency(c.loyaltyDiscount, c.restaurant?.currency)}</span>
                      </div>
                    )}

                    {c.tip > 0 && (
                      <div className="flex justify-between text-[#6B5E53]">
                        <span>Driver Tip</span>
                        <span className="font-bold text-[#1A1A1A]">
                          {formatCurrency(c.tip, c.restaurant?.currency)}
                        </span>
                      </div>
                    )}

                    {/* Total Row */}
                    <div className="pt-3 border-t border-[#EAE0D3] flex justify-between items-baseline">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[#6B5E53]">
                          Total Payable
                        </p>
                        <p className="text-[10px] text-[#8C7E72]">Includes all applicable taxes</p>
                      </div>
                      <span className="font-['Playfair_Display'] text-2xl font-black text-[#7A0B10]">
                        {formatCurrency(c.total, c.restaurant?.currency)}
                      </span>
                    </div>
                  </div>

                  {/* Desktop / In-page Review Order CTA Button (Triggers Step 3 Modal Popup) */}
                  <div ref={inPagePlaceOrderRef} className="pt-4 border-t border-[#F0E6D8]">
                    <button
                      type="button"
                      onClick={handleReviewOrderClick}
                      disabled={c.isPlacingOrder || (c.orderType === 'delivery' && Boolean(c.quoteError))}
                      className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm shadow-[0_8px_24px_rgba(122,11,16,0.35)] flex items-center justify-center gap-2.5 transition-all hover:-translate-y-0.5 cursor-pointer ${
                        c.isPlacingOrder || (c.orderType === 'delivery' && Boolean(c.quoteError))
                          ? 'bg-[#9CA3AF] text-white cursor-not-allowed opacity-75'
                          : 'bg-gradient-to-r from-[#7A0B10] via-[#5C0612] to-[#4A090B] hover:from-[#5C0612] hover:to-[#7A0B10] text-white'
                      }`}
                    >
                      {c.isPlacingOrder ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Processing Order...</span>
                        </>
                      ) : (
                        <>
                          <span>Review Order</span>
                          <ArrowRight size={16} strokeWidth={2.4} />
                        </>
                      )}
                    </button>

                    <p className="text-[11px] text-[#8C7E72] text-center mt-3 leading-tight">
                      By placing this order, you agree to Lassi Lounge's{' '}
                      <Link href="/terms" className="underline font-semibold text-[#1A1A1A]">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link href="/privacy-policy" className="underline font-semibold text-[#1A1A1A]">
                        Privacy Policy
                      </Link>
                      .
                    </p>
                  </div>
                </div>

                {/* ═══ TRUST BADGES CARD ═══ */}
                <div className="bg-[#FAF5EC] rounded-2xl border border-[#E8DCCB] p-5 space-y-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#FCEAE6] text-[#7A0B10] flex items-center justify-center shrink-0">
                      <ShieldCheck size={22} strokeWidth={2} />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-[#1A1A1A]">
                        Safe &amp; Secure Payment
                      </h4>
                      <p className="text-xs text-[#6B5E53]">100% Encrypted Checkout</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#FCEAE6] text-[#7A0B10] flex items-center justify-center shrink-0">
                      <Bike size={22} strokeWidth={2} />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-[#1A1A1A]">
                        Fast &amp; Reliable Delivery
                      </h4>
                      <p className="text-xs text-[#6B5E53]">Hot and fresh to your doorstep</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#FCEAE6] text-[#7A0B10] flex items-center justify-center shrink-0">
                      <Star size={20} strokeWidth={2.2} fill="currentColor" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-[#1A1A1A]">
                        Royal Authentic Taste
                      </h4>
                      <p className="text-xs text-[#6B5E53]">Finest traditional North Indian recipes</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ═══════════════════════════════════════════════════════════════════
          4. STICKY MOBILE REVIEW ORDER BOTTOM BAR (Fixed on < lg)
          Auto-hides when scrolled down to the in-page Place Order section
          Equipped with safe-area protection for Android 3 navigation buttons
         ═══════════════════════════════════════════════════════════════════ */}
      {c.itemCount > 0 && (
        <aside
          aria-label="Mobile sticky review order bar"
          className={`lg:hidden fixed bottom-0 inset-x-0 z-[90] bg-[#FFFDF9]/95 backdrop-blur-md border-t border-[#E5D4C0] shadow-[0_-8px_30px_rgba(74,11,13,0.14)] transition-all duration-300 ease-in-out ${
            isStickyBarVisible
              ? 'translate-y-0 opacity-100 pointer-events-auto'
              : 'translate-y-full opacity-0 pointer-events-none'
          }`}
          style={{
            paddingBottom: 'max(14px, calc(env(safe-area-inset-bottom, 0px) + 10px))',
          }}
        >
          <div className="max-w-lg mx-auto px-4 pt-3 pb-1 flex items-center justify-between gap-3">
            {/* Left: Total & Items Breakdown */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#7A6455]">
                  Total Payable
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-[#F3EAE0] text-[9px] font-bold text-[#7A0B10]">
                  {c.itemCount} {c.itemCount === 1 ? 'item' : 'items'}
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl sm:text-2xl font-black text-[#7A0B10] leading-tight font-['Playfair_Display']">
                  {formatCurrency(c.total, c.restaurant?.currency)}
                </span>
                <span className="text-[10px] text-[#8C7E72] font-medium hidden xs:inline">
                  (incl. taxes)
                </span>
              </div>
            </div>

            {/* Right: Review Order CTA Button (Opens Step 3 Popup for Tips & Order Confirmation) */}
            <button
              type="button"
              onClick={handleReviewOrderClick}
              disabled={c.isPlacingOrder || (c.orderType === 'delivery' && Boolean(c.quoteError))}
              className={`shrink-0 px-5 py-3 sm:px-6 sm:py-3.5 rounded-xl font-bold text-xs sm:text-sm shadow-[0_6px_20px_rgba(122,11,16,0.35)] flex items-center gap-2 active:scale-95 transition-all cursor-pointer ${
                c.isPlacingOrder || (c.orderType === 'delivery' && Boolean(c.quoteError))
                  ? 'bg-[#9CA3AF] text-white cursor-not-allowed opacity-75'
                  : 'bg-gradient-to-r from-[#7A0B10] via-[#5C0612] to-[#4A090B] text-white hover:brightness-110'
              }`}
            >
              {c.isPlacingOrder ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Review Order</span>
                  <ArrowRight size={15} strokeWidth={2.4} />
                </>
              )}
            </button>
          </div>
        </aside>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          5. MODALS & POPUPS
         ═══════════════════════════════════════════════════════════════════ */}
      {/* Map Address Picker Modal */}
      {isAddressModalOpen && (
        <LassiAddressModal
          isOpen={isAddressModalOpen}
          initialView="map"
          onClose={() => setIsAddressModalOpen(false)}
          onSelect={(locationData) => {
            const { address, lat, lng, addressDetails } = locationData || {};
            if (address) {
              c.setAddressLine1(address);
              if (addressDetails?.city) c.setCity(addressDetails.city);
              if (addressDetails?.state) c.setState(addressDetails.state.substring(0, 2).toUpperCase());
              if (addressDetails?.postcode) c.setZipCode(addressDetails.postcode.substring(0, 5));
              c.handleSelectSuggestion({
                display_name: address,
                lat: String(lat || 40.6908),
                lon: String(lng || -73.8271),
                address: addressDetails || {},
              });
              clearFieldError('addressLine1');
            }
            setIsAddressModalOpen(false);
          }}
        />
      )}

      {/* Step 3 Review & Driver Tipping Modal Popup (Matches Big Screen Flow) */}
      <ReviewOrderSection
        step={c.step}
        t={t}
        user={c.user}
        restaurant={c.restaurant}
        tip={c.tip}
        setTip={c.setTip}
        onBack={() => c.setStep(2)}
        onPlaceOrder={c.handlePlaceOrder}
        total={c.total}
        compiledAddress={c.compiledAddress}
        fullName={c.fullName}
        phone={c.phone}
        paymentMethod={c.paymentMethod}
        items={c.items}
        subtotal={c.subtotal}
        deliveryFee={c.deliveryFee}
        tax={c.tax}
        platformFee={c.platformFee}
        serviceFee={c.serviceFee}
        packagingFee={c.packagingFee}
        couponDiscount={c.couponDiscount}
        loyaltyDiscount={c.loyaltyDiscount}
        orderType={c.orderType}
        courierNotes={c.deliveryInstructions}
        specialInstructions={specialInstructions}
        isPlacingOrder={c.isPlacingOrder}
      />

      {/* Payment Simulator Modal */}
      <PaymentSimulatorModal
        isOpen={c.showPaymentModal}
        onClose={() => c.setShowPaymentModal(false)}
        amount={c.total}
        checkoutData={c.checkoutPayload}
        onSuccess={c.executeOrderCreation}
      />

      <style jsx global>{`
        .lassi-phone-wrap .PhoneInputInput {
          border: none;
          outline: none;
          background: transparent;
          font-size: 13px;
          color: #1A1A1A;
          height: 100%;
          width: 100%;
        }
        .lassi-phone-wrap .PhoneInputCountry {
          margin-right: 6px;
        }

        .lassi-phone-wrap .PhoneInputCountrySelect {
          color-scheme: light;
          background-color: #ffffff;
          color: #1a1a1a;
        }
      `}</style>
    </div>
  );
}
