'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Bug, X, ChevronDown, ChevronUp, Database, User, Globe, Server, AlertCircle, CheckCircle, Loader2, RefreshCw, Trash2, Copy, Check, Filter } from 'lucide-react';

export default function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [logs, setLogs] = useState([]);
  const [copiedId, setCopiedId] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'errors', 'warnings', 'info'
  const [expandedLogs, setExpandedLogs] = useState(new Set());
  const [status, setStatus] = useState({
    database: { status: 'checking', message: 'Checking...', details: null },
    auth: { status: 'checking', message: 'Checking...', user: null },
    api: { status: 'checking', message: 'Checking...', endpoints: {} },
    env: { status: 'checking', message: 'Checking...', vars: {} },
  });

  // Track if initial checks have run to prevent duplicates
  const hasInitialized = useRef(false);
  const authSubscriptionRef = useRef(null);
  const consoleOverrideRef = useRef(false);
  const fetchOverrideRef = useRef(false);

  const addLog = useCallback((type, category, message, details = null) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-50), { id: Date.now() + Math.random(), type, category, message, details, timestamp }]);
  }, []);

  // Copy error to clipboard
  const copyToClipboard = async (log) => {
    const textToCopy = `[${log.timestamp}] [${log.category}] ${log.message}${log.details ? '\n\nDetails: ' + JSON.stringify(log.details, null, 2) : ''}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedId(log.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      // Silently fail
    }
  };

  // Copy all errors
  const copyAllErrors = async () => {
    const errors = logs.filter(l => l.type === 'error');
    if (errors.length === 0) return;
    
    const textToCopy = errors.map(log => 
      `[${log.timestamp}] [${log.category}] ${log.message}${log.details ? '\nDetails: ' + JSON.stringify(log.details, null, 2) : ''}`
    ).join('\n\n---\n\n');
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedId('all');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      // Silently fail
    }
  };

  // Check Database Connection
  const checkDatabase = useCallback(async () => {
    setStatus(prev => ({ ...prev, database: { ...prev.database, status: 'checking', message: 'Testing connection...' } }));
    addLog('info', 'Database', 'Testing database connection...');

    try {
      const supabase = createClient();
      const startTime = Date.now();

      // Use a longer timeout (15s) to handle serverless cold starts
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connection timeout (15s)')), 15000)
      );

      // Test basic query - use a simpler query that doesn't require auth
      const queryPromise = supabase.from('users').select('id', { count: 'exact', head: true });
      
      const { error, count } = await Promise.race([queryPromise, timeoutPromise]);
      const latency = Date.now() - startTime;
      
      if (error) {
        // Check if it's just a permission error (which means DB is connected)
        if (error.code === 'PGRST301' || error.message?.includes('permission')) {
          setStatus(prev => ({
            ...prev,
            database: { 
              status: 'connected', 
              message: `Connected (${latency}ms) - Auth required for data`,
              details: { latency, note: 'Database reachable, authentication needed for queries' }
            }
          }));
          addLog('success', 'Database', `Connected in ${latency}ms (auth required for data)`);
        } else {
          setStatus(prev => ({
            ...prev,
            database: { 
              status: 'error', 
              message: error.message,
              details: { code: error.code, hint: error.hint || '', latency }
            }
          }));
          addLog('error', 'Database', `Connection failed: ${error.message}`, { code: error.code, hint: error.hint });
        }
      } else {
        setStatus(prev => ({
          ...prev,
          database: { 
            status: 'connected', 
            message: `Connected (${latency}ms)`,
            details: { latency, timestamp: new Date().toISOString() }
          }
        }));
        addLog('success', 'Database', `Connected successfully in ${latency}ms`);
      }
    } catch (err) {
      // Handle network errors gracefully
      const errorMessage = err.message || 'Unknown error';
      const isNetworkError = errorMessage.includes('Failed to fetch') || errorMessage.includes('timeout');
      
      setStatus(prev => ({
        ...prev,
        database: { 
          status: 'error', 
          message: isNetworkError ? 'Network error - check internet connection' : errorMessage,
          details: { 
            error: errorMessage,
            hint: isNetworkError ? 'This may be a temporary network issue. Try refreshing.' : ''
          }
        }
      }));
      addLog('error', 'Database', `Exception: ${errorMessage}`, { message: errorMessage });
    }
  }, [addLog]);

  // Check Auth Status
  const checkAuth = useCallback(async () => {
    setStatus(prev => ({ ...prev, auth: { ...prev.auth, status: 'checking', message: 'Checking auth...' } }));
    addLog('info', 'Auth', 'Checking authentication status...');
    
    try {
      const supabase = createClient();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        setStatus(prev => ({
          ...prev,
          auth: { status: 'error', message: sessionError.message, user: null }
        }));
        addLog('error', 'Auth', `Session error: ${sessionError.message}`, sessionError);
        return;
      }

      if (session?.user) {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          setStatus(prev => ({
            ...prev,
            auth: { status: 'error', message: userError.message, user: null }
          }));
          addLog('error', 'Auth', `User fetch error: ${userError.message}`, userError);
        } else {
          setStatus(prev => ({
            ...prev,
            auth: { 
              status: 'authenticated', 
              message: `Logged in as ${user.email}`,
              user: {
                id: user.id,
                email: user.email,
                role: user.user_metadata?.role || 'N/A',
                provider: user.app_metadata?.provider || 'email',
                lastSignIn: user.last_sign_in_at
              }
            }
          }));
          addLog('success', 'Auth', `Authenticated: ${user.email}`);
        }
      } else {
        setStatus(prev => ({
          ...prev,
          auth: { status: 'unauthenticated', message: 'Not logged in', user: null }
        }));
        addLog('info', 'Auth', 'No active session');
      }
    } catch (err) {
      setStatus(prev => ({
        ...prev,
        auth: { status: 'error', message: err.message, user: null }
      }));
      addLog('error', 'Auth', `Exception: ${err.message}`, err);
    }
  }, [addLog]);

  // Check API Endpoints
  const checkAPIs = useCallback(async () => {
    setStatus(prev => ({ ...prev, api: { ...prev.api, status: 'checking', message: 'Testing APIs...' } }));
    addLog('info', 'API', 'Testing API endpoints...');
    
    const endpoints = [
      { name: 'Health', path: '/api/health', method: 'GET', allowedCodes: [200] },
      { name: 'Leads', path: '/api/leads', method: 'GET', allowedCodes: [200, 401] }, // 401 is OK if not logged in
      { name: 'Send Email', path: '/api/send-email', method: 'OPTIONS', allowedCodes: [200, 204] },
    ];

    const results = {};
    let hasError = false;

    for (const endpoint of endpoints) {
      try {
        const startTime = Date.now();
        const response = await fetch(endpoint.path, { 
          method: endpoint.method,
          headers: { 'Content-Type': 'application/json' }
        });
        const latency = Date.now() - startTime;
        
        const isAllowed = endpoint.allowedCodes.includes(response.status);
        
        results[endpoint.name] = {
          status: isAllowed ? 'ok' : 'error',
          httpStatus: response.status,
          latency,
          statusText: response.statusText
        };

        if (!isAllowed) {
          hasError = true;
          addLog('error', 'API', `${endpoint.name}: ${response.status} ${response.statusText}`);
        } else {
          addLog('success', 'API', `${endpoint.name}: ${response.status} (${latency}ms)`);
        }
      } catch (err) {
        hasError = true;
        results[endpoint.name] = { status: 'error', message: err.message };
        addLog('error', 'API', `${endpoint.name}: ${err.message}`, err);
      }
    }

    setStatus(prev => ({
      ...prev,
      api: { 
        status: hasError ? 'partial' : 'ok', 
        message: hasError ? 'Some APIs have issues' : 'All APIs responding',
        endpoints: results
      }
    }));
  }, [addLog]);

  // Check Environment Variables
  const checkEnv = useCallback(() => {
    addLog('info', 'Env', 'Checking environment variables...');
    
    const vars = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Set' : '✗ Missing',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing',
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || '✗ Missing',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || '✗ Missing',
    };

    const missingCount = Object.values(vars).filter(v => v.includes('Missing')).length;
    
    setStatus(prev => ({
      ...prev,
      env: {
        status: missingCount > 0 ? 'warning' : 'ok',
        message: missingCount > 0 ? `${missingCount} missing vars` : 'All vars set',
        vars
      }
    }));

    if (missingCount > 0) {
      addLog('warning', 'Env', `${missingCount} environment variables missing`);
    } else {
      addLog('success', 'Env', 'All public environment variables set');
    }
  }, [addLog]);

  // Run all checks
  const runAllChecks = useCallback(async () => {
    addLog('info', 'System', '=== Starting diagnostics ===');
    checkEnv();
    await checkDatabase();
    await checkAuth();
    await checkAPIs();
    addLog('info', 'System', '=== Diagnostics complete ===');
  }, [checkEnv, checkDatabase, checkAuth, checkAPIs, addLog]);

  // Listen for auth state changes - only set up once
  useEffect(() => {
    if (authSubscriptionRef.current) return;
    
    const supabase = createClient();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      addLog('info', 'Auth', `Auth event: ${event}`);
      if (event === 'SIGNED_IN') {
        addLog('success', 'Auth', `User signed in: ${session?.user?.email}`);
        checkAuth();
      } else if (event === 'SIGNED_OUT') {
        addLog('info', 'Auth', 'User signed out');
        setStatus(prev => ({
          ...prev,
          auth: { status: 'unauthenticated', message: 'Not logged in', user: null }
        }));
      } else if (event === 'TOKEN_REFRESHED') {
        addLog('success', 'Auth', 'Token refreshed');
      } else if (event === 'USER_UPDATED') {
        addLog('info', 'Auth', 'User profile updated');
        checkAuth();
      }
    });

    authSubscriptionRef.current = subscription;

    return () => {
      subscription.unsubscribe();
      authSubscriptionRef.current = null;
    };
  }, [addLog, checkAuth]);

  // Intercept console errors - only set up once
  useEffect(() => {
    if (consoleOverrideRef.current) return;
    consoleOverrideRef.current = true;
    
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalLog = console.log;

    // Helper to safely stringify objects
    const safeStringify = (obj, depth = 0) => {
      if (depth > 2) return '[Object]';
      if (obj === null) return 'null';
      if (obj === undefined) return 'undefined';
      if (typeof obj === 'function') return '[Function]';
      if (typeof obj === 'symbol') return obj.toString();
      if (obj instanceof Error) {
        return `${obj.name}: ${obj.message}${obj.stack ? '\n' + obj.stack.split('\n').slice(0, 3).join('\n') : ''}`;
      }
      if (typeof obj === 'object') {
        try {
          // Handle circular references
          const seen = new WeakSet();
          return JSON.stringify(obj, (key, value) => {
            if (typeof value === 'object' && value !== null) {
              if (seen.has(value)) return '[Circular]';
              seen.add(value);
            }
            return value;
          }, 2);
        } catch (e) {
          return '[Object - cannot stringify]';
        }
      }
      return String(obj);
    };

    // Format console arguments
    const formatArgs = (args) => {
      return args.map(arg => safeStringify(arg)).join(' ');
    };

    // Extract error details
    const extractErrorDetails = (args) => {
      for (const arg of args) {
        if (arg instanceof Error) {
          return {
            name: arg.name,
            message: arg.message,
            stack: arg.stack?.split('\n').slice(0, 5).join('\n')
          };
        }
        if (typeof arg === 'object' && arg !== null) {
          if (arg.message || arg.error || arg.stack) {
            return arg;
          }
        }
      }
      return null;
    };

    console.error = (...args) => {
      const message = formatArgs(args);
      const details = extractErrorDetails(args);
      
      // Categorize errors
      let category = 'Console';
      if (message.includes('React') || message.includes('component') || message.includes('render')) {
        category = 'React';
      } else if (message.includes('Supabase') || message.includes('auth')) {
        category = 'Auth';
      } else if (message.includes('fetch') || message.includes('network') || message.includes('CORS')) {
        category = 'Network';
      } else if (message.includes('TypeError') || message.includes('ReferenceError') || message.includes('SyntaxError')) {
        category = 'JS Error';
      }
      
      addLog('error', category, message.substring(0, 500), details);
      originalError.apply(console, args);
    };

    console.warn = (...args) => {
      const message = formatArgs(args);
      
      // Skip certain noisy warnings
      if (message.includes('Warning: Each child') || message.includes('Warning: validateDOMNesting')) {
        originalWarn.apply(console, args);
        return;
      }
      
      let category = 'Console';
      if (message.includes('React')) category = 'React';
      if (message.includes('deprecat')) category = 'Deprecation';
      
      addLog('warning', category, message.substring(0, 500));
      originalWarn.apply(console, args);
    };

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
      consoleOverrideRef.current = false;
    };
  }, [addLog]);

  // Global error handler for uncaught errors
  useEffect(() => {
    const handleGlobalError = (event) => {
      const { message, filename, lineno, colno, error } = event;
      addLog('error', 'Uncaught', `${message} at ${filename}:${lineno}:${colno}`, {
        message,
        file: filename,
        line: lineno,
        column: colno,
        stack: error?.stack?.split('\n').slice(0, 5).join('\n')
      });
    };

    const handleUnhandledRejection = (event) => {
      const reason = event.reason;
      const message = reason instanceof Error ? reason.message : String(reason);
      addLog('error', 'Promise', `Unhandled rejection: ${message}`, {
        message,
        stack: reason?.stack?.split('\n').slice(0, 5).join('\n')
      });
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [addLog]);

  // Initial check - only run once
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    runAllChecks();
  }, [runAllChecks]);

  // Intercept fetch errors globally - only set up once
  useEffect(() => {
    if (fetchOverrideRef.current) return;
    fetchOverrideRef.current = true;
    
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || 'unknown';
      try {
        const response = await originalFetch.apply(window, args);
        // Only log actual errors, not 401s for auth endpoints or expected responses
        if (!response.ok && response.status >= 400) {
          // Skip logging certain expected errors
          const isAuthEndpoint = url.includes('/auth/') || url.includes('token');
          const isExpected401 = response.status === 401 && url.includes('/api/leads');
          
          if (!isAuthEndpoint && !isExpected401) {
            addLog('error', 'Fetch', `${response.status} : ${url}`);
          }
        }
        return response;
      } catch (err) {
        addLog('error', 'Fetch', `Failed: ${url} - ${err.message}`);
        throw err;
      }
    };

    return () => {
      window.fetch = originalFetch;
      fetchOverrideRef.current = false;
    };
  }, [addLog]);

  const getStatusIcon = (statusType) => {
    switch (statusType) {
      case 'connected':
      case 'authenticated':
      case 'ok':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
      case 'partial':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'checking':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getLogColor = (type) => {
    switch (type) {
      case 'error': return 'text-red-400 bg-red-900/30 border border-red-800/50';
      case 'warning': return 'text-yellow-400 bg-yellow-900/20 border border-yellow-800/30';
      case 'success': return 'text-green-400 bg-green-900/20 border border-green-800/30';
      case 'info': return 'text-blue-400 bg-blue-900/20 border border-blue-800/30';
      default: return 'text-gray-400 border border-gray-700';
    }
  };

  const errorCount = logs.filter(l => l.type === 'error').length;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-[9999] bg-gray-900 text-white p-3 rounded-full shadow-lg hover:bg-gray-800 transition-all border border-gray-700"
        title="Open Debug Panel"
      >
        <Bug className="w-5 h-5" />
        {errorCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
            {errorCount > 9 ? '9+' : errorCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 z-[9999] bg-gray-900 text-white rounded-lg shadow-2xl border border-gray-700 transition-all ${isMinimized ? 'w-80' : 'w-[520px]'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700 bg-gray-800 rounded-t-lg">
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4 text-yellow-500" />
          <span className="font-semibold text-sm">Debug Panel</span>
          {errorCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{errorCount} errors</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {errorCount > 0 && (
            <button 
              onClick={copyAllErrors} 
              className="p-1 hover:bg-gray-700 rounded flex items-center gap-1 text-xs text-red-400" 
              title="Copy all errors"
            >
              {copiedId === 'all' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>Copy Errors</span>
            </button>
          )}
          <button onClick={runAllChecks} className="p-1 hover:bg-gray-700 rounded" title="Refresh all">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setLogs([])} className="p-1 hover:bg-gray-700 rounded" title="Clear logs">
            <Trash2 className="w-4 h-4" />
          </button>
          <button onClick={() => setIsMinimized(!isMinimized)} className="p-1 hover:bg-gray-700 rounded">
            {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-700 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Status Cards */}
          <div className="p-3 grid grid-cols-2 gap-2 border-b border-gray-700">
            {/* Database Status */}
            <div className="bg-gray-800 p-2 rounded border border-gray-700">
              <div className="flex items-center gap-2 mb-1">
                <Database className="w-3 h-3 text-blue-400" />
                <span className="text-xs font-medium">Database</span>
                {getStatusIcon(status.database.status)}
              </div>
              <p className="text-xs text-gray-400 truncate">{status.database.message}</p>
            </div>

            {/* Auth Status */}
            <div className="bg-gray-800 p-2 rounded border border-gray-700">
              <div className="flex items-center gap-2 mb-1">
                <User className="w-3 h-3 text-purple-400" />
                <span className="text-xs font-medium">Auth</span>
                {getStatusIcon(status.auth.status)}
              </div>
              <p className="text-xs text-gray-400 truncate">{status.auth.message}</p>
            </div>

            {/* API Status */}
            <div className="bg-gray-800 p-2 rounded border border-gray-700">
              <div className="flex items-center gap-2 mb-1">
                <Server className="w-3 h-3 text-green-400" />
                <span className="text-xs font-medium">APIs</span>
                {getStatusIcon(status.api.status)}
              </div>
              <p className="text-xs text-gray-400 truncate">{status.api.message}</p>
            </div>

            {/* Env Status */}
            <div className="bg-gray-800 p-2 rounded border border-gray-700">
              <div className="flex items-center gap-2 mb-1">
                <Globe className="w-3 h-3 text-orange-400" />
                <span className="text-xs font-medium">Environment</span>
                {getStatusIcon(status.env.status)}
              </div>
              <p className="text-xs text-gray-400 truncate">{status.env.message}</p>
            </div>
          </div>

          {/* Environment Variables Detail */}
          {status.env.vars && Object.keys(status.env.vars).length > 0 && (
            <div className="px-3 py-2 border-b border-gray-700 bg-gray-800/50">
              <p className="text-xs font-medium text-gray-400 mb-1">Environment Variables:</p>
              <div className="text-xs font-mono space-y-0.5">
                {Object.entries(status.env.vars).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-gray-500">{key}:</span>
                    <span className={value.includes('Missing') ? 'text-red-400' : 'text-green-400'}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Auth User Details */}
          {status.auth.user && (
            <div className="px-3 py-2 border-b border-gray-700 bg-gray-800/50">
              <p className="text-xs font-medium text-gray-400 mb-1">User Details:</p>
              <div className="text-xs font-mono space-y-0.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">Email:</span>
                  <span className="text-white">{status.auth.user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Role:</span>
                  <span className="text-white">{status.auth.user.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Provider:</span>
                  <span className="text-white">{status.auth.user.provider}</span>
                </div>
              </div>
            </div>
          )}

          {/* Logs */}
          <div className="max-h-64 overflow-y-auto">
            <div className="px-3 py-1.5 bg-gray-800 sticky top-0 border-b border-gray-700 flex justify-between items-center z-10">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-400">Logs ({logs.length})</span>
                {/* Filter buttons */}
                <div className="flex gap-1">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-1.5 py-0.5 text-[10px] rounded ${filter === 'all' ? 'bg-gray-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilter('errors')}
                    className={`px-1.5 py-0.5 text-[10px] rounded ${filter === 'errors' ? 'bg-red-600 text-white' : 'text-red-400 hover:text-red-300'}`}
                  >
                    Errors ({logs.filter(l => l.type === 'error').length})
                  </button>
                  <button
                    onClick={() => setFilter('warnings')}
                    className={`px-1.5 py-0.5 text-[10px] rounded ${filter === 'warnings' ? 'bg-yellow-600 text-white' : 'text-yellow-400 hover:text-yellow-300'}`}
                  >
                    Warn
                  </button>
                </div>
              </div>
              <span className="text-[10px] text-gray-500">Click to expand</span>
            </div>
            <div className="p-2 space-y-1">
              {logs.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">No logs yet</p>
              ) : (
                logs
                  .filter(log => {
                    if (filter === 'all') return true;
                    if (filter === 'errors') return log.type === 'error';
                    if (filter === 'warnings') return log.type === 'warning';
                    return true;
                  })
                  .slice()
                  .reverse()
                  .map((log) => {
                    const isExpanded = expandedLogs.has(log.id);
                    const getCategoryColor = (cat) => {
                      const colors = {
                        'React': 'text-cyan-400',
                        'Auth': 'text-purple-400',
                        'Network': 'text-orange-400',
                        'Fetch': 'text-orange-400',
                        'JS Error': 'text-red-400',
                        'Uncaught': 'text-red-500',
                        'Promise': 'text-pink-400',
                        'Database': 'text-blue-400',
                        'API': 'text-green-400',
                        'Env': 'text-yellow-400',
                        'System': 'text-gray-400',
                        'Console': 'text-gray-300',
                        'Deprecation': 'text-amber-400',
                      };
                      return colors[cat] || 'text-gray-400';
                    };

                    return (
                      <div 
                        key={log.id} 
                        className={`text-xs p-2 rounded cursor-pointer transition-all ${getLogColor(log.type)} ${isExpanded ? 'ring-1 ring-white/20' : ''}`}
                        onClick={() => {
                          setExpandedLogs(prev => {
                            const next = new Set(prev);
                            if (next.has(log.id)) next.delete(log.id);
                            else next.add(log.id);
                            return next;
                          });
                        }}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-gray-500 shrink-0 font-mono text-[10px]">{log.timestamp}</span>
                          <span className={`font-medium shrink-0 ${getCategoryColor(log.category)}`}>[{log.category}]</span>
                          <span className={`flex-1 ${isExpanded ? '' : 'truncate'}`}>{log.message}</span>
                          <div className="flex items-center gap-1 shrink-0">
                            {(log.type === 'error' || log.type === 'warning') && (
                              <button 
                                className="p-0.5 hover:bg-gray-700 rounded"
                                onClick={(e) => { e.stopPropagation(); copyToClipboard(log); }}
                                title="Copy"
                              >
                                {copiedId === log.id ? (
                                  <Check className="w-3 h-3 text-green-400" />
                                ) : (
                                  <Copy className="w-3 h-3 text-gray-400" />
                                )}
                              </button>
                            )}
                            <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </div>
                        </div>
                        {isExpanded && log.details && (
                          <div className="mt-2 pt-2 border-t border-gray-700/50">
                            <p className="text-[10px] text-gray-500 mb-1 font-medium">Details:</p>
                            <pre className="text-[10px] text-gray-400 overflow-x-auto whitespace-pre-wrap bg-black/30 p-2 rounded">
                              {typeof log.details === 'object' ? JSON.stringify(log.details, null, 2) : log.details}
                            </pre>
                          </div>
                        )}
                        {isExpanded && !log.details && (
                          <div className="mt-2 pt-2 border-t border-gray-700/50">
                            <p className="text-[10px] text-gray-500 italic">No additional details</p>
                          </div>
                        )}
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
