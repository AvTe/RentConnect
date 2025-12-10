import React, { useState, useEffect } from 'react';
import { 
  DollarSign, CreditCard, Download, Plus, Trash2, Edit, RefreshCw, FileText
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { 
  getAllTransactions, 
  getAllCreditBundles, 
  createCreditBundle, 
  updateCreditBundle, 
  deleteCreditBundle,
  addCredits
} from '@/lib/database';

export const FinanceManagement = () => {
  const [activeTab, setActiveTab] = useState('transactions'); // transactions, bundles, reports
  const [transactions, setTransactions] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Bundle Form State
  const [isEditingBundle, setIsEditingBundle] = useState(false);
  const [currentBundle, setCurrentBundle] = useState(null);
  const [bundleForm, setBundleForm] = useState({
    name: '',
    credits: 0,
    price: 0,
    perLead: '',
    features: '',
    popular: false
  });

  useEffect(() => {
    if (activeTab === 'transactions') fetchTransactions();
    if (activeTab === 'bundles') fetchBundles();
  }, [activeTab]);

  const fetchTransactions = async () => {
    setLoading(true);
    const result = await getAllTransactions(100);
    if (result.success) setTransactions(result.data);
    setLoading(false);
  };

  const fetchBundles = async () => {
    setLoading(true);
    const result = await getAllCreditBundles();
    if (result.success) setBundles(result.data);
    setLoading(false);
  };

  const handleSaveBundle = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const data = {
      ...bundleForm,
      features: typeof bundleForm.features === 'string' 
        ? bundleForm.features.split(',').map(f => f.trim()) 
        : bundleForm.features
    };

    try {
      if (currentBundle) {
        await updateCreditBundle(currentBundle.id, data);
      } else {
        await createCreditBundle(data);
      }
      setIsEditingBundle(false);
      setCurrentBundle(null);
      setBundleForm({ name: '', credits: 0, price: 0, perLead: '', features: '', popular: false });
      fetchBundles();
    } catch (error) {
      console.error(error);
      alert('Error saving bundle');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBundle = async (id) => {
    if (!confirm('Delete this bundle?')) return;
    await deleteCreditBundle(id);
    fetchBundles();
  };

  const handleRefund = async (transaction) => {
    if (!confirm(`Refund ${transaction.amount} credits to user?`)) return;
    
    setLoading(true);
    // Logic: Add credits back to user and mark transaction as refunded (or create new refund tx)
    // For simplicity, we just add credits back with a "Refund" reason
    const result = await addCredits(transaction.userId, transaction.amount, `Refund for TX: ${transaction.id}`);
    
    if (result.success) {
      alert('Refund processed successfully');
      fetchTransactions();
    } else {
      alert('Error processing refund');
    }
    setLoading(false);
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Type', 'Amount', 'Description', 'User ID', 'Date'];
    const csvContent = [
      headers.join(','),
      ...transactions.map(tx => [
        tx.id,
        tx.type,
        tx.amount,
        `"${tx.description}"`,
        tx.userId,
        tx.createdAt?.toDate ? tx.createdAt.toDate().toISOString() : ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">Financial Management</h2>
        <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <Button
            variant={activeTab === 'transactions' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('transactions')}
            className={`whitespace-nowrap text-xs md:text-sm ${activeTab === 'transactions' ? 'bg-blue-600 text-white' : ''}`}
            size="sm"
          >
            Transactions
          </Button>
          <Button
            variant={activeTab === 'bundles' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('bundles')}
            className={`whitespace-nowrap text-xs md:text-sm ${activeTab === 'bundles' ? 'bg-blue-600 text-white' : ''}`}
            size="sm"
          >
            Bundles
          </Button>
          <Button
            variant={activeTab === 'reports' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('reports')}
            className={`whitespace-nowrap text-xs md:text-sm ${activeTab === 'reports' ? 'bg-blue-600 text-white' : ''}`}
            size="sm"
          >
            Reports
          </Button>
        </div>
      </div>

      {activeTab === 'transactions' && (
        <>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            <div className="flex justify-between items-center bg-white rounded-xl p-3 border border-gray-200">
              <h3 className="font-bold text-gray-900 text-sm">Recent Transactions</h3>
              <Button onClick={fetchTransactions} variant="ghost" size="sm"><RefreshCw className="w-4 h-4" /></Button>
            </div>
            {loading ? (
              <div className="bg-white rounded-xl p-6 text-center text-gray-500">Loading...</div>
            ) : transactions.length === 0 ? (
              <div className="bg-white rounded-xl p-6 text-center text-gray-500">No transactions found</div>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge className={`text-xs ${
                      tx.type === 'credit_purchase' ? 'bg-[#FFE4C4] text-green-800' :
                      tx.type === 'lead_unlock' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {tx.type}
                    </Badge>
                    <span className={`font-mono font-bold text-sm ${
                      tx.type === 'credit_deduct' || tx.type === 'lead_unlock' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {tx.type === 'credit_deduct' || tx.type === 'lead_unlock' ? '-' : '+'}{tx.amount}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 mb-1 line-clamp-2">{tx.description}</p>
                  <p className="text-xs text-gray-500 mb-3">
                    {tx.createdAt?.toDate ? tx.createdAt.toDate().toLocaleDateString() : 'N/A'}
                  </p>
                  {(tx.type === 'lead_unlock' || tx.type === 'credit_deduct') && (
                    <Button
                      onClick={() => handleRefund(tx)}
                      variant="outline"
                      size="sm"
                      className="w-full text-red-600 border-red-200 hover:bg-red-50"
                    >
                      Refund
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-bold text-gray-900">Recent Transactions</h3>
              <Button onClick={fetchTransactions} variant="ghost" size="sm"><RefreshCw className="w-4 h-4" /></Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Description</th>
                    <th className="px-6 py-3">Amount</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr><td colSpan="5" className="px-6 py-8 text-center">Loading...</td></tr>
                  ) : transactions.length === 0 ? (
                    <tr><td colSpan="5" className="px-6 py-8 text-center">No transactions found</td></tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-gray-500">
                          {tx.createdAt?.toDate ? tx.createdAt.toDate().toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={
                            tx.type === 'credit_purchase' ? 'bg-[#FFE4C4] text-green-800' :
                            tx.type === 'lead_unlock' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            {tx.type}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-gray-900">{tx.description}</td>
                        <td className="px-6 py-4 font-mono font-medium">
                          {tx.type === 'credit_deduct' || tx.type === 'lead_unlock' ? '-' : '+'}{tx.amount}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {(tx.type === 'lead_unlock' || tx.type === 'credit_deduct') && (
                            <Button
                              onClick={() => handleRefund(tx)}
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:bg-red-50"
                            >
                              Refund
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'bundles' && (
        <div className="space-y-4 md:space-y-6">
          <div className="flex justify-end">
            <Button onClick={() => {
              setCurrentBundle(null);
              setBundleForm({ name: '', credits: 0, price: 0, perLead: '', features: '', popular: false });
              setIsEditingBundle(true);
            }} className="bg-blue-600 text-white w-full sm:w-auto" size="sm">
              <Plus className="w-4 h-4 mr-2" /> Add New Bundle
            </Button>
          </div>

          {isEditingBundle && (
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 mb-4 md:mb-6">
              <h3 className="font-bold mb-4 text-sm md:text-base">{currentBundle ? 'Edit Bundle' : 'New Bundle'}</h3>
              <form onSubmit={handleSaveBundle} className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium mb-1">Bundle Name</label>
                  <input
                    className="w-full border rounded p-2.5 text-sm"
                    value={bundleForm.name}
                    onChange={e => setBundleForm({...bundleForm, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium mb-1">Credits</label>
                  <input
                    type="number"
                    className="w-full border rounded p-2.5 text-sm"
                    value={bundleForm.credits}
                    onChange={e => setBundleForm({...bundleForm, credits: parseInt(e.target.value)})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium mb-1">Price (KSh)</label>
                  <input
                    className="w-full border rounded p-2.5 text-sm"
                    value={bundleForm.price}
                    onChange={e => setBundleForm({...bundleForm, price: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium mb-1">Per Lead Text</label>
                  <input
                    className="w-full border rounded p-2.5 text-sm"
                    value={bundleForm.perLead}
                    onChange={e => setBundleForm({...bundleForm, perLead: e.target.value})}
                    placeholder="e.g. KSh 50/lead"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs md:text-sm font-medium mb-1">Features (comma separated)</label>
                  <textarea
                    className="w-full border rounded p-2.5 text-sm"
                    value={bundleForm.features}
                    onChange={e => setBundleForm({...bundleForm, features: e.target.value})}
                    rows="3"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={bundleForm.popular}
                      onChange={e => setBundleForm({...bundleForm, popular: e.target.checked})}
                    />
                    <span className="text-xs md:text-sm font-medium">Mark as Popular</span>
                  </label>
                </div>
                <div className="md:col-span-2 flex flex-col sm:flex-row gap-2 justify-end mt-2">
                  <Button type="button" variant="ghost" onClick={() => setIsEditingBundle(false)} className="w-full sm:w-auto">Cancel</Button>
                  <Button type="submit" className="bg-blue-600 text-white w-full sm:w-auto">Save Bundle</Button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {bundles.map(bundle => (
              <div key={bundle.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 relative">
                {bundle.popular && (
                  <span className="absolute top-0 right-0 bg-[#FE9200] text-white text-xs px-2 py-1 rounded-bl-lg">POPULAR</span>
                )}
                <h3 className="font-bold text-base md:text-lg">{bundle.name}</h3>
                <div className="text-xl md:text-2xl font-bold text-blue-600 my-2">{bundle.price}</div>
                <p className="text-xs md:text-sm text-gray-500 mb-3 md:mb-4">{bundle.credits} Credits • {bundle.perLead}</p>
                <ul className="text-xs md:text-sm space-y-1 mb-4 md:mb-6 text-gray-600">
                  {Array.isArray(bundle.features) && bundle.features.map((f, i) => (
                    <li key={i}>• {f}</li>
                  ))}
                </ul>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setCurrentBundle(bundle);
                      setBundleForm({
                        name: bundle.name,
                        credits: bundle.credits,
                        price: bundle.price,
                        perLead: bundle.perLead,
                        features: Array.isArray(bundle.features) ? bundle.features.join(', ') : bundle.features,
                        popular: bundle.popular || false
                      });
                      setIsEditingBundle(true);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-red-600 hover:bg-red-50"
                    onClick={() => handleDeleteBundle(bundle.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 text-center">
          <FileText className="w-10 h-10 md:w-12 md:h-12 text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">Financial Reports</h3>
          <p className="text-sm md:text-base text-gray-500 mb-4 md:mb-6">Download detailed transaction history for accounting.</p>
          <Button onClick={handleExportCSV} className="bg-blue-600 text-white w-full sm:w-auto">
            <Download className="w-4 h-4 mr-2" /> Export Transactions (CSV)
          </Button>
        </div>
      )}
    </div>
  );
};
