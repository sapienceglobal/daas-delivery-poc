import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, Filter, ChevronLeft, ChevronRight, Calendar, 
  MoreVertical, Edit3, Eye, Clock, CheckCircle2, XCircle, Users, LayoutGrid, Phone
} from 'lucide-react';

export default function ReservationsView({ reservations = [], onUpdateReservationStatus, onEdit }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [seatingFilter, setSeatingFilter] = useState('All Seating Areas');
  const [occasionFilter, setOccasionFilter] = useState('All Occasions');
  
  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Calendar Logic
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const calendarDays = [];
  
  // Previous month trailing days
  for (let i = 0; i < firstDayOfMonth; i++) {
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0 - i);
    calendarDays.unshift({ date: d, isCurrentMonth: false });
  }
  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
    calendarDays.push({ date: d, isCurrentMonth: true });
  }
  // Next month leading days (to fill 35 or 42 slots)
  const totalSlots = calendarDays.length > 35 ? 42 : 35;
  const remaining = totalSlots - calendarDays.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, i);
    calendarDays.push({ date: d, isCurrentMonth: false });
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  // Stats Calculations
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

  // Filtering Logic
  const filteredReservations = useMemo(() => {
    return reservations.filter(r => {
      // Search
      const searchStr = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        r.customerName?.toLowerCase().includes(searchStr) || 
        r.customerPhone?.toLowerCase().includes(searchStr) ||
        r.customerEmail?.toLowerCase().includes(searchStr);

      // Status
      const matchesStatus = statusFilter === 'All Status' || (r.status || '').toLowerCase() === statusFilter.toLowerCase();
      
      // Seating Area
      const loc = (r.location || r.seatingArea || '').toLowerCase();
      const matchesSeating = seatingFilter === 'All Seating Areas' || 
        (seatingFilter === 'Indoor' && loc.includes('indoor')) ||
        (seatingFilter === 'Outdoor' && loc.includes('outdoor')) ||
        (seatingFilter === 'Private' && loc.includes('private'));

      // Occasion
      const occ = (r.occasion || '').toLowerCase();
      const matchesOccasion = occasionFilter === 'All Occasions' || occ.includes(occasionFilter.toLowerCase());

      // Date Filter
      const matchesDate = !selectedDate || new Date(r.date).toDateString() === selectedDate.toDateString();

      return matchesSearch && matchesStatus && matchesSeating && matchesOccasion && matchesDate;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [reservations, searchQuery, statusFilter, seatingFilter, occasionFilter, selectedDate]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredReservations.length / itemsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredReservations.slice(start, start + itemsPerPage);
  }, [filteredReservations, currentPage]);

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

  // Table Overview Calculations
  const tableOverview = useMemo(() => {
    const todayStr = new Date().toDateString();
    const todaysReservations = reservations.filter(r => new Date(r.date).toDateString() === todayStr);
    
    // Using mocked total tables as 28 for now, calculating states
    const totalTables = 28;
    const occupied = todaysReservations.filter(r => (r.status||'').toLowerCase() === 'seated').length;
    const reserved = todaysReservations.filter(r => (r.status||'').toLowerCase() === 'confirmed').length;
    // Mocking 2 cleaning, 0 out of order for UI
    const cleaning = 2;
    const outOfOrder = 0;
    const available = Math.max(0, totalTables - (occupied + reserved + cleaning + outOfOrder));
    
    return { totalTables, occupied, reserved, cleaning, outOfOrder, available };
  }, [reservations]);

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC]">
      {/* Main Container */}
      <div className="flex flex-1 gap-6 overflow-hidden">
        
        {/* Left Column - Main Content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar">
          
          {/* Header */}
          <div className="mb-6 shrink-0">
            <h1 className="text-2xl font-bold text-[#111827]">Reservations</h1>
            <p className="text-sm text-[#6b7280] mt-1">Manage table reservations and seating arrangements.</p>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6 shrink-0">
            <div className="bg-white p-4 rounded-xl border border-[#e5e7eb] shadow-sm flex flex-col">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-[#fef3c7] flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4 text-[#F59E0B]" />
                </div>
                <span className="text-xs font-bold text-[#374151]">Today's Reservations</span>
              </div>
              <span className="text-2xl font-bold text-[#111827]">{stats.todayTotal}</span>
            </div>
            
            <div className="bg-white p-4 rounded-xl border border-[#e5e7eb] shadow-sm flex flex-col">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-[#dcfce7] flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                </div>
                <span className="text-xs font-bold text-[#374151]">Confirmed</span>
              </div>
              <span className="text-2xl font-bold text-[#111827]">{stats.confirmed}</span>
            </div>
            
            <div className="bg-white p-4 rounded-xl border border-[#e5e7eb] shadow-sm flex flex-col">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-[#fef3c7] flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-[#F59E0B]" />
                </div>
                <span className="text-xs font-bold text-[#374151]">Pending</span>
              </div>
              <span className="text-2xl font-bold text-[#111827]">{stats.pending}</span>
              <span className="text-[10px] text-[#6b7280] mt-1">Needs confirmation</span>
            </div>
            
            <div className="bg-white p-4 rounded-xl border border-[#e5e7eb] shadow-sm flex flex-col">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-[#fef2f2] flex items-center justify-center shrink-0">
                  <XCircle className="w-4 h-4 text-[#DC2626]" />
                </div>
                <span className="text-xs font-bold text-[#374151]">Cancelled</span>
              </div>
              <span className="text-2xl font-bold text-[#111827]">{stats.cancelled}</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#e5e7eb] shadow-sm flex flex-col">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-[#dcfce7] flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-[#10B981]" />
                </div>
                <span className="text-xs font-bold text-[#374151]">Total Guests</span>
              </div>
              <span className="text-2xl font-bold text-[#111827]">{stats.totalGuests}</span>
              <span className="text-[10px] text-[#6b7280] mt-1">Today</span>
            </div>
          </div>

          {/* Table Area */}
          <div className="bg-white rounded-[20px] shadow-sm border border-[#e5e7eb] overflow-hidden flex flex-col flex-1">
            
            {/* Filters */}
            <div className="p-4 border-b border-[#f3f4f6] flex flex-wrap gap-4 items-center justify-between">
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
                  value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                  className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#374151] font-medium outline-none"
                >
                  <option>All Status</option>
                  <option>Confirmed</option>
                  <option>Pending</option>
                  <option>Seated</option>
                  <option>Cancelled</option>
                </select>

                <select 
                  value={seatingFilter} onChange={(e) => { setSeatingFilter(e.target.value); setCurrentPage(1); }}
                  className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#374151] font-medium outline-none"
                >
                  <option>All Seating Areas</option>
                  <option>Indoor</option>
                  <option>Outdoor</option>
                  <option>Private</option>
                </select>

                <select 
                  value={occasionFilter} onChange={(e) => { setOccasionFilter(e.target.value); setCurrentPage(1); }}
                  className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#374151] font-medium outline-none"
                >
                  <option>All Occasions</option>
                  <option>Dinner</option>
                  <option>Anniversary</option>
                  <option>Birthday</option>
                  <option>Corporate</option>
                </select>

                <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#374151] font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#6b7280]" />
                  {selectedDate ? selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'All Dates'}
                  {selectedDate && (
                    <button onClick={() => setSelectedDate(null)} className="ml-2 text-[#9ca3af] hover:text-[#374151]">
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button className="bg-white border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#374151] font-bold flex items-center gap-2 hover:bg-[#f9fafb]">
                  <Filter className="w-4 h-4" /> Filters
                </button>
                <button onClick={() => onEdit && onEdit(null)} className="bg-[#8B0000] text-white rounded-lg px-4 py-2 text-sm font-bold flex items-center gap-2 hover:bg-red-900 transition-colors">
                  + New Reservation
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto flex-1 custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead className="bg-white sticky top-0 z-10 border-b border-[#f3f4f6]">
                  <tr className="text-[10px] font-bold text-[#6b7280] uppercase tracking-wider">
                    <th className="px-6 py-4">Time</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4">Guests</th>
                    <th className="px-6 py-4">Seating Area</th>
                    <th className="px-6 py-4">Occasion</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f9fafb]">
                  {paginatedData.map((res, i) => (
                    <tr key={res._id || i} className="hover:bg-[#f9fafb] transition-colors group">
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-[#111827]">{res.time}</p>
                        <p className="text-[10px] text-[#6b7280]">{new Date(res.date).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-[#111827]">{res.customerName}</p>
                        <p className="text-[10px] text-[#6b7280]">{res.table || 'Table TBD'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-[11px] text-[#374151] flex items-center gap-1.5"><Phone className="w-3 h-3 text-[#9ca3af]"/> {res.customerPhone}</p>
                        {res.customerEmail && <p className="text-[11px] text-[#6b7280] flex items-center gap-1.5 mt-0.5">✉ {res.customerEmail}</p>}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-[#111827]">{res.partySize || res.guests}</p>
                        <p className="text-[10px] text-[#6b7280]">Adults</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-[11px] font-bold text-[#374151]">{res.location || 'Main Dining'}</p>
                        <p className="text-[10px] text-[#6b7280]">{res.location?.toLowerCase().includes('outdoor') ? 'Outdoor' : 'Indoor'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[#6b7280] text-sm">🍽</span>
                          <span className="text-[11px] font-bold text-[#374151]">{res.occasion || 'Dinner'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-start gap-1">
                          {getStatusBadge(res.status)}
                          <span className="text-[9px] text-[#9ca3af] ml-1">
                            {res.status === 'confirmed' ? '2 days ago' : res.status === 'pending' ? '10 min ago' : ''}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-1.5 text-[#9ca3af] hover:text-[#374151] hover:bg-white rounded border border-transparent hover:border-[#e5e7eb]"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => onEdit && onEdit(res)} className="p-1.5 text-[#9ca3af] hover:text-[#374151] hover:bg-white rounded border border-transparent hover:border-[#e5e7eb]"><Edit3 className="w-4 h-4" /></button>
                          <div className="relative group/menu">
                            <button className="p-1.5 text-[#9ca3af] hover:text-[#374151] hover:bg-white rounded border border-transparent hover:border-[#e5e7eb]"><MoreVertical className="w-4 h-4" /></button>
                            <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-[#e5e7eb] hidden group-hover/menu:block z-50">
                              <button onClick={() => onUpdateReservationStatus && onUpdateReservationStatus(res._id, 'confirmed')} className="w-full text-left px-4 py-2 text-xs font-bold text-[#10B981] hover:bg-[#f9fafb]">Confirm</button>
                              <button onClick={() => onUpdateReservationStatus && onUpdateReservationStatus(res._id, 'seated')} className="w-full text-left px-4 py-2 text-xs font-bold text-[#3B82F6] hover:bg-[#f9fafb]">Mark Seated</button>
                              <button onClick={() => onUpdateReservationStatus && onUpdateReservationStatus(res._id, 'cancelled')} className="w-full text-left px-4 py-2 text-xs font-bold text-[#DC2626] hover:bg-[#fef2f2] border-t border-[#f3f4f6]">Cancel</button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paginatedData.length === 0 && (
                    <tr>
                      <td colSpan="8" className="p-8 text-center text-[#6b7280] text-sm">No reservations found matching your criteria.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="p-4 border-t border-[#f3f4f6] flex items-center justify-between bg-white text-xs text-[#6b7280]">
              <span>Showing {filteredReservations.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredReservations.length)} of {filteredReservations.length} reservations</span>
              <div className="flex gap-2">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 border border-[#e5e7eb] rounded hover:bg-[#f9fafb] disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
                <div className="flex gap-1">
                  <button className="w-7 h-7 bg-[#8B0000] text-white rounded font-bold">{currentPage}</button>
                  {currentPage < totalPages && <button className="w-7 h-7 text-[#374151] hover:bg-[#f9fafb] rounded font-bold" onClick={() => setCurrentPage(currentPage + 1)}>{currentPage + 1}</button>}
                </div>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 border border-[#e5e7eb] rounded hover:bg-[#f9fafb] disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-[320px] shrink-0 overflow-y-auto custom-scrollbar space-y-6 pb-6">
          
          {/* Calendar Widget */}
          <div className="bg-white rounded-xl shadow-sm border border-[#e5e7eb] p-5">
            <h3 className="text-sm font-bold text-[#111827] mb-4">Reservation Calendar</h3>
            <div className="flex justify-between items-center mb-4">
              <button onClick={prevMonth} className="p-1 border border-[#e5e7eb] rounded hover:bg-[#f9fafb]"><ChevronLeft className="w-4 h-4 text-[#6b7280]"/></button>
              <span className="text-xs font-bold text-[#111827]">{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
              <button onClick={nextMonth} className="p-1 border border-[#e5e7eb] rounded hover:bg-[#f9fafb]"><ChevronRight className="w-4 h-4 text-[#6b7280]"/></button>
              <button onClick={() => { setSelectedDate(new Date()); setCurrentMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1)); }} className="text-[10px] font-bold border border-[#e5e7eb] rounded px-2 py-1 ml-2 hover:bg-[#f9fafb] text-[#374151]">Today</button>
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-[9px] font-bold text-[#6b7280]">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {calendarDays.map((dayObj, i) => {
                const isSelected = selectedDate && dayObj.date.toDateString() === selectedDate.toDateString();
                
                // Get reservations for this day
                const dayRes = reservations.filter(r => new Date(r.date).toDateString() === dayObj.date.toDateString());
                const hasConfirmed = dayRes.some(r => r.status === 'confirmed');
                const hasPending = dayRes.some(r => r.status === 'pending');
                const hasSeated = dayRes.some(r => r.status === 'seated');

                return (
                  <div 
                    key={i} 
                    onClick={() => setSelectedDate(dayObj.date)}
                    className={`h-8 flex flex-col items-center justify-center rounded-full text-xs cursor-pointer ${isSelected ? 'bg-[#8B0000] text-white font-bold shadow-sm' : dayObj.isCurrentMonth ? 'text-[#374151] hover:bg-[#f9fafb] font-medium' : 'text-[#d1d5db]'}`}
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
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[#f3f4f6]">
              <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></div><span className="text-[9px] text-[#6b7280] font-medium">Confirmed</span></div>
              <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]"></div><span className="text-[9px] text-[#6b7280] font-medium">Pending</span></div>
              <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]"></div><span className="text-[9px] text-[#6b7280] font-medium">Seated</span></div>
            </div>
          </div>

          {/* Table Overview */}
          <div className="bg-white rounded-xl shadow-sm border border-[#e5e7eb] p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-[#111827]">Table Overview</h3>
              <button className="text-[10px] font-bold text-[#8B0000]">View Layout</button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="border border-[#e5e7eb] rounded-lg p-3 text-center">
                <p className="text-[9px] font-bold text-[#6b7280] uppercase">Total Tables</p>
                <p className="text-lg font-bold text-[#111827] mt-1">{tableOverview.totalTables}</p>
              </div>
              <div className="border border-[#e5e7eb] rounded-lg p-3 text-center">
                <p className="text-[9px] font-bold text-[#6b7280] uppercase">Available</p>
                <p className="text-lg font-bold text-[#10B981] mt-1">{tableOverview.available}</p>
              </div>
              <div className="border border-[#e5e7eb] rounded-lg p-3 text-center">
                <p className="text-[9px] font-bold text-[#6b7280] uppercase">Occupied</p>
                <p className="text-lg font-bold text-[#3B82F6] mt-1">{tableOverview.occupied}</p>
              </div>
              <div className="border border-[#e5e7eb] rounded-lg p-3 text-center">
                <p className="text-[9px] font-bold text-[#6b7280] uppercase">Reserved</p>
                <p className="text-lg font-bold text-[#F59E0B] mt-1">{tableOverview.reserved}</p>
              </div>
              <div className="border border-[#e5e7eb] rounded-lg p-3 text-center">
                <p className="text-[9px] font-bold text-[#6b7280] uppercase">Cleaning</p>
                <p className="text-lg font-bold text-[#8B5CF6] mt-1">{tableOverview.cleaning}</p>
              </div>
              <div className="border border-[#e5e7eb] rounded-lg p-3 text-center">
                <p className="text-[9px] font-bold text-[#6b7280] uppercase">Out of Order</p>
                <p className="text-lg font-bold text-[#DC2626] mt-1">{tableOverview.outOfOrder}</p>
              </div>
            </div>
          </div>

          {/* Upcoming Today */}
          <div className="bg-white rounded-xl shadow-sm border border-[#e5e7eb] p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-[#111827]">Upcoming Today</h3>
              <button className="text-[10px] font-bold text-[#8B0000]">View All</button>
            </div>
            <div className="space-y-4">
              {reservations.filter(r => new Date(r.date).toDateString() === new Date().toDateString()).slice(0,4).map((r, i) => (
                <div key={i} className="flex justify-between items-start border-b border-[#f3f4f6] pb-3 last:border-0 last:pb-0">
                  <div className="flex items-start gap-3">
                    <p className="text-[11px] font-bold text-[#111827] w-14">{r.time}</p>
                    <div>
                      <p className="text-xs font-bold text-[#111827]">{r.customerName}</p>
                      <p className="text-[10px] text-[#6b7280] mt-0.5">{r.table || 'Table TBD'} • {r.partySize || r.guests} Guests</p>
                    </div>
                  </div>
                  {getStatusBadge(r.status)}
                </div>
              ))}
              {reservations.length === 0 && (
                <p className="text-xs text-[#9ca3af] text-center italic py-2">No upcoming reservations</p>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
