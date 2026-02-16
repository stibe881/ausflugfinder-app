/**
 * Geocoding utility functions using Google Maps Geocoding API
 */

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyAdDy_5jIriXd0kBJ4bzSNO8pKcegr9Z3E";

export interface GeocodeResult {
    lat: string;
    lng: string;
    formattedAddress?: string;
}

/**
 * Geocode an address to get its coordinates
 * @param address The address to geocode
 * @returns Coordinates and formatted address, or null if geocoding failed
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
    if (!address.trim()) {
        return null;
    }

    try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK' && data.results && data.results[0]) {
            const result = data.results[0];
            const location = result.geometry.location;

            return {
                lat: location.lat.toString(),
                lng: location.lng.toString(),
                formattedAddress: result.formatted_address,
            };
        }

        // Handle specific error cases
        if (data.status === 'ZERO_RESULTS') {
            console.warn('[Geocoding] Google: No results found for address:', address);
            return await geocodeWithNominatim(address);
        }

        if (data.status === 'REQUEST_DENIED' || data.status === 'OVER_QUERY_LIMIT') {
            console.error(`[Geocoding] Google: API ${data.status}. Falling back to Nominatim.`);
            return await geocodeWithNominatim(address);
        }

        console.warn('[Geocoding] Google geocoding failed with status:', data.status);
        return await geocodeWithNominatim(address);

    } catch (error) {
        console.error('[Geocoding] Google error:', error);
        return await geocodeWithNominatim(address);
    }
}

/**
 * Fallback geocoding using OpenStreetMap Nominatim
 */
async function geocodeWithNominatim(address: string): Promise<GeocodeResult | null> {
    const queries = [address];

    // 1. Try to extract just city/zip if likely valid
    // "Erlebnisflugplatz Sitterdorf, 8589 Zihlschlacht-Sitterdorf" -> "8589 Zihlschlacht-Sitterdorf"
    if (address.includes(',')) {
        const parts = address.split(',');
        const lastPart = parts[parts.length - 1].trim();
        if (lastPart.length > 5) { // mild sanity check
            queries.push(lastPart);
        }
        // Try everything BEFORE the last comma (often the venue name)
        const firstPart = parts[0].trim();
        if (firstPart.length > 3) {
            queries.push(firstPart);
        }
    }

    // 2. Regex to find Swiss zip codes and prioritize them
    const zipMatch = address.match(/(\d{4})\s+([A-Za-z\u00C0-\u00D6\u00D8-\u00f6\u00f8-\u00ff\s-]+)/);
    if (zipMatch) {
        queries.push(`${zipMatch[1]} ${zipMatch[2]}`);
    }

    // Deduplicate
    const uniqueQueries = [...new Set(queries)];

    for (const query of uniqueQueries) {
        try {
            console.log(`[Geocoding] Trying Nominatim for: "${query}"`);
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;

            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'AusflugFinderApp/1.0'
                }
            });

            const data = await response.json();

            if (data && data.length > 0) {
                const result = data[0];
                return {
                    lat: result.lat,
                    lng: result.lon,
                    formattedAddress: result.display_name
                };
            }
        } catch (error) {
            console.error(`[Geocoding] Nominatim error for "${query}":`, error);
        }
        // Be nice to the API
        await new Promise(r => setTimeout(r, 500));
    }

    console.warn('[Geocoding] Nominatim: No results found after retries');
    return null;
}
