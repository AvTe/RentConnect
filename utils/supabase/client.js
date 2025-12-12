import { createBrowserClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Browser singleton - reuse the same client instance in browser
// This ensures consistent session state across the app
let browserClient = null;

export const createClient = () => {
  // Check if we're in a browser environment
  const isBrowser = typeof window !== 'undefined';

  if (isBrowser) {
    // In browser: use singleton pattern with createBrowserClient
    if (!browserClient) {
      browserClient = createBrowserClient(supabaseUrl, supabaseKey);
    }
    return browserClient;
  } else {
    // On server: create a new client for each request
    // This is used when lib/database.js functions are called from API routes
    // Use standard supabase-js client without SSR cookie handling
    return createSupabaseClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });
  }
};
