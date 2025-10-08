import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

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
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { user_id, event_type, event_data } = await req.json();

    if (!user_id || !event_type) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get active webhooks for this user and event type
    const { data: webhooks, error: webhookError } = await supabaseClient
      .from("webhook_configurations")
      .select("*")
      .eq("user_id", user_id)
      .eq("is_active", true)
      .contains("events", [event_type]);

    if (webhookError) {
      console.error("Error fetching webhooks:", webhookError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch webhooks" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!webhooks || webhooks.length === 0) {
      return new Response(
        JSON.stringify({ message: "No webhooks configured for this event" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prepare webhook payload
    const payload = {
      event: event_type,
      timestamp: new Date().toISOString(),
      data: event_data,
    };

    // Send webhooks to all configured endpoints
    const results = await Promise.allSettled(
      webhooks.map(async (webhook) => {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          "User-Agent": "ProposalKraft-Webhooks/1.0",
        };

        // Add signature if secret is configured
        if (webhook.secret) {
          const encoder = new TextEncoder();
          const data = encoder.encode(JSON.stringify(payload));
          const keyData = encoder.encode(webhook.secret);
          
          const key = await crypto.subtle.importKey(
            "raw",
            keyData,
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["sign"]
          );
          
          const signature = await crypto.subtle.sign("HMAC", key, data);
          const hexSignature = Array.from(new Uint8Array(signature))
            .map(b => b.toString(16).padStart(2, "0"))
            .join("");
          
          headers["X-Webhook-Signature"] = hexSignature;
        }

        const response = await fetch(webhook.webhook_url, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
        }

        return {
          webhook_id: webhook.id,
          webhook_name: webhook.name,
          status: "success",
        };
      })
    );

    // Process results
    const successCount = results.filter(r => r.status === "fulfilled").length;
    const failureCount = results.filter(r => r.status === "rejected").length;

    const failures = results
      .filter(r => r.status === "rejected")
      .map((r, i) => ({
        webhook: webhooks[i].name,
        error: r.status === "rejected" ? r.reason.message : "Unknown error",
      }));

    return new Response(
      JSON.stringify({
        success: true,
        message: `Triggered ${successCount} webhooks successfully`,
        total: webhooks.length,
        succeeded: successCount,
        failed: failureCount,
        failures: failures.length > 0 ? failures : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error triggering webhooks:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
