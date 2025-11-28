import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

// ============================================
// USER OPERATIONS
// ============================================

export const checkPhoneNumberExists = async (phoneNumber) => {
  try {
    const q = query(collection(db, 'users'), where('phone', '==', phoneNumber));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking phone number:', error);
    return false;
  }
};

export const createUser = async (userId, userData) => {
  try {
    await setDoc(doc(db, 'users', userId), {
      ...userData,
      walletBalance: 0, // Initialize wallet balance
      referralCode: userData.name.substring(0, 3).toUpperCase() + Math.floor(1000 + Math.random() * 9000), // Generate simple referral code
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
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

export const processReferral = async (newUserId, referralCode) => {
  try {
    // Find referrer
    const q = query(collection(db, 'users'), where('referralCode', '==', referralCode));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const referrerDoc = snapshot.docs[0];
      const referrerId = referrerDoc.id;
      
      // Award credits to referrer (e.g., 5 credits)
      await addCredits(referrerId, 5);
      
      // Record referral
      await addDoc(collection(db, 'referrals'), {
        referrerId,
        referredUserId: newUserId,
        createdAt: serverTimestamp()
      });
      
      // Optional: Award credits to new user
      await addCredits(newUserId, 2); // Welcome bonus
      
      return { success: true };
    }
    return { success: false, error: 'Invalid referral code' };
  } catch (error) {
    console.error('Error processing referral:', error);
    return { success: false, error: error.message };
  }
};

export const getUser = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return { success: true, data: { id: userDoc.id, ...userDoc.data() } };
    }
    return { success: false, error: 'User not found' };
  } catch (error) {
    console.error('Error getting user:', error);
    return { success: false, error: error.message };
  }
};

export const updateUser = async (userId, updates) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating user:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// WALLET OPERATIONS
// ============================================

export const addCredits = async (userId, amount, reason = 'Credit Purchase') => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const currentBalance = userDoc.data().walletBalance || 0;
      await updateDoc(userRef, {
        walletBalance: currentBalance + amount,
        updatedAt: serverTimestamp()
      });
      
      // Record transaction
      await createTransaction(userId, 'credit_add', amount, reason);
      
      return { success: true, newBalance: currentBalance + amount };
    }
    return { success: false, error: 'User not found' };
  } catch (error) {
    console.error('Error adding credits:', error);
    return { success: false, error: error.message };
  }
};

export const deductCredits = async (userId, amount, reason = 'Lead Unlock') => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const currentBalance = userDoc.data().walletBalance || 0;
      if (currentBalance >= amount) {
        await updateDoc(userRef, {
          walletBalance: currentBalance - amount,
          updatedAt: serverTimestamp()
        });
        
        // Record transaction
        await createTransaction(userId, 'credit_deduct', amount, reason);
        
        return { success: true, newBalance: currentBalance - amount };
      } else {
        return { success: false, error: 'Insufficient credits' };
      }
    }
    return { success: false, error: 'User not found' };
  } catch (error) {
    console.error('Error deducting credits:', error);
    return { success: false, error: error.message };
  }
};

export const getWalletBalance = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return { success: true, balance: userDoc.data().walletBalance || 0 };
    }
    return { success: false, error: 'User not found' };
  } catch (error) {
    console.error('Error getting wallet balance:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// LEAD/REQUEST OPERATIONS
// ============================================

export const createLead = async (leadData) => {
  try {
    // Ensure data follows the schema: tenant_info and requirements
    const docRef = await addDoc(collection(db, 'requests'), {
      ...leadData,
      status: 'active',
      views: 0,
      contacts: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating request:', error);
    return { success: false, error: error.message };
  }
};

export const getLead = async (leadId) => {
  try {
    const leadDoc = await getDoc(doc(db, 'requests', leadId));
    if (leadDoc.exists()) {
      return { success: true, data: { id: leadDoc.id, ...leadDoc.data() } };
    }
    return { success: false, error: 'Request not found' };
  } catch (error) {
    console.error('Error getting request:', error);
    return { success: false, error: error.message };
  }
};

export const getAllLeads = async (filters = {}) => {
  try {
    let q = collection(db, 'requests');
    const constraints = [];
    
    // Default to active unless specified otherwise
    if (filters.status && filters.status !== 'all') {
      constraints.push(where('status', '==', filters.status));
    } else if (!filters.status) {
      constraints.push(where('status', '==', 'active'));
    }
    
    constraints.push(orderBy('createdAt', 'desc'));
    
    if (filters.location) {
      // Note: In Firestore, querying nested fields requires dot notation
      constraints.push(where('requirements.location', '==', filters.location));
    }
    if (filters.type) {
      constraints.push(where('requirements.property_type', '==', filters.type));
    }
    if (filters.tenantId) {
      constraints.push(where('tenant_info.id', '==', filters.tenantId));
    }
    if (filters.limit) {
      constraints.push(limit(filters.limit));
    }
    
    q = query(q, ...constraints);
    const snapshot = await getDocs(q);
    const leads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, data: leads };
  } catch (error) {
    console.error('Error getting requests:', error);
    return { success: false, error: error.message };
  }
};

export const deleteLead = async (leadId) => {
  try {
    await deleteDoc(doc(db, 'requests', leadId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting request:', error);
    return { success: false, error: error.message };
  }
};

export const updateLead = async (leadId, updates) => {
  try {
    await updateDoc(doc(db, 'requests', leadId), {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating request:', error);
    return { success: false, error: error.message };
  }
};

export const incrementLeadViews = async (leadId) => {
  try {
    const leadDoc = await getDoc(doc(db, 'requests', leadId));
    if (leadDoc.exists()) {
      const currentViews = leadDoc.data().views || 0;
      await updateDoc(doc(db, 'requests', leadId), {
        views: currentViews + 1,
        updatedAt: serverTimestamp()
      });
    }
    return { success: true };
  } catch (error) {
    console.error('Error incrementing views:', error);
    return { success: false, error: error.message };
  }
};

export const incrementLeadContacts = async (leadId) => {
  try {
    const leadDoc = await getDoc(doc(db, 'requests', leadId));
    if (leadDoc.exists()) {
      const currentContacts = leadDoc.data().contacts || 0;
      await updateDoc(doc(db, 'requests', leadId), {
        contacts: currentContacts + 1,
        updatedAt: serverTimestamp()
      });
    }
    return { success: true };
  } catch (error) {
    console.error('Error incrementing contacts:', error);
    return { success: false, error: error.message };
  }
};

// Real-time listener for leads
export const subscribeToLeads = (callback, filters = {}) => {
  let q = collection(db, 'requests');
  const constraints = [where('status', '==', 'active'), orderBy('createdAt', 'desc')];
  
  if (filters.location) {
    constraints.push(where('requirements.location', '==', filters.location));
  }
  if (filters.type) {
    constraints.push(where('requirements.property_type', '==', filters.type));
  }
  
  q = query(q, ...constraints);
  
  return onSnapshot(q, (snapshot) => {
    const leads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(leads);
  }, (error) => {
    console.error('Error in requests subscription:', error);
  });
};

// ============================================
// PROPERTY OPERATIONS
// ============================================

export const createProperty = async (propertyData) => {
  try {
    const docRef = await addDoc(collection(db, 'properties'), {
      ...propertyData,
      status: 'active',
      views: 0,
      inquiries: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating property:', error);
    return { success: false, error: error.message };
  }
};

export const getProperty = async (propertyId) => {
  try {
    const propertyDoc = await getDoc(doc(db, 'properties', propertyId));
    if (propertyDoc.exists()) {
      return { success: true, data: { id: propertyDoc.id, ...propertyDoc.data() } };
    }
    return { success: false, error: 'Property not found' };
  } catch (error) {
    console.error('Error getting property:', error);
    return { success: false, error: error.message };
  }
};

export const getAgentProperties = async (agentId) => {
  try {
    const q = query(
      collection(db, 'properties'),
      where('agentId', '==', agentId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const properties = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, data: properties };
  } catch (error) {
    console.error('Error getting agent properties:', error);
    return { success: false, error: error.message };
  }
};

export const searchProperties = async (searchParams) => {
  try {
    let q = collection(db, 'properties');
    const constraints = [where('status', '==', 'active')];
    
    if (searchParams.location) {
      constraints.push(where('location', '==', searchParams.location));
    }
    if (searchParams.type) {
      constraints.push(where('type', '==', searchParams.type));
    }
    if (searchParams.minPrice) {
      constraints.push(where('price', '>=', searchParams.minPrice));
    }
    if (searchParams.maxPrice) {
      constraints.push(where('price', '<=', searchParams.maxPrice));
    }
    
    constraints.push(orderBy('createdAt', 'desc'));
    
    if (searchParams.limit) {
      constraints.push(limit(searchParams.limit));
    }
    
    q = query(q, ...constraints);
    const snapshot = await getDocs(q);
    const properties = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, data: properties };
  } catch (error) {
    console.error('Error searching properties:', error);
    return { success: false, error: error.message };
  }
};

export const updateProperty = async (propertyId, updates) => {
  try {
    await updateDoc(doc(db, 'properties', propertyId), {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating property:', error);
    return { success: false, error: error.message };
  }
};

export const deleteProperty = async (propertyId) => {
  try {
    await deleteDoc(doc(db, 'properties', propertyId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting property:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// SUBSCRIPTION OPERATIONS
// ============================================

export const createSubscription = async (subscriptionData) => {
  try {
    const docRef = await addDoc(collection(db, 'subscriptions'), {
      ...subscriptionData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating subscription:', error);
    return { success: false, error: error.message };
  }
};

export const getActiveSubscription = async (agentId) => {
  try {
    const q = query(
      collection(db, 'subscriptions'),
      where('agentId', '==', agentId),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const subscription = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
      return { success: true, data: subscription };
    }
    return { success: false, error: 'No active subscription found' };
  } catch (error) {
    console.error('Error getting subscription:', error);
    return { success: false, error: error.message };
  }
};

export const updateSubscription = async (subscriptionId, updates) => {
  try {
    await updateDoc(doc(db, 'subscriptions', subscriptionId), {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating subscription:', error);
    return { success: false, error: error.message };
  }
};

export const checkSubscriptionStatus = async (agentId) => {
  try {
    const result = await getActiveSubscription(agentId);
    if (result.success) {
      const subscription = result.data;
      const now = new Date();
      const endDate = subscription.endDate.toDate();
      
      if (now < endDate) {
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

export const saveProperty = async (userId, propertyId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    const savedProperties = userDoc.data()?.savedProperties || [];
    
    if (!savedProperties.includes(propertyId)) {
      savedProperties.push(propertyId);
      await updateDoc(userRef, { savedProperties, updatedAt: serverTimestamp() });
    }
    return { success: true };
  } catch (error) {
    console.error('Error saving property:', error);
    return { success: false, error: error.message };
  }
};

export const unsaveProperty = async (userId, propertyId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    let savedProperties = userDoc.data()?.savedProperties || [];
    
    savedProperties = savedProperties.filter(id => id !== propertyId);
    await updateDoc(userRef, { savedProperties, updatedAt: serverTimestamp() });
    return { success: true };
  } catch (error) {
    console.error('Error unsaving property:', error);
    return { success: false, error: error.message };
  }
};

export const getSavedProperties = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    const savedPropertyIds = userDoc.data()?.savedProperties || [];
    
    if (savedPropertyIds.length === 0) {
      return { success: true, data: [] };
    }
    
    const properties = [];
    for (const propertyId of savedPropertyIds) {
      const propertyDoc = await getDoc(doc(db, 'properties', propertyId));
      if (propertyDoc.exists()) {
        properties.push({ id: propertyDoc.id, ...propertyDoc.data() });
      }
    }
    
    return { success: true, data: properties };
  } catch (error) {
    console.error('Error getting saved properties:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// CONTACT HISTORY OPERATIONS
// ============================================

export const addContactHistory = async (contactData) => {
  try {
    const docRef = await addDoc(collection(db, 'contactHistory'), {
      ...contactData,
      createdAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error adding contact history:', error);
    return { success: false, error: error.message };
  }
};

export const getUserContactHistory = async (userId) => {
  try {
    const q = query(
      collection(db, 'contactHistory'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const snapshot = await getDocs(q);
    const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, data: history };
  } catch (error) {
    console.error('Error getting contact history:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// NOTIFICATION OPERATIONS
// ============================================

export const createNotification = async (notificationData) => {
  try {
    const docRef = await addDoc(collection(db, 'notifications'), {
      ...notificationData,
      read: false,
      createdAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false, error: error.message };
  }
};

export const getUserNotifications = async (userId) => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const snapshot = await getDocs(q);
    const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, data: notifications };
  } catch (error) {
    console.error('Error getting notifications:', error);
    return { success: false, error: error.message };
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), {
      read: true,
      readAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false, error: error.message };
  }
};

// Real-time listener for user notifications
export const subscribeToNotifications = (userId, callback) => {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    where('read', '==', false),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(notifications);
  }, (error) => {
    console.error('Error in notifications subscription:', error);
  });
};

// ============================================
// AGENT OPERATIONS
// ============================================

export const getAllAgents = async (filters = {}) => {
  try {
    let q = collection(db, 'users');
    // Changed from 'role' to 'type' to match registration data
    const constraints = [where('type', '==', 'agent')];
    
    if (filters.location) {
      constraints.push(where('location', '==', filters.location));
    }
    if (filters.verified) {
      constraints.push(where('verified', '==', true));
    }
    
    // Removed orderBy('createdAt', 'desc') to prevent missing documents if createdAt is undefined
    // constraints.push(orderBy('createdAt', 'desc'));
    
    if (filters.limit) {
      constraints.push(limit(filters.limit));
    }
    
    q = query(q, ...constraints);
    const snapshot = await getDocs(q);
    
    let agents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Filter out deleted users by default unless specifically requested
    if (filters.status !== 'deleted') {
      agents = agents.filter(agent => agent.status !== 'deleted');
    }
    
    // Sort manually in memory to handle missing createdAt fields gracefully
    agents.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : (a.createdAt || new Date(0));
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : (b.createdAt || new Date(0));
      return dateB - dateA; // Descending
    });
    
    return { success: true, data: agents };
  } catch (error) {
    console.error('Error getting agents:', error);
    return { success: false, error: error.message };
  }
};

export const getAgentById = async (agentId) => {
  try {
    const agentDoc = await getDoc(doc(db, 'users', agentId));
    if (agentDoc.exists() && (agentDoc.data().type === 'agent' || agentDoc.data().role === 'agent')) {
      return { success: true, data: { id: agentDoc.id, ...agentDoc.data() } };
    }
    return { success: false, error: 'Agent not found' };
  } catch (error) {
    console.error('Error getting agent:', error);
    return { success: false, error: error.message };
  }
};

export const searchAgents = async (searchTerm) => {
  try {
    const agentsRef = collection(db, 'users');
    const q = query(agentsRef, where('type', '==', 'agent'));
    const snapshot = await getDocs(q);
    
    const agents = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(agent => 
        agent.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.agencyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    return { success: true, data: agents };
  } catch (error) {
    console.error('Error searching agents:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// AGENT CONNECTION OPERATIONS
// ============================================

export const sendConnectionRequest = async (fromAgentId, toAgentId) => {
  try {
    const docRef = await addDoc(collection(db, 'connections'), {
      fromAgentId,
      toAgentId,
      status: 'pending',
      createdAt: serverTimestamp()
    });
    
    // Create notification for the receiving agent
    await createNotification({
      userId: toAgentId,
      type: 'connection_request',
      title: 'New Connection Request',
      message: 'You have a new connection request',
      fromUserId: fromAgentId
    });
    
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error sending connection request:', error);
    return { success: false, error: error.message };
  }
};

export const acceptConnectionRequest = async (connectionId) => {
  try {
    await updateDoc(doc(db, 'connections', connectionId), {
      status: 'accepted',
      acceptedAt: serverTimestamp()
    });
    
    const connectionDoc = await getDoc(doc(db, 'connections', connectionId));
    if (connectionDoc.exists()) {
      const { fromAgentId } = connectionDoc.data();
      await createNotification({
        userId: fromAgentId,
        type: 'connection_accepted',
        title: 'Connection Accepted',
        message: 'Your connection request was accepted'
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error accepting connection:', error);
    return { success: false, error: error.message };
  }
};

export const getAgentConnections = async (agentId) => {
  try {
    const q1 = query(
      collection(db, 'connections'),
      where('fromAgentId', '==', agentId),
      where('status', '==', 'accepted')
    );
    const q2 = query(
      collection(db, 'connections'),
      where('toAgentId', '==', agentId),
      where('status', '==', 'accepted')
    );
    
    const [snapshot1, snapshot2] = await Promise.all([getDocs(q1), getDocs(q2)]);
    const connections = [
      ...snapshot1.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      ...snapshot2.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    ];
    
    return { success: true, data: connections };
  } catch (error) {
    console.error('Error getting connections:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// INQUIRY/LEAD OPERATIONS
// ============================================

export const createInquiry = async (inquiryData) => {
  try {
    const docRef = await addDoc(collection(db, 'inquiries'), {
      ...inquiryData,
      status: 'pending',
      createdAt: serverTimestamp()
    });
    
    // Notify the agent
    await createNotification({
      userId: inquiryData.agentId,
      type: 'new_inquiry',
      title: 'New Property Inquiry',
      message: `You have a new inquiry for ${inquiryData.propertyTitle}`,
      inquiryId: docRef.id
    });
    
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating inquiry:', error);
    return { success: false, error: error.message };
  }
};

export const getAgentInquiries = async (agentId) => {
  try {
    const q = query(
      collection(db, 'inquiries'),
      where('agentId', '==', agentId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const inquiries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, data: inquiries };
  } catch (error) {
    console.error('Error getting inquiries:', error);
    return { success: false, error: error.message };
  }
};

export const updateInquiryStatus = async (inquiryId, status, response = null) => {
  try {
    const updateData = {
      status,
      updatedAt: serverTimestamp()
    };
    
    if (response) {
      updateData.response = response;
      updateData.respondedAt = serverTimestamp();
    }
    
    await updateDoc(doc(db, 'inquiries', inquiryId), updateData);
    return { success: true };
  } catch (error) {
    console.error('Error updating inquiry:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// USER SUBSCRIPTION OPERATIONS (for viewing agent contacts)
// ============================================

export const createUserSubscription = async (subscriptionData) => {
  try {
    const docRef = await addDoc(collection(db, 'userSubscriptions'), {
      ...subscriptionData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Update user's subscription status
    await updateUser(subscriptionData.userId, {
      hasActiveSubscription: true,
      subscriptionType: subscriptionData.planType
    });
    
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating user subscription:', error);
    return { success: false, error: error.message };
  }
};

export const getUserSubscription = async (userId) => {
  try {
    const q = query(
      collection(db, 'userSubscriptions'),
      where('userId', '==', userId),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const subscription = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
      
      // Check if subscription is still valid
      const now = new Date();
      const endDate = subscription.endDate.toDate();
      
      if (now < endDate) {
        return { success: true, data: subscription, isActive: true };
      } else {
        // Subscription expired
        await updateDoc(doc(db, 'userSubscriptions', subscription.id), {
          status: 'expired',
          updatedAt: serverTimestamp()
        });
        await updateUser(userId, { hasActiveSubscription: false });
        return { success: false, error: 'Subscription expired', isActive: false };
      }
    }
    return { success: false, error: 'No active subscription found', isActive: false };
  } catch (error) {
    console.error('Error getting user subscription:', error);
    return { success: false, error: error.message, isActive: false };
  }
};

export const checkUserCanViewContact = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      
      // Check if user has active subscription
      if (userData.hasActiveSubscription) {
        const subResult = await getUserSubscription(userId);
        return { success: true, canView: subResult.isActive };
      }
      
      return { success: true, canView: false };
    }
    return { success: false, canView: false, error: 'User not found' };
  } catch (error) {
    console.error('Error checking contact view permission:', error);
    return { success: false, canView: false, error: error.message };
  }
};

// ============================================
// ADMIN OPERATIONS
// ============================================

export const getPendingAgents = async () => {
  try {
    const q = query(
      collection(db, 'users'),
      where('type', '==', 'agent'),
      where('verificationStatus', '==', 'pending')
    );
    const snapshot = await getDocs(q);
    let agents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Sort in memory
    agents.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : (a.createdAt || new Date(0));
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : (b.createdAt || new Date(0));
      return dateB - dateA;
    });
    
    return { success: true, data: agents };
  } catch (error) {
    console.error('Error getting pending agents:', error);
    return { success: false, error: error.message };
  }
};

export const approveAgent = async (agentId) => {
  try {
    await updateDoc(doc(db, 'users', agentId), {
      verificationStatus: 'verified',
      verifiedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Send notification to agent
    await createNotification({
      userId: agentId,
      type: 'verification_approved',
      title: 'Account Verified',
      message: 'Your agent account has been verified. You can now unlock leads.'
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error approving agent:', error);
    return { success: false, error: error.message };
  }
};

export const rejectAgent = async (agentId, reason) => {
  try {
    await updateDoc(doc(db, 'users', agentId), {
      verificationStatus: 'rejected',
      rejectionReason: reason,
      updatedAt: serverTimestamp()
    });
    
    // Send notification to agent
    await createNotification({
      userId: agentId,
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

export const getAllTransactions = async (limitCount = 50) => {
  try {
    const q = query(
      collection(db, 'transactions'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    const transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, data: transactions };
  } catch (error) {
    console.error('Error getting transactions:', error);
    return { success: false, error: error.message };
  }
};

// Helper to record transaction
const createTransaction = async (userId, type, amount, description, metadata = {}) => {
  try {
    await addDoc(collection(db, 'transactions'), {
      userId,
      type: 'credit_purchase', // 'credit_purchase', 'lead_unlock', 'bonus', 'refund'
      amount,
      description,
      metadata,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error recording transaction:', error);
  }
};

// ============================================
// UNLOCK OPERATIONS
// ============================================

export const unlockLead = async (agentId, leadId) => {
  try {
    // 1. Check if already unlocked
    const unlockRef = doc(db, 'users', agentId, 'unlockedLeads', leadId);
    const unlockDoc = await getDoc(unlockRef);
    
    if (unlockDoc.exists()) {
      return { success: true, message: 'Already unlocked' };
    }
    
    // 2. Deduct credits
    const deductResult = await deductCredits(agentId, 1, `Unlock Lead ${leadId}`);
    
    if (!deductResult.success) {
      return { success: false, error: deductResult.error };
    }
    
    // 3. Record unlock
    await setDoc(unlockRef, {
      leadId,
      unlockedAt: serverTimestamp()
    });
    
    // 4. Increment lead contacts count
    await incrementLeadContacts(leadId);
    
    return { success: true };
  } catch (error) {
    console.error('Error unlocking lead:', error);
    return { success: false, error: error.message };
  }
};

export const getUnlockedLeads = async (agentId) => {
  try {
    const q = query(collection(db, 'users', agentId, 'unlockedLeads'));
    const snapshot = await getDocs(q);
    const unlockedLeadIds = snapshot.docs.map(doc => doc.id);
    return { success: true, data: unlockedLeadIds };
  } catch (error) {
    console.error('Error getting unlocked leads:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// ADMIN DASHBOARD ANALYTICS
// ============================================

export const getDashboardStats = async () => {
  try {
    // In a production app, these should be aggregated via Cloud Functions
    // For MVP, we'll fetch and count (be careful with read costs at scale)
    
    // 1. User Stats
    const agentsQuery = query(collection(db, 'users'), where('type', '==', 'agent'));
    const rentersQuery = query(collection(db, 'users'), where('type', '==', 'tenant')); // Assuming 'tenant' or 'renter'
    
    const [agentsSnap, rentersSnap] = await Promise.all([
      getDocs(agentsQuery),
      getDocs(rentersQuery)
    ]);
    
    const agents = agentsSnap.docs.map(d => d.data());
    const verifiedAgents = agents.filter(a => a.verificationStatus === 'verified').length;
    const totalWalletBalance = agents.reduce((sum, a) => sum + (a.walletBalance || 0), 0);
    
    // 2. Lead Stats
    const leadsSnap = await getDocs(collection(db, 'requests'));
    const leads = leadsSnap.docs.map(d => d.data());
    const openLeads = leads.filter(l => l.status === 'active').length;
    const unlockedLeads = leads.filter(l => l.status === 'unlocked').length; // If you have this status
    const closedLeads = leads.filter(l => l.status === 'closed').length;
    
    // 3. Revenue (Last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const revenueQuery = query(
      collection(db, 'transactions'), 
      where('type', '==', 'credit_purchase'),
      where('createdAt', '>=', Timestamp.fromDate(thirtyDaysAgo))
    );
    const revenueSnap = await getDocs(revenueQuery);
    const revenueLast30Days = revenueSnap.docs.reduce((sum, d) => sum + (d.data().amount || 0), 0);

    // 4. Daily Unlocks (Last 24h)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const unlocksQuery = query(
      collection(db, 'transactions'),
      where('type', '==', 'lead_unlock'), // Assuming you log this type
      where('createdAt', '>=', Timestamp.fromDate(oneDayAgo))
    );
    const unlocksSnap = await getDocs(unlocksQuery);
    const dailyUnlocks = unlocksSnap.size;

    return {
      success: true,
      data: {
        totalAgents: agents.length,
        verifiedAgents,
        activeRenters: rentersSnap.size,
        totalLeads: leads.length,
        openLeads,
        unlockedLeads, // Note: This might need better tracking if status doesn't change on unlock
        closedLeads,
        totalWalletBalance,
        revenueLast30Days,
        dailyUnlocks
      }
    };
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    return { success: false, error: error.message };
  }
};

export const getRecentActivity = async () => {
  try {
    // Fetch recent signups
    const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(5));
    
    // Fetch recent transactions
    const txQuery = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'), limit(5));
    
    // Fetch recent leads
    const leadsQuery = query(collection(db, 'requests'), orderBy('createdAt', 'desc'), limit(5));

    const [usersSnap, txSnap, leadsSnap] = await Promise.all([
      getDocs(usersQuery),
      getDocs(txQuery),
      getDocs(leadsQuery)
    ]);

    const activities = [];

    usersSnap.forEach(doc => {
      const data = doc.data();
      activities.push({
        id: doc.id,
        type: 'signup',
        title: `New ${data.role} Signup`,
        description: `${data.name} joined RentConnect`,
        timestamp: data.createdAt,
        meta: { role: data.role, email: data.email }
      });
    });

    txSnap.forEach(doc => {
      const data = doc.data();
      activities.push({
        id: doc.id,
        type: 'transaction',
        title: data.type === 'credit_purchase' ? 'Credit Purchase' : 'Transaction',
        description: `${data.amount} credits - ${data.description}`,
        timestamp: data.createdAt,
        meta: { amount: data.amount, userId: data.userId }
      });
    });

    leadsSnap.forEach(doc => {
      const data = doc.data();
      activities.push({
        id: doc.id,
        type: 'lead',
        title: 'New Lead Posted',
        description: `${data.requirements?.property_type} in ${data.requirements?.location}`,
        timestamp: data.createdAt,
        meta: { budget: data.requirements?.budget }
      });
    });

    // Sort combined activities by timestamp desc
    activities.sort((a, b) => {
      const timeA = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0;
      const timeB = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0;
      return timeB - timeA;
    });

    return { success: true, data: activities.slice(0, 10) };
  } catch (error) {
    console.error('Error getting recent activity:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// CREDIT BUNDLE OPERATIONS
// ============================================

export const getAllCreditBundles = async () => {
  try {
    const q = query(collection(db, 'credit_bundles'), orderBy('price', 'asc'));
    const snapshot = await getDocs(q);
    const bundles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, data: bundles };
  } catch (error) {
    console.error('Error getting credit bundles:', error);
    return { success: false, error: error.message };
  }
};

export const createCreditBundle = async (bundleData) => {
  try {
    const docRef = await addDoc(collection(db, 'credit_bundles'), {
      ...bundleData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating credit bundle:', error);
    return { success: false, error: error.message };
  }
};

export const updateCreditBundle = async (bundleId, updates) => {
  try {
    await updateDoc(doc(db, 'credit_bundles', bundleId), {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating credit bundle:', error);
    return { success: false, error: error.message };
  }
};

export const deleteCreditBundle = async (bundleId) => {
  try {
    await deleteDoc(doc(db, 'credit_bundles', bundleId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting credit bundle:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// SUBSCRIPTION PLAN OPERATIONS
// ============================================

export const getAllSubscriptionPlans = async () => {
  try {
    const q = query(collection(db, 'subscription_plans'), orderBy('price', 'asc'));
    const snapshot = await getDocs(q);
    const plans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, data: plans };
  } catch (error) {
    console.error('Error getting subscription plans:', error);
    return { success: false, error: error.message };
  }
};

export const createSubscriptionPlan = async (planData) => {
  try {
    const docRef = await addDoc(collection(db, 'subscription_plans'), {
      ...planData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating subscription plan:', error);
    return { success: false, error: error.message };
  }
};

export const updateSubscriptionPlan = async (planId, updates) => {
  try {
    await updateDoc(doc(db, 'subscription_plans', planId), {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating subscription plan:', error);
    return { success: false, error: error.message };
  }
};

export const deleteSubscriptionPlan = async (planId) => {
  try {
    await deleteDoc(doc(db, 'subscription_plans', planId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting subscription plan:', error);
    return { success: false, error: error.message };
  }
};

export const getAllSubscriptions = async (limitCount = 50) => {
  try {
    const q = query(
      collection(db, 'subscriptions'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    const subscriptions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, data: subscriptions };
  } catch (error) {
    console.error('Error getting all subscriptions:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// ADMIN USER MANAGEMENT
// ============================================

export const suspendUser = async (userId, reason) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      status: 'suspended',
      suspensionReason: reason,
      suspendedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error suspending user:', error);
    return { success: false, error: error.message };
  }
};

export const reactivateUser = async (userId) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      status: 'active',
      suspensionReason: null,
      suspendedAt: null,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error reactivating user:', error);
    return { success: false, error: error.message };
  }
};

export const softDeleteUser = async (userId) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      status: 'deleted',
      deletedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false, error: error.message };
  }
};

export const getFullAgentProfile = async (agentId) => {
  try {
    // 1. Get User Doc
    const userDoc = await getDoc(doc(db, 'users', agentId));
    if (!userDoc.exists()) return { success: false, error: 'Agent not found' };
    const userData = { id: userDoc.id, ...userDoc.data() };

    // 2. Get Wallet History (Transactions)
    const txQuery = query(
      collection(db, 'transactions'), 
      where('userId', '==', agentId),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const txSnap = await getDocs(txQuery);
    const transactions = txSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // 3. Get Unlocked Leads Count
    const unlockedSnap = await getDocs(collection(db, 'users', agentId, 'unlockedLeads'));
    const unlockedCount = unlockedSnap.size;

    return {
      success: true,
      data: {
        ...userData,
        transactions,
        stats: {
          unlockedCount
        }
      }
    };
  } catch (error) {
    console.error('Error getting full agent profile:', error);
    return { success: false, error: error.message };
  }
};

export const getAllRenters = async (filters = {}) => {
  try {
    let q = collection(db, 'users');
    // Changed from 'role' to 'type' to match registration data
    const constraints = [where('type', '==', 'tenant')]; // Assuming 'tenant' is the role for renters
    
    if (filters.status && filters.status !== 'deleted') {
      constraints.push(where('status', '==', filters.status));
    }
    
    // Removed orderBy('createdAt', 'desc') to prevent missing documents if createdAt is undefined
    // constraints.push(orderBy('createdAt', 'desc'));
    
    if (filters.limit) {
      constraints.push(limit(filters.limit));
    }
    
    q = query(q, ...constraints);
    const snapshot = await getDocs(q);

    let renters = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Filter out deleted users by default unless specifically requested
    if (filters.status !== 'deleted') {
      renters = renters.filter(renter => renter.status !== 'deleted');
    }

    // Sort manually in memory
    renters.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : (a.createdAt || new Date(0));
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : (b.createdAt || new Date(0));
      return dateB - dateA; // Descending
    });

    return { success: true, data: renters };
  } catch (error) {
    console.error('Error getting renters:', error);
    return { success: false, error: error.message };
  }
};

export const getFullRenterProfile = async (renterId) => {
  try {
    // 1. Get User Doc
    const userDoc = await getDoc(doc(db, 'users', renterId));
    if (!userDoc.exists()) return { success: false, error: 'Renter not found' };
    const userData = { id: userDoc.id, ...userDoc.data() };

    // 2. Get Posted Requests (Leads)
    // Note: Requests don't always have a userId field in the root if they are anonymous, 
    // but if logged in, they should. Let's assume 'userId' field exists on requests.
    // If not, we might need to check how requests are created.
    // Looking at createLead, it takes leadData. We should ensure userId is passed.
    // Assuming userId is in leadData.
    const requestsQuery = query(
      collection(db, 'requests'),
      where('userId', '==', renterId),
      orderBy('createdAt', 'desc')
    );
    const requestsSnap = await getDocs(requestsQuery);
    const requests = requestsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // 3. Get Activity/Contact History
    const historyResult = await getUserContactHistory(renterId);
    const activity = historyResult.success ? historyResult.data : [];

    return {
      success: true,
      data: {
        ...userData,
        requests,
        activity
      }
    };
  } catch (error) {
    console.error('Error getting full renter profile:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// SUPPORT TICKET OPERATIONS
// ============================================

export const createSupportTicket = async (ticketData) => {
  try {
    const docRef = await addDoc(collection(db, 'support_tickets'), {
      ...ticketData,
      status: 'open', // open, in_progress, resolved, closed
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating support ticket:', error);
    return { success: false, error: error.message };
  }
};

export const getAllSupportTickets = async (filters = {}) => {
  try {
    let q = collection(db, 'support_tickets');
    const constraints = [];
    
    if (filters.status && filters.status !== 'all') {
      constraints.push(where('status', '==', filters.status));
    }
    
    constraints.push(orderBy('createdAt', 'desc'));
    
    if (filters.limit) {
      constraints.push(limit(filters.limit));
    }
    
    q = query(q, ...constraints);
    const snapshot = await getDocs(q);
    const tickets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, data: tickets };
  } catch (error) {
    console.error('Error getting support tickets:', error);
    return { success: false, error: error.message };
  }
};

export const updateSupportTicket = async (ticketId, updates) => {
  try {
    await updateDoc(doc(db, 'support_tickets', ticketId), {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating support ticket:', error);
    return { success: false, error: error.message };
  }
};

export const resolveSupportTicket = async (ticketId, resolutionNote) => {
  try {
    await updateDoc(doc(db, 'support_tickets', ticketId), {
      status: 'resolved',
      resolutionNote,
      resolvedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error resolving support ticket:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// SYSTEM CONFIGURATION OPERATIONS
// ============================================

export const getAllActivityLogs = async (limitCount = 50) => {
  try {
    // In a real app, you'd have a dedicated 'activity_logs' collection.
    // Here we aggregate from multiple sources similar to getRecentActivity but more comprehensive.
    // For simplicity in this MVP, we'll just fetch recent transactions as "System Logs" 
    // since we don't have a dedicated logs collection yet.
    
    const q = query(
      collection(db, 'transactions'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    const logs = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        type: 'transaction',
        action: data.type,
        description: data.description,
        user: data.userId,
        timestamp: data.createdAt
      };
    });
    
    return { success: true, data: logs };
  } catch (error) {
    console.error('Error getting activity logs:', error);
    return { success: false, error: error.message };
  }
};

export const getNotificationTemplates = async () => {
  try {
    const q = query(collection(db, 'notification_templates'), orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    const templates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, data: templates };
  } catch (error) {
    console.error('Error getting notification templates:', error);
    return { success: false, error: error.message };
  }
};

export const createNotificationTemplate = async (templateData) => {
  try {
    const docRef = await addDoc(collection(db, 'notification_templates'), {
      ...templateData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating notification template:', error);
    return { success: false, error: error.message };
  }
};

export const updateNotificationTemplate = async (templateId, updates) => {
  try {
    await updateDoc(doc(db, 'notification_templates', templateId), {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating notification template:', error);
    return { success: false, error: error.message };
  }
};

export const deleteNotificationTemplate = async (templateId) => {
  try {
    await deleteDoc(doc(db, 'notification_templates', templateId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting notification template:', error);
    return { success: false, error: error.message };
  }
};
