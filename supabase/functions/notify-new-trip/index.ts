import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { record } = await req.json()

        if (!record) {
            return new Response(
                JSON.stringify({ error: 'Missing record data' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
        }

        // Initialize Supabase Client
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // 1. Get users who crave notifications (notify_new_trip = true) AND have a push token
        // We join with push_tokens table
        const { data: usersWithTokens, error: fetchError } = await supabase
            .from('users')
            .select(`
                id,
                push_tokens!inner(token) 
            `)
            .eq('notify_new_trip', true)

        if (fetchError) {
            console.error('Error fetching users:', fetchError)
            throw fetchError
        }

        if (!usersWithTokens || usersWithTokens.length === 0) {
            console.log('No users to notify.')
            return new Response(
                JSON.stringify({ success: true, message: 'No users to notify' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 2. Extract unique tokens
        const tokens = new Set<string>()
        usersWithTokens.forEach((user: any) => {
            if (user.push_tokens) {
                if (Array.isArray(user.push_tokens)) {
                    user.push_tokens.forEach((pt: any) => tokens.add(pt.token))
                } else {
                    tokens.add(user.push_tokens.token)
                }
            }
        })

        // Debug: Log the received record ID
        console.log(`[Edge] Searching for trip ID: ${record.id}`);

        // Wait 1s to ensure DB consistency (race condition protection)
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Fetch fresh data from DB
        const { data: tripData, error: tripError } = await supabase
            .from('ausfluege')
            .select('*')
            .eq('id', record.id)
            .single()

        if (tripError || !tripData) {
            console.error('[Edge] Error fetching trip:', tripError)
            // Even if DB fetch fails, try to fall back to payload if available, or generic
            console.log('[Edge] Falling back to payload due to DB error');
        } else {
            console.log('[Edge] Trip found in DB:', tripData.name);
        }

        // Determine Name and Location (DB > Payload > Default)
        // Use tripData if available, otherwise record (payload)
        const source = tripData || record;

        const n = source.name;
        const tripName = (n && n !== 'undefined') ? n : (source.title || 'Neuer Ausflug');
        const tripLocation = source.region || source.land || 'der Schweiz';

        console.log(`[Edge] Final content: "${tripName}" in "${tripLocation}"`)

        const expoPushTokens = Array.from(tokens)
        console.log(`Found ${expoPushTokens.length} tokens to notify.`)
        console.log(`Notification: "${tripName}" in "${tripLocation}"`)

        if (expoPushTokens.length === 0) {
            return new Response(
                JSON.stringify({
                    success: true,
                    message: 'No valid tokens found',
                    debug: {
                        usersFound: usersWithTokens.length,
                        tokensFound: 0
                    }
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 3. Prepare messages for Expo
        const messages = expoPushTokens.map(token => ({
            to: token,
            sound: 'default',
            title: 'Neuer Ausflug! 🌲',
            body: `Entdecke "${tripName}" in ${tripLocation}!`,
            data: { url: `/trip/${record.id}` },
        }))

        // 4. Send to Expo in batches (Expo handles batching, but good to be safe)
        const chunks = []
        const chunkSize = 100 // Expo recommends 100
        for (let i = 0; i < messages.length; i += chunkSize) {
            chunks.push(messages.slice(i, i + chunkSize))
        }

        const results = []
        for (const chunk of chunks) {
            const response = await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Accept-encoding': 'gzip, deflate',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(chunk),
            })
            const data = await response.json()
            results.push(data)
        }

        return new Response(
            JSON.stringify({ success: true, results }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Error:', error)
        // Return 200 even on error so client can read the message
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message || 'Unknown error',
                details: JSON.stringify(error, Object.getOwnPropertyNames(error))
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
    }
})
