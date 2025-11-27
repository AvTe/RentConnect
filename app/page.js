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
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
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
      setLoading(false);
    });

    return () => unsubscribe();
  }, []); // Removed view dependency to prevent re-running on view change

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
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
    try {
      const { createLead } = await import('@/lib/firestore');
      const { sendEmailNotification, EMAIL_TEMPLATES } = await import('@/lib/notifications');
      
      const leadData = {
        tenant_info: {
          name: formData.name,
          phone: formData.phone || formData.whatsapp,
          whatsapp_link: `https://wa.me/${formData.whatsapp}`,
          whatsapp: formData.whatsapp, // Keeping raw number for easy access
          email: formData.email || currentUser?.email,
          id: currentUser?.uid || 'guest'
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
          await sendEmailNotification(leadData.tenant_info.email, 'Request Submitted - RentConnect', emailContent);
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
        return <TenantForm onNavigate={setView} onSubmit={handleTenantSubmit} initialData={prefilledData} />;
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
      default:
        return <LandingPage onNavigate={setView} onSearch={handleSearch} />;
    }
  };

  return (
    <main className="min-h-screen bg-white">
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
