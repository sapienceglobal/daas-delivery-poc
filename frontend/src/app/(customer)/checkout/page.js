'use client';

import { useState, useEffect } from 'react';
import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui';

import { useCheckoutState } from '@/components/checkout/useCheckoutState';
import { useCheckoutTheme } from '@/components/checkout/useCheckoutTheme';
import CheckoutHeaderBanner from '@/components/checkout/CheckoutHeaderBanner';
import CheckoutStepper from '@/components/checkout/CheckoutStepper';
import DeliveryInfoSection from '@/components/checkout/DeliveryInfoSection';
import PaymentMethodSection from '@/components/checkout/PaymentMethodSection';
import ReviewOrderSection from '@/components/checkout/ReviewOrderSection';
import OrderSummaryCard from '@/components/checkout/OrderSummaryCard';
import LoyaltySignupBanner from '@/components/checkout/LoyaltySignupBanner';
import SupportCard from '@/components/checkout/SupportCard';
import PaymentSimulatorModal from '@/components/checkout/PaymentSimulatorModal';
import LassiCheckoutPage from '@/components/branded/lassi-lounge/checkout/LassiCheckoutPage';

/**
 * Desktop checkout layout for screens >= 1024px
 */
function DesktopLassiCheckout() {
  const c = useCheckoutState();
  const t = useCheckoutTheme(c.isSingleRestaurantMode);

  if (c.itemCount === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#f9fafb]">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 rounded-2xl bg-white p-4 border border-[#eadfdb] shadow-sm">
            <ShoppingBag className="h-8 w-8 text-[#7a0b10]" />
          </div>
          <h3 className="text-lg font-bold text-[#1a1a1a] mb-1">Your cart is empty</h3>
          <p className="text-sm text-[#6b7280] max-w-sm mb-4">
            Browse and add items to your cart before checking out
          </p>
          <Button
            onClick={() => c.router.push(c.isSingleRestaurantMode ? '/menu' : '/')}
            className="bg-[#7a0b10] hover:bg-[#5e070c] text-[#ffffff] transition-colors animate-in px-6 py-2 rounded-lg font-medium"
          >
            Browse Menu
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#f9fafb] text-[#1a1a1a] ll-page-enter">
      <CheckoutHeaderBanner isSingleRestaurantMode={c.isSingleRestaurantMode} onBack={() => c.router.back()} />

      <CheckoutStepper step={c.step} />

      <div className="mx-auto max-w-[1550px] w-full px-4 md:px-6 lg:px-8 py-4 lg:py-8 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-start relative">

          {/* Delivery & Payment Form Column */}
          <div className="lg:col-span-8 space-y-6 ll-stagger order-2 lg:order-1">
            <DeliveryInfoSection
              step={c.step}
              setStep={c.setStep}
              t={t}
              fullName={c.fullName}
              setFullName={c.setFullName}
              phone={c.phone}
              setPhone={c.setPhone}
              email={c.email}
              setEmail={c.setEmail}
              addressLine1={c.addressLine1}
              setAddressLine1={c.setAddressLine1}
              addressLine2={c.addressLine2}
              setAddressLine2={c.setAddressLine2}
              city={c.city}
              setCity={c.setCity}
              state={c.state}
              setState={c.setState}
              zipCode={c.zipCode}
              setZipCode={c.setZipCode}
              deliveryInstructions={c.deliveryInstructions}
              setDeliveryInstructions={c.setDeliveryInstructions}
              orderType={c.orderType}
              setOrderType={c.setOrderType}
              user={c.user}
              onSelectSavedAddress={c.handleSelectSavedAddress}
              onUseCurrentLocation={c.handleUseCurrentLocation}
              restaurant={c.restaurant}
              subtotal={c.subtotal}
              compiledAddress={c.compiledAddress}
              onContinue={c.handleContinueToPayment}
              onAddressLine1Change={c.handleAddressLine1Change}
              suggestions={c.suggestions}
              suggestionsLoading={c.suggestionsLoading}
              onSelectSuggestion={c.handleSelectSuggestion}
              quoteError={c.quoteError}
              quoteLoading={c.quoteLoading}
              isLocationLoading={c.isLocationLoading}
            />

            <PaymentMethodSection
              step={c.step}
              setStep={c.setStep}
              t={t}
              paymentMethod={c.paymentMethod}
              setPaymentMethod={c.setPaymentMethod}
              onBack={() => c.router.push(c.isSingleRestaurantMode ? '/menu' : '/')}
              onContinue={c.handleContinueToReview}
              orderType={c.orderType}
              quoteError={c.quoteError}
              user={c.user}
              appliedCouponData={c.appliedCouponData}
              isPaymentMethodLockedByCoupon={c.isPaymentMethodLockedByCoupon}
              isPhoneValid={c.isPhoneValid}
              isFullNameValid={c.isFullNameValid}
              isEmailValid={c.isEmailValid}
            />
          </div>

          {/* Order Summary Sidebar Column */}
          <div className="lg:col-span-4 space-y-6 ll-reveal order-1 lg:order-2">
            <div className="sticky top-24 space-y-5">
              <OrderSummaryCard
                t={t}
                restaurant={c.restaurant}
                items={c.items}
                itemCount={c.itemCount}
                subtotal={c.subtotal}
                updateQuantity={c.updateQuantity}
                orderType={c.orderType}
                deliveryFee={c.deliveryFee}
                quoteLoading={c.quoteLoading}
                tax={c.tax}
                platformFee={c.platformFee}
                serviceFee={c.serviceFee}
                packagingFee={c.packagingFee}
                couponCode={c.couponCode}
                setCouponCode={c.setCouponCode}
                onApplyCoupon={c.handleApplyCoupon}
                couponLoading={c.couponLoading}
                couponApplied={c.couponApplied}
                couponDiscount={c.couponDiscount}
                onRemoveCoupon={c.handleRemoveCoupon}
                user={c.user}
                useLoyaltyPoints={c.useLoyaltyPoints}
                setUseLoyaltyPoints={c.setUseLoyaltyPoints}
                total={c.total}
                quoteError={c.quoteError}
                minOrderAmount={c.restaurant?.minimumOrder || 0}
              />
              <div className="hidden lg:block space-y-5">
                {c.isSingleRestaurantMode && (
                  <LoyaltySignupBanner user={c.user} restaurant={c.restaurant} total={c.total} />
                )}
                <SupportCard isSingleRestaurantMode={c.isSingleRestaurantMode} restaurant={c.restaurant} t={t} />
              </div>
            </div>
          </div>

        </div>

        {/* Mobile only: Loyalty and Support at the bottom of the grid */}
        <div className="lg:hidden mt-6 space-y-5">
          {c.isSingleRestaurantMode && (
            <LoyaltySignupBanner user={c.user} restaurant={c.restaurant} total={c.total} />
          )}
          <SupportCard isSingleRestaurantMode={c.isSingleRestaurantMode} restaurant={c.restaurant} t={t} />
        </div>
      </div>

      {/* Step 3: Review Order Modal Popup with Driver Tip Selection & Place Order */}
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
        specialInstructions={c.specialInstructions}
        isPlacingOrder={c.isPlacingOrder}
      />

      <PaymentSimulatorModal
        isOpen={c.showPaymentModal}
        onClose={() => c.setShowPaymentModal(false)}
        amount={c.total}
        checkoutData={c.checkoutPayload}
        onSuccess={c.executeOrderCreation}
      />

      {/* Blend the react-phone-number-input default styling into the inputs */}
      <style jsx global>{`
        .phone-field-wrap .PhoneInputInput {
          border: none;
          outline: none;
          background: transparent;
          font-size: 14px;
          color: #1a1a1a;
          height: 100%;
        }
        .phone-field-wrap .PhoneInputCountry {
          margin-right: 8px;
        }
        
        .PhoneInputCountrySelect {
          color-scheme: light;
          background-color: #ffffff;
          color: #1a1a1a;
        }
        
        .PhoneInputCountrySelect option {
          background-color: #ffffff;
          color: #1a1a1a;
          font-size: 14px;
          padding: 8px;
        }

        .PhoneInputCountrySelect::-webkit-scrollbar {
          width: 6px;
        }
        .PhoneInputCountrySelect::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        .PhoneInputCountrySelect::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 4px;
        }
        .PhoneInputCountrySelect::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  );
}

/**
 * Adaptive Checkout Page:
 * - Mobile / Tablet (< 1024px): Renders LassiCheckoutPage (luxury mobile design, branded hero, sticky bottom bar)
 * - Desktop (>= 1024px): Renders DesktopLassiCheckout (full desktop multi-column layout)
 */
export default function CheckoutPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check, { passive: true });
    return () => window.removeEventListener('resize', check);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-[#FAF3E8]" />;
  }

  if (isMobile) {
    return <LassiCheckoutPage />;
  }

  return <DesktopLassiCheckout />;
}
