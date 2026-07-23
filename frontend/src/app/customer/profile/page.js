'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User, Mail, Phone, MapPin, Shield, Bell,
  Lock, Save, Trash2, Plus, Award,
  Clock, ArrowUpRight, ArrowDownLeft, Loader2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { authAPI, loyaltyAPI } from '@/lib/api';
import {
  GlassCard, Button, Input, Badge, Tabs, showToast
} from '@/components/ui';
import AddressModal from '@/components/shared/AddressModal';

// Naye modularized components ko import karein
import LassiProfilePage from '@/components/profile/LassiProfilePage';

import Loading from '@/app/loading';

const isSingleRestaurantMode = process.env.NEXT_PUBLIC_SINGLE_RESTAURANT_MODE === 'true';

export default function ProfilePage() {
  const { user, isAuthenticated, loading, updateUser, logout, refreshUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else {
        refreshUser();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, isAuthenticated]);

  if (loading || !user) {
    return <Loading />;
  }

  // Single-Restaurant (Lassi Lounge) route ko naye structure ki taraf point karein
  if (isSingleRestaurantMode) {
    return <LassiProfilePage user={user} logout={logout} updateUser={updateUser} />;
  }

  // Enterprise (Zomato/Swiggy type) route (exactly unchanged)
  return <MarketplaceProfilePage user={user} updateUser={updateUser} />;
}


/**
 * ────────────────────────────────────────────────────────────────────────
 * MARKETPLACE / ENTERPRISE PROFILE COMPONENTS
 * (Ye sab aapke purane code ke hisab se exactly same hain)
 * ────────────────────────────────────────────────────────────────────────
 */

function MarketplaceProfilePage({ user, updateUser }) {
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { value: 'profile', label: 'Profile', icon: User },
    { value: 'loyalty', label: 'Loyalty', icon: Award },
    { value: 'addresses', label: 'Addresses', icon: MapPin },
    { value: 'security', label: 'Security', icon: Lock },
    { value: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-brand-text flex items-center gap-3">
        <User className="h-6 w-6 text-brand-cyan" />
        Profile & Settings
      </h1>

      <GlassCard className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-brand-green to-brand-cyan flex items-center justify-center text-2xl font-black text-brand-bg">
          {user.name?.charAt(0)?.toUpperCase()}
        </div>
        <div>
          <h2 className="text-lg font-bold text-brand-text">{user.name}</h2>
          <p className="text-sm text-brand-muted">{user.email}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge color="cyan">{user.role}</Badge>
            {user.isVerified && <Badge color="green">Verified</Badge>}
            <Badge color="yellow" className="flex items-center gap-1">
              <Award className="h-3 w-3" /> {user.loyaltyPoints || 0} pts
            </Badge>
          </div>
        </div>
      </GlassCard>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'profile' && <ProfileTab user={user} updateUser={updateUser} />}
      {activeTab === 'loyalty' && <LoyaltyTab user={user} />}
      {activeTab === 'addresses' && <AddressesTab user={user} updateUser={updateUser} />}
      {activeTab === 'security' && <SecurityTab />}
      {activeTab === 'notifications' && <NotificationsTab user={user} updateUser={updateUser} />}
    </div>
  );
}

function ProfileTab({ user, updateUser }) {
  const [form, setForm] = useState({ name: user.name || '', phone: user.phone || '' });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const data = await authAPI.updateProfile(form);
      updateUser(data.data);
      showToast('Profile updated', 'success');
    } catch (err) {
      showToast(err.message || 'Update failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard className="space-y-4 max-w-lg">
      <Input label="Full Name" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} icon={User} />
      <Input label="Phone" value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} icon={Phone} />
      <Input label="Email" value={user.email} disabled icon={Mail} />
      <Button onClick={handleSave} loading={loading} icon={Save}>Save Changes</Button>
    </GlassCard>
  );
}

function LoyaltyTab({ user }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await loyaltyAPI.getHistory();
      setHistory(data.data || []);
    } catch (err) {
      console.error('Failed to load loyalty history', err);
    } finally {
      setLoading(false);
    }
  };

  const points = user.loyaltyPoints || 0;
  const cashValue = (points / 100).toFixed(2);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <GlassCard className="bg-gradient-to-br from-brand-card to-brand-yellow/5 border-brand-yellow/20 text-center py-8">
        <Award className="h-16 w-16 text-brand-yellow mx-auto mb-4 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
        <h2 className="text-3xl font-black text-brand-text mb-2">{points} Points</h2>
        <p className="text-brand-muted text-lg mb-6">Current Cash Value: <span className="font-bold text-brand-green">${cashValue}</span></p>

        <div className="inline-block bg-brand-bg/50 px-6 py-3 rounded-full border border-brand-border/50 text-sm">
          Earn <span className="font-bold text-brand-cyan">10 points</span> for every $1 spent!
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard className="flex flex-col h-full">
          <h3 className="font-bold text-brand-text mb-4 text-lg">How it works</h3>
          <ul className="space-y-3 text-brand-muted text-sm list-disc pl-5">
            <li>Points are added automatically when an order is completed.</li>
            <li>Every 100 points equals $1.00 in discount value.</li>
            <li>Apply your points during checkout to save money.</li>
            <li>Points never expire!</li>
          </ul>
        </GlassCard>

        <GlassCard className="flex flex-col h-full">
          <h3 className="font-bold text-brand-text mb-4 text-lg">Points History</h3>
          <div className="flex-1 overflow-y-auto max-h-[300px] space-y-3 pr-2">
            {loading ? (
              <div className="text-center text-brand-muted text-sm py-8">Loading history...</div>
            ) : history.length === 0 ? (
              <div className="text-center text-brand-muted text-sm py-8">No points history yet.</div>
            ) : (
              history.map(item => (
                <div key={item._id} className="flex justify-between items-center p-3 bg-brand-bg/50 rounded-xl border border-brand-border/50">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${item.type === 'earned' ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-red/10 text-brand-red'}`}>
                      {item.type === 'earned' ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-brand-text">{item.description || item.type}</p>
                      <p className="text-xs text-brand-muted flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" /> {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`font-black ${item.type === 'earned' ? 'text-brand-green' : 'text-brand-red'}`}>
                    {item.type === 'earned' ? '+' : ''}{item.points}
                  </span>
                </div>
              ))
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function AddressesTab({ user, updateUser }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ label: 'Home' });
  const [loading, setLoading] = useState(false);

  // Address fields matching checkout
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('CA');
  const [zipCode, setZipCode] = useState('');
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);

  // Auto-suggestion state
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);

  const US_STATES = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  ];

  const handleAddressLine1Change = (val) => {
    setAddressLine1(val);
    if (searchTimeout) clearTimeout(searchTimeout);

    if (val.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    setSuggestionsLoading(true);
    const to = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&addressdetails=1&limit=5`,
          { headers: { 'User-Agent': 'SapienceGlobalPoCDeliveryApp/1.0' } }
        );
        const data = await res.json();
        setSuggestions(data || []);
      } catch (err) {
        console.error('Nominatim search error:', err);
      } finally {
        setSuggestionsLoading(false);
      }
    }, 500);
    setSearchTimeout(to);
  };

  const handleSelectSuggestion = (suggestion) => {
    const parts = suggestion.display_name.split(',').map((p) => p.trim());
    const addr = suggestion.address || {};
    const road = addr.road || '';
    const houseNumber = addr.house_number || '';
    const line1 = `${houseNumber} ${road}`.trim() || parts.slice(0, 2).join(', ');

    const cityVal = addr.city || addr.town || addr.village || addr.suburb || '';
    const stateVal = (addr.state || '').substring(0, 2).toUpperCase() || 'NY';
    const postcodeVal = addr.postcode || '';

    setAddressLine1(line1);
    setCity(cityVal);
    setState(stateVal);
    setZipCode(postcodeVal.substring(0, 5));
    setLat(parseFloat(suggestion.lat));
    setLng(parseFloat(suggestion.lon));
    setSuggestions([]);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const compiledAddress = [addressLine1, addressLine2, city, state, zipCode].filter(Boolean).join(', ');
      const payload = {
        label: form.label,
        address: compiledAddress,
        lat: lat || 0,
        lng: lng || 0
      };
      const data = await authAPI.addAddress(payload);
      updateUser({ savedAddresses: data.data });
      setForm({ label: 'Home' });
      setAddressLine1(''); setAddressLine2(''); setCity(''); setZipCode('');
      setLat(null); setLng(null);
      setShowAdd(false);
      showToast('Address added', 'success');
    } catch (err) {
      showToast(err.message || 'Failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id) => {
    try {
      const data = await authAPI.removeAddress(id);
      updateUser({ savedAddresses: data.data });
      showToast('Address removed', 'info');
    } catch (err) {
      showToast(err.message || 'Failed', 'error');
    }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      {user.savedAddresses?.map(addr => (
        <GlassCard key={addr._id} className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-brand-text flex items-center gap-2">
              {addr.label}
              {addr.isDefault && <Badge color="green">Default</Badge>}
            </p>
            <p className="text-xs text-brand-muted mt-0.5">{addr.address}</p>
          </div>
          <button onClick={() => handleRemove(addr._id)} className="text-brand-red/60 hover:text-brand-red p-2">
            <Trash2 className="h-4 w-4" />
          </button>
        </GlassCard>
      ))}

      {!showAdd ? (
        <Button variant="secondary" onClick={() => setShowAdd(true)} icon={Plus}>Add New Address</Button>
      ) : (
        <GlassCard className="space-y-5 relative">
          {loading && (
            <div className="absolute inset-0 bg-brand-bg/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
              <Loader2 className="h-6 w-6 text-brand-cyan animate-spin" />
            </div>
          )}
          
          <div>
            <label className="block text-[13px] font-bold text-[#1a1a1a] dark:text-gray-200 mb-2">Save as</label>
            <div className="flex gap-2">
              {['Home', 'Work', 'Other'].map(lbl => (
                <button key={lbl} onClick={() => setForm(p => ({ ...p, label: lbl }))}
                  type="button"
                  className={`rounded-lg px-4 py-2 text-xs font-semibold border transition-all
                    ${form.label === lbl ? 'bg-brand-cyan/10 text-brand-cyan border-brand-cyan/30' : 'text-brand-muted border-brand-border hover:bg-brand-muted/5'}`}>
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSaveAddress} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 relative">
                <label className="block text-[13px] font-bold text-[#1a1a1a] dark:text-gray-200 mb-1.5">Address Line 1*</label>
                <div className="relative">
                  <input
                    type="text" 
                    required 
                    name="addressLine1"
                    autoComplete="off"
                    value={addressLine1}
                    onChange={(e) => handleAddressLine1Change(e.target.value)}
                    placeholder="House No., Street Name"
                    className="w-full rounded-xl border border-[#e5e7eb] bg-[#ffffff] text-[#1a1a1a] placeholder-[#9ca3af] px-4 py-3 text-sm focus:outline-none focus:border-[#7a0b10] focus:ring-1 focus:ring-[#7a0b10] transition-colors"
                  />
                  {suggestionsLoading && (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-4 h-4 text-[#6b7280] animate-spin" />
                    </div>
                  )}

                  {/* Autocomplete Suggestions Dropdown */}
                  {suggestions && suggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 rounded-xl border border-[#e5e7eb] bg-[#ffffff] shadow-xl z-[100] overflow-hidden max-h-[220px] overflow-y-auto ll-pop ll-soft-scroll">
                      <ul className="divide-y divide-[#e5e7eb]">
                        {suggestions.map((s, idx) => (
                          <li key={idx}>
                            <button
                              type="button"
                              onClick={() => handleSelectSuggestion(s)}
                              className="w-full text-left px-4 py-3.5 text-xs font-bold hover:bg-[#f9fafb] text-[#1a1a1a] transition-colors block truncate focus:outline-none focus:bg-[#f9fafb]"
                            >
                              {s.display_name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-bold text-[#1a1a1a] dark:text-gray-200 mb-1.5">Address Line 2</label>
                <input
                  type="text" 
                  name="addressLine2"
                  value={addressLine2} 
                  onChange={(e) => setAddressLine2(e.target.value)}
                  placeholder="Apt, Suite, etc. (Optional)"
                  className="w-full rounded-xl border border-[#e5e7eb] bg-[#ffffff] text-[#1a1a1a] placeholder-[#9ca3af] px-4 py-3 text-sm focus:outline-none focus:border-[#7a0b10] focus:ring-1 focus:ring-[#7a0b10] transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[13px] font-bold text-[#1a1a1a] dark:text-gray-200 mb-1.5">City*</label>
                <input
                  type="text" 
                  required 
                  name="city"
                  value={city} 
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Enter city"
                  className="w-full rounded-xl border border-[#e5e7eb] bg-[#ffffff] text-[#1a1a1a] placeholder-[#9ca3af] px-4 py-3 text-sm focus:outline-none focus:border-[#7a0b10] focus:ring-1 focus:ring-[#7a0b10] transition-colors"
                />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-[#1a1a1a] dark:text-gray-200 mb-1.5">State*</label>
                <select
                  value={state} 
                  name="state"
                  onChange={(e) => setState(e.target.value)}
                  className="w-full rounded-xl border border-[#e5e7eb] bg-[#ffffff] text-[#1a1a1a] px-4 py-3 text-sm focus:outline-none focus:border-[#7a0b10] focus:ring-1 focus:ring-[#7a0b10] transition-colors appearance-none"
                >
                  {US_STATES.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[13px] font-bold text-[#1a1a1a] dark:text-gray-200 mb-1.5">Zip Code*</label>
                <input
                  type="text" 
                  required 
                  name="zipCode"
                  value={zipCode} 
                  onChange={(e) => setZipCode(e.target.value)}
                  placeholder="Enter zip code"
                  className="w-full rounded-xl border border-[#e5e7eb] bg-[#ffffff] text-[#1a1a1a] placeholder-[#9ca3af] px-4 py-3 text-sm focus:outline-none focus:border-[#7a0b10] focus:ring-1 focus:ring-[#7a0b10] transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" className="flex-1 bg-[#4a0b0d] hover:bg-[#340708] text-white">Save Address</Button>
              <Button type="button" variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </form>
        </GlassCard>
      )}
    </div>
  );
}

function SecurityTab() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '' });
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!form.currentPassword || !form.newPassword) { showToast('Fill both fields', 'warning'); return; }
    setLoading(true);
    try {
      await authAPI.changePassword(form);
      showToast('Password changed', 'success');
      setForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      showToast(err.message || 'Failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard className="space-y-4 max-w-lg">
      <Input type="password" label="Current Password" value={form.currentPassword} onChange={(e) => setForm(p => ({ ...p, currentPassword: e.target.value }))} icon={Lock} />
      <Input type="password" label="New Password" value={form.newPassword} onChange={(e) => setForm(p => ({ ...p, newPassword: e.target.value }))} icon={Lock} />
      <p className="text-[10px] text-brand-muted">Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char</p>
      <Button onClick={handleChangePassword} loading={loading} icon={Shield}>Change Password</Button>
    </GlassCard>
  );
}

function NotificationsTab({ user, updateUser }) {
  const prefs = user.notificationPreferences || {};
  const [form, setForm] = useState({
    email: prefs.email !== false,
    push: prefs.push !== false,
    sms: prefs.sms || false,
    marketing: prefs.marketing !== false,
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const data = await authAPI.updateProfile({ notificationPreferences: form });
      updateUser(data.data);
      showToast('Preferences updated', 'success');
    } catch (err) {
      showToast(err.message || 'Failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard className="space-y-4 max-w-lg">
      {[
        { key: 'email', label: 'Email Notifications', desc: 'Order updates and receipts' },
        { key: 'push', label: 'Push Notifications', desc: 'Real-time delivery updates' },
        { key: 'sms', label: 'SMS Notifications', desc: 'Text alerts for orders' },
        { key: 'marketing', label: 'Marketing', desc: 'Promotions and special offers' },
      ].map(opt => (
        <div key={opt.key} className="flex items-center justify-between p-3 rounded-xl bg-brand-bg/40 border border-brand-border">
          <div>
            <p className="text-sm font-bold text-brand-text">{opt.label}</p>
            <p className="text-xs text-brand-muted">{opt.desc}</p>
          </div>
          <button
            onClick={() => setForm(p => ({ ...p, [opt.key]: !p[opt.key] }))}
            className={`relative w-11 h-6 rounded-full transition-colors ${form[opt.key] ? 'bg-brand-green' : 'bg-brand-card border border-brand-border'}`}
          >
            <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${form[opt.key] ? 'translate-x-5' : ''}`} />
          </button>
        </div>
      ))}
      <Button onClick={handleSave} loading={loading} icon={Save}>Save Preferences</Button>
    </GlassCard>
  );
}