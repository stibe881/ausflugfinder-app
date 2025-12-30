import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { recipientEmail, senderEmail, senderName } = await req.json()

        // Validate input
        if (!recipientEmail || !senderEmail) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
        }

        // Send email using Resend
        const resendApiKey = Deno.env.get('RESEND_API_KEY')
        if (!resendApiKey) {
            throw new Error('RESEND_API_KEY not configured')
        }

        const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
          .app-links { margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏔️ Ausflugfinder Einladung</h1>
          </div>
          <div class="content">
            <p>Hallo!</p>
            
            <p><strong>${senderName || senderEmail}</strong> hat dich zu Ausflugfinder eingeladen!</p>
            
            <p>Entdecke Schweizer Ausflugsziele, plane Trips mit Freunden und teile deine Abenteuer.</p>
            
            <div class="app-links">
              <h3>📱 App herunterladen:</h3>
              <a href="https://apps.apple.com/app/ausflugfinder" class="button">
                iOS App Store
              </a>
              <a href="https://play.google.com/store/apps" class="button">
                Android Play Store
              </a>
            </div>
            
            <div class="warning">
              <strong>⚠️ Wichtig:</strong><br>
              Registriere dich mit dieser Email-Adresse (<strong>${recipientEmail}</strong>),
              um die Freundschaftsanfrage von ${senderName || senderEmail} zu erhalten.
            </div>
            
            <p>Viel Spass beim Entdecken!</p>
            <p>Dein Ausflugfinder Team</p>
          </div>
          <div class="footer">
            <p>Diese Email wurde versendet, weil ${senderName || senderEmail} dich eingeladen hat.</p>
          </div>
        </div>
      </body>
      </html>
    `

        const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: 'Ausflugfinder <noreply@ausflugfinder.ch>',
                to: recipientEmail,
                subject: `${senderName || senderEmail} hat dich zu Ausflugfinder eingeladen!`,
                html: emailHtml
            }),
        })

        if (!emailResponse.ok) {
            const error = await emailResponse.text()
            console.error('Resend API error:', error)
            throw new Error('Failed to send email')
        }

        const data = await emailResponse.json()
        console.log('Email sent successfully:', data)

        return new Response(
            JSON.stringify({ success: true, messageId: data.id }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
