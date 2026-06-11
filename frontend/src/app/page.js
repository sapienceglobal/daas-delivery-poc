'use client';

import { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  MapPin, 
  Phone, 
  User, 
  Package, 
  ShieldCheck, 
  ArrowRight, 
  Loader2, 
  Search, 
  Star, 
  Clock, 
  Tag, 
  X,
  CreditCard,
  Smartphone,
  Coins,
  LogIn,
  LogOut,
  History,
  UserCheck,
  Trash2,
  Edit3,
  Plus,
  Check,
  Store
} from 'lucide-react';

const PRESET_ADDRESSES = [
  { label: 'Oak St (Default)', address: '456 Oak St, San Francisco, CA 94107', lat: 37.7749, lng: -122.4092 },
  { label: 'Union Square', address: '233 Geary St, San Francisco, CA 94102', lat: 37.7879, lng: -122.4075 },
  { label: 'Mission District', address: '1010 Valencia St, San Francisco, CA 94110', lat: 37.7599, lng: -122.4211 },
  { label: 'Lombard St (Crooked St)', address: '1000 Lombard St, San Francisco, CA 94109', lat: 37.8021, lng: -122.4194 }
];

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

export default function Home() {
  const [restaurants, setRestaurants] = useState([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);

  // Delivery Location State
  const [selectedAddress, setSelectedAddress] = useState(PRESET_ADDRESSES[0].address);
  const [userCoords, setUserCoords] = useState({ lat: PRESET_ADDRESSES[0].lat, lng: PRESET_ADDRESSES[0].lng });
  const [customAddress, setCustomAddress] = useState('');
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Restaurant Details Modal
  const [activeRestaurant, setActiveRestaurant] = useState(null);
  const [loadingMenu, setLoadingMenu] = useState(false);
  
  // Cart State
  const [cart, setCart] = useState([]);
  const [cartRestaurant, setCartRestaurant] = useState(null);
  const [showCartWarning, setShowCartWarning] = useState(false);
  const [pendingCartItem, setPendingCartItem] = useState(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Authentication State
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [userOrders, setUserOrders] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Auth Modals & Forms
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register' | 'forgot' | 'reset'
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);

  // Auth Inputs
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authError, setAuthError] = useState(null);
  const [authRole, setAuthRole] = useState('customer'); // 'customer' | 'merchant'
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [authSuccessMessage, setAuthSuccessMessage] = useState(null);

  // Checkout Form Details (Prefilled from Profile if logged in)
  const [checkoutName, setCheckoutName] = useState('Adarsh Sharma');
  const [checkoutPhone, setCheckoutPhone] = useState('+16505550199');
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');

  // Shipping & Total Quotes
  const [deliveryQuote, setDeliveryQuote] = useState(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);

  // Scheduled Delivery & Courier Notes States
  const [scheduledType, setScheduledType] = useState('now'); // 'now' | 'later'
  const [scheduledTime, setScheduledTime] = useState('');
  const [courierNotes, setCourierNotes] = useState('');

  // Location Autocomplete & Geolocation States
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

  // Address CRUD inside Profile Drawer
  const [profileNewAddress, setProfileNewAddress] = useState('');
  const [profileAddressSuggestions, setProfileAddressSuggestions] = useState([]);
  const [loadingProfileSuggestions, setLoadingProfileSuggestions] = useState(false);
  const [editingAddressIndex, setEditingAddressIndex] = useState(null);
  const [editingAddressValue, setEditingAddressValue] = useState('');
  const [editingAddressSuggestions, setEditingAddressSuggestions] = useState([]);
  const [loadingEditingSuggestions, setLoadingEditingSuggestions] = useState(false);
  const [loadingAddressAction, setLoadingAddressAction] = useState(false);

  // Reset checkout states when checkout drawer opens
  useEffect(() => {
    if (isCheckoutOpen) {
      const minTime = new Date(Date.now() + 45 * 60 * 1000);
      const tzoffset = minTime.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(minTime.getTime() - tzoffset)).toISOString().slice(0, 16);
      setScheduledTime(localISOTime);
      setCourierNotes('');
      setScheduledType('now');
    }
  }, [isCheckoutOpen]);

  // HTML5 Geolocation API - Reverse Geocoding via Nominatim
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          if (data && data.display_name) {
            setSelectedAddress(data.display_name);
            setCustomAddress(data.display_name);
            setUserCoords({ lat: latitude, lng: longitude });
          } else {
            throw new Error("Could not reverse geocode coordinates.");
          }
        } catch (err) {
          console.error(err);
          alert("Error resolving GPS location. Please enter your address manually.");
        } finally {
          setDetectingLocation(false);
        }
      },
      (error) => {
        console.error(error);
        alert(`Failed to detect location: ${error.message}`);
        setDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Autocomplete Address Search via Nominatim
  useEffect(() => {
    if (!customAddress || customAddress.length < 4) {
      setAddressSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      setLoadingSuggestions(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(customAddress)}&countrycodes=us&limit=5`
        );
        const data = await res.json();
        if (data) {
          setAddressSuggestions(data);
        }
      } catch (err) {
        console.error("Autocomplete search error:", err);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      fetchSuggestions();
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [customAddress]);

  // Autocomplete for new profile address input
  useEffect(() => {
    if (!profileNewAddress || profileNewAddress.length < 4) {
      setProfileAddressSuggestions([]);
      return;
    }

    if (profileAddressSuggestions.some(s => s.display_name === profileNewAddress)) {
      return;
    }

    const fetchProfileSuggestions = async () => {
      setLoadingProfileSuggestions(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(profileNewAddress)}&countrycodes=us&limit=5`
        );
        const data = await res.json();
        if (data) {
          setProfileAddressSuggestions(data);
        }
      } catch (err) {
        console.error("Profile autocomplete search error:", err);
      } finally {
        setLoadingProfileSuggestions(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      fetchProfileSuggestions();
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [profileNewAddress]);

  // Autocomplete for editing profile address input
  useEffect(() => {
    if (!editingAddressValue || editingAddressValue.length < 4) {
      setEditingAddressSuggestions([]);
      return;
    }

    if (editingAddressSuggestions.some(s => s.display_name === editingAddressValue)) {
      return;
    }

    const fetchEditingSuggestions = async () => {
      setLoadingEditingSuggestions(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(editingAddressValue)}&countrycodes=us&limit=5`
        );
        const data = await res.json();
        if (data) {
          setEditingAddressSuggestions(data);
        }
      } catch (err) {
        console.error("Editing autocomplete search error:", err);
      } finally {
        setLoadingEditingSuggestions(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      fetchEditingSuggestions();
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [editingAddressValue]);

  const finalAddress = selectedAddress;

  // Sync custom address search input when dropdown toggle status changes
  useEffect(() => {
    if (!showAddressDropdown) {
      setCustomAddress('');
      setAddressSuggestions([]);
    } else {
      setCustomAddress(selectedAddress);
    }
  }, [showAddressDropdown, selectedAddress]);

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('marketplace_token');
    const storedUser = localStorage.getItem('marketplace_user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      if (parsedUser.role === 'merchant') {
        window.location.href = '/restaurant';
      } else if (parsedUser.role === 'admin') {
        window.location.href = '/admin';
      }
    }
  }, []);

  // Sync Checkout inputs when User Profile loads
  useEffect(() => {
    if (user) {
      setCheckoutName(user.name);
      setCheckoutPhone(user.phone || '+16505550199');
      if (user.savedAddresses && user.savedAddresses.length > 0) {
        setSelectedAddress(user.savedAddresses[0]);
      }
    } else {
      setCheckoutName('Adarsh Sharma');
      setCheckoutPhone('+16505550199');
    }
  }, [user]);

  // Fetch Restaurants on Load or Location Coordinates Change
  useEffect(() => {
    const fetchRestaurants = async () => {
      setLoadingRestaurants(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/restaurants?lat=${userCoords.lat}&lng=${userCoords.lng}`, {
          credentials: 'include'
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setRestaurants(data.restaurants);
        } else {
          throw new Error(data.message || 'Failed to load restaurants.');
        }
      } catch (err) {
        console.error('Error fetching restaurants:', err);
        setCheckoutError('Backend database offline or server connection failed.');
      } finally {
        setLoadingRestaurants(false);
      }
    };
    fetchRestaurants();
  }, [userCoords]);

  // Fetch Profile and Order History when Token updates
  const fetchUserProfile = async (authToken) => {
    setLoadingProfile(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUser(data.user);
        setUserOrders(data.orders);
        localStorage.setItem('marketplace_user', JSON.stringify(data.user));
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUserProfile(token);
    }
  }, [token]);

  // Fetch Dynamic Menu for Selection
  const handleOpenMenu = async (restaurantSummary) => {
    setActiveRestaurant({ ...restaurantSummary, menu: [] });
    setLoadingMenu(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/restaurants/${restaurantSummary._id}`, {
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActiveRestaurant(data.restaurant);
      } else {
        throw new Error(data.message || 'Failed to load restaurant menu.');
      }
    } catch (err) {
      console.error(err);
      alert('Could not fetch restaurant details from database.');
      setActiveRestaurant(null);
    } finally {
      setLoadingMenu(false);
    }
  };

  // Recalculate Quote on Cart or Address Change
  useEffect(() => {
    if (cart.length === 0 || !cartRestaurant) {
      setDeliveryQuote(null);
      return;
    }

    const fetchQuote = async () => {
      setLoadingQuote(true);
      setCheckoutError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/api/orders/quote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pickupAddress: cartRestaurant.address,
            dropoffAddress: finalAddress,
            orderValue: getCartSubtotal(),
            scheduledTime: scheduledType === 'later' ? new Date(scheduledTime).toISOString() : null
          }),
          credentials: 'include'
        });
        const data = await res.json();
        if (res.ok) {
          setDeliveryQuote(data);
        } else {
          if (data && data.unserviceable) {
            setDeliveryQuote(null);
            setCheckoutError(data.message || 'This location is outside our delivery partner service area.');
            return;
          }
          if (res.status === 400 && data && data.message) {
            setDeliveryQuote(null);
            setCheckoutError(data.message);
            return;
          }
          throw new Error(data.message || 'Failed to fetch shipping quote.');
        }
      } catch (err) {
        console.error(err);
        setCheckoutError('Could not calculate shipping charge. Fallback to offline pricing.');
        setDeliveryQuote({
          deliveryFee: 599,
          baseFee: 399,
          platformMarkup: 200,
          realRequest: false
        });
      } finally {
        setLoadingQuote(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      fetchQuote();
    }, 700);

    return () => clearTimeout(delayDebounce);
  }, [cart, selectedAddress, customAddress, cartRestaurant, scheduledType, scheduledTime]);

  // Cart Calculations
  const getCartSubtotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getTax = () => {
    return getCartSubtotal() * 0.0825; // 8.25% standard tax
  };

  const getPlatformFee = () => {
    return cart.length > 0 ? 2.00 : 0.00;
  };

  const getDeliveryFee = () => {
    if (deliveryQuote) {
      return deliveryQuote.deliveryFee / 100;
    }
    return 0;
  };

  const getGrandTotal = () => {
    return getCartSubtotal() + getTax() + getPlatformFee() + getDeliveryFee();
  };

  // Add Item to Cart
  const handleAddToCart = (item, restaurant) => {
    if (cartRestaurant && cartRestaurant._id !== restaurant._id) {
      setPendingCartItem({ item, restaurant });
      setShowCartWarning(true);
      return;
    }

    setCartRestaurant(restaurant);
    const existingIndex = cart.findIndex(c => c.id === item._id || c.id === item.id);
    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      setCart(updated);
    } else {
      setCart([...cart, { id: item._id || item.id, name: item.name, price: item.price, quantity: 1 }]);
    }
  };

  // Increase/Decrease Cart Item
  const handleModifyQuantity = (itemId, amount) => {
    const existingIndex = cart.findIndex(c => c.id === itemId);
    if (existingIndex === -1) return;

    const updated = [...cart];
    updated[existingIndex].quantity += amount;

    if (updated[existingIndex].quantity <= 0) {
      updated.splice(existingIndex, 1);
    }

    setCart(updated);
    if (updated.length === 0) {
      setCartRestaurant(null);
      setIsCheckoutOpen(false);
    }
  };

  const handleClearAndReplaceCart = () => {
    if (pendingCartItem) {
      setCart([{ id: pendingCartItem.item._id || pendingCartItem.item.id, name: pendingCartItem.item.name, price: pendingCartItem.item.price, quantity: 1 }]);
      setCartRestaurant(pendingCartItem.restaurant);
    }
    setShowCartWarning(false);
    setPendingCartItem(null);
  };

  // Authentication Submission
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccessMessage(null);

    if (authMode === 'forgot') {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: authEmail }),
          credentials: 'include'
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Forgot password request failed.');
        
        setAuthSuccessMessage(data.message || 'Reset link generated!');
        if (data.resetToken) {
          setResetToken(data.resetToken);
        }
        setAuthMode('reset');
      } catch (err) {
        setAuthError(err.message);
      }
      return;
    }

    if (authMode === 'reset') {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/reset-password/${resetToken}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: newPassword }),
          credentials: 'include'
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Password reset failed.');
        
        setAuthSuccessMessage('Password reset successfully! Please log in.');
        setAuthMode('login');
        setNewPassword('');
        setResetToken('');
      } catch (err) {
        setAuthError(err.message);
      }
      return;
    }

    const path = authMode === 'login' ? 'login' : 'register';
    const payload = authMode === 'login' 
      ? { email: authEmail, password: authPassword }
      : { name: authName, email: authEmail, password: authPassword, phone: authPhone, address: finalAddress, role: authRole };

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Authentication failed.');
      }
      
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('marketplace_token', data.token);
      localStorage.setItem('marketplace_user', JSON.stringify(data.user));
      setShowAuthModal(false);
      setAuthPassword('');
      if (data.user.role === 'merchant') {
        window.location.href = '/restaurant';
      } else if (data.user.role === 'admin') {
        window.location.href = '/admin';
      }
    } catch (err) {
      setAuthError(err.message);
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (err) {
      console.error('Logout request failed:', err);
    }
    setUser(null);
    setToken(null);
    setUserOrders([]);
    localStorage.removeItem('marketplace_token');
    localStorage.removeItem('marketplace_user');
    setShowProfileDrawer(false);
  };

  // Profile Address CRUD Handlers
  const handleAddAddress = async (e) => {
    e.preventDefault();
    const addressToValidate = profileNewAddress.trim();
    if (!addressToValidate) return;
    setLoadingAddressAction(true);
    try {
      // 1. Geocode & Validate the address via backend Nominatim integration
      const valRes = await fetch(`${API_BASE_URL}/api/orders/validate-address`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: addressToValidate }),
        credentials: 'include'
      });
      const valData = await valRes.json();
      if (!valRes.ok || !valData.success || !valData.isValid) {
        alert(valData.message || 'Invalid Address. Please enter a real location.');
        return;
      }
      
      const verifiedAddress = valData.formattedAddress;

      // 2. Submit the verified address to backend profile CRUD API
      const res = await fetch(`${API_BASE_URL}/api/auth/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ address: verifiedAddress }),
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const updatedUser = { ...user, savedAddresses: data.savedAddresses };
        setUser(updatedUser);
        localStorage.setItem('marketplace_user', JSON.stringify(updatedUser));
        setProfileNewAddress('');
      } else {
        alert(data.message || 'Failed to add address.');
      }
    } catch (err) {
      console.error(err);
      alert('Error validating/adding address.');
    } finally {
      setLoadingAddressAction(false);
    }
  };

  const handleUpdateAddress = async (index) => {
    const addressToValidate = editingAddressValue.trim();
    if (!addressToValidate) return;
    setLoadingAddressAction(true);
    try {
      // 1. Geocode & Validate the address via backend Nominatim integration
      const valRes = await fetch(`${API_BASE_URL}/api/orders/validate-address`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: addressToValidate }),
        credentials: 'include'
      });
      const valData = await valRes.json();
      if (!valRes.ok || !valData.success || !valData.isValid) {
        alert(valData.message || 'Invalid Address. Please enter a real location.');
        return;
      }

      const verifiedAddress = valData.formattedAddress;

      // 2. Submit the verified address to backend profile CRUD API
      const res = await fetch(`${API_BASE_URL}/api/auth/addresses/${index}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ address: verifiedAddress }),
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const updatedUser = { ...user, savedAddresses: data.savedAddresses };
        setUser(updatedUser);
        localStorage.setItem('marketplace_user', JSON.stringify(updatedUser));
        setEditingAddressIndex(null);
        setEditingAddressValue('');
      } else {
        alert(data.message || 'Failed to update address.');
      }
    } catch (err) {
      console.error(err);
      alert('Error validating/updating address.');
    } finally {
      setLoadingAddressAction(false);
    }
  };

  const handleDeleteAddress = async (index) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    setLoadingAddressAction(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/addresses/${index}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const updatedUser = { ...user, savedAddresses: data.savedAddresses };
        setUser(updatedUser);
        localStorage.setItem('marketplace_user', JSON.stringify(updatedUser));
        // Reset editing state if deleting the active one
        if (editingAddressIndex === index) {
          setEditingAddressIndex(null);
          setEditingAddressValue('');
        }
      } else {
        alert(data.message || 'Failed to delete address.');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting address.');
    } finally {
      setLoadingAddressAction(false);
    }
  };

  // Helper to determine if a restaurant is closed
  const isRestaurantOpen = (rest) => {
    if (!rest || !rest.openTime || !rest.closeTime) return true; // Default to open if not set
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const currentTimeMinutes = currentHour * 60 + currentMin;

    const [openH, openM] = rest.openTime.split(':').map(Number);
    const [closeH, closeM] = rest.closeTime.split(':').map(Number);

    const openTimeMinutes = openH * 60 + openM;
    const closeTimeMinutes = closeH * 60 + closeM;

    return currentTimeMinutes >= openTimeMinutes && currentTimeMinutes <= closeTimeMinutes;
  };

  // Order Submission
  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    setSubmittingOrder(true);
    setCheckoutError(null);

    // Enforce Operating Hours Check
    if (cartRestaurant) {
      if (scheduledType === 'later') {
        const schDate = new Date(scheduledTime);
        const schHour = schDate.getHours();
        const schMin = schDate.getMinutes();
        const schTimeMinutes = schHour * 60 + schMin;

        const [openH, openM] = cartRestaurant.openTime.split(':').map(Number);
        const [closeH, closeM] = cartRestaurant.closeTime.split(':').map(Number);

        const openTimeMinutes = openH * 60 + openM;
        const closeTimeMinutes = closeH * 60 + closeM;

        if (schTimeMinutes < openTimeMinutes || schTimeMinutes > closeTimeMinutes) {
          setCheckoutError(`The restaurant is closed at the scheduled time. Operating hours: ${cartRestaurant.openTime} - ${cartRestaurant.closeTime}.`);
          setSubmittingOrder(false);
          return;
        }
      } else {
        if (!isRestaurantOpen(cartRestaurant)) {
          setCheckoutError('The restaurant is closed and not accepting orders at this time.');
          setSubmittingOrder(false);
          return;
        }
      }
    }

    // Google Address Validation
    try {
      const valRes = await fetch(`${API_BASE_URL}/api/orders/validate-address`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: finalAddress }),
        credentials: 'include'
      });
      const valData = await valRes.json();
      if (!valRes.ok || !valData.success || !valData.isValid) {
        setCheckoutError(valData.message || 'Address validation failed. Google Maps could not locate this address.');
        setSubmittingOrder(false);
        return;
      }
      console.log('[Checkout Address Validation] Address verified by Google API Mock:', valData.formattedAddress);
    } catch (valErr) {
      console.warn('[Checkout Address Validation] Address validation service unavailable, skipping:', valErr);
    }

    const orderPayload = {
      customerName: checkoutName,
      customerPhone: checkoutPhone,
      address: finalAddress,
      items: cart.map(item => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity
      })),
      restaurantName: cartRestaurant.name,
      restaurantAddress: cartRestaurant.address,
      restaurantPhone: cartRestaurant.phone,
      restaurantId: cartRestaurant._id,
      subtotal: getCartSubtotal(),
      tax: getTax(),
      deliveryFee: deliveryQuote ? deliveryQuote.deliveryFee : 599,
      paymentMethod,
      scheduledTime: scheduledType === 'later' ? new Date(scheduledTime).toISOString() : null,
      courierNotes: courierNotes.trim() || null
    };

    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers,
        body: JSON.stringify(orderPayload),
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Order failed during creation.');
      }
      setCart([]);
      setCartRestaurant(null);
      setIsCheckoutOpen(false);
      setScheduledType('now');
      setCourierNotes('');
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        window.location.href = `/orders/${data.order._id}`;
      }
    } catch (err) {
      console.error(err);
      setCheckoutError(err.message || 'Connection failure to server.');
    } finally {
      setSubmittingOrder(false);
    }
  };

  const categories = ['All', 'Burgers', 'Sushi', 'Pizza', 'Mexican', 'Indian'];
  
  const filteredRestaurants = restaurants.filter(rest => {
    const matchesSearch = rest.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          rest.cuisine.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || rest.cuisine.includes(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="relative min-h-screen text-brand-text font-sans">
      
      {/* Search & Profile Header Bar */}
      <section className="mb-8 relative z-[60] animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 md:p-6 bg-brand-bg/40 backdrop-blur-md border border-brand-border rounded-3xl">
          
          <div className="flex flex-wrap items-center gap-4">
            {/* Location Picker */}
            <div className="relative z-[70] flex items-center gap-2">
              <MapPin className="text-brand-cyan h-5 w-5 animate-pulse" />
              <div className="text-left">
                <span className="text-[10px] block uppercase text-brand-muted font-bold tracking-wider font-mono">Deliver To</span>
                <button 
                  onClick={() => setShowAddressDropdown(!showAddressDropdown)}
                  className="text-white text-sm font-black flex items-center gap-1 hover:text-brand-cyan transition-all"
                >
                  {finalAddress.substring(0, 30)}...
                  <span className="text-xs">▼</span>
                </button>
              </div>

              {showAddressDropdown && (
                <div className="absolute left-0 top-12 z-[80] w-72 rounded-2xl border border-brand-border bg-brand-card p-4 shadow-2xl backdrop-blur-xl animate-fade-in">
                  
                  {/* Saved User Addresses */}
                  {user && user.savedAddresses && user.savedAddresses.length > 0 && (
                    <div className="mb-3 pb-3 border-b border-brand-border">
                      <p className="text-[10px] font-bold text-brand-cyan mb-1.5 uppercase font-mono tracking-wider">Your Saved Addresses</p>
                      <div className="flex flex-col gap-1">
                        {user.savedAddresses.map((addr, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setSelectedAddress(addr);
                              setCustomAddress('');
                              setShowAddressDropdown(false);
                              // Fetch coordinates in background for distance sorting
                              fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addr)}&countrycodes=us&limit=1`)
                                .then(res => res.json())
                                .then(data => {
                                  if (data && data.length > 0) {
                                    setUserCoords({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
                                  }
                                })
                                .catch(err => console.error('Geocode error:', err));
                            }}
                            className="text-left text-xs rounded-xl px-2.5 py-1.5 bg-brand-bg/40 text-white hover:bg-brand-bg hover:text-brand-cyan border border-brand-border/40 hover:border-brand-cyan transition-all truncate"
                          >
                            📍 {addr}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-[10px] font-bold text-brand-muted mb-1.5 uppercase font-mono tracking-wider">Select USA Test Address</p>
                  <div className="flex flex-col gap-1.5 mb-3">
                    {PRESET_ADDRESSES.map((preset) => (
                      <button
                        key={preset.address}
                        onClick={() => {
                          setSelectedAddress(preset.address);
                          setUserCoords({ lat: preset.lat, lng: preset.lng });
                          setCustomAddress('');
                          setShowAddressDropdown(false);
                        }}
                        className="text-left text-xs rounded-xl px-3 py-2 text-brand-muted hover:bg-brand-bg hover:text-white transition-all border border-transparent hover:border-brand-border"
                      >
                        <span className="font-bold text-brand-cyan block">{preset.label}</span>
                        {preset.address}
                      </button>
                    ))}
                  </div>
                  
                  <div className="border-t border-brand-border pt-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-brand-muted uppercase block">Custom USA Address</label>
                      <button
                        type="button"
                        onClick={handleDetectLocation}
                        disabled={detectingLocation}
                        className="text-[10px] text-brand-cyan hover:text-white font-bold flex items-center gap-1 transition-all disabled:opacity-50 cursor-pointer"
                      >
                        <MapPin size={10} className="animate-bounce" />
                        {detectingLocation ? 'Locating...' : 'Detect GPS'}
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        value={customAddress}
                        onChange={(e) => setCustomAddress(e.target.value)}
                        placeholder="e.g. 100 Sutter St, San Francisco, CA"
                        className="w-full text-xs bg-brand-bg rounded-xl border border-brand-border px-3.5 py-2.5 outline-none text-white focus:border-brand-cyan"
                      />
                      {loadingSuggestions && (
                        <div className="absolute right-3 top-3">
                          <Loader2 className="h-3.5 w-3.5 text-brand-cyan animate-spin" />
                        </div>
                      )}
                    </div>

                    {/* Suggestions list */}
                    {addressSuggestions.length > 0 && (
                      <div className="rounded-xl border border-brand-border bg-brand-bg overflow-hidden shadow-lg max-h-48 overflow-y-auto divide-y divide-brand-border/40 animate-fade-in">
                        {addressSuggestions.map((suggestion) => (
                          <button
                            key={suggestion.place_id}
                            type="button"
                            onClick={() => {
                              setSelectedAddress(suggestion.display_name);
                              setCustomAddress(suggestion.display_name);
                              setUserCoords({ lat: parseFloat(suggestion.lat), lng: parseFloat(suggestion.lon) });
                              setAddressSuggestions([]);
                              setShowAddressDropdown(false);
                            }}
                            className="w-full text-left text-[11px] p-2.5 text-brand-muted hover:bg-brand-card hover:text-white transition-all truncate block"
                            title={suggestion.display_name}
                          >
                            📍 {suggestion.display_name}
                          </button>
                        ))}
                      </div>
                    )}

                    {customAddress && customAddress.length >= 4 && addressSuggestions.length === 0 && !loadingSuggestions && (
                      <p className="text-[10px] text-brand-muted text-center py-2.5 font-bold italic">
                        No matching address found on map. Please type a valid location.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile trigger button */}
            <div className="h-8 w-[1px] bg-brand-border" />
            <div className="flex items-center gap-2">
              {user && user.role === 'merchant' && (
                <a
                  href="/restaurant"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-brand-cyan/40 bg-brand-cyan/10 hover:bg-brand-cyan hover:text-brand-bg text-[10px] text-brand-cyan font-black transition-all uppercase tracking-wider"
                  title="Go to Restaurant Portal"
                >
                  <Store size={12} /> Merchant Portal
                </a>
              )}
              {user && user.role === 'admin' && (
                <a
                  href="/admin"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-brand-cyan/40 bg-brand-cyan/10 hover:bg-brand-cyan hover:text-brand-bg text-[10px] text-brand-cyan font-black transition-all uppercase tracking-wider"
                  title="Go to Admin Dashboard"
                >
                  <ShieldCheck size={12} /> Admin Portal
                </a>
              )}
              {user ? (
                <button
                  onClick={() => setShowProfileDrawer(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-brand-cyan/20 bg-brand-cyan/5 hover:bg-brand-cyan/15 text-xs text-brand-cyan font-black transition-all"
                >
                  <UserCheck size={14} className="animate-pulse" />
                  Hi, {user.name.split(' ')[0]}
                </button>
              ) : (
                <button
                  onClick={() => {
                    setAuthMode('login');
                    setShowAuthModal(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-brand-border bg-brand-bg hover:bg-brand-card text-xs text-brand-muted hover:text-white transition-all font-extrabold uppercase tracking-wide"
                >
                  <LogIn size={13} />
                  Login
                </button>
              )}
            </div>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-md w-full">
            <span className="absolute inset-y-0 left-3 flex items-center text-brand-muted">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search cuisine, restaurants, or dishes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-2xl bg-brand-bg/60 border border-brand-border text-white placeholder-brand-muted/50 outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all"
            />
          </div>
        </div>
      </section>

      {/* Categories Horizontal Scroller */}
      <section className="mb-8 overflow-x-auto scrollbar-hide py-2">
        <div className="flex gap-3">
          {categories.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2.5 text-xs font-black tracking-wide rounded-full border transition-all ${
                  active 
                    ? 'bg-gradient-to-r from-brand-cyan to-brand-blue text-brand-bg border-transparent shadow-lg shadow-brand-cyan/20' 
                    : 'bg-brand-card/40 border-brand-border hover:border-brand-cyan/50 text-brand-muted hover:text-white'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </section>

      {/* Marketplace Listings Section */}
      {loadingRestaurants ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="h-10 w-10 text-brand-cyan animate-spin" />
          <p className="text-xs text-brand-muted font-mono tracking-widest uppercase animate-pulse">Fetching Restaurants from database...</p>
        </div>
      ) : filteredRestaurants.length > 0 ? (
        <main className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredRestaurants.map((rest) => {
            const open = isRestaurantOpen(rest);
            return (
              <div 
                key={rest._id}
                className={`group glass-panel rounded-3xl overflow-hidden hover:border-brand-cyan/40 transition-all flex flex-col justify-between animate-fade-in ${!open ? 'opacity-70' : ''}`}
              >
                {/* Banner Image */}
                <div className="h-44 relative overflow-hidden bg-brand-bg">
                  <img 
                    src={rest.banner} 
                    alt={rest.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {!open && (
                    <div className="absolute inset-0 bg-brand-bg/85 flex items-center justify-center">
                      <span className="bg-brand-red/10 border border-brand-red/30 text-brand-red font-mono font-bold text-xs uppercase px-3 py-1.5 rounded-xl tracking-wider">
                        Closed Now ({rest.openTime || '10:00'} - {rest.closeTime || '22:00'})
                      </span>
                    </div>
                  )}
                  <div className="absolute top-3 right-3 bg-brand-bg/80 backdrop-blur-md border border-brand-border px-2.5 py-1 rounded-xl flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-brand-cyan text-brand-cyan" />
                    <span className="text-xs font-bold text-white">{rest.rating}</span>
                  </div>
                </div>

                {/* Content Details */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-black text-white group-hover:text-brand-cyan transition-colors">{rest.name}</h3>
                    <p className="text-xs text-brand-muted mt-1 leading-relaxed">{rest.cuisine}</p>
                    
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-brand-border/40 text-[11px] text-brand-muted">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-brand-cyan" />
                        <span>{rest.deliveryTime}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-brand-cyan" />
                        <span>{rest.distance}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenMenu(rest)}
                    className="mt-5 w-full flex items-center justify-center gap-1.5 py-3 rounded-xl bg-brand-card hover:bg-brand-cyan hover:text-brand-bg font-extrabold text-xs tracking-wider uppercase border border-brand-border hover:border-transparent transition-all"
                  >
                    {open ? 'Order from Menu' : 'View Menu (Closed)'}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </main>
      ) : (
        <main className="mx-auto max-w-lg text-center py-16 animate-fade-in glass-panel rounded-3xl p-8 border border-brand-border space-y-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-cyan/10 border border-brand-cyan/30 text-brand-cyan shadow-[0_0_15px_rgba(20,184,166,0.2)]">
            <MapPin size={24} className="animate-pulse" />
          </div>
          <div className="space-y-2 text-xs">
            <h3 className="text-xl font-black text-white">Outside Our Service Range</h3>
            <p className="text-xs text-brand-muted leading-relaxed">
              We don't have any partner restaurants serving <span className="text-brand-cyan font-bold">{finalAddress.substring(0, 45)}...</span> yet. 
            </p>
            <p className="text-[11px] text-brand-muted leading-relaxed mt-2">
              Please click the delivery address dropdown in the top header and select one of our San Francisco test address presets (e.g. Oak St, Union Square, or Mission District) to explore nearby restaurants and test placing a DoorDash delivery.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => setShowAddressDropdown(true)}
              className="py-3 px-6 rounded-xl bg-brand-cyan text-brand-bg font-black text-xs uppercase tracking-wider transition-all hover:bg-brand-cyan/95 active:scale-95 cursor-pointer"
            >
              Select Preset Address
            </button>
          </div>
        </main>
      )}

      {/* Floating Shopping Cart Drawer Trigger */}
      {cart.length > 0 && !isCheckoutOpen && (
        <div className="fixed bottom-6 right-6 z-40 animate-bounce">
          <button
            onClick={() => setIsCheckoutOpen(true)}
            className="flex items-center gap-2.5 px-6 py-4 rounded-full bg-gradient-to-r from-brand-green to-brand-cyan text-brand-bg font-black shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <ShoppingBag className="h-5 w-5" />
            <span>View Cart ({cart.reduce((s, i) => s + i.quantity, 0)} Items)</span>
            <span className="h-5 w-[1px] bg-brand-bg/30" />
            <span>${getGrandTotal().toFixed(2)}</span>
          </button>
        </div>
      )}

      {/* Restaurant Menu Modal */}
      {activeRestaurant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-bg/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl bg-brand-card border border-brand-border rounded-3xl overflow-hidden shadow-2xl max-h-[85vh] flex flex-col">
            
            {/* Header info */}
            <div className="relative h-48 bg-brand-bg shrink-0">
              <img 
                src={activeRestaurant.banner} 
                alt={activeRestaurant.name} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-card to-transparent" />
              <button 
                onClick={() => setActiveRestaurant(null)}
                className="absolute top-4 right-4 h-9 w-9 rounded-full bg-brand-bg/70 hover:bg-brand-bg border border-brand-border flex items-center justify-center text-white hover:text-brand-cyan transition-all"
              >
                <X size={18} />
              </button>
              <div className="absolute bottom-4 left-6">
                <h2 className="text-2xl font-black text-white">{activeRestaurant.name}</h2>
                <p className="text-xs text-brand-cyan mt-1">{activeRestaurant.cuisine} • {activeRestaurant.distance}</p>
              </div>
            </div>

            {/* Menu List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loadingMenu ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="h-8 w-8 text-brand-cyan animate-spin" />
                  <p className="text-xs text-brand-muted font-mono">Loading restaurant menu from database...</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {activeRestaurant.menu && activeRestaurant.menu.map((item) => {
                    const itemId = item._id || item.id;
                    const cartQty = cart.find(c => c.id === itemId)?.quantity || 0;
                    const isAvailable = item.isAvailable !== false;
                    return (
                      <div 
                        key={itemId}
                        className={`p-4 rounded-2xl bg-brand-bg/40 border border-brand-border flex justify-between items-center gap-4 hover:border-brand-cyan/20 transition-all ${!isAvailable ? 'opacity-50' : ''}`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs uppercase font-mono font-bold text-brand-cyan border border-brand-cyan/30 px-1.5 py-0.5 rounded bg-brand-cyan/5">
                              {item.category}
                            </span>
                            {!isAvailable && (
                              <span className="text-[9px] uppercase font-mono font-bold text-brand-red border border-brand-red/30 px-1.5 py-0.5 rounded bg-brand-red/5">
                                Out of Stock
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-black text-white mt-1.5">{item.name}</h4>
                          <p className="text-xs text-brand-muted mt-1 leading-relaxed max-w-md">{item.description}</p>
                          <span className="text-sm font-black text-white block mt-2">${item.price.toFixed(2)}</span>
                        </div>
                        
                        {/* Quantity Controls */}
                        <div className="shrink-0">
                          {!isAvailable ? (
                            <button
                              disabled
                              className="rounded-xl border border-brand-border/40 bg-brand-bg text-brand-muted text-xs font-bold px-4 py-2 cursor-not-allowed"
                            >
                              Sold Out
                            </button>
                          ) : cartQty > 0 ? (
                            <div className="flex items-center gap-3 bg-brand-cyan/10 border border-brand-cyan/30 rounded-xl px-2 py-1.5">
                              <button 
                                onClick={() => handleModifyQuantity(itemId, -1)}
                                className="text-brand-cyan hover:text-white font-bold px-1.5"
                              >
                                -
                              </button>
                              <span className="text-xs font-black text-brand-cyan font-mono">{cartQty}</span>
                              <button 
                                onClick={() => handleAddToCart(item, activeRestaurant)}
                                className="text-brand-cyan hover:text-white font-bold px-1.5"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleAddToCart(item, activeRestaurant)}
                              className="rounded-xl border border-brand-border bg-brand-card hover:bg-brand-cyan hover:text-brand-bg hover:border-transparent text-xs font-bold px-4 py-2 transition-all"
                            >
                              + Add
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Modal Bottom Cart Notice */}
            {cart.length > 0 && cartRestaurant?._id === activeRestaurant._id && (
              <div className="p-4 border-t border-brand-border bg-brand-bg/50 shrink-0 flex items-center justify-between text-xs">
                <span className="text-brand-muted">
                  Added <strong className="text-white font-bold">{cart.reduce((s, i) => s + i.quantity, 0)} items</strong> from this restaurant
                </span>
                <button
                  onClick={() => {
                    setActiveRestaurant(null);
                    setIsCheckoutOpen(true);
                  }}
                  className="rounded-xl bg-brand-cyan text-brand-bg font-extrabold px-4 py-2 tracking-wide flex items-center gap-1 uppercase"
                >
                  View Cart
                  <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cart Drawer & Checkout Form */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-brand-bg/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-brand-card border-l border-brand-border h-full flex flex-col justify-between shadow-2xl relative">
            
            {/* Header */}
            <div className="p-5 border-b border-brand-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="text-brand-cyan" />
                <h3 className="text-md font-black text-white">Your Marketplace Cart</h3>
              </div>
              <button 
                onClick={() => setIsCheckoutOpen(false)}
                className="h-8 w-8 rounded-full border border-brand-border hover:border-brand-cyan hover:text-brand-cyan flex items-center justify-center text-brand-muted transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Cart Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              
              {/* Restaurant Header */}
              {cartRestaurant && (
                <div className="rounded-xl bg-brand-bg/40 border border-brand-border p-4">
                  <span className="text-[9px] uppercase tracking-wider font-bold text-brand-cyan font-mono">Ordering From</span>
                  <h4 className="text-sm font-black text-white mt-1">{cartRestaurant.name}</h4>
                  <p className="text-[10px] text-brand-muted leading-tight mt-1">{cartRestaurant.address}</p>
                </div>
              )}

              {/* Items List */}
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-center gap-4 py-2 border-b border-brand-border/40 text-xs">
                    <div className="flex-1">
                      <p className="font-bold text-white">{item.name}</p>
                      <p className="text-[10px] text-brand-muted font-mono mt-0.5">${item.price.toFixed(2)} each</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2.5 bg-brand-bg border border-brand-border rounded-lg px-2 py-1">
                        <button 
                          onClick={() => handleModifyQuantity(item.id, -1)}
                          className="text-brand-muted hover:text-white font-bold"
                        >
                          -
                        </button>
                        <span className="text-[11px] font-bold text-white font-mono">{item.quantity}</span>
                        <button 
                          onClick={() => handleAddToCart({ _id: item.id, name: item.name, price: item.price }, cartRestaurant)}
                          className="text-brand-muted hover:text-white font-bold"
                        >
                          +
                        </button>
                      </div>
                      <span className="font-bold text-white min-w-[50px] text-right">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Delivery Form */}
              {!user ? (
                <div className="flex flex-col items-center justify-center text-center p-6 bg-brand-bg/30 border border-brand-border rounded-2xl gap-4 animate-fade-in my-6">
                  <div className="h-12 w-12 rounded-full border border-brand-cyan/20 bg-brand-cyan/5 flex items-center justify-center text-brand-cyan shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                    <LogIn size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-wider font-mono">Authentication Required</h4>
                    <p className="text-[11px] text-brand-muted mt-1 leading-relaxed max-w-[220px] mx-auto">
                      Please sign in or create a WebForge account to configure delivery instructions and check out.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setShowAuthModal(true);
                    }}
                    className="w-full py-3.5 rounded-xl bg-brand-cyan hover:bg-brand-cyan/95 text-brand-bg font-extrabold text-xs uppercase tracking-wide hover:shadow-lg hover:shadow-brand-cyan/15 transition-all cursor-pointer"
                  >
                    Log In / Register
                  </button>
                </div>
              ) : (
                <form id="checkout-form" onSubmit={handleCheckoutSubmit} className="space-y-4 pt-4 border-t border-brand-border/60">
                  <h4 className="text-xs uppercase tracking-wider font-bold text-brand-muted font-mono">Fulfillment Details</h4>
                
                {checkoutError && (
                  <div className="p-3.5 rounded-xl border border-brand-red/30 bg-brand-red/5 text-xs text-brand-red leading-relaxed font-bold">
                    {checkoutError}
                  </div>
                )}

                {/* Name */}
                <div className="flex flex-col gap-1.5 text-xs">
                  <label className="font-bold text-brand-muted flex items-center gap-1">
                    <User size={12} className="text-brand-cyan" /> CUSTOMER NAME
                  </label>
                  <input
                    type="text"
                    required
                    value={checkoutName}
                    onChange={(e) => setCheckoutName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-brand-bg/85 rounded-xl border border-brand-border px-3.5 py-3 outline-none text-white focus:border-brand-cyan"
                  />
                </div>

                {/* US Phone */}
                <div className="flex flex-col gap-1.5 text-xs">
                  <label className="font-bold text-brand-muted flex items-center gap-1">
                    <Phone size={12} className="text-brand-cyan" /> US PHONE (E.164 Format)
                  </label>
                  <input
                    type="text"
                    required
                    value={checkoutPhone}
                    onChange={(e) => setCheckoutPhone(e.target.value)}
                    placeholder="+16505550199"
                    className="w-full bg-brand-bg/85 rounded-xl border border-brand-border px-3.5 py-3 outline-none text-white focus:border-brand-cyan font-mono"
                  />
                  <span className="text-[9px] text-brand-muted">Must include +1 country code for Sandbox validation.</span>
                </div>

                {/* Delivery Address Details */}
                <div className="flex flex-col gap-1.5 text-xs">
                  <label className="font-bold text-brand-muted flex items-center gap-1">
                    <MapPin size={12} className="text-brand-cyan" /> DROP-OFF ADDRESS (US)
                  </label>
                  <textarea
                    rows={2}
                    readOnly
                    value={finalAddress}
                    className="w-full bg-brand-bg/40 rounded-xl border border-brand-border px-3.5 py-2.5 outline-none text-brand-muted text-[11px] resize-none cursor-not-allowed"
                  />
                  <span className="text-[9px] text-brand-muted">Address is modified via the location selector at the top.</span>
                </div>

                {/* Delivery Timing Selection */}
                <div className="flex flex-col gap-2 text-xs pt-2">
                  <label className="font-bold text-brand-muted">DELIVERY TIMING</label>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setScheduledType('now')}
                      className={`py-3 rounded-xl border text-[10px] font-bold transition-all ${
                        scheduledType === 'now' 
                          ? 'border-brand-cyan bg-brand-cyan/10 text-brand-cyan' 
                          : 'border-brand-border bg-brand-bg/40 text-brand-muted hover:border-brand-border/80'
                      }`}
                    >
                      Deliver Now (ASAP)
                    </button>

                    <button
                      type="button"
                      onClick={() => setScheduledType('later')}
                      className={`py-3 rounded-xl border text-[10px] font-bold transition-all ${
                        scheduledType === 'later' 
                          ? 'border-brand-cyan bg-brand-cyan/10 text-brand-cyan' 
                          : 'border-brand-border bg-brand-bg/40 text-brand-muted hover:border-brand-border/80'
                      }`}
                    >
                      Schedule Delivery
                    </button>
                  </div>

                  {scheduledType === 'later' && (
                    <div className="mt-2 space-y-1 animate-fade-in">
                      <input
                        type="datetime-local"
                        required
                        value={scheduledTime}
                        min={(() => {
                          const minTime = new Date(Date.now() + 40 * 60 * 1000);
                          const tzoffset = minTime.getTimezoneOffset() * 60000;
                          return new Date(minTime.getTime() - tzoffset).toISOString().slice(0, 16);
                        })()}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="w-full bg-brand-bg/85 rounded-xl border border-brand-border px-3.5 py-3 outline-none text-white focus:border-brand-cyan font-mono"
                      />
                      <span className="text-[9px] text-brand-muted block">
                        Must schedule at least 40 minutes and no more than 30 days in advance.
                      </span>
                    </div>
                  )}
                </div>

                {/* Courier Instructions */}
                <div className="flex flex-col gap-1.5 text-xs">
                  <label className="font-bold text-brand-muted">
                    COURIER DROP-OFF INSTRUCTIONS
                  </label>
                  <textarea
                    rows={2}
                    value={courierNotes}
                    onChange={(e) => setCourierNotes(e.target.value)}
                    placeholder="Gate codes, apartment number, or drop-off instructions... (Optional)"
                    className="w-full bg-brand-bg/85 rounded-xl border border-brand-border px-3.5 py-2.5 outline-none text-white focus:border-brand-cyan placeholder:text-brand-muted/70 text-[11px] resize-none"
                  />
                </div>

                {/* Payment Selection */}
                <div className="flex flex-col gap-2.5 text-xs pt-2">
                  <label className="font-bold text-brand-muted">PAYMENT METHOD</label>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('Credit Card')}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-[10px] font-bold transition-all ${
                        paymentMethod === 'Credit Card' 
                          ? 'border-brand-cyan bg-brand-cyan/10 text-brand-cyan' 
                          : 'border-brand-border bg-brand-bg/40 text-brand-muted hover:border-brand-border/80'
                      }`}
                    >
                      <CreditCard size={14} className="mb-1" />
                      Card
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('Apple Pay')}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-[10px] font-bold transition-all ${
                        paymentMethod === 'Apple Pay' 
                          ? 'border-brand-cyan bg-brand-cyan/10 text-brand-cyan' 
                          : 'border-brand-border bg-brand-bg/40 text-brand-muted hover:border-brand-border/80'
                      }`}
                    >
                      <Smartphone size={14} className="mb-1" />
                      Apple Pay
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('Cash on Delivery')}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-[10px] font-bold transition-all ${
                        paymentMethod === 'Cash on Delivery' 
                          ? 'border-brand-cyan bg-brand-cyan/10 text-brand-cyan' 
                          : 'border-brand-border bg-brand-bg/40 text-brand-muted hover:border-brand-border/80'
                      }`}
                    >
                      <Coins size={14} className="mb-1" />
                      Cash
                    </button>
                  </div>
                </div>
 
              </form>
              )}
            </div>

            {/* Sticky Order Receipt & Button */}
            <div className="p-5 border-t border-brand-border bg-brand-bg/90 backdrop-blur-md space-y-4 shrink-0">
              
              {/* Receipt Calculation Details */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-brand-muted">
                  <span>Subtotal:</span>
                  <span className="font-bold text-white">${getCartSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-brand-muted">
                  <span>Sales Tax (8.25%):</span>
                  <span className="font-bold text-white">${getTax().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-brand-muted items-center">
                  <span className="flex items-center gap-1">
                    Platform Service Fee:
                    <Tag size={10} className="text-brand-cyan" />
                  </span>
                  <span className="font-bold text-brand-cyan">${getPlatformFee().toFixed(2)}</span>
                </div>
                
                {/* Dynamic Delivery Charge Loader */}
                <div className="flex justify-between text-brand-muted items-center">
                  <span>DoorDash Courier Charge:</span>
                  {loadingQuote ? (
                    <div className="flex items-center gap-1 text-[10px] text-brand-cyan font-mono">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Calculating quote...
                    </div>
                  ) : (
                    <span className="font-bold text-brand-green">
                      {deliveryQuote ? `$${getDeliveryFee().toFixed(2)}` : '$0.00'}
                    </span>
                  )}
                </div>

                <div className="border-t border-brand-border/60 pt-3 flex justify-between items-baseline">
                  <span className="text-sm font-black text-white uppercase tracking-wider font-mono">Grand Total:</span>
                  <span className="text-xl font-black text-white">
                    ${getGrandTotal().toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              {!user ? (
                <button
                  onClick={() => {
                    setAuthMode('login');
                    setShowAuthModal(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-blue hover:from-brand-blue hover:to-brand-cyan text-brand-bg text-sm font-black shadow-lg shadow-brand-cyan/20 active:scale-[0.98] transition-all cursor-pointer animate-pulse"
                >
                  Log In to Place Order
                  <LogIn className="h-4 w-4" />
                </button>
              ) : (
                <button
                  form="checkout-form"
                  type="submit"
                  disabled={submittingOrder || loadingQuote || !deliveryQuote}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-brand-green to-brand-cyan hover:from-brand-cyan hover:to-brand-blue text-brand-bg text-sm font-black shadow-lg shadow-brand-cyan/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                >
                  {submittingOrder ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Placing Order & Requesting Dasher...
                    </>
                  ) : (
                    <>
                      Checkout with {paymentMethod}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Multi-Restaurant Shopping Cart Reset Warning Dialog */}
      {showCartWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-bg/80 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-3xl bg-brand-card border border-brand-border p-6 shadow-2xl space-y-4 text-center">
            <div className="h-12 w-12 rounded-full border border-brand-cyan/30 bg-brand-cyan/5 flex items-center justify-center text-brand-cyan mx-auto">
              <ShoppingBag size={20} />
            </div>
            
            <div>
              <h3 className="text-lg font-black text-white">Replace Cart Items?</h3>
              <p className="text-xs text-brand-muted leading-relaxed mt-2">
                Your cart contains items from <strong className="text-white">{cartRestaurant?.name}</strong>. Ordering from <strong className="text-white">{pendingCartItem?.restaurant.name}</strong> will discard current selections.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => {
                  setShowCartWarning(false);
                  setPendingCartItem(null);
                }}
                className="rounded-xl border border-brand-border bg-brand-card hover:bg-brand-bg/50 text-xs font-bold py-3 transition-all text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAndReplaceCart}
                className="rounded-xl bg-brand-cyan text-brand-bg font-black text-xs py-3 transition-all uppercase tracking-wide"
              >
                Yes, Replace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Authentication Sign In / Sign Up Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-bg/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-brand-card border border-brand-border p-6 shadow-2xl space-y-5">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-white">
                {authMode === 'login' && 'Welcome Back!'}
                {authMode === 'register' && 'Create Account'}
                {authMode === 'forgot' && 'Reset Password Request'}
                {authMode === 'reset' && 'Reset Your Password'}
              </h3>
              <button 
                onClick={() => {
                  setShowAuthModal(false);
                  setAuthError(null);
                  setAuthSuccessMessage(null);
                }}
                className="h-8 w-8 rounded-full border border-brand-border hover:border-brand-cyan hover:text-brand-cyan flex items-center justify-center text-brand-muted transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {authError && (
              <div className="p-3.5 rounded-xl border border-brand-red/30 bg-brand-red/10 text-xs font-semibold text-brand-red animate-shake">
                {authError}
              </div>
            )}

            {authSuccessMessage && (
              <div className="p-3.5 rounded-xl border border-brand-green/30 bg-brand-green/10 text-xs font-semibold text-brand-green">
                {authSuccessMessage}
              </div>
            )}

            {/* Auth Form */}
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              
              {authMode === 'register' && (
                <div className="flex flex-col gap-1 text-xs">
                  <label className="font-bold text-brand-muted uppercase">Full Name</label>
                  <input
                    type="text"
                    required
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full bg-brand-bg/70 rounded-xl border border-brand-border px-3.5 py-2.5 outline-none text-white focus:border-brand-cyan text-xs"
                  />
                </div>
              )}

              {(authMode === 'login' || authMode === 'register' || authMode === 'forgot') && (
                <div className="flex flex-col gap-1 text-xs">
                  <label className="font-bold text-brand-muted uppercase">Email Address</label>
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-brand-bg/70 rounded-xl border border-brand-border px-3.5 py-2.5 outline-none text-white focus:border-brand-cyan text-xs"
                  />
                </div>
              )}

              {authMode === 'register' && (
                <>
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-bold text-brand-muted uppercase">US Mobile (E.164 format)</label>
                    <input
                      type="text"
                      required
                      value={authPhone}
                      onChange={(e) => setAuthPhone(e.target.value)}
                      placeholder="+16505550199"
                      className="w-full bg-brand-bg/70 rounded-xl border border-brand-border px-3.5 py-2.5 outline-none text-white focus:border-brand-cyan font-mono text-xs"
                    />
                  </div>

                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-bold text-brand-muted uppercase">Register As</label>
                    <select
                      value={authRole}
                      onChange={(e) => setAuthRole(e.target.value)}
                      className="w-full bg-brand-bg/70 rounded-xl border border-brand-border px-3.5 py-2.5 outline-none text-white focus:border-brand-cyan text-xs cursor-pointer"
                    >
                      <option value="customer">Order Food (Customer)</option>
                      <option value="merchant">Register Restaurant (Partner)</option>
                    </select>
                  </div>
                </>
              )}

              {authMode === 'reset' && (
                <div className="flex flex-col gap-1 text-xs">
                  <label className="font-bold text-brand-muted uppercase">Reset Token</label>
                  <input
                    type="text"
                    required
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    placeholder="Enter reset token"
                    className="w-full bg-brand-bg/70 rounded-xl border border-brand-border px-3.5 py-2.5 outline-none text-white focus:border-brand-cyan font-mono text-xs"
                  />
                </div>
              )}

              {(authMode === 'login' || authMode === 'register') && (
                <div className="flex flex-col gap-1 text-xs">
                  <label className="font-bold text-brand-muted uppercase">Password</label>
                  <input
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-brand-bg/70 rounded-xl border border-brand-border px-3.5 py-2.5 outline-none text-white focus:border-brand-cyan text-xs"
                  />
                </div>
              )}

              {authMode === 'reset' && (
                <div className="flex flex-col gap-1 text-xs">
                  <label className="font-bold text-brand-muted uppercase">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-brand-bg/70 rounded-xl border border-brand-border px-3.5 py-2.5 outline-none text-white focus:border-brand-cyan text-xs"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 mt-2 rounded-xl bg-gradient-to-r from-brand-green to-brand-cyan hover:from-brand-cyan hover:to-brand-blue text-brand-bg font-black text-xs uppercase tracking-wide shadow-lg shadow-brand-cyan/15 active:scale-[0.98] transition-all cursor-pointer text-center"
              >
                {authMode === 'login' && 'Sign In'}
                {authMode === 'register' && 'Create Account'}
                {authMode === 'forgot' && 'Send Reset Code'}
                {authMode === 'reset' && 'Update Password'}
              </button>
            </form>

            {/* Toggle mode */}
            <div className="text-center text-xs text-brand-muted pt-2 border-t border-brand-border/50 space-y-2">
              {authMode === 'login' ? (
                <>
                  <p>
                    Don't have an account?{' '}
                    <button 
                      onClick={() => {
                        setAuthMode('register');
                        setAuthError(null);
                        setAuthSuccessMessage(null);
                      }}
                      className="text-brand-cyan font-black hover:underline"
                    >
                      Register
                    </button>
                  </p>
                  <p>
                    <button 
                      onClick={() => {
                        setAuthMode('forgot');
                        setAuthError(null);
                        setAuthSuccessMessage(null);
                      }}
                      className="text-brand-muted font-bold hover:underline hover:text-brand-cyan"
                    >
                      Forgot Password?
                    </button>
                  </p>
                </>
              ) : (
                <p>
                  Already have an account?{' '}
                  <button 
                    onClick={() => {
                      setAuthMode('login');
                      setAuthError(null);
                      setAuthSuccessMessage(null);
                    }}
                    className="text-brand-cyan font-black hover:underline"
                  >
                    Login
                  </button>
                </p>
              )}
            </div>

          </div>
        </div>
      )}

      {/* User Profile & Past Orders History Drawer */}
      {showProfileDrawer && user && (
        <div className="fixed inset-0 z-50 flex justify-end bg-brand-bg/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-brand-card border-l border-brand-border h-full flex flex-col justify-between shadow-2xl relative">
            
            {/* Drawer Header */}
            <div className="p-5 border-b border-brand-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="text-brand-cyan" />
                <h3 className="text-md font-black text-white">Your Customer Profile</h3>
              </div>
              <button 
                onClick={() => setShowProfileDrawer(false)}
                className="h-8 w-8 rounded-full border border-brand-border hover:border-brand-cyan hover:text-brand-cyan flex items-center justify-center text-brand-muted transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              
              {/* User Account Info */}
              <div className="rounded-2xl border border-brand-border bg-brand-bg/40 p-4 space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-brand-muted">Name:</span>
                  <span className="font-black text-white">{user.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-muted">Email:</span>
                  <span className="font-bold text-white font-mono">{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex justify-between">
                    <span className="text-brand-muted">Phone:</span>
                    <span className="font-bold text-white font-mono">{user.phone}</span>
                  </div>
                )}
              </div>

              {/* Partner Dashboards Redirection Links */}
              {user.role === 'merchant' && (
                <div className="rounded-2xl border border-brand-cyan/20 bg-brand-cyan/5 p-4 space-y-3 text-xs">
                  <p className="text-[10px] font-bold text-brand-cyan uppercase font-mono tracking-wider">Partner Shortcuts</p>
                  <div className="flex flex-col gap-2">
                    <a
                      href="/restaurant"
                      className="w-full text-center py-2.5 rounded-xl bg-brand-cyan text-brand-bg hover:bg-brand-cyan/95 font-extrabold transition-all uppercase tracking-wider text-[10px]"
                    >
                      Go to Restaurant Portal
                    </a>
                  </div>
                </div>
              )}
              {user.role === 'admin' && (
                <div className="rounded-2xl border border-brand-cyan/20 bg-brand-cyan/5 p-4 space-y-3 text-xs">
                  <p className="text-[10px] font-bold text-brand-cyan uppercase font-mono tracking-wider">Admin Shortcuts</p>
                  <div className="flex flex-col gap-2">
                    <a
                      href="/admin"
                      className="w-full text-center py-2.5 rounded-xl bg-brand-cyan text-brand-bg hover:bg-brand-cyan/95 font-extrabold transition-all uppercase tracking-wider text-[10px]"
                    >
                      Go to Admin Dashboard
                    </a>
                  </div>
                </div>
              )}

              {/* Saved Delivery Addresses */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-wider font-bold text-brand-muted font-mono">Saved Dropoff Locations</h4>
                
                {/* Add Address Form */}
                <div className="relative">
                  <form onSubmit={handleAddAddress} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add new dropoff address..."
                      value={profileNewAddress}
                      onChange={(e) => setProfileNewAddress(e.target.value)}
                      className="flex-1 bg-brand-bg/85 rounded-xl border border-brand-border px-3 py-2 outline-none text-white text-xs focus:border-brand-cyan placeholder:text-brand-muted/70"
                      disabled={loadingAddressAction}
                    />
                    <button
                      type="submit"
                      disabled={loadingAddressAction || !profileNewAddress.trim()}
                      className="bg-brand-cyan text-brand-bg hover:bg-brand-cyan/90 disabled:opacity-50 disabled:pointer-events-none rounded-xl p-2 flex items-center justify-center transition-all cursor-pointer"
                    >
                      {loadingProfileSuggestions ? <Loader2 size={16} className="animate-spin text-brand-bg" /> : <Plus size={16} />}
                    </button>
                  </form>

                  {/* Profile Address Suggestions list */}
                  {profileAddressSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-11 z-50 rounded-xl border border-brand-border bg-brand-bg overflow-hidden shadow-2xl max-h-48 overflow-y-auto divide-y divide-brand-border/40 animate-fade-in">
                      {profileAddressSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.place_id}
                          type="button"
                          onClick={() => {
                            setProfileNewAddress(suggestion.display_name);
                            setProfileAddressSuggestions([]);
                          }}
                          className="w-full text-left text-[11px] p-2.5 text-brand-muted hover:bg-brand-card hover:text-white transition-all truncate block"
                          title={suggestion.display_name}
                        >
                          📍 {suggestion.display_name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {user.savedAddresses && user.savedAddresses.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {user.savedAddresses.map((addr, idx) => {
                      const isEditing = editingAddressIndex === idx;
                      return (
                        <div 
                          key={idx} 
                          className="text-xs rounded-xl p-3 bg-brand-bg/20 border border-brand-border hover:border-brand-cyan/20 transition-all text-white"
                        >
                          {isEditing ? (
                            <div className="space-y-2 relative">
                              <div className="relative">
                                <input
                                  type="text"
                                  value={editingAddressValue}
                                  onChange={(e) => setEditingAddressValue(e.target.value)}
                                  className="w-full bg-brand-bg rounded-lg border border-brand-border px-2.5 py-1.5 outline-none text-white text-xs focus:border-brand-cyan pr-8"
                                  disabled={loadingAddressAction}
                                />
                                {loadingEditingSuggestions && (
                                  <div className="absolute right-2.5 top-2.5">
                                    <Loader2 className="h-3.5 w-3.5 text-brand-cyan animate-spin" />
                                  </div>
                                )}
                              </div>

                              {/* Editing Address Suggestions list */}
                              {editingAddressSuggestions.length > 0 && (
                                <div className="absolute left-0 right-0 top-9 z-50 rounded-xl border border-brand-border bg-brand-bg overflow-hidden shadow-2xl max-h-48 overflow-y-auto divide-y divide-brand-border/40 animate-fade-in">
                                  {editingAddressSuggestions.map((suggestion) => (
                                    <button
                                      key={suggestion.place_id}
                                      type="button"
                                      onClick={() => {
                                        setEditingAddressValue(suggestion.display_name);
                                        setEditingAddressSuggestions([]);
                                      }}
                                      className="w-full text-left text-[11px] p-2.5 text-brand-muted hover:bg-brand-card hover:text-white transition-all truncate block"
                                      title={suggestion.display_name}
                                    >
                                      📍 {suggestion.display_name}
                                    </button>
                                  ))}
                                </div>
                              )}
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingAddressIndex(null);
                                    setEditingAddressValue('');
                                  }}
                                  className="px-2.5 py-1 rounded-lg border border-brand-border hover:border-brand-cyan text-brand-muted hover:text-white transition-all text-[10px]"
                                  disabled={loadingAddressAction}
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateAddress(idx)}
                                  disabled={loadingAddressAction || !editingAddressValue.trim()}
                                  className="px-2.5 py-1 rounded-lg bg-brand-cyan text-brand-bg hover:bg-brand-cyan/90 font-bold transition-all text-[10px] flex items-center gap-1"
                                >
                                  <Check size={10} />
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <MapPin size={13} className="text-brand-cyan shrink-0" />
                                <span className="truncate" title={addr}>{addr}</span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingAddressIndex(idx);
                                    setEditingAddressValue(addr);
                                  }}
                                  className="h-6 w-6 rounded-lg border border-brand-border/40 hover:border-brand-cyan text-brand-muted hover:text-brand-cyan flex items-center justify-center transition-all cursor-pointer"
                                  title="Edit Address"
                                  disabled={loadingAddressAction}
                                >
                                  <Edit3 size={11} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAddress(idx)}
                                  className="h-6 w-6 rounded-lg border border-brand-border/40 hover:border-brand-red text-brand-muted hover:text-brand-red flex items-center justify-center transition-all cursor-pointer"
                                  title="Delete Address"
                                  disabled={loadingAddressAction}
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-brand-muted italic leading-relaxed">No addresses saved yet. Use the field above to save your addresses!</p>
                )}
              </div>

              {/* Past Orders History List */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs uppercase tracking-wider font-bold text-brand-muted font-mono flex items-center gap-1.5">
                  <History size={14} className="text-brand-cyan" />
                  Past Order History ({userOrders.length})
                </h4>

                {loadingProfile ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-6 w-6 text-brand-cyan animate-spin" />
                  </div>
                ) : userOrders.length > 0 ? (
                  <div className="space-y-3.5">
                    {userOrders.map((orderItem) => (
                      <div 
                        key={orderItem._id}
                        className="rounded-xl border border-brand-border bg-brand-bg/40 p-4 space-y-3 text-xs hover:border-brand-cyan/20 transition-all flex flex-col justify-between"
                      >
                        {/* Order Header details */}
                        <div className="flex justify-between items-start border-b border-brand-border/40 pb-2">
                          <div>
                            <strong className="text-white block font-black">{orderItem.restaurantName}</strong>
                            <span className="text-[10px] text-brand-muted font-mono block mt-0.5">
                              ID: {orderItem.externalDeliveryId}
                            </span>
                          </div>
                          
                          {/* Status Badge */}
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider font-mono ${
                            orderItem.deliveryStatus === 'delivered' 
                              ? 'border-brand-green/30 bg-brand-green/5 text-brand-green' 
                              : orderItem.deliveryStatus === 'cancelled' || orderItem.deliveryStatus === 'failed'
                                ? 'border-brand-red/30 bg-brand-red/5 text-brand-red'
                                : 'border-brand-cyan/30 bg-brand-cyan/5 text-brand-cyan animate-pulse'
                          }`}>
                            {orderItem.deliveryStatus}
                          </span>
                        </div>

                        {/* Order info details */}
                        <div className="space-y-1 text-brand-muted text-[11px]">
                          <p className="truncate">🛒 {orderItem.productName}</p>
                          <div className="flex justify-between items-baseline pt-1">
                            <span>Total Paid:</span>
                            <span className="font-black text-white text-xs">
                              ${(orderItem.subtotal + orderItem.tax + orderItem.platformFee + (orderItem.deliveryFee / 100)).toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Order Link redirection */}
                        <a
                          href={`/orders/${orderItem._id}`}
                          className="w-full text-center py-2 rounded-lg bg-brand-card border border-brand-border hover:border-brand-cyan hover:text-brand-cyan text-[10px] font-extrabold uppercase tracking-wide transition-all"
                        >
                          Open Live Tracker
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-brand-muted italic leading-relaxed">No orders placed yet. Add items and place your first order!</p>
                )}
              </div>

            </div>

            {/* Logout Footer */}
            <div className="p-5 border-t border-brand-border bg-brand-bg/50 shrink-0">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl border border-brand-red/30 bg-brand-red/5 hover:bg-brand-red/10 text-brand-red text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                <LogOut size={13} />
                Sign Out / Logout
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
