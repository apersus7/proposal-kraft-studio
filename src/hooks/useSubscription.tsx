import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  planType: string | null;
  status: string;
  currentPeriodEnd: string | null;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionStatus>({
    hasActiveSubscription: false,
    planType: null,
    status: 'none',
    currentPeriodEnd: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptionStatus = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: whopData, error: whopError } = await supabase.functions.invoke('verify-whop-access', {
        body: { email: user.email, strict: true }
      });

      if (whopError) {
        console.warn('[useSubscription] verify-whop-access error:', whopError);
      }

      const now = Date.now();
      const endMsWhop = typeof whopData?.currentPeriodEnd === 'string' ? Date.parse(whopData.currentPeriodEnd) : null;
      const statusWhop = typeof whopData?.status === 'string' ? whopData.status : 'none';
      const activeFlagWhop = whopData?.hasActiveSubscription === true;
      const isWhopActive = statusWhop === 'active' && !!endMsWhop && endMsWhop > now && activeFlagWhop;

      console.log('[useSubscription] Whop normalized:', {
        source: whopData?.source,
        version: whopData?.version,
        incoming: whopData,
        normalized: { isWhopActive, statusWhop, endMsWhop }
      });

      // Always use DB as final gate (synced by the edge function/webhooks)
      const { data: subRows, error: dbError } = await supabase
        .from('subscriptions')
        .select('status, plan_type, current_period_end')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (dbError) {
        console.error('[useSubscription] DB check error:', dbError);
      }

      const dbSub = subRows?.[0] as any;
      const endMsDb = dbSub?.current_period_end ? Date.parse(dbSub.current_period_end) : null;
      const isDbActive = dbSub?.status === 'active' && !!endMsDb && endMsDb > now;

      setSubscription({
        hasActiveSubscription: isDbActive, // DB is the source of truth for gating
        planType: isDbActive ? (typeof dbSub?.plan_type === 'string' ? dbSub.plan_type : (typeof whopData?.planType === 'string' ? whopData.planType : null)) : null,
        status: isDbActive ? 'active' : 'none',
        currentPeriodEnd: isDbActive ? (typeof dbSub?.current_period_end === 'string' ? dbSub.current_period_end : null) : null,
      });
    } catch (err) {
      console.error('Subscription hook error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setSubscription({
        hasActiveSubscription: false,
        planType: null,
        status: 'none',
        currentPeriodEnd: null,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionStatus();
  }, [user]);

  return {
    subscription,
    loading,
    error,
    refresh: fetchSubscriptionStatus,
  };
};
