/**
 * category3DHelper.js
 * Centralized utility mapping menu categories to their branded 3D pop-out cutout assets.
 * Exactly mirrors the category-to-asset mapping used in the Customer Flutter Mobile App:
 * `single_restaurant_mobile/lib/utils/image_helper.dart`
 */

const BASE_PATH = '/images/branded/lassi-lounge/categories';

export const CATEGORY_3D_ASSETS = {
  thali: `${BASE_PATH}/special_thali_3d.png`,
  momos: `${BASE_PATH}/momos_3d.png`,
  amritsar: `${BASE_PATH}/amritsar_special_3d.png`,
  riceCombo: `${BASE_PATH}/rice_combo_3d.png`,
  parathas: `${BASE_PATH}/parathas_3d.png`,
  nonVegAppetizer: `${BASE_PATH}/non_veg_appetizer_3d.png`,
  riceDishes: `${BASE_PATH}/rice_dishes_3d.png`,
  snacks: `${BASE_PATH}/snacks_3d.png`,
  nonVegMain: `${BASE_PATH}/non_veg_main_3d.png`,
  vegMain: `${BASE_PATH}/veg_main_3d.png`,
  desserts: `${BASE_PATH}/desserts_3d.png`,
  beverages: `${BASE_PATH}/beverages_3d.png`,
  breads: `${BASE_PATH}/breads_3d.png`,
  all: `${BASE_PATH}/special_thali_3d.png`,
};

/**
 * Returns the exact 3D transparent cutout asset URL for any category.
 * Accepts either a string category name or category object ({ name, label, image, _id }).
 *
 * @param {string|object} category
 * @returns {string}
 */
export function getCategory3DImage(category) {
  if (!category) return CATEGORY_3D_ASSETS.vegMain;

  let name = '';
  let customImage = '';

  if (typeof category === 'string') {
    name = category.toLowerCase().trim();
  } else if (typeof category === 'object') {
    name = (category.name || category.label || category.title || '').toLowerCase().trim();
    if (category.image && typeof category.image === 'string' && category.image.startsWith('http')) {
      customImage = category.image;
    }
  }

  if (name === 'all' || name === 'all items' || name === 'explore all') {
    return CATEGORY_3D_ASSETS.all;
  }

  // 1. Thali
  if (name.includes('thali') || name.includes('platter')) {
    return CATEGORY_3D_ASSETS.thali;
  }

  // 2. Momos
  if (name.includes('momo') || name.includes('dumpling')) {
    return CATEGORY_3D_ASSETS.momos;
  }

  // 3. Amritsar Special / Kulcha / Bhature
  if (name.includes('amritsar') || name.includes('kulcha') || name.includes('bhature') || name.includes('chole')) {
    return CATEGORY_3D_ASSETS.amritsar;
  }

  // 4. Rice Combo
  if (name.includes('combo') || name.includes('bowl')) {
    return CATEGORY_3D_ASSETS.riceCombo;
  }

  // 5. Parathas
  if (name.includes('paratha')) {
    return CATEGORY_3D_ASSETS.parathas;
  }

  // 6. Non-Veg Appetizers / Chicken Tikka
  if (
    (name.includes('non') || name.includes('chicken') || name.includes('meat')) &&
    (name.includes('appetizer') || name.includes('snack') || name.includes('starter') || name.includes('tikka') || name.includes('kabab') || name.includes('kebab'))
  ) {
    return CATEGORY_3D_ASSETS.nonVegAppetizer;
  }

  // 7. Rice Dishes / Biryani
  if (name.includes('rice') || name.includes('biryani') || name.includes('pulao')) {
    return CATEGORY_3D_ASSETS.riceDishes;
  }

  // 8. Appetizers & Snacks / Chaat / Samosa
  if (
    name.includes('appetizer') ||
    name.includes('snack') ||
    name.includes('starter') ||
    name.includes('samosa') ||
    name.includes('chaat') ||
    name.includes('pakora') ||
    name.includes('roll')
  ) {
    return CATEGORY_3D_ASSETS.snacks;
  }

  // 9. Non-Veg Main Course
  if (
    name.includes('non') ||
    name.includes('chicken') ||
    name.includes('mutton') ||
    name.includes('goat') ||
    name.includes('meat') ||
    name.includes('fish') ||
    name.includes('seafood') ||
    name.includes('tandoori')
  ) {
    return CATEGORY_3D_ASSETS.nonVegMain;
  }

  // 10. Desserts / Sweets
  if (
    name.includes('dessert') ||
    name.includes('sweet') ||
    name.includes('mithai') ||
    name.includes('jamun') ||
    name.includes('kulfi') ||
    name.includes('ice cream') ||
    name.includes('halwa') ||
    name.includes('rasgulla')
  ) {
    return CATEGORY_3D_ASSETS.desserts;
  }

  // 11. Beverages / Lassi / Shakes / Chai
  if (
    name.includes('beverage') ||
    name.includes('drink') ||
    name.includes('lassi') ||
    name.includes('shake') ||
    name.includes('tea') ||
    name.includes('chai') ||
    name.includes('coffee') ||
    name.includes('juice') ||
    name.includes('soda')
  ) {
    return CATEGORY_3D_ASSETS.beverages;
  }

  // 12. Breads / Naan / Roti
  if (name.includes('bread') || name.includes('naan') || name.includes('roti') || name.includes('kulcha')) {
    return CATEGORY_3D_ASSETS.breads;
  }

  // Fallback to custom image if valid
  if (customImage) return customImage;

  // 13. Default Veg Main Course
  return CATEGORY_3D_ASSETS.vegMain;
}
