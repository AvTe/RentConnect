// Firebase Admin SDK for server-side operations
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

let adminDb = null;
let isInitialized = false;

// Initialize Firebase Admin with service account credentials
function initializeFirebaseAdmin() {
  if (isInitialized) {
    return adminDb;
  }

  try {
    // Check if already initialized
    if (getApps().length > 0) {
      adminDb = getFirestore();
      isInitialized = true;
      return adminDb;
    }

    // Get service account credentials from environment
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (serviceAccountJson) {
      // Parse the service account JSON from environment variable
      const serviceAccount = JSON.parse(serviceAccountJson);
      
      initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id
      });
      
      adminDb = getFirestore();
      isInitialized = true;
      console.log('Firebase Admin initialized with service account');
      return adminDb;
    } else if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      // Fallback: Initialize with just project ID (limited functionality)
      // This works in Google Cloud environments with ADC
      initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
      });
      
      adminDb = getFirestore();
      isInitialized = true;
      console.log('Firebase Admin initialized with project ID only (limited functionality)');
      return adminDb;
    }
    
    console.warn('Firebase Admin not configured: No service account credentials found');
    return null;
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    return null;
  }
}

// Get the admin Firestore instance
export function getAdminFirestore() {
  if (!adminDb) {
    initializeFirebaseAdmin();
  }
  return adminDb;
}

// Check if Firebase Admin is properly configured
export function isFirebaseAdminConfigured() {
  return !!process.env.FIREBASE_SERVICE_ACCOUNT;
}

// Helper function to create agent subscription
export async function createAgentSubscription(agentId, subscriptionData) {
  const db = getAdminFirestore();
  if (!db) {
    throw new Error('Firebase Admin not configured');
  }

  const batch = db.batch();

  // Create subscription record
  const subscriptionRef = db.collection('subscriptions').doc();
  batch.set(subscriptionRef, {
    agentId,
    status: 'active',
    startDate: subscriptionData.startDate,
    endDate: subscriptionData.endDate,
    paymentReference: subscriptionData.paymentReference,
    pesapalTrackingId: subscriptionData.trackingId,
    amount: subscriptionData.amount,
    paymentMethod: subscriptionData.paymentMethod,
    confirmationCode: subscriptionData.confirmationCode,
    createdAt: FieldValue.serverTimestamp()
  });

  // Update agent's premium status
  const agentRef = db.collection('users').doc(agentId);
  batch.update(agentRef, {
    isPremium: true,
    subscriptionEndDate: subscriptionData.endDate
  });

  await batch.commit();
  
  return {
    subscriptionId: subscriptionRef.id,
    agentId,
    status: 'active'
  };
}

// Helper function to create user subscription
export async function createUserSubscription(userId, subscriptionData) {
  const db = getAdminFirestore();
  if (!db) {
    throw new Error('Firebase Admin not configured');
  }

  const batch = db.batch();

  // Create subscription record
  const subscriptionRef = db.collection('user_subscriptions').doc();
  batch.set(subscriptionRef, {
    userId,
    planType: subscriptionData.planType,
    status: 'active',
    startDate: subscriptionData.startDate,
    endDate: subscriptionData.endDate,
    paymentReference: subscriptionData.paymentReference,
    pesapalTrackingId: subscriptionData.trackingId,
    amount: subscriptionData.amount,
    paymentMethod: subscriptionData.paymentMethod,
    confirmationCode: subscriptionData.confirmationCode,
    createdAt: FieldValue.serverTimestamp()
  });

  // Update user's subscription status
  const userRef = db.collection('users').doc(userId);
  batch.update(userRef, {
    hasActiveSubscription: true,
    subscriptionPlan: subscriptionData.planType,
    subscriptionEndDate: subscriptionData.endDate
  });

  await batch.commit();
  
  return {
    subscriptionId: subscriptionRef.id,
    userId,
    status: 'active'
  };
}

// Helper function to add credits to agent's wallet
export async function addAgentCredits(agentId, credits, transactionData) {
  const db = getAdminFirestore();
  if (!db) {
    throw new Error('Firebase Admin not configured');
  }

  const batch = db.batch();

  // Add credits to agent's wallet
  const agentRef = db.collection('users').doc(agentId);
  batch.update(agentRef, {
    walletBalance: FieldValue.increment(credits)
  });

  // Log transaction
  const transactionRef = db.collection('transactions').doc();
  batch.set(transactionRef, {
    userId: agentId,
    type: 'credit_purchase',
    credits,
    amount: transactionData.amount,
    paymentMethod: transactionData.paymentMethod,
    paymentReference: transactionData.paymentReference,
    confirmationCode: transactionData.confirmationCode,
    description: `Credit purchase via ${transactionData.paymentMethod || 'M-Pesa'}`,
    createdAt: FieldValue.serverTimestamp()
  });

  await batch.commit();
  
  return {
    transactionId: transactionRef.id,
    agentId,
    credits
  };
}

export { FieldValue };
