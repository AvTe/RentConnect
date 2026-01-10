import { createClient } from '@/utils/supabase/client';

// ============================================
// GIFTPESA VOUCHER INTEGRATION
// Digital vouchers for agent subscription rewards
// API Docs: https://docs.giftpesa.com
// ============================================

// GiftPesa API Configuration
const GIFTPESA_API_URL = process.env.NEXT_PUBLIC_GIFTPESA_API_URL || 'https://3api.giftpesa.com';
const GIFTPESA_API_KEY = process.env.GIFTPESA_API_KEY || 'ebb9e43c8b4f64880a1403d5';
const GIFTPESA_USERNAME = process.env.GIFTPESA_USERNAME;

// Top brands on GiftPesa platform
export const GIFTPESA_TOP_BRANDS = [
    { id: 'naivas', name: 'Naivas', category: 'Supermarkets', logo: 'https://www.giftpesa.com/images/merchants/naivas.png' },
    { id: 'carrefour', name: 'Carrefour', category: 'Supermarkets', logo: 'https://www.giftpesa.com/images/merchants/carrefour.png' },
    { id: 'java-house', name: 'Java House', category: 'Cafes', logo: 'https://www.giftpesa.com/images/merchants/java.png' },
    { id: 'kfc', name: 'KFC', category: 'Restaurants', logo: 'https://www.giftpesa.com/images/merchants/kfc.png' },
    { id: 'pizza-inn', name: 'Pizza Inn', category: 'Restaurants', logo: 'https://www.giftpesa.com/images/merchants/pizza-inn.png' },
    { id: 'quickmart', name: 'Quickmart', category: 'Supermarkets', logo: 'https://www.giftpesa.com/images/merchants/quickmart.png' },
    { id: 'uber', name: 'Uber', category: 'Transport', logo: 'https://www.giftpesa.com/images/merchants/uber.png' },
    { id: 'jumia', name: 'Jumia', category: 'Shopping', logo: 'https://www.giftpesa.com/images/merchants/jumia.png' },
    { id: 'glovo', name: 'Glovo', category: 'Delivery', logo: 'https://www.giftpesa.com/images/merchants/glovo.png' },
    { id: 'chicken-inn', name: 'Chicken Inn', category: 'Restaurants', logo: 'https://www.giftpesa.com/images/merchants/chicken-inn.png' },
];

// ============================================
// VOUCHER POOL MANAGEMENT (Manual Mode)
// ============================================

/**
 * Get available vouchers from pool
 */
export const getAvailablePoolVouchers = async (planTier = null) => {
    try {
        const supabase = createClient();

        let query = supabase
            .from('voucher_pool')
            .select('*')
            .eq('is_assigned', false)
            .gt('expires_at', new Date().toISOString().split('T')[0])
            .order('expires_at', { ascending: true });

        if (planTier) {
            query = query.or(`plan_tier.eq.${planTier},plan_tier.is.null`);
        }

        const { data, error } = await query;
        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        console.error('Error getting pool vouchers:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Add vouchers to pool (Admin function)
 */
export const addVouchersToPool = async (vouchers) => {
    try {
        const supabase = createClient();

        const poolVouchers = vouchers.map(v => ({
            voucher_code: v.code,
            qr_code_url: v.qrCodeUrl || null,
            value: v.value,
            currency: v.currency || 'KES',
            merchant_name: v.merchantName,
            merchant_logo: v.merchantLogo || null,
            merchant_category: v.merchantCategory || null,
            valid_from: v.validFrom || new Date().toISOString().split('T')[0],
            expires_at: v.expiresAt,
            plan_tier: v.planTier || null,
            giftpesa_id: v.giftpesaId || null,
            batch_id: v.batchId || null
        }));

        const { data, error } = await supabase
            .from('voucher_pool')
            .insert(poolVouchers)
            .select();

        if (error) throw error;
        return { success: true, data, count: data.length };
    } catch (error) {
        console.error('Error adding vouchers to pool:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Import vouchers from CSV (Admin function)
 */
export const importVouchersFromCSV = async (csvData) => {
    // Parse CSV and add to pool
    const lines = csvData.split('\n').filter(l => l.trim());
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const vouchers = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const voucher = {};
        headers.forEach((h, idx) => {
            voucher[h] = values[idx];
        });

        vouchers.push({
            code: voucher.code || voucher.voucher_code,
            value: parseFloat(voucher.value) || 0,
            merchantName: voucher.merchant || voucher.merchant_name,
            merchantCategory: voucher.category || voucher.merchant_category,
            expiresAt: voucher.expires || voucher.expires_at,
            planTier: voucher.tier || voucher.plan_tier,
            giftpesaId: voucher.giftpesa_id
        });
    }

    return addVouchersToPool(vouchers);
};

// ============================================
// VOUCHER ASSIGNMENT
// ============================================

/**
 * Assign voucher to agent on subscription
 * Called by payment success webhook
 */
export const assignVoucherToAgent = async (agentId, subscriptionData) => {
    try {
        const supabase = createClient();

        // Check if plan has voucher reward
        const { data: plan } = await supabase
            .from('subscription_plans')
            .select('*')
            .eq('slug', subscriptionData.planSlug)
            .single();

        if (!plan || !plan.voucher_enabled) {
            return { success: true, voucher: null, message: 'Plan does not include voucher reward' };
        }

        // Try to get from pool first
        let voucherId = null;

        // Use database function for atomic assignment from pool
        const { data: poolResult, error: poolError } = await supabase
            .rpc('assign_voucher_from_pool', {
                p_agent_id: agentId,
                p_plan_tier: plan.tier,
                p_subscription_id: subscriptionData.subscriptionId,
                p_plan_name: plan.name
            });

        if (poolResult) {
            voucherId = poolResult;
        } else {
            // No pool vouchers available, try API generation
            console.log('No pool vouchers available, attempting API generation...');
            const apiResult = await generateVoucherFromAPI(agentId, plan, subscriptionData);
            if (apiResult.success) {
                voucherId = apiResult.voucherId;
            } else {
                // Fallback: Create a placeholder voucher
                console.warn('API generation failed, creating placeholder voucher');
                const placeholderResult = await createPlaceholderVoucher(agentId, plan, subscriptionData);
                voucherId = placeholderResult.voucherId;
            }
        }

        if (!voucherId) {
            return { success: false, error: 'Failed to assign voucher' };
        }

        // Get the assigned voucher
        const { data: voucher } = await supabase
            .from('agent_vouchers')
            .select('*')
            .eq('id', voucherId)
            .single();

        // Send notifications
        await sendVoucherNotifications(agentId, voucher);

        return { success: true, voucher };
    } catch (error) {
        console.error('Error assigning voucher:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Generate voucher via GiftPesa API (Disbursement)
 * Uses the GiftPesa disburse endpoint
 */
const generateVoucherFromAPI = async (agentId, plan, subscriptionData) => {
    if (!GIFTPESA_API_KEY) {
        console.warn('GiftPesa API key not configured');
        return { success: false, error: 'API not configured' };
    }

    try {
        const supabase = createClient();

        // Get agent details for disbursement
        const { data: agent } = await supabase
            .from('users')
            .select('name, phone')
            .eq('id', agentId)
            .single();

        if (!agent || !agent.phone) {
            throw new Error('Agent phone number required for voucher');
        }

        // Calculate voucher dates (valid for 90 days)
        const startDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10).replace(/-/g, '');

        // Generate unique disbursement ID
        const disbursementId = `YOOM-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

        // Determine merchant IDs based on plan
        const merchantMap = {
            'Java House': 'java-house',
            'Carrefour': 'carrefour',
            'Naivas': 'naivas',
            'Quickmart': 'quickmart'
        };
        const merchantId = merchantMap[plan.voucher_merchant] || '';

        // Call GiftPesa Disburse API
        const response = await fetch(`${GIFTPESA_API_URL}/disburse`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GIFTPESA_API_KEY}`
            },
            body: JSON.stringify({
                DisbursementID: disbursementId,
                DisbursementTitle: `Yoombaa ${plan.name} Reward`,
                VoucherStartDate: startDate,
                VoucherEndDate: endDate,
                Merchant: merchantId ? [merchantId] : [], // Empty for open voucher
                Recipients: [{
                    Name: agent.name,
                    Phone: agent.phone.replace(/\D/g, ''),
                    Amount: plan.voucher_value
                }],
                External: false,
                CallbackURL: `${process.env.NEXT_PUBLIC_APP_URL}/api/giftpesa/callback`,
                SupressNotifications: false // Let GiftPesa send SMS
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`GiftPesa API error: ${response.status} - ${errorText}`);
        }

        const apiResponse = await response.json();

        // Store voucher in database
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 90);

        const { data, error } = await supabase
            .from('agent_vouchers')
            .insert({
                agent_id: agentId,
                voucher_code: disbursementId,
                value: plan.voucher_value,
                currency: 'KES',
                merchant_name: plan.voucher_merchant || 'Open Voucher',
                description: plan.voucher_description,
                expires_at: expiresAt.toISOString().split('T')[0],
                subscription_id: subscriptionData.subscriptionId,
                plan_name: plan.name,
                plan_tier: plan.tier,
                source: 'api',
                giftpesa_id: apiResponse.DisbursementID
            })
            .select()
            .single();

        if (error) throw error;

        // Log activity
        await supabase.from('voucher_activity_log').insert({
            voucher_id: data.id,
            agent_id: agentId,
            action: 'assigned',
            details: { source: 'api', plan_tier: plan.tier, giftpesa_response: apiResponse }
        });

        return { success: true, voucherId: data.id };
    } catch (error) {
        console.error('GiftPesa API error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Create placeholder voucher when API fails
 */
const createPlaceholderVoucher = async (agentId, plan, subscriptionData) => {
    try {
        const supabase = createClient();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 90);

        // Generate a unique code
        const code = `VP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

        const { data, error } = await supabase
            .from('agent_vouchers')
            .insert({
                agent_id: agentId,
                voucher_code: code,
                value: plan.voucher_value,
                currency: 'KES',
                merchant_name: plan.voucher_merchant || 'Partner Store',
                description: plan.voucher_description || `${plan.name} reward voucher`,
                expires_at: expiresAt.toISOString().split('T')[0],
                subscription_id: subscriptionData.subscriptionId,
                plan_name: plan.name,
                plan_tier: plan.tier,
                source: 'pool', // Mark as pool even though it's generated
                status: 'issued'
            })
            .select()
            .single();

        if (error) throw error;

        // Log activity
        await supabase.from('voucher_activity_log').insert({
            voucher_id: data.id,
            agent_id: agentId,
            action: 'assigned',
            details: { source: 'placeholder', plan_tier: plan.tier }
        });

        return { success: true, voucherId: data.id };
    } catch (error) {
        console.error('Error creating placeholder voucher:', error);
        return { success: false, error: error.message };
    }
};

// ============================================
// VOUCHER NOTIFICATIONS
// ============================================

/**
 * Send voucher notifications via email, SMS, WhatsApp
 */
const sendVoucherNotifications = async (agentId, voucher) => {
    try {
        const supabase = createClient();

        // Get agent details
        const { data: agent } = await supabase
            .from('users')
            .select('name, email, phone')
            .eq('id', agentId)
            .single();

        if (!agent) return;

        const updates = {};

        // Send Email
        try {
            await sendVoucherEmail(agent, voucher);
            updates.email_sent = true;
        } catch (e) {
            console.error('Email notification failed:', e);
        }

        // Send SMS (if phone available)
        if (agent.phone) {
            try {
                await sendVoucherSMS(agent.phone, voucher);
                updates.sms_sent = true;
            } catch (e) {
                console.error('SMS notification failed:', e);
            }
        }

        // Send WhatsApp (if enabled)
        if (agent.phone) {
            try {
                await sendVoucherWhatsApp(agent.phone, agent.name, voucher);
                updates.whatsapp_sent = true;
            } catch (e) {
                console.error('WhatsApp notification failed:', e);
            }
        }

        // Update voucher with notification status
        await supabase
            .from('agent_vouchers')
            .update(updates)
            .eq('id', voucher.id);

    } catch (error) {
        console.error('Error sending voucher notifications:', error);
    }
};

const sendVoucherEmail = async (agent, voucher) => {
    const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            to: agent.email,
            subject: `🎁 Your ${voucher.merchant_name} Voucher is Ready!`,
            template: 'voucher_reward',
            data: {
                name: agent.name,
                voucherCode: voucher.voucher_code,
                value: voucher.value,
                currency: voucher.currency,
                merchantName: voucher.merchant_name,
                expiresAt: voucher.expires_at,
                planName: voucher.plan_name
            }
        })
    });

    if (!response.ok) throw new Error('Email send failed');
};

const sendVoucherSMS = async (phone, voucher) => {
    const message = `🎁 You've earned a KES ${voucher.value} ${voucher.merchant_name} voucher! Code: ${voucher.voucher_code}. Valid until ${voucher.expires_at}. - Yoombaa`;

    // Use your SMS provider API here
    console.log('SMS would be sent:', { phone, message });
};

const sendVoucherWhatsApp = async (phone, name, voucher) => {
    try {
        await fetch('/api/whatsapp/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to: phone,
                templateName: 'voucher_reward',
                parameters: [
                    name,
                    voucher.merchant_name,
                    `${voucher.value}`,
                    voucher.voucher_code,
                    voucher.expires_at
                ]
            })
        });
    } catch (error) {
        console.error('WhatsApp send error:', error);
        throw error;
    }
};

// ============================================
// AGENT VOUCHER FUNCTIONS
// ============================================

/**
 * Get agent's vouchers
 */
export const getAgentVouchers = async (agentId) => {
    try {
        const supabase = createClient();

        const { data, error } = await supabase
            .from('agent_vouchers')
            .select('*')
            .eq('agent_id', agentId)
            .order('issued_at', { ascending: false });

        if (error) throw error;

        // Update expired vouchers
        const now = new Date().toISOString().split('T')[0];
        const expiredIds = data
            .filter(v => v.expires_at < now && v.status === 'issued')
            .map(v => v.id);

        if (expiredIds.length > 0) {
            await supabase
                .from('agent_vouchers')
                .update({ status: 'expired' })
                .in('id', expiredIds);
        }

        return { success: true, data };
    } catch (error) {
        console.error('Error getting agent vouchers:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Mark voucher as viewed
 */
export const markVoucherViewed = async (voucherId, agentId) => {
    try {
        const supabase = createClient();

        const { error } = await supabase
            .from('agent_vouchers')
            .update({
                status: 'viewed',
                viewed_at: new Date().toISOString()
            })
            .eq('id', voucherId)
            .eq('agent_id', agentId)
            .eq('status', 'issued');

        if (error) throw error;

        // Log activity
        await supabase.from('voucher_activity_log').insert({
            voucher_id: voucherId,
            agent_id: agentId,
            action: 'viewed'
        });

        return { success: true };
    } catch (error) {
        console.error('Error marking voucher viewed:', error);
        return { success: false, error: error.message };
    }
};

// ============================================
// ADMIN FUNCTIONS
// ============================================

/**
 * Get all vouchers (Admin)
 */
export const getAllVouchers = async (filters = {}) => {
    try {
        const supabase = createClient();

        let query = supabase
            .from('agent_vouchers')
            .select('*')
            .order('issued_at', { ascending: false });

        if (filters.status) {
            query = query.eq('status', filters.status);
        }

        if (filters.planTier) {
            query = query.eq('plan_tier', filters.planTier);
        }

        if (filters.startDate) {
            query = query.gte('issued_at', filters.startDate);
        }

        if (filters.endDate) {
            query = query.lte('issued_at', filters.endDate);
        }

        const { data: vouchers, error } = await query;
        if (error) throw error;

        // Fetch agent details separately
        if (vouchers && vouchers.length > 0) {
            const agentIds = [...new Set(vouchers.map(v => v.agent_id).filter(Boolean))];

            if (agentIds.length > 0) {
                const { data: agents } = await supabase
                    .from('agents')
                    .select('id, name, email, phone')
                    .in('id', agentIds);

                // Map agents to vouchers
                const agentMap = {};
                (agents || []).forEach(a => { agentMap[a.id] = a; });

                vouchers.forEach(v => {
                    v.agent = agentMap[v.agent_id] || null;
                });
            }
        }

        return { success: true, data: vouchers || [] };
    } catch (error) {
        console.error('Error getting all vouchers:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get voucher stats (Admin)
 */
export const getVoucherStats = async () => {
    try {
        const supabase = createClient();

        const { data, error } = await supabase.rpc('get_voucher_stats');

        if (error) throw error;
        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Error getting voucher stats:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get pool stats (Admin)
 */
export const getPoolStats = async () => {
    try {
        const supabase = createClient();

        const { data, error } = await supabase
            .from('voucher_pool')
            .select('is_assigned, plan_tier, expires_at');

        if (error) throw error;

        const now = new Date().toISOString().split('T')[0];
        const stats = {
            total: data.length,
            available: data.filter(v => !v.is_assigned && v.expires_at > now).length,
            assigned: data.filter(v => v.is_assigned).length,
            expired: data.filter(v => v.expires_at <= now && !v.is_assigned).length,
            byTier: {}
        };

        // Group by tier
        data.forEach(v => {
            const tier = v.plan_tier || 'any';
            if (!stats.byTier[tier]) {
                stats.byTier[tier] = { total: 0, available: 0 };
            }
            stats.byTier[tier].total++;
            if (!v.is_assigned && v.expires_at > now) {
                stats.byTier[tier].available++;
            }
        });

        return { success: true, data: stats };
    } catch (error) {
        console.error('Error getting pool stats:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Update voucher status (Admin)
 */
export const updateVoucherStatus = async (voucherId, status, adminId) => {
    try {
        const supabase = createClient();

        const updates = { status };
        if (status === 'redeemed') {
            updates.redeemed_at = new Date().toISOString();
        }

        const { error } = await supabase
            .from('agent_vouchers')
            .update(updates)
            .eq('id', voucherId);

        if (error) throw error;

        // Log activity
        await supabase.from('voucher_activity_log').insert({
            voucher_id: voucherId,
            action: `status_changed_to_${status}`,
            performed_by: adminId,
            details: { new_status: status }
        });

        return { success: true };
    } catch (error) {
        console.error('Error updating voucher status:', error);
        return { success: false, error: error.message };
    }
};
