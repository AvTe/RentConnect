'use client';

import React, { useState, useEffect } from 'react';
import { Star, ChevronDown, ChevronUp, User } from 'lucide-react';
import { StarRating, RatingSummary } from './ui/StarRating';

/**
 * ReviewCard Component
 * Display a single review
 */
const ReviewCard = ({ review }) => {
  const [expanded, setExpanded] = useState(false);
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const shouldTruncate = review.reviewText && review.reviewText.length > 200;
  const displayText = shouldTruncate && !expanded 
    ? review.reviewText.substring(0, 200) + '...'
    : review.reviewText;
  
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center overflow-hidden">
            {review.tenantAvatar ? (
              <img src={review.tenantAvatar} alt={review.tenantName} className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-gray-500" />
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900">{review.tenantName || 'Anonymous'}</p>
            <p className="text-xs text-gray-500">{formatDate(review.createdAt)}</p>
          </div>
        </div>
        <StarRating rating={review.rating} readOnly size="sm" />
      </div>
      
      {/* Review Text */}
      {review.reviewText && (
        <div className="mt-3">
          <p className="text-gray-600 text-sm leading-relaxed">{displayText}</p>
          {shouldTruncate && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-orange-600 text-sm font-medium mt-1 hover:text-orange-700 flex items-center gap-1"
            >
              {expanded ? (
                <>Show less <ChevronUp className="w-4 h-4" /></>
              ) : (
                <>Read more <ChevronDown className="w-4 h-4" /></>
              )}
            </button>
          )}
        </div>
      )}
      
      {/* Detailed Ratings */}
      {(review.responsivenessRating || review.professionalismRating || review.helpfulnessRating) && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-4 text-xs text-gray-500">
          {review.responsivenessRating && (
            <div className="flex items-center gap-1">
              <span>Responsiveness:</span>
              <StarRating rating={review.responsivenessRating} readOnly size="sm" />
            </div>
          )}
          {review.professionalismRating && (
            <div className="flex items-center gap-1">
              <span>Professionalism:</span>
              <StarRating rating={review.professionalismRating} readOnly size="sm" />
            </div>
          )}
          {review.helpfulnessRating && (
            <div className="flex items-center gap-1">
              <span>Helpfulness:</span>
              <StarRating rating={review.helpfulnessRating} readOnly size="sm" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * AgentReviews Component
 * Display all reviews for an agent with summary
 * 
 * @param {string} agentId - Agent's user ID
 * @param {boolean} showSummary - Whether to show rating summary
 */
export const AgentReviews = ({ agentId, showSummary = true }) => {
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAll, setShowAll] = useState(false);
  
  useEffect(() => {
    if (agentId) {
      fetchReviews();
    }
  }, [agentId]);
  
  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/ratings?agentId=${agentId}&includeSummary=true&limit=20`);
      const result = await response.json();
      
      if (result.success) {
        setReviews(result.data.ratings || []);
        setSummary(result.data.summary || null);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-gray-100 rounded-xl" />
        <div className="h-24 bg-gray-100 rounded-xl" />
        <div className="h-24 bg-gray-100 rounded-xl" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Unable to load reviews</p>
      </div>
    );
  }
  
  const displayedReviews = showAll ? reviews : reviews.slice(0, 3);
  
  return (
    <div className="space-y-6">
      {/* Summary */}
      {showSummary && summary && (
        <RatingSummary 
          averageRating={summary.averageRating}
          totalRatings={summary.totalRatings}
          breakdown={summary.ratingBreakdown}
        />
      )}
      
      {/* Reviews List */}
      {reviews.length > 0 ? (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">
            Reviews ({reviews.length})
          </h3>
          
          {displayedReviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
          
          {reviews.length > 3 && !showAll && (
            <button
              onClick={() => setShowAll(true)}
              className="w-full py-3 text-center text-orange-600 font-medium hover:bg-orange-50 rounded-xl transition-colors"
            >
              Show all {reviews.length} reviews
            </button>
          )}
          
          {showAll && reviews.length > 3 && (
            <button
              onClick={() => setShowAll(false)}
              className="w-full py-3 text-center text-gray-600 font-medium hover:bg-gray-50 rounded-xl transition-colors"
            >
              Show less
            </button>
          )}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-xl">
          <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No reviews yet</p>
          <p className="text-sm text-gray-400">Be the first to review this agent</p>
        </div>
      )}
    </div>
  );
};

export default AgentReviews;
