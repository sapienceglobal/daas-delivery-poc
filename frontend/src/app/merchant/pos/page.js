'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Store, ShoppingBag, Trash2, Plus, Minus, CreditCard, ChevronLeft, Clock, LogOut,
  User, Phone, Mail, Tag, DollarSign, Printer, RotateCcw, CheckCircle2, Terminal
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { menuAPI, orderAPI, employeeAPI } from '@/lib/api';
import {
  Button, showToast, Skeleton, Input
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

  // Customer Details
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  
  // Coupon
  const [couponCode, setCouponCode] = useState('');

  // Modals
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [pinMode, setPinMode] = useState('in');

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  
  // Payment State
  const [selectedPayment, setSelectedPayment] = useState('cash'); // cash, card_terminal
  const [tenderAmount, setTenderAmount] = useState('');
  const [completedOrder, setCompletedOrder] = useState(null);

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
    if (!isMerchant && !isAdmin) { router.push('/'); return; }
    
    if (tableId && tableNumber) {
      setOrderType('dine_in');
    }
    
    loadMenu();
  }, [isAuthenticated, isMerchant, tableId, tableNumber, user]);

  const loadMenu = async () => {
    try {
      const restaurantId = user?.restaurantId;
      if (!restaurantId) {
        setLoading(false);
        return;
      }

      const menuRes = await menuAPI.getByRestaurant(restaurantId);
      const groupedMenu = menuRes.data || [];
      setMenu(groupedMenu);
      
      if (groupedMenu.length > 0) {
        setCategories(groupedMenu);
        setActiveCategory(groupedMenu[0]._id);
      }
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

  const getChangeDue = () => {
    const tendered = parseFloat(tenderAmount) || 0;
    return Math.max(0, tendered - total).toFixed(2);
  };

  const initiateCheckout = () => {
    if (ticket.length === 0) return;
    setShowPaymentModal(true);
    setTenderAmount(total.toFixed(2).toString());
  };

  const handleProcessPayment = async () => {
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
        paymentMethod: 'cash', // always cash for backend logic bypass
        tableNumber: orderType === 'dine_in' ? tableNumber : null,
        
        // CRM Details
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        customerEmail: customerEmail.trim() || undefined,
        
        // Discount
        couponCode: couponCode.trim() || undefined,
        
        // Custom flag for pos to track actual tender type
        courierNotes: `POS Payment: ${selectedPayment}` // We can track this in notes for now
      };

      const res = await orderAPI.create(orderData);
      setCompletedOrder(res.data);
      setTicket([]);
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setCouponCode('');
      setShowPaymentModal(false);
      setShowCompleteModal(true);
      showToast('Order processed successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to process order', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const visibleItems = menu.find(cat => cat._id === activeCategory)?.items || [];

  if (loading) return <div className="p-8"><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col md:flex-row gap-6 p-4">
      
      {/* Left: Menu Items */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-1 px-3 py-1.5 text-sm font-bold text-[#374151] hover:bg-[#f3f4f6] rounded-md transition-colors" onClick={() => router.push('/merchant')}>
              <ChevronLeft className="h-4 w-4" /> Dashboard
            </button>
            <h1 className="text-xl font-black text-[#111827] flex items-center gap-2">
              <Store className="h-5 w-5 text-[#8b0000]" /> Point of Sale
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1 px-3 py-1.5 text-sm font-bold border border-[#e5e7eb] text-[#374151] hover:bg-[#f3f4f6] rounded-md transition-colors bg-white" onClick={() => { setPinMode('in'); setShowPinModal(true); }}>
              <Clock className="h-4 w-4" /> Clock In
            </button>
            <button className="flex items-center gap-1 px-3 py-1.5 text-sm font-bold border border-[#e5e7eb] text-[#374151] hover:bg-[#f3f4f6] rounded-md transition-colors bg-white" onClick={() => { setPinMode('out'); setShowPinModal(true); }}>
              <LogOut className="h-4 w-4" /> Clock Out
            </button>
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide shrink-0">
          {categories.map(cat => (
            <button
              key={cat._id}
              onClick={() => setActiveCategory(cat._id)}
              className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors
                ${activeCategory === cat._id ? 'bg-[#8b0000] text-white' : 'bg-white border border-[#e5e7eb] text-[#6b7280] hover:text-[#111827]'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-10 content-start">
          {visibleItems.map(item => (
            <div 
              key={item._id} 
              className="bg-white border border-[#e5e7eb] rounded-xl cursor-pointer hover:border-[#8b0000] hover:shadow-md transition-all flex flex-col overflow-hidden shadow-sm h-48"
              onClick={() => addToTicket(item)}
            >
              <div className="h-24 bg-[#f3f4f6] w-full shrink-0 flex items-center justify-center overflow-hidden">
                {item.image || item.imageUrl ? (
                  <img src={item.image || item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <Store className="w-8 h-8 text-[#9ca3af] opacity-50" />
                )}
              </div>
              <div className="p-3 flex flex-col justify-between flex-1">
                <div>
                  <h3 className="font-bold text-[#111827] text-[13px] leading-tight line-clamp-1 mb-0.5">{item.name}</h3>
                  <p className="text-[11px] text-[#6b7280] line-clamp-1 leading-snug">{item.description || 'No description'}</p>
                </div>
                <p className="text-[#8b0000] font-black mt-1 text-sm">${item.price.toFixed(2)}</p>
              </div>
            </div>
          ))}
          {visibleItems.length === 0 && (
            <div className="col-span-full text-center text-[#9ca3af] py-8 text-sm">No items in this category.</div>
          )}
        </div>
      </div>

      {/* Right: Current Ticket */}
      <div className="w-full md:w-[360px] lg:w-[420px] flex flex-col bg-white border border-[#e5e7eb] rounded-2xl overflow-hidden shrink-0 shadow-sm">
        
        {/* Order Type & Customer Details */}
        <div className="bg-[#f3f4f6] border-b border-[#e5e7eb] p-4 flex flex-col gap-3">
          <div className="flex bg-white rounded-lg border border-[#e5e7eb] overflow-hidden p-1">
            <button 
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${orderType === 'takeout' ? 'bg-[#8b0000] text-white' : 'text-[#6b7280] hover:bg-[#f9fafb]'}`}
              onClick={() => !tableNumber && setOrderType('takeout')}
              disabled={!!tableNumber}
            >
              Takeout
            </button>
            <button 
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${orderType === 'dine_in' ? 'bg-[#8b0000] text-white' : 'text-[#6b7280] hover:bg-[#f9fafb]'}`}
              onClick={() => setOrderType('dine_in')}
            >
              Dine-In {tableNumber ? `(T${tableNumber})` : ''}
            </button>
          </div>
          
          <div className="space-y-2">
            <div className="relative">
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5">
                <User className="w-4 h-4 text-[#9ca3af]" />
              </div>
              <input 
                type="text" placeholder="Customer Name (Optional)" 
                value={customerName} onChange={e => setCustomerName(e.target.value)}
                className="w-full pl-10 pr-3 py-1.5 text-[13px] bg-white border border-[#e5e7eb] rounded-md focus:border-[#8b0000] outline-none text-[#111827] placeholder-[#9ca3af]"
              />
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5">
                  <Phone className="w-4 h-4 text-[#9ca3af]" />
                </div>
                <input 
                  type="text" placeholder="Phone" 
                  value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
                  className="w-full pl-10 pr-3 py-1.5 text-[13px] bg-white border border-[#e5e7eb] rounded-md focus:border-[#8b0000] outline-none text-[#111827] placeholder-[#9ca3af]"
                />
              </div>
              <div className="relative flex-1">
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5">
                  <Mail className="w-4 h-4 text-[#9ca3af]" />
                </div>
                <input 
                  type="email" placeholder="Email" 
                  value={customerEmail} onChange={e => setCustomerEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-1.5 text-[13px] bg-white border border-[#e5e7eb] rounded-md focus:border-[#8b0000] outline-none text-[#111827] placeholder-[#9ca3af]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Ticket Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#f9fafb]">
          {ticket.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-[#9ca3af] text-sm gap-3">
              <ShoppingBag className="h-12 w-12 opacity-30" />
              <p>Scan or select items to start</p>
            </div>
          ) : (
            ticket.map((item, idx) => (
              <div key={idx} className="flex flex-col bg-white p-3 rounded-xl border border-[#e5e7eb] shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 pr-2">
                    <p className="text-[13px] font-bold text-[#111827] leading-tight">{item.name}</p>
                    <p className="text-[11px] text-[#6b7280]">${item.price.toFixed(2)} each</p>
                  </div>
                  <span className="font-bold text-[#8b0000] text-sm">${item.lineTotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-1 bg-[#f3f4f6] rounded-lg p-0.5 border border-[#e5e7eb]">
                    <button onClick={() => updateQuantity(idx, item.quantity - 1)} className="p-1.5 bg-white rounded-md shadow-sm text-[#111827] hover:text-[#8b0000]">
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-[13px] font-black w-6 text-center text-[#111827]">{item.quantity}</span>
                    <button onClick={() => updateQuantity(idx, item.quantity + 1)} className="p-1.5 bg-white rounded-md shadow-sm text-[#111827] hover:text-[#8b0000]">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <button onClick={() => removeItem(idx)} className="p-2 text-[#9ca3af] hover:text-[#ef4444] transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Coupon & Totals */}
        <div className="p-4 bg-white border-t border-[#e5e7eb]">
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1">
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5">
                <Tag className="w-4 h-4 text-[#9ca3af]" />
              </div>
              <input 
                type="text" placeholder="Promo/Coupon Code" 
                value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())}
                className="w-full pl-10 pr-3 py-2 text-[13px] bg-[#f9fafb] border border-[#e5e7eb] rounded-lg focus:border-[#8b0000] uppercase outline-none text-[#111827] placeholder-[#9ca3af]"
              />
            </div>
            {couponCode && (
              <Button size="sm" variant="outline" className="h-[38px] text-[#111827]" onClick={() => setCouponCode('')}>Clear</Button>
            )}
          </div>
          
          <div className="space-y-1.5 mb-4">
            <div className="flex justify-between text-[13px] text-[#6b7280]">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[13px] text-[#6b7280]">
              <span>Tax (8.75%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xl font-black text-[#111827] pt-2 border-t border-[#e5e7eb] mt-2">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
          
          <button 
            className="w-full py-4 text-lg font-black shadow-md bg-[#8b0000] text-white rounded-xl hover:bg-[#7a0000] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" 
            onClick={initiateCheckout} 
            disabled={ticket.length === 0}
          >
            <CreditCard className="w-5 h-5" /> Charge ${total.toFixed(2)}
          </button>
        </div>
      </div>

      {/* PAYMENT MODAL */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-[500px] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-5 border-b border-[#e5e7eb] bg-[#f3f4f6] flex justify-between items-center">
              <h2 className="text-xl font-black text-[#111827]">Complete Payment</h2>
              <button onClick={() => setShowPaymentModal(false)} className="p-2 text-[#9ca3af] hover:text-[#111827] rounded-full hover:bg-[#f3f4f6]"><LogOut className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6">
              <div className="text-center mb-6">
                <p className="text-sm text-[#9ca3af] uppercase tracking-widest font-bold mb-1">Total Due</p>
                <p className="text-4xl font-black text-[#8b0000]">${total.toFixed(2)}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <button 
                  onClick={() => setSelectedPayment('cash')}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${selectedPayment === 'cash' ? 'border-[#8b0000] bg-[#fef2f2] text-[#8b0000]' : 'border-[#e5e7eb] text-[#9ca3af] hover:bg-[#f9fafb]'}`}
                >
                  <DollarSign className="w-8 h-8" />
                  <span className="font-bold">Cash</span>
                </button>
                <button 
                  onClick={() => { setSelectedPayment('card_terminal'); setTenderAmount(total.toFixed(2)); }}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${selectedPayment === 'card_terminal' ? 'border-[#8b0000] bg-[#fef2f2] text-[#8b0000]' : 'border-[#e5e7eb] text-[#9ca3af] hover:bg-[#f9fafb]'}`}
                >
                  <Terminal className="w-8 h-8" />
                  <span className="font-bold">Card Terminal</span>
                </button>
              </div>

              {selectedPayment === 'cash' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#9ca3af] mb-1 uppercase tracking-wider">Amount Tendered</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-[#9ca3af]">$</span>
                      <input 
                        type="number" 
                        value={tenderAmount} 
                        onChange={(e) => setTenderAmount(e.target.value)}
                        className="w-full pl-8 pr-4 py-3 text-2xl font-black border-2 border-[#e5e7eb] rounded-xl focus:border-[#8b0000] outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[10, 20, 50, 100].map(amt => (
                      <button key={amt} onClick={() => setTenderAmount(amt.toString())} className="py-2 bg-[#f3f4f6] rounded-lg font-bold text-[#6b7280] hover:bg-[#e5e7eb] border border-[#e5e7eb]">
                        ${amt}
                      </button>
                    ))}
                    <button onClick={() => setTenderAmount(total.toFixed(2))} className="py-2 bg-[#f3f4f6] rounded-lg font-bold text-[#6b7280] hover:bg-[#e5e7eb] border border-[#e5e7eb] col-span-4">
                      Exact Amount (${total.toFixed(2)})
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-center bg-[#f9fafb] p-4 rounded-xl border border-[#e5e7eb]">
                    <span className="font-bold text-[#6b7280]">Change Due</span>
                    <span className={`text-2xl font-black ${parseFloat(tenderAmount) < total ? 'text-[#ef4444]' : 'text-[#16a34a]'}`}>
                      ${getChangeDue()}
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-5 border-t border-[#e5e7eb] bg-[#f9fafb]">
              <Button 
                className="w-full py-4 text-lg shadow-lg"
                onClick={handleProcessPayment}
                loading={processing}
                disabled={selectedPayment === 'cash' && (parseFloat(tenderAmount) || 0) < total}
              >
                Confirm & Pay
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TRANSACTION COMPLETE MODAL */}
      {showCompleteModal && completedOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-[400px] overflow-hidden shadow-2xl flex flex-col items-center p-8 text-center">
            <div className="w-20 h-20 bg-[#dcfce7] rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-[#16a34a]" />
            </div>
            <h2 className="text-2xl font-black text-[#111827] mb-1">Payment Successful</h2>
            <p className="text-[#9ca3af] font-medium mb-6">Order #{completedOrder.orderNumber || completedOrder._id?.slice(-6)}</p>
            
            <div className="w-full bg-[#f9fafb] rounded-xl p-4 mb-6 border border-[#e5e7eb]">
              <div className="flex justify-between mb-2">
                <span className="text-[#9ca3af] text-sm">Total Amount</span>
                <span className="font-bold text-[#111827]">${completedOrder.total?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9ca3af] text-sm">Payment Method</span>
                <span className="font-bold text-[#111827] capitalize">{selectedPayment.replace('_', ' ')}</span>
              </div>
              {selectedPayment === 'cash' && (
                <div className="flex justify-between mt-2 pt-2 border-t border-[#e5e7eb]">
                  <span className="text-[#9ca3af] text-sm font-bold">Change Due</span>
                  <span className="font-black text-[#16a34a]">${getChangeDue()}</span>
                </div>
              )}
            </div>

            <div className="w-full space-y-3">
              <Button 
                className="w-full py-4 bg-[#111827] hover:bg-black text-white" 
                icon={Printer}
                onClick={() => {
                  window.open(`/api/orders/${completedOrder._id}/invoice`, '_blank');
                }}
              >
                Print Receipt
              </Button>
              <Button 
                variant="outline"
                className="w-full py-4 border-2 border-[#e5e7eb] text-[#6b7280] hover:bg-[#f9fafb]" 
                icon={RotateCcw}
                onClick={() => {
                  setShowCompleteModal(false);
                  setCompletedOrder(null);
                  setTenderAmount('');
                }}
              >
                New Order
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CLOCK IN/OUT MODAL */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm space-y-6 text-center p-6 border border-[#e5e7eb]">
            <h2 className="text-2xl font-black text-[#111827]">
              {pinMode === 'in' ? 'Clock In' : 'Clock Out'}
            </h2>
            <p className="text-[#6b7280] text-sm">Enter your 4-digit POS PIN</p>
            
            <div className="text-3xl font-mono tracking-[1em] font-black text-[#8b0000] bg-[#f3f4f6] py-4 rounded-xl border border-[#e5e7eb]">
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
                    btn === 'OK' ? 'bg-[#8b0000] text-white hover:bg-[#8b0000]/80' : 
                    btn === 'C' ? 'bg-[#fef2f2] text-[#ef4444] hover:bg-error/20' : 
                    'bg-white border border-[#e5e7eb] text-[#111827] hover:bg-[#f3f4f6]'
                  }`}
                >
                  {btn}
                </button>
              ))}
            </div>
            
            <button onClick={() => setShowPinModal(false)} className="text-sm text-[#6b7280] hover:text-[#111827] underline mt-4 block mx-auto">
              Cancel
            </button>
          </div>
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
