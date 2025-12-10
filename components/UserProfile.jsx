import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, MapPin, Camera, Save, CheckCircle, AlertCircle, Phone, Loader2 } from 'lucide-react';
import { Button } from './ui/Button';
import { PhoneVerification } from './ui/PhoneVerification';
import { uploadProfileImage } from '@/lib/storage-supabase';

export const UserProfile = ({ user, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    city: user?.city || user?.location || '',
    avatar: user?.avatar || ''
  });

  // File input ref for profile image
  const fileInputRef = useRef(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState('');

  // Track if phone number was changed and needs verification
  const [originalPhone] = useState(user?.phone || '');
  const [phoneChanged, setPhoneChanged] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);

  // Check if phone was changed
  useEffect(() => {
    const hasChanged = formData.phone !== originalPhone && formData.phone !== '';
    setPhoneChanged(hasChanged);
    if (hasChanged) {
      setIsPhoneVerified(false);
    }
  }, [formData.phone, originalPhone]);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setImageError('Please upload a JPG, PNG, or WebP image.');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setImageError('Image size must be less than 5MB.');
      return;
    }

    setImageError('');
    setUploadingImage(true);

    try {
      const userId = user?.uid || user?.id;
      if (!userId) {
        setImageError('User not found. Please try again.');
        setUploadingImage(false);
        return;
      }

      const result = await uploadProfileImage(userId, file);
      
      if (result.success) {
        setFormData(prev => ({ ...prev, avatar: result.url }));
      } else {
        setImageError(result.error || 'Failed to upload image. Please try again.');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setImageError('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // If phone was changed, require verification
    if (phoneChanged && !isPhoneVerified) {
      alert('Please verify your new phone number before saving.');
      return;
    }

    onSave(formData);
  };

  const handlePhoneVerified = (verifiedPhone) => {
    setIsPhoneVerified(true);
    setFormData(prev => ({ ...prev, phone: verifiedPhone }));
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Edit Profile</h2>
        <button onClick={onCancel} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Photo Upload */}
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-2xl font-bold border-4 border-white shadow-md overflow-hidden">
              {uploadingImage ? (
                <Loader2 className="w-8 h-8 animate-spin text-[#FE9200]" />
              ) : formData.avatar ? (
                <img src={formData.avatar} alt={formData.name || 'Profile'} className="w-full h-full object-cover" />
              ) : (
                String(formData.name || 'U').charAt(0)
              )}
            </div>
            <button 
              type="button" 
              onClick={handleImageClick}
              disabled={uploadingImage}
              className="absolute bottom-0 right-0 bg-[#FE9200] text-white p-2 rounded-full hover:bg-[#E58300] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Profile Photo</h3>
            <p className="text-sm text-gray-500">PNG, JPG up to 5MB</p>
            {imageError && (
              <p className="text-sm text-red-500 mt-1">{imageError}</p>
            )}
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
            <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                className="w-full pl-10 px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#FE9200] focus:border-[#FE9200] outline-none transition-all bg-white text-gray-900 placeholder-gray-400"
              />
            </div>
          </div>
        </div>

        {/* Phone Number with OTP Verification */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-gray-500" />
              <span className="font-medium text-gray-700">Phone Number</span>
            </div>
            {originalPhone && !phoneChanged && (
              <div className="flex items-center gap-1 text-green-600 text-sm">
                <CheckCircle className="w-4 h-4" />
                <span>Verified</span>
              </div>
            )}
          </div>

          <PhoneVerification
            phoneNumber={formData.phone}
            onPhoneChange={(value) => setFormData({...formData, phone: value})}
            onVerified={handlePhoneVerified}
            checkExisting={false}
            defaultCountry="KE"
            label=""
            required={false}
          />

          {phoneChanged && !isPhoneVerified && (
            <div className="flex items-center gap-2 text-amber-600 text-sm mt-2">
              <AlertCircle className="w-4 h-4" />
              <span>Phone number changed - verification required to save</span>
            </div>
          )}

          {phoneChanged && isPhoneVerified && (
            <div className="flex items-center gap-2 text-green-600 text-sm mt-2">
              <CheckCircle className="w-4 h-4" />
              <span>New phone number verified!</span>
            </div>
          )}
        </div>

        <div className="pt-4 flex justify-end gap-4">
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button
            type="submit"
            disabled={phoneChanged && !isPhoneVerified}
            className={`flex items-center gap-2 ${phoneChanged && !isPhoneVerified ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Save className="w-4 h-4" />
            {phoneChanged && !isPhoneVerified ? 'Verify Phone First' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
};
