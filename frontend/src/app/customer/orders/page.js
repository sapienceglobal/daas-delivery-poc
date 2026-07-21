'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Package, Clock, History, ChevronRight, ShoppingBag,
  Star, ExternalLink
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { orderAPI } from '@/lib/api';
import {
  GlassCard, Badge, Button, EmptyState, OrderStatusBadge,
  Tabs, Skeleton, showToast
} from '@/components/ui';

export default function OrdersPage() {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }
      loadOrders();
    }
  }, [authLoading, isAuthenticated]);

  const loadOrders = async () => {
    try {
      const params = activeTab !== 'all' ? `status=${activeTab}` : '';
      const data = await orderAPI.getMyOrders(params);
      setOrders(data.data || []);
    } catch {
      showToast('Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true);
      loadOrders();
    }
  }, [activeTab]);

  const tabs = [
    { value: 'all', label: 'All Orders' },
    { value: 'pending', label: 'Pending' },
    { value: 'preparing', label: 'In Progress' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-brand-text flex items-center gap-3">
        <History className="h-6 w-6 text-brand-cyan" />
        My Orders
      </h1>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No orders found"
          description={activeTab === 'all' ? "You haven't placed any orders yet" : `No ${activeTab} orders`}
          action={<Button onClick={() => router.push('/customer')}>Browse Restaurants</Button>}
        />
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <Link key={order._id} href={`/customer/orders/${order._id}`}>
              <GlassCard hover className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="text-sm font-bold text-brand-text">{order.orderNumber}</span>
                    <OrderStatusBadge status={order.status} />
                  </div>

                  <p className="text-sm text-brand-muted">{order.restaurantName}</p>

                  <div className="flex items-center gap-4 mt-2 text-xs text-brand-muted">
                    <span className="flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      {order.items?.length} items
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                    {order.trackingUrl && (
                      <a
                        href={order.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-brand-cyan hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" /> Track
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-lg font-black text-brand-text">${order.total?.toFixed(2)}</span>
                  <ChevronRight className="h-5 w-5 text-brand-muted" />
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
