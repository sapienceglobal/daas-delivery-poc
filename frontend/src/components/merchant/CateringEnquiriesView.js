import React, { useState, useMemo } from 'react';
import { 
  Calendar, Search, Filter, MoreVertical, Edit3, Eye, 
  RefreshCcw, Plus, Package, FileText, ArrowRight, TrendingUp, TrendingDown,
  Clock, CheckCircle, XCircle, Mail
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { useRouter } from 'next/navigation';
import { showToast, Badge, Button, GlassCard } from '@/components/ui';
import CateringInquiryModal from '@/components/catering/CateringInquiryModal';
import StatCard from './StatCard';

export default function CateringEnquiriesView({ inquiries = [], onUpdateStatus, restaurantId, refreshData }) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [eventTypeFilter, setEventTypeFilter] = useState('All Event Types');
  const [chartTimeframe, setChartTimeframe] = useState('This Month');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
  const [selectedItems, setSelectedItems] = useState([]);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const [isNewInquiryModalOpen, setIsNewInquiryModalOpen] = useState(false);

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const getMonthData = (monthOffset) => {
      let targetMonth = currentMonth - monthOffset;
      let targetYear = currentYear;
      if (targetMonth < 0) {
        targetMonth += 12;
        targetYear -= 1;
      }
      return inquiries.filter(i => {
        const d = new Date(i.createdAt);
        return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
      });
    };

    const currentMonthData = getMonthData(0);
    const lastMonthData = getMonthData(1);

    const calcTrend = (curr, prev) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / prev) * 100);
    };

    const getStatusCount = (data, statuses) => data.filter(i => statuses.includes(i.status)).length;

    const currentTotal = currentMonthData.length;
    const prevTotal = lastMonthData.length;

    return {
      total: { value: inquiries.length, trend: calcTrend(currentTotal, prevTotal) },
      new: { 
        value: getStatusCount(inquiries, ['new', 'pending']), 
        trend: calcTrend(getStatusCount(currentMonthData, ['new', 'pending']), getStatusCount(lastMonthData, ['new', 'pending'])) 
      },
      inDiscussion: { 
        value: getStatusCount(inquiries, ['in_discussion', 'reviewed']), 
        trend: calcTrend(getStatusCount(currentMonthData, ['in_discussion', 'reviewed']), getStatusCount(lastMonthData, ['in_discussion', 'reviewed'])) 
      },
      quotationSent: { 
        value: getStatusCount(inquiries, ['quotation_sent', 'contacted']), 
        trend: calcTrend(getStatusCount(currentMonthData, ['quotation_sent', 'contacted']), getStatusCount(lastMonthData, ['quotation_sent', 'contacted'])) 
      },
      confirmed: { 
        value: getStatusCount(inquiries, ['confirmed']), 
        trend: calcTrend(getStatusCount(currentMonthData, ['confirmed']), getStatusCount(lastMonthData, ['confirmed'])) 
      },
      closed: { 
        value: getStatusCount(inquiries, ['closed']), 
        trend: calcTrend(getStatusCount(currentMonthData, ['closed']), getStatusCount(lastMonthData, ['closed'])) 
      }
    };
  }, [inquiries]);

  const filteredInquiries = useMemo(() => {
    return inquiries.filter(i => {
      const matchesSearch = 
        i.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i._id?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const normalizedStatus = ['new', 'pending'].includes(i.status) ? 'new' :
                               ['in_discussion', 'reviewed'].includes(i.status) ? 'in_discussion' :
                               ['quotation_sent', 'contacted'].includes(i.status) ? 'quotation_sent' : i.status;
                               
      const matchesStatus = statusFilter === 'All Status' || 
        normalizedStatus === statusFilter.toLowerCase().replace(' ', '_');
        
      const matchesEvent = eventTypeFilter === 'All Event Types' || i.eventType === eventTypeFilter;

      return matchesSearch && matchesStatus && matchesEvent;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [inquiries, searchTerm, statusFilter, eventTypeFilter]);

  const totalPages = Math.ceil(filteredInquiries.length / itemsPerPage);
  const currentData = filteredInquiries.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const chartData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const counts = { new: 0, in_discussion: 0, quotation_sent: 0, confirmed: 0, closed: 0 };
    
    inquiries.forEach(i => {
      // Apply timeframe filter
      if (chartTimeframe === 'This Month') {
        const d = new Date(i.createdAt);
        if (d.getMonth() !== currentMonth || d.getFullYear() !== currentYear) return;
      }
      
      const s = (i.status || '').toLowerCase();
      if (['new', 'pending'].includes(s)) counts.new++;
      else if (['in_discussion', 'reviewed'].includes(s)) counts.in_discussion++;
      else if (['quotation_sent', 'contacted'].includes(s)) counts.quotation_sent++;
      else if (s === 'confirmed') counts.confirmed++;
      else if (s === 'closed') counts.closed++;
    });
    return [
      { name: 'New', value: counts.new, color: '#10B981' },
      { name: 'In Discussion', value: counts.in_discussion, color: '#F59E0B' },
      { name: 'Quotation Sent', value: counts.quotation_sent, color: '#8B5CF6' },
      { name: 'Confirmed', value: counts.confirmed, color: '#3B82F6' },
      { name: 'Closed', value: counts.closed, color: '#DC2626' },
    ].filter(d => d.value > 0);
  }, [inquiries, chartTimeframe]);

  const popularEventTypes = useMemo(() => {
    const counts = {};
    inquiries.forEach(i => {
      counts[i.eventType] = (counts[i.eventType] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [inquiries]);

  const uniqueEventTypes = [...new Set(inquiries.map(i => i.eventType))];

  const renderTrend = (trend) => {
    if (trend > 0) return <span className="text-xs font-semibold flex items-center gap-1 text-[#10B981]"><TrendingUp size={14} /> +{trend}% vs last month</span>;
    if (trend < 0) return <span className="text-xs font-semibold flex items-center gap-1 text-[#DC2626]"><TrendingDown size={14} /> {trend}% vs last month</span>;
    return <span className="text-xs font-semibold flex items-center gap-1 text-[#6b7280]">— 0% vs last month</span>;
  };

  const getStatusLabel = (status) => {
    const s = (status || '').toLowerCase();
    if (['new', 'pending'].includes(s)) return 'New';
    if (['in_discussion', 'reviewed'].includes(s)) return 'In Discussion';
    if (['quotation_sent', 'contacted'].includes(s)) return 'Quotation Sent';
    if (s === 'confirmed') return 'Confirmed';
    if (s === 'closed') return 'Closed';
    return status;
  };
  
  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (['new', 'pending'].includes(s)) return <span className="text-[#10B981] font-bold text-xs bg-[#10B981]/10 px-2 py-1 rounded uppercase tracking-wider border border-[#10B981]/20">New</span>;
    if (['in_discussion', 'reviewed'].includes(s)) return <span className="text-[#F59E0B] font-bold text-xs bg-[#F59E0B]/10 px-2 py-1 rounded uppercase tracking-wider border border-[#F59E0B]/20">In Discussion</span>;
    if (['quotation_sent', 'contacted'].includes(s)) return <span className="text-[#8B5CF6] font-bold text-xs bg-[#8B5CF6]/10 px-2 py-1 rounded uppercase tracking-wider border border-[#8B5CF6]/20">Quoted</span>;
    if (s === 'confirmed') return <span className="text-[#3B82F6] font-bold text-xs bg-[#3B82F6]/10 px-2 py-1 rounded uppercase tracking-wider border border-[#3B82F6]/20">Confirmed</span>;
    if (s === 'closed') return <span className="text-[#DC2626] font-bold text-xs bg-[#fef2f2] px-2 py-1 rounded uppercase tracking-wider border border-[#DC2626]/20">Closed</span>;
    return <span className="text-[#6b7280] font-bold text-xs bg-[#f3f4f6] px-2 py-1 rounded uppercase tracking-wider border border-[#e5e7eb]">{status}</span>;
  };

  const handleSelectAll = (e) => {
    const pageIds = currentData.map(r => r._id);
    if (e.target.checked) {
      const newItems = [...selectedItems];
      pageIds.forEach(id => {
        if (!newItems.includes(id)) newItems.push(id);
      });
      setSelectedItems(newItems);
    } else {
      setSelectedItems(selectedItems.filter(id => !pageIds.includes(id)));
    }
  };

  const handleSelectItem = (id) => {
    setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkAction = async (status) => {
    if (!selectedItems.length) return;
    setIsProcessingBulk(true);
    try {
      // Execute the bulk update in parallel using the existing onUpdateStatus
      await Promise.all(selectedItems.map(id => onUpdateStatus(id, status)));
      setSelectedItems([]);
      if (refreshData) refreshData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const handleGenerateReport = () => {
    if (filteredInquiries.length === 0) return showToast('No data to export', 'error');
    const headers = ['Enquiry ID', 'Customer Name', 'Email', 'Phone', 'Event Type', 'Event Date', 'Guests', 'Budget', 'Status', 'Added On'];
    const csvContent = [
      headers.join(','),
      ...filteredInquiries.map(i => [
        `#CAT${i._id.substring(i._id.length - 4).toUpperCase()}`,
        `"${i.customerName}"`,
        i.customerEmail,
        i.customerPhone,
        `"${i.eventType}"`,
        new Date(i.eventDate).toLocaleDateString(),
        i.guestCount,
        `"${i.budgetRange || 'N/A'}"`,
        getStatusLabel(i.status),
        new Date(i.createdAt).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `catering_enquiries_report_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    showToast('Report downloaded successfully!', 'success');
  };

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC]">
      <div className="flex flex-1 gap-6 overflow-hidden pt-2 pl-2 pr-4 pb-4">
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 shrink-0">
            <div>
              <h1 className="text-2xl font-bold text-[#111827]">Catering Enquiries</h1>
              <p className="text-sm text-[#6b7280] mt-1">Manage catering enquiries and convert them into confirmed bookings.</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsNewInquiryModalOpen(true)}
                className="bg-[#8B0000] text-white hover:bg-red-900 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors shadow-sm"
              >
                <Plus size={16} /> New Enquiry
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6 shrink-0">
            {[
              { label: 'Total Enquiries', value: stats.total.value, trend: stats.total.trend, icon: Calendar, color: 'text-[#F59E0B]', bg: 'bg-[#fef3c7]' },
              { label: 'New Enquiries', value: stats.new.value, trend: stats.new.trend, icon: CheckCircle, color: 'text-[#10B981]', bg: 'bg-[#dcfce7]' },
              { label: 'In Discussion', value: stats.inDiscussion.value, trend: stats.inDiscussion.trend, icon: Clock, color: 'text-[#F59E0B]', bg: 'bg-[#fef3c7]' },
              { label: 'Quotation Sent', value: stats.quotationSent.value, trend: stats.quotationSent.trend, icon: FileText, color: 'text-[#8B5CF6]', bg: 'bg-[#f3e8ff]' },
              { label: 'Confirmed', value: stats.confirmed.value, trend: stats.confirmed.trend, icon: CheckCircle, color: 'text-[#3B82F6]', bg: 'bg-[#eff6ff]' },
              { label: 'Closed', value: stats.closed.value, trend: stats.closed.trend, icon: XCircle, color: 'text-[#DC2626]', bg: 'bg-[#fef2f2]' },
            ].map((stat, idx) => (
              <StatCard 
                key={idx}
                title={stat.label}
                value={stat.value}
                icon={stat.icon}
                iconColor={stat.color}
                iconBg={stat.bg}
                trend={
                  stat.trend !== 0 ? {
                    direction: stat.trend > 0 ? 'up' : 'down',
                    value: `${Math.abs(stat.trend)}%`,
                    subtitle: 'vs last month'
                  } : {
                    direction: 'neutral',
                    value: '0%',
                    subtitle: 'vs last month'
                  }
                }
              />
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 flex-1 min-w-0">
            <div className="xl:col-span-3 flex flex-col min-h-0 min-w-0">
              <div className="bg-white rounded-[20px] shadow-sm border border-[#e5e7eb] overflow-hidden flex flex-col flex-1 min-w-0">
                
                <div className="p-4 border-b border-[#f3f4f6] flex flex-wrap gap-4 items-center justify-between">
                  <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="w-4 h-4 text-[#9ca3af] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input 
                      type="text" 
                      placeholder="Search by name, phone or email..." 
                      className="w-full !pl-10 py-2 rounded-lg border border-[#e5e7eb] text-sm text-[#111827] bg-[#f9fafb] outline-none focus:border-[#8b0000]"
                      value={searchTerm}
                      onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    />
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <select className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#374151] font-medium outline-none" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
                      <option>All Status</option>
                      <option>New</option>
                      <option>In Discussion</option>
                      <option>Quotation Sent</option>
                      <option>Confirmed</option>
                      <option>Closed</option>
                    </select>
                    <select className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#374151] font-medium outline-none" value={eventTypeFilter} onChange={(e) => { setEventTypeFilter(e.target.value); setCurrentPage(1); }}>
                      <option>All Event Types</option>
                      {uniqueEventTypes.map(t => <option key={t}>{t}</option>)}
                    </select>
                    <button 
                      className="bg-white border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#374151] font-bold flex items-center gap-2 hover:bg-[#f9fafb]"
                      onClick={() => { setSearchTerm(''); setStatusFilter('All Status'); setEventTypeFilter('All Event Types'); setCurrentPage(1); }}
                    >
                      <RefreshCcw className="w-4 h-4" /> Reset
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto flex-1 custom-scrollbar">
                  <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead className="bg-white sticky top-0 z-10 border-b border-[#f3f4f6]">
                      <tr className="text-xs font-bold text-[#6b7280] uppercase tracking-wider">
                        <th className="px-4 py-3 w-12">
                          <input 
                            type="checkbox" 
                            className="rounded !bg-white border-[#d1d5db] text-[#8B0000] focus:ring-[#8B0000]"
                            style={{ backgroundColor: 'white' }}
                            checked={currentData.length > 0 && currentData.every(r => selectedItems.includes(r._id))}
                            onChange={handleSelectAll}
                          />
                        </th>
                        <th className="px-4 py-3">Enquiry ID</th>
                        <th className="px-4 py-3">Customer</th>
                        <th className="px-4 py-3">Event Details</th>
                        <th className="px-4 py-3">Date & Time</th>
                        <th className="px-4 py-3">Guests</th>
                        <th className="px-4 py-3">Budget</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Added On</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f9fafb]">
                      {currentData.length === 0 ? (
                        <tr>
                          <td colSpan="10" className="p-8">
                            <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-[#e5e7eb] rounded-xl bg-[#f9fafb]">
                              <FileText className="w-10 h-10 text-[#d1d5db] mb-3" />
                              <p className="text-sm font-bold text-[#9ca3af]">No enquiries found</p>
                              <p className="text-xs text-[#9ca3af] mt-1">Try adjusting your filters or search terms.</p>
                            </div>
                          </td>
                        </tr>
                      ) : currentData.map(inq => {
                        const isSelected = selectedItems.includes(inq._id);
                        return (
                        <tr key={inq._id} className={`transition-colors group ${isSelected ? 'bg-red-50' : 'hover:bg-[#f9fafb]'}`}>
                          <td className="px-4 py-3">
                            <input 
                              type="checkbox" 
                              className="rounded !bg-white border-[#d1d5db] text-[#8B0000] focus:ring-[#8B0000]"
                              style={{ backgroundColor: 'white' }}
                              checked={isSelected}
                              onChange={() => handleSelectItem(inq._id)}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-bold text-[#111827]">
                              #CAT{inq._id.substring(inq._id.length - 4).toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-bold text-[#111827]">{inq.customerName}</p>
                            <p className="text-xs text-[#374151] flex items-center gap-1.5 mt-0.5">{inq.customerPhone}</p>
                            {inq.customerEmail && <p className="text-xs text-[#6b7280] flex items-center gap-1.5 mt-0.5"><Mail className="w-3 h-3 shrink-0" /> <span className="truncate">{inq.customerEmail}</span></p>}
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-xs font-bold text-[#374151]">{inq.eventType}</p>
                            <p className="text-xs text-[#6b7280]">{inq.packagePreference || 'Full Catering'}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-bold text-[#111827]">{new Date(inq.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                            <p className="text-xs text-[#6b7280]">{new Date(inq.eventDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-bold text-[#111827]">{inq.guestCount}</p>
                            <p className="text-xs text-[#6b7280]">People</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-xs font-bold text-[#374151]">{inq.budgetRange || 'N/A'}</p>
                          </td>
                          <td className="px-4 py-3">
                            {getStatusBadge(inq.status)}
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-xs text-[#6b7280] whitespace-nowrap">{new Date(inq.createdAt).toLocaleDateString()}</p>
                          </td>
                          <td className="px-4 py-3 align-middle">
                            <div className="flex flex-wrap items-center gap-1.5 w-[200px]">
                              {['new', 'pending'].includes((inq.status || '').toLowerCase()) && (
                                <button onClick={() => onUpdateStatus && onUpdateStatus(inq._id, 'reviewed')} className="px-2.5 py-1.5 text-xs font-bold text-white bg-[#F59E0B] hover:bg-[#D97706] rounded shadow-sm transition-colors whitespace-nowrap">
                                  Mark Reviewed
                                </button>
                              )}
                              {['in_discussion', 'reviewed'].includes((inq.status || '').toLowerCase()) && (
                                <button onClick={() => onUpdateStatus && onUpdateStatus(inq._id, 'contacted')} className="px-2.5 py-1.5 text-xs font-bold text-white bg-[#8B5CF6] hover:bg-[#7C3AED] rounded shadow-sm transition-colors whitespace-nowrap">
                                  Send Quote
                                </button>
                              )}
                              {['quotation_sent', 'contacted'].includes((inq.status || '').toLowerCase()) && (
                                <button onClick={() => onUpdateStatus && onUpdateStatus(inq._id, 'confirmed')} className="px-2.5 py-1.5 text-xs font-bold text-white bg-[#10B981] hover:bg-[#059669] rounded shadow-sm transition-colors whitespace-nowrap">
                                  Confirm Booking
                                </button>
                              )}
                              {['new', 'pending', 'in_discussion', 'reviewed', 'quotation_sent', 'contacted'].includes((inq.status || '').toLowerCase()) && (
                                <button onClick={() => onUpdateStatus && onUpdateStatus(inq._id, 'closed')} className="px-2.5 py-1.5 text-xs font-bold text-[#DC2626] bg-[#fef2f2] border border-[#fca5a5] hover:bg-[#fee2e2] rounded transition-colors whitespace-nowrap">
                                  Close
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )})}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 border-t border-[#f3f4f6] flex items-center justify-between bg-white text-xs text-[#6b7280]">
                  <span>Showing {filteredInquiries.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredInquiries.length)} of {filteredInquiries.length} enquiries</span>
                  <div className="flex gap-2">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 border border-[#e5e7eb] rounded hover:bg-[#f9fafb] disabled:opacity-50 text-[#374151]">Prev</button>
                    <div className="flex gap-1">
                      <button className="w-7 h-7 bg-[#8B0000] text-white rounded font-bold">{currentPage}</button>
                    </div>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className="p-1.5 border border-[#e5e7eb] rounded hover:bg-[#f9fafb] disabled:opacity-50 text-[#374151]">Next</button>
                  </div>
                </div>
              </div>

              {/* Floating Bulk Action Bar */}
              {selectedItems.length > 0 && (
                <div className="fixed bottom-8 left-[calc(50%-160px)] -translate-x-1/2 z-50 bg-[#111827] text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-5">
                  <span className="text-sm font-bold whitespace-nowrap bg-white/10 px-2 py-1 rounded">
                    {selectedItems.length} Selected
                  </span>
                  <div className="flex items-center gap-2 border-l border-white/20 pl-4">
                    <button 
                      disabled={isProcessingBulk}
                      onClick={() => handleBulkAction('reviewed')}
                      className="text-xs font-bold text-white bg-[#F59E0B] hover:bg-[#D97706] px-3 py-1.5 rounded disabled:opacity-50 flex items-center gap-1 transition-colors"
                    >
                      {isProcessingBulk ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                      Mark Reviewed
                    </button>
                    <button 
                      disabled={isProcessingBulk}
                      onClick={() => handleBulkAction('contacted')}
                      className="text-xs font-bold text-white bg-[#8B5CF6] hover:bg-[#7C3AED] px-3 py-1.5 rounded disabled:opacity-50 flex items-center gap-1 transition-colors"
                    >
                      {isProcessingBulk ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                      Send Quote
                    </button>
                    <button 
                      disabled={isProcessingBulk}
                      onClick={() => handleBulkAction('confirmed')}
                      className="text-xs font-bold text-white bg-[#10B981] hover:bg-[#059669] px-3 py-1.5 rounded disabled:opacity-50 flex items-center gap-1 transition-colors"
                    >
                      {isProcessingBulk ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                      Confirm Booking
                    </button>
                    <button 
                      disabled={isProcessingBulk}
                      onClick={() => handleBulkAction('closed')}
                      className="text-xs font-bold text-[#DC2626] bg-[#fef2f2] border border-[#fca5a5] hover:bg-[#fee2e2] px-3 py-1.5 rounded disabled:opacity-50 flex items-center gap-1 transition-colors ml-2"
                    >
                      {isProcessingBulk ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="xl:col-span-1 shrink-0 overflow-y-auto custom-scrollbar space-y-6 pb-6">
              
              <div className="bg-white rounded-xl shadow-sm border border-[#e5e7eb] p-5">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-[#111827]">Enquiries by Status</h3>
                  <select 
                    value={chartTimeframe}
                    onChange={(e) => setChartTimeframe(e.target.value)}
                    className="px-2 py-1 border border-[#e5e7eb] rounded text-xs font-bold text-[#6b7280] bg-[#f9fafb] outline-none hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <option>This Month</option>
                    <option>All Time</option>
                  </select>
                </div>
                {chartData.length > 0 ? (
                  <>
                    <div className="h-[160px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={chartData} innerRadius={45} outerRadius={65} paddingAngle={2} dataKey="value">
                            {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                          </Pie>
                          <RechartsTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-col gap-2 mt-4">
                      {chartData.map(d => (
                        <div key={d.name} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 text-[#374151] font-bold">
                            <div className="w-2 h-2 rounded-full" style={{backgroundColor: d.color}}></div>
                            {d.name}
                          </div>
                          <div>
                            <span className="font-bold text-[#111827]">{d.value}</span>
                            <span className="text-xs text-[#6b7280] ml-1">({Math.round((d.value / inquiries.length) * 100)}%)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 border border-dashed border-[#e5e7eb] rounded-xl bg-[#f9fafb] mt-4">
                    <PieChart className="w-8 h-8 text-[#d1d5db] mb-2" />
                    <p className="text-xs font-bold text-[#9ca3af]">No data available</p>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-[#e5e7eb] p-5">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-[#111827]">Popular Event Types</h3>
                </div>
                <div className="flex flex-col gap-4">
                  {popularEventTypes.length > 0 ? popularEventTypes.map((event, idx) => (
                    <div key={idx} className="flex items-start gap-3 border-b border-[#f3f4f6] pb-3 last:border-0 last:pb-0">
                      <div className="w-8 h-8 rounded bg-[#fef2f2] flex items-center justify-center shrink-0">
                        <Calendar className="w-4 h-4 text-[#8B0000]" />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-xs text-[#111827] mb-0.5">{event.name}</div>
                        <div className="text-xs text-[#6b7280]">{event.count} Enquiries</div>
                      </div>
                    </div>
                  )) : (
                    <div className="flex flex-col items-center justify-center py-8 border border-dashed border-[#e5e7eb] rounded-xl bg-[#f9fafb]">
                      <Calendar className="w-8 h-8 text-[#d1d5db] mb-2" />
                      <p className="text-xs font-bold text-[#9ca3af]">No data available</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-[#e5e7eb] p-5">
                <h3 className="text-sm font-bold text-[#111827] mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={handleGenerateReport} className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-3 flex flex-col items-center justify-center gap-2 hover:bg-white transition-all text-center group">
                    <FileText className="w-5 h-5 text-[#10B981] group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-[#374151]">Export Data</span>
                  </button>
                  <button onClick={() => setIsNewInquiryModalOpen(true)} className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-3 flex flex-col items-center justify-center gap-2 hover:bg-white transition-all text-center group">
                    <Plus className="w-5 h-5 text-[#8B0000] group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-[#374151]">New Enquiry</span>
                  </button>
                  <button onClick={() => router.push('/merchant/crm')} className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-3 flex flex-col items-center justify-center gap-2 hover:bg-white transition-all text-center group">
                    <Mail className="w-5 h-5 text-[#8B5CF6] group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-[#374151]">Customers</span>
                  </button>
                  <button onClick={() => router.push('/merchant/reservations')} className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-3 flex flex-col items-center justify-center gap-2 hover:bg-white transition-all text-center group">
                    <Calendar className="w-5 h-5 text-[#3B82F6] group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-[#374151]">Calendar</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {isNewInquiryModalOpen && (
        <CateringInquiryModal 
          isOpen={isNewInquiryModalOpen} 
          onClose={() => {
            setIsNewInquiryModalOpen(false);
            if (refreshData) refreshData();
          }} 
          restaurantId={restaurantId} 
        />
      )}
    </div>
  );
}
