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
    console.log('Creating PayPal subscription for plan:', planId);
    
    const paypalClientId = Deno.env.get('PAYPAL_CLIENT_ID');
    const paypalClientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET');
    
    if (!paypalClientId || !paypalClientSecret) {
      console.error('PayPal credentials not configured');
      throw new Error('PayPal credentials not configured');
    }

    console.log('PayPal credentials found, client ID:', paypalClientId?.substring(0, 10) + '...');

    // Get the actual PayPal plan ID from environment
    const freelancePlanId = Deno.env.get('PAYPAL_PLAN_ID_FREELANCE');
    const agencyPlanId = Deno.env.get('PAYPAL_PLAN_ID_AGENCY');
    const enterprisePlanId = Deno.env.get('PAYPAL_PLAN_ID_ENTERPRISE');

    console.log('Env plan IDs present:', {
      freelance: freelancePlanId ? `${freelancePlanId.substring(0,6)}...` : 'MISSING',
      agency: agencyPlanId ? `${agencyPlanId.substring(0,6)}...` : 'MISSING',
      enterprise: enterprisePlanId ? `${enterprisePlanId.substring(0,6)}...` : 'MISSING',
    });

    if (!freelancePlanId || !agencyPlanId || !enterprisePlanId) {
      throw new Error('One or more PayPal plan IDs are missing in Supabase secrets: PAYPAL_PLAN_ID_FREELANCE, PAYPAL_PLAN_ID_AGENCY, PAYPAL_PLAN_ID_ENTERPRISE');
    }

    const paypalPlanIds = {
      freelance: freelancePlanId,
      agency: agencyPlanId,
      enterprise: enterprisePlanId
    } as const;

    const planIdToUse = paypalPlanIds[planId as keyof typeof paypalPlanIds];
    console.log('Available plan IDs:', paypalPlanIds);
    console.log('Requested plan ID:', planId, 'Mapped to:', planIdToUse);
    console.log('Requested plan ID:', planId, 'Mapped to:', planIdToUse);
    
    if (!planIdToUse) {
      console.error(`Invalid plan ID: ${planId}. Available: ${Object.keys(paypalPlanIds)}`);
      throw new Error(`Invalid plan ID: ${planId}`);
    }

    // Determine environment (live by default)
    const paypalEnv = (Deno.env.get('PAYPAL_ENV') || 'live').toLowerCase();
    const baseUrl = paypalEnv === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';
    console.log('PayPal environment:', paypalEnv, 'Base URL:', baseUrl);

    const origin = req.headers.get('origin') || Deno.env.get('APP_URL') || 'https://lovable.app';
    const returnUrl = `${origin}/settings?paypal=success`;
    const cancelUrl = `${origin}/settings?paypal=cancelled`;
    console.log('Return URL:', returnUrl, 'Cancel URL:', cancelUrl);

    // Get PayPal access token
    const authResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${paypalClientId}:${paypalClientSecret}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!authResponse.ok) {
      const error = await authResponse.text();
      console.error('PayPal auth error status:', authResponse.status);
      console.error('PayPal auth error response:', error);
      throw new Error(`Failed to authenticate with PayPal: ${authResponse.status} - ${error}`);
    }

    const authData = await authResponse.json();
    const accessToken = authData.access_token;
    console.log('PayPal authentication successful, got access token');

    // Create subscription with payment method
    const subscriptionResponse = await fetch(`${baseUrl}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': `subscription-${Date.now()}`,
      },
      body: JSON.stringify({
        plan_id: planIdToUse,
        application_context: {
          brand_name: 'ProposalKraft',
          locale: 'en-US',
          user_action: 'SUBSCRIBE_NOW',
          return_url: returnUrl,
          cancel_url: cancelUrl
        },
        payment_method: {
          payer_selected: 'PAYPAL',
          payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED'
        }
      }),
    });

    if (!subscriptionResponse.ok) {
      const error = await subscriptionResponse.text();
      console.error('PayPal subscription error status:', subscriptionResponse.status);
      console.error('PayPal subscription error response:', error);
      throw new Error(`Failed to create subscription: ${subscriptionResponse.status} - ${error}`);
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
    console.error('Error stack:', error.stack);
    return new Response(JSON.stringify({ 
      error: error.message || 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});