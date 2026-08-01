'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Store, ShoppingBag, DollarSign, TrendingUp, Users, Star,
  ClipboardList, UtensilsCrossed, Package, Clock, Settings,
  AlertTriangle, ChefHat, BarChart3, Tag, Upload, FileText, Plus, Edit3, Save, X, Mail, Calendar, Gift, PartyPopper
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { orderAPI, restaurantAPI, menuAPI, uploadAPI, reservationAPI, cateringAPI, analyticsAPI, crmAPI } from '@/lib/api';
import {
  GlassCard, StatCard, Badge, Button, Tabs, OrderStatusBadge,
  Skeleton, showToast, EmptyState
} from '@/components/ui';
import Papa from 'papaparse';
import MerchantSidebar from '@/components/merchant/Sidebar';
import DashboardHeader from '@/components/merchant/DashboardHeader';
import DashboardView from '@/components/merchant/DashboardView';
import AllOrdersView from '@/components/merchant/AllOrdersView';
import OrderDetailsView from '@/components/merchant/OrderDetailsView';
import LiveOrdersView from '@/components/merchant/LiveOrdersView';
import MenuManagementView from '@/components/merchant/MenuManagementView';
import MenuManagementModal from '@/components/merchant/MenuManagementModal';
import ReservationsView from '@/components/merchant/ReservationsView';
import ReservationModal from '@/components/merchant/ReservationModal';
import CustomersCRMView from '@/components/merchant/CustomersCRMView';
import CustomerModal from '@/components/merchant/CustomerModal';

export default function MerchantDashboard() {
  const { user, isMerchant, isAdmin, isAuthenticated, loading: authLoading, backendVerified } = useAuth();
  const { joinRoom, on, off } = useSocket();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  
  useEffect(() => {
    setSelectedOrderId(null);
  }, [activeTab]);

  const [restaurant, setRestaurant] = useState(null);
  const [orders, setOrders] = useState([]);
  const [menu, setMenu] = useState([]);
  const [finance, setFinance] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [cateringInquiries, setCateringInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingItemId, setEditingItemId] = useState(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', sortOrder: 0 });
  const [itemForm, setItemForm] = useState({
    categoryId: '',
    name: '',
    description: '',
    price: '',
    image: '',
    calories: '',
    preparationTime: '',
    tags: '',
    isVeg: false,
    isVegan: false,
    isSpicy: false,
    isGlutenFree: false,
    dietaryTags: [],
    customizations: [],
    isAvailable: true
  });
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [editingReservation, setEditingReservation] = useState(null);
  
  const [customers, setCustomers] = useState([]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const [onboardingForm, setOnboardingForm] = useState({
    businessInfo: {
      legalName: '',
      dbaName: '',
      taxIdLast4: '',
      entityType: '',
      ownerName: '',
      ownerTitle: '',
      ownerEmail: '',
      ownerPhone: '',
    },
    documents: [],
  });
  const [stats, setStats] = useState({ todayOrders: 0, todayRevenue: 0, activeOrders: 0, avgRating: 0 });

  // H3 FIX: Gate on backendVerified — do NOT render dashboard until the backend
  // /me call has confirmed the role. This prevents localStorage role spoofing from
  // showing the merchant UI to unauthorized users even for a brief moment.
  useEffect(() => {
    if (authLoading) return;
    if (!backendVerified) return; // Still waiting for backend confirmation
    if (!isAuthenticated) { router.push('/admin/login'); return; }
    if (!isMerchant && !isAdmin) { router.push('/customer'); return; }
    loadDashboard();
  }, [isAuthenticated, isMerchant, isAdmin, authLoading, backendVerified]);

  const loadDashboard = async () => {
    try {
      if (!user?.restaurantId) { setLoading(false); return; }

      const roomId = user?.restaurantId;
      const [
        restData, menuData, ordersData,
        reservationsData, cateringData, analyticsResp, crmResp
      ] = await Promise.all([
        restaurantAPI.getMyRestaurant(),
        menuAPI.getByRestaurant(roomId),
        orderAPI.getRestaurantOrders(roomId),
        reservationAPI.getRestaurantReservations ? reservationAPI.getRestaurantReservations(roomId).catch(() => ({ data: [] })) : { data: [] },
        cateringAPI.getRestaurantInquiries ? cateringAPI.getRestaurantInquiries(roomId).catch(() => ({ data: [] })) : { data: [] },
        analyticsAPI.getSalesAnalytics ? analyticsAPI.getSalesAnalytics(roomId, 30).catch(() => ({ data: null })) : { data: null },
        crmAPI.getCustomers(roomId).catch(() => ({ data: [] }))
      ]);

      setRestaurant(restData.data);
      setMenu(menuData.data || []);
      setOrders(ordersData.data || []);
      setReservations(reservationsData?.data || []);
      setCateringInquiries(cateringData?.data || []);
      setAnalyticsData(analyticsResp?.data || null);
      setCustomers(crmResp?.data || []);
      setOnboardingForm({
        businessInfo: {
          legalName: restData.data?.businessInfo?.legalName || '',
          dbaName: restData.data?.businessInfo?.dbaName || '',
          taxIdLast4: restData.data?.businessInfo?.taxIdLast4 || '',
          entityType: restData.data?.businessInfo?.entityType || '',
          ownerName: restData.data?.businessInfo?.ownerName || user?.name || '',
          ownerTitle: restData.data?.businessInfo?.ownerTitle || '',
          ownerEmail: restData.data?.businessInfo?.ownerEmail || user?.email || '',
          ownerPhone: restData.data?.businessInfo?.ownerPhone || user?.phone || '',
        },
        documents: restData.data?.documents || [],
      });

      const today = new Date(); today.setHours(0, 0, 0, 0);
      const todayOrders = (ordersData.data || []).filter(o => new Date(o.createdAt) >= today);
      const activeOrders = (ordersData.data || []).filter(o => ['pending', 'accepted', 'preparing', 'ready'].includes(o.status));

      setStats({
        todayOrders: todayOrders.length,
        todayRevenue: todayOrders.reduce((s, o) => s + (o.total || 0), 0),
        activeOrders: activeOrders.length,
        avgRating: restData.data?.rating || 0,
      });

    } catch (err) { 
      console.error('Dashboard Load Error:', err);
      showToast('Failed to load dashboard: ' + err.message, 'error'); 
    }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const roomId = restaurant?._id || user?.restaurantId;
    if (!roomId) return undefined;

    joinRoom(roomId);
    const handleRealtimeOrder = () => {
      showToast('Order update received!', 'success');
      loadDashboard();
    };

    on('new_order', handleRealtimeOrder);
    on('order_updated', handleRealtimeOrder);

    return () => {
      off('new_order', handleRealtimeOrder);
      off('order_updated', handleRealtimeOrder);
    };
  }, [restaurant?._id, user?.restaurantId, joinRoom, on, off]);

  const handleUpdateStatus = async (orderId, status) => {
    try { await orderAPI.updateStatus(orderId, status); showToast(`Status → ${status}`, 'success'); loadDashboard(); }
    catch (err) { showToast(err.message || 'Failed', 'error'); }
  };

  const handleAcceptOrder = async (orderId) => {
    try { await orderAPI.accept(orderId); showToast('Order accepted!', 'success'); loadDashboard(); }
    catch (err) { showToast(err.message || 'Failed', 'error'); }
  };

  const handleRejectOrder = async (orderId) => {
    try { await orderAPI.reject(orderId, 'Rejected by restaurant'); showToast('Order rejected', 'info'); loadDashboard(); }
    catch (err) { showToast(err.message || 'Failed', 'error'); }
  };

  const handleUpdateReservationStatus = async (id, status) => {
    try {
      await reservationAPI.update(id, { status });
      showToast(`Reservation status updated to ${status}`, 'success');
      loadDashboard();
    } catch (err) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  const handleSaveReservation = async (reservationData) => {
    try {
      if (reservationData._id) {
        await reservationAPI.update(reservationData._id, reservationData);
        showToast('Reservation updated successfully', 'success');
      } else {
        await reservationAPI.create(reservationData);
        showToast('Reservation created successfully', 'success');
      }
      loadDashboard();
    } catch (err) {
      throw err;
    }
  };

  const handleSaveCustomer = async (customerData) => {
    try {
      if (customerData._id) {
        await crmAPI.updateCustomer(restaurant?._id, customerData._id, customerData);
        showToast('Customer updated successfully', 'success');
      } else {
        await crmAPI.createCustomer(restaurant?._id, customerData);
        showToast('Customer created successfully', 'success');
      }
      loadDashboard();
    } catch (err) {
      throw err;
    }
  };

  const handleUpdateCateringStatus = async (id, status) => {
    try { await cateringAPI.updateStatus(id, status); showToast(`Inquiry ${status}`, 'success'); loadDashboard(); }
    catch (err) { showToast(err.message || 'Failed to update catering inquiry', 'error'); }
  };

  const updateBusinessInfo = (key, value) => {
    setOnboardingForm(prev => ({
      ...prev,
      businessInfo: { ...prev.businessInfo, [key]: value },
    }));
  };

  const handleDocumentUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingDoc(true);
    try {
      const result = await uploadAPI.uploadFile(file, 'restaurant-platform/onboarding');
      setOnboardingForm(prev => ({
        ...prev,
        documents: [
          ...prev.documents,
          {
            name: file.name,
            type: 'other',
            url: result.data.url,
            publicId: result.data.publicId,
            verified: false,
            uploadedAt: new Date().toISOString(),
          }
        ],
      }));
      showToast('Document uploaded', 'success');
    } catch (err) {
      showToast(err.message || 'Upload failed', 'error');
    } finally {
      setUploadingDoc(false);
      event.target.value = '';
    }
  };

  const handleSaveOnboarding = async (submit = false) => {
    try {
      const data = await restaurantAPI.submitOnboarding(restaurant._id, { ...onboardingForm, submit });
      setRestaurant(data.data);
      setOnboardingForm(prev => ({ ...prev, documents: data.data.documents || prev.documents }));
      showToast(submit ? 'Submitted for review' : 'Onboarding saved', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to save onboarding', 'error');
    }
  };

  const resetCategoryForm = () => {
    setEditingCategoryId(null);
    setCategoryForm({ name: '', description: '', sortOrder: 0 });
  };

  const resetItemForm = () => {
    setEditingItemId(null);
    setItemForm({
      categoryId: menu[0]?._id || '',
      name: '',
      description: '',
      price: '',
      image: '',
      calories: '',
      preparationTime: '',
      tags: '',
      isVeg: false,
      isVegan: false,
      isSpicy: false,
      isGlutenFree: false,
      isBestseller: false,
      isAvailable: true,
      sizeVariationsText: '',
      addOnsText: '',
    });
  };

  const parseNamedPriceLines = (text) => (text || '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const [name, price] = line.split(':');
      return { name: name?.trim(), price: Number(price || 0) };
    })
    .filter(row => row.name && !Number.isNaN(row.price));

  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim()) {
      showToast('Category name is required', 'warning');
      return;
    }
    try {
      const payload = { ...categoryForm, restaurantId: restaurant._id, sortOrder: Number(categoryForm.sortOrder || 0) };
      if (editingCategoryId) await menuAPI.updateCategory(editingCategoryId, payload);
      else await menuAPI.createCategory(payload);
      showToast(editingCategoryId ? 'Category updated' : 'Category added', 'success');
      resetCategoryForm();
      loadDashboard();
    } catch (err) {
      showToast(err.message || 'Failed to save category', 'error');
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategoryId(category._id);
    setCategoryForm({
      name: category.name || '',
      description: category.description || '',
      sortOrder: category.sortOrder || 0,
    });
  };

  const handleDeleteCategory = async (categoryId) => {
    try {
      await menuAPI.deleteCategory(categoryId);
      showToast('Category deleted', 'success');
      loadDashboard();
    } catch (err) {
      showToast(err.message || 'Failed to delete category', 'error');
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      await menuAPI.deleteItem(itemId);
      showToast('Item deleted', 'success');
      loadDashboard();
    } catch (err) {
      showToast(err.message || 'Failed to delete item', 'error');
    }
  };

  const handleSmartPricing = async () => {
    if (!restaurant?._id) return;
    setLoading(true);
    try {
      const { aiAPI } = await import('@/lib/api');
      const res = await aiAPI.smartPricing(restaurant._id);
      if (res.data?.recommendations) {
        let msg = 'AI Price Recommendations:\n';
        res.data.recommendations.forEach(r => {
          msg += `- ${r.name}: $${r.suggestedPrice} (${r.reason})\n`;
        });
        showToast(msg, 'success');
      }
    } catch (err) {
      showToast('AI Pricing failed: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditItem = (item) => {
    setEditingItemId(item._id);
    setItemForm({
      categoryId: item.categoryId || '',
      name: item.name || '',
      description: item.description || '',
      price: item.price ?? '',
      image: item.image || '',
      calories: item.calories ?? '',
      preparationTime: item.preparationTime ?? '',
      tags: (item.tags || []).join(', '),
      isVeg: Boolean(item.isVeg),
      isVegan: Boolean(item.isVegan),
      isSpicy: Boolean(item.isSpicy),
      isGlutenFree: Boolean(item.isGlutenFree),
      isBestseller: Boolean(item.isBestseller),
      isAvailable: item.isAvailable !== false,
      sizeVariationsText: (item.sizeVariations || []).map(v => `${v.name}:${v.price}`).join('\n'),
      addOnsText: (item.addOns || []).map(a => `${a.name}:${a.price}`).join('\n'),
    });
    setShowMenuModal(true);
  };

  const handleSaveItem = async () => {
    const selectedCategoryId = itemForm.categoryId || menu[0]?._id || '';
    if (!selectedCategoryId || !itemForm.name.trim() || itemForm.price === '') {
      showToast('Category, item name, and price are required', 'warning');
      return;
    }
    try {
      const payload = {
        restaurantId: restaurant._id,
        categoryId: selectedCategoryId,
        name: itemForm.name,
        description: itemForm.description,
        price: Number(itemForm.price),
        image: itemForm.image || null,
        calories: itemForm.calories === '' ? null : Number(itemForm.calories),
        preparationTime: itemForm.preparationTime === '' ? null : Number(itemForm.preparationTime),
        tags: itemForm.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean),
        isVeg: itemForm.isVeg,
        isVegan: itemForm.isVegan,
        isSpicy: itemForm.isSpicy,
        isGlutenFree: itemForm.isGlutenFree,
        isBestseller: itemForm.isBestseller,
        isAvailable: itemForm.isAvailable,
        sizeVariations: parseNamedPriceLines(itemForm.sizeVariationsText),
        addOns: parseNamedPriceLines(itemForm.addOnsText),
      };
      if (editingItemId) await menuAPI.updateItem(editingItemId, payload);
      else await menuAPI.createItem(payload);
      showToast(editingItemId ? 'Item updated' : 'Item added', 'success');
      resetItemForm();
      setShowMenuModal(false);
      loadDashboard();
    } catch (err) {
      showToast(err.message || 'Failed to save item', 'error');
    }
  };

  const handleToggleItem = async (itemId) => {
    try {
      await menuAPI.toggleItem(itemId);
      showToast('Availability updated', 'success');
      loadDashboard();
    } catch (err) {
      showToast(err.message || 'Failed to update item', 'error');
    }
  };

  const handleBulkImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const items = results.data.map(row => ({
            name: row.Name || row.name,
            category: row.Category || row.category,
            price: Number(row.Price || row.price || 0),
            description: row.Description || row.description || '',
            image: row.Image || row.image || '',
            isVeg: String(row.Veg || '').toLowerCase() === 'true',
            isSpicy: String(row.Spicy || '').toLowerCase() === 'true'
          })).filter(i => i.name && !isNaN(i.price));

          if (items.length === 0) {
            showToast('No valid items found in CSV', 'error');
            return;
          }

          const res = await menuAPI.bulkImport({ restaurantId: restaurant._id, items });
          showToast(res.message || 'Import successful', 'success');
          loadDashboard();
        } catch (err) {
          showToast(err.message || 'Import failed', 'error');
        }
        e.target.value = ''; // reset
      }
    });
  };

  // H3 FIX: Show loading skeleton until backend verification is complete.
  // This ensures no dashboard content is ever visible before the role is confirmed.
  if (authLoading || !backendVerified || loading) return <DashboardSkeleton />;

  if (!user?.restaurantId) {
    return <EmptyState icon={Store} title="No Restaurant Linked" description="Create a restaurant to get started" />;
  }

  const pendingReservations = reservations.filter(r => r.status === 'pending');
  const pendingCatering = cateringInquiries.filter(c => c.status === 'pending');

  const tabs = [
    { value: 'orders', label: 'Orders', icon: ClipboardList, count: stats.activeOrders },
    { value: 'reservations', label: 'Reservations', icon: Calendar, count: pendingReservations.length || undefined },
    { value: 'catering', label: 'Events & Catering', icon: Gift, count: pendingCatering.length || undefined },
    { value: 'menu', label: 'Menu', icon: UtensilsCrossed },
    { value: 'reviews', label: 'Reviews', icon: Star, count: orders.filter(o => o.rating && !o.restaurantReply).length || undefined },
    { value: 'analytics', label: 'Finance', icon: BarChart3 },
    { value: 'settings', label: 'Settings', icon: Settings },
  ];

  const activeOrders = orders.filter(o => {
    if (['pending', 'accepted', 'preparing', 'ready', 'out_for_delivery'].includes(o.status)) return true;
    if (o.orderType === 'delivery' && o.status === 'picked_up') return true;
    return false;
  });
  
  const completedOrders = orders.filter(o => {
    if (o.status === 'delivered') return true;
    if (o.orderType !== 'delivery' && o.status === 'picked_up') return true;
    return false;
  });

  const isOrdersView = ['new_orders', 'preparing', 'out_delivery', 'completed', 'cancelled', 'refunds'].includes(activeTab);
  const isMenuView = ['food_items', 'addons', 'variations', 'combo', 'availability'].includes(activeTab);

  return (
    <div className="flex h-screen bg-[#070707] overflow-hidden text-brand-text font-sans">
      <MerchantSidebar 
        activeNav={activeTab} 
        onNavChange={setActiveTab} 
        stats={{
          activeOrders: stats.activeOrders,
          newOrders: orders.filter(o => o.status === 'pending').length,
          preparingOrders: orders.filter(o => o.status === 'preparing').length,
          pendingReservations: pendingReservations.length,
          pendingCatering: pendingCatering.length,
        }} 
      />
      <div className="flex-1 overflow-y-auto bg-[#F8FAFC] custom-scrollbar">
        <DashboardHeader user={user} />
        <div className="max-w-7xl mx-auto space-y-8 p-6">
          
          {activeTab === 'dashboard' && (
            <DashboardView 
              stats={stats} 
              orders={orders} 
              reservations={reservations} 
              cateringInquiries={cateringInquiries} 
              restaurant={restaurant} 
              user={user}
              analyticsData={analyticsData}
              menu={menu}
              onViewAll={setActiveTab}
            />
          )}

      {activeTab === 'all_orders' && (
        selectedOrderId ? (
          <OrderDetailsView 
            order={orders.find(o => o._id === selectedOrderId)} 
            onBack={() => setSelectedOrderId(null)} 
            onUpdateStatus={handleUpdateStatus}
            onRefresh={loadDashboard}
          />
        ) : (
          <AllOrdersView orders={orders} onRowClick={setSelectedOrderId} />
        )
      )}

      {activeTab === 'live_orders' && (
        <div className="h-full">
          <LiveOrdersView 
            orders={orders} 
            onAcceptOrder={handleAcceptOrder}
            onRejectOrder={handleRejectOrder}
            onUpdateStatus={handleUpdateStatus}
            onRefresh={loadDashboard}
          />
        </div>
      )}

      {activeTab === 'crm' && (
        <div className="h-full">
          <CustomersCRMView 
            customers={customers}
            onAdd={() => { setEditingCustomer(null); setShowCustomerModal(true); }}
            onEdit={(customer) => { setEditingCustomer(customer); setShowCustomerModal(true); }}
          />
        </div>
      )}

      {isOrdersView && (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-bold text-brand-text uppercase tracking-wider mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-brand-yellow" /> Active Orders ({activeOrders.length})
            </h3>
            {activeOrders.length === 0 ? (
              <GlassCard className="text-center py-8"><p className="text-sm text-brand-muted">Waiting for new orders...</p></GlassCard>
            ) : (
              <div className="space-y-3">
                {activeOrders.map(order => (
                  <GlassCard key={order._id} className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-sm font-bold text-brand-text">{order.orderNumber}</span>
                          <OrderStatusBadge status={order.status} />
                          <Badge color="muted">{order.orderType}</Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <Badge color={order.paymentStatus === 'paid' ? 'green' : order.paymentStatus === 'failed' ? 'red' : 'yellow'}>
                            {order.paymentStatus}
                          </Badge>
                          {order.trackingUrl && (
                            <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer"
                              className="text-[10px] font-semibold text-brand-cyan hover:underline">
                              DoorDash tracking
                            </a>
                          )}
                          {order.dasherName && <span className="text-[10px] text-brand-muted">Dasher: {order.dasherName}</span>}
                        </div>
                        <p className="text-[10px] text-brand-muted mt-1">
                          {new Date(order.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 shrink-0">
                        {order.status === 'pending' && (<><Button variant="primary" size="sm" onClick={() => handleAcceptOrder(order._id)}>Accept</Button><Button variant="danger" size="sm" onClick={() => handleRejectOrder(order._id)}>Reject</Button></>)}
                        {order.status === 'accepted' && <Button variant="primary" size="sm" onClick={() => handleUpdateStatus(order._id, 'preparing')}>Start Preparing</Button>}
                        {order.status === 'preparing' && <Button variant="primary" size="sm" onClick={() => handleUpdateStatus(order._id, 'ready')}>Mark Ready</Button>}
                        {order.status === 'ready' && <Button variant="primary" size="sm" onClick={() => handleUpdateStatus(order._id, 'picked_up')}>{order.orderType === 'pickup' ? 'Customer Picked Up' : 'Handed to Rider'}</Button>}
                        {order.status === 'picked_up' && order.orderType === 'delivery' && <Button variant="primary" size="sm" onClick={() => handleUpdateStatus(order._id, 'out_for_delivery')}>Out for Delivery</Button>}
                        {order.status === 'picked_up' && order.orderType === 'pickup' && <Button variant="primary" size="sm" onClick={() => handleUpdateStatus(order._id, 'delivered')}>Mark Completed</Button>}
                        {order.status === 'out_for_delivery' && <Button variant="primary" size="sm" onClick={() => handleUpdateStatus(order._id, 'delivered')}>Mark Delivered</Button>}
                      </div>
                    </div>

                    {/* Customer details & items breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-brand-border/40 pt-3">
                      <div className="text-xs space-y-1">
                        <p className="font-bold text-brand-text/90 flex items-center gap-1.5">
                          <span className="opacity-80">👤</span> {order.customerName || 'Walk-in'}
                          {order.customerPhone && <span className="text-brand-muted font-normal ml-1">({order.customerPhone})</span>}
                        </p>
                        {order.orderType === 'delivery' && order.address && (
                          <p className="text-brand-muted flex items-start gap-1.5 mt-1">
                            <span className="opacity-80">📍</span>
                            <span className="line-clamp-2">{order.address}</span>
                          </p>
                        )}
                      </div>
                      <div className="text-xs space-y-1 bg-white/5 p-2 rounded-lg border border-brand-border/30">
                        <p className="font-bold text-brand-cyan/90 uppercase tracking-wider text-[9px] mb-1">Items List (${order.total?.toFixed(2)})</p>
                        {(order.items || []).map((item, idx) => (
                          <div key={idx} className="flex justify-between text-brand-text">
                            <span>{item.quantity}x {item.name || item.menuItemName}</span>
                            <span className="text-brand-muted">${((item.price || 0) * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-brand-text uppercase tracking-wider mb-3">Recent Completed ({completedOrders.length})</h3>
            <div className="space-y-2">
              {completedOrders.slice(0, 10).map(order => (
                <GlassCard key={order._id} padding={false} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-brand-text">{order.orderNumber}</span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <span className="text-sm font-bold text-brand-text">${order.total?.toFixed(2)}</span>
                </GlassCard>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reservations' && (
        <div className="h-full">
          <ReservationsView 
            reservations={reservations} 
            onUpdateReservationStatus={handleUpdateReservationStatus}
            onEdit={(res) => {
              setEditingReservation(res);
              setShowReservationModal(true);
            }}
          />
        </div>
      )}

      {activeTab === 'catering' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-bold text-brand-text uppercase tracking-wider mb-3 flex items-center gap-2">
              <Gift className="h-4 w-4 text-brand-purple" /> Catering & Events ({cateringInquiries.length})
            </h3>
            {cateringInquiries.length === 0 ? (
              <GlassCard className="text-center py-8"><p className="text-sm text-brand-muted">No inquiries found.</p></GlassCard>
            ) : (
              <div className="space-y-3">
                {cateringInquiries.map(inq => (
                  <GlassCard key={inq._id} className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-sm font-bold text-brand-text">{inq.eventType} on {new Date(inq.eventDate).toLocaleDateString()}</span>
                          <Badge color={inq.status === 'contacted' ? 'green' : inq.status === 'closed' ? 'muted' : inq.status === 'reviewed' ? 'blue' : 'yellow'}>{inq.status}</Badge>
                        </div>
                        <div className="text-xs space-y-1 mt-2">
                          <p className="font-bold text-brand-text/90">👤 {inq.customerName} ({inq.customerPhone}) • {inq.customerEmail}</p>
                          <p className="text-brand-muted">Guests: {inq.guestCount} • Package: {inq.packagePreference}</p>
                          {inq.additionalNotes && <p className="text-brand-yellow/80 mt-1">Note: {inq.additionalNotes}</p>}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 shrink-0">
                        {inq.status === 'pending' && (<><Button variant="primary" size="sm" onClick={() => handleUpdateCateringStatus(inq._id, 'reviewed')}>Mark Reviewed</Button></>)}
                        {inq.status === 'reviewed' && <Button variant="primary" size="sm" onClick={() => handleUpdateCateringStatus(inq._id, 'contacted')}>Mark Contacted</Button>}
                        {['pending', 'reviewed', 'contacted'].includes(inq.status) && <Button variant="danger" size="sm" onClick={() => handleUpdateCateringStatus(inq._id, 'closed')}>Close</Button>}
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="h-full">
          <MenuManagementView 
            menu={menu}
            onSaveItem={handleSaveItem}
            onDeleteItem={handleDeleteItem}
            onToggleStatus={handleToggleItem}
            onEditItem={handleEditItem}
            onBulkImport={handleBulkImport}
            onAddItem={() => { resetItemForm(); setShowMenuModal(true); }}
          />
          <MenuManagementModal 
            isOpen={showMenuModal}
            onClose={() => setShowMenuModal(false)}
            itemForm={itemForm}
            setItemForm={setItemForm}
            menu={menu}
            handleSaveItem={handleSaveItem}
            editingItemId={editingItemId}
            handleSmartPricing={handleSmartPricing}
          />
        </div>
      )}

      {isMenuView && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-1 space-y-4">
            <GlassCard>
              <h3 className="text-sm font-bold text-brand-text uppercase tracking-wider mb-3">
                {editingCategoryId ? 'Edit Category' : 'Add Category'}
              </h3>
              <div className="space-y-3">
                <input
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Category name"
                  className="w-full rounded-xl bg-brand-card border border-brand-border text-sm text-brand-text px-3 py-2"
                />
                <input
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Description"
                  className="w-full rounded-xl bg-brand-card border border-brand-border text-sm text-brand-text px-3 py-2"
                />
                <input
                  type="number"
                  value={categoryForm.sortOrder}
                  onChange={(e) => setCategoryForm(f => ({ ...f, sortOrder: e.target.value }))}
                  placeholder="Sort order"
                  className="w-full rounded-xl bg-brand-card border border-brand-border text-sm text-brand-text px-3 py-2"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveCategory} icon={editingCategoryId ? Save : Plus}>
                    {editingCategoryId ? 'Save' : 'Add'}
                  </Button>
                  {editingCategoryId && <Button size="sm" variant="secondary" onClick={resetCategoryForm} icon={X}>Cancel</Button>}
                </div>
              </div>
            </GlassCard>

            <GlassCard>
              <h3 className="text-sm font-bold text-brand-text uppercase tracking-wider mb-3">
                {editingItemId ? 'Edit Item' : 'Add Item'}
              </h3>
              <div className="space-y-3">
                <select
                  value={itemForm.categoryId || menu[0]?._id || ''}
                  onChange={(e) => setItemForm(f => ({ ...f, categoryId: e.target.value }))}
                  className="w-full rounded-xl bg-brand-card border border-brand-border text-sm text-brand-text px-3 py-2"
                >
                  <option value="">Select category</option>
                  {menu.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                </select>
                <input
                  value={itemForm.name}
                  onChange={(e) => setItemForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Item name"
                  className="w-full rounded-xl bg-brand-card border border-brand-border text-sm text-brand-text px-3 py-2"
                />
                <textarea
                  value={itemForm.description}
                  onChange={(e) => setItemForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Description"
                  className="w-full rounded-xl bg-brand-card border border-brand-border text-sm text-brand-text px-3 py-2 h-20 resize-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={itemForm.price}
                    onChange={(e) => setItemForm(f => ({ ...f, price: e.target.value }))}
                    placeholder="Price"
                    className="rounded-xl bg-brand-card border border-brand-border text-sm text-brand-text px-3 py-2"
                  />
                  <input
                    type="number"
                    value={itemForm.preparationTime}
                    onChange={(e) => setItemForm(f => ({ ...f, preparationTime: e.target.value }))}
                    placeholder="Prep min"
                    className="rounded-xl bg-brand-card border border-brand-border text-sm text-brand-text px-3 py-2"
                  />
                </div>
                <input
                  value={itemForm.image}
                  onChange={(e) => setItemForm(f => ({ ...f, image: e.target.value }))}
                  placeholder="Image URL"
                  className="w-full rounded-xl bg-brand-card border border-brand-border text-sm text-brand-text px-3 py-2"
                />
                <input
                  value={itemForm.tags}
                  onChange={(e) => setItemForm(f => ({ ...f, tags: e.target.value }))}
                  placeholder="Tags: spicy, vegan, bestseller"
                  className="w-full rounded-xl bg-brand-card border border-brand-border text-sm text-brand-text px-3 py-2"
                />
                <textarea
                  value={itemForm.sizeVariationsText}
                  onChange={(e) => setItemForm(f => ({ ...f, sizeVariationsText: e.target.value }))}
                  placeholder={'Sizes, one per line\nSmall:9.99\nLarge:13.99'}
                  className="w-full rounded-xl bg-brand-card border border-brand-border text-sm text-brand-text px-3 py-2 h-20 resize-none"
                />
                <textarea
                  value={itemForm.addOnsText}
                  onChange={(e) => setItemForm(f => ({ ...f, addOnsText: e.target.value }))}
                  placeholder={'Add-ons, one per line\nExtra Cheese:2\nSauce:1'}
                  className="w-full rounded-xl bg-brand-card border border-brand-border text-sm text-brand-text px-3 py-2 h-20 resize-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ['isVeg', 'Veg'],
                    ['isVegan', 'Vegan'],
                    ['isSpicy', 'Spicy'],
                    ['isGlutenFree', 'Gluten Free'],
                    ['isBestseller', 'Bestseller'],
                    ['isAvailable', 'Available'],
                  ].map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 rounded-lg border border-brand-border px-3 py-2 text-xs text-brand-muted">
                      <input
                        type="checkbox"
                        checked={Boolean(itemForm[key])}
                        onChange={(e) => setItemForm(f => ({ ...f, [key]: e.target.checked }))}
                      />
                      {label}
                    </label>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveItem} icon={editingItemId ? Save : Plus} className="flex-1">
                    {editingItemId ? 'Save' : 'Add'}
                  </Button>
                  {editingItemId && <Button size="sm" variant="secondary" onClick={resetItemForm} icon={X}>Cancel</Button>}
                </div>
                <div className="pt-2">
                  <Button size="sm" variant="secondary" onClick={handleSmartPricing} className="w-full text-brand-cyan border-brand-cyan/30 hover:bg-brand-cyan/10">
                    ✨ AI Price Optimizer
                  </Button>
                </div>
              </div>
            </GlassCard>
          </div>

          <div className="xl:col-span-2 space-y-4">
            <div className="flex justify-between items-center bg-brand-card/50 p-4 rounded-2xl border border-brand-border">
              <div>
                <h3 className="font-bold text-brand-text">Bulk Import Menu</h3>
                <p className="text-xs text-brand-muted">Upload a CSV file (Headers: Name, Category, Price, Description, Image, Veg, Spicy)</p>
              </div>
              <label className="cursor-pointer">
                <input type="file" accept=".csv" className="hidden" onChange={handleBulkImport} />
                <div className="px-4 py-2 bg-brand-cyan/10 text-brand-cyan font-semibold rounded-lg hover:bg-brand-cyan/20 transition-colors flex items-center gap-2 text-sm">
                  <Upload className="h-4 w-4" /> Import CSV
                </div>
              </label>
            </div>

            {menu.length === 0 ? <EmptyState icon={UtensilsCrossed} title="No menu categories" description="Add a category first, then create items" /> : (
              menu.map(cat => (
                <GlassCard key={cat._id}>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <h3 className="text-sm font-bold text-brand-text">{cat.name} ({cat.items?.length || 0})</h3>
                      {cat.description && <p className="text-xs text-brand-muted mt-1">{cat.description}</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => handleEditCategory(cat)} icon={Edit3}>Edit</Button>
                      <Button size="sm" variant="danger" onClick={() => handleDeleteCategory(cat._id)}>Delete</Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {cat.items?.length === 0 && <p className="text-sm text-brand-muted">No items in this category.</p>}
                    {cat.items?.map(item => (
                      <div key={item._id} className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-xl bg-brand-bg/40 border border-brand-border">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-bold text-brand-text">{item.name}</p>
                            {item.isBestseller && <Badge color="yellow">Bestseller</Badge>}
                            {item.isSpicy && <Badge color="red">Spicy</Badge>}
                            {item.isVeg && <Badge color="green">Veg</Badge>}
                          </div>
                          <p className="text-xs text-brand-muted mt-1">{item.description?.substring(0, 100)}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {(item.sizeVariations || []).map(size => <Badge key={size.name} color="muted">{size.name}: ${size.price?.toFixed(2)}</Badge>)}
                            {(item.addOns || []).map(addOn => <Badge key={addOn.name} color="cyan">+{addOn.name} ${addOn.price?.toFixed(2)}</Badge>)}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 md:justify-end">
                          <span className="text-sm font-bold text-brand-text">${item.price?.toFixed(2)}</span>
                          <Badge color={item.isAvailable ? 'green' : 'red'}>{item.isAvailable ? 'Available' : 'Off'}</Badge>
                          <Button size="sm" variant="secondary" onClick={() => handleToggleItem(item._id)}>
                            {item.isAvailable ? 'Stock Out' : 'Enable'}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleEditItem(item)} icon={Edit3}>Edit</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="space-y-4">
          {orders.filter(o => o.rating).length === 0 ? (
            <EmptyState icon={Star} title="No Reviews Yet" description="When customers leave reviews, they will appear here." />
          ) : (
            orders.filter(o => o.rating).map(o => (
              <GlassCard key={o._id}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-brand-text flex items-center gap-2">
                      <Star className="h-4 w-4 fill-brand-yellow text-brand-yellow" />
                      {o.rating} / 5
                    </h3>
                    <p className="text-sm text-brand-muted mt-1">{o.review || 'No written review'}</p>
                    <p className="text-xs text-brand-muted/70 mt-2">
                      Order: {o.orderNumber} • {new Date(o.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {!o.restaurantReply && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const reply = prompt('Enter your reply:');
                        if (reply) {
                          orderAPI.replyToReview(o._id, reply).then(() => {
                            showToast('Reply submitted', 'success');
                            loadDashboard();
                          }).catch(err => showToast(err.message || 'Failed to reply', 'error'));
                        }
                      }}
                    >
                      Reply
                    </Button>
                  )}
                </div>
                {o.restaurantReply && (
                  <div className="mt-4 p-3 bg-brand-cyan/5 border border-brand-cyan/20 rounded-xl">
                    <p className="text-xs font-bold text-brand-cyan mb-1">Your Reply:</p>
                    <p className="text-sm text-brand-text">{o.restaurantReply}</p>
                  </div>
                )}
              </GlassCard>
            ))
          )}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="30D Gross Sales" value={`$${(finance?.grossSales || 0).toFixed(2)}`} icon={DollarSign} color="green" />
            <StatCard label="Est. Net Payable" value={`$${(finance?.estimatedNetPayable || 0).toFixed(2)}`} icon={TrendingUp} color="cyan" />
            <StatCard label="Refunds" value={`$${(finance?.refunds || 0).toFixed(2)}`} icon={AlertTriangle} color="red" />
            <StatCard label="Commission" value={`$${(finance?.commission || 0).toFixed(2)}`} icon={BarChart3} color="yellow" />
          </div>

          <GlassCard>
            <h3 className="text-sm font-bold text-brand-text uppercase tracking-wider mb-3">Order Mix</h3>
            <div className="flex flex-wrap gap-2">
              {(finance?.statusBreakdown || []).map(row => (
                <Badge key={row._id} color={row._id === 'cancelled' ? 'red' : row._id === 'delivered' ? 'green' : 'cyan'}>
                  {row._id}: {row.count}
                </Badge>
              ))}
              {(finance?.statusBreakdown || []).length === 0 && (
                <span className="text-sm text-brand-muted">No order activity in this period.</span>
              )}
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="text-sm font-bold text-brand-text uppercase tracking-wider mb-3">Recent Settlements</h3>
            <div className="space-y-2">
              {(finance?.settlements || []).length === 0 ? (
                <p className="text-sm text-brand-muted">No settlements generated yet.</p>
              ) : finance.settlements.map(s => (
                <div key={s._id} className="flex items-center justify-between p-3 rounded-xl bg-brand-bg/40 border border-brand-border">
                  <div>
                    <p className="text-sm font-bold text-brand-text">${s.netPayable?.toFixed(2)} payable</p>
                    <p className="text-xs text-brand-muted">{new Date(s.periodStart).toLocaleDateString()} - {new Date(s.periodEnd).toLocaleDateString()}</p>
                  </div>
                  <Badge color={s.status === 'paid' ? 'green' : 'yellow'}>{s.status}</Badge>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-4 max-w-4xl">
          <GlassCard>
            <h3 className="text-sm font-bold text-brand-text uppercase tracking-wider mb-3">Restaurant Status</h3>
            <div className="flex items-center justify-between">
              <span className="text-sm text-brand-muted">Online / Accepting Orders</span>
              <button
                onClick={async () => {
                  try { await restaurantAPI.toggleActive(restaurant._id); setRestaurant(p => ({ ...p, isActive: !p.isActive })); showToast('Toggled', 'success'); }
                  catch (err) { showToast(err.message, 'error'); }
                }}
                className={`relative w-11 h-6 rounded-full transition-colors ${restaurant?.isActive ? 'bg-brand-green' : 'bg-brand-card border border-brand-border'}`}
              >
                <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${restaurant?.isActive ? 'translate-x-5' : ''}`} />
              </button>
            </div>
          </GlassCard>
          <GlassCard>
            <h3 className="text-sm font-bold text-brand-text uppercase tracking-wider mb-3">Info</h3>
            <div className="space-y-2 text-sm text-brand-muted">
              <div className="flex justify-between"><span>Status</span><Badge color={restaurant?.status === 'approved' ? 'green' : 'yellow'}>{restaurant?.status}</Badge></div>
              <div className="flex justify-between"><span>Onboarding</span><Badge color={restaurant?.onboardingStatus === 'approved' ? 'green' : restaurant?.onboardingStatus === 'rejected' ? 'red' : 'yellow'}>{restaurant?.onboardingStatus || 'not_started'}</Badge></div>
              <div className="flex justify-between"><span>Delivery Fee</span><span>${restaurant?.deliveryFee?.toFixed(2) || '0.00'}</span></div>
              <div className="flex justify-between"><span>Tax Rate</span><span>{((restaurant?.taxRate || 0) * 100).toFixed(1)}%</span></div>
              <div className="flex justify-between"><span>Commission</span><span>{((restaurant?.commissionRate || 0) * 100).toFixed(0)}%</span></div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-brand-text uppercase tracking-wider mb-1">Preparation Time</h3>
                <p className="text-xs text-brand-muted">Current average prep time in minutes.</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="5"
                  max="120"
                  defaultValue={restaurant?.prepTime || 15}
                  onBlur={async (e) => {
                    const val = Number(e.target.value);
                    if (val === restaurant?.prepTime) return;
                    try {
                      const res = await restaurantAPI.update(restaurant._id, { prepTime: val });
                      setRestaurant(res.data);
                      showToast('Prep Time updated', 'success');
                    } catch (err) {
                      showToast(err.message, 'error');
                      e.target.value = restaurant?.prepTime || 15;
                    }
                  }}
                  className="w-20 bg-brand-bg border border-brand-border rounded-lg px-3 py-1.5 text-sm text-brand-text text-center focus:border-brand-cyan focus:outline-none"
                />
                <span className="text-xs text-brand-muted font-bold">MINS</span>
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="text-sm font-bold text-brand-text uppercase tracking-wider">Business Verification</h3>
              <Badge color={restaurant?.onboardingStatus === 'approved' ? 'green' : restaurant?.onboardingStatus === 'rejected' ? 'red' : 'yellow'}>
                {restaurant?.onboardingStatus || 'not_started'}
              </Badge>
            </div>

            {restaurant?.onboardingReviewNotes && (
              <div className="mb-4 rounded-xl border border-brand-yellow/20 bg-brand-yellow/5 p-3 text-sm text-brand-muted">
                {restaurant.onboardingReviewNotes}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                ['legalName', 'Legal Business Name'],
                ['dbaName', 'DBA Name'],
                ['taxIdLast4', 'Tax ID Last 4'],
                ['ownerName', 'Owner Name'],
                ['ownerTitle', 'Owner Title'],
                ['ownerEmail', 'Owner Email'],
                ['ownerPhone', 'Owner Phone'],
              ].map(([key, label]) => (
                <input
                  key={key}
                  value={onboardingForm.businessInfo[key] || ''}
                  onChange={(e) => updateBusinessInfo(key, e.target.value)}
                  placeholder={label}
                  className="rounded-xl bg-brand-card border border-brand-border text-sm text-brand-text px-3 py-2"
                />
              ))}
              <select
                value={onboardingForm.businessInfo.entityType || ''}
                onChange={(e) => updateBusinessInfo('entityType', e.target.value)}
                className="rounded-xl bg-brand-card border border-brand-border text-sm text-brand-text px-3 py-2"
              >
                <option value="">Entity Type</option>
                <option value="sole_proprietor">Sole Proprietor</option>
                <option value="llc">LLC</option>
                <option value="corporation">Corporation</option>
                <option value="partnership">Partnership</option>
                <option value="non_profit">Non-profit</option>
              </select>
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-xs font-bold text-brand-muted uppercase tracking-wider">Documents</h4>
                <label className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-border px-4 py-2 text-sm font-semibold text-brand-text cursor-pointer hover:border-brand-cyan/50">
                  <Upload className="h-4 w-4" />
                  {uploadingDoc ? 'Uploading...' : 'Upload'}
                  <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleDocumentUpload} disabled={uploadingDoc} />
                </label>
              </div>

              {(onboardingForm.documents || []).length === 0 ? (
                <p className="text-sm text-brand-muted">Upload business license, EIN letter, food permit, insurance, or owner ID.</p>
              ) : onboardingForm.documents.map((doc, idx) => (
                <div key={doc.url || idx} className="flex items-center justify-between gap-3 rounded-xl border border-brand-border bg-brand-bg/40 p-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-4 w-4 text-brand-cyan flex-shrink-0" />
                    <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-brand-text truncate hover:text-brand-cyan">
                      {doc.name}
                    </a>
                  </div>
                  <Badge color={doc.verified ? 'green' : doc.rejectionReason ? 'red' : 'yellow'}>
                    {doc.verified ? 'Verified' : doc.rejectionReason ? 'Rejected' : 'Pending'}
                  </Badge>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => handleSaveOnboarding(false)}>Save Draft</Button>
              <Button onClick={() => handleSaveOnboarding(true)}>Submit Review</Button>
            </div>
          </GlassCard>
        </div>
      )}
        </div>
      </div>

      {/* Reservation Management Modal */}
      <ReservationModal
        isOpen={showReservationModal}
        onClose={() => {
          setShowReservationModal(false);
          setEditingReservation(null);
        }}
        onSave={handleSaveReservation}
        reservation={editingReservation}
        restaurantId={restaurant?._id}
      />

      {/* Customer Management Modal */}
      <CustomerModal
        isOpen={showCustomerModal}
        onClose={() => {
          setShowCustomerModal(false);
          setEditingCustomer(null);
        }}
        onSave={handleSaveCustomer}
        customer={editingCustomer}
        restaurantId={restaurant?._id}
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
      <Skeleton className="h-12 rounded-xl" />
      <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
    </div>
  );
}
