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
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

// Mock Data
const INITIAL_LEADS = [
  { id: 1, name: "Chioma Adebayo", location: "Yaba, Lagos", type: "2 Bedroom", budget: "KSh 1.5M", whatsapp: "2348012345678" },
  { id: 2, name: "Emmanuel Okonkwo", location: "Lekki Phase 1", type: "3 Bedroom", budget: "KSh 4.5M", whatsapp: "2348087654321" },
  { id: 3, name: "Sarah Johnson", location: "Surulere", type: "Mini Flat", budget: "KSh 800k", whatsapp: "2348123456789" },
  { id: 4, name: "Tunde Bakare", location: "Ikeja GRA", type: "Self Contain", budget: "KSh 600k", whatsapp: "2348098765432" },
];

export default function RentalLeadApp() {
  const [view, setView] = useState('landing');
  const [currentUser, setCurrentUser] = useState(null); // null | { name, type: 'tenant'|'agent', ... }
  const [agentStatus, setAgentStatus] = useState('free'); // 'free' | 'premium'
  const [leads, setLeads] = useState(INITIAL_LEADS);
  const [prefilledData, setPrefilledData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in, fetch additional profile data from Firestore
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setCurrentUser({
              uid: user.uid,
              email: user.email,
              ...userData
            });
            
            // Redirect based on role if on login page
            if (view === 'login') {
              if (userData.type === 'agent') {
                setView('agent-dashboard');
              } else {
                setView('user-dashboard');
              }
            }
          } else {
            // User exists in Auth but not in Firestore (e.g. first time Google Login)
            // We'll handle this by keeping them on the current view or redirecting to a setup page
            // For now, let's assume they are a tenant if no profile exists, or let Login component handle it
            setCurrentUser({
              uid: user.uid,
              email: user.email,
              name: user.displayName,
              avatar: user.photoURL,
              type: 'tenant' // Default or temporary
            });
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else {
        // User is signed out
        setCurrentUser(null);
        setView('landing');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [view]);

  const handleLogin = (user) => {
    // This is now mostly handled by the useEffect, but can be used for immediate state updates if needed
    // or to handle the "first time setup" flow passed from Login component
    setCurrentUser(user);
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

  const handleUpdateUser = (updatedUser) => {
    setCurrentUser(prev => ({ ...prev, ...updatedUser }));
  };

  const handleTenantSubmit = (formData) => {
    const newLead = {
      id: leads.length + 1,
      ...formData
    };
    setLeads([newLead, ...leads]);
    // Auto-login as tenant after submission for demo
    setCurrentUser({
      name: formData.name || 'New User',
      type: 'tenant',
      email: formData.email || 'user@example.com',
      phone: formData.phone || '',
      city: formData.location || 'Lagos'
    });
    alert("Request posted successfully! Agents will contact you soon.");
    setView('user-dashboard');
  };

  const handleSearch = (searchData) => {
    setPrefilledData(searchData);
    setView('tenant-form');
  };

  const handleAgentRegistration = (formData) => {
    // Auto-login as agent after registration
    setCurrentUser({
      name: formData.fullName || 'New Agent',
      type: 'agent',
      email: formData.email || 'agent@example.com',
      agencyName: formData.agencyName,
      phone: formData.phone,
      location: formData.location || 'Lagos',
      experience: '0 Years'
    });
    setView('agent-dashboard');
  };

  const handleSubscribe = () => {
    // Simulate payment processing
    setTimeout(() => {
      setAgentStatus('premium');
      setView('agent-dashboard');
    }, 1000);
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
      case 'profile': // Generic profile route, redirects based on user type
        return currentUser?.type === 'agent' 
          ? (
            <AgentDashboard 
              onNavigate={setView} 
              leads={leads} 
              isPremium={agentStatus === 'premium'} 
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
            isPremium={agentStatus === 'premium'}
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
