import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, X, Info } from 'lucide-react';

export default function ConfirmModal({ 
  isOpen, 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel', 
  onConfirm, 
  onClose, 
  isDestructive = true,
  icon = 'trash' // 'trash', 'alert', or 'info'
}) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const IconComponent = icon === 'trash' ? Trash2 : icon === 'alert' ? AlertTriangle : Info;
  const iconBgColor = isDestructive ? 'bg-[#fef2f2] text-[#dc2626]' : 'bg-[#e0f2fe] text-[#0284c7]';
  const confirmBtnClass = isDestructive 
    ? 'bg-[#dc2626] hover:bg-[#b91c1c] focus:ring-[#fca5a5]' 
    : 'bg-[#8B0000] hover:bg-[#7f1d1d] focus:ring-[#fca5a5]';
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#111827]/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex justify-end">
            <button 
              onClick={onClose}
              className="text-[#9ca3af] hover:text-[#4b5563] hover:bg-[#f3f4f6] p-1.5 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex flex-col items-center text-center mt-2">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${iconBgColor}`}>
              <IconComponent className="w-8 h-8" />
            </div>
            
            <h3 className="text-xl font-black text-[#111827] mb-2">{title}</h3>
            <p className="text-[#6b7280] text-sm leading-relaxed mb-8">{message}</p>
            
            <div className="flex w-full gap-3">
              <button 
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-white border-2 border-[#e5e7eb] text-[#4b5563] rounded-xl font-bold hover:bg-[#f9fafb] hover:border-[#d1d5db] hover:text-[#111827] transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#d1d5db]"
              >
                {cancelText}
              </button>
              <button 
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`flex-1 py-3 px-4 text-white rounded-xl font-bold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${confirmBtnClass}`}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
