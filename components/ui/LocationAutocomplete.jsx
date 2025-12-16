'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Loader2, Navigation, X, Check } from 'lucide-react';

/**
 * Helper function to format location display - avoids duplicates
 */
const formatLocationDisplay = (location) => {
  if (!location) return '';

  // Get unique parts, avoiding duplicates
  const parts = [];
  const seen = new Set();

  // Primary name (area or name)
  const primaryName = location.area || location.name;
  if (primaryName) {
    parts.push(primaryName);
    seen.add(primaryName.toLowerCase());
  }

  // City (only if different from primary)
  if (location.city && !seen.has(location.city.toLowerCase())) {
    parts.push(location.city);
    seen.add(location.city.toLowerCase());
  }

  // State (only if different from primary and city)
  if (location.state && !seen.has(location.state.toLowerCase())) {
    parts.push(location.state);
    seen.add(location.state.toLowerCase());
  }

  return parts.join(', ');
};

/**
 * Get country display name from code
 */
const getCountryName = (countryCode, countryName) => {
  if (countryName) return countryName;
  const countryMap = {
    'KE': 'Kenya',
    'IN': 'India',
    'US': 'United States',
    'UK': 'United Kingdom',
    'GB': 'United Kingdom',
  };
  return countryMap[countryCode] || countryCode;
};

/**
 * Location Autocomplete Component using Nominatim/OpenStreetMap
 * Provides structured location data for database storage
 */
export const LocationAutocomplete = ({
  value = '',
  onChange,
  onLocationSelect,
  placeholder = 'Search for a location...',
  defaultCountry = 'KE',
  disabled = false,
  autoFocus = false,
  className = '',
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const debounceRef = useRef(null);

  // Sync with external value
  useEffect(() => {
    if (value !== inputValue && !selectedLocation) {
      setInputValue(value);
    }
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          inputRef.current && !inputRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  const searchLocations = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/location-search?q=${encodeURIComponent(query)}&country=ke,in`);
      const data = await response.json();
      setSuggestions(data.results || []);
      setIsOpen(true);
    } catch (error) {
      console.error('Location search error:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setSelectedLocation(null);
    onChange?.(newValue);

    // Debounce search
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchLocations(newValue), 300);
  };

  const handleSelectLocation = (location) => {
    const displayName = location.area 
      ? `${location.area}, ${location.city || location.state}`
      : location.city || location.name;
    
    setInputValue(displayName);
    setSelectedLocation(location);
    setSuggestions([]);
    setIsOpen(false);
    onChange?.(displayName);
    onLocationSelect?.(location);
  };

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(`/api/geocode?lat=${latitude}&lon=${longitude}`);
          const data = await response.json();
          
          if (data.address) {
            const location = {
              name: data.address.city || data.address.town || data.address.village || '',
              city: data.address.city || data.address.town || data.address.village || '',
              area: data.address.suburb || data.address.neighbourhood || '',
              state: data.address.state || '',
              country: data.address.country || '',
              countryCode: data.address.country_code?.toUpperCase() || '',
              postcode: data.address.postcode || '',
              lat: latitude,
              lon: longitude,
            };
            handleSelectLocation(location);
          }
        } catch (error) {
          console.error('Geocoding error:', error);
          alert('Could not detect your location. Please search manually.');
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        console.error('Geolocation error:', error);
        alert('Could not access your location. Please search manually.');
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  };

  const clearSelection = () => {
    setInputValue('');
    setSelectedLocation(null);
    onChange?.('');
    onLocationSelect?.(null);
    inputRef.current?.focus();
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        {/* Location Pin Icon / Loading */}
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={isLocating || disabled}
          className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#FE9200] transition-colors z-10"
          title="Use current location"
        >
          {isLocating ? (
            <Loader2 className="w-5 h-5 animate-spin text-[#FE9200]" />
          ) : (
            <Navigation className="w-5 h-5" />
          )}
        </button>

        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          className={`w-full pl-12 sm:pl-14 pr-12 py-3 sm:py-4 border-2 rounded-xl focus:border-[#FE9200] focus:ring-4 focus:ring-[#FFE4C4] outline-none transition-all text-sm sm:text-base bg-white text-gray-900 placeholder-gray-400 ${
            selectedLocation ? 'border-green-300 bg-green-50' : 'border-gray-200'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        />

        {/* Right side icons */}
        <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
          {selectedLocation && !isLoading && (
            <>
              <Check className="w-5 h-5 text-green-500" />
              <button type="button" onClick={clearSelection} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Selected Location Details */}
      {selectedLocation && (
        <div className="mt-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-green-700">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="font-medium">{formatLocationDisplay(selectedLocation)}</span>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full ml-auto">
              {selectedLocation.country || (selectedLocation.countryCode === 'KE' ? 'Kenya' : selectedLocation.countryCode === 'IN' ? 'India' : selectedLocation.countryCode)}
            </span>
          </div>
        </div>
      )}

      {/* Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto"
        >
          {suggestions.map((location, index) => {
            // Build display strings avoiding duplicates
            const primaryName = location.area || location.name || location.city;
            const secondaryParts = [];
            const seen = new Set([primaryName?.toLowerCase()]);

            if (location.city && !seen.has(location.city.toLowerCase())) {
              secondaryParts.push(location.city);
              seen.add(location.city.toLowerCase());
            }
            if (location.state && !seen.has(location.state.toLowerCase())) {
              secondaryParts.push(location.state);
              seen.add(location.state.toLowerCase());
            }

            const countryDisplay = getCountryName(location.countryCode, location.country);

            return (
              <button
                key={location.id || index}
                type="button"
                onClick={() => handleSelectLocation(location)}
                className="w-full px-4 py-3 text-left hover:bg-[#FFF5E6] transition-colors border-b border-gray-100 last:border-b-0 flex items-start gap-3"
              >
                <MapPin className="w-5 h-5 text-[#FE9200] mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {primaryName}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {secondaryParts.length > 0
                      ? `${secondaryParts.join(', ')}, ${countryDisplay}`
                      : countryDisplay
                    }
                  </p>
                </div>
                {location.countryCode && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full flex-shrink-0">
                    {location.countryCode === 'KE' ? '🇰🇪' : location.countryCode === 'IN' ? '🇮🇳' : ''} {location.countryCode}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* No results message */}
      {isOpen && !isLoading && inputValue.length >= 2 && suggestions.length === 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg p-4 text-center text-gray-500">
          <p className="text-sm">No locations found for "{inputValue}"</p>
          <p className="text-xs mt-1">Try a different search term</p>
        </div>
      )}
    </div>
  );
};

export default LocationAutocomplete;

