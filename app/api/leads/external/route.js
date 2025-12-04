import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// API Key for Zapier/external integrations - store in environment variable
const EXTERNAL_API_KEY = process.env.EXTERNAL_LEADS_API_KEY || 'rc_zapier_key_2024';

/**
 * POST /api/leads/external
 * 
 * Receives leads from external sources (Zapier, Google Ads, Facebook Ads)
 * 
 * Required Headers:
 * - x-api-key: Your API key for authentication
 * 
 * Request Body:
 * {
 *   "source": "google_ads" | "facebook_ads" | "zapier" | "other",
 *   "campaign_id": "optional campaign identifier",
 *   "campaign_name": "optional campaign name",
 *   "name": "Lead Name",
 *   "email": "lead@example.com",
 *   "phone": "+254712345678",
 *   "location": "Nairobi, Kenya",
 *   "property_type": "apartment" | "house" | "studio" | "commercial",
 *   "budget": 50000,
 *   "bedrooms": 2,
 *   "move_in_date": "2024-02-01",
 *   "requirements": "Any additional requirements",
 *   "ad_id": "optional ad identifier",
 *   "form_id": "optional form identifier"
 * }
 */
export async function POST(request) {
  try {
    // Validate API Key
    const apiKey = request.headers.get('x-api-key');
    
    if (!apiKey || apiKey !== EXTERNAL_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid API key' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['name', 'phone'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Missing required fields: ${missingFields.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Normalize and validate data
    const leadData = {
      // Tenant information
      tenant_name: body.name?.trim(),
      tenant_email: body.email?.trim()?.toLowerCase() || null,
      tenant_phone: normalizePhone(body.phone),
      
      // Property requirements
      location: body.location?.trim() || 'Not specified',
      property_type: normalizePropertyType(body.property_type),
      budget: parseFloat(body.budget) || 0,
      bedrooms: parseInt(body.bedrooms) || 1,
      move_in_date: body.move_in_date || getDefaultMoveInDate(),
      
      // Additional requirements stored as JSON
      requirements: {
        additional_requirements: body.requirements || '',
        amenities: body.amenities || [],
        pincode: body.pincode || ''
      },
      
      // External source tracking
      source: body.source || 'zapier',
      external_source: body.source || 'zapier',
      campaign_id: body.campaign_id || null,
      campaign_name: body.campaign_name || null,
      ad_id: body.ad_id || null,
      form_id: body.form_id || null,
      
      // Status
      status: 'new',
      is_external: true,
      
      // Timestamps
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Create lead in database
    const supabase = await createClient();
    
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert([leadData])
      .select()
      .single();

    if (leadError) {
      console.error('Error creating external lead:', leadError);
      return NextResponse.json(
        { success: false, error: 'Failed to create lead' },
        { status: 500 }
      );
    }

    // Create notifications for all active agents
    await notifyAgentsOfNewLead(supabase, lead);

    // Log the external lead for tracking
    await logExternalLead(supabase, lead, body);

    return NextResponse.json({
      success: true,
      message: 'Lead created successfully',
      data: {
        lead_id: lead.id,
        status: lead.status,
        created_at: lead.created_at
      }
    }, { status: 201 });

  } catch (error) {
    console.error('External lead API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/leads/external
 * 
 * Returns API documentation for Zapier integration
 */
export async function GET(request) {
  return NextResponse.json({
    name: 'RentConnect External Leads API',
    version: '1.0',
    description: 'API endpoint for receiving leads from external sources like Google Ads and Facebook Ads via Zapier',
    
    authentication: {
      type: 'API Key',
      header: 'x-api-key',
      description: 'Include your API key in the x-api-key header'
    },
    
    endpoint: {
      method: 'POST',
      url: '/api/leads/external',
      content_type: 'application/json'
    },
    
    required_fields: ['name', 'phone'],
    
    optional_fields: [
      'email',
      'location',
      'property_type',
      'budget',
      'bedrooms',
      'move_in_date',
      'requirements',
      'source',
      'campaign_id',
      'campaign_name',
      'ad_id',
      'form_id'
    ],
    
    property_types: ['apartment', 'house', 'studio', 'commercial', 'land', 'office'],
    
    sources: ['google_ads', 'facebook_ads', 'zapier', 'other'],
    
    example_request: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+254712345678',
      location: 'Nairobi, Westlands',
      property_type: 'apartment',
      budget: 50000,
      bedrooms: 2,
      move_in_date: '2024-02-01',
      requirements: 'Looking for a furnished apartment near schools',
      source: 'facebook_ads',
      campaign_id: 'fb_campaign_123',
      campaign_name: 'Nairobi Rentals Q1'
    },
    
    example_response: {
      success: true,
      message: 'Lead created successfully',
      data: {
        lead_id: 'uuid-here',
        status: 'new',
        created_at: '2024-01-15T10:30:00Z'
      }
    }
  });
}

// Helper Functions

function normalizePhone(phone) {
  if (!phone) return null;
  // Remove all non-numeric characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  // Add Kenya country code if not present
  if (!cleaned.startsWith('+')) {
    if (cleaned.startsWith('0')) {
      cleaned = '+254' + cleaned.substring(1);
    } else if (cleaned.startsWith('254')) {
      cleaned = '+' + cleaned;
    } else {
      cleaned = '+254' + cleaned;
    }
  }
  return cleaned;
}

function normalizePropertyType(type) {
  if (!type) return 'apartment';
  const normalized = type.toLowerCase().trim();
  const validTypes = ['apartment', 'house', 'studio', 'commercial', 'land', 'office', 'bedsitter', 'single_room'];
  return validTypes.includes(normalized) ? normalized : 'apartment';
}

function getDefaultMoveInDate() {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().split('T')[0];
}

async function notifyAgentsOfNewLead(supabase, lead) {
  try {
    // Get all active agents
    const { data: agents, error } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('role', 'agent')
      .eq('status', 'active');

    if (error || !agents?.length) {
      console.log('No active agents to notify');
      return;
    }

    // Create notifications for each agent
    const notifications = agents.map(agent => ({
      user_id: agent.id,
      type: 'new_lead',
      title: 'New Lead Available!',
      message: `New ${lead.property_type} lead in ${lead.location} - Budget: KSh ${lead.budget?.toLocaleString() || 'N/A'}`,
      data: {
        lead_id: lead.id,
        location: lead.location,
        property_type: lead.property_type,
        budget: lead.budget,
        source: lead.external_source || 'external'
      },
      is_read: false,
      created_at: new Date().toISOString()
    }));

    const { error: notifError } = await supabase
      .from('notifications')
      .insert(notifications);

    if (notifError) {
      console.error('Error creating agent notifications:', notifError);
    }
  } catch (error) {
    console.error('Error notifying agents:', error);
  }
}

async function logExternalLead(supabase, lead, originalPayload) {
  try {
    await supabase
      .from('external_lead_logs')
      .insert([{
        lead_id: lead.id,
        source: lead.external_source,
        campaign_id: lead.campaign_id,
        campaign_name: lead.campaign_name,
        ad_id: lead.ad_id,
        form_id: lead.form_id,
        original_payload: originalPayload,
        created_at: new Date().toISOString()
      }]);
  } catch (error) {
    // Non-critical error, just log it
    console.error('Error logging external lead:', error);
  }
}
