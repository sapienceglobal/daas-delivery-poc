import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Calendar, Search, Filter, MoreVertical, Edit3, Eye, 
  RefreshCcw, Plus, Package, FileText, ArrowRight, TrendingUp, TrendingDown,
  Clock, CheckCircle, XCircle, Mail, ChevronLeft, ChevronRight, Loader2,
  Download, ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { useRouter } from 'next/navigation';
import { showToast, Badge, Button, GlassCard } from '@/components/ui';
import CateringInquiryModal from '@/components/catering/CateringInquiryModal';
import StatCard from './StatCard';

const SortHeader = ({ label, sortKey, currentSort, onSort, className = "" }) => (
  <th 
    className={`px-4 py-3.5 cursor-pointer hover:bg-admin-surface-hover group transition-colors text-[11px] font-bold text-admin-text-secondary uppercase tracking-wider ${className}`}
    onClick={() => onSort(sortKey)}
  >
    <div className="flex items-center gap-1.5">
      {label}
      <span className="text-admin-text-muted group-hover:text-admin-text">
        {currentSort.key === sortKey ? (
          currentSort.direction === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-brand" /> : <ArrowDown className="w-3.5 h-3.5 text-brand" />
        ) : (
          <ArrowUpDown className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </span>
    </div>
  </th>
);

export default function CateringEnquiriesView({ inquiries = [], isLoading = false, onUpdateStatus, restaurantId, refreshData }) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [eventTypeFilter, setEventTypeFilter] = useState('All Event Types');
  const [chartTimeframe, setChartTimeframe] = useState('This Month');
  
  // sorting state
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'desc' });

  const handleSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    } else if (sortConfig.key === key && sortConfig.direction === 'asc') {
      key = null;
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  // ─── LOAD MORE STATE ───
  const ITEMS_PER_LOAD = 8;
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // ─── SCROLLING LOGIC STATES & REFS ───
  const scrollContainerRef = useRef(null);
  const tableHeaderRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // reset items when filters change
  useEffect(() => {
    setVisibleCount(ITEMS_PER_LOAD);
  }, [searchTerm, statusFilter, eventTypeFilter]);

  // check Scroll Position
  const checkForScrollPosition = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      if (tableHeaderRef.current) {
        tableHeaderRef.current.scrollLeft = scrollLeft;
      }
      setCanScrollLeft(scrollLeft > 1);
      setCanScrollRight(Math.ceil(scrollLeft) < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => checkForScrollPosition(), 150);
    return () => clearTimeout(timer);
  }, [inquiries, visibleCount]);

  useEffect(() => {
    window.addEventListener('resize', checkForScrollPosition);
    return () => window.removeEventListener('resize', checkForScrollPosition);
  }, []);

  const scrollByAmount = (amount) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

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
    }).sort((a, b) => {
      if (sortConfig.key) {
        let valA = a[sortConfig.key] || '';
        let valB = b[sortConfig.key] || '';
        
        if (sortConfig.key === 'createdAt' || sortConfig.key === 'eventDate') {
          valA = new Date(valA).getTime();
          valB = new Date(valB).getTime();
        } else if (sortConfig.key === 'guests') {
          valA = Number(valA);
          valB = Number(valB);
        } else if (typeof valA === 'string') {
          valA = valA.toLowerCase();
          valB = valB.toLowerCase();
        }
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [inquiries, searchTerm, statusFilter, eventTypeFilter, sortConfig]);

  const exportToCSV = () => {
    if (!filteredInquiries || filteredInquiries.length === 0) {
      showToast('No data to export', 'error');
      return;
    }
    const headers = ['Created At', 'Event Date', 'Customer Name', 'Customer Email', 'Customer Phone', 'Event Type', 'Guests', 'Status'];
    const rows = filteredInquiries.map(i => [
      new Date(i.createdAt).toLocaleDateString(),
      i.eventDate ? new Date(i.eventDate).toLocaleDateString() : 'N/A',
      i.customerName,
      i.customerEmail || '',
      i.customerPhone || '',
      i.eventType || 'N/A',
      i.guests || '0',
      i.status
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.map(f => `"${String(f).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `catering_enquiries_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const displayedInquiries = useMemo(() => {
    return filteredInquiries.slice(0, visibleCount);
  }, [filteredInquiries, visibleCount]);

  const hasMoreItems = visibleCount < filteredInquiries.length;

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount(prev => prev + ITEMS_PER_LOAD);
      setIsLoadingMore(false);
    }, 400); // 400ms premium delay
  };

  const chartData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const counts = { new: 0, in_discussion: 0, quotation_sent: 0, confirmed: 0, closed: 0 };
    
    inquiries.forEach(i => {
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
    if (['new', 'pending'].includes(s)) return <span className="text-emerald-500 font-bold text-[11px] bg-emerald-500/15 px-2.5 py-1 rounded-full uppercase tracking-wider border border-emerald-500/25">New</span>;
    if (['in_discussion', 'reviewed'].includes(s)) return <span className="text-amber-500 font-bold text-[11px] bg-amber-500/15 px-2.5 py-1 rounded-full uppercase tracking-wider border border-amber-500/25">In Discussion</span>;
    if (['quotation_sent', 'contacted'].includes(s)) return <span className="text-purple-400 font-bold text-[11px] bg-purple-500/15 px-2.5 py-1 rounded-full uppercase tracking-wider border border-purple-500/25">Quoted</span>;
    if (s === 'confirmed') return <span className="text-blue-500 font-bold text-[11px] bg-blue-500/15 px-2.5 py-1 rounded-full uppercase tracking-wider border border-blue-500/25">Confirmed</span>;
    if (s === 'closed') return <span className="text-rose-500 font-bold text-[11px] bg-rose-500/15 px-2.5 py-1 rounded-full uppercase tracking-wider border border-rose-500/25">Closed</span>;
    return <span className="text-admin-text-secondary font-bold text-[11px] bg-admin-surface-light px-2.5 py-1 rounded-full uppercase tracking-wider border border-admin-border">{status}</span>;
  };

  const handleSelectAll = (e) => {
    const pageIds = displayedInquiries.map(r => r._id);
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

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-full bg-transparent text-admin-text relative space-y-6">
      
      {/* ─── RESPONSIVE SPLIT ─── */}
      <div className="flex flex-col xl:flex-row flex-1 gap-6 overflow-hidden">
        
        {/* Left Column (Table & Main Content) */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar pb-24 pr-1">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 shrink-0 px-1 pt-2">
            <div>
              <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-admin-text tracking-tight">
                Catering Enquiries
              </h1>
              <p className="text-xs sm:text-sm text-admin-text-secondary mt-1">
                Manage catering enquiries and convert them into confirmed bookings.
              </p>
            </div>
            <div className="flex gap-2.5">
              <button 
                onClick={() => setIsNewInquiryModalOpen(true)}
                className="bg-brand text-white hover:brightness-110 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-sm cursor-pointer"
              >
                <Plus size={16} /> New Enquiry
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4 mb-6 shrink-0 px-1">
            {[
              { label: 'Total Enquiries', value: stats.total.value, trend: stats.total.trend, icon: Calendar, color: 'bg-amber-500/15 text-amber-500' },
              { label: 'New Enquiries', value: stats.new.value, trend: stats.new.trend, icon: CheckCircle, color: 'bg-emerald-500/15 text-emerald-500' },
              { label: 'In Discussion', value: stats.inDiscussion.value, trend: stats.inDiscussion.trend, icon: Clock, color: 'bg-amber-500/15 text-amber-500' },
              { label: 'Quotation Sent', value: stats.quotationSent.value, trend: stats.quotationSent.trend, icon: FileText, color: 'bg-purple-500/15 text-purple-400' },
              { label: 'Confirmed', value: stats.confirmed.value, trend: stats.confirmed.trend, icon: CheckCircle, color: 'bg-blue-500/15 text-blue-500' },
              { label: 'Closed', value: stats.closed.value, trend: stats.closed.trend, icon: XCircle, color: 'bg-rose-500/15 text-rose-500' },
            ].map((stat, idx) => (
              <StatCard 
                key={idx}
                title={stat.label}
                value={stat.value}
                icon={stat.icon}
                color={stat.color}
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

          <div className="bg-admin-card rounded-2xl shadow-sm border border-admin-border flex flex-col flex-1 min-w-0 relative group">
            
            {/* STICKY TOP SECTION */}
            <div className="sticky top-[70px] z-40 bg-admin-surface/95 backdrop-blur-md rounded-t-2xl flex flex-col shadow-sm border-b border-admin-border">
              <div className="p-4 flex flex-wrap gap-3.5 items-center justify-between">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search className="w-4 h-4 text-admin-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input 
                    type="text" 
                    placeholder="Search by name, phone or email..." 
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-admin-border text-xs sm:text-sm text-admin-text bg-admin-surface-light outline-none focus:border-brand transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <select 
                    className="bg-admin-surface-light border border-admin-border rounded-xl px-3 py-2 text-xs sm:text-sm text-admin-text font-medium outline-none cursor-pointer hover:bg-admin-surface-hover transition-colors" 
                    value={statusFilter} 
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option>All Status</option>
                    <option>New</option>
                    <option>In Discussion</option>
                    <option>Quotation Sent</option>
                    <option>Confirmed</option>
                    <option>Closed</option>
                  </select>
                  <select 
                    className="bg-admin-surface-light border border-admin-border rounded-xl px-3 py-2 text-xs sm:text-sm text-admin-text font-medium outline-none cursor-pointer hover:bg-admin-surface-hover transition-colors" 
                    value={eventTypeFilter} 
                    onChange={(e) => setEventTypeFilter(e.target.value)}
                  >
                    <option>All Event Types</option>
                    {uniqueEventTypes.map(t => <option key={t}>{t}</option>)}
                  </select>
                  <button 
                    className="bg-admin-surface border border-admin-border rounded-xl px-3 py-2 text-xs sm:text-sm text-admin-text font-bold flex items-center gap-1.5 hover:bg-admin-surface-light transition-colors shadow-2xs cursor-pointer"
                    onClick={() => { setSearchTerm(''); setStatusFilter('All Status'); setEventTypeFilter('All Event Types'); }}
                  >
                    <RefreshCcw className="w-3.5 h-3.5" /> Reset
                  </button>
                  <button 
                    onClick={exportToCSV} 
                    className="bg-admin-surface border border-admin-border text-admin-text rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold flex items-center gap-2 hover:bg-admin-surface-light transition-all shadow-2xs cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-admin-text-muted" /> Export
                  </button>
                </div>
              </div>

              {/* Table Header (Synced horizontal scroll) */}
              <div className="border-b border-admin-border overflow-hidden" ref={tableHeaderRef}>
                <table className="w-full text-left border-collapse min-w-[1250px] table-fixed">
                  <colgroup>
                    <col style={{ width: '60px' }} />
                    <col style={{ width: '120px' }} />
                    <col style={{ width: '200px' }} />
                    <col style={{ width: '180px' }} />
                    <col style={{ width: '150px' }} />
                    <col style={{ width: '100px' }} />
                    <col style={{ width: '120px' }} />
                    <col style={{ width: '120px' }} />
                    <col style={{ width: '100px' }} />
                    <col style={{ width: '100px' }} />
                  </colgroup>
                  <thead className="bg-admin-surface-light">
                    <tr className="text-[11px] font-bold text-admin-text-secondary uppercase tracking-wider">
                      <th className="px-4 py-3.5 w-12 text-center">
                        <input 
                          type="checkbox" 
                          className="rounded bg-admin-surface border-admin-border text-brand focus:ring-brand cursor-pointer"
                          checked={displayedInquiries.length > 0 && displayedInquiries.every(r => selectedItems.includes(r._id))}
                          onChange={handleSelectAll}
                        />
                      </th>
                      <th className="px-4 py-3.5">Enquiry ID</th>
                      <SortHeader label="Customer" sortKey="customerName" currentSort={sortConfig} onSort={handleSort} />
                      <SortHeader label="Event Details" sortKey="eventType" currentSort={sortConfig} onSort={handleSort} />
                      <SortHeader label="Date & Time" sortKey="eventDate" currentSort={sortConfig} onSort={handleSort} />
                      <SortHeader label="Guests" sortKey="guestCount" currentSort={sortConfig} onSort={handleSort} />
                      <SortHeader label="Budget" sortKey="budgetRange" currentSort={sortConfig} onSort={handleSort} />
                      <SortHeader label="Status" sortKey="status" currentSort={sortConfig} onSort={handleSort} />
                      <SortHeader label="Added On" sortKey="createdAt" currentSort={sortConfig} onSort={handleSort} />
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                </table>
              </div>
            </div>

            {/* STICKY VERTICAL BUTTONS */}
            <div className="sticky top-[50vh] h-0 z-30 w-full pointer-events-none flex justify-between px-2">
              {canScrollLeft && (
                <button 
                  onClick={() => scrollByAmount(-300)} 
                  className="pointer-events-auto w-9 h-9 bg-admin-surface text-admin-text shadow-md border border-admin-border rounded-full flex items-center justify-center hover:bg-admin-surface-light hover:text-brand transition-all absolute left-2 -translate-y-1/2 cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              {canScrollRight && (
                <button 
                  onClick={() => scrollByAmount(300)} 
                  className="pointer-events-auto w-9 h-9 bg-admin-surface text-admin-text shadow-md border border-admin-border rounded-full flex items-center justify-center hover:bg-admin-surface-light hover:text-brand transition-all absolute right-2 -translate-y-1/2 cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* TABLE BODY */}
            <div 
              ref={scrollContainerRef}
              onScroll={checkForScrollPosition}
              className="overflow-x-auto flex-1 custom-scrollbar scroll-smooth w-full"
            >
              <table className="w-full text-left border-collapse min-w-[1250px] table-fixed">
                <colgroup>
                  <col style={{ width: '60px' }} />
                  <col style={{ width: '120px' }} />
                  <col style={{ width: '200px' }} />
                  <col style={{ width: '180px' }} />
                  <col style={{ width: '150px' }} />
                  <col style={{ width: '100px' }} />
                  <col style={{ width: '120px' }} />
                  <col style={{ width: '120px' }} />
                  <col style={{ width: '100px' }} />
                  <col style={{ width: '100px' }} />
                </colgroup>
                <tbody className="divide-y divide-admin-border dark:divide-white/[0.08] text-admin-text">
                  {isLoading ? (
                    [...Array(5)].map((_, idx) => (
                      <tr key={`skeleton-${idx}`} className="animate-pulse bg-admin-card border-b border-admin-border">
                        <td className="px-4 py-4 text-center"><div className="w-4 h-4 bg-admin-surface-light rounded mx-auto"></div></td>
                        <td className="px-4 py-4"><div className="w-16 h-4 bg-admin-surface-light rounded"></div></td>
                        <td className="px-4 py-4 space-y-2">
                          <div className="w-24 h-4 bg-admin-surface-light rounded"></div>
                          <div className="w-20 h-3 bg-admin-surface-light rounded"></div>
                        </td>
                        <td className="px-4 py-4 space-y-2">
                          <div className="w-24 h-4 bg-admin-surface-light rounded"></div>
                          <div className="w-16 h-3 bg-admin-surface-light rounded"></div>
                        </td>
                        <td className="px-4 py-4 space-y-2">
                          <div className="w-20 h-4 bg-admin-surface-light rounded"></div>
                          <div className="w-16 h-3 bg-admin-surface-light rounded"></div>
                        </td>
                        <td className="px-4 py-4 space-y-2">
                          <div className="w-10 h-4 bg-admin-surface-light rounded"></div>
                          <div className="w-12 h-3 bg-admin-surface-light rounded"></div>
                        </td>
                        <td className="px-4 py-4"><div className="w-16 h-4 bg-admin-surface-light rounded"></div></td>
                        <td className="px-4 py-4"><div className="w-20 h-6 bg-admin-surface-light rounded"></div></td>
                        <td className="px-4 py-4"><div className="w-16 h-4 bg-admin-surface-light rounded"></div></td>
                        <td className="px-4 py-4"><div className="w-20 h-6 bg-admin-surface-light rounded ml-auto"></div></td>
                      </tr>
                    ))
                  ) : displayedInquiries.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="p-8">
                        <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-admin-border rounded-xl bg-admin-surface-light/30">
                          <FileText className="w-10 h-10 text-admin-text-muted mb-3" />
                          <p className="text-sm font-bold text-admin-text-secondary">No enquiries found</p>
                          <p className="text-xs text-admin-text-muted mt-1">Try adjusting your filters or search terms.</p>
                        </div>
                      </td>
                    </tr>
                  ) : displayedInquiries.map(inq => {
                    const isSelected = selectedItems.includes(inq._id);
                    return (
                    <tr key={inq._id} className={`transition-colors group ${isSelected ? 'bg-brand/10' : 'hover:bg-admin-surface-hover/70'}`}>
                      <td className="px-4 py-3.5 text-center">
                        <input 
                          type="checkbox" 
                          className="rounded bg-admin-surface border-admin-border text-brand focus:ring-brand cursor-pointer"
                          checked={isSelected}
                          onChange={() => handleSelectItem(inq._id)}
                        />
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm font-bold font-heading text-admin-text">
                          #CAT{inq._id.substring(inq._id.length - 4).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-sm font-bold text-admin-text">{inq.customerName}</p>
                        <p className="text-xs text-admin-text-secondary flex items-center gap-1.5 mt-0.5">{inq.customerPhone}</p>
                        {inq.customerEmail && <p className="text-xs text-admin-text-muted flex items-center gap-1.5 mt-0.5"><Mail className="w-3 h-3 shrink-0" /> <span className="truncate">{inq.customerEmail}</span></p>}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-xs font-bold text-admin-text">{inq.eventType}</p>
                        <p className="text-xs text-admin-text-secondary">{inq.packagePreference || 'Full Catering'}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-sm font-bold text-admin-text">{new Date(inq.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        <p className="text-xs text-admin-text-muted">{new Date(inq.eventDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-sm font-bold text-admin-text">{inq.guestCount}</p>
                        <p className="text-xs text-admin-text-muted">People</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-xs font-bold text-admin-text">{inq.budgetRange || 'N/A'}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        {getStatusBadge(inq.status)}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-xs text-admin-text-muted whitespace-nowrap">{new Date(inq.createdAt).toLocaleDateString()}</p>
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <div className="flex flex-wrap items-center justify-end gap-1.5 w-[200px] ml-auto">
                          {['new', 'pending'].includes((inq.status || '').toLowerCase()) && (
                            <button onClick={() => onUpdateStatus && onUpdateStatus(inq._id, 'reviewed')} className="px-2.5 py-1 text-xs font-bold text-amber-500 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/25 rounded-lg shadow-2xs transition-colors whitespace-nowrap cursor-pointer">
                              Mark Reviewed
                            </button>
                          )}
                          {['in_discussion', 'reviewed'].includes((inq.status || '').toLowerCase()) && (
                            <button onClick={() => onUpdateStatus && onUpdateStatus(inq._id, 'contacted')} className="px-2.5 py-1 text-xs font-bold text-purple-400 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/25 rounded-lg shadow-2xs transition-colors whitespace-nowrap cursor-pointer">
                              Send Quote
                            </button>
                          )}
                          {['quotation_sent', 'contacted'].includes((inq.status || '').toLowerCase()) && (
                            <button onClick={() => onUpdateStatus && onUpdateStatus(inq._id, 'confirmed')} className="px-2.5 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/25 rounded-lg shadow-2xs transition-colors whitespace-nowrap cursor-pointer">
                              Confirm Booking
                            </button>
                          )}
                          {['new', 'pending', 'in_discussion', 'reviewed', 'quotation_sent', 'contacted'].includes((inq.status || '').toLowerCase()) && (
                            <button onClick={() => onUpdateStatus && onUpdateStatus(inq._id, 'closed')} className="px-2.5 py-1 text-xs font-bold text-rose-400 bg-rose-500/15 border border-rose-500/25 hover:bg-rose-500/25 rounded-lg transition-colors whitespace-nowrap cursor-pointer">
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

            {/* ─── LOAD MORE BUTTON ─── */}
            <div className="p-4 border-t border-admin-border flex items-center justify-between bg-admin-surface/50 rounded-b-2xl">
              <span className="text-xs font-semibold text-admin-text-secondary">
                Showing <strong className="text-admin-text">{displayedInquiries.length}</strong> of <strong className="text-admin-text">{filteredInquiries.length}</strong> enquiries
              </span>
              
              {hasMoreItems && (
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-admin-surface border border-admin-border text-admin-text rounded-xl text-xs sm:text-sm font-bold hover:bg-admin-surface-light hover:text-brand transition-all shadow-2xs cursor-pointer"
                >
                  {isLoadingMore ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading...</> : 'Load More'}
                </button>
              )}
            </div>
          </div>

          {/* Floating Bulk Action Bar */}
          {selectedItems.length > 0 && (
            <div className="fixed bottom-8 left-[calc(50%-120px)] -translate-x-1/2 z-50 bg-admin-surface/95 backdrop-blur-md border border-admin-border text-admin-text px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-5">
              <span className="text-xs sm:text-sm font-bold whitespace-nowrap bg-brand/20 text-brand px-2.5 py-1 rounded-lg">
                {selectedItems.length} Selected
              </span>
              <div className="flex items-center gap-2 border-l border-admin-border pl-4 flex-wrap">
                <button 
                  disabled={isProcessingBulk}
                  onClick={() => handleBulkAction('reviewed')}
                  className="text-xs font-bold text-amber-500 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/25 px-3 py-1.5 rounded-lg disabled:opacity-50 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {isProcessingBulk ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                  Mark Reviewed
                </button>
                <button 
                  disabled={isProcessingBulk}
                  onClick={() => handleBulkAction('contacted')}
                  className="text-xs font-bold text-purple-400 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/25 px-3 py-1.5 rounded-lg disabled:opacity-50 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {isProcessingBulk ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                  Send Quote
                </button>
                <button 
                  disabled={isProcessingBulk}
                  onClick={() => handleBulkAction('confirmed')}
                  className="text-xs font-bold text-emerald-400 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/25 px-3 py-1.5 rounded-lg disabled:opacity-50 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {isProcessingBulk ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                  Confirm Booking
                </button>
                <button 
                  disabled={isProcessingBulk}
                  onClick={() => handleBulkAction('closed')}
                  className="text-xs font-bold text-rose-400 bg-rose-500/15 border border-rose-500/25 hover:bg-rose-500/25 px-3 py-1.5 rounded-lg disabled:opacity-50 flex items-center gap-1 transition-colors cursor-pointer ml-1"
                >
                  {isProcessingBulk ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar (Analytics & Quick Actions) */}
        <div className="w-full xl:w-[320px] shrink-0 overflow-y-auto custom-scrollbar space-y-6 pb-6 pr-1">
          
          <div className="bg-admin-card rounded-2xl shadow-sm border border-admin-border p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-heading text-sm font-bold text-admin-text">Enquiries by Status</h3>
              <select 
                value={chartTimeframe}
                onChange={(e) => setChartTimeframe(e.target.value)}
                className="px-2 py-1 border border-admin-border rounded-lg text-xs font-bold text-admin-text-secondary bg-admin-surface-light outline-none hover:bg-admin-surface-hover transition-colors cursor-pointer"
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
                      <RechartsTooltip 
                        contentStyle={{ 
                          backgroundColor: 'var(--color-admin-surface, #1e293b)', 
                          borderColor: 'var(--color-admin-border, #334155)',
                          borderRadius: '12px',
                          color: 'var(--color-admin-text, #f8fafc)',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-2 mt-4">
                  {chartData.map(d => (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-admin-text font-bold">
                        <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: d.color}}></div>
                        {d.name}
                      </div>
                      <div>
                        <span className="font-bold text-admin-text">{d.value}</span>
                        <span className="text-xs text-admin-text-muted ml-1">({Math.round((d.value / inquiries.length) * 100)}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 border border-dashed border-admin-border rounded-xl bg-admin-surface-light/30 mt-4">
                <PieChart className="w-8 h-8 text-admin-text-muted mb-2" />
                <p className="text-xs font-bold text-admin-text-muted">No data available</p>
              </div>
            )}
          </div>

          <div className="bg-admin-card rounded-2xl shadow-sm border border-admin-border p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-heading text-sm font-bold text-admin-text">Popular Event Types</h3>
            </div>
            <div className="flex flex-col gap-3.5">
              {popularEventTypes.length > 0 ? popularEventTypes.map((event, idx) => (
                <div key={idx} className="flex items-start gap-3 border-b border-admin-border pb-3 last:border-0 last:pb-0">
                  <div className="w-8 h-8 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4 text-brand" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs text-admin-text mb-0.5 truncate">{event.name}</div>
                    <div className="text-xs text-admin-text-secondary">{event.count} Enquiries</div>
                  </div>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center py-8 border border-dashed border-admin-border rounded-xl bg-admin-surface-light/30">
                  <Calendar className="w-8 h-8 text-admin-text-muted mb-2" />
                  <p className="text-xs font-bold text-admin-text-muted">No data available</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-admin-card rounded-2xl shadow-sm border border-admin-border p-5">
            <h3 className="font-heading text-sm font-bold text-admin-text mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2.5">
              <button onClick={handleGenerateReport} className="bg-admin-surface-light border border-admin-border rounded-xl p-3 flex flex-col items-center justify-center gap-2 hover:bg-admin-surface-hover transition-all text-center group cursor-pointer shadow-2xs">
                <FileText className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-admin-text">Export Data</span>
              </button>
              <button onClick={() => setIsNewInquiryModalOpen(true)} className="bg-admin-surface-light border border-admin-border rounded-xl p-3 flex flex-col items-center justify-center gap-2 hover:bg-admin-surface-hover transition-all text-center group cursor-pointer shadow-2xs">
                <Plus className="w-5 h-5 text-brand group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-admin-text">New Enquiry</span>
              </button>
              <button onClick={() => router.push('/merchant/crm')} className="bg-admin-surface-light border border-admin-border rounded-xl p-3 flex flex-col items-center justify-center gap-2 hover:bg-admin-surface-hover transition-all text-center group cursor-pointer shadow-2xs">
                <Mail className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-admin-text">Customers</span>
              </button>
              <button onClick={() => router.push('/merchant/reservations')} className="bg-admin-surface-light border border-admin-border rounded-xl p-3 flex flex-col items-center justify-center gap-2 hover:bg-admin-surface-hover transition-all text-center group cursor-pointer shadow-2xs">
                <Calendar className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-admin-text">Calendar</span>
              </button>
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