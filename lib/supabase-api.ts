// Supabase API functions for direct database access (no backend needed)
import { supabase } from "./supabase";
import * as FileSystem from 'expo-file-system/legacy';

// Types matching the database schema
export type Ausflug = {
    id: number;
    user_id: number | null;
    name: string;
    beschreibung: string | null;
    adresse: string;
    land: string | null;
    region: string | null;
    kategorie_alt: string | null;
    parkplatz: string | null;
    parkplatz_kostenlos: boolean | null;
    kosten_stufe: number | null;
    jahreszeiten: string | null;
    website_url: string | null;
    lat: string | null;
    lng: string | null;
    created_at: string;
    nice_to_know: string | null;
    dauer_min: string | null;
    dauer_max: string | null;
    distanz_min: string | null;
    distanz_max: string | null;
    dauer_stunden: string | null;
    distanz_km: string | null;
    is_rundtour: boolean;
    is_von_a_nach_b: boolean;
    altersempfehlung: string | null;
};

// Search ausfluege with optional filters
export async function searchAusfluege(params?: {
    keyword?: string;
    region?: string;
    kostenStufe?: number;
}): Promise<{ data: Ausflug[]; total: number }> {
    let query = supabase
        .from("ausfluege")
        .select("*")
        .order("created_at", { ascending: false });

    if (params?.keyword) {
        query = query.or(
            `name.ilike.%${params.keyword}%,beschreibung.ilike.%${params.keyword}%,adresse.ilike.%${params.keyword}%`
        );
    }

    if (params?.region) {
        query = query.eq("region", params.region);
    }

    if (params?.kostenStufe !== undefined) {
        query = query.eq("kosten_stufe", params.kostenStufe);
    }

    const { data, error } = await query;

    if (error) {
        console.error("[Supabase] Error fetching ausfluege:", error);
        return { data: [], total: 0 };
    }

    return { data: data || [], total: data?.length || 0 };
}

// Get a single ausflug by ID
export async function getAusflugById(id: number): Promise<Ausflug | null> {
    const { data, error } = await supabase
        .from("ausfluege")
        .select("*")
        .eq("id", id)
        .single();

    if (error) {
        console.error("[Supabase] Error fetching ausflug:", error);
        return null;
    }

    return data;
}

// Get statistics
export async function getAusflugeStatistics(): Promise<{
    totalActivities: number;
    freeActivities: number;
    totalRegions: number;
}> {
    // Get total count
    const { count: totalCount, error: totalError } = await supabase
        .from("ausfluege")
        .select("*", { count: "exact", head: true });

    // Get free activities count (kosten_stufe = 0)
    const { count: freeCount, error: freeError } = await supabase
        .from("ausfluege")
        .select("*", { count: "exact", head: true })
        .eq("kosten_stufe", 0);

    // Get distinct regions
    const { data: regionsData, error: regionsError } = await supabase
        .from("ausfluege")
        .select("region")
        .not("region", "is", null);

    const uniqueRegions = new Set(regionsData?.map((r) => r.region).filter(Boolean));

    if (totalError || freeError || regionsError) {
        console.error("[Supabase] Error fetching statistics");
        return { totalActivities: 0, freeActivities: 0, totalRegions: 0 };
    }

    return {
        totalActivities: totalCount || 0,
        freeActivities: freeCount || 0,
        totalRegions: uniqueRegions.size,
    };
}

// Get all ausfluege (for map view)
export async function getAllAusfluege(): Promise<Ausflug[]> {
    const { data, error } = await supabase
        .from("ausfluege")
        .select("*")
        .order("name", { ascending: true });

    if (error) {
        console.error("[Supabase] Error fetching all ausfluege:", error);
        return [];
    }

    return data || [];
}

// Photo type
export type AusflugFoto = {
    id: number;
    ausflug_id: number;
    user_id: number | null;
    path: string;
    full_url: string;
    is_primary: boolean;
    created_at: string;
};

// Get primary photo for an ausflug
export async function getPrimaryPhoto(ausflugId: number): Promise<string | null> {
    const { data, error } = await supabase
        .from("ausfluege_fotos")
        .select("full_url")
        .eq("ausflug_id", ausflugId)
        .eq("is_primary", true)
        .single();

    if (error || !data) {
        // If no primary photo, try to get any photo
        const { data: fallback, error: fallbackError } = await supabase
            .from("ausfluege_fotos")
            .select("full_url")
            .eq("ausflug_id", ausflugId)
            .limit(1)
            .single();

        if (fallbackError || !fallback) {
            console.log(`[Photo] No photo found for ausflug ${ausflugId}`);
            return null;
        }
        console.log(`[Photo] Fallback photo for ausflug ${ausflugId}: ${fallback.full_url}`);
        return fallback.full_url;
    }

    console.log(`[Photo] Primary photo for ausflug ${ausflugId}: ${data.full_url}`);
    return data.full_url;
}

// Get all photos for an ausflug
export async function getAusflugPhotos(ausflugId: number): Promise<AusflugFoto[]> {
    const { data, error } = await supabase
        .from("ausfluege_fotos")
        .select("*")
        .eq("ausflug_id", ausflugId)
        .order("is_primary", { ascending: false });

    if (error) {
        console.error("[Supabase] Error fetching photos:", error);
        return [];
    }

    return data || [];
}

// Extend Ausflug type with optional primary photo
export type AusflugWithPhoto = Ausflug & {
    primaryPhotoUrl?: string | null;
};

// Search ausfluege with primary photos
export async function searchAusfluegWithPhotos(params?: {
    keyword?: string;
    region?: string;
    kostenStufe?: number;
}): Promise<{ data: AusflugWithPhoto[]; total: number }> {
    const result = await searchAusfluege(params);

    // Fetch primary photos for all ausfluege
    const ausflugeWithPhotos = await Promise.all(
        result.data.map(async (ausflug) => {
            const primaryPhotoUrl = await getPrimaryPhoto(ausflug.id);
            return { ...ausflug, primaryPhotoUrl };
        })
    );

    return { data: ausflugeWithPhotos, total: result.total };
}

// ========== ADMIN FUNCTIONS ==========

// Create a new ausflug (admin only)
export async function createAusflug(data: {
    name: string;
    beschreibung?: string;
    adresse: string;
    land?: string;
    region?: string;
    kosten_stufe?: number;
    jahreszeiten?: string;
    website_url?: string;
    lat?: string;
    lng?: string;
    nice_to_know?: string;
    altersempfehlung?: string;
    parkplatz?: string;
    parkplatz_kostenlos?: boolean;
    kategorie_alt?: string;
    dauer_min?: string;
    dauer_max?: string;
    distanz_min?: string;
    distanz_max?: string;
    dauer_stunden?: string;
    distanz_km?: string;
    is_rundtour?: boolean;
    is_von_a_nach_b?: boolean;
}): Promise<{ success: boolean; id?: number; error?: string }> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, error: "Not authenticated" };
        }

        const { data: result, error } = await supabase
            .from("ausfluege")
            .insert({
                ...data,
                user_id: null, // Admin trips have no specific user
                created_at: new Date().toISOString(),
            })
            .select('id')
            .single();

        if (error) {
            console.error("[Supabase] Error creating ausflug:", error);
            return { success: false, error: error.message };
        }

        console.log("[createAusflug] Created successfully:", result.id);
        return { success: true, id: result.id };
    } catch (error: any) {
        console.error("[createAusflug] Unexpected error:", error);
        return { success: false, error: error.message };
    }
}

// Get all unique "nice to know" entries from database, grouped by category
export async function getNiceToKnowOptions(): Promise<{ category: string; options: string[] }[]> {
    try {
        const { data, error } = await supabase
            .from("ausfluege")
            .select("nice_to_know")
            .not("nice_to_know", "is", null)
            .not("nice_to_know", "eq", "");

        if (error) {
            console.error("[Supabase] Error fetching nice to know options:", error);
            return [];
        }

        // Extract and deduplicate values
        const allValues = new Set<string>();
        data?.forEach(item => {
            if (item.nice_to_know) {
                // Split by common separators and trim
                const values = item.nice_to_know
                    .split(/[,;|\n]/)
                    .map((v: string) => v.trim())
                    .filter((v: string) => v.length > 0);
                values.forEach((v: string) => allValues.add(v));
            }
        });

        const allOptions = Array.from(allValues).sort();

        // Categorize options
        const categories: { [key: string]: string[] } = {
            'Ausstattung': [],
            'Verpflegung': [],
            'Zugang': [],
            'Besonderheiten': [],
            'Sonstiges': []
        };

        allOptions.forEach(option => {
            const lower = option.toLowerCase();
            if (lower.includes('wc') || lower.includes('toilette') || lower.includes('wickel') ||
                lower.includes('spielplatz') || lower.includes('picknick') || lower.includes('sitzbänke')) {
                categories['Ausstattung'].push(option);
            } else if (lower.includes('restaurant') || lower.includes('kiosk') || lower.includes('verpflegung') ||
                lower.includes('essen') || lower.includes('grillstelle') || lower.includes('feuerstelle')) {
                categories['Verpflegung'].push(option);
            } else if (lower.includes('barrierefrei') || lower.includes('kinderwagen') || lower.includes('rollstuhl') ||
                lower.includes('zugang') || lower.includes('erreichbar')) {
                categories['Zugang'].push(option);
            } else if (lower.includes('aussicht') || lower.includes('tiere') || lower.includes('natur') ||
                lower.includes('führung') || lower.includes('museum') || lower.includes('historisch')) {
                categories['Besonderheiten'].push(option);
            } else {
                categories['Sonstiges'].push(option);
            }
        });

        // Return only non-empty categories
        return Object.entries(categories)
            .filter(([_, options]) => options.length > 0)
            .map(([category, options]) => ({ category, options }));
    } catch (error) {
        console.error("[Supabase] Error in getNiceToKnowOptions:", error);
        return [];
    }
}

// Get all unique categories from database
export async function getKategorieOptions(): Promise<string[]> {
    // Standard categories that are always available
    const standardCategories = [
        "Natur & Wandern",
        "Museum & Kultur",
        "Sport & Abenteuer",
        "Familie & Kinder",
        "Wellness & Entspannung",
        "Stadt & Sightseeing",
        "Wasser & Seen",
        "Berge & Alpen",
        "Gastronomie",
        "Events & Festivals",
    ];

    try {
        const { data, error } = await supabase
            .from("ausfluege")
            .select("kategorie_alt")
            .not("kategorie_alt", "is", null)
            .not("kategorie_alt", "eq", "");

        if (error) {
            console.error("[Supabase] Error fetching kategorie options:", error);
            return standardCategories; // Return standard categories on error
        }

        // Extract unique categories from database
        const dbCategories = new Set<string>();
        data?.forEach(item => {
            if (item.kategorie_alt) {
                // Split by comma in case multiple categories are stored together
                item.kategorie_alt.split(',').forEach((cat: string) => {
                    const trimmed = cat.trim();
                    if (trimmed) dbCategories.add(trimmed);
                });
            }
        });

        // Merge standard categories with database categories
        const allCategories = new Set([...standardCategories, ...Array.from(dbCategories)]);

        return Array.from(allCategories).sort();
    } catch (error) {
        console.error("[Supabase] Error in getKategorieOptions:", error);
        return standardCategories; // Return standard categories on error
    }
}

// Update an ausflug
export async function updateAusflug(id: number, updates: Partial<Ausflug>): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
        .from("ausfluege")
        .update(updates)
        .eq("id", id);

    if (error) {
        console.error("[Supabase] Error updating ausflug:", error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

// Delete an ausflug
export async function deleteAusflug(id: number): Promise<{ success: boolean; error?: string }> {
    // First delete all photos
    const { error: photosError } = await supabase
        .from("ausfluege_fotos")
        .delete()
        .eq("ausflug_id", id);

    if (photosError) {
        console.error("[Supabase] Error deleting ausflug photos:", photosError);
    }

    // Then delete the ausflug
    const { error } = await supabase
        .from("ausfluege")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("[Supabase] Error deleting ausflug:", error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

// Upload a photo to Supabase Storage
export async function uploadAusflugPhoto(
    ausflugId: number,
    fileUri: string,
    fileName: string,
    isPrimary: boolean = false
): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
        // Generate unique filename
        const timestamp = Date.now();
        // Clean filename - remove special characters
        const cleanFileName = fileName.replace(/[^a-zA-Z0-9.]/g, '_');
        const storagePath = `ex_${ausflugId}_${timestamp}_${cleanFileName}`;

        console.log('[Upload] Starting upload:', storagePath);

        // For React Native, we need to use FormData approach
        const formData = new FormData();
        formData.append('file', {
            uri: fileUri,
            name: cleanFileName,
            type: 'image/jpeg',
        } as any);

        // Upload using fetch directly to Supabase Storage API
        const { data: { session } } = await supabase.auth.getSession();

        const uploadResponse = await fetch(
            `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/ausfluege-images/${storagePath}`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session?.access_token || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
                    'x-upsert': 'true',
                },
                body: formData,
            }
        );

        console.log('[Upload] Response status:', uploadResponse.status);

        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.error('[Upload] Error:', errorText);
            return { success: false, error: `Upload failed: ${uploadResponse.status}` };
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from("ausfluege-images")
            .getPublicUrl(storagePath);

        const fullUrl = urlData.publicUrl;
        console.log('[Upload] Public URL:', fullUrl);

        // If this is primary, unset other primary photos
        if (isPrimary) {
            await supabase
                .from("ausfluege_fotos")
                .update({ is_primary: false })
                .eq("ausflug_id", ausflugId);
        }

        // Insert photo record
        const { error: insertError } = await supabase
            .from("ausfluege_fotos")
            .insert({
                ausflug_id: ausflugId,
                path: storagePath,
                full_url: fullUrl,
                is_primary: isPrimary,
            });

        if (insertError) {
            console.error("[Supabase] Error inserting photo record:", insertError);
            return { success: false, error: insertError.message };
        }

        return { success: true, url: fullUrl };
    } catch (error: any) {
        console.error("[Supabase] Error in uploadAusflugPhoto:", error);
        return { success: false, error: error.message || "Unknown error" };
    }
}

// Delete a photo
export async function deleteAusflugPhoto(photoId: number): Promise<{ success: boolean; error?: string }> {
    // Get photo info first
    const { data: photo, error: fetchError } = await supabase
        .from("ausfluege_fotos")
        .select("path")
        .eq("id", photoId)
        .single();

    if (fetchError || !photo) {
        return { success: false, error: "Photo not found" };
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
        .from("ausfluege-images")
        .remove([photo.path]);

    if (storageError) {
        console.error("[Supabase] Error deleting from storage:", storageError);
    }

    // Delete record
    const { error } = await supabase
        .from("ausfluege_fotos")
        .delete()
        .eq("id", photoId);

    if (error) {
        console.error("[Supabase] Error deleting photo record:", error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

// Set a photo as primary
export async function setPhotoPrimary(photoId: number, ausflugId: number): Promise<{ success: boolean; error?: string }> {
    // Unset all other primaries for this ausflug
    await supabase
        .from("ausfluege_fotos")
        .update({ is_primary: false })
        .eq("ausflug_id", ausflugId);

    // Set this one as primary
    const { error } = await supabase
        .from("ausfluege_fotos")
        .update({ is_primary: true })
        .eq("id", photoId);

    if (error) {
        console.error("[Supabase] Error setting primary photo:", error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

// ========== DAY PLANS FUNCTIONS ==========

export type DayPlan = {
    id: number;
    user_id: string;
    title: string;
    description: string | null;
    start_date: string;
    end_date: string;
    is_public: boolean;
    is_draft: boolean;
    created_at: string;
};

// Get all day plans for current user
export async function getDayPlans(): Promise<DayPlan[]> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        console.error("[Supabase] No authenticated user for getDayPlans");
        return [];
    }

    // Get the integer user ID from the users table via open_id (which stores the auth UUID)
    const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("open_id", user.id)
        .maybeSingle(); // Use maybeSingle() to handle case where user doesn't exist in users table yet

    if (userError) {
        console.error("[Supabase] Error fetching user:", userError);
        return [];
    }

    // If no user found in users table, return empty array (user hasn't been created yet)
    if (!userData) {
        console.log("[Supabase] No user found in users table for auth user", user.id);
        return [];
    }

    const { data, error } = await supabase
        .from("day_plans")
        .select("*")
        .eq("user_id", userData.id) // Use integer ID from users table
        .order("created_at", { ascending: false });

    if (error) {
        console.error("[Supabase] Error fetching day plans:", error);
        return [];
    }

    return data || [];
}

// Create a new day plan
export async function createDayPlan(params: {
    title: string;
    description?: string;
    startDate: Date;
    endDate: Date;
}): Promise<{ success: boolean; plan?: DayPlan; error?: string }> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Nicht angemeldet" };
    }

    // Get the integer user ID from the users table via open_id (which stores the auth UUID)
    const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("open_id", user.id)
        .maybeSingle();

    if (userError) {
        console.error("[Supabase] Error fetching user:", userError);
        return { success: false, error: "Datenbankfehler beim Laden des Benutzers" };
    }

    let userId: number;

    // If no user found in users table, create one
    if (!userData) {
        console.log("[Supabase] Creating new user in users table for auth user", user.id);

        const { data: newUser, error: createError } = await supabase
            .from("users")
            .insert({
                open_id: user.id,
                email: user.email,
                name: user.user_metadata?.name || user.email?.split('@')[0],
                login_method: "supabase",
            })
            .select("id")
            .single();

        if (createError || !newUser) {
            console.error("[Supabase] Error creating user:", createError);
            return { success: false, error: "Fehler beim Erstellen des Benutzers" };
        }

        userId = newUser.id;
    } else {
        userId = userData.id;
    }

    const { data, error } = await supabase
        .from("day_plans")
        .insert({
            user_id: userId, // Use integer ID from users table
            title: params.title,
            description: params.description || null,
            start_date: params.startDate.toISOString(),
            end_date: params.endDate.toISOString(),
            is_public: false,
            is_draft: true,
        })
        .select()
        .single();

    if (error) {
        console.error("[Supabase] Error creating day plan:", error);
        return { success: false, error: error.message };
    }

    return { success: true, plan: data };
}

// Get a single day plan by ID
export async function getDayPlanById(id: number): Promise<DayPlan | null> {
    const { data, error } = await supabase
        .from("day_plans")
        .select("*")
        .eq("id", id)
        .single();

    if (error) {
        console.error("[Supabase] Error fetching day plan:", error);
        return null;
    }

    return data;
}

// Delete a day plan
export async function deleteDayPlan(planId: number): Promise<{ success: boolean; error?: string }> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Nicht angemeldet" };
    }

    const { error } = await supabase
        .from("day_plans")
        .delete()
        .eq("id", planId)
        .eq("user_id", user.id); // Ensure user can only delete their own plans

    if (error) {
        console.error("[Supabase] Error deleting day plan:", error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

// ============ USER TRIPS ============

export type UserTrip = {
    id: number;
    name: string;
    beschreibung: string | null;
    adresse: string;
    region: string | null;
    kosten_stufe: number | null;
    lat?: string | null;
    lng?: string | null;
    is_favorite: boolean;
    is_done: boolean;
    primaryPhotoUrl?: string | null;
    image?: string | null; // Trip image URL
};

// Get all user trips with details
export async function getUserTrips(): Promise<UserTrip[]> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        console.log("[Supabase] User not authenticated for getUserTrips");
        return [];
    }

    // Get user's integer ID
    const { data: userData } = await supabase
        .from("users")
        .select("id")
        .eq("open_id", user.id)
        .maybeSingle();

    if (!userData) {
        console.log("[Supabase] User not found in users table");
        return [];
    }

    // Get user trips with ausflug details
    const { data, error } = await supabase
        .from("user_trips")
        .select(`
            is_favorite,
            is_done,
            ausfluege (
                id,
                name,
                beschreibung,
                adresse,
                region,
                kosten_stufe,
                lat,
                lng
            )
        `)
        .eq("user_id", userData.id);

    if (error) {
        console.error("[Supabase] Error fetching user trips:", error);
        return [];
    }

    // Get primary photos for each trip
    const tripIds = data?.map((ut: any) => ut.ausfluege.id) || [];
    const photos = await getPrimaryPhotosForTrips(tripIds);

    console.log('[getUserTrips] Trip IDs:', tripIds);
    console.log('[getUserTrips] Photos map keys:', Object.keys(photos));
    console.log('[getUserTrips] Photos map sample:', photos[tripIds[0]]);

    // Map to UserTrip type
    return (data || []).map((ut: any) => ({
        id: ut.ausfluege.id,
        name: ut.ausfluege.name,
        beschreibung: ut.ausfluege.beschreibung,
        adresse: ut.ausfluege.adresse,
        region: ut.ausfluege.region,
        kosten_stufe: ut.ausfluege.kosten_stufe,
        lat: ut.ausfluege.lat,
        lng: ut.ausfluege.lng,
        is_favorite: ut.is_favorite,
        is_done: ut.is_done,
        primaryPhotoUrl: photos[ut.ausfluege.id] || null,
        image: photos[ut.ausfluege.id] || null, // Also provide as 'image' for compatibility
    }));
}

// Add a trip to user's collection
export async function addUserTrip(tripId: number, isFavorite: boolean = false): Promise<{ success: boolean; error?: string }> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Nicht angemeldet" };
    }

    // Get or create user
    let { data: userData } = await supabase
        .from("users")
        .select("id")
        .eq("open_id", user.id)
        .maybeSingle();

    if (!userData) {
        // Auto-create user
        const { data: newUser, error: createError } = await supabase
            .from("users")
            .insert({
                open_id: user.id,
                email: user.email,
                name: user.user_metadata?.name || user.email?.split('@')[0],
                login_method: "supabase",
            })
            .select("id")
            .single();

        if (createError || !newUser) {
            return { success: false, error: "Fehler beim Erstellen des Benutzers" };
        }
        userData = newUser;
    }

    // Add or update trip
    const { error } = await supabase
        .from("user_trips")
        .upsert({
            user_id: userData.id,
            trip_id: tripId,
            is_favorite: isFavorite,
        }, {
            onConflict: 'user_id,trip_id'
        });

    if (error) {
        console.error("[Supabase] Error adding/updating user trip:", error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

// Toggle favorite status
export async function toggleTripFavorite(tripId: number): Promise<{ success: boolean; error?: string }> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Nicht angemeldet" };
    }

    const { data: userData } = await supabase
        .from("users")
        .select("id")
        .eq("open_id", user.id)
        .single();

    if (!userData) {
        return { success: false, error: "Benutzer nicht gefunden" };
    }

    // Get current state
    const { data: userTrip } = await supabase
        .from("user_trips")
        .select("is_favorite")
        .eq("user_id", userData.id)
        .eq("trip_id", tripId)
        .single();

    if (!userTrip) {
        return { success: false, error: "Trip nicht in deiner Liste" };
    }

    // Toggle
    const { error } = await supabase
        .from("user_trips")
        .update({ is_favorite: !userTrip.is_favorite })
        .eq("user_id", userData.id)
        .eq("trip_id", tripId);

    if (error) {
        console.error("[Supabase] Error toggling favorite:", error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

// Toggle done status
export async function toggleTripDone(tripId: number): Promise<{ success: boolean; error?: string }> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Nicht angemeldet" };
    }

    const { data: userData } = await supabase
        .from("users")
        .select("id")
        .eq("open_id", user.id)
        .single();

    if (!userData) {
        return { success: false, error: "Benutzer nicht gefunden" };
    }

    // Get current state
    const { data: userTrip } = await supabase
        .from("user_trips")
        .select("is_done")
        .eq("user_id", userData.id)
        .eq("trip_id", tripId)
        .single();

    if (!userTrip) {
        return { success: false, error: "Trip nicht in deiner Liste" };
    }

    // Toggle
    const { error } = await supabase
        .from("user_trips")
        .update({ is_done: !userTrip.is_done })
        .eq("user_id", userData.id)
        .eq("trip_id", tripId);

    if (error) {
        console.error("[Supabase] Error toggling done:", error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

// Remove trip from user's collection
export async function removeUserTrip(tripId: number): Promise<{ success: boolean; error?: string }> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Nicht angemeldet" };
    }

    const { data: userData } = await supabase
        .from("users")
        .select("id")
        .eq("open_id", user.id)
        .single();

    if (!userData) {
        return { success: false, error: "Benutzer nicht gefunden" };
    }

    const { error } = await supabase
        .from("user_trips")
        .delete()
        .eq("user_id", userData.id)
        .eq("trip_id", tripId);

    if (error) {
        console.error("[Supabase] Error removing user trip:", error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

// Upload profile photo to Supabase Storage
export async function uploadProfilePhoto(fileUri: string): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, error: "Nicht angemeldet" };
        }

        console.log('[uploadProfilePhoto] Starting upload for user:', user.id);
        console.log('[uploadProfilePhoto] File URI:', fileUri);

        // Read file as Base64
        const base64 = await FileSystem.readAsStringAsync(fileUri, {
            encoding: 'base64',
        });

        console.log('[uploadProfilePhoto] File read as Base64, length:', base64.length);

        // Convert Base64 to ArrayBuffer
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        const arrayBuffer = bytes.buffer;

        console.log('[uploadProfilePhoto] Converted to ArrayBuffer, size:', arrayBuffer.byteLength);

        // Generate unique filename
        const fileName = `${user.id}/avatar.jpg`;

        // Upload to Supabase Storage using ArrayBuffer
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, arrayBuffer, {
                contentType: 'image/jpeg',
                upsert: true,
            });

        if (uploadError) {
            console.error("[uploadProfilePhoto] Upload error:", uploadError);
            return { success: false, error: uploadError.message };
        }

        console.log('[uploadProfilePhoto] Upload successful:', uploadData);

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);

        const publicUrl = urlData.publicUrl;
        // Add cache-busting timestamp to force reload
        const cachedBustedUrl = `${publicUrl}?t=${Date.now()}`;
        console.log('[uploadProfilePhoto] Public URL with cache buster:', cachedBustedUrl);

        // Update users table
        const { error: updateError } = await supabase
            .from('users')
            .update({ avatar_url: cachedBustedUrl })
            .eq('open_id', user.id);

        if (updateError) {
            console.error("[uploadProfilePhoto] User update error:", updateError);
            return { success: false, error: updateError.message };
        }

        // Also update auth metadata for immediate reflection
        await supabase.auth.updateUser({
            data: { avatar_url: cachedBustedUrl }
        });

        console.log('[uploadProfilePhoto] Upload complete, URL saved to database');
        return { success: true, url: cachedBustedUrl };
    } catch (error: any) {
        console.error("[uploadProfilePhoto] Unexpected error:", error);
        return { success: false, error: error.message || "Unbekannter Fehler" };
    }
}

// Helper function to get primary photos for multiple trips
async function getPrimaryPhotosForTrips(tripIds: number[]): Promise<Record<number, string>> {
    if (tripIds.length === 0) return {};

    const { data, error } = await supabase
        .from("ausfluege_fotos")
        .select("ausflug_id, full_url")  // Fixed: was bild_url, should be full_url
        .in("ausflug_id", tripIds)
        .eq("is_primary", true);

    console.log('[getPrimaryPhotosForTrips] Query result:', { data, error, tripIds: tripIds.slice(0, 5) });

    const photoMap: Record<number, string> = {};
    (data || []).forEach((photo: any) => {
        photoMap[photo.ausflug_id] = photo.full_url;  // Fixed: was bild_url, should be full_url
    });

    console.log('[getPrimaryPhotosForTrips] PhotoMap:', photoMap);
    return photoMap;
}

// ============ PLAN DETAILS ============

export type PlanActivity = {
    id: number;
    plan_id: number;
    ausflug_id: number;
    sort_order: number;
    scheduled_time: string | null;
    notes: string | null;
    // Joined fields from ausfluege
    name: string;
    adresse: string;
    region: string | null;
    kosten_stufe: number | null;
    primaryPhotoUrl?: string | null;
};

export type ChecklistItem = {
    id: number;
    plan_id: number;
    title: string;
    is_done: boolean;
    category: string;
    sort_order: number;
    created_at: string;
};

// Get all activities for a plan
export async function getPlanActivities(planId: number): Promise<PlanActivity[]> {
    const { data, error } = await supabase
        .from("day_plan_activities")
        .select(`
            id,
            plan_id,
            ausflug_id,
            sort_order,
            scheduled_time,
            notes,
            ausfluege (
                name,
                adresse,
                region,
                kosten_stufe
            )
        `)
        .eq("plan_id", planId)
        .order("sort_order", { ascending: true });

    if (error) {
        console.error("[Supabase] Error fetching plan activities:", error);
        return [];
    }

    // Get primary photos
    const ausflugIds = data?.map((a: any) => a.ausflug_id) || [];
    const photos = await getPrimaryPhotosForTrips(ausflugIds);

    return (data || []).map((activity: any) => ({
        id: activity.id,
        plan_id: activity.plan_id,
        ausflug_id: activity.ausflug_id,
        sort_order: activity.sort_order,
        scheduled_time: activity.scheduled_time,
        notes: activity.notes,
        name: activity.ausfluege.name,
        adresse: activity.ausfluege.adresse,
        region: activity.ausfluege.region,
        kosten_stufe: activity.ausfluege.kosten_stufe,
        primaryPhotoUrl: photos[activity.ausflug_id] || null,
    }));
}

// Add activity to plan
export async function addActivityToPlan(planId: number, ausflugId: number): Promise<{ success: boolean; error?: string }> {
    // Get current max sort_order
    const { data: existing } = await supabase
        .from("day_plan_activities")
        .select("sort_order")
        .eq("plan_id", planId)
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle();

    const nextSortOrder = (existing?.sort_order ?? -1) + 1;

    const { error } = await supabase
        .from("day_plan_activities")
        .insert({
            plan_id: planId,
            ausflug_id: ausflugId,
            sort_order: nextSortOrder,
        });

    if (error) {
        if (error.code === "23505") {
            return { success: false, error: "Aktivität bereits im Plan" };
        }
        console.error("[Supabase] Error adding activity to plan:", error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

// Remove activity from plan
export async function removeActivityFromPlan(planId: number, ausflugId: number): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
        .from("day_plan_activities")
        .delete()
        .eq("plan_id", planId)
        .eq("ausflug_id", ausflugId);

    if (error) {
        console.error("[Supabase] Error removing activity from plan:", error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

// Get checklist for a plan
export async function getPlanChecklist(planId: number): Promise<ChecklistItem[]> {
    const { data, error } = await supabase
        .from("day_plan_checklist")
        .select("*")
        .eq("plan_id", planId)
        .order("sort_order", { ascending: true });

    if (error) {
        console.error("[Supabase] Error fetching plan checklist:", error);
        return [];
    }

    return data || [];
}

// Add checklist item
export async function addChecklistItem(
    planId: number,
    title: string,
    category: string = "general"
): Promise<{ success: boolean; error?: string; item?: ChecklistItem }> {
    // Get current max sort_order
    const { data: existing } = await supabase
        .from("day_plan_checklist")
        .select("sort_order")
        .eq("plan_id", planId)
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle();

    const nextSortOrder = (existing?.sort_order ?? -1) + 1;

    const { data, error } = await supabase
        .from("day_plan_checklist")
        .insert({
            plan_id: planId,
            title,
            category,
            sort_order: nextSortOrder,
        })
        .select()
        .single();

    if (error) {
        console.error("[Supabase] Error adding checklist item:", error);
        return { success: false, error: error.message };
    }

    return { success: true, item: data };
}

// Toggle checklist item
export async function toggleChecklistItem(itemId: number): Promise<{ success: boolean; error?: string }> {
    // Get current state
    const { data: item } = await supabase
        .from("day_plan_checklist")
        .select("is_done")
        .eq("id", itemId)
        .single();

    if (!item) {
        return { success: false, error: "Item not found" };
    }

    const { error } = await supabase
        .from("day_plan_checklist")
        .update({ is_done: !item.is_done })
        .eq("id", itemId);

    if (error) {
        console.error("[Supabase] Error toggling checklist item:", error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

// Delete checklist item
export async function deleteChecklistItem(itemId: number): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
        .from("day_plan_checklist")
        .delete()
        .eq("id", itemId);

    if (error) {
        console.error("[Supabase] Error deleting checklist item:", error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

// Update plan notes
export async function updatePlanNotes(planId: number, notes: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
        .from("day_plans")
        .update({ notes })
        .eq("id", planId);

    if (error) {
        console.error("[Supabase] Error updating plan notes:", error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

// ========== PUSH NOTIFICATIONS ==========

/**
 * Save or update push notification token for the current user
 */
export async function savePushToken(token: string, deviceType?: string): Promise<{ success: boolean; error?: string }> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, error: "Not authenticated" };
        }

        // Get user ID from users table
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('open_id', user.id)
            .single();

        if (userError || !userData) {
            return { success: false, error: "User not found" };
        }

        // Upsert push token
        const { error } = await supabase
            .from('push_tokens')
            .upsert({
                user_id: userData.id,
                token,
                device_type: deviceType || 'unknown',
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'token'
            });

        if (error) {
            console.error('[savePushToken] Error:', error);
            return { success: false, error: error.message };
        }

        console.log('[savePushToken] Token saved successfully');
        return { success: true };
    } catch (error: any) {
        console.error('[savePushToken] Unexpected error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get all push tokens (admin only)
 */
export async function getAllPushTokens(): Promise<{ success: boolean; tokens?: string[]; error?: string }> {
    try {
        const { data, error } = await supabase
            .from('push_tokens')
            .select('token');

        if (error) {
            console.error('[getAllPushTokens] Error:', error);
            return { success: false, error: error.message };
        }

        const tokens = data?.map(row => row.token) || [];
        return { success: true, tokens };
    } catch (error: any) {
        console.error('[getAllPushTokens] Unexpected error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send broadcast notification to all users (admin only)
 */
export async function sendBroadcastNotification(
    title: string,
    body: string
): Promise<{ success: boolean; sent?: number; error?: string }> {
    try {
        // Get all push tokens
        const { success, tokens, error } = await getAllPushTokens();
        if (!success || !tokens || tokens.length === 0) {
            return { success: false, error: error || "No tokens found" };
        }

        // Send to Expo Push Notification service
        const messages = tokens.map(token => ({
            to: token,
            sound: 'default',
            title,
            body,
            data: { type: 'broadcast' },
        }));

        const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(messages),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('[sendBroadcastNotification] Expo API error:', errorData);
            return { success: false, error: 'Failed to send notifications' };
        }

        console.log(`[sendBroadcastNotification] Sent to ${tokens.length} devices`);
        return { success: true, sent: tokens.length };
    } catch (error: any) {
        console.error('[sendBroadcastNotification] Unexpected error:', error);
        return { success: false, error: error.message };
    }
}

// ========== WEATHER ==========

// OpenWeatherMap API key
const OPENWEATHER_API_KEY = 'fd150cd2a400b2c86aaeeffc8deb8245';

export type CurrentWeather = {
    temp: number;
    feels_like: number;
    description: string;
    icon: string;
    humidity: number;
    wind_speed: number;
};

export type DailyForecast = {
    date: string;
    temp_min: number;
    temp_max: number;
    description: string;
    icon: string;
    pop: number; // Probability of precipitation
};

/**
 * Get current weather for given coordinates
 */
export async function getCurrentWeather(lat: number, lng: number): Promise<{ success: boolean; weather?: CurrentWeather; error?: string }> {
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&lang=de&appid=${OPENWEATHER_API_KEY}`
        );

        if (!response.ok) {
            return { success: false, error: 'Weather service unavailable' };
        }

        const data = await response.json();

        const weather: CurrentWeather = {
            temp: Math.round(data.main.temp),
            feels_like: Math.round(data.main.feels_like),
            description: data.weather[0].description,
            icon: data.weather[0].icon,
            humidity: data.main.humidity,
            wind_speed: data.wind.speed,
        };

        return { success: true, weather };
    } catch (error: any) {
        console.error('[getCurrentWeather] Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get 7-day weather forecast for given coordinates
 */
export async function getWeatherForecast(lat: number, lng: number): Promise<{ success: boolean; forecast?: DailyForecast[]; error?: string }> {
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&units=metric&lang=de&appid=${OPENWEATHER_API_KEY}`
        );

        if (!response.ok) {
            return { success: false, error: 'Weather service unavailable' };
        }

        const data = await response.json();

        // Group forecast by day and get min/max temps
        const dailyData: Record<string, any> = {};

        data.list.forEach((item: any) => {
            const date = item.dt_txt.split(' ')[0];

            if (!dailyData[date]) {
                dailyData[date] = {
                    date,
                    temps: [],
                    descriptions: [],
                    icons: [],
                    pops: [],
                };
            }

            dailyData[date].temps.push(item.main.temp);
            dailyData[date].descriptions.push(item.weather[0].description);
            dailyData[date].icons.push(item.weather[0].icon);
            dailyData[date].pops.push(item.pop || 0);
        });

        // Convert to DailyForecast array (take first 7 days)
        const forecast: DailyForecast[] = Object.values(dailyData)
            .slice(0, 7)
            .map((day: any) => ({
                date: day.date,
                temp_min: Math.round(Math.min(...day.temps)),
                temp_max: Math.round(Math.max(...day.temps)),
                description: day.descriptions[Math.floor(day.descriptions.length / 2)],
                icon: day.icons[Math.floor(day.icons.length / 2)],
                pop: Math.round(Math.max(...day.pops) * 100),
            }));

        return { success: true, forecast };
    } catch (error: any) {
        console.error('[getWeatherForecast] Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get weather icon URL from OpenWeatherMap code
 */
export function getWeatherIconUrl(iconCode: string): string {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}
