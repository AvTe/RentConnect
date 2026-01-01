import React, { useState, useEffect } from 'react';
import { X, Save, MapPin, Home, Coins, Calendar, Loader2 } from 'lucide-react';
import { Button } from './ui/Button';
import { Tooltip } from './ui/Tooltip';

export const EditLeadModal = ({ isOpen, onClose, lead, onSave }) => {
    const [formData, setFormData] = useState({
        location: '',
        property_type: '',
        budget: '',
        bedrooms: 0,
        requirements: {
            additional_requirements: '',
            pincode: '',
            amenities: []
        }
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (lead) {
            setFormData({
                location: lead.location || '',
                property_type: lead.property_type || '',
                budget: lead.budget || '',
                bedrooms: lead.bedrooms || 0,
                requirements: lead.requirements || {
                    additional_requirements: '',
                    pincode: '',
                    amenities: []
                }
            });
        }
    }, [lead]);

    if (!isOpen || !lead) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSave(lead.id, formData);
            onClose();
        } catch (error) {
            console.error('Error saving lead:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Edit Property Request</h3>
                        <p className="text-xs text-gray-500">Update your requirements to get better matches</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    <form id="edit-lead-form" onSubmit={handleSubmit} className="space-y-5">
                        {/* Property Type */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <Home size={16} className="text-[#FE9200]" />
                                Property Type
                            </label>
                            <select
                                value={formData.property_type}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    const beds = val.includes('Bedroom') ? parseInt(val) : (val === 'Studio' ? 0 : 1);
                                    setFormData({ ...formData, property_type: val, bedrooms: beds });
                                }}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FE9200]/20 focus:border-[#FE9200] transition-all text-sm font-medium"
                                required
                            >
                                <option value="1 Bedroom">1 Bedroom</option>
                                <option value="2 Bedroom">2 Bedroom</option>
                                <option value="3 Bedroom">3 Bedroom</option>
                                <option value="Studio">Studio</option>
                                <option value="Self Contain">Self Contain</option>
                                <option value="Bedsitter">Bedsitter</option>
                            </select>
                        </div>

                        {/* Location */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <MapPin size={16} className="text-[#FE9200]" />
                                Location
                            </label>
                            <input
                                type="text"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                placeholder="e.g. Westlands, Nairobi"
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FE9200]/20 focus:border-[#FE9200] transition-all text-sm font-medium"
                                required
                            />
                        </div>

                        {/* Budget */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <Coins size={16} className="text-[#FE9200]" />
                                Monthly Budget (KSh)
                            </label>
                            <input
                                type="number"
                                value={formData.budget}
                                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                                placeholder="e.g. 45000"
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FE9200]/20 focus:border-[#FE9200] transition-all text-sm font-medium"
                                required
                            />
                        </div>

                        {/* Additional Info */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Additional Requirements</label>
                            <textarea
                                value={formData.requirements.additional_requirements}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    requirements: { ...formData.requirements, additional_requirements: e.target.value }
                                })}
                                placeholder="Any specific features or amenities you're looking for?"
                                rows={3}
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FE9200]/20 focus:border-[#FE9200] transition-all text-sm font-medium resize-none"
                            />
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-3 sticky bottom-0">
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        form="edit-lead-form"
                        disabled={isSubmitting}
                        className="min-w-[120px]"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 size={16} className="mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={16} className="mr-2" />
                                Save Changes
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};
