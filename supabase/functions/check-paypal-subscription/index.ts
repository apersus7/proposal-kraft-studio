import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-PAYPAL-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Get PayPal access token
const getPayPalAccessToken = async () => {
  const clientId = Deno.env.get("PAYPAL_CLIENT_ID");
  const clientSecret = Deno.env.get("PAYPAL_CLIENT_SECRET");
  
  if (!clientId || !clientSecret) {
    throw new Error("PayPal credentials not configured");
  }

  const auth = btoa(`${clientId}:${clientSecret}`);
  
  const response = await fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Accept-Language": "en_US",
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    throw new Error(`PayPal auth failed: ${await response.text()}`);
  }

  const data = await response.json();
  return data.access_token;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Use the service role key to perform writes (upsert) in Supabase
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check if subscriber exists in database
    const { data: subscriber, error: dbError } = await supabaseClient
      .from("subscribers")
      .select("*")
      .eq("email", user.email)
      .maybeSingle();

    if (dbError) {
      logStep("Database error", dbError);
      throw new Error(`Database error: ${dbError.message}`);
    }

    // If no subscriber record or no PayPal subscription ID, user is not subscribed
    if (!subscriber || !subscriber.paypal_subscription_id) {
      logStep("No subscriber record or PayPal subscription ID found, updating unsubscribed state");
      await supabaseClient.from("subscribers").upsert({
        email: user.email,
        user_id: user.id,
        paypal_subscription_id: null,
        subscribed: false,
        subscription_tier: null,
        subscription_end: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'email' });
      
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Get PayPal access token and check subscription status
    const accessToken = await getPayPalAccessToken();
    logStep("Got PayPal access token");

    const subscriptionResponse = await fetch(
      `https://api-m.sandbox.paypal.com/v1/billing/subscriptions/${subscriber.paypal_subscription_id}`,
      {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Accept": "application/json",
        },
      }
    );

    if (!subscriptionResponse.ok) {
      logStep("PayPal subscription not found or error", { status: subscriptionResponse.status });
      // Subscription not found or cancelled, update database
      await supabaseClient.from("subscribers").upsert({
        email: user.email,
        user_id: user.id,
        paypal_subscription_id: subscriber.paypal_subscription_id,
        subscribed: false,
        subscription_tier: null,
        subscription_end: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'email' });

      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const subscription = await subscriptionResponse.json();
    logStep("PayPal subscription data", { status: subscription.status, id: subscription.id });

    const isActive = subscription.status === "ACTIVE";
    let subscriptionTier = null;
    let subscriptionEnd = null;

    if (isActive && subscription.billing_info?.next_billing_time) {
      subscriptionEnd = new Date(subscription.billing_info.next_billing_time).toISOString();
      
      // Determine subscription tier based on plan (you might need to adjust this logic)
      if (subscription.plan_id) {
        if (subscription.plan_id.includes("basic")) {
          subscriptionTier = "Basic";
        } else if (subscription.plan_id.includes("premium")) {
          subscriptionTier = "Premium";
        } else if (subscription.plan_id.includes("enterprise")) {
          subscriptionTier = "Enterprise";
        } else {
          subscriptionTier = "Premium"; // Default tier
        }
      }
      logStep("Determined subscription tier", { subscriptionTier, subscriptionEnd });
    }

    await supabaseClient.from("subscribers").upsert({
      email: user.email,
      user_id: user.id,
      paypal_subscription_id: subscriber.paypal_subscription_id,
      subscribed: isActive,
      subscription_tier: subscriptionTier,
      subscription_end: subscriptionEnd,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email' });

    logStep("Updated database with subscription info", { subscribed: isActive, subscriptionTier });
    return new Response(JSON.stringify({
      subscribed: isActive,
      subscription_tier: subscriptionTier,
      subscription_end: subscriptionEnd
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-paypal-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});