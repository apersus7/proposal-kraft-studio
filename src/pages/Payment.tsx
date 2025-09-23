import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, CreditCard, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';

const plans = {
  freelance: {
    name: 'Freelance',
    price: 19,
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
    name: 'Agency',
    price: 49,
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
    name: 'Enterprise',
    price: 69,
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

const countries = [
  'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 'France', 
  'Spain', 'Italy', 'Netherlands', 'Sweden', 'Norway', 'Denmark', 'Other'
];

export default function Payment() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'paypal' | 'card'>('paypal');
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: user?.email || '',
    country: ''
  });

  useEffect(() => {
    // Redirect if not authenticated
    if (!user) {
      navigate('/auth');
      return;
    }

    // Get plan from URL params
    const planFromUrl = searchParams.get('plan');
    if (planFromUrl && plans[planFromUrl as keyof typeof plans]) {
      setSelectedPlan(planFromUrl);
    }

    // Pre-fill user info if available
    if (user.email) {
      setUserInfo(prev => ({ ...prev, email: user.email! }));
    }
  }, [user, searchParams, navigate]);

  const handlePayment = async () => {
    if (!selectedPlan || !userInfo.name || !userInfo.email || !userInfo.country) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields and select a plan.",
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
      console.log('Creating payment for:', { 
        plan: selectedPlan, 
        method: paymentMethod, 
        userInfo 
      });

      const { data, error } = await supabase.functions.invoke('create-paypal-payment', {
        body: { 
          planId: selectedPlan,
          amount: plans[selectedPlan as keyof typeof plans].price,
          userInfo: userInfo,
          paymentMethod: paymentMethod
        }
      });

      if (error) {
        console.error('Payment creation error:', error);
        throw new Error(error.message || 'Failed to create payment');
      }

      if (data?.error) {
        console.error('PayPal error:', data.error);
        throw new Error(data.error);
      }

      if (data?.approvalUrl) {
        console.log('Redirecting to PayPal:', data.approvalUrl);
        // Redirect to PayPal for payment
        window.location.href = data.approvalUrl;
      } else {
        throw new Error('No payment URL received from PayPal');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Failed to process payment. Please try again.",
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Plan Selection & User Info */}
          <div className="space-y-6">
            {/* Plan Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select Your Plan</CardTitle>
                <CardDescription>Choose the plan that best fits your needs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(plans).map(([key, plan]) => (
                  <div 
                    key={key}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedPlan === key 
                        ? 'border-primary bg-primary/5' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedPlan(key)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{plan.name}</h3>
                        <p className="text-sm text-muted-foreground">{plan.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">${plan.price}</div>
                        <div className="text-sm text-muted-foreground">one-time</div>
                      </div>
                    </div>
                    {selectedPlan === key && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="grid grid-cols-1 gap-1 text-sm">
                          {plan.features.slice(0, 4).map((feature, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <Check className="h-3 w-3 text-green-500" />
                              <span>{feature}</span>
                            </div>
                          ))}
                          {plan.features.length > 4 && (
                            <div className="text-muted-foreground">
                              +{plan.features.length - 4} more features
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* User Information */}
            <Card>
              <CardHeader>
                <CardTitle>Your Information</CardTitle>
                <CardDescription>We need this information for your payment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={userInfo.name}
                    onChange={(e) => setUserInfo(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userInfo.email}
                    onChange={(e) => setUserInfo(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country *</Label>
                  <Select 
                    value={userInfo.country} 
                    onValueChange={(value) => setUserInfo(prev => ({ ...prev, country: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Payment Method & Summary */}
          <div className="space-y-6">
            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
                <CardDescription>Choose how you'd like to pay</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div 
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    paymentMethod === 'paypal' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setPaymentMethod('paypal')}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">PP</span>
                    </div>
                    <div>
                      <div className="font-medium">PayPal Account</div>
                      <div className="text-sm text-muted-foreground">Pay with your PayPal account</div>
                    </div>
                  </div>
                </div>
                
                <div 
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    paymentMethod === 'card' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setPaymentMethod('card')}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-8 h-8 text-gray-600" />
                    <div>
                      <div className="font-medium">Credit/Debit Card</div>
                      <div className="text-sm text-muted-foreground">Pay as guest with any card (via PayPal)</div>
                    </div>
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
                    <span>${selectedPlanDetails.price}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>${selectedPlanDetails.price}</span>
                  </div>
                  
                  <Button 
                    className="w-full mt-6" 
                    size="lg"
                    onClick={handlePayment}
                    disabled={loading || !selectedPlan || !userInfo.name || !userInfo.email || !userInfo.country}
                  >
                    {loading ? 'Processing...' : `Pay $${selectedPlanDetails.price} with ${paymentMethod === 'paypal' ? 'PayPal' : 'Card'}`}
                  </Button>

                  <div className="text-xs text-muted-foreground text-center mt-4">
                    <p>🔒 Secure payment processing via PayPal</p>
                    <p>Your payment information is protected</p>
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