import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, ChevronLeft, ChevronRight, Calendar, 
  MoreVertical, Edit3, Eye, Clock, CheckCircle2, XCircle, Users, Phone, CheckSquare, Square, Trash2, Loader2,
  Download, ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react';
import { showToast } from '@/components/ui';
import StatCard from './StatCard';

const SortHeader = ({ label, sortKey, currentSort, onSort, className = "" }) => (
  <th 
    className={`px-4 py-4 cursor-pointer hover:bg-gray-50 group transition-colors ${className}`}
    onClick={() => onSort(sortKey)}
  >
    <div className="flex items-center gap-1.5">
      {label}
      <span className="text-gray-400 group-hover:text-gray-600">
        {currentSort.key === sortKey ? (
          currentSort.direction === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-[#8B0000]" /> : <ArrowDown className="w-3.5 h-3.5 text-[#8B0000]" />
        ) : (
          <ArrowUpDown className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </span>
    </div>
  </th>
);

export default function ReservationsView({ reservations = [], isLoading = false, onUpdateReservationStatus, onBulkUpdateReservationStatus, onEdit }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [seatingFilter, setSeatingFilter] = useState('All Seating Areas');
  const [occasionFilter, setOccasionFilter] = useState('All Occasions');
  
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
  
  // bulk selection state
  const [selectedItems, setSelectedItems] = useState([]);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);

  // calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(new Date());

  // ─── LOAD MORE STATE ───
  const ITEMS_PER_LOAD = 10;
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // reset pagination when filters change
  useEffect(() => {
    setVisibleCount(ITEMS_PER_LOAD);
  }, [searchQuery, statusFilter, seatingFilter, occasionFilter, selectedDate]);

  // calendar Logic
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const calendarDays = [];
  
  for (let i = 0; i < firstDayOfMonth; i++) {
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0 - i);
    calendarDays.unshift({ date: d, isCurrentMonth: false });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
    calendarDays.push({ date: d, isCurrentMonth: true });
  }
  const totalSlots = calendarDays.length > 35 ? 42 : 35;
  const remaining = totalSlots - calendarDays.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, i);
    calendarDays.push({ date: d, isCurrentMonth: false });
  }

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));

  // stats Calculations
  const stats = useMemo(() => {
    const todayStr = new Date().toDateString();
    const todaysReservations = reservations.filter(r => new Date(r.date).toDateString() === todayStr);
    
    return {
      todayTotal: todaysReservations.length,
      confirmed: todaysReservations.filter(r => (r.status || '').toLowerCase() === 'confirmed').length,
      pending: todaysReservations.filter(r => (r.status || '').toLowerCase() === 'pending').length,
      cancelled: todaysReservations.filter(r => (r.status || '').toLowerCase() === 'cancelled').length,
      totalGuests: todaysReservations.reduce((sum, r) => sum + (Number(r.partySize) || Number(r.guests) || 0), 0)
    };
  }, [reservations]);

  // filtering Logic
  const filteredReservations = useMemo(() => {
    return reservations.filter(r => {
      const searchStr = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        r.customerName?.toLowerCase().includes(searchStr) || 
        r.customerPhone?.toLowerCase().includes(searchStr) ||
        r.customerEmail?.toLowerCase().includes(searchStr);

      const matchesStatus = statusFilter === 'All Status' || (r.status || '').toLowerCase() === statusFilter.toLowerCase();
      
      const loc = (r.location || r.seatingArea || '').toLowerCase();
      const matchesSeating = seatingFilter === 'All Seating Areas' || 
        (seatingFilter === 'Indoor' && loc.includes('indoor')) ||
        (seatingFilter === 'Outdoor' && loc.includes('outdoor')) ||
        (seatingFilter === 'Private' && loc.includes('private'));

      const occ = (r.occasion || '').toLowerCase();
      const matchesOccasion = occasionFilter === 'All Occasions' || occ.includes(occasionFilter.toLowerCase());

      const matchesDate = !selectedDate || new Date(r.date).toDateString() === selectedDate.toDateString();

      return matchesSearch && matchesStatus && matchesSeating && matchesOccasion && matchesDate;
    }).sort((a, b) => {
      if (sortConfig.key) {
        let valA = a[sortConfig.key] || '';
        let valB = b[sortConfig.key] || '';
        
        if (sortConfig.key === 'date' || sortConfig.key === 'time') {
          valA = new Date(a.date).getTime();
          valB = new Date(b.date).getTime();
        } else if (sortConfig.key === 'partySize') {
          valA = Number(a.partySize || a.guests || 0);
          valB = Number(b.partySize || b.guests || 0);
        } else if (typeof valA === 'string') {
          valA = valA.toLowerCase();
          valB = valB.toLowerCase();
        }
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      }
      return new Date(b.date) - new Date(a.date);
    });
  }, [reservations, searchQuery, statusFilter, seatingFilter, occasionFilter, selectedDate, sortConfig]);

  const exportToCSV = () => {
    if (!filteredReservations || filteredReservations.length === 0) {
      showToast('No data to export', 'error');
      return;
    }
    const headers = ['Time', 'Date', 'Customer Name', 'Customer Phone', 'Customer Email', 'Guests', 'Seating Area', 'Occasion', 'Status'];
    const rows = filteredReservations.map(r => [
      r.time,
      new Date(r.date).toLocaleDateString(),
      r.customerName,
      r.customerPhone,
      r.customerEmail || '',
      r.partySize || r.guests,
      r.location || r.seatingArea || 'Main Dining',
      r.occasion || 'Dinner',
      r.status
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.map(f => `"${String(f).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reservations_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // handle Load More Logic
  const displayedReservations = useMemo(() => {
    return filteredReservations.slice(0, visibleCount);
  }, [filteredReservations, visibleCount]);

  const hasMoreItems = visibleCount < filteredReservations.length;

  const tableHeaderRef = React.useRef(null);
  const tableBodyRef = React.useRef(null);
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(false);

  const handleScroll = () => {
    if (tableBodyRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tableBodyRef.current;
      if (tableHeaderRef.current) {
        tableHeaderRef.current.scrollLeft = scrollLeft;
      }
      setShowLeftButton(scrollLeft > 0);
      setShowRightButton(scrollLeft < scrollWidth - clientWidth - 5 && scrollWidth > clientWidth);
    }
  };

  useEffect(() => {
    handleScroll();
    window.addEventListener('resize', handleScroll);
    return () => window.removeEventListener('resize', handleScroll);
  }, [displayedReservations]);

  const scrollLeft = () => tableBodyRef.current?.scrollBy({ left: -300, behavior: 'smooth' });
  const scrollRight = () => tableBodyRef.current?.scrollBy({ left: 300, behavior: 'smooth' });

  const TableColGroup = () => (
    <colgroup>
      <col style={{ width: '60px' }} />
      <col style={{ width: '120px' }} />
      <col style={{ width: '200px' }} />
      <col style={{ width: '200px' }} />
      <col style={{ width: '100px' }} />
      <col style={{ width: '140px' }} />
      <col style={{ width: '120px' }} />
      <col style={{ width: '80px' }} />
    </colgroup>
  );

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount(prev => prev + ITEMS_PER_LOAD);
      setIsLoadingMore(false);
    }, 400); // 400ms premium delay
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return <span className="text-[#10B981] font-bold text-xs bg-[#10B981]/10 px-2 py-1 rounded">Confirmed</span>;
      case 'pending': return <span className="text-[#F59E0B] font-bold text-xs bg-[#F59E0B]/10 px-2 py-1 rounded">Pending</span>;
      case 'seated': return <span className="text-[#3B82F6] font-bold text-xs bg-[#3B82F6]/10 px-2 py-1 rounded">Seated</span>;
      case 'completed': return <span className="text-[#10B981] font-bold text-xs bg-[#10B981]/10 px-2 py-1 rounded">Completed</span>;
      case 'cancelled': return <span className="text-[#DC2626] font-bold text-xs bg-[#fef2f2] px-2 py-1 rounded">Cancelled</span>;
      default: return <span className="text-[#6b7280] font-bold text-xs capitalize bg-[#f3f4f6] px-2 py-1 rounded">{status}</span>;
    }
  };

  // bulk Handlers
  const handleSelectAll = (e) => {
    const pageIds = displayedReservations.map(r => r._id);
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
    if (!onBulkUpdateReservationStatus) return;
    setIsProcessingBulk(true);
    try {
      await onBulkUpdateReservationStatus(selectedItems, status);
      setSelectedItems([]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessingBulk(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-full bg-transparent text-admin-text relative space-y-6">
      
      {/* ─── RESPONSIVE SPLIT (xl:flex-row handles iPad/Mobile layouts) ─── */}
      <div className="flex flex-col xl:flex-row flex-1 gap-6 overflow-hidden">
        
        {/* Left Column (Table & Main Content) */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar pb-24 pr-1">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 pt-2 px-1 mb-6">
            <div>
              <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-admin-text tracking-tight">
                Reservations
              </h1>
              <p className="text-xs sm:text-sm text-admin-text-secondary mt-1">
                Manage table bookings, guest headcounts, and seating arrangements.
              </p>
            </div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <button 
                onClick={exportToCSV} 
                className="bg-admin-surface border border-admin-border text-admin-text rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold flex items-center gap-2 hover:bg-admin-surface-light transition-all shadow-2xs cursor-pointer"
              >
                <Download className="w-4 h-4 text-admin-text-muted" /> Export
              </button>
              <button 
                onClick={() => onEdit && onEdit(null)} 
                className="bg-brand text-white rounded-xl px-4 py-2 text-xs sm:text-sm font-bold flex items-center gap-2 hover:brightness-110 transition-all shadow-sm cursor-pointer"
              >
                + New Reservation
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4 mb-6 shrink-0 px-1">
            <StatCard label="Today's Res." value={stats.todayTotal} icon={Calendar} color="bg-amber-500/15 text-amber-500" />
            <StatCard label="Confirmed" value={stats.confirmed} icon={CheckCircle2} color="bg-emerald-500/15 text-emerald-500" />
            <StatCard label="Pending" value={stats.pending} icon={Clock} color="bg-amber-500/15 text-amber-500" />
            <StatCard label="Cancelled" value={stats.cancelled} icon={XCircle} color="bg-rose-500/15 text-rose-500" />
            <StatCard label="Guests Today" value={stats.totalGuests} icon={Users} color="bg-blue-500/15 text-blue-500" />
          </div>

          <div className="bg-admin-card rounded-2xl shadow-sm border border-admin-border flex flex-col flex-1 relative group">
            
            {/* STICKY TOP SECTION */}
            <div className="sticky top-0 z-40 bg-admin-surface/95 backdrop-blur-md rounded-t-2xl flex flex-col shadow-sm border-b border-admin-border">
              <div className="p-4 flex flex-wrap gap-3.5 items-center justify-between">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="w-4 h-4 text-admin-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input 
                  type="text" 
                  placeholder="Search by name, phone or email..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-admin-border text-xs sm:text-sm text-admin-text bg-admin-surface outline-none focus:border-brand transition-colors placeholder:text-admin-text-muted"
                />
              </div>
              
              <div className="flex items-center gap-2.5 flex-wrap">
                <select 
                  value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-admin-surface border border-admin-border rounded-xl px-3 py-2 text-xs font-semibold text-admin-text outline-none hover:border-brand/40 transition-colors cursor-pointer"
                >
                  <option>All Status</option>
                  <option>Confirmed</option>
                  <option>Pending</option>
                  <option>Seated</option>
                  <option>Cancelled</option>
                </select>

                <select 
                  value={seatingFilter} onChange={(e) => setSeatingFilter(e.target.value)}
                  className="bg-admin-surface border border-admin-border rounded-xl px-3 py-2 text-xs font-semibold text-admin-text outline-none hover:border-brand/40 transition-colors cursor-pointer"
                >
                  <option>All Seating Areas</option>
                  <option>Indoor</option>
                  <option>Outdoor</option>
                  <option>Private</option>
                </select>

                <div className="bg-admin-surface border border-admin-border rounded-xl px-3 py-2 text-xs text-admin-text font-semibold flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-brand" />
                  {selectedDate ? selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'All Dates'}
                  {selectedDate && (
                    <button onClick={() => setSelectedDate(null)} className="ml-1 text-admin-text-muted hover:text-admin-text transition-colors cursor-pointer">
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              </div>

              {/* Table Header (Synced horizontal scroll) */}
              <div className="overflow-hidden" ref={tableHeaderRef}>
                <table className="w-full text-left border-collapse min-w-[1020px] table-fixed">
                  <TableColGroup />
                  <thead className="bg-admin-surface-light border-b border-admin-border text-admin-text-secondary">
                    <tr className="text-xs font-bold uppercase tracking-wider">
                      <th className="px-4 py-3.5 text-center">
                        <input 
                          type="checkbox" 
                          className="rounded border-admin-border text-brand focus:ring-brand accent-brand cursor-pointer"
                          checked={displayedReservations.length > 0 && displayedReservations.every(r => selectedItems.includes(r._id))}
                          onChange={handleSelectAll}
                        />
                      </th>
                      <SortHeader label="Time" sortKey="time" currentSort={sortConfig} onSort={handleSort} />
                      <SortHeader label="Customer" sortKey="customerName" currentSort={sortConfig} onSort={handleSort} />
                      <th className="px-4 py-3.5">Contact</th>
                      <SortHeader label="Guests" sortKey="partySize" currentSort={sortConfig} onSort={handleSort} />
                      <SortHeader label="Seating Area" sortKey="location" currentSort={sortConfig} onSort={handleSort} />
                      <SortHeader label="Status" sortKey="status" currentSort={sortConfig} onSort={handleSort} />
                      <th className="px-4 py-3.5 text-center">Action</th>
                    </tr>
                  </thead>
                </table>
              </div>
            </div>

            {/* STICKY VERTICAL BUTTONS */}
            <div className="sticky top-[50vh] h-0 z-30 w-full pointer-events-none flex justify-between px-2">
              {showLeftButton && (
                <button onClick={scrollLeft} className="pointer-events-auto w-9 h-9 bg-admin-surface shadow-md border border-admin-border rounded-full flex items-center justify-center text-admin-text hover:text-brand hover:bg-admin-surface-light transition-all absolute left-2 -translate-y-1/2 cursor-pointer">
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              {showRightButton && (
                <button onClick={scrollRight} className="pointer-events-auto w-9 h-9 bg-admin-surface shadow-md border border-admin-border rounded-full flex items-center justify-center text-admin-text hover:text-brand hover:bg-admin-surface-light transition-all absolute right-2 -translate-y-1/2 cursor-pointer">
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* TABLE BODY */}
            <div className="overflow-x-auto flex-1 custom-scrollbar w-full" ref={tableBodyRef} onScroll={handleScroll}>
              <table className="w-full text-left border-collapse min-w-[1020px] table-fixed">
                <TableColGroup />
                <tbody className="divide-y divide-admin-border">
                  {isLoading ? (
                    [...Array(5)].map((_, idx) => (
                      <tr key={`skeleton-${idx}`} className="animate-pulse bg-admin-surface border-b border-admin-border">
                        <td className="px-4 py-4 text-center"><div className="w-4 h-4 bg-admin-surface-light rounded mx-auto"></div></td>
                        <td className="px-4 py-4 space-y-2">
                          <div className="w-16 h-4 bg-admin-surface-light rounded"></div>
                          <div className="w-20 h-3 bg-admin-surface-light rounded"></div>
                        </td>
                        <td className="px-4 py-4 space-y-2">
                          <div className="w-24 h-4 bg-admin-surface-light rounded"></div>
                          <div className="w-16 h-3 bg-admin-surface-light rounded"></div>
                        </td>
                        <td className="px-4 py-4 space-y-2">
                          <div className="w-20 h-3 bg-admin-surface-light rounded"></div>
                          <div className="w-24 h-3 bg-admin-surface-light rounded"></div>
                        </td>
                        <td className="px-4 py-4 space-y-2">
                          <div className="w-10 h-4 bg-admin-surface-light rounded"></div>
                          <div className="w-12 h-3 bg-admin-surface-light rounded"></div>
                        </td>
                        <td className="px-4 py-4 space-y-2">
                          <div className="w-20 h-4 bg-admin-surface-light rounded"></div>
                          <div className="w-16 h-3 bg-admin-surface-light rounded"></div>
                        </td>
                        <td className="px-4 py-4"><div className="w-20 h-6 bg-admin-surface-light rounded"></div></td>
                        <td className="px-4 py-4"><div className="w-6 h-6 bg-admin-surface-light rounded mx-auto"></div></td>
                      </tr>
                    ))
                  ) : displayedReservations.map((res) => {
                    const isSelected = selectedItems.includes(res._id);
                    return (
                      <tr key={res._id} className={`transition-colors group ${isSelected ? 'bg-brand/10' : 'hover:bg-admin-surface-light/40'}`}>
                        <td className="px-4 py-4 text-center">
                          <input 
                            type="checkbox" 
                            className="rounded border-admin-border text-brand focus:ring-brand accent-brand cursor-pointer"
                            checked={isSelected}
                            onChange={() => handleSelectItem(res._id)}
                          />
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm font-bold text-admin-text">{res.time}</p>
                          <p className="text-xs text-admin-text-secondary mt-0.5">{new Date(res.date).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}</p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm font-bold text-admin-text group-hover:text-brand transition-colors">{res.customerName}</p>
                          <p className="text-xs text-admin-text-secondary mt-0.5">{res.table || 'Table TBD'}</p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-xs text-admin-text flex items-center gap-1.5"><Phone className="w-3 h-3 text-admin-text-muted"/> {res.customerPhone}</p>
                          {res.customerEmail && <p className="text-xs text-admin-text-secondary flex items-center gap-1.5 mt-0.5">✉ {res.customerEmail}</p>}
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm font-bold text-admin-text">{res.partySize || res.guests}</p>
                          <p className="text-xs text-admin-text-secondary">Adults</p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-xs font-bold text-admin-text">{res.location || 'Main Dining'}</p>
                          <p className="text-xs text-admin-text-secondary">{res.occasion || 'Dinner'}</p>
                        </td>
                        <td className="px-4 py-4">
                          {getStatusBadge(res.status)}
                        </td>
                        <td className="px-4 py-4">
                          <div className={`flex items-center justify-center gap-1 transition-opacity ${openMenuId === res._id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                            <button onClick={() => onEdit && onEdit(res)} className="p-1.5 text-admin-text-secondary hover:text-admin-text hover:bg-admin-surface rounded-lg border border-transparent hover:border-admin-border transition-all cursor-pointer"><Edit3 className="w-4 h-4" /></button>
                            <div className="relative">
                              <button onClick={() => setOpenMenuId(openMenuId === res._id ? null : res._id)} className="p-1.5 text-admin-text-secondary hover:text-admin-text hover:bg-admin-surface rounded-lg border border-transparent hover:border-admin-border transition-all cursor-pointer"><MoreVertical className="w-4 h-4" /></button>
                              {openMenuId === res._id && (
                                <>
                                  <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)}></div>
                                  <div className="absolute right-0 mt-1 w-36 bg-admin-surface rounded-xl shadow-xl border border-admin-border z-50 overflow-hidden py-1">
                                    <button onClick={() => { setOpenMenuId(null); onUpdateReservationStatus && onUpdateReservationStatus(res._id, 'confirmed'); }} className="w-full text-left px-3.5 py-2 text-xs font-bold text-emerald-500 hover:bg-admin-surface-light transition-colors cursor-pointer">Confirm</button>
                                    <button onClick={() => { setOpenMenuId(null); onUpdateReservationStatus && onUpdateReservationStatus(res._id, 'seated'); }} className="w-full text-left px-3.5 py-2 text-xs font-bold text-blue-500 hover:bg-admin-surface-light transition-colors cursor-pointer">Mark Seated</button>
                                    <button onClick={() => { setOpenMenuId(null); onUpdateReservationStatus && onUpdateReservationStatus(res._id, 'cancelled'); }} className="w-full text-left px-3.5 py-2 text-xs font-bold text-rose-500 hover:bg-rose-500/10 border-t border-admin-border transition-colors cursor-pointer">Cancel</button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  
                  {/* Empty State */}
                  {displayedReservations.length === 0 && (
                    <tr>
                      <td colSpan="8" className="p-8">
                        <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-admin-border rounded-xl bg-admin-surface-light/30 max-w-sm mx-auto">
                          <Calendar className="w-10 h-10 text-admin-text-muted mb-3" />
                          <p className="text-sm font-bold text-admin-text">No reservations found</p>
                          <p className="text-xs text-admin-text-secondary mt-1">Try adjusting your filters or date selection.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* ─── LOAD MORE BUTTON ─── */}
            <div className="p-4 border-t border-admin-border flex items-center justify-between bg-admin-surface rounded-b-2xl">
              <span className="text-xs font-semibold text-admin-text-secondary">
                Showing <strong className="text-admin-text">{displayedReservations.length}</strong> of <strong className="text-admin-text">{filteredReservations.length}</strong> reservations
              </span>
              
              {hasMoreItems && (
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="flex items-center justify-center gap-2 w-[160px] h-[36px] bg-admin-surface border border-admin-border text-admin-text rounded-xl text-xs sm:text-[13px] font-bold hover:bg-admin-surface-light hover:border-brand/40 transition-all shadow-2xs cursor-pointer"
                >
                  {isLoadingMore ? <><Loader2 className="w-4 h-4 animate-spin text-brand" /> Loading...</> : 'Load More'}
                </button>
              )}
            </div>
            
            {/* Floating Bulk Action Bar */}
            {selectedItems.length > 0 && (
              <div className="fixed bottom-8 left-[calc(50%-160px)] -translate-x-1/2 z-50 bg-slate-900/95 dark:bg-[#0f172a]/95 backdrop-blur-md text-white border border-slate-700/60 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-5">
                <span className="text-xs font-bold whitespace-nowrap bg-white/10 px-2.5 py-1 rounded-lg">
                  {selectedItems.length} Selected
                </span>
                <div className="flex items-center gap-2 border-l border-white/20 pl-4">
                  <button 
                    disabled={isProcessingBulk}
                    onClick={() => handleBulkAction('confirmed')}
                    className="text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg disabled:opacity-50 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {isProcessingBulk ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Confirm
                  </button>
                  <button 
                    disabled={isProcessingBulk}
                    onClick={() => handleBulkAction('seated')}
                    className="text-xs font-bold text-blue-400 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg disabled:opacity-50 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {isProcessingBulk ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Users className="w-3.5 h-3.5" />} Mark Seated
                  </button>
                  <button 
                    disabled={isProcessingBulk}
                    onClick={() => handleBulkAction('cancelled')}
                    className="text-xs font-bold text-rose-400 hover:bg-rose-500/20 px-3 py-1.5 rounded-lg disabled:opacity-50 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {isProcessingBulk ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />} Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar (Calendar & Occupancy) */}
        <div className="w-full xl:w-[320px] shrink-0 overflow-y-auto custom-scrollbar space-y-6 pb-6 pr-1">
          
          <div className="bg-admin-card rounded-2xl shadow-sm border border-admin-border p-5">
            <h3 className="font-heading text-sm font-bold text-admin-text mb-4">Reservation Calendar</h3>
            <div className="flex justify-between items-center mb-4">
              <button onClick={prevMonth} className="p-1 border border-admin-border rounded-lg hover:bg-admin-surface-light transition-colors text-admin-text-secondary cursor-pointer"><ChevronLeft className="w-4 h-4"/></button>
              <span className="text-xs font-bold text-admin-text font-heading">{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
              <button onClick={nextMonth} className="p-1 border border-admin-border rounded-lg hover:bg-admin-surface-light transition-colors text-admin-text-secondary cursor-pointer"><ChevronRight className="w-4 h-4"/></button>
              <button onClick={() => { setSelectedDate(new Date()); setCurrentMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1)); }} className="text-xs font-bold border border-admin-border rounded-lg px-2.5 py-1 ml-1 hover:bg-admin-surface-light text-admin-text transition-colors shadow-2xs cursor-pointer">Today</button>
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-[11px] font-bold text-admin-text-secondary">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {calendarDays.map((dayObj, i) => {
                const isSelected = selectedDate && dayObj.date.toDateString() === selectedDate.toDateString();
                const dayRes = reservations.filter(r => new Date(r.date).toDateString() === dayObj.date.toDateString());
                const hasConfirmed = dayRes.some(r => r.status === 'confirmed');
                const hasPending = dayRes.some(r => r.status === 'pending');
                const hasSeated = dayRes.some(r => r.status === 'seated');

                return (
                  <div 
                    key={i} 
                    onClick={() => setSelectedDate(dayObj.date)}
                    className={`h-8 flex flex-col items-center justify-center rounded-xl text-xs cursor-pointer transition-all ${isSelected ? 'bg-brand text-white font-bold shadow-sm' : dayObj.isCurrentMonth ? 'text-admin-text hover:bg-admin-surface-light font-medium' : 'text-admin-text-muted opacity-40'}`}
                  >
                    {dayObj.date.getDate()}
                    <div className="flex justify-center gap-0.5 mt-0.5 min-h-[4px]">
                      {hasConfirmed && <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-500'}`}></div>}
                      {hasPending && <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white/70' : 'bg-amber-500'}`}></div>}
                      {hasSeated && <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white/50' : 'bg-blue-500'}`}></div>}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between gap-2 mt-4 pt-4 border-t border-admin-border">
              <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div><span className="text-[11px] text-admin-text-secondary font-medium">Confirmed</span></div>
              <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div><span className="text-[11px] text-admin-text-secondary font-medium">Pending</span></div>
              <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div><span className="text-[11px] text-admin-text-secondary font-medium">Seated</span></div>
            </div>
          </div>

          <div className="bg-admin-card rounded-2xl shadow-sm border border-admin-border p-5">
            <h3 className="font-heading text-sm font-bold text-admin-text mb-4">Today's Occupancy</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="border border-admin-border rounded-xl p-3 text-center bg-admin-surface-light">
                <p className="text-[11px] font-bold text-admin-text-secondary uppercase">Total Bookings</p>
                <p className="text-xl font-bold font-heading text-admin-text mt-1">{stats.todayTotal}</p>
              </div>
              <div className="border border-admin-border rounded-xl p-3 text-center bg-admin-surface-light">
                <p className="text-[11px] font-bold text-admin-text-secondary uppercase">Expected Guests</p>
                <p className="text-xl font-bold font-heading text-emerald-500 mt-1">{stats.totalGuests}</p>
              </div>
              <div className="border border-admin-border rounded-xl p-3 text-center bg-admin-surface-light">
                <p className="text-[11px] font-bold text-admin-text-secondary uppercase">Currently Seated</p>
                <p className="text-xl font-bold font-heading text-blue-500 mt-1">
                  {reservations.filter(r => new Date(r.date).toDateString() === new Date().toDateString() && r.status === 'seated').length}
                </p>
              </div>
              <div className="border border-admin-border rounded-xl p-3 text-center bg-admin-surface-light">
                <p className="text-[11px] font-bold text-admin-text-secondary uppercase">Pending</p>
                <p className="text-xl font-bold font-heading text-amber-500 mt-1">{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-admin-card rounded-2xl shadow-sm border border-admin-border p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-heading text-sm font-bold text-admin-text">Upcoming Today</h3>
            </div>
            <div className="space-y-4">
              {reservations.filter(r => new Date(r.date).toDateString() === new Date().toDateString()).slice(0,4).map((r, i) => (
                <div key={i} className="flex justify-between items-start border-b border-admin-border pb-3 last:border-0 last:pb-0">
                  <div className="flex items-start gap-3">
                    <p className="text-xs font-bold text-admin-text w-14">{r.time}</p>
                    <div>
                      <p className="text-xs font-bold text-admin-text">{r.customerName}</p>
                      <p className="text-xs text-admin-text-secondary mt-0.5">{r.table || 'Table TBD'} • {r.partySize || r.guests} Guests</p>
                    </div>
                  </div>
                  {getStatusBadge(r.status)}
                </div>
              ))}
              {reservations.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 border border-dashed border-admin-border rounded-xl bg-admin-surface-light/30">
                  <Clock className="w-8 h-8 text-admin-text-muted mb-2" />
                  <p className="text-xs font-bold text-admin-text-muted">No upcoming reservations</p>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}