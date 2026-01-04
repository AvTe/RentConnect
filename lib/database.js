import { createClient } from '@/utils/supabase/client';
import { sendWhatsAppTemplate } from './infobip';

// ============================================
// SUPABASE DATABASE LAYER
// Replaces Firebase Firestore with PostgreSQL
// ============================================

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Convert snake_case to camelCase
 */
const snakeToCamel = (str) => str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

/**
 * Transform database row from snake_case to camelCase
 * This ensures components receive data in the expected format
 */
const transformUserData = (user) => {
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    avatar: user.avatar,
    role: user.role,
    type: user.type,
    location: user.location,
    city: user.city,
    // Agent-specific fields (camelCase for components)
    agencyName: user.agency_name,
    experience: user.experience,
    bio: user.bio,
    specialties: user.specialties || [],
    licenseNumber: user.license_number,
    // Verification
    verificationStatus: user.verification_status || 'pending',
    verifiedAt: user.verified_at,
    rejectionReason: user.rejection_reason,
    verificationData: user.verification_data || {},
    // Status
    status: user.status || 'active',
    suspensionReason: user.suspension_reason,
    suspendedAt: user.suspended_at,
    deletedAt: user.deleted_at,
    // Wallet
    walletBalance: parseFloat(user.wallet_balance || 0),
    // Referral
    referralCode: user.referral_code,
    referredBy: user.referred_by,
    // Subscription
    subscriptionStatus: user.subscription_status,
    subscriptionExpiresAt: user.subscription_expires_at,
    // Timestamps
    createdAt: user.created_at,
    updatedAt: user.updated_at,
    // Keep original snake_case for backwards compatibility
    ...user
  };
};

/**
 * Transform camelCase updates to snake_case for database
 */
const transformUpdatesToSnakeCase = (updates) => {
  const snakeCaseUpdates = {};
  const mapping = {
    agencyName: 'agency_name',
    verificationStatus: 'verification_status',
    verifiedAt: 'verified_at',
    rejectionReason: 'rejection_reason',
    verificationData: 'verification_data',
    licenseNumber: 'license_number',
    suspensionReason: 'suspension_reason',
    suspendedAt: 'suspended_at',
    deletedAt: 'deleted_at',
    walletBalance: 'wallet_balance',
    referralCode: 'referral_code',
    referredBy: 'referred_by',
    subscriptionStatus: 'subscription_status',
    subscriptionExpiresAt: 'subscription_expires_at',
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  };

  for (const [key, value] of Object.entries(updates)) {
    const snakeKey = mapping[key] || key;
    snakeCaseUpdates[snakeKey] = value;
  }

  return snakeCaseUpdates;
};

// ============================================
// USER OPERATIONS
// ============================================

/**
 * Check if phone number already exists
 * @param {string} phoneNumber - Phone number to check
 * @returns {Promise<boolean>}
 */
export const checkPhoneNumberExists = async (phoneNumber) => {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('phone', phoneNumber)
      .limit(1);

    if (error) throw error;
    return data && data.length > 0;
  } catch (error) {
    console.error('Error checking phone number:', error);
    return false;
  }
};

/**
 * Get user's referral code, or generate new YOOM format code if needed
 * This upgrades legacy referral codes to the new format
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, code?: string, error?: string}>}
 */
export const getOrUpdateReferralCode = async (userId) => {
  try {
    const supabase = createClient();

    // Get current user's referral code
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('referral_code')
      .eq('id', userId)
      .single();

    if (fetchError) throw fetchError;

    // Check if code already exists and is in YOOM format
    if (user?.referral_code && user.referral_code.startsWith('YOOM')) {
      return { success: true, code: user.referral_code };
    }

    // Generate new YOOM format code
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let attempts = 0;
    const MAX_ATTEMPTS = 10;

    while (attempts < MAX_ATTEMPTS) {
      let newCode = 'YOOM';
      for (let i = 0; i < 4; i++) {
        newCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      // Check if code already exists
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('referral_code', newCode)
        .maybeSingle();

      if (!existing) {
        // Update user with new code
        const { error: updateError } = await supabase
          .from('users')
          .update({ referral_code: newCode, updated_at: new Date().toISOString() })
          .eq('id', userId);

        if (updateError) throw updateError;
        return { success: true, code: newCode };
      }
      attempts++;
    }

    // Fallback
    const fallbackCode = 'YOOM' + Date.now().toString(36).toUpperCase().slice(-6);
    await supabase
      .from('users')
      .update({ referral_code: fallbackCode, updated_at: new Date().toISOString() })
      .eq('id', userId);

    return { success: true, code: fallbackCode };
  } catch (error) {
    console.error('Error getting/updating referral code:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Generate a unique referral code starting with YOOM
 * Format: YOOM + 4 random alphanumeric characters (e.g., YOOM4K2X)
 */
const generateReferralCode = async (supabase) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars (I, O, 0, 1)
  let attempts = 0;
  const MAX_ATTEMPTS = 10;

  while (attempts < MAX_ATTEMPTS) {
    let code = 'YOOM';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Check if code already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('referral_code', code)
      .maybeSingle();

    if (!existing) {
      return code; // Unique code found
    }
    attempts++;
  }

  // Fallback: add timestamp to ensure uniqueness
  return 'YOOM' + Date.now().toString(36).toUpperCase().slice(-6);
};

/**
 * Create new user profile
 * @param {string} userId - User ID from auth
 * @param {object} userData - User data
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const createUser = async (userId, userData) => {
  try {
    const supabase = createClient();

    // Ensure name is a string (handle undefined, null, or object)
    const nameStr = typeof userData.name === 'string'
      ? userData.name
      : (userData.email?.split('@')[0] || 'User');

    // Generate unique referral code starting with YOOM
    const referralCode = await generateReferralCode(supabase);

    const { error } = await supabase
      .from('users')
      .insert({
        id: userId,
        ...userData,
        name: nameStr, // Use validated name string
        wallet_balance: 0,
        referral_code: referralCode,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) throw error;

    console.log('[CreateUser] User created successfully:', userId);

    // Process referral if provided
    if (userData.referredBy) {
      console.log('[CreateUser] Referral code provided:', userData.referredBy);
      const referralResult = await processReferral(userId, userData.referredBy);
      console.log('[CreateUser] Referral result:', referralResult);
    } else {
      console.log('[CreateUser] No referral code provided');
    }

    return { success: true };
  } catch (error) {
    console.error('[CreateUser] Error creating user:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Process referral code - Awards INSTANT credits on signup
 * Referrer gets 5 credits instantly, new user gets 2 welcome bonus credits
 * @param {string} newUserId - New user ID
 * @param {string} referralCode - Referral code
 * @returns {Promise<{success: boolean, error?: string, referrerName?: string}>}
 */
export const processReferral = async (newUserId, referralCode) => {
  console.log('[Referral] Processing referral:', { newUserId, referralCode });

  try {
    const supabase = createClient();

    // Validate inputs
    if (!newUserId || !referralCode) {
      console.log('[Referral] Missing required parameters');
      return { success: false, error: 'Missing user ID or referral code' };
    }

    // Normalize referral code (uppercase, trim)
    const normalizedCode = referralCode.trim().toUpperCase();
    console.log('[Referral] Looking for referrer with code:', normalizedCode);

    // Find referrer by referral code
    const { data: referrer, error: findError } = await supabase
      .from('users')
      .select('id, name, wallet_balance')
      .eq('referral_code', normalizedCode)
      .maybeSingle();

    if (findError) {
      console.error('[Referral] Error finding referrer:', findError);
      return { success: false, error: 'Database error finding referrer' };
    }

    if (!referrer) {
      console.log('[Referral] No referrer found with code:', normalizedCode);
      return { success: false, error: 'Invalid referral code' };
    }

    console.log('[Referral] Found referrer:', referrer.id, referrer.name);
    const referrerId = referrer.id;

    // Prevent self-referral
    if (referrerId === newUserId) {
      console.log('[Referral] Self-referral attempt blocked');
      return { success: false, error: 'You cannot refer yourself.' };
    }

    // Check if this user was already referred
    const { data: existingReferral, error: checkError } = await supabase
      .from('referrals')
      .select('id')
      .eq('referred_user_id', newUserId)
      .maybeSingle();

    if (checkError) {
      console.error('[Referral] Error checking existing referral:', checkError);
      // Don't fail, continue with referral process
    }

    if (existingReferral) {
      console.log('[Referral] User was already referred');
      return { success: false, error: 'You have already been referred.' };
    }

    const REFERRER_BONUS = 5;  // Credits for the referrer
    const NEW_USER_BONUS = 2;  // Welcome bonus for the new user

    // Award INSTANT credits to referrer
    console.log('[Referral] Awarding', REFERRER_BONUS, 'credits to referrer:', referrerId);

    // Direct wallet update for referrer
    const { error: referrerUpdateError } = await supabase
      .from('users')
      .update({
        wallet_balance: (parseFloat(referrer.wallet_balance) || 0) + REFERRER_BONUS,
        updated_at: new Date().toISOString()
      })
      .eq('id', referrerId);

    if (referrerUpdateError) {
      console.error('[Referral] Failed to update referrer wallet:', referrerUpdateError);
    } else {
      console.log('[Referral] ✓ Referrer wallet updated');
    }

    // Get new user's current balance and award welcome bonus
    const { data: newUser, error: newUserFetchError } = await supabase
      .from('users')
      .select('wallet_balance')
      .eq('id', newUserId)
      .maybeSingle();

    if (!newUserFetchError && newUser) {
      console.log('[Referral] Awarding', NEW_USER_BONUS, 'welcome credits to new user:', newUserId);

      const { error: newUserUpdateError } = await supabase
        .from('users')
        .update({
          wallet_balance: (parseFloat(newUser.wallet_balance) || 0) + NEW_USER_BONUS,
          updated_at: new Date().toISOString()
        })
        .eq('id', newUserId);

      if (newUserUpdateError) {
        console.error('[Referral] Failed to update new user wallet:', newUserUpdateError);
      } else {
        console.log('[Referral] ✓ New user wallet updated');
      }
    }

    // Record completed referral in referrals table
    console.log('[Referral] Recording referral in database...');
    const { error: insertError } = await supabase.from('referrals').insert({
      referrer_id: referrerId,
      referred_user_id: newUserId,
      credits_awarded: REFERRER_BONUS,
      bonus_amount: REFERRER_BONUS,
      status: 'completed',
      completed_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    });

    if (insertError) {
      console.error('[Referral] Failed to insert referral record:', insertError);
      // Don't fail the whole process, credits were already awarded
    } else {
      console.log('[Referral] ✓ Referral record created');
    }

    // Create notification for referrer
    console.log('[Referral] Creating notification for referrer...');
    try {
      await createNotification({
        user_id: referrerId,
        type: 'referral_bonus',
        title: '🎉 Referral Bonus Earned!',
        message: `Someone signed up using your referral code! ${REFERRER_BONUS} credits have been added to your wallet.`,
        data: { referredUserId: newUserId, bonusAmount: REFERRER_BONUS }
      });
      console.log('[Referral] ✓ Notification created');
    } catch (notifError) {
      console.error('[Referral] Failed to create notification:', notifError);
    }

    console.log('[Referral] ✓ Referral process completed successfully');
    return { success: true, referrerName: referrer.name };
  } catch (error) {
    console.error('[Referral] Critical error processing referral:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Process referral bonus on first credit purchase
 * Called when a user makes their first top-up
 * @param {string} userId - User who just made a purchase
 * @returns {Promise<{success: boolean, bonusAwarded?: number, referrerId?: string}>}
 */
export const processReferralOnFirstPurchase = async (userId) => {
  try {
    const supabase = createClient();

    // Check if user has a pending referral
    const { data: pendingReferral, error: fetchError } = await supabase
      .from('referrals')
      .select('id, referrer_id, bonus_amount')
      .eq('referred_user_id', userId)
      .eq('status', 'pending')
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (!pendingReferral) {
      return { success: true, bonusAwarded: 0 }; // No pending referral
    }

    const bonusAmount = pendingReferral.bonus_amount || 500;

    // Award credits to referrer
    const creditResult = await addCredits(
      pendingReferral.referrer_id,
      bonusAmount,
      `Referral Bonus: Agent made first purchase`
    );

    if (!creditResult.success) {
      console.error('Failed to award referral bonus:', creditResult.error);
      return { success: false, error: creditResult.error };
    }

    // Update referral status to completed
    await supabase
      .from('referrals')
      .update({
        status: 'completed',
        credits_awarded: bonusAmount,
        completed_at: new Date().toISOString()
      })
      .eq('id', pendingReferral.id);

    // Notify the referrer
    await createNotification({
      user_id: pendingReferral.referrer_id,
      type: 'referral_bonus',
      title: '🎉 Referral Bonus Earned!',
      message: `Your referred agent just made their first purchase! ${bonusAmount} credits have been added to your wallet.`,
      data: { bonusAmount, referredUserId: userId }
    });

    return {
      success: true,
      bonusAwarded: bonusAmount,
      referrerId: pendingReferral.referrer_id
    };
  } catch (error) {
    console.error('Error processing referral bonus:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get referral stats and list of referred users for user
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, stats?: object, referrals?: array, error?: string}>}
 */
export const getReferralStats = async (userId) => {
  try {
    const supabase = createClient();

    // Get all referrals with referred user details
    const { data, error, count } = await supabase
      .from('referrals')
      .select(`
        id,
        credits_awarded,
        status,
        created_at,
        completed_at,
        referred_user:users!referrals_referred_user_id_fkey(id, name, email, created_at)
      `, { count: 'exact' })
      .eq('referrer_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const totalCredits = (data || []).reduce((sum, ref) => sum + (ref.credits_awarded || 0), 0);

    // Transform the referrals for display
    const referrals = (data || []).map(ref => ({
      id: ref.id,
      name: ref.referred_user?.name || 'Unknown',
      email: ref.referred_user?.email || '',
      status: ref.status,
      creditsEarned: ref.credits_awarded || 0,
      joinedAt: ref.created_at,
      completedAt: ref.completed_at
    }));

    return {
      success: true,
      stats: {
        count: count || 0,
        totalCredits: totalCredits
      },
      referrals: referrals
    };
  } catch (error) {
    console.error('Error getting referral stats:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get user by ID
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getUser = async (userId) => {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return { success: false, error: 'User not found' };

    // Transform snake_case to camelCase for components
    return { success: true, data: transformUserData(data) };
  } catch (error) {
    console.error('Error getting user:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {object} updates - Fields to update
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateUser = async (userId, updates) => {
  try {
    const supabase = createClient();
    // Transform camelCase to snake_case for database
    const snakeCaseUpdates = transformUpdatesToSnakeCase(updates);

    const { error } = await supabase
      .from('users')
      .update({
        ...snakeCaseUpdates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error updating user:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// WALLET & CREDITS OPERATIONS
// ============================================

/**
 * Add credits to user wallet
 * @param {string} userId - User ID
 * @param {number} amount - Credits to add
 * @param {string} reason - Transaction reason
 * @returns {Promise<{success: boolean, newBalance?: number, error?: string}>}
 */
export const addCredits = async (userId, amount, reason = 'Credit Purchase') => {
  try {
    const supabase = createClient();

    // Get current balance
    const { data: user, error: getUserError } = await supabase
      .from('users')
      .select('wallet_balance')
      .eq('id', userId)
      .single();

    if (getUserError) throw getUserError;

    const currentBalance = parseFloat(user.wallet_balance || 0);
    const newBalance = currentBalance + amount;

    // Update balance
    const { error: updateError } = await supabase
      .from('users')
      .update({
        wallet_balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) throw updateError;

    // Record transaction
    await supabase.from('credit_transactions').insert({
      user_id: userId,
      amount,
      type: 'credit',
      reason,
      balance_after: newBalance,
      created_at: new Date().toISOString()
    });

    return { success: true, newBalance };
  } catch (error) {
    console.error('Error adding credits:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Add credits to agent wallet with payment details
 * @param {string} agentId - Agent ID
 * @param {number} credits - Number of credits to add
 * @param {object} transactionData - Payment transaction data
 * @returns {Promise<{success: boolean, newBalance?: number, error?: string}>}
 */
export const addAgentCredits = async (agentId, credits, transactionData = {}) => {
  const reason = `Credit purchase via ${transactionData.paymentMethod || 'Payment'} - ${transactionData.confirmationCode || ''}`;
  const result = await addCredits(agentId, credits, reason);

  // Send notification if credits were added successfully
  if (result.success) {
    try {
      const { notifyAgentCreditsPurchased } = await import('./notification-service');
      await notifyAgentCreditsPurchased(agentId, {
        credits,
        amount: transactionData.amount || 0,
        newBalance: result.newBalance,
        transactionId: transactionData.confirmationCode || transactionData.transactionId
      });
    } catch (notifError) {
      console.error('Non-critical notification error:', notifError);
    }
  }

  return result;
};

/**
 * Deduct credits from user wallet
 * @param {string} userId - User ID
 * @param {number} amount - Credits to deduct
 * @param {string} reason - Transaction reason
 * @returns {Promise<{success: boolean, newBalance?: number, error?: string}>}
 */
export const deductCredits = async (userId, amount, reason = 'Lead Unlock') => {
  try {
    const supabase = createClient();

    // Get current balance
    const { data: user, error: getUserError } = await supabase
      .from('users')
      .select('wallet_balance')
      .eq('id', userId)
      .single();

    if (getUserError) throw getUserError;

    const currentBalance = parseFloat(user.wallet_balance || 0);

    if (currentBalance < amount) {
      return { success: false, error: 'Insufficient credits' };
    }

    const newBalance = currentBalance - amount;

    // Update balance
    const { error: updateError } = await supabase
      .from('users')
      .update({
        wallet_balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) throw updateError;

    // Record transaction
    await supabase.from('credit_transactions').insert({
      user_id: userId,
      amount,
      type: 'debit',
      reason,
      balance_after: newBalance,
      created_at: new Date().toISOString()
    });

    // Check if balance is low and send warning (only for agents)
    if (newBalance <= 5 && newBalance > 0) {
      try {
        const { notifyAgentLowCredits } = await import('./notification-service');
        await notifyAgentLowCredits(userId, newBalance);
      } catch (notifError) {
        console.error('Non-critical low credits notification error:', notifError);
      }
    }

    return { success: true, newBalance };
  } catch (error) {
    console.error('Error deducting credits:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get user wallet balance
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, balance?: number, error?: string}>}
 */
export const getWalletBalance = async (userId) => {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('users')
      .select('wallet_balance')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return { success: true, balance: parseFloat(data.wallet_balance || 0) };
  } catch (error) {
    console.error('Error getting wallet balance:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// LEAD OPERATIONS
// ============================================

/**
 * Create new lead/rental request
 * @param {object} leadData - Lead data
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const createLead = async (leadData) => {
  try {
    const supabase = createClient();
    // Determine base price based on budget (Yoombaa Model)
    let basePrice = 250; // Default: Standard
    const budget = parseFloat(leadData.budget || 0);
    if (budget < 12000) basePrice = 50;      // Student/Budget
    else if (budget > 60000) basePrice = 1000; // Premium
    else if (budget > 30000) basePrice = 450;  // Family/Mid

    const { data, error } = await supabase
      .from('leads')
      .insert({
        ...leadData,
        status: 'active',
        views: 0,
        contacts: 0,
        base_price: basePrice,
        max_slots: 3,
        claimed_slots: 0,
        is_exclusive: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // --- NOTIFICATION LOGIC ---
    try {
      // Find all VERIFIED agents with their email
      const { data: allAgents } = await supabase
        .from('users')
        .select('id, name, email, location, phone')
        .eq('role', 'agent')
        .eq('verification_status', 'verified'); // Only notify verified agents

      if (allAgents && allAgents.length > 0) {
        const leadLoc = (leadData.location || "").toLowerCase();
        const leadType = leadData.property_type || leadData.type || "property";

        // Filter agents where locations overlap
        const matchingAgents = allAgents.filter(agent => {
          const agentLoc = (agent.location || "").toLowerCase();
          // Notify agents with no location (generalists) OR matching locations
          if (!agentLoc || agentLoc === 'all' || agentLoc === 'global' || agentLoc === 'any') return true;
          return leadLoc.includes(agentLoc) || agentLoc.includes(leadLoc);
        });

        console.log(`New lead created. Notifying ${matchingAgents.length} matching agents out of ${allAgents.length} total verified agents.`);

        if (matchingAgents.length > 0) {
          // Create in-app notifications for each matching agent
          const notifications = matchingAgents.map(agent => ({
            user_id: agent.id,
            type: 'new_lead',
            title: 'New Lead Available!',
            message: `A new tenant is looking for ${leadType} in ${leadData.location}`,
            data: {
              leadId: data.id,
              location: leadData.location,
              type: leadType,
              budget: leadData.budget
            },
            read: false,
            created_at: new Date().toISOString()
          }));

          await supabase.from('notifications').insert(notifications);

          // --- EMAIL NOTIFICATIONS ---
          // Send email via API endpoint (required because Resend key is server-side only)
          try {
            const baseUrl = typeof window !== 'undefined'
              ? window.location.origin
              : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5000';

            for (const agent of matchingAgents) {
              if (agent.email) {
                fetch(`${baseUrl}/api/email/send`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    type: 'new_lead',
                    to: agent.email,
                    data: {
                      agentName: agent.name || 'Agent',
                      leadData: {
                        location: leadData.location,
                        budget: leadData.budget,
                        bedrooms: leadData.bedrooms,
                        propertyType: leadType,
                        urgency: leadData.urgency || 'normal'
                      }
                    }
                  })
                }).then(res => {
                  if (res.ok) console.log(`Email sent to agent: ${agent.email}`);
                  else console.error(`Failed to send email to: ${agent.email}`);
                }).catch(err => console.error(`Email error for ${agent.email}:`, err));
              }
            }
          } catch (emailErr) {
            console.error('Error sending email notifications:', emailErr);
          }

          // --- WHATSAPP AUTOMATION ---
          // Send WhatsApp alerts to matching agents
          for (const agent of matchingAgents) {
            if (agent.phone) {
              try {
                // Using 'alert_buttons' template from user's active list
                // Format: [Location, Type, Budget, Link]
                await sendWhatsAppTemplate(
                  agent.phone,
                  'alert_buttons',
                  process.env.INFOBIP_TEMPLATE_NAMESPACE,
                  [
                    leadData.location,
                    leadType,
                    leadData.budget,
                    `${process.env.NEXT_PUBLIC_APP_URL || 'https://rentconnect.app'}/agent-dashboard`
                  ]
                );
              } catch (waErr) {
                console.error(`Failed to send WhatsApp to ${agent.phone}:`, waErr);
              }
            }
          }
        }
      }
    } catch (notifErr) {
      console.error('Non-critical error sending lead notifications:', notifErr);
    }
    // ---------------------------

    return { success: true, data };
  } catch (error) {
    console.error('Error creating lead:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get lead by ID
 * @param {string} leadId - Lead ID
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getLead = async (leadId) => {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (error) throw error;
    if (!data) return { success: false, error: 'Lead not found' };

    return { success: true, data };
  } catch (error) {
    console.error('Error getting lead:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all leads with optional filters
 * @param {object} filters - Filter options
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export const getAllLeads = async (filters = {}) => {
  try {
    const supabase = createClient();
    let query = supabase.from('leads').select('*');

    // Apply filters - skip status filter if 'all'
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    if (filters.location) {
      query = query.ilike('location', `%${filters.location}%`);
    }
    if (filters.propertyType) {
      query = query.eq('property_type', filters.propertyType);
    }
    // Support both userId and tenantId as filter parameters
    if (filters.userId || filters.tenantId) {
      query = query.eq('user_id', filters.userId || filters.tenantId);
    }
    if (filters.minBudget) {
      query = query.gte('budget', filters.minBudget);
    }
    if (filters.maxBudget) {
      query = query.lte('budget', filters.maxBudget);
    }

    // Filter hidden leads - by default exclude hidden leads (for agents)
    // Admin can pass includeHidden: true to see all
    if (!filters.includeHidden) {
      query = query.or('is_hidden.is.null,is_hidden.eq.false');
    }

    // Order and limit
    query = query.order('created_at', { ascending: false });

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error getting leads:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete lead
 * @param {string} leadId - Lead ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteLead = async (leadId) => {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', leadId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting lead:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update lead
 * @param {string} leadId - Lead ID
 * @param {object} updates - Fields to update
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateLead = async (leadId, updates) => {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('leads')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', leadId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error updating lead:', error);
    return { success: false, error: error.message, code: error.code };
  }
};

/**
 * Increment lead view count (Unique agents only)
 * @param {string} leadId - Lead ID
 * @param {string} agentId - Agent ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const incrementLeadViews = async (leadId, agentId) => {
  if (!agentId) return { success: false, error: "Agent ID required" };

  try {
    const supabase = createClient();

    // Check if this agent already viewed or contacted this lead
    const { data: existingEntry, error: fetchError } = await supabase
      .from('contact_history')
      .select('id')
      .eq('agent_id', agentId)
      .eq('lead_id', leadId)
      .limit(1);

    if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

    // If agent has already interacted with this lead (viewed or contacted), don't increment
    if (existingEntry && existingEntry.length > 0) {
      return { success: true, alreadyTracked: true };
    }

    // Log the initial view in contact_history with 0 cost (Unique tracking)
    // Wrap in try-catch to prevent crash if 'browse' type isn't allowed by DB constraint
    try {
      const { error: logError } = await supabase.from('contact_history').insert({
        agent_id: agentId,
        lead_id: leadId,
        contact_type: 'browse',
        cost_credits: 0,
        created_at: new Date().toISOString()
      });

      // If it failed due to unique constraint, it means they already viewed it (which is fine)
      // If it failed due to check constraint, we just skip the unique logging but still increment count
      if (logError && logError.code !== '23514' && logError.code !== '23505') {
        console.warn('Non-critical: Unique view tracking skipped due to DB constraint');
      }
    } catch (e) {
      console.warn('Unique view tracking failed:', e);
    }

    // Get current views count
    const { data: lead } = await supabase
      .from('leads')
      .select('views')
      .eq('id', leadId)
      .single();

    const newViews = (lead?.views || 0) + 1;

    // Update lead views
    const { error: updateError } = await supabase
      .from('leads')
      .update({ views: newViews })
      .eq('id', leadId);

    if (updateError) throw updateError;

    return { success: true };
  } catch (error) {
    console.error('Error incrementing lead views:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Increment lead contact count
 * @param {string} leadId - Lead ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const incrementLeadContacts = async (leadId) => {
  try {
    const supabase = createClient();

    // Get current contacts
    const { data: lead } = await supabase
      .from('leads')
      .select('contacts')
      .eq('id', leadId)
      .single();

    const newContacts = (lead?.contacts || 0) + 1;

    const { error } = await supabase
      .from('leads')
      .update({ contacts: newContacts })
      .eq('id', leadId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error incrementing lead contacts:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Track agent-lead contact (deduct credits and log)
 * @param {string} agentId - Agent ID
 * @param {string} leadId - Lead ID
 * @param {string} contactType - Type of contact (phone, email, whatsapp, view)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const trackAgentLeadContact = async (agentId, leadId, contactType) => {
  try {
    const supabase = createClient();

    // Define contact costs
    const contactCosts = {
      phone: 3,
      email: 2,
      whatsapp: 2,
      view: 1
    };

    const cost = contactCosts[contactType] || 0;

    // Check if this agent has EVER contacted this lead before
    // This is used to determine if we should increment the unique agent count
    const isFirstContactByThisAgent = !(await hasAgentContactedLead(agentId, leadId));

    // Deduct credits if cost > 0
    if (cost > 0) {
      const deductResult = await deductCredits(agentId, cost, `Lead Contact - ${contactType}`);
      if (!deductResult.success) {
        return deductResult;
      }
    }

    // Log contact history
    await supabase.from('contact_history').insert({
      agent_id: agentId,
      lead_id: leadId,
      contact_type: contactType,
      cost_credits: cost,
      created_at: new Date().toISOString()
    });

    // Only increment lead contacts count if this is a NEW unique agent
    // This ensures the count represents unique agents, not total contact events
    if (isFirstContactByThisAgent) {
      await incrementLeadContacts(leadId);
    }

    return { success: true };
  } catch (error) {
    console.error('Error tracking agent-lead contact:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if agent has already interacted with lead (any interaction including browse)
 * NOTE: This is used for preventing duplicate view counting, NOT for determining unlock status
 * For checking actual paid unlocks, use hasAgentUnlockedLead instead
 * @param {string} agentId - Agent ID
 * @param {string} leadId - Lead ID
 * @returns {Promise<boolean>}
 */
export const hasAgentContactedLead = async (agentId, leadId) => {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('contact_history')
      .select('id')
      .eq('agent_id', agentId)
      .eq('lead_id', leadId)
      .limit(1);

    if (error) throw error;
    return data && data.length > 0;
  } catch (error) {
    console.error('Error checking agent contact:', error);
    return false;
  }
};

/**
 * Check if agent has ACTUALLY UNLOCKED (paid for) a lead
 * This is the authoritative check for unlock status
 * @param {string} agentId - Agent ID
 * @param {string} leadId - Lead ID
 * @returns {Promise<boolean>}
 */
export const hasAgentUnlockedLead = async (agentId, leadId) => {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('contact_history')
      .select('id')
      .eq('agent_id', agentId)
      .eq('lead_id', leadId)
      .in('contact_type', ['unlock', 'exclusive'])
      .limit(1);

    if (error) throw error;
    return data && data.length > 0;
  } catch (error) {
    console.error('Error checking agent unlock status:', error);
    return false;
  }
};

/**
 * Subscribe to leads in real-time
 * @param {Function} callback - Callback function for updates
 * @param {object} filters - Filter options
 * @returns {Function} Unsubscribe function
 */
export const subscribeToLeads = (callback, filters = {}) => {
  const supabase = createClient();

  // Fetch initial data
  const fetchLeads = async () => {
    const result = await getAllLeads(filters);
    if (result.success) {
      callback(result.data);
    }
  };

  // Fetch initial leads
  fetchLeads();

  // Subscribe to changes
  let query = supabase
    .channel('leads-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'leads'
      },
      async () => {
        // Refetch all leads when any change occurs
        await fetchLeads();
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(query);
  };
};

// ============================================
// PROPERTY OPERATIONS
// ============================================

/**
 * Create new property listing
 * @param {object} propertyData - Property data
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const createProperty = async (propertyData) => {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('properties')
      .insert({
        ...propertyData,
        status: 'available',
        views: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error creating property:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get property by ID
 * @param {string} propertyId - Property ID
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getProperty = async (propertyId) => {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single();

    if (error) throw error;
    if (!data) return { success: false, error: 'Property not found' };

    return { success: true, data };
  } catch (error) {
    console.error('Error getting property:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get agent's properties
 * @param {string} agentId - Agent ID
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export const getAgentProperties = async (agentId) => {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error getting agent properties:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Search properties with filters
 * @param {object} searchParams - Search parameters
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export const searchProperties = async (searchParams) => {
  try {
    const supabase = createClient();
    let query = supabase
      .from('properties')
      .select('*')
      .eq('status', 'available');

    // Apply filters
    if (searchParams.location) {
      query = query.ilike('location', `%${searchParams.location}%`);
    }
    if (searchParams.type) {
      query = query.eq('property_type', searchParams.type);
    }
    if (searchParams.minPrice) {
      query = query.gte('price', searchParams.minPrice);
    }
    if (searchParams.maxPrice) {
      query = query.lte('price', searchParams.maxPrice);
    }
    if (searchParams.bedrooms) {
      query = query.gte('bedrooms', searchParams.bedrooms);
    }

    // Order by price if price filters exist, otherwise by date
    if (searchParams.minPrice || searchParams.maxPrice) {
      query = query.order('price', { ascending: true });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    if (searchParams.limit) {
      query = query.limit(searchParams.limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error searching properties:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update property
 * @param {string} propertyId - Property ID
 * @param {object} updates - Fields to update
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateProperty = async (propertyId, updates) => {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('properties')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', propertyId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error updating property:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete property
 * @param {string} propertyId - Property ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteProperty = async (propertyId) => {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', propertyId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting property:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// SUBSCRIPTION OPERATIONS
// ============================================

/**
 * Create subscription
 * @param {object} subscriptionData - Subscription data
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const createSubscription = async (subscriptionData) => {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        ...subscriptionData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error creating subscription:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get active subscription for user
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getActiveSubscription = async (userId) => {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) return { success: false, error: 'No active subscription found' };

    return { success: true, data };
  } catch (error) {
    console.error('Error getting subscription:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update subscription
 * @param {string} subscriptionId - Subscription ID
 * @param {object} updates - Fields to update
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateSubscription = async (subscriptionId, updates) => {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('subscriptions')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error updating subscription:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check subscription status for user
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, isPremium: boolean, subscription?: object, error?: string}>}
 */
export const checkSubscriptionStatus = async (userId) => {
  try {
    const result = await getActiveSubscription(userId);

    if (result.success) {
      const subscription = result.data;
      const now = new Date();
      const expiresAt = new Date(subscription.expires_at);

      if (now < expiresAt) {
        return { success: true, isPremium: true, subscription };
      } else {
        // Subscription expired, update status
        await updateSubscription(subscription.id, { status: 'expired' });
        return { success: true, isPremium: false };
      }
    }

    return { success: true, isPremium: false };
  } catch (error) {
    console.error('Error checking subscription:', error);
    return { success: false, error: error.message, isPremium: false };
  }
};

// ============================================
// SAVED PROPERTIES OPERATIONS
// ============================================

/**
 * Save property for user
 * @param {string} userId - User ID
 * @param {string} propertyId - Property ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const saveProperty = async (userId, propertyId) => {
  try {
    const supabase = createClient();

    // Check if already saved
    const { data: existing } = await supabase
      .from('saved_properties')
      .select('id')
      .eq('user_id', userId)
      .eq('property_id', propertyId)
      .single();

    if (existing) {
      return { success: true }; // Already saved
    }

    const { error } = await supabase
      .from('saved_properties')
      .insert({
        user_id: userId,
        property_id: propertyId,
        created_at: new Date().toISOString()
      });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error saving property:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Unsave property for user
 * @param {string} userId - User ID
 * @param {string} propertyId - Property ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const unsaveProperty = async (userId, propertyId) => {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('saved_properties')
      .delete()
      .eq('user_id', userId)
      .eq('property_id', propertyId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error unsaving property:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get user's saved properties
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export const getSavedProperties = async (userId) => {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('saved_properties')
      .select('property_id, properties(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Extract property data from join
    const properties = data.map(item => item.properties);

    return { success: true, data: properties || [] };
  } catch (error) {
    console.error('Error getting saved properties:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// CONTACT HISTORY OPERATIONS
// ============================================

/**
 * Add contact history record
 * @param {object} contactData - Contact data
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const addContactHistory = async (contactData) => {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('contact_history')
      .insert({
        ...contactData,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error adding contact history:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get user's contact history
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export const getUserContactHistory = async (userId) => {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('contact_history')
      .select('*')
      .eq('agent_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error getting contact history:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// NOTIFICATION OPERATIONS
// ============================================

/**
 * Create notification
 * @param {object} notificationData - Notification data
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const createNotification = async (notificationData) => {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        ...notificationData,
        read: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get user notifications (unread only by default)
 * @param {string} userId - User ID
 * @param {boolean} includeRead - Include read notifications
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export const getUserNotifications = async (userId, includeRead = false) => {
  try {
    const supabase = createClient();
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId);

    if (!includeRead) {
      query = query.eq('read', false);
    }

    query = query.order('created_at', { ascending: false }).limit(20);

    const { data, error } = await query;

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error getting notifications:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Subscribe to notifications in real-time for a user
 * @param {string} userId - User ID
 * @param {Function} callback - Callback function for updates
 * @returns {Function} Unsubscribe function
 */
export const subscribeToNotifications = (userId, callback) => {
  const supabase = createClient();

  // Fetch initial data
  const fetchNotifs = async () => {
    const result = await getUserNotifications(userId, true);
    if (result.success) {
      callback(result.data);
    }
  };

  // Fetch initial notifications
  fetchNotifs();

  // Subscribe to changes for this specific user
  const channel = supabase
    .channel(`notifications-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      async () => {
        // Refetch notifications when any change occurs for this user
        await fetchNotifs();
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel);
  };
};

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const markNotificationRead = async (notificationId) => {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Mark all notifications as read for a user
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const markAllNotificationsRead = async (userId) => {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get unread notification count
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, count?: number, error?: string}>}
 */
export const getUnreadNotificationCount = async (userId) => {
  try {
    const supabase = createClient();
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
    return { success: true, count: count || 0 };
  } catch (error) {
    console.error('Error getting notification count:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete a notification
 * @param {string} notificationId - Notification ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteNotification = async (notificationId) => {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Subscribe to new notifications in real-time
 * @param {string} userId - User ID
 * @param {Function} callback - Callback function for new notifications
 * @returns {Function} Unsubscribe function
 */
export const subscribeToNewNotifications = (userId, callback) => {
  const supabase = createClient();

  const channel = supabase
    .channel(`notifications-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        // Pass the single new notification object to the callback
        if (payload.new) {
          callback(payload.new);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// ============================================
// AGENT OPERATIONS
// ============================================

/**
 * Get all agents with optional filters
 * @param {object} filters - Filter options
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export const getAllAgents = async (filters = {}) => {
  try {
    const supabase = createClient();
    let query = supabase
      .from('users')
      .select('*')
      .eq('role', 'agent');

    if (filters.location) {
      query = query.ilike('location', `%${filters.location}%`);
    }
    if (filters.verified !== undefined) {
      query = query.eq('verification_status', 'verified');
    }
    if (filters.verificationStatus) {
      query = query.eq('verification_status', filters.verificationStatus);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    // Get unlocked leads count for each agent
    const agentIds = (data || []).map(agent => agent.id);

    let unlockCountMap = {};

    // Only query if we have agents to look up
    if (agentIds.length > 0) {
      // Fetch lead unlock counts from contact_history
      const { data: unlockCounts } = await supabase
        .from('contact_history')
        .select('agent_id')
        .in('agent_id', agentIds);

      // Create a count map
      (unlockCounts || []).forEach(record => {
        unlockCountMap[record.agent_id] = (unlockCountMap[record.agent_id] || 0) + 1;
      });
    }

    // Transform each user to camelCase for components and add unlock count
    const transformedData = (data || []).map(user => ({
      ...transformUserData(user),
      unlockedLeadsCount: unlockCountMap[user.id] || 0
    }));

    return { success: true, data: transformedData };
  } catch (error) {
    console.error('Error getting agents:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get agent by ID
 * @param {string} agentId - Agent ID
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getAgentById = async (agentId) => {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', agentId)
      .in('role', ['agent', 'admin'])
      .single();

    if (error) throw error;
    if (!data) return { success: false, error: 'Agent not found' };

    return { success: true, data: transformUserData(data) };
  } catch (error) {
    console.error('Error getting agent:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Search agents by name, agency, or location
 * @param {string} searchTerm - Search term
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export const searchAgents = async (searchTerm) => {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'agent')
      .or(`name.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%,agency_name.ilike.%${searchTerm}%`);

    if (error) throw error;
    return { success: true, data: (data || []).map(transformUserData) };
  } catch (error) {
    console.error('Error searching agents:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send connection request from one agent to another (networking)
 * @param {string} fromAgentId - Requesting agent ID
 * @param {string} toAgentId - Target agent ID
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const sendConnectionRequest = async (fromAgentId, toAgentId) => {
  try {
    const supabase = createClient();

    // Get the requesting agent's info for notification
    const { data: fromAgent } = await supabase
      .from('users')
      .select('name, agency_name')
      .eq('id', fromAgentId)
      .single();

    // Create notification for the target agent
    await createNotification({
      user_id: toAgentId,
      type: 'connection_request',
      title: 'New Connection Request',
      message: `${fromAgent?.name || 'An agent'} from ${fromAgent?.agency_name || 'unknown agency'} wants to connect with you`,
      data: {
        from_agent_id: fromAgentId,
        from_agent_name: fromAgent?.name,
        from_agency: fromAgent?.agency_name
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending connection request:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// INQUIRY OPERATIONS
// ============================================

/**
 * Create inquiry for property
 * @param {object} inquiryData - Inquiry data
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const createInquiry = async (inquiryData) => {
  try {
    const supabase = createClient();

    // Create notification for agent
    await createNotification({
      user_id: inquiryData.agentId,
      type: 'new_inquiry',
      title: 'New Property Inquiry 🏠',
      message: `You have a new inquiry for "${inquiryData.propertyTitle || 'your property'}" from ${inquiryData.name || 'a potential tenant'}.`,
      data: {
        propertyId: inquiryData.propertyId,
        propertyName: inquiryData.propertyTitle,
        contactName: inquiryData.name,
        contactPhone: inquiryData.phone
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Error creating inquiry:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get agent inquiries
 * @param {string} agentId - Agent ID
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export const getAgentInquiries = async (agentId) => {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', agentId)
      .eq('type', 'new_inquiry')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error getting inquiries:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update inquiry status
 * @param {string} inquiryId - Inquiry ID
 * @param {string} status - New status
 * @param {string} response - Optional response message
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateInquiryStatus = async (inquiryId, status, response = null) => {
  try {
    const supabase = createClient();

    const updateData = { read: true };
    if (response) {
      updateData.data = { status, response };
    }

    const { error } = await supabase
      .from('notifications')
      .update(updateData)
      .eq('id', inquiryId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error updating inquiry:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// USER SUBSCRIPTION OPERATIONS
// ============================================

/**
 * Create user subscription (for tenants)
 * @param {object} subscriptionData - Subscription data
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const createUserSubscription = async (subscriptionData) => {
  try {
    return await createSubscription(subscriptionData);
  } catch (error) {
    console.error('Error creating user subscription:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get user subscription (for tenants)
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getUserSubscription = async (userId) => {
  try {
    return await getActiveSubscription(userId);
  } catch (error) {
    console.error('Error getting user subscription:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if user can view contact details
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, canView: boolean, error?: string}>}
 */
export const checkUserCanViewContact = async (userId) => {
  try {
    const subscriptionResult = await checkSubscriptionStatus(userId);

    if (subscriptionResult.isPremium) {
      return { success: true, canView: true };
    }

    const balanceResult = await getWalletBalance(userId);
    if (balanceResult.success && balanceResult.balance > 0) {
      return { success: true, canView: true };
    }

    return { success: true, canView: false };
  } catch (error) {
    console.error('Error checking view contact permission:', error);
    return { success: false, canView: false, error: error.message };
  }
};

// ============================================
// ADMIN OPERATIONS
// ============================================

/**
 * Get pending agents awaiting verification
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export const getPendingAgents = async () => {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'agent')
      .eq('verification_status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error getting pending agents:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Approve agent verification
 * @param {string} agentId - Agent ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const approveAgent = async (agentId) => {
  try {
    const supabase = createClient();

    // Update agent status
    const { error: updateError } = await supabase
      .from('users')
      .update({
        verification_status: 'verified',
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', agentId);

    if (updateError) throw updateError;

    // Send unified notification (in-app + email)
    try {
      const { notifyAgentVerified } = await import('./notification-service');
      await notifyAgentVerified(agentId);
    } catch (notifError) {
      console.error('Non-critical notification error:', notifError);
      // Still return success - the main operation completed
    }

    return { success: true };
  } catch (error) {
    console.error('Error approving agent:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Reject agent verification
 * @param {string} agentId - Agent ID
 * @param {string} reason - Rejection reason
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const rejectAgent = async (agentId, reason) => {
  try {
    const supabase = createClient();

    // Update agent status
    const { error: updateError } = await supabase
      .from('users')
      .update({
        verification_status: 'rejected',
        rejection_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', agentId);

    if (updateError) throw updateError;

    // Send unified notification (in-app + email)
    try {
      const { notifyAgentVerificationRejected } = await import('./notification-service');
      await notifyAgentVerificationRejected(agentId, reason);
    } catch (notifError) {
      console.error('Non-critical notification error:', notifError);
      // Still return success - the main operation completed
    }

    return { success: true };
  } catch (error) {
    console.error('Error rejecting agent:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all credit transactions
 * @param {number} limitCount - Limit number of results
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export const getAllTransactions = async (limitCount = 50) => {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('credit_transactions')
      .select('*, users(name, email)')
      .order('created_at', { ascending: false })
      .limit(limitCount);

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error getting transactions:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Unlock lead for agent
 * @param {string} agentId - Agent ID
 * @param {string} leadId - Lead ID
 * @returns {Promise<{success: boolean, error?: string, message?: string}>}
 */
export const unlockLead = async (agentId, leadId, isExclusive = false) => {
  try {
    const supabase = createClient();

    // 1. Get Lead Details
    const { data: lead, error: fetchError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (fetchError || !lead) throw new Error('Lead not found');

    // 2. Validation
    if (lead.status === 'sold_out' || lead.claimed_slots >= (lead.max_slots || 3)) {
      return { success: false, error: 'Lead is already sold out' };
    }

    if (isExclusive && lead.claimed_slots > 0) {
      return { success: false, error: 'Exclusive buyout only available for new leads' };
    }

    if (lead.is_exclusive) {
      return { success: false, error: 'This lead has been bought exclusively by another agent' };
    }

    // Check if agent already PAID FOR this lead (not just viewed)
    const alreadyUnlocked = await hasAgentUnlockedLead(agentId, leadId);
    if (alreadyUnlocked) {
      return { success: true, message: 'Already unlocked' };
    }

    const basePrice = lead.base_price || 250;

    // 3. Calculate Cost
    let cost = 0;
    if (isExclusive) {
      // Dynamic Buyout Formula: (Total of all 3 slots) * 0.85
      // Multipliers: 1.0, 1.5, 2.5 = 5.0x Base
      const totalPotential = basePrice * 5.0;
      cost = Math.round(totalPotential * 0.85);
    } else {
      // Surge Pricing Multipliers: 1st slot = 1x, 2nd = 1.5x, 3rd = 2.5x
      const multipliers = [1.0, 1.5, 2.5];
      const currentSlot = lead.claimed_slots || 0;
      cost = Math.round(basePrice * (multipliers[currentSlot] || 2.5));
    }

    // 4. Deduct Credits
    const deductResult = await deductCredits(agentId, cost, `Lead Unlock: ${leadId}${isExclusive ? ' (Exclusive)' : ''}`);
    if (!deductResult.success) return deductResult;

    // 5. Update Lead Slots
    const maxSlots = lead.max_slots || 3;
    const newClaimedSlots = isExclusive ? maxSlots : (lead.claimed_slots || 0) + 1;

    const { error: updateError } = await supabase
      .from('leads')
      .update({
        claimed_slots: newClaimedSlots,
        status: newClaimedSlots >= maxSlots ? 'sold_out' : 'active',
        is_exclusive: isExclusive || lead.is_exclusive,
        contacts: (lead.contacts || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', leadId);

    if (updateError) {
      // Refund if update fails (Basic rollback)
      await addCredits(agentId, cost, 'Refund: Lead unlock failed');
      throw updateError;
    }

    // 6. Log Contact History (PRIMARY record - must succeed)
    const { error: contactError } = await supabase.from('contact_history').insert({
      agent_id: agentId,
      lead_id: leadId,
      contact_type: isExclusive ? 'exclusive' : 'unlock',
      cost_credits: cost,
      created_at: new Date().toISOString()
    });

    if (contactError) {
      console.error('Error logging contact history:', contactError);
      // Refund if contact logging fails
      await addCredits(agentId, cost, 'Refund: Contact history logging failed');
      throw contactError;
    }

    // 7. Store the connection (secondary record - optional but helpful for fast lookups)
    try {
      await supabase.from('lead_agent_connections').upsert({
        lead_id: leadId,
        agent_id: agentId,
        connection_type: isExclusive ? 'exclusive' : 'unlock',
        created_at: new Date().toISOString()
      }, { onConflict: 'lead_id, agent_id' });
    } catch (connError) {
      // Non-critical - contact_history is the source of truth
      console.log('lead_agent_connections upsert failed (non-critical):', connError?.message);
    }

    // 8. Send notifications (in-app + email) to agent and tenant
    try {
      const { data: agent } = await supabase.from('users').select('name, phone, email').eq('id', agentId).single();

      // Import notification service dynamically to avoid circular dependencies
      const { notifyAgentLeadUnlocked, notifyTenantAgentInterested } = await import('./notification-service');

      // Notify agent with tenant contact details
      await notifyAgentLeadUnlocked(agentId, lead, {
        name: lead.tenant_name,
        phone: lead.tenant_phone,
        email: lead.tenant_email
      });

      // Notify tenant that an agent is interested
      if (lead.user_id && agent?.name) {
        await notifyTenantAgentInterested(lead.user_id, {
          agentId,
          name: agent.name,
          phone: agent.phone
        });
      }
    } catch (notifErr) {
      console.error('Non-critical error sending unlock notifications:', notifErr);
    }

    return { success: true, cost };
  } catch (error) {
    console.error('Error unlocking lead:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get unlocked leads for agent (ONLY paid unlocks, not views)
 * @param {string} agentId - Agent ID
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export const getUnlockedLeads = async (agentId) => {
  try {
    if (!agentId) {
      console.warn('getUnlockedLeads called without agentId');
      return { success: true, data: [] };
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('contact_history')
      .select('lead_id')
      .eq('agent_id', agentId)
      .in('contact_type', ['unlock', 'exclusive']); // ONLY actual paid unlocks

    if (error) throw error;

    // Filter out null/undefined lead_ids and ensure unique
    const leadIds = [...new Set((data || []).filter(item => item.lead_id).map(item => item.lead_id))];
    console.log(`getUnlockedLeads for agent ${agentId}:`, leadIds.length, 'leads');
    return { success: true, data: leadIds };
  } catch (error) {
    console.error('Error getting unlocked leads:', error);
    return { success: false, error: error.message, data: [] };
  }
};

/**
 * Clear contact history for an agent (FOR TESTING PURPOSES ONLY)
 * This will reset all leads to "locked" state for the agent
 * @param {string} agentId - Agent ID
 * @returns {Promise<{success: boolean, deletedCount?: number, error?: string}>}
 */
export const clearAgentContactHistory = async (agentId) => {
  try {
    if (!agentId) {
      return { success: false, error: 'Agent ID required' };
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('contact_history')
      .delete()
      .eq('agent_id', agentId)
      .select();

    if (error) throw error;

    console.log(`Cleared ${data?.length || 0} contact history records for agent ${agentId}`);
    return { success: true, deletedCount: data?.length || 0 };
  } catch (error) {
    console.error('Error clearing contact history:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get dashboard statistics for admin
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getDashboardStats = async () => {
  try {
    const supabase = createClient();

    // Get counts in parallel
    const [
      { count: totalAgents },
      { count: verifiedAgents },
      { count: totalRenters },
      { count: totalLeads },
      { count: openLeads },
      { count: closedLeads }
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'agent'),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'agent').eq('verification_status', 'verified'),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'tenant'),
      supabase.from('leads').select('*', { count: 'exact', head: true }),
      supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'closed')
    ]);

    // Get wallet balance sum
    const { data: walletData } = await supabase
      .from('users')
      .select('wallet_balance')
      .eq('role', 'agent');

    const totalWalletBalance = walletData?.reduce((sum, user) => sum + parseFloat(user.wallet_balance || 0), 0) || 0;

    // Revenue last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: revenueData } = await supabase
      .from('credit_transactions')
      .select('amount')
      .eq('type', 'credit')
      .gte('created_at', thirtyDaysAgo.toISOString());

    const revenueLast30Days = revenueData?.reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0) || 0;

    // Daily unlocks (last 24h)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const { count: dailyUnlocks } = await supabase
      .from('contact_history')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneDayAgo.toISOString());

    return {
      success: true,
      data: {
        totalAgents: totalAgents || 0,
        verifiedAgents: verifiedAgents || 0,
        activeRenters: totalRenters || 0,
        totalLeads: totalLeads || 0,
        openLeads: openLeads || 0,
        closedLeads: closedLeads || 0,
        totalWalletBalance: parseFloat(totalWalletBalance.toFixed(2)),
        revenueLast30Days: parseFloat(revenueLast30Days.toFixed(2)),
        dailyUnlocks: dailyUnlocks || 0
      }
    };
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get recent activity for admin dashboard
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export const getRecentActivity = async () => {
  try {
    const supabase = createClient();
    const activities = [];

    // Recent user signups
    const { data: recentUsers } = await supabase
      .from('users')
      .select('id, name, email, role, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    recentUsers?.forEach(user => {
      activities.push({
        id: user.id,
        type: 'signup',
        title: `New ${user.role} Signup`,
        description: `${user.name} joined RentConnect`,
        timestamp: user.created_at,
        meta: { role: user.role, email: user.email }
      });
    });

    // Recent transactions
    const { data: recentTx } = await supabase
      .from('credit_transactions')
      .select('id, amount, type, reason, created_at, users(name)')
      .order('created_at', { ascending: false })
      .limit(5);

    recentTx?.forEach(tx => {
      activities.push({
        id: tx.id,
        type: 'transaction',
        title: tx.type === 'credit' ? 'Credit Purchase' : 'Credit Deduction',
        description: `${tx.amount} credits - ${tx.reason}`,
        timestamp: tx.created_at,
        meta: { amount: tx.amount, type: tx.type }
      });
    });

    // Recent leads
    const { data: recentLeads } = await supabase
      .from('leads')
      .select('id, property_type, location, budget, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    recentLeads?.forEach(lead => {
      activities.push({
        id: lead.id,
        type: 'lead',
        title: 'New Lead Posted',
        description: `${lead.property_type} in ${lead.location}`,
        timestamp: lead.created_at,
        meta: { budget: lead.budget }
      });
    });

    // Sort by timestamp
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return { success: true, data: activities.slice(0, 10) };
  } catch (error) {
    console.error('Error getting recent activity:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// ADMIN USER MANAGEMENT
// ============================================

/**
 * Suspend user account
 * @param {string} userId - User ID
 * @param {string} reason - Suspension reason
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const suspendUser = async (userId, reason) => {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('users')
      .update({
        status: 'suspended',
        suspension_reason: reason,
        suspended_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error suspending user:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Reactivate suspended user
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const reactivateUser = async (userId) => {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('users')
      .update({
        status: 'active',
        suspension_reason: null,
        suspended_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error reactivating user:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Soft delete user (mark as deleted)
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const softDeleteUser = async (userId) => {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('users')
      .update({
        status: 'deleted',
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get full agent profile with stats
 * @param {string} agentId - Agent ID
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getFullAgentProfile = async (agentId) => {
  try {
    const supabase = createClient();

    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', agentId)
      .single();

    if (userError) throw userError;

    // Get transactions
    const { data: transactions } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', agentId)
      .order('created_at', { ascending: false })
      .limit(20);

    // Get unlocked leads count
    const { count: unlockedCount } = await supabase
      .from('contact_history')
      .select('*', { count: 'exact', head: true })
      .eq('agent_id', agentId);

    // Get properties count
    const { count: propertiesCount } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('agent_id', agentId);

    // Get recent lead unlocks with lead details
    const { data: recentUnlocks } = await supabase
      .from('contact_history')
      .select(`
        id,
        created_at,
        contact_type,
        cost_credits,
        lead:leads (
          id,
          tenant_name,
          location,
          property_type,
          budget
        )
      `)
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get referrals count (if referral system exists)
    const { count: referralsCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('referred_by', agentId);

    // Transform user data to camelCase
    const transformedUser = transformUserData(userData);

    return {
      success: true,
      data: {
        ...transformedUser,
        transactions: transactions || [],
        recentUnlocks: recentUnlocks || [],
        stats: {
          unlockedCount: unlockedCount || 0,
          propertiesCount: propertiesCount || 0,
          referralsCount: referralsCount || 0
        }
      }
    };
  } catch (error) {
    console.error('Error getting full agent profile:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all renters/tenants with leads count
 * @param {object} filters - Filter options
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export const getAllRenters = async (filters = {}) => {
  try {
    const supabase = createClient();

    // Get tenants
    let query = supabase
      .from('users')
      .select('*')
      .eq('role', 'tenant');

    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    query = query.order('created_at', { ascending: false });

    const { data: users, error: usersError } = await query;

    if (usersError) throw usersError;

    if (!users || users.length === 0) {
      return { success: true, data: [] };
    }

    // Get all leads for these tenants
    const userIds = users.map(u => u.id);
    const { data: allLeads, error: leadsError } = await supabase
      .from('leads')
      .select('id, user_id, status, location, property_type, budget, created_at')
      .in('user_id', userIds);

    if (leadsError) {
      console.warn('Error fetching leads, continuing without:', leadsError);
    }

    // Group leads by user
    const leadsByUser = {};
    (allLeads || []).forEach(lead => {
      if (!leadsByUser[lead.user_id]) {
        leadsByUser[lead.user_id] = [];
      }
      leadsByUser[lead.user_id].push(lead);
    });

    // Transform data and calculate leads count
    const transformedData = users.map(user => {
      const userLeads = leadsByUser[user.id] || [];
      const activeLeads = userLeads.filter(l => l.status === 'active');
      const pausedLeads = userLeads.filter(l => l.status === 'paused');
      const expiredLeads = userLeads.filter(l => l.status === 'expired' || l.status === 'closed');

      // Get primary location from leads if user doesn't have one
      const leadLocations = userLeads.filter(l => l.location).map(l => l.location);
      const primaryLocation = user.location || user.city || (leadLocations.length > 0 ? leadLocations[0] : null);

      // Get latest lead info
      const sortedLeads = [...userLeads].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      const latestLead = sortedLeads[0];

      return {
        ...transformUserData(user),
        location: primaryLocation,
        leadsCount: userLeads.length,
        activeLeadsCount: activeLeads.length,
        pausedLeadsCount: pausedLeads.length,
        expiredLeadsCount: expiredLeads.length,
        latestLead: latestLead ? {
          id: latestLead.id,
          location: latestLead.location,
          propertyType: latestLead.property_type,
          status: latestLead.status,
          createdAt: latestLead.created_at
        } : null
      };
    });

    return { success: true, data: transformedData };
  } catch (error) {
    console.error('Error getting renters:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get full renter profile with activity and lead statistics
 * @param {string} renterId - Renter ID
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getFullRenterProfile = async (renterId) => {
  try {
    const supabase = createClient();

    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', renterId)
      .single();

    if (userError) throw userError;

    // Get posted leads with full details
    const { data: leads } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', renterId)
      .order('created_at', { ascending: false });

    // Get saved properties
    const { data: savedProps } = await supabase
      .from('saved_properties')
      .select('property_id, properties(*)')
      .eq('user_id', renterId);

    // Calculate lead statistics
    const allLeads = leads || [];
    const activeLeads = allLeads.filter(l => l.status === 'active');
    const pausedLeads = allLeads.filter(l => l.status === 'paused');
    const expiredLeads = allLeads.filter(l => l.status === 'expired' || l.status === 'closed');

    // Transform user data to camelCase
    const transformedUser = transformUserData(userData);

    return {
      success: true,
      data: {
        ...transformedUser,
        leads: allLeads,
        requests: allLeads, // Alias for backward compatibility
        savedProperties: savedProps?.map(sp => sp.properties) || [],
        leadsCount: allLeads.length,
        activeLeadsCount: activeLeads.length,
        pausedLeadsCount: pausedLeads.length,
        expiredLeadsCount: expiredLeads.length,
        stats: {
          totalLeads: allLeads.length,
          activeLeads: activeLeads.length,
          pausedLeads: pausedLeads.length,
          expiredLeads: expiredLeads.length,
          savedProperties: savedProps?.length || 0
        }
      }
    };
  } catch (error) {
    console.error('Error getting full renter profile:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// SUBSCRIPTION/BUNDLE MANAGEMENT (ADMIN)
// ============================================

/**
 * Get all subscriptions for admin view
 * @param {number} limitCount - Limit number of results
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export const getAllSubscriptions = async (limitCount = 50) => {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*, users(name, email)')
      .order('created_at', { ascending: false })
      .limit(limitCount);

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error getting all subscriptions:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// SUPPORT TICKET OPERATIONS
// ============================================

/**
 * Create support ticket
 * @param {object} ticketData - Ticket data
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const createSupportTicket = async (ticketData) => {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('support_tickets')
      .insert({
        user_id: ticketData.userId || ticketData.user_id,
        subject: ticketData.subject,
        message: ticketData.message,
        category: ticketData.category || 'general',
        priority: ticketData.priority || 'medium',
        status: 'open',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Also create a notification for the user
    await createNotification({
      user_id: ticketData.userId || ticketData.user_id,
      type: 'support',
      title: 'Support Ticket Created ⚙️',
      message: `Your ticket "${ticketData.subject}" has been submitted (#${data.id.substring(0, 8)}). We'll respond shortly.`,
      data: { ticketId: data.id, status: 'open' }
    });

    return { success: true, data };
  } catch (error) {
    console.error('Error creating support ticket:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all support tickets
 * @param {object} filters - Filter options
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export const getAllSupportTickets = async (filters = {}) => {
  try {
    const supabase = createClient();
    let query = supabase
      .from('support_tickets')
      .select('*, user:user_id(id, name, email, avatar)');

    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    if (filters.priority) {
      query = query.eq('priority', filters.priority);
    }
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }
    if (filters.assignedTo) {
      query = query.eq('assigned_to', filters.assignedTo);
    }
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error getting support tickets:', error);
    return { success: false, error: error.message, data: [] };
  }
};

/**
 * Update support ticket
 * @param {string} ticketId - Ticket ID
 * @param {object} updates - Fields to update
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateSupportTicket = async (ticketId, updates) => {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('support_tickets')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId);

    if (error) throw error;

    // Notify user about update if status changed
    if (updates.status) {
      // Get ticket info to find user
      const { data: ticket } = await supabase.from('support_tickets').select('user_id, subject').eq('id', ticketId).single();
      if (ticket) {
        await createNotification({
          user_id: ticket.user_id,
          type: 'support',
          title: 'Support Ticket Update ⚙️',
          message: `Your ticket "${ticket.subject}" has been updated to: ${updates.status.toUpperCase()}`,
          data: { ticketId, status: updates.status }
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating support ticket:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Resolve support ticket
 * @param {string} ticketId - Ticket ID
 * @param {string} resolutionNote - Resolution note
 * @param {string} resolvedBy - ID of admin resolving
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const resolveSupportTicket = async (ticketId, resolutionNote, resolvedBy) => {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('support_tickets')
      .update({
        status: 'resolved',
        resolution_note: resolutionNote,
        resolved_at: new Date().toISOString(),
        resolved_by: resolvedBy,
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error resolving support ticket:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// SYSTEM LOGS & CONFIGURATION
// ============================================

/**
 * Get activity logs for admin
 * @param {number} limitCount - Limit number of results
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export const getAllActivityLogs = async (limitCount = 50) => {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('credit_transactions')
      .select('*, users(name, email)')
      .order('created_at', { ascending: false })
      .limit(limitCount);

    if (error) throw error;

    const logs = data?.map(tx => ({
      id: tx.id,
      type: 'transaction',
      action: tx.type,
      description: tx.reason,
      user: tx.users?.name || tx.user_id,
      timestamp: tx.created_at,
      amount: tx.amount
    })) || [];

    return { success: true, data: logs };
  } catch (error) {
    console.error('Error getting activity logs:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// PLACEHOLDER FUNCTIONS (For features not yet in schema)
// ============================================

// These would be implemented if you add the respective tables later
/**
 * Get all credit bundles
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export const getAllCreditBundles = async () => {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('credit_bundles')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error getting credit bundles:', error);
    return { success: false, error: error.message, data: [] };
  }
};

/**
 * Get all credit bundles for admin (including inactive)
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export const getAllCreditBundlesAdmin = async () => {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('credit_bundles')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error getting credit bundles for admin:', error);
    return { success: false, error: error.message, data: [] };
  }
};

/**
 * Create a new credit bundle
 * @param {object} bundleData - Bundle data
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const createCreditBundle = async (bundleData) => {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('credit_bundles')
      .insert({
        name: bundleData.name,
        credits: bundleData.credits,
        price: bundleData.price,
        currency: bundleData.currency || 'KES',
        per_lead: bundleData.per_lead || bundleData.perLead,
        features: Array.isArray(bundleData.features) ? bundleData.features : [],
        popular: bundleData.popular || false,
        tag: bundleData.tag || null,
        is_active: true,
        sort_order: bundleData.sort_order || bundleData.sortOrder || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error creating credit bundle:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update a credit bundle
 * @param {string} bundleId - Bundle ID
 * @param {object} updates - Fields to update
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateCreditBundle = async (bundleId, updates) => {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('credit_bundles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', bundleId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error updating credit bundle:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete (deactivate) a credit bundle
 * @param {string} bundleId - Bundle ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteCreditBundle = async (bundleId) => {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('credit_bundles')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', bundleId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting credit bundle:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// SUBSCRIPTION PLANS
// ============================================

/**
 * Get all subscription plans
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export const getAllSubscriptionPlans = async () => {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error getting subscription plans:', error);
    return { success: false, error: error.message, data: [] };
  }
};

/**
 * Get all subscription plans for admin (including inactive)
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export const getAllSubscriptionPlansAdmin = async () => {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error getting subscription plans for admin:', error);
    return { success: false, error: error.message, data: [] };
  }
};

/**
 * Create a new subscription plan
 * @param {object} planData - Plan data
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const createSubscriptionPlan = async (planData) => {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('subscription_plans')
      .insert({
        name: planData.name,
        description: planData.description || null,
        price: planData.price,
        interval: planData.interval || 'monthly',
        features: Array.isArray(planData.features) ? planData.features : [],
        tag: planData.tag || null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error creating subscription plan:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update a subscription plan
 * @param {string} planId - Plan ID
 * @param {object} updates - Fields to update
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const updateSubscriptionPlan = async (planId, updates) => {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('subscription_plans')
      .update({
        ...updates,
        features: Array.isArray(updates.features) ? updates.features : [],
        updated_at: new Date().toISOString()
      })
      .eq('id', planId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error updating subscription plan:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete a subscription plan (soft delete - set is_active to false)
 * @param {string} planId - Plan ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteSubscriptionPlan = async (planId) => {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('subscription_plans')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', planId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting subscription plan:', error);
    return { success: false, error: error.message };
  }
};

export const getNotificationTemplates = async () => {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('notification_templates')
      .select('*')
      .order('type', { ascending: true });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error getting notification templates:', error);
    return { success: false, error: error.message, data: [] };
  }
};

export const createNotificationTemplate = async (templateData) => {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('notification_templates')
      .insert({
        name: templateData.name,
        type: templateData.type,
        subject: templateData.subject,
        body: templateData.body,
        variables: templateData.variables || [],
        send_email: templateData.sendEmail ?? true,
        send_push: templateData.sendPush ?? true,
        send_whatsapp: templateData.sendWhatsapp ?? false,
        is_active: templateData.isActive ?? true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error creating notification template:', error);
    return { success: false, error: error.message };
  }
};

export const updateNotificationTemplate = async (templateId, updates) => {
  try {
    const supabase = createClient();

    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.subject !== undefined) updateData.subject = updates.subject;
    if (updates.body !== undefined) updateData.body = updates.body;
    if (updates.variables !== undefined) updateData.variables = updates.variables;
    if (updates.sendEmail !== undefined) updateData.send_email = updates.sendEmail;
    if (updates.sendPush !== undefined) updateData.send_push = updates.sendPush;
    if (updates.sendWhatsapp !== undefined) updateData.send_whatsapp = updates.sendWhatsapp;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

    const { error } = await supabase
      .from('notification_templates')
      .update(updateData)
      .eq('id', templateId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error updating notification template:', error);
    return { success: false, error: error.message };
  }
};

export const deleteNotificationTemplate = async (templateId) => {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('notification_templates')
      .delete()
      .eq('id', templateId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting notification template:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// CHAT OPERATIONS - REMOVED
// ============================================
// Direct chat functionality has been removed to enforce
// the credit-based tenant-agent communication model.
// Agents must purchase credits to contact tenants through the lead system.
// Chat feature will be re-implemented with proper credit validation.

/**
 * Get system configuration
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getSystemConfig = async () => {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('system_config')
      .select('*');

    if (error) throw error;

    // Convert array of key-value pairs to object
    const config = {};
    (data || []).forEach(item => {
      // Handle JSONB value which might be string or object
      const value = typeof item.value === 'string' ? item.value : item.value;
      config[item.key] = value;
    });

    // Return with defaults for backwards compatibility
    return {
      success: true,
      data: {
        creditPrice: config.credit_price || 100,
        freeCredits: config.free_credits || 2,
        referralBonus: config.referral_bonus || 5,
        leadUnlockCost: config.lead_unlock_cost || 1,
        contactCosts: config.contact_costs || { phone: 3, email: 2, whatsapp: 2, view: 1 },
        inviteExpiryHours: config.invite_expiry_hours || 72,
        ...config
      }
    };
  } catch (error) {
    console.error('Error getting system config:', error);
    // Return defaults on error
    return {
      success: true,
      data: {
        creditPrice: 100,
        freeCredits: 2,
        referralBonus: 5,
        leadUnlockCost: 1,
        contactCosts: { phone: 3, email: 2, whatsapp: 2, view: 1 },
        inviteExpiryHours: 72
      }
    };
  }
};

/**
 * Update system configuration
 * @param {object} config - Configuration data (key-value pairs to update)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateSystemConfig = async (config) => {
  try {
    const supabase = createClient();

    // Update each config key
    for (const [key, value] of Object.entries(config)) {
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();

      const { error } = await supabase
        .from('system_config')
        .upsert({
          key: snakeKey,
          value: typeof value === 'object' ? value : String(value),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'key'
        });

      if (error) throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating system config:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// ADMIN MANAGEMENT OPERATIONS
// ============================================

/**
 * Get all admin users with optional filters
 * @param {object} filters - Filter options (search, role, status, parentAdminId)
 * @param {object} pagination - Pagination options (page, limit, sortBy, sortOrder)
 * @returns {Promise<{success: boolean, data?: array, total?: number, error?: string}>}
 */
export const getAdminUsers = async (filters = {}, pagination = {}) => {
  try {
    const supabase = createClient();
    const { search, role, status, parentAdminId, teamName } = filters;
    const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'desc' } = pagination;

    let query = supabase
      .from('admin_users')
      .select('*, parent_admin:parent_admin_id(id, name, email)', { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }
    if (role) {
      query = query.eq('role', role);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (parentAdminId) {
      query = query.eq('parent_admin_id', parentAdminId);
    }
    if (teamName) {
      query = query.eq('team_name', teamName);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      success: true,
      data: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    };
  } catch (error) {
    console.error('Error getting admin users:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get admin user by ID
 * @param {string} adminId - Admin user ID
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getAdminUser = async (adminId) => {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('admin_users')
      .select('*, parent_admin:parent_admin_id(id, name, email)')
      .eq('id', adminId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return { success: false, error: 'Admin not found' };

    return { success: true, data };
  } catch (error) {
    console.error('Error getting admin user:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get admin user by email
 * @param {string} email - Admin email
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getAdminUserByEmail = async (email) => {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error getting admin by email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create a new admin user
 * @param {object} adminData - Admin user data
 * @param {string} createdBy - ID of admin creating this user
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const createAdminUser = async (adminData, createdBy) => {
  try {
    const supabase = createClient();

    // Check if email already exists
    const existingAdmin = await getAdminUserByEmail(adminData.email);
    if (existingAdmin.data) {
      return { success: false, error: 'An admin with this email already exists' };
    }

    const { data, error } = await supabase
      .from('admin_users')
      .insert({
        email: adminData.email.toLowerCase(),
        name: adminData.name,
        role: adminData.role || 'sub_admin',
        custom_role_name: adminData.customRoleName || null,
        permissions: adminData.permissions || [],
        parent_admin_id: adminData.parentAdminId || null,
        team_name: adminData.teamName || null,
        status: 'invited',
        created_by: createdBy,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Log the action
    await logAdminActivity(createdBy, {
      action: 'created_admin',
      actionCategory: 'admin',
      description: `Created admin account for ${adminData.name} (${adminData.email})`,
      targetType: 'admin',
      targetId: data.id,
      targetName: adminData.name
    });

    return { success: true, data };
  } catch (error) {
    console.error('Error creating admin user:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update admin user
 * @param {string} adminId - Admin user ID
 * @param {object} updates - Fields to update
 * @param {string} updatedBy - ID of admin making the update
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateAdminUser = async (adminId, updates, updatedBy) => {
  try {
    const supabase = createClient();

    // Get current state for logging changes
    const { data: currentAdmin } = await getAdminUser(adminId);

    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    // If email is being updated, validate uniqueness
    if (updates.email && currentAdmin && updates.email !== currentAdmin.email) {
      const existingAdmin = await getAdminUserByEmail(updates.email);
      if (existingAdmin.data && existingAdmin.data.id !== adminId) {
        return { success: false, error: 'An admin with this email already exists' };
      }
      updateData.email = updates.email.toLowerCase();
    }

    const { error } = await supabase
      .from('admin_users')
      .update(updateData)
      .eq('id', adminId);

    if (error) throw error;

    // Log the action with changes
    const changes = {};
    if (currentAdmin) {
      Object.keys(updates).forEach(key => {
        if (JSON.stringify(currentAdmin[key]) !== JSON.stringify(updates[key])) {
          changes[key] = { old: currentAdmin[key], new: updates[key] };
        }
      });
    }

    await logAdminActivity(updatedBy, {
      action: 'updated_admin',
      actionCategory: 'admin',
      description: `Updated admin account: ${currentAdmin?.name || adminId}`,
      targetType: 'admin',
      targetId: adminId,
      targetName: currentAdmin?.name,
      changes
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating admin user:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Deactivate admin user
 * @param {string} adminId - Admin user ID
 * @param {string} deactivatedBy - ID of admin deactivating
 * @param {string} reason - Reason for deactivation
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deactivateAdminUser = async (adminId, deactivatedBy, reason = '') => {
  try {
    const supabase = createClient();

    const { data: admin } = await getAdminUser(adminId);

    const { error } = await supabase
      .from('admin_users')
      .update({
        status: 'inactive',
        deactivated_at: new Date().toISOString(),
        deactivated_by: deactivatedBy,
        deactivation_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', adminId);

    if (error) throw error;

    // Invalidate all sessions
    await revokeAllAdminSessions(adminId, deactivatedBy);

    // Log the action
    await logAdminActivity(deactivatedBy, {
      action: 'deactivated_admin',
      actionCategory: 'admin',
      description: `Deactivated admin account: ${admin?.name || adminId}. Reason: ${reason || 'Not specified'}`,
      targetType: 'admin',
      targetId: adminId,
      targetName: admin?.name
    });

    return { success: true };
  } catch (error) {
    console.error('Error deactivating admin user:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Reactivate admin user
 * @param {string} adminId - Admin user ID
 * @param {string} reactivatedBy - ID of admin reactivating
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const reactivateAdminUser = async (adminId, reactivatedBy) => {
  try {
    const supabase = createClient();

    const { data: admin } = await getAdminUser(adminId);

    const { error } = await supabase
      .from('admin_users')
      .update({
        status: 'active',
        deactivated_at: null,
        deactivated_by: null,
        deactivation_reason: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', adminId);

    if (error) throw error;

    await logAdminActivity(reactivatedBy, {
      action: 'reactivated_admin',
      actionCategory: 'admin',
      description: `Reactivated admin account: ${admin?.name || adminId}`,
      targetType: 'admin',
      targetId: adminId,
      targetName: admin?.name
    });

    return { success: true };
  } catch (error) {
    console.error('Error reactivating admin user:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete admin user (soft delete by deactivating)
 * @param {string} adminId - Admin user ID
 * @param {string} deletedBy - ID of admin deleting
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteAdminUser = async (adminId, deletedBy) => {
  // Soft delete = deactivate with status 'suspended'
  try {
    const supabase = createClient();

    const { data: admin } = await getAdminUser(adminId);

    const { error } = await supabase
      .from('admin_users')
      .update({
        status: 'suspended',
        deactivated_at: new Date().toISOString(),
        deactivated_by: deletedBy,
        deactivation_reason: 'Account deleted',
        updated_at: new Date().toISOString()
      })
      .eq('id', adminId);

    if (error) throw error;

    await revokeAllAdminSessions(adminId, deletedBy);

    await logAdminActivity(deletedBy, {
      action: 'deleted_admin',
      actionCategory: 'admin',
      description: `Deleted admin account: ${admin?.name || adminId}`,
      targetType: 'admin',
      targetId: adminId,
      targetName: admin?.name
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting admin user:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// ADMIN INVITE OPERATIONS
// ============================================

/**
 * Generate a secure invite token
 * @returns {string}
 */
const generateInviteToken = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

/**
 * Simple hash function for token (in production, use bcrypt)
 * @param {string} token
 * @returns {string}
 */
const hashToken = (token) => {
  // Simple hash - in production use crypto.createHash or bcrypt
  let hash = 0;
  for (let i = 0; i < token.length; i++) {
    const char = token.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
};

/**
 * Create admin invite
 * @param {string} adminUserId - ID of admin user being invited
 * @param {string} invitedBy - ID of admin sending invite
 * @param {object} options - Additional options (customMessage, expiresInHours)
 * @returns {Promise<{success: boolean, data?: object, token?: string, error?: string}>}
 */
export const createAdminInvite = async (adminUserId, invitedBy, options = {}) => {
  try {
    const supabase = createClient();
    const { customMessage, expiresInHours = 72 } = options;

    // Get admin user details
    const adminResult = await getAdminUser(adminUserId);
    if (!adminResult.success || !adminResult.data) {
      return { success: false, error: adminResult.error || 'Admin user not found' };
    }
    const adminUser = adminResult.data;

    // Expire any existing pending invites for this admin
    await supabase
      .from('admin_invites')
      .update({ status: 'expired' })
      .eq('admin_user_id', adminUserId)
      .eq('status', 'pending');

    // Generate new token
    const token = generateInviteToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    const { data, error } = await supabase
      .from('admin_invites')
      .insert({
        admin_user_id: adminUserId,
        token: token,
        token_hash: tokenHash,
        invited_by: invitedBy,
        invited_email: adminUser.email,
        custom_message: customMessage || null,
        expires_at: expiresAt.toISOString(),
        status: 'pending',
        sent_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    await logAdminActivity(invitedBy, {
      action: 'sent_invite',
      actionCategory: 'admin',
      description: `Sent invite to ${adminUser.name} (${adminUser.email})`,
      targetType: 'admin',
      targetId: adminUserId,
      targetName: adminUser.name
    });

    return { success: true, data, token };
  } catch (error) {
    console.error('Error creating admin invite:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Resend admin invite
 * @param {string} adminUserId - ID of admin user
 * @param {string} resentBy - ID of admin resending
 * @returns {Promise<{success: boolean, token?: string, error?: string}>}
 */
export const resendAdminInvite = async (adminUserId, resentBy) => {
  try {
    const supabase = createClient();

    // Get current invite
    const { data: currentInvite, error: findError } = await supabase
      .from('admin_invites')
      .select('*')
      .eq('admin_user_id', adminUserId)
      .eq('status', 'pending')
      .maybeSingle();

    if (findError) throw findError;

    // Generate new token
    const token = generateInviteToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 72);

    if (currentInvite) {
      // Update existing invite
      const { error } = await supabase
        .from('admin_invites')
        .update({
          token: token,
          token_hash: tokenHash,
          expires_at: expiresAt.toISOString(),
          resent_count: (currentInvite.resent_count || 0) + 1,
          last_resent_at: new Date().toISOString()
        })
        .eq('id', currentInvite.id);

      if (error) throw error;
    } else {
      // Create new invite
      return await createAdminInvite(adminUserId, resentBy);
    }

    const adminResult = await getAdminUser(adminUserId);
    const adminUser = adminResult.data;

    await logAdminActivity(resentBy, {
      action: 'resent_invite',
      actionCategory: 'admin',
      description: `Resent invite to ${adminUser?.name} (${adminUser?.email})`,
      targetType: 'admin',
      targetId: adminUserId,
      targetName: adminUser?.name
    });

    return { success: true, token };
  } catch (error) {
    console.error('Error resending admin invite:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Verify invite token
 * @param {string} token - Invite token
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const verifyAdminInvite = async (token) => {
  try {
    const supabase = createClient();

    const { data: invite, error } = await supabase
      .from('admin_invites')
      .select('*, admin_user:admin_user_id(*)')
      .eq('token', token)
      .eq('status', 'pending')
      .maybeSingle();

    if (error) throw error;
    if (!invite) {
      return { success: false, error: 'Invalid or expired invite' };
    }

    // Check expiration
    if (new Date(invite.expires_at) < new Date()) {
      // Mark as expired
      await supabase
        .from('admin_invites')
        .update({ status: 'expired' })
        .eq('id', invite.id);
      return { success: false, error: 'Invite has expired' };
    }

    return { success: true, data: invite };
  } catch (error) {
    console.error('Error verifying admin invite:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Accept admin invite and set password
 * @param {string} token - Invite token
 * @param {string} password - New password (hashed before storage)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const acceptAdminInvite = async (token, password) => {
  try {
    const supabase = createClient();

    // Verify token
    const verifyResult = await verifyAdminInvite(token);
    if (!verifyResult.success) {
      return verifyResult;
    }

    const invite = verifyResult.data;
    const adminUserId = invite.admin_user_id;

    // Update invite status
    await supabase
      .from('admin_invites')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', invite.id);

    // Update admin user status and password
    // Note: In production, use proper password hashing (bcrypt)
    const passwordHash = hashToken(password); // Replace with bcrypt.hash()

    await supabase
      .from('admin_users')
      .update({
        status: 'active',
        password_hash: passwordHash,
        password_set_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', adminUserId);

    await logAdminActivity(adminUserId, {
      action: 'accepted_invite',
      actionCategory: 'auth',
      description: `Accepted invite and activated account`,
      targetType: 'admin',
      targetId: adminUserId,
      targetName: invite.admin_user?.name
    });

    return { success: true, data: { adminUserId } };
  } catch (error) {
    console.error('Error accepting admin invite:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Revoke admin invite
 * @param {string} inviteId - Invite ID
 * @param {string} revokedBy - ID of admin revoking
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const revokeAdminInvite = async (inviteId, revokedBy) => {
  try {
    const supabase = createClient();

    const { data: invite, error: findError } = await supabase
      .from('admin_invites')
      .select('*, admin_user:admin_user_id(*)')
      .eq('id', inviteId)
      .maybeSingle();

    if (findError) throw findError;
    if (!invite) return { success: false, error: 'Invite not found' };

    const { error } = await supabase
      .from('admin_invites')
      .update({
        status: 'revoked',
        revoked_at: new Date().toISOString(),
        revoked_by: revokedBy
      })
      .eq('id', inviteId);

    if (error) throw error;

    await logAdminActivity(revokedBy, {
      action: 'revoked_invite',
      actionCategory: 'admin',
      description: `Revoked invite for ${invite.admin_user?.name} (${invite.invited_email})`,
      targetType: 'admin',
      targetId: invite.admin_user_id,
      targetName: invite.admin_user?.name
    });

    return { success: true };
  } catch (error) {
    console.error('Error revoking admin invite:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get invite for admin user
 * @param {string} adminUserId - Admin user ID
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getAdminInvite = async (adminUserId) => {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('admin_invites')
      .select('*')
      .eq('admin_user_id', adminUserId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error getting admin invite:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// ADMIN ACTIVITY LOG OPERATIONS
// ============================================

/**
 * Log admin activity
 * @param {string} adminUserId - ID of admin performing action
 * @param {object} logData - Log entry data
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const logAdminActivity = async (adminUserId, logData) => {
  try {
    const supabase = createClient();

    // Get admin email for record
    let adminEmail = 'unknown';
    if (adminUserId) {
      const { data: admin } = await getAdminUser(adminUserId);
      adminEmail = admin?.email || 'unknown';
    }

    const { error } = await supabase
      .from('admin_activity_logs')
      .insert({
        admin_user_id: adminUserId,
        admin_email: adminEmail,
        action: logData.action,
        action_category: logData.actionCategory,
        description: logData.description,
        target_type: logData.targetType || null,
        target_id: logData.targetId || null,
        target_name: logData.targetName || null,
        changes: logData.changes || null,
        metadata: logData.metadata || null,
        ip_address: logData.ipAddress || null,
        user_agent: logData.userAgent || null,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error logging admin activity:', error);
    }

    return { success: !error };
  } catch (error) {
    console.error('Error logging admin activity:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get admin activity logs
 * @param {object} filters - Filter options
 * @param {object} pagination - Pagination options
 * @returns {Promise<{success: boolean, data?: array, total?: number, error?: string}>}
 */
export const getAdminActivityLogs = async (filters = {}, pagination = {}) => {
  try {
    const supabase = createClient();
    const { adminUserId, action, actionCategory, targetType, startDate, endDate } = filters;
    const { page = 1, limit = 50, sortOrder = 'desc' } = pagination;

    let query = supabase
      .from('admin_activity_logs')
      .select('*, admin:admin_user_id(id, name, email, avatar)', { count: 'exact' });

    // Apply filters
    if (adminUserId) {
      query = query.eq('admin_user_id', adminUserId);
    }
    if (action) {
      query = query.eq('action', action);
    }
    if (actionCategory) {
      query = query.eq('action_category', actionCategory);
    }
    if (targetType) {
      query = query.eq('target_type', targetType);
    }
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    // Apply sorting and pagination
    query = query.order('created_at', { ascending: sortOrder === 'asc' });
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      success: true,
      data: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    };
  } catch (error) {
    console.error('Error getting admin activity logs:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// ADMIN SESSION OPERATIONS
// ============================================

/**
 * Create admin session
 * @param {string} adminUserId - Admin user ID
 * @param {object} sessionData - Session data (ipAddress, userAgent)
 * @returns {Promise<{success: boolean, token?: string, error?: string}>}
 */
export const createAdminSession = async (adminUserId, sessionData = {}) => {
  try {
    const supabase = createClient();

    const sessionToken = generateInviteToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour session

    const { error } = await supabase
      .from('admin_sessions')
      .insert({
        admin_user_id: adminUserId,
        session_token: sessionToken,
        ip_address: sessionData.ipAddress || null,
        user_agent: sessionData.userAgent || null,
        device_info: sessionData.deviceInfo || null,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString()
      });

    if (error) throw error;

    // Update admin last login
    await supabase
      .from('admin_users')
      .update({
        last_login_at: new Date().toISOString(),
        login_count: supabase.rpc ? undefined : 1, // Increment if RPC available
        updated_at: new Date().toISOString()
      })
      .eq('id', adminUserId);

    return { success: true, token: sessionToken };
  } catch (error) {
    console.error('Error creating admin session:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Revoke all admin sessions
 * @param {string} adminUserId - Admin user ID
 * @param {string} revokedBy - ID of admin revoking
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const revokeAllAdminSessions = async (adminUserId, revokedBy) => {
  try {
    const supabase = createClient();

    const { error } = await supabase
      .from('admin_sessions')
      .update({
        is_valid: false,
        revoked_at: new Date().toISOString(),
        revoked_by: revokedBy
      })
      .eq('admin_user_id', adminUserId)
      .eq('is_valid', true);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error revoking admin sessions:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// ADMIN PERMISSIONS OPERATIONS
// ============================================

/**
 * Get all available permissions
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export const getAdminPermissions = async () => {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('admin_permissions')
      .select('*')
      .order('category', { ascending: true });

    if (error) throw error;

    // Group by category
    const grouped = {};
    (data || []).forEach(perm => {
      if (!grouped[perm.category]) {
        grouped[perm.category] = [];
      }
      grouped[perm.category].push(perm);
    });

    return { success: true, data: data || [], grouped };
  } catch (error) {
    console.error('Error getting admin permissions:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if admin has permission
 * @param {string} adminId - Admin user ID
 * @param {string} permission - Permission name to check
 * @returns {Promise<boolean>}
 */
export const adminHasPermission = async (adminId, permission) => {
  try {
    const { data: admin } = await getAdminUser(adminId);
    if (!admin) return false;

    // Super admin has all permissions
    if (admin.role === 'super_admin') return true;

    // Check permissions array
    return Array.isArray(admin.permissions) && admin.permissions.includes(permission);
  } catch (error) {
    console.error('Error checking admin permission:', error);
    return false;
  }
};

/**
 * Get all unique team names
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export const getAdminTeams = async () => {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('admin_users')
      .select('team_name')
      .not('team_name', 'is', null);

    if (error) throw error;

    // Get unique team names
    const teams = [...new Set((data || []).map(d => d.team_name).filter(Boolean))];
    return { success: true, data: teams };
  } catch (error) {
    console.error('Error getting admin teams:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get admin statistics
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getAdminStats = async () => {
  try {
    const supabase = createClient();

    // Get counts by status
    const { data: statusCounts, error: statusError } = await supabase
      .from('admin_users')
      .select('status');

    if (statusError) throw statusError;

    const stats = {
      total: statusCounts?.length || 0,
      active: statusCounts?.filter(a => a.status === 'active').length || 0,
      invited: statusCounts?.filter(a => a.status === 'invited').length || 0,
      inactive: statusCounts?.filter(a => a.status === 'inactive').length || 0,
      suspended: statusCounts?.filter(a => a.status === 'suspended').length || 0
    };

    // Get counts by role
    const { data: roleCounts, error: roleError } = await supabase
      .from('admin_users')
      .select('role')
      .neq('status', 'suspended');

    if (!roleError && roleCounts) {
      stats.superAdmins = roleCounts.filter(a => a.role === 'super_admin').length;
      stats.mainAdmins = roleCounts.filter(a => a.role === 'main_admin').length;
      stats.subAdmins = roleCounts.filter(a => a.role === 'sub_admin').length;
    }

    return { success: true, data: stats };
  } catch (error) {
    console.error('Error getting admin stats:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// LEAD-AGENT CONNECTIONS
// ============================================

/**
 * Check if an agent has already connected to a lead
 * @param {string} leadId - Lead ID
 * @param {string} agentId - Agent ID
 * @returns {Promise<{success: boolean, connected?: boolean, data?: object, error?: string}>}
 */
export const checkAgentLeadConnection = async (leadId, agentId) => {
  try {
    if (!leadId || !agentId) return { success: true, connected: false };

    const supabase = createClient();

    // 1. First check contact_history (primary source of truth for unlocks)
    // This is more reliable as it's always written to during unlock
    const { data: history, error: historyError } = await supabase
      .from('contact_history')
      .select('id, contact_type')
      .eq('lead_id', leadId)
      .eq('agent_id', agentId)
      .in('contact_type', ['unlock', 'exclusive'])
      .limit(1);

    if (!historyError && history && history.length > 0) {
      return { success: true, connected: true };
    }

    // 2. Fallback to lead_agent_connections table (if it exists)
    try {
      const { data, error } = await supabase
        .from('lead_agent_connections')
        .select('id')
        .eq('lead_id', leadId)
        .eq('agent_id', agentId)
        .maybeSingle();

      if (!error && data) {
        return { success: true, connected: true };
      }
    } catch (connTableError) {
      // Table might not exist, which is fine - we already checked contact_history
      console.log('lead_agent_connections table check failed, using contact_history only');
    }

    return { success: true, connected: false };
  } catch (error) {
    console.error('Error checking agent-lead connection:', error);
    // Return false rather than error to not block UI
    return { success: true, connected: false };
  }
};

/**
 * Connect/Accept a lead (agent action)
 * @param {string} leadId - Lead ID
 * @param {string} agentId - Agent ID
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const acceptLead = async (leadId, agentId) => {
  try {
    const supabase = createClient();

    // Check if already connected
    const { data: existing } = await supabase
      .from('lead_agent_connections')
      .select('id, status')
      .eq('lead_id', leadId)
      .eq('agent_id', agentId)
      .single();

    if (existing) {
      // Update existing connection
      const { data, error } = await supabase
        .from('lead_agent_connections')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    }

    // Create new connection
    const { data, error } = await supabase
      .from('lead_agent_connections')
      .insert([{
        lead_id: leadId,
        agent_id: agentId,
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    // Get lead details and agent name for notification
    const [leadRes, agentRes] = await Promise.all([
      supabase.from('leads').select('user_id, location').eq('id', leadId).single(),
      supabase.from('users').select('name').eq('id', agentId).single()
    ]);

    const lead = leadRes.data;
    const agent = agentRes.data;

    // Notify the tenant that an agent has shown interest
    if (lead?.user_id && agent?.name) {
      await createNotification({
        user_id: lead.user_id,
        type: 'agent_interested',
        title: 'An Agent is Interested! ✨',
        message: `${agent.name} is interested in your rental request in ${lead.location}.`,
        data: { leadId, agentName: agent.name }
      });
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error accepting lead:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Record that agent contacted the lead
 * @param {string} leadId - Lead ID
 * @param {string} agentId - Agent ID
 * @param {string} notes - Optional contact notes
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const recordLeadContact = async (leadId, agentId, notes = '') => {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('lead_agent_connections')
      .update({
        status: 'contacted',
        first_contact_at: new Date().toISOString(),
        last_contact_at: new Date().toISOString(),
        contact_count: 1,
        agent_notes: notes,
        updated_at: new Date().toISOString()
      })
      .eq('lead_id', leadId)
      .eq('agent_id', agentId)
      .eq('status', 'accepted')
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error recording lead contact:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all agents connected to a lead (from contact_history)
 * @param {string} leadId - Lead ID
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export const getLeadConnections = async (leadId) => {
  try {
    const supabase = createClient();

    // First try the lead_agent_connections table
    const { data: connectionData, error: connectionError } = await supabase
      .from('lead_agent_connections')
      .select(`
        *,
        agent:agent_id (
          id, name, email, phone, avatar, agency_name, verification_status
        )
      `)
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });

    // Also get data from contact_history for agents who unlocked the lead
    const { data: historyData, error: historyError } = await supabase
      .from('contact_history')
      .select(`
        id,
        agent_id,
        lead_id,
        contact_type,
        cost_credits,
        created_at,
        agent:users!contact_history_agent_id_fkey (
          id, name, email, phone, avatar, agency_name, verification_status
        )
      `)
      .eq('lead_id', leadId)
      .in('contact_type', ['phone_unlock', 'exclusive_unlock', 'unlock'])
      .order('created_at', { ascending: false });

    // Merge both data sources, removing duplicates by agent_id
    const agentMap = new Map();

    // Add from lead_agent_connections
    (connectionData || []).forEach(conn => {
      if (conn.agent_id && !agentMap.has(conn.agent_id)) {
        agentMap.set(conn.agent_id, {
          ...conn,
          source: 'connection',
          unlockCost: conn.cost || 0
        });
      }
    });

    // Add from contact_history
    (historyData || []).forEach(hist => {
      if (hist.agent_id && !agentMap.has(hist.agent_id)) {
        agentMap.set(hist.agent_id, {
          id: hist.id,
          agent_id: hist.agent_id,
          lead_id: hist.lead_id,
          agent: hist.agent,
          created_at: hist.created_at,
          contact_type: hist.contact_type,
          unlockCost: hist.cost_credits || 0,
          is_exclusive: hist.contact_type === 'exclusive_unlock',
          source: 'history'
        });
      }
    });

    return { success: true, data: Array.from(agentMap.values()) };
  } catch (error) {
    console.error('Error getting lead connections:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all leads an agent has connected to
 * @param {string} agentId - Agent ID
 * @param {object} filters - Optional filters { status }
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export const getAgentConnectedLeads = async (agentId, filters = {}) => {
  try {
    const supabase = createClient();

    // Query contact_history to get all leads the agent has ACTUALLY UNLOCKED (paid for)
    // Exclude 'browse' and 'view' entries which are just views, not purchases
    let query = supabase
      .from('contact_history')
      .select(`
        id,
        lead_id,
        contact_type,
        cost_credits,
        created_at,
        lead:leads (
          id,
          tenant_name,
          tenant_email,
          tenant_phone,
          location,
          property_type,
          budget,
          bedrooms,
          status,
          created_at,
          requirements,
          external_source,
          is_external,
          contacts
        )
      `)
      .eq('agent_id', agentId)
      .in('contact_type', ['unlock', 'exclusive']) // Only actual purchases, not views
      .order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    // Deduplicate by lead_id (agent might have multiple contact events for same lead)
    const uniqueLeads = [];
    const seenLeadIds = new Set();

    for (const item of (data || [])) {
      if (item.lead_id && !seenLeadIds.has(item.lead_id)) {
        seenLeadIds.add(item.lead_id);
        uniqueLeads.push({
          ...item,
          status: item.contact_type || 'contacted', // Use contact_type as status
        });
      }
    }

    return { success: true, data: uniqueLeads };
  } catch (error) {
    console.error('Error getting agent connected leads:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update lead connection outcome
 * @param {string} connectionId - Connection ID
 * @param {string} outcome - Outcome (converted, lost, etc)
 * @param {string} notes - Optional notes
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const updateLeadOutcome = async (connectionId, outcome, notes = '') => {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('lead_agent_connections')
      .update({
        status: outcome === 'converted' ? 'converted' : 'lost',
        outcome,
        outcome_notes: notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', connectionId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error updating lead outcome:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// ============================================
// EXTERNAL LEADS
// ============================================

/**
 * Get external leads (from Zapier/Ads)
 * @param {object} filters - Optional filters
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export const getExternalLeads = async (filters = {}) => {
  try {
    const supabase = createClient();

    let query = supabase
      .from('leads')
      .select('*')
      .eq('is_external', true)
      .order('created_at', { ascending: false });

    if (filters.source) {
      query = query.eq('external_source', filters.source);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error getting external leads:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get external lead logs for tracking
 * @param {object} filters - Optional filters { leadId, source, startDate, endDate }
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export const getExternalLeadLogs = async (filters = {}) => {
  try {
    const supabase = createClient();

    let query = supabase
      .from('external_lead_logs')
      .select(`
        *,
        lead:lead_id (
          id, tenant_name, status, created_at
        )
      `)
      .order('created_at', { ascending: false });

    if (filters.leadId) {
      query = query.eq('lead_id', filters.leadId);
    }
    if (filters.source) {
      query = query.eq('source', filters.source);
    }
    if (filters.campaignId) {
      query = query.eq('campaign_id', filters.campaignId);
    }
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error getting external lead logs:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get lead source analytics
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getLeadSourceAnalytics = async () => {
  try {
    const supabase = createClient();

    // Get all leads grouped by source
    const { data: leads, error } = await supabase
      .from('leads')
      .select('source, external_source, status, created_at');

    if (error) throw error;

    // Calculate analytics
    const analytics = {
      total: leads?.length || 0,
      bySource: {},
      byStatus: {},
      external: {
        total: 0,
        google_ads: 0,
        facebook_ads: 0,
        zapier: 0,
        other: 0
      }
    };

    leads?.forEach(lead => {
      // By source
      const source = lead.source || 'platform';
      analytics.bySource[source] = (analytics.bySource[source] || 0) + 1;

      // By status
      const status = lead.status || 'new';
      analytics.byStatus[status] = (analytics.byStatus[status] || 0) + 1;

      // External breakdown
      if (lead.external_source) {
        analytics.external.total++;
        const extSource = lead.external_source;
        if (analytics.external[extSource] !== undefined) {
          analytics.external[extSource]++;
        } else {
          analytics.external.other++;
        }
      }
    });

    return { success: true, data: analytics };
  } catch (error) {
    console.error('Error getting lead source analytics:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// AGENT RATINGS & REVIEWS
// ============================================

/**
 * Transform rating data from snake_case to camelCase
 */
const transformRatingData = (rating) => {
  if (!rating) return null;

  return {
    id: rating.id,
    agentId: rating.agent_id,
    tenantId: rating.tenant_id,
    leadId: rating.lead_id,
    rating: rating.rating,
    reviewText: rating.review_text,
    responsivenessRating: rating.responsiveness_rating,
    professionalismRating: rating.professionalism_rating,
    helpfulnessRating: rating.helpfulness_rating,
    status: rating.status,
    createdAt: rating.created_at,
    updatedAt: rating.updated_at,
    // Include tenant info if joined
    tenantName: rating.tenant?.name || rating.tenant_name,
    tenantAvatar: rating.tenant?.avatar || rating.tenant_avatar
  };
};

/**
 * Submit a rating for an agent
 * @param {Object} ratingData - Rating information
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const submitAgentRating = async (ratingData) => {
  try {
    const supabase = createClient();

    const { agentId, tenantId, leadId, rating, reviewText, responsivenessRating, professionalismRating, helpfulnessRating } = ratingData;

    // Validate required fields
    if (!agentId || !tenantId || !rating) {
      return { success: false, error: 'Agent ID, tenant ID, and rating are required' };
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return { success: false, error: 'Rating must be between 1 and 5' };
    }

    // Check if tenant can rate this agent
    const eligibility = await canTenantRateAgent(tenantId, agentId, leadId);
    if (!eligibility.success || !eligibility.data.canRate) {
      return {
        success: false,
        error: eligibility.data?.reason || 'You are not eligible to rate this agent'
      };
    }

    // Insert the rating
    const { data, error } = await supabase
      .from('agent_ratings')
      .insert({
        agent_id: agentId,
        tenant_id: tenantId,
        lead_id: leadId || null,
        rating: rating,
        review_text: reviewText || null,
        responsiveness_rating: responsivenessRating || null,
        professionalism_rating: professionalismRating || null,
        helpfulness_rating: helpfulnessRating || null,
        status: 'published'
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique violation
        return { success: false, error: 'You have already rated this agent' };
      }
      throw error;
    }

    return { success: true, data: transformRatingData(data) };
  } catch (error) {
    console.error('Error submitting agent rating:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if a tenant can rate an agent
 * @param {string} tenantId - Tenant's user ID
 * @param {string} agentId - Agent's user ID
 * @param {string} leadId - Optional lead ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const canTenantRateAgent = async (tenantId, agentId, leadId = null) => {
  try {
    const supabase = createClient();

    // Check if agent has contacted any of tenant's leads
    const { data: contacts, error: contactError } = await supabase
      .from('contact_history')
      .select('id, lead_id')
      .eq('agent_id', agentId)
      .in('lead_id',
        supabase
          .from('leads')
          .select('id')
          .eq('user_id', tenantId)
      );

    // Alternative: Direct query if subquery doesn't work
    const { data: tenantLeads } = await supabase
      .from('leads')
      .select('id')
      .eq('user_id', tenantId);

    const leadIds = tenantLeads?.map(l => l.id) || [];

    const { data: hasContact } = await supabase
      .from('contact_history')
      .select('id')
      .eq('agent_id', agentId)
      .in('lead_id', leadIds)
      .limit(1);

    const contactExists = hasContact && hasContact.length > 0;

    // Check if already rated
    let ratingQuery = supabase
      .from('agent_ratings')
      .select('id')
      .eq('agent_id', agentId)
      .eq('tenant_id', tenantId);

    if (leadId) {
      ratingQuery = ratingQuery.eq('lead_id', leadId);
    }

    const { data: existingRating } = await ratingQuery.limit(1);
    const alreadyRated = existingRating && existingRating.length > 0;

    let reason = null;
    if (alreadyRated) {
      reason = 'You have already rated this agent';
    } else if (!contactExists) {
      reason = 'You can only rate agents who have contacted you about your rental request';
    }

    return {
      success: true,
      data: {
        canRate: contactExists && !alreadyRated,
        hasContact: contactExists,
        alreadyRated: alreadyRated,
        reason: reason
      }
    };
  } catch (error) {
    console.error('Error checking rating eligibility:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all ratings for an agent
 * @param {string} agentId - Agent's user ID
 * @param {Object} options - Query options
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const getAgentRatings = async (agentId, options = {}) => {
  try {
    const supabase = createClient();

    const { limit = 10, offset = 0, includeHidden = false } = options;

    let query = supabase
      .from('agent_ratings')
      .select(`
        *,
        tenant:users!agent_ratings_tenant_id_fkey(id, name, avatar)
      `)
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (!includeHidden) {
      query = query.eq('status', 'published');
    }

    const { data, error } = await query;

    if (error) throw error;

    const transformedRatings = data?.map(rating => ({
      ...transformRatingData(rating),
      tenantName: rating.tenant?.name,
      tenantAvatar: rating.tenant?.avatar
    })) || [];

    return { success: true, data: transformedRatings };
  } catch (error) {
    console.error('Error getting agent ratings:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get agent rating summary (average, total, breakdown)
 * @param {string} agentId - Agent's user ID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getAgentRatingSummary = async (agentId) => {
  try {
    const supabase = createClient();

    const { data: user, error } = await supabase
      .from('users')
      .select('average_rating, total_ratings, rating_breakdown')
      .eq('id', agentId)
      .single();

    if (error) throw error;

    return {
      success: true,
      data: {
        averageRating: parseFloat(user.average_rating) || 0,
        totalRatings: user.total_ratings || 0,
        ratingBreakdown: user.rating_breakdown || { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
      }
    };
  } catch (error) {
    console.error('Error getting agent rating summary:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update a rating (by the tenant who created it)
 * @param {string} ratingId - Rating ID
 * @param {string} tenantId - Tenant's user ID (for verification)
 * @param {Object} updates - Fields to update
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const updateAgentRating = async (ratingId, tenantId, updates) => {
  try {
    const supabase = createClient();

    const allowedFields = ['rating', 'review_text', 'responsiveness_rating', 'professionalism_rating', 'helpfulness_rating'];

    const updateData = {};
    if (updates.rating !== undefined) {
      if (updates.rating < 1 || updates.rating > 5) {
        return { success: false, error: 'Rating must be between 1 and 5' };
      }
      updateData.rating = updates.rating;
    }
    if (updates.reviewText !== undefined) updateData.review_text = updates.reviewText;
    if (updates.responsivenessRating !== undefined) updateData.responsiveness_rating = updates.responsivenessRating;
    if (updates.professionalismRating !== undefined) updateData.professionalism_rating = updates.professionalismRating;
    if (updates.helpfulnessRating !== undefined) updateData.helpfulness_rating = updates.helpfulnessRating;

    const { data, error } = await supabase
      .from('agent_ratings')
      .update(updateData)
      .eq('id', ratingId)
      .eq('tenant_id', tenantId) // Ensure only owner can update
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return { success: false, error: 'Rating not found or you do not have permission to update it' };
    }

    return { success: true, data: transformRatingData(data) };
  } catch (error) {
    console.error('Error updating agent rating:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete a rating (soft delete by setting status to 'removed')
 * @param {string} ratingId - Rating ID
 * @param {string} userId - User ID (tenant or admin)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const deleteAgentRating = async (ratingId, userId) => {
  try {
    const supabase = createClient();

    // Check if user is admin or the tenant who created the rating
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    const isAdmin = ['admin', 'super_admin', 'main_admin'].includes(user?.role);

    let query = supabase
      .from('agent_ratings')
      .update({ status: 'removed' })
      .eq('id', ratingId);

    if (!isAdmin) {
      query = query.eq('tenant_id', userId);
    }

    const { data, error } = await query.select().single();

    if (error) throw error;

    if (!data) {
      return { success: false, error: 'Rating not found or you do not have permission to delete it' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting agent rating:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get agents that a tenant can rate (agents who contacted their leads but haven't been rated yet)
 * @param {string} tenantId - Tenant's user ID
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const getAgentsPendingRating = async (tenantId) => {
  try {
    const supabase = createClient();

    // Get all leads for this tenant
    const { data: leads } = await supabase
      .from('leads')
      .select('id')
      .eq('user_id', tenantId);

    if (!leads || leads.length === 0) {
      return { success: true, data: [] };
    }

    const leadIds = leads.map(l => l.id);

    // Get all agents who contacted these leads
    const { data: contacts } = await supabase
      .from('contact_history')
      .select(`
        agent_id,
        lead_id,
        contacted_at,
        agent:users!contact_history_agent_id_fkey(id, name, avatar, agency_name, average_rating, total_ratings)
      `)
      .in('lead_id', leadIds)
      .order('contacted_at', { ascending: false });

    if (!contacts || contacts.length === 0) {
      return { success: true, data: [] };
    }

    // Get ratings this tenant has already given
    const { data: existingRatings } = await supabase
      .from('agent_ratings')
      .select('agent_id')
      .eq('tenant_id', tenantId);

    const ratedAgentIds = new Set(existingRatings?.map(r => r.agent_id) || []);

    // Filter to agents not yet rated and deduplicate
    const uniqueAgents = new Map();
    contacts.forEach(contact => {
      if (!ratedAgentIds.has(contact.agent_id) && contact.agent && !uniqueAgents.has(contact.agent_id)) {
        uniqueAgents.set(contact.agent_id, {
          agentId: contact.agent_id,
          leadId: contact.lead_id,
          contactedAt: contact.contacted_at,
          name: contact.agent.name,
          avatar: contact.agent.avatar,
          agencyName: contact.agent.agency_name,
          averageRating: contact.agent.average_rating,
          totalRatings: contact.agent.total_ratings
        });
      }
    });

    return { success: true, data: Array.from(uniqueAgents.values()) };
  } catch (error) {
    console.error('Error getting agents pending rating:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Admin: Flag a rating for review
 * @param {string} ratingId - Rating ID
 * @param {string} reason - Reason for flagging
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const flagAgentRating = async (ratingId, reason) => {
  try {
    const supabase = createClient();

    const { error } = await supabase
      .from('agent_ratings')
      .update({
        status: 'flagged',
        // Store flag reason in a metadata field if needed
      })
      .eq('id', ratingId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error flagging rating:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Admin: Get all ratings (with filters)
 * @param {Object} filters - Filter options
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const getAllRatings = async (filters = {}) => {
  try {
    const supabase = createClient();

    const { status, agentId, tenantId, minRating, maxRating, limit = 50, offset = 0 } = filters;

    let query = supabase
      .from('agent_ratings')
      .select(`
        *,
        agent:users!agent_ratings_agent_id_fkey(id, name, avatar, agency_name),
        tenant:users!agent_ratings_tenant_id_fkey(id, name, avatar)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);
    if (agentId) query = query.eq('agent_id', agentId);
    if (tenantId) query = query.eq('tenant_id', tenantId);
    if (minRating) query = query.gte('rating', minRating);
    if (maxRating) query = query.lte('rating', maxRating);

    const { data, error } = await query;

    if (error) throw error;

    const transformedRatings = data?.map(rating => ({
      ...transformRatingData(rating),
      agentName: rating.agent?.name,
      agentAvatar: rating.agent?.avatar,
      agentAgency: rating.agent?.agency_name,
      tenantName: rating.tenant?.name,
      tenantAvatar: rating.tenant?.avatar
    })) || [];

    return { success: true, data: transformedRatings };
  } catch (error) {
    console.error('Error getting all ratings:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// BAD LEAD REPORTING SYSTEM
// ============================================

/**
 * Report a bad lead (agent action)
 * Agents can report leads that are unreachable, fake, or already closed
 * @param {string} agentId - Agent ID
 * @param {string} leadId - Lead ID
 * @param {string} reason - Reason for report ('unreachable', 'fake_number', 'already_closed', 'wrong_info', 'other')
 * @param {string} details - Additional details
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const reportBadLead = async (agentId, leadId, reason, details = '') => {
  try {
    const supabase = createClient();

    // 1. Verify agent has unlocked this lead
    const { data: connection, error: connError } = await supabase
      .from('contact_history')
      .select('id, cost_credits, created_at')
      .eq('agent_id', agentId)
      .eq('lead_id', leadId)
      .in('contact_type', ['unlock', 'exclusive'])
      .maybeSingle();

    if (connError) throw connError;

    if (!connection) {
      return { success: false, error: 'You can only report leads you have unlocked.' };
    }

    // 2. Check if already reported
    const { data: existingReport } = await supabase
      .from('bad_lead_reports')
      .select('id, status')
      .eq('agent_id', agentId)
      .eq('lead_id', leadId)
      .maybeSingle();

    if (existingReport) {
      return { success: false, error: `You have already reported this lead. Status: ${existingReport.status}` };
    }

    // 3. Check if within reporting window (24 hours of unlock)
    const unlockTime = new Date(connection.created_at).getTime();
    const now = Date.now();
    const hoursSinceUnlock = (now - unlockTime) / (1000 * 60 * 60);

    if (hoursSinceUnlock > 24) {
      return { success: false, error: 'You can only report a lead within 24 hours of unlocking it.' };
    }

    // 4. Create the report
    const { data: report, error: insertError } = await supabase
      .from('bad_lead_reports')
      .insert({
        agent_id: agentId,
        lead_id: leadId,
        reason,
        details,
        credits_paid: connection.cost_credits || 0,
        status: 'pending', // pending, approved, rejected
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // 5. Notify admin
    await createNotification({
      user_id: 'admin', // Special admin notification
      type: 'bad_lead_report',
      title: '⚠️ Bad Lead Report',
      message: `An agent has reported lead #${leadId.slice(0, 8)} as "${reason}".`,
      data: { reportId: report.id, leadId, agentId, reason }
    });

    return { success: true, data: report, message: 'Report submitted. Our team will review and refund if applicable.' };
  } catch (error) {
    console.error('Error reporting bad lead:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all bad lead reports (admin)
 * @param {object} filters - Filter options
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export const getBadLeadReports = async (filters = {}) => {
  try {
    const supabase = createClient();
    const { status, limit = 50, offset = 0 } = filters;

    let query = supabase
      .from('bad_lead_reports')
      .select(`
        *,
        agent:users!bad_lead_reports_agent_id_fkey(id, name, email, phone, avatar),
        lead:leads!bad_lead_reports_lead_id_fkey(id, tenant_name, tenant_phone, location, property_type, budget)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);

    const { data, error } = await query;

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error getting bad lead reports:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Approve bad lead report and refund credits (admin action)
 * @param {string} reportId - Report ID
 * @param {string} adminId - Admin ID (for audit)
 * @param {string} adminNotes - Optional admin notes
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const approveBadLeadReport = async (reportId, adminId, adminNotes = '') => {
  try {
    const supabase = createClient();

    // 1. Get the report
    const { data: report, error: fetchError } = await supabase
      .from('bad_lead_reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (fetchError) throw fetchError;

    if (!report) {
      return { success: false, error: 'Report not found.' };
    }

    if (report.status !== 'pending') {
      return { success: false, error: `Report has already been ${report.status}.` };
    }

    // 2. Refund credits to agent
    const refundAmount = report.credits_paid || 0;
    if (refundAmount > 0) {
      const refundResult = await addCredits(report.agent_id, refundAmount, `Refund: Bad Lead Report #${reportId.slice(0, 8)}`);
      if (!refundResult.success) {
        return { success: false, error: 'Failed to process refund: ' + refundResult.error };
      }
    }

    // 3. Update report status
    const { error: updateError } = await supabase
      .from('bad_lead_reports')
      .update({
        status: 'approved',
        resolved_by: adminId,
        resolved_at: new Date().toISOString(),
        admin_notes: adminNotes,
        refunded_amount: refundAmount
      })
      .eq('id', reportId);

    if (updateError) throw updateError;

    // 4. Notify agent
    await createNotification({
      user_id: report.agent_id,
      type: 'bad_lead_approved',
      title: '✅ Refund Approved',
      message: `Your report for lead was verified. ${refundAmount} credits have been refunded to your wallet.`,
      data: { reportId, refundAmount }
    });

    // 5. Log admin activity
    await supabase.from('admin_activity_logs').insert({
      admin_id: adminId,
      action: 'approve_bad_lead_report',
      target_type: 'bad_lead_report',
      target_id: reportId,
      details: { agentId: report.agent_id, leadId: report.lead_id, refundAmount, adminNotes },
      created_at: new Date().toISOString()
    });

    return { success: true, refundAmount };
  } catch (error) {
    console.error('Error approving bad lead report:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Reject bad lead report (admin action)
 * @param {string} reportId - Report ID
 * @param {string} adminId - Admin ID (for audit)
 * @param {string} rejectionReason - Reason for rejection
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const rejectBadLeadReport = async (reportId, adminId, rejectionReason) => {
  try {
    const supabase = createClient();

    // 1. Get the report
    const { data: report, error: fetchError } = await supabase
      .from('bad_lead_reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (fetchError) throw fetchError;

    if (!report) {
      return { success: false, error: 'Report not found.' };
    }

    if (report.status !== 'pending') {
      return { success: false, error: `Report has already been ${report.status}.` };
    }

    // 2. Update report status
    const { error: updateError } = await supabase
      .from('bad_lead_reports')
      .update({
        status: 'rejected',
        resolved_by: adminId,
        resolved_at: new Date().toISOString(),
        admin_notes: rejectionReason
      })
      .eq('id', reportId);

    if (updateError) throw updateError;

    // 3. Notify agent
    await createNotification({
      user_id: report.agent_id,
      type: 'bad_lead_rejected',
      title: '❌ Report Not Approved',
      message: `Your report was reviewed but not approved. Reason: ${rejectionReason}`,
      data: { reportId, rejectionReason }
    });

    // 4. Log admin activity
    await supabase.from('admin_activity_logs').insert({
      admin_id: adminId,
      action: 'reject_bad_lead_report',
      target_type: 'bad_lead_report',
      target_id: reportId,
      details: { agentId: report.agent_id, leadId: report.lead_id, rejectionReason },
      created_at: new Date().toISOString()
    });

    return { success: true };
  } catch (error) {
    console.error('Error rejecting bad lead report:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get agent's bad lead reports
 * @param {string} agentId - Agent ID
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export const getAgentBadLeadReports = async (agentId) => {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('bad_lead_reports')
      .select(`
        *,
        lead:leads!bad_lead_reports_lead_id_fkey(id, tenant_name, location, property_type)
      `)
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error getting agent bad lead reports:', error);
    return { success: false, error: error.message };
  }
};
