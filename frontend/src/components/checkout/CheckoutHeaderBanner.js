import { ChevronLeft } from 'lucide-react';

export default function CheckoutHeaderBanner({ isSingleRestaurantMode, onBack }) {
  if (isSingleRestaurantMode) {
    return (
      <div
        className="relative py-16 md:py-20 bg-cover bg-center border-b border-[#e5e7eb] flex items-center"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(10, 10, 10, 0.90), rgba(10, 10, 10, 0.50)), url('https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=1600&q=80')",
        }}
      >
        <div className="mx-auto max-w-[1550px] w-full px-4 md:px-6 lg:px-8">
          <h1 className="text-5xl md:text-6xl font-bold font-serif text-[#ffffff] mb-3 leading-tight tracking-wide">
            Checkout
          </h1>
          <p className="text-[14px] font-medium flex items-center gap-2">
            <span className="text-[#e5e7eb]">Home</span>
            <span className="text-[#e5e7eb] text-[12px]">&gt;</span>
            <span className="text-[#e5e7eb]">Cart</span>
            <span className="text-[#e5e7eb] text-[12px]">&gt;</span>
            <span className="text-[#e8a020]">Checkout</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1550px] w-full px-4 md:px-6 lg:px-8 pt-8 pb-4 bg-[#f9fafb]">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-[#6b7280] hover:text-[#1a1a1a] transition-colors">
        <ChevronLeft className="h-4 w-4" /> Continue Shopping
      </button>
      <h1 className="text-3xl font-black text-[#1a1a1a] mt-4">Checkout</h1>
    </div>
  );
}