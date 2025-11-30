import React, { useState, useEffect } from 'react';
import { Save, User, Lock, Settings as SettingsIcon, DollarSign } from 'lucide-react';
import { Button } from '../ui/Button';
import { updateUser } from '@/lib/firestore';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const Settings = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || ''
  });
  
  const [systemConfig, setSystemConfig] = useState({
    creditPrice: 100,
    freeCredits: 2,
    referralBonus: 5
  });

  useEffect(() => {
    fetchSystemConfig();
  }, []);

  const fetchSystemConfig = async () => {
    try {
      const docRef = doc(db, 'system_config', 'main');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setSystemConfig(docSnap.data());
      }
    } catch (error) {
      console.error('Error fetching system config:', error);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await updateUser(user.id, {
        name: profileData.name,
        phone: profileData.phone
      });
      
      if (result.success) {
        alert('Profile updated successfully');
      } else {
        alert('Error updating profile: ' + result.error);
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await setDoc(doc(db, 'system_config', 'main'), systemConfig);
      alert('System configuration updated successfully');
    } catch (error) {
      console.error(error);
      alert('Error updating configuration: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Settings</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 rounded-lg">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Admin Profile</h3>
          </div>

          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                value={profileData.email}
                disabled
                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="pt-4">
              <Button type="submit" disabled={loading} className="bg-blue-600 text-white">
                <Save className="w-4 h-4 mr-2" /> Save Changes
              </Button>
            </div>
          </form>
        </div>

        {/* System Configuration */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-50 rounded-lg">
              <SettingsIcon className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">System Configuration</h3>
          </div>

          <form onSubmit={handleConfigUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Credit Price (KSh)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  value={systemConfig.creditPrice}
                  onChange={(e) => setSystemConfig({...systemConfig, creditPrice: parseInt(e.target.value)})}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Cost per credit for agents</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Free Credits (New Account)</label>
              <input
                type="number"
                value={systemConfig.freeCredits}
                onChange={(e) => setSystemConfig({...systemConfig, freeCredits: parseInt(e.target.value)})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Referral Bonus (Credits)</label>
              <input
                type="number"
                value={systemConfig.referralBonus}
                onChange={(e) => setSystemConfig({...systemConfig, referralBonus: parseInt(e.target.value)})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="pt-4">
              <Button type="submit" disabled={loading} className="bg-purple-600 text-white">
                <Save className="w-4 h-4 mr-2" /> Update Configuration
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
