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

export const createUser = async (userId, userData) => {
  try {
    await setDoc(doc(db, 'users', userId), {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error creating user:', error);
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
    const constraints = [where('status', '==', 'active'), orderBy('createdAt', 'desc')];
    
    if (filters.location) {
      // Note: In Firestore, querying nested fields requires dot notation
      constraints.push(where('requirements.location', '==', filters.location));
    }
    if (filters.type) {
      constraints.push(where('requirements.property_type', '==', filters.type));
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
    const constraints = [where('role', '==', 'agent')];
    
    if (filters.location) {
      constraints.push(where('location', '==', filters.location));
    }
    if (filters.verified) {
      constraints.push(where('verified', '==', true));
    }
    
    constraints.push(orderBy('createdAt', 'desc'));
    
    if (filters.limit) {
      constraints.push(limit(filters.limit));
    }
    
    q = query(q, ...constraints);
    const snapshot = await getDocs(q);
    const agents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, data: agents };
  } catch (error) {
    console.error('Error getting agents:', error);
    return { success: false, error: error.message };
  }
};

export const getAgentById = async (agentId) => {
  try {
    const agentDoc = await getDoc(doc(db, 'users', agentId));
    if (agentDoc.exists() && agentDoc.data().role === 'agent') {
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
    const q = query(agentsRef, where('role', '==', 'agent'));
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
