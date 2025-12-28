import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  MapPin,
  User,
  Check,
  ChevronRight,
  Building2,
  Mail,
  Loader2,
  ShieldCheck,
  RefreshCw,
  Home,
  Building,
  Hotel,
  Castle,
  Warehouse,
  Store,
  Sparkles,
  Wand2,
  AlertCircle,
} from "lucide-react";
import { Button } from "./ui/Button";
import { OTPInput } from "./ui/OTPInput";
import { LocationAutocomplete } from "./ui/LocationAutocomplete";
import { BudgetInput } from "./ui/BudgetInput";
import confetti from "canvas-confetti";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { checkPhoneNumberExists } from "@/lib/database";

// Enhanced property types with better icons and descriptions
const PROPERTY_TYPES = [
  {
    id: "1 Bedroom",
    label: "1 Bedroom",
    icon: Home,
    description: "Perfect for singles or couples",
    color: "from-blue-500 to-blue-600"
  },
  {
    id: "2 Bedroom",
    label: "2 Bedroom",
    icon: Building,
    description: "Ideal for small families",
    color: "from-green-500 to-green-600"
  },
  {
    id: "3 Bedroom",
    label: "3+ Bedroom",
    icon: Castle,
    description: "Spacious family living",
    color: "from-purple-500 to-purple-600"
  },
  {
    id: "Studio",
    label: "Studio",
    icon: Hotel,
    description: "Compact & efficient",
    color: "from-amber-500 to-amber-600"
  },
  {
    id: "Self Contain",
    label: "Self Contain",
    icon: Store,
    description: "All-in-one living space",
    color: "from-rose-500 to-rose-600"
  },
  {
    id: "Duplex",
    label: "Duplex",
    icon: Warehouse,
    description: "Two-story living",
    color: "from-indigo-500 to-indigo-600"
  },
];

export const TenantForm = ({
  onNavigate,
  onSubmit,
  initialData,
  currentUser,
  onUpdateUser,
}) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Location fields (structured)
    location: "",
    locationData: null, // Structured location object
    city: "",
    area: "",
    state: "",
    country: "",
    countryCode: "",
    pincode: "",
    // Property fields
    type: "",
    // Budget fields
    budget: "",
    budgetFormatted: "",
    currency: "KES",
    // Contact fields
    name: "",
    email: "",
    whatsapp: "",
  });

  useEffect(() => {
    if (currentUser && formData.name && onUpdateUser) {
      if (currentUser.name !== formData.name) {
        onUpdateUser({ name: formData.name });
      }
    }
  }, [currentUser, formData.name, onUpdateUser]);

  const [defaultCountry, setDefaultCountry] = useState("KE");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [verificationStep, setVerificationStep] = useState("idle");
  const [otp, setOtp] = useState("");
  const [verificationError, setVerificationError] = useState("");
  const [otpExpiresIn, setOtpExpiresIn] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  // AI Auto-fill state
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiSuccess, setAiSuccess] = useState(false);

  // AI Auto-fill handler
  const handleAiParse = useCallback(async () => {
    if (!aiInput.trim() || aiInput.trim().length < 10) {
      setAiError("Please describe your rental needs in more detail (at least 10 characters).");
      return;
    }

    setAiLoading(true);
    setAiError("");
    setAiSuccess(false);

    try {
      const response = await fetch("/api/ai/parse-requirements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: aiInput }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to process your requirements.");
      }

      const { data } = result;

      // Update form with extracted data
      setFormData(prev => ({
        ...prev,
        location: data.location || prev.location,
        type: data.propertyType || prev.type,
        budget: data.budget ? String(data.budget) : prev.budget,
        budgetFormatted: data.budget ? `KES ${data.budget.toLocaleString()}` : prev.budgetFormatted,
      }));

      setAiSuccess(true);

      // Clear success message after 3 seconds
      setTimeout(() => setAiSuccess(false), 3000);

    } catch (error) {
      console.error("AI parsing error:", error);
      setAiError(error.message || "Failed to process your requirements. Please try again.");
    } finally {
      setAiLoading(false);
    }
  }, [aiInput]);

  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({
        ...prev,
        ...initialData,
      }));
    }
  }, [initialData]);

  useEffect(() => {
    let timer;
    if (verificationStep === "sent" && otpExpiresIn > 0) {
      timer = setInterval(() => {
        setOtpExpiresIn((prev) => {
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

  useEffect(() => {
    let timer;
    if (resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => {
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
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSendOtp = useCallback(async () => {
    if (!formData.whatsapp || !isValidPhoneNumber(formData.whatsapp)) {
      setVerificationError("Please enter a valid phone number.");
      return;
    }

    setVerificationStep("sending");
    setVerificationError("");

    try {
      const exists = await checkPhoneNumberExists(formData.whatsapp);
      if (exists) {
        setVerificationError(
          "This phone number is already registered. Please login instead.",
        );
        setVerificationStep("idle");
        return;
      }

      const response = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: formData.whatsapp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send verification code.");
      }

      // OTP sent successfully - code will arrive via SMS
      setVerificationStep("sent");
      setOtpExpiresIn(data.expiresIn || 300);
      setCanResend(false);
      setResendCountdown(30);
    } catch (error) {
      console.error("Error sending OTP:", error);
      setVerificationError(
        error.message || "Failed to send verification code.",
      );
      setVerificationStep("idle");
    }
  }, [formData.whatsapp]);

  const handleVerifyOtp = useCallback(
    async (otpValue) => {
      const codeToVerify = otpValue || otp;

      if (!codeToVerify || codeToVerify.length < 6) {
        setVerificationError("Please enter a valid 6-digit code.");
        return;
      }

      setVerificationStep("verifying");
      setVerificationError("");

      try {
        const response = await fetch("/api/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phoneNumber: formData.whatsapp,
            otp: codeToVerify,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Invalid verification code.");
        }

        setVerificationStep("verified");
        setVerificationError("");
      } catch (error) {
        console.error("Error verifying OTP:", error);
        setVerificationError(
          error.message || "Invalid code. Please try again.",
        );
        setVerificationStep("sent");
      }
    },
    [otp, formData.whatsapp],
  );

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else onNavigate("landing");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const result = await onSubmit(formData);
    setIsSubmitting(false);

    if (result && result.success) {
      setIsSuccess(true);
      triggerConfetti();
    } else {
      alert(result?.error || "Something went wrong. Please try again.");
    }
  };

  const triggerConfetti = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);
  };

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Handle location selection from autocomplete
  const handleLocationSelect = (locationData) => {
    if (locationData) {
      setFormData(prev => ({
        ...prev,
        location: locationData.area
          ? `${locationData.area}, ${locationData.city || locationData.state}`
          : locationData.city || locationData.name,
        locationData: locationData,
        city: locationData.city || '',
        area: locationData.area || '',
        state: locationData.state || '',
        country: locationData.country || '',
        countryCode: locationData.countryCode || 'KE',
        pincode: locationData.postcode || '',
      }));
      // Update default country for phone input
      if (locationData.countryCode) {
        setDefaultCountry(locationData.countryCode);
      }
    }
  };

  const renderStep1 = () => (
    <div className="space-y-5 sm:space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* AI Auto-Fill Section - Clean, minimal design */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50/50">
          <div className="w-9 h-9 bg-gradient-to-br from-[#FE9200] to-[#FF6B00] rounded-xl flex items-center justify-center shadow-sm animate-sparkle-glow">
            <Sparkles className="w-4 h-4 text-white animate-sparkle" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 text-sm">AI Quick Fill</h4>
            <p className="text-xs text-gray-500">Describe your needs in plain language</p>
          </div>
          <span className="text-[10px] font-medium text-[#FE9200] bg-[#FFF5E6] px-2 py-0.5 rounded-full">AI Powered</span>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <div className="relative">
            <textarea
              value={aiInput}
              onChange={(e) => {
                setAiInput(e.target.value);
                setAiError("");
              }}
              placeholder='e.g., "2 bedroom in Westlands, budget 50k, need parking"'
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 focus:border-[#FE9200] focus:ring-2 focus:ring-[#FFE4C4] outline-none transition-all resize-none bg-white placeholder-gray-400"
              rows={2}
              disabled={aiLoading}
            />
          </div>

          {/* AI Error Message */}
          {aiError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-600">{aiError}</p>
            </div>
          )}

          {/* AI Success Message */}
          {aiSuccess && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
              <p className="text-xs text-green-700">Form filled! Review and adjust below.</p>
            </div>
          )}

          <button
            type="button"
            onClick={handleAiParse}
            disabled={aiLoading || !aiInput.trim()}
            className="w-full py-3 bg-[#FE9200] hover:bg-[#E58300] text-white rounded-xl font-semibold text-sm shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#FE9200]"
          >
            {aiLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span>Auto-Fill Form</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-gray-200"></div>
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">or fill manually</span>
        <div className="flex-1 h-px bg-gray-200"></div>
      </div>

      {/* Original Location Input */}
      <div>
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
          Where do you want to live?
        </h3>
        <p className="text-gray-500 mb-4 sm:mb-6 text-sm">
          Search for a city, neighborhood, or area where you&apos;re looking to rent.
        </p>

        <LocationAutocomplete
          value={formData.location}
          onChange={(value) => setFormData(prev => ({ ...prev, location: value }))}
          onLocationSelect={handleLocationSelect}
          placeholder="e.g., Westlands, Nairobi or Koramangala, Bangalore"
          defaultCountry={defaultCountry}
          autoFocus={!aiInput}
        />
      </div>

      <Button
        onClick={handleNext}
        disabled={!formData.location}
        className="w-full py-3 sm:py-4 bg-[#FE9200] hover:bg-[#E58300] text-white rounded-xl font-semibold shadow-lg shadow-[#FFE4C4] transition-all flex items-center justify-center gap-2 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next Step <ChevronRight className="w-5 h-5" />
      </Button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-5 sm:space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div>
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
          What type of property?
        </h3>
        <p className="text-gray-500 mb-4 sm:mb-6 text-sm">
          Select the type of property you&apos;re looking for.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {PROPERTY_TYPES.map((type) => {
            const IconComponent = type.icon;
            const isSelected = formData.type === type.id;

            return (
              <button
                key={type.id}
                type="button"
                onClick={() => setFormData({ ...formData, type: type.id })}
                className={`group relative p-4 sm:p-5 rounded-2xl border-2 text-left transition-all duration-200 ${
                  isSelected
                    ? "border-[#FE9200] bg-gradient-to-br from-[#FFF5E6] to-[#FFE4C4] shadow-lg shadow-[#FFE4C4]/50 scale-[1.02]"
                    : "border-gray-100 hover:border-[#FFD4A3] hover:bg-gray-50 hover:shadow-md"
                }`}
              >
                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <div className="w-5 h-5 bg-[#FE9200] rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  </div>
                )}

                {/* Icon with gradient background */}
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-3 transition-all ${
                  isSelected
                    ? `bg-gradient-to-br ${type.color} shadow-md`
                    : 'bg-gray-100 group-hover:bg-gray-200'
                }`}>
                  <IconComponent className={`w-5 h-5 sm:w-6 sm:h-6 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                </div>

                {/* Label */}
                <p className={`font-semibold text-sm sm:text-base mb-1 ${
                  isSelected ? "text-[#7A00AA]" : "text-gray-800"
                }`}>
                  {type.label}
                </p>

                {/* Description */}
                <p className={`text-xs ${isSelected ? 'text-[#7A00AA]/70' : 'text-gray-500'}`}>
                  {type.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <Button
        onClick={handleNext}
        disabled={!formData.type}
        className="w-full py-3 sm:py-4 bg-[#FE9200] hover:bg-[#E58300] text-white rounded-xl font-semibold shadow-lg shadow-[#FFE4C4] transition-all flex items-center justify-center gap-2 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next Step <ChevronRight className="w-5 h-5" />
      </Button>
    </div>
  );

  // Handle budget selection
  const handleBudgetSelect = (budgetData) => {
    setFormData(prev => ({
      ...prev,
      budget: budgetData.value,
      budgetFormatted: budgetData.formatted,
      currency: budgetData.currency || 'KES',
    }));
  };

  const renderStep3 = () => (
    <div className="space-y-5 sm:space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div>
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
          What&apos;s your budget?
        </h3>
        <p className="text-gray-500 mb-4 sm:mb-6 text-sm">
          Set your monthly rental budget. You can enter a custom amount or use quick presets.
        </p>

        <BudgetInput
          value={formData.budget}
          onChange={(value) => setFormData(prev => ({ ...prev, budget: value }))}
          onBudgetSelect={handleBudgetSelect}
          countryCode={formData.countryCode || defaultCountry}
          label="Monthly Budget"
        />
      </div>

      <Button
        onClick={handleNext}
        disabled={!formData.budget}
        className="w-full py-3 sm:py-4 bg-[#FE9200] hover:bg-[#E58300] text-white rounded-xl font-semibold shadow-lg shadow-[#FFE4C4] transition-all flex items-center justify-center gap-2 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next Step <ChevronRight className="w-5 h-5" />
      </Button>
    </div>
  );

  const renderStep4 = () => (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 sm:space-y-6 animate-in fade-in slide-in-from-right-4 duration-300"
    >
      <div>
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
          Contact Details
        </h3>
        <p className="text-gray-500 mb-4 sm:mb-6 text-sm">
          How can agents reach you?
        </p>

        {/* Form fields - 44-52px height per mobile guidelines */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Your Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                required
                className="w-full pl-11 pr-4 py-3 min-h-[48px] border border-gray-200 rounded-xl text-sm text-gray-900 focus:border-[#FE9200] focus:ring-2 focus:ring-[#FFE4C4] outline-none transition-all bg-white placeholder-gray-400"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                required
                className="w-full pl-11 pr-4 py-3 min-h-[48px] border border-gray-200 rounded-xl text-sm text-gray-900 focus:border-[#FE9200] focus:ring-2 focus:ring-[#FFE4C4] outline-none transition-all bg-white placeholder-gray-400"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              WhatsApp Number
            </label>
            <div className="relative">
              <PhoneInput
                international
                defaultCountry={defaultCountry}
                value={formData.whatsapp}
                onChange={(value) => {
                  setFormData({ ...formData, whatsapp: value });
                  if (verificationStep !== "idle") {
                    setVerificationStep("idle");
                    setOtp("");
                    setVerificationError("");
                  }
                }}
                disabled={
                  verificationStep === "verified" || verificationStep === "sent"
                }
                className="w-full pl-3 pr-4 py-3 min-h-[48px] border border-gray-200 rounded-xl text-sm text-gray-900 focus-within:border-[#FE9200] focus-within:ring-2 focus-within:ring-[#FFE4C4] transition-all bg-white [&>input]:outline-none [&>input]:bg-transparent [&>input]:w-full [&>input]:ml-2 [&>input]:text-gray-900"
              />
              {verificationStep === "verified" && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#FE9200]">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              )}
            </div>

            <div className="mt-3">
              {verificationError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 sm:p-3 mb-3">
                  <p className="text-red-600 text-xs sm:text-sm">
                    {verificationError}
                  </p>
                </div>
              )}

              {verificationStep === "idle" &&
                formData.whatsapp &&
                isValidPhoneNumber(formData.whatsapp) && (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="text-sm font-medium text-[#FE9200] hover:text-[#E58300] underline"
                  >
                    Verify this number
                  </button>
                )}

              {verificationStep === "sending" && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" /> Sending
                  verification code...
                </div>
              )}

              {verificationStep === "sent" && (
                <div className="space-y-3 sm:space-y-4 animate-in fade-in slide-in-from-top-2 bg-gray-50 rounded-xl p-3 sm:p-4 border border-gray-100">
                  <div className="text-center">
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">
                      Enter the 6-digit code sent to
                    </p>
                    <p className="text-xs sm:text-sm font-semibold text-gray-900">
                      {formData.whatsapp}
                    </p>
                  </div>

                  <OTPInput
                    length={6}
                    value={otp}
                    onChange={setOtp}
                    onComplete={(code) => handleVerifyOtp(code)}
                    disabled={verificationStep === "verifying"}
                    error={!!verificationError}
                  />

                  {otpExpiresIn > 0 && (
                    <p className="text-center text-xs sm:text-sm text-gray-500">
                      Code expires in{" "}
                      <span className="font-mono font-semibold text-gray-700">
                        {formatTime(otpExpiresIn)}
                      </span>
                    </p>
                  )}
                  {otpExpiresIn === 0 && verificationStep === "sent" && (
                    <p className="text-center text-xs sm:text-sm text-red-500">
                      Code expired. Please request a new code.
                    </p>
                  )}

                  <Button
                    type="button"
                    onClick={() => handleVerifyOtp()}
                    disabled={
                      otp.length !== 6 || verificationStep === "verifying"
                    }
                    className="w-full bg-[#FE9200] text-white py-2.5 sm:py-3 rounded-lg font-medium text-sm"
                  >
                    {verificationStep === "verifying" ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />{" "}
                        Verifying...
                      </span>
                    ) : (
                      "Verify Code"
                    )}
                  </Button>

                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <button
                      type="button"
                      onClick={() => {
                        setVerificationStep("idle");
                        setOtp("");
                        setVerificationError("");
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
                        className="text-[#FE9200] hover:text-[#E58300] font-medium flex items-center gap-1"
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

              {verificationStep === "verifying" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#FE9200] mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      Verifying your code...
                    </p>
                  </div>
                </div>
              )}

              {verificationStep === "verified" && (
                <div className="flex items-center gap-2 bg-[#FFF5E6] border border-[#D4F3D4] rounded-lg p-2.5 sm:p-3">
                  <ShieldCheck className="w-5 h-5 text-[#16A34A]" />
                  <p className="text-xs sm:text-sm text-[#15803D] font-medium">
                    Phone number verified successfully
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Phone verification required notice */}
      {verificationStep !== "verified" && formData.whatsapp && (
        <p className="text-xs text-amber-600 text-center font-medium">
          ⚠️ Phone verification is required to submit your request.
        </p>
      )}

      <Button
        type="submit"
        disabled={
          !formData.name ||
          !isValidEmail(formData.email) ||
          !formData.whatsapp ||
          verificationStep !== "verified" ||
          isSubmitting
        }
        className="w-full py-3 sm:py-4 bg-[#FE9200] hover:bg-[#E58300] text-white rounded-xl font-semibold shadow-lg shadow-[#FFE4C4] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
      >
        {isSubmitting ? (
          <div className="w-5 sm:w-6 h-5 sm:h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            Submit Request <Check className="w-5 h-5" />
          </>
        )}
      </Button>
    </form>
  );

  const renderSuccess = () => (
    <div className="text-center py-8 sm:py-12 animate-in zoom-in duration-500 px-4">
      <div className="w-20 sm:w-24 h-20 sm:h-24 bg-[#FFE4C4] rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 text-[#16A34A] shadow-xl shadow-[#FFE4C4]">
        <Check className="w-10 sm:w-12 h-10 sm:h-12 stroke-[3]" />
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
        Congratulations!
      </h2>
      <p className="text-gray-500 text-base sm:text-lg mb-6 sm:mb-8 max-w-md mx-auto">
        Your request has been submitted successfully. Top-rated agents in{" "}
        {formData.location} will contact you shortly.
      </p>
      <div className="flex flex-col gap-3 max-w-xs mx-auto">
        <Button
          onClick={() => onNavigate("landing")}
          className="w-full py-3 bg-[#FE9200] hover:bg-[#E58300] text-white rounded-xl font-medium"
        >
          Back to Home
        </Button>
        <Button
          onClick={() => {
            setStep(1);
            setFormData({
              location: "",
              locationData: null,
              city: "",
              area: "",
              state: "",
              country: "",
              countryCode: "",
              pincode: "",
              type: "",
              budget: "",
              budgetFormatted: "",
              currency: "KES",
              name: "",
              email: "",
              whatsapp: "",
            });
            setIsSuccess(false);
            setVerificationStep("idle");
            setOtp("");
            setVerificationError("");
            // Reset AI state
            setAiInput("");
            setAiError("");
            setAiSuccess(false);
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
      <div className="min-h-screen w-full flex items-center justify-center bg-white p-4">
        {renderSuccess()}
      </div>
    );
  }

  return (
    <div className={`w-full flex flex-col md:flex-row overflow-hidden bg-white font-sans ${currentUser ? 'min-h-[calc(100vh-80px)]' : 'min-h-screen'}`}>
      {/* Left Side - Form */}
      <div className={`w-full md:w-1/2 flex flex-col px-4 sm:px-6 lg:px-12 xl:px-24 py-4 sm:py-6 relative z-10 overflow-y-auto ${currentUser ? '' : 'min-h-screen'} md:min-h-0`}>
        {/* Logo Header - Only show when user is NOT logged in (main Header handles logged-in state) */}
        {!currentUser && (
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="cursor-pointer" onClick={() => onNavigate("landing")}>
              <Image
                src="/yoombaa-logo-dark.svg"
                alt="Yoombaa"
                width={108}
                height={36}
                className="h-7 sm:h-9 w-auto"
                priority
              />
            </div>
            <button
              onClick={() => onNavigate("login")}
              className="px-3 sm:px-4 py-2 rounded-full bg-[#FE9200] text-white font-semibold hover:bg-[#E58300] transition-all shadow-md text-xs sm:text-sm"
            >
              I&apos;m an Agent
            </button>
          </div>
        )}

        {/* Back button */}
        <button
          onClick={handleBack}
          className="flex items-center text-gray-500 hover:text-gray-900 transition-colors mb-4 sm:mb-6 text-sm"
        >
          <ArrowLeft className="w-4 sm:w-5 h-4 sm:h-5 mr-1.5 sm:mr-2" />
          Back
        </button>

        <div className="max-w-md w-full mx-auto flex-1 flex flex-col justify-center">
          {/* Progress Bar */}
          <div className="mb-6 sm:mb-10">
            <div className="flex justify-between text-xs font-medium text-gray-500 mb-2 sm:mb-3">
              <span>Step {step} of 4</span>
              <span>{Math.round((step / 4) * 100)}%</span>
            </div>
            <div className="h-1.5 sm:h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#FE9200] transition-all duration-500 ease-out"
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
      <div className="hidden md:flex md:w-1/2 bg-[#0f172a] relative items-center justify-center p-8 lg:p-12 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#7A00AA] to-slate-900 z-0"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1484154218962-a1c002085d2f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80')] opacity-20 bg-cover bg-center mix-blend-overlay"></div>

        <div className="relative z-10 max-w-lg">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6 leading-tight">
            Find your dream home without the hassle.
          </h2>
          <div className="space-y-4">
            <p className="text-base lg:text-lg text-gray-300 italic leading-relaxed">
              &quot;I posted my requirements and got 3 amazing options within
              hours. Found my new place the same day! Yoombaa is a
              lifesaver.&quot;
            </p>
            <div className="flex items-center gap-4 mt-8">
              <div className="w-12 h-12 rounded-full bg-[#FE9200] flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-[#7A00AA]/20">
                C
              </div>
              <div>
                <p className="font-semibold text-white">Chioma Egwu</p>
                <p className="text-sm text-[#FFD4A3]">Tenant in Nairobi</p>
              </div>
            </div>
          </div>

          <div className="mt-12 lg:mt-16 pt-6 lg:pt-8 border-t border-white/10 flex gap-6 lg:gap-8 opacity-40 grayscale">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 lg:w-6 h-5 lg:h-6" />
              <span className="font-bold text-base lg:text-lg">Yoombaa</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base lg:text-lg">Pesapal</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
