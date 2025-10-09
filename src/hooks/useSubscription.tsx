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

      // Only check DB - single source of truth
      const { data: subRows, error: dbError } = await supabase
        .from('subscriptions')
        .select('status, plan_type, current_period_end')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (dbError) {
        console.error('[useSubscription] DB check error:', dbError);
        setSubscription({
          hasActiveSubscription: false,
          planType: null,
          status: 'none',
          currentPeriodEnd: null,
        });
        return;
      }

      const dbSub = subRows?.[0] as any;
      const now = Date.now();
      const endMsDb = dbSub?.current_period_end ? Date.parse(dbSub.current_period_end) : null;
      
      // Strict check: status must be 'active' AND current_period_end must be in the future
      const isDbActive = dbSub?.status === 'active' && endMsDb && endMsDb > now;

      console.log('[useSubscription] DB check:', {
        userId: user.id,
        dbSub,
        isDbActive,
        endMsDb,
        now
      });

      setSubscription({
        hasActiveSubscription: isDbActive,
        planType: isDbActive && typeof dbSub?.plan_type === 'string' ? dbSub.plan_type : null,
        status: dbSub?.status ?? 'none',
        currentPeriodEnd: isDbActive && typeof dbSub?.current_period_end === 'string' ? dbSub.current_period_end : null,
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
