import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PAYPAL-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Use the service role key to perform writes in Supabase
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Webhook function started");

    const webhookData = await req.json();
    logStep("Received webhook", { eventType: webhookData.event_type, id: webhookData.id });

    const eventType = webhookData.event_type;
    const resource = webhookData.resource;

    if (!resource || !resource.id) {
      logStep("No resource data in webhook");
      return new Response(JSON.stringify({ error: "No resource data" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Handle subscription events
    if (eventType === "BILLING.SUBSCRIPTION.ACTIVATED" || 
        eventType === "BILLING.SUBSCRIPTION.CANCELLED" ||
        eventType === "BILLING.SUBSCRIPTION.SUSPENDED" ||
        eventType === "BILLING.SUBSCRIPTION.PAYMENT.COMPLETED") {
      
      const subscriptionId = resource.id;
      let subscribed = false;
      let subscriptionTier = null;
      let subscriptionEnd = null;

      if (eventType === "BILLING.SUBSCRIPTION.ACTIVATED" || 
          eventType === "BILLING.SUBSCRIPTION.PAYMENT.COMPLETED") {
        subscribed = true;
        
        // Determine subscription tier based on plan (adjust as needed)
        if (resource.plan_id) {
          if (resource.plan_id.includes("basic")) {
            subscriptionTier = "Basic";
          } else if (resource.plan_id.includes("premium")) {
            subscriptionTier = "Premium";
          } else if (resource.plan_id.includes("enterprise")) {
            subscriptionTier = "Enterprise";
          } else {
            subscriptionTier = "Premium"; // Default tier
          }
        }

        if (resource.billing_info?.next_billing_time) {
          subscriptionEnd = new Date(resource.billing_info.next_billing_time).toISOString();
        }
      }

      // Find subscriber by PayPal subscription ID and update
      const { data: subscriber, error: findError } = await supabaseClient
        .from("subscribers")
        .select("*")
        .eq("paypal_subscription_id", subscriptionId)
        .maybeSingle();

      if (findError) {
        logStep("Error finding subscriber", findError);
        throw new Error(`Database error: ${findError.message}`);
      }

      if (subscriber) {
        const { error: updateError } = await supabaseClient
          .from("subscribers")
          .update({
            subscribed,
            subscription_tier: subscriptionTier,
            subscription_end: subscriptionEnd,
            updated_at: new Date().toISOString(),
          })
          .eq("paypal_subscription_id", subscriptionId);

        if (updateError) {
          logStep("Error updating subscriber", updateError);
          throw new Error(`Update error: ${updateError.message}`);
        }

        logStep("Updated subscriber", { 
          subscriptionId, 
          subscribed, 
          subscriptionTier,
          email: subscriber.email 
        });
      } else {
        logStep("No subscriber found for subscription ID", { subscriptionId });
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in paypal-webhook", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});