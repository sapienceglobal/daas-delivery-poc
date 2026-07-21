'use client';

import { useState } from 'react';
import { Heart, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import { showToast } from '@/components/ui';

const isSingleMode = process.env.NEXT_PUBLIC_SINGLE_RESTAURANT_MODE === 'true';
export default function FavoritesTab({ user, updateUser }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(isSingleMode ? 'items' : 'restaurants'); // 'restaurants' or 'items'

  const favoriteRestaurants = user?.favoriteRestaurants || [];
  const favoriteItems = user?.favoriteItems || [];

  const handleRemoveRestaurant = async (e, id) => {
    e.stopPropagation();
    try {
      // Need a proper API method, but for now we toggle it
      // await authAPI.toggleFavoriteRestaurant(id); // Wait, this method is not in api.js yet!
      showToast('Backend integration pending for removing favorites', 'info');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[24px] font-black text-[#1a1a1a]">Favorites</h2>
          <p className="text-[14px] text-[#6b7280]">Your saved {isSingleMode ? 'dishes' : 'restaurants and dishes'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-[#eadfdb] pb-px">
        {!isSingleMode && (
          <button
            onClick={() => setActiveTab('restaurants')}
            className={`pb-3 text-[14px] font-bold transition-all relative ${
              activeTab === 'restaurants'
                ? 'text-[#7a0b10] border-b-2 border-[#7a0b10]'
                : 'text-[#6b7280] hover:text-[#1a1a1a]'
            }`}
          >
            Restaurants ({favoriteRestaurants.length})
          </button>
        )}
        <button
          onClick={() => setActiveTab('items')}
          className={`pb-3 text-[14px] font-bold transition-all relative ${
            activeTab === 'items'
              ? 'text-[#7a0b10] border-b-2 border-[#7a0b10]'
              : 'text-[#6b7280] hover:text-[#1a1a1a]'
          }`}
        >
          Menu Items ({favoriteItems.length})
        </button>
      </div>

      {/* Content */}
      <div className="pt-2">
        {activeTab === 'restaurants' && (
          favoriteRestaurants.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#eadfdb] p-12 text-center shadow-sm">
              <div className="w-16 h-16 rounded-full bg-[#fdf2f2] flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-[#ef4444]" />
              </div>
              <h3 className="text-[18px] font-bold text-[#1a1a1a] mb-2">No favorite restaurants yet</h3>
              <p className="text-[14px] text-[#6b7280] mb-6">Explore the marketplace and save your favorites.</p>
              <button
                onClick={() => router.push('/')}
                className="h-11 px-4 py-2 rounded-lg bg-[#7a0b10] text-white text-[13px] font-black uppercase tracking-wider hover:bg-[#680307] transition-colors inline-flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                Browse Restaurants
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {favoriteRestaurants.map(restaurant => (
                <div 
                  key={restaurant._id}
                  onClick={() => router.push(`/customer/restaurant/${restaurant._id}`)}
                  className="bg-white rounded-2xl border border-[#eadfdb] shadow-sm overflow-hidden cursor-pointer hover:shadow-md hover:border-[#b47b80] transition-all group"
                >
                  <div className="h-32 bg-gray-200 relative overflow-hidden">
                    <img 
                      src={restaurant.banner || '/images/placeholders/restaurant.jpg'} 
                      alt={restaurant.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <button 
                      onClick={(e) => handleRemoveRestaurant(e, restaurant._id)}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-[#ef4444] hover:bg-white transition-colors shadow-sm"
                    >
                      <Heart className="h-4 w-4 fill-current" />
                    </button>
                  </div>
                  <div className="p-4">
                    <h3 className="text-[16px] font-bold text-[#1a1a1a]">{restaurant.name}</h3>
                    <p className="text-[13px] text-[#6b7280] mt-1">{restaurant.cuisine || 'Restaurant'}</p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {activeTab === 'items' && (
          favoriteItems.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#eadfdb] p-12 text-center shadow-sm">
              <div className="w-16 h-16 rounded-full bg-[#fdf2f2] flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-[#ef4444]" />
              </div>
              <h3 className="text-[18px] font-bold text-[#1a1a1a] mb-2">No favorite items yet</h3>
              <p className="text-[14px] text-[#6b7280] mb-6">Heart your favorite dishes while browsing menus.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {favoriteItems.map(item => (
                <div 
                  key={item._id}
                  className="bg-white rounded-2xl border border-[#eadfdb] shadow-sm p-4 flex gap-4"
                >
                  <div className="w-20 h-20 rounded-xl bg-gray-100 shrink-0 overflow-hidden">
                    <img 
                      src={item.image || (item.images && item.images[0]) || '/images/placeholders/food.jpg'} 
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="text-[15px] font-bold text-[#1a1a1a] truncate">{item.name}</h3>
                      <button className="text-[#ef4444]">
                        <Heart className="h-4 w-4 fill-current" />
                      </button>
                    </div>
                    <p className="text-[14px] font-bold text-[#65a30d] mt-1">${item.price?.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
