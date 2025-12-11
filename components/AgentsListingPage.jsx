import React, { useState, useEffect, useCallback } from 'react';
/* eslint-disable @next/next/no-img-element */
import { 
  Search, MapPin, Users, Building2, Phone, Mail, 
  MessageCircle, UserPlus, Star, Filter, Award,
  Lock, CheckCircle
} from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { StarRating } from './ui/StarRating';
import { getAllAgents, searchAgents, sendConnectionRequest, checkUserCanViewContact } from '../lib/database';

export const AgentsListingPage = ({ currentUser, onNavigate, onViewAgentProfile }) => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [canViewContacts, setCanViewContacts] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);

  const loadAgents = useCallback(async () => {
    setLoading(true);
    const result = await getAllAgents({});
    if (result.success) {
      setAgents(result.data);
    }
    setLoading(false);
  }, []);

  const checkContactPermission = useCallback(async () => {
    if (currentUser) {
      const result = await checkUserCanViewContact(currentUser.uid);
      setCanViewContacts(result.canView);
    }
  }, [currentUser]);

  useEffect(() => {
    loadAgents();
    if (currentUser && currentUser.role === 'user') {
      checkContactPermission();
    } else if (currentUser && currentUser.role === 'agent') {
      setCanViewContacts(true); // Agents can see other agents' contacts
    }
  }, [currentUser, loadAgents, checkContactPermission]);

  const handleSearch = async () => {
    if (searchTerm.trim()) {
      setLoading(true);
      const result = await searchAgents(searchTerm);
      if (result.success) {
        setAgents(result.data);
      }
      setLoading(false);
    } else {
      loadAgents();
    }
  };

  const handleConnect = async (agentId) => {
    if (!currentUser) {
      alert('Please login to connect with agents');
      return;
    }

    if (currentUser.role === 'agent') {
      const result = await sendConnectionRequest(currentUser.uid, agentId);
      if (result.success) {
        alert('Connection request sent successfully!');
      } else {
        alert('Failed to send connection request');
      }
    }
  };

  const handleContactClick = (agent) => {
    if (currentUser?.role === 'user' && !canViewContacts) {
      setSelectedAgent(agent);
    }
  };

  const AgentCard = ({ agent }) => {
    const isCurrentUser = currentUser?.uid === agent.id;
    const isAgent = currentUser?.role === 'agent';
    const showContact = isAgent || canViewContacts;

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all overflow-hidden">
        {/* Header with cover image */}
        <div className="h-32 bg-gradient-to-r from-[#FFB461] to-blue-500 relative">
          <div className="absolute -bottom-12 left-6">
            <div className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center">
              {agent.photoURL ? (
                <img src={agent.photoURL} alt={agent.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-[#FE9200]">
                  {agent.name?.charAt(0) || 'A'}
                </span>
              )}
            </div>
          </div>
          {agent.verified && (
            <Badge className="absolute top-4 right-4 bg-white text-[#FE9200] border-[#FE9200]">
              <CheckCircle className="w-3 h-3 mr-1" />
              Verified
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="pt-16 px-6 pb-6">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-900 mb-1">{agent.name}</h3>
            {agent.agencyName && (
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                {agent.agencyName}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b border-gray-100">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">{agent.propertiesCount || 0}</div>
              <div className="text-xs text-gray-500">Properties</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">{agent.connectionsCount || 0}</div>
              <div className="text-xs text-gray-500">Connections</div>
            </div>
            <div className="text-center">
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1">
                  <span className="text-lg font-bold text-gray-900">
                    {agent.averageRating ? parseFloat(agent.averageRating).toFixed(1) : '0.0'}
                  </span>
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                </div>
                <div className="text-xs text-gray-500">
                  {agent.totalRatings || 0} {agent.totalRatings === 1 ? 'review' : 'reviews'}
                </div>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="space-y-2 mb-4">
            {agent.location && (
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                {agent.location}
              </div>
            )}
            {agent.experience && (
              <div className="flex items-center text-sm text-gray-600">
                <Award className="w-4 h-4 mr-2 text-gray-400" />
                {agent.experience}
              </div>
            )}
            
            {/* Contact Info - Conditional Display */}
            {showContact ? (
              <>
                {agent.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="w-4 h-4 mr-2 text-gray-400" />
                    <a href={`tel:${agent.phone}`} className="hover:text-[#FE9200]">
                      {agent.phone}
                    </a>
                  </div>
                )}
                {agent.email && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="w-4 h-4 mr-2 text-gray-400" />
                    <a href={`mailto:${agent.email}`} className="hover:text-[#FE9200] truncate">
                      {agent.email}
                    </a>
                  </div>
                )}
              </>
            ) : (
              <div 
                onClick={() => handleContactClick(agent)}
                className="flex items-center text-sm text-gray-400 bg-gray-50 p-3 rounded-lg cursor-pointer hover:bg-gray-100"
              >
                <Lock className="w-4 h-4 mr-2" />
                <span>Contact details locked - Subscribe to view</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {!isCurrentUser && (
              <>
                {isAgent ? (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleConnect(agent.id)}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Connect
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => showContact ? null : onNavigate('user-subscription')}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    {showContact ? 'Message' : 'Subscribe to Contact'}
                  </Button>
                )}
                <Button
                  className="flex-1"
                  onClick={() => onViewAgentProfile(agent)}
                >
                  View Profile
                </Button>
              </>
            )}
            {isCurrentUser && (
              <Button
                className="w-full"
                onClick={() => onNavigate('agent-profile')}
              >
                Edit Profile
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#FE9200] to-blue-600 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Find Your Perfect Agent</h1>
          <p className="text-lg text-[#FFF5E6] mb-8">
            Connect with verified real estate professionals in your area
          </p>

          {/* Search Bar */}
          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, agency, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#FE9200] focus:border-[#FE9200] outline-none text-gray-900 bg-white placeholder-gray-400"
                />
              </div>
              <Button onClick={handleSearch} className="px-8">
                Search
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Stats */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {agents.length} Agents Available
            </h2>
            {!canViewContacts && currentUser?.role === 'user' && (
              <p className="text-sm text-amber-600 mt-1">
                <Lock className="w-4 h-4 inline mr-1" />
                Subscribe to view agent contact details
              </p>
            )}
          </div>
          <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <Filter className="w-5 h-5" />
            Filters
          </button>
        </div>

        {/* Agents Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 h-96 animate-pulse">
                <div className="h-32 bg-gray-200"></div>
                <div className="p-6 space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-20 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : agents.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No agents found</h3>
            <p className="text-gray-600">Try adjusting your search criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}
      </div>

      {/* Subscription Modal */}
      {selectedAgent && !canViewContacts && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-8">
            <div className="text-center mb-6">
              <Lock className="w-16 h-16 text-[#FE9200] mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Unlock Agent Contacts
              </h3>
              <p className="text-gray-600">
                Subscribe to access contact details of {selectedAgent.name} and all other agents
              </p>
            </div>

            <div className="bg-[#FFF5E6] border border-[#FFD4A3] rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-700 font-medium">Premium Access</span>
                <span className="text-2xl font-bold text-[#FE9200]">KSh 5,000/mo</span>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✓ View all agent contact details</li>
                <li>✓ Direct messaging access</li>
                <li>✓ Priority support</li>
                <li>✓ Cancel anytime</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setSelectedAgent(null)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  setSelectedAgent(null);
                  onNavigate('user-subscription');
                }}
              >
                Subscribe Now
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
