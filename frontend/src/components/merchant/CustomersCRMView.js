import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, Filter, ChevronLeft, ChevronRight, UserPlus, 
  Upload, Users, Crown, Gift, Star, Eye, MoreVertical,
  MessageSquare, Tag, UsersRound, Download, XCircle, Phone, Mail
} from 'lucide-react';

export default function CustomersCRMView({ customers = [], onAdd, onEdit }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [searchQuery, setSearchQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState('All Groups');
  const [tierFilter, setTierFilter] = useState('All Loyalty Tiers');
  const [statusFilter, setStatusFilter] = useState('All Status');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [selectedIds, setSelectedIds] = useState([]);

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

  // Helper Badges
  const getTierBadge = (tier) => {
    switch (tier) {
      case 'Gold': return <span className="bg-[#fef3c7] text-[#b45309] font-bold text-[10px] px-2 py-1 rounded">Gold</span>;
      case 'Silver': return <span className="bg-[#f3f4f6] text-[#4b5563] font-bold text-[10px] px-2 py-1 rounded">Silver</span>;
      case 'Platinum': return <span className="bg-[#f3e8ff] text-[#7e22ce] font-bold text-[10px] px-2 py-1 rounded">Platinum</span>;
      case 'Bronze': return <span className="bg-[#ffedd5] text-[#c2410c] font-bold text-[10px] px-2 py-1 rounded">Bronze</span>;
      default: return <span className="bg-gray-100 text-gray-600 font-bold text-[10px] px-2 py-1 rounded">{tier || 'None'}</span>;
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'Active') return <span className="text-[#10B981] font-bold text-xs bg-[#10B981]/10 px-2 py-1 rounded">Active</span>;
    return <span className="text-[#DC2626] font-bold text-xs bg-[#DC2626]/10 px-2 py-1 rounded">Inactive</span>;
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC]">
      
      {/* Top Header Row */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Customers & CRM</h1>
          <p className="text-sm text-[#6b7280] mt-1">Manage customer relationships, loyalty and communication.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-[#e5e7eb] rounded-lg px-4 py-2 text-sm text-[#374151] font-bold flex items-center gap-2 hover:bg-[#f9fafb]">
            <Upload className="w-4 h-4" /> Import Customers
          </button>
          <button onClick={() => onAdd()} className="bg-[#8B0000] text-white rounded-lg px-4 py-2 text-sm font-bold flex items-center gap-2 hover:bg-red-900 transition-colors">
            + Add Customer
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6 shrink-0">
        <div className="bg-white p-4 rounded-xl border border-[#e5e7eb] shadow-sm flex flex-col justify-center relative overflow-hidden">
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-16 h-16 bg-[#fff7ed] rounded-full translate-x-1/2"></div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-[#fff7ed] flex items-center justify-center shrink-0 z-10">
              <Users className="w-4 h-4 text-[#ea580c]" />
            </div>
            <div className="flex flex-col z-10">
              <span className="text-xs font-bold text-[#6b7280]">Total Customers</span>
              <span className="text-2xl font-bold text-[#111827]">{customers.length.toLocaleString()}</span>
            </div>
          </div>
          <span className="text-[10px] font-bold text-[#10B981] z-10 mt-1">↑ 18.7% <span className="text-[#9ca3af] font-normal">vs last month</span></span>
        </div>
        
        <div className="bg-white p-4 rounded-xl border border-[#e5e7eb] shadow-sm flex flex-col justify-center relative overflow-hidden">
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-16 h-16 bg-[#ecfdf5] rounded-full translate-x-1/2"></div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-[#ecfdf5] flex items-center justify-center shrink-0 z-10">
              <UserPlus className="w-4 h-4 text-[#10B981]" />
            </div>
            <div className="flex flex-col z-10">
              <span className="text-xs font-bold text-[#6b7280]">New Customers</span>
              <span className="text-2xl font-bold text-[#111827]">246</span>
            </div>
          </div>
          <span className="text-[10px] font-bold text-[#10B981] z-10 mt-1">↑ 14.3% <span className="text-[#9ca3af] font-normal">vs last month</span></span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#e5e7eb] shadow-sm flex flex-col justify-center relative overflow-hidden">
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-16 h-16 bg-[#faf5ff] rounded-full translate-x-1/2"></div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-[#faf5ff] flex items-center justify-center shrink-0 z-10">
              <Crown className="w-4 h-4 text-[#a855f7]" />
            </div>
            <div className="flex flex-col z-10">
              <span className="text-xs font-bold text-[#6b7280]">Loyalty Members</span>
              <span className="text-2xl font-bold text-[#111827]">{customers.filter(c => c.loyaltyTier && c.loyaltyTier !== 'Bronze').length.toLocaleString()}</span>
            </div>
          </div>
          <span className="text-[10px] font-bold text-[#10B981] z-10 mt-1">↑ 22.5% <span className="text-[#9ca3af] font-normal">vs last month</span></span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#e5e7eb] shadow-sm flex flex-col justify-center relative overflow-hidden">
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-16 h-16 bg-[#eff6ff] rounded-full translate-x-1/2"></div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-[#eff6ff] flex items-center justify-center shrink-0 z-10">
              <Gift className="w-4 h-4 text-[#3b82f6]" />
            </div>
            <div className="flex flex-col z-10">
              <span className="text-xs font-bold text-[#6b7280]">Repeat Customers</span>
              <span className="text-2xl font-bold text-[#111827]">{customers.filter(c => c.totalOrders > 1).length.toLocaleString()}</span>
            </div>
          </div>
          <span className="text-[10px] font-bold text-[#10B981] z-10 mt-1">↑ 16.8% <span className="text-[#9ca3af] font-normal">vs last month</span></span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#e5e7eb] shadow-sm flex flex-col justify-center relative overflow-hidden">
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-16 h-16 bg-[#fef2f2] rounded-full translate-x-1/2"></div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-[#fef2f2] flex items-center justify-center shrink-0 z-10">
              <Star className="w-4 h-4 text-[#ef4444]" />
            </div>
            <div className="flex flex-col z-10">
              <span className="text-xs font-bold text-[#6b7280]">Top Customers</span>
              <span className="text-2xl font-bold text-[#111827]">152</span>
            </div>
          </div>
          <span className="text-[10px] font-bold text-[#10B981] z-10 mt-1">↑ 11.2% <span className="text-[#9ca3af] font-normal">vs last month</span></span>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex flex-1 gap-6 overflow-hidden">
        
        {/* Left Column - Main Table Area */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-[#e5e7eb] flex flex-col overflow-hidden custom-scrollbar">
          
          {/* Filters Bar */}
          <div className="p-4 border-b border-[#f3f4f6] flex flex-wrap gap-4 items-center justify-between shrink-0">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="w-4 h-4 text-[#9ca3af] absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search by name, phone or email..." 
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-[#e5e7eb] text-sm text-[#111827] bg-[#f9fafb] outline-none focus:border-[#d1d5db]"
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

              <button className="bg-white border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#374151] font-bold flex items-center gap-2 hover:bg-[#f9fafb]">
                <Filter className="w-4 h-4" /> More Filters
              </button>

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
                <tr className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">
                  <th className="px-6 py-4 w-12 text-center">
                    <input type="checkbox" onChange={handleSelectAll} checked={selectedIds.length === paginatedData.length && paginatedData.length > 0} className="rounded border-gray-300 text-[#8B0000] focus:ring-[#8B0000]" />
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
                  <tr key={c._id} className="hover:bg-[#f9fafb] transition-colors group">
                    <td className="px-6 py-4 text-center">
                      <input type="checkbox" onChange={(e) => handleSelectOne(e, c._id)} checked={selectedIds.includes(c._id)} className="rounded border-gray-300 text-[#8B0000] focus:ring-[#8B0000]" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden shrink-0">
                          <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=random`} alt={c.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#111827]">{c.name}</p>
                          <p className="text-[10px] text-[#6b7280]">{c.customerId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[11px] text-[#374151] flex items-center gap-1.5"><Phone className="w-3 h-3 text-[#9ca3af]"/> {c.phone || '-'}</p>
                      <p className="text-[11px] text-[#6b7280] flex items-center gap-1.5 mt-0.5"><Mail className="w-3 h-3 text-[#9ca3af]"/> {c.email || '-'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-[#374151]">{c.group}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getTierBadge(c.loyaltyTier)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-bold text-[#111827]">{c.totalOrders}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-[#111827]">${c.totalSpent.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-[#374151] font-medium">{c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}) : '-'}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(c.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onEdit && onEdit(c)} className="p-1.5 text-[#9ca3af] hover:text-[#374151] hover:bg-white rounded border border-transparent hover:border-[#e5e7eb]"><Eye className="w-4 h-4" /></button>
                        <button className="p-1.5 text-[#9ca3af] hover:text-[#374151] hover:bg-white rounded border border-transparent hover:border-[#e5e7eb]"><MoreVertical className="w-4 h-4" /></button>
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
                <button className="w-7 h-7 bg-[#8B0000] text-white rounded font-bold">{currentPage}</button>
                {currentPage < totalPages && <button className="w-7 h-7 text-[#374151] hover:bg-[#f9fafb] rounded font-bold" onClick={() => setCurrentPage(currentPage + 1)}>{currentPage + 1}</button>}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1 border border-[#e5e7eb] rounded hover:bg-[#f9fafb] disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
              </div>
              <select className="bg-[#f9fafb] border border-[#e5e7eb] rounded outline-none py-1 px-2 text-xs">
                <option>10 / page</option>
                <option>20 / page</option>
                <option>50 / page</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-[320px] shrink-0 overflow-y-auto custom-scrollbar space-y-6 pb-6">
          
          {/* Customer Segments Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-[#e5e7eb] p-5">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-bold text-[#111827]">Customer Segments</h3>
              <button className="text-[10px] font-bold text-[#8B0000]">View All</button>
            </div>
            
            <div className="flex flex-col items-center">
              {/* SVG Donut Chart */}
              <div className="relative w-40 h-40">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f3f4f6" strokeWidth="15" />
                  {/* Fake values for demo representing Family (40%), Friends (30%), Corporate (20%), Others (10%) */}
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#ea580c" strokeWidth="15" strokeDasharray="100 251" strokeDashoffset="0" />
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#10b981" strokeWidth="15" strokeDasharray="75 251" strokeDashoffset="-100" />
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#8b5cf6" strokeWidth="15" strokeDasharray="50 251" strokeDashoffset="-175" />
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#3b82f6" strokeWidth="15" strokeDasharray="26 251" strokeDashoffset="-225" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-bold text-[#111827]">{customers.length.toLocaleString()}</span>
                  <span className="text-[10px] text-[#6b7280]">Total</span>
                </div>
              </div>
              
              <div className="w-full mt-6 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#ea580c]"></div><span className="text-[#374151] font-bold">Family</span></div>
                  <span className="text-[#6b7280]">39.5%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#10b981]"></div><span className="text-[#374151] font-bold">Friends</span></div>
                  <span className="text-[#6b7280]">31.3%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#8b5cf6]"></div><span className="text-[#374151] font-bold">Corporate</span></div>
                  <span className="text-[#6b7280]">18.8%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#3b82f6]"></div><span className="text-[#374151] font-bold">Others</span></div>
                  <span className="text-[#6b7280]">10.4%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Customers List */}
          <div className="bg-white rounded-xl shadow-sm border border-[#e5e7eb] p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-[#111827]">Top Customers (By Spend)</h3>
              <button className="text-[10px] font-bold text-[#8B0000]">View All</button>
            </div>
            <div className="space-y-4 mt-4">
              {[...customers].sort((a,b) => b.totalSpent - a.totalSpent).slice(0,5).map((c, i) => (
                <div key={c._id || i} className="flex justify-between items-center border-b border-[#f3f4f6] pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[9px] font-bold text-[#6b7280]">{i+1}</div>
                    <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                      <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=random`} alt={c.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#111827] flex items-center gap-1">
                        {c.name} {i < 3 && <Crown className="w-3 h-3 text-[#f59e0b]" />}
                      </p>
                      <p className="text-[10px] text-[#6b7280]">{c.totalOrders} Orders</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#111827]">${c.totalSpent.toFixed(2)}</span>
                </div>
              ))}
              {customers.length === 0 && <p className="text-xs text-gray-500 text-center">No customers yet</p>}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-[#e5e7eb] p-5">
            <h3 className="text-sm font-bold text-[#111827] mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button className="flex items-center gap-2 border border-[#dcfce7] bg-[#f0fdf4] text-[#15803d] p-3 rounded-lg hover:bg-[#dcfce7] transition-colors">
                <MessageSquare className="w-4 h-4" />
                <span className="text-xs font-bold">Send Message</span>
              </button>
              <button className="flex items-center gap-2 border border-[#fee2e2] bg-[#fef2f2] text-[#b91c1c] p-3 rounded-lg hover:bg-[#fee2e2] transition-colors">
                <Tag className="w-4 h-4" />
                <span className="text-xs font-bold">Create Offer</span>
              </button>
              <button className="flex items-center gap-2 border border-[#f3e8ff] bg-[#faf5ff] text-[#7e22ce] p-3 rounded-lg hover:bg-[#f3e8ff] transition-colors">
                <UsersRound className="w-4 h-4" />
                <span className="text-xs font-bold">Add to Group</span>
              </button>
              <button className="flex items-center gap-2 border border-[#e0e7ff] bg-[#eef2ff] text-[#4338ca] p-3 rounded-lg hover:bg-[#e0e7ff] transition-colors">
                <Download className="w-4 h-4" />
                <span className="text-xs font-bold">Export Customers</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
