import React, { useState, useEffect, useCallback } from 'react';
/* eslint-disable @next/next/no-img-element */
import { 
  ArrowLeft, MapPin, Building2, Phone, Mail, MessageCircle,
  Award, Star, Home, Users, CheckCircle, Lock, Send
} from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { StarRating } from './ui/StarRating';
import { AgentReviews } from './AgentReviews';
import { RatingModal } from './RatingModal';
import { 
  getAgentById, 
  getAgentProperties, 
  createInquiry,
  checkUserCanViewContact,
  sendConnectionRequest
} from '../lib/database';

export const AgentDetailPage = ({ agentId, currentUser, onNavigate, onBack }) => {
  const [agent, setAgent] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canViewContact, setCanViewContact] = useState(false);
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [canRate, setCanRate] = useState(false);
  const [ratingEligibility, setRatingEligibility] = useState(null);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('properties'); // 'properties' or 'reviews'
  const loadAgentData = useCallback(async () => {
    setLoading(true);
    const [agentResult, propertiesResult] = await Promise.all([
      getAgentById(agentId),
      getAgentProperties(agentId)
    ]);

    if (agentResult.success) {
      setAgent(agentResult.data);
    }
    if (propertiesResult.success) {
      setProperties(propertiesResult.data);
    }
    setLoading(false);
  }, [agentId]);

  const checkContactPermission = useCallback(async () => {
    if (currentUser) {
      if (currentUser.role === 'agent') {
        setCanViewContact(true);
      } else if (currentUser.role === 'user') {
        const result = await checkUserCanViewContact(currentUser.uid);
        setCanViewContact(result.canView);
      }
    }
  }, [currentUser]);

  const checkRatingEligibility = useCallback(async () => {
    if (currentUser && agentId) {
      try {
        const response = await fetch(`/api/ratings?agentId=${agentId}&checkEligibility=true`);
        const result = await response.json();
        if (result.success) {
          setRatingEligibility(result.data);
          setCanRate(result.data.canRate);
        }
      } catch (err) {
        console.error('Error checking rating eligibility:', err);
      }
    }
  }, [currentUser, agentId]);

  useEffect(() => {
    loadAgentData();
    checkContactPermission();
    checkRatingEligibility();
  }, [loadAgentData, checkContactPermission, checkRatingEligibility]);

  const handleSubmitRating = async (ratingData) => {
    setRatingSubmitting(true);
    try {
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agent.id,
          ...ratingData
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setShowRatingModal(false);
        setCanRate(false);
        // Refresh agent data to get updated rating
        loadAgentData();
        alert('Thank you for your rating!');
      } else {
        throw new Error(result.error || 'Failed to submit rating');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setRatingSubmitting(false);
    }
  };

  const handleSendInquiry = async () => {
    if (!currentUser) {
      alert('Please login to send an inquiry');
      return;
    }

    if (!inquiryMessage.trim()) {
      alert('Please enter a message');
      return;
    }

    const result = await createInquiry({
      userId: currentUser.uid,
      userName: currentUser.name || currentUser.email,
      userEmail: currentUser.email,
      agentId: agent.id,
      agentName: agent.name,
      message: inquiryMessage,
      propertyTitle: 'General Inquiry'
    });

    if (result.success) {
      alert('Inquiry sent successfully! The agent will respond through the platform.');
      setShowInquiryForm(false);
      setInquiryMessage('');
    } else {
      alert('Failed to send inquiry. Please try again.');
    }
  };

  const handleConnect = async () => {
    if (!currentUser) {
      alert('Please login to connect');
      return;
    }

    if (currentUser.role === 'agent') {
      const result = await sendConnectionRequest(currentUser.uid, agent.id);
      if (result.success) {
        alert('Connection request sent successfully!');
      } else {
        alert('Failed to send connection request');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FE9200]"></div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Agent not found</h2>
          <Button onClick={onBack}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#FE9200] to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <button 
            onClick={onBack}
            className="flex items-center text-white hover:text-[#FFE4C4] mb-6"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Agents
          </button>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Profile Photo */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-white border-4 border-white shadow-xl flex items-center justify-center">
                {agent.photoURL ? (
                  <img src={agent.photoURL} alt={agent.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-5xl font-bold text-[#FE9200]">
                    {agent.name?.charAt(0) || 'A'}
                  </span>
                )}
              </div>
              {(agent.verified || agent.verificationStatus === 'verified') && (
                <div className="absolute -bottom-2 -right-2 bg-[#FE9200] rounded-full p-2 border-4 border-white">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              )}
            </div>

            {/* Agent Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{agent.name}</h1>
                {(agent.verified || agent.verificationStatus === 'verified') && (
                  <Badge className="bg-white text-[#FE9200]">Verified</Badge>
                )}
              </div>
              {agent.agencyName && (
                <p className="text-[#FFE4C4] flex items-center gap-2 mb-2">
                  <Building2 className="w-5 h-5" />
                  {agent.agencyName}
                </p>
              )}
              {agent.location && (
                <p className="text-[#FFE4C4] flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  {agent.location}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              {currentUser?.role === 'agent' && currentUser.uid !== agent.id && (
                <Button 
                  variant="outline" 
                  className="bg-white text-[#FE9200] hover:bg-[#FFF5E6]"
                  onClick={handleConnect}
                >
                  <Users className="w-5 h-5 mr-2" />
                  Connect
                </Button>
              )}
              {currentUser?.role === 'user' && (
                <Button 
                  variant="outline" 
                  className="bg-white text-[#FE9200] hover:bg-[#FFF5E6]"
                  onClick={() => setShowInquiryForm(true)}
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Send Inquiry
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Agent Details */}
          <div className="lg:col-span-1 space-y-6">
            {/* Stats Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Statistics</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Properties</span>
                  <span className="font-bold text-gray-900">{properties.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Connections</span>
                  <span className="font-bold text-gray-900">{agent.connectionsCount || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Rating</span>
                  <div className="flex items-center gap-2">
                    <StarRating 
                      rating={parseFloat(agent.averageRating) || 0} 
                      readOnly 
                      size="sm" 
                    />
                    <span className="font-bold text-gray-900">
                      {agent.averageRating ? parseFloat(agent.averageRating).toFixed(1) : '0.0'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Reviews</span>
                  <span className="font-bold text-gray-900">{agent.totalRatings || 0}</span>
                </div>
              </div>
              
              {/* Rate Agent Button */}
              {currentUser && currentUser.role !== 'agent' && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  {canRate ? (
                    <Button 
                      className="w-full bg-orange-500 hover:bg-orange-600"
                      onClick={() => setShowRatingModal(true)}
                    >
                      <Star className="w-4 h-4 mr-2" />
                      Rate This Agent
                    </Button>
                  ) : ratingEligibility?.alreadyRated ? (
                    <p className="text-sm text-center text-green-600">
                      ✓ You&apos;ve already rated this agent
                    </p>
                  ) : ratingEligibility?.reason ? (
                    <p className="text-sm text-center text-gray-500">
                      {ratingEligibility.reason}
                    </p>
                  ) : null}
                </div>
              )}
            </div>

            {/* Contact Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Contact Information</h3>
              {canViewContact ? (
                <div className="space-y-3">
                  {agent.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <a href={`tel:${agent.phone}`} className="text-[#FE9200] hover:underline">
                        {agent.phone}
                      </a>
                    </div>
                  )}
                  {agent.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <a href={`mailto:${agent.email}`} className="text-[#FE9200] hover:underline truncate">
                        {agent.email}
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                  <Lock className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-700 mb-3">
                    Subscribe to view contact details
                  </p>
                  <Button 
                    size="sm" 
                    onClick={() => onNavigate('user-subscription')}
                  >
                    Subscribe Now
                  </Button>
                </div>
              )}
            </div>

            {/* Experience Card */}
            {agent.experience && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Experience</h3>
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-[#FE9200]" />
                  <span className="text-gray-700">{agent.experience}</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Properties & Reviews */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('properties')}
                  className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                    activeTab === 'properties'
                      ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50/50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Home className="w-4 h-4 inline mr-2" />
                  Properties ({properties.length})
                </button>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                    activeTab === 'reviews'
                      ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50/50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Star className="w-4 h-4 inline mr-2" />
                  Reviews ({agent.totalRatings || 0})
                </button>
              </div>
              
              <div className="p-6">
                {activeTab === 'properties' ? (
                  <>
                    {properties.length === 0 ? (
                      <div className="text-center py-12">
                        <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600">No properties listed yet</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {properties.map((property) => (
                          <div key={property.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                            {property.images && property.images[0] && (
                              <img 
                                src={property.images[0]} 
                                alt={property.title}
                                className="w-full h-48 object-cover"
                              />
                            )}
                            <div className="p-4">
                              <h4 className="font-semibold text-gray-900 mb-2">{property.title}</h4>
                              <p className="text-sm text-gray-600 mb-2 flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {property.location}
                              </p>
                              <div className="flex items-center justify-between">
                                <span className="text-lg font-bold text-[#FE9200]">
                                  KSh {property.price?.toLocaleString()}
                                </span>
                                <Button size="sm" variant="outline">View Details</Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <AgentReviews agentId={agent.id} showSummary={true} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inquiry Modal */}
      {showInquiryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Send Inquiry</h3>
            <p className="text-gray-600 mb-4">
              Your inquiry will be sent to {agent.name}. For privacy, the agent cannot see your contact details directly.
            </p>
            
            <textarea
              value={inquiryMessage}
              onChange={(e) => setInquiryMessage(e.target.value)}
              placeholder="Type your message here..."
              className="w-full h-32 px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FE9200] focus:border-[#FE9200] outline-none resize-none mb-4"
            />

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> The agent will respond through the platform. Your personal contact information remains private.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowInquiryForm(false);
                  setInquiryMessage('');
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleSendInquiry}
              >
                <Send className="w-4 h-4 mr-2" />
                Send Inquiry
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      <RatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        agent={agent}
        onSubmit={handleSubmitRating}
        loading={ratingSubmitting}
      />
    </div>
  );
};
