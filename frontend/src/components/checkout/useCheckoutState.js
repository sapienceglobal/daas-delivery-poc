'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { orderAPI, couponAPI } from '@/lib/api';
import { showToast } from '@/components/ui';

const US_STATE_CODES = {
  Alabama: 'AL',
  Alaska: 'AK',
  Arizona: 'AZ',
  Arkansas: 'AR',
  California: 'CA',
  Colorado: 'CO',
  Connecticut: 'CT',
  Delaware: 'DE',
  Florida: 'FL',
  Georgia: 'GA',
  Hawaii: 'HI',
  Idaho: 'ID',
  Illinois: 'IL',
  Indiana: 'IN',
  Iowa: 'IA',
  Kansas: 'KS',
  Kentucky: 'KY',
  Louisiana: 'LA',
  Maine: 'ME',
  Maryland: 'MD',
  Massachusetts: 'MA',
  Michigan: 'MI',
  Minnesota: 'MN',
  Mississippi: 'MS',
  Missouri: 'MO',
  Montana: 'MT',
  Nebraska: 'NE',
  Nevada: 'NV',
  'New Hampshire': 'NH',
  'New Jersey': 'NJ',
  'New Mexico': 'NM',
  'New York': 'NY',
  'North Carolina': 'NC',
  'North Dakota': 'ND',
  Ohio: 'OH',
  Oklahoma: 'OK',
  Oregon: 'OR',
  Pennsylvania: 'PA',
  'Rhode Island': 'RI',
  'South Carolina': 'SC',
  'South Dakota': 'SD',
  Tennessee: 'TN',
  Texas: 'TX',
  Utah: 'UT',
  Vermont: 'VT',
  Virginia: 'VA',
  Washington: 'WA',
  'West Virginia': 'WV',
  Wisconsin: 'WI',
  Wyoming: 'WY',
};

const resolveStateCode = (address, stateName) => {
  const isoCode = address?.['ISO3166-2-lvl4']?.split('-').pop();
  if (isoCode && isoCode.length === 2) return isoCode.toUpperCase();
  if (address?.state_code) return address.state_code.toUpperCase();
  if (US_STATE_CODES[stateName]) return US_STATE_CODES[stateName];
  return stateName ? stateName.substring(0, 2).toUpperCase() : '';
};

const ONLINE_PAYMENT_METHODS = ['credit_card', 'apple_pay', 'google_pay'];

/**
 * useCheckoutState — every piece of state, derived value, effect, and
 * handler the checkout flow needs. Extracted out of page.js so that file
 * can stay a pure composition (state in → JSX out), and so this logic is
 * independently testable/reusable if a second checkout entry point is ever
 * needed (e.g. a modal checkout instead of a full page).
 */
export function useCheckoutState() {
  const router = useRouter();
  const {
    items,
    restaurant,
    subtotal,
    itemCount,
    updateQuantity,
    removeItem,
    clearCart,
    specialInstructions,
  } = useCart();
  const { isAuthenticated, user, refreshUser } = useAuth();

  const isSingleRestaurantMode = process.env.NEXT_PUBLIC_SINGLE_RESTAURANT_MODE === 'true';

  const [step, setStep] = useState(1);

  const [fullName, setFullName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('NY');
  const [zipCode, setZipCode] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');

  const [addressLat, setAddressLat] = useState(null);
  const [addressLng, setAddressLng] = useState(null);

  const [orderType, setOrderType] = useState('delivery');
  const [paymentMethod, setPaymentMethod] = useState('credit_card');

  const [cardNo, setCardNo] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');

  const [tip] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [deliveryQuote, setDeliveryQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [quoteError, setQuoteError] = useState(null);
  const [quoteTrigger, setQuoteTrigger] = useState(0);

  // Auto-suggestion state
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [addressVerified, setAddressVerified] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);

  useEffect(() => {
    if (isAuthenticated) refreshUser();
  }, [isAuthenticated, refreshUser]);

  const handleSelectSavedAddress = (addrObj) => {
    const parts = addrObj.address.split(',').map((p) => p.trim());
    if (parts.length >= 3) {
      setAddressLine1(parts[0]);
      setCity(parts[1]);
      setState(parts[2].substring(0, 2).toUpperCase());
      setZipCode(parts[3] ? parts[3].replace(/\D/g, '').substring(0, 5) : '');
    } else {
      setAddressLine1(addrObj.address);
    }
    setAddressLat(addrObj.lat);
    setAddressLng(addrObj.lng || null);
    setAddressVerified(true);
    setQuoteError(null);
    setQuoteTrigger((prev) => prev + 1);
  };

  useEffect(() => {
    if (user) {
      if (!fullName) setFullName(user.name || '');
      if (!phone) setPhone(user.phone || '');
      if (!email) setEmail(user.email || '');

      if (user.savedAddresses && user.savedAddresses.length > 0 && !addressLine1) {
        const defaultAddr = user.savedAddresses.find((a) => a.isDefault) || user.savedAddresses[0];
        handleSelectSavedAddress(defaultAddr);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const compiledAddress = useMemo(() => {
    if (!addressLine1.trim() || !city.trim() || !state.trim() || !zipCode.trim()) return '';
    return `${addressLine1}, ${addressLine2 ? addressLine2 + ', ' : ''}${city}, ${state} ${zipCode}`;
  }, [addressLine1, addressLine2, city, state, zipCode]);

  const taxRate = restaurant?.taxRate || 0.0875;
  const tax = Math.round(subtotal * taxRate * 100) / 100;

  const hasDeliveryAddressInput = Boolean(
    addressLine1.trim() || city.trim() || state.trim() || zipCode.trim() || addressVerified || addressLat !== null || addressLng !== null
  );

  const deliveryFee =
    orderType === 'delivery'
      ? deliveryQuote?.deliveryFee !== undefined
        ? deliveryQuote.deliveryFee
        : (quoteError || hasDeliveryAddressInput ? null : (restaurant?.deliveryFee || 2.99))
      : 0;

  const platformFee = 2.0;
  const serviceFee = Math.round(subtotal * 0.03 * 100) / 100;
  const loyaltyDiscount = useLoyaltyPoints ? Math.floor(user?.loyaltyPoints || 0) / 100 : 0;

  const total = Math.max(0, subtotal + tax + deliveryFee + platformFee + serviceFee + tip - couponDiscount - loyaltyDiscount);

  const checkoutItems = useMemo(
    () =>
      items.map((item) => ({
        menuItemId: item.menuItemId || item._id,
        quantity: item.quantity,
        selectedSize: item.selectedSize,
        addOns: item.addOns,
        specialInstructions: item.specialInstructions || '',
      })),
    [items]
  );

  const checkoutPayload = useMemo(
    () => ({
      restaurantId: restaurant?._id,
      items: checkoutItems,
      orderType,
      tip,
      couponCode: couponApplied ? couponCode : undefined,
      useLoyaltyPoints,
      address: compiledAddress,
      specialInstructions,
    }),
    [restaurant?._id, checkoutItems, orderType, tip, couponApplied, couponCode, useLoyaltyPoints, compiledAddress, specialInstructions]
  );

  const triggerGeocoding = async (addrStr) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addrStr)}&limit=1`,
        { headers: { 'User-Agent': 'SapienceGlobalPoCDeliveryApp/1.0' } }
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setAddressLat(lat);
        setAddressLng(lng);
        setAddressVerified(true);
        return { lat, lng };
      }
    } catch (err) {
      console.error('Silent geocoding error:', err);
    }
    return null;
  };

  const handleAddressLine1Change = (val) => {
    setAddressLine1(val);
    setAddressVerified(false);
    setAddressLat(null);
    setAddressLng(null);
    setDeliveryQuote(null);
    setQuoteError(null);

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

    setAddressLat(parseFloat(suggestion.lat));
    setAddressLng(parseFloat(suggestion.lon));
    setAddressVerified(true);
    setQuoteError(null);
    setQuoteTrigger((prev) => prev + 1);
    setSuggestions([]);
  };

  useEffect(() => {
    if (orderType !== 'delivery' || !restaurant?._id || items.length === 0) {
      setDeliveryQuote(null);
      setQuoteError(null);
      return;
    }

    if (!compiledAddress.trim()) {
      setDeliveryQuote(null);
      if (!hasDeliveryAddressInput) setQuoteError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setQuoteLoading(true);
      setQuoteError(null);
      try {
        let lat = addressLat;
        let lng = addressLng;

        console.log('DEBUG CHECKOUT: State coordinates captured:', { lat, lng });

        if (lat === null || lng === null) {
          const coords = await triggerGeocoding(compiledAddress);
          if (coords) {
            lat = coords.lat;
            lng = coords.lng;
            console.log('DEBUG CHECKOUT: Geocoding resolved coordinates:', { lat, lng });
          }
        }

        console.log('DEBUG CHECKOUT: Requesting quote with body:', {
          restaurantId: restaurant._id,
          address: compiledAddress,
          addressLat: lat,
          addressLng: lng,
        });

        const data = await orderAPI.getDeliveryQuote({
          restaurantId: restaurant._id,
          address: compiledAddress,
          addressLat: lat,
          addressLng: lng,
          items: checkoutItems,
        });
        setDeliveryQuote(data.data);
        setQuoteError(null);
      } catch (err) {
        console.error('DEBUG CHECKOUT: getDeliveryQuote failed:', err);
        const errorMsg = err.response?.data?.message || err.message || 'Delivery quote failed';
        setQuoteError(errorMsg);
        
        // Auto-heal stale carts (e.g. after database resets)
        if (errorMsg === 'Restaurant not found' || errorMsg.includes('no longer available')) {
          clearCart();
          showToast('Cart expired due to menu updates. Please start a new order.', 'error');
          router.push('/');
        }
      } finally {
        setQuoteLoading(false);
      }
    }, 1000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compiledAddress, orderType, restaurant?._id, items.length, checkoutItems, addressLat, addressLng, quoteTrigger, hasDeliveryAddressInput]);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser', 'error');
      return;
    }
    setIsLocationLoading(true);
    setQuoteLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&zoom=18&addressdetails=1`,
            { headers: { 'User-Agent': 'SapienceGlobalPoCDeliveryApp/1.0' } }
          );
          const data = await res.json();
          if (data) {
            const address = data.address || {};
            const parts = (data.display_name || '').split(',').map((p) => p.trim());
            const road = address.road || address.pedestrian || address.footway || address.neighbourhood || address.suburb || '';
            const houseNumber = address.house_number || '';
            const line1 = `${houseNumber} ${road}`.trim() || parts[0] || '';

            // Robust City extraction
            let cityVal = address.city || address.town || address.village || address.suburb || address.county || address.municipality || address.city_district || '';
            if (!cityVal && parts.length >= 4) {
              cityVal = parts[parts.length - 4] || '';
            }

            // Robust State extraction
            let stateName = address.state || address.region || address.state_district || address.province || '';
            if (!stateName && parts.length >= 3) {
              const penult = parts[parts.length - 2];
              const isNumericZip = /^\d+$/.test(penult) || /^\d+-\d+$/.test(penult) || /^\d{5,6}$/.test(penult);
              if (isNumericZip) {
                stateName = parts[parts.length - 3] || '';
              } else {
                stateName = penult || '';
              }
            }

            // Robust Postcode extraction
            let postcodeVal = address.postcode || address.postal_code || '';
            if (!postcodeVal) {
              const matchedPostcode = parts.find((p) => /^\d{5,6}$/.test(p));
              if (matchedPostcode) postcodeVal = matchedPostcode;
            }

            const stateCode = resolveStateCode(address, stateName);
            const zipCodeVal = postcodeVal ? postcodeVal.replace(/\D/g, '').substring(0, 5) : '';

            setAddressLine1(line1);
            setCity(cityVal);
            setState(stateCode);
            setZipCode(zipCodeVal);
            setAddressLat(pos.coords.latitude);
            setAddressLng(pos.coords.longitude);
            setAddressVerified(true);
            setDeliveryQuote(null);

            if (!line1 || !cityVal || !stateCode || !zipCodeVal) {
              setQuoteError('We could not verify a complete delivery address from your current location. Please enter the address manually.');
              showToast('Current location needs a complete street address. Please enter it manually.', 'error');
              return;
            }

            setQuoteError(null);
            setQuoteTrigger((prev) => prev + 1);

            showToast('Current location detected successfully!', 'success');
          } else {
            setDeliveryQuote(null);
            setQuoteError('Unable to parse location details. Please enter the address manually.');
            showToast('Unable to parse location details', 'error');
          }
        } catch (err) {
          setDeliveryQuote(null);
          setQuoteError('Failed to verify current location. Please enter the address manually.');
          showToast('Failed to reverse geocode location', 'error');
        } finally {
          setQuoteLoading(false);
          setIsLocationLoading(false);
        }
      },
      (error) => {
        setQuoteLoading(false);
        setIsLocationLoading(false);
        setDeliveryQuote(null);
        setQuoteError('Unable to retrieve your location. Please enter the address manually.');
        showToast('Unable to retrieve your location', 'error');
      }
    );
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const data = await couponAPI.validate(couponCode, subtotal, restaurant?._id);
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

  const handleContinueToPayment = async ({ fullName, phone, email, orderType, addressLine1, city, zipCode }) => {
    if (!fullName.trim() || !phone.trim() || !email.trim() || (orderType === 'delivery' && (!addressLine1.trim() || !city.trim() || !zipCode.trim()))) {
      showToast('Please fill out all required fields marked with *', 'warning');
      return;
    }

    if (orderType === 'delivery') {
      let currentLat = addressLat;
      let currentLng = addressLng;

      // 1. If not verified, trigger geocoding synchronously
      if (!addressVerified || currentLat === null || currentLng === null) {
        setQuoteLoading(true);
        const coords = await triggerGeocoding(compiledAddress);
        if (!coords) {
          setQuoteLoading(false);
          showToast('Address could not be verified. Please check spelling or select from suggestions.', 'error');
          return;
        }
        currentLat = coords.lat;
        currentLng = coords.lng;
      }

      // 2. Fetch the quote synchronously to proceed immediately without waiting for useEffect loop
      setQuoteLoading(true);
      setQuoteError(null);
      try {
        const data = await orderAPI.getDeliveryQuote({
          restaurantId: restaurant._id,
          address: compiledAddress,
          addressLat: currentLat,
          addressLng: currentLng,
          items: checkoutItems,
        });
        setDeliveryQuote(data.data);
        setQuoteError(null);
        setStep(2);
      } catch (err) {
        setDeliveryQuote(null);
        const errMsg = err.message || 'Delivery unavailable for this location';
        setQuoteError(errMsg);
        showToast(errMsg, 'error');
      } finally {
        setQuoteLoading(false);
      }
    } else {
      setStep(2);
    }
  };

  const handleContinueToReview = async ({ paymentMethod, cardNo, cardExpiry, cardCvv, cardName }) => {
    // 1. Validate Delivery Info if orderType is delivery
    if (!fullName.trim() || !phone.trim() || !email.trim() || (orderType === 'delivery' && (!addressLine1.trim() || !city.trim() || !zipCode.trim()))) {
      showToast('Please fill out all required fields marked with *', 'warning');
      return;
    }

    if (orderType === 'delivery') {
      let currentLat = addressLat;
      let currentLng = addressLng;

      // Geocode if not verified
      if (!addressVerified || currentLat === null || currentLng === null) {
        setQuoteLoading(true);
        const coords = await triggerGeocoding(compiledAddress);
        if (!coords) {
          setQuoteLoading(false);
          showToast('Address could not be verified. Please check spelling or select from suggestions.', 'error');
          return;
        }
        currentLat = coords.lat;
        currentLng = coords.lng;
      }

      // Sync quote fetch if not already done
      if (!deliveryQuote || quoteError) {
        setQuoteLoading(true);
        setQuoteError(null);
        try {
          const data = await orderAPI.getDeliveryQuote({
            restaurantId: restaurant._id,
            address: compiledAddress,
            addressLat: currentLat,
            addressLng: currentLng,
            items: checkoutItems,
          });
          setDeliveryQuote(data.data);
          setQuoteError(null);
        } catch (err) {
          setDeliveryQuote(null);
          const errMsg = err.message || 'Delivery unavailable for this location';
          setQuoteError(errMsg);
          showToast(errMsg, 'error');
          setQuoteLoading(false);
          return;
        } finally {
          setQuoteLoading(false);
        }
      }
    }

    // 2. Validate Payment Method
    if (paymentMethod === 'credit_card' && (!cardNo.trim() || !cardExpiry.trim() || !cardCvv.trim() || !cardName.trim())) {
      showToast('Please fill out all card fields completely', 'warning');
      return;
    }

    setStep(3);
  };

  const executeOrderCreation = async (paymentIntentId = null) => {
    try {
      const orderData = {
        ...checkoutPayload,
        address: compiledAddress,
        paymentMethod,
        courierNotes: deliveryInstructions || undefined,
        stripePaymentIntentId: paymentIntentId,
      };

      const data = await orderAPI.create(orderData);
      clearCart();
      showToast('Order placed successfully!', 'success');
      router.push(`/customer/orders/${data.data._id}`);
    } catch (err) {
      console.error('Checkout failed:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Checkout failed';
      showToast(errorMsg, 'error');
      
      // Auto-heal stale carts during checkout
      if (errorMsg === 'Restaurant not found' || errorMsg.includes('no longer available')) {
        clearCart();
        router.push('/');
      }
    } finally {
      setShowPaymentModal(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!isAuthenticated) {
      showToast('Please sign in to place an order', 'warning');
      router.push('/login');
      return;
    }
    if (orderType === 'delivery' && !compiledAddress.trim()) {
      showToast('Please fill out the delivery address completely', 'warning');
      return;
    }
    if (orderType === 'delivery' && quoteError) {
      showToast(quoteError, 'error');
      return;
    }
    if (orderType === 'delivery' && !deliveryQuote) {
      showToast('Delivery calculations not finalized. Please check address.', 'error');
      return;
    }
    if (ONLINE_PAYMENT_METHODS.includes(paymentMethod)) {
      setShowPaymentModal(true);
      return;
    }
    executeOrderCreation();
  };

  return {
    router, isSingleRestaurantMode, isAuthenticated,
    step, setStep,
    fullName, setFullName, phone, setPhone, email, setEmail,
    addressLine1, setAddressLine1, addressLine2, setAddressLine2,
    city, setCity, state, setState, zipCode, setZipCode,
    deliveryInstructions, setDeliveryInstructions,
    orderType, setOrderType, paymentMethod, setPaymentMethod,
    cardNo, setCardNo, cardExpiry, setCardExpiry, cardCvv, setCardCvv, cardName, setCardName,
    couponCode, setCouponCode, couponDiscount, couponApplied, couponLoading,
    useLoyaltyPoints, setUseLoyaltyPoints,
    showPaymentModal, setShowPaymentModal,
    quoteLoading, isLocationLoading, quoteError,
    suggestions, suggestionsLoading, addressVerified,
    items, restaurant, subtotal, itemCount, updateQuantity, removeItem, user,
    compiledAddress, checkoutPayload, tax, deliveryFee, platformFee, serviceFee, total,
    handleSelectSavedAddress, handleUseCurrentLocation,
    handleAddressLine1Change, handleSelectSuggestion,
    handleApplyCoupon, handleRemoveCoupon,
    handleContinueToPayment, handleContinueToReview,
    handlePlaceOrder, executeOrderCreation,
  };
}
