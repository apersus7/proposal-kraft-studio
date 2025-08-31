import React, { useState, useEffect } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PayPalSubscriptionProps {
  planId: string;
  planName: string;
  price: string;
  description: string;
}

export const PayPalSubscription: React.FC<PayPalSubscriptionProps> = ({
  planId,
  planName,
  price,
  description
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    subscribed: boolean;
    subscription_tier?: string;
    subscription_end?: string;
  }>({ subscribed: false });
  const { toast } = useToast();
  const { user } = useAuth();

  const checkSubscriptionStatus = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('check-paypal-subscription');
      
      if (error) {
        console.error('Error checking subscription:', error);
        return;
      }
      
      if (data) {
        setSubscriptionStatus(data);
      }
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }
  };

  useEffect(() => {
    checkSubscriptionStatus();
  }, [user]);

  const handleApprove = async (data: any) => {
    setIsLoading(true);
    try {
      // Store the subscription ID in our database
      const { error } = await supabase
        .from('subscribers')
        .upsert({
          email: user?.email,
          user_id: user?.id,
          paypal_subscription_id: data.subscriptionID,
          subscribed: true,
          subscription_tier: planName,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'email' });

      if (error) {
        console.error('Database error:', error);
        toast({
          title: "Error",
          description: "Failed to save subscription information.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success!",
        description: `You have successfully subscribed to ${planName}!`,
      });

      // Refresh subscription status
      checkSubscriptionStatus();
    } catch (error) {
      console.error('Subscription approval error:', error);
      toast({
        title: "Error",
        description: "Failed to process subscription.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleError = (err: any) => {
    console.error('PayPal error:', err);
    toast({
      title: "Error",
      description: "PayPal payment failed. Please try again.",
      variant: "destructive",
    });
    setIsLoading(false);
  };

  const handleCancel = () => {
    toast({
      title: "Cancelled",
      description: "Subscription was cancelled.",
    });
    setIsLoading(false);
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{planName}</CardTitle>
          <CardDescription>Please sign in to subscribe</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">You need to be logged in to subscribe to a plan.</p>
        </CardContent>
      </Card>
    );
  }

  if (subscriptionStatus.subscribed && subscriptionStatus.subscription_tier === planName) {
    return (
      <Card className="border-primary">
        <CardHeader>
          <CardTitle className="text-primary">{planName} - Active</CardTitle>
          <CardDescription>You are currently subscribed to this plan</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">{description}</p>
          <div className="space-y-2">
            <p className="font-semibold text-primary">{price}</p>
            {subscriptionStatus.subscription_end && (
              <p className="text-sm text-muted-foreground">
                Next billing: {new Date(subscriptionStatus.subscription_end).toLocaleDateString()}
              </p>
            )}
          </div>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={checkSubscriptionStatus}
          >
            Refresh Status
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{planName}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="font-semibold text-2xl">{price}</p>
          
          <div className="p-4 border border-dashed rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Complete your subscription through our secure checkout
            </p>
            <Button 
              onClick={() => window.location.href = `/checkout?plan=${planName.toLowerCase()}`}
              className="w-full"
            >
              Subscribe to {planName}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};