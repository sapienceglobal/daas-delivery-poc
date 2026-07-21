'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck, Users, Store, ShoppingBag, DollarSign,
  TrendingUp, ReceiptText, Tag, Trash2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { adminAPI, restaurantAPI, couponAPI } from '@/lib/api';
import {
  GlassCard, StatCard, Badge, Button, Tabs,
  SearchInput, Skeleton, showToast, ConfirmDialog
} from '@/components/ui';
import { downloadCSV } from '@/lib/exportUtils';

export default function AdminDashboard() {
  const { isAuthenticated, isAdmin } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [finance, setFinance] = useState(null);
  const [settlements, setSettlements] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [confirmData, setConfirmData] = useState({ isOpen: false });
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [reviewNotes, setReviewNotes] = useState({});
  const [settlementForm, setSettlementForm] = useState({
    restaurantId: '',
    periodStart: '',
    periodEnd: '',
  });

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    if (!isAdmin) { router.push('/'); return; }
    loadDashboard();
  }, [isAuthenticated, isAdmin]);

  const loadDashboard = async () => {
    try {
      const [dashData, usersData, restData, financeData, settlementData, couponsData] = await Promise.all([
        adminAPI.getDashboard(),
        adminAPI.getUsers(),
        adminAPI.getAllRestaurants(),
        adminAPI.getFinanceSummary(30),
        adminAPI.getSettlements(),
        couponAPI.getAll(),
      ]);
      setStats(dashData.data);
      setUsers(usersData.data || []);
      setRestaurants(restData.data || []);
      setFinance(financeData.data);
      setSettlements(settlementData.data || []);
      setCoupons(couponsData.data || []);
    } catch {
      showToast('Failed to load admin dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (userSearch) params.set('search', userSearch);
      if (userRoleFilter) params.set('role', userRoleFilter);
      const data = await adminAPI.getUsers(params.toString());
      setUsers(data.data || []);
    } catch {
      showToast('Failed to load users', 'error');
    }
  };

  useEffect(() => {
    if (!loading && activeTab === 'users') {
      const timer = setTimeout(loadUsers, userSearch ? 400 : 0);
      return () => clearTimeout(timer);
    }
  }, [userSearch, userRoleFilter, activeTab]);

  const handleUpdateRole = async (userId, role) => {
    try { await adminAPI.updateUserRole(userId, role); showToast(`Role → ${role}`, 'success'); loadUsers(); }
    catch (err) { showToast(err.message || 'Failed', 'error'); }
  };

  const handleToggleUser = async (userId) => {
    try { await adminAPI.toggleUserActive(userId); showToast('Toggled', 'success'); loadUsers(); }
    catch (err) { showToast(err.message || 'Failed', 'error'); }
  };

  const handleRestaurantStatus = async (id, status) => {
    try { await restaurantAPI.updateStatus(id, status); showToast(`Restaurant ${status}`, 'success'); loadDashboard(); }
    catch (err) { showToast(err.message || 'Failed', 'error'); }
  };

  const handleOnboardingReview = async (id, decision) => {
    try {
      await restaurantAPI.reviewOnboarding(id, { decision, notes: reviewNotes[id] || '' });
      showToast(`Onboarding ${decision}`, 'success');
      loadDashboard();
    } catch (err) {
      showToast(err.message || 'Review failed', 'error');
    }
  };

  const handleGenerateSettlement = async () => {
    if (!settlementForm.restaurantId || !settlementForm.periodStart || !settlementForm.periodEnd) {
      showToast('Choose restaurant and settlement period', 'warning');
      return;
    }
    try {
      await adminAPI.generateSettlement(settlementForm);
      showToast('Settlement generated', 'success');
      loadDashboard();
    } catch (err) {
      showToast(err.message || 'Failed to generate settlement', 'error');
    }
  };

  const handleMarkPaid = async (id) => {
    try {
      await adminAPI.markSettlementPaid(id);
      showToast('Settlement marked paid', 'success');
      loadDashboard();
    } catch (err) {
      showToast(err.message || 'Failed to mark paid', 'error');
    }
  };

  const handleDeleteCoupon = (id) => {
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
          loadDashboard();
        } catch (err) {
          showToast('Failed to deactivate', 'error');
        }
      }
    });
  };

  if (loading) return <AdminSkeleton />;

  const tabs = [
    { value: 'overview', label: 'Overview', icon: TrendingUp },
    { value: 'users', label: 'Users', icon: Users },
    { value: 'restaurants', label: 'Restaurants', icon: Store },
    { value: 'finance', label: 'Finance', icon: ReceiptText },
    { value: 'promotions', label: 'Promotions', icon: Tag },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-brand-text flex items-center gap-3">
        <ShieldCheck className="h-6 w-6 text-brand-cyan" /> Admin Dashboard
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Restaurants" value={stats?.totalRestaurants || 0} icon={Store} color="cyan" />
        <StatCard label="Total Customers" value={stats?.totalCustomers || 0} icon={Users} color="blue" />
        <StatCard label="Total Orders" value={stats?.totalOrders || 0} icon={ShoppingBag} color="green" />
        <StatCard label="Total Revenue" value={`$${(stats?.totalRevenue || 0).toFixed(2)}`} icon={DollarSign} color="yellow" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Today's Orders" value={stats?.todayOrders || 0} icon={ShoppingBag} color="cyan" />
        <StatCard label="Today's Revenue" value={`$${(stats?.todayRevenue || 0).toFixed(2)}`} icon={DollarSign} color="green" />
        <StatCard label="Platform Commission" value={`$${(stats?.totalCommission || 0).toFixed(2)}`} icon={TrendingUp} color="yellow" />
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GlassCard>
            <h3 className="text-sm font-bold text-brand-text uppercase tracking-wider mb-3">Recent Restaurants</h3>
            <div className="space-y-2">
              {restaurants.slice(0, 5).map(r => (
                <div key={r._id} className="flex items-center justify-between p-3 rounded-xl bg-brand-bg/40 border border-brand-border">
                  <div><p className="text-sm font-bold text-brand-text">{r.name}</p><p className="text-xs text-brand-muted">{r.cuisine}</p></div>
                  <Badge color={r.status === 'approved' ? 'green' : r.status === 'pending' ? 'yellow' : 'red'}>{r.status}</Badge>
                </div>
              ))}
            </div>
          </GlassCard>
          <GlassCard>
            <h3 className="text-sm font-bold text-brand-text uppercase tracking-wider mb-3">Recent Users</h3>
            <div className="space-y-2">
              {users.slice(0, 5).map(u => (
                <div key={u._id} className="flex items-center justify-between p-3 rounded-xl bg-brand-bg/40 border border-brand-border">
                  <div><p className="text-sm font-bold text-brand-text">{u.name}</p><p className="text-xs text-brand-muted">{u.email}</p></div>
                  <Badge color="cyan">{u.role}</Badge>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <SearchInput value={userSearch} onChange={setUserSearch} placeholder="Search users..." className="flex-1" />
            <div className="flex gap-2">
              {['', 'customer', 'merchant', 'driver', 'admin'].map(role => (
                <button key={role} onClick={() => setUserRoleFilter(role)}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold border transition-all capitalize
                    ${userRoleFilter === role ? 'bg-brand-cyan/10 text-brand-cyan border-brand-cyan/30' : 'text-brand-muted border-brand-border hover:text-brand-text'}`}>
                  {role || 'All'}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {users.map(u => (
              <GlassCard key={u._id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-brand-green to-brand-cyan flex items-center justify-center text-sm font-bold text-brand-bg">
                    {u.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div><p className="text-sm font-bold text-brand-text">{u.name}</p><p className="text-xs text-brand-muted">{u.email}</p></div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge color="cyan">{u.role}</Badge>
                  <Badge color={u.isActive ? 'green' : 'red'}>{u.isActive ? 'Active' : 'Inactive'}</Badge>
                  <select value={u.role} onChange={(e) => handleUpdateRole(u._id, e.target.value)}
                    className="rounded-lg bg-brand-card border border-brand-border text-xs text-brand-text px-2 py-1">
                    <option value="customer">Customer</option><option value="merchant">Merchant</option>
                    <option value="driver">Driver</option><option value="admin">Admin</option>
                  </select>
                  <Button variant="ghost" size="sm" onClick={() => handleToggleUser(u._id)}>
                    {u.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'restaurants' && (
        <div className="space-y-3">
          {restaurants.map(r => (
            <GlassCard key={r._id} className="space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-brand-text">{r.name}</p>
                  <p className="text-xs text-brand-muted">{r.cuisine} • {r.address}</p>
                  {r.ownerId && <p className="text-[10px] text-brand-muted">Owner: {r.ownerId.name || r.ownerId.email}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Badge color={r.status === 'approved' ? 'green' : r.status === 'pending' ? 'yellow' : 'red'}>{r.status}</Badge>
                  <Badge color={r.onboardingStatus === 'approved' ? 'green' : r.onboardingStatus === 'rejected' ? 'red' : 'yellow'}>{r.onboardingStatus || 'not_started'}</Badge>
                  {r.status === 'pending' && (<><Button variant="primary" size="sm" onClick={() => handleRestaurantStatus(r._id, 'approved')}>Approve</Button><Button variant="danger" size="sm" onClick={() => handleRestaurantStatus(r._id, 'rejected')}>Reject</Button></>)}
                  {r.status === 'approved' && <Button variant="danger" size="sm" onClick={() => handleRestaurantStatus(r._id, 'suspended')}>Suspend</Button>}
                </div>
              </div>

              {(r.businessInfo?.legalName || r.documents?.length > 0 || ['submitted', 'needs_changes'].includes(r.onboardingStatus)) && (
                <div className="rounded-xl border border-brand-border bg-brand-bg/30 p-3 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-brand-muted">
                    <span>Legal: <b className="text-brand-text">{r.businessInfo?.legalName || '—'}</b></span>
                    <span>Tax ID: <b className="text-brand-text">{r.businessInfo?.taxIdLast4 ? `***${r.businessInfo.taxIdLast4}` : '—'}</b></span>
                    <span>Owner: <b className="text-brand-text">{r.businessInfo?.ownerName || '—'}</b></span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(r.documents || []).map(doc => (
                      <a key={doc._id || doc.url} href={doc.url} target="_blank" rel="noopener noreferrer"
                        className="rounded-lg border border-brand-border px-3 py-1.5 text-xs font-semibold text-brand-cyan hover:border-brand-cyan/50">
                        {doc.name || doc.type}
                      </a>
                    ))}
                    {(r.documents || []).length === 0 && <span className="text-xs text-brand-muted">No documents uploaded.</span>}
                  </div>

                  <textarea
                    value={reviewNotes[r._id] || ''}
                    onChange={(e) => setReviewNotes(prev => ({ ...prev, [r._id]: e.target.value }))}
                    placeholder="Review notes for merchant..."
                    className="w-full rounded-xl border border-brand-border bg-brand-card/60 p-3 text-sm text-brand-text placeholder:text-brand-muted/50 focus:border-brand-cyan/50 focus:outline-none resize-none h-20"
                  />

                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => handleOnboardingReview(r._id, 'approved')}>Approve KYC</Button>
                    <Button size="sm" variant="secondary" onClick={() => handleOnboardingReview(r._id, 'needs_changes')}>Needs Changes</Button>
                    <Button size="sm" variant="danger" onClick={() => handleOnboardingReview(r._id, 'rejected')}>Reject KYC</Button>
                  </div>
                </div>
              )}
            </GlassCard>
          ))}
        </div>
      )}

      {activeTab === 'finance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="30D Collected" value={`$${(finance?.totalCollected || 0).toFixed(2)}`} icon={DollarSign} color="green" />
            <StatCard label="Platform Fees" value={`$${((finance?.platformFees || 0) + (finance?.serviceFees || 0)).toFixed(2)}`} icon={TrendingUp} color="cyan" />
            <StatCard label="Refunds" value={`$${(finance?.refunds || 0).toFixed(2)}`} icon={ReceiptText} color="red" />
            <StatCard label="Pending Payouts" value={`$${(finance?.pendingPayouts || 0).toFixed(2)}`} icon={Store} color="yellow" />
          </div>

          <GlassCard>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-brand-text uppercase tracking-wider">Generate Settlement</h3>
              <Button size="sm" variant="outline" onClick={() => {
                const data = settlements.map(s => ({
                  ID: s._id,
                  Restaurant: s.restaurantId?.name,
                  Status: s.status,
                  PeriodStart: new Date(s.periodStart).toLocaleDateString(),
                  PeriodEnd: new Date(s.periodEnd).toLocaleDateString(),
                  Orders: s.totalOrders,
                  GrossSales: s.grossSales,
                  PlatformFee: s.platformFee,
                  Payout: s.netPayout
                }));
                downloadCSV(data, 'settlements_export.csv');
              }}>
                Export CSV
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <select
                value={settlementForm.restaurantId}
                onChange={(e) => setSettlementForm(f => ({ ...f, restaurantId: e.target.value }))}
                className="rounded-xl bg-brand-card border border-brand-border text-sm text-brand-text px-3 py-2"
              >
                <option value="">Restaurant</option>
                {restaurants.filter(r => r.status === 'approved').map(r => (
                  <option key={r._id} value={r._id}>{r.name}</option>
                ))}
              </select>
              <input
                type="date"
                value={settlementForm.periodStart}
                onChange={(e) => setSettlementForm(f => ({ ...f, periodStart: e.target.value }))}
                className="rounded-xl bg-brand-card border border-brand-border text-sm text-brand-text px-3 py-2"
              />
              <input
                type="date"
                value={settlementForm.periodEnd}
                onChange={(e) => setSettlementForm(f => ({ ...f, periodEnd: e.target.value }))}
                className="rounded-xl bg-brand-card border border-brand-border text-sm text-brand-text px-3 py-2"
              />
              <Button onClick={handleGenerateSettlement}>Generate</Button>
            </div>
          </GlassCard>

          <div className="space-y-3">
            {settlements.length === 0 ? (
              <GlassCard className="text-center py-8">
                <p className="text-sm text-brand-muted">No settlements generated yet.</p>
              </GlassCard>
            ) : settlements.map(s => (
              <GlassCard key={s._id} className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-brand-text">{s.restaurantId?.name || 'Restaurant'}</p>
                    <Badge color={s.status === 'paid' ? 'green' : s.status === 'failed' ? 'red' : 'yellow'}>{s.status}</Badge>
                  </div>
                  <p className="text-xs text-brand-muted mt-1">
                    {new Date(s.periodStart).toLocaleDateString()} - {new Date(s.periodEnd).toLocaleDateString()} • {s.totalOrders} orders
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-brand-muted">Gross</p>
                    <p className="text-sm font-bold text-brand-text">${s.grossSales?.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-brand-muted">Commission</p>
                    <p className="text-sm font-bold text-brand-cyan">${s.commission?.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-brand-muted">Net Payable</p>
                    <p className="text-sm font-black text-brand-green">${s.netPayable?.toFixed(2)}</p>
                  </div>
                  {s.status !== 'paid' && <Button size="sm" onClick={() => handleMarkPaid(s._id)}>Mark Paid</Button>}
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'promotions' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-brand-text uppercase tracking-wider">All Promotions</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {coupons.map(coupon => (
              <GlassCard key={coupon._id} className="relative flex flex-col justify-between">
                <div className="absolute top-4 right-4 flex gap-2">
                  <Badge color={coupon.specificRestaurant ? 'blue' : 'yellow'}>
                    {coupon.specificRestaurant ? 'Restaurant' : 'Platform'}
                  </Badge>
                  <Badge color={coupon.isActive ? 'green' : 'red'}>{coupon.isActive ? 'Active' : 'Inactive'}</Badge>
                </div>
                
                <div>
                  <h3 className="text-xl font-black text-brand-text mb-1">{coupon.code}</h3>
                  <p className="text-sm text-brand-muted mb-4 line-clamp-2">{coupon.description || 'No description'}</p>
                  
                  <div className="space-y-2 text-xs text-brand-text/80 mb-6">
                    <p className="flex justify-between">
                      <span>Discount:</span> 
                      <span className="font-bold">{coupon.type === 'percentage' ? `${coupon.value}% OFF` : coupon.type === 'free_delivery' ? 'FREE DELIVERY' : `$${coupon.value} OFF`}</span>
                    </p>
                    {coupon.specificRestaurant && (
                      <p className="flex justify-between text-brand-cyan">
                        <span>Restaurant ID:</span>
                        <span className="font-bold truncate max-w-[120px]">{coupon.specificRestaurant}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-brand-border/50 pt-4 mt-2">
                  <span className="text-xs text-brand-muted">Used {coupon.usedCount} times</span>
                  {coupon.isActive && (
                    <button onClick={() => handleDeleteCoupon(coupon._id)} className="text-brand-red/60 hover:text-brand-red p-1 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </GlassCard>
            ))}
            {coupons.length === 0 && (
              <div className="col-span-full py-12 text-center text-brand-muted">
                No promotions active on the platform.
              </div>
            )}
          </div>
        </div>
      )}

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

function AdminSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
      <Skeleton className="h-12 rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><Skeleton className="h-64 rounded-2xl" /><Skeleton className="h-64 rounded-2xl" /></div>
    </div>
  );
}
