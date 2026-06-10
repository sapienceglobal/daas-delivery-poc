'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { 
  PackageCheck, 
  MapPin, 
  Phone, 
  Calendar, 
  Truck, 
  Map, 
  Clock, 
  CheckCircle2, 
  RefreshCw, 
  AlertTriangle,
  Play,
  Check,
  Building,
  CreditCard,
  Smartphone,
  Coins,
  Loader2
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

// Mappings of mock coordinates for San Francisco addresses
const getRestaurantCoords = (name) => {
  const norm = (name || '').toLowerCase();
  if (norm.includes('burger')) return [37.7915, -122.3970];
  if (norm.includes('wasabi') || norm.includes('zen')) return [37.7924, -122.4018];
  if (norm.includes('pizza')) return [37.7912, -122.4022];
  if (norm.includes('taco') || norm.includes('fiesta')) return [37.7905, -122.4048];
  if (norm.includes('taj') || norm.includes('mahal')) return [37.7892, -122.4082];
  return [37.7915, -122.3970]; // Default Burger Palace
};

const getCustomerCoords = (address) => {
  const norm = (address || '').toLowerCase();
  if (norm.includes('oak st')) return [37.7760, -122.4285];
  if (norm.includes('geary')) return [37.7878, -122.4075];
  if (norm.includes('valencia')) return [37.7562, -122.4215];
  if (norm.includes('lombard')) return [37.8021, -122.4189];
  return [37.7749, -122.4194]; // Default center
};

export default function OrderTrackingPage() {
  const params = useParams();
  const orderId = params.id;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Stripe Payment Confirmation States
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
  const [paymentSuccessMessage, setPaymentSuccessMessage] = useState(null);
  const [confirmingError, setConfirmingError] = useState(null);

  // Rating Feedback States
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingSuccess, setRatingSuccess] = useState(false);
  const [ratingError, setRatingError] = useState(null);

  const handleSubmitRating = async (e) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      alert("Please select a rating between 1 and 5 stars.");
      return;
    }
    setSubmittingRating(true);
    setRatingError(null);

    const storedToken = localStorage.getItem('marketplace_token');
    const headers = { 'Content-Type': 'application/json' };
    if (storedToken) {
      headers['Authorization'] = `Bearer ${storedToken}`;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/rate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ rating, review: reviewText })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRatingSuccess(true);
        setOrder(data.order);
      } else {
        throw new Error(data.message || 'Failed to submit rating.');
      }
    } catch (err) {
      console.error(err);
      setRatingError(err.message || 'Connection failure to server.');
    } finally {
      setSubmittingRating(false);
    }
  };

  // Leaflet Integration State
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const mapRef = useRef(null);
  const scooterMarkerRef = useRef(null);

  const statusSteps = [
    { key: 'pending', label: 'Order Confirmed', desc: 'Preparing your meal' },
    { key: 'processing', label: 'Dispatching Courier', desc: 'Assigning nearest delivery courier' },
    { key: 'driver_assigned', label: 'Courier Heading to Restaurant', desc: 'Courier en route to store' },
    { key: 'picked_up', label: 'On The Way', desc: 'Courier en route to your address' },
    { key: 'delivered', label: 'Delivered', desc: 'Order hand-off complete' }
  ];

  const getStatusIndex = (status) => {
    return statusSteps.findIndex(step => step.key === status);
  };

  const fetchOrderDetails = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}`);
      if (!res.ok) throw new Error('Order details not found or backend offline.');
      const data = await res.json();
      setOrder(data.order);
    } catch (err) {
      console.error('Error fetching order:', err);
      setError(err.message);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  // Detect Stripe redirect params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('payment') === 'success') {
        const confirmPayment = async () => {
          setIsConfirmingPayment(true);
          setConfirmingError(null);
          try {
            console.log('Verifying Stripe payment checkout session for order:', orderId);
            const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/confirm-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (res.ok && data.success) {
              setPaymentSuccessMessage('Stripe transaction captured! Dispatching priority courier...');
              setOrder(data.order);
              
              setTimeout(() => {
                setPaymentSuccessMessage(null);
                setIsConfirmingPayment(false);
                window.history.replaceState({}, document.title, window.location.pathname);
              }, 2500);
            } else {
              throw new Error(data.message || 'Verification rejected by billing node.');
            }
          } catch (err) {
            console.error('Confirming payment failed:', err);
            setConfirmingError(err.message || 'Payment confirmation failed.');
          }
        };
        confirmPayment();
      }
    }
  }, [orderId]);

  // Poll for updates
  useEffect(() => {
    fetchOrderDetails(true);

    const interval = setInterval(() => {
      fetchOrderDetails(false);
    }, 4000);

    return () => clearInterval(interval);
  }, [orderId]);

  // 1. Dynamic Injection of Leaflet Script & CSS Stylesheet
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    if (!document.getElementById('leaflet-js')) {
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => setLeafletLoaded(true);
      document.head.appendChild(script);
    } else {
      if (window.L) setLeafletLoaded(true);
    }
  }, []);

  // 2. Leaflet Map Initialization and Route Construction
  useEffect(() => {
    if (!leafletLoaded || !order || !window.L) return;

    const L = window.L;
    const mapContainerId = 'leaflet-tracker-map';

    const restaurantCoords = getRestaurantCoords(order.restaurantName);
    const customerCoords = getCustomerCoords(order.address);
    const midpointCoords = [restaurantCoords[0], customerCoords[1]]; // L-shaped turn

    if (!mapRef.current) {
      console.log('[Leaflet Map] Initializing interactive map...');
      
      const map = L.map(mapContainerId, {
        zoomControl: false,
        attributionControl: false
      }).setView(restaurantCoords, 13);

      // CartoDB Dark Matter tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
      }).addTo(map);

      // Custom div icons using Tailwind class markers
      const restaurantIcon = L.divIcon({
        className: 'custom-map-icon',
        html: `<div class="h-8 w-8 rounded-full border-2 border-brand-cyan bg-brand-bg flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(20,184,166,0.5)]">R</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const customerIcon = L.divIcon({
        className: 'custom-map-icon',
        html: `<div class="h-8 w-8 rounded-full border-2 border-brand-green bg-brand-bg flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]">H</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      // Bind markers
      L.marker(restaurantCoords, { icon: restaurantIcon }).addTo(map);
      L.marker(customerCoords, { icon: customerIcon }).addTo(map);

      // Draw L-shaped path (dotted road)
      L.polyline([restaurantCoords, midpointCoords, customerCoords], {
        color: '#14b8a6',
        weight: 4,
        opacity: 0.5,
        dashArray: '6, 10'
      }).addTo(map);

      // Fit map view
      map.fitBounds(L.latLngBounds([restaurantCoords, customerCoords]), {
        padding: [40, 40]
      });

      mapRef.current = map;
    }

    const mapInstance = mapRef.current;

    // Calculate scooter progress coordinate based on status index
    let statusT = 0;
    const status = order.deliveryStatus;
    if (status === 'pending' || status === 'processing' || status === 'quote_created') {
      statusT = 0;
    } else if (status === 'driver_assigned') {
      statusT = 0.15;
    } else if (status === 'picked_up') {
      statusT = 0.55;
    } else if (status === 'delivered') {
      statusT = 1.0;
    } else {
      statusT = 0.55; // stopped
    }

    let scooterCoords;
    if (order.dasherLat && order.dasherLng) {
      scooterCoords = [order.dasherLat, order.dasherLng];
    } else {
      if (statusT <= 0.5) {
        const segmentT = statusT / 0.5;
        scooterCoords = [
          restaurantCoords[0] + (midpointCoords[0] - restaurantCoords[0]) * segmentT,
          restaurantCoords[1] + (midpointCoords[1] - restaurantCoords[1]) * segmentT
        ];
      } else {
        const segmentT = (statusT - 0.5) / 0.5;
        scooterCoords = [
          midpointCoords[0] + (customerCoords[0] - midpointCoords[0]) * segmentT,
          midpointCoords[1] + (customerCoords[1] - midpointCoords[1]) * segmentT
        ];
      }
    }

    const isError = status === 'cancelled' || status === 'failed';
    const scooterHtml = isError
      ? `<div class="h-8 w-8 rounded-full bg-brand-red flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]">✕</div>`
      : `<div class="h-8 w-8 rounded-full bg-brand-orange border-2 border-white flex items-center justify-center text-sm shadow-[0_0_15px_rgba(249,115,22,0.6)]">🛵</div>`;

    const scooterIcon = L.divIcon({
      className: 'custom-map-icon',
      html: scooterHtml,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    if (!scooterMarkerRef.current) {
      scooterMarkerRef.current = L.marker(scooterCoords, { icon: scooterIcon }).addTo(mapInstance);
    } else {
      scooterMarkerRef.current.setLatLng(scooterCoords);
      scooterMarkerRef.current.setIcon(scooterIcon);
    }

    mapInstance.panTo(scooterCoords);

  }, [leafletLoaded, order]);

  // Tearing down map instance on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        console.log('[Leaflet Map] Tearing down map instance.');
        mapRef.current.remove();
        mapRef.current = null;
        scooterMarkerRef.current = null;
      }
    };
  }, []);

  const handleSimulateStatus = async (status) => {
    setIsSimulating(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nextStatus: status })
      });
      if (!res.ok) throw new Error('Simulation failed.');
      const data = await res.json();
      setOrder(data.order);
    } catch (err) {
      console.error(err);
      alert('Error triggering simulation status update');
    } finally {
      setIsSimulating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 animate-fade-in">
        <RefreshCw className="h-10 w-10 text-brand-cyan animate-spin" />
        <p className="text-brand-muted text-sm font-mono">Loading live tracking dashboard...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-md text-center py-16 animate-fade-in">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-red/10 text-brand-red mb-4 border border-brand-red/30">
          <AlertTriangle size={24} />
        </div>
        <h3 className="text-xl font-bold text-white">Tracking Load Failed</h3>
        <p className="mt-2 text-xs text-brand-muted leading-relaxed">
          {error || `The requested order details could not be found. Please ensure the Express backend is running on ${API_BASE_URL}.`}
        </p>
        <a 
          href="/" 
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-cyan/10 hover:bg-brand-cyan/20 border border-brand-cyan/30 text-brand-cyan px-5 py-2.5 text-xs font-semibold transition-all"
        >
          Return to Marketplace
        </a>
      </div>
    );
  }

  const currentStatusIndex = getStatusIndex(order.deliveryStatus);
  const isCancelled = order.deliveryStatus === 'cancelled';
  const isFailed = order.deliveryStatus === 'failed';

  return (
    <div className="mx-auto max-w-6xl animate-fade-in flex flex-col gap-8">
      
      {/* Stripe Payment Confirmation Overlay */}
      {isConfirmingPayment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-bg/95 backdrop-blur-md animate-fade-in text-brand-text">
          <div className="w-full max-w-sm rounded-3xl bg-brand-card border border-brand-border p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
            
            <div className="pointer-events-none absolute inset-0 -z-10 h-32 w-32 rounded-full bg-brand-cyan/10 opacity-30 blur-[40px] mx-auto left-0 right-0 top-1/2 -translate-y-1/2" />
            
            {confirmingError ? (
              <>
                <div className="h-16 w-16 rounded-full border border-brand-red/30 bg-brand-red/10 flex items-center justify-center text-brand-red mx-auto">
                  <AlertTriangle size={30} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Verification Failed</h3>
                  <p className="text-xs text-brand-muted mt-2 leading-relaxed">{confirmingError}</p>
                </div>
                <button
                  onClick={() => setIsConfirmingPayment(false)}
                  className="w-full py-3 rounded-xl bg-brand-card hover:bg-brand-bg border border-brand-border text-xs font-bold text-white transition-all cursor-pointer"
                >
                  Close & View Details
                </button>
              </>
            ) : paymentSuccessMessage ? (
              <>
                <div className="h-16 w-16 rounded-full border border-brand-green/30 bg-brand-green/10 flex items-center justify-center text-brand-green mx-auto shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                  <CheckCircle2 size={30} className="animate-bounce" />
                </div>
                <div className="space-y-2 animate-fade-in">
                  <h3 className="text-lg font-black text-brand-green font-mono">Payment Captured!</h3>
                  <p className="text-xs text-brand-muted leading-relaxed">{paymentSuccessMessage}</p>
                </div>
              </>
            ) : (
              <>
                <div className="relative flex items-center justify-center mx-auto h-16 w-16">
                  <Loader2 className="h-12 w-12 text-brand-cyan animate-spin" />
                  <CreditCard className="absolute h-5 w-5 text-brand-cyan" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-black text-white">Confirming Transaction</h3>
                  <p className="text-xs text-brand-muted leading-relaxed font-mono">
                    Securing payment checkout session with Stripe Gateway...
                  </p>
                  <div className="w-full bg-brand-border h-[2px] rounded-full overflow-hidden mt-4">
                    <div className="h-full bg-gradient-to-r from-brand-cyan to-brand-green animate-pulse w-[80%]" />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-border pb-6">
        <div>
          <span className="text-xs uppercase font-mono tracking-widest text-brand-muted block">Marketplace Fulfillment Tracking</span>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <h2 className="text-2xl md:text-3xl font-black text-white">{order.externalDeliveryId}</h2>
            <span className="rounded-full bg-brand-cyan/10 border border-brand-cyan/30 px-2.5 py-0.5 text-[10px] font-bold text-brand-cyan uppercase tracking-wider font-mono">
              Priority Delivery
            </span>
            {order.scheduledTime && (
              <span className="rounded-full bg-brand-yellow/10 border border-brand-yellow/30 px-2.5 py-0.5 text-[10px] font-bold text-brand-yellow uppercase tracking-wider font-mono flex items-center gap-1.5 shadow-[0_0_10px_rgba(234,179,8,0.1)]">
                🕒 Scheduled: {new Date(order.scheduledTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => fetchOrderDetails(true)}
            className="flex items-center justify-center h-10 w-10 rounded-xl border border-brand-border bg-brand-bg/50 hover:bg-brand-card text-brand-muted hover:text-white transition-all"
            title="Force refresh status"
          >
            <RefreshCw size={16} />
          </button>
          <a
            href="/"
            className="rounded-xl bg-brand-card border border-brand-border hover:bg-brand-bg/30 text-xs font-bold px-4 py-2.5 transition-all text-white"
          >
            Marketplace Terminal
          </a>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12 items-start">
        
        {/* Left Side */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Stepper Card */}
          <div className="glass-panel rounded-2xl p-6 md:p-8 flex flex-col gap-8 relative overflow-hidden">
            <h3 className="text-sm uppercase tracking-wider font-bold font-mono text-brand-muted flex items-center gap-2">
              <Clock size={16} className="text-brand-cyan" />
              Meal Delivery Status
            </h3>

            {isCancelled || isFailed ? (
              <div className="rounded-xl border border-brand-red/30 bg-brand-red/10 p-5 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-brand-red shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white text-sm">Delivery Aborted</h4>
                  <p className="mt-1 text-xs text-brand-muted leading-relaxed">
                    This order was cancelled or failed. Status: <span className="font-mono text-brand-red bg-brand-red/5 px-1 rounded">{order.deliveryStatus}</span>. 
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-2 mt-4">
                <div className="absolute left-6 right-6 top-[22px] hidden md:block h-1 bg-brand-border -z-10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-brand-cyan to-brand-green transition-all duration-1000 ease-in-out"
                    style={{ 
                      width: `${currentStatusIndex >= 0 ? (currentStatusIndex / (statusSteps.length - 1)) * 100 : 0}%` 
                    }}
                  />
                </div>

                {statusSteps.map((step, idx) => {
                  const isActive = idx === currentStatusIndex;
                  const isCompleted = idx < currentStatusIndex;

                  return (
                    <div 
                      key={step.key} 
                      className={`flex md:flex-col items-center gap-4 md:gap-2 text-left md:text-center md:flex-1 relative z-10 transition-all ${
                        isActive ? 'opacity-100' : isCompleted ? 'opacity-85' : 'opacity-40'
                      }`}
                    >
                      <div 
                        className={`h-11 w-11 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all ${
                          isActive 
                            ? 'bg-brand-bg text-brand-cyan border-brand-cyan animate-pulse shadow-[0_0_15px_rgba(20,184,166,0.3)]' 
                            : isCompleted 
                              ? 'bg-brand-green text-brand-bg border-brand-green shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                              : 'bg-brand-card text-brand-muted border-brand-border'
                        }`}
                      >
                        {isCompleted ? <Check size={16} strokeWidth={3} /> : <span>{idx + 1}</span>}
                      </div>

                      <div>
                        <h4 className={`text-xs font-black ${
                          isActive ? 'text-brand-cyan' : isCompleted ? 'text-brand-green' : 'text-brand-muted'
                        }`}>
                          {step.label}
                        </h4>
                        <p className="text-[10px] text-brand-muted hidden md:block max-w-[120px] mx-auto mt-0.5 leading-tight">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Rating Feedback Card (rendered only when delivered) */}
          {order.deliveryStatus === 'delivered' && (
            <div className="glass-panel rounded-2xl p-6 md:p-8 flex flex-col gap-5 relative overflow-hidden animate-fade-in">
              <div className="pointer-events-none absolute inset-0 -z-10 h-32 w-32 rounded-full bg-brand-green/10 opacity-30 blur-[40px] mx-auto left-0 right-0 top-1/2 -translate-y-1/2" />
              
              <h3 className="text-sm uppercase tracking-wider font-bold font-mono text-brand-muted flex items-center gap-2">
                <CheckCircle2 size={16} className="text-brand-green animate-pulse" />
                Rate your Experience
              </h3>

              {order.rating ? (
                <div className="space-y-2 py-2 text-center md:text-left text-xs">
                  <p className="text-sm font-bold text-white">You rated this order:</p>
                  <div className="flex items-center justify-center md:justify-start gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span 
                        key={star} 
                        className={`text-lg transition-all ${
                          star <= order.rating ? 'text-brand-yellow' : 'text-brand-border'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  {order.review && (
                    <p className="text-xs text-brand-muted italic leading-relaxed mt-2 bg-brand-bg/40 border border-brand-border p-3.5 rounded-xl">
                      "{order.review}"
                    </p>
                  )}
                </div>
              ) : ratingSuccess ? (
                <div className="text-center py-4 space-y-2 text-xs">
                  <p className="text-brand-green text-sm font-black uppercase tracking-wider">Thank you for your rating!</p>
                  <p className="text-xs text-brand-muted">Your review has been saved and will help us improve.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitRating} className="space-y-4 text-xs">
                  {ratingError && (
                    <div className="p-3 rounded-xl border border-brand-red/30 bg-brand-red/10 text-[11px] text-brand-red font-semibold">
                      {ratingError}
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    <label className="font-bold text-brand-muted uppercase">Select Stars</label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="text-2xl transition-all hover:scale-110 active:scale-95 text-left focus:outline-none cursor-pointer"
                        >
                          <span className={star <= rating ? 'text-brand-yellow' : 'text-brand-border'}>
                            ★
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-brand-muted uppercase">Comments / Review</label>
                    <textarea
                      rows={2}
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="Tell us about the food and delivery..."
                      className="w-full bg-brand-bg/85 rounded-xl border border-brand-border px-3.5 py-2.5 outline-none text-white focus:border-brand-cyan text-xs resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingRating || rating === 0}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-green to-brand-cyan hover:from-brand-cyan hover:to-brand-blue text-brand-bg font-black text-xs uppercase tracking-wide transition-all shadow-lg active:scale-95 disabled:opacity-50"
                  >
                    {submittingRating ? 'Submitting...' : 'Submit Feedback'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Leaflet Interactive Scooter Map */}
          <div className="glass-panel rounded-2xl p-6 flex flex-col gap-5 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-brand-border pb-3">
              <h3 className="text-sm uppercase tracking-wider font-bold font-mono text-brand-muted flex items-center gap-2">
                <Map size={16} className="text-brand-cyan animate-bounce" />
                Live Interactive Courier Map
              </h3>
              {order.deliveryId && (
                <span className="text-[10px] font-mono text-brand-muted">
                  COURIER TRACKING ID: <span className="text-white font-semibold">{order.deliveryId}</span>
                </span>
              )}
            </div>

            {/* Leaflet Container (styled z-index 10 to fit modals) */}
            <div className="bg-brand-bg/50 border border-brand-border rounded-2xl overflow-hidden relative h-[250px] w-full z-10">
              <div id="leaflet-tracker-map" className="h-full w-full" />
            </div>

            <div className="bg-brand-bg/40 border border-brand-border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-white">Live Tracking Network Connected</p>
                <p className="text-[11px] text-brand-muted mt-1 leading-relaxed max-w-md">
                  Your order is tracked via our secure delivery partner gateway. Updates and courier coordinates are synced instantly on the map.
                </p>
              </div>
              <span className="rounded-xl border border-brand-cyan/25 bg-brand-cyan/5 text-brand-cyan text-xs px-4 py-2.5 text-center font-bold font-mono">
                ONLINE GPS SYNC
              </span>
            </div>
          </div>
          
          {/* Fulfillment log */}
          <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4">
            <h3 className="text-sm uppercase tracking-wider font-bold font-mono text-brand-muted">
              Live Fulfillment Log
            </h3>
            
            <div className="flow-root mt-2">
              <ul className="-mb-8">
                {order.statusUpdates && order.statusUpdates.map((update, idx) => {
                  const isLast = idx === order.statusUpdates.length - 1;
                  
                  return (
                    <li key={update._id || idx}>
                      <div className="relative pb-8">
                        {!isLast && (
                          <span 
                            className="absolute left-4 top-4 -ml-px h-full w-[2px] bg-brand-border" 
                            aria-hidden="true" 
                          />
                        )}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full flex items-center justify-center bg-brand-bg border border-brand-border">
                              <span className="h-2.5 w-2.5 rounded-full bg-brand-cyan" />
                            </span>
                          </div>
                          <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                                {update.status}
                              </p>
                              <p className="text-xs text-brand-muted mt-1 leading-relaxed">
                                {update.description || 'Fulfillment update recorded.'}
                              </p>
                            </div>
                            <div className="text-right text-[10px] whitespace-nowrap text-brand-muted font-mono">
                              {new Date(update.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Receipt details */}
          <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4">
            <h3 className="text-sm uppercase tracking-wider font-bold font-mono text-brand-muted border-b border-brand-border pb-3 flex items-center gap-2">
              <PackageCheck size={16} className="text-brand-cyan" />
              Receipt Details
            </h3>

            <div className="flex flex-col gap-3 text-xs">
              {order.items && order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs pb-1 border-b border-brand-border/20">
                  <span className="text-brand-muted font-bold">
                    {item.quantity}x <span className="text-white font-normal">{item.name}</span>
                  </span>
                  <span className="font-bold text-white">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}

              <div className="flex justify-between items-center text-xs mt-2 pt-2">
                <span className="text-brand-muted">Subtotal:</span>
                <span className="font-bold text-white">${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-brand-muted">Sales Tax (8.25%):</span>
                <span className="font-bold text-white">${order.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-brand-muted">Platform Fee:</span>
                <span className="font-bold text-brand-cyan">${order.platformFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-brand-muted">DoorDash Base Fee:</span>
                <span className="font-bold text-brand-green">
                  ${(order.deliveryFee / 100).toFixed(2)}
                </span>
              </div>
              
              <div className="border-t border-brand-border pt-4 mt-2 flex justify-between items-baseline">
                <span className="text-xs font-bold text-brand-muted uppercase">Grand Total:</span>
                <span className="text-lg font-black text-white">
                  ${(order.subtotal + order.tax + order.platformFee + (order.deliveryFee / 100)).toFixed(2)}
                </span>
              </div>

              <div className="mt-3 pt-3 border-t border-brand-border/40 flex items-center justify-between text-[10px] text-brand-muted">
                <span>PAYMENT METHOD</span>
                <span className="flex items-center gap-1 font-bold text-brand-cyan border border-brand-cyan/30 px-2.5 py-1 rounded-full bg-brand-cyan/5 uppercase tracking-wide font-mono">
                  {order.paymentMethod === 'Apple Pay' && <Smartphone size={10} />}
                  {order.paymentMethod === 'Credit Card' && <CreditCard size={10} />}
                  {order.paymentMethod === 'Cash on Delivery' && <Coins size={10} />}
                  {order.paymentMethod || 'Credit Card'}
                </span>
              </div>
            </div>
          </div>

          {/* Locations */}
          <div className="glass-panel rounded-2xl p-6 flex flex-col gap-5">
            <div>
              <h3 className="text-xs uppercase tracking-wider font-bold font-mono text-brand-muted flex items-center gap-2 mb-3">
                <Building size={14} className="text-brand-cyan" />
                Pickup Location ({order.restaurantName || 'Restaurant'})
              </h3>
              <p className="text-xs font-bold text-white">{order.restaurantName || 'Burger Palace'}</p>
              <p className="text-[11px] text-brand-muted mt-1 flex items-start gap-1">
                <MapPin size={12} className="text-brand-cyan shrink-0 mt-0.5" />
                {order.restaurantAddress || '100 Main St, San Francisco, CA 94105'}
              </p>
            </div>

            <div className="border-t border-brand-border pt-4">
              <h3 className="text-xs uppercase tracking-wider font-bold font-mono text-brand-muted flex items-center gap-2 mb-3">
                <MapPin size={14} className="text-brand-cyan" />
                Drop-Off Destination
              </h3>
              <p className="text-xs font-bold text-white">{order.customerName}</p>
              
              <p className="text-[11px] text-brand-muted mt-1.5 flex items-start gap-1">
                <MapPin size={12} className="text-brand-cyan shrink-0 mt-0.5" />
                {order.address}
              </p>
              <p className="text-[11px] text-brand-muted mt-1.5 flex items-start gap-1">
                <Phone size={12} className="text-brand-cyan shrink-0 mt-0.5" />
                {order.customerPhone}
              </p>

              {order.courierNotes ? (
                <div className="mt-3.5 bg-brand-bg/40 border border-brand-border/60 rounded-xl p-3 animate-fade-in">
                  <span className="text-[9px] uppercase tracking-wider font-bold font-mono text-brand-cyan block mb-1">
                    Courier Drop-off Notes
                  </span>
                  <p className="text-[11px] text-white leading-relaxed font-sans italic">
                    "{order.courierNotes}"
                  </p>
                </div>
              ) : (
                <div className="mt-3.5 bg-brand-bg/20 border border-brand-border/30 rounded-xl p-2.5 text-center">
                  <span className="text-[9px] uppercase tracking-wider font-mono text-brand-muted block">
                    No special courier instructions
                  </span>
                </div>
              )}
            </div>

            {order.pickupTime && (
              <div className="border-t border-brand-border pt-4 flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-[10px] text-brand-muted font-mono">
                  <Calendar size={12} />
                  <span>ESTIMATED FULFILLMENT TIMES</span>
                </div>
                <div className="text-[11px] flex justify-between">
                  <span className="text-brand-muted">Pickup Target:</span>
                  <span className="text-white font-mono">{new Date(order.pickupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                {order.deliveryTime && (
                  <div className="text-[11px] flex justify-between">
                    <span className="text-brand-muted">Dropoff Target:</span>
                    <span className="text-white font-mono">{new Date(order.deliveryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Webhook Status Simulator Dashboard */}
      <div className="glass-panel rounded-2xl p-6 border-brand-yellow/30 bg-brand-yellow/5 mt-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-border pb-4 mb-4">
          <div>
            <h3 className="text-sm font-black text-brand-yellow uppercase tracking-wider flex items-center gap-2">
              <Truck className="h-4 w-4 animate-bounce" />
              Dev Webhook Status Simulator
            </h3>
            <p className="text-[11px] text-brand-muted mt-1">
              Advance the delivery lifecycle manually to update the live animated scooter mapping and timeline logs in real time.
            </p>
          </div>
          {isSimulating && (
            <span className="text-xs text-brand-yellow font-mono flex items-center gap-1.5 animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-yellow shrink-0" />
              Updating status...
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleSimulateStatus('driver_assigned')}
            disabled={isSimulating || currentStatusIndex >= 2}
            className="flex items-center gap-1.5 rounded-xl border border-brand-yellow/40 hover:bg-brand-yellow/10 disabled:opacity-30 disabled:hover:bg-transparent text-brand-yellow text-xs font-semibold px-4 py-3 transition-all cursor-pointer"
          >
            <Play className="h-3.5 w-3.5 shrink-0" />
            Stage 1: Driver Assigned
          </button>
          
          <button
            onClick={() => handleSimulateStatus('picked_up')}
            disabled={isSimulating || currentStatusIndex < 2 || currentStatusIndex >= 3}
            className="flex items-center gap-1.5 rounded-xl border border-brand-yellow/40 hover:bg-brand-yellow/10 disabled:opacity-30 disabled:hover:bg-transparent text-brand-yellow text-xs font-semibold px-4 py-3 transition-all cursor-pointer"
          >
            <Play className="h-3.5 w-3.5 shrink-0" />
            Stage 2: Food Picked Up
          </button>

          <button
            onClick={() => handleSimulateStatus('delivered')}
            disabled={isSimulating || currentStatusIndex < 3 || currentStatusIndex >= 4}
            className="flex items-center gap-1.5 rounded-xl border border-brand-yellow/40 hover:bg-brand-yellow/10 disabled:opacity-30 disabled:hover:bg-transparent text-brand-yellow text-xs font-semibold px-4 py-3 transition-all cursor-pointer"
          >
            <Play className="h-3.5 w-3.5 shrink-0" />
            Stage 3: Delivered
          </button>

          <div className="h-8 w-[1px] bg-brand-border self-center" />

          <button
            onClick={() => handleSimulateStatus('cancelled')}
            disabled={isSimulating || currentStatusIndex >= 4}
            className="rounded-xl border border-brand-red/40 hover:bg-brand-red/10 disabled:opacity-30 disabled:hover:bg-transparent text-brand-red text-xs font-semibold px-4 py-3 transition-all cursor-pointer"
          >
            Abort Delivery
          </button>
        </div>
      </div>
    </div>
  );
}
