import { createClient } from '@/utils/supabase/client';

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
    
    // Generate referral code
    const referralCode = nameStr.substring(0, 3).toUpperCase() + 
                        Math.floor(1000 + Math.random() * 9000);

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

    // Process referral if provided
    if (userData.referredBy) {
      await processReferral(userId, userData.referredBy);
    }

    return { success: true };
  } catch (error) {
    console.error('Error creating user:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Process referral code
 * @param {string} newUserId - New user ID
 * @param {string} referralCode - Referral code
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const processReferral = async (newUserId, referralCode) => {
  try {
    const supabase = createClient();

    // Find referrer by referral code
    const { data: referrer, error: findError } = await supabase
      .from('users')
      .select('id')
      .eq('referral_code', referralCode)
      .single();

    if (findError || !referrer) {
      return { success: false, error: 'Invalid referral code' };
    }

    const referrerId = referrer.id;

    // Award credits to referrer (5 credits)
    await addCredits(referrerId, 5, 'Referral Bonus');

    // Record referral
    await supabase.from('referrals').insert({
      referrer_id: referrerId,
      referred_user_id: newUserId,
      credits_awarded: 5,
      status: 'completed',
      created_at: new Date().toISOString()
    });

    // Award welcome bonus to new user (2 credits)
    await addCredits(newUserId, 2, 'Welcome Bonus');

    return { success: true };
  } catch (error) {
    console.error('Error processing referral:', error);
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
  return await addCredits(agentId, credits, reason);
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
    const { data, error } = await supabase
      .from('leads')
      .insert({
        ...leadData,
        status: 'active',
        views: 0,
        contacts: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
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
    return { success: false, error: error.message };
  }
};

/**
 * Increment lead view count
 * @param {string} leadId - Lead ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const incrementLeadViews = async (leadId) => {
  try {
    const supabase = createClient();
    
    // Get current views
    const { data: lead } = await supabase
      .from('leads')
      .select('views')
      .eq('id', leadId)
      .single();

    const newViews = (lead?.views || 0) + 1;

    const { error } = await supabase
      .from('leads')
      .update({ views: newViews })
      .eq('id', leadId);

    if (error) throw error;
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

    // Increment lead contacts
    await incrementLeadContacts(leadId);

    return { success: true };
  } catch (error) {
    console.error('Error tracking agent-lead contact:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if agent has already contacted lead
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
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const markNotificationAsRead = async (notificationId) => {
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
 * Subscribe to user notifications in real-time
 * @param {string} userId - User ID
 * @param {Function} callback - Callback function for updates
 * @returns {Function} Unsubscribe function
 */
export const subscribeToNotifications = (userId, callback) => {
  const supabase = createClient();
  
  // Fetch initial notifications
  const fetchNotifications = async () => {
    const result = await getUserNotifications(userId);
    if (result.success) {
      callback(result.data);
    }
  };
  
  // Fetch initial data
  fetchNotifications();
  
  const channel = supabase
    .channel('notifications-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      async () => {
        // Refetch all notifications when any change occurs
        await fetchNotifications();
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
    // Transform each user to camelCase for components
    return { success: true, data: (data || []).map(transformUserData) };
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
      title: 'New Property Inquiry',
      message: `You have a new inquiry for ${inquiryData.propertyTitle || 'your property'}`,
      data: { inquiry: inquiryData }
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

    // Send notification
    await createNotification({
      user_id: agentId,
      type: 'verification_approved',
      title: 'Account Verified',
      message: 'Your agent account has been verified. You can now access leads.'
    });

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

    // Send notification
    await createNotification({
      user_id: agentId,
      type: 'verification_rejected',
      title: 'Verification Rejected',
      message: `Your account verification was rejected: ${reason}`
    });

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
export const unlockLead = async (agentId, leadId) => {
  try {
    const supabase = createClient();

    // Check if already contacted
    const hasContacted = await hasAgentContactedLead(agentId, leadId);
    if (hasContacted) {
      return { success: true, message: 'Already unlocked' };
    }

    // Track contact (which deducts credits)
    const trackResult = await trackAgentLeadContact(agentId, leadId, 'view');
    if (!trackResult.success) {
      return trackResult;
    }

    return { success: true };
  } catch (error) {
    console.error('Error unlocking lead:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get unlocked leads for agent
 * @param {string} agentId - Agent ID
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export const getUnlockedLeads = async (agentId) => {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('contact_history')
      .select('lead_id')
      .eq('agent_id', agentId);

    if (error) throw error;
    
    const leadIds = [...new Set(data.map(item => item.lead_id))];
    return { success: true, data: leadIds };
  } catch (error) {
    console.error('Error getting unlocked leads:', error);
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

    // Transform user data to camelCase
    const transformedUser = transformUserData(userData);

    return {
      success: true,
      data: {
        ...transformedUser,
        transactions: transactions || [],
        stats: {
          unlockedCount: unlockedCount || 0,
          propertiesCount: propertiesCount || 0
        }
      }
    };
  } catch (error) {
    console.error('Error getting full agent profile:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all renters/tenants
 * @param {object} filters - Filter options
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export const getAllRenters = async (filters = {}) => {
  try {
    const supabase = createClient();
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

    const { data, error } = await query;

    if (error) throw error;
    // Transform to camelCase for components
    return { success: true, data: (data || []).map(transformUserData) };
  } catch (error) {
    console.error('Error getting renters:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get full renter profile with activity
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

    // Get posted leads
    const { data: requests } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', renterId)
      .order('created_at', { ascending: false });

    // Get saved properties
    const { data: savedProps } = await supabase
      .from('saved_properties')
      .select('property_id, properties(*)')
      .eq('user_id', renterId);

    // Transform user data to camelCase
    const transformedUser = transformUserData(userData);

    return {
      success: true,
      data: {
        ...transformedUser,
        requests: requests || [],
        savedProperties: savedProps?.map(sp => sp.properties) || []
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
      title: 'Support Ticket Created',
      message: `Your ticket "${ticketData.subject}" has been submitted. We'll respond shortly.`,
      data: { ticketId: data.id }
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
// REAL-TIME CHAT OPERATIONS
// ============================================

/**
 * Get or create a conversation between two users
 * @param {string} userId1 - First user ID
 * @param {string} userId2 - Second user ID
 * @param {object} related - Optional related info { type: 'lead'|'property', id: uuid }
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getOrCreateConversation = async (userId1, userId2, related = null) => {
  try {
    const supabase = createClient();
    
    // Sort IDs to ensure consistent lookup
    const [p1, p2] = [userId1, userId2].sort();
    
    // Check if conversation exists
    let { data: existing, error: findError } = await supabase
      .from('chat_conversations')
      .select('*')
      .or(`and(participant_1_id.eq.${p1},participant_2_id.eq.${p2}),and(participant_1_id.eq.${p2},participant_2_id.eq.${p1})`)
      .maybeSingle();

    if (findError && findError.code !== 'PGRST116') throw findError;

    if (existing) {
      return { success: true, data: existing };
    }

    // Create new conversation
    const { data, error } = await supabase
      .from('chat_conversations')
      .insert({
        participant_1_id: p1,
        participant_2_id: p2,
        related_type: related?.type || 'general',
        related_id: related?.id || null,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error getting/creating conversation:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all conversations for a user
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export const getUserConversations = async (userId) => {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('chat_conversations')
      .select(`
        *,
        participant_1:participant_1_id(id, name, email, avatar, role),
        participant_2:participant_2_id(id, name, email, avatar, role)
      `)
      .or(`participant_1_id.eq.${userId},participant_2_id.eq.${userId}`)
      .eq('status', 'active')
      .order('updated_at', { ascending: false });

    if (error) throw error;

    // Add helper field for "other participant"
    const conversations = (data || []).map(conv => {
      const otherParticipant = conv.participant_1_id === userId 
        ? conv.participant_2 
        : conv.participant_1;
      const unreadCount = conv.participant_1_id === userId 
        ? conv.unread_count_1 
        : conv.unread_count_2;
      
      return {
        ...conv,
        otherParticipant,
        unreadCount
      };
    });

    return { success: true, data: conversations };
  } catch (error) {
    console.error('Error getting user conversations:', error);
    return { success: false, error: error.message, data: [] };
  }
};

/**
 * Get messages for a conversation
 * @param {string} conversationId - Conversation ID
 * @param {number} limit - Number of messages to fetch
 * @param {string} before - Fetch messages before this timestamp (for pagination)
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export const getConversationMessages = async (conversationId, limit = 50, before = null) => {
  try {
    const supabase = createClient();
    
    let query = supabase
      .from('chat_messages')
      .select(`
        *,
        sender:sender_id(id, name, avatar)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data, error } = await query;

    if (error) throw error;
    
    // Reverse to show oldest first in UI
    return { success: true, data: (data || []).reverse() };
  } catch (error) {
    console.error('Error getting messages:', error);
    return { success: false, error: error.message, data: [] };
  }
};

/**
 * Send a message in a conversation
 * @param {string} conversationId - Conversation ID
 * @param {string} senderId - Sender user ID
 * @param {string} message - Message text
 * @param {string} messageType - Type of message (text, image, file, system)
 * @param {array} attachments - Optional attachments
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const sendMessage = async (conversationId, senderId, message, messageType = 'text', attachments = []) => {
  try {
    const supabase = createClient();
    
    // Insert message
    const { data: msgData, error: msgError } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        message,
        message_type: messageType,
        attachments,
        created_at: new Date().toISOString()
      })
      .select(`
        *,
        sender:sender_id(id, name, avatar)
      `)
      .single();

    if (msgError) throw msgError;

    // Get conversation to update
    const { data: conv } = await supabase
      .from('chat_conversations')
      .select('participant_1_id, participant_2_id, unread_count_1, unread_count_2')
      .eq('id', conversationId)
      .single();

    if (conv) {
      // Increment unread count for the other participant
      const updateData = {
        last_message: message.substring(0, 100),
        last_message_at: new Date().toISOString(),
        last_message_by: senderId,
        updated_at: new Date().toISOString()
      };

      if (senderId === conv.participant_1_id) {
        updateData.unread_count_2 = (conv.unread_count_2 || 0) + 1;
      } else {
        updateData.unread_count_1 = (conv.unread_count_1 || 0) + 1;
      }

      await supabase
        .from('chat_conversations')
        .update(updateData)
        .eq('id', conversationId);
    }

    return { success: true, data: msgData };
  } catch (error) {
    console.error('Error sending message:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Mark messages as read
 * @param {string} conversationId - Conversation ID
 * @param {string} userId - User who is reading
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const markMessagesAsRead = async (conversationId, userId) => {
  try {
    const supabase = createClient();
    
    // Mark all unread messages in this conversation as read
    await supabase
      .from('chat_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .is('read_at', null);

    // Reset unread count for this user
    const { data: conv } = await supabase
      .from('chat_conversations')
      .select('participant_1_id')
      .eq('id', conversationId)
      .single();

    if (conv) {
      const updateField = userId === conv.participant_1_id 
        ? { unread_count_1: 0 } 
        : { unread_count_2: 0 };
      
      await supabase
        .from('chat_conversations')
        .update(updateField)
        .eq('id', conversationId);
    }

    return { success: true };
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Subscribe to new messages in a conversation (real-time)
 * @param {string} conversationId - Conversation ID
 * @param {function} callback - Callback function for new messages
 * @returns {function} Unsubscribe function
 */
export const subscribeToMessages = (conversationId, callback) => {
  const supabase = createClient();
  
  const subscription = supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      async (payload) => {
        // Fetch full message with sender info
        const { data } = await supabase
          .from('chat_messages')
          .select(`*, sender:sender_id(id, name, avatar)`)
          .eq('id', payload.new.id)
          .single();
        
        if (data) callback(data);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
};

/**
 * Subscribe to conversation updates (for unread counts, etc.)
 * @param {string} userId - User ID
 * @param {function} callback - Callback function for updates
 * @returns {function} Unsubscribe function
 */
export const subscribeToConversations = (userId, callback) => {
  const supabase = createClient();
  
  const subscription = supabase
    .channel(`conversations:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'chat_conversations'
      },
      (payload) => {
        // Check if user is a participant
        const conv = payload.new || payload.old;
        if (conv.participant_1_id === userId || conv.participant_2_id === userId) {
          callback(payload);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
};

/**
 * Get total unread message count for a user
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, count?: number, error?: string}>}
 */
export const getTotalUnreadCount = async (userId) => {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('chat_conversations')
      .select('participant_1_id, unread_count_1, unread_count_2')
      .or(`participant_1_id.eq.${userId},participant_2_id.eq.${userId}`)
      .eq('status', 'active');

    if (error) throw error;

    let total = 0;
    (data || []).forEach(conv => {
      if (conv.participant_1_id === userId) {
        total += conv.unread_count_1 || 0;
      } else {
        total += conv.unread_count_2 || 0;
      }
    });

    return { success: true, count: total };
  } catch (error) {
    console.error('Error getting unread count:', error);
    return { success: false, error: error.message, count: 0 };
  }
};

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
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('lead_agent_connections')
      .select('*')
      .eq('lead_id', leadId)
      .eq('agent_id', agentId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return { 
      success: true, 
      connected: !!data,
      data: data || null
    };
  } catch (error) {
    console.error('Error checking agent-lead connection:', error);
    return { success: false, error: error.message };
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

    // Get lead details for notification
    const { data: lead } = await supabase
      .from('leads')
      .select('tenant_name, tenant_email, location')
      .eq('id', leadId)
      .single();

    // Notify the tenant that an agent has shown interest
    if (lead?.tenant_email) {
      await createNotification({
        userId: null, // External user, no userId
        type: 'agent_interested',
        title: 'An Agent is Interested!',
        message: `A verified agent is interested in helping you find a property in ${lead.location}`,
        data: { lead_id: leadId }
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
 * Get all agents connected to a lead
 * @param {string} leadId - Lead ID
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
export const getLeadConnections = async (leadId) => {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('lead_agent_connections')
      .select(`
        *,
        agent:agent_id (
          id, name, email, phone, avatar, agency_name, verification_status
        )
      `)
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [] };
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
    
    let query = supabase
      .from('lead_agent_connections')
      .select(`
        *,
        lead:lead_id (
          id, tenant_name, tenant_email, tenant_phone, location, 
          property_type, budget, bedrooms, status, created_at,
          external_source, is_external
        )
      `)
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { success: true, data: data || [] };
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
// ADDITIONAL NOTIFICATION HELPERS
// ============================================

/**
 * Subscribe to new notifications only (realtime) - for push notifications
 * @param {string} userId - User ID
 * @param {function} callback - Callback for new notifications
 * @returns {function} Unsubscribe function
 */
export const subscribeToNewNotifications = (userId, callback) => {
  const supabase = createClient();
  
  const subscription = supabase
    .channel(`new-notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
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
 * Mark notification as read (enhanced version with read_at timestamp)
 * @param {string} notificationId - Notification ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const markNotificationRead = async (notificationId) => {
  try {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('notifications')
      .update({
        read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error marking notification read:', error);
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
      .update({
        read: true,
        read_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error marking all notifications read:', error);
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
    console.error('Error getting unread count:', error);
    return { success: false, error: error.message, count: 0 };
  }
};

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
