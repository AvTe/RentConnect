// Ticket List Component
// Displays a list of tickets with filtering and status badges

import React from 'react';
import {
    Clock, AlertCircle, CheckCircle, Loader2,
    MessageSquare, ChevronRight, Tag, Calendar,
    Inbox, Search
} from 'lucide-react';

const statusConfig = {
    open: { label: 'Open', color: 'bg-blue-100 text-blue-700', icon: Inbox },
    in_progress: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-700', icon: Loader2 },
    pending: { label: 'Pending', color: 'bg-purple-100 text-purple-700', icon: Clock },
    resolved: { label: 'Resolved', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    closed: { label: 'Closed', color: 'bg-gray-100 text-gray-700', icon: CheckCircle },
};

const priorityConfig = {
    low: { label: 'Low', color: 'bg-gray-100 text-gray-600' },
    medium: { label: 'Medium', color: 'bg-blue-100 text-blue-600' },
    high: { label: 'High', color: 'bg-orange-100 text-orange-600' },
    urgent: { label: 'Urgent', color: 'bg-red-100 text-red-600' },
};

const categoryConfig = {
    general: { label: 'General', color: 'text-gray-500' },
    technical: { label: 'Technical', color: 'text-blue-500' },
    account: { label: 'Account', color: 'text-purple-500' },
    leads: { label: 'Leads', color: 'text-orange-500' },
    payments: { label: 'Payments', color: 'text-green-500' },
    verification: { label: 'Verification', color: 'text-yellow-600' },
};

// Format relative time
const formatRelativeTime = (date) => {
    const now = new Date();
    const ticketDate = new Date(date);
    const diffInSeconds = Math.floor((now - ticketDate) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return ticketDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: ticketDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
};

export const TicketCard = ({ ticket, onClick, showUser = false }) => {
    const status = statusConfig[ticket.status] || statusConfig.open;
    const priority = priorityConfig[ticket.priority] || priorityConfig.medium;
    const category = categoryConfig[ticket.category] || categoryConfig.general;
    const StatusIcon = status.icon;

    return (
        <div
            onClick={onClick}
            className="bg-white rounded-2xl border border-gray-100 p-4 md:p-5 hover:shadow-lg hover:border-[#FE9200]/30 transition-all cursor-pointer group"
        >
            {/* Header Row */}
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 group-hover:text-[#FE9200] transition-colors truncate">
                        {ticket.subject}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                        <span className={`${category.color} font-medium`}>{category.label}</span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full" />
                        <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {formatRelativeTime(ticket.created_at)}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${priority.color}`}>
                        {priority.label}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${status.color}`}>
                        <StatusIcon size={12} className={ticket.status === 'in_progress' ? 'animate-spin' : ''} />
                        {status.label}
                    </span>
                </div>
            </div>

            {/* Description Preview */}
            <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                {ticket.message}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                {showUser && ticket.user ? (
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 overflow-hidden">
                            {ticket.user.avatar ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={ticket.user.avatar} alt={ticket.user.name} className="w-full h-full object-cover" />
                            ) : (
                                ticket.user.name?.charAt(0) || 'U'
                            )}
                        </div>
                        <span className="text-sm text-gray-600 font-medium">{ticket.user.name}</span>
                        {ticket.user.role && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${ticket.user.role === 'agent' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                                }`}>
                                {ticket.user.role === 'agent' ? 'Agent' : 'Tenant'}
                            </span>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <MessageSquare size={14} />
                        <span>{ticket.replies?.length || 0} replies</span>
                    </div>
                )}
                <ChevronRight size={18} className="text-gray-300 group-hover:text-[#FE9200] group-hover:translate-x-1 transition-all" />
            </div>
        </div>
    );
};

export const TicketList = ({
    tickets,
    loading,
    onTicketClick,
    emptyMessage = "No tickets found",
    showUser = false
}) => {
    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                        <div className="flex items-center justify-between mb-3">
                            <div className="h-5 w-48 bg-gray-200 rounded" />
                            <div className="h-6 w-20 bg-gray-200 rounded-full" />
                        </div>
                        <div className="h-4 w-full bg-gray-100 rounded mb-2" />
                        <div className="h-4 w-3/4 bg-gray-100 rounded" />
                    </div>
                ))}
            </div>
        );
    }

    if (!tickets || tickets.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Inbox size={32} className="text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{emptyMessage}</h3>
                <p className="text-gray-500 text-sm">Your tickets will appear here once created</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {tickets.map(ticket => (
                <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    onClick={() => onTicketClick(ticket)}
                    showUser={showUser}
                />
            ))}
        </div>
    );
};

// Ticket Filters Component
export const TicketFilters = ({
    filters,
    onFilterChange,
    showUserTypeFilter = false,
    showSearch = false
}) => {
    return (
        <div className="flex flex-wrap items-center gap-3 mb-4">
            {showSearch && (
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search tickets..."
                        value={filters.search || ''}
                        onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#FE9200] focus:ring-0 outline-none transition-all text-sm"
                    />
                </div>
            )}

            <select
                value={filters.status || 'all'}
                onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
                className="px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#FE9200] outline-none text-sm font-medium bg-white"
            >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="pending">Pending</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
            </select>

            <select
                value={filters.priority || 'all'}
                onChange={(e) => onFilterChange({ ...filters, priority: e.target.value })}
                className="px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#FE9200] outline-none text-sm font-medium bg-white"
            >
                <option value="all">All Priority</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
            </select>

            <select
                value={filters.category || 'all'}
                onChange={(e) => onFilterChange({ ...filters, category: e.target.value })}
                className="px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#FE9200] outline-none text-sm font-medium bg-white"
            >
                <option value="all">All Categories</option>
                <option value="general">General</option>
                <option value="technical">Technical</option>
                <option value="account">Account</option>
                <option value="leads">Leads</option>
                <option value="payments">Payments</option>
                <option value="verification">Verification</option>
            </select>

            {showUserTypeFilter && (
                <select
                    value={filters.userType || 'all'}
                    onChange={(e) => onFilterChange({ ...filters, userType: e.target.value })}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#FE9200] outline-none text-sm font-medium bg-white"
                >
                    <option value="all">All Users</option>
                    <option value="tenant">Tenants</option>
                    <option value="agent">Agents</option>
                </select>
            )}
        </div>
    );
};
