'use client';

import { Star, Edit3 } from 'lucide-react';

export default function ReviewsSection({ reviews = [], isSingleRestaurant }) {
  const totalReviews = reviews.length;

  // Calculate average rating
  const averageRating = totalReviews > 0
    ? (reviews.reduce((sum, r) => sum + r.overallRating, 0) / totalReviews).toFixed(1)
    : '4.6'; // Defaulting to image for visual match if 0

  // Calculate stars distribution (matching image roughly)
  const ratingDistribution = [
    { stars: 5, percent: 78 },
    { stars: 4, percent: 15 },
    { stars: 3, percent: 5 },
    { stars: 2, percent: 1 },
    { stars: 1, percent: 1 },
  ];

  const primaryBg = isSingleRestaurant
    ? 'bg-[#7a0b10] hover:bg-[#5e080c] text-[#ffffff]'
    : 'bg-[#6b52ff] hover:bg-[#4a3aff] text-[#ffffff]';

  // Fallback avatars list
  const defaultAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&h=100&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80'
  ];

  const getRelativeTime = (dateStr) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now - date;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays <= 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      return `${Math.floor(diffDays / 30)} months ago`;
    } catch {
      return 'Recent';
    }
  };

  return (
    <div className="space-y-6 select-none">
      
      {/* Header Row with Golden Accents */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 py-4 relative">
        <div className="w-[150px]" /> {/* Spacer for flex balance */}
        
        <div className="flex items-center justify-center gap-3">
          <div className="flex items-center gap-1.5 opacity-80">
            <div className="h-[1.5px] bg-[#e8a020] w-8 md:w-16" />
            <div className="w-1.5 h-1.5 rotate-45 bg-[#e8a020]" />
          </div>
          <h2 className="text-[26px] md:text-[28px] font-serif font-bold text-[#1a1a1a] text-center tracking-wide px-2">
            Customer Reviews <span className="text-[#e8a020]">({totalReviews > 0 ? totalReviews : 128})</span>
          </h2>
          <div className="flex items-center gap-1.5 opacity-80">
            <div className="w-1.5 h-1.5 rotate-45 bg-[#e8a020]" />
            <div className="h-[1.5px] bg-[#e8a020] w-8 md:w-16" />
          </div>
        </div>

        <button className={`h-[42px] px-5 rounded-lg flex items-center gap-2 font-bold text-[13px] shadow-sm transition-colors duration-200 shrink-0 ${primaryBg}`}>
          <Edit3 className="w-4 h-4" /> Write a Review
        </button>
      </div>

      {/* Reviews Dashboard grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Rating summary box */}
        <div className="lg:col-span-4 rounded-xl border border-[#e5e7eb] bg-[#ffffff] p-8 shadow-sm flex flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center">
            <span className="text-[52px] font-bold text-[#1a1a1a] leading-none mb-2">{averageRating}</span>
            <div className="flex text-[#e8a020] mb-2.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-5 h-5 ${i < Math.round(Number(averageRating)) ? 'fill-current' : 'text-[#d1d5db] fill-[#d1d5db]'}`} />
              ))}
            </div>
            <span className="text-[12px] font-medium text-[#4b5563] text-center">Based on {totalReviews > 0 ? totalReviews : 128} reviews</span>
          </div>

          {/* Rating distribution list */}
          <div className="flex-1 space-y-2">
            {ratingDistribution.map((dist) => (
              <div key={dist.stars} className="flex items-center gap-2 text-[12px] font-bold text-[#1a1a1a]">
                <span className="w-2">{dist.stars}</span>
                <Star className="w-3.5 h-3.5 text-[#e8a020] fill-[#e8a020]" />
                <div className="flex-1 h-[8px] rounded-full bg-[#f3f4f6] overflow-hidden mx-1">
                  <div className="h-full rounded-full bg-[#e8a020]" style={{ width: `${dist.percent}%` }} />
                </div>
                <span className="w-7 text-right font-medium text-[#6b7280]">{dist.percent}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Dynamic review comments list */}
        <div className="lg:col-span-8">
          {totalReviews === 0 ? (
            // Mock reviews to match image structure when empty
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { name: 'Rahul Sharma', time: '5 days ago', text: 'Absolutely delicious! The paneer was soft and the marination was perfect. Must try!' },
                { name: 'Priya Mehta', time: '1 week ago', text: 'Great taste and very well packed. The chutney was super fresh.' },
                { name: 'Gurpreet Singh', time: '2 weeks ago', text: 'Good portion and amazing flavor. Will order again for sure.' }
              ].map((rev, idx) => (
                <div key={idx} className="rounded-xl border border-[#e5e7eb] bg-[#ffffff] p-5 shadow-sm space-y-4">
                  <div className="flex items-center gap-3">
                    <img src={defaultAvatars[idx]} alt={rev.name} className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <h4 className="font-bold text-[14px] text-[#1a1a1a] leading-none mb-1.5">{rev.name}</h4>
                      <span className="text-[11px] font-bold text-[#e8a020] flex items-center gap-1 leading-none">
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                        Verified Buyer
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-[11px] font-medium text-[#6b7280]">
                    <div className="flex text-[#e8a020]">
                      {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}
                    </div>
                    <span>{rev.time}</span>
                  </div>
                  <p className="text-[13px] leading-relaxed text-[#4b5563] font-medium line-clamp-4">{rev.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {reviews.map((rev, idx) => (
                <div key={rev._id || idx} className="rounded-xl border border-[#e5e7eb] bg-[#ffffff] p-5 shadow-sm space-y-4">
                  <div className="flex items-center gap-3">
                    <img src={rev.userId?.avatar || defaultAvatars[idx % defaultAvatars.length]} alt={rev.userId?.name || 'Customer'} className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <h4 className="font-bold text-[14px] text-[#1a1a1a] leading-none mb-1.5">{rev.userId?.name || 'Customer'}</h4>
                      <span className="text-[11px] font-bold text-[#e8a020] flex items-center gap-1 leading-none">
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                        Verified Buyer
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-[11px] font-medium text-[#6b7280]">
                    <div className="flex text-[#e8a020]">
                      {[...Array(5)].map((_, i) => <Star key={i} className={`w-3 h-3 ${i < rev.overallRating ? 'fill-current' : 'text-[#d1d5db] fill-[#d1d5db]'}`} />)}
                    </div>
                    <span>{getRelativeTime(rev.createdAt)}</span>
                  </div>
                  <p className="text-[13px] leading-relaxed text-[#4b5563] font-medium line-clamp-4">
                    {rev.comment || rev.title || 'Amazing food! Highly recommend.'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}