import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { subscription, loading: subLoading, refresh } = useSubscription();
  const location = useLocation();
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    // Check if returning from Dodo checkout with subscription_id in URL
    const params = new URLSearchParams(location.search);
    const subscriptionId = params.get('subscription_id') || params.get('session_id');

    if (subscriptionId && user && !subscription.hasActiveSubscription && !verifying && !verified) {
      setVerifying(true);
      supabase.functions.invoke('verify-dodo-payment', {
        body: { subscription_id: subscriptionId },
      }).then(({ data, error }) => {
        if (error) {
          console.error('Payment verification error:', error);
        } else {
          console.log('Payment verified:', data);
        }
        // Refresh subscription status after verification
        refresh().finally(() => {
          setVerifying(false);
          setVerified(true);
        });
      });
    }
  }, [user, location.search, subscription.hasActiveSubscription, verifying, verified]);

  if (authLoading || subLoading || verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3"></div>
          <p className="text-muted-foreground">
            {verifying ? 'Activating your subscription...' : 'Checking access...'}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  // If no active subscription, redirect to pricing
  if (!subscription.hasActiveSubscription) {
    return <Navigate to="/pricing" replace />;
  }

  return <>{children}</>;
}
