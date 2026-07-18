'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Store, ShoppingBag, Trash2, Plus, Minus, CreditCard, ChevronLeft, Clock, LogOut
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { menuAPI, orderAPI, employeeAPI } from '@/lib/api';
import {
  GlassCard, Button, showToast, Skeleton, Input
} from '@/components/ui';

function POSContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tableId = searchParams.get('tableId');
  const tableNumber = searchParams.get('tableNumber');

  const { user, isMerchant, isAdmin, isAuthenticated } = useAuth();
  
  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [ticket, setTicket] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [orderType, setOrderType] = useState('takeout');
  const [splitWays, setSplitWays] = useState(1);

  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [pinMode, setPinMode] = useState('in'); // 'in' or 'out'

  const handlePinSubmit = async () => {
    if (pin.length !== 4) return showToast('PIN must be 4 digits', 'error');
    try {
      let res;
      if (pinMode === 'in') {
        res = await employeeAPI.clockInWithPin({ pin, restaurantId: user.restaurantId });
      } else {
        res = await employeeAPI.clockOutWithPin({ pin, restaurantId: user.restaurantId });
      }
      showToast(res.message || 'Success', 'success');
      setShowPinModal(false);
      setPin('');
    } catch (err) {
      showToast(err.message || 'Failed', 'error');
    }
  };

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    if (!isMerchant && !isAdmin) { router.push('/customer'); return; }
    
    if (tableId && tableNumber) {
      setOrderType('dine_in');
    }
    
    loadMenu();
  }, [isAuthenticated, isMerchant, tableId, tableNumber]);

  const loadMenu = async () => {
    try {
      const restaurantId = user?.restaurantId;
      if (!restaurantId) return;

      const [menuRes, catRes] = await Promise.all([
        menuAPI.getByRestaurant(restaurantId),
        menuAPI.getCategories(restaurantId)
      ]);
      setMenu(menuRes.data || []);
      
      const cats = catRes.data || [];
      setCategories(cats);
      if (cats.length > 0) setActiveCategory(cats[0]._id);
    } catch (err) {
      showToast('Failed to load menu for POS', 'error');
    } finally {
      setLoading(false);
    }
  };

  const addToTicket = (item) => {
    setTicket(prev => {
      const existing = prev.find(i => i._id === item._id);
      if (existing) {
        return prev.map(i => i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1, lineTotal: item.price }];
    });
  };

  const updateQuantity = (idx, newQty) => {
    if (newQty < 1) return;
    const newTicket = [...ticket];
    newTicket[idx].quantity = newQty;
    newTicket[idx].lineTotal = newTicket[idx].price * newQty;
    setTicket(newTicket);
  };

  const removeItem = (idx) => {
    const newTicket = [...ticket];
    newTicket.splice(idx, 1);
    setTicket(newTicket);
  };

  const subtotal = ticket.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.0875;
  const total = subtotal + tax;

  const handleCheckout = async () => {
    if (ticket.length === 0) return;
    setProcessing(true);
    try {
      const orderData = {
        restaurantId: user.restaurantId,
        items: ticket.map(item => ({
          menuItemId: item._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          lineTotal: item.price * item.quantity
        })),
        address: tableNumber ? `Table ${tableNumber}` : 'Walk-in Customer',
        orderType: orderType === 'takeout' ? 'pickup' : 'dine_in',
        paymentMethod: 'cash', // Default to cash for simple POS flow
        tableNumber: orderType === 'dine_in' ? tableNumber : null,
      };

      await orderAPI.create(orderData);
      setTicket([]);
      showToast('Order processed successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to process order', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const visibleItems = menu.filter(item => item.categoryId?._id === activeCategory);

  if (loading) return <div className="p-8"><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col md:flex-row gap-6 p-4">
      
      {/* Left: Menu Items */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push('/merchant')}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Dashboard
            </Button>
            <h1 className="text-xl font-black text-brand-text flex items-center gap-2">
              <Store className="h-5 w-5 text-brand-cyan" /> Point of Sale
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => { setPinMode('in'); setShowPinModal(true); }}>
              <Clock className="h-4 w-4 mr-1" /> Clock In
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setPinMode('out'); setShowPinModal(true); }}>
              <LogOut className="h-4 w-4 mr-1" /> Clock Out
            </Button>
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat._id}
              onClick={() => setActiveCategory(cat._id)}
              className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors
                ${activeCategory === cat._id ? 'bg-brand-cyan text-brand-bg' : 'bg-brand-card text-brand-muted hover:text-brand-text'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleItems.map(item => (
            <GlassCard 
              key={item._id} 
              className="cursor-pointer hover:border-brand-cyan/50 transition-colors flex flex-col justify-between"
              onClick={() => addToTicket(item)}
            >
              <div>
                <h3 className="font-bold text-brand-text text-sm mb-1">{item.name}</h3>
                <p className="text-xs text-brand-muted line-clamp-2">{item.description}</p>
              </div>
              <p className="text-brand-cyan font-black mt-2">${item.price.toFixed(2)}</p>
            </GlassCard>
          ))}
          {visibleItems.length === 0 && (
            <div className="col-span-full text-center text-brand-muted py-8 text-sm">No items in this category.</div>
          )}
        </div>
      </div>

      {/* Right: Current Ticket */}
      <div className="w-full md:w-[350px] lg:w-[400px] flex flex-col bg-brand-card/50 border border-brand-border rounded-2xl overflow-hidden shrink-0">
        <div className="p-4 border-b border-brand-border bg-brand-card flex justify-between items-center">
          <h2 className="font-bold text-brand-text flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-brand-cyan" /> 
            {tableNumber ? `Table ${tableNumber} Ticket` : 'Current Ticket'}
          </h2>
          <Button variant="ghost" size="sm" onClick={() => setTicket([])} disabled={ticket.length === 0} className="text-brand-red">
            Clear
          </Button>
        </div>

        {/* Order Type Toggle */}
        <div className="flex border-b border-brand-border">
          <button 
            className={`flex-1 py-3 text-sm font-bold transition-colors ${orderType === 'takeout' ? 'bg-brand-cyan/10 text-brand-cyan border-b-2 border-brand-cyan' : 'text-brand-muted hover:bg-brand-card'}`}
            onClick={() => !tableNumber && setOrderType('takeout')}
            disabled={!!tableNumber}
          >
            Takeout
          </button>
          <button 
            className={`flex-1 py-3 text-sm font-bold transition-colors ${orderType === 'dine_in' ? 'bg-brand-cyan/10 text-brand-cyan border-b-2 border-brand-cyan' : 'text-brand-muted hover:bg-brand-card'}`}
            onClick={() => setOrderType('dine_in')}
          >
            Dine-In
          </button>
        </div>

        {/* Ticket Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {ticket.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-brand-muted text-sm gap-2">
              <ShoppingBag className="h-8 w-8 opacity-20" />
              <p>Ticket is empty</p>
            </div>
          ) : (
            ticket.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center bg-brand-bg/50 p-2 rounded-lg border border-brand-border/50">
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-sm font-bold text-brand-text truncate">{item.name}</p>
                  <p className="text-xs text-brand-muted">${item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQuantity(idx, item.quantity - 1)} className="p-1 bg-brand-card rounded-md hover:bg-brand-border transition-colors">
                    <Minus className="h-3 w-3 text-brand-text" />
                  </button>
                  <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(idx, item.quantity + 1)} className="p-1 bg-brand-card rounded-md hover:bg-brand-border transition-colors">
                    <Plus className="h-3 w-3 text-brand-text" />
                  </button>
                  <button onClick={() => removeItem(idx)} className="p-1 ml-1 text-brand-red/60 hover:text-brand-red">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals & Pay */}
        <div className="p-4 bg-brand-card border-t border-brand-border space-y-3">
          <div className="flex justify-between text-sm text-brand-muted">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-brand-muted">
            <span>Tax</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-black text-brand-text pt-2 border-t border-brand-border/50">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>

          {/* Split Bill Controls */}
          {orderType === 'dine_in' && ticket.length > 0 && (
            <div className="pt-3 border-t border-brand-border/50 flex items-center justify-between">
              <span className="text-sm font-bold text-brand-text">Split Bill</span>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSplitWays(Math.max(1, splitWays - 1))}
                  className="p-1.5 bg-brand-bg rounded-lg border border-brand-border hover:border-brand-cyan transition-colors"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="font-black text-brand-cyan w-4 text-center">{splitWays}</span>
                <button 
                  onClick={() => setSplitWays(Math.min(10, splitWays + 1))}
                  className="p-1.5 bg-brand-bg rounded-lg border border-brand-border hover:border-brand-cyan transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Checkout Button */}
        <div className="p-4 border-t border-brand-border bg-brand-card">
          <Button 
            className="w-full py-4 text-lg" 
            onClick={handleCheckout} 
            loading={processing}
            disabled={ticket.length === 0}
            icon={CreditCard}
          >
            {splitWays > 1 ? `Pay ${(total / splitWays).toFixed(2)} / person` : `Pay ${total.toFixed(2)}`}
          </Button>
        </div>
      </div>

      {showPinModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <GlassCard className="w-full max-w-sm space-y-6 text-center">
            <h2 className="text-2xl font-black text-brand-text">
              {pinMode === 'in' ? 'Clock In' : 'Clock Out'}
            </h2>
            <p className="text-brand-muted text-sm">Enter your 4-digit POS PIN</p>
            
            <div className="text-3xl font-mono tracking-[1em] font-black text-brand-cyan bg-brand-bg/50 py-4 rounded-xl border border-brand-border/50">
              {pin.padEnd(4, '•')}
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'OK'].map((btn) => (
                <button
                  key={btn}
                  onClick={() => {
                    if (btn === 'C') setPin('');
                    else if (btn === 'OK') handlePinSubmit();
                    else if (pin.length < 4) setPin(p => p + btn);
                  }}
                  className={`py-4 rounded-xl text-xl font-bold transition-colors ${
                    btn === 'OK' ? 'bg-brand-cyan text-brand-bg hover:bg-brand-cyan/80' : 
                    btn === 'C' ? 'bg-brand-red/10 text-brand-red hover:bg-brand-red/20' : 
                    'bg-brand-card border border-brand-border text-brand-text hover:bg-brand-bg'
                  }`}
                >
                  {btn}
                </button>
              ))}
            </div>
            
            <button onClick={() => setShowPinModal(false)} className="text-sm text-brand-muted hover:text-brand-text underline mt-4">
              Cancel
            </button>
          </GlassCard>
        </div>
      )}
    </div>
  );
}

export default function POSPage() {
  return (
    <Suspense fallback={<div className="p-8"><Skeleton className="h-64 w-full" /></div>}>
      <POSContent />
    </Suspense>
  );
}
