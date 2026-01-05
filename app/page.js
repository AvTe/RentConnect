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
import { NotificationModal } from '@/components/NotificationModal';
import {
  SubscriptionModal
} from '@/components/SubscriptionModal';
import EmailConfirmationSuccess from '@/components/EmailConfirmationSuccess';
import PasswordResetSuccess from '@/components/PasswordResetSuccess';
import PasswordResetForm from '@/components/PasswordResetForm';
import { getCurrentSession, signOut, onAuthStateChange } from '@/lib/auth-supabase';
import { getUser, updateUser, createUser, createUserSubscription, createSubscription } from '@/lib/database';
import { initializePayment } from '@/lib/pesapal';
import { uploadImage } from '@/lib/storage-supabase';
import { useLeads, useSubscription } from '@/lib/hooks';

export default function RentalLeadApp() {
  const [view, setView] = useState('landing');
  const [viewOptions, setViewOptions] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [prefilledData, setPrefilledData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [selectedAgentId, setSelectedAgentId] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);

  const handleOpenSubscriptionModal = () => setIsSubscriptionModalOpen(true);

  // Handle navigation with optional parameters
  const handleNavigate = (newView, options = {}) => {
    setView(newView);
    setViewOptions(options);

    // If initialData is provided, set it as prefilledData
    if (options.initialData) {
      setPrefilledData(options.initialData);
    } else if (['landing', 'user-dashboard', 'agent-dashboard'].includes(newView)) {
      // Clear prefilled data when navigating back to main views
      setPrefilledData(null);
    }
  };

  // Use custom hooks for data management
  // Only fetch leads if user is logged in (to avoid permission errors)
  const { leads } = useLeads({}, !!currentUser);
  const { isPremium } = useSubscription(currentUser?.id);

  // State for referral code from URL
  const [prefilledReferralCode, setPrefilledReferralCode] = useState('');

  // Check for OAuth callback errors and referral codes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const error = params.get('error');
      const viewParam = params.get('view');
      const refCode = params.get('ref');

      // Handle referral code from URL - redirect to agent registration with pre-filled code
      if (refCode) {
        setPrefilledReferralCode(refCode.toUpperCase());
        setView('agent-registration');
        // Keep the ref in URL so it persists if page refreshes
      }

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

    // Helper to cache user data in localStorage
    const cacheUserData = (userData) => {
      try {
        localStorage.setItem('rentconnect-user', JSON.stringify({
          data: userData,
          timestamp: Date.now()
        }));
      } catch (e) {
        console.warn('Failed to cache user data:', e);
      }
    };

    // Helper to get cached user data (valid for 5 minutes)
    const getCachedUserData = () => {
      try {
        const cached = localStorage.getItem('rentconnect-user');
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          // Cache valid for 5 minutes
          if (Date.now() - timestamp < 5 * 60 * 1000) {
            return data;
          }
        }
      } catch (e) {
        console.warn('Failed to get cached user data:', e);
      }
      return null;
    };

    // Helper to clear user cache
    const clearUserCache = () => {
      try {
        localStorage.removeItem('rentconnect-user');
      } catch (e) {
        console.warn('Failed to clear user cache:', e);
      }
    };

    // Setup Supabase auth listener
    const unsubscribe = onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);

      const user = session?.user;
      if (user) {
        try {
          // Try to use cached data first for faster initial load
          const cachedData = getCachedUserData();
          if (cachedData && cachedData.id === user.id && event !== 'SIGNED_IN') {
            // Use cached data immediately
            setCurrentUser({
              id: user.id,
              uid: user.id,
              email: user.email,
              ...cachedData
            });
          }

          // Always fetch fresh data in background
          const userResult = await getUser(user.id);

          if (userResult.success) {
            let userData = userResult.data;

            // Cache user data for faster subsequent loads
            cacheUserData(userData);

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
        // User logged out - clear cache
        clearUserCache();
        setCurrentUser(null);
        if (view !== 'landing' && view !== 'login' && view !== 'tenant-form' && view !== 'agent-registration') {
          setView('landing');
        }
      }
      // Only finish loading after auth state AND profile fetch are complete
      finishLoading();
    });

    // Initial mount check
    setMounted(true);

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Removed view dependency to prevent re-running on view change

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

  const handleNotificationClick = (notif) => {
    setSelectedNotification(notif);

    // Automatic navigation/tab switching if needed
    if (notif.type === 'agent_interested' || notif.type === 'agent_contact') {
      // If we are in user-dashboard, we might want to ensure we're on requests tab
      // But let the dashboard handle its own internal tab state if it can
    } else if (notif.type === 'new_lead') {
      // If we are in agent-dashboard, ensure we're on leads tab
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setCurrentUser(null);
      setIsSubscriptionModalOpen(false);
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
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : (
          formData.type && formData.type.includes('Bedroom')
            ? parseInt(formData.type)
            : (formData.type === 'Studio' ? 0 : 1)
        ),
        move_in_date: formData.moveInDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        requirements: {
          additional_requirements: formData.additionalRequirements || '',
          pincode: formData.pincode || '',
          amenities: formData.amenities || []
        }
      };

      let result;
      if (formData.id) {
        // Update existing lead
        result = await (await import('@/lib/database')).updateLead(formData.id, leadData);
      } else {
        // Create new lead
        result = await createLead(leadData);
      }

      if (result.success) {
        // Send confirmation email to tenant (only for new leads)
        if (!formData.id && leadData.tenant_email) {
          try {
            const emailContent = EMAIL_TEMPLATES.TENANT_CONFIRMATION(leadData.tenant_name, leadData);
            await sendEmailNotification(leadData.tenant_email, 'Request Submitted - Yoombaa', emailContent);
          } catch (emailError) {
            console.error('Error sending confirmation email:', emailError);
          }
        }

        return { success: true, data: result.data };
      }
      return { success: false, error: result.error || 'Failed to submit request' };
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
      const userId = currentUser?.uid || currentUser?.id;

      if (!userId) {
        alert('Please log in to make a purchase');
        setView('login');
        return;
      }

      // Determine payment type and amount
      let paymentType, description, amount, credits;

      if (paymentData.userId) {
        // User (tenant) subscription for viewing agent contacts
        paymentType = 'user_subscription';
        description = `${paymentData.planType || 'Monthly'} Tenant Subscription`;
        amount = paymentData.amount || 500;
      } else if (paymentData.credits) {
        // Agent buying credits
        paymentType = 'credit_purchase';
        credits = paymentData.credits;
        amount = typeof paymentData.price === 'string'
          ? parseInt(paymentData.price.replace(/[^0-9]/g, ''))
          : paymentData.price || 0;
        description = `${credits} Credits Bundle`;
      } else {
        // Agent premium subscription
        paymentType = 'agent_subscription';
        description = 'Premium Agent Subscription';
        amount = 2500;
      }

      // Initialize real Pesapal payment
      const result = await initializePayment({
        email: currentUser?.email,
        phone: currentUser?.phone || '',
        amount,
        description,
        firstName: currentUser?.name?.split(' ')[0] || '',
        lastName: currentUser?.name?.split(' ').slice(1).join(' ') || '',
        metadata: {
          type: paymentType,
          agentId: paymentType !== 'user_subscription' ? userId : undefined,
          userId: paymentType === 'user_subscription' ? paymentData.userId : undefined,
          planType: paymentData.planType || 'monthly',
          credits: credits || 0,
        },
      });

      if (result.success && result.redirectUrl) {
        // Redirect to Pesapal payment page
        window.location.href = result.redirectUrl;
      } else {
        alert('Failed to initialize payment: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Error processing payment: ' + error.message);
    }
  };

  const handleViewAgentProfile = (agent) => {
    setSelectedAgentId(agent.id);
    setView('agent-detail');
  };

  const renderView = () => {
    switch (view) {
      case 'landing':
        return <LandingPage onNavigate={handleNavigate} onSearch={handleSearch} currentUser={currentUser} authError={authError} onOpenSubscription={handleOpenSubscriptionModal} />;
      case 'login':
        return <Login onNavigate={handleNavigate} onLogin={handleLogin} authError={authError} initialTab={viewOptions.tab} />;
      case 'tenant-form':
        return (
          <TenantForm
            onNavigate={handleNavigate}
            onSubmit={handleTenantSubmit}
            initialData={prefilledData}
            currentUser={currentUser}
            onUpdateUser={(data) => setCurrentUser(prev => prev ? ({ ...prev, ...data }) : prev)}
          />
        );
      case 'user-dashboard':
        return (
          <UserDashboard
            onNavigate={handleNavigate}
            initialTab="dashboard"
            currentUser={currentUser}
            onUpdateUser={handleUpdateUser}
            onLogout={handleLogout}
            onNotificationClick={handleNotificationClick}
          />
        );
      case 'profile':
        return currentUser?.type === 'agent'
          ? (
            <AgentDashboard
              onNavigate={handleNavigate}
              leads={leads}
              isPremium={isPremium}
              onUnlockLead={(lead) => console.log('Lead unlocked:', lead)}
              onOpenSubscription={handleOpenSubscriptionModal}
              initialTab="profile"
              currentUser={currentUser}
              onUpdateUser={handleUpdateUser}
              onLogout={handleLogout}
              onNotificationClick={handleNotificationClick}
            />
          )
          : (
            <UserDashboard
              onNavigate={handleNavigate}
              initialTab="profile"
              currentUser={currentUser}
              onUpdateUser={handleUpdateUser}
              onLogout={handleLogout}
              onNotificationClick={handleNotificationClick}
            />
          );
      case 'agent-registration':
        return <AgentRegistration onNavigate={handleNavigate} onSubmit={handleAgentRegistration} initialReferralCode={prefilledReferralCode} />;
      case 'agent-dashboard':
        return (
          <AgentDashboard
            onNavigate={handleNavigate}
            leads={leads}
            isPremium={isPremium}
            onUnlockLead={(lead) => console.log('Lead unlocked:', lead)}
            onOpenSubscription={handleOpenSubscriptionModal}
            initialTab="leads"
            currentUser={currentUser}
            onUpdateUser={handleUpdateUser}
            onLogout={handleLogout}
            onNotificationClick={handleNotificationClick}
          />
        );
      case 'agents-listing':
        // Only allow agents to access the agents listing - redirect tenants to dashboard
        if (currentUser && currentUser.type !== 'agent') {
          return (
            <UserDashboard
              onNavigate={handleNavigate}
              initialTab="dashboard"
              currentUser={currentUser}
              onUpdateUser={handleUpdateUser}
              onLogout={handleLogout}
              onNotificationClick={handleNotificationClick}
            />
          );
        }
        return (
          <AgentsListingPage
            currentUser={currentUser}
            onNavigate={handleNavigate}
            onViewAgentProfile={handleViewAgentProfile}
            onOpenSubscription={handleOpenSubscriptionModal}
          />
        );
      case 'agent-detail':
        // Only allow agents to access agent details - redirect tenants to dashboard
        if (currentUser && currentUser.type !== 'agent') {
          return (
            <UserDashboard
              onNavigate={handleNavigate}
              initialTab="dashboard"
              currentUser={currentUser}
              onUpdateUser={handleUpdateUser}
              onLogout={handleLogout}
              onNotificationClick={handleNotificationClick}
            />
          );
        }
        return (
          <AgentDetailPage
            agentId={selectedAgentId}
            currentUser={currentUser}
            onNavigate={handleNavigate}
            onBack={() => handleNavigate('agents-listing')}
          />
        );
      case 'user-subscription':
        return (
          <UserSubscriptionPage
            currentUser={currentUser}
            onNavigate={handleNavigate}
            onSubscribe={handleSubscribe}
          />
        );
      case 'admin-dashboard':
        return (
          <AdminDashboard
            currentUser={currentUser}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
            onNotificationClick={handleNotificationClick}
          />
        );
      case 'properties':
        return (
          <PropertiesPage
            onNavigate={handleNavigate}
            currentUser={currentUser}
            isPremium={isPremium}
            onOpenSubscription={handleOpenSubscriptionModal}
          />
        );
      case 'email-confirmed':
        return (
          <EmailConfirmationSuccess
            onContinue={() => {
              if (currentUser) {
                const dashboardView = currentUser.role === 'agent' ? 'agent-dashboard' : 'user-dashboard';
                handleNavigate(dashboardView);
              } else {
                handleNavigate('login');
              }
            }}
            onGoHome={() => handleNavigate('landing')}
          />
        );
      case 'password-reset-success':
        return (
          <PasswordResetSuccess
            onContinue={() => handleNavigate('login')}
            onSignIn={() => handleNavigate('login')}
          />
        );
      case 'reset-password':
        return (
          <PasswordResetForm
            onSuccess={() => handleNavigate('password-reset-success')}
            onCancel={() => handleNavigate('landing')}
          />
        );
      default:
        return <LandingPage onNavigate={handleNavigate} onSearch={handleSearch} />;
    }
  };

  return (
    <main className="min-h-screen bg-white">
      {(!mounted || loading) ? (
        <LoadingScreen />
      ) : (
        <>
          {currentUser && view !== 'landing' && view !== 'login' && view !== 'user-dashboard' && view !== 'agent-dashboard' && view !== 'admin-dashboard' && view !== 'email-confirmed' && view !== 'password-reset-success' && view !== 'reset-password' && (
            <Header
              onNavigate={handleNavigate}
              currentUser={currentUser}
              onLogout={handleLogout}
            />
          )}
          {renderView()}

          <SubscriptionModal
            isOpen={isSubscriptionModalOpen}
            onClose={() => setIsSubscriptionModalOpen(false)}
            onBuyCredits={handleSubscribe}
            currentUser={currentUser}
          />
          <NotificationModal
            notification={selectedNotification}
            onClose={() => setSelectedNotification(null)}
            currentUser={currentUser}
          />
        </>
      )}
    </main>
  );
}
