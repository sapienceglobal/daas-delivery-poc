'use client';

export default function CustomizationForm({
  item,
  selectedSize,
  setSelectedSize,
  selectedAddOns,
  setSelectedAddOns,
  specialInstructions,
  setSpecialInstructions,
  isSingleRestaurant
}) {
  // Default sizes if none are present in item object
  const sizeOptions = item.sizeVariations?.length > 0
    ? item.sizeVariations
    : [
        { name: 'Half Portion', price: item.price - 5 > 0 ? item.price - 5 : 8.99 },
        { name: 'Full Portion', price: item.price },
        { name: 'Family Portion (Serves 4)', price: item.price + 11 }
      ];

  // Default addons if none are present in item object
  const addOnOptions = item.addOns?.length > 0
    ? item.addOns
    : [
        { name: 'Extra Paneer', price: 3.00 },
        { name: 'Extra Cheese', price: 2.00 },
        { name: 'Mint Chutney', price: 1.00 },
        { name: 'Mayonnaise Dip', price: 1.00 },
        { name: 'Tandoori Roti (2 pcs)', price: 2.50 }
      ];

  const handleAddOnChange = (addon) => {
    const isChecked = selectedAddOns.some(a => a.name === addon.name);
    if (isChecked) {
      setSelectedAddOns(selectedAddOns.filter(a => a.name !== addon.name));
    } else {
      setSelectedAddOns([...selectedAddOns, addon]);
    }
  };

  const primaryColorHex = isSingleRestaurant ? '#7a0b10' : '#6b52ff';

  return (
    <div className="space-y-8 select-none">
      
      {/* Customize Header with Golden Accents */}
      <div className="flex items-center justify-center gap-3 py-2">
        <div className="flex items-center gap-1.5 opacity-80">
          <div className="h-[1.5px] bg-[#e8a020] w-8 md:w-16" />
          <div className="w-1.5 h-1.5 rotate-45 bg-[#e8a020]" />
        </div>
        <h2 className="text-[26px] md:text-[28px] font-serif font-bold text-[#1a1a1a] text-center tracking-wide px-2">
          Customize Your {item.name}
        </h2>
        <div className="flex items-center gap-1.5 opacity-80">
          <div className="w-1.5 h-1.5 rotate-45 bg-[#e8a020]" />
          <div className="h-[1.5px] bg-[#e8a020] w-8 md:w-16" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Column 1: Choose Size */}
        <div className="rounded-xl border border-[#e5e7eb] bg-[#ffffff] p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-[#e8a020] shrink-0">
              {/* Tag/Label icon matching image */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                <line x1="7" y1="7" x2="7.01" y2="7"></line>
              </svg>
            </span>
            <h3 className="font-bold text-[16px] text-[#1a1a1a] flex items-center gap-2">
              <span className="text-[#9ca3af] font-medium text-[15px]">1</span> Choose Size
            </h3>
          </div>

          <div className="space-y-4">
            {sizeOptions.map((size, idx) => {
              const isSelected = selectedSize?.name === size.name;
              return (
                <label
                  key={idx}
                  className="flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-1">
                    <input
                      type="radio"
                      name="size-option"
                      checked={isSelected}
                      onChange={() => setSelectedSize(size)}
                      className="sr-only"
                    />
                    <div className={`w-[18px] h-[18px] rounded-full border-[2px] flex items-center justify-center transition-all ${
                      isSelected
                        ? `border-[${primaryColorHex}]`
                        : 'border-[#d1d5db] group-hover:border-[#9ca3af]'
                    }`}
                    style={isSelected ? { borderColor: primaryColorHex } : {}}
                    >
                      {isSelected && (
                        <div 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: primaryColorHex }} 
                        />
                      )}
                    </div>
                    <span className="text-[14px] font-medium text-[#1a1a1a]">{size.name}</span>
                  </div>
                  <span className="text-[14px] font-bold text-[#1a1a1a]">${size.price.toFixed(2)}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Column 2: Add Extras */}
        <div className="rounded-xl border border-[#e5e7eb] bg-[#ffffff] p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-[#e8a020] shrink-0">
              {/* Chef Hat icon matching image */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"></path>
                <line x1="6" y1="17" x2="18" y2="17"></line>
              </svg>
            </span>
            <h3 className="font-bold text-[16px] text-[#1a1a1a] flex items-center gap-2">
              <span className="text-[#9ca3af] font-medium text-[15px]">2</span> Add Extras (Optional)
            </h3>
          </div>

          <div className="space-y-4">
            {addOnOptions.map((addon, idx) => {
              const isChecked = selectedAddOns.some(a => a.name === addon.name);
              return (
                <label
                  key={idx}
                  className="flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleAddOnChange(addon)}
                      className="sr-only"
                    />
                    <div className={`w-[18px] h-[18px] rounded-[4px] border-[2px] flex items-center justify-center transition-all ${
                      isChecked
                        ? `border-[${primaryColorHex}]`
                        : 'border-[#d1d5db] bg-[#ffffff] group-hover:border-[#9ca3af]'
                    }`}
                    style={isChecked ? { borderColor: primaryColorHex, backgroundColor: primaryColorHex } : {}}
                    >
                      {isChecked && (
                        <svg className="w-3 h-3 text-[#ffffff]" fill="none" stroke="currentColor" strokeWidth="3.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="text-[14px] font-medium text-[#1a1a1a]">{addon.name}</span>
                  </div>
                  <span className="text-[14px] font-bold text-[#1a1a1a]">${addon.price.toFixed(2)}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Column 3: Special Instructions */}
        <div className="rounded-xl border border-[#e5e7eb] bg-[#ffffff] p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-[#e8a020] shrink-0">
              {/* Document/Notepad icon matching image */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </span>
            <h3 className="font-bold text-[16px] text-[#1a1a1a] flex items-center gap-2">
              <span className="text-[#9ca3af] font-medium text-[15px]">3</span> Special Instructions
            </h3>
          </div>

          <div>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="Any special requests? (e.g. No onion, less spicy, extra chutney...)"
              className="w-full h-[140px] rounded-lg border border-[#e5e7eb] bg-[#fafafa] p-4 text-[13px] text-[#1a1a1a] placeholder-[#9ca3af] focus:outline-none focus:border-[#7a0b10] transition-colors resize-none"
            />
          </div>
        </div>

      </div>
    </div>
  );
}