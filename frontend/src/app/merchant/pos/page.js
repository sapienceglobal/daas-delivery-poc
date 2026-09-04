'use client';
// Trigger HMR


import { useState, useEffect, Suspense, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Store, ShoppingBag, Trash2, Plus, Minus, CreditCard, ChevronLeft, Clock, LogOut,
  User, Phone, Mail, Tag, DollarSign, Printer, RotateCcw, CheckCircle2, Terminal,
  MapPin, Loader2, QrCode, ChevronRight, Search, ArrowLeft, X
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { menuAPI, orderAPI, employeeAPI, paymentAPI, restaurantAPI, couponAPI } from '@/lib/api';
import {
  Button, showToast, Skeleton, Input
} from '@/components/ui';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import PaymentSimulatorModal from '@/components/checkout/PaymentSimulatorModal';
import { QRCodeSVG } from 'qrcode.react';

function POSContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tableId = searchParams.get('tableId');
  const tableNumber = searchParams.get('tableNumber');

  const { user, isMerchant, isAdmin, isAuthenticated } = useAuth();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [ticket, setTicket] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [orderType, setOrderType] = useState('takeout');
  const [splitWays, setSplitWays] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [restaurant, setRestaurant] = useState(null);

  useEffect(() => {
    if (user?.restaurantId) {
      restaurantAPI.getById(user.restaurantId)
        .then(res => {
          if (res?.data) {
            setRestaurant(res.data);
          }
        })
        .catch(err => console.error('Failed to load restaurant:', err));
    }
  }, [user?.restaurantId]);

  // SCROLLING LOGIC STATES & REFS
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const handleWheel = (e) => {
      if (e.deltaY !== 0 && e.deltaX === 0) {
        e.preventDefault();
        container.scrollBy({ left: e.deltaY, behavior: 'auto' });
      }
    };
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [mounted, categories]);

  const checkForScrollPosition = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(Math.ceil(scrollLeft) < scrollWidth - clientWidth - 2);
    }
  };

  useEffect(() => {
    checkForScrollPosition();
    window.addEventListener('resize', checkForScrollPosition);
    return () => window.removeEventListener('resize', checkForScrollPosition);
  }, [categories]);

  const scrollByAmount = (amount) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  // Customer Details
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  // Delivery Fields
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [addressState, setAddressState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [addressLat, setAddressLat] = useState(null);
  const [addressLng, setAddressLng] = useState(null);
  const [deliveryInstructions, setDeliveryInstructions] = useState('');

  // Delivery State
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [addressVerified, setAddressVerified] = useState(false);
  const sessionTokenRef = useRef(null);
  const [deliveryQuote, setDeliveryQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState(null);

  const [savedCustomerDetails, setSavedCustomerDetails] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    addressState: '',
    zipCode: '',
    addressLat: null,
    addressLng: null,
    deliveryInstructions: '',
    addressVerified: false,
    deliveryQuote: null,
    quoteError: null,
  });

  // Coupon
  const [couponCode, setCouponCode] = useState('');

  // Modals

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  // Payment State
  const [selectedPayment, setSelectedPayment] = useState('cash'); // cash, card_terminal, payment_link
  const [tenderAmount, setTenderAmount] = useState('');
  const [completedOrder, setCompletedOrder] = useState(null);

  // Payment Link State
  const [showPaymentLinkModal, setShowPaymentLinkModal] = useState(false);
  const [paymentLinkUrl, setPaymentLinkUrl] = useState('');
  const [paymentLinkOrderId, setPaymentLinkOrderId] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const [paymentLinkTimeLeft, setPaymentLinkTimeLeft] = useState(600); // 10 minutes

  // Item Customization State
  const [itemToCustomize, setItemToCustomize] = useState(null);
  const [customSize, setCustomSize] = useState(null);
  const [customAddOns, setCustomAddOns] = useState([]);
  const [customInstructions, setCustomInstructions] = useState('');

  const getSessionToken = () => {
    if (!sessionTokenRef.current) sessionTokenRef.current = Math.random().toString(36).substring(2) + Date.now().toString(36);
    return sessionTokenRef.current;
  };

  const handleAddressLine1Change = async (e) => {
    const val = e.target.value;
    setAddressLine1(val);
    setAddressVerified(false);

    if (val.length < 3) {
      setSuggestions([]);
      setSuggestionsLoading(false);
      return;
    }

    setSuggestionsLoading(true);
    try {
      const res = await fetch(`/api/location/autocomplete?q=${encodeURIComponent(val)}&sessionToken=${getSessionToken()}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setSuggestions(data);
        } else {
          setSuggestions([]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch address suggestions', err);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const handleSelectSuggestion = async (suggestion) => {
    if (suggestion.place_id) {
      try {
        const res = await fetch(`/api/location/place?place_id=${suggestion.place_id}&sessionToken=${getSessionToken()}`);
        if (res.ok) {
          const data = await res.json();
          setAddressLine1(data.address?.house_number ? `${data.address.house_number} ${data.address.road}`.trim() : data.address?.road || suggestion.main_text || '');
          setCity(data.address?.city || data.address?.town || data.address?.village || '');
          setAddressState(data.address?.state || '');
          setZipCode(data.address?.postcode || '');
          setAddressLat(data.lat || suggestion.lat || null);
          setAddressLng(data.lng || suggestion.lon || null);
          setAddressVerified(true);
          sessionTokenRef.current = null;
        }
      } catch (err) {
        console.error('Failed to fetch place details', err);
      } finally {
        setSuggestions([]);
      }
    } else {
      const parts = (suggestion.display_name || '').split(',').map((p) => p.trim());
      const addr = suggestion.address || {};
      setAddressLine1(addr.house_number ? `${addr.house_number} ${addr.road}` : addr.road || parts[0] || '');
      setCity(addr.city || addr.town || addr.village || parts[1] || '');
      setAddressState(addr.state || parts[2] || '');
      setZipCode(addr.postcode || '');
      setAddressLat(suggestion.lat || null);
      setAddressLng(suggestion.lon || null);
      setAddressVerified(true);
      setSuggestions([]);
      sessionTokenRef.current = null;
    }
  };

  const getDeliveryQuote = async () => {
    if (!addressLine1 || !city || !addressState || !zipCode) return;
    setQuoteLoading(true);
    setQuoteError(null);
    try {
      const fullAddr = `${addressLine1}, ${city}, ${addressState} ${zipCode}`;
      const data = await orderAPI.getDeliveryQuote({
        restaurantId: user.restaurantId,
        address: fullAddr,
        addressLat,
        addressLng
      });
      if (data.success && data.data) {
        setDeliveryQuote(data.data);
      } else {
        setQuoteError('Failed to calculate delivery fee');
        setDeliveryQuote(null);
      }
    } catch (err) {
      setQuoteError(err.message || 'Delivery quote failed');
      setDeliveryQuote(null);
    } finally {
      setQuoteLoading(false);
    }
  };

  // Re-fetch quote when address verification is successful
  useEffect(() => {
    if (orderType === 'delivery' && addressVerified) {
      getDeliveryQuote();
    }
  }, [addressVerified, orderType]);


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
        const allItemsCategory = { _id: 'all_items', name: 'All Items' };
        setCategories([allItemsCategory, ...groupedMenu]);
        setActiveCategory('all_items');
      }
    } catch (err) {
      showToast('Failed to load menu for POS', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let intervalId;
    if (isPolling && paymentLinkOrderId) {
      intervalId = setInterval(async () => {
        try {
          const res = await orderAPI.getById(paymentLinkOrderId);
          if (res.data?.paymentStatus === 'paid') {
            setIsPolling(false);
            setCompletedOrder(res.data);
            resetPOS();
            setShowPaymentLinkModal(false);
            setShowCompleteModal(true);
            showToast('Payment received via link!', 'success');
          }
        } catch (err) {
          console.error('Polling payment status failed:', err);
        }
      }, 3000); // Check every 3 seconds
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isPolling, paymentLinkOrderId]);

  useEffect(() => {
    let timerId;
    if (showPaymentLinkModal && paymentLinkTimeLeft > 0) {
      timerId = setInterval(() => {
        setPaymentLinkTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (showPaymentLinkModal && paymentLinkTimeLeft <= 0) {
      setIsPolling(false);
      setShowPaymentLinkModal(false);
      showToast('Payment link expired. Order will be cancelled by system.', 'error');
    }
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [showPaymentLinkModal, paymentLinkTimeLeft, paymentLinkOrderId]);

  const addToTicket = (item, size = null, addons = [], instructions = '') => {
    const basePrice = size ? size.price : item.price;
    const addonsPrice = addons.reduce((sum, a) => sum + (a.price || 0), 0);
    const finalPrice = basePrice + addonsPrice;
    
    const sortedAddonNames = [...addons].map(a => a.name).sort().join('|');
    const customKey = `${item._id}-${size?.name || ''}-${sortedAddonNames}-${instructions}`;

    setTicket(prev => {
      const existingIdx = prev.findIndex(i => (i.customKey && i.customKey === customKey) || (!i.customKey && i._id === item._id && !size && addons.length === 0 && !instructions));
      if (existingIdx >= 0) {
        const newTicket = [...prev];
        const updatedItem = { ...newTicket[existingIdx] };
        updatedItem.quantity += 1;
        updatedItem.lineTotal = updatedItem.price * updatedItem.quantity;
        newTicket[existingIdx] = updatedItem;
        return newTicket;
      }
      return [...prev, { 
        ...item, 
        customKey,
        price: finalPrice, 
        selectedSize: size,
        selectedAddOns: addons,
        specialInstructions: instructions,
        quantity: 1, 
        lineTotal: finalPrice 
      }];
    });
  };

  const handleItemClick = (item) => {
    const hasSizeVariations = item.sizeVariations && item.sizeVariations.length > 0;
    const hasAddOns = item.addOns && item.addOns.length > 0;
    
    if (hasSizeVariations || hasAddOns) {
      setItemToCustomize(item);
      setCustomSize(hasSizeVariations ? item.sizeVariations[0] : null);
      setCustomAddOns([]);
      setCustomInstructions('');
    } else {
      addToTicket(item);
    }
  };
  
  const handleCustomAddOnChange = (addon) => {
    const isChecked = customAddOns.some(a => a.name === addon.name);
    if (isChecked) {
      setCustomAddOns(customAddOns.filter(a => a.name !== addon.name));
    } else {
      setCustomAddOns([...customAddOns, addon]);
    }
  };
  
  const handleAddCustomizedItem = () => {
    if (!itemToCustomize) return;
    addToTicket(itemToCustomize, customSize, customAddOns, customInstructions);
    setItemToCustomize(null);
  };

  const updateQuantity = (idx, newQty) => {
    if (newQty < 1) {
      removeItem(idx);
      return;
    }
    const newTicket = [...ticket];
    newTicket[idx] = {
      ...newTicket[idx],
      quantity: newQty,
      lineTotal: newTicket[idx].price * newQty
    };
    setTicket(newTicket);
  };

  const removeItem = (idx) => {
    const newTicket = [...ticket];
    newTicket.splice(idx, 1);
    setTicket(newTicket);
  };

  const subtotal = ticket.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const rawTaxRate = restaurant?.taxRate ?? 0;
  const taxRateMultiplier = rawTaxRate < 1 ? rawTaxRate : (rawTaxRate / 100);
  const tax = Math.round(subtotal * taxRateMultiplier * 100) / 100;

  const deliveryFee = (orderType === 'delivery' && savedCustomerDetails.deliveryQuote) ? (savedCustomerDetails.deliveryQuote.fee || 0) : 0;

  const platformFee = 0;
  const rawServiceCharge = restaurant?.serviceCharge ?? 0;
  const serviceChargeMultiplier = rawServiceCharge < 1 ? rawServiceCharge : (rawServiceCharge / 100);
  const serviceFee = Math.round(subtotal * serviceChargeMultiplier * 100) / 100;

  const packagingFee = restaurant?.packagingCharge || 0;

  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const data = await couponAPI.validate(couponCode, subtotal, user.restaurantId);
      setCouponDiscount(data.data.discount);
      setCouponApplied(true);
      showToast(`Coupon applied successfully! -$${data.data.discount.toFixed(2)}`, 'success');
    } catch (err) {
      showToast(err.message || 'Invalid coupon code', 'error');
      setCouponDiscount(0);
      setCouponApplied(false);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponApplied(false);
    setCouponDiscount(0);
    setCouponCode('');
  };

  useEffect(() => {
    if (couponApplied && couponCode && subtotal > 0 && user?.restaurantId) {
      const revalidate = async () => {
        try {
          const data = await couponAPI.validate(couponCode, subtotal, user.restaurantId);
          if (data.data && typeof data.data.discount === 'number') {
            setCouponDiscount(data.data.discount);
          }
        } catch (err) {
          showToast('Coupon removed: Cart total no longer meets requirements', 'error');
          setCouponApplied(false);
          setCouponDiscount(0);
          setCouponCode('');
        }
      };
      revalidate();
    }
  }, [subtotal, user?.restaurantId, couponCode, couponApplied]);

  let rawTotal = Math.max(0, subtotal + tax + deliveryFee + platformFee + serviceFee + packagingFee - couponDiscount);
  const total = restaurant?.roundOff ? Math.round(rawTotal) : rawTotal;

  const isPhoneValid = customerPhone ? isValidPhoneNumber(customerPhone) : false;
  const isFullNameValid = customerName ? /^[a-zA-Z\s\-'.]+$/.test(customerName) : false;
  const isEmailValid = customerEmail ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail) : false;

  const validateDetails = (details) => {
    return {
      isPhoneValid: details.customerPhone ? isValidPhoneNumber(details.customerPhone) : false,
      isFullNameValid: details.customerName ? /^[a-zA-Z\s\-'.]+$/.test(details.customerName) : false,
      isEmailValid: details.customerEmail ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.customerEmail) : false
    };
  };

  const isCustomerInfoComplete = (details = { customerName, customerPhone, customerEmail, addressLine1, city, addressState, zipCode, addressVerified, quoteError }) => {
    const { isPhoneValid, isFullNameValid, isEmailValid } = validateDetails(details);
    if (!details.customerName || !isFullNameValid) return false;
    if (!details.customerPhone || !isPhoneValid) return false;
    if (details.customerEmail && !isEmailValid) return false;

    if (orderType === 'delivery') {
      if (!details.addressLine1 || !details.city || !details.addressState || !details.zipCode || !details.addressVerified || details.quoteError) {
        return false;
      }
    }
    return true;
  };

  const getChangeDue = () => {
    const tendered = parseFloat(tenderAmount) || 0;
    return Math.max(0, tendered - total).toFixed(2);
  };

  const initiateCheckout = () => {
    if (ticket.length === 0) return;

    if (orderType === 'delivery') {
      if (!savedCustomerDetails.addressLine1 || !savedCustomerDetails.city || !savedCustomerDetails.addressState || !savedCustomerDetails.zipCode) {
        showToast('Please fill out the delivery address completely', 'warning');
        return;
      }
      if (!savedCustomerDetails.addressVerified) {
        showToast('Please select a valid address from the dropdown suggestions.', 'error');
        return;
      }
      if (savedCustomerDetails.quoteError) {
        showToast(savedCustomerDetails.quoteError, 'error');
        return;
      }
      if (!savedCustomerDetails.deliveryQuote) {
        showToast('Delivery calculations not finalized. Please check address.', 'error');
        return;
      }
    }

    const { isPhoneValid, isFullNameValid, isEmailValid } = validateDetails(savedCustomerDetails);

    if (savedCustomerDetails.customerName && !isFullNameValid) {
      showToast('Name contains restricted characters.', 'error');
      return;
    }
    if (savedCustomerDetails.customerEmail && !isEmailValid) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }
    if (savedCustomerDetails.customerPhone && !isPhoneValid) {
      showToast('Please enter a valid phone number.', 'error');
      return;
    }
    if (orderType === 'delivery' && !isPhoneValid) {
      showToast('Phone number is required for delivery.', 'error');
      return;
    }

    setShowPaymentModal(true);
    setTenderAmount(total.toFixed(2).toString());
  };

  const handleProcessPayment = async (stripePaymentIntentId = null) => {
    setProcessing(true);
    try {
      const orderData = {
        restaurantId: user.restaurantId,
        items: ticket.map(item => ({
          menuItemId: item._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          lineTotal: item.price * item.quantity,
          selectedSize: item.selectedSize || undefined,
          selectedAddOns: item.selectedAddOns || undefined,
          specialInstructions: item.specialInstructions || undefined
        })),
        address: orderType === 'delivery'
          ? `${savedCustomerDetails.addressLine1}${savedCustomerDetails.addressLine2 ? ', ' + savedCustomerDetails.addressLine2 : ''}, ${savedCustomerDetails.city}, ${savedCustomerDetails.addressState} ${savedCustomerDetails.zipCode}`
          : (tableNumber ? `Table ${tableNumber}` : 'Walk-in Customer'),
        addressLat: orderType === 'delivery' ? savedCustomerDetails.addressLat : undefined,
        addressLng: orderType === 'delivery' ? savedCustomerDetails.addressLng : undefined,
        orderType: orderType === 'takeout' ? 'pickup' : (orderType === 'delivery' ? 'delivery' : 'dine_in'),
        paymentMethod: selectedPayment === 'card_terminal' ? 'credit_card' : (selectedPayment === 'payment_link' ? 'payment_link' : 'cash'),
        tableNumber: orderType === 'dine_in' ? tableNumber : null,

        // CRM Details
        customerName: savedCustomerDetails.customerName.trim() || undefined,
        customerPhone: savedCustomerDetails.customerPhone.trim() || undefined,
        customerEmail: savedCustomerDetails.customerEmail.trim() || undefined,

        // Discount
        couponCode: couponCode.trim() || undefined,

        // Delivery / Tracking
        stripePaymentIntentId,
        courierNotes: orderType === 'delivery' ? savedCustomerDetails.deliveryInstructions : `POS Payment: ${selectedPayment}`
      };

      const res = await orderAPI.create(orderData);

      if (selectedPayment === 'payment_link') {
        setPaymentLinkOrderId(res.data._id);
        setPaymentLinkUrl(res.data.paymentLinkUrl);
        setShowPaymentModal(false);
        setShowPaymentLinkModal(true);
        setPaymentLinkTimeLeft(600);
        setIsPolling(true);
      } else {
        setCompletedOrder(res.data);
        resetPOS();
        setShowPaymentModal(false);
        setShowCompleteModal(true);
        showToast('Order processed successfully!', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Failed to process order', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const resetPOS = () => {
    setTicket([]);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setAddressLine1('');
    setAddressLine2('');
    setCity('');
    setAddressState('');
    setZipCode('');
    setDeliveryInstructions('');
    setCouponCode('');
    setCouponApplied(false);
    setCouponDiscount(0);
    setDeliveryQuote(null);
    setAddressVerified(false);
    setSavedCustomerDetails({ customerName: '', customerPhone: '', customerEmail: '', addressLine1: '', addressLine2: '', city: '', addressState: '', zipCode: '', addressLat: null, addressLng: null, deliveryInstructions: '', addressVerified: false, deliveryQuote: null, quoteError: null });
  };

  const openCustomerModal = () => {
    setCustomerName(savedCustomerDetails.customerName);
    setCustomerPhone(savedCustomerDetails.customerPhone);
    setCustomerEmail(savedCustomerDetails.customerEmail);
    setAddressLine1(savedCustomerDetails.addressLine1);
    setAddressLine2(savedCustomerDetails.addressLine2);
    setCity(savedCustomerDetails.city);
    setAddressState(savedCustomerDetails.addressState);
    setZipCode(savedCustomerDetails.zipCode);
    setDeliveryInstructions(savedCustomerDetails.deliveryInstructions);
    setAddressVerified(savedCustomerDetails.addressVerified);
    setDeliveryQuote(savedCustomerDetails.deliveryQuote);
    setQuoteError(savedCustomerDetails.quoteError);
    setShowCustomerModal(true);
  };

  const handleSaveCustomerDetails = () => {
    setSavedCustomerDetails({
      customerName,
      customerPhone,
      customerEmail,
      addressLine1,
      addressLine2,
      city,
      addressState,
      zipCode,
      addressLat,
      addressLng,
      deliveryInstructions,
      addressVerified,
      deliveryQuote,
      quoteError
    });
    setShowCustomerModal(false);
  };

  const visibleItems = useMemo(() => {
    if (!searchQuery.trim()) {
      if (activeCategory === 'all_items') {
        const all = [];
        const seen = new Set();
        menu.forEach(cat => {
          (cat.items || []).forEach(item => {
            if (!seen.has(item._id)) {
              all.push(item);
              seen.add(item._id);
            }
          });
        });
        return all;
      }
      return menu.find(cat => cat._id === activeCategory)?.items || [];
    }

    const query = searchQuery.toLowerCase();
    const results = [];
    const seenIds = new Set();

    menu.forEach(cat => {
      (cat.items || []).forEach(item => {
        if (!seenIds.has(item._id)) {
          if (item.name.toLowerCase().includes(query) || (item.description && item.description.toLowerCase().includes(query))) {
            results.push(item);
            seenIds.add(item._id);
          }
        }
      });
    });

    return results;
  }, [menu, activeCategory, searchQuery]);

  if (loading) return <div className="p-8"><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="h-[calc(100vh-80px)] overflow-hidden flex flex-col md:flex-row gap-6 p-4">

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
          <div className="relative flex-1 max-w-md">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.trim().length > 0) {
                  setActiveCategory('all_items');
                }
              }}
              className="w-full pl-10 pr-3 py-2 bg-white border border-[#e5e7eb] rounded-lg text-sm focus:outline-none focus:border-[#8b0000] transition-shadow placeholder-[#9ca3af] text-[#111827]"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="relative shrink-0">
          <div
            ref={scrollContainerRef}
            onScroll={checkForScrollPosition}
            className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide scroll-smooth relative"
          >
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

          {/* Left Gradient & Button */}
          {canScrollLeft && (
            <div className="absolute left-0 top-0 bottom-2 w-16 bg-gradient-to-r from-white to-transparent z-10 flex items-center pointer-events-none">
              <button
                onClick={() => scrollByAmount(-200)}
                className="pointer-events-auto w-8 h-8 flex items-center justify-center bg-white border border-[#e5e7eb] rounded-full shadow-md text-[#4b5563] hover:text-[#8B0000] hover:border-[#8B0000] transition-colors"
              >
                <ChevronLeft className="w-5 h-5 -ml-0.5" />
              </button>
            </div>
          )}

          {/* Right Gradient & Button */}
          {canScrollRight && (
            <div className="absolute right-0 top-0 bottom-2 w-16 bg-gradient-to-l from-white to-transparent z-10 flex items-center justify-end pointer-events-none">
              <button
                onClick={() => scrollByAmount(200)}
                className="pointer-events-auto w-8 h-8 flex items-center justify-center bg-white border border-[#e5e7eb] rounded-full shadow-md text-[#4b5563] hover:text-[#8B0000] hover:border-[#8B0000] transition-colors"
              >
                <ChevronRight className="w-5 h-5 ml-0.5" />
              </button>
            </div>
          )}
        </div>

        {/* Items Grid */}
        <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-10 content-start">
          {visibleItems.map(item => (
            <div
              key={item._id}
              className="bg-white border border-[#e5e7eb] rounded-xl cursor-pointer hover:border-[#8b0000] hover:shadow-md transition-all flex flex-col overflow-hidden shadow-sm h-48"
              onClick={() => handleItemClick(item)}
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
          <div className="flex gap-2">
            <button
              className={`flex-1 py-1.5 text-[11px] font-bold rounded-md transition-colors ${orderType === 'takeout' ? 'bg-[#8b0000] text-white' : 'text-[#6b7280] hover:bg-[#f9fafb]'}`}
              onClick={() => setOrderType('takeout')}
            >
              Pickup
            </button>
            <button
              className={`flex-1 py-1.5 text-[11px] font-bold rounded-md transition-colors ${orderType === 'delivery' ? 'bg-[#8b0000] text-white' : 'text-[#6b7280] hover:bg-[#f9fafb]'}`}
              onClick={() => setOrderType('delivery')}
            >
              Delivery
            </button>
          </div>

          {/* Customer Summary & Edit Button */}
          <div className="bg-white border border-[#e5e7eb] rounded-lg p-2.5 flex items-center justify-between shadow-sm cursor-pointer hover:border-[#8b0000] transition-colors" onClick={openCustomerModal}>
            <div className="flex-1 flex flex-col min-w-0 pr-2">
              <div className="flex items-center gap-1.5 mb-1">
                <User className="w-3.5 h-3.5 text-[#9ca3af]" />
                <span className="text-[12px] font-bold text-[#111827] truncate">
                  {savedCustomerDetails.customerName || 'Add Customer'} {savedCustomerDetails.customerPhone && `• ${savedCustomerDetails.customerPhone}`}
                </span>
              </div>
              {orderType === 'delivery' && (
                <div className="flex items-start gap-1.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-[#9ca3af] mt-0.5 shrink-0" />
                  <span className="text-[11px] text-[#6b7280] line-clamp-2">
                    {savedCustomerDetails.addressLine1 ? `${savedCustomerDetails.addressLine1}${savedCustomerDetails.addressLine2 ? ', ' + savedCustomerDetails.addressLine2 : ''}, ${savedCustomerDetails.city}, ${savedCustomerDetails.addressState} ${savedCustomerDetails.zipCode}` : 'Add Delivery Address'}
                    {savedCustomerDetails.quoteError ? ' (Fee Error)' : savedCustomerDetails.deliveryQuote ? ` (Fee: $${savedCustomerDetails.deliveryQuote.fee.toFixed(2)})` : ''}
                  </span>
                </div>
              )}
            </div>
            <button className="text-[11px] font-bold text-[#8b0000] bg-[#8b0000]/10 px-2.5 py-1 rounded-md shrink-0">
              Edit
            </button>
          </div>
        </div>

        {/* Ticket Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#f9fafb]">
          {ticket.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-[#9ca3af] text-sm gap-3">
              <ShoppingBag className="h-12 w-12 opacity-30" />
              <p>Search or select items to start</p>
            </div>
          ) : (
            ticket.map((item, idx) => (
              <div key={idx} className="flex flex-col bg-white p-3 rounded-xl border border-[#e5e7eb] shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 pr-2">
                    <p className="text-[13px] font-bold text-[#111827] leading-tight">{item.name}</p>
                    {item.selectedSize && <p className="text-[11px] text-[#6b7280]">Size: {item.selectedSize.name}</p>}
                    {item.selectedAddOns?.length > 0 && <p className="text-[11px] text-[#6b7280]">Extras: {item.selectedAddOns.map(a => a.name).join(', ')}</p>}
                    {item.specialInstructions && <p className="text-[11px] text-[#e8a020] truncate">Note: {item.specialInstructions}</p>}
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
            <button
              type="button"
              onClick={handleApplyCoupon}
              disabled={couponLoading || couponApplied || ticket.length === 0}
              className={`text-[13px] font-bold text-white bg-[#8b0000] hover:bg-[#7a0b10] px-4 rounded-lg h-[38px] transition-colors ${(couponLoading || couponApplied || ticket.length === 0) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
            >
              {couponLoading ? '...' : 'Apply'}
            </button>
          </div>

          {couponApplied && (
            <div className="flex items-center justify-between mb-3 px-3 py-2 bg-[#f2fcf5] border border-[#d1fae5] rounded-lg">
              <span className="text-[#1fae64] text-[12px] font-bold">
                {couponCode} Applied <span className="font-medium ml-1">(-${couponDiscount.toFixed(2)})</span>
              </span>
              <button onClick={handleRemoveCoupon} className="text-[#1fae64] hover:text-[#16a34a] transition-colors" aria-label="Remove coupon">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="space-y-1.5 mb-4 border-t border-dashed border-[#e5e7eb] pt-3">
            <div className="flex justify-between items-center text-[13px] text-[#4b5563]">
              <span>Subtotal ({ticket.length} Items)</span>
              <span className="font-bold text-[#111827]">${subtotal.toFixed(2)}</span>
            </div>

            {orderType === 'delivery' && (
              <div className="flex justify-between items-center text-[13px] text-[#4b5563]">
                <span>Delivery Fee</span>
                <span className="font-bold text-[#111827]">
                  {deliveryFee === 0 ? 'FREE' : `$${deliveryFee.toFixed(2)}`}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center text-[13px] text-[#4b5563]">
              <span>{restaurant?.taxType || 'Taxes & Charges'}</span>
              <span className="font-bold text-[#111827]">${tax.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center text-[13px] text-[#4b5563]">
              <span>Platform Fee</span>
              <span className="font-bold text-[#111827]">${platformFee.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center text-[13px] text-[#4b5563]">
              <span>Service Fee</span>
              <span className="font-bold text-[#111827]">${serviceFee.toFixed(2)}</span>
            </div>

            {packagingFee > 0 && (
              <div className="flex justify-between items-center text-[13px] text-[#4b5563]">
                <span>Packaging Fee</span>
                <span className="font-bold text-[#111827]">${packagingFee.toFixed(2)}</span>
              </div>
            )}

            {couponApplied && couponDiscount > 0 && (
              <div className="flex justify-between items-center text-[13px] text-[#1fae64]">
                <span className="font-bold">Discount ({couponCode})</span>
                <span className="font-black">-${couponDiscount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-xl font-black text-[#111827] pt-3 border-t border-[#e5e7eb] mt-2">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <button
            className="w-full py-4 text-lg font-black shadow-md bg-[#8b0000] text-white rounded-xl hover:bg-[#7a0000] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={initiateCheckout}
            disabled={ticket.length === 0 || !isCustomerInfoComplete(savedCustomerDetails)}
          >
            <CreditCard className="w-5 h-5" /> Charge ${total.toFixed(2)}
          </button>
        </div>
      </div>

      {/* PAYMENT MODAL */}
      {mounted && showPaymentModal && createPortal(
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

              <div className="grid grid-cols-3 gap-3 mb-6">
                <button
                  onClick={() => setSelectedPayment('cash')}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center text-center justify-center gap-2 transition-all ${selectedPayment === 'cash' ? 'border-[#8b0000] bg-[#fef2f2] text-[#8b0000]' : 'border-[#e5e7eb] text-[#9ca3af] hover:bg-[#f9fafb]'}`}
                >
                  <DollarSign className="w-8 h-8 mx-auto" />
                  <span className="font-bold text-sm">Pay Later (Cash)</span>
                </button>
                <button
                  onClick={() => { setSelectedPayment('card_terminal'); setTenderAmount(total.toFixed(2)); }}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center text-center justify-center gap-2 transition-all ${selectedPayment === 'card_terminal' ? 'border-[#8b0000] bg-[#fef2f2] text-[#8b0000]' : 'border-[#e5e7eb] text-[#9ca3af] hover:bg-[#f9fafb]'}`}
                >
                  <CreditCard className="w-8 h-8 mx-auto" />
                  <span className="font-bold text-sm">Pay Now (Card)</span>
                </button>
                <button
                  onClick={() => { setSelectedPayment('payment_link'); }}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center text-center justify-center gap-2 transition-all ${selectedPayment === 'payment_link' ? 'border-[#8b0000] bg-[#fef2f2] text-[#8b0000]' : 'border-[#e5e7eb] text-[#9ca3af] hover:bg-[#f9fafb]'}`}
                >
                  <QrCode className="w-8 h-8 mx-auto" />
                  <span className="font-bold text-sm">Send Link (QR/SMS)</span>
                </button>
              </div>


            </div>

            <div className="p-5 border-t border-[#e5e7eb] bg-[#f9fafb]">
              <Button
                className="w-full py-4 text-lg shadow-lg bg-[#111827] text-white hover:bg-black"
                onClick={() => {
                  if (selectedPayment === 'card_terminal') {
                    setShowPaymentModal(false);
                    setShowStripeModal(true);
                  } else {
                    handleProcessPayment();
                  }
                }}
                loading={processing}
              >
                Confirm & Pay
              </Button>
            </div>
          </div>
        </div>
        , document.body)}

      {/* PAYMENT LINK WAITING MODAL */}
      {mounted && showPaymentLinkModal && paymentLinkOrderId && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-[450px] overflow-hidden shadow-2xl flex flex-col p-8 text-center">
            <h2 className="text-2xl font-black text-[#111827] mb-2">Waiting for Payment</h2>
            <p className="text-[#6b7280] mb-6">Have the customer scan this QR code or send them the link to pay securely.</p>

            <div className="flex justify-center bg-white p-4 border-2 border-gray-100 rounded-xl mb-6 shadow-inner mx-auto w-fit">
              <QRCodeSVG value={`${window.location.origin}/api/orders/${paymentLinkOrderId}/pay`} size={200} level="H" />
            </div>

            <div className="text-center font-bold text-[#ef4444] mb-4 bg-[#fef2f2] rounded-lg py-2 mt-4">
              Time Remaining: {Math.floor(paymentLinkTimeLeft / 60).toString().padStart(2, '0')}:{(paymentLinkTimeLeft % 60).toString().padStart(2, '0')}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                className="w-full py-2 bg-white border border-[#e5e7eb] rounded-lg font-bold text-[#374151] hover:bg-[#f9fafb] transition-colors text-[13px]"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/api/orders/${paymentLinkOrderId}/pay`);
                  showToast('Link copied to clipboard!', 'success');
                }}
              >
                Copy Link
              </button>
              <button
                className="w-full py-2 text-[#25D366] border border-[#25D366] rounded-lg font-bold hover:bg-[#25D366]/10 transition-colors text-[13px]"
                onClick={() => {
                  const payUrl = `${window.location.origin}/api/orders/${paymentLinkOrderId}/pay`;
                  const message = `Hi! Please complete your payment of your order here:\n${payUrl}`;
                  const rawPhone = savedCustomerDetails.customerPhone?.trim();
                  if (rawPhone) {
                    // Strip everything except digits, ensure international format
                    const digits = rawPhone.replace(/[^\d]/g, '');
                    // If it starts with 0, assume US and prepend 1; if already has country code, use as-is
                    const intlPhone = digits.startsWith('0') ? '1' + digits.slice(1) : (digits.length === 10 ? '1' + digits : digits);
                    window.open(`https://wa.me/${intlPhone}?text=${encodeURIComponent(message)}`, '_blank');
                  } else {
                    // No phone — open generic WhatsApp share
                    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
                    showToast('No customer phone saved. WhatsApp opened for manual selection.', 'info');
                  }
                }}
              >
                WhatsApp
              </button>
              <button
                className="w-full py-2 bg-white border border-[#3b82f6] text-[#3b82f6] rounded-lg font-bold hover:bg-[#eff6ff] transition-colors text-[13px]"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: 'Payment Link',
                      url: `${window.location.origin}/api/orders/${paymentLinkOrderId}/pay`
                    }).catch(console.error);
                  } else {
                    navigator.clipboard.writeText(`${window.location.origin}/api/orders/${paymentLinkOrderId}/pay`);
                    showToast('Share not supported on this browser. Link copied instead!', 'info');
                  }
                }}
              >
                Share
              </button>
            </div>

            <div className="flex flex-col gap-2 mt-6">
              <button
                className="w-full py-3 bg-white border border-[#e5e7eb] text-[#374151] font-bold rounded-xl hover:bg-[#f9fafb] transition-colors"
                onClick={() => {
                  setIsPolling(false);
                  setShowPaymentLinkModal(false);
                  showToast('Order running in background. Check Live Orders to restore QR.', 'info');
                }}
              >
                Run in Background
              </button>
              <button
                className="w-full py-3 bg-white border border-[#fecaca] text-[#ef4444] font-bold rounded-xl hover:bg-[#fef2f2] transition-colors"
                onClick={async () => {
                  try {
                    await orderAPI.reject(paymentLinkOrderId, 'Cancelled by merchant at POS');
                    setIsPolling(false);
                    setShowPaymentLinkModal(false);
                    showToast('Order cancelled successfully.', 'success');
                  } catch (e) {
                    showToast('Failed to cancel order', 'error');
                  }
                }}
              >
                Cancel Order
              </button>
            </div>
          </div>
        </div>
        , document.body)}

      {/* TRANSACTION COMPLETE MODAL */}
      {mounted && showCompleteModal && completedOrder && createPortal(
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
        , document.body)}


      {/* CUSTOMER & DELIVERY MODAL */}
      {mounted && showCustomerModal && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-[500px] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-5 border-b border-[#e5e7eb] bg-[#f3f4f6] flex justify-between items-center">
              <h2 className="text-xl font-black text-[#111827]">Customer Details</h2>
              <button onClick={() => setShowCustomerModal(false)} className="p-2 text-[#9ca3af] hover:text-[#111827] rounded-full hover:bg-[#f3f4f6]"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-[13px] font-bold text-[#374151] mb-1">Full Name</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5">
                    <User className="w-4 h-4 text-[#9ca3af]" />
                  </div>
                  <input
                    type="text" placeholder="John Doe"
                    value={customerName} onChange={e => setCustomerName(e.target.value)}
                    className={`w-full pl-10 pr-3 py-2 text-[14px] bg-white border rounded-lg outline-none text-[#111827] placeholder-[#9ca3af] ${customerName && !isFullNameValid ? 'border-[#ef4444] focus:border-[#ef4444] ring-1 ring-[#ef4444]' : 'border-[#e5e7eb] focus:border-[#8b0000] focus:ring-1 focus:ring-[#8b0000]'}`}
                  />
                </div>
                {customerName && !isFullNameValid && <p className="text-[11px] text-[#ef4444] mt-1">Please enter a valid name without special characters.</p>}
              </div>

              <div>
                <label className="block text-[13px] font-bold text-[#374151] mb-1">Phone Number</label>
                <div className={`relative bg-white border rounded-lg overflow-hidden focus-within:ring-1 ${customerPhone && !isPhoneValid ? 'border-[#ef4444] focus-within:border-[#ef4444] focus-within:ring-[#ef4444]' : 'border-[#e5e7eb] focus-within:border-[#8b0000] focus-within:ring-[#8b0000]'}`}>
                  <PhoneInput
                    international
                    defaultCountry="US"
                    value={customerPhone}
                    onChange={setCustomerPhone}
                    className="w-full !text-[14px] p-2 [&>input]:border-none [&>input]:outline-none [&>input]:w-full [&>input]:bg-transparent [&>input]:text-[#111827] flex items-center [&>.PhoneInputCountry]:mr-2"
                    placeholder="Enter phone number"
                  />
                </div>
                {customerPhone && !isPhoneValid && <p className="text-[11px] text-[#ef4444] mt-1">Please enter a valid phone number with country code.</p>}
              </div>

              <div>
                <label className="block text-[13px] font-bold text-[#374151] mb-1">Email Address</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5">
                    <Mail className="w-4 h-4 text-[#9ca3af]" />
                  </div>
                  <input
                    type="email" placeholder="john@example.com"
                    value={customerEmail} onChange={e => setCustomerEmail(e.target.value)}
                    className={`w-full pl-10 pr-3 py-2 text-[14px] bg-white border rounded-lg outline-none text-[#111827] placeholder-[#9ca3af] ${customerEmail && !isEmailValid ? 'border-[#ef4444] focus:border-[#ef4444] ring-1 ring-[#ef4444]' : 'border-[#e5e7eb] focus:border-[#8b0000] focus:ring-1 focus:ring-[#8b0000]'}`}
                  />
                </div>
                {customerEmail && !isEmailValid && <p className="text-[11px] text-[#ef4444] mt-1">Please enter a valid email address.</p>}
              </div>

              {orderType === 'delivery' && (
                <div className="pt-4 border-t border-[#e5e7eb] mt-4 space-y-4">
                  <h3 className="font-bold text-[#111827] flex items-center gap-2"><MapPin className="w-4 h-4 text-[#8b0000]" /> Delivery Address</h3>

                  <div className="relative z-50">
                    <input
                      type="text"
                      value={addressLine1}
                      onChange={handleAddressLine1Change}
                      placeholder="Start typing street address..."
                      className="w-full px-3 py-2 text-[14px] bg-white border border-[#e5e7eb] rounded-lg focus:border-[#8b0000] focus:ring-1 focus:ring-[#8b0000] outline-none text-[#111827] placeholder-[#9ca3af]"
                    />
                    {suggestionsLoading && (
                      <div className="absolute right-3 top-2.5">
                        <Loader2 className="w-4 h-4 animate-spin text-[#9ca3af]" />
                      </div>
                    )}
                    {suggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#e5e7eb] rounded-lg shadow-xl max-h-48 overflow-y-auto">
                        {suggestions.map((s, i) => (
                          <div
                            key={i}
                            onClick={() => handleSelectSuggestion(s)}
                            className="px-3 py-2 text-[13px] hover:bg-[#f3f4f6] cursor-pointer text-[#111827] border-b border-[#e5e7eb] last:border-0"
                          >
                            {s.description || s.display_name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={addressLine2}
                      onChange={(e) => setAddressLine2(e.target.value)}
                      placeholder="Apt, Suite (Opt)"
                      className="w-1/3 px-3 py-2 text-[14px] bg-white border border-[#e5e7eb] rounded-lg focus:border-[#8b0000] focus:ring-1 focus:ring-[#8b0000] outline-none text-[#111827] placeholder-[#9ca3af]"
                    />
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City"
                      className="w-2/3 px-3 py-2 text-[14px] bg-white border border-[#e5e7eb] rounded-lg focus:border-[#8b0000] focus:ring-1 focus:ring-[#8b0000] outline-none text-[#111827] placeholder-[#9ca3af]"
                    />
                  </div>

                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={addressState}
                      onChange={(e) => setAddressState(e.target.value)}
                      placeholder="State"
                      className="w-1/2 px-3 py-2 text-[14px] bg-white border border-[#e5e7eb] rounded-lg focus:border-[#8b0000] focus:ring-1 focus:ring-[#8b0000] outline-none text-[#111827] placeholder-[#9ca3af]"
                    />
                    <input
                      type="text"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      placeholder="ZIP Code"
                      className="w-1/2 px-3 py-2 text-[14px] bg-white border border-[#e5e7eb] rounded-lg focus:border-[#8b0000] focus:ring-1 focus:ring-[#8b0000] outline-none text-[#111827] placeholder-[#9ca3af]"
                    />
                  </div>

                  <textarea
                    value={deliveryInstructions}
                    onChange={(e) => setDeliveryInstructions(e.target.value)}
                    placeholder="Delivery instructions (e.g. Leave at door)"
                    rows={2}
                    className="w-full px-3 py-2 text-[14px] bg-white border border-[#e5e7eb] rounded-lg focus:border-[#8b0000] focus:ring-1 focus:ring-[#8b0000] outline-none text-[#111827] placeholder-[#9ca3af] resize-none"
                  />

                  <div className="bg-[#f9fafb] p-3 rounded-lg border border-[#e5e7eb] flex items-center justify-between text-sm">
                    <span className="text-[#6b7280] font-bold">Delivery Fee</span>
                    <span>
                      {quoteLoading ? 'Calculating...' : quoteError ? <span className="text-[#ef4444] font-bold">{quoteError}</span> : (deliveryQuote ? <span className="text-[#16a34a] font-black">${deliveryQuote.fee.toFixed(2)}</span> : <span className="text-[#9ca3af]">Enter address</span>)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-[#e5e7eb] bg-[#f9fafb]">
              <Button
                className={`w-full py-3.5 text-[15px] shadow-sm ${!isCustomerInfoComplete() ? 'opacity-50 cursor-not-allowed bg-[#9ca3af]' : 'bg-[#111827] text-white hover:bg-black'}`}
                onClick={handleSaveCustomerDetails}
                disabled={!isCustomerInfoComplete()}
              >
                Save Details
              </Button>
            </div>
          </div>
        </div>
        , document.body)}

      {/* ITEM CUSTOMIZATION MODAL */}
      {mounted && itemToCustomize && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-[500px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-[#e5e7eb] bg-[#f9fafb]">
              <h2 className="text-xl font-black text-[#111827]">Customize {itemToCustomize.name}</h2>
              <button onClick={() => setItemToCustomize(null)} className="p-2 text-[#9ca3af] hover:text-[#111827] rounded-full hover:bg-[#f3f4f6]">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto">
              {/* Size Variations */}
              {itemToCustomize.sizeVariations?.length > 0 && (
                <div>
                  <h3 className="text-[14px] font-bold text-[#111827] mb-3">Choose Size</h3>
                  <div className="space-y-2">
                    {itemToCustomize.sizeVariations.map((size, idx) => (
                      <label key={idx} className="flex items-center justify-between p-3 rounded-xl border border-[#e5e7eb] cursor-pointer hover:border-[#8b0000] transition-colors">
                        <div className="flex items-center gap-3">
                          <input 
                            type="radio" 
                            name="pos-size" 
                            checked={customSize?.name === size.name}
                            onChange={() => setCustomSize(size)}
                            className="w-4 h-4 text-[#8b0000] focus:ring-[#8b0000]" 
                          />
                          <span className="text-[14px] font-medium text-[#374151]">{size.name}</span>
                        </div>
                        <span className="text-[14px] font-bold text-[#111827]">${size.price.toFixed(2)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Add-ons */}
              {itemToCustomize.addOns?.length > 0 && (
                <div>
                  <h3 className="text-[14px] font-bold text-[#111827] mb-3">Add Extras</h3>
                  <div className="space-y-2">
                    {itemToCustomize.addOns.map((addon, idx) => {
                      const isChecked = customAddOns.some(a => a.name === addon.name);
                      return (
                        <label key={idx} className="flex items-center justify-between p-3 rounded-xl border border-[#e5e7eb] cursor-pointer hover:border-[#8b0000] transition-colors">
                          <div className="flex items-center gap-3">
                            <input 
                              type="checkbox" 
                              checked={isChecked}
                              onChange={() => handleCustomAddOnChange(addon)}
                              className="w-4 h-4 text-[#8b0000] focus:ring-[#8b0000] rounded" 
                            />
                            <span className="text-[14px] font-medium text-[#374151]">{addon.name}</span>
                          </div>
                          <span className="text-[14px] font-bold text-[#111827]">+${addon.price.toFixed(2)}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Special Instructions */}
              <div>
                <h3 className="text-[14px] font-bold text-[#111827] mb-3">Special Instructions</h3>
                <textarea 
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="e.g. Extra spicy, no onions..."
                  className="w-full p-3 rounded-xl border border-[#e5e7eb] bg-white text-[#111827] placeholder:text-[#9ca3af] text-[14px] focus:outline-none focus:border-[#8b0000] resize-none h-24"
                />
              </div>
            </div>

            <div className="p-4 border-t border-[#e5e7eb] bg-[#f9fafb]">
              <Button 
                className="w-full py-4 bg-[#8b0000] text-white hover:bg-[#7a0b10] shadow-md font-bold text-[16px]"
                onClick={handleAddCustomizedItem}
              >
                Add to Ticket - ${(
                  (customSize ? customSize.price : itemToCustomize.price) + 
                  customAddOns.reduce((sum, a) => sum + (a.price || 0), 0)
                ).toFixed(2)}
              </Button>
            </div>
          </div>
        </div>
      , document.body)}

      <PaymentSimulatorModal
        isOpen={showStripeModal}
        onClose={() => setShowStripeModal(false)}
        amount={total}
        checkoutData={{
          restaurantId: user.restaurantId,
          items: ticket.map(item => ({
            menuItemId: item._id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            lineTotal: item.price * item.quantity,
            selectedSize: item.selectedSize || undefined,
            selectedAddOns: item.selectedAddOns || undefined,
            specialInstructions: item.specialInstructions || undefined
          })),
          orderType: orderType === 'takeout' ? 'pickup' : (orderType === 'delivery' ? 'delivery' : 'dine_in'),
          address: orderType === 'delivery' ? `${savedCustomerDetails.addressLine1}${savedCustomerDetails.addressLine2 ? ', ' + savedCustomerDetails.addressLine2 : ''}, ${savedCustomerDetails.city}, ${savedCustomerDetails.addressState} ${savedCustomerDetails.zipCode}` : undefined,
          addressLat: orderType === 'delivery' ? savedCustomerDetails.addressLat : undefined,
          addressLng: orderType === 'delivery' ? savedCustomerDetails.addressLng : undefined,
          deliveryQuote: savedCustomerDetails.deliveryQuote || undefined,
          couponCode: couponCode.trim() || undefined,
          customerName: savedCustomerDetails.customerName.trim() || undefined,
          customerPhone: savedCustomerDetails.customerPhone.trim() || undefined,
          customerEmail: savedCustomerDetails.customerEmail.trim() || undefined
        }}
        onSuccess={(paymentIntentId) => {
          setShowStripeModal(false);
          setShowPaymentModal(false);
          handleProcessPayment(paymentIntentId);
        }}
      />
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


