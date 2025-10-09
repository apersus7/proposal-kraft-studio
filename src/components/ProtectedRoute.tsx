import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { subscription, loading: subLoading } = useSubscription();
  const location = useLocation();

  // Strict active check: must be 'active' and have a future end date
  const now = Date.now();
  const endMs = subscription.currentPeriodEnd ? Date.parse(subscription.currentPeriodEnd) : null;
  const isActiveStrict = subscription.status === 'active' && !!endMs && endMs > now && subscription.hasActiveSubscription;

  // Loading state while auth/subscription are resolving
  if (authLoading || subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Checking access...</p>
        </div>
      </div>
    );
  }

  // Must be authenticated
  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  // Must have active subscription
  if (!isActiveStrict) {
    return <Navigate to="/pricing" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
