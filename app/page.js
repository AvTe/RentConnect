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
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { getUser, updateUser, createUser } from '@/lib/firestore';
import { useLeads, useSubscription } from '@/lib/hooks';

export default function RentalLeadApp() {
  const [view, setView] = useState('landing');
  const [currentUser, setCurrentUser] = useState(null);
  const [prefilledData, setPrefilledData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Use custom hooks for data management
  const { leads } = useLeads();
  const { isPremium } = useSubscription(currentUser?.uid);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userResult = await getUser(user.uid);
          
          if (userResult.success) {
            const userData = userResult.data;
            setCurrentUser({
              uid: user.uid,
              email: user.email,
              ...userData
            });
            
            if (view === 'login') {
              if (userData.type === 'agent') {
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
  }, [view]);

  const handleLogin = async (user) => {
    setCurrentUser(user);
    
    // Create user in Firestore if doesn't exist
    const userResult = await getUser(user.uid);
    if (!userResult.success) {
      await createUser(user.uid, {
        email: user.email,
        name: user.name,
        type: user.type,
        avatar: user.avatar || null,
        phone: user.phone || null,
        location: user.location || null
      });
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
        tenantId: currentUser?.uid || 'guest',
        name: formData.name,
        location: formData.location,
        type: formData.type,
        budget: formData.budget,
        whatsapp: formData.whatsapp,
        email: formData.email || currentUser?.email,
        phone: formData.phone || formData.whatsapp
      };
      
      const result = await createLead(leadData);
      
      if (result.success) {
        // Send confirmation email to tenant
        if (leadData.email) {
          const emailContent = EMAIL_TEMPLATES.TENANT_CONFIRMATION(leadData.name, leadData);
          await sendEmailNotification(leadData.email, 'Request Submitted - RentConnect', emailContent);
        }
        
        alert("Request posted successfully! Agents will contact you soon.");
        
        if (currentUser) {
          setView('user-dashboard');
        } else {
          setView('landing');
        }
      }
    } catch (error) {
      console.error('Error submitting tenant form:', error);
      alert('Error submitting request. Please try again.');
    }
  };

  const handleSearch = (searchData) => {
    setPrefilledData(searchData);
    setView('tenant-form');
  };

  const handleAgentRegistration = async (formData) => {
    try {
      const agentData = {
        name: formData.fullName,
        type: 'agent',
        email: formData.email,
        agencyName: formData.agencyName,
        phone: formData.phone,
        location: formData.location,
        experience: '0 Years',
        isPremium: false
      };
      
      setCurrentUser({
        ...agentData,
        uid: auth.currentUser?.uid || 'temp'
      });
      
      setView('agent-dashboard');
    } catch (error) {
      console.error('Error registering agent:', error);
    }
  };

  const handleSubscribe = async (paymentData) => {
    try {
      const { initializePayment } = await import('@/lib/paystack');
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
        // Redirect to Paystack payment page
        window.location.href = result.authorizationUrl;
      } else {
        alert('Error initializing payment. Please try again.');
      }
    } catch (error) {
      console.error('Error subscribing:', error);
      alert('Error processing subscription. Please try again.');
    }
  };

  const renderView = () => {
    switch (view) {
      case 'landing':
        return <LandingPage onNavigate={setView} onSearch={handleSearch} />;
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
            onSubscribe={handleSubscribe} 
          />
        );
      default:
        return <LandingPage onNavigate={setView} onSearch={handleSearch} />;
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <Header 
        onNavigate={setView} 
        currentUser={currentUser} 
        onLogout={handleLogout} 
      />
      {renderView()}
    </main>
  );
}
