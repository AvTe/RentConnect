'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Filter, X, Search, MapPin, Home, DollarSign, 
  ChevronDown, ChevronUp, RotateCcw, SlidersHorizontal
} from 'lucide-react';
import { Button } from './Button';

// Property type options based on lead data
const PROPERTY_TYPES = [
  'All Types',
  'Studio',
  '1 Bedroom',
  '2 Bedroom',
  '3 Bedroom',
  '4+ Bedroom',
  'Apartment',
  'House',
  'Mini Flat',
  'Self Contain',
  'Duplex',
  'Penthouse'
];

// Budget range presets (in KSh)
const BUDGET_PRESETS = [
  { label: 'Any Budget', min: 0, max: Infinity },
  { label: 'Under 20K', min: 0, max: 20000 },
  { label: '20K - 40K', min: 20000, max: 40000 },
  { label: '40K - 60K', min: 40000, max: 60000 },
  { label: '60K - 100K', min: 60000, max: 100000 },
  { label: '100K - 200K', min: 100000, max: 200000 },
  { label: 'Above 200K', min: 200000, max: Infinity }
];

/**
 * LeadFilters - Reusable filter component for leads
 * Features: Property type, Location search, Budget range, Mobile responsive, AJAX filtering
 */
export const LeadFilters = ({
  leads = [],
  onFilterChange,
  showSearch = true,
  showPropertyType = true,
  showLocation = true,
  showBudget = true,
  className = '',
  variant = 'default' // 'default' | 'compact' | 'inline'
}) => {
  // Filter state
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [propertyType, setPropertyType] = useState('All Types');
  const [location, setLocation] = useState('');
  const [budgetRange, setBudgetRange] = useState({ min: 0, max: Infinity });
  const [selectedBudgetPreset, setSelectedBudgetPreset] = useState('Any Budget');
  
  // Extract unique locations from leads for suggestions
  const uniqueLocations = useMemo(() => {
    const locations = leads
      .map(lead => lead.location || lead.requirements?.location || '')
      .filter(Boolean)
      .map(loc => loc.trim());
    return [...new Set(locations)].sort();
  }, [leads]);

  // Extract unique property types from leads
  const availablePropertyTypes = useMemo(() => {
    const types = leads
      .map(lead => lead.property_type || lead.requirements?.property_type || lead.type || '')
      .filter(Boolean);
    const uniqueTypes = [...new Set(types)].sort();
    return ['All Types', ...uniqueTypes];
  }, [leads]);

  // Debounced filter application
  const applyFilters = useCallback(() => {
    const filters = {
      searchTerm: searchTerm.trim().toLowerCase(),
      propertyType: propertyType === 'All Types' ? '' : propertyType,
      location: location.trim().toLowerCase(),
      budgetMin: budgetRange.min,
      budgetMax: budgetRange.max === Infinity ? Number.MAX_SAFE_INTEGER : budgetRange.max
    };
    
    // Filter leads client-side for instant feedback
    const filteredLeads = leads.filter(lead => {
      const leadLocation = (lead.location || lead.requirements?.location || '').toLowerCase();
      const leadType = (lead.property_type || lead.requirements?.property_type || lead.type || '').toLowerCase();
      const leadBudget = parseInt(String(lead.budget || lead.requirements?.budget || 0).replace(/[^0-9]/g, '')) || 0;
      const tenantName = (lead.tenant_name || lead.tenant_info?.name || lead.name || '').toLowerCase();

      // Search term matches location, property type, or tenant name
      const matchesSearch = !filters.searchTerm || 
        leadLocation.includes(filters.searchTerm) ||
        leadType.includes(filters.searchTerm) ||
        tenantName.includes(filters.searchTerm);

      // Property type filter
      const matchesType = !filters.propertyType || 
        leadType.includes(filters.propertyType.toLowerCase());

      // Location filter
      const matchesLocation = !filters.location || 
        leadLocation.includes(filters.location);

      // Budget filter
      const matchesBudget = leadBudget >= filters.budgetMin && 
        (filters.budgetMax === Number.MAX_SAFE_INTEGER || leadBudget <= filters.budgetMax);

      return matchesSearch && matchesType && matchesLocation && matchesBudget;
    });

    onFilterChange?.(filteredLeads, filters);
  }, [leads, searchTerm, propertyType, location, budgetRange, onFilterChange]);

  // Apply filters whenever filter values change (AJAX-like live filtering)
  useEffect(() => {
    const debounceTimer = setTimeout(applyFilters, 150);
    return () => clearTimeout(debounceTimer);
  }, [applyFilters]);

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('');
    setPropertyType('All Types');
    setLocation('');
    setBudgetRange({ min: 0, max: Infinity });
    setSelectedBudgetPreset('Any Budget');
  };

  // Handle budget preset selection
  const handleBudgetPresetChange = (preset) => {
    setSelectedBudgetPreset(preset.label);
    setBudgetRange({ min: preset.min, max: preset.max });
  };

  // Check if any filters are active
  const hasActiveFilters = searchTerm || propertyType !== 'All Types' || 
    location || budgetRange.min > 0 || budgetRange.max !== Infinity;

  // Count active filters
  const activeFilterCount = [
    searchTerm,
    propertyType !== 'All Types' ? propertyType : '',
    location,
    budgetRange.min > 0 || budgetRange.max !== Infinity ? 'budget' : ''
  ].filter(Boolean).length;

  return (
    <div className={`lead-filters ${className}`}>
      {/* Filter Toggle Button (Mobile & Desktop) */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search Input - Always visible on desktop, collapsible on mobile */}
        {showSearch && (
          <div className="relative flex-1 min-w-[200px] md:min-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search leads..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FE9200] focus:border-transparent bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Filter Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
            isOpen || hasActiveFilters
              ? 'bg-[#FE9200] text-white'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              isOpen || hasActiveFilters ? 'bg-white/20' : 'bg-[#FE9200] text-white'
            }`}>
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Reset Button - Only show when filters are active */}
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        )}
      </div>

      {/* Expandable Filter Panel */}
      {isOpen && (
        <div className="mt-3 p-4 bg-white border border-gray-200 rounded-xl shadow-lg animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Property Type Filter */}
            {showPropertyType && (
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Home className="w-4 h-4 text-[#FE9200]" />
                  Property Type
                </label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FE9200] focus:border-transparent bg-white cursor-pointer"
                >
                  {(availablePropertyTypes.length > 1 ? availablePropertyTypes : PROPERTY_TYPES).map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Location Filter */}
            {showLocation && (
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <MapPin className="w-4 h-4 text-[#FE9200]" />
                  Location
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Filter by location..."
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FE9200] focus:border-transparent"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    list="location-suggestions"
                  />
                  <datalist id="location-suggestions">
                    {uniqueLocations.slice(0, 10).map((loc, idx) => (
                      <option key={idx} value={loc} />
                    ))}
                  </datalist>
                  {location && (
                    <button
                      onClick={() => setLocation('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Budget Range Filter */}
            {showBudget && (
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <DollarSign className="w-4 h-4 text-[#FE9200]" />
                  Budget Range
                </label>
                <select
                  value={selectedBudgetPreset}
                  onChange={(e) => {
                    const preset = BUDGET_PRESETS.find(p => p.label === e.target.value);
                    if (preset) handleBudgetPresetChange(preset);
                  }}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FE9200] focus:border-transparent bg-white cursor-pointer"
                >
                  {BUDGET_PRESETS.map((preset) => (
                    <option key={preset.label} value={preset.label}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Active Filter Tags */}
          {hasActiveFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-gray-500">Active filters:</span>
                {propertyType !== 'All Types' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#FFF5E6] text-[#E58300] rounded-full text-xs font-medium">
                    {propertyType}
                    <button onClick={() => setPropertyType('All Types')} className="hover:text-[#FE9200]">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {location && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#FFF5E6] text-[#E58300] rounded-full text-xs font-medium">
                    {location}
                    <button onClick={() => setLocation('')} className="hover:text-[#FE9200]">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {(budgetRange.min > 0 || budgetRange.max !== Infinity) && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#FFF5E6] text-[#E58300] rounded-full text-xs font-medium">
                    {selectedBudgetPreset}
                    <button onClick={() => {
                      setBudgetRange({ min: 0, max: Infinity });
                      setSelectedBudgetPreset('Any Budget');
                    }} className="hover:text-[#FE9200]">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LeadFilters;

