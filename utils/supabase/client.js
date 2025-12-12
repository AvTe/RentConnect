import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Singleton pattern - reuse the same client instance
// This ensures consistent session state across the app
let supabaseClient = null;

export const createClient = () => {
  if (supabaseClient) {
    return supabaseClient;
  }

  supabaseClient = createBrowserClient(
    supabaseUrl,
    supabaseKey,
    {
      auth: {
        // Store session in localStorage for persistence across tabs/refreshes
        persistSession: true,
        // Automatically refresh the session before it expires
        autoRefreshToken: true,
        // Detect session from URL (for OAuth callbacks)
        detectSessionInUrl: true,
        // Storage key for the session
        storageKey: 'rentconnect-auth',
      },
      // Cookie options for session storage
      cookies: {
        // Use secure cookies in production
        secure: process.env.NODE_ENV === 'production',
      }
    }
  );

  return supabaseClient;
};
