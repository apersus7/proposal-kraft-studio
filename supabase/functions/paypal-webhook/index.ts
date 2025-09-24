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
    console.log('PayPal webhook received');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const webhookData = await req.json();
    console.log('Webhook event:', webhookData.event_type);
    console.log('Webhook data:', JSON.stringify(webhookData, null, 2));

    const eventType = webhookData.event_type;
    const resource = webhookData.resource;
    
    if (!resource || !resource.id) {
      console.error('Invalid webhook data: missing resource or resource.id');
      return new Response('Invalid webhook data', { status: 400, headers: corsHeaders });
    }

    const subscriptionId = resource.id;
    console.log('Processing subscription:', subscriptionId);

    switch (eventType) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        await handleSubscriptionActivated(supabaseClient, resource);
        break;
      
      case 'BILLING.SUBSCRIPTION.CANCELLED':
      case 'BILLING.SUBSCRIPTION.SUSPENDED':
      case 'BILLING.SUBSCRIPTION.EXPIRED':
        await handleSubscriptionDeactivated(supabaseClient, resource, eventType);
        break;
      
      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
        await handlePaymentFailed(supabaseClient, resource);
        break;
      
      case 'BILLING.SUBSCRIPTION.RENEWED':
      case 'BILLING.SUBSCRIPTION.UPDATED':
        await handleSubscriptionRenewed(supabaseClient, resource);
        break;
      
      default:
        console.log('Unhandled webhook event:', eventType);
    }

    return new Response('OK', { headers: corsHeaders });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handleSubscriptionActivated(supabaseClient: any, resource: any) {
  console.log('Handling subscription activation:', resource.id);
  
  const planId = resource.plan_id;
  let planType = 'freelance'; // default
  
  // Map PayPal plan ID to our plan types
  const freelancePlanId = Deno.env.get('PAYPAL_PLAN_ID_FREELANCE');
  const agencyPlanId = Deno.env.get('PAYPAL_PLAN_ID_AGENCY');
  const enterprisePlanId = Deno.env.get('PAYPAL_PLAN_ID_ENTERPRISE');
  
  if (planId === freelancePlanId) planType = 'freelance';
  else if (planId === agencyPlanId) planType = 'agency';
  else if (planId === enterprisePlanId) planType = 'enterprise';

  const startTime = resource.start_time;
  const nextBillingTime = resource.billing_info?.next_billing_time;
  
  // Update subscription status in database
  const { error } = await supabaseClient
    .from('subscriptions')
    .upsert({
      paypal_subscription_id: resource.id,
      plan_type: planType,
      status: 'active',
      current_period_start: startTime ? new Date(startTime).toISOString() : new Date().toISOString(),
      current_period_end: nextBillingTime ? new Date(nextBillingTime).toISOString() : null,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'paypal_subscription_id'
    });

  if (error) {
    console.error('Database update error:', error);
    throw new Error(`Failed to update subscription: ${error.message}`);
  }

  console.log('Subscription activated successfully:', resource.id);
}

async function handleSubscriptionDeactivated(supabaseClient: any, resource: any, eventType: string) {
  console.log('Handling subscription deactivation:', resource.id, eventType);
  
  let status = 'cancelled';
  if (eventType.includes('SUSPENDED')) status = 'suspended';
  if (eventType.includes('EXPIRED')) status = 'expired';

  const { error } = await supabaseClient
    .from('subscriptions')
    .update({
      status: status,
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('paypal_subscription_id', resource.id);

  if (error) {
    console.error('Database update error:', error);
    throw new Error(`Failed to update subscription: ${error.message}`);
  }

  console.log('Subscription deactivated successfully:', resource.id);
}

async function handlePaymentFailed(supabaseClient: any, resource: any) {
  console.log('Handling payment failure:', resource.id);
  
  // Update status to suspended on payment failure
  const { error } = await supabaseClient
    .from('subscriptions')
    .update({
      status: 'suspended',
      updated_at: new Date().toISOString(),
    })
    .eq('paypal_subscription_id', resource.id);

  if (error) {
    console.error('Database update error:', error);
    throw new Error(`Failed to update subscription: ${error.message}`);
  }

  console.log('Payment failure handled:', resource.id);
}

async function handleSubscriptionRenewed(supabaseClient: any, resource: any) {
  console.log('Handling subscription renewal:', resource.id);
  
  const nextBillingTime = resource.billing_info?.next_billing_time;
  
  const { error } = await supabaseClient
    .from('subscriptions')
    .update({
      status: 'active',
      current_period_end: nextBillingTime ? new Date(nextBillingTime).toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('paypal_subscription_id', resource.id);

  if (error) {
    console.error('Database update error:', error);
    throw new Error(`Failed to update subscription: ${error.message}`);
  }

  console.log('Subscription renewed successfully:', resource.id);
}