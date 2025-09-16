import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { Link, useSearchParams, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Plan definitions
const plans = {
  freelance: {
    id: 'freelance',
    name: 'Freelance',
    price: '$19/month',
    description: 'Perfect for freelancers and small businesses',
    features: [
      '5 proposals with watermark',
      'Unlimited templates',
      'Unlimited customisation',
      'Tracking',
      'E-signature',
      'Export in various formats'
    ]
  },
  agency: {
    id: 'agency', 
    name: 'Agency',
    price: '$49/month',
    description: 'Best for growing businesses and teams',
    features: [
      'Unlimited proposals',
      'Unlimited templates', 
      'Unlimited customisation',
      'Tracking',
      'E-signature',
      'Export in various formats',
      'CRM integration',
      'Upload custom template',
      'Reminders',
      'Team collaboration'
    ]
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise', 
    price: '$69/month',
    description: 'For large organizations with advanced needs',
    features: [
      'Unlimited proposals',
      'Unlimited templates',
      'Unlimited customisation', 
      'Tracking',
      'E-signature',
      'Export in various formats',
      'CRM integration',
      'Upload custom template',
      'Payment integration',
      'Reminders',
      'Team collaboration'
    ]
  }
};

const Checkout = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const planId = searchParams.get('plan') as keyof typeof plans;
  const selectedPlan = planId ? plans[planId] : null;
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const [paypalClientId, setPaypalClientId] = useState<string | null>(null);
  
  useEffect(() => {
    // Get PayPal client ID
    const getPayPalClientId = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-paypal-client-id');
        if (error) throw error;
        setPaypalClientId(data.clientId);
      } catch (error) {
        console.error('Error getting PayPal client ID:', error);
        toast({
          title: 'Payment Error',
          description: 'Unable to load payment system. Please try again.',
          variant: 'destructive'
        });
      }
    };
    
    if (user && selectedPlan) {
      getPayPalClientId();
    }
  }, [user, selectedPlan, toast]);
  
  useEffect(() => {
    // Load PayPal SDK
    if (paypalClientId && !paypalLoaded) {
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${paypalClientId}&vault=true&intent=subscription`;
      script.onload = () => setPaypalLoaded(true);
      document.head.appendChild(script);
    }
  }, [paypalClientId, paypalLoaded]);
  
  const createPayPalSubscription = () => {
    if (!(window as any).paypal || !selectedPlan) return;
    
    // PayPal plan IDs from PayPal Developer Dashboard
    const paypalPlanIds = {
      freelance: 'P-7YB493177K007112KNDEUCQQ',
      agency: 'P-2HX63496VE684490XNDEUC5Q', 
      enterprise: 'P-0HH73491LT124962RNDEUDHY'
    };
    
    (window as any).paypal.Buttons({
      style: {
        shape: 'rect',
        color: 'blue',
        layout: 'vertical',
        label: 'subscribe'
      },
      createSubscription: function(data: any, actions: any) {
        return actions.subscription.create({
          plan_id: paypalPlanIds[planId]
        });
      },
      onApprove: function(data: any, actions: any) {
        toast({
          title: 'Subscription Created!',
          description: `Your ${selectedPlan.name} subscription is now active.`
        });
        // Redirect to dashboard after successful payment
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);
      },
      onError: function(err: any) {
        console.error('PayPal error:', err);
        toast({
          title: 'Payment Error',
          description: 'There was an issue processing your payment. Please try again.',
          variant: 'destructive'
        });
      }
    }).render('#paypal-button-container');
  };
  
  useEffect(() => {
    if (paypalLoaded && selectedPlan) {
      createPayPalSubscription();
    }
  }, [paypalLoaded, selectedPlan]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please sign in to continue with your subscription</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/auth">
              <Button className="w-full">Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!selectedPlan) {
    return <Navigate to="/pricing" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back button */}
        <Link to="/pricing">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Pricing
          </Button>
        </Link>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
              <CardDescription>Review your subscription details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{selectedPlan.name}</h3>
                  <p className="text-muted-foreground">{selectedPlan.description}</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Features included:</h4>
                  {selectedPlan.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total</span>
                    <span className="font-semibold text-lg">{selectedPlan.price}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Section */}
          <Card>
            <CardHeader>
              <CardTitle>Complete Your Subscription</CardTitle>
              <CardDescription>
                Secure checkout - Contact us to complete your subscription
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {paypalLoaded ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="font-semibold mb-2">Complete Your Payment</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Subscribe to {selectedPlan.name} with PayPal
                      </p>
                    </div>
                    <div id="paypal-button-container"></div>
                  </div>
                ) : (
                  <div className="p-6 border border-dashed rounded-lg text-center">
                    <h3 className="font-semibold mb-2">Loading Payment Options...</h3>
                    <p className="text-sm text-muted-foreground">
                      Please wait while we prepare your secure checkout
                    </p>
                  </div>
                )}

                <div className="text-center text-sm text-muted-foreground space-y-2">
                  <p>🔒 Secure PayPal checkout</p>
                  <p>📅 Monthly billing cycle</p>
                  <p>❌ Cancel anytime</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Checkout;