import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { amount, currency = "USD", description, proposal_id } = await req.json();

    if (!amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: "Invalid amount" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's PayPal credentials
    const { data: paymentSettings, error: settingsError } = await supabaseClient
      .from("user_payment_settings")
      .select("paypal_client_id_custom, paypal_merchant_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (settingsError || !paymentSettings?.paypal_client_id_custom || !paymentSettings?.paypal_merchant_id) {
      return new Response(
        JSON.stringify({ error: "PayPal not configured. Please set up PayPal in Settings." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create PayPal payment link using their hosted checkout
    const paypalUrl = `https://www.paypal.com/paypalme/${paymentSettings.paypal_merchant_id}/${amount}${currency}`;

    // Save payment link to database
    const { data: paymentLink, error: insertError } = await supabaseClient
      .from("payment_links")
      .insert({
        user_id: user.id,
        proposal_id: proposal_id || null,
        amount,
        currency: currency.toLowerCase(),
        description: description || null,
        paypal_order_id: paymentSettings.paypal_merchant_id,
        payment_provider: 'paypal',
        status: "pending",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Database error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to save payment link" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment_link: paypalUrl,
        payment_link_id: paymentLink.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating PayPal payment link:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
