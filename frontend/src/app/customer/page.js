'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { MapPin, Clock, Star, Filter, Flame, TrendingUp, Sparkles, ChevronRight, Heart, Navigation, Map } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { restaurantAPI, authAPI } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';
import { SearchInput, Badge, GlassCard, RestaurantSkeleton, showToast } from '@/components/ui';
import AddressModal from '@/components/shared/AddressModal';
import LassiLoungeLanding from '@/components/branded/lassi-lounge/LassiLoungeLanding';

export default function HomePage() {
  const isSingleRestaurant = process.env.NEXT_PUBLIC_SINGLE_RESTAURANT_MODE === 'true';

  if (isSingleRestaurant) {
    return <LassiLoungeLanding />;
  }

  const router = useRouter();
  const { isMerchant, isAdmin, user, updateUser, isAuthenticated } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [cuisines, setCuisines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    // Check if user has a default saved address on mount
    if (user && user.savedAddresses?.length > 0 && !lat) {
      const defaultAddr = user.savedAddresses.find(a => a.isDefault) || user.savedAddresses[0];
      if (defaultAddr.lat && defaultAddr.lng) {
        setLocationQuery(defaultAddr.label || defaultAddr.address);
        setLat(defaultAddr.lat);
        setLng(defaultAddr.lng);
      }
    }
  }, [user]);

  useEffect(() => {
    if (isMerchant) {
      router.push('/merchant');
    } else if (isAdmin) {
      router.push('/admin');
    }
  }, [isMerchant, isAdmin, router]);

  const loadRestaurants = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCuisine) params.set('cuisine', selectedCuisine);
      if (sortBy) params.set('sort', sortBy);

      let data;
      if (search.trim()) {
        data = await restaurantAPI.search(search);
      } else if (lat && lng) {
        data = await restaurantAPI.getNearby(lat, lng, 15);
      } else {
        data = await restaurantAPI.getAll(params.toString());
      }
      setRestaurants(data.data || []);
    } catch {
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCuisine, sortBy, lat, lng]);

  const geocodeLocation = async (query) => {
    if (!query.trim()) {
      setLat(null);
      setLng(null);
      return;
    }
    try {
      setIsLocating(true);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=us&limit=1`, {
        headers: { 'User-Agent': 'SapienceGlobalPoCDeliveryApp/1.0 (adars.gemini.antigravity)' }
      });
      const data = await res.json();
      if (data && data.length > 0) {
        setLat(parseFloat(data[0].lat));
        setLng(parseFloat(data[0].lon));
      }
    } catch (err) {
      console.error('Geocoding error:', err);
    } finally {
      setIsLocating(false);
    }
  };

  const handleLocationChange = (e) => {
    const val = e.target.value;
    setLocationQuery(val);
    if (searchTimeout) clearTimeout(searchTimeout);
    setSearchTimeout(setTimeout(() => geocodeLocation(val), 800));
  };

  const autoDetectLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser', 'error');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setLocationQuery('Current Location');
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
        showToast('Unable to retrieve your location', 'error');
      }
    );
  };

  useEffect(() => {
    const timer = setTimeout(loadRestaurants, search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [loadRestaurants, search, lat, lng]);

  useEffect(() => {
    restaurantAPI.getCuisines().then(d => setCuisines(d.data || [])).catch(() => {});
  }, []);

  return (
    <>
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl glass-panel p-8 md:p-12">
        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-brand-green/10 blur-[80px]" />
        <div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-brand-cyan/10 blur-[60px]" />

        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <Badge color="green" dot>Live Ordering</Badge>
            <Badge color="cyan">DoorDash Delivery</Badge>
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-brand-text leading-tight">
            {t('home.hero_title').split('?')[0]}? <span className="bg-gradient-to-r from-brand-green via-brand-cyan to-brand-blue bg-clip-text text-transparent">{t('home.hero_title').split('?')[1]}</span>
          </h1>
          <p className="mt-3 text-base md:text-lg text-brand-muted max-w-xl">
            {t('home.hero_subtitle')}
          </p>

          <div className="mt-6 max-w-lg space-y-3">
            <button
              onClick={() => setIsAddressModalOpen(true)}
              className="w-full relative flex items-center bg-brand-card/60 backdrop-blur-md rounded-2xl border border-brand-border p-1 text-left hover:border-brand-cyan/50 transition-colors group"
            >
              <MapPin className="absolute left-4 h-5 w-5 text-brand-cyan group-hover:scale-110 transition-transform" />
              <div className="w-full bg-transparent border-none pl-12 pr-12 py-2 text-sm overflow-hidden">
                <p className="text-[10px] font-black text-brand-muted uppercase tracking-widest mb-0.5">Deliver to</p>
                <p className="text-brand-text font-bold truncate">{locationQuery || 'Select delivery address...'}</p>
              </div>
              <div className="absolute right-3 p-1.5 bg-brand-bg rounded-xl border border-brand-border text-brand-cyan group-hover:bg-brand-cyan/10 transition-colors">
                <ChevronRight className="h-4 w-4" />
              </div>
            </button>

            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={t('home.search_placeholder')}
              className="text-base"
            />
          </div>
        </div>
      </section>

      {/* Cuisine Tags */}
      {cuisines.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-4">
            <Filter className="h-4 w-4 text-brand-cyan" />
            <h2 className="text-sm font-bold text-brand-text uppercase tracking-wider">Filter by Cuisine</h2>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCuisine('')}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all border
                ${!selectedCuisine
                  ? 'bg-gradient-to-r from-brand-green to-brand-cyan text-brand-bg border-transparent shadow-lg'
                  : 'bg-brand-card/60 text-brand-muted border-brand-border hover:border-brand-cyan/30 hover:text-brand-text'
                }`}
            >
              All
            </button>
            {cuisines.map(cuisine => (
              <button
                key={cuisine}
                onClick={() => setSelectedCuisine(selectedCuisine === cuisine ? '' : cuisine)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all border capitalize
                  ${selectedCuisine === cuisine
                    ? 'bg-gradient-to-r from-brand-green to-brand-cyan text-brand-bg border-transparent shadow-lg'
                    : 'bg-brand-card/60 text-brand-muted border-brand-border hover:border-brand-cyan/30 hover:text-brand-text'
                  }`}
              >
                {cuisine}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Sort Options */}
      <section className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider mr-2">Sort:</span>
        {[
          { label: 'Featured', value: '', icon: Sparkles },
          { label: 'Top Rated', value: 'rating', icon: Star },
          { label: 'Newest', value: 'newest', icon: TrendingUp },
          { label: 'Name', value: 'name', icon: null },
        ].map(opt => (
          <button
            key={opt.value}
            onClick={() => setSortBy(opt.value)}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors border
              ${sortBy === opt.value
                ? 'bg-brand-cyan/10 text-brand-cyan border-brand-cyan/30'
                : 'text-brand-muted border-transparent hover:text-brand-text hover:bg-white/5'
              }`}
          >
            {opt.icon && <opt.icon className="h-3 w-3" />}
            {opt.label}
          </button>
        ))}
      </section>

      {/* Restaurant Grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-brand-text flex items-center gap-2">
            <Flame className="h-5 w-5 text-brand-yellow" />
            {search ? `Results for "${search}"` : selectedCuisine ? `${selectedCuisine} Restaurants` : 'All Restaurants'}
          </h2>
          {!loading && <span className="text-xs text-brand-muted">{restaurants.length} found</span>}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <RestaurantSkeleton key={i} />)}
          </div>
        ) : restaurants.length === 0 ? (
          <GlassCard className="text-center py-16 max-w-2xl mx-auto">
            {lat && lng ? (
              <>
                <MapPin className="h-12 w-12 text-brand-cyan/50 mx-auto mb-4" />
                <h3 className="text-xl font-black text-brand-text mb-2">Outside Our Service Range</h3>
                <p className="text-sm text-brand-muted max-w-md mx-auto">
                  We don't have any partner restaurants serving this address yet. Please try switching to one of the test areas like "Oak St, San Francisco" or search for a different location.
                </p>
              </>
            ) : (
              <>
                <p className="text-lg font-bold text-brand-text mb-2">No restaurants found</p>
                <p className="text-sm text-brand-muted">Try adjusting your search or filters</p>
              </>
            )}
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {restaurants.map(restaurant => (
              <RestaurantCard 
                key={restaurant._id} 
                restaurant={restaurant} 
                user={user} 
                isAuthenticated={isAuthenticated}
                updateUser={updateUser}
              />
            ))}
          </div>
        )}
      </section>
    </div>
    
      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onSelect={(loc) => {
          setLocationQuery(loc.address);
          setLat(loc.lat);
          setLng(loc.lng);
          setIsAddressModalOpen(false);
        }}
      />
    </>
  );
}

function RestaurantCard({ restaurant, user, isAuthenticated, updateUser }) {
  const defaultBanner = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80';
  const isFavorite = user?.favoriteRestaurants?.includes(restaurant._id);
  const isActive = restaurant.isActive !== false;

  const handleCardClick = (e) => {
    if (!isActive) {
      e.preventDefault();
      showToast('This restaurant is not accepting orders right now', 'error');
    }
  };

  return (
    <Link href={isActive ? `/customer/restaurant/${restaurant._id}` : '#'} onClick={handleCardClick}>
      <GlassCard hover={isActive} padding={false} className={`overflow-hidden group ${!isActive ? 'opacity-50 select-none' : ''}`}>
        {/* Banner */}
        <div className="relative h-44 overflow-hidden">
          <img
            src={restaurant.banner || defaultBanner}
            alt={restaurant.name}
            className={`h-full w-full object-cover transition-transform duration-500 ${isActive ? 'group-hover:scale-105' : ''}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-bg/80 via-transparent to-transparent" />

          {/* Rating badge */}
          {isActive && (
            <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-brand-bg/80 backdrop-blur-sm px-2.5 py-1 border border-brand-border">
              <Star className="h-3 w-3 fill-brand-yellow text-brand-yellow" />
              <span className="text-xs font-bold text-brand-text">{restaurant.rating?.toFixed(1) || '0.0'}</span>
              <span className="text-[10px] text-brand-muted">({restaurant.reviewCount || 0})</span>
            </div>
          )}

          {/* Offline/Inactive Overlay Badge */}
          {!isActive && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="bg-brand-red/90 text-brand-text text-xs font-black px-3 py-1.5 rounded-xl uppercase tracking-wider border border-brand-red/35 shadow-lg">
                Not Accepting Orders
              </span>
            </div>
          )}

          {/* Featured badge */}
          {restaurant.isFeatured && isActive && (
            <div className="absolute top-3 left-3">
              <Badge color="green" dot>Featured</Badge>
            </div>
          )}

          {/* Favorite Button */}
          {isAuthenticated && isActive && (
            <button
              onClick={async (e) => {
                e.preventDefault(); // Prevent Link navigation
                try {
                  const res = await authAPI.toggleFavoriteRestaurant(restaurant._id);
                  updateUser({ favoriteRestaurants: res.data });
                  showToast(res.message, 'success');
                } catch (err) {
                  showToast('Failed to update favorites', 'error');
                }
              }}
              className="absolute bottom-3 right-3 p-2 bg-brand-bg/80 backdrop-blur-sm rounded-full border border-brand-border hover:bg-brand-card transition-colors z-10"
            >
              <Heart 
                className={`h-4 w-4 ${isFavorite ? 'fill-brand-red text-brand-red' : 'text-brand-muted hover:text-brand-red'}`} 
              />
            </button>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className={`text-base font-bold transition-colors truncate ${isActive ? 'text-brand-text group-hover:text-brand-cyan' : 'text-brand-muted'}`}>
            {restaurant.name}
          </h3>

          <p className="text-xs text-brand-muted mt-1 truncate">
            {restaurant.cuisine || restaurant.cuisineTags?.join(', ')}
          </p>

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-3 text-xs text-brand-muted">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-brand-cyan" />
                {restaurant.deliveryTime || '20-30 min'}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-brand-green" />
                {restaurant.distance || '—'}
              </span>
            </div>

            {restaurant.deliveryFee === 0 && isActive ? (
              <Badge color="green">Free Delivery</Badge>
            ) : restaurant.deliveryFee && isActive ? (
              <span className="text-xs text-brand-muted">${restaurant.deliveryFee.toFixed(2)} delivery</span>
            ) : null}
          </div>
        </div>
      </GlassCard>
    </Link>
  );
}
