import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  createLead,
  getAllLeads,
  subscribeToLeads,
  createProperty,
  getAgentProperties,
  searchProperties,
  createUser,
  getUser,
  updateUser,
  checkSubscriptionStatus,
  getSavedProperties,
  saveProperty,
  unsaveProperty,
  getUserContactHistory,
  addContactHistory,
  getUserNotifications,
  subscribeToNotifications,
  incrementLeadContacts,
  incrementLeadViews
} from './database';

// Hook for managing leads
export const useLeads = (filters = {}, enabled = true) => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Memoize filters to prevent unnecessary re-renders
  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedFilters = useMemo(() => filters, [filtersKey]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    let unsubscribe;

    const fetchLeads = async () => {
      try {
        setLoading(true);
        const result = await getAllLeads(memoizedFilters);
        if (result.success) {
          setLeads(result.data);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // Subscribe to real-time updates
    if (typeof window !== 'undefined') {
      unsubscribe = subscribeToLeads((updatedLeads) => {
        setLeads(updatedLeads);
        setLoading(false);
      }, memoizedFilters);
    } else {
      fetchLeads();
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [filtersKey, memoizedFilters, enabled]);

  return { leads, loading, error, setLeads };
};

// Hook for managing agent properties
export const useAgentProperties = (agentId) => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!agentId) {
      setLoading(false);
      return;
    }

    const fetchProperties = async () => {
      try {
        setLoading(true);
        const result = await getAgentProperties(agentId);
        if (result.success) {
          setProperties(result.data);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [agentId]);

  return { properties, loading, error, setProperties };
};

// Hook for managing user subscription
export const useSubscription = (agentId) => {
  const [isPremium, setIsPremium] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!agentId) {
      setLoading(false);
      return;
    }

    const checkSubscription = async () => {
      try {
        setLoading(true);
        const result = await checkSubscriptionStatus(agentId);
        setIsPremium(result.isPremium);
        setSubscription(result.subscription);
      } catch (err) {
        console.error('Error checking subscription:', err);
      } finally {
        setLoading(false);
      }
    };

    checkSubscription();
  }, [agentId]);

  return { isPremium, subscription, loading };
};

// Hook for managing saved properties
export const useSavedProperties = (userId) => {
  const [savedProperties, setSavedProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSavedProperties = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await getSavedProperties(userId);
      if (result.success) {
        setSavedProperties(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchSavedProperties();
  }, [fetchSavedProperties]);

  const toggleSave = async (propertyId) => {
    const isSaved = savedProperties.some(p => p.id === propertyId);
    
    if (isSaved) {
      const result = await unsaveProperty(userId, propertyId);
      if (result.success) {
        setSavedProperties(prev => prev.filter(p => p.id !== propertyId));
      }
    } else {
      const result = await saveProperty(userId, propertyId);
      if (result.success) {
        fetchSavedProperties();
      }
    }
  };

  return { savedProperties, loading, error, toggleSave, refetch: fetchSavedProperties };
};

// Hook for managing contact history
export const useContactHistory = (userId) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistory = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await getUserContactHistory(userId);
      if (result.success) {
        setHistory(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const addContact = async (contactData) => {
    const result = await addContactHistory({
      userId,
      ...contactData
    });
    
    if (result.success) {
      fetchHistory();
    }
    
    return result;
  };

  return { history, loading, error, addContact, refetch: fetchHistory };
};

// Hook for managing notifications
export const useNotifications = (userId) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // Subscribe to real-time notifications
    const unsubscribe = subscribeToNotifications(userId, (updatedNotifications) => {
      setNotifications(updatedNotifications);
      setUnreadCount(updatedNotifications.filter(n => !n.read).length);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { notifications, unreadCount, loading };
};

// Hook for property search
export const usePropertySearch = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = async (searchParams) => {
    try {
      setLoading(true);
      setError(null);
      const result = await searchProperties(searchParams);
      if (result.success) {
        setResults(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { results, loading, error, search };
};

// Utility functions
export const handleLeadView = async (leadId) => {
  await incrementLeadViews(leadId);
};

export const handleLeadContact = async (leadId) => {
  await incrementLeadContacts(leadId);
};

/**
 * Hook for detecting scroll direction (mobile only)
 * Used for smart navigation bar hide/show behavior
 *
 * @param {Object} options - Configuration options
 * @param {number} options.threshold - Minimum scroll distance to trigger direction change (default: 10)
 * @param {HTMLElement|null} options.scrollContainer - Custom scroll container (default: window)
 * @returns {Object} { scrollDirection, isAtTop, isScrollable, showNav }
 */
export const useScrollDirection = (options = {}) => {
  const { threshold = 10, scrollContainer = null } = options;

  const [scrollDirection, setScrollDirection] = useState('up');
  const [isAtTop, setIsAtTop] = useState(true);
  const [isScrollable, setIsScrollable] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check if content is scrollable
  useEffect(() => {
    const checkScrollable = () => {
      const container = scrollContainer || document.documentElement;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight || window.innerHeight;
      setIsScrollable(scrollHeight > clientHeight + 50); // 50px buffer
    };

    checkScrollable();

    // Recheck on resize and content changes
    window.addEventListener('resize', checkScrollable);
    const observer = new MutationObserver(checkScrollable);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('resize', checkScrollable);
      observer.disconnect();
    };
  }, [scrollContainer]);

  // Handle scroll direction detection
  useEffect(() => {
    if (!isMobile) return; // Only run on mobile

    const handleScroll = () => {
      const container = scrollContainer || window;
      const currentScrollY = scrollContainer
        ? scrollContainer.scrollTop
        : window.scrollY;

      // Update isAtTop
      setIsAtTop(currentScrollY < 10);

      // Determine scroll direction with threshold
      const scrollDiff = currentScrollY - lastScrollY;

      if (Math.abs(scrollDiff) >= threshold) {
        if (scrollDiff > 0 && currentScrollY > 50) {
          // Scrolling down (and not at the very top)
          setScrollDirection('down');
        } else if (scrollDiff < 0) {
          // Scrolling up
          setScrollDirection('up');
        }
        setLastScrollY(currentScrollY);
      }
    };

    const target = scrollContainer || window;
    target.addEventListener('scroll', handleScroll, { passive: true });

    return () => target.removeEventListener('scroll', handleScroll);
  }, [isMobile, lastScrollY, threshold, scrollContainer]);

  // Determine if nav should be shown
  // Show nav when: not mobile, scrolling up, at top, or content is not scrollable
  const showNav = !isMobile || scrollDirection === 'up' || isAtTop || !isScrollable;

  return { scrollDirection, isAtTop, isScrollable, showNav, isMobile };
};
