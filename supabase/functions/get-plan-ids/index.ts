import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const freelancePlanId = Deno.env.get('PAYPAL_PLAN_ID_FREELANCE');
    const agencyPlanId = Deno.env.get('PAYPAL_PLAN_ID_AGENCY');
    const enterprisePlanId = Deno.env.get('PAYPAL_PLAN_ID_ENTERPRISE');
    
    const planIds = {
      freelance: freelancePlanId,
      agency: agencyPlanId,
      enterprise: enterprisePlanId
    };
    
    console.log('Plan IDs retrieved successfully');
    
    return new Response(JSON.stringify({ planIds }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error getting plan IDs:', error);
    return new Response(JSON.stringify({ 
      error: (error as Error).message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
