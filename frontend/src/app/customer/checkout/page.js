'use client';

import { ShoppingBag } from 'lucide-react';
import { Button, EmptyState } from '@/components/ui';

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

export default function CheckoutPage() {
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
          <p className="text-sm text-[#6b7280] max-w-sm mb-4">Browse and add items to your cart before checking out</p>
          <Button
            onClick={() => c.router.push(c.isSingleRestaurantMode ? '/customer/restaurant/lassi-lounge' : '/customer')}
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

      <div className="mx-auto max-w-[1550px] w-full px-4 md:px-6 lg:px-8 py-8 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">
          
          <div className="lg:col-span-8 space-y-6 ll-stagger">
            <DeliveryInfoSection
              step={c.step} setStep={c.setStep} t={t}
              fullName={c.fullName} setFullName={c.setFullName}
              phone={c.phone} setPhone={c.setPhone}
              email={c.email} setEmail={c.setEmail}
              addressLine1={c.addressLine1} setAddressLine1={c.setAddressLine1}
              addressLine2={c.addressLine2} setAddressLine2={c.setAddressLine2}
              city={c.city} setCity={c.setCity}
              state={c.state} setState={c.setState}
              zipCode={c.zipCode} setZipCode={c.setZipCode}
              deliveryInstructions={c.deliveryInstructions} setDeliveryInstructions={c.setDeliveryInstructions}
              orderType={c.orderType} setOrderType={c.setOrderType}
              user={c.user}
              onSelectSavedAddress={c.handleSelectSavedAddress}
              onUseCurrentLocation={c.handleUseCurrentLocation}
              restaurant={c.restaurant}
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
              step={c.step} setStep={c.setStep} t={t}
              paymentMethod={c.paymentMethod} setPaymentMethod={c.setPaymentMethod}
              cardNo={c.cardNo} setCardNo={c.setCardNo}
              cardExpiry={c.cardExpiry} setCardExpiry={c.setCardExpiry}
              cardCvv={c.cardCvv} setCardCvv={c.setCardCvv}
              cardName={c.cardName} setCardName={c.setCardName}
              onBack={() => c.router.push(c.isSingleRestaurantMode ? '/customer/restaurant/lassi-lounge' : '/customer')}
              onContinue={c.handleContinueToReview}
              orderType={c.orderType}
              quoteError={c.quoteError}
              user={c.user}
            />

          </div>

          <div className="lg:col-span-4 space-y-6 ll-reveal">
            <div className="sticky top-24 space-y-5">
              <OrderSummaryCard
                t={t}
                items={c.items} itemCount={c.itemCount} subtotal={c.subtotal} updateQuantity={c.updateQuantity}
                orderType={c.orderType} deliveryFee={c.deliveryFee} quoteLoading={c.quoteLoading}
                tax={c.tax} platformFee={c.platformFee} serviceFee={c.serviceFee}
                couponCode={c.couponCode} setCouponCode={c.setCouponCode}
                onApplyCoupon={c.handleApplyCoupon} couponLoading={c.couponLoading}
                couponApplied={c.couponApplied} couponDiscount={c.couponDiscount} onRemoveCoupon={c.handleRemoveCoupon}
                user={c.user} useLoyaltyPoints={c.useLoyaltyPoints} setUseLoyaltyPoints={c.setUseLoyaltyPoints}
                total={c.total}
                quoteError={c.quoteError}
              />

              {c.isSingleRestaurantMode && <LoyaltySignupBanner />}

              <SupportCard isSingleRestaurantMode={c.isSingleRestaurantMode} t={t} />
            </div>
          </div>
          
        </div>
      </div>

      <ReviewOrderSection 
        step={c.step} 
        t={t} 
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
        couponDiscount={c.couponDiscount}
        loyaltyDiscount={c.loyaltyDiscount}
        orderType={c.orderType}
        courierNotes={c.deliveryInstructions}
        specialInstructions={c.specialInstructions}
      />

      <PaymentSimulatorModal
        isOpen={c.showPaymentModal}
        onClose={() => c.setShowPaymentModal(false)}
        amount={c.total}
        checkoutData={c.checkoutPayload}
        onSuccess={c.executeOrderCreation}
      />
    </div>
  );
}
