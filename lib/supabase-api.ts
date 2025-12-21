// Supabase API functions for direct database access (no backend needed)
import { supabase } from "./supabase";

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
        .maybeSingle(); // Use maybeSingle() to handle case where user doesn't exist in users table yet

    if (userError) {
        console.error("[Supabase] Error fetching user:", userError);
        return { success: false, error: "Datenbankfehler beim Laden des Benutzers" };
    }

    // If no user found in users table, return error
    if (!userData) {
        console.log("[Supabase] No user found in users table for auth user", user.id);
        return { success: false, error: "Benutzer noch nicht in der Datenbank registriert" };
    }

    const { data, error } = await supabase
        .from("day_plans")
        .insert({
            user_id: userData.id, // Use integer ID from users table
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

