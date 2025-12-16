import { NextResponse } from 'next/server';

/**
 * Location Search API using Nominatim (OpenStreetMap)
 * Provides autocomplete suggestions for location input
 * 
 * GET /api/location-search?q=nairobi
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const countryCode = searchParams.get('country') || 'ke,in'; // Kenya and India by default

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    // Use Nominatim search API for autocomplete
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?` + new URLSearchParams({
        q: query,
        format: 'json',
        addressdetails: '1',
        limit: '8',
        countrycodes: countryCode,
        featuretype: 'city,town,village,suburb,neighbourhood,locality'
      }),
      {
        headers: {
          'User-Agent': 'Yoombaa/1.0 (contact@yoombaa.com)',
          'Referer': 'https://yoombaa.com',
          'Accept-Language': 'en'
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Transform and structure the results
    const results = data.map((item) => {
      const address = item.address || {};
      
      return {
        id: item.place_id,
        display_name: item.display_name,
        name: address.city || address.town || address.village || address.suburb || address.neighbourhood || item.name,
        city: address.city || address.town || address.village || '',
        area: address.suburb || address.neighbourhood || address.locality || '',
        state: address.state || address.county || '',
        country: address.country || '',
        countryCode: address.country_code?.toUpperCase() || '',
        postcode: address.postcode || '',
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        type: item.type,
        importance: item.importance
      };
    });

    // Sort by importance and filter duplicates
    const uniqueResults = results
      .sort((a, b) => b.importance - a.importance)
      .filter((item, index, self) => 
        index === self.findIndex(t => t.name === item.name && t.city === item.city)
      )
      .slice(0, 6);

    return NextResponse.json({ results: uniqueResults });
  } catch (error) {
    console.error('Location search error:', error);
    return NextResponse.json({ error: 'Failed to search locations', results: [] }, { status: 500 });
  }
}

