'use client';
import { Suspense, useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Fuse from 'fuse.js';
import { restaurantAPI, authAPI } from '@/lib/api';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { showToast, ItemDetailModal, PortalModal } from '@/components/ui';
import Loading from '@/app/loading';
import { Home, Search, X, ShieldCheck, ChefHat, Award, Leaf } from 'lucide-react';

import MenuHero from '@/components/branded/lassi-lounge/menu/MenuHero';
import CategorySidebar from '@/components/branded/lassi-lounge/menu/CategorySidebar';
import DishGrid from '@/components/branded/lassi-lounge/menu/DishGrid';
import { sortCategories } from '@/lib/menuUtils';

const BRANDED_ID = process.env.NEXT_PUBLIC_BRANDED_RESTAURANT_ID || 'lassi-lounge';

const getDishImage = (n) => {
  const name = (n || '').toLowerCase();
  if (name.includes('butter chicken')) return '/images/branded/lassi-lounge/dishes/butter-chicken.jpg';
  if (name.includes('rogan josh') || name.includes('lamb')) return '/images/branded/lassi-lounge/dishes/lamb-rogan-josh.jpg';
  if (name.includes('paneer tikka')) return '/images/branded/lassi-lounge/dishes/paneer-tikka.jpg';
  if (name.includes('biryani')) return '/images/branded/lassi-lounge/dishes/chicken-biryani.jpg';
  if (name.includes('dal makhani')) return '/images/branded/lassi-lounge/dishes/dal-makhani.jpg';
  if (name.includes('lassi')) return '/images/branded/lassi-lounge/dishes/mango-lassi.jpg';
  if (name.includes('roll') || name.includes('spring')) return '/images/branded/lassi-lounge/dishes/veg-spring-rolls.png';
  return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80';
};

function MenuContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryName = searchParams.get('categoryName');

  const { addItem, switchRestaurant, restaurant: cartRestaurant, items, updateQuantity, removeItem } = useCart();
  const { user, isAuthenticated, updateUser } = useAuth();

  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [conflictModal, setConflictModal] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const menuTopRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const [repeatModal, setRepeatModal] = useState(null);
  const [couponApplied, setCouponApplied] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await restaurantAPI.getById(BRANDED_ID);
        setRestaurant(data.data);
        const cats = sortCategories(data.data.menu || []);
        setMenu(cats);
        if (cats.length > 0) {
          const matched = categoryName ? cats.find(c => c.name.toLowerCase() === categoryName.toLowerCase()) : null;
          setActiveCategory(matched ? matched._id : 'all');
        }
      } catch {
        showToast('Failed to load menu. Please refresh.', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [categoryName]);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults(null); return; }
    const allItems = menu.flatMap(cat => (cat.items || []).map(i => ({ ...i, catName: cat.name })));
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      const fuse = new Fuse(allItems, { keys: ['name', 'description', 'catName'], threshold: 0.35 });
      setSearchResults(fuse.search(searchQuery).map(r => r.item));
    }, 200);
  }, [searchQuery, menu]);

  const handleAddToCart = (item, opts = {}) => {
    if (cartRestaurant && cartRestaurant._id !== restaurant?._id) {
      setConflictModal({ item, opts }); return;
    }
    const quantity = opts.quantity || 1;
    const unitPrice = opts.size?.price || item.price;
    const addOnTotal = opts.addOns?.reduce((s, a) => s + (a.price || 0), 0) || 0;
    addItem({
      menuItemId: item._id,
      name: item.name,
      price: unitPrice,
      image: item.image || getDishImage(item.name),
      quantity,
      selectedSize: opts.size || null,
      addOns: opts.addOns || [],
      specialInstructions: opts.instructions || '',
      lineTotal: (unitPrice + addOnTotal) * quantity
    }, restaurant);
    showToast(`${item.name} added to cart`, 'success');
  };

  const handleCartDecrement = (item) => {
    const targetId = item.menuItemId || item._id || item.id;
    const lastIndex = items.map((i, idx) => ({ ...i, originalIdx: idx }))
      .reverse()
      .find(i => {
        const iId = i.menuItemId || i._id || i.id;
        return (targetId && iId && iId === targetId) ||
          (i.name && item.name && i.name.toLowerCase().trim() === item.name.toLowerCase().trim());
      })?.originalIdx;

    if (lastIndex !== undefined) {
      const currentQty = items[lastIndex].quantity || items[lastIndex].qty || 1;
      if (currentQty > 1) updateQuantity(lastIndex, currentQty - 1);
      else removeItem(lastIndex);
    }
  };

  const handleCustomize = (item) => {
    const targetId = item.menuItemId || item._id || item.id;
    const lastCartItem = [...items].reverse().find(i => {
      const iId = i.menuItemId || i._id || i.id;
      return (targetId && iId && iId === targetId) ||
        (i.name && item.name && i.name.toLowerCase().trim() === item.name.toLowerCase().trim());
    });
    if (lastCartItem) {
      setRepeatModal({ item, lastCartItem });
    } else {
      setSelectedItem(item);
    }
  };

  const handleToggleFavorite = async (itemId) => {
    if (!isAuthenticated) {
      showToast('Please login to add favorites', 'info');
      return;
    }
    try {
      const res = await authAPI.toggleFavoriteItem(itemId);
      updateUser({ favoriteItems: res.data });
      showToast('Favorites updated', 'success');
    } catch (err) {
      showToast('Failed to update favorites', 'error');
    }
  };

  if (loading) return <Loading />;
  if (!restaurant) return <div className="text-center py-16 text-[#6b7280]">Menu not available</div>;

  const categories = menu || [];
  const currentCategory = activeCategory === 'all' ? { _id: 'all', name: 'All Items' } : (categories.find(c => c._id === activeCategory) || categories[0]);
  const filteredItems = searchQuery.trim() ? (searchResults || []) : (activeCategory === 'all' ? categories.flatMap(c => c.items || []) : (currentCategory?.items || []));

  return (
    <div className="min-h-screen bg-[#fdfbf7] flex flex-col font-sans">
      <MenuHero />

      <div ref={menuTopRef} className="bg-white border-b border-[#e5e7eb] py-4 sticky lg:relative top-[56px] lg:top-auto z-[60] lg:z-10 shadow-[0_8px_24px_rgba(122,11,16,0.05)]">
        <div className="mx-auto max-w-[1550px] px-4 md:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center text-[13px] text-[#6b7280] font-medium gap-1">
            <button className="flex items-center gap-2 hover:text-[#7a0b10] transition-colors" onClick={() => router.push('/')}>
              <Home className="w-4 h-4 text-[#7a0b10]" /> <span>Home</span>
            </button>
            <span className="text-[#7a0b10]">&gt;</span>
            <span className="text-[#1a1a1a] font-bold">Menu</span>
          </div>
          <div className="relative w-full md:w-[420px] flex items-center gap-2">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9ca3af] ml-2" />
              <input
                type="text"
                placeholder="Search dishes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                maxLength={60}
                className="w-full pl-10 pr-4 py-2 border border-[#e5e7eb] rounded-md text-[13px] focus:outline-none focus:border-[#7a0b10] focus:ring-4 focus:ring-[#7a0b10]/10 transition-all text-[#1a1a1a] placeholder-[#9ca3af] bg-[#ffffff] shadow-sm"
              />
            </div>
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#7a0b10]">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1550px] w-full px-4 md:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Left Sidebar */}
          <div className="w-full lg:w-[240px] shrink-0">
            <div className="lg:sticky lg:top-[72px]">
              <CategorySidebar
                categories={categories}
                activeCategory={activeCategory}
                setActiveCategory={(id) => {
                  if (menuTopRef.current) {
                    const rect = menuTopRef.current.getBoundingClientRect();
                    if (rect.top < 80) window.scrollTo({ top: window.scrollY + rect.top - 80, behavior: 'smooth' });
                  }
                  setActiveCategory(id);
                  setSearchQuery('');
                }}
                setSearchQuery={setSearchQuery}
                searchQuery={searchQuery}
                couponApplied={couponApplied}
                setCouponApplied={setCouponApplied}
              />
            </div>
          </div>

          {/* Center Content */}
          <div className="flex-1 w-full min-w-0">
            {filteredItems.length === 0 ? (
              <div className="text-center py-16 text-[#6b7280]">
                {searchQuery ? `No results for "${searchQuery}"` : 'No items in this category'}
              </div>
            ) : (
              <DishGrid
                filteredItems={filteredItems}
                currentCategory={currentCategory}
                isAuthenticated={isAuthenticated}
                user={user}
                items={items}
                handleCartAdd={handleAddToCart}
                handleCartDecrement={handleCartDecrement}
                toggleFavorite={handleToggleFavorite}
                searchQuery={searchQuery}
                restaurantId={BRANDED_ID}
                onCustomize={handleCustomize}
              />
            )}
          </div>
        </div>
      </div>

      {/* Trust Strip */}
      <div className="bg-[#fcfaf5] border-t border-[#e5e7eb] py-10 mt-auto">
        <div className="mx-auto max-w-[1550px] px-4 md:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-left md:divide-x divide-[#e5e7eb]">
          {[
            { icon: Award, label: '100% Authentic', desc: 'Traditional recipes with authentic taste.' },
            { icon: Leaf, label: 'Fresh Ingredients', desc: 'We use the freshest & highest quality ingredients.' },
            { icon: ChefHat, label: 'Expert Chefs', desc: 'Our chefs bring passion & perfection in every dish.' },
            { icon: ShieldCheck, label: 'Hygienic Kitchen', desc: 'Clean, safe & hygienic kitchen you can trust.' }
          ].map((feat, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3 sm:gap-4 px-0 md:px-4 ll-reveal">
              <div className="p-3 bg-[#ffffff] border border-[#e5e7eb] rounded-xl shadow-sm shrink-0">
                <feat.icon className="h-6 w-6 text-[#7a0b10] stroke-[1.5]" />
              </div>
              <div>
                <h4 className="text-[12px] font-black text-[#1a1a1a] uppercase tracking-wider">{feat.label}</h4>
                <p className="text-[11px] text-[#6b7280] mt-1.5 leading-relaxed">{feat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onAdd={(item, quantity, selectedSize, selectedAddOns, specialInstructions) => {
            handleAddToCart(item, { size: selectedSize, addOns: selectedAddOns, instructions: specialInstructions, quantity });
          }}
        />
      )}

      {repeatModal && (
        <RepeatCustomizationModal
          isOpen={true}
          onClose={() => setRepeatModal(null)}
          lastCartItem={repeatModal.lastCartItem}
          onRepeat={() => {
            handleAddToCart(repeatModal.item, {
              size: repeatModal.lastCartItem.selectedSize,
              addOns: repeatModal.lastCartItem.addOns,
              instructions: repeatModal.lastCartItem.specialInstructions
            });
            setRepeatModal(null);
          }}
          onChooseNew={() => { setSelectedItem(repeatModal.item); setRepeatModal(null); }}
        />
      )}

      {conflictModal && (
        <PortalModal isOpen={true} onClose={() => setConflictModal(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm mx-auto">
            <h3 className="text-lg font-bold text-[#1f2937] mb-2">Start a new cart?</h3>
            <p className="text-sm text-[#6b7280] mb-4">Your cart has items from another order. Adding this will clear your current cart.</p>
            <div className="flex gap-3">
              <button onClick={() => setConflictModal(null)} className="flex-1 py-2 rounded-xl border border-[#e5e7eb] text-sm font-bold text-[#6b7280]">Cancel</button>
              <button onClick={() => { switchRestaurant(restaurant); handleAddToCart(conflictModal.item, conflictModal.opts); setConflictModal(null); }}
                className="flex-1 py-2 rounded-xl bg-[#7a0b10] text-white text-sm font-bold">Yes, clear cart</button>
            </div>
          </div>
        </PortalModal>
      )}
    </div>
  );
}

// separate component for Repeat Modal
function RepeatCustomizationModal({ isOpen, onClose, lastCartItem, onRepeat, onChooseNew }) {
  if (!isOpen || !lastCartItem) return null;
  return (
    <PortalModal isOpen={isOpen} onClose={onClose} title="Repeat Customization?" size="sm">
      <div className="space-y-5 text-[#1a1a1a]">
        <p className="text-[14px] text-[#4b5563] font-sans leading-relaxed">
          You already have this item in the cart. Would you like to repeat it or customize it again?
        </p>
        <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-xl p-4 shadow-sm">
          <h4 className="text-[15px] font-extrabold text-[#1a1a1a] mb-1 font-sans">{lastCartItem.name}</h4>
          {lastCartItem.selectedSize && (
            <p className="text-[13px] text-[#7a0b10] font-bold">Size: {lastCartItem.selectedSize.name}</p>
          )}
          {lastCartItem.addOns?.length > 0 && (
            <p className="text-[12px] text-[#4b5563] mt-2 font-sans leading-snug">
              <span className="font-bold text-[#1a1a1a]">Add-ons:</span> {lastCartItem.addOns.map(a => a.name).join(', ')}
            </p>
          )}
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onChooseNew} className="flex-1 bg-[#ffffff] text-[#7a0b10] border border-[#7a0b10] hover:bg-[#fffaf9] font-bold py-3 rounded-lg text-[13px] uppercase tracking-wider transition-colors">
            Choose New
          </button>
          <button onClick={onRepeat} className="flex-1 bg-[#7a0b10] hover:bg-[#5e080c] text-[#ffffff] font-bold py-3 rounded-lg text-[13px] uppercase tracking-wider shadow-md transition-colors">
            Repeat Last
          </button>
        </div>
      </div>
    </PortalModal>
  );
}

// suspense Wrapper for build safety
export default function MenuPage() {
  return (
    <Suspense fallback={<Loading />}>
      <MenuContent />
    </Suspense>
  );
}