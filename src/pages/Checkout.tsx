import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle, ArrowLeft } from 'lucide-react';

const plans = {
  starter: {
    id: 'P-5ML4271244454362WXNWU5NQ',
    name: 'Starter',
    price: '$19/month',
    amount: 19,
    description: 'Perfect for small businesses getting started',
    features: ['Up to 10 proposals per month', 'Basic templates', 'Email support', 'Basic analytics']
  },
  professional: {
    id: 'P-1GJ4568135982362YXNWU5NQ',
    name: 'Professional',
    price: '$49/month',
    amount: 49,
    description: 'Most popular plan for growing businesses',
    features: ['Unlimited proposals', 'Premium templates', 'Priority support', 'Advanced analytics', 'CRM integration', 'Custom branding']
  },
  enterprise: {
    id: 'P-2HL7893456021362ZXNWU5NQ',
    name: 'Enterprise',
    price: '$99/month',
    amount: 99,
    description: 'For large organizations with advanced needs',
    features: ['Everything in Professional', 'White-label solution', 'API access', 'Dedicated support', 'Custom integrations', 'Advanced security']
  }
};

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [paypalClientId, setPaypalClientId] = useState<string>('');

  const planType = searchParams.get('plan') as keyof typeof plans;
  const plan = planType ? plans[planType] : null;

  useEffect(() => {
    const getPayPalClientId = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-paypal-client-id');
        if (error) throw error;
        setPaypalClientId(data.clientId);
      } catch (error) {
        console.error('Error getting PayPal client ID:', error);
        // Fallback to sandbox for development
        setPaypalClientId('AYsP-Q_NqBl8r5vWbclgNIlJlgHP2mzqpeEKs-r9pnVrgup-V9tFIftKGEls8LlzTHgFjm1MLEz3C0zs');
      }
    };

    getPayPalClientId();
  }, []);

  const handleApprove = async (data: any) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('subscribers')
        .upsert({
          email: user?.email,
          user_id: user?.id,
          paypal_subscription_id: data.subscriptionID,
          subscribed: true,
          subscription_tier: plan?.name,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'email' });

      if (error) throw error;

      toast({
        title: "Payment Successful!",
        description: `Welcome to ${plan?.name}! Your subscription is now active.`,
      });

      navigate('/dashboard?success=true');
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: "Error",
        description: "Failed to process subscription. Please contact support.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleError = (err: any) => {
    console.error('PayPal error:', err);
    toast({
      title: "Payment Failed",
      description: "There was an issue processing your payment. Please try again.",
      variant: "destructive",
    });
    setIsLoading(false);
  };

  const handleCancel = () => {
    toast({
      title: "Payment Cancelled",
      description: "You can complete your subscription anytime.",
    });
    setIsLoading(false);
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>Please sign in to complete your purchase</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/auth')} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Invalid Plan</CardTitle>
            <CardDescription>The selected plan was not found</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/pricing')} className="w-full">
              View Plans
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/pricing')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Pricing
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{plan.name} Plan</h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>
                <Badge variant="secondary">Monthly</Badge>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Features included:</h4>
                <ul className="space-y-1">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <CheckCircle className="w-4 h-4 text-primary mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>{plan.price}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Billed monthly • Cancel anytime
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Payment */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
              <CardDescription>
                Complete your subscription with PayPal
              </CardDescription>
            </CardHeader>
            <CardContent>
              {paypalClientId && (
                <PayPalScriptProvider options={{
                  clientId: paypalClientId,
                  vault: true,
                  intent: "subscription",
                  currency: "USD"
                }}>
                  <PayPalButtons
                    disabled={isLoading}
                    createSubscription={(data, actions) => {
                      return actions.subscription.create({
                        plan_id: plan.id,
                      });
                    }}
                    onApprove={handleApprove}
                    onError={handleError}
                    onCancel={handleCancel}
                    style={{
                      layout: "vertical",
                      color: "blue",
                      shape: "rect",
                      label: "subscribe",
                      height: 45
                    }}
                  />
                </PayPalScriptProvider>
              )}
              
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Secure checkout powered by PayPal
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Your subscription will auto-renew monthly. Cancel anytime from your dashboard.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}