import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Only available in development mode
export async function POST(request) {
  // Check if in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { success: false, error: 'This endpoint is only available in development' },
      { status: 403 }
    );
  }

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { agentId } = await request.json();
    const targetAgentId = agentId || user.id;

    // Delete contact history for this agent
    const { data, error } = await supabase
      .from('contact_history')
      .delete()
      .eq('agent_id', targetAgentId)
      .select();

    if (error) {
      console.error('Error clearing contact history:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.log(`Cleared ${data?.length || 0} contact history records for agent ${targetAgentId}`);
    
    return NextResponse.json({
      success: true,
      message: `Cleared ${data?.length || 0} contact history records`,
      deletedCount: data?.length || 0
    });

  } catch (error) {
    console.error('Error in reset-contact-history:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

