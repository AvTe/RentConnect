import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
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
    <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header - more compact on mobile */}
      <div className="p-4 md:p-6 border-b border-gray-100 flex justify-between items-center">
        <h2 className="text-lg md:text-xl font-bold text-gray-900">Edit Profile</h2>
        <button onClick={onCancel} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
      </div>

      {/* Form with bottom padding for mobile nav */}
      <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4 md:space-y-6 pb-20 md:pb-6">
        {/* Photo Upload - smaller on mobile */}
        <div className="flex items-center gap-4 md:gap-6">
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xl md:text-2xl font-bold border-2 md:border-4 border-white shadow-md overflow-hidden">
              {uploadingImage ? (
                <Loader2 className="w-6 h-6 md:w-8 md:h-8 animate-spin text-[#FE9200]" />
              ) : formData.avatar ? (
                <Image src={formData.avatar} alt={formData.name || 'Profile'} width={96} height={96} className="w-full h-full object-cover" />
              ) : (
                String(formData.name || 'U').charAt(0)
              )}
            </div>
            <button
              type="button"
              onClick={handleImageClick}
              disabled={uploadingImage}
              className="absolute -bottom-0.5 -right-0.5 md:bottom-0 md:right-0 bg-[#FE9200] text-white p-1.5 md:p-2 rounded-full hover:bg-[#E58300] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Camera className="w-3 h-3 md:w-4 md:h-4" />
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
            <h3 className="font-semibold text-gray-900 text-sm md:text-base">Profile Photo</h3>
            <p className="text-xs md:text-sm text-gray-500">PNG, JPG up to 5MB</p>
            {imageError && (
              <p className="text-xs md:text-sm text-red-500 mt-1">{imageError}</p>
            )}
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
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2">City</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                className="w-full pl-9 md:pl-10 pr-4 py-2.5 md:py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#FE9200] focus:border-[#FE9200] outline-none transition-all bg-white text-gray-900 placeholder-gray-400 text-sm md:text-base"
              />
            </div>
          </div>
        </div>

        {/* Phone Number with OTP Verification - more compact on mobile */}
        <div className="bg-gray-50 rounded-lg p-3 md:p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2 md:mb-3">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
              <span className="font-medium text-gray-700 text-sm md:text-base">Phone Number</span>
            </div>
            {originalPhone && !phoneChanged && (
              <div className="flex items-center gap-1 text-green-600 text-xs md:text-sm">
                <CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4" />
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
            <div className="flex items-center gap-1.5 md:gap-2 text-amber-600 text-xs md:text-sm mt-2">
              <AlertCircle className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
              <span>Phone changed - verify to save</span>
            </div>
          )}

          {phoneChanged && isPhoneVerified && (
            <div className="flex items-center gap-1.5 md:gap-2 text-green-600 text-xs md:text-sm mt-2">
              <CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span>New phone verified!</span>
            </div>
          )}
        </div>

        {/* Action buttons - full width on mobile */}
        <div className="pt-2 md:pt-4 flex flex-col-reverse sm:flex-row justify-end gap-2 md:gap-4">
          <Button type="button" variant="ghost" onClick={onCancel} className="w-full sm:w-auto text-sm">
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={phoneChanged && !isPhoneVerified}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 text-sm ${phoneChanged && !isPhoneVerified ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Save className="w-4 h-4" />
            {phoneChanged && !isPhoneVerified ? 'Verify Phone First' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
};
