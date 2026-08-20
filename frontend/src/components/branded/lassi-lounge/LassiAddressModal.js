import { useState, useEffect, useRef } from 'react';
import { X, Search, MapPin, Navigation, History, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { showToast } from '@/components/ui';
import dynamic from 'next/dynamic';

const MapLocationPicker = dynamic(() => import('@/components/shared/MapLocationPicker'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] bg-gray-50 rounded-b-2xl">
      <Loader2 className="w-8 h-8 text-[#7a0b10] animate-spin mb-3" />
      <p className="text-sm font-bold text-gray-500">Loading Map...</p>
    </div>
  )
});

export default function LassiAddressModal({ isOpen, onClose, onSelect }) {
  const { user } = useAuth();
  const [view, setView] = useState('search'); // 'search' | 'map'
  const [selectedCenter, setSelectedCenter] = useState(null); // { lat, lng }
  
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(false);

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

  useEffect(() => {
    let timeoutId;
    if (isOpen) {
      setMounted(true);
      timeoutId = setTimeout(() => setShow(true), 10); // Trigger transition
    } else {
      setShow(false);
      timeoutId = setTimeout(() => setMounted(false), 300); // Wait for transition
    }
    return () => clearTimeout(timeoutId);
  }, [isOpen]);

  const handleClose = () => {
    setShow(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    if (show) {
      document.addEventListener('keydown', handleEsc);
    }
    return () => document.removeEventListener('keydown', handleEsc);
  }, [show]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (val.trim().length < 3) {
      setSuggestions([]);
      setIsLoading(false);
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
  };

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-4">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-out ${show ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />
      
      {/* Modal Content */}
      <div className={`relative z-10 w-full sm:max-w-xl bg-[#fcfbf9] text-[#1a1a1a] sm:rounded-[24px] rounded-t-[24px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[80vh] transition-all duration-300 ease-out ${show ? 'opacity-100 translate-y-0 sm:scale-100' : 'opacity-0 translate-y-8 sm:translate-y-4 sm:scale-95'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-white z-10">
          <div className="flex items-center gap-3">
            {view === 'map' && (
              <button onClick={() => setView('search')} className="p-2 -ml-2 text-[#6b7280] hover:text-[#1f2937] hover:bg-[#f3f4f6] rounded-full transition-all">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-[20px] font-black text-[#4a0b0d] tracking-tight uppercase">
              {view === 'search' ? 'Delivery Location' : 'Confirm Location'}
            </h2>
          </div>
          <button 
            onClick={handleClose}
            className="p-2 text-[#4b5563] hover:text-[#4a0b0d] hover:bg-[#fef2f2] rounded-full transition-all"
          >
            <X className="h-6 w-6" strokeWidth={2.5} />
          </button>
        </div>

        {view === 'search' ? (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Search Input Area */}
            <div className="px-6 py-5 relative z-50 bg-white border-b border-[#f3f4f6] shadow-sm">
              <div className="relative flex items-center bg-white rounded-xl border border-[#e5e7eb] focus-within:border-[#4a0b0d] ring-1 ring-transparent focus-within:ring-[#4a0b0d] shadow-sm transition-all overflow-hidden">
                <Search className="absolute left-4 h-5 w-5 text-[#c67a3f]" />
                <input
                  type="text"
                  value={search}
                  onChange={handleSearchChange}
                  placeholder="Enter your street and city..."
                  className="w-full bg-transparent border-transparent !border-none !outline-none focus:ring-0 focus:!border-transparent focus:!outline-none text-[#1f2937] font-semibold pl-12 pr-12 py-4 text-[15px] placeholder:text-[#9ca3af] placeholder:font-normal"
                  autoFocus
                />
                {isLoading && (
                  <Loader2 className="absolute right-4 h-5 w-5 text-[#c67a3f] animate-spin" />
                )}
              </div>

              {/* Autocomplete Suggestions */}
              {suggestions && suggestions.length > 0 && (
                <div className="absolute left-6 right-6 top-[calc(100%-8px)] mt-2 rounded-xl border border-[#f3f4f6] bg-white shadow-xl z-[100] overflow-hidden max-h-[260px] overflow-y-auto ll-soft-scroll">
                  <ul className="divide-y divide-[#f9fafb]">
                    {suggestions.map((s, idx) => (
                      <li key={idx}>
                        <button
                          type="button"
                          onClick={() => handleSuggestionSelect(s)}
                          className="w-full flex items-start gap-3 px-5 py-4 hover:bg-[#fff7ed] transition-colors text-left group"
                        >
                          <MapPin className="w-5 h-5 text-[#d1d5db] mt-0.5 group-hover:text-[#c67a3f] transition-colors shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-[#1f2937] text-[15px] truncate group-hover:text-[#4a0b0d] transition-colors">
                              {s.display_name.split(',')[0]}
                            </p>
                            <p className="text-sm text-[#6b7280] mt-0.5 truncate">{s.display_name.split(',').slice(1).join(',').trim()}</p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Scrollable Content (Current location + Saved addresses) */}
            <div className="flex-1 overflow-y-auto px-6 py-6 ll-soft-scroll">
              
              {/* Current Location Action */}
              <button
                onClick={handleCurrentLocation}
                disabled={isLocating}
                className="w-full flex items-center justify-between p-4 mb-8 bg-white border border-[#e5e7eb] hover:border-[#c67a3f] rounded-2xl shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isLocating ? 'bg-[#ffedd5]' : 'bg-[#fef2f2] group-hover:bg-[#4a0b0d] transition-colors'}`}>
                    <Navigation className={`h-5 w-5 ${isLocating ? 'text-[#c67a3f] animate-pulse' : 'text-[#4a0b0d] group-hover:text-white transition-colors'}`} />
                  </div>
                  <div className="text-left">
                    <p className={`text-[15px] font-bold ${isLocating ? 'text-[#c67a3f]' : 'text-[#4a0b0d]'}`}>
                      {isLocating ? 'Locating...' : 'Use Current Location'}
                    </p>
                    <p className="text-xs text-[#6b7280] font-medium mt-0.5">Enable GPS for exact delivery</p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#f9fafb] flex items-center justify-center group-hover:bg-[#fff7ed] transition-colors">
                  <ArrowLeft className="w-4 h-4 text-[#9ca3af] rotate-180 group-hover:text-[#c67a3f] transition-colors" />
                </div>
              </button>

              {/* Saved Addresses */}
              {user?.savedAddresses?.length > 0 && (
                <div className="animate-in fade-in duration-500">
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-[11px] font-black text-[#9ca3af] uppercase tracking-widest">Saved Addresses</h3>
                    <div className="h-px bg-[#e5e7eb] flex-1"></div>
                  </div>
                  
                  <ul className="space-y-3">
                    {user.savedAddresses.map((addr) => (
                      <li key={addr._id}>
                        <button
                          onClick={() => onSelect({
                            address: addr.address,
                            lat: addr.lat,
                            lng: addr.lng
                          })}
                          className="w-full flex items-center gap-4 p-4 bg-white border border-[#e5e7eb] hover:border-[#c67a3f]/60 rounded-2xl hover:shadow-md transition-all group text-left"
                        >
                          <div className="w-10 h-10 rounded-full bg-[#f9fafb] group-hover:bg-[#fff7ed] flex items-center justify-center shrink-0 transition-colors">
                            <History className="h-4 w-4 text-[#9ca3af] group-hover:text-[#c67a3f] transition-colors" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[15px] font-bold text-[#1f2937] leading-tight group-hover:text-[#4a0b0d] transition-colors">
                              {addr.label || 'Saved Address'}
                            </p>
                            <p className="text-[13px] text-[#6b7280] mt-1 truncate font-medium">
                              {addr.address}
                            </p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col bg-white text-[#1a1a1a] min-h-[400px]">
            <MapLocationPicker 
              initialCenter={selectedCenter} 
              onLocationSelect={handleFinalLocationConfirm} 
            />
          </div>
        )}
      </div>
    </div>
  );
}
