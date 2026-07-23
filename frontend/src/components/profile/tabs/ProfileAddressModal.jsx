'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { authAPI } from '@/lib/api';
import { showToast } from '@/components/ui';

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

export default function ProfileAddressModal({ isOpen, onClose, addressToEdit, onSuccess }) {
  const [loading, setLoading] = useState(false);
  
  const [label, setLabel] = useState('Home');
  const [isDefault, setIsDefault] = useState(false);
  
  // Checkout-style address fields
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('CA');
  const [zipCode, setZipCode] = useState('');
  const [lat, setLat] = useState(0);
  const [lng, setLng] = useState(0);

  // Auto-suggestion state
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);

  useEffect(() => {
    if (addressToEdit) {
      setLabel(addressToEdit.label || 'Home');
      setIsDefault(addressToEdit.isDefault || false);
      // Robust parsing for editing existing address
      setAddressLine1('');
      setAddressLine2('');
      setCity('');
      setState('CA');
      setZipCode('');

      if (addressToEdit.address) {
        const zipRegex = /([A-Za-z]{2})(?:,)?\s+(\d{5})(?:-\d{4})?$/;
        let match = addressToEdit.address.match(zipRegex);
        
        if (match) {
          setState(match[1].toUpperCase());
          setZipCode(match[2]);
          
          let rest = addressToEdit.address.replace(zipRegex, '').trim();
          if (rest.endsWith(',')) rest = rest.slice(0, -1).trim();
          
          const parts = rest.split(',').map(p => p.trim()).filter(Boolean);
          
          if (parts.length > 0) {
            setCity(parts[parts.length - 1]);
            parts.pop();
          }
          
          if (parts.length > 0) {
            setAddressLine1(parts[0]);
            if (parts.length > 1) {
              setAddressLine2(parts.slice(1).join(', '));
            }
          }
        } else {
          setAddressLine1(addressToEdit.address);
        }
      }

      setLat(addressToEdit.lat || 0);
      setLng(addressToEdit.lng || 0);
    } else {
      setLabel('Home');
      setIsDefault(false);
      setAddressLine1('');
      setAddressLine2('');
      setCity('');
      setState('CA');
      setZipCode('');
      setLat(0);
      setLng(0);
    }
  }, [addressToEdit, isOpen]);

  if (!isOpen) return null;

  const handleAddressLine1Change = (val) => {
    setAddressLine1(val);
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
    setLat(parseFloat(suggestion.lat) || 0);
    setLng(parseFloat(suggestion.lon) || 0);
    setSuggestions([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const compiledAddress = `${addressLine1}, ${addressLine2 ? addressLine2 + ', ' : ''}${city}, ${state} ${zipCode}`;
      
      if (!addressLine1 || !city || !state || !zipCode) {
        setLoading(false);
        return showToast('Please fill out all required fields', 'error');
      }

      if (compiledAddress.length < 10) {
        setLoading(false);
        return showToast('Address must be at least 10 characters long', 'error');
      }

      const payload = {
        label,
        address: compiledAddress,
        isDefault,
        lat,
        lng
      };

      if (addressToEdit) {
        await authAPI.editAddress(addressToEdit._id, payload);
        showToast('Address updated successfully', 'success');
      } else {
        await authAPI.addAddress(payload);
        showToast('Address added successfully', 'success');
      }
      onSuccess();
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to save address', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-[0_0_40px_rgba(0,0,0,0.15)] border border-[#eadfdb] overflow-visible animate-scale-in flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-[#eadfdb] flex items-center justify-between shrink-0">
          <h2 className="text-[20px] font-black text-[#1a1a1a]">
            {addressToEdit ? 'Edit Address' : 'Add New Address'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto ll-soft-scroll flex-1 p-6">
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            <div>
              <label className="block text-[12px] font-bold text-[#4b5563] mb-2">Save as</label>
              <div className="flex gap-2">
                {['Home', 'Work', 'Other'].map(lbl => (
                  <button
                    key={lbl}
                    type="button"
                    onClick={() => setLabel(lbl)}
                    className={`px-4 h-10 rounded-lg text-[13px] font-bold transition-colors ${
                      label === lbl
                        ? 'bg-[#7a0b10] text-white'
                        : 'bg-[#f9f9f9] text-[#6b7280] border border-[#eadfdb] hover:border-[#b47b80]'
                    }`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 relative z-50">
                <label className="block text-[13px] font-bold text-[#1a1a1a] mb-1.5">Address Line 1*</label>
                <div className="relative">
                  <input
                    type="text" 
                    required 
                    autoComplete="off"
                    value={addressLine1}
                    onChange={(e) => handleAddressLine1Change(e.target.value)}
                    placeholder="House No., Street Name"
                    className="w-full rounded-xl border border-[#eadfdb] bg-[#f9f9f9] text-[#1a1a1a] placeholder-[#9ca3af] px-4 py-3 text-sm focus:outline-none focus:border-[#7a0b10] focus:ring-1 focus:ring-[#7a0b10] transition-colors"
                  />
                  {suggestionsLoading && (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-4 h-4 text-[#6b7280] animate-spin" />
                    </div>
                  )}

                  {/* Autocomplete Suggestions Dropdown */}
                  {suggestions && suggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 rounded-xl border border-[#e5e7eb] bg-[#ffffff] shadow-xl z-[100] overflow-hidden max-h-[220px] overflow-y-auto ll-pop ll-soft-scroll">
                      <ul className="divide-y divide-[#e5e7eb]">
                        {suggestions.map((s, idx) => (
                          <li key={idx}>
                            <button
                              type="button"
                              onClick={() => handleSelectSuggestion(s)}
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
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-[13px] font-bold text-[#1a1a1a] mb-1.5">Address Line 2</label>
                <input
                  type="text" 
                  value={addressLine2} 
                  onChange={(e) => setAddressLine2(e.target.value)}
                  placeholder="Apt, Suite, etc. (Optional)"
                  className="w-full rounded-xl border border-[#eadfdb] bg-[#f9f9f9] text-[#1a1a1a] placeholder-[#9ca3af] px-4 py-3 text-sm focus:outline-none focus:border-[#7a0b10] focus:ring-1 focus:ring-[#7a0b10] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-[#1a1a1a] mb-1.5">City*</label>
                <input
                  type="text" 
                  required 
                  value={city} 
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Enter city"
                  className="w-full rounded-xl border border-[#eadfdb] bg-[#f9f9f9] text-[#1a1a1a] placeholder-[#9ca3af] px-4 py-3 text-sm focus:outline-none focus:border-[#7a0b10] focus:ring-1 focus:ring-[#7a0b10] transition-colors"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-bold text-[#1a1a1a] mb-1.5">State*</label>
                  <select
                    value={state} 
                    onChange={(e) => setState(e.target.value)}
                    className="w-full rounded-xl border border-[#eadfdb] bg-[#f9f9f9] text-[#1a1a1a] px-4 py-3 text-sm focus:outline-none focus:border-[#7a0b10] focus:ring-1 focus:ring-[#7a0b10] transition-colors appearance-none"
                  >
                    {US_STATES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-[#1a1a1a] mb-1.5">Zip Code*</label>
                  <input
                    type="text" 
                    required 
                    value={zipCode} 
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="Enter zip code"
                    className="w-full rounded-xl border border-[#eadfdb] bg-[#f9f9f9] text-[#1a1a1a] placeholder-[#9ca3af] px-4 py-3 text-sm focus:outline-none focus:border-[#7a0b10] focus:ring-1 focus:ring-[#7a0b10] transition-colors"
                  />
                </div>
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer select-none mt-2">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="w-5 h-5 rounded border-[#eadfdb] text-[#7a0b10] focus:ring-[#7a0b10]"
              />
              <span className="text-[13px] font-bold text-[#4b5563]">Set as default address</span>
            </label>

            <div className="pt-6 flex justify-end gap-3 border-t border-[#eadfdb] sticky bottom-0 bg-white">
              <button 
                type="button"
                onClick={onClose}
                className="px-6 h-11 rounded-lg border border-[#eadfdb] text-[#4b5563] text-[13px] font-bold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={loading}
                className="px-5 h-11 py-2 rounded-lg bg-[#7a0b10] text-white text-[13px] font-black uppercase tracking-wider hover:bg-[#680307] transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Address
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
