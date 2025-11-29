'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';

export const OTPInput = ({ 
  length = 6, 
  value = '', 
  onChange, 
  onComplete,
  disabled = false,
  error = false,
  autoFocus = true
}) => {
  const [otp, setOtp] = useState(Array(length).fill(''));
  const inputRefs = useRef([]);

  // Sync with external value
  useEffect(() => {
    if (value) {
      const valueArray = value.split('').slice(0, length);
      const newOtp = [...Array(length).fill('')];
      valueArray.forEach((char, i) => {
        newOtp[i] = char;
      });
      setOtp(newOtp);
    } else {
      setOtp(Array(length).fill(''));
    }
  }, [value, length]);

  // Auto focus first input
  useEffect(() => {
    if (autoFocus && inputRefs.current[0] && !disabled) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus, disabled]);

  const handleChange = useCallback((index, e) => {
    const inputValue = e.target.value;
    
    // Only allow digits
    if (inputValue && !/^\d+$/.test(inputValue)) return;

    // Handle paste of multiple digits
    if (inputValue.length > 1) {
      const digits = inputValue.split('').filter(c => /\d/.test(c)).slice(0, length);
      const newOtp = [...otp];
      digits.forEach((digit, i) => {
        if (index + i < length) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);
      
      const newValue = newOtp.join('');
      onChange?.(newValue);
      
      // Focus appropriate input
      const nextIndex = Math.min(index + digits.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
      
      // Auto-submit if complete
      if (newOtp.every(d => d !== '')) {
        onComplete?.(newValue);
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = inputValue;
    setOtp(newOtp);

    const newValue = newOtp.join('');
    onChange?.(newValue);

    // Move to next input if a digit was entered
    if (inputValue && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit if complete
    if (newOtp.every(d => d !== '')) {
      onComplete?.(newValue);
    }
  }, [otp, length, onChange, onComplete]);

  const handleKeyDown = useCallback((index, e) => {
    if (e.key === 'Backspace') {
      if (otp[index]) {
        // Clear current input
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
        onChange?.(newOtp.join(''));
      } else if (index > 0) {
        // Move to previous input and clear it
        inputRefs.current[index - 1]?.focus();
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        onChange?.(newOtp.join(''));
      }
      e.preventDefault();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
      e.preventDefault();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      e.preventDefault();
    }
  }, [otp, length, onChange]);

  const handlePaste = useCallback((e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (pastedData) {
      const newOtp = [...Array(length).fill('')];
      pastedData.split('').forEach((char, i) => {
        newOtp[i] = char;
      });
      setOtp(newOtp);
      
      const newValue = newOtp.join('');
      onChange?.(newValue);
      
      // Focus last filled input or next empty
      const lastIndex = Math.min(pastedData.length, length) - 1;
      inputRefs.current[lastIndex]?.focus();
      
      if (newOtp.every(d => d !== '')) {
        onComplete?.(newValue);
      }
    }
  }, [length, onChange, onComplete]);

  return (
    <div className="flex gap-2 sm:gap-3 justify-center">
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={el => inputRefs.current[index] = el}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          disabled={disabled}
          className={`
            w-10 h-12 sm:w-12 sm:h-14 
            text-center text-xl sm:text-2xl font-bold
            border-2 rounded-xl
            outline-none transition-all duration-200
            bg-white text-gray-900
            ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}
            ${error ? 'border-red-400 shake' : 'border-gray-200'}
            ${digit ? 'border-emerald-500 bg-emerald-50' : ''}
            focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100
          `}
          aria-label={`Digit ${index + 1} of ${length}`}
        />
      ))}
    </div>
  );
};

export default OTPInput;

