'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { Banknote } from 'lucide-react';

/**
 * Currency configuration by country code
 */
const CURRENCY_CONFIG = {
  KE: { symbol: 'KSh', code: 'KES', locale: 'en-KE' },
  IN: { symbol: '₹', code: 'INR', locale: 'en-IN' },
  US: { symbol: '$', code: 'USD', locale: 'en-US' },
  GB: { symbol: '£', code: 'GBP', locale: 'en-GB' },
  NG: { symbol: '₦', code: 'NGN', locale: 'en-NG' },
};

/**
 * Budget presets by country (monthly rent ranges)
 */
const BUDGET_PRESETS = {
  KE: [
    { label: 'Under 20K', min: 0, max: 20000 },
    { label: '20K - 40K', min: 20000, max: 40000 },
    { label: '40K - 70K', min: 40000, max: 70000 },
    { label: '70K - 100K', min: 70000, max: 100000 },
    { label: '100K+', min: 100000, max: 500000 },
  ],
  IN: [
    { label: 'Under 15K', min: 0, max: 15000 },
    { label: '15K - 30K', min: 15000, max: 30000 },
    { label: '30K - 50K', min: 30000, max: 50000 },
    { label: '50K - 80K', min: 50000, max: 80000 },
    { label: '80K+', min: 80000, max: 300000 },
  ],
  DEFAULT: [
    { label: 'Budget', min: 0, max: 25000 },
    { label: 'Mid-range', min: 25000, max: 50000 },
    { label: 'Premium', min: 50000, max: 100000 },
    { label: 'Luxury', min: 100000, max: 500000 },
  ],
};

/**
 * Budget Input Component with currency awareness and presets
 */
export const BudgetInput = ({
  value = '',
  onChange,
  onBudgetSelect,
  countryCode = 'KE',
  label = 'Monthly Budget',
  disabled = false,
  className = '',
}) => {
  const [inputValue, setInputValue] = useState('');
  const [selectedPreset, setSelectedPreset] = useState(null);

  // Get currency config
  const currency = useMemo(() => 
    CURRENCY_CONFIG[countryCode] || CURRENCY_CONFIG.KE
  , [countryCode]);

  // Get budget presets
  const presets = useMemo(() => 
    BUDGET_PRESETS[countryCode] || BUDGET_PRESETS.DEFAULT
  , [countryCode]);

  // Parse value on mount
  useEffect(() => {
    if (value) {
      const numValue = parseInt(value.toString().replace(/[^0-9]/g, '') || '0');
      setInputValue(formatNumberInput(numValue));
    }
  }, []);

  // Format number with thousand separators
  const formatNumberInput = (num) => {
    if (!num || num === 0) return '';
    return num.toLocaleString(currency.locale);
  };

  // Format for display with currency
  const formatCurrency = (num) => {
    if (!num || num === 0) return '';
    return `${currency.symbol} ${num.toLocaleString(currency.locale)}`;
  };

  // Handle direct input
  const handleInputChange = (e) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    const numValue = parseInt(rawValue || '0');
    
    setInputValue(rawValue ? formatNumberInput(numValue) : '');
    setSelectedPreset(null);
    onChange?.(rawValue);
    onBudgetSelect?.({ 
      value: rawValue, 
      formatted: formatCurrency(numValue),
      currency: currency.code 
    });
  };

  // Handle preset selection
  const handlePresetClick = (preset, index) => {
    setSelectedPreset(index);
    setInputValue(formatNumberInput(preset.max));
    onChange?.(preset.max.toString());
    onBudgetSelect?.({
      value: preset.max.toString(),
      min: preset.min,
      max: preset.max,
      formatted: formatCurrency(preset.max),
      label: preset.label,
      currency: currency.code
    });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Currency Display */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600">{label}</span>
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
          {currency.code}
        </span>
      </div>

      {/* Input Field */}
      <div className="relative">
        <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
          {currency.symbol}
        </div>
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          disabled={disabled}
          placeholder="Enter amount"
          className={`w-full pl-12 sm:pl-14 pr-4 py-3 sm:py-4 border-2 border-gray-200 rounded-xl focus:border-[#FE9200] focus:ring-4 focus:ring-[#FFE4C4] outline-none transition-all text-lg sm:text-xl font-semibold text-gray-900 placeholder-gray-400 ${
            disabled ? 'opacity-60 cursor-not-allowed bg-gray-50' : 'bg-white'
          }`}
        />
        <Banknote className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      </div>

      {/* Quick Select Presets */}
      <div>
        <p className="text-xs text-gray-500 mb-2">Quick select:</p>
        <div className="flex flex-wrap gap-2">
          {presets.map((preset, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handlePresetClick(preset, index)}
              disabled={disabled}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedPreset === index
                  ? 'bg-[#FE9200] text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-[#FFF5E6] hover:text-[#FE9200]'
              } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Display formatted budget */}
      {inputValue && (
        <div className="text-center py-2 bg-[#FFF5E6] rounded-lg">
          <p className="text-sm text-gray-600">Your budget:</p>
          <p className="text-xl font-bold text-[#FE9200]">
            {formatCurrency(parseInt(inputValue.replace(/[^0-9]/g, '') || '0'))}
          </p>
          <p className="text-xs text-gray-500">per month</p>
        </div>
      )}
    </div>
  );
};

export default BudgetInput;
