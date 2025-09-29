import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { Resend } from "https://esm.sh/resend@2.0.0"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const resend = new Resend(Deno.env.get("RESEND_API_KEY"))

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface ShareEmailRequest {
  proposalId: string
  recipientEmail: string
  proposalTitle: string
  senderName: string
  shareUrl?: string
}

const handler = async (req: Request): Promise<Response> => {
  console.log('Send proposal email function called')
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { proposalId, recipientEmail, proposalTitle, senderName, shareUrl }: ShareEmailRequest = await req.json()
    
    console.log('Sending proposal email to:', recipientEmail)
    console.log('Share URL being sent:', shareUrl)

    // Use the provided shareUrl - it should always contain the correct token
    if (!shareUrl) {
      throw new Error('Share URL is required for email notifications')
    }
    
    // Verify it's using /shared/ route, not /proposal/
    if (!shareUrl.includes('/shared/')) {
      console.error('Invalid share URL format:', shareUrl)
      throw new Error('Share URL must use /shared/ route for public access')
    }
    
    const finalShareUrl = shareUrl

    const emailResponse = await resend.emails.send({
      from: "Proposals <ceo@proposalkraft.com>",
      to: [recipientEmail],
      subject: `${senderName} shared a proposal: ${proposalTitle}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">New Proposal Shared</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
            <p style="margin: 0 0 15px 0; font-size: 16px; color: #333;">Hello!</p>
            <p style="margin: 0 0 15px 0; font-size: 16px; color: #333;">
              <strong>${senderName}</strong> has shared a proposal with you:
            </p>
            <h2 style="margin: 0 0 20px 0; color: #2d3748; font-size: 20px;">"${proposalTitle}"</h2>
            <div style="text-align: center;">
              <a href="${finalShareUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
                View Proposal
              </a>
            </div>
          </div>
          
          <div style="color: #666; font-size: 14px; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
            <p style="margin: 0;">This proposal was shared via our secure platform.</p>
            <p style="margin: 5px 0 0 0;">If you have any questions, please contact ${senderName} directly.</p>
          </div>
        </div>
      `,
    })

    console.log("Email sent successfully:", emailResponse)

    return new Response(JSON.stringify({ success: true, messageId: emailResponse.data?.id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    })
  } catch (error: any) {
    console.error("Error in send-proposal-email function:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    )
  }
}

serve(handler)