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

      // 1) Fast path: check DB directly for user's latest subscription
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
      const now = Date.now();
      const endMsDb = dbSub?.current_period_end ? Date.parse(dbSub.current_period_end) : null;
      const isDbActive = dbSub?.status === 'active' && (!endMsDb || endMsDb > now);

      if (isDbActive) {
        setSubscription({
          hasActiveSubscription: true,
          planType: typeof dbSub?.plan_type === 'string' ? dbSub.plan_type : null,
          status: dbSub?.status ?? 'active',
          currentPeriodEnd: typeof dbSub?.current_period_end === 'string' ? dbSub.current_period_end : null,
        });
        return;
      }

      // 2) Fallback: call Edge function (may consult Whop)
      const { data: whopData, error: whopError } = await supabase.functions.invoke('verify-whop-access', { body: { email: user.email } });
      if (whopError) {
        console.warn('[useSubscription] verify-whop-access error:', whopError);
      }

      // Normalize and harden the response to avoid false positives/negatives
      const endMs = whopData?.currentPeriodEnd ? Date.parse(whopData.currentPeriodEnd) : null;
      const status = typeof whopData?.status === 'string' ? whopData.status : 'none';
      const activeFlag = whopData?.hasActiveSubscription === true;
      const timeOk = endMs ? endMs > now : true; // allow null when provider doesn't return end date
      const isActive = status === 'active' && activeFlag && timeOk;

      console.log('[useSubscription] normalized status:', {
        source: whopData?.source,
        version: whopData?.version,
        incoming: whopData,
        normalized: { isActive, status, endMs }
      });

      // For gating, trust only our DB. Do not grant access based on external fallback.
      setSubscription({
        hasActiveSubscription: false,
        planType: typeof whopData?.planType === 'string' ? whopData.planType : null,
        status,
        currentPeriodEnd: typeof whopData?.currentPeriodEnd === 'string' ? whopData.currentPeriodEnd : null,
      });
    } catch (err) {
      console.error('Subscription hook error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
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
