'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, ChevronRight, FileText, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#10B981]/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#8b0000]/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-[500px] animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="bg-[#1a1a1a]/80 backdrop-blur-xl border border-white/10 p-10 rounded-[32px] shadow-2xl text-center flex flex-col items-center">
          
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-[#10B981] blur-xl opacity-30 rounded-full animate-pulse"></div>
            <div className="relative w-24 h-24 bg-gradient-to-tr from-[#10B981] to-[#34d399] rounded-full flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-12 h-12 text-white drop-shadow-md" strokeWidth={2.5} />
            </div>
          </div>

          <h1 className="text-3xl font-black text-white mb-3 tracking-tight">Payment Successful</h1>
          <p className="text-[#a1a1aa] mb-8 leading-relaxed">
            Your transaction has been processed securely. The merchant has received your order and is preparing it now.
          </p>

          {orderId && (
            <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between mb-8 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white/80" />
                </div>
                <div className="text-left">
                  <p className="text-xs text-[#a1a1aa] uppercase tracking-wider font-semibold">Order Reference</p>
                  <p className="text-white font-mono font-bold tracking-wider">#{orderId.slice(-6).toUpperCase()}</p>
                </div>
              </div>
              <div className="w-10 h-10 bg-[#10B981]/10 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
              </div>
            </div>
          )}

          <div className="w-full flex flex-col gap-3">
            <Link 
              href="/" 
              className="group w-full py-4 bg-white text-black rounded-2xl font-bold hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-5 h-5" />
              Continue Shopping
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        <p className="text-center text-[#71717a] mt-8 text-sm">
          A receipt has been sent to your email address.<br/>
          You can safely close this window.
        </p>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><div className="w-8 h-8 border-4 border-[#10B981] border-t-transparent rounded-full animate-spin"></div></div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
