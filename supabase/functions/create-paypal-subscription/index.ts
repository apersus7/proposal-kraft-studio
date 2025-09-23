import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { planId } = await req.json();
    console.log('Creating PayPal subscription for user:', user.id, 'plan:', planId);
    
    // Get PayPal credentials
    const paypalClientId = Deno.env.get('PAYPAL_CLIENT_ID');
    const paypalClientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET');
    
    if (!paypalClientId || !paypalClientSecret) {
      console.error('PayPal credentials not configured');
      throw new Error('PayPal credentials not configured');
    }

    // Get PayPal plan IDs
    const planIds = {
      freelance: Deno.env.get('PAYPAL_PLAN_ID_FREELANCE'),
      agency: Deno.env.get('PAYPAL_PLAN_ID_AGENCY'),
      enterprise: Deno.env.get('PAYPAL_PLAN_ID_ENTERPRISE'),
    } as const;

    const paypalPlanId = planIds[planId as keyof typeof planIds];
    if (!paypalPlanId) {
      throw new Error(`Invalid plan ID: ${planId}`);
    }

    // PayPal API setup (live environment)
    const baseUrl = 'https://api-m.paypal.com';
    const origin = req.headers.get('origin') || 'https://lovable.app';
    const returnUrl = `${origin}/settings?paypal=success`;
    const cancelUrl = `${origin}/settings?paypal=cancelled`;

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
      console.error('PayPal auth error:', authResponse.status, error);
      throw new Error(`PayPal authentication failed: ${authResponse.status}`);
    }

    const authData = await authResponse.json();
    const accessToken = authData.access_token;

    // Create PayPal subscription
    const subscriptionPayload = {
      plan_id: paypalPlanId,
      application_context: {
        brand_name: 'ProposalKraft',
        locale: 'en-US',
        user_action: 'SUBSCRIBE_NOW',
        return_url: returnUrl,
        cancel_url: cancelUrl,
      },
      subscriber: {
        email_address: user.email,
      },
    };

    console.log('Creating PayPal subscription with payload:', JSON.stringify(subscriptionPayload, null, 2));

    const subscriptionResponse = await fetch(`${baseUrl}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': `subscription-${user.id}-${Date.now()}`,
      },
      body: JSON.stringify(subscriptionPayload),
    });

    if (!subscriptionResponse.ok) {
      const error = await subscriptionResponse.text();
      console.error('PayPal subscription error:', subscriptionResponse.status, error);
      throw new Error(`PayPal subscription creation failed: ${subscriptionResponse.status}`);
    }

    const subscriptionData = await subscriptionResponse.json();
    console.log('PayPal subscription created:', subscriptionData.id);

    // Store pending subscription in database
    const { error: insertError } = await supabaseClient
      .from('subscriptions')
      .insert({
        user_id: user.id,
        paypal_subscription_id: subscriptionData.id,
        plan_type: planId,
        status: 'pending',
      });

    if (insertError) {
      console.error('Database insert error:', insertError);
      // Don't fail the request if DB insert fails, user can still complete payment
    }

    // Find approval URL
    const approvalUrl = subscriptionData.links?.find((link: any) => link.rel === 'approve')?.href;
    
    if (!approvalUrl) {
      throw new Error('No approval URL received from PayPal');
    }

    return new Response(JSON.stringify({ 
      subscriptionId: subscriptionData.id,
      approvalUrl: approvalUrl,
      status: subscriptionData.status,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error creating PayPal subscription:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});