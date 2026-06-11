'use client';

import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  MapPin, 
  Phone, 
  ArrowLeft, 
  Plus, 
  Check, 
  X, 
  Loader2, 
  ExternalLink,
  Store,
  Users,
  Package,
  Clock,
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

export default function AdminDashboard() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('marketplace_token');
    localStorage.removeItem('marketplace_user');
    window.location.href = '/';
  };

  // Users management state
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [adminActiveTab, setAdminActiveTab] = useState('restaurants'); // 'restaurants' | 'users' | 'orders' | 'analytics'
  const [updatingUserRoleId, setUpdatingUserRoleId] = useState(null);

  // New Restaurant Form States
  const [name, setName] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [banner, setBanner] = useState('');
  const [lng, setLng] = useState('-122.4194');
  const [lat, setLat] = useState('37.7749');
  
  const [submitting, setSubmitting] = useState(false);
  const [resolvingAddress, setResolvingAddress] = useState(false);

  // Load token and verify admin role
  useEffect(() => {
    const storedToken = localStorage.getItem('marketplace_token');
    const storedUser = localStorage.getItem('marketplace_user');
    
    if (storedToken && storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setToken(storedToken);
      if (parsedUser.role === 'admin') {
        setIsAdmin(true);
        fetchRestaurants(storedToken);
        fetchUsers(storedToken);
        fetchOrders(storedToken);
      }
    }
    setLoading(false);
  }, []);

  const fetchRestaurants = async (authToken) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/restaurants/admin/all`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRestaurants(data.restaurants);
      }
    } catch (err) {
      console.error('Error fetching admin restaurants:', err);
    }
  };

  const fetchUsers = async (authToken) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/admin/users`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Error fetching admin users:', err);
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
      console.error('Error fetching admin orders:', err);
    }
  };

  const handleRefundOrder = async (orderId) => {
    if (!confirm("Are you sure you want to cancel and refund this order? This will cancel the DoorDash delivery and trigger a full billing refund.")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("Order refunded and cancelled successfully!");
        fetchOrders(token);
      } else {
        alert(data.message || "Failed to process refund.");
      }
    } catch (err) {
      console.error(err);
      alert("Error processing refund.");
    }
  };

  const getAnalyticsData = () => {
    const dailyData = {};
    const successOrders = orders.filter(o => o.deliveryStatus !== 'cancelled' && o.deliveryStatus !== 'failed');
    
    // Initialize past 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      dailyData[dateStr] = { count: 0, revenue: 0 };
    }

    successOrders.forEach(o => {
      const dateStr = new Date(o.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' });
      if (dailyData[dateStr] !== undefined) {
        dailyData[dateStr].count += 1;
        dailyData[dateStr].revenue += o.subtotal;
      }
    });

    return Object.keys(dailyData).map(date => ({
      date,
      count: dailyData[date].count,
      revenue: parseFloat(dailyData[date].revenue.toFixed(2))
    }));
  };

  const handleUpdateUserRole = async (userId, role, restaurantId) => {
    setUpdatingUserRoleId(userId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role, restaurantId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers(prev => 
          prev.map(u => u._id === userId ? { ...u, role: data.user.role, restaurantId: data.user.restaurantId } : u)
        );
        alert("User details updated successfully!");
      } else {
        alert(data.message || "Failed to update user.");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating user details.");
    } finally {
      setUpdatingUserRoleId(null);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/restaurants/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Update state list
        setRestaurants(prev => 
          prev.map(r => r._id === id ? { ...r, status } : r)
        );
      } else {
        alert(data.message || 'Status update failed.');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating status.');
    }
  };

  const handleResolveAddress = async () => {
    if (!address.trim()) {
      alert("Please enter a restaurant street address first.");
      return;
    }
    setResolvingAddress(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=us&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        setLng(data[0].lon);
        setLat(data[0].lat);
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

  const handleCreateRestaurant = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/restaurants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          cuisine,
          address,
          phone,
          banner: banner || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
          coordinates: [parseFloat(lng), parseFloat(lat)]
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("Restaurant added and auto-approved!");
        // Reset form
        setName('');
        setCuisine('');
        setAddress('');
        setPhone('');
        setBanner('');
        setLng('-122.4194');
        setLat('37.7749');
        fetchRestaurants(token);
      } else {
        alert(data.message || "Failed to create restaurant.");
      }
    } catch (err) {
      console.error(err);
      alert("Connection error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center flex-col gap-4 text-white">
        <Loader2 className="h-10 w-10 text-brand-cyan animate-spin" />
        <p className="text-xs uppercase tracking-widest font-mono text-brand-muted">Verifying Credentials...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center flex-col gap-4 text-white p-6 text-center">
        <ShieldCheck className="h-16 w-16 text-brand-red animate-pulse" />
        <h1 className="text-xl font-black">Access Denied</h1>
        <p className="text-sm text-brand-muted max-w-sm">
          This dashboard is restricted to administrators. Please log in with an admin role.
        </p>
        <a href="/" className="px-5 py-2.5 rounded-xl border border-brand-border bg-brand-card text-xs hover:border-brand-cyan transition-all text-white font-extrabold flex items-center gap-1.5 mt-2">
          <ArrowLeft size={14} /> Back to Home
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text font-sans p-6 max-w-6xl mx-auto space-y-8">
      
      {/* Header */}
      <header className="flex justify-between items-center bg-brand-card/40 border border-brand-border rounded-3xl p-5 md:p-6 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-brand-cyan h-8 w-8 animate-pulse" />
          <div>
            <h1 className="text-xl md:text-2xl font-black text-white">Admin Control Dashboard</h1>
            <p className="text-xs text-brand-muted">Approve store partnerships and registers new merchants</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a href="/" className="px-4 py-2 rounded-xl border border-brand-border bg-brand-bg hover:border-brand-cyan text-xs text-brand-muted hover:text-white transition-all font-black flex items-center gap-1">
            <ArrowLeft size={13} /> Home
          </a>
          <button 
            onClick={handleLogout}
            className="px-4 py-2 rounded-xl border border-brand-red/30 bg-brand-red/5 hover:bg-brand-red/10 text-xs text-brand-red font-black transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut size={13} /> Logout
          </button>
        </div>
      </header>

      {/* Tabs Selector */}
      <div className="flex gap-4 border-b border-brand-border pb-1 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setAdminActiveTab('restaurants')}
          className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
            adminActiveTab === 'restaurants' 
              ? 'border-brand-cyan text-brand-cyan' 
              : 'border-transparent text-brand-muted hover:text-white'
          }`}
        >
          Partners & Registrations
        </button>
        <button
          onClick={() => setAdminActiveTab('users')}
          className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
            adminActiveTab === 'users' 
              ? 'border-brand-cyan text-brand-cyan' 
              : 'border-transparent text-brand-muted hover:text-white'
          }`}
        >
          Users Management
        </button>
        <button
          onClick={() => setAdminActiveTab('orders')}
          className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
            adminActiveTab === 'orders' 
              ? 'border-brand-cyan text-brand-cyan' 
              : 'border-transparent text-brand-muted hover:text-white'
          }`}
        >
          Orders & Refunds
        </button>
        <button
          onClick={() => setAdminActiveTab('analytics')}
          className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
            adminActiveTab === 'analytics' 
              ? 'border-brand-cyan text-brand-cyan' 
              : 'border-transparent text-brand-muted hover:text-white'
          }`}
        >
          Platform Analytics
        </button>
      </div>

      {adminActiveTab === 'users' ? (
        <section className="bg-brand-card/35 border border-brand-border rounded-3xl p-6 space-y-4">
          <h2 className="text-xs font-black uppercase tracking-wider text-brand-cyan flex items-center gap-2">
            <Users size={16} /> Platform Registered Users
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-brand-border">
              <thead>
                <tr className="text-brand-muted font-bold">
                  <th className="py-3 px-2">Name</th>
                  <th className="py-3 px-2">Email</th>
                  <th className="py-3 px-2">Role</th>
                  <th className="py-3 px-2">Linked Restaurant</th>
                  <th className="py-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/40">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-brand-bg/20 transition-all">
                    <td className="py-3.5 px-2 font-black text-white">{u.name}</td>
                    <td className="py-3.5 px-2 text-brand-muted font-mono">{u.email}</td>
                    <td className="py-3.5 px-2 text-brand-muted">
                      <select
                        value={u.role}
                        onChange={(e) => handleUpdateUserRole(u._id, e.target.value, u.restaurantId)}
                        disabled={updatingUserRoleId === u._id}
                        className="bg-brand-bg text-white border border-brand-border rounded-xl px-2 py-1 outline-none text-xs cursor-pointer focus:border-brand-cyan"
                      >
                        <option value="customer">Customer</option>
                        <option value="merchant">Merchant</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-2 text-brand-muted">
                      {u.role === 'merchant' ? (
                        <select
                          value={u.restaurantId || ''}
                          onChange={(e) => handleUpdateUserRole(u._id, u.role, e.target.value || null)}
                          disabled={updatingUserRoleId === u._id}
                          className="bg-brand-bg text-white border border-brand-border rounded-xl px-2 py-1 outline-none text-xs cursor-pointer focus:border-brand-cyan max-w-[200px]"
                        >
                          <option value="">-- No Restaurant --</option>
                          {restaurants.map(r => (
                            <option key={r._id} value={r._id}>{r.name}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-[10px] text-brand-muted italic">N/A</span>
                      )}
                    </td>
                    <td className="py-3.5 px-2 text-right">
                      {updatingUserRoleId === u._id && (
                        <Loader2 className="h-4 w-4 animate-spin text-brand-cyan inline" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          
          {/* Approve/Reject Table */}
          <section className="lg:col-span-2 bg-brand-card/35 border border-brand-border rounded-3xl p-6 space-y-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-brand-cyan flex items-center gap-2">
              <Store size={16} /> Merchant Registrations
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-brand-border">
                <thead>
                  <tr className="text-brand-muted font-bold">
                    <th className="py-3 px-2">Store Name</th>
                    <th className="py-3 px-2">Cuisine</th>
                    <th className="py-3 px-2">Address</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/40">
                  {restaurants.map((rest) => (
                    <tr key={rest._id} className="hover:bg-brand-bg/20 transition-all">
                      <td className="py-3.5 px-2 font-black text-white">{rest.name}</td>
                      <td className="py-3.5 px-2 text-brand-muted">{rest.cuisine}</td>
                      <td className="py-3.5 px-2 text-brand-muted truncate max-w-[150px]" title={rest.address}>
                        {rest.address}
                      </td>
                      <td className="py-3.5 px-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase border ${
                          rest.status === 'approved' 
                            ? 'border-brand-green/30 bg-brand-green/5 text-brand-green'
                            : rest.status === 'rejected'
                              ? 'border-brand-red/30 bg-brand-red/5 text-brand-red'
                              : 'border-brand-yellow/30 bg-brand-yellow/5 text-brand-yellow'
                        }`}>
                          {rest.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 text-right space-x-1">
                        {rest.status !== 'approved' && (
                          <button
                            onClick={() => handleUpdateStatus(rest._id, 'approved')}
                            className="h-7 w-7 rounded-lg bg-brand-green/10 border border-brand-green/30 hover:bg-brand-green text-brand-green hover:text-brand-bg inline-flex items-center justify-center transition-all cursor-pointer"
                            title="Approve Store"
                          >
                            <Check size={13} />
                          </button>
                        )}
                        {rest.status !== 'rejected' && (
                          <button
                            onClick={() => handleUpdateStatus(rest._id, 'rejected')}
                            className="h-7 w-7 rounded-lg bg-brand-red/10 border border-brand-red/30 hover:bg-brand-red text-brand-red hover:text-brand-bg inline-flex items-center justify-center transition-all cursor-pointer"
                            title="Reject Store"
                          >
                            <X size={13} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {restaurants.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-10 text-center italic text-brand-muted">
                        No merchant stores found in database.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Add New Restaurant */}
          <section className="bg-brand-card/35 border border-brand-border rounded-3xl p-6 space-y-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-brand-cyan flex items-center gap-2">
              <Plus size={16} /> Register New Store
            </h2>

            <form onSubmit={handleCreateRestaurant} className="space-y-3.5 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-brand-muted">STORE NAME</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Burger Express"
                  className="w-full bg-brand-bg/85 rounded-xl border border-brand-border px-3.5 py-2.5 outline-none text-white focus:border-brand-cyan"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-brand-muted">CUISINE TYPES</label>
                <input
                  type="text"
                  required
                  value={cuisine}
                  onChange={(e) => setCuisine(e.target.value)}
                  placeholder="Burgers, Fries, Fast Food"
                  className="w-full bg-brand-bg/85 rounded-xl border border-brand-border px-3.5 py-2.5 outline-none text-white focus:border-brand-cyan"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-brand-muted">CONTACT PHONE</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+16505550188"
                  className="w-full bg-brand-bg/85 rounded-xl border border-brand-border px-3.5 py-2.5 outline-none text-white focus:border-brand-cyan font-mono font-bold"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-brand-muted">BANNER IMAGE URL</label>
                <input
                  type="text"
                  value={banner}
                  onChange={(e) => setBanner(e.target.value)}
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
                    disabled={resolvingAddress || !address}
                    className="text-[10px] text-brand-cyan hover:text-white font-bold flex items-center gap-1 transition-all disabled:opacity-40 cursor-pointer"
                  >
                    <MapPin size={10} />
                    {resolvingAddress ? 'Geocoding...' : 'Resolve GPS'}
                  </button>
                </div>
                <textarea
                  rows={2}
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 500 Market St, San Francisco, CA"
                  className="w-full bg-brand-bg/85 rounded-xl border border-brand-border px-3.5 py-2 outline-none text-white focus:border-brand-cyan resize-none text-xs"
                />
              </div>

              {/* Latitude and Longitude */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[10px] text-brand-muted">LONGITUDE</label>
                  <input
                    type="text"
                    required
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    className="w-full bg-brand-bg/50 rounded-xl border border-brand-border px-3 py-2 outline-none text-brand-muted focus:border-brand-cyan font-mono text-center"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[10px] text-brand-muted">LATITUDE</label>
                  <input
                    type="text"
                    required
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    className="w-full bg-brand-bg/50 rounded-xl border border-brand-border px-3 py-2 outline-none text-brand-muted focus:border-brand-cyan font-mono text-center"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-blue hover:from-brand-blue hover:to-brand-cyan text-brand-bg text-xs font-black uppercase tracking-wider shadow-lg active:scale-95 transition-all cursor-pointer text-center mt-2 flex justify-center items-center gap-1"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Creating Store...
                  </>
                ) : (
                  <>
                    <Plus size={14} /> Add approved Store
                  </>
                )}
              </button>
            </form>
          </section>

        </div>
      )}

      {adminActiveTab === 'orders' && (
        <section className="bg-brand-card/35 border border-brand-border rounded-3xl p-6 space-y-4 animate-fade-in">
          <h2 className="text-xs font-black uppercase tracking-wider text-brand-cyan flex items-center gap-2">
            <Package size={16} /> Platform Registered Orders & Disputes
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-brand-border">
              <thead>
                <tr className="text-brand-muted font-bold">
                  <th className="py-3 px-2">Order ID</th>
                  <th className="py-3 px-2">Customer / Restaurant</th>
                  <th className="py-3 px-2">Items</th>
                  <th className="py-3 px-2">Total Paid</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/40">
                {orders.map((o) => (
                  <tr key={o._id} className="hover:bg-brand-bg/20 transition-all">
                    <td className="py-3.5 px-2 font-mono font-bold text-white">{o.externalDeliveryId}</td>
                    <td className="py-3.5 px-2">
                      <div className="font-bold text-white">{o.customerName}</div>
                      <div className="text-[10px] text-brand-muted">Store: {o.restaurantName}</div>
                    </td>
                    <td className="py-3.5 px-2 text-brand-muted max-w-[200px] truncate" title={o.productName}>
                      {o.productName}
                    </td>
                    <td className="py-3.5 px-2 font-bold text-white">
                      ${(o.subtotal + o.tax + o.platformFee + (o.deliveryFee / 100)).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-2">
                      <div className="flex flex-col gap-1 items-start">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold font-mono uppercase border ${
                          o.deliveryStatus === 'delivered'
                            ? 'border-brand-green/30 bg-brand-green/5 text-brand-green'
                            : o.deliveryStatus === 'cancelled' || o.deliveryStatus === 'failed'
                              ? 'border-brand-red/30 bg-brand-red/5 text-brand-red'
                              : 'border-brand-cyan/30 bg-brand-cyan/5 text-brand-cyan animate-pulse'
                        }`}>
                          {o.deliveryStatus}
                        </span>
                        {o.refunded && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-brand-red/10 border border-brand-red/30 text-brand-red uppercase">
                            Refunded
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-2 text-right">
                      {o.deliveryStatus !== 'cancelled' && o.deliveryStatus !== 'failed' ? (
                        <button
                          onClick={() => handleRefundOrder(o._id)}
                          className="px-3 py-1.5 rounded-xl border border-brand-red/30 bg-brand-red/5 hover:bg-brand-red hover:text-brand-bg text-[10px] font-black uppercase tracking-wider transition-all"
                        >
                          Cancel & Refund
                        </button>
                      ) : (
                        <span className="text-[10px] text-brand-muted italic">No actions</span>
                      )}
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center italic text-brand-muted">
                      No platform orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {adminActiveTab === 'analytics' && (
        <section className="space-y-6 animate-fade-in">
          
          {/* Highlight Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="bg-brand-card/35 border border-brand-border rounded-3xl p-5 space-y-1">
              <span className="text-[9px] uppercase tracking-wider font-bold text-brand-muted">Total Food Sales</span>
              <p className="text-2xl font-black text-white">
                ${orders.filter(o => o.deliveryStatus !== 'cancelled' && o.deliveryStatus !== 'failed').reduce((sum, o) => sum + o.subtotal, 0).toFixed(2)}
              </p>
            </div>
            
            <div className="bg-brand-card/35 border border-brand-border rounded-3xl p-5 space-y-1">
              <span className="text-[9px] uppercase tracking-wider font-bold text-brand-muted">Commission (Platform Fees)</span>
              <p className="text-2xl font-black text-brand-cyan">
                ${(orders.filter(o => o.deliveryStatus !== 'cancelled' && o.deliveryStatus !== 'failed').length * 2.00).toFixed(2)}
              </p>
            </div>

            <div className="bg-brand-card/35 border border-brand-border rounded-3xl p-5 space-y-1">
              <span className="text-[9px] uppercase tracking-wider font-bold text-brand-muted">Courier Payouts</span>
              <p className="text-2xl font-black text-brand-green">
                ${(orders.filter(o => o.deliveryStatus !== 'cancelled' && o.deliveryStatus !== 'failed').reduce((sum, o) => sum + (o.deliveryFee / 100), 0)).toFixed(2)}
              </p>
            </div>

            <div className="bg-brand-card/35 border border-brand-border rounded-3xl p-5 space-y-1">
              <span className="text-[9px] uppercase tracking-wider font-bold text-brand-muted">Completed Deliveries</span>
              <p className="text-2xl font-black text-white">
                {orders.filter(o => o.deliveryStatus === 'delivered').length} / {orders.length} Total
              </p>
            </div>
          </div>

          {/* SVG Graphs */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Daily Revenue Bar Chart */}
            <div className="bg-brand-card/35 border border-brand-border rounded-3xl p-6 space-y-4">
              <div>
                <h3 className="text-sm font-black text-white">Daily Sales (Past 7 Days)</h3>
                <p className="text-[11px] text-brand-muted">Aggregated food subtotal revenue in USD</p>
              </div>
              <div className="pt-2">
                {orders.length > 0 ? (
                  <div className="w-full">
                    {(() => {
                      const analyticsData = getAnalyticsData();
                      const maxRevenue = Math.max(...analyticsData.map(d => d.revenue), 10);
                      return (
                        <svg viewBox="0 0 500 200" className="w-full h-48">
                          <line x1="40" y1="20" x2="480" y2="20" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                          <line x1="40" y1="70" x2="480" y2="70" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                          <line x1="40" y1="120" x2="480" y2="120" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                          <line x1="40" y1="170" x2="480" y2="170" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                          
                          {analyticsData.map((d, i) => {
                            const x = 50 + i * 60;
                            const barHeight = (d.revenue / maxRevenue) * 130;
                            const y = 170 - barHeight;
                            return (
                              <g key={i} className="group">
                                <rect
                                  x={x}
                                  y={y}
                                  width="30"
                                  height={barHeight}
                                  rx="4"
                                  fill="url(#revGrad)"
                                  className="hover:opacity-90 transition-all cursor-pointer"
                                />
                                <text
                                  x={x + 15}
                                  y={y - 8}
                                  textAnchor="middle"
                                  fill="#10b981"
                                  className="text-[9px] font-mono font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  ${d.revenue}
                                </text>
                                <text
                                  x={x + 15}
                                  y="185"
                                  textAnchor="middle"
                                  fill="#9ca3af"
                                  className="text-[9px] font-mono"
                                >
                                  {d.date}
                                </text>
                              </g>
                            );
                          })}
                          <defs>
                            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#10b981" />
                              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.3" />
                            </linearGradient>
                          </defs>
                        </svg>
                      );
                    })()}
                  </div>
                ) : (
                  <p className="text-center italic text-brand-muted text-xs py-10">No metrics available.</p>
                )}
              </div>
            </div>

            {/* Daily Orders Line Chart */}
            <div className="bg-brand-card/35 border border-brand-border rounded-3xl p-6 space-y-4">
              <div>
                <h3 className="text-sm font-black text-white">Daily Order Volume (Past 7 Days)</h3>
                <p className="text-[11px] text-brand-muted">Number of successfully dispatched transactions</p>
              </div>
              <div className="pt-2">
                {orders.length > 0 ? (
                  <div className="w-full">
                    {(() => {
                      const analyticsData = getAnalyticsData();
                      const maxCount = Math.max(...analyticsData.map(d => d.count), 5);
                      const points = analyticsData.map((d, i) => {
                        const x = 65 + i * 60;
                        const y = 170 - (d.count / maxCount) * 130;
                        return `${x},${y}`;
                      }).join(' ');
                      return (
                        <svg viewBox="0 0 500 200" className="w-full h-48">
                          <line x1="40" y1="20" x2="480" y2="20" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                          <line x1="40" y1="70" x2="480" y2="70" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                          <line x1="40" y1="120" x2="480" y2="120" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                          <line x1="40" y1="170" x2="480" y2="170" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                          
                          <polyline
                            fill="none"
                            stroke="#06b6d4"
                            strokeWidth="3"
                            points={points}
                            className="transition-all duration-500"
                          />
                          
                          {analyticsData.map((d, i) => {
                            const x = 65 + i * 60;
                            const y = 170 - (d.count / maxCount) * 130;
                            return (
                              <g key={i} className="group">
                                <circle
                                  cx={x}
                                  cy={y}
                                  r="5"
                                  fill="#0b0f19"
                                  stroke="#06b6d4"
                                  strokeWidth="3"
                                  className="cursor-pointer hover:r-7 transition-all"
                                />
                                <text
                                  x={x}
                                  y={y - 10}
                                  textAnchor="middle"
                                  fill="#06b6d4"
                                  className="text-[9px] font-mono font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  {d.count}
                                </text>
                                <text
                                  x={x}
                                  y="185"
                                  textAnchor="middle"
                                  fill="#9ca3af"
                                  className="text-[9px] font-mono"
                                >
                                  {d.date}
                                </text>
                              </g>
                            );
                          })}
                        </svg>
                      );
                    })()}
                  </div>
                ) : (
                  <p className="text-center italic text-brand-muted text-xs py-10">No metrics available.</p>
                )}
              </div>
            </div>
          </div>
          
        </section>
      )}

    </div>
  );
}
