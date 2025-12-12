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

  // createBrowserClient automatically handles:
  // - Session persistence via cookies
  // - Auto token refresh
  // - Session detection from URL
  // No custom options needed - defaults work best
  supabaseClient = createBrowserClient(supabaseUrl, supabaseKey);

  return supabaseClient;
};
