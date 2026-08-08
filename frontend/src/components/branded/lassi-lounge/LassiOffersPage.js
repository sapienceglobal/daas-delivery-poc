'use client';

import React, { useEffect, useState } from 'react';
import { Tag, Copy, CheckCircle, Ticket } from 'lucide-react';
import { couponAPI } from '@/lib/api';
import { showToast } from '@/components/ui';

export default function LassiOffersPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const res = await couponAPI.getActive();
      setCoupons(res.data);
    } catch (err) {
      console.error('Failed to fetch coupons', err);
      showToast('Failed to load offers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast('Coupon code copied to clipboard!', 'success');
    setTimeout(() => setCopiedCode(null), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-text-muted font-medium">Loading offers...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 md:py-20 min-h-[70vh]">
      <div className="text-center mb-12">
        <span className="text-accent-500 font-bold tracking-widest uppercase text-sm mb-2 block">Exclusive Deals</span>
        <h1 className="text-4xl md:text-5xl font-bold text-primary-900 font-serif mb-4">Offers & Promotions</h1>
        <p className="text-text-muted max-w-2xl mx-auto text-lg">Apply these codes at checkout to enjoy amazing discounts on your favorite Indian dishes.</p>
      </div>

      {coupons.length === 0 ? (
        <div className="bg-surface rounded-2xl p-12 text-center border border-border shadow-sm max-w-2xl mx-auto">
          <Ticket className="w-16 h-16 text-primary-200 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-text mb-2">No active offers right now</h3>
          <p className="text-text-muted">Check back later for exclusive deals and discounts!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coupons.map((coupon) => (
            <div key={coupon._id} className="group relative bg-surface rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-md transition-all duration-300 flex flex-col">
              {/* Top Banner Area */}
              <div className="h-32 bg-primary-900 relative p-6 flex flex-col justify-center items-center text-center overflow-hidden">
                {/* Decorative Pattern Background */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent mix-blend-overlay"></div>
                
                <h3 className="text-3xl font-black text-accent-400 relative z-10 font-serif">
                  {coupon.type === 'percentage' ? `${coupon.value}% OFF` : `$${coupon.value} OFF`}
                </h3>
                <p className="text-white text-sm relative z-10 mt-1 font-medium">
                  {coupon.firstOrderOnly ? 'On your first order' : (coupon.description || 'Limited time offer')}
                </p>
                
                {/* Sawtooth border effect */}
                <div className="absolute -bottom-2 left-0 right-0 h-4 bg-surface" style={{ clipPath: 'polygon(0% 100%, 5% 0%, 10% 100%, 15% 0%, 20% 100%, 25% 0%, 30% 100%, 35% 0%, 40% 100%, 45% 0%, 50% 100%, 55% 0%, 60% 100%, 65% 0%, 70% 100%, 75% 0%, 80% 100%, 85% 0%, 90% 100%, 95% 0%, 100% 100%)' }}></div>
              </div>

              {/* Bottom Content Area */}
              <div className="p-6 pt-8 flex-1 flex flex-col items-center text-center">
                <p className="text-xs text-text-muted mb-6 uppercase tracking-wider font-bold">
                  {coupon.minOrderValue > 0 ? `Min. order $${coupon.minOrderValue}` : 'No minimum order'} • T&C Apply
                </p>

                <div className="mt-auto w-full flex items-center justify-between border-2 border-dashed border-primary-200 bg-primary-50 rounded-xl p-3 px-4">
                  <span className="font-bold text-primary-900 tracking-widest text-lg">{coupon.code}</span>
                  <button
                    onClick={() => copyToClipboard(coupon.code)}
                    className="flex items-center gap-1.5 text-sm font-bold text-primary-700 hover:text-primary-900 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-primary-100 transition-colors"
                  >
                    {copiedCode === coupon.code ? (
                      <><CheckCircle className="w-4 h-4 text-green-600" /> Copied</>
                    ) : (
                      <><Copy className="w-4 h-4" /> Copy</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
