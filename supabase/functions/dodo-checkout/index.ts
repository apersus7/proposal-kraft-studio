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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    const userEmail = claimsData.claims.email;

    const { return_url } = await req.json();

    const DODO_API_KEY = Deno.env.get("DODO_PAYMENTS_API_KEY");
    if (!DODO_API_KEY) {
      throw new Error("DODO_PAYMENTS_API_KEY not configured");
    }

    const response = await fetch("https://api.dodopayments.com/subscriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DODO_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        billing: {
          city: "",
          country: "US",
          state: "",
          street: "",
          zipcode: "",
        },
        customer: {
          email: userEmail,
          name: userEmail,
        },
        product_id: "pdt_0NZ4ezgNPcPQywH4e9p8W",
        quantity: 1,
        return_url: return_url || "https://proposal-kraft-studio.lovable.app/",
        metadata: {
          user_id: userId,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Dodo API error:", data);
      throw new Error(data.message || "Failed to create subscription checkout");
    }

    return new Response(
      JSON.stringify({ checkout_url: data.payment_link }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Checkout error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
