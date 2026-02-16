/**
 * Indoor category classification for weather-based features.
 * Categories considered "indoor" won't show rain warnings.
 */

export const INDOOR_CATEGORIES = [
    "Erlebnisbad",
    "Museum & Kultur",
    "Gastronomie",
];

/**
 * Check if a trip's categories indicate it's mainly indoor.
 * A trip is considered indoor if ALL its categories are indoor categories.
 * If it has a mix of indoor and outdoor, it's treated as outdoor.
 */
export function isIndoorTrip(kategorien: string | string[] | null): boolean {
    if (!kategorien) return false;

    const categories = Array.isArray(kategorien)
        ? kategorien
        : kategorien.split(',').map(k => k.trim()).filter(k => k.length > 0);

    if (categories.length === 0) return false;

    return categories.every(cat =>
        INDOOR_CATEGORIES.some(indoor => cat.toLowerCase() === indoor.toLowerCase())
    );
}
