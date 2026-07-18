/**
 * useCheckoutTheme — single source of truth for every color/style pair that
 * previously repeated as `isSingleRestaurantMode ? 'X' : 'Y'` across the
 * checkout page (30+ times in the original file). Every checkout section
 * calls this once and reads named keys (t.primaryBtn, t.cardWrap, etc.)
 * instead of re-deriving the ternary locally — that's what keeps each
 * section file short and keeps the two modes visually consistent.
 *
 * Single-restaurant values match the Lassi Lounge brand exactly
 * (#7a0b10 = primary-800, matching src/styles/brand/lassi-lounge.css).
 * Enterprise/marketplace values match the platform's layout style,
 * using purple (#6b52ff) as the primary brand accent.
 */
export function useCheckoutTheme(isSingleRestaurantMode) {
  if (isSingleRestaurantMode) {
    return {
      pageBg: 'bg-[#fdfbf7]',
      pageText: 'text-[#1a1a1a]',
      stepperBg: 'bg-white border-[#e5e7eb]',
      stepActive: 'bg-[#7a0b10] text-white ring-4 ring-[#7a0b10]/20',
      stepInactive: 'bg-white border-2 border-[#e5e7eb] text-[#6b7280]',
      labelActive: 'text-[#7a0b10]',
      labelInactive: 'text-[#6b7280]',
      connectorInactive: 'bg-[#e5e7eb] border-dashed border-t',
      cardWrap: 'bg-white border-[#e5e7eb]',
      iconBadge: 'bg-[#7a0b10]/10 text-[#7a0b10]',
      accentText: 'text-[#7a0b10]',
      accentHex: '#7a0b10',
      tabSelected: 'bg-[#7a0b10]/5 border-[#7a0b10] text-[#7a0b10]',
      tabUnselected: 'bg-white border-[#e5e7eb] text-[#1a1a1a] hover:border-[#7a0b10]/30',
      checkBadge: 'bg-[#7a0b10]',
      locBtn: 'bg-white hover:bg-[#7a0b10]/5 border-[#7a0b10]/20 text-[#7a0b10]',
      savedChip: 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700',
      input: 'border-slate-200 bg-white text-[#1a1a1a] focus:border-[#7a0b10] focus:ring-1 focus:ring-[#7a0b10]',
      restaurantCard: 'bg-[#fcfaf5] border-[#7a0b10]/15',
      restaurantIcon: 'bg-white border-[#7a0b10]/20 text-[#7a0b10]',
      primaryBtn: 'bg-[#7a0b10] hover:bg-[#5e080c] text-white',
      freeDeliveryPending: 'bg-[#7a0b10]/5 border-[#7a0b10]/20 text-[#7a0b10]',
      totalAmountColor: 'text-[#7a0b10]',
      qtyBorder: 'border-gray-200',
      qtyBtn: 'text-[#7a0b10] hover:bg-gray-50',
      dividerBorder: 'border-gray-200/60',
      mutedText: 'text-[#6b7280]',
    };
  }

  return {
    pageBg: 'bg-[#f9fafb]',
    pageText: 'text-[#1a1a1a]',
    stepperBg: 'bg-white border-[#e5e7eb]',
    stepActive: 'bg-[#6b52ff] text-white ring-4 ring-[#6b52ff]/20',
    stepInactive: 'bg-white border-2 border-[#e5e7eb] text-[#6b7280]',
    labelActive: 'text-[#6b52ff]',
    labelInactive: 'text-[#6b7280]',
    connectorInactive: 'bg-[#e5e7eb] border-dashed border-t',
    cardWrap: 'bg-white border-[#e5e7eb]',
    iconBadge: 'bg-[#6b52ff]/10 text-[#6b52ff]',
    accentText: 'text-[#6b52ff]',
    accentHex: '#6b52ff',
    tabSelected: 'bg-[#6b52ff]/5 border-[#6b52ff] text-[#6b52ff]',
    tabUnselected: 'bg-white border-[#e5e7eb] text-[#1a1a1a] hover:border-[#6b52ff]/30',
    checkBadge: 'bg-[#6b52ff]',
    locBtn: 'bg-white hover:bg-[#6b52ff]/5 border-[#6b52ff]/20 text-[#6b52ff]',
    savedChip: 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700',
    input: 'border-slate-200 bg-white text-[#1a1a1a] focus:border-[#6b52ff] focus:ring-1 focus:ring-[#6b52ff]',
    restaurantCard: 'bg-[#fcfaf5] border-gray-200',
    restaurantIcon: 'bg-white border-gray-200 text-[#6b52ff]',
    primaryBtn: 'bg-[#6b52ff] hover:bg-[#4a3aff] text-white',
    freeDeliveryPending: 'bg-[#6b52ff]/5 border-[#6b52ff]/20 text-[#6b52ff]',
    totalAmountColor: 'text-[#1a1a1a]',
    qtyBorder: 'border-gray-200',
    qtyBtn: 'text-[#6b52ff] hover:bg-gray-50',
    dividerBorder: 'border-gray-200/60',
    mutedText: 'text-[#6b7280]',
  };
}