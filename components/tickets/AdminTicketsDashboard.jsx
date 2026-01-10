// Admin Tickets Dashboard
// Premium, clean design with problem-solution focused layout

import React, { useState, useEffect } from 'react';
import {
    Inbox, Clock, CheckCircle, XCircle, AlertTriangle,
    RefreshCw, Filter, Search, ChevronRight, Trash2,
    MessageSquare, User, Calendar, Flag, MoreVertical,
    TrendingUp, ArrowUpRight, Eye, Loader2
} from 'lucide-react';
import { getAllTickets, getTicketStats, deleteTicket, updateTicket, subscribeToTickets } from '@/lib/ticket-service';
import { useToast } from '@/context/ToastContext';
import { TicketDetail } from './TicketDetail';

const statusConfig = {
    all: { label: 'All Tickets', icon: Inbox, color: 'from-gray-500 to-gray-600', bgColor: 'bg-gray-50', textColor: 'text-gray-700' },
    open: { label: 'Open', icon: AlertTriangle, color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-50', textColor: 'text-blue-700' },
    in_progress: { label: 'In Progress', icon: Clock, color: 'from-amber-500 to-orange-500', bgColor: 'bg-amber-50', textColor: 'text-amber-700' },
    pending: { label: 'Pending', icon: Clock, color: 'from-violet-500 to-purple-500', bgColor: 'bg-violet-50', textColor: 'text-violet-700' },
    resolved: { label: 'Resolved', icon: CheckCircle, color: 'from-emerald-500 to-green-500', bgColor: 'bg-emerald-50', textColor: 'text-emerald-700' },
    closed: { label: 'Closed', icon: XCircle, color: 'from-gray-400 to-gray-500', bgColor: 'bg-gray-50', textColor: 'text-gray-600' }
};

const priorityConfig = {
    low: { label: 'Low', color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
    medium: { label: 'Medium', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
    high: { label: 'High', color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
    urgent: { label: 'Urgent', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' }
};

// Stat Card Component
const StatCard = ({ status, config, count, isActive, onClick, urgentCount }) => {
    const Icon = config.icon;

    return (
        <button
            onClick={onClick}
            className={`relative p-4 rounded-2xl border-2 transition-all duration-200 text-left w-full ${isActive
                ? 'border-[#FE9200] bg-gradient-to-br from-orange-50 to-amber-50 shadow-lg shadow-orange-100'
                : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-md'
                }`}
        >
            <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isActive ? 'bg-gradient-to-br from-[#FE9200] to-[#FF6B00]' : config.bgColor
                    }`}>
                    <Icon size={18} className={isActive ? 'text-white' : config.textColor} />
                </div>
                {status === 'open' && urgentCount > 0 && (
                    <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full animate-pulse">
                        {urgentCount} urgent
                    </span>
                )}
            </div>
            <p className={`text-2xl font-black ${isActive ? 'text-[#FE9200]' : 'text-gray-900'}`}>{count}</p>
            <p className={`text-xs font-medium mt-0.5 ${isActive ? 'text-[#FE9200]/70' : 'text-gray-500'}`}>
                {config.label}
            </p>
        </button>
    );
};

// Ticket Row Component
const TicketRow = ({ ticket, onClick, onStatusChange, onDelete }) => {
    const [showMenu, setShowMenu] = useState(false);
    const status = statusConfig[ticket.status] || statusConfig.open;
    const priority = priorityConfig[ticket.priority] || priorityConfig.medium;
    const StatusIcon = status.icon;

    const formatDate = (date) => {
        const d = new Date(date);
        const now = new Date();
        const diffMs = now - d;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <div className="group bg-white rounded-2xl border border-gray-100 hover:border-[#FE9200]/30 hover:shadow-lg transition-all duration-200">
            <div className="p-4 md:p-5">
                {/* Top Row */}
                <div className="flex items-start gap-4">
                    {/* User Avatar */}
                    <div className="flex-shrink-0">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-sm font-bold text-gray-600 overflow-hidden">
                            {ticket.user?.avatar ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={ticket.user.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                                ticket.user?.name?.charAt(0) || 'U'
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0" onClick={onClick}>
                        <div className="flex items-start justify-between gap-3 cursor-pointer">
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-gray-900 group-hover:text-[#FE9200] transition-colors line-clamp-1">
                                    {ticket.subject}
                                </h3>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                                    <span className="text-sm font-medium text-gray-700">
                                        {ticket.user?.name || 'Unknown User'}
                                    </span>
                                    {ticket.user?.role && (
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${ticket.user.role === 'agent'
                                            ? 'bg-purple-100 text-purple-600'
                                            : 'bg-blue-100 text-blue-600'
                                            }`}>
                                            {ticket.user.role === 'agent' ? 'Agent' : 'Tenant'}
                                        </span>
                                    )}
                                    <span className="text-xs text-gray-400">•</span>
                                    <span className="text-xs text-gray-500">{formatDate(ticket.created_at)}</span>
                                </div>
                            </div>

                            {/* Status & Priority */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <div className="flex items-center gap-1.5">
                                    <span className={`w-2 h-2 rounded-full ${priority.dot}`} />
                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${priority.color}`}>
                                        {priority.label}
                                    </span>
                                </div>
                                <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${status.bgColor} ${status.textColor}`}>
                                    <StatusIcon size={12} />
                                    {status.label}
                                </span>
                            </div>
                        </div>

                        {/* Message Preview */}
                        <p className="text-sm text-gray-500 mt-2 line-clamp-1 cursor-pointer" onClick={onClick}>
                            {ticket.message}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                            onClick={onClick}
                            className="p-2 text-gray-400 hover:text-[#FE9200] hover:bg-orange-50 rounded-lg transition-colors"
                            title="View ticket"
                        >
                            <Eye size={18} />
                        </button>
                        <div className="relative">
                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <MoreVertical size={18} />
                            </button>
                            {showMenu && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                                    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-20">
                                        <button
                                            onClick={() => { onStatusChange('in_progress'); setShowMenu(false); }}
                                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                        >
                                            <Clock size={14} /> Mark In Progress
                                        </button>
                                        <button
                                            onClick={() => { onStatusChange('resolved'); setShowMenu(false); }}
                                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                        >
                                            <CheckCircle size={14} /> Mark Resolved
                                        </button>
                                        <hr className="my-2 border-gray-100" />
                                        <button
                                            onClick={() => { onDelete(); setShowMenu(false); }}
                                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                        >
                                            <Trash2 size={14} /> Delete
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Empty State Component
const EmptyState = ({ status }) => (
    <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
            <Inbox size={28} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">No tickets found</h3>
        <p className="text-sm text-gray-500 max-w-sm mx-auto">
            {status === 'all'
                ? 'There are no support tickets yet. Tickets will appear here when users submit them.'
                : `No ${statusConfig[status]?.label.toLowerCase() || status} tickets at the moment.`
            }
        </p>
    </div>
);

export const AdminTicketsDashboard = ({ currentUser }) => {
    const { toast } = useToast();
    const [tickets, setTickets] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [filters, setFilters] = useState({
        status: 'all',
        priority: 'all',
        category: 'all',
        search: ''
    });

    const fetchTickets = async () => {
        setLoading(true);
        const result = await getAllTickets({
            status: filters.status !== 'all' ? filters.status : undefined,
            priority: filters.priority !== 'all' ? filters.priority : undefined,
            category: filters.category !== 'all' ? filters.category : undefined
        });
        if (result.success) {
            // Apply search filter client-side
            let filtered = result.data || [];
            if (filters.search) {
                const search = filters.search.toLowerCase();
                filtered = filtered.filter(t =>
                    t.subject?.toLowerCase().includes(search) ||
                    t.message?.toLowerCase().includes(search) ||
                    t.user?.name?.toLowerCase().includes(search) ||
                    t.user?.email?.toLowerCase().includes(search)
                );
            }
            setTickets(filtered);
        }
        setLoading(false);
    };

    const fetchStats = async () => {
        const result = await getTicketStats();
        if (result.success) {
            setStats(result.data);
        }
    };

    useEffect(() => {
        fetchTickets();
        fetchStats();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters.status, filters.priority, filters.category]);

    // Real-time subscription for live ticket updates
    useEffect(() => {
        const unsubscribe = subscribeToTickets((updatedTickets) => {
            // Apply search filter client-side
            let filtered = updatedTickets || [];
            if (filters.search) {
                const search = filters.search.toLowerCase();
                filtered = filtered.filter(t =>
                    t.subject?.toLowerCase().includes(search) ||
                    t.message?.toLowerCase().includes(search) ||
                    t.user?.name?.toLowerCase().includes(search) ||
                    t.user?.email?.toLowerCase().includes(search)
                );
            }
            // Apply status filter
            if (filters.status !== 'all') {
                filtered = filtered.filter(t => t.status === filters.status);
            }
            // Apply priority filter
            if (filters.priority !== 'all') {
                filtered = filtered.filter(t => t.priority === filters.priority);
            }
            setTickets(filtered);
            setLoading(false);
            // Also refresh stats
            fetchStats();
        }, {});

        return () => unsubscribe();
    }, [filters.search, filters.status, filters.priority]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchTickets();
        }, 300);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters.search]);

    const handleStatusChange = async (ticketId, newStatus) => {
        const result = await updateTicket(ticketId, { status: newStatus });
        if (result.success) {
            toast.success(`Ticket marked as ${newStatus.replace('_', ' ')}`);
            fetchTickets();
            fetchStats();
        } else {
            toast.error('Failed to update ticket');
        }
    };

    const handleDelete = async (ticketId) => {
        if (!confirm('Are you sure you want to delete this ticket?')) return;
        const result = await deleteTicket(ticketId);
        if (result.success) {
            toast.success('Ticket deleted');
            fetchTickets();
            fetchStats();
        } else {
            toast.error('Failed to delete ticket');
        }
    };

    if (selectedTicket) {
        return (
            <TicketDetail
                ticket={selectedTicket}
                onBack={() => { setSelectedTicket(null); fetchTickets(); fetchStats(); }}
                currentUser={currentUser}
                isAdmin={true}
            />
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900">Support Center</h1>
                    <p className="text-gray-500 mt-1">Manage and resolve customer issues</p>
                </div>
                <button
                    onClick={() => { fetchTickets(); fetchStats(); }}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:border-[#FE9200] hover:text-[#FE9200] rounded-xl font-medium text-sm transition-all"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {Object.entries(statusConfig).map(([key, config]) => (
                    <StatCard
                        key={key}
                        status={key}
                        config={config}
                        count={key === 'all' ? stats?.total || 0 : stats?.[key] || 0}
                        isActive={filters.status === key}
                        onClick={() => setFilters(f => ({ ...f, status: key }))}
                        urgentCount={stats?.priorities?.urgent || 0}
                    />
                ))}
            </div>

            {/* Today's Activity Banner */}
            {stats?.todayCount > 0 && (
                <div className="bg-gradient-to-r from-[#FE9200] to-[#FF6B00] rounded-2xl p-5 flex items-center justify-between text-white">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <p className="font-bold text-lg">{stats.todayCount} new ticket{stats.todayCount > 1 ? 's' : ''} today</p>
                            <p className="text-white/80 text-sm">Keep up the great support!</p>
                        </div>
                    </div>
                    <ArrowUpRight size={24} className="opacity-50" />
                </div>
            )}

            {/* Search & Filters */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex flex-col md:flex-row gap-3">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by subject, user name, or email..."
                            value={filters.search}
                            onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                            className="w-full pl-11 pr-4 py-2.5 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-[#FE9200]/30 focus:bg-white transition-all text-sm"
                        />
                    </div>

                    {/* Filter Dropdowns */}
                    <div className="flex gap-2 flex-wrap">
                        <select
                            value={filters.priority}
                            onChange={(e) => setFilters(f => ({ ...f, priority: e.target.value }))}
                            className="px-4 py-2.5 bg-gray-50 rounded-xl border-0 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-[#FE9200]/30"
                        >
                            <option value="all">All Priority</option>
                            <option value="urgent">🔴 Urgent</option>
                            <option value="high">🟠 High</option>
                            <option value="medium">🔵 Medium</option>
                            <option value="low">⚪ Low</option>
                        </select>

                        <select
                            value={filters.category}
                            onChange={(e) => setFilters(f => ({ ...f, category: e.target.value }))}
                            className="px-4 py-2.5 bg-gray-50 rounded-xl border-0 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-[#FE9200]/30"
                        >
                            <option value="all">All Categories</option>
                            <option value="general">General</option>
                            <option value="technical">Technical</option>
                            <option value="account">Account</option>
                            <option value="leads">Leads</option>
                            <option value="payments">Payments</option>
                            <option value="verification">Verification</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Tickets List */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                            <div className="flex items-start gap-4">
                                <div className="w-11 h-11 rounded-full bg-gray-200" />
                                <div className="flex-1">
                                    <div className="h-5 w-48 bg-gray-200 rounded mb-2" />
                                    <div className="h-4 w-32 bg-gray-100 rounded mb-3" />
                                    <div className="h-4 w-full bg-gray-100 rounded" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : tickets.length === 0 ? (
                <EmptyState status={filters.status} />
            ) : (
                <div className="space-y-3">
                    {tickets.map(ticket => (
                        <TicketRow
                            key={ticket.id}
                            ticket={ticket}
                            onClick={() => setSelectedTicket(ticket)}
                            onStatusChange={(status) => handleStatusChange(ticket.id, status)}
                            onDelete={() => handleDelete(ticket.id)}
                        />
                    ))}
                </div>
            )}

            {/* Results Count */}
            {!loading && tickets.length > 0 && (
                <p className="text-center text-sm text-gray-500">
                    Showing {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
                </p>
            )}
        </div>
    );
};

export default AdminTicketsDashboard;
