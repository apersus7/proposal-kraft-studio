import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { planId, userId, userEmail } = await req.json();
    
    const whopApiKey = Deno.env.get('WHOP_API_KEY');
    const whopCompanyId = Deno.env.get('WHOP_COMPANY_ID');
    
    if (!whopApiKey || !whopCompanyId) {
      throw new Error('Whop credentials not configured');
    }

    // Map internal plan IDs to Whop plan IDs from environment variables
    const planIdMapping: Record<string, string> = {
      dealcloser: Deno.env.get('WHOP_PLAN_ID_DEALCLOSER') || '',
      freelance: Deno.env.get('WHOP_PLAN_ID_FREELANCE') || '',
      agency: Deno.env.get('WHOP_PLAN_ID_AGENCY') || '',
      enterprise: Deno.env.get('WHOP_PLAN_ID_ENTERPRISE') || '',
    };

    const whopPlanId = planIdMapping[planId];
    
    if (!whopPlanId) {
      throw new Error(`Plan ID not configured in Whop: ${planId}. Please add WHOP_PLAN_ID_${planId.toUpperCase()} secret.`);
    }

    console.log('Creating Whop checkout session for plan:', planId, '-> Whop plan ID:', whopPlanId);

    // Create checkout session via Whop API
    const response = await fetch('https://api.whop.com/api/v2/checkout_sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${whopApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        company_id: whopCompanyId,
        plan_id: whopPlanId,
        customer_email: userEmail,
        metadata: {
          user_id: userId,
          internal_plan_id: planId,
        },
        success_url: `${req.headers.get('origin')}/dashboard?payment=success`,
        cancel_url: `${req.headers.get('origin')}/checkout?payment=cancelled`,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Whop API error:', errorData);
      throw new Error(`Whop API error: ${response.status}`);
    }

    const checkoutSession = await response.json();
    console.log('Whop checkout session created:', checkoutSession.id);

    return new Response(
      JSON.stringify({ 
        checkoutUrl: checkoutSession.checkout_url,
        sessionId: checkoutSession.id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating Whop checkout:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
