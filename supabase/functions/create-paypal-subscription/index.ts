import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { planId } = await req.json();
    console.log('Creating PayPal subscription for plan:', planId);
    
    // Get authorization header for user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    console.log('Authenticated user:', user.id);
    
    const paypalClientId = Deno.env.get('PAYPAL_CLIENT_ID');
    const paypalClientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET');
    
    if (!paypalClientId || !paypalClientSecret) {
      console.error('PayPal credentials not configured');
      throw new Error('PayPal credentials not configured');
    }

    console.log('PayPal credentials found, client ID:', paypalClientId?.substring(0, 10) + '...');

    // Get PayPal plan IDs from environment
    const freelancePlanId = Deno.env.get('PAYPAL_PLAN_ID_FREELANCE');
    const agencyPlanId = Deno.env.get('PAYPAL_PLAN_ID_AGENCY');
    const enterprisePlanId = Deno.env.get('PAYPAL_PLAN_ID_ENTERPRISE');

    console.log('Env plan IDs present:', {
      freelance: freelancePlanId ? `${freelancePlanId.substring(0,6)}...` : 'MISSING',
      agency: agencyPlanId ? `${agencyPlanId.substring(0,6)}...` : 'MISSING',
      enterprise: enterprisePlanId ? `${enterprisePlanId.substring(0,6)}...` : 'MISSING',
    });

    if (!freelancePlanId || !agencyPlanId || !enterprisePlanId) {
      throw new Error('One or more PayPal plan IDs are missing in Supabase secrets');
    }

    const paypalPlanIds = {
      freelance: freelancePlanId,
      agency: agencyPlanId,
      enterprise: enterprisePlanId
    } as const;

    const planIdToUse = paypalPlanIds[planId as keyof typeof paypalPlanIds];
    console.log('Requested plan ID:', planId, 'Mapped to:', planIdToUse);
    
    if (!planIdToUse) {
      console.error(`Invalid plan ID: ${planId}. Available: ${Object.keys(paypalPlanIds)}`);
      throw new Error(`Invalid plan ID: ${planId}`);
    }

    // PayPal live environment
    const baseUrl = 'https://api-m.paypal.com';
    console.log('PayPal environment: live, Base URL:', baseUrl);

    // Setup return URLs
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
    console.log('PayPal authentication successful');

    // Create subscription
    const subscriptionResponse = await fetch(`${baseUrl}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': `subscription-${user.id}-${Date.now()}`,
      },
      body: JSON.stringify({
        plan_id: planIdToUse,
        application_context: {
          brand_name: 'ProposalKraft',
          locale: 'en-US',
          user_action: 'SUBSCRIBE_NOW',
          return_url: returnUrl,
          cancel_url: cancelUrl
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

    // Store subscription in database
    const { error: dbError } = await supabase.from('subscriptions').insert({
      user_id: user.id,
      paypal_subscription_id: subscriptionData.id,
      plan_type: planId,
      status: 'pending'
    });

    if (dbError) {
      console.error('Database error:', dbError);
      // Don't fail the request for DB errors, just log them
    }
    
    const approvalUrl = subscriptionData.links?.find((link: any) => link.rel === 'approve')?.href;
    
    return new Response(JSON.stringify({ 
      subscriptionId: subscriptionData.id,
      approvalUrl: approvalUrl
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