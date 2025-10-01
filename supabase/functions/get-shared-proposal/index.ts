import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  token: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token } = (await req.json()) as RequestBody;
    console.log("get-shared-proposal: received token", token);
    
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Missing token" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Normalize token for safety (handle URL decoding, spaces-as-plus, base64url, and padding)
    let normalizedToken = token;
    try { normalizedToken = decodeURIComponent(normalizedToken); } catch {}
    normalizedToken = normalizedToken
      .replace(/\s/g, '+') // spaces back to plus
      .replace(/-/g, '+')   // base64url to base64
      .replace(/_/g, '/');  // base64url to base64
    const pad = normalizedToken.length % 4;
    if (pad) normalizedToken = normalizedToken + '='.repeat(4 - pad);

    console.log("get-shared-proposal: normalized token", normalizedToken);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const supabase = createClient(supabaseUrl, serviceKey);

    // Look up the share by token
    const { data: share, error: shareError } = await supabase
      .from("secure_proposal_shares")
      .select("id, proposal_id, created_at, expires_at, permissions, content_snapshot")
      .eq("share_token", normalizedToken)
      .maybeSingle();

    console.log("get-shared-proposal: share lookup result", { found: !!share, error: shareError });

    if (shareError) {
      console.error("get-shared-proposal: shareError", shareError);
      return new Response(
        JSON.stringify({ error: "Invalid or expired share link" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!share) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired share link" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "This share link has expired" }),
        { status: 410, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Fetch the proposal data (use snapshot if available, otherwise current version)
    let proposalData: any;
    if (share.content_snapshot) {
      // Use frozen snapshot
      const { data: basicProposal } = await supabase
        .from("proposals")
        .select("id, title, client_name, client_email, worth, created_at, status")
        .eq("id", share.proposal_id)
        .maybeSingle();
      
      if (basicProposal) {
        proposalData = {
          ...basicProposal,
          content: share.content_snapshot
        };
      }
    } else {
      // Fallback to current proposal version
      const { data: proposal, error: proposalError } = await supabase
        .from("proposals")
        .select("id, title, client_name, client_email, content, worth, created_at, status")
        .eq("id", share.proposal_id)
        .maybeSingle();

      if (proposalError || !proposal) {
        console.error("get-shared-proposal: proposalError", proposalError);
        return new Response(
          JSON.stringify({ error: "Proposal not found" }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      proposalData = proposal;
    }

    if (!proposalData) {
      return new Response(
        JSON.stringify({ error: "Proposal not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Fetch signers (public view)
    const { data: signers, error: signersError } = await supabase
      .from("proposal_signatures")
      .select("id, signer_name, signer_email, status, signed_at, signature_data, ip_address, user_agent, created_at")
      .eq("proposal_id", share.proposal_id)
      .order("created_at", { ascending: true });

    if (signersError) {
      console.error("get-shared-proposal: signersError", signersError);
    }

    return new Response(
      JSON.stringify({ share, proposal: proposalData, signers: signers ?? [] }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (e) {
    console.error("get-shared-proposal: unexpected error", e);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});