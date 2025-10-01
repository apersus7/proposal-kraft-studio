import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';

const plans = {
  dealcloser: {
    name: 'The Deal Closer',
    price: 28,
    description: 'Everything you need to close more deals',
    features: [
      'Unlimited proposals',
      'Unlimited templates',
      'Unlimited customisation',
      'Tracking & Analytics',
      'E-signature',
      'Export in various formats',
      'CRM integration',
      'Upload custom template',
      'Payment integration',
      'Reminders',
      'Team collaboration',
      'Priority support'
    ],
    badge: 'Best Value'
  }
};

export default function Payment() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('');

  useEffect(() => {
    // Redirect if not authenticated
    if (!user) {
      navigate('/auth');
      return;
    }

    // Get plan from URL params or default to dealcloser
    const planFromUrl = searchParams.get('plan');
    if (planFromUrl && plans[planFromUrl as keyof typeof plans]) {
      setSelectedPlan(planFromUrl);
    } else {
      setSelectedPlan('dealcloser');
    }
  }, [user, searchParams, navigate]);

  const handlePayment = async () => {
    if (!selectedPlan) {
      toast({
        title: "Missing Information",
        description: "Please select a plan.",
        variant: "destructive"
      });
      return;
    }

    // Check if user already has this plan
    if (subscription.hasActiveSubscription && subscription.planType === selectedPlan) {
      toast({
        title: "Already Subscribed",
        description: "You already have this plan active.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      console.log('Creating subscription for:', { 
        plan: selectedPlan
      });

      const { data, error } = await supabase.functions.invoke('create-paypal-subscription', {
        body: { 
          planId: selectedPlan
        }
      });

      if (error) {
        console.error('Subscription creation error:', error);
        throw new Error(error.message || 'Failed to create subscription');
      }

      if (data?.error) {
        console.error('PayPal error:', data.error);
        throw new Error(data.error);
      }

      if (data?.approvalUrl) {
        console.log('Redirecting to PayPal:', data.approvalUrl);
        // Redirect to PayPal for subscription approval
        window.location.href = data.approvalUrl;
      } else {
        throw new Error('No approval URL received from PayPal');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: "Subscription Failed",
        description: error instanceof Error ? error.message : "Failed to create subscription. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedPlanDetails = selectedPlan ? plans[selectedPlan as keyof typeof plans] : null;

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Complete Your Payment</h1>
          <p className="text-gray-600 mt-2">Secure payment processing via PayPal</p>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* Plan Details Card */}
          <div className="space-y-6">
            {/* Plan Details */}
            <Card>
              <CardHeader>
                <CardTitle>Your Plan</CardTitle>
                <CardDescription>Everything you need to close more deals</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-6 border-2 border-primary bg-primary/5 rounded-lg relative">
                  <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-green-500 to-blue-500">
                    Best Value
                  </Badge>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold">The Deal Closer</h3>
                      <p className="text-sm text-muted-foreground">Everything you need to close more deals</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold">${plans.dealcloser.price}</div>
                      <div className="text-sm text-muted-foreground">/month</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    {plans.dealcloser.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Summary */}
            {selectedPlanDetails && (
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>{selectedPlanDetails.name} Plan</span>
                    <span>${selectedPlanDetails.price}/month</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Monthly Total</span>
                    <span>${selectedPlanDetails.price}</span>
                  </div>
                  
                  <Button 
                    className="w-full mt-6" 
                    size="lg"
                    onClick={handlePayment}
                    disabled={loading || !selectedPlan}
                  >
                    {loading ? 'Processing...' : `Subscribe for $${selectedPlanDetails.price}/month`}
                  </Button>

                  <div className="text-xs text-muted-foreground text-center mt-4">
                    <p>🔒 Secure payment processing via PayPal</p>
                    <p>Cancel anytime from your account settings</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}