import { createNotification, getUser } from './database';

// ============================================
// UNIFIED NOTIFICATION SERVICE
// Combines in-app notifications + email via API
// ============================================

// Track sent notifications to prevent duplicates (in-memory for now)
const sentNotifications = new Map();
const DUPLICATE_WINDOW_MS = 60000; // 1 minute window to prevent duplicates

/**
 * Get base URL for API calls
 */
const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
        return window.location.origin;
    }
    return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5000';
};

/**
 * Send email via API endpoint (works on both client and server)
 */
const sendEmailViaApi = async (type, to, data) => {
    try {
        const baseUrl = getBaseUrl();
        const response = await fetch(`${baseUrl}/api/email/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, to, data })
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Email API error:', error);
            return { success: false, error: error.message };
        }

        return await response.json();
    } catch (error) {
        console.error('Error calling email API:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Check if a notification was recently sent (duplicate prevention)
 */
const isDuplicate = (userId, type, dataHash) => {
    const key = `${userId}-${type}-${dataHash}`;
    const lastSent = sentNotifications.get(key);

    if (lastSent && Date.now() - lastSent < DUPLICATE_WINDOW_MS) {
        console.log(`Duplicate notification prevented: ${type} for user ${userId}`);
        return true;
    }

    sentNotifications.set(key, Date.now());

    // Cleanup old entries (keep map from growing indefinitely)
    if (sentNotifications.size > 1000) {
        const cutoff = Date.now() - DUPLICATE_WINDOW_MS;
        for (const [k, v] of sentNotifications) {
            if (v < cutoff) sentNotifications.delete(k);
        }
    }

    return false;
};

/**
 * Create a hash from notification data for duplicate detection
 */
const createDataHash = (data) => {
    return JSON.stringify(data).slice(0, 100);
};

// ============================================
// AGENT NOTIFICATIONS
// ============================================

/**
 * Welcome notification for new agents
 * Sends: In-app + Email
 */
export const notifyAgentWelcome = async (agentId, agentData) => {
    const { name, email } = agentData;
    const dataHash = createDataHash({ type: 'welcome', agentId });

    if (isDuplicate(agentId, 'welcome_agent', dataHash)) {
        return { success: true, skipped: true, reason: 'duplicate' };
    }

    const results = { inApp: null, email: null };

    try {
        // In-app notification
        results.inApp = await createNotification({
            user_id: agentId,
            type: 'welcome',
            title: 'Welcome to Yoombaa!',
            message: `Hi ${name}, your agent account is ready. Complete your profile to start connecting with tenants.`,
            data: { agentId }
        });

        // Email notification (via API)
        if (email) {
            results.email = await sendEmailViaApi('welcome_agent', email, { name: name || 'Agent' });
        }

        console.log(`Welcome notification sent to agent ${agentId}`);
        return { success: true, results };
    } catch (error) {
        console.error('Error sending welcome notification:', error);
        return { success: false, error: error.message, results };
    }
};

/**
 * New lead available notification
 * Sends: In-app + Email
 */
export const notifyAgentNewLead = async (agentId, leadData) => {
    const dataHash = createDataHash({ leadId: leadData.id, agentId });

    if (isDuplicate(agentId, 'new_lead', dataHash)) {
        return { success: true, skipped: true, reason: 'duplicate' };
    }

    const results = { inApp: null, email: null };

    try {
        // Get agent details for email
        const agentResult = await getUser(agentId);
        const agent = agentResult.data;

        // In-app notification
        results.inApp = await createNotification({
            user_id: agentId,
            type: 'new_lead',
            title: 'New Lead Available!',
            message: `A tenant is looking for ${leadData.bedrooms || 'a'} bedroom in ${leadData.location || 'your area'}`,
            data: {
                leadId: leadData.id,
                location: leadData.location,
                budget: leadData.budget,
                bedrooms: leadData.bedrooms,
                propertyType: leadData.property_type || leadData.propertyType
            }
        });

        // Email notification (via API)
        if (agent?.email) {
            results.email = await sendEmailViaApi('new_lead', agent.email, {
                agentName: agent.name || 'Agent',
                leadData: {
                    location: leadData.location,
                    budget: leadData.budget,
                    bedrooms: leadData.bedrooms,
                    propertyType: leadData.property_type || leadData.propertyType,
                    urgency: leadData.urgency
                }
            });
        }

        console.log(`New lead notification sent to agent ${agentId} for lead ${leadData.id}`);
        return { success: true, results };
    } catch (error) {
        console.error('Error sending new lead notification:', error);
        return { success: false, error: error.message, results };
    }
};

/**
 * Lead unlocked confirmation
 * Sends: In-app + Email with tenant contact details
 */
export const notifyAgentLeadUnlocked = async (agentId, leadData, tenantData) => {
    const dataHash = createDataHash({ leadId: leadData.id, agentId });

    if (isDuplicate(agentId, 'lead_unlocked', dataHash)) {
        return { success: true, skipped: true, reason: 'duplicate' };
    }

    const results = { inApp: null, email: null };

    try {
        // Get agent details
        const agentResult = await getUser(agentId);
        const agent = agentResult.data;

        // In-app notification
        results.inApp = await createNotification({
            user_id: agentId,
            type: 'lead_unlocked',
            title: 'Lead Unlocked!',
            message: `You've unlocked ${tenantData.name}'s contact. Reach out now!`,
            data: {
                leadId: leadData.id,
                tenantName: tenantData.name,
                tenantPhone: tenantData.phone
            }
        });

        // Email with contact details (via API)
        if (agent?.email) {
            results.email = await sendEmailViaApi('lead_unlocked', agent.email, {
                agentName: agent.name || 'Agent',
                leadData: leadData,
                tenantContact: {
                    name: tenantData.name,
                    phone: tenantData.phone,
                    email: tenantData.email
                }
            });
        }

        console.log(`Lead unlocked notification sent to agent ${agentId}`);
        return { success: true, results };
    } catch (error) {
        console.error('Error sending lead unlocked notification:', error);
        return { success: false, error: error.message, results };
    }
};

/**
 * Verification approved notification
 * Sends: In-app + Email
 */
export const notifyAgentVerified = async (agentId) => {
    const dataHash = createDataHash({ type: 'verified', agentId });

    if (isDuplicate(agentId, 'verification_approved', dataHash)) {
        return { success: true, skipped: true, reason: 'duplicate' };
    }

    const results = { inApp: null, email: null };

    try {
        // Get agent details
        const agentResult = await getUser(agentId);
        const agent = agentResult.data;

        // In-app notification
        results.inApp = await createNotification({
            user_id: agentId,
            type: 'verification_approved',
            title: 'Account Verified!',
            message: 'Congratulations! Your account has been verified. You can now unlock leads.',
            data: { status: 'approved' }
        });

        // Email notification (via API)
        if (agent?.email) {
            results.email = await sendEmailViaApi('verification_approved', agent.email, {
                name: agent.name || 'Agent'
            });
        }

        console.log(`Verification approved notification sent to agent ${agentId}`);
        return { success: true, results };
    } catch (error) {
        console.error('Error sending verification approved notification:', error);
        return { success: false, error: error.message, results };
    }
};

/**
 * Verification rejected notification
 * Sends: In-app + Email
 */
export const notifyAgentVerificationRejected = async (agentId, reason) => {
    const dataHash = createDataHash({ type: 'rejected', agentId, reason });

    if (isDuplicate(agentId, 'verification_rejected', dataHash)) {
        return { success: true, skipped: true, reason: 'duplicate' };
    }

    const results = { inApp: null, email: null };

    try {
        // Get agent details
        const agentResult = await getUser(agentId);
        const agent = agentResult.data;

        // In-app notification
        results.inApp = await createNotification({
            user_id: agentId,
            type: 'verification_rejected',
            title: 'Verification Update',
            message: reason || 'Your verification could not be completed. Please update your documents.',
            data: { status: 'rejected', reason }
        });

        // Email notification (via API)
        if (agent?.email) {
            results.email = await sendEmailViaApi('verification_rejected', agent.email, {
                name: agent.name || 'Agent',
                reason
            });
        }

        console.log(`Verification rejected notification sent to agent ${agentId}`);
        return { success: true, results };
    } catch (error) {
        console.error('Error sending verification rejected notification:', error);
        return { success: false, error: error.message, results };
    }
};

/**
 * Credits purchased notification
 * Sends: In-app + Email
 */
export const notifyAgentCreditsPurchased = async (agentId, transactionData) => {
    const { credits, amount, newBalance, transactionId } = transactionData;
    const dataHash = createDataHash({ transactionId, agentId });

    if (isDuplicate(agentId, 'credits_purchased', dataHash)) {
        return { success: true, skipped: true, reason: 'duplicate' };
    }

    const results = { inApp: null, email: null };

    try {
        // Get agent details
        const agentResult = await getUser(agentId);
        const agent = agentResult.data;

        // In-app notification
        results.inApp = await createNotification({
            user_id: agentId,
            type: 'credits_purchased',
            title: 'Payment Successful!',
            message: `${credits} credits added to your account. New balance: ${newBalance}`,
            data: { credits, amount, newBalance, transactionId }
        });

        // Email notification (via API)
        if (agent?.email) {
            results.email = await sendEmailViaApi('credits_purchased', agent.email, {
                name: agent.name || 'Agent',
                credits,
                amount,
                newBalance
            });
        }

        console.log(`Credits purchased notification sent to agent ${agentId}`);
        return { success: true, results };
    } catch (error) {
        console.error('Error sending credits purchased notification:', error);
        return { success: false, error: error.message, results };
    }
};

/**
 * Low credits warning notification
 * Sends: In-app + Email
 */
export const notifyAgentLowCredits = async (agentId, currentBalance) => {
    // For low credits, use a longer duplicate window (1 day)
    const key = `${agentId}-low_credits-daily`;
    const lastSent = sentNotifications.get(key);
    if (lastSent && Date.now() - lastSent < 86400000) { // 24 hours
        return { success: true, skipped: true, reason: 'daily_limit' };
    }
    sentNotifications.set(key, Date.now());

    const results = { inApp: null, email: null };

    try {
        // Get agent details
        const agentResult = await getUser(agentId);
        const agent = agentResult.data;

        // In-app notification
        results.inApp = await createNotification({
            user_id: agentId,
            type: 'low_credits',
            title: 'Low Credit Balance',
            message: `Your credit balance is low (${currentBalance}). Top up to keep unlocking leads.`,
            data: { balance: currentBalance }
        });

        // Email notification (via API)
        if (agent?.email) {
            results.email = await sendEmailViaApi('low_credits', agent.email, {
                name: agent.name || 'Agent',
                balance: currentBalance
            });
        }

        console.log(`Low credits notification sent to agent ${agentId}`);
        return { success: true, results };
    } catch (error) {
        console.error('Error sending low credits notification:', error);
        return { success: false, error: error.message, results };
    }
};

// ============================================
// TENANT NOTIFICATIONS
// ============================================

/**
 * Welcome notification for new tenants
 * Sends: In-app + Email
 */
export const notifyTenantWelcome = async (tenantId, tenantData) => {
    const { name, email } = tenantData;
    const dataHash = createDataHash({ type: 'welcome', tenantId });

    if (isDuplicate(tenantId, 'welcome_tenant', dataHash)) {
        return { success: true, skipped: true, reason: 'duplicate' };
    }

    const results = { inApp: null, email: null };

    try {
        // In-app notification
        results.inApp = await createNotification({
            user_id: tenantId,
            type: 'welcome',
            title: 'Welcome to Yoombaa!',
            message: `Hi ${name}, verified agents will contact you with properties matching your requirements.`,
            data: { tenantId }
        });

        // Email notification (via API)
        if (email) {
            results.email = await sendEmailViaApi('welcome_tenant', email, {
                name: name || 'Tenant'
            });
        }

        console.log(`Welcome notification sent to tenant ${tenantId}`);
        return { success: true, results };
    } catch (error) {
        console.error('Error sending tenant welcome notification:', error);
        return { success: false, error: error.message, results };
    }
};

/**
 * Notify tenant that an agent is interested
 * Sends: In-app + Email
 */
export const notifyTenantAgentInterested = async (tenantId, agentData) => {
    const { agentId, name: agentName, phone: agentPhone } = agentData;
    const dataHash = createDataHash({ tenantId, agentId });

    if (isDuplicate(tenantId, 'agent_interested', dataHash)) {
        return { success: true, skipped: true, reason: 'duplicate' };
    }

    const results = { inApp: null, email: null };

    try {
        // Get tenant details for email
        const tenantResult = await getUser(tenantId);
        const tenant = tenantResult.data;

        // In-app notification
        results.inApp = await createNotification({
            user_id: tenantId,
            type: 'agent_interested',
            title: 'An Agent is Interested!',
            message: `${agentName} is interested in helping you find a home.`,
            data: { agentId, agentName, agentPhone }
        });

        // Email notification (via API)
        if (tenant?.email) {
            results.email = await sendEmailViaApi('agent_interested', tenant.email, {
                tenantName: tenant.name || 'Tenant',
                agentName,
                agentPhone
            });
        }

        console.log(`Agent interested notification sent to tenant ${tenantId}`);
        return { success: true, results };
    } catch (error) {
        console.error('Error sending agent interested notification:', error);
        return { success: false, error: error.message, results };
    }
};

/**
 * Notify tenant their lead was submitted
 * Sends: In-app + Email
 */
export const notifyTenantLeadSubmitted = async (tenantId, leadData) => {
    const dataHash = createDataHash({ leadId: leadData.id, tenantId });

    if (isDuplicate(tenantId, 'lead_submitted', dataHash)) {
        return { success: true, skipped: true, reason: 'duplicate' };
    }

    const results = { inApp: null, email: null };

    try {
        // Get tenant details
        const tenantResult = await getUser(tenantId);
        const tenant = tenantResult.data;

        // In-app notification
        results.inApp = await createNotification({
            user_id: tenantId,
            type: 'lead_submitted',
            title: 'Request Submitted!',
            message: `Your rental request for ${leadData.location || 'your desired location'} has been posted.`,
            data: {
                leadId: leadData.id,
                location: leadData.location,
                budget: leadData.budget
            }
        });

        // Email confirmation (via API - custom type)
        if (tenant?.email) {
            const content = `
        <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: #18181b; text-align: center;">
          Request Submitted Successfully!
        </h1>
        <p style="margin: 0 0 24px; font-size: 15px; color: #52525b; line-height: 1.6; text-align: center;">
          Your rental request has been posted. Verified agents will start contacting you soon.
        </p>
        <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0 0 8px; font-size: 14px; color: #52525b;">
            <strong>Location:</strong> ${leadData.location || 'Not specified'}
          </p>
          <p style="margin: 0 0 8px; font-size: 14px; color: #52525b;">
            <strong>Budget:</strong> KES ${leadData.budget?.toLocaleString() || 'Not specified'}
          </p>
          <p style="margin: 0; font-size: 14px; color: #52525b;">
            <strong>Property Type:</strong> ${leadData.bedrooms || 'Any'} bedroom
          </p>
        </div>
        <p style="margin: 24px 0 0; font-size: 13px; color: #a1a1aa; text-align: center;">
          We'll notify you when agents show interest in your request.
        </p>
      `;
            results.email = await sendEmailViaApi('custom', tenant.email, {
                subject: 'Request Submitted - Yoombaa',
                content
            });
        }

        console.log(`Lead submitted notification sent to tenant ${tenantId}`);
        return { success: true, results };
    } catch (error) {
        console.error('Error sending lead submitted notification:', error);
        return { success: false, error: error.message, results };
    }
};

// ============================================
// EXPORTS
// ============================================

export default {
    // Agent notifications
    notifyAgentWelcome,
    notifyAgentNewLead,
    notifyAgentLeadUnlocked,
    notifyAgentVerified,
    notifyAgentVerificationRejected,
    notifyAgentCreditsPurchased,
    notifyAgentLowCredits,

    // Tenant notifications
    notifyTenantWelcome,
    notifyTenantAgentInterested,
    notifyTenantLeadSubmitted
};
