import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Upload,
  Users,
  Crown,
  Gift,
  Star,
  Eye,
  MoreVertical,
  MessageSquare,
  Tag,
  UsersRound,
  Download,
  XCircle,
  Phone,
  Mail,
  CheckCircle,
  Trash2,
  Power,
  Loader2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Globe,
  Smartphone
} from "lucide-react";
import { useMerchantContext } from "@/context/MerchantContext";
import { crmAPI } from "@/lib/api";
import { showToast } from "@/components/ui";
import StatCard from "./StatCard";
import CustomerProfileModal from "./CustomerProfileModal";

export default function CustomersCRMView({
  customers = [],
  isLoading = false,
  onAdd,
  onEdit,
  refreshData,
}) {
  const { roomId } = useMerchantContext();
  const [mounted, setMounted] = useState(false);

  // ─── FILTERS STATE ───
  const [searchQuery, setSearchQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState("All Groups");
  const [tierFilter, setTierFilter] = useState("All Loyalty Tiers");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [sortBy, setSortBy] = useState("newest");

  // ─── LOAD MORE STATE ───
  const ITEMS_PER_LOAD = 15;
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedProfileCustomer, setSelectedProfileCustomer] = useState(null);

  // ─── SORTING LOGIC ───
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

  // ─── SCROLLING LOGIC STATES & REFS ───
  const tableHeaderRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    setVisibleCount(ITEMS_PER_LOAD);
    setSelectedIds([]);
  }, [searchQuery, groupFilter, tierFilter, statusFilter, sortBy]);

  useEffect(() => {
    setMounted(true);
  }, []);

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
  }, [customers, visibleCount]);

  useEffect(() => {
    window.addEventListener("resize", checkForScrollPosition);
    return () => window.removeEventListener("resize", checkForScrollPosition);
  }, []);

  const scrollByAmount = (amount) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  const TableColGroup = () => (
    <colgroup>
      <col style={{ width: '60px' }} />
      <col style={{ width: '220px' }} />
      <col style={{ width: '180px' }} />
      <col style={{ width: '120px' }} />
      <col style={{ width: '140px' }} />
      <col style={{ width: '120px' }} />
      <col style={{ width: '120px' }} />
      <col style={{ width: '140px' }} />
      <col style={{ width: '100px' }} />
      <col style={{ width: '80px' }} />
    </colgroup>
  );

  // modals state
  const [promoModalOpen, setPromoModalOpen] = useState(false);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [targetIds, setTargetIds] = useState([]);

  // ─── FILTER LOGIC ───
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const searchStr = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        c.name?.toLowerCase().includes(searchStr) ||
        c.phone?.toLowerCase().includes(searchStr) ||
        c.email?.toLowerCase().includes(searchStr) ||
        c.customerId?.toLowerCase().includes(searchStr);

      const matchesGroup =
        groupFilter === "All Groups" || c.group === groupFilter;
      const matchesTier =
        tierFilter === "All Loyalty Tiers" || c.loyaltyTier === tierFilter;
      const matchesStatus =
        statusFilter === "All Status" || c.status === statusFilter;

      return matchesSearch && matchesGroup && matchesTier && matchesStatus;
    });
  }, [customers, searchQuery, groupFilter, tierFilter, statusFilter]);

  // ─── SORT DATA ───
  const sortedCustomers = useMemo(() => {
    let sortableItems = [...filteredCustomers];

    // If column header was clicked directly, prioritize it
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === 'totalSpent' || sortConfig.key === 'totalOrders') {
          aValue = Number(aValue || 0);
          bValue = Number(bValue || 0);
        } else if (sortConfig.key === 'lastOrderDate' || sortConfig.key === 'createdAt') {
          aValue = new Date(aValue || 0).getTime();
          bValue = new Date(bValue || 0).getTime();
        } else {
          aValue = (aValue || '').toString().toLowerCase();
          bValue = (bValue || '').toString().toLowerCase();
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
      return sortableItems;
    }

    // Default & Selected Filter Sorting
    sortableItems.sort((a, b) => {
      const timeA = new Date(a.createdAt || a.lastOrderDate || 0).getTime();
      const timeB = new Date(b.createdAt || b.lastOrderDate || 0).getTime();

      if (sortBy === 'oldest') {
        return timeA - timeB;
      }
      if (sortBy === 'most_orders') {
        const diff = (Number(b.totalOrders) || 0) - (Number(a.totalOrders) || 0);
        if (diff !== 0) return diff;
        return (Number(b.totalSpent) || 0) - (Number(a.totalSpent) || 0);
      }
      if (sortBy === 'highest_spent') {
        const diff = (Number(b.totalSpent) || 0) - (Number(a.totalSpent) || 0);
        if (diff !== 0) return diff;
        return (Number(b.totalOrders) || 0) - (Number(a.totalOrders) || 0);
      }
      if (sortBy === 'recent_order') {
        const orderTimeA = new Date(a.lastOrderDate || 0).getTime();
        const orderTimeB = new Date(b.lastOrderDate || 0).getTime();
        if (orderTimeB !== orderTimeA) return orderTimeB - orderTimeA;
        return timeB - timeA;
      }
      if (sortBy === 'name') {
        return (a.name || '').localeCompare(b.name || '');
      }

      // Default: 'newest' (Newest registration or interaction date first)
      if (timeB !== timeA) return timeB - timeA;
      return (Number(b.totalOrders) || 0) - (Number(a.totalOrders) || 0);
    });

    return sortableItems;
  }, [filteredCustomers, sortConfig, sortBy]);

  // ─── LOAD MORE DATA ───
  const displayedCustomers = useMemo(() => {
    return sortedCustomers.slice(0, visibleCount);
  }, [sortedCustomers, visibleCount]);

  const hasMoreItems = visibleCount < sortedCustomers.length;

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => prev + ITEMS_PER_LOAD);
      setIsLoadingMore(false);
    }, 400);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedIds(displayedCustomers.map((c) => c._id));
    else setSelectedIds([]);
  };

  const handleSelectOne = (e, id) => {
    if (e.target.checked) setSelectedIds([...selectedIds, id]);
    else setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
  };

  const triggerBulkAction = (actionType, ids = selectedIds) => {
    setTargetIds(ids);
    if (actionType === "promo") setPromoModalOpen(true);
    if (actionType === "group") setGroupModalOpen(true);
    if (actionType === "status") setStatusModalOpen(true);
    if (actionType === "delete") setDeleteModalOpen(true);
  };

  const clearSelection = () => setSelectedIds([]);

  const exportToCSV = () => {
    const headers = ["Customer Name", "Customer ID", "Phone", "Email", "Group", "Loyalty Tier", "Total Orders", "Total Spent", "Last Order Date", "Status"];
    const rows = sortedCustomers.map(c => [
      c.name || "",
      c.customerId || "",
      c.phone || "",
      c.email || "",
      c.group || "Others",
      c.loyaltyTier || "None",
      c.totalOrders || 0,
      (c.totalSpent || 0).toFixed(2),
      c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString() : "",
      c.status || "Inactive"
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `customers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTierBadge = (tier) => {
    switch (tier) {
      case "Gold":
        return (
          <span className="bg-[#fef3c7] text-[#b45309] font-bold text-xs px-2 py-1 rounded border border-[#fde68a]">
            Gold
          </span>
        );
      case "Silver":
        return (
          <span className="bg-[#f3f4f6] text-[#4b5563] font-bold text-xs px-2 py-1 rounded border border-[#e5e7eb]">
            Silver
          </span>
        );
      case "Platinum":
        return (
          <span className="bg-[#f3e8ff] text-[#7e22ce] font-bold text-xs px-2 py-1 rounded border border-[#d8b4fe]">
            Platinum
          </span>
        );
      case "Bronze":
        return (
          <span className="bg-[#ffedd5] text-[#c2410c] font-bold text-xs px-2 py-1 rounded border border-[#fed7aa]">
            Bronze
          </span>
        );
      default:
        return (
          <span className="bg-gray-100 text-gray-600 font-bold text-xs px-2 py-1 rounded border border-gray-200">
            {tier || "None"}
          </span>
        );
    }
  };

  const getStatusBadge = (status) => {
    if (status === "Active")
      return (
        <span className="text-[#10B981] font-bold text-xs bg-[#10B981]/10 px-2 py-1 rounded border border-[#10B981]/20">
          Active
        </span>
      );
    return (
      <span className="text-[#DC2626] font-bold text-xs bg-[#DC2626]/10 px-2 py-1 rounded border border-[#DC2626]/20">
        Inactive
      </span>
    );
  };

  if (!mounted) return null;

  const SortHeader = ({ label, sortKey, align = "left" }) => {
    const isActive = sortConfig.key === sortKey;
    const isAsc = sortConfig.direction === "asc";
    
    return (
      <th 
        className={`px-6 py-4 cursor-pointer hover:bg-[#f3f4f6] transition-colors select-none group ${align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'}`}
        onClick={() => handleSort(sortKey)}
      >
        <div className={`flex items-center gap-1.5 ${align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : ''}`}>
          {label}
          {isActive ? (
            isAsc ? <ArrowUp className="w-3.5 h-3.5 text-[#8B0000]" /> : <ArrowDown className="w-3.5 h-3.5 text-[#8B0000]" />
          ) : (
            <ArrowUpDown className="w-3.5 h-3.5 text-[#d1d5db] group-hover:text-[#9ca3af]" />
          )}
        </div>
      </th>
    );
  };

  const calculateTrend = (currentCount, previousCount) => {
    if (previousCount === 0) {
      return currentCount > 0 ? { direction: 'up', value: '100%', subtitle: 'vs last month' } : { direction: 'neutral', value: '0%', subtitle: 'vs last month' };
    }
    const diff = currentCount - previousCount;
    const percentage = Math.abs((diff / previousCount) * 100).toFixed(1);
    if (diff > 0) return { direction: 'up', value: `${percentage}%`, subtitle: 'vs last month' };
    if (diff < 0) return { direction: 'down', value: `${percentage}%`, subtitle: 'vs last month' };
    return { direction: 'neutral', value: '0%', subtitle: 'vs last month' };
  };

  const now = new Date();
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now - 60 * 24 * 60 * 60 * 1000);

  // 1. Total Customers
  const totalCustomersNow = customers.length;
  const totalCustomersPrev = customers.filter(c => new Date(c.createdAt) <= thirtyDaysAgo).length;
  const totalCustomersTrend = calculateTrend(totalCustomersNow, totalCustomersPrev);

  // 2. New Customers
  const newCustomersNow = customers.filter(c => new Date(c.createdAt) > thirtyDaysAgo).length;
  const newCustomersPrev = customers.filter(c => new Date(c.createdAt) > sixtyDaysAgo && new Date(c.createdAt) <= thirtyDaysAgo).length;
  const newCustomersTrend = calculateTrend(newCustomersNow, newCustomersPrev);

  // 3. Loyalty Members
  const loyaltyNow = customers.filter(c => c.loyaltyTier && c.loyaltyTier !== "Bronze").length;
  const loyaltyPrev = customers.filter(c => c.loyaltyTier && c.loyaltyTier !== "Bronze" && new Date(c.createdAt) <= thirtyDaysAgo).length;
  const loyaltyTrend = calculateTrend(loyaltyNow, loyaltyPrev);

  // 4. Repeat Customers
  const repeatNow = customers.filter(c => c.totalOrders > 1).length;
  const repeatPrev = customers.filter(c => c.totalOrders > 1 && new Date(c.createdAt) <= thirtyDaysAgo).length;
  const repeatTrend = calculateTrend(repeatNow, repeatPrev);

  // 5. Top Customers
  const topNow = customers.filter(c => c.totalSpent > 100).length;
  const topPrev = customers.filter(c => c.totalSpent > 100 && new Date(c.createdAt) <= thirtyDaysAgo).length;
  const topTrend = calculateTrend(topNow, topPrev);

  return (
    <div className="flex flex-col h-full bg-transparent text-admin-text relative space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 pt-2 px-1">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-admin-text tracking-tight">
            Customers & CRM
          </h1>
          <p className="text-xs sm:text-sm text-admin-text-secondary mt-1">
            Manage customer relationships, loyalty tiers, order frequency, and retention campaigns.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={exportToCSV}
            className="bg-admin-surface border border-admin-border rounded-xl px-4 py-2 text-xs sm:text-sm text-admin-text font-semibold flex items-center gap-2 hover:bg-admin-surface-light shadow-2xs transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export
          </button>
          <button
            type="button"
            onClick={() => onAdd?.()}
            className="bg-brand text-white rounded-xl px-4 py-2 text-xs sm:text-sm font-bold flex items-center gap-2 hover:brightness-110 transition-all shadow-sm cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> Add Customer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4 shrink-0 px-1">
        <StatCard
          label="Total Customers"
          value={totalCustomersNow.toLocaleString()}
          icon={Users}
          color="bg-amber-500/15 text-amber-500"
          trend={totalCustomersTrend.value}
          up={totalCustomersTrend.direction === 'up'}
        />
        <StatCard
          label="New Customers"
          value={newCustomersNow.toLocaleString()}
          icon={UserPlus}
          color="bg-emerald-500/15 text-emerald-500"
          trend={newCustomersTrend.value}
          up={newCustomersTrend.direction === 'up'}
        />
        <StatCard
          label="Loyalty Members"
          value={loyaltyNow.toLocaleString()}
          icon={Crown}
          color="bg-purple-500/15 text-purple-500"
          trend={loyaltyTrend.value}
          up={loyaltyTrend.direction === 'up'}
        />
        <StatCard
          label="Repeat Customers"
          value={repeatNow.toLocaleString()}
          icon={Gift}
          color="bg-blue-500/15 text-blue-500"
          trend={repeatTrend.value}
          up={repeatTrend.direction === 'up'}
        />
        <StatCard
          label="Top VIP Spenders"
          value={topNow.toLocaleString()}
          icon={Star}
          color="bg-rose-500/15 text-rose-500"
          trend={topTrend.value}
          up={topTrend.direction === 'up'}
        />
      </div>

      <div className="flex flex-col xl:flex-row flex-1 gap-6 pb-2 px-1">
        <div className="flex-1 bg-admin-card rounded-2xl shadow-sm border border-admin-border flex flex-col relative min-w-0 group">
          
          {/* STICKY TOP SECTION */}
          <div className="sticky top-0 z-40 bg-admin-surface/95 backdrop-blur-md rounded-t-2xl flex flex-col shadow-sm border-b border-admin-border">
            <div className="p-4 flex flex-wrap gap-3.5 items-center justify-between shrink-0">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="w-4 h-4 text-admin-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by name, phone or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 rounded-xl border border-admin-border text-xs sm:text-sm text-admin-text bg-admin-surface outline-none focus:border-brand transition-colors placeholder:text-admin-text-muted"
                />
              </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <select
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className="bg-admin-surface border border-admin-border rounded-xl px-3 py-2 text-xs font-semibold text-admin-text outline-none cursor-pointer hover:border-brand/40 transition-colors"
              >
                <option>All Groups</option>
                <option>Family</option>
                <option>Friends</option>
                <option>Corporate</option>
                <option>Others</option>
              </select>

              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="bg-admin-surface border border-admin-border rounded-xl px-3 py-2 text-xs font-semibold text-admin-text outline-none cursor-pointer hover:border-brand/40 transition-colors"
              >
                <option>All Loyalty Tiers</option>
                <option>Bronze</option>
                <option>Silver</option>
                <option>Gold</option>
                <option>Platinum</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-admin-surface border border-admin-border rounded-xl px-3 py-2 text-xs font-semibold text-admin-text outline-none cursor-pointer hover:border-brand/40 transition-colors"
              >
                <option>All Status</option>
                <option>Active</option>
                <option>Inactive</option>
              </select>

              <div className="flex items-center gap-1.5 bg-admin-surface border border-admin-border rounded-xl px-2.5 py-2 text-xs text-admin-text font-semibold hover:border-brand/40 transition-colors">
                <ArrowUpDown className="w-3.5 h-3.5 text-brand shrink-0" />
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setSortConfig({ key: null, direction: 'desc' });
                  }}
                  className="bg-transparent text-xs text-admin-text font-semibold outline-none cursor-pointer pr-1"
                >
                  <option value="newest">Sort: Newest First</option>
                  <option value="oldest">Sort: Oldest First</option>
                  <option value="most_orders">Sort: Most Orders</option>
                  <option value="highest_spent">Sort: Highest Spender</option>
                  <option value="recent_order">Sort: Recently Ordered</option>
                  <option value="name">Sort: Name (A-Z)</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setGroupFilter("All Groups");
                  setTierFilter("All Loyalty Tiers");
                  setStatusFilter("All Status");
                  setSortBy("newest");
                  setSortConfig({ key: null, direction: 'desc' });
                }}
                className="bg-admin-surface border border-admin-border rounded-xl px-3 py-2 text-xs text-admin-text-secondary font-semibold flex items-center gap-1.5 hover:text-admin-text hover:bg-admin-surface-light transition-colors cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" /> Reset
              </button>
            </div>
          </div>

          {/* Table Header */}
          <div className="overflow-hidden" ref={tableHeaderRef}>
              <table className="w-full text-left border-collapse min-w-[1280px] table-fixed">
                <TableColGroup />
                <thead className="bg-admin-surface-light text-admin-text-secondary border-b border-admin-border">
                  <tr className="text-xs font-bold uppercase tracking-wider">
                    <th className="px-6 py-3.5 text-center">
                      <input
                        type="checkbox"
                        onChange={handleSelectAll}
                        checked={
                          selectedIds.length === displayedCustomers.length &&
                          displayedCustomers.length > 0
                        }
                        className="w-4 h-4 cursor-pointer rounded border-admin-border text-brand focus:ring-brand accent-brand"
                      />
                    </th>
                    <SortHeader label="Customer" sortKey="name" />
                    <th className="px-6 py-3.5">Contact</th>
                    <th className="px-6 py-3.5">Group</th>
                    <SortHeader label="Loyalty Tier" sortKey="loyaltyTier" align="center" />
                    <SortHeader label="Total Orders" sortKey="totalOrders" align="center" />
                    <SortHeader label="Total Spent" sortKey="totalSpent" align="right" />
                    <SortHeader label="Last Order" sortKey="lastOrderDate" />
                    <SortHeader label="Status" sortKey="status" align="center" />
                    <th className="px-6 py-3.5 text-center">Actions</th>
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
                className="pointer-events-auto w-9 h-9 bg-admin-surface shadow-md border border-admin-border rounded-full flex items-center justify-center text-admin-text hover:text-brand hover:bg-admin-surface-light transition-all absolute left-2 -translate-y-1/2 cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            {canScrollRight && (
              <button
                onClick={() => scrollByAmount(300)}
                className="pointer-events-auto w-9 h-9 bg-admin-surface shadow-md border border-admin-border rounded-full flex items-center justify-center text-admin-text hover:text-brand hover:bg-admin-surface-light transition-all absolute right-2 -translate-y-1/2 cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>

          <div
            ref={scrollContainerRef}
            onScroll={checkForScrollPosition}
            className="overflow-x-auto flex-1 custom-scrollbar scroll-smooth w-full"
          >
            <table className="w-full text-left border-collapse min-w-[1280px] table-fixed">
              <TableColGroup />
              <tbody className="divide-y divide-admin-border">
                {isLoading ? (
                  [...Array(5)].map((_, idx) => (
                    <tr key={`skeleton-${idx}`} className="animate-pulse bg-admin-surface border-b border-admin-border">
                      <td className="px-6 py-4 text-center"><div className="w-4 h-4 bg-admin-surface-light rounded"></div></td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-admin-surface-light"></div>
                          <div className="space-y-2">
                            <div className="w-24 h-3 bg-admin-surface-light rounded"></div>
                            <div className="w-16 h-2 bg-admin-surface-light rounded"></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 space-y-2">
                        <div className="w-24 h-3 bg-admin-surface-light rounded"></div>
                        <div className="w-32 h-2 bg-admin-surface-light rounded"></div>
                      </td>
                      <td className="px-6 py-4"><div className="w-16 h-4 bg-admin-surface-light rounded"></div></td>
                      <td className="px-6 py-4 text-center"><div className="w-16 h-5 bg-admin-surface-light rounded mx-auto"></div></td>
                      <td className="px-6 py-4 text-center"><div className="w-8 h-4 bg-admin-surface-light rounded mx-auto"></div></td>
                      <td className="px-6 py-4 text-right"><div className="w-12 h-4 bg-admin-surface-light rounded ml-auto"></div></td>
                      <td className="px-6 py-4"><div className="w-20 h-4 bg-admin-surface-light rounded"></div></td>
                      <td className="px-6 py-4 text-center"><div className="w-16 h-5 bg-admin-surface-light rounded mx-auto"></div></td>
                      <td className="px-6 py-4"><div className="w-6 h-6 bg-admin-surface-light rounded mx-auto"></div></td>
                    </tr>
                  ))
                ) : displayedCustomers.map((c) => (
                  <tr
                    key={c._id}
                    className={`transition-colors group ${selectedIds.includes(c._id) ? "bg-brand/10" : "hover:bg-admin-surface-light/40"}`}
                  >
                    <td className="px-6 py-4 text-center">
                      <input
                        type="checkbox"
                        onChange={(e) => handleSelectOne(e, c._id)}
                        checked={selectedIds.includes(c._id)}
                        className="w-4 h-4 cursor-pointer rounded border-admin-border text-brand focus:ring-brand accent-brand"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className="flex items-center gap-3 cursor-pointer group/name"
                        onClick={() => setSelectedProfileCustomer(c)}
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand to-rose-700 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm group-hover/name:scale-105 transition-transform">
                          {c.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-admin-text group-hover/name:text-brand transition-colors">
                              {c.name}
                            </p>
                          </div>
                          <div className="flex flex-col gap-1 mt-0.5">
                            <p className="text-xs text-admin-text-secondary">
                              ID: {c.customerId}
                            </p>
                            {(c.loginPlatforms?.includes('web') || c.loginPlatforms?.includes('app')) && (
                              <div className="flex items-center gap-1 mt-1">
                                {c.loginPlatforms.includes('web') && (
                                  <span className="text-[10px] font-bold text-blue-500 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded flex items-center gap-1 shadow-2xs">
                                    <Globe className="w-3 h-3" /> Web
                                  </span>
                                )}
                                {c.loginPlatforms.includes('app') && (
                                  <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded flex items-center gap-1 shadow-2xs">
                                    <Smartphone className="w-3 h-3" /> App
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-admin-text flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-admin-text-muted" />{" "}
                        {c.phone || "-"}
                      </p>
                      <p className="text-xs text-admin-text-secondary flex items-center gap-1.5 mt-0.5">
                        <Mail className="w-3 h-3 text-admin-text-muted" />{" "}
                        {c.email || "-"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-admin-text">
                        {c.group || "Others"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getTierBadge(c.loyaltyTier)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-bold text-admin-text">
                        {c.totalOrders || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-admin-text">
                        ${(c.totalSpent || 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-admin-text-secondary font-medium">
                        {c.lastOrderDate
                          ? new Date(c.lastOrderDate).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )
                          : c.createdAt ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand bg-brand/10 px-2 py-0.5 rounded-full border border-brand/20">
                                Joined {new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </span>
                            ) : (
                              <span className="text-admin-text-muted">No orders yet</span>
                            )}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(c.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setSelectedProfileCustomer(c)}
                          className="p-1.5 text-admin-text-secondary hover:text-admin-text hover:bg-admin-surface rounded border border-transparent hover:border-admin-border cursor-pointer transition-colors"
                          title="View Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <RowMenuDropdown
                          onAction={(action) =>
                            triggerBulkAction(action, [c._id])
                          }
                          onEdit={() => onEdit?.(c)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
                {!isLoading && displayedCustomers.length === 0 && (
                  <tr>
                    <td colSpan="10" className="p-12 text-center">
                      <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-admin-border rounded-xl bg-admin-surface-light/30 max-w-sm mx-auto">
                        <Users className="w-10 h-10 text-admin-text-muted mb-3" />
                        <p className="text-sm font-bold text-admin-text">
                          No customers found
                        </p>
                        <p className="text-xs text-admin-text-secondary mt-1">
                          Try adjusting your filters or search criteria.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-admin-border flex items-center justify-between bg-admin-surface shrink-0 rounded-b-2xl">
            <span className="text-xs font-semibold text-admin-text-secondary">
              Showing{" "}
              <strong className="text-admin-text">
                {displayedCustomers.length}
              </strong>{" "}
              of{" "}
              <strong className="text-admin-text">
                {filteredCustomers.length}
              </strong>{" "}
              customers
            </span>

            {hasMoreItems && (
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="flex items-center justify-center gap-2 w-[160px] h-[36px] bg-admin-surface border border-admin-border text-admin-text rounded-xl text-xs sm:text-[13px] font-bold hover:bg-admin-surface-light hover:border-brand/40 transition-all shadow-2xs cursor-pointer"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-brand" /> Loading...
                  </>
                ) : (
                  "Load More"
                )}
              </button>
            )}
          </div>
        </div>

        {/* Right Sidebar (Analytics snippet) */}
        <div className="w-full xl:w-[320px] shrink-0 overflow-y-auto custom-scrollbar space-y-6 pb-6">
          <div className="bg-admin-card rounded-2xl shadow-sm border border-admin-border p-5">
            <h3 className="font-heading text-sm font-bold text-admin-text mb-4">
              Top Customers
            </h3>
            <div className="space-y-4">
              {[...customers]
                .sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0))
                .slice(0, 5)
                .map((c, i) => (
                  <div
                    key={c._id || i}
                    className="flex justify-between items-center border-b border-admin-border pb-3 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-admin-surface-light flex items-center justify-center text-xs font-bold text-admin-text-secondary">
                        {i + 1}
                      </div>
                      <div className="w-8 h-8 rounded-full bg-admin-surface-light text-admin-text flex items-center justify-center font-bold text-xs shadow-2xs">
                        {c.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-admin-text flex items-center gap-1">
                          {c.name}{" "}
                          {i < 3 && (
                            <Crown className="w-3 h-3 text-amber-500" />
                          )}
                        </p>
                        <p className="text-xs text-admin-text-secondary">
                          {c.totalOrders || 0} Orders
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-admin-text font-heading">
                      ${(c.totalSpent || 0).toFixed(2)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-[calc(50%-160px)] -translate-x-1/2 bg-slate-900/95 dark:bg-[#0f172a]/95 backdrop-blur-md text-white border border-slate-700/60 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-5 z-50">
          <span className="text-xs font-bold whitespace-nowrap bg-white/10 px-2.5 py-1 rounded-lg">
            {selectedIds.length} Selected
          </span>
          <div className="flex items-center gap-2 border-l border-white/20 pl-4">
            <button
              onClick={() => triggerBulkAction("promo")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors text-xs font-bold text-slate-200 hover:text-white cursor-pointer"
            >
              <Tag className="w-3.5 h-3.5 text-amber-400" /> Send Promo
            </button>
            <button
              onClick={() => triggerBulkAction("group")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors text-xs font-bold text-slate-200 hover:text-white cursor-pointer"
            >
              <UsersRound className="w-3.5 h-3.5 text-blue-400" /> Group
            </button>
            <button
              onClick={() => triggerBulkAction("status")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors text-xs font-bold text-slate-200 hover:text-white cursor-pointer"
            >
              <Power className="w-3.5 h-3.5 text-emerald-400" /> Status
            </button>
            <button
              onClick={() => triggerBulkAction("delete")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors text-xs font-bold cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
            <button
              onClick={clearSelection}
              className="ml-1 p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Slide-over Profile Drawer */}
      {selectedProfileCustomer && (
        <CustomerProfileModal
          customer={selectedProfileCustomer}
          restaurantId={roomId}
          onClose={() => setSelectedProfileCustomer(null)}
          onTriggerPromo={() => {
            setSelectedProfileCustomer(null);
            setTimeout(() => triggerBulkAction("promo", [selectedProfileCustomer._id]), 300);
          }}
        />
      )}

      {/* Action Modals */}
      {promoModalOpen && (
        <PromoModal
          roomId={roomId}
          targetIds={targetIds}
          onClose={() => setPromoModalOpen(false)}
          onSuccess={() => {
            setPromoModalOpen(false);
            clearSelection();
            refreshData?.();
          }}
        />
      )}
      {groupModalOpen && (
        <GroupModal
          roomId={roomId}
          targetIds={targetIds}
          onClose={() => setGroupModalOpen(false)}
          onSuccess={() => {
            setGroupModalOpen(false);
            clearSelection();
            refreshData?.();
          }}
        />
      )}
      {statusModalOpen && (
        <StatusModal
          roomId={roomId}
          targetIds={targetIds}
          onClose={() => setStatusModalOpen(false)}
          onSuccess={() => {
            setStatusModalOpen(false);
            clearSelection();
            refreshData?.();
          }}
        />
      )}
      {deleteModalOpen && (
        <DeleteModal
          roomId={roomId}
          targetIds={targetIds}
          onClose={() => setDeleteModalOpen(false)}
          onSuccess={() => {
            setDeleteModalOpen(false);
            clearSelection();
            refreshData?.();
          }}
        />
      )}
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
        className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${isOpen ? "bg-admin-surface text-admin-text border-admin-border" : "text-admin-text-secondary hover:text-admin-text hover:bg-admin-surface border-transparent hover:border-admin-border"}`}
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-admin-surface rounded-xl shadow-xl border border-admin-border py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
          {onEdit && (
            <button
              onClick={() => {
                setIsOpen(false);
                onEdit();
              }}
              className="w-full text-left px-4 py-2 text-xs sm:text-sm text-admin-text font-medium hover:bg-admin-surface-light cursor-pointer transition-colors"
            >
              Edit Customer
            </button>
          )}
          <button
            onClick={() => {
              setIsOpen(false);
              onAction("promo");
            }}
            className="w-full text-left px-4 py-2 text-xs sm:text-sm text-admin-text font-medium hover:bg-admin-surface-light cursor-pointer transition-colors"
          >
            Send Promo
          </button>
          <button
            onClick={() => {
              setIsOpen(false);
              onAction("group");
            }}
            className="w-full text-left px-4 py-2 text-xs sm:text-sm text-admin-text font-medium hover:bg-admin-surface-light cursor-pointer transition-colors"
          >
            Assign Group
          </button>
          <div className="h-px bg-admin-border my-1"></div>
          <button
            onClick={() => {
              setIsOpen(false);
              onAction("status");
            }}
            className="w-full text-left px-4 py-2 text-xs sm:text-sm text-admin-text font-medium hover:bg-admin-surface-light cursor-pointer transition-colors"
          >
            Change Status
          </button>
          <button
            onClick={() => {
              setIsOpen(false);
              onAction("delete");
            }}
            className="w-full text-left px-4 py-2 text-xs sm:text-sm text-rose-500 font-bold hover:bg-rose-500/10 cursor-pointer transition-colors"
          >
            Delete Customer
          </button>
        </div>
      )}
    </div>
  );
}

// ── ACTION MODALS ───────────────────────────────────────────────────────
function PromoModal({ roomId, targetIds, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    message: "",
    discountType: "percentage",
    discountValue: 10,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await crmAPI.sendPromo(roomId, { userIds: targetIds, ...form });
      showToast("Promotions and Unique Coupons sent successfully", "success");
      onSuccess();
    } catch (err) {
      showToast(err.message || "Failed to send promo", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-admin-surface border border-admin-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
        <div className="p-5 border-b border-admin-border flex justify-between items-center bg-admin-surface-light">
          <h2 className="text-base sm:text-lg font-heading font-bold text-admin-text flex items-center gap-2">
            <Gift className="w-5 h-5 text-brand" /> Send Promotion
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-admin-text-secondary hover:text-admin-text hover:bg-admin-surface rounded-full transition-colors cursor-pointer"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs sm:text-sm font-medium text-admin-text-secondary mb-2">
            Sending to {targetIds.length} customer(s). They will receive an App
            Notification and a Unique Coupon Code.
          </p>

          <div>
            <label className="block text-xs font-bold text-admin-text mb-1">
              Offer Title
            </label>
            <input
              required
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Special VIP Discount"
              className="w-full border border-admin-border rounded-xl px-3 py-2 text-xs sm:text-sm text-admin-text bg-admin-surface outline-none focus:border-brand transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-admin-text mb-1">
                Discount Type
              </label>
              <select
                value={form.discountType}
                onChange={(e) =>
                  setForm({ ...form, discountType: e.target.value })
                }
                className="w-full border border-admin-border rounded-xl px-3 py-2 text-xs sm:text-sm text-admin-text bg-admin-surface outline-none focus:border-brand cursor-pointer"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount ($)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-admin-text mb-1">
                Value
              </label>
              <input
                required
                type="number"
                min="1"
                value={form.discountValue}
                onChange={(e) =>
                  setForm({ ...form, discountValue: e.target.value })
                }
                className="w-full border border-admin-border rounded-xl px-3 py-2 text-xs sm:text-sm text-admin-text bg-admin-surface outline-none focus:border-brand transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-admin-text mb-1">
              Message Body
            </label>
            <textarea
              required
              rows="3"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Write a nice message..."
              className="w-full border border-admin-border rounded-xl px-3 py-2 text-xs sm:text-sm text-admin-text bg-admin-surface outline-none focus:border-brand custom-scrollbar transition-colors"
            ></textarea>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-admin-surface-light border border-admin-border text-admin-text font-bold rounded-xl hover:bg-admin-surface transition-colors cursor-pointer text-xs sm:text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-brand text-white font-bold rounded-xl hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2 transition-all cursor-pointer text-xs sm:text-sm shadow-sm"
            >
              {loading ? "Sending..." : "Send Now"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function GroupModal({ roomId, targetIds, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [group, setGroup] = useState("Family");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await crmAPI.bulkUpdateCustomers(roomId, {
        customerIds: targetIds,
        updateData: { group },
      });
      showToast("Customer groups updated successfully", "success");
      onSuccess();
    } catch (err) {
      showToast(err.message || "Failed to update group", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-admin-surface border border-admin-border rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
        <div className="p-5 border-b border-admin-border flex justify-between items-center bg-admin-surface-light">
          <h2 className="text-base sm:text-lg font-heading font-bold text-admin-text">Assign Group</h2>
          <button
            onClick={onClose}
            className="p-1 text-admin-text-secondary hover:text-admin-text rounded-full transition-colors cursor-pointer"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs sm:text-sm font-medium text-admin-text-secondary">
            Select a group for {targetIds.length} customer(s).
          </p>
          <select
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            className="w-full border border-admin-border rounded-xl px-3 py-2 text-xs sm:text-sm text-admin-text outline-none focus:border-brand bg-admin-surface cursor-pointer"
          >
            <option value="App User">App User</option>
            <option value="Guest">Guest</option>
            <option value="Family">Family</option>
            <option value="Friends">Friends</option>
            <option value="Corporate">Corporate</option>
            <option value="Others">Others</option>
          </select>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-admin-surface-light border border-admin-border text-admin-text font-bold rounded-xl hover:bg-admin-surface transition-colors cursor-pointer text-xs sm:text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-brand text-white font-bold rounded-xl hover:brightness-110 disabled:opacity-50 transition-all cursor-pointer text-xs sm:text-sm shadow-sm"
            >
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
  const [status, setStatus] = useState("Active");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await crmAPI.bulkUpdateCustomers(roomId, {
        customerIds: targetIds,
        updateData: { status },
      });
      showToast("Customer statuses updated successfully", "success");
      onSuccess();
    } catch (err) {
      showToast(err.message || "Failed to update status", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-admin-surface border border-admin-border rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
        <div className="p-5 border-b border-admin-border flex justify-between items-center bg-admin-surface-light">
          <h2 className="text-base sm:text-lg font-heading font-bold text-admin-text">Change Status</h2>
          <button
            onClick={onClose}
            className="p-1 text-admin-text-secondary hover:text-admin-text rounded-full transition-colors cursor-pointer"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs sm:text-sm font-medium text-admin-text-secondary">
            Update status for {targetIds.length} customer(s).
          </p>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full border border-admin-border rounded-xl px-3 py-2 text-xs sm:text-sm text-admin-text outline-none focus:border-brand bg-admin-surface cursor-pointer"
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-admin-surface-light border border-admin-border text-admin-text font-bold rounded-xl hover:bg-admin-surface transition-colors cursor-pointer text-xs sm:text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-brand text-white font-bold rounded-xl hover:brightness-110 disabled:opacity-50 transition-all cursor-pointer text-xs sm:text-sm shadow-sm"
            >
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
      showToast("Customers deleted successfully", "success");
      onSuccess();
    } catch (err) {
      showToast(err.message || "Failed to delete customers", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-admin-surface border border-admin-border rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
            <Trash2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-heading font-bold text-admin-text mb-2">
            Delete Customers?
          </h2>
          <p className="text-xs sm:text-sm font-medium text-admin-text-secondary mb-6">
            Are you sure you want to delete {targetIds.length} customer(s)? This
            will archive their profiles.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-admin-surface-light border border-admin-border text-admin-text font-bold rounded-xl hover:bg-admin-surface transition-colors cursor-pointer text-xs sm:text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 disabled:opacity-50 transition-all cursor-pointer text-xs sm:text-sm shadow-sm"
            >
              {loading ? "Deleting..." : "Yes, Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
