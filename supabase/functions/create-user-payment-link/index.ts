import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authorization = req.headers.get('Authorization');
    if (!authorization) {
      throw new Error('No authorization header');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the user from the JWT token
    const token = authorization.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    const { amount, currency, description, paymentType, proposalId } = await req.json();

    if (!amount || amount <= 0) {
      throw new Error('Invalid amount');
    }

    if (paymentType !== 'one-time') {
      throw new Error('Only one-time payments are supported');
    }

    // Get user's payment settings
    const { data: paymentSettings, error: settingsError } = await supabase
      .from('user_payment_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (settingsError || !paymentSettings) {
      return new Response(JSON.stringify({
        error: 'Payment settings not configured. Please configure your Stripe or PayPal settings first.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if user has PayPal configured
    if (paymentSettings.paypal_client_id && paymentSettings.paypal_client_secret) {
      console.log('Creating PayPal payment with user credentials');
      
      const paypalEnv = paymentSettings.paypal_environment || 'sandbox';
      const paypalBaseURL = paypalEnv === 'live' 
        ? 'https://api-m.paypal.com'
        : 'https://api-m.sandbox.paypal.com';

      // Get PayPal access token using user's credentials
      const tokenResponse = await fetch(`${paypalBaseURL}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${paymentSettings.paypal_client_id}:${paymentSettings.paypal_client_secret}`)}`
        },
        body: 'grant_type=client_credentials'
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to get PayPal access token');
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      // Create PayPal order
      const orderPayload = {
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: currency.toUpperCase(),
            value: amount.toFixed(2)
          },
          description: description
        }],
        application_context: {
          return_url: `${req.headers.get('origin')}/payment-success?proposal=${proposalId}`,
          cancel_url: `${req.headers.get('origin')}/payment-cancelled?proposal=${proposalId}`
        }
      };

      const orderResponse = await fetch(`${paypalBaseURL}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(orderPayload)
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to create PayPal order');
      }

      const orderData = await orderResponse.json();
      const approvalUrl = orderData.links.find((link: any) => link.rel === 'approve')?.href;

      if (!approvalUrl) {
        throw new Error('No approval URL found in PayPal response');
      }

      // Store payment record
      const { error: insertError } = await supabase
        .from('payments')
        .insert({
          user_id: user.id,
          user_email: user.email,
          user_name: user.user_metadata?.full_name || user.email,
          user_country: 'US',
          amount: amount,
          plan_type: 'one-time',
          payment_method: 'paypal',
          paypal_order_id: orderData.id,
          status: 'pending'
        });

      if (insertError) {
        console.error('Error inserting payment record:', insertError);
      }

      return new Response(JSON.stringify({
        orderId: orderData.id,
        approvalUrl: approvalUrl,
        status: 'created'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // If no PayPal, check for Stripe (future implementation)
    if (paymentSettings.stripe_publishable_key && paymentSettings.stripe_secret_key) {
      return new Response(JSON.stringify({
        error: 'Stripe integration coming soon. Please use PayPal for now.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // No payment methods configured
    return new Response(JSON.stringify({
      error: 'No payment methods configured. Please configure Stripe or PayPal in your settings.'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error creating payment link:', error);
    return new Response(JSON.stringify({
      error: (error as Error)?.message || 'Failed to create payment link'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});