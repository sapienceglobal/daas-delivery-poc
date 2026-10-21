'use client';

import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, AlertTriangle, Loader2, FastForward } from 'lucide-react';
import { orderAPI } from '@/lib/api';
import { showToast } from '@/components/ui';

export default function DispatchControl({ order, onRefresh, serverTime }) {
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Compute server offset
  const serverOffset = serverTime ? new Date(serverTime).getTime() - Date.now() : 0;

  // 1-second ticker when scheduled
  useEffect(() => {
    if (order?.dispatchStatus !== 'scheduled') return;
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [order?.dispatchStatus]);

  if (!order || order.orderType !== 'delivery') return null;

  const status = order.dispatchStatus;
  if (!status || status === 'not_applicable' || status === 'cancelled') return null;
  if (['delivered', 'picked_up', 'cancelled', 'refunded', 'new', 'pending'].includes(order.status?.toLowerCase())) {
    return null;
  }

  // Calculate remaining seconds
  const currentEstimatedServerTime = now + serverOffset;
  const targetTime = order.dispatchAt ? new Date(order.dispatchAt).getTime() : 0;
  const remainingSeconds = Math.max(0, Math.floor((targetTime - currentEstimatedServerTime) / 1000));
  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  const countdownFormatted = `${mins}:${secs.toString().padStart(2, '0')}`;

  const handleDispatchNow = async () => {
    setShowConfirmModal(false);
    try {
      setLoading(true);
      await orderAPI.dispatchNow(order._id);
      showToast('Rider requested successfully!', 'success');
      if (onRefresh) onRefresh();
    } catch (err) {
      showToast(err?.message || 'Failed to request rider', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePostpone = async (minutes) => {
    try {
      setLoading(true);
      await orderAPI.dispatchPostpone(order._id, minutes);
      showToast(`Rider request delayed by +${minutes} min`, 'info');
      if (onRefresh) onRefresh();
    } catch (err) {
      showToast(err?.message || 'Failed to delay rider request', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 my-2 p-3 rounded-xl bg-admin-card border border-admin-border text-xs">
      {/* Status banner */}
      {status === 'scheduled' && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-1 text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-lg font-semibold">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span>Rider request in <strong className="font-mono text-amber-400 font-bold">{countdownFormatted}</strong></span>
            </span>
            {order.delayMinutesApplied > 0 && (
              <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-bold">
                +{order.delayMinutesApplied}m
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={loading}
              onClick={() => setShowConfirmModal(true)}
              className="flex-1 bg-brand hover:opacity-90 text-white py-2 px-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1 text-[11px] disabled:opacity-50 shadow-sm"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <FastForward className="w-3 h-3" />}
              Request Rider Now
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handlePostpone(5)}
              className="bg-admin-surface border border-admin-border hover:bg-admin-surface-hover text-admin-text py-2 px-2.5 rounded-lg font-bold transition-all text-[11px] disabled:opacity-50"
              title="Add 5 minutes to rider request delay"
            >
              +5m
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handlePostpone(10)}
              className="bg-admin-surface border border-admin-border hover:bg-admin-surface-hover text-admin-text py-2 px-2.5 rounded-lg font-bold transition-all text-[11px] disabled:opacity-50"
              title="Add 10 minutes to rider request delay"
            >
              +10m
            </button>
          </div>
        </div>
      )}

      {status === 'dispatching' && (
        <div className="flex items-center justify-center gap-2 text-blue-400 bg-blue-500/10 border border-blue-500/20 py-2.5 rounded-lg font-semibold">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
          <span>Requesting rider...</span>
        </div>
      )}

      {status === 'dispatched' && (
        <div className="flex items-center justify-between text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-lg font-semibold">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Rider requested</span>
          </span>
          {order.courierName ? (
            <span className="text-[11px] font-bold text-emerald-300 truncate max-w-[120px]">
              {order.courierName}
            </span>
          ) : (
            <span className="text-[10px] text-emerald-400/80">Waiting for driver</span>
          )}
        </div>
      )}

      {status === 'failed' && (
        <div className="flex flex-col gap-1.5 text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg font-semibold">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-rose-400">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Rider request failed</span>
            </span>
            <span className="text-[10px] text-rose-400 font-bold">
              Attempt {order.dispatchAttempts || 1}/3
            </span>
          </div>
          {order.dispatchError && (
            <p className="text-[10px] text-rose-400/80 font-normal truncate" title={order.dispatchError}>
              {order.dispatchError}
            </p>
          )}
          <button
            type="button"
            disabled={loading}
            onClick={handleDispatchNow}
            className="mt-1 w-full bg-rose-600 hover:bg-rose-700 text-white py-1.5 px-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1 text-[11px] disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
            Retry Request Now
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-admin-surface border border-admin-border rounded-2xl max-w-sm w-full p-6 shadow-2xl flex flex-col gap-3">
            <h4 className="text-base font-bold text-admin-text font-outfit">Request Rider Now?</h4>
            <p className="text-xs text-admin-text-secondary leading-relaxed">
              Are you sure you want to request a delivery courier immediately? The remaining delay will be bypassed.
            </p>
            <div className="flex items-center justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-3.5 py-2 rounded-xl border border-admin-border text-admin-text-secondary hover:text-admin-text text-xs font-semibold hover:bg-admin-card transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDispatchNow}
                className="px-4 py-2 rounded-xl bg-brand text-white text-xs font-bold hover:opacity-90 shadow-sm transition-all"
              >
                Request Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
