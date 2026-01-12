import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        // Parse request body
        const { user_email, trip_id, voucher_code, voucher_title, deep_link, external_id, api_secret } = await req.json();

        // Validate API Secret
        const expectedSecret = Deno.env.get("VOUCHER_API_SECRET") || "dev-secret-123";
        if (api_secret !== expectedSecret) {
            return new Response(
                JSON.stringify({ success: false, error: "Unauthorized: Invalid API secret" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Validate required fields
        if (!user_email || !trip_id || !voucher_code || !voucher_title || !deep_link || !external_id) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Missing required fields: user_email, trip_id, voucher_code, voucher_title, deep_link, external_id",
                }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Create Supabase client with SERVICE ROLE key for bypassing RLS
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Upsert voucher (on conflict external_id, update the record)
        const { data, error } = await supabase
            .from("trip_vouchers")
            .upsert(
                {
                    user_email,
                    trip_id,
                    voucher_code,
                    voucher_title,
                    deep_link,
                    external_id,
                    updated_at: new Date().toISOString(),
                },
                {
                    onConflict: "external_id",
                }
            )
            .select()
            .single();

        if (error) {
            console.error("[link-voucher] Database error:", error);
            return new Response(
                JSON.stringify({ success: false, error: error.message }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        console.log("[link-voucher] Successfully linked voucher:", external_id);
        return new Response(
            JSON.stringify({ success: true, data }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("[link-voucher] Error:", error);
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
