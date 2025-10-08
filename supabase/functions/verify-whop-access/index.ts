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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

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
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fallback: check Whop memberships directly, but require valid_until in the future
    const whopApiKey = Deno.env.get('WHOP_API_KEY');
    if (!whopApiKey) {
      // If Whop is not configured, default to no subscription
      return new Response(
        JSON.stringify({ 
          hasActiveSubscription: false,
          planType: null,
          status: 'none',
          currentPeriodEnd: null,
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
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const memberships = await response.json();
    console.log('Whop memberships:', memberships);

    const companyId = Deno.env.get('WHOP_COMPANY_ID');
    const allowedPlanId = Deno.env.get('WHOP_PLAN_ID_DEALCLOSER');

    // Normalize memberships list
    const list: any[] = memberships.data ?? memberships ?? [];

    const activeMembership = list.find((m: any) => {
      // Company/organization/shop id checks (support multiple possible fields)
      const mCompanyId = m.organization_id || m.company_id || m.shop?.id || m.org?.id || m.organization?.id;
      if (companyId && mCompanyId && String(mCompanyId) !== String(companyId)) return false;

      // Plan checks
      const mPlanId = m.plan?.id || m.plan_id || m.plan || m.product?.id;
      if (allowedPlanId && mPlanId && String(mPlanId) !== String(allowedPlanId)) return false;

      const periodEndSec = m.renewal_period_end ?? m.expires_at ?? null;
      const periodEndMs = periodEndSec ? Number(periodEndSec) * 1000 : null;
      const isValidNow = m.valid === true || (periodEndMs ? periodEndMs > Date.now() : false);
      const statusOk = (m.status === 'active' || m.status === 'trialing');
      return statusOk && isValidNow;
    });

    if (activeMembership) {
      const periodEndSec = activeMembership.renewal_period_end ?? activeMembership.expires_at ?? null;
      const periodEndIso = periodEndSec ? new Date(Number(periodEndSec) * 1000).toISOString() : null;
      const planKey = activeMembership.plan?.id ?? activeMembership.plan_id ?? activeMembership.plan;
      return new Response(
        JSON.stringify({
          hasActiveSubscription: true,
          planType: getPlanTypeFromWhopPlan(String(planKey)),
          status: activeMembership.status,
          currentPeriodEnd: periodEndIso,
          whopMembershipId: activeMembership.id,
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
