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
    console.log('🎯 WEBHOOK RECEIVED:', JSON.stringify(webhookData, null, 2));

    const action = webhookData.action || webhookData.type;
    const data = webhookData.data;

    switch (action) {
      case 'membership.went_valid':
        console.log('✅ Processing: membership.went_valid');
        await handleMembershipValid(supabase, data);
        break;
      case 'membership.went_invalid':
        console.log('❌ Processing: membership.went_invalid');
        await handleMembershipInvalid(supabase, data);
        break;
      case 'membership.renewed':
        console.log('🔄 Processing: membership.renewed');
        await handleMembershipRenewed(supabase, data);
        break;
      default:
        console.log('⚠️ Unhandled webhook event:', action);
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
  const userEmail = data.email;

  console.log('Processing membership.went_valid:', { userId, userEmail, membershipId, planId });

  if (!userId && !userEmail) {
    console.error('No user_id or email in membership data');
    return;
  }

  // Resolve user_id from email if not in metadata
  let finalUserId = userId;
  if (!finalUserId && userEmail) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('email', userEmail)
      .single();
    finalUserId = profile?.user_id;
    console.log('Resolved user_id from email:', finalUserId);
  }

  if (!finalUserId) {
    console.error('Could not resolve user_id');
    return;
  }

  const currentPeriodEnd = data.renewal_period_end
    ? new Date(Number(data.renewal_period_end) * 1000).toISOString()
    : (data.expires_at
        ? new Date(Number(data.expires_at) * 1000).toISOString()
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString());

  console.log('Activating subscription:', { finalUserId, planType: getPlanTypeFromWhopPlan(planId), currentPeriodEnd });

  // First, try to update existing subscription for this user
  const { data: existing } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', finalUserId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (existing) {
    // Update existing
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        plan_type: getPlanTypeFromWhopPlan(planId),
        status: 'active',
        paypal_subscription_id: membershipId,
        current_period_start: new Date().toISOString(),
        current_period_end: currentPeriodEnd,
        cancelled_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);

    if (updateError) {
      console.error('Error updating subscription:', updateError);
    } else {
      console.log('Subscription updated successfully');
    }
  } else {
    // Insert new
    const { error: insertError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: finalUserId,
        plan_type: getPlanTypeFromWhopPlan(planId),
        status: 'active',
        paypal_subscription_id: membershipId,
        current_period_start: new Date().toISOString(),
        current_period_end: currentPeriodEnd,
      });

    if (insertError) {
      console.error('Error inserting subscription:', insertError);
    } else {
      console.log('Subscription inserted successfully');
    }
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
