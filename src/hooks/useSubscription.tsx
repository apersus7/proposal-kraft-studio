import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  planType: string | null;
  status: string;
  currentPeriodEnd: string | null;
  isTrial: boolean;
  isPaid: boolean;
}

const defaultStatus: SubscriptionStatus = {
  hasActiveSubscription: false,
  planType: null,
  status: 'none',
  currentPeriodEnd: null,
  isTrial: false,
  isPaid: false,
};

// Simple in-memory cache to avoid re-fetching on every route change
let cachedStatus: SubscriptionStatus | null = null;
let cacheUserId: string | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60_000; // 1 minute

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionStatus>(
    // Use cache immediately if available for this user
    (cachedStatus && cacheUserId === user?.id && Date.now() - cacheTimestamp < CACHE_TTL)
      ? cachedStatus
      : defaultStatus
  );
  const [loading, setLoading] = useState(
    !(cachedStatus && cacheUserId === user?.id && Date.now() - cacheTimestamp < CACHE_TTL)
  );
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptionStatus = useCallback(async () => {
    if (!user) {
      setSubscription(defaultStatus);
      setLoading(false);
      return;
    }

    try {
      setError(null);

      // Query DB directly — no slow edge function call
      const now = new Date().toISOString();
      const { data: subRows, error: dbError } = await (supabase as any)
        .from('subscriptions')
        .select('status, plan_type, current_period_end, is_trial, is_paid')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gt('current_period_end', now)
        .order('created_at', { ascending: false })
        .limit(1);

      if (dbError) {
        console.error('[useSubscription] DB check error:', dbError);
      }

      const dbSub = subRows?.[0] as any;
      const isActive = !!dbSub;

      const result: SubscriptionStatus = {
        hasActiveSubscription: isActive,
        planType: isActive ? (dbSub?.plan_type || null) : null,
        status: isActive ? 'active' : 'none',
        currentPeriodEnd: isActive ? (dbSub?.current_period_end || null) : null,
        isTrial: isActive ? (dbSub?.is_trial || false) : false,
        isPaid: isActive ? (dbSub?.is_paid || false) : false,
      };

      // Update cache
      cachedStatus = result;
      cacheUserId = user.id;
      cacheTimestamp = Date.now();

      setSubscription(result);
    } catch (err) {
      console.error('Subscription hook error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setSubscription(defaultStatus);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // If we have a valid cache hit, skip the fetch
    if (cachedStatus && cacheUserId === user?.id && Date.now() - cacheTimestamp < CACHE_TTL) {
      setSubscription(cachedStatus);
      setLoading(false);
      return;
    }
    fetchSubscriptionStatus();
  }, [user, fetchSubscriptionStatus]);

  return {
    subscription,
    loading,
    error,
    refresh: fetchSubscriptionStatus,
  };
};
