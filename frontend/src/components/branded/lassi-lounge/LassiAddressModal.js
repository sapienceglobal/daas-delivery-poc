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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-0">
      <div 
        className="absolute inset-0 bg-[#1a1a1a]/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-lg bg-white border border-[#e5e7eb] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:h-[650px] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e7eb]">
          <div className="flex items-center gap-3">
            {view === 'map' && (
              <button onClick={() => setView('search')} className="p-1 -ml-2 text-[#6b7280] hover:text-[#1a1a1a] transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-xl font-bold text-[#1a1a1a] font-sans tracking-tight">
              {view === 'search' ? 'Select delivery location' : 'Confirm precise location'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-[#6b7280] hover:text-[#1a1a1a] hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {view === 'search' ? (
          <>
            {/* Search Input */}
            <div className="p-4 border-b border-[#e5e7eb] bg-[#f8f5f0]/50 relative z-[60]">
              <div className="relative flex items-center bg-white rounded-xl border border-[#e5e7eb] focus-within:border-[#4a0b0d] transition-colors shadow-sm z-50">
                <Search className="absolute left-4 h-5 w-5 text-[#4a0b0d]" />
                <input
                  type="text"
                  value={search}
                  onChange={handleSearchChange}
                  placeholder="Search for your city, area, or street..."
                  className="w-full bg-transparent border-none focus:ring-0 text-[#1a1a1a] pl-12 pr-12 py-4 text-base placeholder:text-gray-400"
                  autoFocus
                />
                {isLoading && (
                  <Loader2 className="absolute right-4 h-5 w-5 text-[#4a0b0d] animate-spin" />
                )}
              </div>

              {/* Autocomplete Suggestions Dropdown */}
              {suggestions && suggestions.length > 0 && (
                <div className="absolute left-4 right-4 top-[calc(100%-8px)] mt-1.5 rounded-xl border border-[#e5e7eb] bg-[#ffffff] shadow-xl z-[100] overflow-hidden max-h-[220px] overflow-y-auto ll-pop ll-soft-scroll">
                  <ul className="divide-y divide-[#e5e7eb]">
                    {suggestions.map((s, idx) => (
                      <li key={idx}>
                        <button
                          type="button"
                          onClick={() => handleSuggestionSelect(s)}
                          className="w-full text-left px-4 py-3.5 text-xs hover:bg-[#f9fafb] transition-colors block focus:outline-none focus:bg-[#f9fafb]"
                        >
                          <p className="font-bold text-[#1a1a1a] truncate">{s.display_name.split(',')[0]}</p>
                          <p className="text-gray-500 mt-0.5 truncate">{s.display_name}</p>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-2 bg-[#f8f5f0] ll-soft-scroll">
              
              {/* Current Location Action */}
              <button
                  onClick={handleCurrentLocation}
                  disabled={isLocating}
                  className="w-full flex items-center gap-3 px-4 py-4 hover:bg-white rounded-xl transition-colors text-left group mt-2 mb-2"
                >
                  <Navigation className={`h-5 w-5 text-[#4a0b0d] shrink-0 ${isLocating ? 'animate-pulse' : 'group-hover:text-[#c67a3f] transition-colors'}`} />
                  <div>
                    <p className="text-sm font-bold text-[#4a0b0d] group-hover:text-[#c67a3f] transition-colors">
                      {isLocating ? 'Locating...' : 'Use current location'}
                    </p>
                    <p className="text-xs text-[#6b7280] mt-0.5">Using GPS</p>
                  </div>
                </button>

              {/* Saved Addresses */}
              {user?.savedAddresses?.length > 0 && (
                <div>
                  <h3 className="px-4 py-3 text-xs font-bold text-[#6b7280] uppercase tracking-wider border-t border-[#e5e7eb]/50 mt-2">Saved Addresses</h3>
                  <ul className="space-y-1">
                    {user.savedAddresses.map((addr) => (
                      <li key={addr._id}>
                        <button
                          onClick={() => onSelect({
                            address: addr.address,
                            lat: addr.lat,
                            lng: addr.lng
                          })}
                          className="w-full flex items-start gap-3 px-4 py-3 hover:bg-white rounded-xl transition-colors text-left"
                        >
                          <History className="h-5 w-5 text-[#6b7280] mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm font-bold text-[#1a1a1a] leading-tight">{addr.label || 'Saved Address'}</p>
                            <p className="text-xs text-[#6b7280] mt-1 truncate max-w-[280px] sm:max-w-sm">{addr.address}</p>
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
