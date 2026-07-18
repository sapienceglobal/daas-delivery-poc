'use client';
import { Package, MapPin, Navigation, Store, Check, Loader2 } from 'lucide-react';

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

export default function DeliveryInfoSection({
  step, setStep, t,
  fullName, setFullName, phone, setPhone, email, setEmail,
  addressLine1, setAddressLine1, addressLine2, setAddressLine2,
  city, setCity, state, setState, zipCode, setZipCode,
  deliveryInstructions, setDeliveryInstructions,
  orderType, setOrderType,
  user, onSelectSavedAddress, onUseCurrentLocation,
  restaurant, compiledAddress,
  onContinue,
  onAddressLine1Change, suggestions = [], suggestionsLoading, onSelectSuggestion, quoteError, quoteLoading,
}) {
  return (
    <div className={`rounded-2xl border border-[#e5e7eb] bg-[#ffffff] p-6 shadow-sm ll-interactive ${step === 3 ? 'opacity-85' : ''}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[22px] font-bold font-serif flex items-center gap-3 text-[#1a1a1a]">
          <span className="h-11 w-11 rounded-full flex items-center justify-center bg-[#fcedec] text-[#7a0b10]">
            <MapPin className="w-5 h-5" />
          </span>
          1. Delivery Information
        </h2>
        {step === 3 && (
          <button onClick={() => setStep(1)} className="text-[13px] font-bold text-[#7a0b10] hover:underline uppercase tracking-wider">
            Change
          </button>
        )}
      </div>

      {step < 3 ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Delivery Type selector tabs */}
          <div>
            <label className="block text-[14px] font-bold text-[#1a1a1a] mb-3">Delivery Type</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { type: 'delivery', label: 'Delivery', desc: 'Get it delivered to your doorstep' },
                { type: 'pickup', label: 'Pickup', desc: 'Pick up from our location' },
              ].map((opt) => {
                const isSelected = orderType === opt.type;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => setOrderType(opt.type)}
                    className={`flex items-start text-left gap-3 rounded-lg p-4 border relative overflow-hidden ll-interactive ll-focus-ring ${
                      isSelected 
                        ? 'border-[#7a0b10] bg-[#fffaf9]' 
                        : 'border-[#e5e7eb] bg-[#ffffff] hover:border-[#d1d5db]'
                    }`}
                  >
                    <div className={`mt-0.5 ${isSelected ? 'text-[#7a0b10]' : 'text-[#6b7280]'}`}>
                      {opt.type === 'delivery' ? <Package className="w-6 h-6" /> : <MapPin className="w-6 h-6" />}
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-bold text-[15px] leading-tight mb-1 ${isSelected ? 'text-[#1a1a1a]' : 'text-[#4b5563]'}`}>
                        {opt.label}
                      </h4>
                      <p className="text-[13px] text-[#6b7280]">{opt.desc}</p>
                    </div>
                    {isSelected && (
                      <span className="absolute top-2.5 right-2.5 rounded-full p-0.5 bg-[#7a0b10] text-[#ffffff]">
                        <Check className="w-3.5 h-3.5" strokeWidth={4} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Geolocation and Saved Address Controls */}
          {orderType === 'delivery' && (
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={onUseCurrentLocation}
                className="text-[12px] font-extrabold uppercase tracking-wide text-[#7a0b10] bg-[#ffffff] border border-[#e5e7eb] hover:bg-[#fffaf9] px-4 py-2 rounded-xl flex items-center gap-1.5 ll-interactive ll-focus-ring"
              >
                <Navigation className="h-3.5 w-3.5" /> Use Current Location
              </button>

              {user?.savedAddresses && user.savedAddresses.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-[#6b7280] mr-1">Saved:</span>
                  {user.savedAddresses.map((addr, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => onSelectSavedAddress(addr)}
                      className="text-[11px] font-bold text-[#4b5563] px-3 py-1.5 border border-[#e5e7eb] bg-[#ffffff] hover:bg-[#f9fafb] rounded-lg flex items-center gap-1 ll-interactive ll-focus-ring"
                    >
                      <MapPin className="h-3 w-3 shrink-0" />
                      {addr.label || 'Address'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Manual Address Fields Form */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-bold text-[#1a1a1a] mb-1.5">Full Name*</label>
                <input
                  type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full rounded-xl border border-[#e5e7eb] bg-[#ffffff] text-[#1a1a1a] placeholder-[#9ca3af] px-4 py-3 text-sm focus:outline-none focus:border-[#7a0b10] focus:ring-1 focus:ring-[#7a0b10] transition-colors"
                />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-[#1a1a1a] mb-1.5">Phone Number*</label>
                <input
                  type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)}
                  placeholder="(123) 456-7890"
                  className="w-full rounded-xl border border-[#e5e7eb] bg-[#ffffff] text-[#1a1a1a] placeholder-[#9ca3af] px-4 py-3 text-sm focus:outline-none focus:border-[#7a0b10] focus:ring-1 focus:ring-[#7a0b10] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-bold text-[#1a1a1a] mb-1.5">Email Address*</label>
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full rounded-xl border border-[#e5e7eb] bg-[#ffffff] text-[#1a1a1a] placeholder-[#9ca3af] px-4 py-3 text-sm focus:outline-none focus:border-[#7a0b10] focus:ring-1 focus:ring-[#7a0b10] transition-colors"
              />
            </div>

            {orderType === 'delivery' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 relative">
                    <label className="block text-[13px] font-bold text-[#1a1a1a] mb-1.5">Address Line 1*</label>
                    <div className="relative">
                      <input
                        type="text" required value={addressLine1}
                        onChange={(e) => onAddressLine1Change ? onAddressLine1Change(e.target.value) : setAddressLine1(e.target.value)}
                        placeholder="House No., Street Name"
                        className="w-full rounded-xl border border-[#e5e7eb] bg-[#ffffff] text-[#1a1a1a] placeholder-[#9ca3af] px-4 py-3 text-sm focus:outline-none focus:border-[#7a0b10] focus:ring-1 focus:ring-[#7a0b10] transition-colors"
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
                                  onClick={() => onSelectSuggestion(s)}
                                  className="w-full text-left px-4 py-3.5 text-xs font-bold hover:bg-[#f9fafb] text-[#1a1a1a] transition-colors block truncate ll-focus-ring"
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
                  <div>
                    <label className="block text-[13px] font-bold text-[#1a1a1a] mb-1.5">Address Line 2</label>
                    <input
                      type="text" value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)}
                      placeholder="Apartment, Suite, etc. (Optional)"
                      className="w-full rounded-xl border border-[#e5e7eb] bg-[#ffffff] text-[#1a1a1a] placeholder-[#9ca3af] px-4 py-3 text-sm focus:outline-none focus:border-[#7a0b10] focus:ring-1 focus:ring-[#7a0b10] transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[13px] font-bold text-[#1a1a1a] mb-1.5">City*</label>
                    <input
                      type="text" required value={city} onChange={(e) => setCity(e.target.value)}
                      placeholder="Enter city"
                      className="w-full rounded-xl border border-[#e5e7eb] bg-[#ffffff] text-[#1a1a1a] placeholder-[#9ca3af] px-4 py-3 text-sm focus:outline-none focus:border-[#7a0b10] focus:ring-1 focus:ring-[#7a0b10] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-bold text-[#1a1a1a] mb-1.5">State*</label>
                    <select
                      value={state} onChange={(e) => setState(e.target.value)}
                      className="w-full rounded-xl border border-[#e5e7eb] bg-[#ffffff] text-[#1a1a1a] px-4 py-3 text-sm focus:outline-none focus:border-[#7a0b10] focus:ring-1 focus:ring-[#7a0b10] transition-colors appearance-none bg-no-repeat bg-[right_16px_center]"
                      style={{
                        backgroundImage:
                          "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
                        backgroundSize: '16px',
                      }}
                    >
                      {US_STATES.map((st) => <option key={st} value={st}>{st}</option>)}
                      {!US_STATES.includes(state) && state && (
                        <option value={state}>{state}</option>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[13px] font-bold text-[#1a1a1a] mb-1.5">Zip Code*</label>
                    <input
                      type="text" required value={zipCode}
                      onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').substring(0, 5))}
                      placeholder="Enter zip code"
                      className="w-full rounded-xl border border-[#e5e7eb] bg-[#ffffff] text-[#1a1a1a] placeholder-[#9ca3af] px-4 py-3 text-sm focus:outline-none focus:border-[#7a0b10] focus:ring-1 focus:ring-[#7a0b10] transition-colors"
                    />
                  </div>
                </div>

                {/* ORIGINAL QUOTE ERROR LOGIC RETAINED */}
                {quoteError && (
                  <p className="text-[#ef4444] text-[11px] font-bold mt-1 flex items-center gap-1 animate-in fade-in duration-200">
                    <span>&bull;</span> Delivery is unavailable for this location
                  </p>
                )}

                <div>
                  <label className="block text-[13px] font-bold text-[#1a1a1a] mb-1.5">Delivery Instructions (Optional)</label>
                  <textarea
                    value={deliveryInstructions} onChange={(e) => setDeliveryInstructions(e.target.value)}
                    placeholder="Any special instructions for delivery? Gate code, leave at door..."
                    rows={3}
                    className="w-full rounded-xl border border-[#e5e7eb] bg-[#ffffff] text-[#1a1a1a] placeholder-[#9ca3af] px-4 py-3 text-sm focus:outline-none focus:border-[#7a0b10] focus:ring-1 focus:ring-[#7a0b10] transition-colors resize-none"
                  />
                </div>
              </>
            )}

            {restaurant && (
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 border border-[#f5ebe9] bg-[#fffcfb] rounded-xl mt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-[#fcedec] text-[#7a0b10] shrink-0 border border-[#7a0b10]/10">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-[14px] text-[#1a1a1a] mb-0.5 leading-tight">{restaurant.name}</h4>
                    <p className="text-[12px] text-[#6b7280] leading-relaxed">{restaurant.address}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-2 md:mt-0 text-[11px] pl-16 md:pl-0">
                  <span className="text-[#1fae64] font-bold">Open Now</span>
                  <span className="opacity-50 text-[#6b7280]">&bull;</span>
                  <span className="text-[#6b7280] font-medium">11:30 AM - 10:00 PM</span>
                </div>
              </div>
            )}

            {/* ORIGINAL QUOTE ERROR LOGIC RETAINED */}
            {orderType === 'delivery' && quoteError && (
              <div className="p-4 bg-[#fef2f2] border border-[#fca5a5] rounded-xl text-[#ef4444] text-xs font-bold mt-4 flex items-start gap-2.5 ll-pop">
                <span className="text-[14px]">⚠️</span>
                <span className="leading-relaxed">{quoteError}</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-sm font-sans flex items-start justify-between mt-4 animate-in fade-in duration-200">
          <div className="space-y-2">
            <p className="font-extrabold text-[#1a1a1a] flex items-center gap-2">
              <span className="text-[#6b7280] font-medium">Customer:</span> {fullName} ({phone})
            </p>
            <p className="font-extrabold text-[#1a1a1a] flex items-center gap-2">
              <span className="text-[#6b7280] font-medium">Order Type:</span> {orderType === 'delivery' ? 'Delivery' : 'Pickup'}
            </p>
            {orderType === 'delivery' && (
              <p className="font-extrabold text-[#1a1a1a] flex items-center gap-2 leading-relaxed">
                <span className="text-[#6b7280] font-medium">Address:</span> {compiledAddress}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
