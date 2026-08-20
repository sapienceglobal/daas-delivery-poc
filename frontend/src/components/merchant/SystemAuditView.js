'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, Info, ChevronDown, ChevronUp, Search, Calendar, RefreshCcw } from 'lucide-react';
import { api } from '../../lib/api';
import { PageLoader, showToast } from '../ui';

const severityConfig = {
  critical: { icon: ShieldAlert, color: 'text-error', bg: 'bg-error-bg', border: 'border-error/20' },
  warning: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning-bg', border: 'border-warning/20' },
  info: { icon: Info, color: 'text-info', bg: 'bg-info-bg', border: 'border-info/20' },
};

export default function SystemAuditView() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  
  // Filters
  const [severityFilter, setSeverityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({ limit: 100 });
      if (severityFilter !== 'all') queryParams.append('severity', severityFilter);
      
      const res = await api.get(`/api/audit-logs?${queryParams.toString()}`);
      setLogs(res.data || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to load system audit logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [severityFilter]);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const filteredLogs = logs.filter(log => 
    log.event.toLowerCase().includes(searchQuery.toLowerCase()) || 
    log.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && logs.length === 0) return <PageLoader text="Loading Audit Logs..." />;

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[20px] border border-[#e5e7eb] shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-[#111827] tracking-tight flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-error" />
            System Audit Logs
          </h2>
          <p className="text-[#6b7280] mt-1 text-sm max-w-xl">
            Immutable log of critical system events, orphaned payments, and automated recovery actions.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-[#9ca3af] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-xl py-2 pl-10 pr-4 text-sm text-[#111827] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#8b0000] transition-colors"
            />
          </div>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-[#f9fafb] border border-[#e5e7eb] rounded-xl py-2 px-4 text-sm text-[#111827] focus:outline-none focus:border-[#8b0000] transition-colors cursor-pointer"
          >
            <option value="all" className="bg-white text-[#111827]">All Severities</option>
            <option value="critical" className="bg-white text-[#111827]">Critical</option>
            <option value="warning" className="bg-white text-[#111827]">Warning</option>
            <option value="info" className="bg-white text-[#111827]">Info</option>
          </select>
          <button 
            onClick={fetchLogs}
            className="p-2 bg-white hover:bg-[#f9fafb] rounded-xl border border-[#e5e7eb] transition-colors text-[#6b7280] hover:text-[#111827]"
            title="Refresh Logs"
          >
            <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin text-[#111827]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-[#e5e7eb] rounded-[20px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f9fafb] border-b border-[#e5e7eb] text-xs uppercase tracking-wider text-[#6b7280] font-medium">
                <th className="p-4 w-12"></th>
                <th className="p-4">Severity</th>
                <th className="p-4">Event</th>
                <th className="p-4">Message</th>
                <th className="p-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-[#6b7280]">
                    No logs found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  const isExpanded = expandedId === log._id;
                  const config = severityConfig[log.severity] || severityConfig.info;
                  const Icon = config.icon;

                  return (
                    <React.Fragment key={log._id}>
                      <tr 
                        onClick={() => toggleExpand(log._id)}
                        className={`hover:bg-[#f9fafb] transition-colors cursor-pointer group ${isExpanded ? 'bg-[#f9fafb]' : ''}`}
                      >
                        <td className="p-4 text-center">
                          {isExpanded ? 
                            <ChevronUp className="w-4 h-4 text-[#9ca3af] group-hover:text-[#4b5563] transition-colors" /> : 
                            <ChevronDown className="w-4 h-4 text-[#9ca3af] group-hover:text-[#4b5563] transition-colors" />
                          }
                        </td>
                        <td className="p-4">
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${config.bg} ${config.color} ${config.border}`}>
                            <Icon className="w-3.5 h-3.5" />
                            {log.severity.charAt(0).toUpperCase() + log.severity.slice(1)}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="font-mono text-xs text-[#374151] bg-[#f3f4f6] px-2 py-1 rounded">
                            {log.event}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-[#4b5563] max-w-md truncate pr-8" title={log.message}>
                          {log.message}
                        </td>
                        <td className="p-4 text-right text-xs text-[#6b7280] whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                      </tr>
                      {/* Expanded View */}
                      {isExpanded && (
                        <tr className="bg-[#f8fafc]">
                          <td colSpan="5" className="p-0">
                            <div className="p-6 border-b border-[#e5e7eb] overflow-hidden animate-in slide-in-from-top-2 duration-200">
                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-1 space-y-4">
                                  <div>
                                    <h4 className="text-xs text-[#6b7280] uppercase tracking-wider mb-1">Detailed Message</h4>
                                    <p className="text-sm text-[#374151] leading-relaxed">{log.message}</p>
                                  </div>
                                  <div className="flex gap-4">
                                    <div>
                                      <h4 className="text-xs text-[#6b7280] uppercase tracking-wider mb-1">Event Type</h4>
                                      <span className="font-mono text-xs text-info">{log.event}</span>
                                    </div>
                                    <div>
                                      <h4 className="text-xs text-[#6b7280] uppercase tracking-wider mb-1">Time</h4>
                                      <span className="text-sm text-[#374151]">{new Date(log.timestamp).toLocaleString()}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="lg:col-span-2">
                                  <h4 className="text-xs text-[#6b7280] uppercase tracking-wider mb-2">Raw Metadata JSON</h4>
                                  <div className="bg-white border border-[#e5e7eb] rounded-xl p-4 overflow-x-auto shadow-inner">
                                    <pre className="text-xs text-[#374151] font-mono">
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
        </div>
      </div>
    </div>
  );
}
