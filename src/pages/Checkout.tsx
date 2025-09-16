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
  const [paypalLoadFailed, setPaypalLoadFailed] = useState(false);
  const [clientToken, setClientToken] = useState<string | null>(null);
  const [showCardForm, setShowCardForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [paypalPlanIds, setPaypalPlanIds] = useState<any>(null);

  useEffect(() => {
    // Get PayPal client ID and client token
    const getPayPalCredentials = async () => {
      try {
        const [clientIdResponse, clientTokenResponse, planIdsResponse] = await Promise.all([
          supabase.functions.invoke('get-paypal-client-id'),
          supabase.functions.invoke('generate-paypal-client-token'),
          supabase.functions.invoke('get-paypal-plan-ids')
        ]);
        
        if (clientIdResponse.error) throw clientIdResponse.error;
        if (clientTokenResponse.error) throw clientTokenResponse.error;
        if (planIdsResponse.error) throw planIdsResponse.error;
        
        setPaypalClientId(clientIdResponse.data.clientId);
        setClientToken(clientTokenResponse.data.clientToken);
        setPaypalPlanIds(planIdsResponse.data.planIds);
      } catch (error) {
        console.error('Error getting PayPal credentials:', error);
        toast({
          title: 'Payment Error',
          description: 'Unable to load payment system. Please try again.',
          variant: 'destructive'
        });
      }
    };
    
    if (user && selectedPlan && !paypalPlanIds) {
      getPayPalCredentials();
    }
  }, [user, selectedPlan, paypalPlanIds, toast]);
  
  useEffect(() => {
    // Load PayPal SDK with card components
    if (paypalClientId && !paypalLoaded && !(window as any).paypal) {
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${paypalClientId}&vault=true&intent=subscription&components=buttons,card-fields&enable-funding=card,venmo&currency=USD`;
      script.onload = () => setPaypalLoaded(true);
      script.onerror = () => {
        console.error('Failed to load PayPal SDK script');
        setPaypalLoadFailed(true);
        toast({
          title: 'Payment Error',
          description: 'Could not load PayPal. Check network/ad-blockers and try again.',
          variant: 'destructive'
        });
      };
      document.head.appendChild(script);
    } else if ((window as any).paypal && !paypalLoaded) {
      setPaypalLoaded(true);
    }
  }, [paypalClientId, paypalLoaded, toast]);
  
  const createPayPalSubscription = () => {
    if (!selectedPlan || !paypalPlanIds) return;
    if (!(window as any).paypal) {
      console.error('PayPal SDK not available on window');
      return;
    }

    const container = document.getElementById('paypal-button-container');
    if (container) container.innerHTML = '';
    
    (window as any).paypal.Buttons({
      style: {
        shape: 'rect',
        color: 'gold',
        layout: 'vertical',
        label: 'subscribe',
        height: 55
      },
      fundingSource: undefined, // Allow all funding sources
      createSubscription: function(data: any, actions: any) {
        const planIdToUse = paypalPlanIds[planId];
        console.log('Using PayPal plan ID:', planIdToUse);
        return actions.subscription.create({
          plan_id: planIdToUse
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

  const createCardFields = () => {
    if (!clientToken || !(window as any).paypal || !selectedPlan) return;

    const cardContainer = document.getElementById('card-fields-container');
    if (!cardContainer) return;

    cardContainer.innerHTML = '';

    const cardFields = (window as any).paypal.CardFields({
      clientToken: clientToken,
      style: {
        'input': {
          'font-size': '16px',
          'font-family': 'system-ui, -apple-system, sans-serif',
          'color': '#374151'
        },
        '.invalid': {
          'color': '#dc2626'
        }
      },
      fields: {
        number: {
          selector: '#card-number',
          placeholder: '1234 1234 1234 1234'
        },
        cvv: {
          selector: '#card-cvv',
          placeholder: 'CVV'
        },
        expirationDate: {
          selector: '#card-expiry',
          placeholder: 'MM/YY'
        }
      }
    });

    cardFields.render('#card-fields-container').then(() => {
      console.log('Card fields rendered successfully');
    }).catch((error: any) => {
      console.error('Error rendering card fields:', error);
    });

    return cardFields;
  };

  const handleCardPayment = async (cardFields: any) => {
    if (!selectedPlan || isProcessing) return;

    setIsProcessing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-paypal-subscription', {
        body: { planId, paymentMethodNonce: 'card-payment' }
      });

      if (error) throw error;

      toast({
        title: 'Subscription Created!',
        description: `Your ${selectedPlan.name} subscription is now active.`
      });

      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);

    } catch (error) {
      console.error('Card payment error:', error);
      toast({
        title: 'Payment Error',
        description: 'There was an issue processing your card payment. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  useEffect(() => {
    if (paypalLoaded && selectedPlan && paypalPlanIds) {
      createPayPalSubscription();
      if (clientToken) {
        createCardFields();
      }
    }
  }, [paypalLoaded, selectedPlan, clientToken, paypalPlanIds]);

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
                  <div className="space-y-6">
                    <div className="text-center">
                      <h3 className="font-semibold mb-2">Complete Your Payment</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Subscribe to {selectedPlan.name}
                      </p>
                    </div>
                    
                    {/* Payment Method Selection */}
                    <div className="space-y-4">
                      <div className="flex space-x-4">
                        <Button
                          variant={!showCardForm ? "default" : "outline"}
                          onClick={() => setShowCardForm(false)}
                          className="flex-1"
                        >
                          PayPal
                        </Button>
                        <Button
                          variant={showCardForm ? "default" : "outline"}
                          onClick={() => setShowCardForm(true)}
                          className="flex-1"
                        >
                          Credit/Debit Card
                        </Button>
                      </div>
                      
                      {!showCardForm ? (
                        <div id="paypal-button-container"></div>
                      ) : (
                        <div className="space-y-4">
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium mb-1">Card Number</label>
                              <div id="card-number" className="border rounded-md p-3 min-h-[48px]"></div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-sm font-medium mb-1">Expiry Date</label>
                                <div id="card-expiry" className="border rounded-md p-3 min-h-[48px]"></div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">CVV</label>
                                <div id="card-cvv" className="border rounded-md p-3 min-h-[48px]"></div>
                              </div>
                            </div>
                          </div>
                          <div id="card-fields-container" className="hidden"></div>
                          <Button 
                            onClick={() => {
                              const cardFields = createCardFields();
                              if (cardFields) handleCardPayment(cardFields);
                            }}
                            disabled={isProcessing}
                            className="w-full"
                          >
                            {isProcessing ? 'Processing...' : `Subscribe to ${selectedPlan.name}`}
                          </Button>
                        </div>
                      )}
                    </div>
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
                  <p>🔒 Secure payment processing</p>
                  <p>💳 PayPal & Credit/Debit cards accepted</p>
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