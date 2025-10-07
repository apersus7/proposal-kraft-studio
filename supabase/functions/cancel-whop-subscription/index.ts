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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    const whopApiKey = Deno.env.get('WHOP_API_KEY');
    if (!whopApiKey) {
      throw new Error('Whop API key not configured');
    }

    // Get user's email to find their Whop membership
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('user_id', user.id)
      .single();

    const userEmail = profile?.email || user.email;
    console.log('Canceling subscription for:', userEmail);

    // Get user's active membership from Whop
    const membershipsResponse = await fetch(
      `https://api.whop.com/api/v2/memberships?email=${encodeURIComponent(userEmail)}`,
      {
        headers: { 'Authorization': `Bearer ${whopApiKey}` },
      }
    );

    if (!membershipsResponse.ok) {
      throw new Error('Failed to fetch memberships from Whop');
    }

    const memberships = await membershipsResponse.json();
    const activeMembership = memberships.data?.find((m: any) => 
      (m.status === 'active' || m.status === 'trialing') && m.valid === true
    );

    if (!activeMembership) {
      throw new Error('No active subscription found');
    }

    // Cancel the membership via Whop API
    const cancelResponse = await fetch(
      `https://api.whop.com/api/v2/memberships/${activeMembership.id}/cancel`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${whopApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cancel_at_period_end: true, // Cancel at the end of current billing period
        }),
      }
    );

    if (!cancelResponse.ok) {
      const errorData = await cancelResponse.text();
      console.error('Whop cancellation error:', errorData);
      throw new Error('Failed to cancel subscription with Whop');
    }

    const cancelData = await cancelResponse.json();
    console.log('Subscription cancelled successfully:', cancelData);

    // Update local database
    await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('paypal_subscription_id', activeMembership.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Subscription will be cancelled at the end of your current billing period',
        cancelAtPeriodEnd: cancelData.cancel_at_period_end,
        currentPeriodEnd: activeMembership.renewal_period_end,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
