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
  }, [searchQuery, groupFilter, tierFilter, statusFilter]);

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
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === 'totalSpent' || sortConfig.key === 'totalOrders') {
          aValue = Number(aValue || 0);
          bValue = Number(bValue || 0);
        } else if (sortConfig.key === 'lastOrderDate') {
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
    }
    return sortableItems;
  }, [filteredCustomers, sortConfig]);

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
    <div className="flex flex-col h-full bg-[#F8FAFC] relative">
      <div className="flex items-center justify-between mb-6 shrink-0 pt-2 px-2">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Customers & CRM</h1>
          <p className="text-sm text-[#6b7280] mt-1">
            Manage customer relationships, loyalty and communication.
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportToCSV} className="bg-white border border-[#e5e7eb] rounded-lg px-4 py-2 text-sm text-[#374151] font-bold flex items-center gap-2 hover:bg-[#f9fafb] shadow-sm transition-all">
            <Download className="w-4 h-4" /> Export
          </button>
          <button className="bg-white border border-[#e5e7eb] rounded-lg px-4 py-2 text-sm text-[#374151] font-bold flex items-center gap-2 hover:bg-[#f9fafb] shadow-sm transition-all">
            <Upload className="w-4 h-4" /> Import
          </button>
          <button
            onClick={() => onAdd?.()}
            className="bg-[#8B0000] text-white rounded-lg px-4 py-2 text-sm font-bold flex items-center gap-2 hover:bg-red-900 transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4" /> Add Customer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6 shrink-0 px-2">
        <StatCard
          title="Total Customers"
          value={totalCustomersNow.toLocaleString()}
          icon={Users}
          iconColor="text-[#ea580c]"
          iconBg="bg-[#fff7ed]"
          trend={totalCustomersTrend}
        />
        <StatCard
          title="New Customers"
          value={newCustomersNow.toLocaleString()}
          icon={UserPlus}
          iconColor="text-[#10B981]"
          iconBg="bg-[#ecfdf5]"
          trend={newCustomersTrend}
        />
        <StatCard
          title="Loyalty Members"
          value={loyaltyNow.toLocaleString()}
          icon={Crown}
          iconColor="text-[#a855f7]"
          iconBg="bg-[#faf5ff]"
          trend={loyaltyTrend}
        />
        <StatCard
          title="Repeat Customers"
          value={repeatNow.toLocaleString()}
          icon={Gift}
          iconColor="text-[#3b82f6]"
          iconBg="bg-[#eff6ff]"
          trend={repeatTrend}
        />
        <StatCard
          title="Top Customers"
          value={topNow.toLocaleString()}
          icon={Star}
          iconColor="text-[#ef4444]"
          iconBg="bg-[#fef2f2]"
          trend={topTrend}
        />
      </div>

      <div className="flex flex-col xl:flex-row flex-1 gap-6 pb-2 px-2 max-h-[750px] ">
        <div className="flex-1 bg-white rounded-[20px] shadow-sm border border-[#e5e7eb] flex flex-col relative min-w-0 group">
          
          {/* STICKY TOP SECTION */}
          <div className="sticky top-[72px] z-40 bg-white rounded-t-[20px] flex flex-col shadow-sm">
            <div className="p-4 border-b border-[#f3f4f6] flex flex-wrap gap-4 items-center justify-between shrink-0">
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
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#374151] font-medium outline-none cursor-pointer hover:bg-white transition-colors"
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
                className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#374151] font-medium outline-none cursor-pointer hover:bg-white transition-colors"
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
                className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#374151] font-medium outline-none cursor-pointer hover:bg-white transition-colors"
              >
                <option>All Status</option>
                <option>Active</option>
                <option>Inactive</option>
              </select>

              <button
                onClick={() => {
                  setSearchQuery("");
                  setGroupFilter("All Groups");
                  setTierFilter("All Loyalty Tiers");
                  setStatusFilter("All Status");
                }}
                className="bg-white border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#374151] font-bold flex items-center gap-2 hover:bg-[#f9fafb] transition-colors"
              >
                <XCircle className="w-4 h-4" /> Reset
              </button>
            </div>
          </div>

          {/* Table Header (Synced horizontal scroll) */}
          <div className="border-b border-[#e5e7eb] overflow-hidden" ref={tableHeaderRef}>
              <table className="w-full text-left border-collapse min-w-[1280px] table-fixed">
                <TableColGroup />
                <thead className="bg-[#f9fafb]">
                  <tr className="text-xs font-bold text-[#6b7280] uppercase tracking-wider">
                    <th className="px-6 py-4 text-center">
                      <input
                        type="checkbox"
                        onChange={handleSelectAll}
                        checked={
                          selectedIds.length === displayedCustomers.length &&
                          displayedCustomers.length > 0
                        }
                        className="w-4 h-4 cursor-pointer rounded !bg-white border-gray-300 text-[#8B0000] focus:ring-[#8B0000] accent-[#8B0000]"
                        style={{ backgroundColor: "white" }}
                      />
                    </th>
                    <SortHeader label="Customer" sortKey="name" />
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4">Group</th>
                    <SortHeader label="Loyalty Tier" sortKey="loyaltyTier" align="center" />
                    <SortHeader label="Total Orders" sortKey="totalOrders" align="center" />
                    <SortHeader label="Total Spent" sortKey="totalSpent" align="right" />
                    <SortHeader label="Last Order" sortKey="lastOrderDate" />
                    <SortHeader label="Status" sortKey="status" align="center" />
                    <th className="px-6 py-4 text-center">Actions</th>
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
                className="pointer-events-auto w-9 h-9 bg-white shadow-md border border-[#e5e7eb] rounded-full flex items-center justify-center text-[#374151] hover:text-[#8B0000] hover:bg-gray-50 transition-all absolute left-2 -translate-y-1/2"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            {canScrollRight && (
              <button
                onClick={() => scrollByAmount(300)}
                className="pointer-events-auto w-9 h-9 bg-white shadow-md border border-[#e5e7eb] rounded-full flex items-center justify-center text-[#374151] hover:text-[#8B0000] hover:bg-gray-50 transition-all absolute right-2 -translate-y-1/2"
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
              <tbody className="divide-y divide-[#f9fafb]">
                {isLoading ? (
                  [...Array(5)].map((_, idx) => (
                    <tr key={`skeleton-${idx}`} className="animate-pulse bg-white border-b border-[#f3f4f6]">
                      <td className="px-6 py-4 text-center"><div className="w-4 h-4 bg-gray-200 rounded"></div></td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-200"></div>
                          <div className="space-y-2">
                            <div className="w-24 h-3 bg-gray-200 rounded"></div>
                            <div className="w-16 h-2 bg-gray-200 rounded"></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 space-y-2">
                        <div className="w-24 h-3 bg-gray-200 rounded"></div>
                        <div className="w-32 h-2 bg-gray-200 rounded"></div>
                      </td>
                      <td className="px-6 py-4"><div className="w-16 h-4 bg-gray-200 rounded"></div></td>
                      <td className="px-6 py-4 text-center"><div className="w-16 h-5 bg-gray-200 rounded mx-auto"></div></td>
                      <td className="px-6 py-4 text-center"><div className="w-8 h-4 bg-gray-200 rounded mx-auto"></div></td>
                      <td className="px-6 py-4 text-right"><div className="w-12 h-4 bg-gray-200 rounded ml-auto"></div></td>
                      <td className="px-6 py-4"><div className="w-20 h-4 bg-gray-200 rounded"></div></td>
                      <td className="px-6 py-4 text-center"><div className="w-16 h-5 bg-gray-200 rounded mx-auto"></div></td>
                      <td className="px-6 py-4"><div className="w-6 h-6 bg-gray-200 rounded mx-auto"></div></td>
                    </tr>
                  ))
                ) : displayedCustomers.map((c) => (
                  <tr
                    key={c._id}
                    className={`transition-colors group ${selectedIds.includes(c._id) ? "bg-[#8B0000]/5" : "hover:bg-[#f9fafb]"}`}
                  >
                    <td className="px-6 py-4 text-center">
                      <input
                        type="checkbox"
                        onChange={(e) => handleSelectOne(e, c._id)}
                        checked={selectedIds.includes(c._id)}
                        className="w-4 h-4 cursor-pointer rounded !bg-white border-gray-300 text-[#8B0000] focus:ring-[#8B0000] accent-[#8B0000]"
                        style={{ backgroundColor: "white" }}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className="flex items-center gap-3 cursor-pointer group/name"
                        onClick={() => setSelectedProfileCustomer(c)}
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8B0000] to-[#5a0000] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm group-hover/name:opacity-90">
                          {c.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-[#111827] group-hover/name:text-[#8B0000] transition-colors">
                              {c.name}
                            </p>
                          </div>
                          <div className="flex flex-col gap-1 mt-0.5">
                            <p className="text-xs text-[#6b7280]">
                              ID: {c.customerId}
                            </p>
                            {(c.loginPlatforms?.includes('web') || c.loginPlatforms?.includes('app')) && (
                              <div className="flex items-center gap-1 mt-1">
                                {c.loginPlatforms.includes('web') && (
                                  <span className="text-[10px] font-bold text-[#1e40af] bg-[#eff6ff] border border-[#bfdbfe] px-1.5 py-0.5 rounded flex items-center gap-1 shadow-sm">
                                    <Globe className="w-3 h-3" /> Web
                                  </span>
                                )}
                                {c.loginPlatforms.includes('app') && (
                                  <span className="text-[10px] font-bold text-[#166534] bg-[#f0fdf4] border border-[#bbf7d0] px-1.5 py-0.5 rounded flex items-center gap-1 shadow-sm">
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
                      <p className="text-xs text-[#374151] flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-[#9ca3af]" />{" "}
                        {c.phone || "-"}
                      </p>
                      <p className="text-xs text-[#6b7280] flex items-center gap-1.5 mt-0.5">
                        <Mail className="w-3 h-3 text-[#9ca3af]" />{" "}
                        {c.email || "-"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-[#374151]">
                        {c.group || "Others"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getTierBadge(c.loyaltyTier)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-bold text-[#111827]">
                        {c.totalOrders || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-[#111827]">
                        ${(c.totalSpent || 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-[#374151] font-medium">
                        {c.lastOrderDate
                          ? new Date(c.lastOrderDate).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )
                          : "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(c.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setSelectedProfileCustomer(c)}
                          className="p-1.5 text-[#9ca3af] hover:text-[#374151] hover:bg-white rounded border border-transparent hover:border-[#e5e7eb]"
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
                      <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-[#e5e7eb] rounded-xl bg-[#f9fafb] max-w-sm mx-auto">
                        <Users className="w-10 h-10 text-[#d1d5db] mb-3" />
                        <p className="text-sm font-bold text-[#9ca3af]">
                          No customers found
                        </p>
                        <p className="text-xs text-[#9ca3af] mt-1">
                          Try adjusting your filters or search criteria.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-[#f3f4f6] flex items-center justify-between bg-white shrink-0 rounded-b-[20px]">
            <span className="text-xs font-semibold text-[#6b7280]">
              Showing{" "}
              <strong className="text-[#374151]">
                {displayedCustomers.length}
              </strong>{" "}
              of{" "}
              <strong className="text-[#374151]">
                {filteredCustomers.length}
              </strong>{" "}
              customers
            </span>

            {hasMoreItems && (
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="flex items-center justify-center gap-2 w-[160px] h-[36px] bg-white border border-[#e5e7eb] text-[#374151] rounded-lg text-[13px] font-bold hover:bg-[#f9fafb] hover:text-[#8B0000] hover:border-[#8B0000] transition-all shadow-sm"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading...
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
          <div className="bg-white rounded-xl shadow-sm border border-[#e5e7eb] p-5">
            <h3 className="text-sm font-bold text-[#111827] mb-4">
              Top Customers
            </h3>
            <div className="space-y-4">
              {[...customers]
                .sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0))
                .slice(0, 5)
                .map((c, i) => (
                  <div
                    key={c._id || i}
                    className="flex justify-between items-center border-b border-[#f3f4f6] pb-3 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-[#6b7280]">
                        {i + 1}
                      </div>
                      <div className="w-8 h-8 rounded-full bg-[#f3f4f6] text-[#4b5563] flex items-center justify-center font-bold text-xs shadow-sm">
                        {c.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#111827] flex items-center gap-1">
                          {c.name}{" "}
                          {i < 3 && (
                            <Crown className="w-3 h-3 text-[#f59e0b]" />
                          )}
                        </p>
                        <p className="text-xs text-[#6b7280]">
                          {c.totalOrders || 0} Orders
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[#111827]">
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
        <div className="fixed bottom-6 left-[calc(50%-160px)] -translate-x-1/2 bg-[#111827] text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-5 z-50">
          <span className="text-sm font-bold whitespace-nowrap bg-white/10 px-2 py-1 rounded">
            {selectedIds.length} Selected
          </span>
          <div className="flex items-center gap-2 border-l border-white/20 pl-4">
            <button
              onClick={() => triggerBulkAction("promo")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-[#374151] transition-colors text-xs font-bold text-gray-300 hover:text-white"
            >
              <Tag className="w-3.5 h-3.5" /> Send Promo
            </button>
            <button
              onClick={() => triggerBulkAction("group")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-[#374151] transition-colors text-xs font-bold text-gray-300 hover:text-white"
            >
              <UsersRound className="w-3.5 h-3.5" /> Group
            </button>
            <button
              onClick={() => triggerBulkAction("status")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-[#374151] transition-colors text-xs font-bold text-gray-300 hover:text-white"
            >
              <Power className="w-3.5 h-3.5" /> Status
            </button>
            <button
              onClick={() => triggerBulkAction("delete")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-red-900/50 text-red-400 hover:text-red-300 transition-colors text-xs font-bold"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
            <button
              onClick={clearSelection}
              className="ml-1 p-1 rounded hover:bg-[#374151] text-gray-400 hover:text-white transition-colors"
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
        className={`p-1.5 rounded border transition-colors ${isOpen ? "bg-white text-[#374151] border-[#e5e7eb]" : "text-[#9ca3af] hover:text-[#374151] hover:bg-white border-transparent hover:border-[#e5e7eb]"}`}
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-[#e5e7eb] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
          {onEdit && (
            <button
              onClick={() => {
                setIsOpen(false);
                onEdit();
              }}
              className="w-full text-left px-4 py-2 text-sm text-[#374151] font-medium hover:bg-[#f9fafb] hover:text-[#111827]"
            >
              Edit Customer
            </button>
          )}
          <button
            onClick={() => {
              setIsOpen(false);
              onAction("promo");
            }}
            className="w-full text-left px-4 py-2 text-sm text-[#374151] font-medium hover:bg-[#f9fafb] hover:text-[#111827]"
          >
            Send Promo
          </button>
          <button
            onClick={() => {
              setIsOpen(false);
              onAction("group");
            }}
            className="w-full text-left px-4 py-2 text-sm text-[#374151] font-medium hover:bg-[#f9fafb] hover:text-[#111827]"
          >
            Assign Group
          </button>
          <div className="h-px bg-[#e5e7eb] my-1"></div>
          <button
            onClick={() => {
              setIsOpen(false);
              onAction("status");
            }}
            className="w-full text-left px-4 py-2 text-sm text-[#374151] font-medium hover:bg-[#f9fafb] hover:text-[#111827]"
          >
            Change Status
          </button>
          <button
            onClick={() => {
              setIsOpen(false);
              onAction("delete");
            }}
            className="w-full text-left px-4 py-2 text-sm text-[#dc2626] font-bold hover:bg-[#fef2f2]"
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
        <div className="p-5 border-b border-[#e5e7eb] flex justify-between items-center bg-[#F8FAFC]">
          <h2 className="text-lg font-bold text-[#111827] flex items-center gap-2">
            <Gift className="w-5 h-5 text-[#8B0000]" /> Send Promotion
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm font-medium text-[#6b7280] mb-2">
            Sending to {targetIds.length} customer(s). They will receive an App
            Notification and a Unique Coupon Code.
          </p>

          <div>
            <label className="block text-xs font-bold text-[#374151] mb-1">
              Offer Title
            </label>
            <input
              required
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Special VIP Discount"
              className="w-full border border-[#d1d5db] rounded-lg px-3 py-2 text-sm text-[#111827] bg-white outline-none focus:border-[#8B0000] focus:ring-1 focus:ring-[#8B0000]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#374151] mb-1">
                Discount Type
              </label>
              <select
                value={form.discountType}
                onChange={(e) =>
                  setForm({ ...form, discountType: e.target.value })
                }
                className="w-full border border-[#d1d5db] rounded-lg px-3 py-2 text-sm text-[#111827] bg-white outline-none focus:border-[#8B0000]"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount ($)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#374151] mb-1">
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
                className="w-full border border-[#d1d5db] rounded-lg px-3 py-2 text-sm text-[#111827] bg-white outline-none focus:border-[#8B0000] focus:ring-1 focus:ring-[#8B0000]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#374151] mb-1">
              Message Body
            </label>
            <textarea
              required
              rows="3"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Write a nice message..."
              className="w-full border border-[#d1d5db] rounded-lg px-3 py-2 text-sm text-[#111827] bg-white outline-none focus:border-[#8B0000] focus:ring-1 focus:ring-[#8B0000] custom-scrollbar"
            ></textarea>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 text-[#111827] font-bold rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-[#8B0000] text-white font-bold rounded-lg hover:bg-red-900 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
        <div className="p-5 border-b border-[#e5e7eb] flex justify-between items-center bg-[#F8FAFC]">
          <h2 className="text-lg font-bold text-[#111827]">Assign Group</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-700"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm font-medium text-[#6b7280]">
            Select a group for {targetIds.length} customer(s).
          </p>
          <select
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            className="w-full border border-[#d1d5db] rounded-lg px-3 py-2 text-sm text-[#111827] outline-none focus:border-[#8B0000] bg-white cursor-pointer"
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
              className="flex-1 px-4 py-2 bg-gray-100 text-[#111827] font-bold rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-[#111827] text-white font-bold rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
        <div className="p-5 border-b border-[#e5e7eb] flex justify-between items-center bg-[#F8FAFC]">
          <h2 className="text-lg font-bold text-[#111827]">Change Status</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-700"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm font-medium text-[#6b7280]">
            Update status for {targetIds.length} customer(s).
          </p>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full border border-[#d1d5db] rounded-lg px-3 py-2 text-sm text-[#111827] outline-none focus:border-[#8B0000] bg-white cursor-pointer"
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 text-[#111827] font-bold rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-[#111827] text-white font-bold rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-[#111827] mb-2">
            Delete Customers?
          </h2>
          <p className="text-sm font-medium text-[#6b7280] mb-6">
            Are you sure you want to delete {targetIds.length} customer(s)? This
            will archive their profiles.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 text-[#111827] font-bold rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Deleting..." : "Yes, Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
