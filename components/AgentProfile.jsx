import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Camera, Save, Building, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Button } from './ui/Button';

export const AgentProfile = ({ agent, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: agent?.name || '',
    agencyName: agent?.agencyName || '',
    email: agent?.email || '',
    phone: agent?.phone || '',
    experience: agent?.experience || '',
    location: agent?.location || agent?.city || ''
  });

  const isVerified = agent?.verificationStatus === 'verified';
  const isPending = agent?.verificationStatus === 'pending';

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Edit Agent Profile</h2>
        {isVerified && (
          <div className="flex items-center gap-2 px-3 py-1 bg-[#FFF5E6] text-[#E58300] rounded-full text-sm font-medium">
            <ShieldCheck className="w-4 h-4" />
            Verified Agent
          </div>
        )}
        {isPending && (
          <div className="flex items-center gap-2 px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-sm font-medium">
            <ShieldAlert className="w-4 h-4" />
            Verification Pending
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Photo Upload */}
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-2xl font-bold border-4 border-white shadow-md">
              {(formData.name || 'A').charAt(0)}
            </div>
            <button type="button" className="absolute bottom-0 right-0 bg-[#FE9200] text-white p-2 rounded-full hover:bg-[#E58300] transition-colors shadow-sm">
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Profile Photo</h3>
            <p className="text-sm text-gray-500">PNG, JPG up to 5MB</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full pl-10 px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#FE9200] focus:border-[#FE9200] outline-none transition-all bg-white text-gray-900 placeholder-gray-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Agency Name</label>
            <div className="relative">
              <Building className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={formData.agencyName}
                onChange={(e) => setFormData({...formData, agencyName: e.target.value})}
                className="w-full pl-10 px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#FE9200] focus:border-[#FE9200] outline-none transition-all bg-white text-gray-900 placeholder-gray-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full pl-10 px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#FE9200] focus:border-[#FE9200] outline-none transition-all bg-white text-gray-900 placeholder-gray-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full pl-10 px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#FE9200] focus:border-[#FE9200] outline-none transition-all bg-white text-gray-900 placeholder-gray-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Experience (Years)</label>
            <div className="relative">
              <User className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              <input
                type="number"
                min="0"
                placeholder="e.g. 5"
                value={formData.experience}
                onChange={(e) => setFormData({...formData, experience: e.target.value})}
                className="w-full pl-10 px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#FE9200] focus:border-[#FE9200] outline-none transition-all bg-white text-gray-900 placeholder-gray-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="e.g. Westlands, Nairobi"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="w-full pl-10 px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#FE9200] focus:border-[#FE9200] outline-none transition-all bg-white text-gray-900 placeholder-gray-400"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-4">
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button type="submit" className="flex items-center gap-2">
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
};
