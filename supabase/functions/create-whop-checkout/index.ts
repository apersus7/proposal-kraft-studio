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
    console.log('Whop checkout session created raw:', checkoutSession);

    // Try common fields for checkout URL
    let checkoutUrl = checkoutSession.checkout_url || 
                      checkoutSession.url || 
                      checkoutSession.checkoutUrl ||
                      checkoutSession.payment_url ||
                      checkoutSession.hosted_url ||
                      checkoutSession.redirect_url ||
                      checkoutSession.purchase_url;

    // If URL missing, fetch session details from Whop
    if (!checkoutUrl && checkoutSession.id) {
      try {
        const detailsRes = await fetch(`https://api.whop.com/api/v2/checkout_sessions/${checkoutSession.id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${whopApiKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (detailsRes.ok) {
          const details = await detailsRes.json();
          console.log('Whop checkout session details:', details);
          checkoutUrl = details.checkout_url || details.url || details.payment_url || details.hosted_url || details.redirect_url || details.purchase_url;
        } else {
          console.warn('Failed to fetch checkout session details:', await detailsRes.text());
        }
      } catch (e) {
        console.warn('Error fetching checkout session details:', e);
      }
    }

    if (!checkoutUrl) {
      console.error('No checkout URL in response. Session payload:', checkoutSession);
      return new Response(
        JSON.stringify({ error: 'Whop did not return a checkout URL.', sessionId: checkoutSession?.id || null }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        checkoutUrl,
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
