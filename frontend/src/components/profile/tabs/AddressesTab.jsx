'use client';

import { useState } from 'react';
import { MapPin, Plus, Trash2, Edit2, Loader2, Star } from 'lucide-react';
import { authAPI } from '@/lib/api';
import { showToast } from '@/components/ui';
import ProfileAddressModal from './ProfileAddressModal';

export default function AddressesTab({ user, updateUser }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [addressToEdit, setAddressToEdit] = useState(null);
  const [loadingId, setLoadingId] = useState(null);

  const addresses = user?.savedAddresses || [];

  const handleAdd = () => {
    setAddressToEdit(null);
    setModalOpen(true);
  };

  const handleEdit = (addr) => {
    setAddressToEdit(addr);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    setLoadingId(id);
    try {
      const res = await authAPI.removeAddress(id);
      updateUser({ ...user, savedAddresses: res.data });
      showToast('Address deleted', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to delete address', 'error');
    } finally {
      setLoadingId(null);
    }
  };

  const handleSetDefault = async (id) => {
    setLoadingId(`default-${id}`);
    try {
      const res = await authAPI.setDefaultAddress(id);
      updateUser({ ...user, savedAddresses: res.data });
      showToast('Default address updated', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update default address', 'error');
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[24px] font-black text-[#1a1a1a]">Saved Addresses</h2>
          <p className="text-[14px] text-[#6b7280]">Manage your delivery locations</p>
        </div>
        <button
          onClick={handleAdd}
          className="h-11 px-4 py-2 rounded-lg bg-[#7a0b10] text-white text-[13px] font-black uppercase tracking-wider hover:bg-[#680307] transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add New Address
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#eadfdb] p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-[#f4f7f9] flex items-center justify-center mx-auto mb-4">
            <MapPin className="h-8 w-8 text-[#9ca3af]" />
          </div>
          <h3 className="text-[18px] font-bold text-[#1a1a1a] mb-2">No addresses saved</h3>
          <p className="text-[14px] text-[#6b7280]">Add an address to checkout faster next time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {addresses.map((addr) => (
            <div 
              key={addr._id}
              className={`bg-white rounded-2xl p-6 border shadow-sm transition-colors relative ${
                addr.isDefault ? 'border-[#7a0b10] ring-1 ring-[#7a0b10]' : 'border-[#eadfdb] hover:border-[#b47b80]'
              }`}
            >
              {addr.isDefault && (
                <div className="absolute top-0 right-0 bg-[#7a0b10] text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg rounded-tr-xl flex items-center gap-1">
                  <Star className="h-3 w-3 fill-current" /> Default
                </div>
              )}
              
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#fcf3e3] flex items-center justify-center shrink-0">
                  <MapPin className="h-5 w-5 text-[#f5a623]" />
                </div>
                <div className="pr-12">
                  <h3 className="text-[15px] font-bold text-[#1a1a1a]">{addr.label}</h3>
                  <p className="text-[14px] text-[#6b7280] mt-1 leading-relaxed">{addr.address}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-[#eadfdb]">
                <button
                  onClick={() => handleEdit(addr)}
                  className="flex items-center gap-1.5 text-[13px] font-bold text-[#4b5563] hover:text-[#1a1a1a] transition-colors"
                >
                  <Edit2 className="h-3.5 w-3.5" /> Edit
                </button>
                <div className="w-px h-4 bg-[#eadfdb]" />
                <button
                  onClick={() => handleDelete(addr._id)}
                  disabled={loadingId === addr._id}
                  className="flex items-center gap-1.5 text-[13px] font-bold text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                >
                  {loadingId === addr._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  Delete
                </button>
                
                {!addr.isDefault && (
                  <>
                    <div className="w-px h-4 bg-[#eadfdb]" />
                    <button
                      onClick={() => handleSetDefault(addr._id)}
                      disabled={loadingId === `default-${addr._id}`}
                      className="text-[13px] font-bold text-[#0ea5e9] hover:text-[#0284c7] transition-colors disabled:opacity-50"
                    >
                      {loadingId === `default-${addr._id}` ? 'Setting...' : 'Set as default'}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ProfileAddressModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        addressToEdit={addressToEdit}
        onSuccess={refreshUser}
      />
    </div>
  );
}
