'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, Info, ChevronDown, ChevronUp, Search, Calendar, RefreshCcw, Activity } from 'lucide-react';
import { api } from '../../lib/api';
import { PageLoader, showToast } from '../ui';
import PageHeaderGradient from './common/PageHeaderGradient';
import TableScrollContainer from './common/TableScrollContainer';

const severityConfig = {
  critical: { icon: ShieldAlert, color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
  warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
};

export default function SystemAuditView() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  // filters
  const [severityFilter, setSeverityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({ limit: 100 });
      if (severityFilter !== 'all') queryParams.append('severity', severityFilter);
      
      const res = await api.get(`/api/audit?${queryParams.toString()}`);
      const logsArray = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setLogs(logsArray); 
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
    <div className="space-y-6 pb-12">
      {/* Header section */}
      <PageHeaderGradient
        title="System Audit Logs"
        subtitle="Immutable ledger of critical system events, payment recovery actions, and API events."
        actions={
          <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
            <div className="relative flex-1 md:w-60">
              <Search className="w-4 h-4 text-admin-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-admin-surface border border-admin-border rounded-xl py-2 pl-9 pr-3.5 text-xs text-admin-text placeholder:text-admin-muted focus:outline-none focus:border-primary transition-all font-medium"
              />
            </div>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-admin-surface border border-admin-border rounded-xl py-2 px-3 text-xs text-admin-text focus:outline-none focus:border-primary transition-all cursor-pointer font-medium"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
            <button 
              onClick={fetchLogs}
              className="p-2 bg-admin-surface hover:bg-admin-surface-2 rounded-xl border border-admin-border transition-colors text-admin-muted hover:text-admin-text"
              title="Refresh Logs"
            >
              <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin text-primary' : ''}`} />
            </button>
          </div>
        }
      />

      {/* Main Table */}
      <div className="bg-admin-surface border border-admin-border rounded-2xl overflow-hidden shadow-sm">
        <TableScrollContainer>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-admin-surface-2/60 border-b border-admin-border text-[11px] uppercase tracking-wider text-admin-muted font-bold font-outfit">
                <th className="p-3.5 w-10"></th>
                <th className="p-3.5">Severity</th>
                <th className="p-3.5">Event</th>
                <th className="p-3.5">Message</th>
                <th className="p-3.5 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border dark:divide-white/[0.08] text-admin-text">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-admin-muted font-medium">
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
                        className={`hover:bg-admin-surface-2/50 transition-colors cursor-pointer group ${isExpanded ? 'bg-admin-surface-2/40' : ''}`}
                      >
                        <td className="p-3.5 text-center">
                          {isExpanded ? 
                            <ChevronUp className="w-4 h-4 text-admin-muted group-hover:text-admin-text transition-colors" /> : 
                            <ChevronDown className="w-4 h-4 text-admin-muted group-hover:text-admin-text transition-colors" />
                          }
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border font-outfit ${config.bg} ${config.color} ${config.border}`}>
                            <Icon className="w-3 h-3" />
                            {log.severity.charAt(0).toUpperCase() + log.severity.slice(1)}
                          </div>
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <span className="font-mono text-[11px] text-admin-text bg-admin-surface-2 border border-admin-border px-2 py-0.5 rounded-md font-semibold">
                            {log.event}
                          </span>
                        </td>
                        <td className="p-3.5 text-xs text-admin-text max-w-md truncate pr-6 opacity-90" title={log.message}>
                          {log.message}
                        </td>
                        <td className="p-3.5 text-right text-[11px] text-admin-muted whitespace-nowrap font-medium">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                      </tr>
                      {/* Expanded View */}
                      {isExpanded && (
                        <tr className="bg-admin-surface-2/30">
                          <td colSpan="5" className="p-0">
                            <div className="p-5 border-b border-admin-border overflow-hidden animate-in slide-in-from-top-2 duration-200">
                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                                <div className="lg:col-span-1 space-y-3">
                                  <div>
                                    <h4 className="text-[10px] text-admin-muted uppercase tracking-wider mb-1 font-bold font-outfit">Detailed Message</h4>
                                    <p className="text-xs text-admin-text leading-relaxed">{log.message}</p>
                                  </div>
                                  <div className="flex gap-4">
                                    <div>
                                      <h4 className="text-[10px] text-admin-muted uppercase tracking-wider mb-1 font-bold font-outfit">Event Type</h4>
                                      <span className="font-mono text-xs text-primary font-bold">{log.event}</span>
                                    </div>
                                    <div>
                                      <h4 className="text-[10px] text-admin-muted uppercase tracking-wider mb-1 font-bold font-outfit">Timestamp</h4>
                                      <span className="text-xs text-admin-text">{new Date(log.timestamp).toLocaleString()}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="lg:col-span-2">
                                  <h4 className="text-[10px] text-admin-muted uppercase tracking-wider mb-1.5 font-bold font-outfit">Raw Metadata JSON</h4>
                                  <div className="bg-admin-surface border border-admin-border rounded-xl p-3.5 overflow-x-auto shadow-inner">
                                    <pre className="text-[11px] text-admin-text font-mono leading-relaxed">
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
