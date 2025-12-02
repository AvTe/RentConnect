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
import { getCurrentSession, signOut, onAuthStateChange } from '@/lib/auth-supabase';
import { getUser, updateUser, createUser, createUserSubscription } from '@/lib/database';
import { uploadImage } from '@/lib/storage-supabase';
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
  const { isPremium } = useSubscription(currentUser?.id);

  useEffect(() => {
    // Minimum loading time for smooth animation
    const loadStartTime = Date.now();
    const MIN_LOADING_TIME = 300;
    
    const finishLoading = () => {
      const elapsed = Date.now() - loadStartTime;
      const remaining = Math.max(0, MIN_LOADING_TIME - elapsed);
      setTimeout(() => setLoading(false), remaining);
    };
    
    // Setup Supabase auth listener
    const unsubscribe = onAuthStateChange(async (event, session) => {
      const user = session?.user;
      if (user) {
        try {
          const userResult = await getUser(user.id);
          
          if (userResult.success) {
            let userData = userResult.data;

            // Auto-promote specific email to admin
            if (user.email === 'kartikamit171@gmail.com' && userData.role !== 'admin') {
              await updateUser(user.id, { role: 'admin' });
              userData.role = 'admin';
            }

            setCurrentUser({
              id: user.id,
              uid: user.id,
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
              id: user.id,
              uid: user.id,
              email: user.email,
              name: user.user_metadata?.name || user.email?.split('@')[0],
              avatar: user.user_metadata?.avatar_url,
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
      // Only finish loading after auth state AND profile fetch are complete
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
    try {
      await signOut();
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
      const { createLead } = await import('@/lib/database');
      const { sendEmailNotification, EMAIL_TEMPLATES } = await import('@/lib/notifications');
      
      // Get current session to check if user is authenticated
      const { user, session } = await getCurrentSession();
      let userId = user?.id || null;

      // If user is authenticated, update their profile
      if (user) {
        try {
          const userResult = await getUser(user.id);
          
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
            await createUser(user.id, userData);
            
            setCurrentUser({
              uid: user.id,
              id: user.id,
              ...userData
            });
          } else {
            // Profile exists: Update it with the latest form data
            const updates = {
              name: formData.name,
              email: formData.email,
              phone: formData.whatsapp
            };
            await updateUser(user.id, updates);
            
            setCurrentUser(prev => ({
              ...prev,
              ...updates
            }));
          }
        } catch (error) {
          console.error('Error updating user profile:', error);
          // Continue with lead creation even if profile update fails
        }
      }

      // Create lead data matching the schema
      const leadData = {
        user_id: userId, // Can be null for non-authenticated users
        tenant_name: formData.name,
        tenant_phone: formData.whatsapp,
        tenant_email: formData.email,
        location: formData.location,
        property_type: formData.type,
        budget: parseFloat(formData.budget) || 0,
        bedrooms: parseInt(formData.bedrooms) || 1,
        move_in_date: formData.moveInDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        requirements: {
          additional_requirements: formData.additionalRequirements || '',
          pincode: formData.pincode || '',
          amenities: formData.amenities || []
        }
      };
      
      const result = await createLead(leadData);
      
      if (result.success) {
        // Send confirmation email to tenant
        if (leadData.tenant_email) {
          try {
            const emailContent = EMAIL_TEMPLATES.TENANT_CONFIRMATION(leadData.tenant_name, leadData);
            await sendEmailNotification(leadData.tenant_email, 'Request Submitted - RentConnect', emailContent);
          } catch (emailError) {
            console.error('Error sending confirmation email:', emailError);
            // Don't fail the submission if email fails
          }
        }
        
        return { success: true, data: result.data };
      }
      return { success: false, error: 'Failed to create lead' };
    } catch (error) {
      console.error('Error submitting tenant form:', error);
      return { success: false, error: error.message || 'Failed to submit request' };
    }
  };

  const handleSearch = (searchData) => {
    setPrefilledData(searchData);
    setView('tenant-form');
  };

  const handleAgentRegistration = async (formData) => {
    try {
      setLoading(true);
      // Import Supabase auth function
      const { signUpWithEmail } = await import('@/lib/auth-supabase');
      
      // 1. Create Auth User
      const result = await signUpWithEmail(formData.email, formData.password, {
        name: formData.fullName,
        phone: formData.phone
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Registration failed');
      }
      
      const user = result.data.user;

      // 2. Upload ID Document
      let idDocumentUrl = null;
      if (formData.idDocument) {
        const uploadResult = await uploadImage(
          formData.idDocument, 
          `verification_docs/${user.id}/${formData.idDocument.name}`
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
      
      await createUser(user.id, agentData);
      
      setCurrentUser({
        ...agentData,
        uid: user.id
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

      const { initializePayment, SUBSCRIPTION_PLANS } = await import('@/lib/pesapal');
      
      let metadata = {};
      let amount = 0;
      let description = '';
      
      // Determine payment type and prepare metadata
      if (paymentData.userId) {
        // User subscription for viewing agent contacts
        metadata = {
          type: 'user_subscription',
          userId: paymentData.userId,
          planType: paymentData.planType
        };
        amount = paymentData.amount;
        description = `Yoombaa ${paymentData.planType} User Subscription`;
      } else if (paymentData.credits) {
        // Agent buying credits
        metadata = {
          type: 'credit_purchase',
          agentId: currentUser.uid,
          agentName: currentUser.name,
          credits: paymentData.credits
        };
        // Extract amount from string like "KSh 500" or use price directly
        amount = typeof paymentData.price === 'string' 
          ? parseInt(paymentData.price.replace(/[^0-9]/g, ''))
          : paymentData.price;
        description = `Yoombaa Credit Purchase - ${paymentData.credits} Credits`;
      } else {
        // Agent premium subscription
        metadata = {
          type: 'agent_subscription',
          agentId: currentUser.uid,
          agentName: currentUser.name
        };
        amount = SUBSCRIPTION_PLANS.PREMIUM.amount;
        description = 'Yoombaa Premium Agent Subscription';
      }
      
      // Initialize payment with Pesapal (metadata stored server-side in API route)
      const result = await initializePayment({
        email: currentUser.email,
        phone: currentUser.phone || '',
        amount: amount,
        description: description,
        firstName: currentUser.name?.split(' ')[0] || '',
        lastName: currentUser.name?.split(' ').slice(1).join(' ') || '',
        metadata: metadata,
        callbackUrl: `${window.location.origin}/payment/callback`
      });
      
      if (result.success && result.redirectUrl) {
        // Redirect to Pesapal payment page
        window.location.href = result.redirectUrl;
      } else {
        alert(result.error || 'Error initializing payment. Please try again.');
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
