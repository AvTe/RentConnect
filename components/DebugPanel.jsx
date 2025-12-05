'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Bug, X, ChevronDown, ChevronUp, Database, User, Globe, Server, AlertCircle, CheckCircle, Loader2, RefreshCw, Trash2 } from 'lucide-react';

export default function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState({
    database: { status: 'checking', message: 'Checking...', details: null },
    auth: { status: 'checking', message: 'Checking...', user: null },
    api: { status: 'checking', message: 'Checking...', endpoints: {} },
    env: { status: 'checking', message: 'Checking...', vars: {} },
  });

  const addLog = useCallback((type, category, message, details = null) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-50), { id: Date.now(), type, category, message, details, timestamp }]);
  }, []);

  // Check Database Connection
  const checkDatabase = useCallback(async () => {
    setStatus(prev => ({ ...prev, database: { ...prev.database, status: 'checking', message: 'Testing connection...' } }));
    addLog('info', 'Database', 'Testing database connection...');
    
    try {
      const supabase = createClient();
      const startTime = Date.now();
      
      // Test basic query
      const { data, error } = await supabase.from('users').select('count').limit(1);
      const latency = Date.now() - startTime;
      
      if (error) {
        setStatus(prev => ({
          ...prev,
          database: { 
            status: 'error', 
            message: error.message,
            details: { code: error.code, hint: error.hint, latency }
          }
        }));
        addLog('error', 'Database', `Connection failed: ${error.message}`, error);
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
      setStatus(prev => ({
        ...prev,
        database: { status: 'error', message: err.message, details: { error: err.toString() } }
      }));
      addLog('error', 'Database', `Exception: ${err.message}`, err);
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
      { name: 'Health', path: '/api/health', method: 'GET' },
      { name: 'Leads', path: '/api/leads', method: 'GET' },
      { name: 'Send Email', path: '/api/send-email', method: 'OPTIONS' },
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
        
        results[endpoint.name] = {
          status: response.ok ? 'ok' : 'error',
          httpStatus: response.status,
          latency,
          statusText: response.statusText
        };

        if (!response.ok && response.status !== 405) {
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

  // Listen for auth state changes
  useEffect(() => {
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

    return () => subscription.unsubscribe();
  }, [addLog, checkAuth]);

  // Intercept console errors
  useEffect(() => {
    const originalError = console.error;
    const originalWarn = console.warn;

    console.error = (...args) => {
      addLog('error', 'Console', args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
      originalError.apply(console, args);
    };

    console.warn = (...args) => {
      addLog('warning', 'Console', args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
      originalWarn.apply(console, args);
    };

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, [addLog]);

  // Initial check
  useEffect(() => {
    runAllChecks();
  }, [runAllChecks]);

  // Intercept fetch errors globally
  useEffect(() => {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || 'unknown';
      try {
        const response = await originalFetch.apply(window, args);
        if (!response.ok && response.status >= 400) {
          addLog('error', 'Fetch', `${response.status} ${response.statusText}: ${url}`);
        }
        return response;
      } catch (err) {
        addLog('error', 'Fetch', `Failed: ${url} - ${err.message}`);
        throw err;
      }
    };

    return () => {
      window.fetch = originalFetch;
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
      case 'error': return 'text-red-400 bg-red-900/20';
      case 'warning': return 'text-yellow-400 bg-yellow-900/20';
      case 'success': return 'text-green-400 bg-green-900/20';
      case 'info': return 'text-blue-400 bg-blue-900/20';
      default: return 'text-gray-400';
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-[9999] bg-gray-900 text-white p-3 rounded-full shadow-lg hover:bg-gray-800 transition-all border border-gray-700"
        title="Open Debug Panel"
      >
        <Bug className="w-5 h-5" />
        {logs.filter(l => l.type === 'error').length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
            {logs.filter(l => l.type === 'error').length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 z-[9999] bg-gray-900 text-white rounded-lg shadow-2xl border border-gray-700 transition-all ${isMinimized ? 'w-80' : 'w-[500px]'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700 bg-gray-800 rounded-t-lg">
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4 text-yellow-500" />
          <span className="font-semibold text-sm">Debug Panel</span>
          <span className="text-xs text-gray-500">(Temporary)</span>
        </div>
        <div className="flex items-center gap-1">
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
          <div className="max-h-48 overflow-y-auto">
            <div className="px-3 py-1 bg-gray-800 sticky top-0 border-b border-gray-700">
              <span className="text-xs font-medium text-gray-400">Activity Log ({logs.length})</span>
            </div>
            <div className="p-2 space-y-1">
              {logs.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">No logs yet</p>
              ) : (
                logs.slice().reverse().map((log) => (
                  <div key={log.id} className={`text-xs p-1.5 rounded ${getLogColor(log.type)}`}>
                    <div className="flex items-start gap-2">
                      <span className="text-gray-500 shrink-0">{log.timestamp}</span>
                      <span className="font-medium shrink-0">[{log.category}]</span>
                      <span className="break-all">{log.message}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
