import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';

const logo = '/lovable-uploads/22b8b905-b997-42da-85df-b966b4616f6e.png';

interface Props {
  children: ReactNode;
}

export default function SubscriptionGuard({ children }: Props) {
  const { user, loading: authLoading } = useAuth();
  const { subscription, loading: subLoading } = useSubscription();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Wait for both auth and subscription to finish loading
    if (authLoading || subLoading) return;

    // Debug: log gate inputs
    console.log('[SubscriptionGuard]', {
      path: location.pathname,
      userId: user?.id,
      authLoading,
      subLoading,
      hasActiveSubscription: subscription.hasActiveSubscription,
      status: subscription.status,
    });

    // If not authenticated, redirect to auth page
    if (!user) {
      navigate('/auth', { replace: true, state: { from: location.pathname } });
      return;
    }

    // If authenticated but subscription is not active, redirect to pricing
    if (subscription.status !== 'active') {
      navigate('/pricing', { replace: true });
    }
  }, [authLoading, subLoading, user, subscription.hasActiveSubscription, navigate, location.pathname, subscription.status]);

  // Loading or redirecting state
  if (authLoading || subLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <img src={logo} alt="ProposalKraft" className="h-12 mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If subscription is not active, navigation effect will run; render nothing here
  if (subscription.status !== 'active') return null;

  return <>{children}</>;
}
