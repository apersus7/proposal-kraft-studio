import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { planId } = await req.json();
    
    const paypalClientId = Deno.env.get('PAYPAL_CLIENT_ID');
    const paypalClientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET');
    
    if (!paypalClientId || !paypalClientSecret) {
      throw new Error('PayPal credentials not configured');
    }

    // Get the actual PayPal plan ID from environment
    const freelancePlanId = Deno.env.get('PAYPAL_PLAN_ID_FREELANCE');
    const agencyPlanId = Deno.env.get('PAYPAL_PLAN_ID_AGENCY');
    const enterprisePlanId = Deno.env.get('PAYPAL_PLAN_ID_ENTERPRISE');

    const paypalPlanIds = {
      freelance: freelancePlanId,
      agency: agencyPlanId,
      enterprise: enterprisePlanId
    };

    const planIdToUse = paypalPlanIds[planId as keyof typeof paypalPlanIds];
    if (!planIdToUse) {
      throw new Error(`Invalid plan ID: ${planId}`);
    }

    // Get PayPal access token
    const authResponse = await fetch('https://api-m.paypal.com/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${paypalClientId}:${paypalClientSecret}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!authResponse.ok) {
      const error = await authResponse.text();
      console.error('PayPal auth error:', error);
      throw new Error('Failed to authenticate with PayPal');
    }

    const authData = await authResponse.json();
    const accessToken = authData.access_token;

    // Create subscription with payment method
    const subscriptionResponse = await fetch('https://api-m.paypal.com/v1/billing/subscriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': `subscription-${Date.now()}`,
      },
      body: JSON.stringify({
        plan_id: planIdToUse,
        payment_method: {
          payer_selected: 'PAYPAL',
          payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED'
        }
      }),
    });

    if (!subscriptionResponse.ok) {
      const error = await subscriptionResponse.text();
      console.error('PayPal subscription error:', error);
      throw new Error('Failed to create subscription');
    }

    const subscriptionData = await subscriptionResponse.json();
    
    console.log('PayPal subscription created:', subscriptionData.id);
    
    return new Response(JSON.stringify({ 
      subscriptionId: subscriptionData.id,
      approvalUrl: subscriptionData.links.find((link: any) => link.rel === 'approve')?.href
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error creating PayPal subscription:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});