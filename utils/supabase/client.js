import { createBrowserClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Singleton clients for connection reuse
let browserClient = null;
let serverClient = null;

// Check if storage is available (for restricted contexts like iframes, Vercel previews)
const isStorageAvailable = () => {
  try {
    const testKey = '__supabase_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};

export const createClient = () => {
  // Check if we're in a browser environment
  const isBrowser = typeof window !== 'undefined';

  if (isBrowser) {
    // In browser: use singleton pattern
    if (!browserClient) {
      try {
        // Check if storage is available (might be blocked in some contexts)
        if (isStorageAvailable()) {
          browserClient = createBrowserClient(supabaseUrl, supabaseKey);
        } else {
          // Storage blocked - use standard client with no persistence
          console.warn('Storage access blocked, using non-persistent Supabase client');
          browserClient = createSupabaseClient(supabaseUrl, supabaseKey, {
            auth: {
              persistSession: false,
              autoRefreshToken: true,
            }
          });
        }
      } catch (err) {
        console.error('Error creating browser client:', err);
        // Fallback to standard client
        browserClient = createSupabaseClient(supabaseUrl, supabaseKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: true,
          }
        });
      }
    }
    return browserClient;
  } else {
    // On server: use singleton for better connection reuse in serverless
    if (!serverClient) {
      serverClient = createSupabaseClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        db: {
          schema: 'public',
        },
      });
    }
    return serverClient;
  }
};
