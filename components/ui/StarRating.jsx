'use client';

import React, { useState } from 'react';
import { Star } from 'lucide-react';

/**
 * StarRating Component
 * Interactive star rating input or display
 * 
 * @param {number} rating - Current rating value (1-5)
 * @param {function} onRatingChange - Callback when rating changes (if interactive)
 * @param {boolean} readOnly - If true, display only (no interaction)
 * @param {string} size - Size of stars: 'sm', 'md', 'lg', 'xl'
 * @param {boolean} showValue - Show numeric value next to stars
 * @param {number} totalRatings - Total number of ratings (for display)
 */
export const StarRating = ({ 
  rating = 0, 
  onRatingChange, 
  readOnly = false, 
  size = 'md',
  showValue = false,
  totalRatings = null,
  className = ''
}) => {
  const [hoverRating, setHoverRating] = useState(0);
  
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  };
  
  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  };
  
  const starSize = sizeClasses[size] || sizeClasses.md;
  const textSize = textSizeClasses[size] || textSizeClasses.md;
  
  const handleClick = (index) => {
    if (!readOnly && onRatingChange) {
      onRatingChange(index);
    }
  };
  
  const handleMouseEnter = (index) => {
    if (!readOnly) {
      setHoverRating(index);
    }
  };
  
  const handleMouseLeave = () => {
    if (!readOnly) {
      setHoverRating(0);
    }
  };
  
  const displayRating = hoverRating || rating;
  
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex">
        {[1, 2, 3, 4, 5].map((index) => {
          const filled = index <= displayRating;
          const halfFilled = !filled && index - 0.5 <= displayRating;
          
          return (
            <button
              key={index}
              type="button"
              onClick={() => handleClick(index)}
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={handleMouseLeave}
              disabled={readOnly}
              className={`${readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform focus:outline-none`}
              aria-label={`${index} star${index > 1 ? 's' : ''}`}
            >
              <Star
                className={`${starSize} ${
                  filled 
                    ? 'fill-yellow-400 text-yellow-400' 
                    : halfFilled 
                      ? 'fill-yellow-400/50 text-yellow-400' 
                      : 'fill-gray-200 text-gray-300'
                } transition-colors`}
              />
            </button>
          );
        })}
      </div>
      
      {showValue && (
        <span className={`${textSize} font-semibold text-gray-700 ml-1`}>
          {rating > 0 ? rating.toFixed(1) : '0.0'}
        </span>
      )}
      
      {totalRatings !== null && (
        <span className={`${textSize} text-gray-500 ml-1`}>
          ({totalRatings} {totalRatings === 1 ? 'review' : 'reviews'})
        </span>
      )}
    </div>
  );
};

/**
 * RatingBreakdown Component
 * Shows distribution of ratings (5 star, 4 star, etc.)
 */
export const RatingBreakdown = ({ breakdown = {}, totalRatings = 0 }) => {
  const bars = [5, 4, 3, 2, 1].map(star => {
    const count = breakdown[star.toString()] || 0;
    const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
    
    return (
      <div key={star} className="flex items-center gap-2">
        <span className="text-sm text-gray-600 w-8">{star} star</span>
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-yellow-400 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-sm text-gray-500 w-8 text-right">{count}</span>
      </div>
    );
  });
  
  return (
    <div className="space-y-2">
      {bars}
    </div>
  );
};

/**
 * RatingSummary Component
 * Shows average rating with breakdown
 */
export const RatingSummary = ({ 
  averageRating = 0, 
  totalRatings = 0, 
  breakdown = {},
  compact = false 
}) => {
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <StarRating rating={averageRating} readOnly size="sm" />
        <span className="text-sm font-medium text-gray-700">
          {averageRating > 0 ? averageRating.toFixed(1) : 'No ratings'}
        </span>
        {totalRatings > 0 && (
          <span className="text-sm text-gray-500">
            ({totalRatings})
          </span>
        )}
      </div>
    );
  }
  
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <div className="flex items-start gap-6">
        {/* Average Rating */}
        <div className="text-center">
          <div className="text-4xl font-bold text-gray-900">
            {averageRating > 0 ? averageRating.toFixed(1) : '0.0'}
          </div>
          <StarRating rating={averageRating} readOnly size="md" className="justify-center mt-1" />
          <div className="text-sm text-gray-500 mt-1">
            {totalRatings} {totalRatings === 1 ? 'review' : 'reviews'}
          </div>
        </div>
        
        {/* Breakdown */}
        <div className="flex-1">
          <RatingBreakdown breakdown={breakdown} totalRatings={totalRatings} />
        </div>
      </div>
    </div>
  );
};

export default StarRating;
