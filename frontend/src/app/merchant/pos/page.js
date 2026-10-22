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
  Button, showToast, Skeleton, Input, PageLoader
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
  const [selectedPayment, setSelectedPayment] = useState('card_terminal'); // card_terminal, payment_link
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
  const isFullNameValid = customerName ? /^[a-zA-Z0-9\s\-'.@_+]+$/.test(customerName) : false;
  const isEmailValid = customerEmail ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail) : false;

  const validateDetails = (details) => {
    return {
      isPhoneValid: details.customerPhone ? isValidPhoneNumber(details.customerPhone) : false,
      isFullNameValid: details.customerName ? /^[a-zA-Z0-9\s\-'.@_+]+$/.test(details.customerName) : false,
      isEmailValid: details.customerEmail ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.customerEmail) : false
    };
  };

  const isCustomerInfoComplete = (details = { customerName, customerPhone, customerEmail, addressLine1, city, addressState, zipCode, addressVerified, quoteError }) => {
    const { isPhoneValid, isFullNameValid, isEmailValid } = validateDetails(details);
    if (!details.customerName || !isFullNameValid) return false;
    
    const hasValidPhone = details.customerPhone && isPhoneValid;
    const hasValidEmail = details.customerEmail && isEmailValid;
    
    // Must have at least one valid contact method for non-delivery orders
    if (orderType !== 'delivery' && !hasValidPhone && !hasValidEmail) return false;
    
    // For delivery, phone number is strictly required by Shipday
    if (orderType === 'delivery' && !hasValidPhone) return false;
    
    // If they typed something but it's invalid, block checkout
    if (details.customerPhone && !isPhoneValid) return false;
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
        customerName: savedCustomerDetails.customerName?.trim() || undefined,
        customerPhone: savedCustomerDetails.customerPhone?.trim() || undefined,
        customerEmail: savedCustomerDetails.customerEmail?.trim() || undefined,

        // Discount
        couponCode: couponCode?.trim() || undefined,

        // Delivery / Tracking
        stripePaymentIntentId,
        courierNotes: orderType === 'delivery' ? savedCustomerDetails.deliveryInstructions : `POS Payment: ${selectedPayment}`,
        
        orderSource: 'merchant_web'
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

  if (loading) return <PageLoader text="Loading POS Terminal..." />;

  return (
    <div className="h-[calc(100vh-120px)] overflow-hidden flex flex-col md:flex-row gap-5 text-admin-text">

      {/* Left: Menu Items */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button 
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-admin-muted hover:text-admin-text hover:bg-admin-surface rounded-xl border border-admin-border transition-colors font-outfit" 
              onClick={() => router.push('/merchant')}
            >
              <ChevronLeft className="h-4 w-4" /> Dashboard
            </button>
            <h1 className="text-xl font-black text-admin-text flex items-center gap-2 font-outfit">
              <Store className="h-5 w-5 text-primary" /> Point of Sale
            </h1>
          </div>
          <div className="relative flex-1 max-w-md">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-admin-muted pointer-events-none">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search dishes, drinks, appetizers..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.trim().length > 0) {
                  setActiveCategory('all_items');
                }
              }}
              className="w-full pl-10 pr-3.5 py-2 bg-admin-surface border border-admin-border rounded-xl text-xs font-medium text-admin-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-admin-muted"
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
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all font-outfit
                  ${activeCategory === cat._id 
                    ? 'bg-gradient-to-r from-primary to-primary-hover text-white shadow-md shadow-primary/20' 
                    : 'bg-admin-surface border border-admin-border text-admin-muted hover:text-admin-text hover:bg-admin-surface-2'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Left Gradient & Button */}
          {canScrollLeft && (
            <div className="absolute left-0 top-0 bottom-2 w-16 bg-gradient-to-r from-admin-bg to-transparent z-10 flex items-center pointer-events-none">
              <button
                onClick={() => scrollByAmount(-200)}
                className="pointer-events-auto w-7 h-7 flex items-center justify-center bg-admin-surface border border-admin-border rounded-full shadow-md text-admin-muted hover:text-primary hover:border-primary transition-colors"
              >
                <ChevronLeft className="w-4 h-4 -ml-0.5" />
              </button>
            </div>
          )}

          {/* Right Gradient & Button */}
          {canScrollRight && (
            <div className="absolute right-0 top-0 bottom-2 w-16 bg-gradient-to-l from-admin-bg to-transparent z-10 flex items-center justify-end pointer-events-none">
              <button
                onClick={() => scrollByAmount(200)}
                className="pointer-events-auto w-7 h-7 flex items-center justify-center bg-admin-surface border border-admin-border rounded-full shadow-md text-admin-muted hover:text-primary hover:border-primary transition-colors"
              >
                <ChevronRight className="w-4 h-4 ml-0.5" />
              </button>
            </div>
          )}
        </div>

        {/* Items Grid */}
        <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-10 content-start">
          {visibleItems.map(item => (
            <div
              key={item._id}
              className="bg-admin-surface border border-admin-border rounded-2xl cursor-pointer hover:border-primary hover:shadow-lg transition-all flex flex-col overflow-hidden shadow-sm h-48 group"
              onClick={() => handleItemClick(item)}
            >
              <div className="h-24 bg-admin-surface-2 w-full shrink-0 flex items-center justify-center overflow-hidden relative">
                {item.image || item.imageUrl ? (
                  <img src={item.image || item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <Store className="w-8 h-8 text-admin-muted opacity-40" />
                )}
              </div>
              <div className="p-3 flex flex-col justify-between flex-1">
                <div>
                  <h3 className="font-bold text-admin-text text-xs leading-tight line-clamp-1 mb-0.5 font-outfit">{item.name}</h3>
                  <p className="text-[11px] text-admin-muted line-clamp-1 leading-snug">{item.description || 'No description'}</p>
                </div>
                <p className="text-primary font-black mt-1 text-sm font-outfit">${item.price.toFixed(2)}</p>
              </div>
            </div>
          ))}
          {visibleItems.length === 0 && (
            <div className="col-span-full text-center text-admin-muted py-12 text-xs font-semibold">No items found in this category.</div>
          )}
        </div>
      </div>

      {/* Right: Current Ticket */}
      <div className="w-full md:w-[360px] lg:w-[420px] flex flex-col bg-admin-surface border border-admin-border rounded-2xl overflow-hidden shrink-0 shadow-sm">

        {/* Order Type & Customer Details */}
        <div className="bg-admin-surface-2/60 border-b border-admin-border p-4 flex flex-col gap-3">
          <div className="flex gap-2">
            <button
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all font-outfit ${
                orderType === 'takeout' 
                  ? 'bg-gradient-to-r from-primary to-primary-hover text-white shadow-sm' 
                  : 'text-admin-muted hover:text-admin-text hover:bg-admin-surface border border-admin-border'
              }`}
              onClick={() => setOrderType('takeout')}
            >
              Pickup / Takeout
            </button>
            <button
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all font-outfit ${
                orderType === 'delivery' 
                  ? 'bg-gradient-to-r from-primary to-primary-hover text-white shadow-sm' 
                  : 'text-admin-muted hover:text-admin-text hover:bg-admin-surface border border-admin-border'
              }`}
              onClick={() => setOrderType('delivery')}
            >
              Delivery Order
            </button>
          </div>

          {/* Customer Summary & Edit Button */}
          <div 
            className="bg-admin-surface border border-admin-border rounded-xl p-3 flex items-center justify-between shadow-xs cursor-pointer hover:border-primary transition-colors" 
            onClick={openCustomerModal}
          >
            <div className="flex-1 flex flex-col min-w-0 pr-2">
              <div className="flex items-center gap-1.5 mb-0.5">
                <User className="w-3.5 h-3.5 text-admin-muted" />
                <span className="text-xs font-bold text-admin-text truncate font-outfit">
                  {savedCustomerDetails.customerName || 'Add Customer Details'} {savedCustomerDetails.customerPhone && `• ${savedCustomerDetails.customerPhone}`}
                </span>
              </div>
              {orderType === 'delivery' && (
                <div className="flex items-start gap-1.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-admin-muted mt-0.5 shrink-0" />
                  <span className="text-[11px] text-admin-muted line-clamp-2">
                    {savedCustomerDetails.addressLine1 ? `${savedCustomerDetails.addressLine1}${savedCustomerDetails.addressLine2 ? ', ' + savedCustomerDetails.addressLine2 : ''}, ${savedCustomerDetails.city}, ${savedCustomerDetails.addressState} ${savedCustomerDetails.zipCode}` : 'Tap to add delivery address'}
                    {savedCustomerDetails.quoteError ? ' (Delivery Fee Error)' : savedCustomerDetails.deliveryQuote ? ` (Fee: $${savedCustomerDetails.deliveryQuote.fee.toFixed(2)})` : ''}
                  </span>
                </div>
              )}
            </div>
            <button className="text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg shrink-0 font-outfit">
              Edit
            </button>
          </div>
        </div>

        {/* Ticket Items */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2 bg-admin-surface-2/30">
          {ticket.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-admin-muted text-xs gap-2 py-12">
              <ShoppingBag className="h-10 w-10 opacity-30 text-admin-muted" />
              <p className="font-semibold">Cart is empty. Select menu items to begin.</p>
            </div>
          ) : (
            ticket.map((item, idx) => (
              <div key={idx} className="flex flex-col bg-admin-surface p-3 rounded-xl border border-admin-border shadow-xs">
                <div className="flex justify-between items-start mb-1.5">
                  <div className="flex-1 pr-2">
                    <p className="text-xs font-bold text-admin-text leading-tight font-outfit">{item.name}</p>
                    {item.selectedSize && <p className="text-[10px] text-admin-muted">Size: {item.selectedSize.name}</p>}
                    {item.selectedAddOns?.length > 0 && <p className="text-[10px] text-admin-muted">Extras: {item.selectedAddOns.map(a => a.name).join(', ')}</p>}
                    {item.specialInstructions && <p className="text-[10px] text-amber-500 truncate">Note: {item.specialInstructions}</p>}
                    <p className="text-[10px] text-admin-muted">${item.price.toFixed(2)} each</p>
                  </div>
                  <span className="font-bold text-primary text-xs font-outfit">${item.lineTotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-admin-border/50">
                  <div className="flex items-center gap-1 bg-admin-surface-2 rounded-lg p-0.5 border border-admin-border">
                    <button onClick={() => updateQuantity(idx, item.quantity - 1)} className="p-1 bg-admin-surface rounded-md shadow-xs text-admin-text hover:text-primary">
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-xs font-black w-6 text-center text-admin-text font-outfit">{item.quantity}</span>
                    <button onClick={() => updateQuantity(idx, item.quantity + 1)} className="p-1 bg-admin-surface rounded-md shadow-xs text-admin-text hover:text-primary">
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <button onClick={() => removeItem(idx)} className="p-1.5 text-admin-muted hover:text-rose-500 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Coupon & Totals */}
        <div className="p-4 bg-admin-surface border-t border-admin-border">
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1">
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 pointer-events-none">
                <Tag className="w-3.5 h-3.5 text-admin-muted" />
              </div>
              <input
                type="text" placeholder="Promo / Coupon Code"
                value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-admin-surface border border-admin-border rounded-xl focus:border-primary uppercase outline-none text-admin-text placeholder:text-admin-muted font-medium"
              />
            </div>
            <button
              type="button"
              onClick={handleApplyCoupon}
              disabled={couponLoading || couponApplied || ticket.length === 0}
              className={`text-xs font-bold text-white bg-gradient-to-r from-primary to-primary-hover px-4 rounded-xl h-[34px] transition-all font-outfit ${(couponLoading || couponApplied || ticket.length === 0) ? 'opacity-50 cursor-not-allowed' : 'shadow-xs'
                }`}
            >
              {couponLoading ? '...' : 'Apply'}
            </button>
          </div>

          {couponApplied && (
            <div className="flex items-center justify-between mb-3 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <span className="text-emerald-500 text-[11px] font-bold font-outfit">
                {couponCode} Applied <span className="font-medium ml-1">(-${couponDiscount.toFixed(2)})</span>
              </span>
              <button onClick={handleRemoveCoupon} className="text-emerald-500 hover:text-emerald-600 transition-colors" aria-label="Remove coupon">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="space-y-1.5 mb-3 border-t border-dashed border-admin-border pt-2.5 text-xs">
            <div className="flex justify-between items-center text-admin-muted">
              <span>Subtotal ({ticket.length} Items)</span>
              <span className="font-bold text-admin-text font-outfit">${subtotal.toFixed(2)}</span>
            </div>

            {orderType === 'delivery' && (
              <div className="flex justify-between items-center text-admin-muted">
                <span>Delivery Fee</span>
                <span className="font-bold text-admin-text font-outfit">
                  {deliveryFee === 0 ? 'FREE' : `$${deliveryFee.toFixed(2)}`}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center text-admin-muted">
              <span>{restaurant?.taxType || 'Taxes & Charges'}</span>
              <span className="font-bold text-admin-text font-outfit">${tax.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center text-admin-muted">
              <span>Platform Fee</span>
              <span className="font-bold text-admin-text font-outfit">${platformFee.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center text-admin-muted">
              <span>Service Fee</span>
              <span className="font-bold text-admin-text font-outfit">${serviceFee.toFixed(2)}</span>
            </div>

            {packagingFee > 0 && (
              <div className="flex justify-between items-center text-admin-muted">
                <span>Packaging Fee</span>
                <span className="font-bold text-admin-text font-outfit">${packagingFee.toFixed(2)}</span>
              </div>
            )}

            {couponApplied && couponDiscount > 0 && (
              <div className="flex justify-between items-center text-emerald-500 font-bold">
                <span>Discount ({couponCode})</span>
                <span className="font-black font-outfit">-${couponDiscount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-base font-black text-admin-text pt-2.5 border-t border-admin-border mt-1 font-outfit">
              <span>Total Amount</span>
              <span className="text-primary font-black">${total.toFixed(2)}</span>
            </div>
          </div>

          <button
            className="w-full py-3 text-sm font-black shadow-md bg-gradient-to-r from-primary to-primary-hover text-white rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-outfit"
            onClick={initiateCheckout}
            disabled={ticket.length === 0 || !isCustomerInfoComplete(savedCustomerDetails)}
          >
            <CreditCard className="w-4 h-4" /> Charge ${total.toFixed(2)}
          </button>
        </div>
      </div>

      {/* PAYMENT MODAL */}
      {mounted && showPaymentModal && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-admin-surface border border-admin-border rounded-2xl w-full max-w-[480px] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b border-admin-border bg-admin-surface-2/60 flex justify-between items-center">
              <h2 className="text-base font-bold text-admin-text font-outfit">Complete POS Payment</h2>
              <button onClick={() => setShowPaymentModal(false)} className="p-1.5 text-admin-muted hover:text-admin-text rounded-xl hover:bg-admin-surface transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="text-center mb-6">
                <p className="text-[11px] text-admin-muted uppercase tracking-widest font-bold mb-1 font-outfit">Total Due</p>
                <p className="text-3xl font-black text-primary font-outfit">${total.toFixed(2)}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  onClick={() => { setSelectedPayment('card_terminal'); setTenderAmount(total.toFixed(2)); }}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center text-center justify-center gap-2 transition-all font-outfit ${
                    selectedPayment === 'card_terminal' 
                      ? 'border-primary bg-primary/10 text-primary' 
                      : 'border-admin-border text-admin-muted hover:bg-admin-surface-2 hover:text-admin-text'
                  }`}
                >
                  <CreditCard className="w-7 h-7 mx-auto" />
                  <span className="font-bold text-xs">Pay with Card Terminal</span>
                </button>
                <button
                  onClick={() => { setSelectedPayment('payment_link'); }}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center text-center justify-center gap-2 transition-all font-outfit ${
                    selectedPayment === 'payment_link' 
                      ? 'border-primary bg-primary/10 text-primary' 
                      : 'border-admin-border text-admin-muted hover:bg-admin-surface-2 hover:text-admin-text'
                  }`}
                >
                  <QrCode className="w-7 h-7 mx-auto" />
                  <span className="font-bold text-xs">Send QR / SMS Link</span>
                </button>
              </div>
            </div>

            <div className="p-4 border-t border-admin-border bg-admin-surface-2/60 flex justify-end gap-2.5">
              <button
                className="px-4 py-2 text-xs font-bold text-admin-muted hover:text-admin-text hover:bg-admin-surface rounded-xl transition-colors font-outfit"
                onClick={() => setShowPaymentModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-6 py-2 text-xs font-bold bg-gradient-to-r from-primary to-primary-hover text-white rounded-xl shadow-md font-outfit hover:shadow-lg transition-all"
                onClick={() => {
                  if (selectedPayment === 'card_terminal') {
                    setShowPaymentModal(false);
                    setShowStripeModal(true);
                  } else {
                    handleProcessPayment();
                  }
                }}
                disabled={processing}
              >
                {processing ? 'Processing...' : 'Confirm & Charge'}
              </button>
            </div>
          </div>
        </div>
        , document.body)}

      {/* PAYMENT LINK WAITING MODAL */}
      {mounted && showPaymentLinkModal && paymentLinkOrderId && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-admin-surface border border-admin-border rounded-2xl w-full max-w-[650px] overflow-hidden shadow-2xl flex flex-col md:flex-row">
            
            {/* Left side: QR Code - Keep white inner box so cameras can read barcode */}
            <div className="bg-admin-surface-2 flex flex-col items-center justify-center p-6 border-b md:border-b-0 md:border-r border-admin-border w-full md:w-[45%]">
              <div className="bg-white p-3.5 border-2 border-white rounded-2xl shadow-sm mx-auto mb-3">
                <QRCodeSVG value={`${window.location.origin}/api/orders/${paymentLinkOrderId}/pay`} size={170} level="H" />
              </div>
              <div className="text-center font-bold text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-xl py-1.5 px-4 text-xs font-outfit">
                Expires in: {Math.floor(paymentLinkTimeLeft / 60).toString().padStart(2, '0')}:{(paymentLinkTimeLeft % 60).toString().padStart(2, '0')}
              </div>
            </div>

            {/* Right side: Content & Actions */}
            <div className="p-6 w-full md:w-[55%] flex flex-col justify-center text-left">
              <h2 className="text-lg font-black text-admin-text mb-1.5 font-outfit">Awaiting Customer Payment</h2>
              <p className="text-admin-muted mb-5 text-xs leading-relaxed">Present QR code to customer or send via WhatsApp / SMS link to pay securely.</p>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <button
                  className="w-full py-2 bg-admin-surface border border-admin-border rounded-xl font-bold text-admin-text hover:bg-admin-surface-2 transition-colors text-xs font-outfit"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/api/orders/${paymentLinkOrderId}/pay`);
                    showToast('Payment link copied to clipboard!', 'success');
                  }}
                >
                  Copy Link
                </button>
                <button
                  className={`w-full py-2 rounded-xl font-bold transition-colors text-xs font-outfit ${(!savedCustomerDetails.customerPhone || savedCustomerDetails.customerPhone === '0000000000') ? 'opacity-50 cursor-not-allowed text-admin-muted border border-admin-border' : 'text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/10'}`}
                  disabled={!savedCustomerDetails.customerPhone || savedCustomerDetails.customerPhone === '0000000000'}
                  onClick={() => {
                    if (savedCustomerDetails.customerPhone && savedCustomerDetails.customerPhone !== '0000000000') {
                      const payUrl = `${window.location.origin}/api/orders/${paymentLinkOrderId}/pay`;
                      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(payUrl)}`;
                      const message = `Hi! 👋\n\nPlease complete the payment for your order.\n\n🔗 *Click here to pay:* \n${payUrl}\n\n📷 *Or scan this QR code:* \n${qrUrl}\n\nThank you!`;
                      const rawPhone = savedCustomerDetails.customerPhone.trim();
                      const digits = rawPhone.replace(/[^\d]/g, '');
                      const intlPhone = digits.startsWith('0') ? '1' + digits.slice(1) : (digits.length === 10 ? '1' + digits : digits);
                      window.open(`https://wa.me/${intlPhone}?text=${encodeURIComponent(message)}`, '_blank');
                    }
                  }}
                >
                  WhatsApp
                </button>
                <button
                  className="w-full py-2 bg-blue-500/10 border border-blue-500/30 text-blue-500 rounded-xl font-bold hover:bg-blue-500/20 transition-colors text-xs font-outfit"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: 'Order Payment Link',
                        url: `${window.location.origin}/api/orders/${paymentLinkOrderId}/pay`
                      }).catch(console.error);
                    } else {
                      navigator.clipboard.writeText(`${window.location.origin}/api/orders/${paymentLinkOrderId}/pay`);
                      showToast('Share not supported. Link copied instead!', 'info');
                    }
                  }}
                >
                  Share
                </button>
              </div>

              <div className="flex flex-col gap-2 mt-auto">
                <div className="flex gap-2">
                  <button
                    className="flex-1 py-2 bg-gradient-to-r from-primary to-primary-hover text-white font-bold rounded-xl text-xs shadow-sm font-outfit"
                    onClick={() => router.push('/merchant/live-orders')}
                  >
                    Go to Live Orders
                  </button>
                  <button
                    className="flex-1 py-2 bg-admin-surface border border-admin-border text-admin-text font-bold rounded-xl hover:bg-admin-surface-2 transition-colors text-xs font-outfit"
                    onClick={() => {
                      setIsPolling(false);
                      setShowPaymentLinkModal(false);
                      showToast('Order running in background. Check Live Orders to restore QR.', 'info');
                    }}
                  >
                    Background
                  </button>
                </div>
                <button
                  className="w-full py-1.5 text-rose-500 font-bold rounded-xl hover:bg-rose-500/10 transition-colors text-xs font-outfit"
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
        </div>
        , document.body)}

      {/* TRANSACTION COMPLETE MODAL */}
      {mounted && showCompleteModal && completedOrder && createPortal(
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-admin-surface border border-admin-border rounded-3xl w-full max-w-[380px] overflow-hidden shadow-2xl flex flex-col items-center p-6 text-center">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mb-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="text-xl font-black text-admin-text mb-1 font-outfit">Payment Completed</h2>
            <p className="text-admin-muted text-xs font-medium mb-4">Order #{completedOrder.orderNumber || completedOrder._id?.slice(-6)}</p>

            <div className="w-full bg-admin-surface-2 rounded-xl p-3.5 mb-5 border border-admin-border/60 text-xs">
              <div className="flex justify-between mb-1.5">
                <span className="text-admin-muted">Total Amount</span>
                <span className="font-bold text-admin-text font-outfit">${completedOrder.total?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-admin-muted">Payment Method</span>
                <span className="font-bold text-admin-text capitalize font-outfit">{selectedPayment.replace('_', ' ')}</span>
              </div>
            </div>

            <div className="w-full space-y-2">
              <button
                className="w-full py-2.5 bg-gradient-to-r from-primary to-primary-hover text-white text-xs font-bold rounded-xl shadow-md font-outfit flex items-center justify-center gap-1.5"
                onClick={() => {
                  window.open(`/api/orders/${completedOrder._id}/invoice`, '_blank');
                }}
              >
                <Printer className="w-4 h-4" /> Print Tax Invoice
              </button>
              <button
                className="w-full py-2.5 bg-admin-surface border border-admin-border text-admin-text hover:bg-admin-surface-2 text-xs font-bold rounded-xl transition-colors font-outfit flex items-center justify-center gap-1.5"
                onClick={() => {
                  setShowCompleteModal(false);
                  setCompletedOrder(null);
                  setTenderAmount('');
                }}
              >
                <RotateCcw className="w-4 h-4" /> Start Next Order
              </button>
            </div>
          </div>
        </div>
        , document.body)}

      {/* CUSTOMER & DELIVERY MODAL */}
      {mounted && showCustomerModal && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-admin-surface border border-admin-border rounded-2xl w-full max-w-[480px] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b border-admin-border bg-admin-surface-2/60 flex justify-between items-center">
              <h2 className="text-base font-bold text-admin-text font-outfit">Customer & Order Details</h2>
              <button onClick={() => setShowCustomerModal(false)} className="p-1.5 text-admin-muted hover:text-admin-text rounded-xl hover:bg-admin-surface transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              <div>
                <label className="block font-bold text-admin-text mb-1 font-outfit">Full Name</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 pointer-events-none">
                    <User className="w-4 h-4 text-admin-muted" />
                  </div>
                  <input
                    type="text" placeholder="John Doe"
                    value={customerName} onChange={e => setCustomerName(e.target.value)}
                    className={`w-full pl-9 pr-3.5 py-2 bg-admin-surface border rounded-xl outline-none text-admin-text placeholder:text-admin-muted text-xs ${customerName && !isFullNameValid ? 'border-rose-500' : 'border-admin-border focus:border-primary'}`}
                  />
                </div>
                {customerName && !isFullNameValid && <p className="text-[11px] text-rose-500 mt-1">Please enter a valid customer name.</p>}
              </div>

              <div>
                <label className="block font-bold text-admin-text mb-1 font-outfit">Phone Number <span className="font-normal text-admin-muted">{orderType === 'delivery' ? '(Required for delivery)' : '(Required if no email)'}</span></label>
                <div className={`relative bg-admin-surface border rounded-xl overflow-hidden ${customerPhone && !isPhoneValid ? 'border-rose-500' : 'border-admin-border focus-within:border-primary'}`}>
                  <PhoneInput
                    international
                    defaultCountry="US"
                    value={customerPhone}
                    onChange={setCustomerPhone}
                    className="w-full text-xs p-2 [&>input]:border-none [&>input]:outline-none [&>input]:w-full [&>input]:bg-transparent [&>input]:text-admin-text flex items-center [&>.PhoneInputCountry]:mr-2"
                    placeholder="Enter phone number"
                  />
                </div>
                {customerPhone && !isPhoneValid && <p className="text-[11px] text-rose-500 mt-1">Please enter a valid mobile number with country code.</p>}
              </div>

              <div>
                <label className="block font-bold text-admin-text mb-1 font-outfit">Email Address <span className="font-normal text-admin-muted">{orderType === 'delivery' ? '(Optional)' : '(Required if no phone)'}</span></label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 pointer-events-none">
                    <Mail className="w-4 h-4 text-admin-muted" />
                  </div>
                  <input
                    type="email" placeholder="customer@example.com"
                    value={customerEmail} onChange={e => setCustomerEmail(e.target.value)}
                    className={`w-full pl-9 pr-3.5 py-2 bg-admin-surface border rounded-xl outline-none text-admin-text placeholder:text-admin-muted text-xs ${customerEmail && !isEmailValid ? 'border-rose-500' : 'border-admin-border focus:border-primary'}`}
                  />
                </div>
                {customerEmail && !isEmailValid && <p className="text-[11px] text-rose-500 mt-1">Please enter a valid email address.</p>}
              </div>

              {orderType === 'delivery' && (
                <div className="pt-3 border-t border-admin-border space-y-3">
                  <h3 className="font-bold text-admin-text flex items-center gap-1.5 font-outfit"><MapPin className="w-4 h-4 text-primary" /> Delivery Destination</h3>

                  <div className="relative z-50">
                    <input
                      type="text"
                      value={addressLine1}
                      onChange={handleAddressLine1Change}
                      placeholder="Start typing street address..."
                      className="w-full px-3.5 py-2 bg-admin-surface border border-admin-border rounded-xl focus:border-primary outline-none text-admin-text placeholder:text-admin-muted text-xs"
                    />
                    {suggestionsLoading && (
                      <div className="absolute right-3 top-2.5">
                        <Loader2 className="w-4 h-4 animate-spin text-admin-muted" />
                      </div>
                    )}
                    {suggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-admin-surface border border-admin-border rounded-xl shadow-xl max-h-48 overflow-y-auto">
                        {suggestions.map((s, i) => (
                          <div
                            key={i}
                            onClick={() => handleSelectSuggestion(s)}
                            className="px-3.5 py-2 hover:bg-admin-surface-2 cursor-pointer text-admin-text border-b border-admin-border last:border-0 text-xs"
                          >
                            {s.description || s.display_name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2.5">
                    <input
                      type="text"
                      value={addressLine2}
                      onChange={(e) => setAddressLine2(e.target.value)}
                      placeholder="Apt / Suite (Opt)"
                      className="w-1/3 px-3 py-2 bg-admin-surface border border-admin-border rounded-xl focus:border-primary outline-none text-admin-text placeholder:text-admin-muted text-xs"
                    />
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City"
                      className="w-2/3 px-3 py-2 bg-admin-surface border border-admin-border rounded-xl focus:border-primary outline-none text-admin-text placeholder:text-admin-muted text-xs"
                    />
                  </div>

                  <div className="flex gap-2.5">
                    <input
                      type="text"
                      value={addressState}
                      onChange={(e) => setAddressState(e.target.value)}
                      placeholder="State"
                      className="w-1/2 px-3 py-2 bg-admin-surface border border-admin-border rounded-xl focus:border-primary outline-none text-admin-text placeholder:text-admin-muted text-xs"
                    />
                    <input
                      type="text"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      placeholder="ZIP Code"
                      className="w-1/2 px-3 py-2 bg-admin-surface border border-admin-border rounded-xl focus:border-primary outline-none text-admin-text placeholder:text-admin-muted text-xs"
                    />
                  </div>

                  <textarea
                    value={deliveryInstructions}
                    onChange={(e) => setDeliveryInstructions(e.target.value)}
                    placeholder="Delivery instructions (e.g. Ring buzzer 4B, leave at door)"
                    rows={2}
                    className="w-full px-3.5 py-2 bg-admin-surface border border-admin-border rounded-xl focus:border-primary outline-none text-admin-text placeholder:text-admin-muted resize-none text-xs leading-relaxed"
                  />

                  <div className="bg-admin-surface-2 p-3 rounded-xl border border-admin-border flex items-center justify-between text-xs">
                    <span className="text-admin-muted font-bold font-outfit">Delivery Fee</span>
                    <span>
                      {quoteLoading ? 'Calculating...' : quoteError ? <span className="text-rose-500 font-bold">{quoteError}</span> : (deliveryQuote ? <span className="text-emerald-500 font-black font-outfit">${deliveryQuote.fee.toFixed(2)}</span> : <span className="text-admin-muted">Enter valid address</span>)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-admin-border bg-admin-surface-2/60 flex justify-end gap-2.5">
              <button
                className="px-4 py-2 text-xs font-bold text-admin-muted hover:text-admin-text hover:bg-admin-surface rounded-xl transition-colors font-outfit"
                onClick={() => setShowCustomerModal(false)}
              >
                Cancel
              </button>
              <button
                className={`px-5 py-2 text-xs font-bold rounded-xl shadow-sm transition-all font-outfit ${!isCustomerInfoComplete() ? 'opacity-50 cursor-not-allowed bg-admin-border text-admin-muted' : 'bg-gradient-to-r from-primary to-primary-hover text-white hover:shadow-md'}`}
                onClick={handleSaveCustomerDetails}
                disabled={!isCustomerInfoComplete()}
              >
                Save Details
              </button>
            </div>
          </div>
        </div>
        , document.body)}

      {/* ITEM CUSTOMIZATION MODAL */}
      {mounted && itemToCustomize && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-admin-surface border border-admin-border rounded-2xl w-full max-w-[480px] overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center p-4 border-b border-admin-border bg-admin-surface-2/60">
              <h2 className="text-base font-bold text-admin-text font-outfit">Customize {itemToCustomize.name}</h2>
              <button onClick={() => setItemToCustomize(null)} className="p-1.5 text-admin-muted hover:text-admin-text rounded-xl hover:bg-admin-surface transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-5 overflow-y-auto text-xs">
              {/* Size Variations */}
              {itemToCustomize.sizeVariations?.length > 0 && (
                <div>
                  <h3 className="font-bold text-admin-text mb-2.5 font-outfit">Choose Serving Size</h3>
                  <div className="space-y-2">
                    {itemToCustomize.sizeVariations.map((size, idx) => (
                      <label key={idx} className="flex items-center justify-between p-3 rounded-xl border border-admin-border bg-admin-surface hover:border-primary transition-colors cursor-pointer">
                        <div className="flex items-center gap-2.5">
                          <input 
                            type="radio" 
                            name="pos-size" 
                            checked={customSize?.name === size.name}
                            onChange={() => setCustomSize(size)}
                            className="w-4 h-4 text-primary focus:ring-primary" 
                          />
                          <span className="font-medium text-admin-text">{size.name}</span>
                        </div>
                        <span className="font-bold text-admin-text font-outfit">${size.price.toFixed(2)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Add-ons */}
              {itemToCustomize.addOns?.length > 0 && (
                <div>
                  <h3 className="font-bold text-admin-text mb-2.5 font-outfit">Add Extra Toppings & Sides</h3>
                  <div className="space-y-2">
                    {itemToCustomize.addOns.map((addon, idx) => {
                      const isChecked = customAddOns.some(a => a.name === addon.name);
                      return (
                        <label key={idx} className="flex items-center justify-between p-3 rounded-xl border border-admin-border bg-admin-surface hover:border-primary transition-colors cursor-pointer">
                          <div className="flex items-center gap-2.5">
                            <input 
                              type="checkbox" 
                              checked={isChecked}
                              onChange={() => handleCustomAddOnChange(addon)}
                              className="w-4 h-4 text-primary focus:ring-primary rounded" 
                            />
                            <span className="font-medium text-admin-text">{addon.name}</span>
                          </div>
                          <span className="font-bold text-admin-text font-outfit">+${addon.price.toFixed(2)}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Special Instructions */}
              <div>
                <h3 className="font-bold text-admin-text mb-1.5 font-outfit">Kitchen Preparation Notes</h3>
                <textarea 
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="e.g. Extra cardamom, less sweet, pack spoon..."
                  className="w-full p-3 rounded-xl border border-admin-border bg-admin-surface text-admin-text placeholder:text-admin-muted text-xs focus:outline-none focus:border-primary resize-none h-20 leading-relaxed"
                />
              </div>
            </div>

            <div className="p-4 border-t border-admin-border bg-admin-surface-2/60">
              <button 
                className="w-full py-3 bg-gradient-to-r from-primary to-primary-hover text-white rounded-xl shadow-md font-bold text-xs font-outfit hover:shadow-lg transition-all"
                onClick={handleAddCustomizedItem}
              >
                Add to Ticket — ${(
                  (customSize ? customSize.price : itemToCustomize.price) + 
                  customAddOns.reduce((sum, a) => sum + (a.price || 0), 0)
                ).toFixed(2)}
              </button>
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
          couponCode: couponCode?.trim() || undefined,
          customerName: savedCustomerDetails.customerName?.trim() || undefined,
          customerPhone: savedCustomerDetails.customerPhone?.trim() || undefined,
          customerEmail: savedCustomerDetails.customerEmail?.trim() || undefined
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


