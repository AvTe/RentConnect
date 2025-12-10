import React, { useState, useEffect } from 'react';
import { 
  CreditCard, Users, Plus, Trash2, Edit, RefreshCw, CheckCircle, XCircle
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { 
  getAllSubscriptionPlans, 
  createSubscriptionPlan, 
  updateSubscriptionPlan, 
  deleteSubscriptionPlan,
  getAllSubscriptions
} from '@/lib/database';

export const SubscriptionManagement = () => {
  const [activeTab, setActiveTab] = useState('plans'); // plans, subscribers
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Plan Form State
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [planForm, setPlanForm] = useState({
    name: '',
    price: 0,
    interval: 'monthly', // monthly, yearly
    description: '',
    features: ''
  });

  useEffect(() => {
    if (activeTab === 'plans') fetchPlans();
    if (activeTab === 'subscribers') fetchSubscriptions();
  }, [activeTab]);

  const fetchPlans = async () => {
    setLoading(true);
    const result = await getAllSubscriptionPlans();
    if (result.success) setPlans(result.data);
    setLoading(false);
  };

  const fetchSubscriptions = async () => {
    setLoading(true);
    const result = await getAllSubscriptions();
    if (result.success) setSubscriptions(result.data);
    setLoading(false);
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const data = {
      ...planForm,
      features: typeof planForm.features === 'string' 
        ? planForm.features.split(',').map(f => f.trim()) 
        : planForm.features
    };

    try {
      if (currentPlan) {
        await updateSubscriptionPlan(currentPlan.id, data);
      } else {
        await createSubscriptionPlan(data);
      }
      setIsEditingPlan(false);
      setCurrentPlan(null);
      setPlanForm({ name: '', price: 0, interval: 'monthly', description: '', features: '' });
      fetchPlans();
    } catch (error) {
      console.error(error);
      alert('Error saving plan');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlan = async (id) => {
    if (!confirm('Delete this plan?')) return;
    await deleteSubscriptionPlan(id);
    fetchPlans();
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">Subscription Management</h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant={activeTab === 'plans' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('plans')}
            className={`flex-1 sm:flex-none text-xs md:text-sm ${activeTab === 'plans' ? 'bg-blue-600 text-white' : ''}`}
            size="sm"
          >
            Plans
          </Button>
          <Button
            variant={activeTab === 'subscribers' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('subscribers')}
            className={`flex-1 sm:flex-none text-xs md:text-sm ${activeTab === 'subscribers' ? 'bg-blue-600 text-white' : ''}`}
            size="sm"
          >
            Subscribers
          </Button>
        </div>
      </div>

      {activeTab === 'plans' && (
        <div className="space-y-4 md:space-y-6">
          <div className="flex justify-end">
            <Button onClick={() => {
              setCurrentPlan(null);
              setPlanForm({ name: '', price: 0, interval: 'monthly', description: '', features: '' });
              setIsEditingPlan(true);
            }} className="bg-blue-600 text-white w-full sm:w-auto" size="sm">
              <Plus className="w-4 h-4 mr-2" /> Add New Plan
            </Button>
          </div>

          {isEditingPlan && (
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 mb-4 md:mb-6">
              <h3 className="font-bold mb-4 text-sm md:text-base">{currentPlan ? 'Edit Plan' : 'New Plan'}</h3>
              <form onSubmit={handleSavePlan} className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">Plan Name</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400"
                    placeholder="e.g., Premium Plan"
                    value={planForm.name}
                    onChange={e => setPlanForm({...planForm, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">Price (KSh)</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400"
                    placeholder="e.g., 1500"
                    value={planForm.price}
                    onChange={e => setPlanForm({...planForm, price: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">Billing Interval</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                    value={planForm.interval}
                    onChange={e => setPlanForm({...planForm, interval: e.target.value})}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400"
                    placeholder="Brief description"
                    value={planForm.description}
                    onChange={e => setPlanForm({...planForm, description: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">Features (comma separated)</label>
                  <textarea
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400"
                    placeholder="e.g., Unlimited leads, Priority support"
                    value={planForm.features}
                    onChange={e => setPlanForm({...planForm, features: e.target.value})}
                    rows="3"
                  />
                </div>
                <div className="md:col-span-2 flex flex-col sm:flex-row gap-2 justify-end mt-2">
                  <Button type="button" variant="ghost" onClick={() => setIsEditingPlan(false)} className="w-full sm:w-auto">Cancel</Button>
                  <Button type="submit" className="bg-blue-600 text-white w-full sm:w-auto">Save Plan</Button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {plans.map(plan => (
              <div key={plan.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
                <h3 className="font-bold text-base md:text-lg">{plan.name}</h3>
                <div className="text-xl md:text-2xl font-bold text-blue-600 my-2">KSh {parseInt(plan.price).toLocaleString()} <span className="text-xs md:text-sm text-gray-500 font-normal">/{plan.interval}</span></div>
                <p className="text-xs md:text-sm text-gray-500 mb-3 md:mb-4">{plan.description}</p>
                <ul className="text-xs md:text-sm space-y-1 mb-4 md:mb-6 text-gray-600">
                  {Array.isArray(plan.features) && plan.features.map((f, i) => (
                    <li key={i}>• {f}</li>
                  ))}
                </ul>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setCurrentPlan(plan);
                      setPlanForm({
                        name: plan.name,
                        price: plan.price,
                        interval: plan.interval,
                        description: plan.description,
                        features: Array.isArray(plan.features) ? plan.features.join(', ') : plan.features
                      });
                      setIsEditingPlan(true);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-red-600 hover:bg-red-50"
                    onClick={() => handleDeletePlan(plan.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'subscribers' && (
        <>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            <div className="flex justify-between items-center bg-white rounded-xl p-3 border border-gray-200">
              <h3 className="font-bold text-gray-900 text-sm">Active Subscriptions</h3>
              <Button onClick={fetchSubscriptions} variant="ghost" size="sm"><RefreshCw className="w-4 h-4" /></Button>
            </div>
            {loading ? (
              <div className="bg-white rounded-xl p-6 text-center text-gray-500">Loading...</div>
            ) : subscriptions.length === 0 ? (
              <div className="bg-white rounded-xl p-6 text-center text-gray-500">No subscriptions found</div>
            ) : (
              subscriptions.map((sub) => (
                <div key={sub.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-medium text-sm text-gray-900">{sub.users?.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">{sub.users?.email || sub.user_id}</p>
                    </div>
                    <Badge className={`text-xs ${
                      sub.status === 'active' ? 'bg-green-100 text-green-800' :
                      sub.status === 'expired' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {sub.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs mt-3">
                    <div>
                      <span className="text-gray-500">Plan:</span>
                      <span className="ml-1 font-medium">{sub.plan_name || sub.plan}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Amount:</span>
                      <span className="ml-1 font-medium">KSh {parseInt(sub.amount || 0).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Start:</span>
                      <span className="ml-1">{sub.starts_at ? new Date(sub.starts_at).toLocaleDateString() :
                       sub.startDate?.toDate ? sub.startDate.toDate().toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Expires:</span>
                      <span className="ml-1">{sub.expires_at ? new Date(sub.expires_at).toLocaleDateString() :
                       sub.endDate?.toDate ? sub.endDate.toDate().toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-bold text-gray-900">Active Subscriptions</h3>
              <Button onClick={fetchSubscriptions} variant="ghost" size="sm"><RefreshCw className="w-4 h-4" /></Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3">User</th>
                    <th className="px-6 py-3">Plan</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Start Date</th>
                    <th className="px-6 py-3">Expires</th>
                    <th className="px-6 py-3">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr><td colSpan="6" className="px-6 py-8 text-center">Loading...</td></tr>
                  ) : subscriptions.length === 0 ? (
                    <tr><td colSpan="6" className="px-6 py-8 text-center">No subscriptions found</td></tr>
                  ) : (
                    subscriptions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-gray-900">
                          <div>
                            <p className="font-medium">{sub.users?.name || 'Unknown'}</p>
                            <p className="text-xs text-gray-500">{sub.users?.email || sub.user_id}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium">{sub.plan_name || sub.plan}</td>
                        <td className="px-6 py-4">
                          <Badge className={
                            sub.status === 'active' ? 'bg-green-100 text-green-800' :
                            sub.status === 'expired' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            {sub.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {sub.starts_at ? new Date(sub.starts_at).toLocaleDateString() :
                           sub.startDate?.toDate ? sub.startDate.toDate().toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {sub.expires_at ? new Date(sub.expires_at).toLocaleDateString() :
                           sub.endDate?.toDate ? sub.endDate.toDate().toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4">KSh {parseInt(sub.amount || 0).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
