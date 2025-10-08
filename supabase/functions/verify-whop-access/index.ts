import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    // First, trust our own database (updated via Whop webhooks)
    const nowIso = new Date().toISOString();
    const { data: subs, error: subError } = await supabase
      .from('subscriptions')
      .select('plan_type, status, current_period_end')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gt('current_period_end', nowIso);

    if (subError) {
      console.warn('Error querying subscriptions table:', subError);
    }

    if (subs && subs.length > 0) {
      const sub = subs[0];
      return new Response(
        JSON.stringify({
          hasActiveSubscription: true,
          planType: sub.plan_type,
          status: sub.status,
          currentPeriodEnd: sub.current_period_end,
          source: 'db',
          version: 'v3.1'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fallback: check Whop memberships directly, but require validity in the future and correct company/plan
    const whopApiKey = Deno.env.get('WHOP_API_KEY');
    const whopCompanyId = Deno.env.get('WHOP_COMPANY_ID') || null;
    const whopPlanId = Deno.env.get('WHOP_PLAN_ID_DEALCLOSER') || null;
    if (!whopApiKey) {
      // If Whop is not configured, default to no subscription
      return new Response(
        JSON.stringify({ 
          hasActiveSubscription: false,
          planType: null,
          status: 'none',
          currentPeriodEnd: null,
          source: 'none',
          version: 'v3.1'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's email to check Whop membership
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('user_id', user.id)
      .single();

    const userEmail = profile?.email || user.email;
    console.log('Verifying Whop access (fallback) for:', userEmail);

    const response = await fetch(`https://api.whop.com/api/v2/memberships?email=${encodeURIComponent(userEmail)}`, {
      headers: { 'Authorization': `Bearer ${whopApiKey}` },
    });

    if (!response.ok) {
      console.error('Whop API error:', response.status);
      return new Response(
        JSON.stringify({ 
          hasActiveSubscription: false,
          planType: null,
          status: 'none',
          currentPeriodEnd: null,
          source: 'none',
          version: 'v3.1'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const json = await response.json();
    const list = Array.isArray(json?.data)
      ? json.data
      : Array.isArray(json?.memberships)
        ? json.memberships
        : Array.isArray(json)
          ? json
          : [];
    console.log('Whop memberships normalized length:', list.length);

    const now = Date.now();
    const activeMembership = list.find((m: any) => {
      // Time validity
      const periodEndSec = m.renewal_period_end ?? m.expires_at ?? null;
      const periodEndMs = periodEndSec ? Number(periodEndSec) * 1000 : null;
      const isValidNow = (m.valid === true) || (periodEndMs ? periodEndMs > now : false);

      // Company match (if configured)
      const companyCandidates = [
        m.company_id,
        m.organization_id,
        m?.shop?.id,
        m?.org?.id,
        m?.organization?.id,
        m?.product?.organization?.id,
        m?.plan?.organization_id,
      ].filter(Boolean);
      const companyOk = whopCompanyId ? companyCandidates.includes(whopCompanyId) : true;

      // Plan match (if configured)
      const planCandidates = [
        m?.plan?.id,
        m.plan_id,
        m?.product?.id,
        m?.plan,
        m?.product_id,
      ].filter(Boolean);
      const planOk = whopPlanId ? planCandidates.includes(whopPlanId) : true;

      // Only treat paid ACTIVE memberships as valid
      const statusOk = m.status === 'active';

      return statusOk && isValidNow && companyOk && planOk;
    });

    if (activeMembership) {
      const periodEndSec = activeMembership.renewal_period_end ?? activeMembership.expires_at ?? null;
      const periodEndIso = periodEndSec ? new Date(Number(periodEndSec) * 1000).toISOString() : null;
      const planKey = activeMembership.plan ?? activeMembership.plan_id ?? activeMembership?.plan?.id ?? activeMembership?.product?.id;
      console.log('Whop active membership match:', {
        id: activeMembership.id,
        status: activeMembership.status,
        periodEndIso,
        planKey,
      });
      return new Response(
        JSON.stringify({
          hasActiveSubscription: true,
          planType: getPlanTypeFromWhopPlan(planKey),
          status: activeMembership.status,
          currentPeriodEnd: periodEndIso,
          whopMembershipId: activeMembership.id,
          source: 'whop',
          version: 'v3.1'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        hasActiveSubscription: false,
        planType: null,
        status: 'none',
        currentPeriodEnd: null,
        source: 'none',
        version: 'v3.1'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error verifying Whop access:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        hasActiveSubscription: false,
        planType: null,
        status: 'error',
        source: 'error',
        version: 'v3.1'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function getPlanTypeFromWhopPlan(planId: string): string {
  const planMapping: { [key: string]: string } = {
    'plan_T62IdYRFuKKYq': 'dealcloser',
  };

  return planMapping[planId] || 'dealcloser';
}
