'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader2, Navigation } from 'lucide-react';

// Fix for default marker icon issues in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// A component that updates the parent with the map's center coordinates when the user finishes dragging
function MapCenterWatcher({ onMapSettle }) {
  const map = useMap();

  useEffect(() => {
    const handleMoveEnd = () => {
      const center = map.getCenter();
      onMapSettle({ lat: center.lat, lng: center.lng });
    };

    map.on('moveend', handleMoveEnd);
    
    // Initial trigger
    handleMoveEnd();

    return () => {
      map.off('moveend', handleMoveEnd);
    };
  }, [map, onMapSettle]);

  return null;
}

export default function MapLocationPicker({ 
  initialCenter, 
  onLocationSelect, // fired when user confirms location
  onAddressChange // fires whenever geocoding completes (to show preview)
}) {
  const [center, setCenter] = useState(initialCenter || { lat: 40.7128, lng: -74.0060 }); // Default NYC
  const [currentAddress, setCurrentAddress] = useState('');
  const [addressDetails, setAddressDetails] = useState(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  
  // Track user's specific manual input
  const [flatNo, setFlatNo] = useState('');
  const [landmark, setLandmark] = useState('');

  // Search State
  const [searchInput, setSearchInput] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef(null);
  const sessionTokenRef = useRef(null);

  const getSessionToken = () => {
    if (!sessionTokenRef.current) {
      sessionTokenRef.current = typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID() 
        : Math.random().toString(36).substring(2, 15);
    }
    return sessionTokenRef.current;
  };

  const mapRef = useRef(null);

  const locateMe = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLat = pos.coords.latitude;
        const newLng = pos.coords.longitude;
        setCenter({ lat: newLat, lng: newLng });
        if (mapRef.current) {
          mapRef.current.setView([newLat, newLng], mapRef.current.getZoom(), {
            animate: true,
            duration: 0.5
          });
        }
      },
      (err) => console.error(err)
    );
  }, []);

  useEffect(() => {
    if (!initialCenter) {
      locateMe();
    } else if (mapRef.current) {
      mapRef.current.setView([initialCenter.lat, initialCenter.lng], mapRef.current.getZoom(), {
        animate: true,
        duration: 0.5
      });
    }
  }, [initialCenter, locateMe]);

  // Use a ref to debounce geocoding API calls while panning
  const geocodeTimeout = useRef(null);

  const reverseGeocode = useCallback(async (lat, lng) => {
    setIsGeocoding(true);
    try {
      const res = await fetch(`/api/location/reverse-geocode?lat=${lat}&lng=${lng}`);
      const data = await res.json();
      
      let addressString = data.display_name || 'Unknown Location';
      
      if (data.address) {
        setAddressDetails(data.address);
        const { house_number, road, neighbourhood, suburb, city, state, postcode } = data.address;
        const parts = [house_number, road, neighbourhood, suburb, city, state, postcode].filter(Boolean);
        if (parts.length > 0) {
          addressString = parts.join(', ');
        }
      } else {
        setAddressDetails(null);
      }

      setCurrentAddress(addressString);
      if (onAddressChange) onAddressChange(addressString);
    } catch (err) {
      console.error('Reverse Geocode error:', err);
      setCurrentAddress('Unable to fetch address. Please enter manually.');
      setAddressDetails(null);
    } finally {
      setIsGeocoding(false);
    }
  }, [onAddressChange]);

  const handleMapSettle = useCallback((newCenter) => {
    setCenter(newCenter);
    
    if (geocodeTimeout.current) clearTimeout(geocodeTimeout.current);
    geocodeTimeout.current = setTimeout(() => {
      reverseGeocode(newCenter.lat, newCenter.lng);
    }, 600); // Wait 600ms after map stops moving before calling API
  }, [reverseGeocode]);

  const handleConfirm = () => {
    let finalAddress = currentAddress;
    
    // Prepend flat/house number and landmark if provided
    const prefixParts = [];
    if (flatNo.trim()) prefixParts.push(flatNo.trim());
    if (landmark.trim()) prefixParts.push(`Near ${landmark.trim()}`);
    
    if (prefixParts.length > 0) {
      finalAddress = `${prefixParts.join(', ')} - ${currentAddress}`;
    }

    onLocationSelect({
      address: finalAddress,
      lat: center.lat,
      lng: center.lng,
      addressDetails, // Raw details for precise form filling
      flatNo,
      landmark
    });
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    if (val.trim().length < 3) {
      setSearchSuggestions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/location/autocomplete?q=${encodeURIComponent(val)}&sessionToken=${getSessionToken()}`);
        const data = await res.json();
        setSearchSuggestions(data || []);
      } catch (err) {
        console.error('Nominatim search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 500);
  };

  const handleSuggestionSelect = async (suggestion) => {
    setSearchInput(suggestion.display_name);
    setSearchSuggestions([]);
    
    if (suggestion.place_id) {
      try {
        setIsGeocoding(true);
        const res = await fetch(`/api/location/place?place_id=${suggestion.place_id}&sessionToken=${sessionTokenRef.current || ''}`);
        const data = await res.json();
        sessionTokenRef.current = null; // Clear token after place details is fetched
        if (data.lat && data.lng) {
          const newCenter = { lat: parseFloat(data.lat), lng: parseFloat(data.lng) };
          setCenter(newCenter);
          if (mapRef.current) {
            mapRef.current.setView([newCenter.lat, newCenter.lng], 18, { animate: true });
          }
        }
      } catch (err) {
        console.error('Place details error:', err);
      } finally {
        setIsGeocoding(false);
      }
    } else if (suggestion.lat && suggestion.lon) {
      const newCenter = { lat: parseFloat(suggestion.lat), lng: parseFloat(suggestion.lon) };
      setCenter(newCenter);
      if (mapRef.current) {
        mapRef.current.setView([newCenter.lat, newCenter.lng], 18, { animate: true });
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative animate-in fade-in duration-300 rounded-b-2xl overflow-hidden">
      {/* Map Container - Flex 1 to take remaining space */}
      <div className="relative flex-1 min-h-[300px] w-full bg-gray-100">
        <MapContainer 
          center={[center.lat, center.lng]} 
          zoom={17} 
          style={{ height: '100%', width: '100%', zIndex: 10 }}
          zoomControl={false}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          <MapCenterWatcher onMapSettle={handleMapSettle} />
        </MapContainer>

        {/* Overlay Search Bar */}
        <div className="absolute top-4 left-4 right-4 z-[500]">
          <div className="relative flex items-center bg-white rounded-xl shadow-md border border-gray-100 focus-within:border-brand-cyan transition-colors">
            <div className="pl-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7a0b10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
            <input
              type="text"
              value={searchInput}
              onChange={handleSearchChange}
              placeholder="Search city, area, or street..."
              className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-[#1a1a1a] px-3 py-3 text-sm"
            />
            {isSearching && (
              <div className="pr-4">
                <Loader2 className="h-4 w-4 text-[#7a0b10] animate-spin" />
              </div>
            )}
            {searchInput && !isSearching && (
              <button 
                type="button" 
                onClick={() => { setSearchInput(''); setSearchSuggestions([]); setIsSearching(false); }} 
                className="pr-4 text-gray-400 hover:text-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            )}
          </div>

          {searchSuggestions.length > 0 && (
            <ul className="mt-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden max-h-48 overflow-y-auto ll-pop ll-soft-scroll">
              {searchSuggestions.map((s, idx) => (
                <li key={idx} className="border-b border-gray-50 last:border-0">
                  <button
                    type="button"
                    onClick={() => handleSuggestionSelect(s)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors text-sm"
                  >
                    <p className="font-bold text-[#1a1a1a] leading-tight truncate">{s.display_name.split(',')[0]}</p>
                    <p className="text-xs text-gray-500 mt-1 truncate">{s.display_name}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Center Fixed Marker UI (Precise Pin) */}
        <div className="absolute top-1/2 left-1/2 z-[400] pointer-events-none flex flex-col items-center" style={{ transform: 'translate(-50%, -100%)' }}>
          {/* Bouncing Teardrop Pin */}
          <div className={`transition-transform duration-300 ease-out ${isGeocoding ? '-translate-y-3' : 'translate-y-0'}`}>
            <svg width="42" height="42" viewBox="0 0 24 24" fill="#7a0b10" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.3))' }}>
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3.5" fill="white" stroke="none"></circle>
            </svg>
          </div>
          {/* Exact Center Coordinate Dot */}
          <div className="w-2 h-2 bg-[#7a0b10] border-2 border-white rounded-full absolute bottom-[-4px] shadow-sm"></div>
        </div>

        {/* Locate Me FAB */}
        <button 
          type="button"
          onClick={locateMe}
          className="absolute bottom-6 right-4 z-[400] bg-white text-[#7a0b10] p-3 rounded-full shadow-lg border border-gray-100 hover:bg-gray-50 active:scale-95 transition-all"
        >
          <Navigation className="w-5 h-5" />
        </button>
      </div>

      {/* Address Details Sheet */}
      <div className="bg-white shadow-[0_-10px_20px_rgba(0,0,0,0.05)] p-5 z-[500] relative flex flex-col gap-4">
        
        {/* Geocoded Address Display */}
        <div className="flex items-start gap-3 bg-gray-50/70 p-3 rounded-xl border border-gray-100">
          <div className="mt-0.5 text-[#7a0b10]">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-[#1a1a1a] text-sm mb-0.5">Delivery Location</h4>
            {isGeocoding ? (
              <div className="flex items-center gap-2 text-[#6b7280] text-xs font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Fetching exact address...
              </div>
            ) : (
              <p className="text-[#6b7280] text-xs leading-relaxed line-clamp-2">{currentAddress}</p>
            )}
          </div>
        </div>

        {/* Submit */}
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isGeocoding || !currentAddress}
          className="w-full bg-[#7a0b10] text-white font-bold py-3.5 rounded-xl mt-2 hover:bg-[#5e080c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isGeocoding ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
          Confirm Location
        </button>
      </div>
    </div>
  );
}
