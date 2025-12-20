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
