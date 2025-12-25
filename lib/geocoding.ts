/**
 * Geocoding utility functions using Google Maps Geocoding API
 */

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyBWdywvMrHBFABO6D0vXF0ErXvrhvmLNNs";

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
            console.warn('[Geocoding] No results found for address:', address);
            return null;
        }

        if (data.status === 'REQUEST_DENIED') {
            console.error('[Geocoding] API request denied. Check API key.');
            return null;
        }

        console.warn('[Geocoding] Geocoding failed with status:', data.status);
        return null;

    } catch (error) {
        console.error('[Geocoding] Error geocoding address:', error);
        return null;
    }
}
