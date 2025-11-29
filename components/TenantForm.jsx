import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, MapPin, Banknote, User, Check, ChevronRight, Building2, Mail, Loader2, ShieldCheck, RefreshCw } from 'lucide-react';
import { Button } from './ui/Button';
import { OTPInput } from './ui/OTPInput';
import confetti from 'canvas-confetti';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { checkPhoneNumberExists } from '@/lib/firestore';

const PROPERTY_TYPES = [
  { id: '1 Bedroom', label: '1 Bedroom', icon: '🛏️' },
  { id: '2 Bedroom', label: '2 Bedroom', icon: '🏡' },
  { id: '3 Bedroom', label: '3 Bedroom', icon: '🏰' },
  { id: 'Self Contain', label: 'Self Contain', icon: '🏠' },
  { id: 'Mini Flat', label: 'Mini Flat', icon: '🏢' },
  { id: 'Duplex', label: 'Duplex', icon: '🏘️' }
];

export const TenantForm = ({ onNavigate, onSubmit, initialData, currentUser, onUpdateUser }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    location: '',
    pincode: '',
    type: '',
    budget: '',
    name: '',
    email: '',
    whatsapp: ''
  });

  // Sync name with currentUser when they log in (verify phone)
  useEffect(() => {
    if (currentUser && formData.name && onUpdateUser) {
      // If the user is logged in but the name in the header doesn't match the form, update it
      if (currentUser.name !== formData.name) {
        onUpdateUser({ name: formData.name });
      }
    }
  }, [currentUser, formData.name, onUpdateUser]);
  const [defaultCountry, setDefaultCountry] = useState('NG');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Verification State
  const [verificationStep, setVerificationStep] = useState('idle'); // idle, sending, sent, verifying, verified
  const [otp, setOtp] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [otpExpiresIn, setOtpExpiresIn] = useState(0); // Countdown in seconds
  const [canResend, setCanResend] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData
      }));
    }
  }, [initialData]);

  // Countdown timer for OTP expiration and resend
  useEffect(() => {
    let timer;
    if (verificationStep === 'sent' && otpExpiresIn > 0) {
      timer = setInterval(() => {
        setOtpExpiresIn(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [verificationStep, otpExpiresIn]);

  // Resend countdown timer
  useEffect(() => {
    let timer;
    if (resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown(prev => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCountdown]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendOtp = useCallback(async () => {
    if (!formData.whatsapp || !isValidPhoneNumber(formData.whatsapp)) {
      setVerificationError('Please enter a valid phone number.');
      return;
    }

    setVerificationStep('sending');
    setVerificationError('');

    try {
      // 1. Check if number already exists in our system
      const exists = await checkPhoneNumberExists(formData.whatsapp);
      if (exists) {
        setVerificationError('This phone number is already registered. Please login instead.');
        setVerificationStep('idle');
        return;
      }

      // 2. Send OTP via Twilio API
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: formData.whatsapp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification code.');
      }

      // Success - set timers
      setVerificationStep('sent');
      setOtpExpiresIn(data.expiresIn || 300); // Default 5 minutes
      setCanResend(false);
      setResendCountdown(30); // 30 seconds before can resend

    } catch (error) {
      console.error('Error sending OTP:', error);
      setVerificationError(error.message || 'Failed to send verification code.');
      setVerificationStep('idle');
    }
  }, [formData.whatsapp]);

  const handleVerifyOtp = useCallback(async (otpValue) => {
    const codeToVerify = otpValue || otp;

    if (!codeToVerify || codeToVerify.length < 6) {
      setVerificationError('Please enter a valid 6-digit code.');
      return;
    }

    setVerificationStep('verifying');
    setVerificationError('');

    try {
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: formData.whatsapp,
          otp: codeToVerify
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid verification code.');
      }

      setVerificationStep('verified');
      setVerificationError('');
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setVerificationError(error.message || 'Invalid code. Please try again.');
      setVerificationStep('sent');
    }
  }, [otp, formData.whatsapp]);

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else onNavigate('landing');
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Use internal API route to avoid CORS and add User-Agent
          const response = await fetch(`/api/geocode?lat=${latitude}&lon=${longitude}`);
          if (!response.ok) throw new Error('Geocoding failed');
          
          const data = await response.json();
          const city = data.address.city || data.address.town || data.address.village || data.address.suburb;
          const state = data.address.state;
          const countryCode = data.address.country_code?.toUpperCase();
          const locationString = city && state ? `${city}, ${state}` : data.display_name;
          
          setFormData(prev => ({ ...prev, location: locationString }));
          if (countryCode) setDefaultCountry(countryCode);
        } catch (error) {
          console.error('Error fetching location:', error);
          setFormData(prev => ({ ...prev, location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` }));
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to retrieve your location');
        setIsLocating(false);
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call delay for effect
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const result = await onSubmit(formData);
    setIsSubmitting(false);

    if (result && result.success) {
      setIsSuccess(true);
      triggerConfetti();
    } else {
      alert(result?.error || 'Something went wrong. Please try again.');
    }
  };

  const triggerConfetti = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  const renderStep1 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Where do you want to live?</h3>
        <p className="text-gray-500 mb-6">Enter the location where you are looking to rent.</p>
        <div className="relative">
          <button 
            type="button"
            onClick={handleUseCurrentLocation}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors"
            title="Use current location"
          >
            {isLocating ? <Loader2 className="w-5 h-5 animate-spin" /> : <MapPin className="w-5 h-5" />}
          </button>
          <input
            type="text"
            autoFocus
            className="w-full pl-12 pr-4 py-4 border-2 border-gray-100 rounded-xl text-lg text-gray-900 focus:border-emerald-500 focus:ring-0 outline-none transition-all shadow-sm"
            placeholder="e.g. Yaba, Lagos"
            value={formData.location}
            onChange={(e) => setFormData({...formData, location: e.target.value})}
            onKeyDown={(e) => e.key === 'Enter' && formData.location && handleNext()}
          />
        </div>
      </div>
      <Button 
        onClick={handleNext} 
        disabled={!formData.location}
        className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-2"
      >
        Next Step <ChevronRight className="w-5 h-5" />
      </Button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">What type of property?</h3>
        <p className="text-gray-500 mb-6">Select the type of apartment you are interested in.</p>
        <div className="grid grid-cols-2 gap-4">
          {PROPERTY_TYPES.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => {
                setFormData({...formData, type: type.id});
                // Optional: Auto advance after selection
                // setTimeout(handleNext, 300); 
              }}
              className={`p-4 rounded-xl border-2 text-left transition-all flex flex-col gap-2 ${
                formData.type === type.id
                  ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500'
                  : 'border-gray-100 hover:border-emerald-200 hover:bg-gray-50'
              }`}
            >
              <span className="text-2xl">{type.icon}</span>
              <span className={`font-medium ${formData.type === type.id ? 'text-emerald-900' : 'text-gray-700'}`}>
                {type.label}
              </span>
            </button>
          ))}
        </div>
      </div>
      <Button 
        onClick={handleNext} 
        disabled={!formData.type}
        className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-2"
      >
        Next Step <ChevronRight className="w-5 h-5" />
      </Button>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">What is your budget?</h3>
        <p className="text-gray-500 mb-6">Enter your annual budget for rent.</p>
        <div className="relative">
          <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            autoFocus
            className="w-full pl-12 pr-4 py-4 border-2 border-gray-100 rounded-xl text-lg text-gray-900 focus:border-emerald-500 focus:ring-0 outline-none transition-all shadow-sm"
            placeholder="e.g. 1,500,000"
            value={formData.budget}
            onChange={(e) => setFormData({...formData, budget: e.target.value})}
            onKeyDown={(e) => e.key === 'Enter' && formData.budget && handleNext()}
          />
        </div>
      </div>
      <Button 
        onClick={handleNext} 
        disabled={!formData.budget}
        className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-2"
      >
        Next Step <ChevronRight className="w-5 h-5" />
      </Button>
    </div>
  );

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const renderStep4 = () => (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Contact Details</h3>
        <p className="text-gray-500 mb-6">How can agents reach you?</p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                required
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-100 rounded-xl text-lg text-gray-900 focus:border-emerald-500 focus:ring-0 outline-none transition-all shadow-sm"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                required
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-100 rounded-xl text-lg text-gray-900 focus:border-emerald-500 focus:ring-0 outline-none transition-all shadow-sm"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
            <div className="relative">
              <PhoneInput
                international
                defaultCountry={defaultCountry}
                value={formData.whatsapp}
                onChange={(value) => {
                  setFormData({...formData, whatsapp: value});
                  if (verificationStep !== 'idle') {
                    setVerificationStep('idle'); // Reset verification if number changes
                    setOtp('');
                    setVerificationError('');
                  }
                }}
                disabled={verificationStep === 'verified' || verificationStep === 'sent'}
                className="w-full pl-4 pr-4 py-4 border-2 border-gray-100 rounded-xl text-lg text-gray-900 focus-within:border-emerald-500 focus-within:ring-0 transition-all shadow-sm [&>input]:outline-none [&>input]:bg-transparent [&>input]:w-full [&>input]:ml-2"
              />
              {verificationStep === 'verified' && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500">
                  <ShieldCheck className="w-6 h-6" />
                </div>
              )}
            </div>
            
            {/* Verification UI */}
            <div className="mt-3">
              {verificationError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                  <p className="text-red-600 text-sm">{verificationError}</p>
                </div>
              )}

              {verificationStep === 'idle' && formData.whatsapp && isValidPhoneNumber(formData.whatsapp) && (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="text-sm font-medium text-emerald-600 hover:text-emerald-700 underline"
                >
                  Verify this number
                </button>
              )}

              {verificationStep === 'sending' && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" /> Sending verification code...
                </div>
              )}

              {verificationStep === 'sent' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Enter the 6-digit code sent to</p>
                    <p className="text-sm font-semibold text-gray-900">{formData.whatsapp}</p>
                  </div>

                  {/* OTP Input Component */}
                  <OTPInput
                    length={6}
                    value={otp}
                    onChange={setOtp}
                    onComplete={(code) => handleVerifyOtp(code)}
                    disabled={verificationStep === 'verifying'}
                    error={!!verificationError}
                  />

                  {/* Expiration Timer */}
                  {otpExpiresIn > 0 && (
                    <p className="text-center text-sm text-gray-500">
                      Code expires in <span className="font-mono font-semibold text-gray-700">{formatTime(otpExpiresIn)}</span>
                    </p>
                  )}
                  {otpExpiresIn === 0 && verificationStep === 'sent' && (
                    <p className="text-center text-sm text-red-500">
                      Code expired. Please request a new code.
                    </p>
                  )}

                  {/* Verify Button */}
                  <Button
                    type="button"
                    onClick={() => handleVerifyOtp()}
                    disabled={otp.length !== 6 || verificationStep === 'verifying'}
                    className="w-full bg-emerald-600 text-white py-3 rounded-lg font-medium"
                  >
                    {verificationStep === 'verifying' ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
                      </span>
                    ) : (
                      'Verify Code'
                    )}
                  </Button>

                  {/* Resend / Change Number */}
                  <div className="flex items-center justify-between text-sm">
                    <button
                      type="button"
                      onClick={() => {
                        setVerificationStep('idle');
                        setOtp('');
                        setVerificationError('');
                        setOtpExpiresIn(0);
                      }}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      Change Number
                    </button>

                    {canResend ? (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                      >
                        <RefreshCw className="w-4 h-4" /> Resend Code
                      </button>
                    ) : resendCountdown > 0 ? (
                      <span className="text-gray-400">
                        Resend in {resendCountdown}s
                      </span>
                    ) : null}
                  </div>
                </div>
              )}

              {verificationStep === 'verifying' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Verifying your code...</p>
                  </div>
                </div>
              )}

              {verificationStep === 'verified' && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-3">
                  <ShieldCheck className="w-5 h-5 text-green-600" />
                  <p className="text-sm text-green-700 font-medium">Phone number verified successfully</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Button 
        type="submit" 
        disabled={!formData.name || !isValidEmail(formData.email) || verificationStep !== 'verified' || isSubmitting}
        className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>Submit Request <Check className="w-5 h-5" /></>
        )}
      </Button>
    </form>
  );

  const renderSuccess = () => (
    <div className="text-center py-12 animate-in zoom-in duration-500">
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 shadow-xl shadow-green-100">
        <Check className="w-12 h-12 stroke-[3]" />
      </div>
      <h2 className="text-3xl font-bold text-gray-900 mb-4">Congratulations! 🎉</h2>
      <p className="text-gray-500 text-lg mb-8 max-w-md mx-auto">
        Your request has been submitted successfully. Top-rated agents in {formData.location} will contact you shortly.
      </p>
      <div className="flex flex-col gap-3 max-w-xs mx-auto">
        <Button 
          onClick={() => onNavigate('landing')} 
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium"
        >
          Back to Home
        </Button>
        <Button
          onClick={() => {
            setStep(1);
            setFormData({ location: '', pincode: '', type: '', budget: '', name: '', email: '', whatsapp: '' });
            setIsSuccess(false);
            setVerificationStep('idle');
            setOtp('');
            setVerificationError('');
          }}
          variant="ghost"
          className="w-full"
        >
          Post Another Request
        </Button>
      </div>
    </div>
  );

  if (isSuccess) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-white p-4">
        {renderSuccess()}
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-white font-sans">
      {/* Left Side - Form */}
      <div className="w-full md:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-24 relative z-10 overflow-y-auto">
        {/* Logo/Back */}
        <div className="absolute top-8 left-8 sm:left-12 lg:left-24 flex items-center gap-4">
          <button 
            onClick={handleBack} 
            className="flex items-center text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
        </div>

        <div className="max-w-md w-full mx-auto mt-20 md:mt-0">
          {/* Progress Bar */}
          <div className="mb-10">
            <div className="flex justify-between text-xs font-medium text-gray-500 mb-3">
              <span>Step {step} of 4</span>
              <span>{Math.round((step / 4) * 100)}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 transition-all duration-500 ease-out"
                style={{ width: `${(step / 4) * 100}%` }}
              ></div>
            </div>
          </div>

          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </div>
      </div>

      {/* Right Side - Image/Testimonial */}
      <div className="hidden md:flex md:w-1/2 bg-[#0f172a] relative items-center justify-center p-12 text-white overflow-hidden">
         {/* Background Gradient/Image */}
         <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 to-slate-900 z-0"></div>
         <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1484154218962-a1c002085d2f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80')] opacity-20 bg-cover bg-center mix-blend-overlay"></div>
         
         <div className="relative z-10 max-w-lg">
            <h2 className="text-4xl font-bold mb-6 leading-tight">
               Find your dream home without the hassle.
            </h2>
            <div className="space-y-4">
               <p className="text-lg text-gray-300 italic leading-relaxed">
                  &quot;I posted my requirements and got 3 amazing options within hours. Found my new place the same day! RentConnect is a lifesaver.&quot;
               </p>
               <div className="flex items-center gap-4 mt-8">
                  <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-emerald-900/20">C</div>
                  <div>
                     <p className="font-semibold text-white">Chioma Egwu</p>
                     <p className="text-sm text-emerald-200">Tenant in Yaba</p>
                  </div>
               </div>
            </div>
            
            {/* Logos at bottom */}
            <div className="mt-16 pt-8 border-t border-white/10 flex gap-8 opacity-40 grayscale">
               <div className="flex items-center gap-2">
                 <Building2 className="w-6 h-6" />
                 <span className="font-bold text-lg">RentConnect</span>
               </div>
               <div className="flex items-center gap-2">
                 <span className="font-bold text-lg">Paystack</span>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};
