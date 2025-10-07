import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  planType: string | null;
  status: string;
  currentPeriodEnd: string | null;
  paypalSubscriptionId: string | null;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionStatus>({
    hasActiveSubscription: false,
    planType: null,
    status: 'none',
    currentPeriodEnd: null,
    paypalSubscriptionId: null,
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

      // First try to get subscription from Whop
      const { data: whopData, error: whopError } = await supabase.functions.invoke('verify-whop-access');

      if (!whopError && whopData?.hasActiveSubscription) {
        setSubscription(whopData);
        setLoading(false);
        return;
      }

      // Fall back to PayPal subscription
      const { data, error: fetchError } = await supabase.functions.invoke('get-subscription-status');

      if (fetchError) {
        console.error('Subscription fetch error:', fetchError);
        setError(fetchError.message || 'Failed to fetch subscription status');
        return;
      }

      if (data?.error) {
        console.error('Subscription API error:', data.error);
        setError(data.error);
        return;
      }

      setSubscription(data);
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