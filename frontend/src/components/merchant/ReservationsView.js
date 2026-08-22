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
    <div className="flex flex-col h-full bg-[#F8FAFC]">
      
      {/* ─── RESPONSIVE SPLIT (xl:flex-row handles iPad/Mobile layouts) ─── */}
      <div className="flex flex-col xl:flex-row flex-1 gap-6 overflow-hidden">
        
        {/* Left Column (Table & Main Content) */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar pb-24 pr-2">
          
          <div className="mb-6 shrink-0 pt-2 px-1">
            <h1 className="text-2xl font-bold text-[#111827]">Reservations</h1>
            <p className="text-sm text-[#6b7280] mt-1">Manage table reservations and seating arrangements.</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6 shrink-0">
            <StatCard title="Today's Res." value={stats.todayTotal} icon={Calendar} iconColor="text-[#F59E0B]" iconBg="bg-[#fef3c7]" />
            <StatCard title="Confirmed" value={stats.confirmed} icon={CheckCircle2} iconColor="text-[#10B981]" iconBg="bg-[#dcfce7]" />
            <StatCard title="Pending" value={stats.pending} icon={Clock} iconColor="text-[#F59E0B]" iconBg="bg-[#fef3c7]" />
            <StatCard title="Cancelled" value={stats.cancelled} icon={XCircle} iconColor="text-[#DC2626]" iconBg="bg-[#fef2f2]" />
            <StatCard title="Guests Today" value={stats.totalGuests} icon={Users} iconColor="text-[#10B981]" iconBg="bg-[#dcfce7]" />
          </div>

          <div className="bg-white rounded-[20px] shadow-sm border border-[#e5e7eb] flex flex-col flex-1 relative group">
            
            {/* STICKY TOP SECTION */}
            <div className="sticky top-[72px] z-40 bg-white rounded-t-[20px] flex flex-col shadow-sm">
              <div className="p-4 border-b border-[#f3f4f6] flex flex-wrap gap-4 items-center justify-between">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="w-4 h-4 text-[#9ca3af] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input 
                  type="text" 
                  placeholder="Search by name, phone or email..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full !pl-10 py-2 rounded-lg border border-[#e5e7eb] text-sm text-[#111827] bg-[#f9fafb] outline-none focus:border-[#8b0000] transition-colors"
                />
              </div>
              
              <div className="flex items-center gap-3 flex-wrap">
                <select 
                  value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#374151] font-medium outline-none hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <option>All Status</option>
                  <option>Confirmed</option>
                  <option>Pending</option>
                  <option>Seated</option>
                  <option>Cancelled</option>
                </select>

                <select 
                  value={seatingFilter} onChange={(e) => setSeatingFilter(e.target.value)}
                  className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#374151] font-medium outline-none hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <option>All Seating Areas</option>
                  <option>Indoor</option>
                  <option>Outdoor</option>
                  <option>Private</option>
                </select>

                <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#374151] font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#6b7280]" />
                  {selectedDate ? selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'All Dates'}
                  {selectedDate && (
                    <button onClick={() => setSelectedDate(null)} className="ml-2 text-[#9ca3af] hover:text-[#374151] transition-colors">
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button onClick={exportToCSV} className="bg-white border border-[#e5e7eb] text-[#374151] rounded-lg px-4 py-2 text-sm font-bold flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm hover:shadow">
                  <Download className="w-4 h-4" /> Export
                </button>
                <button onClick={() => onEdit && onEdit(null)} className="bg-[#8B0000] text-white rounded-lg px-4 py-2 text-sm font-bold flex items-center gap-2 hover:bg-red-900 transition-all shadow-sm hover:shadow">
                  + New Reservation
                </button>
              </div>
              </div>

              {/* Table Header (Synced horizontal scroll) */}
              <div className="border-b border-[#f3f4f6] overflow-hidden" ref={tableHeaderRef}>
                <table className="w-full text-left border-collapse min-w-[1020px] table-fixed">
                  <TableColGroup />
                  <thead className="bg-white">
                    <tr className="text-xs font-bold text-[#6b7280] uppercase tracking-wider">
                      <th className="px-4 py-4 text-center">
                        <input 
                          type="checkbox" 
                          className="rounded !bg-white border-[#d1d5db] text-[#8B0000] focus:ring-[#8B0000] cursor-pointer"
                          style={{ backgroundColor: 'white' }}
                          checked={displayedReservations.length > 0 && displayedReservations.every(r => selectedItems.includes(r._id))}
                          onChange={handleSelectAll}
                        />
                      </th>
                      <SortHeader label="Time" sortKey="time" currentSort={sortConfig} onSort={handleSort} />
                      <SortHeader label="Customer" sortKey="customerName" currentSort={sortConfig} onSort={handleSort} />
                      <th className="px-4 py-4">Contact</th>
                      <SortHeader label="Guests" sortKey="partySize" currentSort={sortConfig} onSort={handleSort} />
                      <SortHeader label="Seating Area" sortKey="location" currentSort={sortConfig} onSort={handleSort} />
                      <SortHeader label="Status" sortKey="status" currentSort={sortConfig} onSort={handleSort} />
                      <th className="px-4 py-4 text-center">Action</th>
                    </tr>
                  </thead>
                </table>
              </div>
            </div>

            {/* STICKY VERTICAL BUTTONS */}
            <div className="sticky top-[50vh] h-0 z-30 w-full pointer-events-none flex justify-between px-2">
              {showLeftButton && (
                <button onClick={scrollLeft} className="pointer-events-auto w-9 h-9 bg-white shadow-md border border-[#e5e7eb] rounded-full flex items-center justify-center text-[#374151] hover:text-[#8B0000] hover:bg-gray-50 transition-all absolute left-2 -translate-y-1/2">
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              {showRightButton && (
                <button onClick={scrollRight} className="pointer-events-auto w-9 h-9 bg-white shadow-md border border-[#e5e7eb] rounded-full flex items-center justify-center text-[#374151] hover:text-[#8B0000] hover:bg-gray-50 transition-all absolute right-2 -translate-y-1/2">
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* TABLE BODY */}
            <div className="overflow-x-auto flex-1 custom-scrollbar w-full" ref={tableBodyRef} onScroll={handleScroll}>
              <table className="w-full text-left border-collapse min-w-[1020px] table-fixed">
                <TableColGroup />
                <tbody className="divide-y divide-[#f9fafb]">
                  {isLoading ? (
                    [...Array(5)].map((_, idx) => (
                      <tr key={`skeleton-${idx}`} className="animate-pulse bg-white border-b border-[#f3f4f6]">
                        <td className="px-4 py-4 text-center"><div className="w-4 h-4 bg-gray-200 rounded mx-auto"></div></td>
                        <td className="px-4 py-4 space-y-2">
                          <div className="w-16 h-4 bg-gray-200 rounded"></div>
                          <div className="w-20 h-3 bg-gray-200 rounded"></div>
                        </td>
                        <td className="px-4 py-4 space-y-2">
                          <div className="w-24 h-4 bg-gray-200 rounded"></div>
                          <div className="w-16 h-3 bg-gray-200 rounded"></div>
                        </td>
                        <td className="px-4 py-4 space-y-2">
                          <div className="w-20 h-3 bg-gray-200 rounded"></div>
                          <div className="w-24 h-3 bg-gray-200 rounded"></div>
                        </td>
                        <td className="px-4 py-4 space-y-2">
                          <div className="w-10 h-4 bg-gray-200 rounded"></div>
                          <div className="w-12 h-3 bg-gray-200 rounded"></div>
                        </td>
                        <td className="px-4 py-4 space-y-2">
                          <div className="w-20 h-4 bg-gray-200 rounded"></div>
                          <div className="w-16 h-3 bg-gray-200 rounded"></div>
                        </td>
                        <td className="px-4 py-4"><div className="w-20 h-6 bg-gray-200 rounded"></div></td>
                        <td className="px-4 py-4"><div className="w-6 h-6 bg-gray-200 rounded mx-auto"></div></td>
                      </tr>
                    ))
                  ) : displayedReservations.map((res) => {
                    const isSelected = selectedItems.includes(res._id);
                    return (
                      <tr key={res._id} className={`transition-colors group ${isSelected ? 'bg-red-50' : 'hover:bg-[#f9fafb]'}`}>
                        <td className="px-4 py-4 text-center">
                          <input 
                            type="checkbox" 
                            className="rounded !bg-white border-[#d1d5db] text-[#8B0000] focus:ring-[#8B0000] cursor-pointer"
                            style={{ backgroundColor: 'white' }}
                            checked={isSelected}
                            onChange={() => handleSelectItem(res._id)}
                          />
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm font-bold text-[#111827]">{res.time}</p>
                          <p className="text-xs text-[#6b7280]">{new Date(res.date).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}</p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm font-bold text-[#111827]">{res.customerName}</p>
                          <p className="text-xs text-[#6b7280]">{res.table || 'Table TBD'}</p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-xs text-[#374151] flex items-center gap-1.5"><Phone className="w-3 h-3 text-[#9ca3af]"/> {res.customerPhone}</p>
                          {res.customerEmail && <p className="text-xs text-[#6b7280] flex items-center gap-1.5 mt-0.5">✉ {res.customerEmail}</p>}
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm font-bold text-[#111827]">{res.partySize || res.guests}</p>
                          <p className="text-xs text-[#6b7280]">Adults</p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-xs font-bold text-[#374151]">{res.location || 'Main Dining'}</p>
                          <p className="text-xs text-[#6b7280]">{res.occasion || 'Dinner'}</p>
                        </td>
                        <td className="px-4 py-4">
                          {getStatusBadge(res.status)}
                        </td>
                        <td className="px-4 py-4">
                          <div className={`flex items-center justify-center gap-1 transition-opacity ${openMenuId === res._id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                            <button onClick={() => onEdit && onEdit(res)} className="p-1.5 text-[#9ca3af] hover:text-[#374151] hover:bg-white rounded border border-transparent hover:border-[#e5e7eb] transition-all"><Edit3 className="w-4 h-4" /></button>
                            <div className="relative">
                              <button onClick={() => setOpenMenuId(openMenuId === res._id ? null : res._id)} className="p-1.5 text-[#9ca3af] hover:text-[#374151] hover:bg-white rounded border border-transparent hover:border-[#e5e7eb] transition-all"><MoreVertical className="w-4 h-4" /></button>
                              {openMenuId === res._id && (
                                <>
                                  <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)}></div>
                                  <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-[#e5e7eb] z-50 overflow-hidden">
                                    <button onClick={() => { setOpenMenuId(null); onUpdateReservationStatus && onUpdateReservationStatus(res._id, 'confirmed'); }} className="w-full text-left px-4 py-2.5 text-xs font-bold text-[#10B981] hover:bg-[#f9fafb] transition-colors">Confirm</button>
                                    <button onClick={() => { setOpenMenuId(null); onUpdateReservationStatus && onUpdateReservationStatus(res._id, 'seated'); }} className="w-full text-left px-4 py-2.5 text-xs font-bold text-[#3B82F6] hover:bg-[#f9fafb] transition-colors">Mark Seated</button>
                                    <button onClick={() => { setOpenMenuId(null); onUpdateReservationStatus && onUpdateReservationStatus(res._id, 'cancelled'); }} className="w-full text-left px-4 py-2.5 text-xs font-bold text-[#DC2626] hover:bg-[#fef2f2] border-t border-[#f3f4f6] transition-colors">Cancel</button>
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
                        <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-[#e5e7eb] rounded-xl bg-[#f9fafb]">
                          <Calendar className="w-10 h-10 text-[#d1d5db] mb-3" />
                          <p className="text-sm font-bold text-[#9ca3af]">No reservations found</p>
                          <p className="text-xs text-[#9ca3af] mt-1">Try adjusting your filters or date selection.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* ─── LOAD MORE BUTTON ─── */}
            <div className="p-4 border-t border-[#f3f4f6] flex items-center justify-between bg-white rounded-b-[20px]">
              <span className="text-xs font-semibold text-[#6b7280]">
                Showing <strong className="text-[#374151]">{displayedReservations.length}</strong> of <strong className="text-[#374151]">{filteredReservations.length}</strong> reservations
              </span>
              
              {hasMoreItems && (
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="flex items-center justify-center gap-2 w-[160px] h-[36px] bg-white border border-[#e5e7eb] text-[#374151] rounded-lg text-[13px] font-bold hover:bg-[#f9fafb] hover:text-[#8B0000] hover:border-[#8B0000] transition-all shadow-sm"
                >
                  {isLoadingMore ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading...</> : 'Load More'}
                </button>
              )}
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
                    onClick={() => handleBulkAction('confirmed')}
                    className="text-xs font-bold text-white bg-[#10B981] hover:bg-[#059669] px-3 py-1.5 rounded disabled:opacity-50 flex items-center gap-1 transition-colors"
                  >
                    {isProcessingBulk ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />} Confirm
                  </button>
                  <button 
                    disabled={isProcessingBulk}
                    onClick={() => handleBulkAction('seated')}
                    className="text-xs font-bold text-white bg-[#3B82F6] hover:bg-[#2563EB] px-3 py-1.5 rounded disabled:opacity-50 flex items-center gap-1 transition-colors"
                  >
                    {isProcessingBulk ? <Loader2 className="w-3 h-3 animate-spin" /> : <Users className="w-3 h-3" />} Mark Seated
                  </button>
                  <button 
                    disabled={isProcessingBulk}
                    onClick={() => handleBulkAction('cancelled')}
                    className="text-xs font-bold text-white bg-[#DC2626] hover:bg-[#B91C1C] px-3 py-1.5 rounded disabled:opacity-50 flex items-center gap-1 transition-colors"
                  >
                    {isProcessingBulk ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />} Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar (Calendar & Occupancy) */}
        <div className="w-full xl:w-[320px] shrink-0 overflow-y-auto custom-scrollbar space-y-6 pb-6 pr-2">
          
          <div className="bg-white rounded-xl shadow-sm border border-[#e5e7eb] p-5">
            <h3 className="text-sm font-bold text-[#111827] mb-4">Reservation Calendar</h3>
            <div className="flex justify-between items-center mb-4">
              <button onClick={prevMonth} className="p-1 border border-[#e5e7eb] rounded hover:bg-[#f9fafb] transition-colors"><ChevronLeft className="w-4 h-4 text-[#6b7280]"/></button>
              <span className="text-xs font-bold text-[#111827]">{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
              <button onClick={nextMonth} className="p-1 border border-[#e5e7eb] rounded hover:bg-[#f9fafb] transition-colors"><ChevronRight className="w-4 h-4 text-[#6b7280]"/></button>
              <button onClick={() => { setSelectedDate(new Date()); setCurrentMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1)); }} className="text-xs font-bold border border-[#e5e7eb] rounded px-3 py-1 ml-2 hover:bg-[#f9fafb] text-[#374151] transition-colors shadow-sm">Today</button>
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-xs font-bold text-[#6b7280]">{d}</div>
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
                    className={`h-8 flex flex-col items-center justify-center rounded-full text-xs cursor-pointer transition-all ${isSelected ? 'bg-[#8B0000] text-white font-bold shadow-sm' : dayObj.isCurrentMonth ? 'text-[#374151] hover:bg-[#f9fafb] font-medium' : 'text-[#d1d5db]'}`}
                  >
                    {dayObj.date.getDate()}
                    <div className="flex justify-center gap-0.5 mt-0.5 min-h-[4px]">
                      {hasConfirmed && <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-[#10B981]'}`}></div>}
                      {hasPending && <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white/70' : 'bg-[#F59E0B]'}`}></div>}
                      {hasSeated && <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white/50' : 'bg-[#3B82F6]'}`}></div>}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between gap-2 mt-4 pt-4 border-t border-[#f3f4f6]">
              <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></div><span className="text-xs text-[#6b7280] font-medium">Confirmed</span></div>
              <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]"></div><span className="text-xs text-[#6b7280] font-medium">Pending</span></div>
              <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]"></div><span className="text-xs text-[#6b7280] font-medium">Seated</span></div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-[#e5e7eb] p-5">
            <h3 className="text-sm font-bold text-[#111827] mb-4">Today's Occupancy</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="border border-[#e5e7eb] rounded-lg p-3 text-center bg-[#f9fafb]">
                <p className="text-xs font-bold text-[#6b7280] uppercase">Total Bookings</p>
                <p className="text-xl font-bold text-[#111827] mt-1">{stats.todayTotal}</p>
              </div>
              <div className="border border-[#e5e7eb] rounded-lg p-3 text-center bg-[#f9fafb]">
                <p className="text-xs font-bold text-[#6b7280] uppercase">Expected Guests</p>
                <p className="text-xl font-bold text-[#10B981] mt-1">{stats.totalGuests}</p>
              </div>
              <div className="border border-[#e5e7eb] rounded-lg p-3 text-center bg-[#f9fafb]">
                <p className="text-xs font-bold text-[#6b7280] uppercase">Currently Seated</p>
                <p className="text-xl font-bold text-[#3B82F6] mt-1">
                  {reservations.filter(r => new Date(r.date).toDateString() === new Date().toDateString() && r.status === 'seated').length}
                </p>
              </div>
              <div className="border border-[#e5e7eb] rounded-lg p-3 text-center bg-[#f9fafb]">
                <p className="text-xs font-bold text-[#6b7280] uppercase">Pending</p>
                <p className="text-xl font-bold text-[#F59E0B] mt-1">{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-[#e5e7eb] p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-[#111827]">Upcoming Today</h3>
            </div>
            <div className="space-y-4">
              {reservations.filter(r => new Date(r.date).toDateString() === new Date().toDateString()).slice(0,4).map((r, i) => (
                <div key={i} className="flex justify-between items-start border-b border-[#f3f4f6] pb-3 last:border-0 last:pb-0">
                  <div className="flex items-start gap-3">
                    <p className="text-xs font-bold text-[#111827] w-14">{r.time}</p>
                    <div>
                      <p className="text-xs font-bold text-[#111827]">{r.customerName}</p>
                      <p className="text-xs text-[#6b7280] mt-0.5">{r.table || 'Table TBD'} • {r.partySize || r.guests} Guests</p>
                    </div>
                  </div>
                  {getStatusBadge(r.status)}
                </div>
              ))}
              {reservations.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 border border-dashed border-[#e5e7eb] rounded-xl bg-[#f9fafb]">
                  <Clock className="w-8 h-8 text-[#d1d5db] mb-2" />
                  <p className="text-xs font-bold text-[#9ca3af]">No upcoming reservations</p>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}