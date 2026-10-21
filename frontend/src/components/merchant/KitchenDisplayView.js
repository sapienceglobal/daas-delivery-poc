import React, { useState, useEffect, useRef } from 'react';
import { 
  Monitor, Expand, Shrink, Clock, CheckCircle, Flame, Bell, BellOff
} from 'lucide-react';
import { api } from '@/lib/api';
import { showToast } from '@/components/ui';

export default function KitchenDisplayView({ orders = [], restaurantId, onUpdateStatus, onRefresh }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const containerRef = useRef(null);
  
  const [newOrdersCount, setNewOrdersCount] = useState(0);

  // simple Web Audio API for "ding" sound
  const playSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.log('Audio playback failed', e);
    }
  };

  useEffect(() => {
    const currentNewCount = orders.filter(o => o.status === 'accepted').length;
    if (currentNewCount > newOrdersCount) {
      playSound();
    }
    setNewOrdersCount(currentNewCount);
  }, [orders]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        showToast('Error attempting to enable fullscreen', 'error');
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const updateOrderStatus = async (orderId, status) => {
    if (onUpdateStatus) {
      await onUpdateStatus(orderId, status);
      return;
    }
    try {
      await api.put(`/api/orders/${orderId}/status`, { status });
      showToast(`Order marked as ${status}`, 'success');
      if (onRefresh) onRefresh();
    } catch (err) {
      showToast('Failed to update status', 'error');
      if (onRefresh) onRefresh();
    }
  };

  const newOrders = orders.filter(o => o.status === 'accepted');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready');

  const renderOrderCard = (order, type) => {
    const elapsedMinutes = Math.floor((new Date() - new Date(order.createdAt)) / 60000);
    const isLate = elapsedMinutes > 15;

    let headerBg = '';
    let textColor = '';
    
    if (type === 'new') {
      headerBg = 'bg-rose-500/10 border-rose-500/20';
      textColor = 'text-rose-500';
    } else if (type === 'preparing') {
      headerBg = 'bg-amber-500/10 border-amber-500/20';
      textColor = 'text-amber-500';
    } else {
      headerBg = 'bg-emerald-500/10 border-emerald-500/20';
      textColor = 'text-emerald-500';
    }

    return (
      <div key={order._id} className={`flex flex-col bg-admin-card rounded-2xl shadow-md border ${isLate && type !== 'ready' ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-admin-border'} overflow-hidden transition-all duration-200 hover:shadow-lg`}>
        <div className={`px-4 py-3 border-b flex justify-between items-center ${headerBg}`}>
          <div>
            <span className={`text-[16px] font-black font-outfit ${textColor}`}>#{order.orderNumber || order._id?.toString().slice(-4) || 'N/A'}</span>
            <span className="text-[12px] font-bold text-admin-text-secondary ml-2 capitalize">{order.type || 'Delivery'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className={`w-4 h-4 ${isLate && type !== 'ready' ? 'text-rose-500' : 'text-admin-text-secondary'}`} />
            <span className={`text-[13px] font-bold ${isLate && type !== 'ready' ? 'text-rose-500' : 'text-admin-text'}`}>{elapsedMinutes}m</span>
          </div>
        </div>

        <div className="p-4 flex-1">
          <div className="text-[14px] font-bold text-admin-text mb-3 pb-2 border-b border-admin-border font-outfit">
            {order.customerName} {order.tableNumber ? `- Table ${order.tableNumber}` : ''}
          </div>
          
          <div className="space-y-3 mb-4">
            {(order.items || []).map((item, idx) => (
              <div key={idx} className="flex justify-between items-start">
                <div className="flex gap-2.5 text-[14px]">
                  <span className="font-bold text-admin-text min-w-[24px]">{item.quantity}x</span>
                  <div className="flex flex-col">
                    <span className="font-semibold text-admin-text">{item.name}</span>
                    {item.selectedSize?.name && (
                      <span className="text-[12px] text-admin-text-secondary font-medium">Size: {item.selectedSize.name}</span>
                    )}
                    {(item.addOns || []).map((addon, i) => (
                      <span key={i} className="text-[12px] text-admin-text-secondary italic">+ {addon.name}</span>
                    ))}
                    {item.specialInstructions && (
                      <span className="text-[12px] font-medium text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-lg mt-1 border border-amber-500/20">
                        Note: {item.specialInstructions}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-3 bg-admin-surface/50 border-t border-admin-border flex gap-2">
          {type === 'new' && (
            <button 
              onClick={() => updateOrderStatus(order._id, 'preparing')}
              className="flex-1 bg-brand hover:opacity-90 text-white py-2.5 rounded-xl font-bold text-[13px] transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Flame className="w-4 h-4" /> Start Prep
            </button>
          )}
          {type === 'preparing' && (
            <button 
              onClick={() => updateOrderStatus(order._id, 'ready')}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl font-bold text-[13px] transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <CheckCircle className="w-4 h-4" /> Mark Ready
            </button>
          )}
          {type === 'ready' && (
            <div className="flex-1 py-2.5 text-center text-[13px] font-bold text-admin-text-secondary">
              Waiting for Pickup...
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} className={`flex flex-col h-full ${isFullscreen ? 'bg-admin-bg fixed inset-0 z-[9999] p-6' : ''}`}>
      {/* Header */}
      <div className={`flex justify-between items-center mb-6 bg-admin-surface p-4 rounded-2xl shadow-sm border border-admin-border ${isFullscreen ? '' : 'mt-0'}`}>
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 bg-brand/10 border border-brand/20 rounded-xl flex items-center justify-center text-brand">
            <Monitor className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-[20px] font-black text-admin-text font-outfit">Live Kitchen Display</h1>
            <p className="text-[12px] text-admin-text-secondary font-medium">Unified Station • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => { playSound(); setSoundEnabled(!soundEnabled); }}
            className={`px-4 py-2.5 rounded-xl font-bold text-[13px] flex items-center gap-2 transition-all border ${soundEnabled ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20' : 'bg-admin-card text-admin-text-secondary border-admin-border hover:bg-admin-surface-hover hover:text-admin-text'}`}
          >
            {soundEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            {soundEnabled ? 'Sound On' : 'Sound Off'}
          </button>
          <button 
            onClick={toggleFullscreen}
            className="px-4 py-2.5 bg-brand hover:opacity-90 text-white rounded-xl font-bold text-[13px] transition-all flex items-center gap-2 shadow-sm"
          >
            {isFullscreen ? <Shrink className="w-4 h-4" /> : <Expand className="w-4 h-4" />}
            {isFullscreen ? 'Exit Fullscreen' : 'Full Screen'}
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
        
        {/* New Column */}
        <div className="flex flex-col bg-admin-surface/60 rounded-2xl p-4 border border-admin-border overflow-hidden backdrop-blur-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[15px] font-black text-admin-text flex items-center gap-2 font-outfit">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
              NEW ({newOrders.length})
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 pb-10 custom-scrollbar">
            {newOrders.map(o => renderOrderCard(o, 'new'))}
            {newOrders.length === 0 && (
              <div className="text-center py-12 text-admin-text-secondary font-medium text-[13px]">No new orders</div>
            )}
          </div>
        </div>

        {/* Preparing Column */}
        <div className="flex flex-col bg-admin-surface/60 rounded-2xl p-4 border border-admin-border overflow-hidden backdrop-blur-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[15px] font-black text-admin-text flex items-center gap-2 font-outfit">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              PREPARING ({preparingOrders.length})
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 pb-10 custom-scrollbar">
            {preparingOrders.map(o => renderOrderCard(o, 'preparing'))}
            {preparingOrders.length === 0 && (
              <div className="text-center py-12 text-admin-text-secondary font-medium text-[13px]">No orders in prep</div>
            )}
          </div>
        </div>

        {/* Ready Column */}
        <div className="flex flex-col bg-admin-surface/60 rounded-2xl p-4 border border-admin-border overflow-hidden backdrop-blur-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[15px] font-black text-admin-text flex items-center gap-2 font-outfit">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              READY ({readyOrders.length})
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 pb-10 custom-scrollbar">
            {readyOrders.map(o => renderOrderCard(o, 'ready'))}
            {readyOrders.length === 0 && (
              <div className="text-center py-12 text-admin-text-secondary font-medium text-[13px]">No ready orders</div>
            )}
          </div>
        </div>

      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #d1d5db;
          border-radius: 10px;
        }
      `}} />
    </div>
  );
}
