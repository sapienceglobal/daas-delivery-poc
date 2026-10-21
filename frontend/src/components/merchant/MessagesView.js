import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle, Search, RefreshCw, AlertCircle, Clock, Trash2, CheckCircle2, MessageSquare, Send } from 'lucide-react';
import { showToast } from '@/components/ui';
import StatCard from './StatCard';
import PageHeaderGradient from './common/PageHeaderGradient';

export default function MessagesView() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchMessages();
  }, [statusFilter]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      let url = '/api/contact/merchant/messages';
      if (statusFilter !== 'all') {
        url += `${url.includes('?') ? '&' : '?'}status=${statusFilter}`;
      }
      
      const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      
      if (data.success) {
        setMessages(data.data);
      } else {
        showToast(data.message || 'Failed to fetch messages', 'error');
      }
    } catch (err) {
      showToast('Error connecting to server', 'error');
    } finally {
      setLoading(false);
    }
  };

  const markAsStatus = async (id, status) => {
    try {
      const res = await fetch(`/api/contact/merchant/messages/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        setMessages(messages.map(m => m._id === id ? { ...m, status } : m));
        showToast(`Message marked as ${status}`, 'success');
      }
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  const handleReply = (message) => {
    const subject = encodeURIComponent(`Re: ${message.subject}`);
    const body = encodeURIComponent(`\n\n--- Original Message ---\nFrom: ${message.name}\n\n${message.message}`);
    window.location.href = `mailto:${message.email}?subject=${subject}&body=${body}`;
    
    if (message.status === 'new') {
      markAsStatus(message._id, 'replied');
    }
  };

  const filteredMessages = messages.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) || 
    m.email.toLowerCase().includes(search.toLowerCase()) ||
    m.subject.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status) => {
    if (status === 'new') return (
      <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold text-[11px] px-2.5 py-0.5 rounded-lg font-outfit uppercase">
        New
      </span>
    );
    if (status === 'replied') return (
      <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold text-[11px] px-2.5 py-0.5 rounded-lg flex items-center gap-1 font-outfit uppercase">
        <CheckCircle2 className="w-3 h-3" /> Replied
      </span>
    );
    if (status === 'read') return (
      <span className="bg-admin-surface-2 text-admin-muted border border-admin-border font-bold text-[11px] px-2.5 py-0.5 rounded-lg font-outfit uppercase">
        Read
      </span>
    );
    return (
      <span className="bg-admin-surface-2 text-admin-muted border border-admin-border font-bold text-[11px] px-2.5 py-0.5 rounded-lg font-outfit uppercase">
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Row */}
      <PageHeaderGradient
        title="Customer Messages"
        subtitle="Manage customer feedback, direct inquiries, and help tickets."
        actions={
          <button 
            onClick={fetchMessages}
            className="flex items-center gap-2 bg-admin-surface border border-admin-border text-admin-text px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-admin-surface-2 transition-colors shadow-sm font-outfit"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Inbox
          </button>
        }
      />

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Messages" 
          value={messages.length.toLocaleString()} 
          icon={Mail} 
          iconColor="text-blue-500" 
          iconBg="bg-blue-500/10 dark:bg-blue-500/20" 
        />
        <StatCard 
          title="New Inquiries" 
          value={messages.filter(m => m.status === 'new').length.toLocaleString()} 
          icon={AlertCircle} 
          iconColor="text-amber-500" 
          iconBg="bg-amber-500/10 dark:bg-amber-500/20" 
        />
        <StatCard 
          title="Replied" 
          value={messages.filter(m => m.status === 'replied').length.toLocaleString()} 
          icon={CheckCircle} 
          iconColor="text-emerald-500" 
          iconBg="bg-emerald-500/10 dark:bg-emerald-500/20" 
        />
        <StatCard 
          title="Archived / Read" 
          value={messages.filter(m => m.status === 'read').length.toLocaleString()} 
          icon={Mail} 
          iconColor="text-admin-muted" 
          iconBg="bg-admin-surface-2" 
        />
      </div>

      {/* Main Content Area */}
      <div className="bg-admin-surface rounded-2xl shadow-sm border border-admin-border flex flex-col overflow-hidden">
        {/* Filter Header */}
        <div className="p-4 border-b border-admin-border flex flex-col sm:flex-row gap-4 justify-between items-center bg-admin-surface-2/60">
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Search messages by name, email or subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-admin-surface border border-admin-border rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-xs text-admin-text transition-all placeholder:text-admin-muted"
            />
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2 bg-admin-surface border border-admin-border rounded-xl text-xs text-admin-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-medium min-w-[150px]"
            >
              <option value="all">All Statuses</option>
              <option value="new">New Inquiries</option>
              <option value="read">Read</option>
              <option value="replied">Replied</option>
            </select>
          </div>
        </div>

        {/* List Area */}
        <div className="overflow-y-auto">
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center text-admin-muted">
              <RefreshCw className="w-8 h-8 animate-spin mb-3 text-primary" />
              <p className="text-xs font-semibold">Loading messages...</p>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-admin-surface-2 rounded-2xl flex items-center justify-center mb-3">
                <Mail className="w-8 h-8 text-admin-muted" />
              </div>
              <h3 className="text-base font-bold text-admin-text font-outfit">No messages found</h3>
              <p className="text-admin-muted text-xs max-w-sm mt-1">We couldn't find any inquiries matching your current search or status filter.</p>
            </div>
          ) : (
            <div className="divide-y divide-admin-border dark:divide-white/[0.08]">
              {filteredMessages.map((msg) => (
                <div 
                  key={msg._id} 
                  className={`p-6 transition-all duration-200 hover:bg-admin-surface-2/50 ${
                    msg.status === 'new' ? 'bg-amber-500/[0.03] border-l-4 border-amber-500' : 'border-l-4 border-transparent'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black shrink-0 font-outfit">
                          {msg.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-admin-text truncate flex items-center gap-2 font-outfit">
                            {msg.name} 
                            {getStatusBadge(msg.status)}
                          </h3>
                          <p className="text-xs text-admin-muted truncate">{msg.email}</p>
                        </div>
                      </div>
                      <div className="ml-13 mt-3">
                        <h4 className="text-sm font-bold text-admin-text mb-1.5 font-outfit">{msg.subject}</h4>
                        <p className="text-xs text-admin-text whitespace-pre-wrap leading-relaxed opacity-90">{msg.message}</p>
                        
                        <div className="flex items-center gap-1.5 mt-3 text-[11px] font-medium text-admin-muted">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(msg.createdAt).toLocaleString('en-US', { 
                            month: 'short', day: 'numeric', year: 'numeric', 
                            hour: 'numeric', minute: '2-digit', hour12: true 
                          })}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-row sm:flex-col gap-2 shrink-0 w-full sm:w-auto ml-13 sm:ml-0 mt-4 sm:mt-0">
                      <button
                        onClick={() => handleReply(msg)}
                        className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-primary to-primary-hover text-white text-xs font-bold rounded-xl hover:shadow-md transition-all flex items-center justify-center gap-1.5 shadow-sm font-outfit"
                      >
                        <Send className="w-3.5 h-3.5" /> Reply
                      </button>
                      
                      {msg.status === 'new' && (
                        <button
                          onClick={() => markAsStatus(msg._id, 'read')}
                          className="flex-1 sm:flex-none px-4 py-2 bg-admin-surface border border-admin-border text-admin-text text-xs font-bold rounded-xl hover:bg-admin-surface-2 transition-colors shadow-sm font-outfit"
                        >
                          Mark as Read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
