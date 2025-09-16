import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.text();
    const event = JSON.parse(body);
    
    console.log('PayPal webhook received:', event.event_type, event.id);

    // Handle subscription events
    switch (event.event_type) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
      case 'BILLING.SUBSCRIPTION.RENEWED':
        await handleSubscriptionActivated(supabaseClient, event);
        break;
      
      case 'BILLING.SUBSCRIPTION.CANCELLED':
      case 'BILLING.SUBSCRIPTION.EXPIRED':
        await handleSubscriptionCancelled(supabaseClient, event);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.event_type}`);
    }

    return new Response(
      JSON.stringify({ received: true }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in paypal-webhook:', error);
    return new Response(
      JSON.stringify({ error: 'Webhook processing failed' }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function handleSubscriptionActivated(supabase: any, event: any) {
  const subscription = event.resource;
  const subscriberId = subscription.subscriber?.email_address;
  
  if (!subscriberId) {
    console.error('No subscriber email found in event');
    return;
  }

  // Extract plan info from subscription
  const planId = subscription.plan_id;
  let tier = 'freelance';
  
  if (planId?.includes('agency')) tier = 'agency';
  else if (planId?.includes('enterprise')) tier = 'enterprise';

  // Calculate subscription end date (30 days from now)
  const subscriptionEnd = new Date();
  subscriptionEnd.setDate(subscriptionEnd.getDate() + 30);

  const { error } = await supabase
    .from('subscribers')
    .upsert({
      email: subscriberId,
      subscribed: true,
      subscription_tier: tier,
      subscription_end: subscriptionEnd.toISOString(),
      paypal_subscription_id: subscription.id,
      updated_at: new Date().toISOString()
    });

  if (error) {
    console.error('Error updating subscription:', error);
  } else {
    console.log(`Subscription activated for ${subscriberId}`);
  }
}

async function handleSubscriptionCancelled(supabase: any, event: any) {
  const subscription = event.resource;
  const subscriberId = subscription.subscriber?.email_address;
  
  if (!subscriberId) {
    console.error('No subscriber email found in event');
    return;
  }

  const { error } = await supabase
    .from('subscribers')
    .update({
      subscribed: false,
      updated_at: new Date().toISOString()
    })
    .eq('email', subscriberId);

  if (error) {
    console.error('Error cancelling subscription:', error);
  } else {
    console.log(`Subscription cancelled for ${subscriberId}`);
  }
}