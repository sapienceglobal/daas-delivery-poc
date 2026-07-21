'use client';

/**
 * Reusable UI component library for the Restaurant Commerce Platform.
 * All components use the glassmorphism design system.
 */

import { Loader2, X, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

// ── Button ──────────────────────────────────────────────────────────────────

const BUTTON_VARIANTS = {
  primary: 'bg-gradient-to-r from-brand-green to-brand-cyan text-brand-bg font-bold shadow-lg shadow-brand-green/20 hover:shadow-brand-green/40 hover:brightness-110',
  secondary: 'bg-brand-card border border-brand-border text-brand-text hover:bg-brand-card/80 hover:border-brand-muted/30',
  danger: 'bg-brand-red/10 border border-brand-red/30 text-brand-red hover:bg-brand-red/20',
  ghost: 'text-brand-muted hover:text-brand-text hover:bg-white/5',
  outline: 'border border-brand-border text-brand-text hover:border-brand-cyan/50 hover:text-brand-cyan',
};

const BUTTON_SIZES = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-7 py-3.5 text-base rounded-xl',
};

export function Button({
  children, variant = 'primary', size = 'md', loading = false,
  disabled = false, className = '', icon: Icon, ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 
        ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} 
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.97]'} 
        ${className}`}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : Icon && <Icon className="h-4 w-4" />}
      {children}
    </button>
  );
}

// ── GlassCard ───────────────────────────────────────────────────────────────

export function GlassCard({ children, className = '', hover = false, padding = true, ...props }) {
  return (
    <div
      className={`glass-panel rounded-2xl ${padding ? 'p-6' : ''} ${hover ? 'glass-panel-hover cursor-pointer' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

// ── Input ───────────────────────────────────────────────────────────────────

export function Input({
  label, error, icon: Icon, className = '', ...props
}) {
  return (
    <div className="space-y-1.5">
      {label && <label className="text-sm font-medium text-brand-muted">{label}</label>}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <input
          className={`w-full rounded-xl border border-brand-border bg-brand-card/60 px-4 py-3 text-sm text-brand-text 
            placeholder:text-brand-muted/50 focus:border-brand-cyan/50 focus:outline-none focus:ring-1 focus:ring-brand-cyan/20
            transition-colors duration-200 ${Icon ? 'pl-10' : ''} ${error ? 'border-brand-red/50' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-brand-red">{error}</p>}
    </div>
  );
}

// ── Badge ───────────────────────────────────────────────────────────────────

const BADGE_COLORS = {
  green: 'bg-brand-green/10 text-brand-green border-brand-green/20',
  cyan: 'bg-brand-cyan/10 text-brand-cyan border-brand-cyan/20',
  blue: 'bg-brand-blue/10 text-brand-blue border-brand-blue/20',
  yellow: 'bg-brand-yellow/10 text-brand-yellow border-brand-yellow/20',
  red: 'bg-brand-red/10 text-brand-red border-brand-red/20',
  muted: 'bg-white/5 text-brand-muted border-white/10',
};

export function Badge({ children, color = 'cyan', dot = false, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${BADGE_COLORS[color]} ${className}`}>
      {dot && <span className={`h-1.5 w-1.5 rounded-full bg-current ${color === 'green' ? 'animate-pulse' : ''}`} />}
      {children}
    </span>
  );
}

// ── Modal ───────────────────────────────────────────────────────────────────

export function Modal({ isOpen, onClose, title, children, size = 'md', className = '' }) {
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl', full: 'max-w-6xl' };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-transparent" onClick={onClose} />
      <div className={`relative z-10 w-full ${sizes[size]} glass-panel rounded-2xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto shadow-[0_0_40px_rgba(0,0,0,0.15)] border-2 border-[#eadfdb] ring-4 ring-[#eadfdb]/30 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          {title && <h3 className="text-lg font-bold text-brand-text">{title}</h3>}
          <button
            onClick={onClose}
            className="ml-auto rounded-lg p-1.5 text-brand-muted hover:text-brand-text hover:bg-white/5 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Toast Notification ──────────────────────────────────────────────────────

let toastContainer = null;
let toastId = 0;

function getToastContainer() {
  if (typeof document === 'undefined') return null;
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'fixed top-4 right-4 z-[9999] flex flex-col gap-2';
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

export function showToast(message, type = 'info', duration = 4000) {
  const container = getToastContainer();
  if (!container) return;

  const id = ++toastId;
  const colors = {
    success: 'border-brand-green/40 bg-brand-green/10 text-brand-green',
    error: 'border-brand-red/40 bg-brand-red/10 text-brand-red',
    info: 'border-brand-cyan/40 bg-brand-cyan/10 text-brand-cyan',
    warning: 'border-brand-yellow/40 bg-brand-yellow/10 text-brand-yellow',
  };

  const toast = document.createElement('div');
  toast.id = `toast-${id}`;
  toast.className = `glass-panel border rounded-xl px-4 py-3 text-sm font-medium animate-slide-up ${colors[type] || colors.info}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ── Loading Skeleton ────────────────────────────────────────────────────────

export function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-brand-card/80 ${className}`}
      {...props}
    />
  );
}

export function RestaurantSkeleton() {
  return (
    <div className="glass-panel rounded-2xl overflow-hidden">
      <Skeleton className="h-40 rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// ── Empty State ─────────────────────────────────────────────────────────────

export function EmptyState({ icon: Icon, title, description, action, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 text-center ${className}`}>
      {Icon && (
        <div className="mb-4 rounded-2xl bg-brand-card p-4 border border-brand-border">
          <Icon className="h-8 w-8 text-brand-muted" />
        </div>
      )}
      <h3 className="text-lg font-bold text-brand-text mb-1">{title}</h3>
      {description && <p className="text-sm text-brand-muted max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ── Stat Card ───────────────────────────────────────────────────────────────

export function StatCard({ label, value, icon: Icon, color = 'cyan', trend, className = '' }) {
  const colorMap = {
    green: 'text-brand-green bg-brand-green/10',
    cyan: 'text-brand-cyan bg-brand-cyan/10',
    blue: 'text-brand-blue bg-brand-blue/10',
    yellow: 'text-brand-yellow bg-brand-yellow/10',
    red: 'text-brand-red bg-brand-red/10',
  };

  return (
    <GlassCard className={`flex items-start justify-between ${className}`}>
      <div>
        <p className="text-xs font-medium text-brand-muted uppercase tracking-wider">{label}</p>
        <p className="mt-1 text-2xl font-black text-brand-text">{value}</p>
        {trend !== undefined && (
          <p className={`mt-1 text-xs font-semibold ${trend >= 0 ? 'text-brand-green' : 'text-brand-red'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last period
          </p>
        )}
      </div>
      {Icon && (
        <div className={`rounded-xl p-3 ${colorMap[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      )}
    </GlassCard>
  );
}

// ── Tabs ────────────────────────────────────────────────────────────────────

export function Tabs({ tabs, activeTab, onChange, className = '' }) {
  return (
    <div className={`flex gap-1 rounded-xl bg-brand-card/50 p-1 border border-brand-border ${className}`}>
      {tabs.map(tab => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200
            ${activeTab === tab.value
              ? 'bg-gradient-to-r from-brand-green to-brand-cyan text-brand-bg shadow-lg'
              : 'text-brand-muted hover:text-brand-text hover:bg-white/5'
            }`}
        >
          {tab.icon && <tab.icon className="inline-block h-4 w-4 mr-1.5" />}
          {tab.label}
          {tab.count !== undefined && (
            <span className="ml-1.5 text-xs opacity-70">({tab.count})</span>
          )}
        </button>
      ))}
    </div>
  );
}

// ── Search Input ────────────────────────────────────────────────────────────

import { Search } from 'lucide-react';

export function SearchInput({ value, onChange, placeholder = 'Search...', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-muted" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-brand-border bg-brand-card/60 pl-10 pr-4 py-2.5 text-sm text-brand-text
          placeholder:text-brand-muted/50 focus:border-brand-cyan/50 focus:outline-none focus:ring-1 focus:ring-brand-cyan/20 transition-colors"
      />
    </div>
  );
}

// ── Star Rating ─────────────────────────────────────────────────────────────

import { Star } from 'lucide-react';

export function StarRating({ rating = 0, maxStars = 5, size = 'md', interactive = false, onChange }) {
  const [hoverRating, setHoverRating] = useState(0);
  const sizeMap = { sm: 'h-3 w-3', md: 'h-4 w-4', lg: 'h-5 w-5' };

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxStars }, (_, i) => {
        const starValue = i + 1;
        const filled = starValue <= (hoverRating || rating);

        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(starValue)}
            onMouseEnter={() => interactive && setHoverRating(starValue)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
          >
            <Star
              className={`${sizeMap[size]} ${filled ? 'fill-brand-yellow text-brand-yellow' : 'text-brand-muted/30'} transition-colors`}
            />
          </button>
        );
      })}
    </div>
  );
}

// ── Order Status Badge ──────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'yellow' },
  accepted: { label: 'Accepted', color: 'blue' },
  preparing: { label: 'Preparing', color: 'cyan' },
  ready: { label: 'Ready', color: 'green' },
  picked_up: { label: 'Picked Up', color: 'blue' },
  delivered: { label: 'Delivered', color: 'green' },
  cancelled: { label: 'Cancelled', color: 'red' },
  failed: { label: 'Failed', color: 'red' },
};

export function OrderStatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { label: status, color: 'muted' };
  return <Badge color={config.color} dot>{config.label}</Badge>;
}

// ── Confirm Dialog ──────────────────────────────────────────────────────────

export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', variant = 'danger' }) {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-brand-muted mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
        <Button variant={variant} size="sm" onClick={() => { onConfirm(); onClose(); }}>{confirmText}</Button>
      </div>
    </Modal>
  );
}
