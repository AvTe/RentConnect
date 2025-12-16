'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { X, Send, Star, MessageSquare, Clock, Award, ThumbsUp } from 'lucide-react';
import { StarRating } from './ui/StarRating';
import { Button } from './ui/Button';

/**
 * RatingModal Component
 * Modal for submitting agent ratings
 * 
 * @param {boolean} isOpen - Whether modal is open
 * @param {function} onClose - Callback to close modal
 * @param {Object} agent - Agent being rated
 * @param {function} onSubmit - Callback when rating is submitted
 * @param {boolean} loading - Loading state during submission
 */
export const RatingModal = ({ 
  isOpen, 
  onClose, 
  agent, 
  onSubmit,
  loading = false 
}) => {
  const [overallRating, setOverallRating] = useState(0);
  const [responsivenessRating, setResponsivenessRating] = useState(0);
  const [professionalismRating, setProfessionalismRating] = useState(0);
  const [helpfulnessRating, setHelpfulnessRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [error, setError] = useState('');
  
  if (!isOpen) return null;
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (overallRating === 0) {
      setError('Please select an overall rating');
      return;
    }
    
    try {
      await onSubmit({
        rating: overallRating,
        reviewText: reviewText.trim() || null,
        responsivenessRating: responsivenessRating || null,
        professionalismRating: professionalismRating || null,
        helpfulnessRating: helpfulnessRating || null
      });
    } catch (err) {
      setError(err.message || 'Failed to submit rating');
    }
  };
  
  const handleClose = () => {
    setOverallRating(0);
    setResponsivenessRating(0);
    setProfessionalismRating(0);
    setHelpfulnessRating(0);
    setReviewText('');
    setError('');
    onClose();
  };
  
  const getRatingLabel = (rating) => {
    const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
    return labels[rating] || '';
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl font-bold text-gray-900">Rate Your Experience</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Agent Info */}
          <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-xl overflow-hidden">
              {agent?.avatar ? (
                <Image src={agent.avatar} alt={agent?.name || 'Agent'} width={56} height={56} className="w-full h-full object-cover" />
              ) : (
                agent?.name?.charAt(0)?.toUpperCase() || 'A'
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{agent?.name || 'Agent'}</h3>
              <p className="text-sm text-gray-500">{agent?.agencyName || 'Real Estate Agent'}</p>
            </div>
          </div>
          
          {/* Overall Rating */}
          <div className="text-center">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Overall Rating *
            </label>
            <div className="flex justify-center">
              <StarRating 
                rating={overallRating} 
                onRatingChange={setOverallRating} 
                size="xl"
              />
            </div>
            {overallRating > 0 && (
              <p className="mt-2 text-sm font-medium text-orange-600">
                {getRatingLabel(overallRating)}
              </p>
            )}
          </div>
          
          {/* Detailed Ratings */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Rate specific aspects (optional)</p>
            
            {/* Responsiveness */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Responsiveness</span>
              </div>
              <StarRating 
                rating={responsivenessRating} 
                onRatingChange={setResponsivenessRating} 
                size="sm"
              />
            </div>
            
            {/* Professionalism */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Professionalism</span>
              </div>
              <StarRating 
                rating={professionalismRating} 
                onRatingChange={setProfessionalismRating} 
                size="sm"
              />
            </div>
            
            {/* Helpfulness */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ThumbsUp className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Helpfulness</span>
              </div>
              <StarRating 
                rating={helpfulnessRating} 
                onRatingChange={setHelpfulnessRating} 
                size="sm"
              />
            </div>
          </div>
          
          {/* Review Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MessageSquare className="w-4 h-4 inline mr-1" />
              Write a review (optional)
            </label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your experience with this agent..."
              rows={4}
              maxLength={1000}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none transition-all"
            />
            <p className="text-xs text-gray-400 text-right mt-1">
              {reviewText.length}/1000 characters
            </p>
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}
          
          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1 bg-orange-500 hover:bg-orange-600"
              disabled={loading || overallRating === 0}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Submitting...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" />
                  Submit Rating
                </span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RatingModal;
