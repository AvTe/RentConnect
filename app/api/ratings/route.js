import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { 
  submitAgentRating, 
  getAgentRatings, 
  getAgentRatingSummary,
  canTenantRateAgent,
  getAgentsPendingRating
} from '@/lib/database';

/**
 * GET /api/ratings
 * Get ratings for an agent or check eligibility
 * Query params:
 *   - agentId: Get ratings for specific agent
 *   - checkEligibility: If true, check if current user can rate the agent
 *   - pendingRatings: If true, get agents the current user can rate
 */
export async function GET(request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const agentId = searchParams.get('agentId');
    const checkEligibility = searchParams.get('checkEligibility') === 'true';
    const pendingRatings = searchParams.get('pendingRatings') === 'true';
    const includeSummary = searchParams.get('includeSummary') === 'true';
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    // Get agents pending rating for current user
    if (pendingRatings) {
      if (!user) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
      
      const result = await getAgentsPendingRating(user.id);
      return NextResponse.json(result);
    }
    
    // Check eligibility to rate
    if (checkEligibility && agentId) {
      if (!user) {
        return NextResponse.json({ 
          success: true, 
          data: { canRate: false, reason: 'Please log in to rate agents' } 
        });
      }
      
      const result = await canTenantRateAgent(user.id, agentId);
      return NextResponse.json(result);
    }
    
    // Get ratings for an agent
    if (agentId) {
      const ratingsResult = await getAgentRatings(agentId, { limit, offset });
      
      if (includeSummary) {
        const summaryResult = await getAgentRatingSummary(agentId);
        return NextResponse.json({
          success: true,
          data: {
            ratings: ratingsResult.data || [],
            summary: summaryResult.data || null
          }
        });
      }
      
      return NextResponse.json(ratingsResult);
    }
    
    return NextResponse.json({ error: 'agentId parameter is required' }, { status: 400 });
    
  } catch (error) {
    console.error('GET /api/ratings error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/ratings
 * Submit a new rating
 */
export async function POST(request) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const body = await request.json();
    const { 
      agentId, 
      leadId, 
      rating, 
      reviewText, 
      responsivenessRating, 
      professionalismRating, 
      helpfulnessRating 
    } = body;
    
    // Validate required fields
    if (!agentId || !rating) {
      return NextResponse.json({ 
        error: 'agentId and rating are required' 
      }, { status: 400 });
    }
    
    // Validate rating range
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ 
        error: 'Rating must be between 1 and 5' 
      }, { status: 400 });
    }
    
    const result = await submitAgentRating({
      agentId,
      tenantId: user.id,
      leadId,
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
    console.error('POST /api/ratings error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
