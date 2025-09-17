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
    // Get PayPal client ID, client token, and plan IDs
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
    // Load PayPal SDK with enhanced card support
    if (paypalClientId && !paypalLoaded && !(window as any).paypal) {
      const script = document.createElement('script');
      // Enhanced SDK loading with card fields and hosted fields for better card support
      script.src = `https://www.paypal.com/sdk/js?client-id=${paypalClientId}&vault=true&intent=subscription&components=buttons,hosted-fields&enable-funding=card,venmo,paylater&disable-funding=sepa,bancontact,eps,giropay,ideal,mybank,p24,sofort&currency=USD`;
      script.onload = () => {
        console.log('PayPal SDK loaded successfully');
        setPaypalLoaded(true);
      };
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
      console.log('PayPal SDK already available');
      setPaypalLoaded(true);
    }
  }, [paypalClientId, paypalLoaded, toast]);
  
  const createPayPalSubscription = () => {
    if (!selectedPlan || !paypalPlanIds || !clientToken) return;
    if (!(window as any).paypal) {
      console.error('PayPal SDK not available on window');
      return;
    }

    const container = document.getElementById('paypal-button-container');
    if (container) container.innerHTML = '';
    
    // Enhanced PayPal integration with better card support
    (window as any).paypal.Buttons({
      style: {
        shape: 'rect',
        color: 'gold',
        layout: 'vertical', 
        label: 'subscribe',
        height: 55,
        tagline: false
      },
      // Enhanced funding options for better card support
      fundingSource: undefined,
      createSubscription: function(data: any, actions: any) {
        console.log('Creating subscription for plan:', planId);
        let planIdToUse = paypalPlanIds[planId];
        
        // Ensure plan ID has P- prefix
        if (planIdToUse && !planIdToUse.startsWith('P-')) {
          planIdToUse = 'P-' + planIdToUse;
        }
        console.log('Using PayPal plan ID:', planIdToUse);
        
        return actions.subscription.create({
          plan_id: planIdToUse,
          application_context: {
            brand_name: 'Proposal Kraft',
            locale: 'en-US',
            shipping_preference: 'NO_SHIPPING',
            user_action: 'SUBSCRIBE_NOW',
            return_url: window.location.origin + '/dashboard',
            cancel_url: window.location.href,
            payment_method: {
              payer_selected: 'PAYPAL',
              payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED'
            }
          },
          // Enhanced subscription details for better processing
          subscriber: {
            name: {
              given_name: user?.user_metadata?.full_name?.split(' ')[0] || 'Customer',
              surname: user?.user_metadata?.full_name?.split(' ')[1] || ''
            },
            email_address: user?.email || ''
          }
        });
      },
      onApprove: function(data: any, actions: any) {
        console.log('Subscription approved:', data);
        setIsProcessing(true);
        
        toast({
          title: 'Subscription Created Successfully!',
          description: `Your ${selectedPlan.name} subscription is now active. Redirecting to dashboard...`
        });
        
        // Redirect to dashboard after successful payment
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);
      },
      onCancel: function(data: any) {
        console.log('PayPal payment cancelled:', data);
        setIsProcessing(false);
        toast({
          title: 'Payment Cancelled',
          description: 'Your payment was cancelled. You can try again anytime.',
          variant: 'default'
        });
      },
      onError: function(err: any) {
        console.error('PayPal error details:', err);
        setIsProcessing(false);
        
        let errorMessage = 'There was an issue processing your payment. Please try again.';
        
        // Enhanced error handling for card-specific issues
        if (err && typeof err === 'object') {
          if (err.message) {
            if (err.message.includes('card') || err.message.includes('CARD')) {
              errorMessage = 'Card payment failed. Please verify your card details and try again, or use PayPal directly.';
            } else if (err.message.includes('declined') || err.message.includes('DECLINED')) {
              errorMessage = 'Payment was declined by your bank. Please contact your bank or try a different payment method.';
            } else if (err.message.includes('expired') || err.message.includes('EXPIRED')) {
              errorMessage = 'Your card has expired. Please use a different card.';
            } else if (err.message.includes('insufficient') || err.message.includes('INSUFFICIENT')) {
              errorMessage = 'Insufficient funds. Please check your account balance or use a different payment method.';
            }
          }
          
          // Log detailed error for debugging
          console.error('Detailed PayPal error:', {
            message: err.message,
            details: err.details,
            name: err.name
          });
        }
        
        toast({
          title: 'Payment Error',
          description: errorMessage,
          variant: 'destructive'
        });
      }
    }).render('#paypal-button-container').catch((renderError: any) => {
      console.error('PayPal button render error:', renderError);
      setPaypalLoadFailed(true);
      toast({
        title: 'Payment System Error',
        description: 'Unable to load payment options. Please refresh the page and try again.',
        variant: 'destructive'
      });
    });
  };
  
  useEffect(() => {
    if (paypalLoaded && selectedPlan && paypalPlanIds && clientToken) {
      createPayPalSubscription();
    }
  }, [paypalLoaded, selectedPlan, paypalPlanIds, clientToken]);

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
                {paypalLoaded && clientToken ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="font-semibold mb-2">Complete Your Payment</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Subscribe to {selectedPlan.name} - PayPal accepts all major cards
                      </p>
                    </div>
                    <div id="paypal-button-container"></div>
                    {isProcessing && (
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-sm font-medium">Processing your subscription...</p>
                        <p className="text-xs text-muted-foreground mt-1">Please do not close this window</p>
                      </div>
                    )}
                  </div>
                ) : paypalLoadFailed ? (
                  <div className="p-6 border border-destructive/20 rounded-lg text-center bg-destructive/5">
                    <h3 className="font-semibold mb-2 text-destructive">Payment System Unavailable</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Unable to load PayPal. Please check your network connection and disable any ad blockers, then refresh the page.
                    </p>
                    <Button onClick={() => window.location.reload()} variant="outline">
                      Refresh Page
                    </Button>
                  </div>
                ) : (
                  <div className="p-6 border border-dashed rounded-lg text-center">
                    <h3 className="font-semibold mb-2">Loading Payment Options...</h3>
                    <p className="text-sm text-muted-foreground">
                      Preparing secure checkout with enhanced card support...
                    </p>
                  </div>
                )}

                <div className="text-center text-sm text-muted-foreground space-y-2">
                  <p>🔒 Secure PayPal checkout</p>
                  <p>💳 PayPal accepts all major cards</p>
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