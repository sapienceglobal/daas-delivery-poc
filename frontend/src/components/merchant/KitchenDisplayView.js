import React, { useState, useEffect, useRef } from 'react';
import { 
  Monitor, Expand, Shrink, Clock, CheckCircle, Flame, Bell, BellOff
} from 'lucide-react';
import { api } from '@/lib/api';
import { showToast } from '@/components/ui';

export default function KitchenDisplayView({ orders = [], restaurantId }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const containerRef = useRef(null);
  
  const [newOrdersCount, setNewOrdersCount] = useState(0);

  // Simple Web Audio API for "ding" sound
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
    try {
      await api.put(`/api/orders/${orderId}/status`, { status });
      showToast(`Order marked as ${status}`, 'success');
    } catch (err) {
      showToast('Failed to update status', 'error');
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
      headerBg = 'bg-[#fef2f2] border-[#fecaca]';
      textColor = 'text-[#dc2626]';
    } else if (type === 'preparing') {
      headerBg = 'bg-[#fff7ed] border-[#fed7aa]';
      textColor = 'text-[#ea580c]';
    } else {
      headerBg = 'bg-[#f0fdf4] border-[#bbf7d0]';
      textColor = 'text-[#16a34a]';
    }

    return (
      <div key={order._id} className={`flex flex-col bg-white rounded-xl shadow-sm border ${isLate && type !== 'ready' ? 'border-[#f87171] ring-2 ring-[#fee2e2]' : 'border-[#e5e7eb]'} overflow-hidden`}>
        <div className={`px-4 py-3 border-b flex justify-between items-center ${headerBg}`}>
          <div>
            <span className={`text-[16px] font-black ${textColor}`}>#{order.orderNumber || order._id.toString().slice(-4)}</span>
            <span className="text-[12px] font-bold text-[#4b5563] ml-2 capitalize">{order.type || 'Delivery'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className={`w-4 h-4 ${isLate && type !== 'ready' ? 'text-[#dc2626]' : 'text-[#6b7280]'}`} />
            <span className={`text-[14px] font-bold ${isLate && type !== 'ready' ? 'text-[#dc2626]' : 'text-[#374151]'}`}>{elapsedMinutes}m</span>
          </div>
        </div>

        <div className="p-4 flex-1">
          <div className="text-[14px] font-bold text-[#111827] mb-3 pb-2 border-b border-[#f3f4f6]">
            {order.customerName} {order.tableNumber ? `- Table ${order.tableNumber}` : ''}
          </div>
          
          <div className="space-y-3 mb-4">
            {(order.items || []).map((item, idx) => (
              <div key={idx} className="flex justify-between items-start">
                <div className="flex gap-2 text-[14px]">
                  <span className="font-bold text-[#111827]">{item.quantity}x</span>
                  <div className="flex flex-col">
                    <span className="font-semibold text-[#1f2937]">{item.name}</span>
                    {item.selectedSize?.name && (
                      <span className="text-[12px] text-[#6b7280] font-bold">Size: {item.selectedSize.name}</span>
                    )}
                    {(item.addOns || []).map((addon, i) => (
                      <span key={i} className="text-[12px] text-[#6b7280] italic">+ {addon.name}</span>
                    ))}
                    {item.specialInstructions && (
                      <span className="text-[12px] font-medium text-[#d97706] bg-[#fffbeb] px-1 py-0.5 rounded mt-1 border border-[#fef3c7]">
                        Note: {item.specialInstructions}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-3 bg-[#f9fafb] border-t border-[#f3f4f6] flex gap-2">
          {type === 'new' && (
            <button 
              onClick={() => updateOrderStatus(order._id, 'preparing')}
              className="flex-1 bg-[#111827] text-white py-3 rounded-lg font-bold text-[14px] hover:bg-[#1f2937] transition-colors flex items-center justify-center gap-2"
            >
              <Flame className="w-4 h-4" /> Start Prep
            </button>
          )}
          {type === 'preparing' && (
            <button 
              onClick={() => updateOrderStatus(order._id, 'ready')}
              className="flex-1 bg-[#16a34a] text-white py-3 rounded-lg font-bold text-[14px] hover:bg-[#15803d] transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" /> Mark Ready
            </button>
          )}
          {type === 'ready' && (
            <div className="flex-1 py-3 text-center text-[14px] font-bold text-[#6b7280]">
              Waiting for Pickup...
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} className={`flex flex-col h-full ${isFullscreen ? 'bg-[#f3f4f6] fixed inset-0 z-[9999] p-4' : ''}`}>
      {/* Header */}
      <div className={`flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-[#e5e7eb] ${isFullscreen ? '' : 'mt-0'}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#111827] rounded-lg flex items-center justify-center text-white">
            <Monitor className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-[20px] font-black text-[#111827]">Live Kitchen Display</h1>
            <p className="text-[12px] text-[#6b7280] font-medium">Unified Station • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => { playSound(); setSoundEnabled(!soundEnabled); }}
            className={`px-4 py-2 rounded-lg font-bold text-[13px] flex items-center gap-2 transition-colors border ${soundEnabled ? 'bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe] hover:bg-[#dbeafe]' : 'bg-[#f3f4f6] text-[#6b7280] border-[#e5e7eb] hover:bg-[#e5e7eb]'}`}
          >
            {soundEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            {soundEnabled ? 'Sound On' : 'Sound Off'}
          </button>
          <button 
            onClick={toggleFullscreen}
            className="px-4 py-2 bg-[#111827] text-white rounded-lg font-bold text-[13px] hover:bg-[#1f2937] transition-colors flex items-center gap-2"
          >
            {isFullscreen ? <Shrink className="w-4 h-4" /> : <Expand className="w-4 h-4" />}
            {isFullscreen ? 'Exit Fullscreen' : 'Full Screen'}
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
        
        {/* New Column */}
        <div className="flex flex-col bg-[#f9fafb] rounded-2xl p-4 border border-[#e5e7eb] overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[16px] font-black text-[#1f2937] flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#ef4444]"></span>
              NEW ({newOrders.length})
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 pb-10 custom-scrollbar">
            {newOrders.map(o => renderOrderCard(o, 'new'))}
            {newOrders.length === 0 && (
              <div className="text-center py-10 text-[#9ca3af] font-bold text-[13px]">No new orders</div>
            )}
          </div>
        </div>

        {/* Preparing Column */}
        <div className="flex flex-col bg-[#f9fafb] rounded-2xl p-4 border border-[#e5e7eb] overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[16px] font-black text-[#1f2937] flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#f97316]"></span>
              PREPARING ({preparingOrders.length})
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 pb-10 custom-scrollbar">
            {preparingOrders.map(o => renderOrderCard(o, 'preparing'))}
            {preparingOrders.length === 0 && (
              <div className="text-center py-10 text-[#9ca3af] font-bold text-[13px]">No orders in prep</div>
            )}
          </div>
        </div>

        {/* Ready Column */}
        <div className="flex flex-col bg-[#f9fafb] rounded-2xl p-4 border border-[#e5e7eb] overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[16px] font-black text-[#1f2937] flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#22c55e]"></span>
              READY ({readyOrders.length})
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 pb-10 custom-scrollbar">
            {readyOrders.map(o => renderOrderCard(o, 'ready'))}
            {readyOrders.length === 0 && (
              <div className="text-center py-10 text-[#9ca3af] font-bold text-[13px]">No ready orders</div>
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
