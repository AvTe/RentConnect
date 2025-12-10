"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Loader2, ShieldCheck, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "./Button";
import { OTPInput } from "./OTPInput";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";

/**
 * Reusable Phone Verification Component with OTP
 * Used for verifying phone numbers via SMS OTP (Africa's Talking)
 * 
 * @param {string} phoneNumber - The phone number to verify
 * @param {function} onPhoneChange - Callback when phone number changes
 * @param {function} onVerified - Callback when verification is successful
 * @param {boolean} checkExisting - Whether to check if phone already exists
 * @param {function} checkExistingFn - Function to check if phone exists (returns boolean)
 * @param {string} defaultCountry - Default country code (default: "KE")
 * @param {boolean} disabled - Whether the input is disabled
 * @param {string} label - Label for the phone input
 * @param {boolean} required - Whether the field is required
 */
export const PhoneVerification = ({
  phoneNumber,
  onPhoneChange,
  onVerified,
  checkExisting = false,
  checkExistingFn = null,
  defaultCountry = "KE",
  disabled = false,
  label = "Phone Number (WhatsApp)",
  required = true,
}) => {
  const [verificationStep, setVerificationStep] = useState("idle"); // idle, sending, sent, verifying, verified
  const [otp, setOtp] = useState("");
  const [verificationError, setVerificationError] = useState("");
  const [otpExpiresIn, setOtpExpiresIn] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  // Countdown timer for OTP expiry
  useEffect(() => {
    let timer;
    if (verificationStep === "sent" && otpExpiresIn > 0) {
      timer = setInterval(() => {
        setOtpExpiresIn((prev) => {
          if (prev <= 1) {
            setVerificationStep("idle");
            setVerificationError("Verification code expired. Please request a new one.");
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
    if (!phoneNumber || !isValidPhoneNumber(phoneNumber)) {
      setVerificationError("Please enter a valid phone number.");
      return;
    }

    setVerificationStep("sending");
    setVerificationError("");

    try {
      // Check if phone number already exists (optional)
      if (checkExisting && checkExistingFn) {
        const exists = await checkExistingFn(phoneNumber);
        if (exists) {
          setVerificationError("This phone number is already registered. Please login instead.");
          setVerificationStep("idle");
          return;
        }
      }

      const response = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send verification code.");
      }

      // Show dev OTP in development mode
      if (data.devOtp) {
        console.log("🔐 DEV MODE - Your OTP is:", data.devOtp);
        alert(`DEV MODE - Your verification code is: ${data.devOtp}\n\nIn production, this will be sent via SMS.`);
      }

      setVerificationStep("sent");
      setOtpExpiresIn(data.expiresIn || 300);
      setCanResend(false);
      setResendCountdown(30);
    } catch (error) {
      console.error("Error sending OTP:", error);
      setVerificationError(error.message || "Failed to send verification code.");
      setVerificationStep("idle");
    }
  }, [phoneNumber, checkExisting, checkExistingFn]);

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
          body: JSON.stringify({ phoneNumber, otp: codeToVerify }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Invalid verification code.");
        }

        setVerificationStep("verified");
        setVerificationError("");
        if (onVerified) {
          onVerified(phoneNumber);
        }
      } catch (error) {
        console.error("Error verifying OTP:", error);
        setVerificationError(error.message || "Invalid code. Please try again.");
        setVerificationStep("sent");
      }
    },
    [otp, phoneNumber, onVerified]
  );

  const handlePhoneChange = (value) => {
    // Reset verification when phone changes
    if (value !== phoneNumber) {
      setVerificationStep("idle");
      setOtp("");
      setVerificationError("");
    }
    onPhoneChange(value);
  };

  const isVerified = verificationStep === "verified";
  const isSending = verificationStep === "sending";
  const isVerifying = verificationStep === "verifying";
  const showOtpInput = verificationStep === "sent" || verificationStep === "verifying";

  return (
    <div className="space-y-4">
      {/* Phone Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="flex gap-2">
          <div className="flex-1">
            <PhoneInput
              international
              countryCallingCodeEditable={false}
              defaultCountry={defaultCountry}
              value={phoneNumber}
              onChange={handlePhoneChange}
              disabled={disabled || isVerified}
              className={`w-full px-4 py-3 rounded-xl border ${
                isVerified
                  ? "border-green-300 bg-green-50"
                  : verificationError
                  ? "border-red-300"
                  : "border-gray-200"
              } focus:ring-2 focus:ring-[#FE9200] focus:border-[#FE9200] outline-none transition-all`}
            />
          </div>
          {!isVerified && (
            <Button
              type="button"
              onClick={handleSendOtp}
              disabled={!phoneNumber || !isValidPhoneNumber(phoneNumber || "") || isSending}
              className="px-4 py-2 bg-[#FE9200] hover:bg-[#E58300] text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">Sending...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span className="hidden sm:inline">Verify</span>
                </>
              )}
            </Button>
          )}
          {isVerified && (
            <div className="flex items-center justify-center px-4 py-2 bg-green-100 text-green-700 rounded-xl">
              <CheckCircle className="w-5 h-5" />
            </div>
          )}
        </div>
      </div>

      {/* Verification Status */}
      {isVerified && (
        <div className="flex items-center gap-2 text-green-600 text-sm">
          <CheckCircle className="w-4 h-4" />
          <span>Phone number verified successfully!</span>
        </div>
      )}

      {/* Error Message */}
      {verificationError && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{verificationError}</span>
        </div>
      )}

      {/* OTP Input Section */}
      {showOtpInput && (
        <div className="bg-gray-50 rounded-xl p-4 space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">
              Enter the 6-digit code sent to your phone
            </p>
            <p className="text-xs text-gray-500">
              Code expires in{" "}
              <span className="font-medium text-[#FE9200]">
                {formatTime(otpExpiresIn)}
              </span>
            </p>
          </div>

          <OTPInput
            length={6}
            value={otp}
            onChange={setOtp}
            onComplete={handleVerifyOtp}
            disabled={isVerifying}
          />

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={!canResend || isSending}
              className={`flex items-center gap-1 text-sm ${
                canResend
                  ? "text-[#FE9200] hover:text-[#E58300]"
                  : "text-gray-400 cursor-not-allowed"
              }`}
            >
              <RefreshCw className="w-3 h-3" />
              {resendCountdown > 0
                ? `Resend in ${resendCountdown}s`
                : "Resend Code"}
            </button>

            <Button
              type="button"
              onClick={() => handleVerifyOtp()}
              disabled={otp.length < 6 || isVerifying}
              className="px-4 py-2 bg-[#FE9200] hover:bg-[#E58300] text-white rounded-lg font-medium transition-all disabled:opacity-50"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Verifying...
                </>
              ) : (
                "Verify Code"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhoneVerification;

