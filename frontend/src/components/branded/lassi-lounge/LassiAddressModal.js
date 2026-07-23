import { useState, useEffect, useRef } from 'react';
import { X, Search, MapPin, Navigation, History, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { showToast } from '@/components/ui';

export default function LassiAddressModal({ isOpen, onClose, onSelect }) {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const searchTimeout = useRef(null);

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
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&countrycodes=us&limit=5`, {
          headers: { 'User-Agent': 'SapienceGlobalPoCDeliveryApp/1.0 (adars.gemini.antigravity)' }
        });
        const data = await res.json();
        setSuggestions(data || []);
      } catch (err) {
        console.error('Nominatim search error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 500);
  };

  const handleSuggestionSelect = (suggestion) => {
    const parts = suggestion.display_name.split(',');
    const formattedAddress = parts.slice(0, 3).join(',').trim();
    
    onSelect({
      address: formattedAddress,
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon)
    });
    setSearch('');
    setSuggestions([]);
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser', 'error');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&zoom=18&addressdetails=1`, {
            headers: { 'User-Agent': 'SapienceGlobalPoCDeliveryApp/1.0' }
          });
          const data = await res.json();
          const addressString = data.display_name || 'Current Location';
          
          onSelect({
            address: addressString,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        } catch(err) {
          showToast('Failed to reverse geocode location', 'error');
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setIsLocating(false);
        showToast('Unable to retrieve your location', 'error');
      }
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-0">
      <div 
        className="absolute inset-0 bg-[#1a1a1a]/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-lg bg-white border border-[#e5e7eb] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[600px] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e7eb]">
          <h2 className="text-xl font-bold text-[#1a1a1a] font-sans tracking-tight">Select delivery location</h2>
          <button 
            onClick={onClose}
            className="p-2 text-[#6b7280] hover:text-[#1a1a1a] hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

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

          {/* Autocomplete Suggestions Dropdown (Checkout style) */}
          {suggestions && suggestions.length > 0 && (
            <div className="absolute left-4 right-4 top-[calc(100%-8px)] mt-1.5 rounded-xl border border-[#e5e7eb] bg-[#ffffff] shadow-xl z-[100] overflow-hidden max-h-[220px] overflow-y-auto ll-pop ll-soft-scroll">
              <ul className="divide-y divide-[#e5e7eb]">
                {suggestions.map((s, idx) => (
                  <li key={idx}>
                    <button
                      type="button"
                      onClick={() => handleSuggestionSelect(s)}
                      className="w-full text-left px-4 py-3.5 text-xs font-bold hover:bg-[#f9fafb] text-[#1a1a1a] transition-colors block truncate focus:outline-none focus:bg-[#f9fafb]"
                    >
                      {s.display_name}
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
      </div>
    </div>
  );
}
