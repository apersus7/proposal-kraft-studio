import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CreditCard, Copy, ExternalLink, DollarSign, Euro, PoundSterling } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface PaymentLinksProps {
  proposalId: string;
  proposalAmount?: string;
  proposalCurrency?: string;
  defaultOpen?: boolean;
}

export default function PaymentLinks({ proposalId, proposalAmount, proposalCurrency = 'USD', defaultOpen = false }: PaymentLinksProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(!!defaultOpen);
  const [loading, setLoading] = useState(false);
  const [paymentLinks, setPaymentLinks] = useState<any[]>([]);
  const [hasPaymentSettings, setHasPaymentSettings] = useState(false);
  const [checkingSettings, setCheckingSettings] = useState(true);
  const [paymentData, setPaymentData] = useState({
    amount: proposalAmount || '',
    currency: proposalCurrency,
    description: '',
    paymentType: 'one-time', // 'one-time' | 'subscription'
    intervalType: 'monthly' // 'monthly' | 'yearly'
  });

  useEffect(() => {
    if (user && proposalId) {
      checkPaymentSettings();
      if (isOpen) {
        fetchPaymentLinks();
      }
    }
  }, [user, proposalId, isOpen]);

  const checkPaymentSettings = async () => {
    if (!user) return;

    setCheckingSettings(true);
    try {
      const { data, error } = await supabase
        .from('user_payment_settings')
        .select('stripe_publishable_key, paypal_client_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      const hasStripe = data?.stripe_publishable_key?.trim();
      const hasPayPal = data?.paypal_client_id?.trim();
      setHasPaymentSettings(Boolean(hasStripe || hasPayPal));
    } catch (error) {
      console.error('Error checking payment settings:', error);
      setHasPaymentSettings(false);
    } finally {
      setCheckingSettings(false);
    }
  };

  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case 'USD': case 'CAD': case 'AUD': return '$';
      case 'EUR': return '€'; 
      case 'GBP': return '£';
      case 'JPY': return '¥';
      default: return '$';
    }
  };

  const getCurrencyIcon = (currency: string) => {
    switch (currency) {
      case 'EUR': return <Euro className="h-4 w-4" />;
      case 'GBP': return <PoundSterling className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  const createPayPalPaymentLink = async () => {
    setLoading(true);
    try {
      // Create payment intent via edge function
      const { data, error } = await supabase.functions.invoke('create-user-payment-link', {
        body: {
          amount: parseFloat(paymentData.amount),
          currency: paymentData.currency,
          description: paymentData.description || `Payment for Proposal`,
          proposalId,
          paymentType: paymentData.paymentType,
          intervalType: paymentData.paymentType === 'subscription' ? paymentData.intervalType : undefined
        }
      });

      if (error) throw error;

      if (data?.approvalUrl) {
        try { await navigator.clipboard.writeText(data.approvalUrl); } catch {}
        setPaymentLinks(prev => [
          ...prev,
          {
            id: data.id || `${Date.now()}`,
            provider: 'PayPal',
            amount: paymentData.amount,
            currency: paymentData.currency,
            description: paymentData.description || `Payment for Proposal`,
            paymentType: paymentData.paymentType,
            intervalType: paymentData.intervalType,
            url: data.approvalUrl,
          },
        ]);
      }

      toast({
        title: "Payment Link Created",
        description: data?.approvalUrl ? 'Link copied to clipboard' : 'PayPal payment link generated'
      });
    } catch (error) {
      console.error('Error creating payment link:', error);
      toast({
        title: "Error",
        description: "Failed to create payment link. Please check your PayPal configuration.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createStripePaymentLink = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-stripe-payment-link', {
        body: {
          amount: parseFloat(paymentData.amount),
          currency: paymentData.currency,
          description: paymentData.description || `Payment for Proposal`,
          proposalId,
          paymentType: paymentData.paymentType,
          intervalType: paymentData.paymentType === 'subscription' ? paymentData.intervalType : undefined
        }
      });

      if (error) throw error;

      if (data?.url) {
        try { await navigator.clipboard.writeText(data.url); } catch {}
        setPaymentLinks(prev => [
          ...prev,
          {
            id: data.id || `${Date.now()}`,
            provider: 'Stripe',
            amount: paymentData.amount,
            currency: paymentData.currency,
            description: paymentData.description || `Payment for Proposal`,
            paymentType: paymentData.paymentType,
            intervalType: paymentData.intervalType,
            url: data.url,
          },
        ]);
      }

      toast({
        title: "Payment Link Created", 
        description: data?.url ? 'Link copied to clipboard' : 'Stripe payment link generated successfully'
      });
    } catch (error) {
      console.error('Error creating Stripe payment link:', error);
      toast({
        title: "Error",
        description: "Failed to create Stripe payment link. Please check your Stripe configuration.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
  }

  if (!user) return null;

  if (checkingSettings) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking payment settings...</p>
        </CardContent>
      </Card>
    );
  }

  if (!hasPaymentSettings) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-6 text-center">
          <CreditCard className="h-12 w-12 text-amber-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-amber-800 mb-2">
            Payment Methods Not Configured
          </h3>
          <p className="text-amber-700 mb-4">
            To create payment links, you need to configure your Stripe or PayPal account settings first.
          </p>
          <Link to="/settings">
            <Button className="bg-amber-600 hover:bg-amber-700">
              Configure Payment Settings
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }
  };

  const fetchPaymentLinks = async () => {
    try {
      // This would fetch from a payment_links table
      // For now, we'll simulate the data structure
      setPaymentLinks([]);
    } catch (error) {
      console.error('Error fetching payment links:', error);
    }
  };

  const copyPaymentLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Copied",
        description: "Payment link copied to clipboard"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <CreditCard className="h-4 w-4 mr-2" />
          Payment Links
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Payment Links</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Payment Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <div className="flex">
                    <div className="flex items-center px-3 border border-r-0 rounded-l-md bg-muted">
                      {getCurrencyIcon(paymentData.currency)}
                    </div>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={paymentData.amount}
                      onChange={(e) => setPaymentData(prev => ({ ...prev, amount: e.target.value }))}
                      className="rounded-l-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select
                    value={paymentData.currency}
                    onValueChange={(value) => setPaymentData(prev => ({ ...prev, currency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="CAD">CAD ($)</SelectItem>
                      <SelectItem value="AUD">AUD ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={paymentData.description}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Payment description"
                />
              </div>

              <div className="space-y-2">
                <Label>Payment Type</Label>
                <Select
                  value={paymentData.paymentType}
                  onValueChange={(value) => setPaymentData(prev => ({ ...prev, paymentType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one-time">One-time Payment</SelectItem>
                    <SelectItem value="subscription">Subscription</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {paymentData.paymentType === 'subscription' && (
                <div className="space-y-2">
                  <Label>Billing Interval</Label>
                  <Select
                    value={paymentData.intervalType}
                    onValueChange={(value) => setPaymentData(prev => ({ ...prev, intervalType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Providers */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center">
                  <div className="w-6 h-6 bg-blue-600 rounded mr-2 flex items-center justify-center">
                    <span className="text-xs text-white font-bold">P</span>
                  </div>
                  PayPal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={createPayPalPaymentLink}
                  disabled={loading || !paymentData.amount}
                  className="w-full"
                  variant="outline"
                >
                  Create PayPal Link
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center">
                  <div className="w-6 h-6 bg-purple-600 rounded mr-2 flex items-center justify-center">
                    <span className="text-xs text-white font-bold">S</span>
                  </div>
                  Stripe
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={createStripePaymentLink}
                  disabled={loading || !paymentData.amount}
                  className="w-full"
                  variant="outline"
                >
                  Create Stripe Link
                </Button>
                <p className="text-xs text-muted-foreground mt-2">Requires Stripe setup</p>
              </CardContent>
            </Card>
          </div>

          {/* Active Payment Links */}
          {paymentLinks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Active Payment Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {paymentLinks.map((link) => (
                  <div key={link.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{link.provider}</Badge>
                        <span className="font-medium">
                          {getCurrencySymbol(link.currency)}{link.amount}
                        </span>
                        {link.paymentType === 'subscription' && (
                          <Badge variant="secondary">{link.intervalType}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{link.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyPaymentLink(link.url)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(link.url, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}