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
    console.log('PayPal webhook received');
    
    // Initialize Supabase client with service role key for webhooks
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload = await req.json();
    console.log('Webhook event type:', payload.event_type);
    console.log('Webhook resource type:', payload.resource_type);

    const eventType = payload.event_type;
    const resource = payload.resource;

    switch (eventType) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
      case 'BILLING.SUBSCRIPTION.RE-ACTIVATED':
        await handleSubscriptionActivated(supabase, resource);
        break;
      
      case 'BILLING.SUBSCRIPTION.CANCELLED':
      case 'BILLING.SUBSCRIPTION.SUSPENDED':
      case 'BILLING.SUBSCRIPTION.EXPIRED':
        await handleSubscriptionCancelled(supabase, resource);
        break;
      
      case 'PAYMENT.SALE.COMPLETED':
        await handlePaymentCompleted(supabase, resource);
        break;
      
      default:
        console.log('Unhandled webhook event:', eventType);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handleSubscriptionActivated(supabase: any, resource: any) {
  console.log('Handling subscription activation for:', resource.id);
  
  try {
    const subscriptionId = resource.id;
    const status = resource.status?.toLowerCase() || 'active';
    
    // Calculate period dates
    const currentPeriodStart = resource.start_time ? new Date(resource.start_time) : new Date();
    const currentPeriodEnd = resource.billing_info?.next_billing_time ? 
      new Date(resource.billing_info.next_billing_time) : 
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        current_period_start: currentPeriodStart.toISOString(),
        current_period_end: currentPeriodEnd.toISOString(),
        cancelled_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('paypal_subscription_id', subscriptionId);

    if (error) {
      console.error('Database update error:', error);
    } else {
      console.log('Subscription activated successfully for:', subscriptionId);
    }
  } catch (error) {
    console.error('Error in handleSubscriptionActivated:', error);
  }
}

async function handleSubscriptionCancelled(supabase: any, resource: any) {
  console.log('Handling subscription cancellation for:', resource.id);
  
  try {
    const subscriptionId = resource.id;
    const status = resource.status?.toLowerCase() || 'cancelled';

    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: status,
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('paypal_subscription_id', subscriptionId);

    if (error) {
      console.error('Database update error:', error);
    } else {
      console.log('Subscription cancelled successfully for:', subscriptionId);
    }
  } catch (error) {
    console.error('Error in handleSubscriptionCancelled:', error);
  }
}

async function handlePaymentCompleted(supabase: any, resource: any) {
  console.log('Handling payment completion for billing agreement:', resource.billing_agreement_id);
  
  try {
    const subscriptionId = resource.billing_agreement_id;
    
    if (subscriptionId) {
      // Update the subscription to ensure it's marked as active
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('paypal_subscription_id', subscriptionId);

      if (error) {
        console.error('Database update error:', error);
      } else {
        console.log('Payment processed successfully for subscription:', subscriptionId);
      }
    }
  } catch (error) {
    console.error('Error in handlePaymentCompleted:', error);
  }
}