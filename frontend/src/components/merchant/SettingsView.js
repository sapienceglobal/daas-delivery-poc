import React, { useState, useEffect } from 'react';
import { 
  Settings, MapPin, Clock, ShoppingCart, CreditCard, Percent,
  Bell, ChefHat, Printer, Link as LinkIcon, Shield, Database,
  CheckCircle, XCircle
} from 'lucide-react';
import { restaurantAPI, uploadAPI } from '@/lib/api';
import { showToast } from '@/components/ui';

export default function SettingsView({ restaurant, onRefresh }) {
  const [formData, setFormData] = useState({
    name: '', cuisine: '', currency: 'USD ($) - US Dollar', timezone: '(UTC-05:00) Eastern Time (ET)', 
    dateFormat: 'MM/DD/YYYY', timeFormat: '12 Hour (AM/PM)', language: 'English',
    email: '', phone: '', address: '', website: '', logo: '',
    preparationTime: 0, minimumOrder: 0,
    taxType: 'Sales Tax', taxRate: 0, serviceCharge: 0, packagingCharge: 0,
    enableTips: false, acceptsOnlineOrders: false, autoAcceptOrders: false, roundOff: false
  });
  const [operatingHours, setOperatingHours] = useState({});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

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
        preparationTime: restaurant.preparationTime || 20,
        minimumOrder: restaurant.minimumOrder || 15.00,

        taxType: restaurant.taxType || 'Sales Tax',
        taxRate: restaurant.taxRate || 8.875,
        serviceCharge: restaurant.serviceCharge || 5,
        packagingCharge: restaurant.packagingCharge || 0.50,
        roundOff: restaurant.roundOff !== false,
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

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleHourChange = (day, field, value) => {
    setOperatingHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
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
      // Update general fields
      await restaurantAPI.update(restaurant._id, formData);
      // Update hours
      await restaurantAPI.updateHours(restaurant._id, { operatingHours });
      
      showToast('Settings saved successfully!', 'success');
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      showToast(err?.response?.data?.message || 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General Settings', icon: Settings },
    { id: 'business', label: 'Business Information', icon: MapPin },
    { id: 'hours', label: 'Operating Hours', icon: Clock },
    { id: 'order', label: 'Order Settings', icon: ShoppingCart },
    { id: 'taxes', label: 'Taxes & Charges', icon: Percent },
  ];

  if (!restaurant) return null;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-[#f3f4f6] bg-[#ffffff] shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Settings</h1>
          <p className="text-sm text-[#6b7280] mt-1">Manage your restaurant settings and preferences.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#8b0000] hover:bg-[#7f0000] text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-64 border-r border-[#f3f4f6] bg-[#ffffff] flex flex-col shrink-0 overflow-y-auto custom-scrollbar p-4">
          <div className="space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id 
                    ? 'bg-[#fff1f2] text-[#8b0000]' 
                    : 'text-[#4b5563] hover:bg-[#f9fafb]'
                }`}
              >
                <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-[#8b0000]' : 'text-[#9ca3af]'}`} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right Content */}
        <div className="flex-1 overflow-y-auto bg-[#f9fafb]/50 p-6 custom-scrollbar">
          <div className="max-w-5xl mx-auto space-y-6">

            {/* General Settings */}
            <div className={`bg-[#ffffff] rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden ${activeTab !== 'general' && activeTab !== 'all' ? 'hidden' : ''}`}>
              <div className="border-b border-[#f3f4f6] p-5 bg-[#ffffff] flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#9ca3af]" />
                <h2 className="text-base font-bold text-[#111827]">General Settings</h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-2">Restaurant Name</label>
                  <input type="text" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} className="w-full bg-[#f9fafb]/50 text-[#1f2937] border border-[#e5e7eb] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#8b0000] focus:bg-[#ffffff]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-2">Restaurant Type</label>
                  <input type="text" value={formData.cuisine} onChange={(e) => handleChange('cuisine', e.target.value)} className="w-full bg-[#f9fafb]/50 text-[#1f2937] border border-[#e5e7eb] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#8b0000] focus:bg-[#ffffff]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-2">Default Currency</label>
                  <select value={formData.currency} onChange={(e) => handleChange('currency', e.target.value)} className="w-full bg-[#ffffff] text-[#111827] border border-[#d1d5db] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#8b0000]">
                    <option value="USD ($) - US Dollar">USD ($) - US Dollar</option>
                    <option value="EUR (€) - Euro">EUR (€) - Euro</option>
                    <option value="INR (₹) - Indian Rupee">INR (₹) - Indian Rupee</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-2">Timezone</label>
                  <select value={formData.timezone} onChange={(e) => handleChange('timezone', e.target.value)} className="w-full bg-[#f9fafb]/50 text-[#1f2937] border border-[#e5e7eb] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#8b0000] focus:bg-[#ffffff]">
                    <option value="(UTC-05:00) Eastern Time (ET)">(UTC-05:00) Eastern Time (ET)</option>
                    <option value="(UTC-08:00) Pacific Time (PT)">(UTC-08:00) Pacific Time (PT)</option>
                    <option value="(UTC+05:30) Indian Standard Time (IST)">(UTC+05:30) Indian Standard Time (IST)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-2">Date Format</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm text-[#111827]">
                      <input type="radio" name="dateFormat" checked={formData.dateFormat === 'MM/DD/YYYY'} onChange={() => handleChange('dateFormat', 'MM/DD/YYYY')} className="accent-[#8b0000] w-4 h-4 border-gray-400 bg-white" /> MM/DD/YYYY
                    </label>
                    <label className="flex items-center gap-2 text-sm text-[#111827]">
                      <input type="radio" name="dateFormat" checked={formData.dateFormat === 'DD/MM/YYYY'} onChange={() => handleChange('dateFormat', 'DD/MM/YYYY')} className="accent-[#8b0000] w-4 h-4 border-gray-400 bg-white" /> DD/MM/YYYY
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-2">Time Format</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm text-[#111827]">
                      <input type="radio" name="timeFormat" checked={formData.timeFormat === '12 Hour (AM/PM)'} onChange={() => handleChange('timeFormat', '12 Hour (AM/PM)')} className="accent-[#8b0000] w-4 h-4 border-gray-400 bg-white" /> 12 Hour
                    </label>
                    <label className="flex items-center gap-2 text-sm text-[#111827]">
                      <input type="radio" name="timeFormat" checked={formData.timeFormat === '24 Hour (HH:mm)'} onChange={() => handleChange('timeFormat', '24 Hour (HH:mm)')} className="accent-[#8b0000] w-4 h-4 border-gray-400 bg-white" /> 24 Hour
                    </label>
                  </div>
                </div>
                <div className="md:col-span-2 flex items-center justify-between p-4 bg-[#f9fafb] rounded-lg border border-[#e5e7eb]">
                  <div>
                    <p className="text-sm font-bold text-[#111827]">Enable Tips</p>
                    <p className="text-xs text-[#6b7280]">Allow customers to add tips on orders</p>
                  </div>
                  <div
                    onClick={() => handleChange('enableTips', !formData.enableTips)}
                    className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors"
                    style={{ backgroundColor: formData.enableTips ? '#8b0000' : '#d1d5db' }}
                  >
                    <span 
                      className="inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform" 
                      style={{ transform: formData.enableTips ? 'translateX(22px)' : 'translateX(2px)' }} 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Business Info */}
            <div className={`bg-[#ffffff] rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden ${activeTab !== 'business' && activeTab !== 'all' ? 'hidden' : ''}`}>
              <div className="border-b border-[#f3f4f6] p-5 bg-[#ffffff] flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#9ca3af]" />
                <h2 className="text-base font-bold text-[#111827]">Business Information</h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-3">Restaurant Logo</label>
                  <div className="flex items-center gap-6">
                    <div className="w-32 h-24 border-2 border-dashed border-[#d1d5db] rounded-xl flex items-center justify-center overflow-hidden bg-[#f9fafb]">
                      {formData.logo ? (
                        <img src={formData.logo} alt="Logo" className="w-full h-full object-contain p-2" />
                      ) : (
                        <span className="text-xs text-[#9ca3af] font-medium">No Logo</span>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="cursor-pointer bg-[#ffffff] border border-[#d1d5db] hover:bg-[#f9fafb] text-[#374151] px-4 py-2 rounded-lg text-sm font-bold inline-block">
                        Change Logo
                        <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                      </label>
                      <br/>
                      <button type="button" onClick={() => handleChange('logo', '')} className="text-[#dc2626] text-sm font-bold hover:underline">Remove</button>
                      <p className="text-xs text-[#6b7280]">PNG, JPG or SVG. Max size 2MB</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-2">Email</label>
                  <input type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} className="w-full bg-[#f9fafb]/50 text-[#1f2937] border border-[#e5e7eb] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#8b0000] focus:bg-[#ffffff]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-2">Phone</label>
                  <input type="text" value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} className="w-full bg-[#f9fafb]/50 text-[#1f2937] border border-[#e5e7eb] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#8b0000] focus:bg-[#ffffff]" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-2">Address</label>
                  <input type="text" value={formData.address} onChange={(e) => handleChange('address', e.target.value)} className="w-full bg-[#f9fafb]/50 text-[#1f2937] border border-[#e5e7eb] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#8b0000] focus:bg-[#ffffff]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-2">Website</label>
                  <input type="text" value={formData.website} onChange={(e) => handleChange('website', e.target.value)} className="w-full bg-[#f9fafb]/50 text-[#1f2937] border border-[#e5e7eb] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#8b0000] focus:bg-[#ffffff]" />
                </div>
              </div>
            </div>

            {/* Operating Hours */}
            <div className={`bg-[#ffffff] rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden ${activeTab !== 'hours' && activeTab !== 'all' ? 'hidden' : ''}`}>
              <div className="border-b border-[#f3f4f6] p-5 bg-[#ffffff] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#9ca3af]" />
                  <h2 className="text-base font-bold text-[#111827]">Operating Hours</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                  <div key={day} className="flex items-center justify-between border-b border-[#f3f4f6] pb-4 last:border-0 last:pb-0">
                    <div className="w-24">
                      <span className="text-sm font-bold text-[#111827] capitalize">{day}</span>
                    </div>
                    <div className="flex items-center gap-6">
                      <div
                        onClick={() => handleHourChange(day, 'isClosed', !(!operatingHours[day]?.isClosed))}
                        className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors"
                        style={{ backgroundColor: !operatingHours[day]?.isClosed ? '#8b0000' : '#d1d5db' }}
                      >
                        <span 
                          className="inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform" 
                          style={{ transform: !operatingHours[day]?.isClosed ? 'translateX(18px)' : 'translateX(2px)' }} 
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input 
                          type="time" 
                          value={operatingHours[day]?.open || ''} 
                          onChange={(e) => handleHourChange(day, 'open', e.target.value)}
                          disabled={operatingHours[day]?.isClosed}
                          className="bg-[#f9fafb]/50 text-[#1f2937] border border-[#e5e7eb] rounded px-2 py-1 text-sm disabled:opacity-50 focus:outline-none focus:border-[#8b0000] focus:bg-[#ffffff]"
                        />
                        <span className="text-[#9ca3af]">-</span>
                        <input 
                          type="time" 
                          value={operatingHours[day]?.close || ''} 
                          onChange={(e) => handleHourChange(day, 'close', e.target.value)}
                          disabled={operatingHours[day]?.isClosed}
                          className="bg-[#f9fafb] text-[#111827] border border-[#e5e7eb] rounded px-2 py-1 text-sm disabled:opacity-50 focus:outline-none focus:border-[#8b0000]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Settings */}
            <div className={`bg-[#ffffff] rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden ${activeTab !== 'order' && activeTab !== 'all' ? 'hidden' : ''}`}>
              <div className="border-b border-[#f3f4f6] p-5 bg-[#ffffff] flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-[#9ca3af]" />
                <h2 className="text-base font-bold text-[#111827]">Order Settings</h2>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-[#f3f4f6]">
                  <div>
                    <p className="text-sm font-bold text-[#111827]">Accept Online Orders</p>
                    <p className="text-xs text-[#6b7280] mt-1">Allow customers to place orders online</p>
                  </div>
                  <div
                    onClick={() => handleChange('acceptsOnlineOrders', !formData.acceptsOnlineOrders)}
                    className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors"
                    style={{ backgroundColor: formData.acceptsOnlineOrders ? '#8b0000' : '#d1d5db' }}
                  >
                    <span 
                      className="inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform" 
                      style={{ transform: formData.acceptsOnlineOrders ? 'translateX(22px)' : 'translateX(2px)' }} 
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between pb-4 border-b border-[#f3f4f6]">
                  <div>
                    <p className="text-sm font-bold text-[#111827]">Auto Accept Orders</p>
                    <p className="text-xs text-[#6b7280] mt-1">Automatically accept incoming orders</p>
                  </div>
                  <div
                    onClick={() => handleChange('autoAcceptOrders', !formData.autoAcceptOrders)}
                    className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors"
                    style={{ backgroundColor: formData.autoAcceptOrders ? '#8b0000' : '#d1d5db' }}
                  >
                    <span 
                      className="inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform" 
                      style={{ transform: formData.autoAcceptOrders ? 'translateX(22px)' : 'translateX(2px)' }} 
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pb-4 border-b border-[#f3f4f6]">
                  <div>
                    <p className="text-sm font-bold text-[#111827]">Order Preparation Time</p>
                    <p className="text-xs text-[#6b7280] mt-1">Estimated time to prepare an order</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="number" value={formData.preparationTime} onChange={(e) => handleChange('preparationTime', Number(e.target.value))} className="w-20 bg-[#f9fafb]/50 text-[#1f2937] border border-[#e5e7eb] rounded text-sm px-2 py-1 text-center focus:bg-[#ffffff] focus:outline-none focus:border-[#8b0000]" />
                    <span className="text-sm text-[#6b7280] font-medium">mins</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pb-4 border-b border-[#f3f4f6]">
                  <div>
                    <p className="text-sm font-bold text-[#111827]">Minimum Order Amount</p>
                    <p className="text-xs text-[#6b7280] mt-1">Minimum order amount for online orders</p>
                  </div>
                  <div className="flex items-center gap-2 relative">
                    <span className="absolute left-3 text-sm text-[#6b7280]">$</span>
                    <input type="number" value={formData.minimumOrder} onChange={(e) => handleChange('minimumOrder', Number(e.target.value))} className="w-24 bg-[#f9fafb]/50 text-[#1f2937] border border-[#e5e7eb] rounded text-sm pl-6 pr-2 py-1 text-left focus:bg-[#ffffff] focus:outline-none focus:border-[#8b0000]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Taxes & Charges */}
            <div className={`bg-[#ffffff] rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden ${activeTab !== 'taxes' && activeTab !== 'all' ? 'hidden' : ''}`}>
              <div className="border-b border-[#f3f4f6] p-5 bg-[#ffffff] flex items-center gap-2">
                <Percent className="w-5 h-5 text-[#9ca3af]" />
                <h2 className="text-base font-bold text-[#111827]">Taxes & Charges</h2>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-bold text-[#111827] mb-1">Tax Type</label>
                  <select value={formData.taxType} onChange={(e) => handleChange('taxType', e.target.value)} className="w-full max-w-xs bg-[#f9fafb]/50 text-[#1f2937] border border-[#e5e7eb] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#8b0000] focus:bg-[#ffffff]">
                    <option value="Sales Tax">Sales Tax</option>
                    <option value="VAT">VAT</option>
                    <option value="GST">GST</option>
                  </select>
                </div>

                <div className="flex items-center justify-between pb-4 border-b border-[#f3f4f6]">
                  <p className="text-sm font-bold text-[#111827]">Tax Rate (%)</p>
                  <div className="flex items-center gap-2 relative">
                    <input type="number" step="0.01" value={formData.taxRate} onChange={(e) => handleChange('taxRate', Number(e.target.value))} className="w-24 bg-[#f9fafb]/50 text-[#1f2937] border border-[#e5e7eb] rounded text-sm px-2 py-1 text-right focus:bg-[#ffffff] focus:outline-none focus:border-[#8b0000]" />
                    <span className="text-sm text-[#6b7280] font-medium">%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pb-4 border-b border-[#f3f4f6]">
                  <div>
                    <p className="text-sm font-bold text-[#111827]">Service Charge (%)</p>
                    <p className="text-xs text-[#6b7280] mt-1">Applied on order subtotal</p>
                  </div>
                  <div className="flex items-center gap-2 relative">
                    <input type="number" step="0.1" value={formData.serviceCharge} onChange={(e) => handleChange('serviceCharge', Number(e.target.value))} className="w-24 bg-[#f9fafb] text-[#111827] border border-[#e5e7eb] rounded text-sm px-2 py-1 text-right" />
                    <span className="text-sm text-[#6b7280] font-medium">%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pb-4 border-b border-[#f3f4f6]">
                  <div>
                    <p className="text-sm font-bold text-[#111827]">Packaging Charge</p>
                    <p className="text-xs text-[#6b7280] mt-1">Per order flat fee</p>
                  </div>
                  <div className="flex items-center gap-2 relative">
                    <span className="absolute left-3 text-sm text-[#6b7280]">$</span>
                    <input type="number" step="0.1" value={formData.packagingCharge} onChange={(e) => handleChange('packagingCharge', Number(e.target.value))} className="w-24 bg-[#f9fafb]/50 text-[#1f2937] border border-[#e5e7eb] rounded text-sm pl-6 pr-2 py-1 text-left focus:bg-[#ffffff] focus:outline-none focus:border-[#8b0000]" />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-[#111827]">Round Off</p>
                    <p className="text-xs text-[#6b7280] mt-1">Round off total amount</p>
                  </div>
                  <div
                    onClick={() => handleChange('roundOff', !formData.roundOff)}
                    className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors"
                    style={{ backgroundColor: formData.roundOff ? '#8b0000' : '#d1d5db' }}
                  >
                    <span 
                      className="inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform" 
                      style={{ transform: formData.roundOff ? 'translateX(22px)' : 'translateX(2px)' }} 
                    />
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
