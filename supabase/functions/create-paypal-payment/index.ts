import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

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

    const { planId, amount, userInfo, paymentMethod } = await req.json();
    console.log('Creating PayPal payment for user:', user.id, 'plan:', planId, 'amount:', amount);
    
    // Get PayPal credentials
    const paypalClientId = Deno.env.get('PAYPAL_CLIENT_ID');
    const paypalClientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET');
    
    if (!paypalClientId || !paypalClientSecret) {
      console.error('PayPal credentials not configured');
      throw new Error('PayPal credentials not configured');
    }

    // PayPal API setup (live environment)
    const baseUrl = 'https://api-m.paypal.com';
    const origin = req.headers.get('origin') || 'https://lovable.app';
    const returnUrl = `${origin}/dashboard?payment=success&plan=${planId}`;
    const cancelUrl = `${origin}/payment?payment=cancelled&plan=${planId}`;

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

    // Create PayPal payment order
    const paymentPayload = {
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: amount.toString()
        },
        description: `ProposalKraft ${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan - One-time Payment`,
        soft_descriptor: 'ProposalKraft',
        custom_id: `${user.id}_${planId}_${Date.now()}`
      }],
      application_context: {
        brand_name: 'ProposalKraft',
        locale: 'en-US',
        user_action: 'PAY_NOW',
        return_url: returnUrl,
        cancel_url: cancelUrl,
        shipping_preference: 'NO_SHIPPING',
        payment_method: {
          payee_preferred: paymentMethod === 'card' ? 'IMMEDIATE_PAYMENT_REQUIRED' : 'UNRESTRICTED',
          payer_selected: paymentMethod === 'card' ? 'PAYPAL' : 'PAYPAL'
        }
      },
      payer: {
        name: {
          given_name: userInfo.name.split(' ')[0] || userInfo.name,
          surname: userInfo.name.split(' ').slice(1).join(' ') || ''
        },
        email_address: userInfo.email,
        address: {
          country_code: getCountryCode(userInfo.country)
        }
      }
    };

    console.log('Creating PayPal payment order:', JSON.stringify(paymentPayload, null, 2));

    const paymentResponse = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': `payment-${user.id}-${Date.now()}`,
      },
      body: JSON.stringify(paymentPayload),
    });

    if (!paymentResponse.ok) {
      const error = await paymentResponse.text();
      console.error('PayPal payment error:', paymentResponse.status, error);
      throw new Error(`PayPal payment creation failed: ${paymentResponse.status}`);
    }

    const paymentData = await paymentResponse.json();
    console.log('PayPal payment created:', paymentData.id);

    // Store pending payment in database
    const { error: insertError } = await supabaseClient
      .from('payments')
      .insert({
        user_id: user.id,
        paypal_order_id: paymentData.id,
        plan_type: planId,
        amount: amount,
        status: 'pending',
        user_name: userInfo.name,
        user_email: userInfo.email,
        user_country: userInfo.country,
        payment_method: paymentMethod
      });

    if (insertError) {
      console.error('Database insert error:', insertError);
      // Don't fail the request if DB insert fails, user can still complete payment
    }

    // Find approval URL
    const approvalUrl = paymentData.links?.find((link: any) => link.rel === 'approve')?.href;
    
    if (!approvalUrl) {
      throw new Error('No approval URL received from PayPal');
    }

    return new Response(JSON.stringify({ 
      orderId: paymentData.id,
      approvalUrl: approvalUrl,
      status: paymentData.status,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error creating PayPal payment:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper function to get country code from country name
function getCountryCode(countryName: string): string {
  const countryMap: { [key: string]: string } = {
    'United States': 'US',
    'Canada': 'CA',
    'United Kingdom': 'GB',
    'Australia': 'AU',
    'Germany': 'DE',
    'France': 'FR',
    'Spain': 'ES',
    'Italy': 'IT',
    'Netherlands': 'NL',
    'Sweden': 'SE',
    'Norway': 'NO',
    'Denmark': 'DK'
  };
  return countryMap[countryName] || 'US';
}