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

      // Whop-only gating: trust edge function result exclusively
      const { data: whopData, error: whopError } = await supabase.functions.invoke('verify-whop-access', {
        body: { email: user.email }
      });

      if (whopError) {
        console.warn('[useSubscription] verify-whop-access error:', whopError);
        setSubscription({
          hasActiveSubscription: false,
          planType: null,
          status: 'none',
          currentPeriodEnd: null,
        });
        return;
      }

      const now = Date.now();
      const endMs = typeof whopData?.currentPeriodEnd === 'string' ? Date.parse(whopData.currentPeriodEnd) : null;
      const status = typeof whopData?.status === 'string' ? whopData.status : 'none';
      const activeFlag = whopData?.hasActiveSubscription === true;
      const timeOk = !!endMs && endMs > now; // require a concrete, future end date
      const isActive = status === 'active' && activeFlag && timeOk;

      console.log('[useSubscription] Whop-only normalized status:', {
        source: whopData?.source,
        version: whopData?.version,
        incoming: whopData,
        normalized: { isActive, status, endMs }
      });

      setSubscription({
        hasActiveSubscription: isActive,
        planType: typeof whopData?.planType === 'string' ? whopData.planType : null,
        status,
        currentPeriodEnd: typeof whopData?.currentPeriodEnd === 'string' ? whopData.currentPeriodEnd : null,
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
