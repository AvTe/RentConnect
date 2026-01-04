import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, Shield, Phone, Mail, MessageCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from './ui/Button';
import { useToast } from '@/context/ToastContext';
import { getAllSubscriptionPlans } from '@/lib/database';

export const UserSubscriptionPage = ({ currentUser, onNavigate, onSubscribe }) => {
  const { toast } = useToast();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const result = await getAllSubscriptionPlans();
      if (result.success) {
        // Sort by sort_order first, then by price as fallback
        const sortedPlans = (result.data || []).sort((a, b) => {
          const aOrder = a.sort_order !== undefined && a.sort_order !== null ? a.sort_order : 9999;
          const bOrder = b.sort_order !== undefined && b.sort_order !== null ? b.sort_order : 9999;
          if (aOrder !== bOrder) return aOrder - bOrder;
          return parseInt(a.price || 0) - parseInt(b.price || 0);
        });
        setPlans(sortedPlans);
      } else {
        console.error('Failed to fetch plans:', result.error);
        toast.error('Failed to load subscription plans');
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Error loading plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (plan) => {
    if (!currentUser) {
      toast.info('Please login to subscribe');
      onNavigate('login');
      return;
    }

    await onSubscribe({
      userId: currentUser.uid,
      planId: plan.id,
      planName: plan.name,
      amount: parseInt(plan.price),
      period: plan.interval,
      planType: plan.name
    });
  };

  const getFeaturesArray = (plan) => {
    if (Array.isArray(plan.features)) return plan.features;
    if (typeof plan.features === 'string') return plan.features.split(',').map(f => f.trim()).filter(f => f);
    return [];
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => onNavigate('agents-listing')}
          className="mb-8 flex items-center text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Agents
        </button>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Unlock Full Access to Agents
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get direct access to verified real estate agents. View contact details, send messages, and connect with professionals who can help you find your perfect property.
          </p>
        </div>

        {/* What You Get */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-12 max-w-4xl mx-auto">
          <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
            What&apos;s Included
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-[#FFE4C4] rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-[#FE9200]" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Direct Contact</h4>
              <p className="text-sm text-gray-600">
                View phone numbers and call agents directly
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Email Access</h4>
              <p className="text-sm text-gray-600">
                Send emails directly to agents
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-purple-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Priority Messaging</h4>
              <p className="text-sm text-gray-600">
                Get faster responses from agents
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Plans */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 text-[#FE9200] animate-spin" />
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 text-gray-500">
            <AlertCircle className="w-8 h-8 mx-auto mb-4 text-[#FE9200]" />
            <p className="text-lg">No subscription plans available at the moment.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`bg-white rounded-2xl shadow-lg overflow-hidden border-2 transition-all hover:border-[#FFC482] flex flex-col ${plan.tag
                  ? 'border-[#FE9200] ring-4 ring-[#FFE4C4] transform scale-105 z-10'
                  : 'border-gray-200'
                  }`}
              >
                {plan.tag && (
                  <div className="bg-[#FE9200] text-white text-center py-2 text-sm font-semibold uppercase tracking-wide">
                    {plan.tag}
                  </div>
                )}

                <div className="p-8 flex-1 flex flex-col">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 capitalize">
                      {plan.name}
                    </h3>
                    <div className="flex justify-center items-baseline mb-2">
                      <span className="text-4xl font-bold text-gray-900">
                        KSh {parseInt(plan.price).toLocaleString()}
                      </span>
                    </div>
                    <span className="text-gray-500">per {plan.interval}</span>
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {getFeaturesArray(plan).map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="w-5 h-5 text-[#FE9200] mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600 text-sm">{feature}</span>
                      </li>
                    ))}
                    {getFeaturesArray(plan).length === 0 && (
                      <li className="text-gray-400 text-sm italic text-center">Standard features included</li>
                    )}
                  </ul>

                  <Button
                    onClick={() => handleSubscribe(plan)}
                    className={`w-full py-3 ${plan.tag ? 'shadow-lg shadow-[#FFD4A3]' : ''
                      }`}
                    variant={plan.tag ? 'default' : 'outline'}
                  >
                    Get Started
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Security & Trust */}
        <div className="bg-gradient-to-r from-blue-50 to-[#FFF5E6] rounded-2xl p-8 text-center max-w-4xl mx-auto">
          <Shield className="w-12 h-12 text-[#FE9200] mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            Secure & Trusted
          </h3>
          <p className="text-gray-700 mb-4">
            Your payment is secure with Pesapal, East Africa&apos;s trusted payment processor.
            Pay easily with M-Pesa, cards, or mobile money. All agents are verified for your safety.
          </p>
          <div className="flex items-center justify-center gap-8 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#FE9200]" />
              <span>M-Pesa Supported</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#FE9200]" />
              <span>Verified Agents Only</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#FE9200]" />
              <span>No Hidden Fees</span>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-12 max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Frequently Asked Questions
          </h3>
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-2">
                Can I cancel my subscription anytime?
              </h4>
              <p className="text-gray-600">
                Yes! You can cancel your subscription at any time. You&apos;ll continue to have access until the end of your billing period.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-2">
                What payment methods do you accept?
              </h4>
              <p className="text-gray-600">
                We accept M-Pesa, Airtel Money, credit cards, and debit cards through Pesapal, East Africa&apos;s trusted payment platform.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-2">
                Are all agents verified?
              </h4>
              <p className="text-gray-600">
                Yes! All agents on our platform are verified. We check their credentials and ensure they are licensed real estate professionals.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
