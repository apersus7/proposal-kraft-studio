import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PaymentStatus {
  hasPaid: boolean;
  loading: boolean;
  error: string | null;
}

export const usePaymentStatus = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<PaymentStatus>({
    hasPaid: false,
    loading: true,
    error: null,
  });

  const checkPaymentStatus = async () => {
    if (!user) {
      setStatus({ hasPaid: false, loading: false, error: null });
      return;
    }

    try {
      setStatus(prev => ({ ...prev, loading: true, error: null }));

      // Check for any completed payment
      const { data, error } = await supabase
        .from('payments')
        .select('status, completed_at')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Payment status check error:', error);
        setStatus({ hasPaid: false, loading: false, error: error.message });
        return;
      }

      setStatus({
        hasPaid: !!data,
        loading: false,
        error: null,
      });
    } catch (err) {
      console.error('Payment status hook error:', err);
      setStatus({
        hasPaid: false,
        loading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  };

  useEffect(() => {
    checkPaymentStatus();
  }, [user]);

  return {
    ...status,
    refresh: checkPaymentStatus,
  };
};
