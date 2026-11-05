import React, { useState, useEffect } from 'react';
import {
  Star,
  CheckCircle2,
  ThumbsUp,
  MessageSquare,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Send,
  Loader2,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { Product } from '../data/products';
import { useAuth } from '../context/AuthContext';
import {
  ProductReview,
  calculateReviewStats,
  subscribeProductReviews,
  submitProductReview,
} from '../lib/reviewService';

interface ProductReviewsSectionProps {
  product: Product;
}

export const ProductReviewsSection: React.FC<ProductReviewsSectionProps> = ({ product }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Form State
  const [selectedRating, setSelectedRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [name, setName] = useState<string>(user?.displayName || '');
  const [email, setEmail] = useState<string>(user?.email || '');
  const [title, setTitle] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [recommend, setRecommend] = useState<boolean>(true);

  // Filter state
  const [filterRating, setFilterRating] = useState<number | 'all'>('all');

  // Real-time synchronization with Firestore
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeProductReviews(product.id, product.slug, (data) => {
      setReviews(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [product.id, product.slug]);

  // Keep name/email updated if user logs in
  useEffect(() => {
    if (user) {
      if (!name && user.displayName) setName(user.displayName);
      if (!email && user.email) setEmail(user.email);
    }
  }, [user]);

  const stats = calculateReviewStats(reviews);

  const ratingDescriptions: Record<number, string> = {
    5: 'Exceptional — Exceeded Expectations (অসাধারণ)',
    4: 'Very Good — Satisfied with Quality (খুব ভালো)',
    3: 'Average — Met Basic Expectations (মোটামুটি)',
    2: 'Below Average — Minor Issues (সাধারণ)',
    1: 'Poor — Dissatisfied (ভালো লাগেনি)',
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!name.trim()) {
      setSubmitError('Please enter your name.');
      return;
    }

    if (!comment.trim() || comment.trim().length < 5) {
      setSubmitError('Please write at least a few words about your experience.');
      return;
    }

    try {
      setSubmitting(true);
      await submitProductReview({
        productId: product.id,
        productSlug: product.slug,
        rating: selectedRating,
        userName: name.trim(),
        userEmail: email.trim(),
        title: title.trim() || undefined,
        comment: comment.trim(),
        recommend,
      });

      setSubmitSuccess(true);
      // Reset input fields
      setTitle('');
      setComment('');
      setSubmitting(false);

      // Auto close success message after 4s
      setTimeout(() => {
        setSubmitSuccess(false);
        setIsFormOpen(false);
      }, 4000);
    } catch (err) {
      console.error('Failed to submit review:', err);
      setSubmitError('Could not save your review. Please try again.');
      setSubmitting(false);
    }
  };

  const filteredReviews = reviews.filter((r) => {
    if (filterRating === 'all') return true;
    return Math.round(r.rating) === filterRating;
  });

  return (
    <div id="product-reviews-section" className="bg-white rounded-xl border border-[#E8E2D5] p-6 sm:p-8 lg:p-10 shadow-xs mb-8 sm:mb-12">
      {/* Section Header */}
      <div className="border-b border-[#F0EBE1] pb-5 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-7 bg-[#C5A059] rounded-full" />
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-[#1C2024] tracking-tight">
              Customer Ratings & Reviews
            </h2>
            <p className="text-xs sm:text-sm text-[#6C727A] mt-0.5">
              Verified feedback from buyers across Bangladesh
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsFormOpen(!isFormOpen);
            setSubmitSuccess(false);
            setSubmitError(null);
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#143D2B] hover:bg-[#0E2E20] text-white text-xs sm:text-sm font-semibold rounded-lg transition-all shadow-xs active:scale-[0.98] shrink-0 self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4 text-[#C5A059]" />
          <span>{isFormOpen ? 'Cancel Review' : 'Write a Review'}</span>
          {isFormOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Review Submission Form Drawer / Accordion */}
      {isFormOpen && (
        <div className="mb-10 bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl p-5 sm:p-7 transition-all animate-fadeIn">
          {submitSuccess ? (
            <div className="py-6 text-center space-y-3">
              <div className="w-12 h-12 bg-[#EAF7EE] text-[#16A34A] rounded-full flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-semibold text-[#1C2024]">
                Thank you for your review!
              </h3>
              <p className="text-sm text-[#4E555D] max-w-md mx-auto">
                Your rating and feedback have been published directly to the CORELUX verified reviews feed.
              </p>
            </div>
          ) : (
            <form onSubmit={handleFormSubmit} className="space-y-5">
              <div className="border-b border-[#EAE3D5] pb-3 mb-4">
                <h3 className="text-base font-semibold text-[#1C2024] font-display">
                  Share Your Experience with {product.name}
                </h3>
                <p className="text-xs text-[#6C727A]">
                  Help other shoppers make an informed decision with honest feedback.
                </p>
              </div>

              {submitError && (
                <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-lg text-xs text-[#991B1B] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Star Rating Selector */}
              <div>
                <label className="block text-xs font-bold text-[#1C2024] uppercase tracking-wider mb-2">
                  Overall Rating <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isActive = (hoverRating || selectedRating) >= star;
                      return (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setSelectedRating(star)}
                          className="p-1 text-stone-300 hover:scale-110 transition-transform focus:outline-none"
                          aria-label={`Rate ${star} stars`}
                        >
                          <Star
                            className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                              isActive
                                ? 'text-[#C5A059] fill-[#C5A059]'
                                : 'text-stone-300 fill-stone-100'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-[#143D2B] bg-[#EAF5EF] px-3 py-1 rounded-full border border-[#CDE5D7]">
                    {ratingDescriptions[hoverRating || selectedRating]}
                  </span>
                </div>
              </div>

              {/* User Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1C2024] mb-1.5">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Tanvir Hasan"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D5CDC0] rounded-lg text-sm text-[#1C2024] placeholder:text-stone-400 focus:outline-none focus:border-[#143D2B] focus:ring-1 focus:ring-[#143D2B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C2024] mb-1.5">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. tanvir@example.com"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D5CDC0] rounded-lg text-sm text-[#1C2024] placeholder:text-stone-400 focus:outline-none focus:border-[#143D2B] focus:ring-1 focus:ring-[#143D2B]"
                  />
                  <p className="text-[11px] text-stone-400 mt-1">We will never display your email publicly.</p>
                </div>
              </div>

              {/* Review Title */}
              <div>
                <label className="block text-xs font-semibold text-[#1C2024] mb-1.5">
                  Review Headline (Optional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Outstanding sound quality & premium packaging!"
                  maxLength={120}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#D5CDC0] rounded-lg text-sm text-[#1C2024] placeholder:text-stone-400 focus:outline-none focus:border-[#143D2B] focus:ring-1 focus:ring-[#143D2B]"
                />
              </div>

              {/* Review Comment */}
              <div>
                <label className="block text-xs font-semibold text-[#1C2024] mb-1.5">
                  Detailed Review <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share details about sound clarity, battery life, fabric warmth, delivery experience, etc."
                  maxLength={1500}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#D5CDC0] rounded-lg text-sm text-[#1C2024] placeholder:text-stone-400 focus:outline-none focus:border-[#143D2B] focus:ring-1 focus:ring-[#143D2B]"
                />
                <div className="flex justify-between text-[11px] text-stone-400 mt-1">
                  <span>Minimum 5 characters</span>
                  <span>{comment.length}/1500</span>
                </div>
              </div>

              {/* Recommend Checkbox */}
              <div className="flex items-center gap-3 pt-1">
                <input
                  type="checkbox"
                  id="recommend-product"
                  checked={recommend}
                  onChange={(e) => setRecommend(e.target.checked)}
                  className="w-4 h-4 text-[#143D2B] rounded border-stone-300 focus:ring-[#143D2B]"
                />
                <label htmlFor="recommend-product" className="text-xs font-medium text-[#1C2024] cursor-pointer">
                  I recommend this product to other shoppers
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EAE3D5]">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2 border border-[#D5CDC0] text-xs font-semibold text-[#5A6068] hover:bg-[#F2ECE1] rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-[#143D2B] hover:bg-[#0E2E20] disabled:bg-stone-300 text-white text-xs sm:text-sm font-semibold rounded-lg transition-all active:scale-[0.98] shadow-xs"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Review</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Aggregate Rating Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 pb-8 mb-8 border-b border-[#F0EBE1]">
        {/* Left: Big Score & Stars */}
        <div className="md:col-span-4 flex flex-col justify-center items-center md:items-start text-center md:text-left md:border-r md:border-[#F0EBE1] md:pr-6">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-bold font-display text-[#1C2024] tracking-tight">
              {stats.averageRating}
            </span>
            <span className="text-stone-400 text-lg font-normal">/ 5.0</span>
          </div>

          <div className="flex items-center gap-1 my-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-5 h-5 ${
                  star <= Math.round(stats.averageRating)
                    ? 'text-[#C5A059] fill-[#C5A059]'
                    : 'text-stone-300 fill-stone-100'
                }`}
              />
            ))}
          </div>

          <p className="text-xs sm:text-sm font-semibold text-[#1C2024]">
            {stats.totalReviews > 0
              ? `Based on ${stats.totalReviews} verified review${stats.totalReviews > 1 ? 's' : ''}`
              : 'Be the first to review'}
          </p>

          {stats.totalReviews > 0 && (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-[#166534] bg-[#EAF7EE] px-2.5 py-1 rounded-full border border-[#BDE8C9]">
              <ThumbsUp className="w-3.5 h-3.5 text-[#16A34A]" />
              <span className="font-semibold">{stats.recommendPercentage}% recommend this</span>
            </div>
          )}
        </div>

        {/* Center: Star Distribution Bars */}
        <div className="md:col-span-8 flex flex-col justify-center space-y-2">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = stats.distribution[stars as 1 | 2 | 3 | 4 | 5] || 0;
            const pct = stats.totalReviews > 0 ? Math.round((count / stats.totalReviews) * 100) : 0;
            const isFilterActive = filterRating === stars;

            return (
              <button
                key={stars}
                type="button"
                onClick={() => setFilterRating(isFilterActive ? 'all' : stars)}
                className={`flex items-center gap-3 w-full text-left group transition-all py-0.5 rounded px-1.5 ${
                  isFilterActive ? 'bg-[#FAF8F5] ring-1 ring-[#143D2B]' : 'hover:bg-stone-50'
                }`}
              >
                <span className="text-xs font-semibold text-[#1C2024] w-12 flex items-center gap-1">
                  <span>{stars}</span>
                  <Star className="w-3.5 h-3.5 text-[#C5A059] fill-[#C5A059]" />
                </span>

                <div className="flex-1 h-2.5 bg-[#F0EBE1] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#C5A059] rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <span className="text-xs text-stone-500 w-10 text-right group-hover:text-[#1C2024]">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Review List Filter & Count */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#1C2024] uppercase tracking-wider">
            Reviews ({filteredReviews.length})
          </span>
          {filterRating !== 'all' && (
            <button
              onClick={() => setFilterRating('all')}
              className="text-[11px] text-[#143D2B] font-semibold underline hover:text-[#0E2E20]"
            >
              Show All
            </button>
          )}
        </div>

        {/* Doorstep Inspection Guarantee Badge */}
        <div className="flex items-center gap-1.5 text-xs text-[#8C6D2D]">
          <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
          <span>Real shopper reviews from nationwide deliveries</span>
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3 text-stone-400">
          <Loader2 className="w-6 h-6 animate-spin text-[#143D2B]" />
          <span className="text-xs font-medium">Loading reviews from Firestore...</span>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-[#E0D7C6] rounded-xl bg-[#FAF8F5]/60 p-6">
          <MessageSquare className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-[#1C2024]">
            {filterRating === 'all'
              ? 'No reviews yet for this product'
              : `No ${filterRating}-star reviews yet`}
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1 mb-4">
            Be the first customer to share your thoughts, impressions, and audio/fabric quality experience.
          </p>
          <button
            type="button"
            onClick={() => setIsFormOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#143D2B] text-white text-xs font-semibold rounded-lg hover:bg-[#0E2E20] transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Write the First Review</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((rev) => {
            const formattedDate = (() => {
              try {
                const dateObj = new Date(rev.createdAt);
                if (isNaN(dateObj.getTime())) return 'Recently';
                return dateObj.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });
              } catch {
                return 'Recently';
              }
            })();

            const userInitials = rev.userName
              ? rev.userName
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()
              : 'U';

            return (
              <div
                key={rev.id}
                className="bg-[#FAF8F5]/70 border border-[#EAE3D5] rounded-xl p-5 sm:p-6 transition-all hover:border-[#D5CDC0]"
              >
                {/* Review Header: User Info & Rating */}
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#143D2B] text-[#C5A059] font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                      {userInitials}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#1C2024]">{rev.userName}</span>
                        {rev.isVerifiedPurchase && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#14532D] bg-[#EAF7EE] px-2 py-0.5 rounded-full border border-[#BDE8C9]">
                            <CheckCircle2 className="w-3 h-3 text-[#16A34A]" />
                            <span>Verified Buyer</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-stone-400">{formattedDate}</span>
                    </div>
                  </div>

                  {/* Star Rating Badge */}
                  <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-md border border-[#E8E2D5] shadow-xs">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${
                          star <= rev.rating
                            ? 'text-[#C5A059] fill-[#C5A059]'
                            : 'text-stone-300 fill-stone-100'
                        }`}
                      />
                    ))}
                    <span className="text-xs font-bold text-[#1C2024] ml-1">{rev.rating}.0</span>
                  </div>
                </div>

                {/* Review Title */}
                {rev.title && (
                  <h4 className="text-sm font-bold text-[#1C2024] mb-1.5 leading-snug">
                    {rev.title}
                  </h4>
                )}

                {/* Review Comment Body */}
                <p className="text-xs sm:text-sm text-[#4E555D] leading-relaxed whitespace-pre-line">
                  {rev.comment}
                </p>

                {/* Recommend badge if applicable */}
                {rev.recommend && (
                  <div className="mt-3 pt-3 border-t border-[#EAE3D5]/60 flex items-center gap-1.5 text-xs text-[#166534]">
                    <ThumbsUp className="w-3.5 h-3.5 text-[#16A34A]" />
                    <span className="font-medium">Recommends this product</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
