// User Support Dashboard Component
// Clean, user-centric support interface for Tenants and Agents

import React, { useState, useEffect } from 'react';
import {
    Plus, HelpCircle, MessageSquare, Clock,
    CheckCircle, RefreshCw, Inbox, ArrowRight,
    Sparkles, Headphones
} from 'lucide-react';
import { Button } from '../ui/Button';
import { TicketForm } from './TicketForm';
import { TicketList } from './TicketList';
import { TicketDetail } from './TicketDetail';
import { getUserTickets, subscribeToUserTickets } from '@/lib/ticket-service';

const statusTabs = [
    { id: 'all', label: 'All', icon: Inbox },
    { id: 'open', label: 'Open', icon: AlertCircle },
    { id: 'in_progress', label: 'In Progress', icon: Clock },
    { id: 'resolved', label: 'Resolved', icon: CheckCircle },
];

import { AlertCircle } from 'lucide-react';

export const UserSupportDashboard = ({ user, userType = 'tenant' }) => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showTicketForm, setShowTicketForm] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [activeTab, setActiveTab] = useState('all');

    // Fetch user tickets
    const fetchTickets = async () => {
        setLoading(true);
        const result = await getUserTickets(user.id || user.uid, {
            status: activeTab !== 'all' ? activeTab : undefined
        });
        if (result.success) {
            setTickets(result.data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchTickets();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    // Real-time subscription for live ticket updates
    useEffect(() => {
        const userId = user?.id || user?.uid;
        if (!userId) return;

        const unsubscribe = subscribeToUserTickets(userId, (updatedTickets) => {
            // Apply status filter
            let filtered = updatedTickets || [];
            if (activeTab !== 'all') {
                filtered = filtered.filter(t => t.status === activeTab);
            }
            setTickets(filtered);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user?.id, user?.uid, activeTab]);

    const handleTicketCreated = (newTicket) => {
        setTickets(prev => [newTicket, ...prev]);
        setShowTicketForm(false);
    };

    // Stats
    const stats = {
        total: tickets.length,
        open: tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length,
        resolved: tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length
    };

    // If viewing a specific ticket
    if (selectedTicket) {
        return (
            <TicketDetail
                ticket={selectedTicket}
                currentUser={user}
                isAdmin={false}
                onBack={() => { setSelectedTicket(null); fetchTickets(); }}
            />
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl md:text-2xl font-black text-gray-900">Help Center</h2>
                    <p className="text-gray-500 text-sm mt-1">We&apos;re here to help! Get support from our team.</p>
                </div>
                <Button
                    onClick={() => setShowTicketForm(true)}
                    className="bg-[#FE9200] hover:bg-[#E58300] flex items-center gap-2 shadow-lg shadow-orange-200"
                >
                    <Plus size={18} />
                    New Ticket
                </Button>
            </div>

            {/* Quick Help Banner */}
            {stats.total === 0 && (
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border border-orange-100 p-6">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FE9200] to-[#FF6B00] flex items-center justify-center flex-shrink-0">
                            <Headphones size={24} className="text-white" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900 mb-1">Need help with something?</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Our support team typically responds within 24 hours. Create a ticket and we&apos;ll get back to you!
                            </p>
                            <Button
                                onClick={() => setShowTicketForm(true)}
                                variant="outline"
                                className="border-[#FE9200] text-[#FE9200] hover:bg-[#FE9200] hover:text-white"
                            >
                                <Sparkles size={16} />
                                Create Your First Ticket
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            {stats.total > 0 && (
                <div className="grid grid-cols-3 gap-3 md:gap-4">
                    <div className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs md:text-sm text-gray-500 mb-0.5">Total</p>
                                <p className="text-xl md:text-2xl font-black text-gray-900">{stats.total}</p>
                            </div>
                            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                                <MessageSquare size={18} className="text-gray-400" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs md:text-sm text-gray-500 mb-0.5">Active</p>
                                <p className="text-xl md:text-2xl font-black text-[#FE9200]">{stats.open}</p>
                            </div>
                            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                                <Clock size={18} className="text-[#FE9200]" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs md:text-sm text-gray-500 mb-0.5">Resolved</p>
                                <p className="text-xl md:text-2xl font-black text-emerald-600">{stats.resolved}</p>
                            </div>
                            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                                <CheckCircle size={18} className="text-emerald-500" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs & Refresh */}
            {stats.total > 0 && (
                <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 overflow-x-auto">
                        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit">
                            {statusTabs.map(tab => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        <Icon size={14} />
                                        <span className="hidden sm:inline">{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <button
                        onClick={fetchTickets}
                        disabled={loading}
                        className="flex-shrink-0 p-2.5 hover:bg-gray-100 rounded-xl transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw size={18} className={`text-gray-400 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            )}

            {/* Ticket List */}
            <TicketList
                tickets={tickets}
                loading={loading}
                onTicketClick={setSelectedTicket}
                emptyMessage={activeTab === 'all'
                    ? "No tickets yet. Create one to get help!"
                    : `No ${activeTab.replace('_', ' ')} tickets`
                }
            />

            {/* Ticket Form Modal */}
            {showTicketForm && (
                <TicketForm
                    user={user}
                    userType={userType}
                    onClose={() => setShowTicketForm(false)}
                    onSuccess={handleTicketCreated}
                />
            )}
        </div>
    );
};

export default UserSupportDashboard;
