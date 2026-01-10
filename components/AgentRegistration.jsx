import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Building2, User, Mail, MapPin, Lock, Upload, CheckCircle, Gift, FileText, Phone, Shield } from 'lucide-react';
import { Button } from './ui/Button';
import { PhoneVerification } from './ui/PhoneVerification';
import { checkPhoneNumberExists } from '@/lib/database';
import { useToast } from '@/context/ToastContext';

export const AgentRegistration = ({ onNavigate, onSubmit, initialReferralCode = '' }) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const [formData, setFormData] = useState({
    fullName: '',
    agencyName: '',
    email: '',
    phone: '',
    location: '',
    password: '',
    referralCode: initialReferralCode,
    idDocument: null
  });

  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill referral code if provided from URL
  useEffect(() => {
    if (initialReferralCode && initialReferralCode !== formData.referralCode) {
      setFormData(prev => ({ ...prev, referralCode: initialReferralCode }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialReferralCode]);

  const handlePhoneVerified = (verifiedPhone) => {
    setIsPhoneVerified(true);
    setFormData(prev => ({ ...prev, phone: verifiedPhone }));
  };

  // Step validation
  const validateStep = (step) => {
    switch (step) {
      case 1:
        return formData.fullName.trim().length >= 2 && formData.agencyName.trim().length >= 2;
      case 2:
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(formData.email); // Phone is optional
      case 3:
        return formData.password.length >= 6 && formData.location.trim().length >= 2;
      case 4:
        return formData.idDocument !== null;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    } else {
      // Show specific error messages
      if (currentStep === 1) {
        toast.warning('Please fill in your name and agency name');
      } else if (currentStep === 2) {
        toast.warning('Please enter a valid email address');
      } else if (currentStep === 3) {
        if (formData.password.length < 6) {
          toast.warning('Password must be at least 6 characters');
        } else {
          toast.warning('Please enter your location');
        }
      }
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep(4)) {
      toast.warning('Please upload your government ID');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      toast.error('Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step configurations
  const steps = [
    { number: 1, title: 'Personal Info', icon: User },
    { number: 2, title: 'Contact Details', icon: Phone },
    { number: 3, title: 'Security', icon: Shield },
    { number: 4, title: 'Verification', icon: FileText },
  ];

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-[#FE9200] to-[#E58300] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-200">
                <User className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Let&apos;s get to know you</h3>
              <p className="text-sm text-gray-500">Tell us about yourself and your business</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  autoFocus
                  className="w-full pl-12 pr-4 py-4 min-h-[56px] border-2 border-gray-100 rounded-2xl focus:ring-2 focus:ring-[#FFE4C4] focus:border-[#FE9200] outline-none transition-all bg-white text-gray-900 placeholder-gray-400 text-base font-medium"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Agency / Business Name</label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  className="w-full pl-12 pr-4 py-4 min-h-[56px] border-2 border-gray-100 rounded-2xl focus:ring-2 focus:ring-[#FFE4C4] focus:border-[#FE9200] outline-none transition-all bg-white text-gray-900 placeholder-gray-400 text-base font-medium"
                  placeholder="e.g. Nairobi Premier Homes"
                  value={formData.agencyName}
                  onChange={(e) => setFormData({ ...formData, agencyName: e.target.value })}
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-[#FE9200] to-[#E58300] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-200">
                <Phone className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Contact Details</h3>
              <p className="text-sm text-gray-500">How can tenants reach you?</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  required
                  autoFocus
                  className="w-full pl-12 pr-4 py-4 min-h-[56px] border-2 border-gray-100 rounded-2xl focus:ring-2 focus:ring-[#FFE4C4] focus:border-[#FE9200] outline-none transition-all bg-white text-gray-900 placeholder-gray-400 text-base font-medium"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 border-2 border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">WhatsApp Number</span>
                <span className="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full font-medium">Optional</span>
              </div>
              <PhoneVerification
                phoneNumber={formData.phone}
                onPhoneChange={(value) => {
                  setFormData({ ...formData, phone: value });
                  setIsPhoneVerified(false);
                }}
                onVerified={handlePhoneVerified}
                checkExisting={true}
                checkExistingFn={checkPhoneNumberExists}
                defaultCountry="KE"
                label=""
                required={false}
              />
              {isPhoneVerified && (
                <div className="flex items-center gap-2 text-green-600 text-sm mt-3 font-medium">
                  <CheckCircle className="w-5 h-5" />
                  <span>Phone number verified successfully!</span>
                </div>
              )}
              {!isPhoneVerified && formData.phone && (
                <p className="text-xs text-gray-400 mt-2">Verify to receive WhatsApp notifications (optional)</p>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-[#FE9200] to-[#E58300] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-200">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Secure Your Account</h3>
              <p className="text-sm text-gray-500">Set up your password and location</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Create Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  required
                  autoFocus
                  className="w-full pl-12 pr-4 py-4 min-h-[56px] border-2 border-gray-100 rounded-2xl focus:ring-2 focus:ring-[#FFE4C4] focus:border-[#FE9200] outline-none transition-all bg-white text-gray-900 placeholder-gray-400 text-base font-medium"
                  placeholder="Minimum 6 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">Use at least 6 characters with letters and numbers</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Your Location / Service Area</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  className="w-full pl-12 pr-4 py-4 min-h-[56px] border-2 border-gray-100 rounded-2xl focus:ring-2 focus:ring-[#FFE4C4] focus:border-[#FE9200] outline-none transition-all bg-white text-gray-900 placeholder-gray-400 text-base font-medium"
                  placeholder="e.g. Westlands, Nairobi"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-[#FE9200] to-[#E58300] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-200">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Final Step</h3>
              <p className="text-sm text-gray-500">Upload your ID and you&apos;re all set!</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Government ID</label>
              <div className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${formData.idDocument
                ? 'border-green-300 bg-green-50'
                : 'border-gray-200 hover:border-[#FE9200] bg-gray-50'
                }`}>
                <input
                  type="file"
                  required
                  accept="image/*,.pdf"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => setFormData({ ...formData, idDocument: e.target.files[0] })}
                />
                <div className="flex flex-col items-center justify-center space-y-3">
                  {formData.idDocument ? (
                    <>
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                      <p className="text-sm font-semibold text-green-700">{formData.idDocument.name}</p>
                      <p className="text-xs text-green-600">Click to change file</p>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                        <Upload className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-700">Upload your National ID, Passport, or Driver&apos;s License</p>
                      <p className="text-xs text-gray-400">PDF, JPG, PNG up to 5MB</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Referral Code Section */}
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-4 border border-orange-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Gift className="w-5 h-5 text-[#FE9200]" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Referral Code (Optional)</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border-2 border-orange-100 rounded-xl focus:ring-2 focus:ring-[#FFE4C4] focus:border-[#FE9200] outline-none transition-all bg-white text-gray-900 placeholder-gray-400 text-sm font-medium uppercase"
                    placeholder="e.g. YOOM4K2X"
                    value={formData.referralCode}
                    onChange={(e) => setFormData({ ...formData, referralCode: e.target.value.toUpperCase() })}
                  />
                  {formData.referralCode && (
                    <p className="text-xs text-green-600 mt-1 font-medium">🎉 You&apos;ll get 2 free credits on signup!</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen w-screen flex overflow-x-hidden bg-white font-sans">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col min-h-screen">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm py-4 px-4 sm:px-8 border-b border-gray-100 z-10">
          <div className="max-w-md mx-auto flex items-center justify-between">
            <button
              onClick={() => currentStep === 1 ? onNavigate('landing') : handleBack()}
              className="flex items-center text-gray-500 hover:text-gray-900 transition-colors min-h-[44px] -ml-2 px-2"
            >
              <ArrowLeft className="w-5 h-5 mr-1" />
              <span className="text-sm font-medium">{currentStep === 1 ? 'Back' : 'Previous'}</span>
            </button>

            <span className="text-sm font-semibold text-gray-400">
              Step {currentStep} of {totalSteps}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-4 sm:px-8 py-4">
          <div className="max-w-md mx-auto">
            <div className="flex items-center gap-2">
              {steps.map((step, index) => (
                <div key={step.number} className="flex-1">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${step.number < currentStep
                      ? 'bg-green-500'
                      : step.number === currentStep
                        ? 'bg-[#FE9200]'
                        : 'bg-gray-200'
                      }`}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2">
              {steps.map(step => (
                <span
                  key={step.number}
                  className={`text-[10px] font-semibold uppercase tracking-wider ${step.number <= currentStep ? 'text-[#FE9200]' : 'text-gray-400'
                    }`}
                >
                  {step.title}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 px-4 sm:px-8 pb-8 overflow-y-auto">
          <form onSubmit={handleSubmit} className="max-w-md mx-auto">
            <div className="min-h-[400px]">
              {renderStepContent()}
            </div>

            {/* Navigation Buttons */}
            <div className="mt-8 space-y-3">
              {currentStep < totalSteps ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!validateStep(currentStep)}
                  className={`w-full min-h-[56px] py-4 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2 ${validateStep(currentStep)
                    ? 'bg-[#FE9200] hover:bg-[#E58300] text-white shadow-lg shadow-orange-200'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                >
                  Continue
                  <ArrowRight className="w-5 h-5" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={!validateStep(4) || isSubmitting}
                  className={`w-full min-h-[56px] py-4 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2 ${validateStep(4) && !isSubmitting
                    ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Create My Account
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Sign In Link */}
            <p className="text-center text-sm text-gray-500 mt-6">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="font-semibold text-[#FE9200] hover:underline"
              >
                Sign In
              </button>
            </p>
          </form>
        </div>
      </div>

      {/* Right Side - Image/Testimonial (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0f172a] relative items-center justify-center p-12 text-white overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#7A00AA] via-purple-900 to-slate-900 z-0" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1073&q=80')] opacity-10 bg-cover bg-center mix-blend-overlay" />

        {/* Content */}
        <div className="relative z-10 max-w-lg">
          {/* Step Illustration */}
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-6">
              {steps.map((step) => (
                <div
                  key={step.number}
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${step.number < currentStep
                    ? 'bg-green-500 scale-100'
                    : step.number === currentStep
                      ? 'bg-[#FE9200] scale-110 shadow-lg shadow-orange-500/30'
                      : 'bg-white/10 scale-90'
                    }`}
                >
                  {step.number < currentStep ? (
                    <CheckCircle className="w-6 h-6 text-white" />
                  ) : (
                    <step.icon className={`w-6 h-6 ${step.number === currentStep ? 'text-white' : 'text-white/50'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <h2 className="text-4xl font-bold mb-6 leading-tight">
            Grow your real estate business with{' '}
            <span className="text-[#FE9200]">Yoombaa</span>.
          </h2>

          <div className="space-y-4">
            <p className="text-lg text-gray-300 italic leading-relaxed">
              &quot;Since joining Yoombaa, my lead conversion rate has doubled. The quality of tenants is unmatched and the platform is so easy to use.&quot;
            </p>
            <div className="flex items-center gap-4 mt-8">
              <div className="w-12 h-12 rounded-full bg-[#FE9200] flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-[#7A00AA]/20">
                D
              </div>
              <div>
                <p className="font-semibold text-white">David Okon</p>
                <p className="text-sm text-[#FFD4A3]">Agent in Ikeja</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-12 pt-8 border-t border-white/10 grid grid-cols-3 gap-6">
            <div>
              <p className="text-3xl font-black text-[#FE9200]">500+</p>
              <p className="text-sm text-gray-400">Active Agents</p>
            </div>
            <div>
              <p className="text-3xl font-black text-[#FE9200]">2k+</p>
              <p className="text-sm text-gray-400">Leads Monthly</p>
            </div>
            <div>
              <p className="text-3xl font-black text-[#FE9200]">95%</p>
              <p className="text-sm text-gray-400">Satisfaction</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
