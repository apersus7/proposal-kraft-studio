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

      // Get subscription from Whop
      const { data: whopData, error: whopError } = await supabase.functions.invoke('verify-whop-access');

      if (whopError) {
        console.error('Subscription fetch error:', whopError);
        setError(whopError.message || 'Failed to fetch subscription status');
        return;
      }

      if (whopData?.error) {
        console.error('Subscription API error:', whopData.error);
        setError(whopData.error);
        return;
      }

      // Normalize and harden the response to avoid false positives/negatives
      const now = Date.now();
      const endMs = whopData?.currentPeriodEnd ? Date.parse(whopData.currentPeriodEnd) : null;
      const status = typeof whopData?.status === 'string' ? whopData.status : 'none';
      const activeFlag = whopData?.hasActiveSubscription === true;
      const timeOk = endMs ? endMs > now : true; // allow null when provider doesn't return end date
      const isActive = status === 'active' && activeFlag && timeOk;

      console.log('[useSubscription] verify-whop-access response:', {
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
