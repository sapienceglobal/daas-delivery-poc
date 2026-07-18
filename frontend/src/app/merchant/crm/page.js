'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Mail, ArrowLeft, Star, Search, Filter } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { crmAPI } from '@/lib/api';
import { GlassCard, Button, Input, Badge, showToast, Skeleton } from '@/components/ui';

export default function CRMDashboard() {
  const { user, isMerchant, isAuthenticated } = useAuth();
  const router = useRouter();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoForm, setPromoForm] = useState({ title: '', message: '', targetSegment: 'All' });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    if (!isMerchant) { router.push('/customer'); return; }
    loadCustomers();
  }, [isAuthenticated, isMerchant]);

  const loadCustomers = async () => {
    try {
      const res = await crmAPI.getCustomers(user.restaurantId);
      setCustomers(res.data || []);
    } catch (err) {
      showToast('Failed to load customers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name?.toLowerCase().includes(search.toLowerCase()) || 
    c.phone?.includes(search)
  );

  const handleSendPromo = async () => {
    if (!promoForm.message) return showToast('Message is required', 'error');
    
    setSending(true);
    try {
      let targetUsers = customers;
      if (promoForm.targetSegment !== 'All') {
        targetUsers = customers.filter(c => c.segment === promoForm.targetSegment);
      }
      
      const userIds = targetUsers.map(c => c.userId).filter(Boolean);
      
      if (userIds.length === 0) {
        setSending(false);
        return showToast(`No registered users found in segment: ${promoForm.targetSegment}`, 'warning');
      }

      await crmAPI.sendPromo(user.restaurantId, {
        userIds,
        title: promoForm.title,
        message: promoForm.message
      });
      
      showToast('Promotion sent successfully!', 'success');
      setShowPromoModal(false);
      setPromoForm({ title: '', message: '', targetSegment: 'All' });
    } catch (err) {
      showToast(err.message || 'Failed to send promotion', 'error');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="p-8"><Skeleton className="h-96 w-full" /></div>;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/merchant')} className="p-2 rounded-xl bg-brand-card border border-brand-border hover:text-brand-cyan transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-brand-text flex items-center gap-3">
              <Users className="h-6 w-6 text-brand-blue" />
              Customer Relationship Management
            </h1>
            <p className="text-sm text-brand-muted mt-1">Manage your customer segments and marketing campaigns.</p>
          </div>
        </div>
        <Button onClick={() => setShowPromoModal(true)} icon={Mail} variant="primary">
          Send Campaign
        </Button>
      </div>

      <GlassCard className="p-0 overflow-hidden">
        <div className="p-4 border-b border-brand-border/50 bg-brand-bg/30 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-muted" />
            <input 
              type="text"
              placeholder="Search customers by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-brand-card border border-brand-border rounded-xl text-sm focus:border-brand-cyan outline-none text-brand-text placeholder-brand-muted/50 transition-colors"
            />
          </div>
          <Button variant="outline" size="sm" icon={Filter} className="hidden sm:flex">Filter</Button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-bg/50 border-b border-brand-border/50 text-xs font-bold text-brand-muted uppercase tracking-wider">
                <th className="py-4 px-6">Customer</th>
                <th className="py-4 px-6">Segment</th>
                <th className="py-4 px-6">Total Orders</th>
                <th className="py-4 px-6">Lifetime Value</th>
                <th className="py-4 px-6 text-right">Last Order</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-brand-muted">
                    No customers found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c, i) => (
                  <tr key={i} className="border-b border-brand-border/30 hover:bg-brand-bg/30 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-brand-blue to-brand-cyan flex items-center justify-center text-brand-bg font-black">
                          {c.name ? c.name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div>
                          <p className="font-bold text-brand-text">{c.name || 'Walk-in Customer'}</p>
                          <p className="text-xs text-brand-muted">{c.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <Badge color={c.segment === 'VIP' ? 'yellow' : c.segment === 'Regular' ? 'cyan' : 'gray'}>
                        {c.segment === 'VIP' && <Star className="h-3 w-3 mr-1 inline" />}
                        {c.segment}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 font-bold text-brand-text">
                      {c.totalOrders}
                    </td>
                    <td className="py-4 px-6 font-black text-brand-green">
                      ${(c.totalSpend || 0).toFixed(2)}
                    </td>
                    <td className="py-4 px-6 text-right text-sm text-brand-muted">
                      {new Date(c.lastOrderDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {showPromoModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <GlassCard className="w-full max-w-lg space-y-4 relative shadow-2xl shadow-brand-blue/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-brand-blue/20 text-brand-blue rounded-xl">
                <Mail className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-brand-text">Send Marketing Campaign</h2>
                <p className="text-xs text-brand-muted">Send push notifications to your registered customers.</p>
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-2">Target Segment</label>
              <div className="flex gap-2 p-1 bg-brand-bg/50 rounded-xl border border-brand-border">
                {['All', 'VIP', 'Regular', 'New'].map(seg => (
                  <button
                    key={seg}
                    onClick={() => setPromoForm({...promoForm, targetSegment: seg})}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${
                      promoForm.targetSegment === seg ? 'bg-brand-blue text-brand-bg shadow-md' : 'text-brand-muted hover:text-brand-text'
                    }`}
                  >
                    {seg}
                  </button>
                ))}
              </div>
            </div>

            <Input 
              label="Notification Title" 
              placeholder="e.g. 20% Off Your Next Order!" 
              value={promoForm.title} 
              onChange={e => setPromoForm({...promoForm, title: e.target.value})} 
            />
            
            <div>
              <label className="block text-xs font-bold text-brand-muted uppercase tracking-wider mb-2">Message</label>
              <textarea 
                className="w-full bg-brand-bg/50 border border-brand-border text-brand-text text-sm rounded-xl px-4 py-3 outline-none focus:border-brand-blue/50 min-h-[100px] resize-none"
                placeholder="Use promo code VIP20 at checkout to get 20% off..."
                value={promoForm.message}
                onChange={e => setPromoForm({...promoForm, message: e.target.value})}
              />
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-brand-border/50">
              <Button variant="outline" onClick={() => setShowPromoModal(false)}>Cancel</Button>
              <Button onClick={handleSendPromo} loading={sending} variant="primary" icon={Mail}>
                Send Campaign
              </Button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
