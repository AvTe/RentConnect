'use client';

import React, { useState, useEffect } from 'react';
import { Star, X, ChevronRight } from 'lucide-react';
import { Button } from './ui/Button';
import { RatingModal } from './RatingModal';

/**
 * RatingPrompt Component
 * Shows a prompt to rate agents who have contacted the tenant
 * 
 * @param {Object} currentUser - Current logged-in user
 */
export const RatingPrompt = ({ currentUser }) => {
  const [pendingAgents, setPendingAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  useEffect(() => {
    if (currentUser && currentUser.role !== 'agent') {
      fetchPendingRatings();
    }
  }, [currentUser]);
  
  const fetchPendingRatings = async () => {
    try {
      const response = await fetch('/api/ratings?pendingRatings=true');
      const result = await response.json();
      
      if (result.success) {
        setPendingAgents(result.data || []);
      }
    } catch (err) {
      console.error('Error fetching pending ratings:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleRateAgent = (agent) => {
    setSelectedAgent(agent);
    setShowRatingModal(true);
  };
  
  const handleSubmitRating = async (ratingData) => {
    setSubmitting(true);
    try {
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgent.agentId,
          leadId: selectedAgent.leadId,
          ...ratingData
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setShowRatingModal(false);
        setSelectedAgent(null);
        // Remove this agent from pending list
        setPendingAgents(prev => prev.filter(a => a.agentId !== selectedAgent.agentId));
      } else {
        throw new Error(result.error || 'Failed to submit rating');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };
  
  // Don't show if no pending ratings, dismissed, or still loading
  if (loading || dismissed || pendingAgents.length === 0) {
    return null;
  }
  
  return (
    <>
      {/* Rating Prompt Banner */}
      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-xl p-4 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Star className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Rate your experience</h3>
              <p className="text-sm text-gray-600 mt-0.5">
                {pendingAgents.length} agent{pendingAgents.length > 1 ? 's' : ''} contacted you. Share your experience to help others!
              </p>
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 hover:bg-orange-100 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        
        {/* Agent List */}
        <div className="mt-4 space-y-2">
          {pendingAgents.slice(0, 3).map((agent) => (
            <div 
              key={agent.agentId}
              className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold overflow-hidden">
                  {agent.avatar ? (
                    <img src={agent.avatar} alt={agent.name} className="w-full h-full object-cover" />
                  ) : (
                    agent.name?.charAt(0)?.toUpperCase() || 'A'
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{agent.name}</p>
                  <p className="text-xs text-gray-500">{agent.agencyName || 'Real Estate Agent'}</p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => handleRateAgent(agent)}
                className="bg-orange-500 hover:bg-orange-600"
              >
                Rate
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          ))}
          
          {pendingAgents.length > 3 && (
            <p className="text-sm text-center text-gray-500 pt-2">
              +{pendingAgents.length - 3} more agents to rate
            </p>
          )}
        </div>
      </div>
      
      {/* Rating Modal */}
      <RatingModal
        isOpen={showRatingModal}
        onClose={() => {
          setShowRatingModal(false);
          setSelectedAgent(null);
        }}
        agent={selectedAgent}
        onSubmit={handleSubmitRating}
        loading={submitting}
      />
    </>
  );
};

export default RatingPrompt;
