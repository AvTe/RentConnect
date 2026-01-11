import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { User, Mail, Phone, MapPin, Camera, Save, Building, ShieldCheck, ShieldAlert, Loader2, MessageCircle, LogOut, HelpCircle, Wallet, Gift, FolderOpen, ChevronRight } from 'lucide-react';
import { Button } from './ui/Button';
import { uploadProfileImage } from '@/lib/storage-supabase';

export const AgentProfile = ({ agent, onSave, onCancel, onLogout, onOpenSupport, onNavigate }) => {
  const [formData, setFormData] = useState({
    name: agent?.name || '',
    agencyName: agent?.agencyName || '',
    email: agent?.email || '',
    phone: agent?.phone || '',
    experience: agent?.experience || '',
    location: agent?.location || agent?.city || '',
    profileImage: agent?.profileImage || null
  });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const isVerified = agent?.verificationStatus === 'verified';
  const isPending = agent?.verificationStatus === 'pending';

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await uploadProfileImage(agent?.uid || agent?.id, file);
      if (result.success) {
        setFormData({ ...formData, profileImage: result.url });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header - more compact on mobile */}
      <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h2 className="text-lg md:text-xl font-bold text-gray-900">Edit Agent Profile</h2>
        {isVerified && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#FFF5E6] text-[#E58300] rounded-full text-xs md:text-sm font-medium">
            <ShieldCheck className="w-3.5 h-3.5 md:w-4 md:h-4" />
            Verified Agent
          </div>
        )}
        {isPending && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs md:text-sm font-medium">
            <ShieldAlert className="w-3.5 h-3.5 md:w-4 md:h-4" />
            Verification Pending
          </div>
        )}
      </div>

      {/* Form with bottom padding for mobile nav */}
      <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4 md:space-y-6 pb-20 md:pb-6">
        {/* Photo Upload - smaller on mobile */}
        <div className="flex items-center gap-4 md:gap-6">
          <div className="relative flex-shrink-0">
            {formData.profileImage ? (
              <div className="w-16 h-16 md:w-24 md:h-24 rounded-full overflow-hidden border-2 md:border-4 border-white shadow-md">
                <Image
                  src={formData.profileImage}
                  alt="Profile"
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xl md:text-2xl font-bold border-2 md:border-4 border-white shadow-md">
                {String(formData.name || 'A').charAt(0)}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-0.5 -right-0.5 md:bottom-0 md:right-0 bg-[#FE9200] text-white p-1.5 md:p-2 rounded-full hover:bg-[#E58300] transition-colors shadow-sm disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" />
              ) : (
                <Camera className="w-3 h-3 md:w-4 md:h-4" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm md:text-base">Profile Photo</h3>
            <p className="text-xs md:text-sm text-gray-500">PNG, JPG up to 5MB</p>
          </div>
        </div>

        {/* Form fields - stack on mobile */}
        <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 md:gap-6">
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full pl-9 md:pl-10 pr-4 py-2.5 md:py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#FE9200] focus:border-[#FE9200] outline-none transition-all bg-white text-gray-900 placeholder-gray-400 text-sm md:text-base"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Agency Name</label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
              <input
                type="text"
                value={formData.agencyName}
                onChange={(e) => setFormData({...formData, agencyName: e.target.value})}
                className="w-full pl-9 md:pl-10 pr-4 py-2.5 md:py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#FE9200] focus:border-[#FE9200] outline-none transition-all bg-white text-gray-900 placeholder-gray-400 text-sm md:text-base"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full pl-9 md:pl-10 pr-4 py-2.5 md:py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#FE9200] focus:border-[#FE9200] outline-none transition-all bg-white text-gray-900 placeholder-gray-400 text-sm md:text-base"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full pl-9 md:pl-10 pr-4 py-2.5 md:py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#FE9200] focus:border-[#FE9200] outline-none transition-all bg-white text-gray-900 placeholder-gray-400 text-sm md:text-base"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Experience (Years)</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
              <input
                type="number"
                min="0"
                placeholder="e.g. 5"
                value={formData.experience}
                onChange={(e) => setFormData({...formData, experience: e.target.value})}
                className="w-full pl-9 md:pl-10 pr-4 py-2.5 md:py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#FE9200] focus:border-[#FE9200] outline-none transition-all bg-white text-gray-900 placeholder-gray-400 text-sm md:text-base"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
              <input
                type="text"
                placeholder="e.g. Westlands, Nairobi"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="w-full pl-9 md:pl-10 pr-4 py-2.5 md:py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#FE9200] focus:border-[#FE9200] outline-none transition-all bg-white text-gray-900 placeholder-gray-400 text-sm md:text-base"
              />
            </div>
          </div>
        </div>

        {/* Action buttons - full width on mobile */}
        <div className="pt-2 md:pt-4 flex flex-col-reverse sm:flex-row justify-end gap-2 md:gap-4">
          <Button type="button" variant="ghost" onClick={onCancel} className="w-full sm:w-auto text-sm">
            Cancel
          </Button>
          <Button type="submit" className="w-full sm:w-auto flex items-center justify-center gap-2 text-sm">
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>

        {/* Mobile Navigation Section - Only visible on mobile */}
        {onNavigate && (
          <div className="border-t border-gray-100 pt-4 md:pt-6 mt-4 md:mt-6 md:hidden">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Navigation</h3>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => onNavigate('wallet')}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-[#FE9200] hover:bg-[#FFF5E6] transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-[#FE9200]" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">Wallet</p>
                    <p className="text-xs text-gray-500">Balance & Transactions</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('rewards')}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-[#FE9200] hover:bg-[#FFF5E6] transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                    <Gift className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">Rewards</p>
                    <p className="text-xs text-gray-500">Earn rewards & bonuses</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('assets')}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-[#FE9200] hover:bg-[#FFF5E6] transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                    <FolderOpen className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">My Assets</p>
                    <p className="text-xs text-gray-500">Your saved content</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>
        )}

        {/* Quick Actions Section */}
        <div className="border-t border-gray-100 pt-4 md:pt-6 mt-4 md:mt-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2 md:gap-3">
            {onOpenSupport && (
              <button
                type="button"
                onClick={onOpenSupport}
                className="flex items-center gap-2 p-2 md:p-3 rounded-xl border border-gray-200 hover:border-[#FE9200] hover:bg-[#FFF5E6] transition-all text-left"
              >
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <HelpCircle className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs md:text-sm font-medium text-gray-900">Support</p>
                  <p className="text-[10px] md:text-xs text-gray-500">Get help</p>
                </div>
              </button>
            )}
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-2 p-2 md:p-3 rounded-xl border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-all text-left"
              >
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                  <LogOut className="w-4 h-4 md:w-5 md:h-5 text-red-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs md:text-sm font-medium text-gray-900">Logout</p>
                  <p className="text-[10px] md:text-xs text-gray-500">Sign out</p>
                </div>
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
