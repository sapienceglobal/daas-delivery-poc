'use client';

import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { 
  Store, 
  MapPin, 
  Phone, 
  ArrowLeft, 
  Clock, 
  User, 
  TrendingUp, 
  Check, 
  Loader2, 
  ExternalLink,
  Smartphone,
  ShieldCheck,
  Package,
  Plus,
  Trash2,
  Edit3,
  Volume2,
  VolumeX,
  LogOut
} from 'lucide-react';

const getApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const port = window.location.port;
    let backendPort = '5000';
    if (port && !isNaN(port)) {
      backendPort = (parseInt(port, 10) + 2000).toString();
    } else if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      backendPort = '5001';
    }
    return `${window.location.protocol}//${hostname}:${backendPort}`;
  }
  return 'http://localhost:5000';
};

const API_BASE_URL = getApiBaseUrl();

export default function RestaurantDashboard() {
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem('marketplace_token');
    localStorage.removeItem('marketplace_user');
    window.location.href = '/';
  };
  
  // Restaurant Profile Info
  const [restaurant, setRestaurant] = useState(null);
  const [loadingRestaurant, setLoadingRestaurant] = useState(true);

  // Registration Form States (if no restaurant linked)
  const [regName, setRegName] = useState('');
  const [regCuisine, setRegCuisine] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regBanner, setRegBanner] = useState('');
  const [regLng, setRegLng] = useState('-122.4194');
  const [regLat, setRegLat] = useState('37.7749');
  
  const [submittingReg, setSubmittingReg] = useState(false);
  const [resolvingAddress, setResolvingAddress] = useState(false);

  // Orders State
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  // Tab & Audio Notification State
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'menu'
  const [audioUserInteracted, setAudioUserInteracted] = useState(false);

  // Menu Form & Editing States
  const [menuItemName, setMenuItemName] = useState('');
  const [menuItemDescription, setMenuItemDescription] = useState('');
  const [menuItemPrice, setMenuItemPrice] = useState('');
  const [menuItemCategory, setMenuItemCategory] = useState('Mains');
  const [editingMenuItemId, setEditingMenuItemId] = useState(null);
  const [savingMenuItem, setSavingMenuItem] = useState(false);

  // Store Settings (Hours)
  const [storeOpenTime, setStoreOpenTime] = useState('09:00');
  const [storeCloseTime, setStoreCloseTime] = useState('22:00');
  const [savingSettings, setSavingSettings] = useState(false);

  // Load auth user information
  useEffect(() => {
    const storedToken = localStorage.getItem('marketplace_token');
    const storedUser = localStorage.getItem('marketplace_user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      fetchRestaurantProfile(storedToken);
    } else {
      setLoading(false);
      setLoadingRestaurant(false);
    }
  }, []);

  // WebSocket (Socket.io) real-time orders connection
  useEffect(() => {
    if (!token || !restaurant?._id) return;

    // Establish Socket.io connection
    const socket = io(API_BASE_URL, {
      withCredentials: true,
      transports: ['websocket']
    });

    socket.on('connect', () => {
      console.log('[Socket.io] Connected to server');
      socket.emit('join_restaurant', restaurant._id);
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket.io] Connection error:', err.message);
    });

    socket.on('error', (err) => {
      console.error('[Socket.io] Socket error:', err);
    });

    socket.on('NEW_ORDER', (newOrder) => {
      console.log('[Socket.io] Received NEW_ORDER:', newOrder);
      setOrders((prevOrders) => {
        // Prevent duplicates
        if (prevOrders.some(o => o._id === newOrder._id)) return prevOrders;
        // Play chime alert
        playChime();
        return [newOrder, ...prevOrders];
      });
    });

    socket.on('ORDER_UPDATED', (updatedOrder) => {
      console.log('[Socket.io] Received ORDER_UPDATED:', updatedOrder);
      setOrders((prevOrders) => 
        prevOrders.map(o => o._id === updatedOrder._id ? updatedOrder : o)
      );
    });

    // Initial load fetch
    fetchOrders(token);

    return () => {
      socket.disconnect();
    };
  }, [token, restaurant?._id]);

  // Synth chime for incoming orders
  const playChime = () => {
    if (typeof window === 'undefined') return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const playNote = (freq, time, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        
        gain.gain.setValueAtTime(0.08, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + duration);
      };
      
      const now = ctx.currentTime;
      playNote(523.25, now, 0.4); // C5
      playNote(659.25, now + 0.15, 0.5); // E5
    } catch (err) {
      console.warn("Audio Context playback failed/blocked:", err);
    }
  };

  // Detect user interaction to enable AudioContext
  useEffect(() => {
    const handleInteraction = () => {
      setAudioUserInteracted(true);
      window.removeEventListener('click', handleInteraction);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('click', handleInteraction);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('click', handleInteraction);
      }
    };
  }, []);

  // Trigger audio loop when pending orders exist
  useEffect(() => {
    if (!audioUserInteracted || !orders || orders.length === 0) return;

    const hasPending = orders.some(o => o.deliveryStatus === 'pending');
    if (hasPending) {
      playChime();
      const interval = setInterval(() => {
        playChime();
      }, 3500);
      return () => clearInterval(interval);
    }
  }, [orders, audioUserInteracted]);

  const fetchRestaurantProfile = async (authToken) => {
    setLoadingRestaurant(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/restaurants/merchant/my`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRestaurant(data.restaurant);
        setStoreOpenTime(data.restaurant.openTime || '09:00');
        setStoreCloseTime(data.restaurant.closeTime || '22:00');
      } else {
        setRestaurant(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingRestaurant(false);
    }
  };

  const fetchOrders = async (authToken) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/merchant/all`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error('Error fetching merchant orders:', err);
    }
  };

  const handleResolveAddress = async () => {
    if (!regAddress.trim()) {
      alert("Please enter a street address first.");
      return;
    }
    setResolvingAddress(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(regAddress)}&countrycodes=us&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        setRegLng(data[0].lon);
        setRegLat(data[0].lat);
        alert(`Resolved Address to GPS coordinates:\nLongitude: ${data[0].lon}\nLatitude: ${data[0].lat}`);
      } else {
        alert("Geocode lookup failed. Using default SF coordinates.");
      }
    } catch (err) {
      console.error(err);
      alert("Error contacting Nominatim service.");
    } finally {
      setResolvingAddress(false);
    }
  };

  const handleRegisterRestaurant = async (e) => {
    e.preventDefault();
    setSubmittingReg(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/restaurants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: regName,
          cuisine: regCuisine,
          address: regAddress,
          phone: regPhone,
          banner: regBanner || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
          coordinates: [parseFloat(regLng), parseFloat(regLat)]
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message || 'Restaurant registered!');
        // Update user object in localStorage to reflect new restaurantId
        const updatedUser = { ...user, restaurantId: data.restaurant._id };
        setUser(updatedUser);
        localStorage.setItem('marketplace_user', JSON.stringify(updatedUser));
        setRestaurant(data.restaurant);
      } else {
        alert(data.message || 'Registration failed.');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to backend.');
    } finally {
      setSubmittingReg(false);
    }
  };

  const handleUpdatePrepStatus = async (orderId, prepStatus) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/prep`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: prepStatus })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Refresh local orders list
        fetchOrders(token);
      } else {
        alert(data.message || 'Failed to update order status.');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating order prep status.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleAddMenuItem = async (e) => {
    e.preventDefault();
    if (!menuItemName || !menuItemDescription || !menuItemPrice || !menuItemCategory) {
      alert("Please fill in all menu fields.");
      return;
    }
    setSavingMenuItem(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/restaurants/${restaurant._id}/menu`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: menuItemName,
          description: menuItemDescription,
          price: parseFloat(menuItemPrice),
          category: menuItemCategory
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRestaurant(data.restaurant);
        setMenuItemName('');
        setMenuItemDescription('');
        setMenuItemPrice('');
        setMenuItemCategory('Mains');
        alert("Menu item added successfully!");
      } else {
        alert(data.message || 'Failed to add item.');
      }
    } catch (err) {
      console.error(err);
      alert('Error adding menu item.');
    } finally {
      setSavingMenuItem(false);
    }
  };

  const handleUpdateMenuItem = async (itemId) => {
    if (!menuItemName || !menuItemDescription || !menuItemPrice || !menuItemCategory) {
      alert("Please fill in all menu fields.");
      return;
    }
    setSavingMenuItem(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/restaurants/${restaurant._id}/menu/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: menuItemName,
          description: menuItemDescription,
          price: parseFloat(menuItemPrice),
          category: menuItemCategory
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRestaurant(data.restaurant);
        setEditingMenuItemId(null);
        setMenuItemName('');
        setMenuItemDescription('');
        setMenuItemPrice('');
        setMenuItemCategory('Mains');
        alert("Menu item updated successfully!");
      } else {
        alert(data.message || 'Failed to update item.');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating menu item.');
    } finally {
      setSavingMenuItem(false);
    }
  };

  const handleDeleteMenuItem = async (itemId) => {
    if (!confirm("Are you sure you want to delete this menu item?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/restaurants/${restaurant._id}/menu/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRestaurant(data.restaurant);
      } else {
        alert(data.message || 'Failed to delete item.');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting menu item.');
    }
  };

  const handleToggleItemAvailability = async (itemId, isAvailable) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/restaurants/${restaurant._id}/menu/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isAvailable })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRestaurant(data.restaurant);
      } else {
        alert(data.message || 'Failed to update item availability.');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating item availability.');
    }
  };

  const handleUpdateStoreSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/restaurants/${restaurant._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          openTime: storeOpenTime,
          closeTime: storeCloseTime
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRestaurant(data.restaurant);
        alert('Operating hours updated successfully!');
      } else {
        alert(data.message || 'Failed to update store settings.');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating store settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading || loadingRestaurant) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center flex-col gap-4 text-white">
        <Loader2 className="h-10 w-10 text-brand-cyan animate-spin" />
        <p className="text-xs uppercase tracking-widest font-mono text-brand-muted">Loading merchant portal...</p>
      </div>
    );
  }

  // Enforce merchant roles
  if (!user || (user.role !== 'merchant' && user.role !== 'admin')) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center flex-col gap-4 text-white p-6 text-center">
        <ShieldCheck className="h-16 w-16 text-brand-red animate-pulse" />
        <h1 className="text-xl font-black">Merchant Access Required</h1>
        <p className="text-sm text-brand-muted max-w-sm">
          Please log in as a Restaurant Partner (Merchant) to access this dashboard.
        </p>
        <a href="/" className="px-5 py-2.5 rounded-xl border border-brand-border bg-brand-card text-xs hover:border-brand-cyan transition-all text-white font-extrabold flex items-center gap-1.5 mt-2">
          <ArrowLeft size={14} /> Back to Home
        </a>
      </div>
    );
  }

  // If merchant has no restaurant linked, show registration
  if (!restaurant) {
    return (
      <div className="min-h-screen bg-brand-bg text-brand-text font-sans p-6 max-w-lg mx-auto space-y-6">
        <header className="flex justify-between items-center bg-brand-card/40 border border-brand-border rounded-3xl p-5 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <Store className="text-brand-cyan h-6 w-6" />
            <h1 className="text-md font-black text-white">Register Store Profile</h1>
          </div>
          <a href="/" className="px-3.5 py-1.5 rounded-lg border border-brand-border bg-brand-bg text-xs hover:text-white transition-all text-brand-muted font-bold">
            Cancel
          </a>
        </header>

        <section className="bg-brand-card/35 border border-brand-border rounded-3xl p-6 space-y-4">
          <p className="text-xs text-brand-muted leading-relaxed">
            Link your merchant account to a physical store location. Once registered, customers can browse your menu and order DoorDash delivery!
          </p>

          <form onSubmit={handleRegisterRestaurant} className="space-y-4 text-xs">
            <div className="flex flex-col gap-1">
              <label className="font-bold text-brand-muted">RESTAUANT / STORE NAME</label>
              <input
                type="text"
                required
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="Golden Wok"
                className="w-full bg-brand-bg/85 rounded-xl border border-brand-border px-3.5 py-2.5 outline-none text-white focus:border-brand-cyan"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-bold text-brand-muted">CUISINE CATEGORY</label>
              <input
                type="text"
                required
                value={regCuisine}
                onChange={(e) => setRegCuisine(e.target.value)}
                placeholder="Chinese, Noodles, Bowls"
                className="w-full bg-brand-bg/85 rounded-xl border border-brand-border px-3.5 py-2.5 outline-none text-white focus:border-brand-cyan"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-bold text-brand-muted">STORE PHONE NUMBER</label>
              <input
                type="text"
                required
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                placeholder="+16505550177"
                className="w-full bg-brand-bg/85 rounded-xl border border-brand-border px-3.5 py-2.5 outline-none text-white focus:border-brand-cyan font-mono"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-bold text-brand-muted">STORE BANNER IMAGE URL</label>
              <input
                type="text"
                value={regBanner}
                onChange={(e) => setRegBanner(e.target.value)}
                placeholder="https://unsplash.com/..."
                className="w-full bg-brand-bg/85 rounded-xl border border-brand-border px-3.5 py-2.5 outline-none text-white focus:border-brand-cyan font-mono"
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <label className="font-bold text-brand-muted">STREET ADDRESS (US)</label>
                <button
                  type="button"
                  onClick={handleResolveAddress}
                  disabled={resolvingAddress || !regAddress}
                  className="text-[10px] text-brand-cyan hover:text-white font-bold flex items-center gap-1 transition-all disabled:opacity-40 cursor-pointer"
                >
                  <MapPin size={10} />
                  {resolvingAddress ? 'Geocoding...' : 'Resolve GPS'}
                </button>
              </div>
              <textarea
                rows={2}
                required
                value={regAddress}
                onChange={(e) => setRegAddress(e.target.value)}
                placeholder="e.g. 100 Sutter St, San Francisco, CA"
                className="w-full bg-brand-bg/85 rounded-xl border border-brand-border px-3.5 py-2.5 outline-none text-white focus:border-brand-cyan resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-[10px] text-brand-muted">LONGITUDE</label>
                <input
                  type="text"
                  required
                  value={regLng}
                  onChange={(e) => setRegLng(e.target.value)}
                  className="w-full bg-brand-bg/50 rounded-xl border border-brand-border px-3 py-2 outline-none text-brand-muted focus:border-brand-cyan font-mono text-center"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-bold text-[10px] text-brand-muted">LATITUDE</label>
                <input
                  type="text"
                  required
                  value={regLat}
                  onChange={(e) => setRegLat(e.target.value)}
                  className="w-full bg-brand-bg/50 rounded-xl border border-brand-border px-3 py-2 outline-none text-brand-muted focus:border-brand-cyan font-mono text-center"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submittingReg}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-blue hover:from-brand-blue hover:to-brand-cyan text-brand-bg text-xs font-black uppercase tracking-wider shadow-lg active:scale-95 transition-all cursor-pointer text-center mt-2 flex justify-center items-center gap-1"
            >
              {submittingReg ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Creating store...
                </>
              ) : (
                <>
                  <Plus size={14} /> Register Store
                </>
              )}
            </button>
          </form>
        </section>
      </div>
    );
  }

  // Approved store dashboard
  return (
    <div className="min-h-screen bg-brand-bg text-brand-text font-sans p-6 max-w-6xl mx-auto space-y-8">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-brand-card/40 border border-brand-border rounded-3xl p-5 md:p-6 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl overflow-hidden border border-brand-border/60 shrink-0">
            <img src={restaurant.banner} alt={restaurant.name} className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-black text-white">{restaurant.name}</h1>
              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest font-mono border ${
                restaurant.status === 'approved' 
                  ? 'border-brand-green/30 bg-brand-green/5 text-brand-green'
                  : 'border-brand-yellow/30 bg-brand-yellow/5 text-brand-yellow'
              }`}>
                {restaurant.status}
              </span>
            </div>
            <p className="text-xs text-brand-muted leading-relaxed">
              📍 {restaurant.address} • {restaurant.cuisine}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          {user.role === 'admin' && (
            <a href="/admin" className="px-3.5 py-2 rounded-xl border border-brand-cyan/20 bg-brand-cyan/5 hover:bg-brand-cyan/15 text-xs text-brand-cyan font-black transition-all">
              Admin Panel
            </a>
          )}
          <a href="/" className="px-3.5 py-2 rounded-xl border border-brand-border bg-brand-bg hover:border-brand-cyan text-xs text-brand-muted hover:text-white transition-all font-black flex items-center gap-1">
            <ArrowLeft size={13} /> Home Page
          </a>
          <button 
            onClick={handleLogout}
            className="px-3.5 py-2 rounded-xl border border-brand-red/30 bg-brand-red/5 hover:bg-brand-red/10 text-xs text-brand-red font-black transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut size={13} /> Logout
          </button>
        </div>
      </header>

      {/* Tabs Switcher */}
      <div className="flex gap-4 border-b border-brand-border pb-1">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'orders' 
              ? 'border-brand-cyan text-brand-cyan' 
              : 'border-transparent text-brand-muted hover:text-white'
          }`}
        >
          Active Orders & Dispatches
        </button>
        <button
          onClick={() => setActiveTab('menu')}
          className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'menu' 
              ? 'border-brand-cyan text-brand-cyan' 
              : 'border-transparent text-brand-muted hover:text-white'
          }`}
        >
          Menu Management
        </button>
      </div>

      {/* Unmute Notification Alert Banner */}
      {!audioUserInteracted && orders.some(o => o.deliveryStatus === 'pending') && (
        <div className="p-4 rounded-2xl bg-brand-cyan/10 border border-brand-cyan/30 flex items-center justify-between text-xs text-brand-cyan animate-pulse">
          <span className="font-bold flex items-center gap-2">
            <Volume2 className="h-4 w-4" /> Incoming orders waiting! Click anywhere on the dashboard to enable ring chime alerts.
          </span>
          <button 
            onClick={() => setAudioUserInteracted(true)}
            className="px-3 py-1 bg-brand-cyan text-brand-bg rounded-lg font-black uppercase text-[10px]"
          >
            Enable Audio
          </button>
        </div>
      )}

      {activeTab === 'menu' ? (
        <div className="grid gap-6 md:grid-cols-3">
          
          <div className="md:col-span-1 space-y-6">
            {/* Add / Edit Menu Item Form */}
            <div className="bg-brand-card/35 border border-brand-border rounded-3xl p-6 h-fit space-y-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-brand-cyan flex items-center gap-1.5 border-b border-brand-border/40 pb-3">
              <Plus size={14} />
              {editingMenuItemId ? 'Edit Menu Item' : 'Add Menu Item'}
            </h2>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (editingMenuItemId) {
                  handleUpdateMenuItem(editingMenuItemId);
                } else {
                  handleAddMenuItem(e);
                }
              }}
              className="space-y-4 text-xs"
            >
              <div className="flex flex-col gap-1">
                <label className="font-bold text-brand-muted">ITEM NAME</label>
                <input
                  type="text"
                  required
                  value={menuItemName}
                  onChange={(e) => setMenuItemName(e.target.value)}
                  placeholder="e.g. Garlic Naan"
                  className="w-full bg-brand-bg/85 rounded-xl border border-brand-border px-3.5 py-2.5 outline-none text-white focus:border-brand-cyan"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-brand-muted">PRICE (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={menuItemPrice}
                  onChange={(e) => setMenuItemPrice(e.target.value)}
                  placeholder="e.g. 3.99"
                  className="w-full bg-brand-bg/85 rounded-xl border border-brand-border px-3.5 py-2.5 outline-none text-white focus:border-brand-cyan font-mono"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-brand-muted">CATEGORY</label>
                <select
                  value={menuItemCategory}
                  onChange={(e) => setMenuItemCategory(e.target.value)}
                  className="w-full bg-brand-bg/85 rounded-xl border border-brand-border px-3.5 py-2.5 outline-none text-white focus:border-brand-cyan cursor-pointer"
                >
                  <option value="Mains">Mains</option>
                  <option value="Sides">Sides</option>
                  <option value="Drinks">Drinks</option>
                  <option value="Desserts">Desserts</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-brand-muted">DESCRIPTION</label>
                <textarea
                  rows={3}
                  required
                  value={menuItemDescription}
                  onChange={(e) => setMenuItemDescription(e.target.value)}
                  placeholder="e.g. Fresh flatbread brushed with garlic butter."
                  className="w-full bg-brand-bg/85 rounded-xl border border-brand-border px-3.5 py-2.5 outline-none text-white focus:border-brand-cyan resize-none text-xs"
                />
              </div>

              <div className="flex gap-2">
                {editingMenuItemId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMenuItemId(null);
                      setMenuItemName('');
                      setMenuItemDescription('');
                      setMenuItemPrice('');
                      setMenuItemCategory('Mains');
                    }}
                    className="flex-1 py-3 border border-brand-border text-brand-muted hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={savingMenuItem}
                  className="flex-1 py-3 bg-brand-cyan text-brand-bg rounded-xl font-black text-xs uppercase tracking-wider transition-all hover:bg-brand-cyan/90 active:scale-95 disabled:opacity-50"
                >
                  {savingMenuItem ? 'Saving...' : editingMenuItemId ? 'Update' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>

          {/* Operating Hours Settings */}
          <div className="bg-brand-card/35 border border-brand-border rounded-3xl p-6 h-fit space-y-4 animate-fade-in">
            <h2 className="text-xs font-black uppercase tracking-wider text-brand-cyan flex items-center gap-1.5 border-b border-brand-border/40 pb-3">
              <Clock size={14} />
              Operating Hours
            </h2>

            <form onSubmit={handleUpdateStoreSettings} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-brand-muted">OPEN TIME</label>
                  <input
                    type="text"
                    required
                    value={storeOpenTime}
                    onChange={(e) => setStoreOpenTime(e.target.value)}
                    placeholder="09:00"
                    className="w-full bg-brand-bg/85 rounded-xl border border-brand-border px-3.5 py-2.5 outline-none text-white focus:border-brand-cyan text-center font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-brand-muted">CLOSE TIME</label>
                  <input
                    type="text"
                    required
                    value={storeCloseTime}
                    onChange={(e) => setStoreCloseTime(e.target.value)}
                    placeholder="22:00"
                    className="w-full bg-brand-bg/85 rounded-xl border border-brand-border px-3.5 py-2.5 outline-none text-white focus:border-brand-cyan text-center font-mono"
                  />
                </div>
              </div>
              <span className="text-[9px] text-brand-muted block">Use 24-hour HH:MM format (e.g. 09:00 or 22:00)</span>

              <button
                type="submit"
                disabled={savingSettings}
                className="w-full py-2.5 bg-brand-cyan text-brand-bg rounded-xl font-black text-[10px] uppercase tracking-wider transition-all hover:bg-brand-cyan/90 active:scale-95 disabled:opacity-50"
              >
                {savingSettings ? 'Saving Settings...' : 'Save Operating Hours'}
              </button>
            </form>
          </div>
        </div>

          {/* Current Menu List */}
          <div className="md:col-span-2 bg-brand-card/35 border border-brand-border rounded-3xl p-6 space-y-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-brand-cyan border-b border-brand-border/40 pb-3">
              Current Restaurant Menu ({restaurant.menu ? restaurant.menu.length : 0} items)
            </h2>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {restaurant.menu && restaurant.menu.length > 0 ? (
                ['Mains', 'Sides', 'Drinks', 'Desserts'].map(cat => {
                  const catItems = restaurant.menu.filter(item => item.category === cat);
                  if (catItems.length === 0) return null;
                  return (
                    <div key={cat} className="space-y-2">
                      <h3 className="text-[10px] font-black text-brand-muted uppercase tracking-widest font-mono border-b border-brand-border/20 pb-1">{cat}</h3>
                      <div className="grid gap-3">
                        {catItems.map((item) => (
                          <div 
                            key={item._id}
                            className="p-4 rounded-2xl bg-brand-bg/40 border border-brand-border/50 flex justify-between items-center gap-4 hover:border-brand-cyan/10 transition-all text-xs"
                          >
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                <strong className="text-white text-xs font-bold">{item.name}</strong>
                                <span className="text-brand-cyan font-bold font-mono">${item.price.toFixed(2)}</span>
                                {item.isAvailable === false && (
                                  <span className="text-[8px] bg-brand-red/10 border border-brand-red/30 text-brand-red font-mono font-bold px-1 rounded">
                                    Out of Stock
                                  </span>
                                )}
                              </div>
                              <p className="text-brand-muted text-[11px] leading-relaxed">{item.description}</p>
                            </div>

                            <div className="flex items-center gap-4 shrink-0">
                              {/* Availability Switch */}
                              <div className="flex items-center gap-1.5">
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    checked={item.isAvailable !== false} 
                                    onChange={(e) => handleToggleItemAvailability(item._id, e.target.checked)}
                                    className="sr-only peer"
                                  />
                                  <div className="w-8 h-4 bg-brand-bg rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-brand-muted peer-checked:after:bg-brand-cyan after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-brand-cyan/20 border border-brand-border"></div>
                                </label>
                                <span className="text-[9px] text-brand-muted uppercase font-bold tracking-wider font-mono">
                                  {item.isAvailable !== false ? 'In Stock' : 'OOS'}
                                </span>
                              </div>
                            </div>

                            <div className="flex gap-1 shrink-0">
                              <button
                                onClick={() => {
                                  setEditingMenuItemId(item._id);
                                  setMenuItemName(item.name);
                                  setMenuItemDescription(item.description);
                                  setMenuItemPrice(item.price.toString());
                                  setMenuItemCategory(item.category || 'Mains');
                                }}
                                className="h-8 w-8 rounded-xl border border-brand-border/60 text-brand-muted hover:text-brand-cyan hover:border-brand-cyan flex items-center justify-center transition-all cursor-pointer"
                                title="Edit Item"
                              >
                                <Edit3 size={13} />
                              </button>
                              <button
                                onClick={() => handleDeleteMenuItem(item._id)}
                                className="h-8 w-8 rounded-xl border border-brand-border/60 text-brand-muted hover:text-brand-red hover:border-brand-red flex items-center justify-center transition-all cursor-pointer"
                                title="Delete Item"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center italic text-brand-muted text-xs py-10">No items on the menu yet. Create your first item on the left!</p>
              )}
            </div>
          </div>
          
        </div>
      ) : (
        /* Orders Grid */
        <div className="grid gap-6 md:grid-cols-2">
          
          {/* Incoming & Active Preparing Orders */}
          <section className="bg-brand-card/35 border border-brand-border rounded-3xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-brand-border/40 pb-3">
              <h2 className="text-xs font-black uppercase tracking-wider text-brand-cyan flex items-center gap-1.5">
                <Package size={16} /> Active Orders
              </h2>
              <span className="bg-brand-cyan/15 border border-brand-cyan/30 text-brand-cyan text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                {orders.filter(o => o.deliveryStatus !== 'delivered' && o.deliveryStatus !== 'cancelled' && o.deliveryStatus !== 'failed').length} Active
              </span>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {orders.filter(o => o.deliveryStatus !== 'delivered' && o.deliveryStatus !== 'cancelled' && o.deliveryStatus !== 'failed').map((order) => (
                <div 
                  key={order._id}
                  className="p-4 rounded-2xl bg-brand-bg/40 border border-brand-border space-y-3.5 hover:border-brand-cyan/20 transition-all flex flex-col justify-between"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-black text-white text-xs">Order #{order.externalDeliveryId}</h3>
                      <p className="text-[10px] text-brand-muted mt-0.5">Placed by: {order.customerName}</p>
                    </div>
                    <span className={`text-[8px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider font-mono ${
                      order.deliveryStatus === 'pending'
                        ? 'border-brand-yellow/30 bg-brand-yellow/5 text-brand-yellow'
                        : 'border-brand-cyan/30 bg-brand-cyan/5 text-brand-cyan animate-pulse'
                    }`}>
                      {order.deliveryStatus === 'pending' ? 'Unaccepted' : order.deliveryStatus}
                    </span>
                  </div>

                  <div className="border-t border-brand-border/40 pt-2.5">
                    <p className="text-[11px] text-white font-mono">🍔 {order.productName}</p>
                    <p className="text-[10px] text-brand-muted leading-relaxed mt-1">
                      📍 Drop-off: {order.address}
                    </p>
                  </div>

                  {/* Status Transitions */}
                  <div className="flex gap-2 justify-end pt-1">
                    {order.deliveryStatus === 'pending' ? (
                      <button
                        onClick={() => handleUpdatePrepStatus(order._id, 'accepted')}
                        disabled={updatingOrderId === order._id}
                        className="px-3.5 py-2 bg-brand-yellow text-brand-bg rounded-xl font-black text-[10px] uppercase tracking-wider transition-all hover:bg-brand-yellow/90 active:scale-95 flex items-center gap-1 cursor-pointer"
                      >
                        {updatingOrderId === order._id ? <Loader2 size={10} className="animate-spin" /> : <Clock size={10} />}
                        Accept & Prepare
                      </button>
                    ) : order.deliveryStatus === 'processing' && !order.statusUpdates.some(s => s.description.includes('complete')) ? (
                      <button
                        onClick={() => handleUpdatePrepStatus(order._id, 'ready')}
                        disabled={updatingOrderId === order._id}
                        className="px-3.5 py-2 bg-brand-green text-brand-bg rounded-xl font-black text-[10px] uppercase tracking-wider transition-all hover:bg-brand-green/90 active:scale-95 flex items-center gap-1 cursor-pointer"
                      >
                        {updatingOrderId === order._id ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}
                        Mark Ready (Call Dasher)
                      </button>
                    ) : (
                      <div className="text-[10px] text-brand-green font-bold flex items-center gap-1 py-1 px-2.5 bg-brand-green/10 border border-brand-green/30 rounded-xl">
                        <Check size={10} /> Food Ready / Dasher Dispatched
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {orders.filter(o => o.deliveryStatus !== 'delivered' && o.deliveryStatus !== 'cancelled' && o.deliveryStatus !== 'failed').length === 0 && (
                <p className="text-center italic text-brand-muted text-xs py-10">No active delivery orders.</p>
              )}
            </div>
          </section>

          {/* Courier Dispatch Monitor */}
          <section className="bg-brand-card/35 border border-brand-border rounded-3xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-brand-border/40 pb-3">
              <h2 className="text-xs font-black uppercase tracking-wider text-brand-cyan flex items-center gap-1.5">
                <Smartphone size={16} /> DoorDash Dispatch Tracker
              </h2>
              <span className="text-[9px] font-mono text-brand-muted uppercase">Drive API v2</span>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {orders.filter(o => o.deliveryId && o.deliveryStatus !== 'delivered').map((order) => (
                <div 
                  key={order._id}
                  className="p-4 rounded-2xl bg-brand-bg/40 border border-brand-border space-y-3 text-xs"
                >
                  <div className="flex justify-between items-center pb-2 border-b border-brand-border/40">
                    <div>
                      <strong className="text-white block">Order ID: #{order.externalDeliveryId}</strong>
                      <span className="text-[10px] text-brand-muted font-mono">DoorDash: {order.deliveryId}</span>
                    </div>
                    <a 
                      href={order.trackingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2 py-1 bg-brand-card border border-brand-border hover:border-brand-cyan hover:text-brand-cyan text-[10px] font-black rounded-lg transition-all flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      Track Dasher <ExternalLink size={10} />
                    </a>
                  </div>

                  <div className="space-y-2 text-[11px] text-brand-muted">
                    <div className="flex justify-between">
                      <span>Dasher Name:</span>
                      <strong className="text-white font-bold">{order.dasherName || 'Awaiting assignment'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Dasher Phone:</span>
                      <strong className="text-white font-mono">{order.dasherPhone || '—'}</strong>
                    </div>
                    {order.pickupTime && (
                      <div className="flex justify-between">
                        <span>Pickup ETA:</span>
                        <strong className="text-brand-cyan font-mono">{new Date(order.pickupTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</strong>
                      </div>
                    )}
                    {order.deliveryTime && (
                      <div className="flex justify-between">
                        <span>Delivery ETA:</span>
                        <strong className="text-brand-green font-mono">{new Date(order.deliveryTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</strong>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {orders.filter(o => o.deliveryId && o.deliveryStatus !== 'delivered').length === 0 && (
                <p className="text-center italic text-brand-muted text-xs py-10">No dispatches currently en-route.</p>
              )}
            </div>
          </section>

        </div>
      )}

    </div>
  );
}
