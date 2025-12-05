import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Health Check API
 * Tests database connection and provides diagnostic information
 */
export async function GET(request) {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    supabase: {
      urlConfigured: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKeyConfigured: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      serviceKeyConfigured: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      connection: 'untested'
    },
    urls: {
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'NOT SET',
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'NOT SET'
    },
    sendgrid: {
      configured: !!process.env.SENDGRID_API_KEY
    }
  };

  // Test Supabase connection
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );

      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1);

      if (error) {
        diagnostics.supabase.connection = 'error';
        diagnostics.supabase.error = error.message;
      } else {
        diagnostics.supabase.connection = 'success';
      }
    } catch (e) {
      diagnostics.supabase.connection = 'exception';
      diagnostics.supabase.error = e.message;
    }
  }

  return NextResponse.json(diagnostics);
}
