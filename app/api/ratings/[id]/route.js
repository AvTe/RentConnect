import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { 
  updateAgentRating, 
  deleteAgentRating,
  getAgentRatings 
} from '@/lib/database';

/**
 * GET /api/ratings/[id]
 * Get a specific rating by ID
 */
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('agent_ratings')
      .select(`
        *,
        agent:users!agent_ratings_agent_id_fkey(id, name, avatar, agency_name),
        tenant:users!agent_ratings_tenant_id_fkey(id, name, avatar)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      return NextResponse.json({ error: 'Rating not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, data });
    
  } catch (error) {
    console.error('GET /api/ratings/[id] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/ratings/[id]
 * Update a rating (only by the tenant who created it)
 */
export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const supabase = await createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const body = await request.json();
    const { rating, reviewText, responsivenessRating, professionalismRating, helpfulnessRating } = body;
    
    const result = await updateAgentRating(id, user.id, {
      rating,
      reviewText,
      responsivenessRating,
      professionalismRating,
      helpfulnessRating
    });
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('PATCH /api/ratings/[id] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/ratings/[id]
 * Delete a rating (by tenant or admin)
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const supabase = await createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const result = await deleteAgentRating(id, user.id);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('DELETE /api/ratings/[id] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
