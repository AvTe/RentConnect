import { createClient } from '@/utils/supabase/client';

// ============================================
// SUPABASE DATABASE LAYER
// Replaces Firebase Firestore with PostgreSQL
// ============================================

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
    
    // Generate referral code
    const referralCode = userData.name.substring(0, 3).toUpperCase() + 
                        Math.floor(1000 + Math.random() * 9000);

    const { error } = await supabase
      .from('users')
      .insert({
        id: userId,
        ...userData,
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

    return { success: true, data };
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
    const { error } = await supabase
      .from('users')
      .update({
        ...updates,
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

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.location) {
      query = query.ilike('location', `%${filters.location}%`);
    }
    if (filters.propertyType) {
      query = query.eq('property_type', filters.propertyType);
    }
    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
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
      query = query.eq('verified', filters.verified);
    }
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;
    return { success: true, data: data || [] };
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

    return { success: true, data };
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
      .or(`name.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`);

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error searching agents:', error);
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

    return {
      success: true,
      data: {
        ...userData,
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

    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;
    return { success: true, data: data || [] };
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

    return {
      success: true,
      data: {
        ...userData,
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
    
    // Create notification for ticket
    const notification = await createNotification({
      user_id: ticketData.userId,
      type: 'support',
      title: 'Support Ticket Created',
      message: `Your ticket #${ticketData.subject} has been created`,
      data: { ticket: ticketData }
    });

    return notification;
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
      .from('notifications')
      .select('*')
      .eq('type', 'support');

    if (filters.status && filters.status !== 'all') {
      query = query.eq('read', filters.status === 'open' ? false : true);
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
    return { success: false, error: error.message };
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
      .from('notifications')
      .update(updates)
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
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const resolveSupportTicket = async (ticketId, resolutionNote) => {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('notifications')
      .update({
        read: true,
        data: { status: 'resolved', resolutionNote, resolvedAt: new Date().toISOString() }
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
export const getAllCreditBundles = async () => {
  return { success: true, data: [] };
};

export const createCreditBundle = async (bundleData) => {
  return { success: false, error: 'Not implemented' };
};

export const updateCreditBundle = async (bundleId, updates) => {
  return { success: false, error: 'Not implemented' };
};

export const deleteCreditBundle = async (bundleId) => {
  return { success: false, error: 'Not implemented' };
};

export const getAllSubscriptionPlans = async () => {
  return { success: true, data: [] };
};

export const createSubscriptionPlan = async (planData) => {
  return { success: false, error: 'Not implemented' };
};

export const updateSubscriptionPlan = async (planId, updates) => {
  return { success: false, error: 'Not implemented' };
};

export const deleteSubscriptionPlan = async (planId) => {
  return { success: false, error: 'Not implemented' };
};

export const getNotificationTemplates = async () => {
  return { success: true, data: [] };
};

export const createNotificationTemplate = async (templateData) => {
  return { success: false, error: 'Not implemented' };
};

export const updateNotificationTemplate = async (templateId, updates) => {
  return { success: false, error: 'Not implemented' };
};

export const deleteNotificationTemplate = async (templateId) => {
  return { success: false, error: 'Not implemented' };
};

// Agent connections (would require connections table)
export const sendConnectionRequest = async (fromAgentId, toAgentId) => {
  return { success: false, error: 'Not implemented - connections table not in schema' };
};

export const acceptConnectionRequest = async (connectionId) => {
  return { success: false, error: 'Not implemented - connections table not in schema' };
};

export const getAgentConnections = async (agentId) => {
  return { success: true, data: [] };
};

// ============================================
// SYSTEM CONFIGURATION
// ============================================

/**
 * Get system configuration
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getSystemConfig = async () => {
  try {
    const supabase = createClient();
    
    // System config stored in a separate table or as a single row
    // For now, return default values - implement table if needed
    return {
      success: true,
      data: {
        creditPrice: 100,
        freeCredits: 2,
        referralBonus: 5
      }
    };
  } catch (error) {
    console.error('Error getting system config:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update system configuration
 * @param {object} config - Configuration data
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateSystemConfig = async (config) => {
  try {
    // System config update logic
    // For now, just return success - implement table if needed
    console.log('System config update:', config);
    return { success: true };
  } catch (error) {
    console.error('Error updating system config:', error);
    return { success: false, error: error.message };
  }
};
