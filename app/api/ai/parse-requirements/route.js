import Groq from "groq-sdk";
import { NextResponse } from "next/server";

// Property type mapping to match TenantForm options
const VALID_PROPERTY_TYPES = [
  "1 Bedroom",
  "2 Bedroom",
  "3 Bedroom",
  "Studio",
  "Self Contain",
  "Duplex"
];

// Health check endpoint
export async function GET() {
  const hasApiKey = !!process.env.GROQ_API_KEY;
  const apiKeyPreview = hasApiKey
    ? `${process.env.GROQ_API_KEY.substring(0, 10)}...`
    : 'Not configured';

  return NextResponse.json({
    status: hasApiKey ? 'configured' : 'not_configured',
    apiKeyConfigured: hasApiKey,
    apiKeyPreview,
    model: 'llama-3.3-70b-versatile',
    provider: 'Groq',
    timestamp: new Date().toISOString()
  });
}

export async function POST(request) {
  console.log("[AI Parse] Starting request with Groq...");

  try {
    const { text } = await request.json();
    console.log("[AI Parse] Input text:", text?.substring(0, 100));

    if (!text || text.trim().length < 5) {
      console.log("[AI Parse] Error: Text too short");
      return NextResponse.json(
        { error: "Please provide more details about your rental requirements." },
        { status: 400 }
      );
    }

    // Check if API key is configured
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error("[AI Parse] GROQ_API_KEY is not configured in environment");
      return NextResponse.json(
        { error: "AI service is not configured. Please add GROQ_API_KEY to environment variables." },
        { status: 500 }
      );
    }

    console.log("[AI Parse] Groq API Key configured:", apiKey.substring(0, 10) + "...");

    // Initialize Groq client
    const groq = new Groq({ apiKey });

    console.log("[AI Parse] Groq client initialized, generating content...");

    const systemPrompt = `You are a rental property requirements parser for an African real estate platform (primarily Kenya). Extract rental requirements from user text and return ONLY valid JSON.`;

    const userPrompt = `Extract rental requirements from this text: "${text}"

Return ONLY a JSON object with these fields (use null for unknown fields):
{
  "location": "area or city mentioned (e.g., 'Westlands, Nairobi')",
  "propertyType": "one of: '1 Bedroom', '2 Bedroom', '3 Bedroom', 'Studio', 'Self Contain', 'Duplex'",
  "budget": "number - monthly rent (convert 45k to 45000)",
  "bedrooms": "number or null",
  "moveInDate": "ISO date string or null",
  "additionalNotes": "other requirements (parking, furnished, etc.)"
}

Rules:
- Convert '45k' to 45000, '2BR' to '2 Bedroom'
- Infer: 1 bed -> '1 Bedroom', 2 bed -> '2 Bedroom'
- Return ONLY JSON, no markdown`;

    let chatCompletion;
    try {
      chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: "json_object" }
      });
    } catch (groqError) {
      console.error("[AI Parse] Groq API error:", groqError.message);

      // Check for specific error types
      if (groqError.message?.includes('invalid_api_key') || groqError.message?.includes('API key')) {
        return NextResponse.json(
          { error: "Invalid API key. Please check your Groq API key configuration." },
          { status: 500 }
        );
      }
      if (groqError.message?.includes('rate_limit') || groqError.message?.includes('quota')) {
        return NextResponse.json(
          { error: "AI service rate limit reached. Please try again in a moment." },
          { status: 429 }
        );
      }
      throw groqError;
    }

    const responseText = chatCompletion.choices[0]?.message?.content || '{}';
    console.log("[AI Parse] Got response:", responseText.substring(0, 200));

    // Clean up the response - remove markdown code blocks if present
    let cleanedResponse = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    // Parse the JSON response
    let parsedData;
    try {
      parsedData = JSON.parse(cleanedResponse);
      console.log("[AI Parse] Parsed data:", JSON.stringify(parsedData));
    } catch (parseError) {
      console.error("[AI Parse] Failed to parse AI response:", cleanedResponse);
      return NextResponse.json(
        { error: "Could not understand your requirements. Please try rephrasing." },
        { status: 400 }
      );
    }

    // Validate and normalize propertyType
    if (parsedData.propertyType && !VALID_PROPERTY_TYPES.includes(parsedData.propertyType)) {
      // Try to find a close match
      const lowerType = parsedData.propertyType.toLowerCase();
      if (lowerType.includes('1') || lowerType.includes('one')) {
        parsedData.propertyType = '1 Bedroom';
      } else if (lowerType.includes('2') || lowerType.includes('two')) {
        parsedData.propertyType = '2 Bedroom';
      } else if (lowerType.includes('3') || lowerType.includes('three')) {
        parsedData.propertyType = '3 Bedroom';
      } else if (lowerType.includes('studio')) {
        parsedData.propertyType = 'Studio';
      } else if (lowerType.includes('self') || lowerType.includes('contain')) {
        parsedData.propertyType = 'Self Contain';
      } else if (lowerType.includes('duplex')) {
        parsedData.propertyType = 'Duplex';
      } else {
        parsedData.propertyType = null;
      }
    }

    // Ensure budget is a number
    if (parsedData.budget && typeof parsedData.budget === 'string') {
      parsedData.budget = parseInt(parsedData.budget.replace(/[^0-9]/g, ''), 10) || null;
    }

    console.log("[AI Parse] Success! Returning data");
    return NextResponse.json({
      success: true,
      data: parsedData
    });

  } catch (error) {
    console.error("[AI Parse] Unhandled error:", error.message);
    console.error("[AI Parse] Error stack:", error.stack);
    console.error("[AI Parse] Error name:", error.name);

    // Return more specific error messages
    let errorMessage = "Failed to process your requirements. Please try again.";
    if (error.message?.includes('fetch')) {
      errorMessage = "Network error connecting to AI service. Please check your internet connection.";
    } else if (error.message?.includes('timeout')) {
      errorMessage = "AI service timed out. Please try again.";
    }

    return NextResponse.json(
      {
        error: errorMessage,
        debug: process.env.NODE_ENV === 'development' ? {
          message: error.message,
          name: error.name
        } : undefined
      },
      { status: 500 }
    );
  }
}

