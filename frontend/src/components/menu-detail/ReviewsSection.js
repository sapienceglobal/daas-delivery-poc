'use client';

import { useState, useEffect, useMemo } from 'react';
import { Star, Edit3, Trash2, Loader2, Check, MessageSquare } from 'lucide-react';
import { reviewAPI } from '@/lib/api';
import { showToast, Modal, ConfirmDialog } from '@/components/ui';

export default function ReviewsSection({ 
  itemId, 
  restaurantId, 
  reviews: initialReviews = [], 
  isSingleRestaurant,
  user,
  isAuthenticated
}) {
  const [reviewsList, setReviewsList] = useState(initialReviews);
  const [userReview, setUserReview] = useState(null);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [formData, setFormData] = useState({
    rating: 5,
    title: '',
    comment: ''
  });

  // Calculate real rating stats dynamically from real reviewsList
  const computedStats = useMemo(() => {
    if (!reviewsList || reviewsList.length === 0) {
      return {
        averageRating: '0.0',
        totalReviews: 0,
        ratingDistribution: [5, 4, 3, 2, 1].map(stars => ({ stars, count: 0, percent: 0 }))
      };
    }

    const total = reviewsList.length;
    let sum = 0;
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    reviewsList.forEach(r => {
      const val = Number(r.overallRating || r.foodRating || r.rating || 5);
      const star = Math.min(5, Math.max(1, Math.round(val)));
      counts[star] = (counts[star] || 0) + 1;
      sum += val;
    });

    const avg = (sum / total).toFixed(1);
    const ratingDistribution = [5, 4, 3, 2, 1].map(stars => ({
      stars,
      count: counts[stars] || 0,
      percent: Math.round(((counts[stars] || 0) / total) * 100)
    }));

    return {
      averageRating: avg,
      totalReviews: total,
      ratingDistribution
    };
  }, [reviewsList]);

  const loadReviewsData = async () => {
    if (!itemId) return;
    try {
      setLoading(true);
      const res = await reviewAPI.getItemReviews(itemId);
      if (res?.data) {
        setReviewsList(res.data);
      }

      // Check for current user's review if logged in
      if (isAuthenticated && user) {
        const found = (res?.data || []).find(
          (r) => (r.userId?._id || r.userId) === user._id
        );
        if (found) {
          setUserReview(found);
        } else {
          try {
            const myRes = await reviewAPI.getMyItemReview(itemId);
            setUserReview(myRes?.data || null);
          } catch {
            setUserReview(null);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load item reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviewsData();
  }, [itemId, isAuthenticated, user?._id]);

  // Open Write or Edit Review Modal
  const handleOpenModal = () => {
    if (!isAuthenticated) {
      return showToast('Please login to write a review', 'warning');
    }

    if (userReview) {
      setFormData({
        rating: userReview.overallRating || userReview.foodRating || 5,
        title: userReview.title || '',
        comment: userReview.comment || ''
      });
    } else {
      setFormData({
        rating: 5,
        title: '',
        comment: ''
      });
    }
    setModalOpen(true);
  };

  // Submit/Update Review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!formData.comment || formData.comment.trim().length < 5) {
      return showToast('Please enter a review comment (min 5 characters)', 'error');
    }

    setSubmitting(true);
    try {
      if (userReview) {
        // Update existing review
        await reviewAPI.update(userReview._id, {
          rating: formData.rating,
          title: formData.title,
          comment: formData.comment
        });
        showToast('Your review has been updated!', 'success');
      } else {
        // Create new review
        await reviewAPI.create({
          itemId,
          restaurantId,
          rating: formData.rating,
          title: formData.title,
          comment: formData.comment
        });
        showToast('Thank you! Your review has been published.', 'success');
      }
      setModalOpen(false);
      loadReviewsData();
    } catch (err) {
      showToast(err.message || 'Failed to submit review', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Trigger Delete Confirmation Dialog (Uses Website Custom ConfirmDialog)
  const promptDeleteReview = () => {
    setConfirmDeleteOpen(true);
  };

  // Perform Delete Action
  const handleConfirmDelete = async () => {
    if (!userReview) return;

    setDeleting(true);
    try {
      await reviewAPI.delete(userReview._id);
      showToast('Your review has been deleted', 'success');
      setUserReview(null);
      setConfirmDeleteOpen(false);
      setModalOpen(false);
      loadReviewsData();
    } catch (err) {
      showToast(err.message || 'Failed to delete review', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const primaryBg = isSingleRestaurant
    ? 'bg-[#7a0b10] hover:bg-[#5e080c] text-[#ffffff]'
    : 'bg-[#6b52ff] hover:bg-[#4a3aff] text-[#ffffff]';

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

  // Render Real User Avatar (Uploaded Photo or Personalized Colored Initial Circle)
  const renderAvatar = (reviewerName, avatarUrl) => {
    if (avatarUrl) {
      return (
        <img 
          src={avatarUrl} 
          alt={reviewerName} 
          className="w-10 h-10 rounded-full object-cover border border-[#e5e7eb] shrink-0" 
        />
      );
    }

    const initial = (reviewerName || 'A').charAt(0).toUpperCase();
    const bgColors = ['bg-[#7a0b10]', 'bg-[#e8a020]', 'bg-[#10b981]', 'bg-[#6b52ff]', 'bg-[#ec4899]', 'bg-[#3b82f6]'];
    const charCodeSum = (reviewerName || 'A').split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
    const bgColor = bgColors[charCodeSum % bgColors.length];

    return (
      <div className={`w-10 h-10 rounded-full ${bgColor} text-white font-extrabold flex items-center justify-center text-[15px] shadow-sm shrink-0 border border-white/30 uppercase`}>
        {initial}
      </div>
    );
  };

  return (
    <div className="space-y-6 select-none">
      
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 py-4 relative">
        <div className="w-[150px] hidden sm:block" />

        <div className="flex items-center justify-center gap-3">
          <div className="flex items-center gap-1.5 opacity-80">
            <div className="h-[1.5px] bg-[#e8a020] w-8 md:w-16" />
            <div className="w-1.5 h-1.5 rotate-45 bg-[#e8a020]" />
          </div>
          <h2 className="text-[24px] md:text-[28px] font-serif font-bold text-[#1a1a1a] text-center tracking-wide px-2">
            Customer Reviews <span className="text-[#e8a020]">({computedStats.totalReviews})</span>
          </h2>
          <div className="flex items-center gap-1.5 opacity-80">
            <div className="w-1.5 h-1.5 rotate-45 bg-[#e8a020]" />
            <div className="h-[1.5px] bg-[#e8a020] w-8 md:w-16" />
          </div>
        </div>

        <button 
          onClick={handleOpenModal}
          className={`h-[42px] px-5 rounded-lg flex items-center gap-2 font-bold text-[13px] shadow-sm transition-colors duration-200 shrink-0 ${primaryBg}`}
        >
          <Edit3 className="w-4 h-4" /> 
          {userReview ? 'Edit / Delete Your Review' : 'Write a Review'}
        </button>
      </div>

      {/* Reviews Dashboard grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Real Rating summary box */}
        <div className="lg:col-span-4 rounded-xl border border-[#e5e7eb] bg-[#ffffff] p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center">
            <span className="text-[52px] font-bold text-[#1a1a1a] leading-none mb-2">
              {computedStats.averageRating}
            </span>
            <div className="flex text-[#e8a020] mb-2.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-5 h-5 ${i < Math.round(Number(computedStats.averageRating)) ? 'fill-current' : 'text-[#d1d5db] fill-[#d1d5db]'}`} />
              ))}
            </div>
            <span className="text-[12px] font-medium text-[#4b5563] text-center">
              Based on {computedStats.totalReviews} {computedStats.totalReviews === 1 ? 'review' : 'reviews'}
            </span>
          </div>

          {/* Real Rating distribution list */}
          <div className="flex-1 w-full space-y-2">
            {computedStats.ratingDistribution.map((dist) => (
              <div key={dist.stars} className="flex items-center gap-2 text-[12px] font-bold text-[#1a1a1a]">
                <span className="w-2">{dist.stars}</span>
                <Star className="w-3.5 h-3.5 text-[#e8a020] fill-[#e8a020]" />
                <div className="flex-1 h-[8px] rounded-full bg-[#f3f4f6] overflow-hidden mx-1">
                  <div className="h-full rounded-full bg-[#e8a020] transition-all duration-500" style={{ width: `${dist.percent}%` }} />
                </div>
                <span className="w-8 text-right font-medium text-[#6b7280]">{dist.percent}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Dynamic real review comments list */}
        <div className="lg:col-span-8">
          {reviewsList.length === 0 ? (
            <div className="rounded-xl border border-[#e5e7eb] bg-[#ffffff] p-8 text-center shadow-sm space-y-3">
              <MessageSquare className="w-10 h-10 text-[#e8a020] mx-auto opacity-80" />
              <h4 className="font-bold text-[16px] text-[#1a1a1a]">No reviews yet for this dish</h4>
              <p className="text-[13px] text-[#6b7280]">Be the first to share your experience with other food lovers!</p>
              <button 
                onClick={handleOpenModal}
                className={`mt-2 h-[38px] px-4 rounded-lg inline-flex items-center gap-2 font-bold text-[13px] shadow-sm ${primaryBg}`}
              >
                <Edit3 className="w-4 h-4" /> Write the First Review
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {reviewsList.map((rev, idx) => {
                const reviewerUserId = rev.userId?._id || rev.userId;
                const isUserOwn = isAuthenticated && user && reviewerUserId === user._id;

                // Resolve real reviewer name strictly
                let reviewerName = 'Customer';
                if (typeof rev.userId === 'object' && rev.userId?.name) {
                  reviewerName = rev.userId.name;
                } else if (isUserOwn && user?.name) {
                  reviewerName = user.name;
                } else if (rev.name) {
                  reviewerName = rev.name;
                } else if (typeof rev.userId === 'object' && rev.userId?.email) {
                  reviewerName = rev.userId.email.split('@')[0];
                } else if (user?.name) {
                  reviewerName = user.name;
                }

                const avatarUrl = (typeof rev.userId === 'object' && rev.userId?.avatar)
                  ? rev.userId.avatar
                  : (isUserOwn ? user?.avatar : null);

                const isOrderVerified = Boolean(rev.orderId);

                return (
                  <div 
                    key={rev._id || idx} 
                    className={`rounded-xl border bg-[#ffffff] p-5 shadow-sm space-y-4 relative ${
                      isUserOwn ? 'border-[#e8a020] ring-1 ring-[#e8a020]/30' : 'border-[#e5e7eb]'
                    }`}
                  >
                    {isUserOwn && (
                      <div className="absolute top-3 right-3 flex items-center gap-1.5">
                        <span className="bg-[#e8a020]/15 text-[#7a0b10] text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Your Review
                        </span>
                        <button 
                          onClick={handleOpenModal} 
                          title="Edit your review"
                          className="p-1 text-[#7a0b10] hover:bg-[#7a0b10]/10 rounded-md transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      {renderAvatar(reviewerName, avatarUrl)}
                      <div>
                        <h4 className="font-bold text-[14px] text-[#1a1a1a] leading-none mb-1.5 flex items-center gap-1.5 capitalize">
                          {reviewerName}
                        </h4>
                        <span className="text-[11px] font-bold text-[#e8a020] flex items-center gap-1 leading-none">
                          <Check className={`w-3 h-3 ${isOrderVerified ? 'text-[#10b981]' : 'text-[#e8a020]'}`} strokeWidth={3} />
                          {isOrderVerified ? 'Verified Order' : 'Verified Buyer'}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[11px] font-medium text-[#6b7280]">
                      <div className="flex text-[#e8a020]">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-3.5 h-3.5 ${i < (rev.overallRating || rev.foodRating || 5) ? 'fill-current' : 'text-[#d1d5db] fill-[#d1d5db]'}`} 
                          />
                        ))}
                      </div>
                      <span>{getRelativeTime(rev.createdAt)}</span>
                    </div>

                    {rev.title && (
                      <h5 className="text-[13px] font-bold text-[#1a1a1a] leading-tight">
                        {rev.title}
                      </h5>
                    )}

                    <p className="text-[13px] leading-relaxed text-[#4b5563] font-medium line-clamp-4">
                      {rev.comment || 'Delicious dish! Highly recommended.'}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Review Input Modal */}
      {modalOpen && (
        <Modal 
          isOpen={modalOpen} 
          onClose={() => setModalOpen(false)} 
          title={userReview ? "Edit Your Review" : "Write a Review"}
          size="md"
        >
          <form onSubmit={handleSubmitReview} className="space-y-5 pt-2 select-text">
            {/* Rating Stars */}
            <div>
              <label className="block text-[13px] font-bold text-[#1a1a1a] mb-2">
                Your Rating <span className="text-[#7a0b10]">*</span>
              </label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating: star })}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star 
                      className={`w-7 h-7 cursor-pointer transition-colors ${
                        star <= (hoverRating || formData.rating)
                          ? 'text-[#e8a020] fill-[#e8a020]'
                          : 'text-[#d1d5db] fill-[#f3f4f6]'
                      }`} 
                    />
                  </button>
                ))}
                <span className="ml-3 text-[13px] font-bold text-[#7a0b10]">
                  {hoverRating || formData.rating} / 5 Stars
                </span>
              </div>
            </div>

            {/* Review Title */}
            <div>
              <label className="block text-[13px] font-bold text-[#1a1a1a] mb-1.5">
                Title <span className="text-[#6b7280] font-normal">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Delicious flavor & perfect spice!"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full h-[46px] px-3.5 rounded-xl border border-[#eadfdb] bg-white text-[#1a1a1a] text-[13px] focus:outline-none focus:border-[#7a0b10] focus:ring-1 focus:ring-[#7a0b10]"
              />
            </div>

            {/* Review Comment */}
            <div>
              <label className="block text-[13px] font-bold text-[#1a1a1a] mb-1.5">
                Your Review <span className="text-[#7a0b10]">*</span>
              </label>
              <textarea
                required
                rows={4}
                placeholder="Share your experience with taste, portion, packing..."
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                className="w-full p-3 rounded-xl border border-[#eadfdb] bg-white text-[#1a1a1a] text-[13px] focus:outline-none focus:border-[#7a0b10] focus:ring-1 focus:ring-[#7a0b10] resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-3 border-t border-[#eadfdb]">
              {userReview && (
                <button
                  type="button"
                  disabled={deleting || submitting}
                  onClick={promptDeleteReview}
                  className="h-[44px] px-4 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-[13px] font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Delete
                </button>
              )}

              <div className="flex items-center gap-3 ml-auto">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="h-[44px] px-4 rounded-xl border border-[#eadfdb] text-[#4b5563] hover:bg-[#f9f9f9] text-[13px] font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || deleting}
                  className={`h-[44px] px-6 rounded-xl font-bold text-[13px] shadow-sm flex items-center gap-2 transition-colors disabled:opacity-50 ${primaryBg}`}
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {userReview ? 'Update Review' : 'Publish Review'}
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* Website Custom Delete Confirmation Dialog */}
      {confirmDeleteOpen && (
        <ConfirmDialog
          isOpen={confirmDeleteOpen}
          onClose={() => setConfirmDeleteOpen(false)}
          onConfirm={handleConfirmDelete}
          title="Delete Your Review"
          message="Are you sure you want to delete your review for this dish? This action cannot be undone."
          confirmText="Yes, Delete Review"
          cancelText="Cancel"
          variant="danger"
        />
      )}
    </div>
  );
}