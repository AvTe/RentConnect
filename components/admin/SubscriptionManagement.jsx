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
} from '@/lib/firestore';

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Subscription Management</h2>
        <div className="flex gap-2">
          <Button 
            variant={activeTab === 'plans' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('plans')}
            className={activeTab === 'plans' ? 'bg-blue-600 text-white' : ''}
          >
            Plans
          </Button>
          <Button 
            variant={activeTab === 'subscribers' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('subscribers')}
            className={activeTab === 'subscribers' ? 'bg-blue-600 text-white' : ''}
          >
            Subscribers
          </Button>
        </div>
      </div>

      {activeTab === 'plans' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={() => {
              setCurrentPlan(null);
              setPlanForm({ name: '', price: 0, interval: 'monthly', description: '', features: '' });
              setIsEditingPlan(true);
            }} className="bg-blue-600 text-white">
              <Plus className="w-4 h-4 mr-2" /> Add New Plan
            </Button>
          </div>

          {isEditingPlan && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
              <h3 className="font-bold mb-4">{currentPlan ? 'Edit Plan' : 'New Plan'}</h3>
              <form onSubmit={handleSavePlan} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Plan Name</label>
                  <input 
                    className="w-full border rounded p-2" 
                    value={planForm.name}
                    onChange={e => setPlanForm({...planForm, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Price (₦)</label>
                  <input 
                    type="number"
                    className="w-full border rounded p-2" 
                    value={planForm.price}
                    onChange={e => setPlanForm({...planForm, price: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Interval</label>
                  <select 
                    className="w-full border rounded p-2"
                    value={planForm.interval}
                    onChange={e => setPlanForm({...planForm, interval: e.target.value})}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <input 
                    className="w-full border rounded p-2" 
                    value={planForm.description}
                    onChange={e => setPlanForm({...planForm, description: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Features (comma separated)</label>
                  <textarea 
                    className="w-full border rounded p-2" 
                    value={planForm.features}
                    onChange={e => setPlanForm({...planForm, features: e.target.value})}
                    rows="3"
                  />
                </div>
                <div className="md:col-span-2 flex gap-2 justify-end mt-2">
                  <Button type="button" variant="ghost" onClick={() => setIsEditingPlan(false)}>Cancel</Button>
                  <Button type="submit" className="bg-blue-600 text-white">Save Plan</Button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map(plan => (
              <div key={plan.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-bold text-lg">{plan.name}</h3>
                <div className="text-2xl font-bold text-blue-600 my-2">₦ {parseInt(plan.price).toLocaleString()} <span className="text-sm text-gray-500 font-normal">/{plan.interval}</span></div>
                <p className="text-sm text-gray-500 mb-4">{plan.description}</p>
                <ul className="text-sm space-y-1 mb-6 text-gray-600">
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-bold text-gray-900">Active Subscriptions</h3>
            <Button onClick={fetchSubscriptions} variant="ghost" size="sm"><RefreshCw className="w-4 h-4" /></Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3">Agent ID</th>
                  <th className="px-6 py-3">Plan</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Start Date</th>
                  <th className="px-6 py-3">End Date</th>
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
                      <td className="px-6 py-4 text-gray-900 font-mono text-xs">{sub.agentId}</td>
                      <td className="px-6 py-4 font-medium">{sub.plan}</td>
                      <td className="px-6 py-4">
                        <Badge className={
                          sub.status === 'active' ? 'bg-[#FFE4C4] text-green-800' : 'bg-gray-100 text-gray-800'
                        }>
                          {sub.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {sub.startDate?.toDate ? sub.startDate.toDate().toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {sub.endDate?.toDate ? sub.endDate.toDate().toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4">₦ {parseInt(sub.amount || 0).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
