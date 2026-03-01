import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { subscription_id } = await req.json();

    const DODO_API_KEY = Deno.env.get("DODO_PAYMENTS_API_KEY");
    if (!DODO_API_KEY) {
      throw new Error("DODO_PAYMENTS_API_KEY not configured");
    }

    const dodoRes = await fetch(
      `https://live.dodopayments.com/subscriptions/${subscription_id}`,
      {
        headers: {
          Authorization: `Bearer ${DODO_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!dodoRes.ok) {
      const errText = await dodoRes.text();
      console.error("Dodo verify error:", errText);
      throw new Error("Failed to verify subscription with Dodo");
    }

    const subData = await dodoRes.json();
    console.log("Dodo subscription data:", JSON.stringify(subData));

    const status = subData.status === "active" || subData.status === "trialing" ? "active" : subData.status;
    const currentPeriodEnd = subData.expires_at || subData.current_period_end || subData.next_billing_date || null;
    const trialDays = subData.trial_period_days || 0;
    const isTrial = trialDays > 0 && (subData.recurring_pre_tax_amount === 0 || subData.status === "trialing");
    const isPaid = status === "active" && !isTrial;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error: upsertError } = await supabaseAdmin
      .from("subscriptions")
      .upsert(
        {
          user_id: user.id,
          status: status === "active" ? "active" : "none",
          plan_type: "pro",
          whop_membership_id: subscription_id,
          current_period_end: currentPeriodEnd,
          is_trial: isTrial,
          is_paid: isPaid,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (upsertError) {
      console.error("Subscription upsert error:", upsertError);
      throw upsertError;
    }

    console.log(`Subscription verified and activated for user ${user.id}, is_trial=${isTrial}, is_paid=${isPaid}`);

    return new Response(
      JSON.stringify({ success: true, status }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Verify payment error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
