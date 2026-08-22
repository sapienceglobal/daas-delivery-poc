import React, { useState, useEffect } from 'react';
import {
  Settings, MapPin, Clock, ShoppingCart, Percent, Image as ImageIcon, Shield
} from 'lucide-react';
import { restaurantAPI, uploadAPI, authAPI, api } from '@/lib/api';
import { showToast } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';

/**
 * Shared, accessible toggle switch.
 * Every switch on this page now renders through this one component so
 * sizing/animation/focus behaviour can never drift between instances.
 */
function Toggle({ checked, onChange, size = 'md', disabled = false, label }) {
// note: sizes are set via inline px styles, not Tailwind w-*/h-* classes.
  // the JIT compiler wasn't generating a rare value like w-11 (44px) for this
  // element, so the track collapsed to the knob's own width. Inline styles
  // sidestep that entirely, regardless of Tailwind content/purge config.
  const dims = size === 'sm'
    ? { trackW: 36, trackH: 20, knob: 16, on: 18 }
    : { trackW: 44, trackH: 24, knob: 20, on: 22 };

  const handleKeyDown = (e) => {
    if (disabled) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onChange(!checked);
    }
  };

  return (
    <div
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onClick={() => !disabled && onChange(!checked)}
      onKeyDown={handleKeyDown}
      className={`relative inline-flex shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8b0000] focus-visible:ring-offset-2 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      }`}
      style={{ width: dims.trackW, height: dims.trackH, backgroundColor: checked ? '#8b0000' : '#d1d5db' }}
    >
      <span
        className="pointer-events-none inline-block rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out"
        style={{ width: dims.knob, height: dims.knob, transform: `translateX(${checked ? dims.on : 2}px)` }}
      />
    </div>
  );
}

// shared base classes so every text/number field looks and behaves the same
// (a couple of fields — e.g. Service Charge — were previously missing focus
// styles entirely, which made them feel unresponsive next to the rest).
const fieldBase =
  'bg-[#f9fafb]/50 text-[#1f2937] border border-[#e5e7eb] rounded-lg transition-colors focus:outline-none focus:border-[#8b0000] focus:bg-[#ffffff]';

export default function SettingsView({ restaurant, onRefresh }) {
  const { user, refreshUser } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '', cuisine: '', currency: 'USD ($) - US Dollar', timezone: '(UTC-05:00) Eastern Time (ET)',
    dateFormat: 'MM/DD/YYYY', timeFormat: '12 Hour (AM/PM)', language: 'English',
    email: '', phone: '', address: '', website: '', logo: '',
    preparationTime: 0, minimumOrder: 0,
    taxType: 'Sales Tax', taxRate: 0, serviceCharge: 0, packagingCharge: 0,
    enableTips: false, acceptsOnlineOrders: false, autoAcceptOrders: false, roundOff: false,
    whatsappEnabled: true, whatsappNumber: '+1 (347) 755-1370', pushEnabled: true
  });
  const [operatingHours, setOperatingHours] = useState({});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [deviceSubscribed, setDeviceSubscribed] = useState(false);

  // 2FA state
  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [loading2FA, setLoading2FA] = useState(false);
  const [showDisable2FAForm, setShowDisable2FAForm] = useState(false);
  const [disableCode, setDisableCode] = useState('');

  useEffect(() => {
    if (restaurant) {
      setFormData({
        name: restaurant.name || '',
        cuisine: restaurant.cuisine || '',
        currency: restaurant.currency || 'USD ($) - US Dollar',
        timezone: restaurant.timezone || '(UTC-05:00) Eastern Time (ET)',
        dateFormat: restaurant.dateFormat || 'MM/DD/YYYY',
        timeFormat: restaurant.timeFormat || '12 Hour (AM/PM)',
        language: restaurant.language || 'English',
        enableTips: restaurant.enableTips !== false,

        logo: restaurant.logo || '',
        email: restaurant.email || '',
        phone: restaurant.phone || '',
        address: restaurant.address || '',
        website: restaurant.website || '',

        acceptsOnlineOrders: restaurant.acceptsOnlineOrders !== false,
        autoAcceptOrders: restaurant.autoAcceptOrders || false,
        preparationTime: restaurant.preparationTime ?? 20,
        minimumOrder: restaurant.minimumOrder ?? 15.00,

        taxType: restaurant.taxType || 'Sales Tax',
        taxRate: restaurant.taxRate ?? 8.875,
        serviceCharge: restaurant.serviceCharge ?? 5,
        packagingCharge: restaurant.packagingCharge ?? 0.50,
        roundOff: restaurant.roundOff !== false,

        whatsappEnabled: restaurant.notificationSettings?.whatsappEnabled !== false,
        whatsappNumber: restaurant.notificationSettings?.whatsappNumber || '+1 (347) 755-1370',
        pushEnabled: restaurant.notificationSettings?.pushEnabled !== false,
      });

      setOperatingHours(restaurant.operatingHours || {
        monday: { open: '09:00', close: '22:00', isClosed: false },
        tuesday: { open: '09:00', close: '22:00', isClosed: false },
        wednesday: { open: '09:00', close: '22:00', isClosed: false },
        thursday: { open: '09:00', close: '22:00', isClosed: false },
        friday: { open: '09:00', close: '23:00', isClosed: false },
        saturday: { open: '09:00', close: '23:00', isClosed: false },
        sunday: { open: '09:00', close: '22:00', isClosed: false },
      });
    }
  }, [restaurant]);

  useEffect(() => {
    const checkSubscription = async () => {
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
        try {
          if (Notification.permission !== 'granted') {
            setDeviceSubscribed(false);
            return;
          }
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg) {
            const sub = await reg.pushManager.getSubscription();
            setDeviceSubscribed(!!sub);
          }
        } catch (e) {
          console.error(e);
        }
      }
    };
    checkSubscription();
    
    let permissionStatusRef = null;
    
    // listen for native browser permission changes
    if (typeof window !== 'undefined' && navigator.permissions) {
      navigator.permissions.query({ name: 'notifications' }).then((permissionStatus) => {
        permissionStatusRef = permissionStatus;
        permissionStatus.onchange = () => {
          if (permissionStatus.state !== 'granted') {
            setDeviceSubscribed(false);
          } else {
            // if they granted permission natively in the browser URL bar, auto-subscribe them
            subscribeToPushNotifications();
          }
        };
      }).catch(console.error);
    }
    
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab) {
        setActiveTab(tab);
      }
      
      if (params.get('scroll') === 'notifications') {
        setTimeout(() => {
          const section = document.getElementById('notifications-section');
          if (section) {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
            section.classList.add('bg-yellow-50');
            setTimeout(() => section.classList.remove('bg-yellow-50'), 3000);
          }
        }, 300);
      }
    }

    return () => {
      if (permissionStatusRef) {
        permissionStatusRef.onchange = null;
      }
    };
  }, []);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleHourChange = (day, field, value) => {
    setOperatingHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
  };

  const handleGlobalHourChange = (field, value) => {
    setOperatingHours(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(day => {
        next[day] = { ...next[day], [field]: value };
      });
      return next;
    });
  };
// convert base64 to Uint8Array
  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribeToPushNotifications = async () => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        showToast('Push notifications are not supported by your browser.', 'error');
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        showToast('Notification permission was denied. Please allow it in browser settings.', 'error');
        return;
      }

      const registration = await navigator.serviceWorker.register('/sw.js');
      
      const data = await api.get('/api/web-push/vapid-public-key');
      if (!data || !data.publicKey) {
        showToast('Server push keys not configured. Please check server .env', 'error');
        return;
      }
      const convertedVapidKey = urlBase64ToUint8Array(data.publicKey);
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });

      await api.post('/api/web-push/subscribe', { subscription });
      
      showToast('Push notifications enabled and registered successfully!', 'success');
      setDeviceSubscribed(true);
    } catch (err) {
      console.error('Failed to subscribe to push notifications:', err);
      showToast('Failed to subscribe to push notifications.', 'error');
    }
  };

  const unsubscribeFromPushNotifications = async () => {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await sub.unsubscribe();
          setDeviceSubscribed(false);
          showToast('Push notifications disabled on this device.', 'success');
        }
      }
    } catch (err) {
      console.error('Failed to unsubscribe:', err);
      showToast('Failed to unsubscribe.', 'error');
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      showToast('Uploading logo...', 'info');
      const res = await uploadAPI.uploadFile(file, 'restaurants');
      if (res?.data?.url) {
        handleChange('logo', res.data.url);
        showToast('Logo uploaded successfully', 'success');
      }
    } catch (err) {
      showToast('Failed to upload logo', 'error');
    }
  };



  const handleSave = async () => {
    try {
      setSaving(true);
      // update general fields and nested notificationSettings
      const updatePayload = { ...formData, notificationSettings: { whatsappEnabled: formData.whatsappEnabled, whatsappNumber: formData.whatsappNumber, pushEnabled: formData.pushEnabled } };
      await restaurantAPI.update(restaurant._id, updatePayload);
      
      // force all days to use the global open/close time
      const globalOpen = operatingHours['monday']?.open || '11:30';
      const globalClose = operatingHours['monday']?.close || '22:00';
      const normalizedHours = {};
      Object.keys(operatingHours).forEach(day => {
        normalizedHours[day] = {
          ...operatingHours[day],
          open: globalOpen,
          close: globalClose
        };
      });

      // update hours
      await restaurantAPI.updateHours(restaurant._id, { operatingHours: normalizedHours });

      showToast('Settings saved successfully!', 'success');
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      showToast(err?.response?.data?.message || 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (user) {
      setIsTwoFactorEnabled(user.isTwoFactorEnabled);
    }
  }, [user]);

  const tabs = [
    { id: 'general', label: 'General Settings', icon: Settings },
    { id: 'business', label: 'Business Information', icon: MapPin },
    { id: 'hours', label: 'Operating Hours', icon: Clock },
    { id: 'order', label: 'Order Settings', icon: ShoppingCart },
    { id: 'taxes', label: 'Taxes & Charges', icon: Percent },
    { id: 'security', label: 'Security & 2FA', icon: Shield },
  ];

  if (!restaurant) return null;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 p-6 border-b border-[#f3f4f6] bg-[#ffffff] shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Settings</h1>
          <p className="text-sm text-[#6b7280] mt-1">Manage your restaurant settings and preferences.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#8b0000] hover:bg-[#7f0000] active:bg-[#6f0000] text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
        >
          {saving && (
            <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
          )}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Tab Navigation — vertical sidebar on desktop, horizontal scroll strip on mobile */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-[#f3f4f6] bg-[#ffffff] flex flex-col shrink-0 overflow-x-auto md:overflow-y-auto custom-scrollbar">
          <div className="flex flex-row md:flex-col gap-1 p-3 md:p-4 min-w-max md:min-w-0">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium whitespace-nowrap transition-colors duration-150 ${
                    isActive
                      ? 'bg-[#fff1f2] text-[#8b0000]'
                      : 'text-[#4b5563] hover:bg-[#f9fafb] hover:text-[#111827]'
                  }`}
                >
                  {isActive && (
                    <span className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-[#8b0000]" />
                  )}
                  <tab.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#8b0000]' : 'text-[#9ca3af]'}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Content */}
        <div className="flex-1 overflow-y-auto bg-[#f9fafb]/50 p-4 md:p-6 custom-scrollbar">
          <div className="max-w-5xl mx-auto space-y-6">

            {/* General Settings */}
            <div className={`bg-[#ffffff] rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden ${activeTab !== 'general' && activeTab !== 'all' ? 'hidden' : ''}`}>
              <div className="border-b border-[#f3f4f6] p-5 bg-[#ffffff] flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#fff1f2]">
                  <Settings className="w-4.5 h-4.5 text-[#8b0000]" />
                </span>
                <h2 className="text-base font-bold text-[#111827]">General Settings</h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-2">Restaurant Name</label>
                  <input type="text" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} className={`w-full px-3 py-2 text-sm ${fieldBase}`} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-2">Restaurant Type</label>
                  <input type="text" value={formData.cuisine} onChange={(e) => handleChange('cuisine', e.target.value)} className={`w-full px-3 py-2 text-sm ${fieldBase}`} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-2">Default Currency</label>
                  <select value={formData.currency} onChange={(e) => handleChange('currency', e.target.value)} className={`w-full px-3 py-2 text-sm cursor-pointer ${fieldBase}`}>
                    <option value="USD ($) - US Dollar">USD ($) - US Dollar</option>
                    <option value="EUR (€) - Euro">EUR (€) - Euro</option>
                    <option value="INR (₹) - Indian Rupee">INR (₹) - Indian Rupee</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-2">Timezone</label>
                  <select value={formData.timezone} onChange={(e) => handleChange('timezone', e.target.value)} className={`w-full px-3 py-2 text-sm cursor-pointer ${fieldBase}`}>
                    <option value="(UTC-05:00) Eastern Time (ET)">(UTC-05:00) Eastern Time (ET)</option>
                    <option value="(UTC-08:00) Pacific Time (PT)">(UTC-08:00) Pacific Time (PT)</option>
                    <option value="(UTC+05:30) Indian Standard Time (IST)">(UTC+05:30) Indian Standard Time (IST)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-2">Date Format</label>
                  <div className="flex gap-4 h-[38px] items-center">
                    <label className="flex items-center gap-2 text-sm text-[#111827] cursor-pointer">
                      <input type="radio" name="dateFormat" checked={formData.dateFormat === 'MM/DD/YYYY'} onChange={() => handleChange('dateFormat', 'MM/DD/YYYY')} className="accent-[#8b0000] w-4 h-4 border-gray-400 bg-white cursor-pointer" /> MM/DD/YYYY
                    </label>
                    <label className="flex items-center gap-2 text-sm text-[#111827] cursor-pointer">
                      <input type="radio" name="dateFormat" checked={formData.dateFormat === 'DD/MM/YYYY'} onChange={() => handleChange('dateFormat', 'DD/MM/YYYY')} className="accent-[#8b0000] w-4 h-4 border-gray-400 bg-white cursor-pointer" /> DD/MM/YYYY
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-2">Time Format</label>
                  <div className="flex gap-4 h-[38px] items-center">
                    <label className="flex items-center gap-2 text-sm text-[#111827] cursor-pointer">
                      <input type="radio" name="timeFormat" checked={formData.timeFormat === '12 Hour (AM/PM)'} onChange={() => handleChange('timeFormat', '12 Hour (AM/PM)')} className="accent-[#8b0000] w-4 h-4 border-gray-400 bg-white cursor-pointer" /> 12 Hour
                    </label>
                    <label className="flex items-center gap-2 text-sm text-[#111827] cursor-pointer">
                      <input type="radio" name="timeFormat" checked={formData.timeFormat === '24 Hour (HH:mm)'} onChange={() => handleChange('timeFormat', '24 Hour (HH:mm)')} className="accent-[#8b0000] w-4 h-4 border-gray-400 bg-white cursor-pointer" /> 24 Hour
                    </label>
                  </div>
                </div>
                <div className="md:col-span-2 flex items-center justify-between p-4 bg-[#f9fafb] rounded-lg border border-[#e5e7eb]">
                  <div>
                    <p className="text-sm font-bold text-[#111827]">Enable Tips</p>
                    <p className="text-xs text-[#6b7280]">Allow customers to add tips on orders</p>
                  </div>
                  <Toggle
                    checked={formData.enableTips}
                    onChange={(val) => handleChange('enableTips', val)}
                    label="Enable tips"
                  />
                </div>
              </div>
            </div>

            {/* Business Info */}
            <div className={`bg-[#ffffff] rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden ${activeTab !== 'business' && activeTab !== 'all' ? 'hidden' : ''}`}>
              <div className="border-b border-[#f3f4f6] p-5 bg-[#ffffff] flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#fff1f2]">
                  <MapPin className="w-4.5 h-4.5 text-[#8b0000]" />
                </span>
                <h2 className="text-base font-bold text-[#111827]">Business Information</h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-3">Restaurant Logo</label>
                  <div className="flex items-center gap-6">
                    <div className="w-32 h-24 border-2 border-dashed border-[#d1d5db] rounded-xl flex items-center justify-center overflow-hidden bg-[#f9fafb] shrink-0">
                      {formData.logo ? (
                        <img src={formData.logo} alt="Logo" className="w-full h-full object-contain p-2" />
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 text-[#9ca3af]">
                          <ImageIcon className="w-6 h-6" />
                          <span className="text-xs font-medium">No Logo</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="cursor-pointer bg-[#ffffff] border border-[#d1d5db] hover:bg-[#f9fafb] active:bg-[#f3f4f6] text-[#374151] px-4 py-2 rounded-lg text-sm font-bold inline-block transition-colors">
                        Change Logo
                        <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                      </label>
                      <br />
                      <button type="button" onClick={() => handleChange('logo', '')} className="text-[#dc2626] text-sm font-bold hover:underline">Remove</button>
                      <p className="text-xs text-[#6b7280]">PNG, JPG or SVG. Max size 2MB</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-2">Email</label>
                  <input type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} className={`w-full px-3 py-2 text-sm ${fieldBase}`} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-2">Phone</label>
                  <input type="text" value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} className={`w-full px-3 py-2 text-sm ${fieldBase}`} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-2">Address</label>
                  <input type="text" value={formData.address} onChange={(e) => handleChange('address', e.target.value)} className={`w-full px-3 py-2 text-sm ${fieldBase}`} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-2">Website</label>
                  <input type="text" value={formData.website} onChange={(e) => handleChange('website', e.target.value)} className={`w-full px-3 py-2 text-sm ${fieldBase}`} />
                </div>
              </div>
            </div>

            {/* Operating Hours */}
            <div className={`bg-[#ffffff] rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden ${activeTab !== 'hours' && activeTab !== 'all' ? 'hidden' : ''}`}>
              <div className="border-b border-[#f3f4f6] p-5 bg-[#ffffff] flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#fff1f2]">
                  <Clock className="w-4.5 h-4.5 text-[#8b0000]" />
                </span>
                <h2 className="text-base font-bold text-[#111827]">Operating Hours</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#f9fafb] border border-[#e5e7eb] rounded-xl mb-4">
                  <div>
                    <h4 className="text-sm font-bold text-[#111827]">Standard Operating Hours</h4>
                    <p className="text-xs text-[#6b7280]">These hours will apply to all open days.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={operatingHours['monday']?.open || ''}
                      onChange={(e) => handleGlobalHourChange('open', e.target.value)}
                      className={`px-3 py-2 text-sm font-bold bg-white ${fieldBase}`}
                    />
                    <span className="text-[#9ca3af] font-bold">TO</span>
                    <input
                      type="time"
                      value={operatingHours['monday']?.close || ''}
                      onChange={(e) => handleGlobalHourChange('close', e.target.value)}
                      className={`px-3 py-2 text-sm font-bold bg-white ${fieldBase}`}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-[#111827] px-2 mb-3">Operating Days</h4>
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => {
                    const isClosed = !!operatingHours[day]?.isClosed;
                    return (
                      <div
                        key={day}
                        className={`flex items-center justify-between border-b border-[#f3f4f6] py-3 last:border-0 rounded-lg px-3 -mx-3 transition-colors ${isClosed ? 'bg-[#f9fafb]' : 'bg-white'}`}
                      >
                        <div className="w-32">
                          <span className={`text-sm font-bold capitalize ${isClosed ? 'text-[#9ca3af]' : 'text-[#111827]'}`}>{day}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`text-xs font-bold w-14 text-right ${isClosed ? 'text-[#9ca3af]' : 'text-[#059669]'}`}>
                            {isClosed ? 'Closed' : 'Open'}
                          </span>
                          <Toggle
                            size="sm"
                            checked={!isClosed}
                            onChange={(open) => handleHourChange(day, 'isClosed', !open)}
                            label={`Toggle ${day} open or closed`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Order Settings */}
            <div className={`bg-[#ffffff] rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden ${activeTab !== 'order' && activeTab !== 'all' ? 'hidden' : ''}`}>
              <div className="border-b border-[#f3f4f6] p-5 bg-[#ffffff] flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#fff1f2]">
                  <ShoppingCart className="w-4.5 h-4.5 text-[#8b0000]" />
                </span>
                <h2 className="text-base font-bold text-[#111827]">Order Settings</h2>
              </div>
              <div className="p-6 space-y-1">
                <div className="flex items-center justify-between py-4 border-b border-[#f3f4f6]">
                  <div>
                    <p className="text-sm font-bold text-[#111827]">Accept Online Orders</p>
                    <p className="text-xs text-[#6b7280] mt-1">Allow customers to place orders online</p>
                  </div>
                  <Toggle
                    checked={formData.acceptsOnlineOrders}
                    onChange={(val) => handleChange('acceptsOnlineOrders', val)}
                    label="Accept online orders"
                  />
                </div>

                <div className="flex items-center justify-between py-4 border-b border-[#f3f4f6]">
                  <div>
                    <p className="text-sm font-bold text-[#111827]">Auto Accept Orders</p>
                    <p className="text-xs text-[#6b7280] mt-1">Automatically accept incoming orders</p>
                  </div>
                  <Toggle
                    checked={formData.autoAcceptOrders}
                    onChange={(val) => handleChange('autoAcceptOrders', val)}
                    label="Auto accept orders"
                  />
                </div>

                <div className="flex items-center justify-between py-4 border-b border-[#f3f4f6]">
                  <div>
                    <p className="text-sm font-bold text-[#111827]">Order Preparation Time</p>
                    <p className="text-xs text-[#6b7280] mt-1">Estimated time to prepare an order</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="number" value={formData.preparationTime} onChange={(e) => handleChange('preparationTime', Number(e.target.value))} className={`w-20 px-2 py-1.5 text-sm text-center ${fieldBase}`} />
                    <span className="text-sm text-[#6b7280] font-medium">mins</span>
                  </div>
                </div>

                <div className="flex items-center justify-between py-4">
                  <div>
                    <p className="text-sm font-bold text-[#111827]">Minimum Order Amount</p>
                    <p className="text-xs text-[#6b7280] mt-1">Minimum order amount for online orders</p>
                  </div>
                  <div className="flex items-center gap-2 relative">
                    <span className="absolute left-3 text-sm text-[#6b7280] pointer-events-none">$</span>
                    <input type="number" value={formData.minimumOrder} onChange={(e) => handleChange('minimumOrder', Number(e.target.value))} className={`w-24 pl-6 pr-2 py-1.5 text-sm text-left ${fieldBase}`} />
                  </div>
                </div>

                {/* Notification Settings Moved Here */}
                <div id="notifications-section" className="mt-6 pt-6 border-t border-[#f3f4f6]">
                  <h3 className="text-sm font-bold text-[#111827] mb-4">Notification Preferences</h3>
                  
                  <div className="flex items-center justify-between py-4 border-b border-[#f3f4f6]">
                    <div>
                      <p className="text-sm font-bold text-[#111827]">Global Push Settings</p>
                      <p className="text-xs text-[#6b7280] mt-1">Enable or disable web push alerts system-wide</p>
                    </div>
                    <Toggle checked={formData.pushEnabled} onChange={(val) => handleChange('pushEnabled', val)} label="Enable push notifications globally" />
                  </div>

                  <div className="flex items-center justify-between py-4 border-b border-[#f3f4f6]">
                    <div>
                      <p className="text-sm font-bold text-[#111827]">Current Device Permission</p>
                      <p className="text-xs text-[#6b7280] mt-1">
                        Status: <span className={deviceSubscribed ? 'text-[#25D366] font-bold' : 'text-[#dc2626] font-bold'}>{deviceSubscribed ? 'Active on this device' : 'Inactive on this device'}</span>
                      </p>
                      {deviceSubscribed ? (
                        <button onClick={unsubscribeFromPushNotifications} type="button" className="mt-2 text-xs font-semibold text-[#8b0000] hover:underline">
                          Revoke Browser Permission
                        </button>
                      ) : (
                        <button onClick={subscribeToPushNotifications} type="button" className="mt-2 text-xs font-semibold text-[#8b0000] hover:underline">
                          Enable Notifications on this Device
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between py-4">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-[#111827]">WhatsApp Order Alerts</p>
                      <p className="text-xs text-[#6b7280] mt-1">Receive new order notifications via WhatsApp</p>
                      {formData.whatsappEnabled && (
                        <div className="mt-3">
                          <label className="block text-xs font-bold text-[#4b5563] mb-1">WhatsApp Number</label>
                          <input 
                            type="text" 
                            placeholder="+1 (xxx) xxx-xxxx"
                            value={formData.whatsappNumber} 
                            onChange={(e) => handleChange('whatsappNumber', e.target.value)} 
                            className={`w-full max-w-xs px-3 py-2 text-sm ${fieldBase}`} 
                          />
                        </div>
                      )}
                    </div>
                    <div className="self-start mt-2">
                      <Toggle checked={formData.whatsappEnabled} onChange={(val) => handleChange('whatsappEnabled', val)} label="Enable WhatsApp Alerts" />
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Taxes & Charges */}
            <div className={`bg-[#ffffff] rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden ${activeTab !== 'taxes' && activeTab !== 'all' ? 'hidden' : ''}`}>
              <div className="border-b border-[#f3f4f6] p-5 bg-[#ffffff] flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#fff1f2]">
                  <Percent className="w-4.5 h-4.5 text-[#8b0000]" />
                </span>
                <h2 className="text-base font-bold text-[#111827]">Taxes & Charges</h2>
              </div>
              <div className="p-6 space-y-1">
                <div className="pb-5 mb-1 border-b border-[#f3f4f6]">
                  <label className="block text-sm font-bold text-[#111827] mb-2">Tax Type</label>
                  <select value={formData.taxType} onChange={(e) => handleChange('taxType', e.target.value)} className={`w-full max-w-xs px-3 py-2 text-sm cursor-pointer ${fieldBase}`}>
                    <option value="Sales Tax">Sales Tax</option>
                    <option value="VAT">VAT</option>
                    <option value="GST">GST</option>
                  </select>
                </div>

                <div className="flex items-center justify-between py-4 border-b border-[#f3f4f6]">
                  <p className="text-sm font-bold text-[#111827]">Tax Rate (%)</p>
                  <div className="flex items-center gap-2">
                    <input type="number" step="0.01" value={formData.taxRate} onChange={(e) => handleChange('taxRate', Number(e.target.value))} className={`w-24 px-2 py-1.5 text-sm text-right ${fieldBase}`} />
                    <span className="text-sm text-[#6b7280] font-medium">%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between py-4 border-b border-[#f3f4f6]">
                  <div>
                    <p className="text-sm font-bold text-[#111827]">Service Charge (%)</p>
                    <p className="text-xs text-[#6b7280] mt-1">Applied on order subtotal</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="number" step="0.1" value={formData.serviceCharge} onChange={(e) => handleChange('serviceCharge', Number(e.target.value))} className={`w-24 px-2 py-1.5 text-sm text-right ${fieldBase}`} />
                    <span className="text-sm text-[#6b7280] font-medium">%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between py-4 border-b border-[#f3f4f6]">
                  <div>
                    <p className="text-sm font-bold text-[#111827]">Packaging Charge</p>
                    <p className="text-xs text-[#6b7280] mt-1">Per order flat fee</p>
                  </div>
                  <div className="flex items-center gap-2 relative">
                    <span className="absolute left-3 text-sm text-[#6b7280] pointer-events-none">$</span>
                    <input type="number" step="0.1" value={formData.packagingCharge} onChange={(e) => handleChange('packagingCharge', Number(e.target.value))} className={`w-24 pl-6 pr-2 py-1.5 text-sm text-left ${fieldBase}`} />
                  </div>
                </div>

                <div className="flex items-center justify-between py-4">
                  <div>
                    <p className="text-sm font-bold text-[#111827]">Round Off</p>
                    <p className="text-xs text-[#6b7280] mt-1">Round off total amount</p>
                  </div>
                  <Toggle
                    checked={formData.roundOff}
                    onChange={(val) => handleChange('roundOff', val)}
                    label="Round off total amount"
                  />
                </div>
              </div>
            </div>

            {/* Security & 2FA */}
            <div className={`bg-[#ffffff] rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden ${activeTab !== 'security' && activeTab !== 'all' ? 'hidden' : ''}`}>
              <div className="border-b border-[#f3f4f6] p-5 bg-[#ffffff] flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#fff1f2]">
                  <Shield className="w-4.5 h-4.5 text-[#8b0000]" />
                </span>
                <h2 className="text-base font-bold text-[#111827]">Security & Two-Factor Auth</h2>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-bold text-[#111827]">Two-Factor Authentication (2FA)</p>
                    <p className="text-sm text-[#6b7280] mt-1 max-w-2xl">
                      Add an extra layer of security to your account. When enabled, you'll need to enter a 6-digit code from your authenticator app (like Google Authenticator) every time you sign in to the HQ Portal.
                    </p>
                  </div>
                  {isTwoFactorEnabled ? (
                    showDisable2FAForm ? (
                      <div className="flex flex-col gap-3 p-5 bg-[#f9fafb] border border-[#e5e7eb] rounded-xl w-full sm:w-auto shadow-sm">
                        <p className="text-sm font-bold text-[#111827]">Disable Two-Factor Authentication</p>
                        <p className="text-sm text-[#6b7280]">Enter your current 6-digit code to confirm.</p>
                        <div className="flex items-center gap-3 mt-1">
                          <input
                            type="text"
                            maxLength={6}
                            placeholder="000000"
                            value={disableCode}
                            onChange={(e) => setDisableCode(e.target.value)}
                            className={`w-32 px-3 py-2 text-center tracking-[0.25em] font-mono text-lg border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#dc2626] focus:border-[#dc2626] ${fieldBase}`}
                          />
                          <button
                            onClick={async () => {
                              if (!disableCode || disableCode.length !== 6) {
                                showToast('Please enter a valid 6-digit code.', 'error');
                                return;
                              }
                              try {
                                setLoading2FA(true);
                                await authAPI.disable2FA({ token: disableCode });
                                await refreshUser();
                                setIsTwoFactorEnabled(false);
                                setShowDisable2FAForm(false);
                                setDisableCode('');
                                showToast('Two-factor authentication disabled.', 'success');
                              } catch (err) {
                                showToast(err.message || 'Failed to disable 2FA.', 'error');
                              } finally {
                                setLoading2FA(false);
                              }
                            }}
                            disabled={loading2FA || !disableCode}
                            className="px-5 py-2.5 bg-[#dc2626] text-white hover:bg-[#b91c1c] rounded-lg text-sm font-bold transition-colors disabled:opacity-50 shadow-sm"
                          >
                            {loading2FA ? 'Disabling...' : 'Confirm'}
                          </button>
                          <button
                            onClick={() => {
                              setDisableCode('');
                              setShowDisable2FAForm(false);
                            }}
                            className="px-4 py-2.5 text-[#6b7280] hover:text-[#111827] text-sm font-bold transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowDisable2FAForm(true)}
                        disabled={loading2FA}
                        className="px-5 py-2.5 bg-white border border-[#fecaca] text-[#dc2626] hover:bg-[#fef2f2] hover:border-[#fca5a5] rounded-lg text-sm font-bold transition-all disabled:opacity-50 shadow-sm"
                      >
                        Disable 2FA
                      </button>
                    )
                  ) : (
                    <button
                      onClick={async () => {
                        try {
                          setLoading2FA(true);
                          const res = await authAPI.generate2FA();
                          setQrCodeUrl(res.data.qrCodeUrl);
                          setTwoFactorSecret(res.data.secret);
                        } catch (err) {
                          showToast(err.message || 'Failed to generate 2FA setup.', 'error');
                        } finally {
                          setLoading2FA(false);
                        }
                      }}
                      disabled={loading2FA || !!qrCodeUrl}
                      className="px-4 py-2 bg-[#8b0000] text-white hover:bg-[#7f0000] rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                    >
                      {loading2FA ? 'Loading...' : 'Setup 2FA'}
                    </button>
                  )}
                </div>

                {qrCodeUrl && !isTwoFactorEnabled && (
                  <div className="mt-6 p-6 border border-[#e5e7eb] rounded-xl bg-[#f9fafb] flex flex-col sm:flex-row gap-8 items-center sm:items-start">
                    <div className="shrink-0 bg-white p-2 rounded-lg border border-[#e5e7eb] shadow-sm">
                      <img src={qrCodeUrl} alt="2FA QR Code" className="w-40 h-40" />
                    </div>
                    <div className="flex-1 space-y-4 w-full">
                      <div>
                        <h3 className="text-sm font-bold text-[#111827]">1. Scan the QR Code</h3>
                        <p className="text-sm text-[#6b7280] mt-1">
                          Open your authenticator app (e.g. Google Authenticator, Authy) and scan the QR code to the left.
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#111827]">2. Enter the Verification Code</h3>
                        <p className="text-sm text-[#6b7280] mt-1 mb-3">
                          Enter the 6-digit code generated by your app to verify and enable 2FA.
                        </p>
                        <div className="flex items-center gap-3">
                          <input
                            type="text"
                            maxLength={6}
                            placeholder="000000"
                            value={twoFactorCode}
                            onChange={(e) => setTwoFactorCode(e.target.value)}
                            className={`w-32 px-3 py-2 text-center tracking-[0.25em] font-mono text-lg border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#8b0000] focus:border-[#8b0000] ${fieldBase}`}
                          />
                          <button
                            onClick={async () => {
                              if (!twoFactorCode || twoFactorCode.length !== 6) {
                                showToast('Please enter a valid 6-digit code.', 'error');
                                return;
                              }
                              try {
                                setLoading2FA(true);
                                await authAPI.enable2FA({ secret: twoFactorSecret, token: twoFactorCode });
                                await refreshUser();
                                setIsTwoFactorEnabled(true);
                                setQrCodeUrl('');
                                setTwoFactorSecret('');
                                setTwoFactorCode('');
                                showToast('Two-factor authentication enabled successfully!', 'success');
                              } catch (err) {
                                showToast(err.message || 'Invalid code. Please try again.', 'error');
                              } finally {
                                setLoading2FA(false);
                              }
                            }}
                            disabled={loading2FA || !twoFactorCode}
                            className="px-5 py-2.5 bg-[#111827] hover:bg-black text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                          >
                            {loading2FA ? 'Verifying...' : 'Verify & Enable'}
                          </button>
                          <button
                            onClick={() => {
                              setQrCodeUrl('');
                              setTwoFactorSecret('');
                              setTwoFactorCode('');
                            }}
                            className="px-4 py-2.5 text-[#6b7280] hover:text-[#111827] text-sm font-bold transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}