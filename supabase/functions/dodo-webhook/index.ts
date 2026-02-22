import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = createHmac("sha256", secret);
  hmac.update(payload);
  const expected = hmac.digest("hex");
  return expected === signature;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookSecret = Deno.env.get("DODO_PAYMENTS_WEBHOOK_SECRET");
    if (!webhookSecret) {
      throw new Error("Webhook secret not configured");
    }

    const body = await req.text();
    const signature = req.headers.get("webhook-signature") ||
      req.headers.get("x-dodo-signature") || "";

    if (signature && !verifyWebhookSignature(body, signature, webhookSecret)) {
      console.error("Invalid webhook signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const event = JSON.parse(body);
    console.log("Dodo webhook event:", JSON.stringify(event));

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const eventType = event.type || event.event_type;
    const subData = event.data || event;
    const userId = subData.metadata?.user_id;
    const subscriptionId = subData.subscription_id || subData.id;

    if (!userId) {
      console.warn("No user_id in webhook metadata, skipping");
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let status = "none";
    if (eventType?.includes("active")) status = "active";
    else if (eventType?.includes("cancelled") || eventType?.includes("canceled")) status = "cancelled";
    else if (eventType?.includes("expired")) status = "expired";
    else if (eventType?.includes("failed")) status = "failed";
    else if (eventType?.includes("created")) status = "pending";

    const currentPeriodEnd = subData.current_period_end || subData.next_billing_date || null;

    // Upsert subscription
    const { error: upsertError } = await supabase
      .from("subscriptions")
      .upsert(
        {
          user_id: userId,
          status,
          plan_type: "pro",
          whop_membership_id: subscriptionId,
          current_period_end: currentPeriodEnd,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (upsertError) {
      console.error("Subscription upsert error:", upsertError);
      throw upsertError;
    }

    console.log(`Subscription updated: user=${userId}, status=${status}`);

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
