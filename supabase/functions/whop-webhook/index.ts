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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const webhookData = await req.json();
    console.log('Received Whop webhook:', webhookData);

    const action = webhookData.action || webhookData.type;
    const data = webhookData.data;

    switch (action) {
      case 'membership.went_valid':
        await handleMembershipValid(supabase, data);
        break;
      case 'membership.went_invalid':
        await handleMembershipInvalid(supabase, data);
        break;
      case 'membership.renewed':
        await handleMembershipRenewed(supabase, data);
        break;
      default:
        console.log('Unhandled webhook event:', action);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing Whop webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleMembershipValid(supabase: any, data: any) {
  const userId = data.metadata?.user_id;
  const membershipId = data.id;
  const planId = data.plan_id;

  if (!userId) {
    console.error('No user_id in membership metadata');
    return;
  }

  console.log('Activating subscription for user:', userId);

  // Create or update subscription
  const { error: subError } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      plan_type: getPlanTypeFromWhopPlan(planId),
      status: 'active',
      paypal_subscription_id: membershipId,
      current_period_start: new Date().toISOString(),
      current_period_end: data.renewal_period_end
        ? new Date(Number(data.renewal_period_end) * 1000).toISOString()
        : (data.expires_at
            ? new Date(Number(data.expires_at) * 1000).toISOString()
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()),
    });

  if (subError) {
    console.error('Error updating subscription:', subError);
  } else {
    console.log('Subscription activated successfully');
  }
}

async function handleMembershipInvalid(supabase: any, data: any) {
  const userId = data.metadata?.user_id;

  if (!userId) {
    console.error('No user_id in membership metadata');
    return;
  }

  console.log('Deactivating subscription for user:', userId);

  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('paypal_subscription_id', data.id);

  if (error) {
    console.error('Error deactivating subscription:', error);
  } else {
    console.log('Subscription deactivated successfully');
  }
}

async function handleMembershipRenewed(supabase: any, data: any) {
  const userId = data.metadata?.user_id;

  if (!userId) {
    console.error('No user_id in membership metadata');
    return;
  }

  console.log('Renewing subscription for user:', userId);

  const { error } = await supabase
    .from('subscriptions')
    .update({
      current_period_end: data.renewal_period_end
        ? new Date(Number(data.renewal_period_end) * 1000).toISOString()
        : (data.expires_at
            ? new Date(Number(data.expires_at) * 1000).toISOString()
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()),
      status: 'active',
    })
    .eq('user_id', userId)
    .eq('paypal_subscription_id', data.id);

  if (error) {
    console.error('Error renewing subscription:', error);
  } else {
    console.log('Subscription renewed successfully');
  }
}

function getPlanTypeFromWhopPlan(planId: string): string {
  // Map Whop plan IDs to your internal plan types
  const planMapping: { [key: string]: string } = {
    'plan_T62IdYRFuKKYq': 'dealcloser',
  };

  return planMapping[planId] || 'dealcloser';
}
