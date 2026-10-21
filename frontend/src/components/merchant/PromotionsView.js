import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Filter, RefreshCcw, MoreVertical, Edit3, 
  Ticket, Calendar, Percent, CreditCard, CheckCircle, 
  XCircle, Smartphone, Globe, ShoppingBag, ArrowRight, BarChart, Trash2
} from 'lucide-react';
import { couponAPI } from '@/lib/api';
import { showToast, PageLoader, ConfirmModal } from '@/components/ui';
import PromotionModal from './PromotionModal';
import StatCard from './StatCard';

export default function PromotionsView() {
  const [activeTab, setActiveTab] = useState('All Promotions');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All Types');
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [filterChannel, setFilterChannel] = useState('All Channels');
  const [stats, setStats] = useState(null);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [defaultPromoType, setDefaultPromoType] = useState('Coupon');
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchData();
  }, []);
  
  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchData = async () => {
    try {
      // setLoading(true);
      const [statsRes, promosRes] = await Promise.all([
        couponAPI.getStats(),
        couponAPI.getAll()
      ]);
      setStats(statsRes?.data);
      setPromotions(promosRes?.data || []);
    } catch (err) {
      console.error('Failed to load promotions data', err);
      showToast('Failed to load promotions data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getDaysLeft = (endDate) => {
    const diffTime = new Date(endDate) - new Date();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? `${diffDays} days left` : 'Expired';
  };

  const renderChannelIcons = (channels) => {
    const ch = channels || ['Mobile', 'Web'];
    return (
      <div className="flex gap-2 items-center text-[#dc2626]">
        {ch.includes('Mobile') && <Smartphone className="w-3.5 h-3.5" />}
        {ch.includes('Web') && <Globe className="w-3.5 h-3.5" />}
        {ch.includes('Dine-In') && <ShoppingBag className="w-3.5 h-3.5" />}
      </div>
    );
  };

  const handleAction = (msg) => {
    setSelectedPromo(null);
    setDefaultPromoType(msg.replace('Create ', ''));
    setIsModalOpen(true);
  };

  const handleEdit = (promo) => {
    setSelectedPromo(promo);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Promotion',
      message: 'Are you sure you want to delete this promotion? It will no longer be available to customers.',
      onConfirm: async () => {
        try {
          await couponAPI.delete(id);
          showToast('Promotion deleted successfully', 'success');
          fetchData();
        } catch (err) {
          showToast('Failed to delete promotion', 'error');
        }
      }
    });
  };

  const filteredPromotions = promotions.filter(promo => {
    // tab Filter
    let tabMatch = activeTab === 'All Promotions';
    if (!tabMatch) {
      if (activeTab === 'Coupons') tabMatch = promo.promoType === 'Coupon';
      else if (activeTab === 'Combo Offers') tabMatch = promo.promoType === 'Combo Offer';
      else if (activeTab === 'Happy Hours') tabMatch = promo.promoType === 'Happy Hour';
      else if (activeTab === 'Seasonal Offers') tabMatch = promo.promoType === 'Seasonal Offer';
      else if (activeTab === 'Referral Offers') tabMatch = promo.promoType === 'Referral Offer';
      else tabMatch = promo.promoType === activeTab;
    }

    // search Filter
    const searchMatch = !searchTerm || 
      (promo.name && promo.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (promo.code && promo.code.toLowerCase().includes(searchTerm.toLowerCase()));
      
    // type Filter
    const typeMatch = filterType === 'All Types' || promo.promoType === filterType;
    
    // status Filter
    const isExpired = getDaysLeft(promo.endDate) === 'Expired' || !promo.isActive;
    const statusMatch = filterStatus === 'All Status' || 
      (filterStatus === 'Active' && !isExpired) || 
      (filterStatus === 'Expired' && isExpired);
      
    // channel Filter
    const channels = promo.channels || ['Mobile', 'Web'];
    const channelMatch = filterChannel === 'All Channels' || channels.includes(filterChannel);

    return tabMatch && searchMatch && typeMatch && statusMatch && channelMatch;
  });

  // reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, filterType, filterStatus, filterChannel]);

  const totalPages = Math.ceil(filteredPromotions.length / itemsPerPage);
  const paginatedPromotions = filteredPromotions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading || !stats) {
    return <PageLoader text="Loading Promotions & Coupons..." />;
  }

  return (
    <div className="space-y-6 pb-10 text-admin-text">
      
      {/* Title Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 px-1">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-admin-text tracking-tight">
            Promotions & Coupons
          </h1>
          <p className="text-xs sm:text-sm text-admin-text-secondary mt-1">
            Create, manage and track your restaurant promotions, discounts, and customer incentives.
          </p>
        </div>
        <div>
          <button 
            onClick={() => { setSelectedPromo(null); setIsModalOpen(true); }} 
            className="flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold hover:brightness-110 transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create Promotion
          </button>
        </div>
      </div>

      {/* 5 Stats Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5 sm:gap-4 px-1">
        <StatCard 
          label="Total Promotions" 
          value={stats.totalPromotions} 
          icon={Ticket} 
          color="bg-amber-500/15 text-amber-500" 
          trend={`${Math.abs(stats.trends?.promotions || 0).toFixed(1)}%`}
          up={stats.trends?.promotions >= 0}
        />
        <StatCard 
          label="Active Promotions" 
          value={stats.activePromotions} 
          icon={Percent} 
          color="bg-emerald-500/15 text-emerald-500" 
          trend={`${Math.abs(stats.trends?.promotions || 0).toFixed(1)}%`}
          up={stats.trends?.promotions >= 0}
        />
        <StatCard 
          label="Coupons Redeemed" 
          value={stats.couponsRedeemed.toLocaleString()} 
          icon={Ticket} 
          color="bg-purple-500/15 text-purple-500" 
          trend={`${Math.abs(stats.trends?.redemptions || 0).toFixed(1)}%`}
          up={stats.trends?.redemptions >= 0}
        />
        <StatCard 
          label="Total Discount Given" 
          value={`$${stats.totalDiscountGiven.toLocaleString(undefined, {minimumFractionDigits: 2})}`} 
          icon={CreditCard} 
          color="bg-blue-500/15 text-blue-500" 
          trend={`${Math.abs(stats.trends?.discount || 0).toFixed(1)}%`}
          up={stats.trends?.discount >= 0}
        />
        <StatCard 
          label="Revenue From Promo" 
          value={`$${stats.revenueFromPromo.toLocaleString(undefined, {minimumFractionDigits: 2})}`} 
          icon={BarChart} 
          color="bg-rose-500/15 text-rose-500" 
          trend={`${Math.abs(stats.trends?.revenue || 0).toFixed(1)}%`}
          up={stats.trends?.revenue >= 0}
        />
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3 bg-admin-card p-2 rounded-2xl shadow-sm border border-admin-border items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-text-muted pointer-events-none" />
          <input 
            type="text" 
            placeholder="Search by name or code..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-admin-surface border border-admin-border rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-admin-text placeholder:text-admin-text-muted outline-none focus:border-brand transition-colors" 
          />
        </div>
        <select 
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-admin-surface border border-admin-border rounded-xl px-3 py-2 text-xs font-semibold text-admin-text outline-none focus:border-brand cursor-pointer transition-colors"
        >
          <option>All Types</option>
          <option>Coupon</option>
          <option>Offer</option>
          <option>Combo Offer</option>
          <option>Seasonal Offer</option>
          <option>Referral Offer</option>
        </select>
        <select 
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-admin-surface border border-admin-border rounded-xl px-3 py-2 text-xs font-semibold text-admin-text outline-none focus:border-brand cursor-pointer transition-colors"
        >
          <option>All Status</option>
          <option>Active</option>
          <option>Expired</option>
        </select>
        <select 
          value={filterChannel}
          onChange={(e) => setFilterChannel(e.target.value)}
          className="bg-admin-surface border border-admin-border rounded-xl px-3 py-2 text-xs font-semibold text-admin-text outline-none focus:border-brand cursor-pointer transition-colors"
        >
          <option>All Channels</option>
          <option>Mobile</option>
          <option>Web</option>
          <option>Instore</option>
        </select>
        <button 
          onClick={() => { setSearchTerm(''); setFilterType('All Types'); setFilterStatus('All Status'); setFilterChannel('All Channels'); }}
          className="flex items-center gap-1.5 text-admin-text-secondary hover:text-admin-text px-3 py-2 text-xs font-semibold transition-colors cursor-pointer"
        >
          <RefreshCcw className="w-3.5 h-3.5" /> Reset Filters
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Left Col: Main Table */}
        <div className="xl:col-span-3 space-y-4">
          <div className="bg-admin-card border border-admin-border rounded-2xl shadow-sm flex flex-col overflow-hidden">
            
            {/* Tabs inside table */}
            <div className="border-b border-admin-border flex items-center gap-6 px-5 pt-2 overflow-x-auto hide-scrollbar bg-admin-surface">
              {['All Promotions', 'Coupons', 'Combo Offers', 'Happy Hours', 'Seasonal Offers', 'Referral Offers'].map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-3 text-xs font-bold transition-colors border-b-2 whitespace-nowrap cursor-pointer ${activeTab === tab ? 'border-brand text-brand' : 'border-transparent text-admin-text-secondary hover:text-admin-text'}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[850px]">
                <thead className="bg-admin-surface-light border-b border-admin-border text-admin-text-secondary">
                  <tr className="text-xs font-bold uppercase tracking-wider">
                    <th className="px-5 py-3.5">Promotion</th>
                    <th className="px-5 py-3.5">Type</th>
                    <th className="px-5 py-3.5">Offer Details</th>
                    <th className="px-5 py-3.5">Channel</th>
                    <th className="px-5 py-3.5">Validity</th>
                    <th className="px-5 py-3.5">Usage</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-border">
                  {paginatedPromotions.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-5 py-12 text-center text-xs font-bold text-admin-text-muted">No Promotions Found.</td>
                    </tr>
                  ) : (
                    paginatedPromotions.map((promo, idx) => {
                      const daysLeftText = getDaysLeft(promo.endDate);
                      const isExpired = daysLeftText === 'Expired' || !promo.isActive;
                      
                      let typeBg = "bg-purple-500/10 text-purple-500 border border-purple-500/20";
                      if (promo.promoType === 'Combo Offer') typeBg = "bg-amber-500/10 text-amber-500 border border-amber-500/20";
                      else if (promo.promoType === 'Offer') typeBg = "bg-blue-500/10 text-blue-500 border border-blue-500/20";
                      else if (promo.promoType === 'Happy Hour') typeBg = "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20";
                      else if (promo.promoType === 'Seasonal Offer') typeBg = "bg-teal-500/10 text-teal-500 border border-teal-500/20";
                      else if (promo.promoType === 'Referral Offer') typeBg = "bg-rose-500/10 text-rose-500 border border-rose-500/20";

                      return (
                        <tr key={promo._id || idx} className="hover:bg-admin-surface-light/40 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-admin-surface-light text-admin-text flex items-center justify-center shrink-0 border border-admin-border text-[11px] font-extrabold shadow-2xs">
                                <span>{promo.value}{promo.type === 'percentage' ? '%' : '$'} OFF</span>
                              </div>
                              <div>
                                <p className="text-xs font-bold text-admin-text truncate max-w-[150px]" title={promo.name || promo.description}>{promo.name || promo.description}</p>
                                <p className="text-xs text-admin-text-secondary mt-0.5">Code: <span className="font-mono font-bold text-admin-text">{promo.code}</span></p>
                                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                  {promo.source === 'invite_and_earn' || (!promo.createdBy && promo.promoType === 'Referral Offer') ? (
                                    <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-500 border border-purple-500/20">
                                      🎁 Invite & Earn
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                      ⚡ Admin Created
                                    </span>
                                  )}
                                  {promo.applicableUsers && promo.applicableUsers.length > 0 && (
                                    <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-500 border border-blue-500/20">
                                      👤 {promo.applicableUsers.length === 1 ? '1 User Exclusive' : `${promo.applicableUsers.length} Users Exclusive`}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${typeBg}`}>{promo.promoType}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <p className="text-xs font-bold text-admin-text">{promo.type === 'percentage' ? `${promo.value}% OFF` : `Flat $${promo.value} OFF`}</p>
                            <p className="text-xs text-admin-text-secondary mt-0.5">{promo.minCartValue ? `Min. Order $${promo.minCartValue}` : 'on selected items'}</p>
                          </td>
                          <td className="px-5 py-3.5">
                            {renderChannelIcons(promo.channels)}
                          </td>
                          <td className="px-5 py-3.5">
                            <p className="text-xs font-bold text-admin-text">
                              {new Date(promo.startDate).toLocaleDateString('en-US', {month: 'short', day: '2-digit'})} - {new Date(promo.endDate).toLocaleDateString('en-US', {month: 'short', day: '2-digit', year: 'numeric'})}
                            </p>
                            <p className={`text-xs font-bold mt-0.5 ${isExpired ? 'text-rose-500' : 'text-emerald-500'}`}>{daysLeftText}</p>
                          </td>
                          <td className="px-5 py-3.5">
                            <p className="text-xs font-bold text-admin-text">{promo.usedCount || 0} {promo.maxUses ? `/ ${promo.maxUses}` : ''}</p>
                            <p className="text-xs text-admin-text-secondary">Used</p>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${isExpired ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                              {isExpired ? 'Expired' : 'Active'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-center relative">
                             <div className="flex items-center justify-center gap-1.5">
                                <button onClick={() => handleEdit(promo)} title="Edit Promotion" className="w-7 h-7 rounded-lg border border-admin-border flex items-center justify-center text-admin-text-secondary hover:bg-admin-surface hover:text-admin-text transition-colors cursor-pointer"><Edit3 className="w-3.5 h-3.5" /></button>
                                <button 
                                  onClick={() => handleDelete(promo._id)} 
                                  title="Delete Promotion"
                                  className="w-7 h-7 rounded-lg border border-rose-500/20 flex items-center justify-center text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                             </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-admin-border flex justify-between items-center bg-admin-surface">
               <span className="text-xs text-admin-text-secondary">
                 Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredPromotions.length)} of {filteredPromotions.length} promotions
               </span>
               {totalPages > 1 && (
                 <div className="flex items-center gap-1">
                   <button 
                     onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                     disabled={currentPage === 1}
                     className="w-7 h-7 flex items-center justify-center rounded-lg border border-admin-border bg-admin-surface text-admin-text-secondary hover:bg-admin-surface-light disabled:opacity-40 cursor-pointer text-xs"
                   >
                     &lt;
                   </button>
                   {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                     <button 
                       key={page}
                       onClick={() => setCurrentPage(page)}
                       className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold cursor-pointer transition-colors ${currentPage === page ? 'bg-brand text-white' : 'border border-admin-border bg-admin-surface text-admin-text hover:bg-admin-surface-light'}`}
                     >
                       {page}
                     </button>
                   ))}
                   <button 
                     onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                     disabled={currentPage === totalPages}
                     className="w-7 h-7 flex items-center justify-center rounded-lg border border-admin-border bg-admin-surface text-admin-text hover:bg-admin-surface-light font-bold disabled:opacity-40 cursor-pointer text-xs"
                   >
                     &gt;
                   </button>
                 </div>
               )}
            </div>

          </div>
        </div>

        {/* Right Col: Performance & Quick Actions */}
        <div className="xl:col-span-1 space-y-6">
          
          {/* Performance Overview */}
          <div className="bg-admin-card border border-admin-border rounded-2xl shadow-sm p-5">
            <div className="flex justify-between items-center border-b border-admin-border pb-3 mb-4">
              <h3 className="font-heading text-sm font-bold text-admin-text">Performance Overview</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-admin-text-secondary">Total Redemptions</span>
                <span className="text-xs font-bold text-admin-text font-heading">{stats.couponsRedeemed.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-admin-text-secondary">Redemption Rate</span>
                <span className="text-xs font-bold text-admin-text font-heading">{stats.redemptionRate || 0}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-admin-text-secondary">Total Discount Given</span>
                <span className="text-xs font-bold text-admin-text font-heading">${stats.totalDiscountGiven.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-admin-text-secondary">Revenue From Promo</span>
                <span className="text-xs font-bold text-admin-text font-heading">${stats.revenueFromPromo.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
            </div>
          </div>

          {/* Top Performing Promotions */}
          <div className="bg-admin-card border border-admin-border rounded-2xl shadow-sm p-5">
            <div className="flex justify-between items-center border-b border-admin-border pb-3 mb-4">
              <h3 className="font-heading text-sm font-bold text-admin-text">Top Performing Promotions</h3>
            </div>

            <div className="space-y-4">
              {(stats.topPromotions || []).map((promo, idx) => (
                <div key={promo.code} className="flex justify-between items-center group cursor-pointer hover:bg-admin-surface-light -mx-2 px-2 py-1.5 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-brand/10 text-brand flex items-center justify-center text-xs font-black shrink-0 border border-brand/20">{idx + 1}</div>
                    <div className="w-9 h-9 rounded-xl bg-admin-surface-light text-admin-text flex items-center justify-center shrink-0 border border-admin-border text-[10px] font-extrabold shadow-2xs">
                       PROMO
                    </div>
                    <div>
                      <p className="text-xs font-bold text-admin-text truncate max-w-[120px]" title={promo.name}>{promo.name}</p>
                      <p className="text-xs text-admin-text-secondary">{promo.redemptions} Redemptions</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-admin-text font-heading">${(promo.revenue || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
              ))}
              {stats.topPromotions?.length === 0 && (
                <p className="text-xs font-semibold text-admin-text-muted text-center italic py-2">No active promotions</p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-admin-card border border-admin-border rounded-2xl shadow-sm p-5">
            <h3 className="font-heading text-sm font-bold text-admin-text mb-4">Quick Actions</h3>
            
            <div className="grid grid-cols-2 gap-2.5">
              <button onClick={() => handleAction('Create Coupon')} className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 text-left hover:bg-purple-500/20 transition-colors cursor-pointer">
                <Ticket className="w-4 h-4 text-purple-500 shrink-0" />
                <span className="text-xs font-bold text-admin-text">Coupon</span>
              </button>
              <button onClick={() => handleAction('Create Offer')} className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-left hover:bg-amber-500/20 transition-colors cursor-pointer">
                <Percent className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="text-xs font-bold text-admin-text">Offer</span>
              </button>
              <button onClick={() => handleAction('Create Combo Offer')} className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-left hover:bg-emerald-500/20 transition-colors cursor-pointer">
                <ShoppingBag className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-xs font-bold text-admin-text">Combo</span>
              </button>
              <button onClick={() => handleAction('Create Seasonal Offer')} className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-left hover:bg-blue-500/20 transition-colors cursor-pointer">
                <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="text-xs font-bold text-admin-text">Seasonal</span>
              </button>
            </div>
          </div>

        </div>
      </div>
      
      <PromotionModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setSelectedPromo(null); }} 
        onSuccess={fetchData} 
        editPromo={selectedPromo}
        defaultPromoType={defaultPromoType}
      />

      <ConfirmModal
        {...confirmConfig}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
      />
    </div>
  );
}
