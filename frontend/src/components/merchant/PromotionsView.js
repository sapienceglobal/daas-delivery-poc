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
    // Tab Filter
    let tabMatch = activeTab === 'All Promotions';
    if (!tabMatch) {
      if (activeTab === 'Coupons') tabMatch = promo.promoType === 'Coupon';
      else if (activeTab === 'Combo Offers') tabMatch = promo.promoType === 'Combo Offer';
      else if (activeTab === 'Happy Hours') tabMatch = promo.promoType === 'Happy Hour';
      else if (activeTab === 'Seasonal Offers') tabMatch = promo.promoType === 'Seasonal Offer';
      else if (activeTab === 'Referral Offers') tabMatch = promo.promoType === 'Referral Offer';
      else tabMatch = promo.promoType === activeTab;
    }

    // Search Filter
    const searchMatch = !searchTerm || 
      (promo.name && promo.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (promo.code && promo.code.toLowerCase().includes(searchTerm.toLowerCase()));
      
    // Type Filter
    const typeMatch = filterType === 'All Types' || promo.promoType === filterType;
    
    // Status Filter
    const isExpired = getDaysLeft(promo.endDate) === 'Expired' || !promo.isActive;
    const statusMatch = filterStatus === 'All Status' || 
      (filterStatus === 'Active' && !isExpired) || 
      (filterStatus === 'Expired' && isExpired);
      
    // Channel Filter
    const channels = promo.channels || ['Mobile', 'Web'];
    const channelMatch = filterChannel === 'All Channels' || channels.includes(filterChannel);

    return tabMatch && searchMatch && typeMatch && statusMatch && channelMatch;
  });

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, filterType, filterStatus, filterChannel]);

  const totalPages = Math.ceil(filteredPromotions.length / itemsPerPage);
  const paginatedPromotions = filteredPromotions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading || !stats) {
    return <PageLoader text="Loading Promotions & Coupons..." />;
  }

  return (
    <div className="space-y-6 pb-10">
      
      {/* Title Area */}
      <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#111827]">Promotions & Coupons</h1>
          <p className="text-sm text-[#6b7280] mt-1">Create, manage and track your restaurant promotions and discounts.</p>
        </div>
        <div>
          <button onClick={() => { setSelectedPromo(null); setIsModalOpen(true); }} className="flex items-center gap-1.5 bg-[#8b0000] text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-[#7f0000] transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Create Promotion
          </button>
        </div>
      </div>

      {/* 5 Stats Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard 
          title="Total Promotions" 
          value={stats.totalPromotions} 
          icon={Ticket} 
          iconColor="text-[#ea580c]" 
          iconBg="bg-[#ffedd5]" 
          trend={{ 
            direction: stats.trends?.promotions >= 0 ? 'up' : 'down', 
            value: `${Math.abs(stats.trends?.promotions || 0).toFixed(1)}%`, 
            subtitle: 'vs last month' 
          }} 
        />
        <StatCard 
          title="Active Promotions" 
          value={stats.activePromotions} 
          icon={Percent} 
          iconColor="text-[#16a34a]" 
          iconBg="bg-[#dcfce7]" 
          trend={{ 
            direction: stats.trends?.promotions >= 0 ? 'up' : 'down', 
            value: `${Math.abs(stats.trends?.promotions || 0).toFixed(1)}%`, 
            subtitle: 'vs last month' 
          }} 
        />
        <StatCard 
          title="Coupons Redeemed" 
          value={stats.couponsRedeemed.toLocaleString()} 
          icon={Ticket} 
          iconColor="text-[#9333ea]" 
          iconBg="bg-[#f3e8ff]" 
          trend={{ 
            direction: stats.trends?.redemptions >= 0 ? 'up' : 'down', 
            value: `${Math.abs(stats.trends?.redemptions || 0).toFixed(1)}%`, 
            subtitle: 'vs last month' 
          }} 
        />
        <StatCard 
          title="Total Discount Given" 
          value={`$${stats.totalDiscountGiven.toLocaleString(undefined, {minimumFractionDigits: 2})}`} 
          icon={CreditCard} 
          iconColor="text-[#3b82f6]" 
          iconBg="bg-[#eff6ff]" 
          trend={{ 
            direction: stats.trends?.discount >= 0 ? 'up' : 'down', 
            value: `${Math.abs(stats.trends?.discount || 0).toFixed(1)}%`, 
            subtitle: 'vs last month' 
          }} 
        />
        <StatCard 
          title="Revenue From Promo" 
          value={`$${stats.revenueFromPromo.toLocaleString(undefined, {minimumFractionDigits: 2})}`} 
          icon={BarChart} 
          iconColor="text-[#dc2626]" 
          iconBg="bg-[#fee2e2]" 
          trend={{ 
            direction: stats.trends?.revenue >= 0 ? 'up' : 'down', 
            value: `${Math.abs(stats.trends?.revenue || 0).toFixed(1)}%`, 
            subtitle: 'vs last month' 
          }} 
        />
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af] pointer-events-none" />
          <input 
            type="text" 
            placeholder="Search by name or code..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-[#e5e7eb] rounded-lg !pl-10 py-2 text-sm focus:outline-none focus:border-[#8b0000] text-[#111827]" 
          />
        </div>
        <select 
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-white border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm font-medium outline-none text-[#111827] focus:border-[#8b0000]"
        >
          <option className="bg-white text-[#111827]">All Types</option>
          <option className="bg-white text-[#111827]">Coupon</option>
          <option className="bg-white text-[#111827]">Offer</option>
          <option className="bg-white text-[#111827]">Combo Offer</option>
          <option className="bg-white text-[#111827]">Seasonal Offer</option>
        </select>
        <select 
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-white border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm font-medium outline-none text-[#111827] focus:border-[#8b0000]"
        >
          <option className="bg-white text-[#111827]">All Status</option>
          <option className="bg-white text-[#111827]">Active</option>
          <option className="bg-white text-[#111827]">Expired</option>
        </select>
        <select 
          value={filterChannel}
          onChange={(e) => setFilterChannel(e.target.value)}
          className="bg-white border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm font-medium outline-none text-[#111827] focus:border-[#8b0000]"
        >
          <option className="bg-white text-[#111827]">All Channels</option>
          <option className="bg-white text-[#111827]">Mobile</option>
          <option className="bg-white text-[#111827]">Web</option>
          <option className="bg-white text-[#111827]">Instore</option>
        </select>
        <button 
          onClick={() => { setSearchTerm(''); setFilterType('All Types'); setFilterStatus('All Status'); setFilterChannel('All Channels'); }}
          className="flex items-center gap-2 text-[#6b7280] hover:text-[#111827] px-3 py-2 text-sm font-medium transition-colors"
        >
          <RefreshCcw className="w-4 h-4" /> Reset Filters
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Left Col: Main Table */}
        <div className="xl:col-span-3 space-y-4">
          <div className="bg-white border border-[#e5e7eb] rounded-[16px] shadow-sm flex flex-col overflow-hidden">
            
            {/* Tabs inside table */}
            <div className="border-b border-[#e5e7eb] flex items-center gap-8 px-4 pt-2">
              {['All Promotions', 'Coupons', 'Combo Offers', 'Happy Hours', 'Seasonal Offers', 'Referral Offers'].map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-3 text-[12px] font-extrabold transition-colors border-b-2 ${activeTab === tab ? 'border-[#991b1b] text-[#991b1b]' : 'border-transparent text-[#6b7280] hover:text-[#374151]'}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto pb-32">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#f3f4f6]">
                    <th className="px-5 py-4 text-xs font-extrabold text-[#6b7280] uppercase tracking-wider">Promotion</th>
                    <th className="px-5 py-4 text-xs font-extrabold text-[#6b7280] uppercase tracking-wider">Type</th>
                    <th className="px-5 py-4 text-xs font-extrabold text-[#6b7280] uppercase tracking-wider">Offer Details</th>
                    <th className="px-5 py-4 text-xs font-extrabold text-[#6b7280] uppercase tracking-wider">Channel</th>
                    <th className="px-5 py-4 text-xs font-extrabold text-[#6b7280] uppercase tracking-wider">Validity</th>
                    <th className="px-5 py-4 text-xs font-extrabold text-[#6b7280] uppercase tracking-wider">Usage</th>
                    <th className="px-5 py-4 text-xs font-extrabold text-[#6b7280] uppercase tracking-wider">Status</th>
                    <th className="px-5 py-4 text-xs font-extrabold text-[#6b7280] uppercase tracking-wider text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f9fafb]">
                  {paginatedPromotions.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-5 py-10 text-center text-[12px] font-bold text-[#9ca3af]">No Promotions Found.</td>
                    </tr>
                  ) : (
                    paginatedPromotions.map((promo, idx) => {
                      const daysLeftText = getDaysLeft(promo.endDate);
                      const isExpired = daysLeftText === 'Expired' || !promo.isActive;
                      
                      let typeBg = "bg-[#f3e8ff] text-[#9333ea]";
                      if (promo.promoType === 'Combo Offer') typeBg = "bg-[#ffedd5] text-[#ea580c]";
                      else if (promo.promoType === 'Offer') typeBg = "bg-[#eff6ff] text-[#3b82f6]";
                      else if (promo.promoType === 'Happy Hour') typeBg = "bg-[#dcfce7] text-[#16a34a]";
                      else if (promo.promoType === 'Seasonal Offer') typeBg = "bg-[#dcfce7] text-[#16a34a]";
                      else if (promo.promoType === 'Referral Offer') typeBg = "bg-[#fee2e2] text-[#dc2626]";

                      return (
                        <tr key={promo._id || idx} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-[#292524] text-white flex items-center justify-center shrink-0 border border-[#44403c] text-xs font-black overflow-hidden relative">
                                <span className="z-10">{promo.value}{promo.type === 'percentage' ? '%' : '$'} OFF</span>
                                <div className="absolute inset-0 bg-black opacity-20 mix-blend-overlay"></div>
                              </div>
                              <div>
                                <p className="text-[12px] font-bold text-[#111827] truncate max-w-[150px]" title={promo.name || promo.description}>{promo.name || promo.description}</p>
                                <p className="text-xs text-[#6b7280]">Code: {promo.code}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <span className={`text-xs font-bold px-2 py-1 rounded ${typeBg}`}>{promo.promoType}</span>
                          </td>
                          <td className="px-5 py-3">
                            <p className="text-xs font-bold text-[#374151]">{promo.type === 'percentage' ? `${promo.value}% OFF` : `Flat $${promo.value} OFF`}</p>
                            <p className="text-xs text-[#6b7280]">{promo.minCartValue ? `Min. Order $${promo.minCartValue}` : 'on selected items'}</p>
                          </td>
                          <td className="px-5 py-3">
                            {renderChannelIcons(promo.channels)}
                          </td>
                          <td className="px-5 py-3">
                            <p className="text-xs font-bold text-[#374151]">
                              {new Date(promo.startDate).toLocaleDateString('en-US', {month: 'short', day: '2-digit'})} - {new Date(promo.endDate).toLocaleDateString('en-US', {month: 'short', day: '2-digit', year: 'numeric'})}
                            </p>
                            <p className={`text-xs font-bold ${isExpired ? 'text-[#dc2626]' : 'text-[#16a34a]'}`}>{daysLeftText}</p>
                          </td>
                          <td className="px-5 py-3">
                            <p className="text-xs font-bold text-[#374151]">{promo.usedCount || 0}</p>
                            <p className="text-xs text-[#6b7280]">Used</p>
                          </td>
                          <td className="px-5 py-3">
                            <span className={`text-xs font-bold px-2 py-1 rounded ${isExpired ? 'bg-[#fef2f2] text-[#dc2626]' : 'bg-[#f0fdf4] text-[#16a34a]'}`}>
                              {isExpired ? 'Expired' : 'Active'}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-center relative">
                             <div className="flex items-center justify-center gap-2">
                                <button onClick={() => handleEdit(promo)} title="Edit Promotion" className="w-7 h-7 rounded border border-[#e5e7eb] flex items-center justify-center text-[#6b7280] hover:bg-gray-50 hover:text-[#374151] transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                                <button 
                                  onClick={() => handleDelete(promo._id)} 
                                  title="Delete Promotion"
                                  className="w-7 h-7 rounded border border-[#e5e7eb] flex items-center justify-center text-[#ef4444] hover:bg-red-50 hover:border-red-200 transition-colors"
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

            <div className="p-4 border-t border-[#f3f4f6] flex justify-between items-center bg-[#f9fafb]">
               <span className="text-xs text-[#6b7280]">
                 Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredPromotions.length)} of {filteredPromotions.length} promotions
               </span>
               {totalPages > 1 && (
                 <div className="flex items-center gap-1">
                   <button 
                     onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                     disabled={currentPage === 1}
                     className="w-7 h-7 flex items-center justify-center rounded border border-[#e5e7eb] bg-white text-[#9ca3af] hover:bg-gray-50 disabled:opacity-50"
                   >
                     &lt;
                   </button>
                   {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                     <button 
                       key={page}
                       onClick={() => setCurrentPage(page)}
                       className={`w-7 h-7 flex items-center justify-center rounded font-bold ${currentPage === page ? 'bg-[#8b0000] text-white border-transparent' : 'border border-[#e5e7eb] bg-white text-[#374151] hover:bg-gray-50'}`}
                     >
                       {page}
                     </button>
                   ))}
                   <button 
                     onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                     disabled={currentPage === totalPages}
                     className="w-7 h-7 flex items-center justify-center rounded border border-[#e5e7eb] bg-white text-[#374151] hover:bg-gray-50 font-bold disabled:opacity-50"
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
          <div className="bg-white border border-[#e5e7eb] rounded-[16px] shadow-sm p-5">
            <div className="flex justify-between items-center border-b border-[#f3f4f6] pb-3 mb-4">
              <h3 className="text-[14px] font-bold text-[#111827]">Performance Overview</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#6b7280]">Total Redemptions</span>
                <span className="text-[12px] font-black text-[#111827]">{stats.couponsRedeemed.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#6b7280]">Redemption Rate</span>
                <span className="text-[12px] font-black text-[#111827]">{stats.redemptionRate || 0}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#6b7280]">Total Discount Given</span>
                <span className="text-[12px] font-black text-[#111827]">${stats.totalDiscountGiven.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#6b7280]">Revenue From Promo</span>
                <span className="text-[12px] font-black text-[#111827]">${stats.revenueFromPromo.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
            </div>
          </div>

          {/* Top Performing Promotions */}
          <div className="bg-white border border-[#e5e7eb] rounded-[16px] shadow-sm p-5">
            <div className="flex justify-between items-center border-b border-[#f3f4f6] pb-3 mb-4">
              <h3 className="text-[14px] font-bold text-[#111827]">Top Performing Promotions</h3>
            </div>

            <div className="space-y-4">
              {(stats.topPromotions || []).map((promo, idx) => (
                <div key={promo.code} className="flex justify-between items-center group cursor-pointer hover:bg-gray-50 -mx-2 px-2 py-1.5 rounded transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#fef2f2] text-[#dc2626] flex items-center justify-center text-xs font-black shrink-0 border border-[#fecaca]">{idx + 1}</div>
                    <div className="w-10 h-10 rounded-lg bg-[#292524] text-white flex items-center justify-center shrink-0 border border-[#44403c] text-xs font-black">
                       PROMO
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#111827] truncate max-w-[120px]" title={promo.name}>{promo.name}</p>
                      <p className="text-xs text-[#6b7280]">{promo.redemptions} Redemptions</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-[#111827]">${(promo.revenue || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
              ))}
              {stats.topPromotions?.length === 0 && (
                <p className="text-xs font-bold text-[#6b7280] text-center italic py-2">No active promotions</p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-[#e5e7eb] rounded-[16px] shadow-sm p-5">
            <h3 className="text-[14px] font-bold text-[#111827] mb-4">Quick Actions</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => handleAction('Create Coupon')} className="flex items-center gap-2 bg-[#f3e8ff] border border-[#e9d5ff] rounded-lg p-3 text-left hover:bg-[#faf5ff] transition-colors">
                <Ticket className="w-4 h-4 text-[#9333ea]" />
                <span className="text-xs font-bold text-[#111827]">Create Coupon</span>
              </button>
              <button onClick={() => handleAction('Create Offer')} className="flex items-center gap-2 bg-[#ffedd5] border border-[#fed7aa] rounded-lg p-3 text-left hover:bg-[#fff7ed] transition-colors">
                <Percent className="w-4 h-4 text-[#ea580c]" />
                <span className="text-xs font-bold text-[#111827]">Create Offer</span>
              </button>
              <button onClick={() => handleAction('Create Combo Offer')} className="flex items-center gap-2 bg-[#dcfce7] border border-[#bbf7d0] rounded-lg p-3 text-left hover:bg-[#f0fdf4] transition-colors">
                <ShoppingBag className="w-4 h-4 text-[#16a34a]" />
                <span className="text-xs font-bold text-[#111827]">Create Combo Offer</span>
              </button>
              <button onClick={() => handleAction('Create Seasonal Offer')} className="flex items-center gap-2 bg-[#eff6ff] border border-[#bfdbfe] rounded-lg p-3 text-left hover:bg-[#f0f9ff] transition-colors">
                <Calendar className="w-4 h-4 text-[#3b82f6]" />
                <span className="text-xs font-bold text-[#111827]">Create Seasonal Offer</span>
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
