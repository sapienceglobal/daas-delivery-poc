'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, RefreshCw, Star, ArrowRight, ShieldAlert, Award } from 'lucide-react';

import { orderAPI } from '@/lib/api';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';
import { Button, Skeleton, StarRating, showToast } from '@/components/ui';

// Modular components
import OrderHeaderBanner from '@/components/orders/OrderHeaderBanner';
import OrderDetailsCard from '@/components/orders/OrderDetailsCard';
import OrderStatusCard from '@/components/orders/OrderStatusCard';
import DeliveryInfoCard from '@/components/orders/DeliveryInfoCard';
import HelpCard from '@/components/orders/HelpCard';
import PromoBanner from '@/components/orders/PromoBanner';
import RecommendationsCarousel from '@/components/orders/RecommendationsCarousel';
import ValuePropsBar from '@/components/orders/ValuePropsBar';

export default function OrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { joinOrderRoom, on, off } = useSocket();
  const { isAdmin, isMerchant, user } = useAuth();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [review, setReview] = useState('');
  const [rating, setRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  // Partial Refund State
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');

  const isSingleRestaurantMode = process.env.NEXT_PUBLIC_SINGLE_RESTAURANT_MODE === 'true';

  useEffect(() => {
    loadOrder();
    joinOrderRoom(id);

    const handleStatusChange = (data) => {
      if (data?.order) setOrder(data.order);
      loadOrder();
      if (data?.status) {
        showToast(`Order status updated: ${data.status.replace('_', ' ')}`, 'info');
      }
    };

    on('order_status_changed', handleStatusChange);
    on('order_updated', handleStatusChange);
    
    return () => {
      off('order_status_changed', handleStatusChange);
      off('order_updated', handleStatusChange);
    };
  }, [id]);

  const loadOrder = async () => {
    try {
      const data = await orderAPI.getById(id);
      setOrder(data.data);
      if (data.data.rating) {
        setRating(data.data.rating);
        setRatingSubmitted(true);
      }
    } catch (err) {
      showToast('Failed to load order detail', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    try {
      await orderAPI.cancel(id);
      showToast('Order cancelled successfully', 'info');
      loadOrder();
    } catch (err) {
      showToast(err.message || 'Cannot cancel order', 'error');
    }
  };

  const handleSimulate = async () => {
    try {
      const data = await orderAPI.simulate(id);
      setOrder(data.data);
      showToast(`Status advanced to: ${data.data.status.replace('_', ' ')}`, 'success');
    } catch (err) {
      showToast(err.message || 'Simulation failed', 'error');
    }
  };

  const handlePartialRefund = async () => {
    if (!refundAmount || isNaN(refundAmount) || Number(refundAmount) <= 0) {
      return showToast('Enter a valid amount', 'error');
    }
    const maxRefund = order.total - (order.refundAmount || 0);
    if (Number(refundAmount) > maxRefund) {
      return showToast('Refund amount exceeds remaining order total', 'error');
    }
    try {
      await orderAPI.refund(id, {
        amount: Number(refundAmount),
        reason: refundReason || 'Requested by merchant',
      });
      showToast(`Successfully refunded $${refundAmount}`, 'success');
      setShowRefundModal(false);
      setRefundAmount('');
      setRefundReason('');
      loadOrder();
    } catch (err) {
      showToast(err.message || 'Failed to process refund', 'error');
    }
  };

  const handleSubmitRating = async () => {
    if (!rating) return;
    try {
      await orderAPI.rate(id, { rating, review });
      setRatingSubmitted(true);
      showToast('Thank you for rating your order!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to submit rating', 'error');
    }
  };

  if (loading) return <OrderSkeleton />;
  if (!order) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-[#f9fafb] text-[#1a1a1a]">
        <h2 className="text-[20px] font-bold font-serif mb-2">Order Not Found</h2>
        <p className="text-[#6b7280] mb-4 text-[14px]">We couldn't retrieve details for this order ID.</p>
        <Button onClick={() => router.push('/customer/orders')} className="bg-[#7a0b10] hover:bg-[#5e080c] text-[#ffffff]">
          Back to Orders
        </Button>
      </div>
    );
  }

  // Get item IDs currently ordered to filter recommendations
  const orderedItemIds = order.items?.map((item) => item.menuItemId) || [];

  return (
    <div className="min-h-screen bg-[#f9fafb] text-[#1a1a1a] pb-16">
      
      {/* Dynamic Header confirmation banner */}
      <OrderHeaderBanner order={order} isSingleRestaurantMode={isSingleRestaurantMode} />

      {/* Back button container */}
      <div className="mx-auto max-w-[1550px] w-full px-4 md:px-6 lg:px-8 py-4">
        <button
          onClick={() => router.push('/customer/orders')}
          className="flex items-center gap-2 text-[13px] font-bold text-[#6b7280] hover:text-[#7a0b10] uppercase tracking-wider transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> Back to My Orders
        </button>
      </div>

      {/* Two Column Grid */}
      <div className="mx-auto max-w-[1550px] w-full px-4 md:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column (Details and Delivery) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Order Items */}
            <OrderDetailsCard order={order} />

            {/* Delivery/Map details */}
            <DeliveryInfoCard order={order} />

            {/* Rating card (shown when delivered) */}
            {order.status === 'delivered' && (
              <div className="rounded-2xl border border-[#e5e7eb] bg-[#ffffff] p-6 shadow-sm space-y-4">
                <h3 className="text-[18px] font-bold font-serif text-[#1a1a1a]">
                  {ratingSubmitted ? 'Your Feedback' : 'Rate Your Order'}
                </h3>
                
                <div className="flex items-center gap-4">
                  <StarRating rating={rating} interactive={!ratingSubmitted} onChange={setRating} size="lg" />
                  <span className="text-[14px] font-bold text-[#4b5563]">
                    {rating > 0 ? `${rating}/5 Stars` : 'Tap stars to rate'}
                  </span>
                </div>

                {!ratingSubmitted && (
                  <div className="space-y-3 pt-2">
                    <textarea
                      value={review}
                      onChange={(e) => setReview(e.target.value)}
                      placeholder="Share your dining experience with us..."
                      className="w-full rounded-xl border border-[#e5e7eb] bg-[#ffffff] p-3.5 text-[14px] text-[#1a1a1a] placeholder-[#9ca3af] focus:outline-none focus:border-[#7a0b10] focus:ring-1 focus:ring-[#7a0b10] transition-colors resize-none h-24"
                    />
                    <button
                      onClick={handleSubmitRating}
                      disabled={!rating}
                      className="bg-[#7a0b10] text-[#ffffff] hover:bg-[#5e080c] disabled:opacity-50 disabled:cursor-not-allowed font-bold text-[12px] uppercase tracking-wider px-6 py-2.5 rounded-lg transition-colors"
                    >
                      Submit Rating
                    </button>
                  </div>
                )}

                {ratingSubmitted && order.restaurantReply && (
                  <div className="p-4 bg-[#fffcfb] border border-[#f5ebe9] rounded-xl mt-2 animate-in fade-in duration-300">
                    <span className="text-[12px] font-bold text-[#7a0b10] block mb-1">Restaurant Response:</span>
                    <p className="text-[14px] text-[#4b5563] italic">"{order.restaurantReply}"</p>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Right Column (Status and Help/Promos) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Timeline order tracking status */}
            <OrderStatusCard order={order} />

            {/* Need Help? Box */}
            <HelpCard isSingleRestaurantMode={isSingleRestaurantMode} />

            {/* Lassi Lounge reward promo block */}
            <PromoBanner isSingleRestaurantMode={isSingleRestaurantMode} />

            {/* Dev Simulator Controls Card */}
            {(isAdmin || isMerchant) && (
              <div className="rounded-2xl border border-dashed border-[#e8a020] bg-[#fffdfb] p-5 space-y-3">
                <span className="text-[11px] uppercase font-bold text-[#e8a020] tracking-wider block">
                  Developer / Merchant Panel
                </span>
                
                {order.status !== 'delivered' && order.status !== 'cancelled' && (
                  <button
                    onClick={handleSimulate}
                    className="w-full flex items-center justify-between p-3 bg-[#ffffff] border border-[#e8a020]/30 rounded-xl hover:bg-[#fff9f2] transition-colors text-[12px] font-bold text-[#1a1a1a]"
                  >
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Simulate Next Status
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {order.paymentStatus === 'paid' && order.refundAmount < order.total && (
                  <button
                    onClick={() => setShowRefundModal(true)}
                    className="w-full flex items-center justify-between p-3 bg-[#ffffff] border border-[#ef4444]/30 text-[#ef4444] rounded-xl hover:bg-[#fef2f2] transition-colors text-[12px] font-bold"
                  >
                    <span className="flex items-center gap-2">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      Issue Partial Refund
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {['pending', 'accepted'].includes(order.status) && (
                  <button
                    onClick={handleCancelOrder}
                    className="w-full flex items-center justify-between p-3 bg-[#fef2f2] border border-[#ef4444]/20 text-[#ef4444] rounded-xl hover:bg-[#fee2e2] transition-colors text-[12px] font-bold"
                  >
                    <span>Cancel Order</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

          </div>

        </div>

        {/* Dynamic Carousel: You May Also Like */}
        <RecommendationsCarousel restaurantId={order.restaurantId} orderedItemIds={orderedItemIds} />

        {/* Trust features badges footer */}
        <ValuePropsBar />

      </div>

      {/* Partial Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#000000]/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-[#ffffff] border border-[#e5e7eb] p-6 shadow-xl space-y-4">
            <div>
              <h3 className="text-[18px] font-bold text-[#1a1a1a]">Issue Partial Refund</h3>
              <p className="text-[12px] text-[#6b7280] mt-1">
                Max refund available: ${(order.total - (order.refundAmount || 0)).toFixed(2)}
              </p>
            </div>
            
            <div className="space-y-3">
              <input
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                className="w-full rounded-xl border border-[#e5e7eb] text-[14px] text-[#1a1a1a] px-3.5 py-2.5 focus:outline-none focus:border-[#7a0b10]"
              />
              <input
                type="text"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Reason (Optional)"
                className="w-full rounded-xl border border-[#e5e7eb] text-[14px] text-[#1a1a1a] px-3.5 py-2.5 focus:outline-none focus:border-[#7a0b10]"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowRefundModal(false)}
                className="flex-1 border border-[#e5e7eb] hover:bg-[#f9fafb] text-[13px] font-bold text-[#4b5563] py-2.5 rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                onClick={handlePartialRefund}
                className="flex-1 bg-[#ef4444] hover:bg-[#dc2626] text-[13px] font-bold text-[#ffffff] py-2.5 rounded-lg transition-colors"
              >
                Refund
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function OrderSkeleton() {
  return (
    <div className="min-h-screen bg-[#f9fafb] py-8">
      <div className="mx-auto max-w-[1550px] w-full px-4 md:px-6 lg:px-8 space-y-6">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-40 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <Skeleton className="h-72 rounded-2xl" />
            <Skeleton className="h-48 rounded-2xl" />
          </div>
          <div className="lg:col-span-4 space-y-6">
            <Skeleton className="h-80 rounded-2xl" />
            <Skeleton className="h-40 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}