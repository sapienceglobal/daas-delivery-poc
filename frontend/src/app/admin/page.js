'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck, Users, Store, ShoppingBag, DollarSign,
  TrendingUp, ReceiptText, Tag, Trash2, Plus, Palette,
  Globe, Sparkles, ExternalLink, LogOut, CheckCircle2,
  ChevronDown, ChevronUp, Copy, Check, Database, Layers,
  ArrowUpRight, Activity, Clock, Shield
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { adminAPI, restaurantAPI, couponAPI } from '@/lib/api';
import {
  GlassCard, StatCard, Badge, Button, Tabs,
  SearchInput, Skeleton, showToast, ConfirmDialog
} from '@/components/ui';
import { downloadCSV } from '@/lib/exportUtils';
import CreateTenantModal from '@/components/admin/CreateTenantModal';
import EditThemeModal from '@/components/admin/EditThemeModal';
import EditDomainModal from '@/components/admin/EditDomainModal';

export default function AdminDashboard() {
  const { isAuthenticated, isAdmin, loading: authLoading, backendVerified, logout, user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('restaurants');
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
  const [expandedKyc, setExpandedKyc] = useState({});
  const [copiedDb, setCopiedDb] = useState('');
  const [settlementForm, setSettlementForm] = useState({
    restaurantId: '',
    periodStart: '',
    periodEnd: '',
  });
  const [isCreateTenantOpen, setIsCreateTenantOpen] = useState(false);
  const [themeModalRestaurant, setThemeModalRestaurant] = useState(null);
  const [domainModalRestaurant, setDomainModalRestaurant] = useState(null);

  const getTemplateBadge = (templateId) => {
    switch (templateId) {
      case 'template_bistro': return { label: 'Luxury Bistro', color: 'purple', bg: 'bg-purple-500/10 text-purple-300 border-purple-500/30' };
      case 'template_cafe': return { label: 'Artisan Cafe', color: 'yellow', bg: 'bg-amber-500/10 text-amber-300 border-amber-500/30' };
      case 'template_dark_kitchen': return { label: 'Dark Kitchen', color: 'green', bg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' };
      case 'lassi_classic':
      default: return { label: 'Classic QSR (Lassi Lounge)', color: 'cyan', bg: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30' };
    }
  };

  const handleCopyDb = (name) => {
    navigator.clipboard?.writeText(name);
    setCopiedDb(name);
    showToast(`Copied database tag: ${name}`, 'success');
    setTimeout(() => setCopiedDb(''), 2000);
  };

  const toggleKyc = (id) => {
    setExpandedKyc(prev => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    if (authLoading) return;
    if (!backendVerified) return;
    if (!isAuthenticated) { router.push('/admin/login'); return; }
    if (!isAdmin) { router.push('/'); return; }
    loadDashboard();
  }, [isAuthenticated, isAdmin, authLoading, backendVerified]);

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
    try { await adminAPI.toggleRestaurantStatus(id, { status }); showToast(`Restaurant ${status}`, 'success'); loadDashboard(); }
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
      title: 'Delete Coupon',
      message: 'Are you sure? This coupon will be permanently removed.',
      confirmText: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await couponAPI.delete(id);
          showToast('Coupon deactivated', 'success');
          loadDashboard();
        } catch (err) {
          showToast('Failed to deactivate', 'error');
        }
      }
    });
  };

  if (authLoading || !backendVerified || loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-80 rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  const tabs = [
    { value: 'restaurants', label: `Tenant Brands (${restaurants.length})`, icon: Store },
    { value: 'overview', label: 'Overview', icon: TrendingUp },
    { value: 'users', label: `Users (${users.length})`, icon: Users },
    { value: 'finance', label: 'Finance & Payouts', icon: ReceiptText },
    { value: 'promotions', label: 'Coupons', icon: Tag },
  ];

  return (
    <div className="space-y-6">
      {/* ── Executive Top Header Bar ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
        {/* Subtle top glow line */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-indigo-900 to-slate-900 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-xl shadow-indigo-500/10">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-black text-white tracking-tight">Platform Super Admin</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 uppercase tracking-wider">
                Enterprise Control Plane v2.4
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Multi-Tenant Engine Active
              </span>
              <span>•</span>
              <span>{restaurants.length} Registered Brand{restaurants.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-semibold text-slate-300">{user?.name || 'Platform Administrator'}</span>
            <span className="text-[11px] text-slate-500 font-mono">{user?.email || 'admin@platform.com'}</span>
          </div>

          <Button
            size="sm"
            onClick={() => setIsCreateTenantOpen(true)}
            className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold shadow-lg shadow-indigo-600/20"
          >
            <Plus className="h-4 w-4" /> Onboard Restaurant
          </Button>

          <button
            onClick={async () => {
              await logout();
              router.push('/admin/login');
            }}
            className="p-2.5 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/15 hover:border-red-500/40 transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            title="Sign Out from Super Admin"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden md:inline">Sign Out</span>
          </button>
        </div>
      </div>

      {/* ── High-Impact Performance Metrics Row ─────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-slate-700/80 backdrop-blur-xl transition-all shadow-xl space-y-3 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tenant Brands</span>
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Store className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-white tracking-tight">{stats?.totalRestaurants || 0}</div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <span className="text-emerald-400 font-semibold">100% Isolated</span>
              <span>• Database per tenant</span>
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-slate-700/80 backdrop-blur-xl transition-all shadow-xl space-y-3 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Gross Platform GMV</span>
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-white tracking-tight">${(stats?.totalRevenue || 0).toFixed(2)}</div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <span className="text-emerald-400 font-semibold">Today: ${(stats?.todayRevenue || 0).toFixed(2)}</span>
              <span>processed</span>
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-slate-700/80 backdrop-blur-xl transition-all shadow-xl space-y-3 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Lifetime Orders</span>
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-white tracking-tight">{stats?.totalOrders || 0}</div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <span className="text-blue-400 font-semibold">Today: {stats?.todayOrders || 0} orders</span>
            </div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-slate-700/80 backdrop-blur-xl transition-all shadow-xl space-y-3 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Platform Take / SaaS</span>
            <div className="h-9 w-9 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-white tracking-tight">${(stats?.totalCommission || 0).toFixed(2)}</div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <span className="text-violet-400 font-semibold">{stats?.totalCustomers || 0} Registered</span>
              <span>customers</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Segmented Navigation Tabs ───────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 flex-wrap gap-3">
        <div className="flex items-center gap-2 p-1 bg-slate-900/60 border border-slate-800 rounded-2xl backdrop-blur-md">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {activeTab === 'restaurants' && (
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setIsCreateTenantOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Add New Brand
            </Button>
          </div>
        )}
      </div>

      {/* ── Tab Content: Tenant Brands & Portfolios ─────────────────────────── */}
      {activeTab === 'restaurants' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-400">
            <p>Managing <span className="text-white font-bold">{restaurants.length}</span> isolated restaurant environment{restaurants.length !== 1 ? 's' : ''}. Each brand has dedicated database sharding and independent theme tokens.</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {restaurants.map(r => {
              const tpl = getTemplateBadge(r.themeConfig?.templateId);
              const dbName = `daas_poc_${r.tenantId || r.slug}`;
              const colors = r.themeConfig || { primaryColor: '#FDB714', secondaryColor: '#430805', accentColor: '#7A0B10' };
              const isKycOpen = !!expandedKyc[r._id];

              return (
                <div
                  key={r._id}
                  className="rounded-3xl border border-slate-800/80 bg-slate-900/50 backdrop-blur-xl p-6 shadow-xl hover:border-slate-700/80 transition-all space-y-5 relative"
                >
                  {/* Top Bar: Restaurant Identity, Badges, Action Buttons */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      {/* Brand Initial Monogram */}
                      <div
                        className="h-14 w-14 rounded-2xl flex items-center justify-center text-lg font-black text-white shadow-lg shrink-0 border border-white/20"
                        style={{
                          background: `linear-gradient(135deg, ${colors.primaryColor || '#FDB714'}, ${colors.secondaryColor || '#430805'})`
                        }}
                      >
                        {r.name?.substring(0, 2)?.toUpperCase()}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3 className="text-lg font-bold text-white tracking-tight">{r.name}</h3>
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${tpl.bg}`}>
                            {tpl.label}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 uppercase tracking-wider">
                            {r.plan ? r.plan.toUpperCase() : 'GROWTH'} TIER
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                            r.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {r.status?.toUpperCase()}
                          </span>
                        </div>

                        <p className="text-xs text-slate-400">
                          {r.cuisine} • {r.address || 'Cloud Kitchen'}
                        </p>

                        {r.ownerId && (
                          <p className="text-[11px] text-slate-500">
                            Merchant Owner: <span className="text-slate-300 font-medium">{r.ownerId.name || r.ownerId.email}</span> ({r.ownerId.email})
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => setThemeModalRestaurant(r)}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 hover:border-amber-500/50 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Palette className="h-3.5 w-3.5" />
                        <span>Theme & Template</span>
                      </button>

                      <button
                        onClick={() => setDomainModalRestaurant(r)}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Globe className="h-3.5 w-3.5" />
                        <span>Domain & Routing</span>
                      </button>

                      {r.status === 'approved' && (
                        <button
                          onClick={() => handleRestaurantStatus(r._id, 'suspended')}
                          className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
                        >
                          Suspend
                        </button>
                      )}

                      {r.status === 'suspended' && (
                        <button
                          onClick={() => handleRestaurantStatus(r._id, 'approved')}
                          className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 transition-all cursor-pointer"
                        >
                          Re-activate
                        </button>
                      )}

                      {r.status === 'pending' && (
                        <div className="flex items-center gap-1.5">
                          <Button size="sm" onClick={() => handleRestaurantStatus(r._id, 'approved')}>Approve</Button>
                          <Button variant="danger" size="sm" onClick={() => handleRestaurantStatus(r._id, 'rejected')}>Reject</Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── Infrastructure & White-Label Details Grid ──────────── */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Database Box */}
                    <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                      <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                        <span className="flex items-center gap-1.5">
                          <Database className="h-3 w-3 text-cyan-400" /> Isolated MongoDB
                        </span>
                        <button
                          onClick={() => handleCopyDb(dbName)}
                          className="text-slate-500 hover:text-cyan-400 transition-colors p-0.5"
                          title="Copy database tag"
                        >
                          {copiedDb === dbName ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </div>
                      <div className="font-mono text-xs text-cyan-300 font-semibold truncate">
                        {dbName}
                      </div>
                      <p className="text-[10px] text-slate-500">Dedicated Tenant Collection Context</p>
                    </div>

                    {/* Domain Box */}
                    <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                      <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                        <span className="flex items-center gap-1.5">
                          <Globe className="h-3 w-3 text-emerald-400" /> Live Domain / CNAME
                        </span>
                        {r.customDomain && (
                          <a
                            href={`https://${r.customDomain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-500 hover:text-emerald-400 transition-colors"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      <div className="font-mono text-xs text-white font-semibold truncate">
                        {r.customDomain ? (
                          <span className="text-emerald-300">{r.customDomain}</span>
                        ) : r.subdomain ? (
                          <span className="text-slate-300">{r.subdomain}.yourdomain.com</span>
                        ) : (
                          <span className="text-slate-500 italic">No custom domain linked</span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500">
                        {r.customDomain ? 'Custom Production CNAME Active' : 'Default / Shared Multi-Tenant Route'}
                      </p>
                    </div>

                    {/* Color Swatch Tokens Box */}
                    <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                      <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                        <span className="flex items-center gap-1.5">
                          <Palette className="h-3 w-3 text-amber-400" /> Active Color Tokens
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">HSL Tailored</span>
                      </div>
                      <div className="flex items-center gap-2 pt-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="h-5 w-5 rounded-full border border-white/20 shadow-md" style={{ backgroundColor: colors.primaryColor }} title="Primary Color" />
                          <span className="h-5 w-5 rounded-full border border-white/20 shadow-md" style={{ backgroundColor: colors.secondaryColor }} title="Secondary Color" />
                          {colors.accentColor && (
                            <span className="h-5 w-5 rounded-full border border-white/20 shadow-md" style={{ backgroundColor: colors.accentColor }} title="Accent Color" />
                          )}
                        </div>
                        <span className="text-xs font-mono text-slate-300 pl-1">{colors.primaryColor}</span>
                      </div>
                      <p className="text-[10px] text-slate-500">Injected into Theme CSS Variables</p>
                    </div>
                  </div>

                  {/* ── Collapsible KYC & Legal Information Drawer ─────────── */}
                  <div className="border-t border-slate-800/80 pt-3">
                    <button
                      onClick={() => toggleKyc(r._id)}
                      className="text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5 font-medium cursor-pointer"
                    >
                      {isKycOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      <span>{isKycOpen ? 'Hide KYC & Legal Verification Details' : 'View KYC & Legal Verification Details'}</span>
                    </button>

                    {isKycOpen && (
                      <div className="mt-3 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 text-xs animate-in fade-in duration-200">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-400">
                          <div>Legal Name: <b className="text-white block mt-0.5">{r.businessInfo?.legalName || '—'}</b></div>
                          <div>Tax ID (EIN/SSN): <b className="text-white block mt-0.5">{r.businessInfo?.taxIdLast4 ? `***${r.businessInfo.taxIdLast4}` : '—'}</b></div>
                          <div>Owner Name: <b className="text-white block mt-0.5">{r.businessInfo?.ownerName || r.ownerId?.name || '—'}</b></div>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-1">
                          {(r.documents || []).map(doc => (
                            <a
                              key={doc._id || doc.url}
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-lg border border-slate-800 px-3 py-1.5 text-xs font-semibold text-cyan-400 hover:border-cyan-500/50 bg-slate-900"
                            >
                              {doc.name || doc.type}
                            </a>
                          ))}
                          {(r.documents || []).length === 0 && <span className="text-slate-500">No documents uploaded.</span>}
                        </div>

                        <textarea
                          value={reviewNotes[r._id] || ''}
                          onChange={(e) => setReviewNotes(prev => ({ ...prev, [r._id]: e.target.value }))}
                          placeholder="Review notes for merchant..."
                          className="w-full rounded-xl border border-slate-800 bg-slate-900 p-3 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500/50 focus:outline-none resize-none h-20"
                        />

                        <div className="flex flex-wrap gap-2 pt-1">
                          <Button size="sm" onClick={() => handleOnboardingReview(r._id, 'approved')}>Approve KYC</Button>
                          <Button size="sm" variant="secondary" onClick={() => handleOnboardingReview(r._id, 'needs_changes')}>Needs Changes</Button>
                          <Button size="sm" variant="danger" onClick={() => handleOnboardingReview(r._id, 'rejected')}>Reject KYC</Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Tab Content: Overview ───────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-xl space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recent Registered Brands</h3>
            <div className="space-y-2">
              {restaurants.slice(0, 5).map(r => (
                <div key={r._id} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div>
                    <p className="text-sm font-bold text-white">{r.name}</p>
                    <p className="text-xs text-slate-400">{r.cuisine}</p>
                  </div>
                  <Badge color={r.status === 'approved' ? 'green' : r.status === 'pending' ? 'yellow' : 'red'}>{r.status}</Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-xl space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recent Platform Users</h3>
            <div className="space-y-2">
              {users.slice(0, 5).map(u => (
                <div key={u._id} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div>
                    <p className="text-sm font-bold text-white">{u.name}</p>
                    <p className="text-xs text-slate-400">{u.email}</p>
                  </div>
                  <Badge color="cyan">{u.role}</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab Content: Users & Staff ──────────────────────────────────────── */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <SearchInput value={userSearch} onChange={setUserSearch} placeholder="Search users by name, email..." className="flex-1" />
            <div className="flex gap-2">
              {['', 'customer', 'merchant', 'driver', 'admin'].map(role => (
                <button
                  key={role}
                  onClick={() => setUserRoleFilter(role)}
                  className={`rounded-xl px-3.5 py-2 text-xs font-semibold border transition-all capitalize ${
                    userRoleFilter === role
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                      : 'text-slate-400 border-slate-800 hover:text-white bg-slate-900/60'
                  }`}
                >
                  {role || 'All Roles'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {users.map(u => (
              <div
                key={u._id}
                className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center text-sm font-bold text-white shadow-md">
                    {u.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{u.name}</p>
                    <p className="text-xs text-slate-400">{u.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge color="cyan">{u.role}</Badge>
                  <Badge color={u.isActive ? 'green' : 'red'}>{u.isActive ? 'Active' : 'Inactive'}</Badge>
                  <select
                    value={u.role}
                    onChange={(e) => handleUpdateRole(u._id, e.target.value)}
                    className="rounded-lg bg-slate-950 border border-slate-800 text-xs text-white px-2 py-1.5 focus:outline-none"
                  >
                    <option value="customer">Customer</option>
                    <option value="merchant">Merchant</option>
                    <option value="driver">Driver</option>
                    <option value="admin">Admin</option>
                  </select>
                  <Button variant="ghost" size="sm" onClick={() => handleToggleUser(u._id)}>
                    {u.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab Content: Finance & Settlements ──────────────────────────────── */}
      {activeTab === 'finance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="30D Collected" value={`$${(finance?.totalCollected || 0).toFixed(2)}`} icon={DollarSign} color="green" />
            <StatCard label="Platform Fees" value={`$${((finance?.platformFees || 0) + (finance?.serviceFees || 0)).toFixed(2)}`} icon={TrendingUp} color="cyan" />
            <StatCard label="Refunds" value={`$${(finance?.refunds || 0).toFixed(2)}`} icon={ReceiptText} color="red" />
            <StatCard label="Pending Payouts" value={`$${(finance?.pendingPayouts || 0).toFixed(2)}`} icon={Store} color="yellow" />
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Generate Merchant Settlement</h3>
              <Button size="sm" variant="outline" onClick={() => downloadCSV(settlements, 'settlements')}>Export CSV</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select
                value={settlementForm.restaurantId}
                onChange={(e) => setSettlementForm(prev => ({ ...prev, restaurantId: e.target.value }))}
                className="rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white focus:outline-none"
              >
                <option value="">Select Restaurant...</option>
                {restaurants.map(r => (
                  <option key={r._id} value={r._id}>{r.name}</option>
                ))}
              </select>

              <input
                type="date"
                value={settlementForm.periodStart}
                onChange={(e) => setSettlementForm(prev => ({ ...prev, periodStart: e.target.value }))}
                className="rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white focus:outline-none"
              />

              <input
                type="date"
                value={settlementForm.periodEnd}
                onChange={(e) => setSettlementForm(prev => ({ ...prev, periodEnd: e.target.value }))}
                className="rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white focus:outline-none"
              />
            </div>

            <Button size="sm" onClick={handleGenerateSettlement}>Generate Payout Batch</Button>
          </div>
        </div>
      )}

      {/* ── Tab Content: Promotions ─────────────────────────────────────────── */}
      {activeTab === 'promotions' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {coupons.map(c => (
              <div key={c._id} className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-cyan-400">{c.code}</span>
                  <Badge color={c.isActive ? 'green' : 'red'}>{c.isActive ? 'Active' : 'Expired'}</Badge>
                </div>
                <p className="text-xs text-slate-400">{c.description || `${c.discountValue}% Off on cart`}</p>
                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-500">
                  <span>Used: {c.usedCount || 0} times</span>
                  <button onClick={() => handleDeleteCoupon(c._id)} className="text-red-400 hover:underline">Remove</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Confirm Dialog & Modals ─────────────────────────────────────────── */}
      <ConfirmDialog 
        isOpen={confirmData.isOpen}
        onClose={() => setConfirmData({ ...confirmData, isOpen: false })}
        onConfirm={confirmData.onConfirm}
        title={confirmData.title}
        message={confirmData.message}
        confirmText={confirmData.confirmText}
        variant={confirmData.variant}
      />

      <CreateTenantModal
        isOpen={isCreateTenantOpen}
        onClose={() => setIsCreateTenantOpen(false)}
        onSuccess={loadDashboard}
      />

      <EditThemeModal
        isOpen={!!themeModalRestaurant}
        restaurant={themeModalRestaurant}
        onClose={() => setThemeModalRestaurant(null)}
        onSuccess={loadDashboard}
      />

      <EditDomainModal
        isOpen={!!domainModalRestaurant}
        restaurant={domainModalRestaurant}
        onClose={() => setDomainModalRestaurant(null)}
        onSuccess={loadDashboard}
      />
    </div>
  );
}
