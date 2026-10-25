'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldAlert, AlertTriangle, Info, ChevronDown, ChevronUp, Search, 
  Calendar, RefreshCcw, Activity, ShieldCheck, User, Users, Smartphone, 
  Laptop, Globe, Wifi, Key, Lock, ArrowUpRight, ShoppingBag, 
  RefreshCw, RotateCcw, Ban, CheckCircle2, Filter, Layers, Clock
} from 'lucide-react';
import { api } from '../../lib/api';
import { PageLoader, showToast } from '../ui';
import PageHeaderGradient from './common/PageHeaderGradient';
import TableScrollContainer from './common/TableScrollContainer';

const severityConfig = {
  critical: { icon: ShieldAlert, color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
  warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
};

export default function SystemAuditView({ onSelectOrder }) {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ total: 0, merchantCount: 0, customerCount: 0, criticalCount: 0, remakeCount: 0 });
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  // Sub-tabs: 'all' | 'merchant' | 'customer' | 'critical'
  const [activeTab, setActiveTab] = useState('all');

  // Filters
  const [severityFilter, setSeverityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('all'); // 'all', 'today', '7days', '30days'

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const res = await api.get('/api/audit/stats');
      const statsData = res?.data?.data || res?.data || res;
      if (statsData && typeof statsData === 'object') {
        setStats({
          total: Number(statsData.total || 0),
          merchantCount: Number(statsData.merchantCount || 0),
          customerCount: Number(statsData.customerCount || 0),
          criticalCount: Number(statsData.criticalCount || 0),
          remakeCount: Number(statsData.remakeCount || 0),
        });
      }
    } catch (err) {
      console.warn('Could not fetch audit stats:', err.message);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({ limit: '150' });
      
      if (activeTab === 'merchant') {
        queryParams.append('actorType', 'merchant');
      } else if (activeTab === 'customer') {
        queryParams.append('actorType', 'customer');
      } else if (activeTab === 'critical') {
        queryParams.append('severity', 'warning'); // backend handles critical + warning in UI filter
      }

      if (severityFilter !== 'all') {
        queryParams.set('severity', severityFilter);
      }

      if (searchQuery.trim()) {
        queryParams.append('search', searchQuery.trim());
      }

      // Date range calculation
      if (dateRange !== 'all') {
        const now = new Date();
        let startDate = new Date();
        if (dateRange === 'today') {
          startDate.setHours(0, 0, 0, 0);
        } else if (dateRange === '7days') {
          startDate.setDate(now.getDate() - 7);
        } else if (dateRange === '30days') {
          startDate.setDate(now.getDate() - 30);
        }
        queryParams.append('startDate', startDate.toISOString());
      }

      const res = await api.get(`/api/audit?${queryParams.toString()}`);
      const logsArray = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setLogs(logsArray);
    } catch (err) {
      console.error(err);
      showToast('Failed to load activity & audit logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [activeTab, severityFilter, dateRange]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Helper to render actor badge
  const renderActorBadge = (log) => {
    const actorType = log.actorType || (log.actor?.role === 'customer' ? 'customer' : 'system');
    const name = log.actor?.name || log.userId?.name || 'System / Platform';
    const email = log.actor?.email || log.userId?.email || null;
    const role = log.actor?.role || null;

    if (actorType === 'customer') {
      return (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
            <User className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-admin-text text-xs truncate">{name}</p>
            <p className="text-[10px] text-emerald-600 font-medium">Customer {email ? `• ${email}` : ''}</p>
          </div>
        </div>
      );
    }

    if (actorType === 'merchant' || actorType === 'staff' || actorType === 'admin') {
      return (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
            <Users className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-admin-text text-xs truncate">{name}</p>
            <p className="text-[10px] text-indigo-600 font-medium">
              Staff / Merchant {role ? `(${role})` : ''} {email ? `• ${email}` : ''}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-slate-500/10 border border-slate-500/20 text-slate-500 flex items-center justify-center font-bold text-xs shrink-0">
          <Activity className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-admin-text text-xs truncate">{name}</p>
          <p className="text-[10px] text-admin-muted font-medium">Platform Event</p>
        </div>
      </div>
    );
  };

  // Helper to render action badge
  const renderActionBadge = (event) => {
    const ev = (event || '').toUpperCase();
    if (ev.includes('REMAKE')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10.5px] font-bold bg-amber-500/15 text-amber-800 border border-amber-500/30">
          <RefreshCw className="w-3 h-3 text-amber-600" /> Remake Order
        </span>
      );
    }
    if (ev.includes('LOGIN')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10.5px] font-bold bg-purple-500/15 text-purple-700 border border-purple-500/30">
          <Key className="w-3 h-3 text-purple-600" /> {ev.includes('SOCIAL') ? 'Social Login' : 'User Login'}
        </span>
      );
    }
    if (ev.includes('CANCEL')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10.5px] font-bold bg-rose-500/15 text-rose-700 border border-rose-500/30">
          <Ban className="w-3 h-3 text-rose-600" /> Order Cancelled
        </span>
      );
    }
    if (ev.includes('REFUND')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10.5px] font-bold bg-violet-500/15 text-violet-700 border border-violet-500/30">
          <RotateCcw className="w-3 h-3 text-violet-600" /> Refund Processed
        </span>
      );
    }
    if (ev.includes('POS')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10.5px] font-bold bg-blue-500/15 text-blue-700 border border-blue-500/30">
          <ShoppingBag className="w-3 h-3 text-blue-600" /> POS Terminal Order
        </span>
      );
    }
    if (ev.includes('ORDER')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10.5px] font-bold bg-emerald-500/15 text-emerald-700 border border-emerald-500/30">
          <ShoppingBag className="w-3 h-3 text-emerald-600" /> Order Placed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-mono font-bold bg-admin-surface-2 text-admin-text border border-admin-border">
        {event}
      </span>
    );
  };

  const displayTotal = stats.total > 0 ? stats.total : (activeTab === 'all' ? logs.length : (stats.total || 0));
  const displayMerchant = stats.merchantCount > 0 ? stats.merchantCount : (activeTab === 'merchant' ? logs.length : (stats.merchantCount || 0));
  const displayCustomer = stats.customerCount > 0 ? stats.customerCount : (activeTab === 'customer' ? logs.length : (stats.customerCount || 0));
  const displayCritical = stats.criticalCount > 0 ? stats.criticalCount : (activeTab === 'critical' ? logs.length : (stats.criticalCount || 0));

  return (
    <div className="space-y-4 pb-8 w-full">
      {/* Header section */}
      <PageHeaderGradient
        withBackground={false}
        title="Security & Activity Logs"
        subtitle="Immutable forensic audit ledger tracking staff actions, customer telemetry, device fingerprints, and fraud defense proofs."
        actions={
          <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
            <button 
              onClick={() => { fetchStats(); fetchLogs(); }}
              className="p-2.5 bg-admin-surface hover:bg-admin-surface-2 rounded-xl border border-admin-border transition-colors text-admin-muted hover:text-admin-text flex items-center gap-2 text-xs font-bold font-outfit"
              title="Refresh Logs"
            >
              <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin text-primary' : ''}`} />
              <span className="hidden sm:inline">Live Refresh</span>
            </button>
          </div>
        }
      />

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-admin-surface border border-admin-border rounded-2xl p-4.5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-admin-muted">
            <span className="text-[11px] font-bold font-outfit uppercase tracking-wider">Total Audit Events</span>
            <ShieldCheck className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-black text-admin-text font-outfit">{displayTotal}</p>
          <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Real-time Telemetry Active
          </p>
        </div>

        <div className="bg-admin-surface border border-admin-border rounded-2xl p-4.5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-admin-muted">
            <span className="text-[11px] font-bold font-outfit uppercase tracking-wider">Staff & Merchant</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-admin-text font-outfit">{displayMerchant}</p>
          <p className="text-[10px] text-admin-muted font-medium">Logins, POS, Remakes, Edits</p>
        </div>

        <div className="bg-admin-surface border border-admin-border rounded-2xl p-4.5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-admin-muted">
            <span className="text-[11px] font-bold font-outfit uppercase tracking-wider">Customer Events</span>
            <User className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-admin-text font-outfit">{displayCustomer}</p>
          <p className="text-[10px] text-admin-muted font-medium">Web & App Logins, Checkout</p>
        </div>

        <div className="bg-admin-surface border border-admin-border rounded-2xl p-4.5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-admin-muted">
            <span className="text-[11px] font-bold font-outfit uppercase tracking-wider">Security & Warnings</span>
            <ShieldAlert className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-admin-text font-outfit">{displayCritical}</p>
          <p className="text-[10px] text-amber-600 font-medium">{stats.remakeCount || 0} Remakes • Auto-Refunds</p>
        </div>
      </div>

      {/* Sub-Tabs: Staff vs Customer vs All vs Security */}
      <div className="flex items-center gap-2 border-b border-admin-border pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 font-outfit cursor-pointer ${
            activeTab === 'all'
              ? 'bg-primary text-white shadow-sm'
              : 'bg-admin-surface hover:bg-admin-surface-2 text-admin-muted hover:text-admin-text border border-admin-border'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>All Activities</span>
          <span className="text-[10px] opacity-80 px-1.5 py-0.2 rounded-full bg-black/20">{displayTotal}</span>
        </button>

        <button
          onClick={() => setActiveTab('merchant')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 font-outfit cursor-pointer ${
            activeTab === 'merchant'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-admin-surface hover:bg-admin-surface-2 text-admin-muted hover:text-admin-text border border-admin-border'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Staff & Merchant Actions</span>
          <span className="text-[10px] opacity-80 px-1.5 py-0.2 rounded-full bg-black/20">{displayMerchant}</span>
        </button>

        <button
          onClick={() => setActiveTab('customer')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 font-outfit cursor-pointer ${
            activeTab === 'customer'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-admin-surface hover:bg-admin-surface-2 text-admin-muted hover:text-admin-text border border-admin-border'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Customer Activity & Telemetry</span>
          <span className="text-[10px] opacity-80 px-1.5 py-0.2 rounded-full bg-black/20">{displayCustomer}</span>
        </button>

        <button
          onClick={() => setActiveTab('critical')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 font-outfit cursor-pointer ${
            activeTab === 'critical'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-admin-surface hover:bg-admin-surface-2 text-admin-muted hover:text-admin-text border border-admin-border'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Security & Warnings</span>
          <span className="text-[10px] opacity-80 px-1.5 py-0.2 rounded-full bg-black/20">{displayCritical}</span>
        </button>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-admin-surface border border-admin-border rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-admin-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by order #, email, name, IP address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-admin-surface-2 border border-admin-border rounded-xl py-2 pl-9 pr-3 text-xs text-admin-text placeholder:text-admin-muted focus:outline-none focus:border-primary transition-all font-medium"
          />
        </form>

        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-admin-muted">
            <Filter className="w-3.5 h-3.5" />
            <span className="font-bold font-outfit uppercase tracking-wider text-[10px]">Filter:</span>
          </div>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-admin-surface-2 border border-admin-border rounded-xl py-2 px-3 text-xs text-admin-text focus:outline-none focus:border-primary transition-all cursor-pointer font-medium"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-admin-surface-2 border border-admin-border rounded-xl py-2 px-3 text-xs text-admin-text focus:outline-none focus:border-primary transition-all cursor-pointer font-medium"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-admin-surface border border-admin-border rounded-2xl overflow-hidden shadow-sm">
        <TableScrollContainer>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-admin-surface-2/60 border-b border-admin-border text-[11px] uppercase tracking-wider text-admin-muted font-bold font-outfit">
                <th className="p-3.5 w-10"></th>
                <th className="p-3.5 whitespace-nowrap">Timestamp</th>
                <th className="p-3.5 whitespace-nowrap">Actor & Role</th>
                <th className="p-3.5 whitespace-nowrap">Action / Event</th>
                <th className="p-3.5 whitespace-nowrap">Device & IP Telemetry</th>
                <th className="p-3.5">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border dark:divide-white/[0.08] text-admin-text">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-admin-muted font-medium">
                    <RefreshCcw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                    Loading activity logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-admin-muted font-medium">
                    No activity logs found for the selected view.
                  </td>
                </tr>
              ) : (
                logs.map(log => {
                  const isExpanded = expandedId === log._id;
                  const config = severityConfig[log.severity] || severityConfig.info;
                  const Icon = config.icon;
                  const rawDevice = {
                    ...(log.metadata?.device || {}),
                    ...(log.device || {})
                  };
                  const device = {
                    ...rawDevice,
                    browser: (rawDevice.platform === 'customer_app' && rawDevice.browser === 'Merchant Mobile App')
                      ? 'Customer Mobile App'
                      : (rawDevice.browser || 'Web Browser'),
                    locationDisplay: rawDevice.locationDisplay || rawDevice.location || (
                      (rawDevice.city || rawDevice.country) 
                        ? [rawDevice.city, rawDevice.region, rawDevice.country].filter(Boolean).join(', ') 
                        : null
                    )
                  };

                  return (
                    <React.Fragment key={log._id}>
                      <tr 
                        onClick={() => toggleExpand(log._id)}
                        className={`hover:bg-admin-surface-2/50 transition-colors cursor-pointer group ${isExpanded ? 'bg-admin-surface-2/40' : ''}`}
                      >
                        <td className="p-3.5 text-center">
                          {isExpanded ? 
                            <ChevronUp className="w-4 h-4 text-admin-muted group-hover:text-admin-text transition-colors" /> : 
                            <ChevronDown className="w-4 h-4 text-admin-muted group-hover:text-admin-text transition-colors" />
                          }
                        </td>
                        
                        {/* Timestamp */}
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="space-y-0.5">
                            <p className="font-semibold text-admin-text text-[11.5px]">
                              {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </p>
                            <p className="text-[10px] text-admin-muted">
                              {new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                        </td>

                        {/* Actor */}
                        <td className="p-3.5">
                          {renderActorBadge(log)}
                        </td>

                        {/* Action Event */}
                        <td className="p-3.5 whitespace-nowrap">
                          {renderActionBadge(log.event)}
                        </td>

                        {/* Device & Forensic Telemetry */}
                        <td className="p-3.5">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <a
                                href={`https://www.google.com/search?q=${encodeURIComponent(device.os || device.deviceType || 'Android')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                title={`Click to search "${device.os || device.deviceType}" on Google to identify phone model`}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-admin-text bg-admin-surface-2 hover:bg-primary/10 border border-admin-border hover:border-primary/40 px-2 py-0.5 rounded-md transition-all hover:text-primary cursor-pointer group/dev"
                              >
                                {device.deviceType === 'Mobile' ? <Smartphone className="w-3 h-3 text-emerald-500" /> : <Laptop className="w-3 h-3 text-blue-500" />}
                                <span className="group-hover/dev:underline">{device.os || (device.deviceType || 'Web Client')}</span>
                                <ArrowUpRight className="w-2.5 h-2.5 opacity-50 group-hover/dev:opacity-100 group-hover/dev:translate-x-0.5 transition-transform" />
                              </a>
                              {device.browser && (
                                <span className="text-[10.5px] text-admin-muted font-medium">
                                  {device.browser}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10.5px] text-admin-muted font-mono">
                              <span>📍 {device.ip || '127.0.0.1'}</span>
                              {device.locationDisplay && (
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(device.locationDisplay)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-admin-text-secondary hover:text-primary hover:underline truncate max-w-[140px] transition-colors cursor-pointer inline-flex items-center gap-0.5"
                                  title={`Click to open "${device.locationDisplay}" on Google Maps`}
                                >
                                  <span>({device.locationDisplay})</span>
                                  <ArrowUpRight className="w-2.5 h-2.5 opacity-60 shrink-0" />
                                </a>
                              )}
                              {(device.networkCarrier || device.networkType) && (
                                <span className="text-emerald-600 font-sans font-bold">
                                  • 📶 {[device.networkCarrier, device.networkType].filter(Boolean).join(' • ')}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Details Message & Order # */}
                        <td className="p-3.5 text-xs text-admin-text max-w-sm truncate pr-4" title={log.message}>
                          <div className="space-y-0.5">
                            {log.orderNumber && (
                              <span className="inline-block font-mono text-[11px] font-bold text-primary mr-1.5 bg-primary/10 border border-primary/20 px-1.5 py-0.2 rounded">
                                #{log.orderNumber}
                              </span>
                            )}
                            <span className="opacity-90">{log.message}</span>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Forensic Drawer */}
                      {isExpanded && (
                        <tr className="bg-admin-surface-2/30">
                          <td colSpan="6" className="p-0">
                            <div className="p-6 border-b border-admin-border overflow-hidden animate-in slide-in-from-top-2 duration-200">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Left: Full Forensic Context */}
                                <div className="space-y-4">
                                  <div>
                                    <h4 className="text-[10px] text-admin-muted uppercase tracking-wider mb-1 font-bold font-outfit">Event Summary</h4>
                                    <p className="text-xs text-admin-text leading-relaxed font-medium">{log.message}</p>
                                  </div>

                                  <div className="bg-admin-surface border border-admin-border rounded-xl p-3 space-y-2 text-xs">
                                    <div className="flex justify-between">
                                      <span className="text-admin-muted">Actor Type:</span>
                                      <span className="font-bold text-admin-text uppercase">{log.actorType || 'System'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-admin-muted">Severity:</span>
                                      <span className={`font-bold capitalize ${config.color}`}>{log.severity}</span>
                                    </div>
                                    {log.orderNumber && (
                                      <div className="flex justify-between items-center">
                                        <span className="text-admin-muted">Order Ref:</span>
                                        <span className="font-mono font-bold text-primary">#{log.orderNumber}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Middle: Telemetry & Fingerprint */}
                                <div className="space-y-3">
                                  <h4 className="text-[10px] text-admin-muted uppercase tracking-wider font-bold font-outfit">
                                    Device & Network Telemetry
                                  </h4>
                                  <div className="bg-admin-surface border border-admin-border rounded-xl p-3.5 space-y-2 text-xs">
                                    <div className="flex justify-between">
                                      <span className="text-admin-muted">IP Address:</span>
                                      <span className="font-mono font-bold text-admin-text">{device.ip || '127.0.0.1'}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-admin-muted">Device / OS:</span>
                                      <a
                                        href={`https://www.google.com/search?q=${encodeURIComponent(device.os || device.deviceType || 'Android')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Click to search device model on Google"
                                        className="font-semibold text-admin-text hover:text-primary transition-colors flex items-center gap-1 group/os text-right"
                                      >
                                        <span className="group-hover/os:underline">{device.deviceType || 'Desktop'} • {device.os || 'Unknown'}</span>
                                        <ArrowUpRight className="w-3 h-3 text-admin-muted group-hover/os:text-primary shrink-0" />
                                      </a>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-admin-muted">Browser / Client:</span>
                                      <span className="font-semibold text-admin-text">{device.browser || 'Web Browser'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-admin-muted">Platform:</span>
                                      <span className="font-semibold text-admin-text uppercase">{device.platform || 'web'}</span>
                                    </div>
                                    {device.locationDisplay && (
                                      <div className="flex justify-between items-center">
                                        <span className="text-admin-muted">Geolocation:</span>
                                        <a
                                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(device.locationDisplay)}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="font-semibold text-primary hover:underline flex items-center gap-1 text-right"
                                          title="Click to open location on Google Maps"
                                        >
                                          <span>📍 {device.locationDisplay}</span>
                                          <ArrowUpRight className="w-3 h-3 shrink-0" />
                                        </a>
                                      </div>
                                    )}
                                    {(device.networkCarrier || device.networkType) && (
                                      <div className="flex justify-between">
                                        <span className="text-admin-muted">Carrier / Network:</span>
                                        <span className="font-semibold text-emerald-600">
                                          📶 {[device.networkCarrier, device.networkType].filter(Boolean).join(' • ')}
                                        </span>
                                      </div>
                                    )}
                                    {device.userAgent && (
                                      <div className="pt-2 border-t border-admin-border">
                                        <span className="text-[10px] text-admin-muted block mb-1">User Agent Fingerprint:</span>
                                        <p className="font-mono text-[10px] text-admin-muted leading-tight break-all bg-admin-surface-2 p-1.5 rounded">
                                          {device.userAgent}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Right: Raw JSON Metadata */}
                                <div className="space-y-2">
                                  <h4 className="text-[10px] text-admin-muted uppercase tracking-wider font-bold font-outfit">
                                    Audit Metadata Payload
                                  </h4>
                                  <div className="bg-admin-surface border border-admin-border rounded-xl p-3 overflow-x-auto max-h-56 shadow-inner">
                                    <pre className="text-[10.5px] text-admin-text font-mono leading-relaxed">
                                      {JSON.stringify(log.metadata, null, 2)}
                                    </pre>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </TableScrollContainer>
      </div>
    </div>
  );
}
