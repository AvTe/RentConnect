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
import EmailConfirmationSuccess from '@/components/EmailConfirmationSuccess';
import PasswordResetSuccess from '@/components/PasswordResetSuccess';
import PasswordResetForm from '@/components/PasswordResetForm';
import { ChatWidget, ChatButton, useChat } from '@/components/ChatWidget';
import { getCurrentSession, signOut, onAuthStateChange } from '@/lib/auth-supabase';
import { getUser, updateUser, createUser, createUserSubscription, createSubscription } from '@/lib/database';
import { uploadImage } from '@/lib/storage-supabase';
import { useLeads, useSubscription } from '@/lib/hooks';

export default function RentalLeadApp() {
  const [view, setView] = useState('landing');
  const [currentUser, setCurrentUser] = useState(null);
  const [prefilledData, setPrefilledData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAgentId, setSelectedAgentId] = useState(null);
  const [authError, setAuthError] = useState(null);
  
  // Use custom hooks for data management
  // Only fetch leads if user is logged in (to avoid permission errors)
  const { leads } = useLeads({}, !!currentUser);
  const { isPremium } = useSubscription(currentUser?.id);
  
  // Chat functionality - must be called unconditionally at top level
  const chat = useChat(currentUser);

  // Check for OAuth callback errors
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const error = params.get('error');
      const viewParam = params.get('view');
      
      // Handle view parameter from URL
      if (viewParam === 'email-confirmed') {
        setView('email-confirmed');
        window.history.replaceState({}, '', window.location.pathname);
      } else if (viewParam === 'password-reset-success') {
        setView('password-reset-success');
        window.history.replaceState({}, '', window.location.pathname);
      } else if (viewParam === 'reset-password') {
        setView('reset-password');
        window.history.replaceState({}, '', window.location.pathname);
      } else if (error === 'callback_error') {
        setAuthError('Authentication failed. Please try again.');
        setView('landing');
        // Clear error from URL
        window.history.replaceState({}, '', window.location.pathname);
      } else if (error === 'auth_failed') {
        setAuthError('Google sign-in failed. Please try again.');
        setView('landing');
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

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

            // Check if user is an admin type (super_admin, main_admin, sub_admin, or admin)
            const isAdminRole = ['admin', 'super_admin', 'main_admin', 'sub_admin'].includes(userData.role);

            setCurrentUser({
              id: user.id,
              uid: user.id,
              email: user.email,
              ...userData
            });
            
            // Redirect based on role if on landing or login page
            if (view === 'landing' || view === 'login') {
              if (isAdminRole) {
                setView('admin-dashboard');
              } else if (userData.type === 'agent' || userData.role === 'agent') {
                setView('agent-dashboard');
              } else {
                setView('user-dashboard');
              }
            }
          } else {
            // User profile doesn't exist in database - create it
            console.log('User authenticated but no profile found. Creating profile...');
            const metadata = user.user_metadata || {};
            const newUserData = {
              email: user.email,
              name: metadata.full_name || metadata.name || user.email?.split('@')[0],
              avatar: metadata.avatar_url || metadata.picture || null,
              type: 'tenant',
              role: 'tenant',
              phone: metadata.phone || null,
              location: null,
              status: 'active',
              wallet_balance: 0
            };
            
            // Create user profile in database
            const createResult = await createUser(user.id, newUserData);
            
            if (createResult.success) {
              console.log('User profile created successfully');
              setCurrentUser({
                id: user.id,
                uid: user.id,
                ...newUserData
              });
            } else {
              console.error('Failed to create user profile:', createResult.error);
              // Still set user with basic info
              setCurrentUser({
                id: user.id,
                uid: user.id,
                email: user.email,
                name: metadata.full_name || metadata.name || user.email?.split('@')[0],
                avatar: metadata.avatar_url || metadata.picture || null,
                type: 'tenant',
                role: 'tenant'
              });
            }
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
    
    // Create user in Supabase if doesn't exist
    const userResult = await getUser(user.uid);
    if (!userResult.success) {
      const newUser = {
        email: user.email,
        name: user.name,
        type: user.type,
        role: user.type,
        avatar: user.avatar || null,
        phone: user.phone || null,
        location: user.location || null,
        status: 'active'
      };

      await createUser(user.uid, newUser);

      const isNewUserAdmin = ['admin', 'super_admin', 'main_admin', 'sub_admin'].includes(newUser.role);
      if (isNewUserAdmin) {
        setView('admin-dashboard');
        return;
      }
    } else {
      // If user exists, check if admin
      const isAdminRole = ['admin', 'super_admin', 'main_admin', 'sub_admin'].includes(userResult.data.role);

      if (isAdminRole) {
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
      
      // 1. Create Auth User - signUpWithEmail(email, password, name, metadata)
      const result = await signUpWithEmail(
        formData.email, 
        formData.password, 
        formData.fullName,
        { phone: formData.phone, type: 'agent' }
      );
      
      if (!result.success) {
        throw new Error(result.error || 'Registration failed');
      }

      // Check if email confirmation is required
      if (result.emailConfirmationRequired) {
        alert('Registration successful! Please check your email to verify your account before signing in.');
        setView('login');
        setLoading(false);
        return;
      }
      
      const user = result.user;

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
      // DEMO MODE: Pesapal disabled - credits are added directly for testing
      // TODO: Re-enable Pesapal integration when ready for production

      if (paymentData.userId) {
        // User subscription for viewing agent contacts
        const startsAt = new Date();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

        const result = await createUserSubscription({
          user_id: paymentData.userId,
          plan_name: `${paymentData.planType} Subscription`,
          status: 'active',
          amount: paymentData.amount || 0,
          currency: 'KES',
          payment_method: 'demo',
          payment_reference: `demo_user_${Date.now()}`,
          starts_at: startsAt.toISOString(),
          expires_at: expiresAt.toISOString(),
        });

        if (result.success) {
          alert(`✅ ${paymentData.planType} subscription activated! (Demo Mode)`);
          setView('user-dashboard');
        } else {
          alert('Failed to activate subscription: ' + result.error);
        }
      } else if (paymentData.credits) {
        // Agent buying credits - add credits directly
        const userId = currentUser?.uid || currentUser?.id;
        const newCredits = (currentUser?.credits || 0) + paymentData.credits;

        // Update user credits
        const updateResult = await updateUser(userId, { credits: newCredits });

        if (updateResult.success) {
          // Also create a subscription record for tracking
          const startsAt = new Date();
          const expiresAt = new Date();
          expiresAt.setFullYear(expiresAt.getFullYear() + 10); // Credits don't expire

          await createSubscription({
            user_id: userId,
            plan_name: `${paymentData.credits} Credits Bundle`,
            status: 'active',
            amount: typeof paymentData.price === 'string'
              ? parseInt(paymentData.price.replace(/[^0-9]/g, ''))
              : paymentData.price || 0,
            currency: 'KES',
            payment_method: 'demo',
            payment_reference: `demo_credits_${Date.now()}`,
            starts_at: startsAt.toISOString(),
            expires_at: expiresAt.toISOString(),
          });

          // Update local user state
          setCurrentUser(prev => ({ ...prev, credits: newCredits }));
          alert(`✅ ${paymentData.credits} credits added! You now have ${newCredits} credits. (Demo Mode)`);
          setView('agent-dashboard');
        } else {
          alert('Failed to add credits: ' + updateResult.error);
        }
      } else {
        // Agent premium subscription
        const userId = currentUser?.uid || currentUser?.id;
        const startsAt = new Date();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

        const result = await createSubscription({
          user_id: userId,
          plan_name: 'Premium Agent Subscription',
          status: 'active',
          amount: 2500,
          currency: 'KES',
          payment_method: 'demo',
          payment_reference: `demo_premium_${Date.now()}`,
          starts_at: startsAt.toISOString(),
          expires_at: expiresAt.toISOString(),
        });

        if (result.success) {
          alert('✅ Premium subscription activated! (Demo Mode)');
          setView('agent-dashboard');
        } else {
          alert('Failed to activate subscription: ' + result.error);
        }
      }
    } catch (error) {
      console.error('Error subscribing:', error);
      alert('Error processing subscription: ' + error.message);
    }
  };

  const handleViewAgentProfile = (agent) => {
    setSelectedAgentId(agent.id);
    setView('agent-detail');
  };

  const renderView = () => {
    switch (view) {
      case 'landing':
        return <LandingPage onNavigate={setView} onSearch={handleSearch} currentUser={currentUser} authError={authError} />;
      case 'login':
        return <Login onNavigate={setView} onLogin={handleLogin} authError={authError} />;
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
      case 'email-confirmed':
        return (
          <EmailConfirmationSuccess
            onContinue={() => {
              if (currentUser) {
                const dashboardView = currentUser.role === 'agent' ? 'agent-dashboard' : 'user-dashboard';
                setView(dashboardView);
              } else {
                setView('login');
              }
            }}
            onGoHome={() => setView('landing')}
          />
        );
      case 'password-reset-success':
        return (
          <PasswordResetSuccess
            onContinue={() => setView('login')}
            onSignIn={() => setView('login')}
          />
        );
      case 'reset-password':
        return (
          <PasswordResetForm
            onSuccess={() => setView('password-reset-success')}
            onCancel={() => setView('landing')}
          />
        );
      default:
        return <LandingPage onNavigate={setView} onSearch={handleSearch} />;
    }
  };

  return (
    <main className="min-h-screen bg-white">

      {view !== 'landing' && view !== 'login' && view !== 'user-dashboard' && view !== 'agent-dashboard' && view !== 'admin-dashboard' && view !== 'email-confirmed' && view !== 'password-reset-success' && view !== 'reset-password' && (
        <Header 
          onNavigate={setView} 
          currentUser={currentUser} 
          onLogout={handleLogout} 
        />
      )}
      {renderView()}
      
      {/* Chat Widget - Show for logged in users except on admin dashboard and success screens */}
      {currentUser && view !== 'admin-dashboard' && view !== 'landing' && view !== 'login' && view !== 'email-confirmed' && view !== 'password-reset-success' && view !== 'reset-password' && (
        <>
          <ChatButton 
            user={currentUser} 
            onClick={() => chat.openChat()} 
            unreadCount={chat.unreadCount} 
          />
          <ChatWidget 
            user={currentUser} 
            isOpen={chat.isOpen} 
            onClose={chat.closeChat}
            initialRecipient={chat.initialRecipient}
          />
        </>
      )}
    </main>
  );
}
