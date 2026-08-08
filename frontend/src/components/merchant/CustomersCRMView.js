import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, Filter, ChevronLeft, ChevronRight, UserPlus, 
  Upload, Users, Crown, Gift, Star, Eye, MoreVertical,
  MessageSquare, Tag, UsersRound, Download, XCircle, Phone, Mail, CheckCircle, Trash2, Power
} from 'lucide-react';
import { useMerchantContext } from '@/context/MerchantContext';
import { crmAPI } from '@/lib/api';
import { showToast } from '@/components/ui';
import StatCard from './StatCard';
import CustomerProfileModal from './CustomerProfileModal';

export default function CustomersCRMView({ customers = [], onAdd, onEdit, refreshData }) {
  const { roomId } = useMerchantContext();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [searchQuery, setSearchQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState('All Groups');
  const [tierFilter, setTierFilter] = useState('All Loyalty Tiers');
  const [statusFilter, setStatusFilter] = useState('All Status');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedProfileCustomer, setSelectedProfileCustomer] = useState(null);

  // Modals state
  const [promoModalOpen, setPromoModalOpen] = useState(false);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [targetIds, setTargetIds] = useState([]);

  // Filter Logic
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const searchStr = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        c.name?.toLowerCase().includes(searchStr) || 
        c.phone?.toLowerCase().includes(searchStr) ||
        c.email?.toLowerCase().includes(searchStr) ||
        c.customerId?.toLowerCase().includes(searchStr);

      const matchesGroup = groupFilter === 'All Groups' || c.group === groupFilter;
      const matchesTier = tierFilter === 'All Loyalty Tiers' || c.loyaltyTier === tierFilter;
      const matchesStatus = statusFilter === 'All Status' || c.status === statusFilter;

      return matchesSearch && matchesGroup && matchesTier && matchesStatus;
    });
  }, [customers, searchQuery, groupFilter, tierFilter, statusFilter]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCustomers.slice(start, start + itemsPerPage);
  }, [filteredCustomers, currentPage]);

  // Checkbox Logic
  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedIds(paginatedData.map(c => c._id));
    else setSelectedIds([]);
  };

  const handleSelectOne = (e, id) => {
    if (e.target.checked) setSelectedIds([...selectedIds, id]);
    else setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
  };

  const triggerBulkAction = (actionType, ids = selectedIds) => {
    setTargetIds(ids);
    if (actionType === 'promo') setPromoModalOpen(true);
    if (actionType === 'group') setGroupModalOpen(true);
    if (actionType === 'status') setStatusModalOpen(true);
    if (actionType === 'delete') setDeleteModalOpen(true);
  };

  const clearSelection = () => setSelectedIds([]);

  // Helper Badges
  const getTierBadge = (tier) => {
    switch (tier) {
      case 'Gold': return <span className="bg-[#fef3c7] text-[#b45309] font-bold text-xs px-2 py-1 rounded">Gold</span>;
      case 'Silver': return <span className="bg-[#f3f4f6] text-[#4b5563] font-bold text-xs px-2 py-1 rounded">Silver</span>;
      case 'Platinum': return <span className="bg-[#f3e8ff] text-[#7e22ce] font-bold text-xs px-2 py-1 rounded">Platinum</span>;
      case 'Bronze': return <span className="bg-[#ffedd5] text-[#c2410c] font-bold text-xs px-2 py-1 rounded">Bronze</span>;
      default: return <span className="bg-gray-100 text-gray-600 font-bold text-xs px-2 py-1 rounded">{tier || 'None'}</span>;
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'Active') return <span className="text-[#10B981] font-bold text-xs bg-[#10B981]/10 px-2 py-1 rounded">Active</span>;
    return <span className="text-[#DC2626] font-bold text-xs bg-[#DC2626]/10 px-2 py-1 rounded">Inactive</span>;
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] relative">
      {/* Top Header Row */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Customers & CRM</h1>
          <p className="text-sm text-[#6b7280] mt-1">Manage customer relationships, loyalty and communication.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-[#e5e7eb] rounded-lg px-4 py-2 text-sm text-[#374151] font-bold flex items-center gap-2 hover:bg-[#f9fafb]">
            <Upload className="w-4 h-4" /> Import
          </button>
          <button onClick={() => onAdd?.()} className="bg-[#8B0000] text-white rounded-lg px-4 py-2 text-sm font-bold flex items-center gap-2 hover:bg-red-900 transition-colors">
            <UserPlus className="w-4 h-4" /> Add Customer
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6 shrink-0">
        <StatCard 
          title="Total Customers" 
          value={customers.length.toLocaleString()} 
          icon={Users} 
          iconColor="text-[#ea580c]" 
          iconBg="bg-[#fff7ed]" 
          trend={{ direction: 'up', value: '18.7%', subtitle: 'vs last month' }} 
        />
        <StatCard 
          title="New Customers" 
          value={customers.filter(c => new Date(c.createdAt) > new Date(Date.now() - 30*24*60*60*1000)).length.toLocaleString()} 
          icon={UserPlus} 
          iconColor="text-[#10B981]" 
          iconBg="bg-[#ecfdf5]" 
          trend={{ direction: 'up', value: '14.3%', subtitle: 'vs last month' }} 
        />
        <StatCard 
          title="Loyalty Members" 
          value={customers.filter(c => c.loyaltyTier && c.loyaltyTier !== 'Bronze').length.toLocaleString()} 
          icon={Crown} 
          iconColor="text-[#a855f7]" 
          iconBg="bg-[#faf5ff]" 
          trend={{ direction: 'up', value: '22.5%', subtitle: 'vs last month' }} 
        />
        <StatCard 
          title="Repeat Customers" 
          value={customers.filter(c => c.totalOrders > 1).length.toLocaleString()} 
          icon={Gift} 
          iconColor="text-[#3b82f6]" 
          iconBg="bg-[#eff6ff]" 
          trend={{ direction: 'up', value: '16.8%', subtitle: 'vs last month' }} 
        />
        <StatCard 
          title="Top Customers" 
          value={customers.filter(c => c.totalSpent > 100).length.toLocaleString()} 
          icon={Star} 
          iconColor="text-[#ef4444]" 
          iconBg="bg-[#fef2f2]" 
          trend={{ direction: 'up', value: '11.2%', subtitle: 'vs last month' }} 
        />
      </div>

      {/* Main Container */}
      <div className="flex flex-1 gap-6 overflow-hidden pb-16">
        
        {/* Left Column - Main Table Area */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-[#e5e7eb] flex flex-col overflow-hidden custom-scrollbar relative">
          
          {/* Filters Bar */}
          <div className="p-4 border-b border-[#f3f4f6] flex flex-wrap gap-4 items-center justify-between shrink-0">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="w-4 h-4 text-[#9ca3af] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input 
                type="text" 
                placeholder="Search by name, phone or email..." 
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full !pl-10 py-2 rounded-lg border border-[#e5e7eb] text-sm text-[#111827] bg-[#f9fafb] outline-none focus:border-[#8b0000]"
              />
            </div>
            
            <div className="flex items-center gap-3 flex-wrap">
              <select 
                value={groupFilter} onChange={(e) => { setGroupFilter(e.target.value); setCurrentPage(1); }}
                className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#374151] font-medium outline-none"
              >
                <option>All Groups</option>
                <option>Family</option>
                <option>Friends</option>
                <option>Corporate</option>
                <option>Others</option>
              </select>

              <select 
                value={tierFilter} onChange={(e) => { setTierFilter(e.target.value); setCurrentPage(1); }}
                className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#374151] font-medium outline-none"
              >
                <option>All Loyalty Tiers</option>
                <option>Bronze</option>
                <option>Silver</option>
                <option>Gold</option>
                <option>Platinum</option>
              </select>

              <select 
                value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#374151] font-medium outline-none"
              >
                <option>All Status</option>
                <option>Active</option>
                <option>Inactive</option>
              </select>

              <button onClick={() => {
                setSearchQuery(''); setGroupFilter('All Groups'); setTierFilter('All Loyalty Tiers'); setStatusFilter('All Status');
              }} className="bg-white border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#374151] font-bold flex items-center gap-2 hover:bg-[#f9fafb]">
                <XCircle className="w-4 h-4" /> Reset
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto flex-1 custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead className="bg-white sticky top-0 z-10 border-b border-[#f3f4f6]">
                <tr className="text-xs font-bold text-[#6b7280] uppercase tracking-wider">
                  <th className="px-6 py-4 w-12 text-center">
                    <input type="checkbox" onChange={handleSelectAll} checked={selectedIds.length === paginatedData.length && paginatedData.length > 0} className="w-4 h-4 cursor-pointer rounded !bg-white border-gray-300 text-[#8B0000] focus:ring-[#8B0000] accent-[#8B0000]" />
                  </th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Group</th>
                  <th className="px-6 py-4 text-center">Loyalty Tier</th>
                  <th className="px-6 py-4 text-center">Total Orders</th>
                  <th className="px-6 py-4 text-right">Total Spent</th>
                  <th className="px-6 py-4">Last Order</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f9fafb]">
                {paginatedData.map((c) => (
                  <tr key={c._id} className={`transition-colors group ${selectedIds.includes(c._id) ? 'bg-[#8B0000]/5' : 'hover:bg-[#f9fafb]'}`}>
                    <td className="px-6 py-4 text-center">
                      <input type="checkbox" onChange={(e) => handleSelectOne(e, c._id)} checked={selectedIds.includes(c._id)} className="w-4 h-4 cursor-pointer rounded !bg-white border-gray-300 text-[#8B0000] focus:ring-[#8B0000] accent-[#8B0000]" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 cursor-pointer group/name" onClick={() => setSelectedProfileCustomer(c)}>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8B0000] to-[#5a0000] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm group-hover/name:opacity-90">
                          {c.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#111827] group-hover/name:text-[#8B0000] transition-colors">{c.name}</p>
                          <p className="text-xs text-[#6b7280]">{c.customerId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-[#374151] flex items-center gap-1.5"><Phone className="w-3 h-3 text-[#9ca3af]"/> {c.phone || '-'}</p>
                      <p className="text-xs text-[#6b7280] flex items-center gap-1.5 mt-0.5"><Mail className="w-3 h-3 text-[#9ca3af]"/> {c.email || '-'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-[#374151]">{c.group || 'Others'}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getTierBadge(c.loyaltyTier)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-bold text-[#111827]">{c.totalOrders || 0}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-[#111827]">${(c.totalSpent || 0).toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-[#374151] font-medium">{c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}) : '-'}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(c.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setSelectedProfileCustomer(c)} className="p-1.5 text-[#9ca3af] hover:text-[#374151] hover:bg-white rounded border border-transparent hover:border-[#e5e7eb]" title="View Profile"><Eye className="w-4 h-4" /></button>
                        <RowMenuDropdown onAction={(action) => triggerBulkAction(action, [c._id])} onEdit={() => onEdit?.(c)} />
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedData.length === 0 && (
                  <tr>
                    <td colSpan="10" className="p-8 text-center text-[#6b7280] text-sm">No customers found matching your criteria.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-4 border-t border-[#f3f4f6] flex items-center justify-between bg-white text-xs text-[#6b7280] shrink-0">
            <span>Showing {filteredCustomers.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredCustomers.length)} of {filteredCustomers.length.toLocaleString()} customers</span>
            <div className="flex items-center gap-4">
              <div className="flex gap-1">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1 border border-[#e5e7eb] rounded hover:bg-[#f9fafb] disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
                <button className="w-7 h-7 bg-[#8B0000] text-white rounded font-bold shadow-sm">{currentPage}</button>
                {currentPage < totalPages && <button className="w-7 h-7 text-[#374151] hover:bg-[#f9fafb] border border-transparent hover:border-[#e5e7eb] rounded font-bold" onClick={() => setCurrentPage(currentPage + 1)}>{currentPage + 1}</button>}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1 border border-[#e5e7eb] rounded hover:bg-[#f9fafb] disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar (Analytics snippet) */}
        <div className="w-[320px] shrink-0 overflow-y-auto custom-scrollbar space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-[#e5e7eb] p-5">
            <h3 className="text-sm font-bold text-[#111827] mb-4">Top Customers</h3>
            <div className="space-y-4">
              {[...customers].sort((a,b) => (b.totalSpent||0) - (a.totalSpent||0)).slice(0,5).map((c, i) => (
                <div key={c._id || i} className="flex justify-between items-center border-b border-[#f3f4f6] pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-[#6b7280]">{i+1}</div>
                    <div className="w-8 h-8 rounded-full bg-[#f3f4f6] text-[#4b5563] flex items-center justify-center font-bold text-xs shadow-sm">
                      {c.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#111827] flex items-center gap-1">
                        {c.name} {i < 3 && <Crown className="w-3 h-3 text-[#f59e0b]" />}
                      </p>
                      <p className="text-xs text-[#6b7280]">{c.totalOrders || 0} Orders</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#111827]">${(c.totalSpent || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#111827] text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-8 duration-300 z-50 border border-[#374151]">
          <div className="flex items-center gap-2 border-r border-[#374151] pr-6">
            <div className="w-6 h-6 bg-[#8B0000] text-white rounded-full flex items-center justify-center text-xs font-bold">
              {selectedIds.length}
            </div>
            <span className="text-sm font-bold text-gray-200">Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => triggerBulkAction('promo')} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[#374151] transition-colors text-sm font-medium text-gray-300 hover:text-white">
              <Tag className="w-4 h-4" /> Send Promo
            </button>
            <button onClick={() => triggerBulkAction('group')} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[#374151] transition-colors text-sm font-medium text-gray-300 hover:text-white">
              <UsersRound className="w-4 h-4" /> Group
            </button>
            <button onClick={() => triggerBulkAction('status')} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[#374151] transition-colors text-sm font-medium text-gray-300 hover:text-white">
              <Power className="w-4 h-4" /> Status
            </button>
            <button onClick={() => triggerBulkAction('delete')} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-red-900/50 text-red-400 hover:text-red-300 transition-colors text-sm font-medium">
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
          <button onClick={clearSelection} className="ml-2 p-1.5 rounded-full hover:bg-[#374151] text-gray-400 hover:text-white">
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Slide-over Profile Drawer */}
      {selectedProfileCustomer && (
        <CustomerProfileModal
          customer={selectedProfileCustomer}
          restaurantId={roomId}
          onClose={() => setSelectedProfileCustomer(null)}
        />
      )}

      {/* Action Modals */}
      {promoModalOpen && <PromoModal roomId={roomId} targetIds={targetIds} onClose={() => setPromoModalOpen(false)} onSuccess={() => { setPromoModalOpen(false); clearSelection(); refreshData?.(); }} />}
      {groupModalOpen && <GroupModal roomId={roomId} targetIds={targetIds} onClose={() => setGroupModalOpen(false)} onSuccess={() => { setGroupModalOpen(false); clearSelection(); refreshData?.(); }} />}
      {statusModalOpen && <StatusModal roomId={roomId} targetIds={targetIds} onClose={() => setStatusModalOpen(false)} onSuccess={() => { setStatusModalOpen(false); clearSelection(); refreshData?.(); }} />}
      {deleteModalOpen && <DeleteModal roomId={roomId} targetIds={targetIds} onClose={() => setDeleteModalOpen(false)} onSuccess={() => { setDeleteModalOpen(false); clearSelection(); refreshData?.(); }} />}
    </div>
  );
}

// ── ROW MENU DROPDOWN ───────────────────────────────────────────────────────
function RowMenuDropdown({ onAction, onEdit }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`p-1.5 rounded border transition-colors ${isOpen ? 'bg-white text-[#374151] border-[#e5e7eb]' : 'text-[#9ca3af] hover:text-[#374151] hover:bg-white border-transparent hover:border-[#e5e7eb]'}`}
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-[#e5e7eb] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
          {onEdit && (
            <button onClick={() => { setIsOpen(false); onEdit(); }} className="w-full text-left px-4 py-2 text-sm text-[#374151] font-medium hover:bg-[#f9fafb] hover:text-[#111827]">
              Edit Customer
            </button>
          )}
          <button onClick={() => { setIsOpen(false); onAction('promo'); }} className="w-full text-left px-4 py-2 text-sm text-[#374151] font-medium hover:bg-[#f9fafb] hover:text-[#111827]">
            Send Promo
          </button>
          <button onClick={() => { setIsOpen(false); onAction('group'); }} className="w-full text-left px-4 py-2 text-sm text-[#374151] font-medium hover:bg-[#f9fafb] hover:text-[#111827]">
            Assign Group
          </button>
          <div className="h-px bg-[#e5e7eb] my-1"></div>
          <button onClick={() => { setIsOpen(false); onAction('status'); }} className="w-full text-left px-4 py-2 text-sm text-[#374151] font-medium hover:bg-[#f9fafb] hover:text-[#111827]">
            Change Status
          </button>
          <button onClick={() => { setIsOpen(false); onAction('delete'); }} className="w-full text-left px-4 py-2 text-sm text-[#dc2626] font-bold hover:bg-[#fef2f2]">
            Delete Customer
          </button>
        </div>
      )}
    </div>
  );
}

// ── ACTION MODALS ───────────────────────────────────────────────────────────

function PromoModal({ roomId, targetIds, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', discountType: 'percentage', discountValue: 10 });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await crmAPI.sendPromo(roomId, { userIds: targetIds, ...form });
      showToast('Promotions and Unique Coupons sent successfully', 'success');
      onSuccess();
    } catch (err) {
      showToast(err.message || 'Failed to send promo', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
        <div className="p-5 border-b border-[#e5e7eb] flex justify-between items-center bg-[#F8FAFC]">
          <h2 className="text-lg font-bold text-[#111827] flex items-center gap-2"><Gift className="w-5 h-5 text-[#8B0000]" /> Send Promotion</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full"><XCircle className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm font-medium text-[#6b7280] mb-2">Sending to {targetIds.length} customer(s). They will receive an App Notification and a Unique Coupon Code.</p>
          
          <div>
            <label className="block text-xs font-bold text-[#374151] mb-1">Offer Title</label>
            <input required type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Special VIP Discount" className="w-full border border-[#d1d5db] rounded-lg px-3 py-2 text-sm text-[#111827] bg-white outline-none focus:border-[#8B0000] focus:ring-1 focus:ring-[#8B0000]" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#374151] mb-1">Discount Type</label>
              <select value={form.discountType} onChange={e => setForm({...form, discountType: e.target.value})} className="w-full border border-[#d1d5db] rounded-lg px-3 py-2 text-sm text-[#111827] bg-white outline-none focus:border-[#8B0000]">
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount ($)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#374151] mb-1">Value</label>
              <input required type="number" min="1" value={form.discountValue} onChange={e => setForm({...form, discountValue: e.target.value})} className="w-full border border-[#d1d5db] rounded-lg px-3 py-2 text-sm text-[#111827] bg-white outline-none focus:border-[#8B0000] focus:ring-1 focus:ring-[#8B0000]" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#374151] mb-1">Message Body</label>
            <textarea required rows="3" value={form.message} onChange={e => setForm({...form, message: e.target.value})} placeholder="Write a nice message..." className="w-full border border-[#d1d5db] rounded-lg px-3 py-2 text-sm text-[#111827] bg-white outline-none focus:border-[#8B0000] focus:ring-1 focus:ring-[#8B0000] custom-scrollbar"></textarea>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-gray-100 text-[#111827] font-bold rounded-lg hover:bg-gray-200">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-[#8B0000] text-white font-bold rounded-lg hover:bg-red-900 disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? 'Sending...' : 'Send Now'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function GroupModal({ roomId, targetIds, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [group, setGroup] = useState('Family');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await crmAPI.bulkUpdateCustomers(roomId, { customerIds: targetIds, updateData: { group } });
      showToast('Customer groups updated successfully', 'success');
      onSuccess();
    } catch (err) {
      showToast(err.message || 'Failed to update group', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
        <div className="p-5 border-b border-[#e5e7eb] flex justify-between items-center bg-[#F8FAFC]">
          <h2 className="text-lg font-bold text-[#111827]">Assign Group</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700"><XCircle className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm font-medium text-[#6b7280]">Select a group for {targetIds.length} customer(s).</p>
          <select value={group} onChange={e => setGroup(e.target.value)} className="w-full border border-[#d1d5db] rounded-lg px-3 py-2 text-sm text-[#111827] outline-none focus:border-[#8B0000] bg-white">
            <option value="Family">Family</option>
            <option value="Friends">Friends</option>
            <option value="Corporate">Corporate</option>
            <option value="Others">Others</option>
          </select>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-gray-100 text-[#111827] font-bold rounded-lg hover:bg-gray-200">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-[#111827] text-white font-bold rounded-lg hover:bg-gray-800 disabled:opacity-50">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StatusModal({ roomId, targetIds, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('Active');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await crmAPI.bulkUpdateCustomers(roomId, { customerIds: targetIds, updateData: { status } });
      showToast('Customer statuses updated successfully', 'success');
      onSuccess();
    } catch (err) {
      showToast(err.message || 'Failed to update status', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
        <div className="p-5 border-b border-[#e5e7eb] flex justify-between items-center bg-[#F8FAFC]">
          <h2 className="text-lg font-bold text-[#111827]">Change Status</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700"><XCircle className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm font-medium text-[#6b7280]">Update status for {targetIds.length} customer(s).</p>
          <select value={status} onChange={e => setStatus(e.target.value)} className="w-full border border-[#d1d5db] rounded-lg px-3 py-2 text-sm text-[#111827] outline-none focus:border-[#8B0000] bg-white">
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-gray-100 text-[#111827] font-bold rounded-lg hover:bg-gray-200">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-[#111827] text-white font-bold rounded-lg hover:bg-gray-800 disabled:opacity-50">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteModal({ roomId, targetIds, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await crmAPI.bulkDeleteCustomers(roomId, targetIds);
      showToast('Customers deleted successfully', 'success');
      onSuccess();
    } catch (err) {
      showToast(err.message || 'Failed to delete customers', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-[#111827] mb-2">Delete Customers?</h2>
          <p className="text-sm font-medium text-[#6b7280] mb-6">
            Are you sure you want to delete {targetIds.length} customer(s)? This will archive their profiles.
          </p>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 px-4 py-2 bg-gray-100 text-[#111827] font-bold rounded-lg hover:bg-gray-200">Cancel</button>
            <button onClick={handleSubmit} disabled={loading} className="flex-1 px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:opacity-50">
              {loading ? 'Deleting...' : 'Yes, Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
