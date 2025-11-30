import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, Zap, Shield, Coins } from 'lucide-react';
import { Button } from './ui/Button';
import { getAllCreditBundles } from '@/lib/firestore';

export const SubscriptionPage = ({ onNavigate, onBuyCredits }) => {
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBundles = async () => {
      const result = await getAllCreditBundles();
      if (result.success && result.data.length > 0) {
        setBundles(result.data);
      } else {
        // Fallback to default bundles if none in DB
        setBundles([
          {
            id: 'starter',
            name: 'Starter Pack',
            credits: 10,
            price: '5000',
            perLead: '₦ 500/lead',
            features: ['Perfect for new agents', 'Unlock 10 leads', 'No expiration']
          },
          {
            id: 'pro',
            name: 'Pro Bundle',
            credits: 50,
            price: '20000',
            perLead: '₦ 400/lead',
            popular: true,
            features: ['Best value', 'Unlock 50 leads', 'Priority support', 'Verified Badge']
          },
          {
            id: 'agency',
            name: 'Agency Bulk',
            credits: 200,
            price: '70000',
            perLead: '₦ 350/lead',
            features: ['For teams', 'Unlock 200 leads', 'Dedicated account manager', 'API Access']
          }
        ]);
      }
      setLoading(false);
    };
    fetchBundles();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <button 
          onClick={() => onNavigate('agent-dashboard')} 
          className="mb-8 flex items-center text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Dashboard
        </button>

        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">
            Get Credits, Get Leads
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Pay only for the leads you want. No monthly fees. Credits never expire.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading bundles...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {bundles.map((bundle) => (
              <div key={bundle.id} className={`bg-white rounded-2xl shadow-xl overflow-hidden border ${bundle.popular ? 'border-[#FE9200] ring-2 ring-[#FE9200] ring-opacity-50' : 'border-gray-200'} relative flex flex-col`}>
                {bundle.popular && (
                  <div className="absolute top-0 right-0 bg-[#FE9200] text-white text-xs font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wide">
                    Most Popular
                  </div>
                )}
                
                <div className="p-8 text-center border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{bundle.name}</h3>
                  <div className="flex justify-center items-baseline mb-1">
                    <span className="text-4xl font-extrabold text-gray-900">₦ {parseInt(bundle.price).toLocaleString()}</span>
                  </div>
                  <p className="text-[#FE9200] font-medium text-sm mb-4">{bundle.credits} Credits</p>
                  <div className="inline-block bg-gray-100 rounded-full px-3 py-1 text-xs text-gray-500 font-medium">
                    {bundle.perLead || 'Best Value'}
                  </div>
                </div>

                <div className="p-8 flex-1 flex flex-col">
                  <ul className="space-y-4 mb-8 flex-1">
                    {(Array.isArray(bundle.features) ? bundle.features : []).map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <div className="flex-shrink-0">
                          <Check className="w-5 h-5 text-[#FE9200]" />
                        </div>
                        <p className="ml-3 text-gray-600 text-sm">{feature}</p>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    onClick={() => onBuyCredits(bundle)}
                    className={`w-full py-3 text-lg shadow-lg ${bundle.popular ? 'bg-[#FE9200] hover:bg-[#E58300] shadow-[#FFD4A3]' : 'bg-gray-900 hover:bg-gray-800'}`}
                  >
                    Buy {bundle.credits} Credits
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-16 bg-white rounded-xl p-8 border border-gray-200 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-[#FFE4C4] rounded-full flex items-center justify-center">
                  <Coins className="w-6 h-6 text-[#FE9200]" />
                </div>
              </div>
              <h4 className="font-semibold text-gray-900">Pay As You Go</h4>
              <p className="text-sm text-gray-500 mt-2">1 Credit = 1 Lead Unlock. You are in full control of your spending.</p>
            </div>
            <div>
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-[#FFE4C4] rounded-full flex items-center justify-center">
                  <Shield className="w-6 h-6 text-[#FE9200]" />
                </div>
              </div>
              <h4 className="font-semibold text-gray-900">Verified Leads Only</h4>
              <p className="text-sm text-gray-500 mt-2">We screen every request. If a lead is fake, we refund your credit.</p>
            </div>
            <div>
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-[#FFE4C4] rounded-full flex items-center justify-center">
                  <Zap className="w-6 h-6 text-[#FE9200]" />
                </div>
              </div>
              <h4 className="font-semibold text-gray-900">Instant Reveal</h4>
              <p className="text-sm text-gray-500 mt-2">Get the tenant&apos;s WhatsApp number immediately after unlocking.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
