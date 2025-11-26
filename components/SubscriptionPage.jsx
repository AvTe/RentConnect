import React from 'react';
import { ArrowLeft, Check, Shield, Zap } from 'lucide-react';
import { Button } from './ui/Button';

export const SubscriptionPage = ({ onNavigate, onSubscribe }) => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => onNavigate('agent-dashboard')} 
          className="mb-8 flex items-center text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Dashboard
        </button>

        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">
            Unlock Unlimited Leads
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Stop chasing ghost listings. Get direct access to tenants who are actively looking for properties right now.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-emerald-100 max-w-md mx-auto">
          <div className="p-8 bg-emerald-50 border-b border-emerald-100 text-center">
            <h3 className="text-lg font-semibold text-emerald-800 mb-2">Premium Agent</h3>
            <div className="flex justify-center items-baseline mb-4">
              <span className="text-5xl font-extrabold text-gray-900">KSh 15,000</span>
              <span className="text-gray-500 ml-2">/month</span>
            </div>
            <p className="text-emerald-700 text-sm">7-day free trial included</p>
          </div>

          <div className="p-8">
            <ul className="space-y-4 mb-8">
              {[
                'Unlimited access to tenant contacts',
                'Direct WhatsApp & Phone integration',
                'Real-time lead notifications',
                'Verified Agent badge',
                'Priority support'
              ].map((feature, index) => (
                <li key={index} className="flex items-start">
                  <div className="flex-shrink-0">
                    <Check className="w-5 h-5 text-emerald-500" />
                  </div>
                  <p className="ml-3 text-gray-600">{feature}</p>
                </li>
              ))}
            </ul>

            <Button 
              onClick={onSubscribe}
              className="w-full py-4 text-lg shadow-lg shadow-emerald-200"
            >
              Start 7-Day Free Trial
            </Button>
            
            <p className="mt-4 text-center text-xs text-gray-400">
              Cancel anytime. No hidden fees. Secure payment via Paystack.
            </p>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Zap className="w-8 h-8 text-emerald-500" />
            </div>
            <h4 className="font-semibold text-gray-900">Instant Access</h4>
            <p className="text-sm text-gray-500 mt-2">Connect with tenants the moment they post.</p>
          </div>
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Shield className="w-8 h-8 text-emerald-500" />
            </div>
            <h4 className="font-semibold text-gray-900">Verified Leads</h4>
            <p className="text-sm text-gray-500 mt-2">We screen every request to ensure quality.</p>
          </div>
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Check className="w-8 h-8 text-emerald-500" />
            </div>
            <h4 className="font-semibold text-gray-900">Higher Conversion</h4>
            <p className="text-sm text-gray-500 mt-2">Close more deals with serious tenants.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
