export const CATEGORY_ORDER = [
  'Appetizers / Snacks',
  'Non Veg Appetizer',
  'Veg Main Course',
  'Non Veg Main Course',
  'Amritsar Special',
  'Special Thali',
  'Rice Combo',
  'Rice Dishes',
  'Naan / Roti',
  'Desserts',
  "Paratha's",
  'Momos'
];

export const sortCategories = (categories = []) => {
  return [...categories].sort((a, b) => {
    const aName = a.name?.trim() || '';
    const bName = b.name?.trim() || '';
    
    let aIndex = CATEGORY_ORDER.findIndex(c => c.toLowerCase() === aName.toLowerCase());
    let bIndex = CATEGORY_ORDER.findIndex(c => c.toLowerCase() === bName.toLowerCase());
    
    // If not found in the explicit order, put it at the end
    if (aIndex === -1) aIndex = 999;
    if (bIndex === -1) bIndex = 999;
    
    if (aIndex !== bIndex) {
      return aIndex - bIndex;
    }
    
    // If both are not in the predefined list, sort alphabetically
    return aName.localeCompare(bName);
  });
};
