import { useState, useEffect, useRef } from 'react';
import { X, Search, MapPin, Navigation, History, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { showToast } from '@/components/ui';

export default function AddressModal({ isOpen, onClose, onSelect }) {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const searchTimeout = useRef(null);

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
    // Extract formatted address string
    const parts = suggestion.display_name.split(',');
    // Generally takes the first 2-3 parts for a clean label, or the full name
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
        className="absolute inset-0 bg-brand-bg/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-lg bg-brand-card border border-brand-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[600px] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
          <h2 className="text-xl font-bold text-brand-text">Select delivery location</h2>
          <button 
            onClick={onClose}
            className="p-2 text-brand-muted hover:text-brand-text hover:bg-white/5 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-brand-border bg-brand-bg/50">
          <div className="relative flex items-center bg-brand-card rounded-xl border border-brand-border focus-within:border-brand-cyan transition-colors">
            <Search className="absolute left-4 h-5 w-5 text-brand-cyan" />
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search for your city, area, or street..."
              className="w-full bg-transparent border-none focus:ring-0 text-brand-text pl-12 pr-12 py-4 text-base"
              autoFocus
            />
            {isLoading && (
              <Loader2 className="absolute right-4 h-5 w-5 text-brand-cyan animate-spin" />
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-2">
          
          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="mb-4">
              <h3 className="px-4 py-2 text-xs font-bold text-brand-muted uppercase tracking-wider">Search Results</h3>
              <ul className="space-y-1">
                {suggestions.map((s, idx) => (
                  <li key={idx}>
                    <button
                      onClick={() => handleSuggestionSelect(s)}
                      className="w-full flex items-start gap-3 px-4 py-3 hover:bg-white/5 rounded-xl transition-colors text-left"
                    >
                      <MapPin className="h-5 w-5 text-brand-cyan mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-brand-text leading-tight">{s.display_name.split(',')[0]}</p>
                        <p className="text-xs text-brand-muted mt-1 truncate">{s.display_name}</p>
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
              onClick={handleCurrentLocation}
              disabled={isLocating}
              className="w-full flex items-center gap-3 px-4 py-4 hover:bg-white/5 rounded-xl transition-colors text-left group mb-2"
            >
              <Navigation className={`h-5 w-5 text-brand-cyan shrink-0 ${isLocating ? 'animate-pulse' : 'group-hover:text-brand-green transition-colors'}`} />
              <div>
                <p className="text-sm font-bold text-brand-cyan group-hover:text-brand-green transition-colors">
                  {isLocating ? 'Locating...' : 'Use current location'}
                </p>
                <p className="text-xs text-brand-muted mt-0.5">Using GPS</p>
              </div>
            </button>
          )}

          {/* Saved Addresses */}
          {!suggestions.length && user?.savedAddresses?.length > 0 && (
            <div>
              <h3 className="px-4 py-2 text-xs font-bold text-brand-muted uppercase tracking-wider border-t border-brand-border/50 pt-4">Saved Addresses</h3>
              <ul className="space-y-1 mt-1">
                {user.savedAddresses.map((addr) => (
                  <li key={addr._id}>
                    <button
                      onClick={() => onSelect({
                        address: addr.address,
                        lat: addr.lat,
                        lng: addr.lng
                      })}
                      className="w-full flex items-start gap-3 px-4 py-3 hover:bg-white/5 rounded-xl transition-colors text-left"
                    >
                      <History className="h-5 w-5 text-brand-muted mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-brand-text leading-tight">{addr.label || 'Saved Address'}</p>
                        <p className="text-xs text-brand-muted mt-1 truncate">{addr.address}</p>
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
