import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NewsletterEmailRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Newsletter subscription function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: NewsletterEmailRequest = await req.json();
    console.log("Newsletter subscription for:", email);

    // Send welcome email to subscriber
    const emailResponse = await resend.emails.send({
      from: "ProposalKraft Newsletter <newsletter@proposalkraft.com>",
      to: [email],
      subject: "Welcome to ProposalKraft Newsletter!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; padding: 40px 20px; background: linear-gradient(135deg, #3B82F6, #1D4ED8); color: white; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Welcome to ProposalKraft!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
              Thank you for subscribing to our newsletter
            </p>
          </div>
          
          <div style="padding: 40px 20px; background-color: white;">
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              You're now part of our community! Get ready to receive:
            </p>
            
            <ul style="color: #333; font-size: 16px; line-height: 1.8; padding-left: 20px;">
              <li>📈 <strong>Proposal writing tips</strong> that help you win more deals</li>
              <li>🎯 <strong>Industry insights</strong> and best practices</li>
              <li>🚀 <strong>New feature announcements</strong> and updates</li>
              <li>💡 <strong>Success stories</strong> from our users</li>
              <li>🎁 <strong>Exclusive offers</strong> and early access to new features</li>
            </ul>
            
            <div style="margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-left: 4px solid #3B82F6; border-radius: 4px;">
              <p style="margin: 0; color: #333; font-size: 16px;">
                <strong>Pro Tip:</strong> While you're here, why not create your first proposal? 
                Our AI-powered tools can help you craft compelling proposals in minutes!
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://proposalkraft.com/auth" 
                 style="display: inline-block; padding: 12px 30px; background-color: #3B82F6; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Get Started Free
              </a>
            </div>
          </div>
          
          <div style="padding: 20px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
            <p style="margin: 0; color: #666; font-size: 14px;">
              Questions? Reply to this email or contact us at 
              <a href="mailto:support@proposalkraft.com" style="color: #3B82F6;">support@proposalkraft.com</a>
            </p>
            <p style="margin: 10px 0 0 0; color: #666; font-size: 12px;">
              © 2024 ProposalKraft. All rights reserved.
            </p>
          </div>
        </div>
      `,
    });

    console.log("Newsletter welcome email sent successfully:", emailResponse);

    // Notify admin about new subscription
    await resend.emails.send({
      from: "ProposalKraft Newsletter <newsletter@proposalkraft.com>",
      to: ["admin@proposalkraft.com"],
      subject: "New Newsletter Subscription",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #333;">New Newsletter Subscription</h2>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subscribed at:</strong> ${new Date().toISOString()}</p>
        </div>
      `,
    });

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-newsletter-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);