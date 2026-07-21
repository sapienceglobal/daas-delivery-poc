'use client';

import { useState } from 'react';
import { Save, Loader2, Key } from 'lucide-react';
import { authAPI } from '@/lib/api';
import { showToast } from '@/components/ui';

export default function MyProfileTab({ user, updateUser }) {
  const [loading, setLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });

  const [pwData, setPwData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.updateProfile(formData);
      updateUser(res.data);
      showToast('Profile updated successfully', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwData.newPassword !== pwData.confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }
    setPwLoading(true);
    try {
      await authAPI.changePassword({
        currentPassword: pwData.currentPassword,
        newPassword: pwData.newPassword
      });
      showToast('Password changed successfully', 'success');
      setPwData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showToast(err.message || 'Failed to change password', 'error');
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Basic Info */}
      <div className="bg-white rounded-2xl border border-[#eadfdb] shadow-sm p-6 md:p-8">
        <h3 className="text-[20px] font-black text-[#1a1a1a] mb-6">Personal Information</h3>
        <form onSubmit={handleProfileUpdate} className="space-y-5 max-w-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[12px] font-bold text-[#4b5563] mb-1">Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full h-11 px-3 py-1  rounded-lg border border-[#eadfdb] focus:border-[#7a0b10] focus:ring-1 focus:ring-[#7a0b10] text-[14px] bg-[#f9f9f9] outline-none"
              />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-[#4b5563] mb-1">Email Address</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full h-11 px-3 py-1  rounded-lg border border-[#eadfdb] text-[14px] bg-gray-100 text-gray-500 outline-none cursor-not-allowed"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[12px] font-bold text-[#4b5563] mb-1">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full h-11 px-3 py-1  rounded-lg border border-[#eadfdb] focus:border-[#7a0b10] focus:ring-1 focus:ring-[#7a0b10] text-[14px] bg-[#f9f9f9] outline-none"
              />
            </div>
          </div>
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="h-11 px-6 py-2 rounded-lg bg-[#7a0b10] text-white text-[13px] font-black uppercase tracking-wider hover:bg-[#680307] transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>

      {/* Security */}
      <div className="bg-white rounded-2xl border border-[#eadfdb] shadow-sm p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-[#fdf2f2] flex items-center justify-center shrink-0">
            <Key className="h-5 w-5 text-[#ef4444]" />
          </div>
          <div>
            <h3 className="text-[20px] font-black text-[#1a1a1a] leading-none">Security</h3>
            <p className="text-[12px] text-[#6b7280] mt-1">Change your password to secure your account</p>
          </div>
        </div>
        
        <form onSubmit={handlePasswordChange} className="space-y-5 max-w-2xl">
          <div>
            <label className="block text-[12px] font-bold text-[#4b5563] mb-1">Current Password</label>
            <input
              type="password"
              required
              value={pwData.currentPassword}
              onChange={(e) => setPwData({ ...pwData, currentPassword: e.target.value })}
              className="w-full h-11 px-3 py-1 rounded-lg border border-[#eadfdb] focus:border-[#7a0b10] focus:ring-1 focus:ring-[#7a0b10] text-[14px] bg-[#f9f9f9] outline-none"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[12px] font-bold text-[#4b5563] mb-1">New Password</label>
              <input
                type="password"
                required
                value={pwData.newPassword}
                onChange={(e) => setPwData({ ...pwData, newPassword: e.target.value })}
                className="w-full h-11 px-3 py-1  rounded-lg border border-[#eadfdb] focus:border-[#7a0b10] focus:ring-1 focus:ring-[#7a0b10] text-[14px] bg-[#f9f9f9] outline-none"
              />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-[#4b5563] mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={pwData.confirmPassword}
                onChange={(e) => setPwData({ ...pwData, confirmPassword: e.target.value })}
                className="w-full h-11 px-3 py-1  rounded-lg border border-[#eadfdb] focus:border-[#7a0b10] focus:ring-1 focus:ring-[#7a0b10] text-[14px] bg-[#f9f9f9] outline-none"
              />
            </div>
          </div>
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={pwLoading}
              className="h-11 px-6 py-2 rounded-lg border border-[#eadfdb] text-[#1a1a1a] text-[13px] font-black uppercase tracking-wider hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {pwLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
