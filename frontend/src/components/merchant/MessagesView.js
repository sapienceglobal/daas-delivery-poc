import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle, Search, RefreshCw, AlertCircle, Clock, Trash2, CheckCircle2 } from 'lucide-react';
import { showToast } from '@/components/ui';
import StatCard from './StatCard';

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
    if (status === 'new') return <span className="bg-[#fff7ed] text-[#ea580c] font-bold text-xs px-2 py-1 rounded">New</span>;
    if (status === 'replied') return <span className="bg-[#ecfdf5] text-[#10B981] font-bold text-xs px-2 py-1 rounded flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Replied</span>;
    if (status === 'read') return <span className="bg-[#f3f4f6] text-[#4b5563] font-bold text-xs px-2 py-1 rounded">Read</span>;
    return <span className="bg-gray-100 text-gray-600 font-bold text-xs px-2 py-1 rounded">{status}</span>;
  };

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] relative text-[#1f2937]">
      {/* Top Header Row */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Customer Messages</h1>
          <p className="text-sm text-[#6b7280] mt-1">Manage support tickets and customer inquiries.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchMessages}
            className="bg-white border border-[#e5e7eb] rounded-lg px-4 py-2 text-sm text-[#374151] font-bold flex items-center gap-2 hover:bg-[#f9fafb]"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 shrink-0">
        <StatCard 
          title="Total Messages" 
          value={messages.length.toLocaleString()} 
          icon={Mail} 
          iconColor="text-[#3b82f6]" 
          iconBg="bg-[#eff6ff]" 
        />
        <StatCard 
          title="New Messages" 
          value={messages.filter(m => m.status === 'new').length.toLocaleString()} 
          icon={AlertCircle} 
          iconColor="text-[#ea580c]" 
          iconBg="bg-[#fff7ed]" 
        />
        <StatCard 
          title="Replied" 
          value={messages.filter(m => m.status === 'replied').length.toLocaleString()} 
          icon={CheckCircle} 
          iconColor="text-[#10B981]" 
          iconBg="bg-[#ecfdf5]" 
        />
        <StatCard 
          title="Read" 
          value={messages.filter(m => m.status === 'read').length.toLocaleString()} 
          icon={Mail} 
          iconColor="text-[#6b7280]" 
          iconBg="bg-[#f3f4f6]" 
        />
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-xl shadow-sm border border-[#e5e7eb] flex flex-col flex-1 min-h-0">
        {/* Filter Header */}
        <div className="p-4 border-b border-[#e5e7eb] flex flex-col sm:flex-row gap-4 justify-between items-center bg-[#f9fafb] rounded-t-xl shrink-0">
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search messages by name, email or subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full !pl-10 pr-4 py-2 bg-white border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B0000]/20 focus:border-[#8B0000] text-sm text-[#1f2937]"
            />
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-[#e5e7eb] rounded-lg text-sm text-[#1f2937] focus:outline-none focus:ring-2 focus:ring-[#8B0000]/20 font-medium min-w-[150px]"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="read">Read</option>
              <option value="replied">Replied</option>
            </select>
          </div>
        </div>

        {/* List Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center text-[#6b7280]">
              <RefreshCw className="w-8 h-8 animate-spin mb-4 text-[#d1d5db]" />
              <p>Loading messages...</p>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-[#f3f4f6] rounded-full flex items-center justify-center mb-4">
                <Mail className="w-8 h-8 text-[#9ca3af]" />
              </div>
              <h3 className="text-lg font-bold text-[#111827]">No messages found</h3>
              <p className="text-[#6b7280] max-w-sm mt-1">We couldn't find any messages matching your current filters.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#e5e7eb]">
              {filteredMessages.map((msg) => (
                <div key={msg._id} className={`p-6 transition-all duration-200 hover:bg-[#f9fafb] ${msg.status === 'new' ? 'bg-[#fff7ed]/30 border-l-4 border-[#ea580c]' : 'border-l-4 border-transparent'}`}>
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-[#8B0000]/10 flex items-center justify-center text-[#8B0000] font-bold shrink-0">
                          {msg.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-[#111827] truncate flex items-center gap-2">
                            {msg.name} 
                            {getStatusBadge(msg.status)}
                          </h3>
                          <p className="text-xs text-[#6b7280] truncate">{msg.email}</p>
                        </div>
                      </div>
                      <div className="ml-13 mt-3">
                        <h4 className="text-base font-bold text-[#111827] mb-2">{msg.subject}</h4>
                        <p className="text-sm text-[#4b5563] whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                        
                        <div className="flex items-center gap-2 mt-4 text-xs font-medium text-[#9ca3af]">
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
                        className="flex-1 sm:flex-none px-4 py-2.5 bg-[#111827] text-white text-sm font-bold rounded-lg hover:bg-black transition-colors flex items-center justify-center gap-2 shadow-sm"
                      >
                        <Mail className="w-4 h-4" /> Reply
                      </button>
                      
                      {msg.status === 'new' && (
                        <button
                          onClick={() => markAsStatus(msg._id, 'read')}
                          className="flex-1 sm:flex-none px-4 py-2.5 bg-white border border-[#e5e7eb] text-[#374151] text-sm font-bold rounded-lg hover:bg-[#f9fafb] transition-colors shadow-sm"
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
