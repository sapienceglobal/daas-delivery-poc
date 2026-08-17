import { useState, useEffect, useRef } from 'react';
import { X, Search, MapPin, Navigation, History, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { showToast } from '@/components/ui';
import dynamic from 'next/dynamic';

const MapLocationPicker = dynamic(() => import('@/components/shared/MapLocationPicker'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] bg-brand-bg/50 rounded-b-2xl">
      <Loader2 className="w-8 h-8 text-brand-cyan animate-spin mb-3" />
      <p className="text-sm font-bold text-brand-muted">Loading Map...</p>
    </div>
  )
});

export default function AddressModal({ isOpen, onClose, onSelect, initialView = 'search' }) {
  const { user } = useAuth();
  const [view, setView] = useState(initialView); // 'search' | 'map'
  const [selectedCenter, setSelectedCenter] = useState(null); // { lat, lng }
  
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const searchTimeout = useRef(null);
  const sessionTokenRef = useRef(null);

  const getSessionToken = () => {
    if (!sessionTokenRef.current) {
      sessionTokenRef.current = typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID() 
        : Math.random().toString(36).substring(2, 15);
    }
    return sessionTokenRef.current;
  };

  // Animation states
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsVisible(true));
      });
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setIsMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setSearch('');
      setSuggestions([]);
      setView(initialView);
      setSelectedCenter(null);
    }, 300);
  };

  // Reset view when modal opens
  useEffect(() => {
    if (isOpen) {
      setView(initialView);
      setSelectedCenter(null);
    }
  }, [isOpen, initialView]);

  // Close modal on escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (val.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/location/autocomplete?q=${encodeURIComponent(val)}&sessionToken=${getSessionToken()}`);
        const data = await res.json();
        setSuggestions(data || []);
      } catch (err) {
        console.error('Nominatim search error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 500);
  };

  const handleSuggestionSelect = async (suggestion) => {
    if (suggestion.place_id) {
      try {
        const res = await fetch(`/api/location/place?place_id=${suggestion.place_id}&sessionToken=${sessionTokenRef.current || ''}`);
        const data = await res.json();
        sessionTokenRef.current = null; // Clear token after place details is fetched
        if (data.lat && data.lng) {
          setSelectedCenter({ lat: parseFloat(data.lat), lng: parseFloat(data.lng) });
          setView('map');
        }
      } catch (err) {
        console.error('Place details error:', err);
      }
    } else if (suggestion.lat && suggestion.lon) {
      setSelectedCenter({ lat: parseFloat(suggestion.lat), lng: parseFloat(suggestion.lon) });
      setView('map');
    }
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser', 'error');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setSelectedCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsLocating(false);
        setView('map');
      },
      () => {
        setIsLocating(false);
        showToast('Unable to retrieve your location', 'error');
      }
    );
  };

  const handleFinalLocationConfirm = (locationData) => {
    onSelect(locationData);
    setSearch('');
    setSuggestions([]);
    setView('search');
    setSelectedCenter(null);
    handleClose();
  };

  if (!isMounted) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-0 transition-opacity duration-300 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      {/* Invisible backdrop to catch clicks for closing */}
      <div 
        className="absolute inset-0 bg-transparent"
        onClick={handleClose}
      />
      
      <div className={`relative w-full max-w-lg bg-white border border-[#eadfdb] rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col h-[85vh] sm:h-[700px] max-h-[85vh] transition-all duration-300 ease-out transform ${isVisible ? 'translate-y-0 scale-100' : 'translate-y-8 sm:translate-y-4 scale-95'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e7eb] bg-white z-10 shadow-sm relative">
          <div className="flex items-center gap-3">
            {view === 'map' && (
              <button type="button" onClick={() => setView('search')} className="p-2 -ml-2 text-[#6b7280] hover:text-[#1a1a1a] hover:bg-gray-100 rounded-full transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-xl font-bold text-[#1a1a1a]">
              {view === 'search' ? 'Select delivery location' : 'Confirm precise location'}
            </h2>
          </div>
          <button 
            type="button"
            onClick={handleClose}
            className="p-2 text-[#6b7280] hover:text-[#1a1a1a] hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {view === 'search' ? (
          <>
            {/* Search Input */}
            <div className="p-4 border-b border-[#e5e7eb] bg-gray-50/50">
              <div className="relative flex items-center bg-white rounded-xl border border-[#e5e7eb] shadow-sm focus-within:border-[#7a0b10] focus-within:ring-1 focus-within:ring-[#7a0b10] transition-all">
                <Search className="absolute left-4 h-5 w-5 text-[#7a0b10]" />
                <input
                  type="text"
                  value={search}
                  onChange={handleSearchChange}
                  placeholder="Search for your city, area, or street..."
                  className="w-full bg-transparent border-none focus:ring-0 text-[#1a1a1a] placeholder-[#9ca3af] pl-12 pr-12 py-4 text-[15px]"
                  autoFocus
                />
                {isLoading && (
                  <Loader2 className="absolute right-4 h-5 w-5 text-[#7a0b10] animate-spin" />
                )}
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-2 bg-white">
              
              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="mb-4">
                  <h3 className="px-4 py-2 text-xs font-bold text-[#6b7280] uppercase tracking-wider">Search Results</h3>
                  <ul className="space-y-1">
                    {suggestions.map((s, idx) => (
                      <li key={idx}>
                        <button
                          type="button"
                          onClick={() => handleSuggestionSelect(s)}
                          className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 rounded-xl transition-colors text-left"
                        >
                          <MapPin className="h-5 w-5 text-[#7a0b10] mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[15px] font-bold text-[#1a1a1a] leading-tight">{s.display_name.split(',')[0]}</p>
                            <p className="text-[13px] text-[#6b7280] mt-1 truncate">{s.display_name}</p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Current Location Action */}
              {!suggestions.length && (
                <button
                  type="button"
                  onClick={handleCurrentLocation}
                  disabled={isLocating}
                  className="w-full flex items-center gap-3 px-4 py-4 hover:bg-[#fcedec] rounded-xl transition-colors text-left group mb-2 border border-transparent hover:border-[#7a0b10]/20"
                >
                  <Navigation className={`h-5 w-5 text-[#7a0b10] shrink-0 ${isLocating ? 'animate-pulse' : ''}`} />
                  <div>
                    <p className="text-[15px] font-bold text-[#7a0b10]">
                      {isLocating ? 'Locating...' : 'Use current location'}
                    </p>
                    <p className="text-[13px] text-[#6b7280] mt-0.5">Using GPS</p>
                  </div>
                </button>
              )}

              {/* Saved Addresses */}
              {!suggestions.length && user?.savedAddresses?.length > 0 && (
                <div>
                  <h3 className="px-4 py-2 text-xs font-bold text-[#6b7280] uppercase tracking-wider border-t border-[#e5e7eb] pt-4 mt-2">Saved Addresses</h3>
                  <ul className="space-y-1 mt-1">
                    {user.savedAddresses.map((addr) => (
                      <li key={addr._id}>
                        <button
                          type="button"
                          onClick={() => onSelect({
                            address: addr.address,
                            lat: addr.lat,
                            lng: addr.lng
                          })}
                          className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 rounded-xl transition-colors text-left"
                        >
                          <History className="h-5 w-5 text-[#9ca3af] mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[15px] font-bold text-[#1a1a1a] leading-tight">{addr.label || 'Saved Address'}</p>
                            <p className="text-[13px] text-[#6b7280] mt-1 truncate">{addr.address}</p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            </div>
          </>
        ) : (
          <MapLocationPicker 
            initialCenter={selectedCenter} 
            onLocationSelect={handleFinalLocationConfirm} 
          />
        )}
      </div>
    </div>
  );
}
