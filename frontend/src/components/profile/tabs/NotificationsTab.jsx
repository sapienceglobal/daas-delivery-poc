'use client';

import { useState } from 'react';
import { Bell, Smartphone, Mail, Megaphone, Loader2 } from 'lucide-react';
import { authAPI } from '@/lib/api';
import { showToast } from '@/components/ui';

export default function NotificationsTab({ user, updateUser }) {
  const [loading, setLoading] = useState(false);
  const [prefs, setPrefs] = useState({
    email: user?.notificationPreferences?.email ?? true,
    push: user?.notificationPreferences?.push ?? true,
    sms: user?.notificationPreferences?.sms ?? false,
    marketing: user?.notificationPreferences?.marketing ?? true,
  });

  const handleToggle = async (key) => {
    const newPrefs = { ...prefs, [key]: !prefs[key] };
    setPrefs(newPrefs);
    
    setLoading(true);
    try {
      const res = await authAPI.updateProfile({ notificationPreferences: newPrefs });
      updateUser(res.data);
      showToast('Preferences updated', 'success');
    } catch (err) {
      // Revert on error
      setPrefs(prefs);
      showToast('Failed to update preferences', 'error');
    } finally {
      setLoading(false);
    }
  };

  const NotificationOption = ({ icon: Icon, title, description, prefKey }) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 hover:bg-gray-50 transition-colors">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-[#f4f7f9] flex items-center justify-center shrink-0 mt-1 sm:mt-0">
          <Icon className="h-5 w-5 text-[#0ea5e9]" />
        </div>
        <div>
          <h3 className="text-[15px] font-bold text-[#1a1a1a]">{title}</h3>
          <p className="text-[13px] text-[#6b7280] mt-1">{description}</p>
        </div>
      </div>
      
      {/* Custom Toggle Switch */}
      <button 
        onClick={() => handleToggle(prefKey)}
        disabled={loading}
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors shrink-0 ${
          prefs[prefKey] ? 'bg-[#7a0b10]' : 'bg-gray-300'
        }`}
      >
        <span 
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
            prefs[prefKey] ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[24px] font-black text-[#1a1a1a]">Notifications</h2>
        <p className="text-[14px] text-[#6b7280]">Manage how you receive updates and promotions.</p>
      </div>

      <div className="bg-white rounded-2xl border border-[#eadfdb] shadow-sm overflow-hidden">
        <div className="divide-y divide-[#eadfdb]">
          
          <NotificationOption 
            icon={Mail}
            title="Order Updates (Email)"
            description="Receive order confirmations, receipts, and status updates via email."
            prefKey="email"
          />
          
          <NotificationOption 
            icon={Smartphone}
            title="Order Updates (SMS)"
            description="Get real-time text messages when your food is on the way."
            prefKey="sms"
          />
          
          <NotificationOption 
            icon={Bell}
            title="Push Notifications"
            description="Receive app notifications on your device for order tracking."
            prefKey="push"
          />
          
          <NotificationOption 
            icon={Megaphone}
            title="Offers & Marketing"
            description="Get notified about new menu items, special discounts, and events."
            prefKey="marketing"
          />

        </div>
      </div>
    </div>
  );
}
