'use client';

import { useState } from 'react';
import { CreditCard, Plus, Trash2, Loader2, Star } from 'lucide-react';
import { authAPI } from '@/lib/api';
import { showToast, ConfirmDialog } from '@/components/ui';
import PaymentModal from './PaymentModal';

export default function PaymentsTab({ user, updateUser }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingId, setLoadingId] = useState(null);
  const [confirmData, setConfirmData] = useState({ isOpen: false });

  const cards = user?.savedCards || [];

  const handleAdd = () => {
    setModalOpen(true);
  };

  const handleDelete = (id) => {
    setConfirmData({
      isOpen: true,
      title: 'Delete Payment Method',
      message: 'Are you sure you want to delete this payment method?',
      confirmText: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        setLoadingId(id);
        try {
          const res = await authAPI.removeCard(id);
          updateUser({ ...user, savedCards: res.data });
          showToast('Card deleted', 'success');
        } catch (err) {
          showToast(err.message || 'Failed to delete card', 'error');
        } finally {
          setLoadingId(null);
        }
      }
    });
  };

  const handleSetDefault = async (id) => {
    setLoadingId(`default-${id}`);
    try {
      const res = await authAPI.setDefaultCard(id);
      updateUser({ ...user, savedCards: res.data });
      showToast('Default card updated', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update default card', 'error');
    } finally {
      setLoadingId(null);
    }
  };

  const refreshUser = async () => {
    try {
      const res = await authAPI.getMe();
      updateUser(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const getBrandIcon = (brand) => {
    // For now, return generic CreditCard for all. Could map to SVG logos.
    return <CreditCard className="h-6 w-6 text-[#1a1a1a]" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[24px] font-black text-[#1a1a1a]">Payment Methods</h2>
          <p className="text-[14px] text-[#6b7280]">Manage your saved cards for faster checkout</p>
        </div>
        <button
          onClick={handleAdd}
          className="h-11 px-6 py-2 rounded-lg bg-[#7a0b10] text-white text-[13px] font-black uppercase tracking-wider hover:bg-[#680307] transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add New Card
        </button>
      </div>

      {cards.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#eadfdb] p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-[#fdf2f2] flex items-center justify-center mx-auto mb-4">
            <CreditCard className="h-8 w-8 text-[#ef4444]" />
          </div>
          <h3 className="text-[18px] font-bold text-[#1a1a1a] mb-2">No payment methods saved</h3>
          <p className="text-[14px] text-[#6b7280]">Add a card to quickly pay for your next order.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {cards.map((card) => (
            <div 
              key={card._id}
              className={`bg-white rounded-2xl p-6 border shadow-sm transition-colors relative ${
                card.isDefault ? 'border-[#7a0b10] ring-1 ring-[#7a0b10]' : 'border-[#eadfdb] hover:border-[#b47b80]'
              }`}
            >
              {card.isDefault && (
                <div className="absolute top-0 right-0 bg-[#7a0b10] text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg rounded-tr-xl flex items-center gap-1">
                  <Star className="h-3 w-3 fill-current" /> Default
                </div>
              )}
              
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-8 rounded bg-[#f4f7f9] border border-[#eadfdb] flex items-center justify-center">
                    {getBrandIcon(card.brand)}
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-[#1a1a1a]">{card.title || 'Personal Card'}</h3>
                    <p className="text-[14px] text-[#6b7280] capitalize mt-0.5">{card.brand} •••• {card.last4}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider">Expires</p>
                  <p className="text-[14px] font-bold text-[#1a1a1a] font-mono mt-0.5">
                    {card.expMonth.toString().padStart(2, '0')}/{card.expYear.toString().slice(-2)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-[#eadfdb]">
                <button
                  onClick={() => handleDelete(card._id)}
                  disabled={loadingId === card._id}
                  className="flex items-center gap-1.5 text-[13px] font-bold text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                >
                  {loadingId === card._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  Delete
                </button>
                
                {!card.isDefault && (
                  <>
                    <div className="w-px h-4 bg-[#eadfdb]" />
                    <button
                      onClick={() => handleSetDefault(card._id)}
                      disabled={loadingId === `default-${card._id}`}
                      className="text-[13px] font-bold text-[#0ea5e9] hover:text-[#0284c7] transition-colors disabled:opacity-50"
                    >
                      {loadingId === `default-${card._id}` ? 'Setting...' : 'Set as default'}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <PaymentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={refreshUser}
      />

      <ConfirmDialog 
        isOpen={confirmData.isOpen}
        onClose={() => setConfirmData({ ...confirmData, isOpen: false })}
        onConfirm={confirmData.onConfirm}
        title={confirmData.title}
        message={confirmData.message}
        confirmText={confirmData.confirmText}
        variant={confirmData.variant}
      />
    </div>
  );
}
