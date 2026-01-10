// Ticket Notification Service
// Handles notifications and emails for the support ticket system

import { createClient } from '@/utils/supabase/client';

// =============================================
// TICKET EMAIL TEMPLATES (For API endpoint)
// =============================================

const BRAND_COLOR = '#fe9200';
const TEXT_COLOR = '#18181b';
const MUTED_COLOR = '#52525b';

const priorityColors = {
    low: '#6b7280',
    medium: '#3b82f6',
    high: '#f97316',
    urgent: '#ef4444'
};

const statusColors = {
    open: '#3b82f6',
    in_progress: '#f59e0b',
    pending: '#8b5cf6',
    resolved: '#10b981',
    closed: '#6b7280'
};

// =============================================
// IN-APP NOTIFICATIONS
// =============================================

/**
 * Create in-app notification for admins about new ticket
 */
export async function notifyAdminsNewTicket(ticketData, userData) {
    const supabase = createClient();

    try {
        // Get all admin users
        const { data: admins, error: adminError } = await supabase
            .from('users')
            .select('id, email, name')
            .in('role', ['admin', 'super_admin']);

        if (adminError) throw adminError;

        if (!admins || admins.length === 0) return { success: true };

        // Create notifications for each admin
        const notifications = admins.map(admin => ({
            user_id: admin.id,
            type: 'support',
            title: 'New Support Ticket',
            message: `${userData?.name || 'A user'} submitted: "${ticketData.subject}"`,
            data: {
                ticketId: ticketData.id,
                subject: ticketData.subject,
                priority: ticketData.priority,
                category: ticketData.category,
                userName: userData?.name,
                userEmail: userData?.email
            },
            read: false,
            created_at: new Date().toISOString()
        }));

        const { error: notifError } = await supabase
            .from('notifications')
            .insert(notifications);

        if (notifError) {
            console.error('Error creating admin notifications:', notifError);
        }

        // Send email notifications via API
        try {
            await fetch('/api/email/ticket-notification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'new_ticket',
                    admins: admins.map(a => ({ email: a.email, name: a.name })),
                    ticket: ticketData,
                    user: userData
                })
            });
        } catch (emailError) {
            console.error('Error sending admin email notifications:', emailError);
        }

        return { success: true };
    } catch (error) {
        console.error('Error notifying admins:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Notify user about ticket status update
 */
export async function notifyUserTicketUpdate(ticketId, userId, updates, adminName) {
    const supabase = createClient();

    try {
        // Get ticket details
        const { data: ticket, error: ticketError } = await supabase
            .from('support_tickets')
            .select('subject, status')
            .eq('id', ticketId)
            .single();

        if (ticketError) throw ticketError;

        // Create notification
        const statusLabels = {
            open: 'Open',
            in_progress: 'In Progress',
            pending: 'Pending Response',
            resolved: 'Resolved',
            closed: 'Closed'
        };

        const { error: notifError } = await supabase
            .from('notifications')
            .insert({
                user_id: userId,
                type: 'support',
                title: 'Ticket Updated',
                message: `Your ticket "${ticket.subject}" is now ${statusLabels[updates.status] || updates.status}`,
                data: {
                    ticketId,
                    status: updates.status,
                    updatedBy: adminName
                },
                read: false,
                created_at: new Date().toISOString()
            });

        if (notifError) {
            console.error('Error creating user notification:', notifError);
        }

        // Get user email and send notification
        const { data: user } = await supabase
            .from('users')
            .select('email, name')
            .eq('id', userId)
            .single();

        if (user?.email) {
            try {
                await fetch('/api/email/ticket-notification', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'ticket_update',
                        recipient: { email: user.email, name: user.name },
                        ticket: { ...ticket, id: ticketId },
                        newStatus: updates.status
                    })
                });
            } catch (emailError) {
                console.error('Error sending user email:', emailError);
            }
        }

        return { success: true };
    } catch (error) {
        console.error('Error notifying user:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Notify user about new reply on their ticket
 */
export async function notifyUserNewReply(ticketId, userId, replyData, isStaffReply) {
    const supabase = createClient();

    try {
        // Get ticket details
        const { data: ticket, error: ticketError } = await supabase
            .from('support_tickets')
            .select('subject, user_id')
            .eq('id', ticketId)
            .single();

        if (ticketError) throw ticketError;

        // Only notify the ticket owner if it's a staff reply
        // Or notify admins if it's user reply
        if (isStaffReply) {
            // Notify ticket owner
            const { error: notifError } = await supabase
                .from('notifications')
                .insert({
                    user_id: ticket.user_id,
                    type: 'support',
                    title: 'New Reply on Your Ticket',
                    message: `Support team replied to "${ticket.subject}"`,
                    data: {
                        ticketId,
                        preview: replyData.message?.substring(0, 100)
                    },
                    read: false,
                    created_at: new Date().toISOString()
                });

            if (notifError) {
                console.error('Error creating reply notification:', notifError);
            }

            // Send email to ticket owner
            const { data: owner } = await supabase
                .from('users')
                .select('email, name')
                .eq('id', ticket.user_id)
                .single();

            if (owner?.email) {
                try {
                    await fetch('/api/email/ticket-notification', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            type: 'new_reply',
                            recipient: { email: owner.email, name: owner.name },
                            ticket: { ...ticket, id: ticketId },
                            preview: replyData.message?.substring(0, 200)
                        })
                    });
                } catch (emailError) {
                    console.error('Error sending reply email:', emailError);
                }
            }
        } else {
            // Notify all admins about user reply
            const { data: admins } = await supabase
                .from('users')
                .select('id')
                .in('role', ['admin', 'super_admin']);

            if (admins && admins.length > 0) {
                const notifications = admins.map(admin => ({
                    user_id: admin.id,
                    type: 'support',
                    title: 'New Reply on Ticket',
                    message: `User replied to "${ticket.subject}"`,
                    data: {
                        ticketId,
                        preview: replyData.message?.substring(0, 100)
                    },
                    read: false,
                    created_at: new Date().toISOString()
                }));

                await supabase.from('notifications').insert(notifications);
            }
        }

        return { success: true };
    } catch (error) {
        console.error('Error notifying about reply:', error);
        return { success: false, error: error.message };
    }
}

// =============================================
// EXPORT
// =============================================

export const ticketNotificationService = {
    notifyAdminsNewTicket,
    notifyUserTicketUpdate,
    notifyUserNewReply
};

export default ticketNotificationService;
