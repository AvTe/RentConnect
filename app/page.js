'use client';

import React, { useState, useEffect } from 'react';
import { LandingPage } from '@/components/LandingPage';
import { TenantForm } from '@/components/TenantForm';
import { AgentDashboard } from '@/components/AgentDashboard';
import { SubscriptionPage } from '@/components/SubscriptionPage';
import { AgentRegistration } from '@/components/AgentRegistration';
import { UserDashboard } from '@/components/UserDashboard';
import { Login } from '@/components/Login';
import { Header } from '@/components/Header';
import { AgentsListingPage } from '@/components/AgentsListingPage';
import { AgentDetailPage } from '@/components/AgentDetailPage';
import { UserSubscriptionPage } from '@/components/UserSubscriptionPage';
import { AdminDashboard } from '@/components/AdminDashboard';
import { PropertiesPage } from '@/components/PropertiesPage';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { auth, isFirebaseReady } from '@/lib/firebase';
import { onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInAnonymously } from 'firebase/auth';
import { getUser, updateUser, createUser, createUserSubscription } from '@/lib/firestore';
import { uploadImage } from '@/lib/storage';
import { useLeads, useSubscription } from '@/lib/hooks';

export default function RentalLeadApp() {
  const [view, setView] = useState('landing');
  const [currentUser, setCurrentUser] = useState(null);
  const [prefilledData, setPrefilledData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAgentId, setSelectedAgentId] = useState(null);
  
  // Use custom hooks for data management
  // Only fetch leads if user is logged in (to avoid permission errors)
  const { leads } = useLeads({}, !!currentUser);
  const { isPremium } = useSubscription(currentUser?.uid);

  useEffect(() => {
    // Minimum loading time for smooth animation (1.5 seconds)
    const loadStartTime = Date.now();
    const MIN_LOADING_TIME = 1500;
    
    const finishLoading = () => {
      const elapsed = Date.now() - loadStartTime;
      const remaining = Math.max(0, MIN_LOADING_TIME - elapsed);
      setTimeout(() => setLoading(false), remaining);
    };
    
    // Check if Firebase is initialized before setting up auth listener
    if (!isFirebaseReady) {
      console.warn('Firebase not initialized. Running in demo mode.');
      finishLoading();
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userResult = await getUser(user.uid);
          
          if (userResult.success) {
            let userData = userResult.data;

            // Auto-promote specific email to admin
            if (user.email === 'kartikamit171@gmail.com' && userData.role !== 'admin') {
              await updateUser(user.uid, { role: 'admin' });
              userData.role = 'admin';
            }

            setCurrentUser({
              uid: user.uid,
              email: user.email,
              ...userData
            });
            
            // Redirect based on role if on landing or login page
            if (view === 'landing' || view === 'login') {
              if (userData.role === 'admin') {
                setView('admin-dashboard');
              } else if (userData.type === 'agent' || userData.role === 'agent') {
                setView('agent-dashboard');
              } else {
                setView('user-dashboard');
              }
            }
          } else {
            setCurrentUser({
              uid: user.uid,
              email: user.email,
              name: user.displayName,
              avatar: user.photoURL,
              type: 'tenant'
            });
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else {
        setCurrentUser(null);
        if (view !== 'landing' && view !== 'login' && view !== 'tenant-form' && view !== 'agent-registration') {
          setView('landing');
        }
      }
      finishLoading();
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Removed view dependency to prevent re-running on view change

  if (loading) {
    return <LoadingScreen />;
  }

  const handleLogin = async (user) => {
    setCurrentUser(user);
    
    // Create user in Firestore if doesn't exist
    const userResult = await getUser(user.uid);
    if (!userResult.success) {
      const newUser = {
        email: user.email,
        name: user.name,
        type: user.type,
        role: user.email === 'kartikamit171@gmail.com' ? 'admin' : user.type,
        avatar: user.avatar || null,
        phone: user.phone || null,
        location: user.location || null,
        status: 'active'
      };

      await createUser(user.uid, newUser);

      if (newUser.role === 'admin') {
        setView('admin-dashboard');
        return;
      }
    } else {
      // If user exists, check if admin
      if (user.email === 'kartikamit171@gmail.com' && userResult.data.role !== 'admin') {
        await updateUser(user.uid, { role: 'admin' });
        userResult.data.role = 'admin';
      }

      if (userResult.data.role === 'admin') {
        setView('admin-dashboard');
        return;
      }
    }
    
    if (user.type === 'agent') {
      setView('agent-dashboard');
    } else {
      setView('user-dashboard');
    }
  };

  const handleLogout = async () => {
    if (!isFirebaseReady) {
      console.warn('Firebase not initialized');
      setCurrentUser(null);
      setView('landing');
      return;
    }
    try {
      await signOut(auth);
      setCurrentUser(null);
      setView('landing');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleUpdateUser = async (updatedData) => {
    if (currentUser?.uid) {
      const result = await updateUser(currentUser.uid, updatedData);
      if (result.success) {
        setCurrentUser(prev => ({ ...prev, ...updatedData }));
      }
    }
  };

  const handleTenantSubmit = async (formData) => {
    if (!isFirebaseReady) {
      console.warn('Firebase not initialized. Cannot submit tenant form.');
      return { success: false, error: 'Application is not yet configured. Please set up Firebase environment variables to enable this feature.' };
    }
    try {
      const { createLead } = await import('@/lib/firestore');
      const { sendEmailNotification, EMAIL_TEMPLATES } = await import('@/lib/notifications');
      
      // 1. Ensure User Account Exists
      // If phone verification was successful, auth.currentUser should be set (via Phone Auth)
      let user = auth.currentUser;
      let userId = user?.uid;

      if (user) {
        // Check if profile exists
        const userResult = await getUser(user.uid);
        
        if (!userResult.success) {
           // Create new profile
           const userData = {
            name: formData.name || 'Valued Tenant',
            email: formData.email,
            phone: formData.whatsapp,
            type: 'tenant',
            role: 'tenant',
            status: 'active',
            avatar: null
          };
          await createUser(user.uid, userData);
          
          setCurrentUser({
            uid: user.uid,
            ...userData
          });
        } else {
          // Profile exists: Update it with the latest form data (Name/Email)
          // This ensures the account reflects the name entered in the form
          const updates = {
            name: formData.name,
            email: formData.email
          };
          await updateUser(user.uid, updates);
          
          setCurrentUser(prev => ({
            ...prev,
            ...updates
          }));
        }
      } else {
        // Fallback (Should not happen if verification is enforced)
        console.error("User not authenticated after verification");
        return { success: false, error: 'Authentication failed. Please verify your phone number.' };
      }

      const leadData = {
        tenant_info: {
          name: formData.name,
          phone: formData.phone || formData.whatsapp,
          whatsapp_link: `https://wa.me/${formData.whatsapp}`,
          whatsapp: formData.whatsapp, // Keeping raw number for easy access
          email: formData.email || currentUser?.email,
          id: userId
        },
        requirements: {
          location: formData.location,
          pincode: formData.pincode,
          property_type: formData.type,
          budget: formData.budget,
          currency: 'NGN',
          move_in_date: 'ASAP' // Defaulting for now
        }
      };
      
      const result = await createLead(leadData);
      
      if (result.success) {
        // Send confirmation email to tenant
        if (leadData.tenant_info.email) {
          const emailContent = EMAIL_TEMPLATES.TENANT_CONFIRMATION(leadData.tenant_info.name, leadData);
          await sendEmailNotification(leadData.tenant_info.email, 'Request Submitted - Yoombaa', emailContent);
        }
        
        // Let the form component handle the success UI
        return { success: true };
      }
      return { success: false, error: 'Failed to create lead' };
    } catch (error) {
      console.error('Error submitting tenant form:', error);
      return { success: false, error: error.message };
    }
  };

  const handleSearch = (searchData) => {
    setPrefilledData(searchData);
    setView('tenant-form');
  };

  const handleAgentRegistration = async (formData) => {
    if (!isFirebaseReady) {
      console.warn('Firebase not initialized. Cannot register agent.');
      return { success: false, error: 'Application is not yet configured. Please set up Firebase environment variables to enable registration.' };
    }
    try {
      setLoading(true);
      // 1. Create Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // 2. Upload ID Document
      let idDocumentUrl = null;
      if (formData.idDocument) {
        const uploadResult = await uploadImage(
          formData.idDocument, 
          `verification_docs/${user.uid}/${formData.idDocument.name}`
        );
        if (uploadResult.success) {
          idDocumentUrl = uploadResult.url;
        }
      }

      const agentData = {
        name: formData.fullName,
        type: 'agent',
        role: 'agent', // Added role field for consistency
        email: formData.email,
        agencyName: formData.agencyName,
        phone: formData.phone,
        location: formData.location,
        experience: '0 Years',
        isPremium: false,
        verificationStatus: 'pending',
        idDocumentUrl: idDocumentUrl,
        walletBalance: 0,
        referredBy: formData.referralCode || null,
        status: 'active'
      };
      
      await createUser(user.uid, agentData);
      
      setCurrentUser({
        ...agentData,
        uid: user.uid
      });
      
      setView('agent-dashboard');
    } catch (error) {
      console.error('Error registering agent:', error);
      alert('Registration failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (paymentData) => {
    try {
      const { initializePayment } = await import('@/lib/paystack');
      
      // Determine if this is agent or user subscription
      if (paymentData.userId) {
        // User subscription for viewing agent contacts
        const result = await initializePayment(
          currentUser.email,
          paymentData.amount,
          {
            userId: paymentData.userId,
            planType: paymentData.planType,
            subscriptionType: 'user'
          }
        );
        
        if (result.success) {
          window.location.href = result.authorizationUrl;
        } else {
          alert('Error initializing payment. Please try again.');
        }
      } else if (paymentData.credits) {
        // Agent buying credits
        const result = await initializePayment(
          currentUser.email,
          parseInt(paymentData.price.replace(/[^0-9]/g, '')), // Extract amount from string like "₦ 5,000"
          {
            agentId: currentUser.uid,
            agentName: currentUser.name,
            credits: paymentData.credits,
            type: 'credit_purchase'
          }
        );
        
        if (result.success) {
          window.location.href = result.authorizationUrl;
        } else {
          alert('Error initializing payment. Please try again.');
        }
      } else {
        // Fallback for legacy subscription calls (if any)
        const { SUBSCRIPTION_PLANS } = await import('@/lib/paystack');
        const result = await initializePayment(
          currentUser.email,
          SUBSCRIPTION_PLANS.PREMIUM.amount,
          {
            agentId: currentUser.uid,
            agentName: currentUser.name,
            plan: 'premium'
          }
        );
        
        if (result.success) {
          window.location.href = result.authorizationUrl;
        } else {
          alert('Error initializing payment. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error subscribing:', error);
      alert('Error processing subscription. Please try again.');
    }
  };

  const handleViewAgentProfile = (agent) => {
    setSelectedAgentId(agent.id);
    setView('agent-detail');
  };

  const renderView = () => {
    switch (view) {
      case 'landing':
        return <LandingPage onNavigate={setView} onSearch={handleSearch} currentUser={currentUser} />;
      case 'login':
        return <Login onNavigate={setView} onLogin={handleLogin} />;
      case 'tenant-form':
        return (
          <TenantForm 
            onNavigate={setView} 
            onSubmit={handleTenantSubmit} 
            initialData={prefilledData}
            currentUser={currentUser}
            onUpdateUser={(data) => setCurrentUser(prev => prev ? ({ ...prev, ...data }) : prev)}
          />
        );
      case 'user-dashboard':
        return (
          <UserDashboard 
            onNavigate={setView} 
            initialTab="dashboard" 
            currentUser={currentUser}
            onUpdateUser={handleUpdateUser}
            onLogout={handleLogout}
          />
        );
      case 'profile':
        return currentUser?.type === 'agent' 
          ? (
            <AgentDashboard 
              onNavigate={setView} 
              leads={leads} 
              isPremium={isPremium}
              onUnlock={() => setView('subscription')} 
              initialTab="profile"
              currentUser={currentUser}
              onUpdateUser={handleUpdateUser}
              onLogout={handleLogout}
            />
          )
          : (
            <UserDashboard 
              onNavigate={setView} 
              initialTab="profile"
              currentUser={currentUser}
              onUpdateUser={handleUpdateUser}
              onLogout={handleLogout}
            />
          );
      case 'agent-registration':
        return <AgentRegistration onNavigate={setView} onSubmit={handleAgentRegistration} />;
      case 'agent-dashboard':
        return (
          <AgentDashboard 
            onNavigate={setView} 
            leads={leads} 
            isPremium={isPremium}
            onUnlock={() => setView('subscription')} 
            initialTab="leads"
            currentUser={currentUser}
            onUpdateUser={handleUpdateUser}
            onLogout={handleLogout}
          />
        );
      case 'subscription':
        return (
          <SubscriptionPage 
            onNavigate={setView} 
            onBuyCredits={handleSubscribe} 
          />
        );
      case 'agents-listing':
        return (
          <AgentsListingPage
            currentUser={currentUser}
            onNavigate={setView}
            onViewAgentProfile={handleViewAgentProfile}
          />
        );
      case 'agent-detail':
        return (
          <AgentDetailPage
            agentId={selectedAgentId}
            currentUser={currentUser}
            onNavigate={setView}
            onBack={() => setView('agents-listing')}
          />
        );
      case 'user-subscription':
        return (
          <UserSubscriptionPage
            currentUser={currentUser}
            onNavigate={setView}
            onSubscribe={handleSubscribe}
          />
        );
      case 'admin-dashboard':
        return (
          <AdminDashboard
            currentUser={currentUser}
            onNavigate={setView}
            onLogout={handleLogout}
          />
        );
      case 'properties':
        return (
          <PropertiesPage
            onNavigate={setView}
            currentUser={currentUser}
            isPremium={isPremium}
          />
        );
      default:
        return <LandingPage onNavigate={setView} onSearch={handleSearch} />;
    }
  };

  return (
    <main className="min-h-screen bg-white">
      {!isFirebaseReady && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 text-center" role="alert">
          <p className="font-medium">Demo Mode</p>
          <p className="text-sm">Firebase is not configured. Authentication and database features are disabled. Set up Firebase environment variables to enable full functionality.</p>
        </div>
      )}
      {view !== 'landing' && view !== 'login' && view !== 'user-dashboard' && view !== 'agent-dashboard' && view !== 'admin-dashboard' && (
        <Header 
          onNavigate={setView} 
          currentUser={currentUser} 
          onLogout={handleLogout} 
        />
      )}
      {renderView()}
    </main>
  );
}
