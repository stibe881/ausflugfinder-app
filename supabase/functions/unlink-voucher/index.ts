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
        const { external_id, action, api_secret } = await req.json();

        // Validate API Secret
        const expectedSecret = Deno.env.get("VOUCHER_API_SECRET") || "dev-secret-123";
        if (api_secret !== expectedSecret) {
            return new Response(
                JSON.stringify({ success: false, error: "Unauthorized: Invalid API secret" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Validate required fields
        if (!external_id) {
            return new Response(
                JSON.stringify({ success: false, error: "Missing required field: external_id" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Create Supabase client with SERVICE ROLE key for bypassing RLS
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Delete voucher by external_id
        const { error } = await supabase
            .from("trip_vouchers")
            .delete()
            .eq("external_id", external_id);

        if (error) {
            console.error("[unlink-voucher] Database error:", error);
            return new Response(
                JSON.stringify({ success: false, error: error.message }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        console.log(`[unlink-voucher] Successfully unlinked voucher: ${external_id} (action: ${action || "unknown"})`);
        return new Response(
            JSON.stringify({ success: true, message: "Voucher unlinked successfully" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("[unlink-voucher] Error:", error);
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
