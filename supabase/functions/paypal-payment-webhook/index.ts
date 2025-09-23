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
    console.log('PayPal payment webhook received');
    
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

    const orderId = resource.id;
    console.log('Processing payment order:', orderId);

    switch (eventType) {
      case 'CHECKOUT.ORDER.APPROVED':
        await handleOrderApproved(supabaseClient, resource);
        break;
      
      case 'PAYMENT.CAPTURE.COMPLETED':
        await handlePaymentCompleted(supabaseClient, resource);
        break;
      
      case 'PAYMENT.CAPTURE.DECLINED':
      case 'PAYMENT.CAPTURE.FAILED':
        await handlePaymentFailed(supabaseClient, resource);
        break;
      
      case 'CHECKOUT.ORDER.CANCELLED':
        await handleOrderCancelled(supabaseClient, resource);
        break;
      
      default:
        console.log('Unhandled webhook event:', eventType);
    }

    return new Response('OK', { headers: corsHeaders });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handleOrderApproved(supabaseClient: any, resource: any) {
  console.log('Handling order approval:', resource.id);
  
  // Update payment status to approved (but not completed yet)
  const { error } = await supabaseClient
    .from('payments')
    .update({
      status: 'pending', // Still pending until capture is completed
      updated_at: new Date().toISOString(),
    })
    .eq('paypal_order_id', resource.id);

  if (error) {
    console.error('Database update error:', error);
    throw new Error(`Failed to update payment: ${error.message}`);
  }

  console.log('Order approved successfully:', resource.id);
}

async function handlePaymentCompleted(supabaseClient: any, resource: any) {
  console.log('Handling payment completion:', resource.id);
  
  // Get the order ID from the resource (for captures, we need to find the order)
  let orderId = resource.supplementary_data?.related_ids?.order_id || resource.id;
  
  // Update payment status to completed
  const { data: payment, error: updateError } = await supabaseClient
    .from('payments')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('paypal_order_id', orderId)
    .select()
    .single();

  if (updateError) {
    console.error('Database update error:', updateError);
    throw new Error(`Failed to update payment: ${updateError.message}`);
  }

  if (payment) {
    console.log('Payment completed, activating plan for user:', payment.user_id);
    
    // Create or update subscription record
    const subscriptionEndDate = new Date();
    subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1); // 1 year access
    
    const { error: subscriptionError } = await supabaseClient
      .from('subscriptions')
      .upsert({
        user_id: payment.user_id,
        plan_type: payment.plan_type,
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: subscriptionEndDate.toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (subscriptionError) {
      console.error('Subscription update error:', subscriptionError);
      // Don't throw error here, payment was successful
    }
  }

  console.log('Payment completed successfully:', orderId);
}

async function handlePaymentFailed(supabaseClient: any, resource: any) {
  console.log('Handling payment failure:', resource.id);
  
  let orderId = resource.supplementary_data?.related_ids?.order_id || resource.id;
  
  const { error } = await supabaseClient
    .from('payments')
    .update({
      status: 'failed',
      updated_at: new Date().toISOString(),
    })
    .eq('paypal_order_id', orderId);

  if (error) {
    console.error('Database update error:', error);
    throw new Error(`Failed to update payment: ${error.message}`);
  }

  console.log('Payment failure handled:', orderId);
}

async function handleOrderCancelled(supabaseClient: any, resource: any) {
  console.log('Handling order cancellation:', resource.id);
  
  const { error } = await supabaseClient
    .from('payments')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('paypal_order_id', resource.id);

  if (error) {
    console.error('Database update error:', error);
    throw new Error(`Failed to update payment: ${error.message}`);
  }

  console.log('Order cancelled successfully:', resource.id);
}