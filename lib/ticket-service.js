// Support Tickets Database Service
// Provides CRUD operations for the ticketing system

import { createClient } from '@/utils/supabase/client';

// =============================================
// NOTIFICATION HELPERS
// =============================================

/**
 * Notify admins about a new ticket via API
 */
async function notifyAdminsNewTicket(ticket, userId) {
    const supabase = createClient();

    try {
        // Get user info
        const { data: user } = await supabase
            .from('users')
            .select('name, email')
            .eq('id', userId)
            .single();

        // Get admin users
        const { data: admins } = await supabase
            .from('users')
            .select('id, email, name')
            .in('role', ['admin', 'super_admin']);

        if (!admins || admins.length === 0) return;

        // Create in-app notifications
        const notifications = admins.map(admin => ({
            user_id: admin.id,
            type: 'support',
            title: 'New Support Ticket',
            message: `${user?.name || 'A user'} submitted: "${ticket.subject}"`,
            data: {
                ticketId: ticket.id,
                subject: ticket.subject,
                priority: ticket.priority,
                category: ticket.category
            },
            read: false,
            created_at: new Date().toISOString()
        }));

        await supabase.from('notifications').insert(notifications);

        // Send email notifications (async via API)
        fetch('/api/email/ticket-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'new_ticket',
                admins: admins.map(a => ({ email: a.email, name: a.name })),
                ticket,
                user
            })
        }).catch(err => console.error('Email notification failed:', err));

    } catch (error) {
        console.error('Error notifying admins:', error);
    }
}

/**
 * Notify user about ticket update
 */
async function notifyUserTicketUpdate(ticketId, userId, newStatus, adminName) {
    const supabase = createClient();

    try {
        const { data: ticket } = await supabase
            .from('support_tickets')
            .select('subject')
            .eq('id', ticketId)
            .single();

        const statusLabels = {
            open: 'Open',
            in_progress: 'In Progress',
            pending: 'Pending',
            resolved: 'Resolved',
            closed: 'Closed'
        };

        // Create in-app notification
        await supabase.from('notifications').insert({
            user_id: userId,
            type: 'support',
            title: 'Ticket Updated',
            message: `Your ticket "${ticket?.subject}" is now ${statusLabels[newStatus] || newStatus}`,
            data: { ticketId, status: newStatus },
            read: false,
            created_at: new Date().toISOString()
        });

        // Get user email
        const { data: user } = await supabase
            .from('users')
            .select('email, name')
            .eq('id', userId)
            .single();

        if (user?.email) {
            fetch('/api/email/ticket-notification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'ticket_update',
                    recipient: { email: user.email, name: user.name },
                    ticket: { ...ticket, id: ticketId },
                    newStatus
                })
            }).catch(err => console.error('Email notification failed:', err));
        }
    } catch (error) {
        console.error('Error notifying user:', error);
    }
}

// =============================================
// TICKET OPERATIONS
// =============================================

/**
 * Upload file to Supabase Storage
 * @param {File} file - File to upload
 * @param {string} ticketId - Ticket ID for folder organization
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export async function uploadTicketAttachment(file, ticketId) {
    const supabase = createClient();
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${ticketId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data, error } = await supabase.storage
            .from('ticket-attachments')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('ticket-attachments')
            .getPublicUrl(fileName);

        return { success: true, url: urlData.publicUrl, path: fileName };
    } catch (error) {
        console.error('Error uploading attachment:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Create a new support ticket
 */
export async function createTicket(ticketData) {
    const supabase = createClient();
    try {
        // First create the ticket
        const { data, error } = await supabase
            .from('support_tickets')
            .insert([{
                user_id: ticketData.userId,
                subject: ticketData.subject,
                message: ticketData.description,
                category: ticketData.category || 'general',
                priority: ticketData.priority || 'medium',
                status: 'open',
                attachments: ticketData.attachments || null // Store attachment URLs as JSON
            }])
            .select()
            .single();

        if (error) throw error;

        // Notify admins about new ticket (async, don't wait)
        notifyAdminsNewTicket(data, ticketData.userId).catch(err =>
            console.error('Failed to notify admins:', err)
        );

        return { success: true, data };
    } catch (error) {
        console.error('Error creating ticket:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get all tickets for a specific user
 */
export async function getUserTickets(userId, filters = {}) {
    const supabase = createClient();
    try {
        let query = supabase
            .from('support_tickets')
            .select(`
                *,
                assigned_user:users!support_tickets_assigned_to_fkey(id, name, email, avatar),
                replies:ticket_replies(id)
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        // Apply filters
        if (filters.status) {
            query = query.eq('status', filters.status);
        }
        if (filters.category) {
            query = query.eq('category', filters.category);
        }
        if (filters.priority) {
            query = query.eq('priority', filters.priority);
        }

        const { data, error } = await query;

        if (error) throw error;
        return { success: true, data: data || [] };
    } catch (error) {
        console.error('Error fetching user tickets:', error);
        return { success: false, error: error.message, data: [] };
    }
}

/**
 * Get all tickets (Admin only)
 */
export async function getAllTickets(filters = {}) {
    const supabase = createClient();
    try {
        let query = supabase
            .from('support_tickets')
            .select(`
                *,
                user:users!support_tickets_user_id_fkey(id, name, email, avatar, phone, role),
                assigned_user:users!support_tickets_assigned_to_fkey(id, name, email, avatar),
                replies:ticket_replies(id)
            `)
            .order('created_at', { ascending: false });

        // Apply filters
        if (filters.status && filters.status !== 'all') {
            query = query.eq('status', filters.status);
        }
        if (filters.category && filters.category !== 'all') {
            query = query.eq('category', filters.category);
        }
        if (filters.priority && filters.priority !== 'all') {
            query = query.eq('priority', filters.priority);
        }
        // Note: user_type column doesn't exist - filtering removed
        if (filters.assignedTo) {
            query = query.eq('assigned_to', filters.assignedTo);
        }
        if (filters.search) {
            query = query.or(`subject.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
        }

        // Date range filter
        if (filters.dateFrom) {
            query = query.gte('created_at', filters.dateFrom);
        }
        if (filters.dateTo) {
            query = query.lte('created_at', filters.dateTo);
        }

        // Pagination
        if (filters.limit) {
            query = query.limit(filters.limit);
        }
        if (filters.offset) {
            query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
        }

        const { data, error, count } = await query;

        if (error) throw error;
        return { success: true, data: data || [], count };
    } catch (error) {
        console.error('Error fetching all tickets:', error);
        return { success: false, error: error.message, data: [] };
    }
}

/**
 * Get a single ticket by ID with all replies
 */
export async function getTicketById(ticketId) {
    const supabase = createClient();
    try {
        // Get ticket
        const { data: ticket, error: ticketError } = await supabase
            .from('support_tickets')
            .select(`
                *,
                user:users!support_tickets_user_id_fkey(id, name, email, avatar, phone, role),
                assigned_user:users!support_tickets_assigned_to_fkey(id, name, email, avatar)
            `)
            .eq('id', ticketId)
            .single();

        if (ticketError) throw ticketError;

        // Get replies
        const { data: replies, error: repliesError } = await supabase
            .from('ticket_replies')
            .select(`
                *,
                user:users!ticket_replies_user_id_fkey(id, name, email, avatar)
            `)
            .eq('ticket_id', ticketId)
            .order('created_at', { ascending: true });

        if (repliesError) throw repliesError;

        return {
            success: true,
            data: { ...ticket, replies: replies || [] }
        };
    } catch (error) {
        console.error('Error fetching ticket:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Update ticket (status, priority, category, assignment)
 */
export async function updateTicket(ticketId, updates) {
    const supabase = createClient();
    try {
        const updateData = {};

        if (updates.status !== undefined) updateData.status = updates.status;
        if (updates.priority !== undefined) updateData.priority = updates.priority;
        if (updates.category !== undefined) updateData.category = updates.category;
        if (updates.assigned_to !== undefined) updateData.assigned_to = updates.assigned_to;

        // Set resolved_at if status is resolved
        if (updates.status === 'resolved' || updates.status === 'closed') {
            updateData.resolved_at = new Date().toISOString();
        }

        const { data, error } = await supabase
            .from('support_tickets')
            .update(updateData)
            .eq('id', ticketId)
            .select('*, user_id')
            .single();

        if (error) throw error;

        // Notify user about status change
        if (updates.status && data.user_id) {
            notifyUserTicketUpdate(ticketId, data.user_id, updates.status).catch(err =>
                console.error('Failed to notify user:', err)
            );
        }

        return { success: true, data };
    } catch (error) {
        console.error('Error updating ticket:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Add a reply to a ticket
 */
export async function addTicketReply(ticketId, replyData) {
    const supabase = createClient();
    try {
        const { data, error } = await supabase
            .from('ticket_replies')
            .insert([{
                ticket_id: ticketId,
                user_id: replyData.userId,
                message: replyData.message,
                is_staff: replyData.isStaff || false,
                attachments: replyData.attachments || []
            }])
            .select(`
                *,
                user:users!ticket_replies_user_id_fkey(id, name, email, avatar)
            `)
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error adding reply:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get ticket statistics (Admin dashboard)
 */
export async function getTicketStats() {
    const supabase = createClient();
    try {
        // Get counts by status
        const { data: statusCounts, error: statusError } = await supabase
            .from('support_tickets')
            .select('status')

        if (statusError) throw statusError;

        // Count statuses
        const stats = {
            total: statusCounts?.length || 0,
            open: 0,
            in_progress: 0,
            pending: 0,
            resolved: 0,
            closed: 0
        };

        statusCounts?.forEach(ticket => {
            if (stats[ticket.status] !== undefined) {
                stats[ticket.status]++;
            }
        });

        // Get priority counts
        const { data: priorityCounts, error: priorityError } = await supabase
            .from('support_tickets')
            .select('priority')
            .in('status', ['open', 'in_progress', 'pending']);

        if (priorityError) throw priorityError;

        const priorities = {
            urgent: 0,
            high: 0,
            medium: 0,
            low: 0
        };

        priorityCounts?.forEach(ticket => {
            if (priorities[ticket.priority] !== undefined) {
                priorities[ticket.priority]++;
            }
        });

        // Get today's tickets
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { data: todayTickets, error: todayError } = await supabase
            .from('support_tickets')
            .select('id')
            .gte('created_at', today.toISOString());

        if (todayError) throw todayError;

        return {
            success: true,
            data: {
                ...stats,
                priorities,
                todayCount: todayTickets?.length || 0
            }
        };
    } catch (error) {
        console.error('Error fetching ticket stats:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get admin users for assignment dropdown
 */
export async function getAdminUsers() {
    const supabase = createClient();
    try {
        const { data, error } = await supabase
            .from('users')
            .select('id, name, email, avatar')
            .in('role', ['admin', 'super_admin'])
            .order('name');

        if (error) throw error;
        return { success: true, data: data || [] };
    } catch (error) {
        console.error('Error fetching admin users:', error);
        return { success: false, error: error.message, data: [] };
    }
}

/**
 * Delete a ticket (Admin only)
 */
export async function deleteTicket(ticketId) {
    const supabase = createClient();
    try {
        const { error } = await supabase
            .from('support_tickets')
            .delete()
            .eq('id', ticketId);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error deleting ticket:', error);
        return { success: false, error: error.message };
    }
}

// =============================================
// REAL-TIME SUBSCRIPTIONS
// =============================================

/**
 * Subscribe to ticket updates in real-time (for admin dashboard)
 * @param {Function} callback - Function to call when tickets change
 * @param {object} filters - Optional filters
 * @returns {Function} Unsubscribe function
 */
export function subscribeToTickets(callback, filters = {}) {
    const supabase = createClient();

    // Fetch initial data
    const fetchTickets = async () => {
        const result = await getAllTickets(filters);
        if (result.success) {
            callback(result.data);
        }
    };

    // Fetch initial tickets
    fetchTickets();

    // Subscribe to changes on support_tickets table
    const channel = supabase
        .channel('tickets-changes')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'support_tickets'
            },
            async () => {
                // Refetch all tickets when any change occurs
                await fetchTickets();
            }
        )
        .subscribe();

    // Return unsubscribe function
    return () => {
        supabase.removeChannel(channel);
    };
}

/**
 * Subscribe to user's ticket updates in real-time
 * @param {string} userId - User ID
 * @param {Function} callback - Function to call when tickets change
 * @returns {Function} Unsubscribe function
 */
export function subscribeToUserTickets(userId, callback) {
    const supabase = createClient();

    // Fetch initial data
    const fetchTickets = async () => {
        const result = await getUserTickets(userId, {});
        if (result.success) {
            callback(result.data);
        }
    };

    // Fetch initial tickets
    fetchTickets();

    // Subscribe to changes on support_tickets table for this user
    const channel = supabase
        .channel(`user-tickets-${userId}`)
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'support_tickets',
                filter: `user_id=eq.${userId}`
            },
            async () => {
                await fetchTickets();
            }
        )
        .subscribe();

    // Return unsubscribe function
    return () => {
        supabase.removeChannel(channel);
    };
}

/**
 * Subscribe to ticket replies in real-time
 * @param {string} ticketId - Ticket ID
 * @param {Function} callback - Function to call when replies change
 * @returns {Function} Unsubscribe function
 */
export function subscribeToTicketReplies(ticketId, callback) {
    const supabase = createClient();

    // Fetch initial data
    const fetchTicket = async () => {
        const result = await getTicketById(ticketId);
        if (result.success) {
            callback(result.data);
        }
    };

    // Fetch initial ticket data
    fetchTicket();

    // Subscribe to changes on ticket_replies table for this ticket
    const repliesChannel = supabase
        .channel(`ticket-replies-${ticketId}`)
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'ticket_replies',
                filter: `ticket_id=eq.${ticketId}`
            },
            async () => {
                await fetchTicket();
            }
        )
        .subscribe();

    // Also subscribe to ticket status changes
    const ticketChannel = supabase
        .channel(`ticket-status-${ticketId}`)
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'support_tickets',
                filter: `id=eq.${ticketId}`
            },
            async () => {
                await fetchTicket();
            }
        )
        .subscribe();

    // Return unsubscribe function
    return () => {
        supabase.removeChannel(repliesChannel);
        supabase.removeChannel(ticketChannel);
    };
}

// Export all functions
export const ticketService = {
    createTicket,
    getUserTickets,
    getAllTickets,
    getTicketById,
    updateTicket,
    addTicketReply,
    getTicketStats,
    getAdminUsers,
    deleteTicket,
    subscribeToTickets,
    subscribeToUserTickets,
    subscribeToTicketReplies
};
