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

    const whopApiKey = Deno.env.get('WHOP_API_KEY');
    
    if (!whopApiKey) {
      throw new Error('Whop API key not configured');
    }

    // Get user's email to check Whop membership
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('user_id', user.id)
      .single();

    const userEmail = profile?.email || user.email;

    console.log('Verifying Whop access for:', userEmail);

    // Check Whop membership via API
    const response = await fetch(`https://api.whop.com/api/v2/memberships?email=${encodeURIComponent(userEmail)}`, {
      headers: {
        'Authorization': `Bearer ${whopApiKey}`,
      },
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

    // Find active membership
    const activeMembership = memberships.data?.find((m: any) => m.status === 'active');

    if (activeMembership) {
      return new Response(
        JSON.stringify({
          hasActiveSubscription: true,
          planType: getPlanTypeFromWhopPlan(activeMembership.plan_id),
          status: 'active',
          currentPeriodEnd: activeMembership.valid_until,
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
    'freelance': 'freelance',
    'agency': 'agency',
    'enterprise': 'enterprise',
  };

  return planMapping[planId] || 'freelance';
}
