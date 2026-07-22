'use client';

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
    success: 'border-[#10b981] bg-[#ecfdf5] text-[#047857]',
    error: 'border-[#ef4444] bg-[#fef2f2] text-[#b91c1c]',
    info: 'border-[#3b82f6] bg-[#eff6ff] text-[#1d4ed8]',
    warning: 'border-[#f5a623] bg-[#fffbeb] text-[#b45309]',
  };

  const toast = document.createElement('div');
  toast.id = `toast-${id}`;
  toast.className = `border rounded-xl px-4 py-3 text-[14px] font-bold shadow-lg animate-slide-up ${colors[type] || colors.info}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, duration);
}
