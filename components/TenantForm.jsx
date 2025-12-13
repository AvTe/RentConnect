import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  MapPin,
  Banknote,
  User,
  Check,
  ChevronRight,
  Building2,
  Mail,
  Loader2,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { Button } from "./ui/Button";
import { OTPInput } from "./ui/OTPInput";
import confetti from "canvas-confetti";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { checkPhoneNumberExists } from "@/lib/database";

const PROPERTY_TYPES = [
  { id: "1 Bedroom", label: "1 Bedroom", icon: "🛏️" },
  { id: "2 Bedroom", label: "2 Bedroom", icon: "🏡" },
  { id: "3 Bedroom", label: "3 Bedroom", icon: "🏰" },
  { id: "Self Contain", label: "Self Contain", icon: "🏠" },
  { id: "Mini Flat", label: "Mini Flat", icon: "🏢" },
  { id: "Duplex", label: "Duplex", icon: "🏘️" },
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
    location: "",
    pincode: "",
    type: "",
    budget: "",
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
  const [isLocating, setIsLocating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [verificationStep, setVerificationStep] = useState("idle");
  const [otp, setOtp] = useState("");
  const [verificationError, setVerificationError] = useState("");
  const [otpExpiresIn, setOtpExpiresIn] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

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

  // Fallback: Get approximate location from IP address
  const getLocationFromIP = async () => {
    try {
      // Use ip-api.com for IP-based geolocation (free, no API key required)
      const response = await fetch('http://ip-api.com/json/?fields=status,city,regionName,country,countryCode,lat,lon');
      const data = await response.json();

      if (data.status === 'success') {
        const locationString = data.city && data.regionName
          ? `${data.city}, ${data.regionName}`
          : data.city || data.country;

        setFormData((prev) => ({ ...prev, location: locationString }));
        if (data.countryCode) setDefaultCountry(data.countryCode);
        return true;
      }
      return false;
    } catch (error) {
      console.error("IP geolocation error:", error);
      return false;
    }
  };

  const handleUseCurrentLocation = async () => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser. We'll try to detect your location automatically.");
      setIsLocating(true);
      const success = await getLocationFromIP();
      setIsLocating(false);
      if (!success) {
        alert("Could not detect your location. Please enter it manually.");
      }
      return;
    }

    // Check if we're on a secure context (HTTPS or localhost)
    const isSecureContext = window.isSecureContext ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';

    // For non-secure contexts, use IP-based geolocation as fallback
    if (!isSecureContext) {
      console.log("Non-secure context detected, using IP-based geolocation");
      setIsLocating(true);
      const success = await getLocationFromIP();
      setIsLocating(false);
      if (!success) {
        alert("Could not detect your location. Please enter it manually.");
      }
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `/api/geocode?lat=${latitude}&lon=${longitude}`,
          );
          if (!response.ok) throw new Error("Geocoding failed");

          const data = await response.json();
          const city =
            data.address.city ||
            data.address.town ||
            data.address.village ||
            data.address.suburb;
          const state = data.address.state;
          const countryCode = data.address.country_code?.toUpperCase();
          const locationString =
            city && state ? `${city}, ${state}` : data.display_name;

          setFormData((prev) => ({ ...prev, location: locationString }));
          if (countryCode) setDefaultCountry(countryCode);
        } catch (error) {
          console.error("Error fetching location:", error);
          setFormData((prev) => ({
            ...prev,
            location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          }));
        } finally {
          setIsLocating(false);
        }
      },
      async (error) => {
        console.error("Geolocation error:", error.code, error.message);

        // Try IP-based fallback for any geolocation error
        console.log("Falling back to IP-based geolocation...");
        const success = await getLocationFromIP();
        setIsLocating(false);

        if (!success) {
          // Only show error if IP fallback also failed
          let errorMessage = "Unable to retrieve your location. ";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += "Location access was denied. Please enter your location manually.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += "Location information is unavailable. Please enter your location manually.";
              break;
            case error.TIMEOUT:
              errorMessage += "Location request timed out. Please enter your location manually.";
              break;
            default:
              errorMessage += "Please enter your location manually.";
          }
          alert(errorMessage);
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000 // Cache location for 5 minutes
      }
    );
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

  const renderStep1 = () => (
    <div className="space-y-5 sm:space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div>
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
          Where do you want to live?
        </h3>
        <p className="text-gray-500 mb-4 sm:mb-6 text-sm">
          Enter the location where you are looking to rent.
        </p>
        <div className="relative">
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#FE9200] transition-colors z-10"
            title="Use current location"
          >
            {isLocating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <MapPin className="w-5 h-5" />
            )}
          </button>
          <input
            type="text"
            autoFocus
            value={formData.location}
            onChange={(e) =>
              setFormData({ ...formData, location: e.target.value })
            }
            onKeyDown={(e) =>
              e.key === "Enter" && formData.location && handleNext()
            }
            placeholder="e.g., Nairobi, Westlands"
            className="w-full pl-12 sm:pl-14 pr-4 py-3 sm:py-4 border-2 border-gray-200 rounded-xl focus:border-[#FE9200] focus:ring-4 focus:ring-[#FFE4C4] outline-none transition-all text-sm sm:text-base bg-white text-gray-900 placeholder-gray-400"
          />
        </div>
      </div>
      <Button
        onClick={handleNext}
        disabled={!formData.location}
        className="w-full py-3 sm:py-4 bg-[#FE9200] hover:bg-[#E58300] text-white rounded-xl font-semibold shadow-lg shadow-[#FFE4C4] transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
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
          Select the type of apartment you are interested in.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {PROPERTY_TYPES.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => {
                setFormData({ ...formData, type: type.id });
              }}
              className={`p-3 sm:p-4 rounded-xl border-2 text-left transition-all flex flex-col gap-1.5 sm:gap-2 ${
                formData.type === type.id
                  ? "border-[#FE9200] bg-[#FFF5E6] ring-1 ring-[#FE9200]"
                  : "border-gray-100 hover:border-[#FFD4A3] hover:bg-gray-50"
              }`}
            >
              <span className="text-xl sm:text-2xl">{type.icon}</span>
              <span
                className={`font-medium text-sm sm:text-base ${formData.type === type.id ? "text-[#7A00AA]" : "text-gray-700"}`}
              >
                {type.label}
              </span>
            </button>
          ))}
        </div>
      </div>
      <Button
        onClick={handleNext}
        disabled={!formData.type}
        className="w-full py-3 sm:py-4 bg-[#FE9200] hover:bg-[#E58300] text-white rounded-xl font-semibold shadow-lg shadow-[#FFE4C4] transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
      >
        Next Step <ChevronRight className="w-5 h-5" />
      </Button>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-5 sm:space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div>
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
          What is your budget?
        </h3>
        <p className="text-gray-500 mb-4 sm:mb-6 text-sm">
          Enter your annual budget for rent.
        </p>
        <div className="relative">
          <Banknote className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            autoFocus
            className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 border-2 border-gray-100 rounded-xl text-base sm:text-lg text-gray-900 focus:border-[#FE9200] focus:ring-0 outline-none transition-all shadow-sm bg-white placeholder-gray-400"
            placeholder="e.g. 1,500,000"
            value={formData.budget}
            onChange={(e) =>
              setFormData({ ...formData, budget: e.target.value })
            }
            onKeyDown={(e) =>
              e.key === "Enter" && formData.budget && handleNext()
            }
          />
        </div>
      </div>
      <Button
        onClick={handleNext}
        disabled={!formData.budget}
        className="w-full py-3 sm:py-4 bg-[#FE9200] hover:bg-[#E58300] text-white rounded-xl font-semibold shadow-lg shadow-[#FFE4C4] transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
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

        <div className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Name
            </label>
            <div className="relative">
              <User className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                required
                className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 border-2 border-gray-100 rounded-xl text-base sm:text-lg text-gray-900 focus:border-[#FE9200] focus:ring-0 outline-none transition-all shadow-sm bg-white placeholder-gray-400"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                required
                className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 border-2 border-gray-100 rounded-xl text-base sm:text-lg text-gray-900 focus:border-[#FE9200] focus:ring-0 outline-none transition-all shadow-sm bg-white placeholder-gray-400"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
                className="w-full pl-3 sm:pl-4 pr-4 py-3 sm:py-4 border-2 border-gray-100 rounded-xl text-base sm:text-lg text-gray-900 focus-within:border-[#FE9200] focus-within:ring-0 transition-all shadow-sm bg-white [&>input]:outline-none [&>input]:bg-transparent [&>input]:w-full [&>input]:ml-2 [&>input]:text-gray-900"
              />
              {verificationStep === "verified" && (
                <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-[#FE9200]">
                  <ShieldCheck className="w-5 sm:w-6 h-5 sm:h-6" />
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
              pincode: "",
              type: "",
              budget: "",
              name: "",
              email: "",
              whatsapp: "",
            });
            setIsSuccess(false);
            setVerificationStep("idle");
            setOtp("");
            setVerificationError("");
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
