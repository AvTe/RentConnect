import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// GET - Fetch leads (requires authentication)
export async function GET(request) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }

    // Get user role to determine access
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    // If user is a tenant, only show their own leads
    if (userData?.role === 'tenant') {
      query = query.eq('user_id', user.id);
    }
    // If user is an agent, show leads they've unlocked or all available
    else if (userData?.role === 'agent') {
      // Agents can see leads they've unlocked
      const { data: unlockedLeads } = await supabase
        .from('unlocked_leads')
        .select('lead_id')
        .eq('agent_id', user.id);
      
      const unlockedLeadIds = unlockedLeads?.map(ul => ul.lead_id) || [];
      
      if (unlockedLeadIds.length > 0) {
        query = query.in('id', unlockedLeadIds);
      } else {
        // Return empty if no unlocked leads
        return NextResponse.json({
          success: true,
          data: [],
          count: 0,
          message: 'No unlocked leads'
        });
      }
    }
    // Admins can see all leads (no additional filter)

    const { data: leads, error, count } = await query;

    if (error) {
      console.error('Leads fetch error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: leads || [],
      count: count || 0
    });

  } catch (err) {
    console.error('Leads API exception:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new lead
export async function POST(request) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['location', 'budget_min', 'budget_max', 'bedrooms'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Create the lead
    const leadData = {
      user_id: user.id,
      location: body.location,
      budget_min: body.budget_min,
      budget_max: body.budget_max,
      bedrooms: body.bedrooms,
      property_type: body.property_type || 'apartment',
      amenities: body.amenities || [],
      move_in_date: body.move_in_date || null,
      additional_notes: body.additional_notes || '',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: lead, error } = await supabase
      .from('leads')
      .insert(leadData)
      .select()
      .single();

    if (error) {
      console.error('Lead creation error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: lead,
      message: 'Lead created successfully'
    }, { status: 201 });

  } catch (err) {
    console.error('Leads POST exception:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// OPTIONS - For CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
