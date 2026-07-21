'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Tag, ChevronLeft, Plus, Trash2, Calendar, DollarSign, Percent } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { couponAPI } from '@/lib/api';
import { Button, showToast, Skeleton, Modal, Input, GlassCard, Badge, ConfirmDialog } from '@/components/ui';

export default function PromotionsPage() {
  const router = useRouter();
  const { user, isMerchant, isAdmin, isAuthenticated } = useAuth();
  
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmData, setConfirmData] = useState({ isOpen: false });
  
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    type: 'percentage',
    value: 10,
    minCartValue: 0,
    endDate: '',
    firstOrderOnly: false,
    maxUses: ''
  });

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    if (!isMerchant && !isAdmin) { router.push('/customer'); return; }
    
    // Set default endDate to 30 days from now
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);
    setFormData(p => ({ ...p, endDate: nextMonth.toISOString().split('T')[0] }));
    
    loadCoupons();
  }, [isAuthenticated, isMerchant]);

  const loadCoupons = async () => {
    try {
      // In a real app, you might filter by restaurantId on the backend for merchant coupons.
      // Currently, couponAPI.getAll() fetches all (might be admin-only, but let's assume it works or we filter).
      const res = await couponAPI.getAll();
      setCoupons(res.data || []);
    } catch (err) {
      showToast('Failed to load promotions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await couponAPI.create({ 
        ...formData, 
        maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
        specificRestaurant: user.restaurantId // attach to this restaurant
      });
      showToast('Promotion created!', 'success');
      setModalOpen(false);
      loadCoupons();
    } catch (err) {
      showToast(err.message || 'Failed to create promotion', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    setConfirmData({
      isOpen: true,
      title: 'Deactivate Promotion',
      message: 'Are you sure you want to deactivate this promotion?',
      confirmText: 'Deactivate',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await couponAPI.update(id, { isActive: false });
          showToast('Promotion deactivated', 'success');
          loadCoupons();
        } catch (err) {
          showToast('Failed to deactivate', 'error');
        }
      }
    });
  };

  if (loading) return <div className="p-8"><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/merchant')}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Dashboard
          </Button>
          <h1 className="text-2xl font-black text-brand-text flex items-center gap-3">
            <Tag className="h-6 w-6 text-brand-green" /> Promotions & Coupons
          </h1>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Promotion
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {coupons.map(coupon => (
          <GlassCard key={coupon._id} className="relative flex flex-col justify-between">
            <div className="absolute top-4 right-4">
              <Badge color={coupon.isActive ? 'green' : 'red'}>{coupon.isActive ? 'Active' : 'Inactive'}</Badge>
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-brand-green/10 rounded-lg text-brand-green">
                  {coupon.type === 'percentage' ? <Percent className="h-4 w-4" /> : <DollarSign className="h-4 w-4" />}
                </div>
                <h3 className="text-xl font-black text-brand-text">{coupon.code}</h3>
              </div>
              <p className="text-sm text-brand-muted mb-4 line-clamp-2">{coupon.description || 'No description'}</p>
              
              <div className="space-y-2 text-xs text-brand-text/80 mb-6">
                <p className="flex justify-between">
                  <span>Discount:</span> 
                  <span className="font-bold">{coupon.type === 'percentage' ? `${coupon.value}% OFF` : coupon.type === 'free_delivery' ? 'FREE DELIVERY' : `$${coupon.value} OFF`}</span>
                </p>
                <p className="flex justify-between">
                  <span>Min. Order:</span> 
                  <span className="font-bold">${coupon.minCartValue}</span>
                </p>
                {coupon.firstOrderOnly && (
                  <p className="flex justify-between">
                    <span>Special Rule:</span> 
                    <Badge color="cyan">First Order Only</Badge>
                  </p>
                )}
                {coupon.maxUses && (
                  <p className="flex justify-between">
                    <span>Limit:</span> 
                    <span className="font-bold">{coupon.maxUses} total uses</span>
                  </p>
                )}
                <p className="flex justify-between text-brand-yellow">
                  <span>Expires:</span> 
                  <span className="font-bold flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(coupon.endDate).toLocaleDateString()}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-brand-border/50 pt-4 mt-2">
              <span className="text-xs text-brand-muted">Used {coupon.usedCount} times</span>
              {coupon.isActive && (
                <button onClick={() => handleDelete(coupon._id)} className="text-brand-red/60 hover:text-brand-red p-1 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </GlassCard>
        ))}
        
        {coupons.length === 0 && (
          <div className="col-span-full py-12 text-center text-brand-muted">
            No promotions active. Create one to boost your sales!
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create Promotion">
        <form onSubmit={handleSubmit} noValidate className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Coupon Code" 
              placeholder="e.g. SUMMER20"
              value={formData.code} 
              onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
              required
            />
            <div className="space-y-1">
              <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider">Discount Type</label>
              <select 
                className="w-full h-11 px-3 rounded-xl bg-brand-card border border-brand-border text-sm focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan outline-none transition-all"
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value})}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Fixed Amount ($)</option>
                <option value="free_delivery">Free Delivery</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Discount Value" 
              type="number" 
              min="0"
              value={formData.value} 
              onChange={e => setFormData({...formData, value: parseFloat(e.target.value)})}
              required={formData.type !== 'free_delivery'}
              disabled={formData.type === 'free_delivery'}
            />
            <Input 
              label="Min Order Amount ($)" 
              type="number" 
              min="0"
              value={formData.minCartValue} 
              onChange={e => setFormData({...formData, minCartValue: parseFloat(e.target.value)})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Max Total Uses (Optional)" 
              type="number" 
              min="1"
              placeholder="Unlimited"
              value={formData.maxUses} 
              onChange={e => setFormData({...formData, maxUses: e.target.value})}
            />
            <div className="flex items-center mt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-brand-border text-brand-cyan focus:ring-brand-cyan"
                  checked={formData.firstOrderOnly}
                  onChange={e => setFormData({...formData, firstOrderOnly: e.target.checked})}
                />
                <span className="text-sm font-bold text-brand-text">Valid for first order only</span>
              </label>
            </div>
          </div>

          <Input 
            label="Description (Optional)" 
            placeholder="e.g. 20% off all orders over $50"
            value={formData.description} 
            onChange={e => setFormData({...formData, description: e.target.value})}
          />

          <Input 
            label="Expiration Date" 
            type="date"
            value={formData.endDate} 
            onChange={e => setFormData({...formData, endDate: e.target.value})}
            required
          />

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Create Coupon</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog 
        isOpen={confirmData.isOpen}
        onClose={() => setConfirmData({ ...confirmData, isOpen: false })}
        onConfirm={confirmData.onConfirm}
        title={confirmData.title}
        message={confirmData.message}
        confirmText={confirmData.confirmText}
        variant={confirmData.variant}
      />
    </div>
  );
}
