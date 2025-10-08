import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, Eye, EyeOff, Check } from 'lucide-react';

interface PaymentSettings {
  stripe_publishable_key: string | null;
  stripe_secret_key: string | null;
  paypal_client_id_custom: string | null;
  paypal_merchant_id: string | null;
}

export default function PaymentIntegration() {
  const [settings, setSettings] = useState<PaymentSettings>({
    stripe_publishable_key: null,
    stripe_secret_key: null,
    paypal_client_id_custom: null,
    paypal_merchant_id: null,
  });
  const [loading, setLoading] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showPayPalSecret, setShowPayPalSecret] = useState(false);
  const [isStripeConfigured, setIsStripeConfigured] = useState(false);
  const [isPayPalConfigured, setIsPayPalConfigured] = useState(false);
  const [activeProvider, setActiveProvider] = useState<'stripe' | 'paypal'>('stripe');

  useEffect(() => {
    fetchPaymentSettings();
  }, []);

  const fetchPaymentSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('user_payment_settings')
        .select('stripe_publishable_key, stripe_secret_key, paypal_client_id_custom, paypal_merchant_id')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          stripe_publishable_key: data.stripe_publishable_key,
          stripe_secret_key: data.stripe_secret_key,
          paypal_client_id_custom: data.paypal_client_id_custom,
          paypal_merchant_id: data.paypal_merchant_id,
        });
        setIsStripeConfigured(!!(data.stripe_publishable_key && data.stripe_secret_key));
        setIsPayPalConfigured(!!(data.paypal_client_id_custom && data.paypal_merchant_id));
      }
    } catch (error) {
      console.error('Error fetching payment settings:', error);
    }
  };

  const handleSaveSettings = async () => {
    if (activeProvider === 'stripe') {
      if (!settings.stripe_publishable_key || !settings.stripe_secret_key) {
        toast({
          title: 'Validation Error',
          description: 'Please provide both publishable and secret keys',
          variant: 'destructive',
        });
        return;
      }
    } else {
      if (!settings.paypal_client_id_custom || !settings.paypal_merchant_id) {
        toast({
          title: 'Validation Error',
          description: 'Please provide both PayPal Client ID and Merchant ID',
          variant: 'destructive',
        });
        return;
      }
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const updateData: any = { user_id: user.id };
      
      if (activeProvider === 'stripe') {
        updateData.stripe_publishable_key = settings.stripe_publishable_key;
        updateData.stripe_secret_key = settings.stripe_secret_key;
      } else {
        updateData.paypal_client_id_custom = settings.paypal_client_id_custom;
        updateData.paypal_merchant_id = settings.paypal_merchant_id;
      }

      const { error } = await supabase
        .from('user_payment_settings')
        .upsert(updateData);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `${activeProvider === 'stripe' ? 'Stripe' : 'PayPal'} settings saved successfully`,
      });

      if (activeProvider === 'stripe') {
        setIsStripeConfigured(true);
      } else {
        setIsPayPalConfigured(true);
      }
      
      fetchPaymentSettings();
    } catch (error) {
      console.error('Error saving payment settings:', error);
      toast({
        title: 'Error',
        description: `Failed to save ${activeProvider === 'stripe' ? 'Stripe' : 'PayPal'} settings`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Configuration
              </CardTitle>
              <CardDescription>
                Configure payment providers to send payment links to your clients
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {isStripeConfigured && (
                <Badge variant="default" className="flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  Stripe
                </Badge>
              )}
              {isPayPalConfigured && (
                <Badge variant="default" className="flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  PayPal
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 mb-4">
            <Button
              variant={activeProvider === 'stripe' ? 'default' : 'outline'}
              onClick={() => setActiveProvider('stripe')}
              className="flex-1"
            >
              Stripe
            </Button>
            <Button
              variant={activeProvider === 'paypal' ? 'default' : 'outline'}
              onClick={() => setActiveProvider('paypal')}
              className="flex-1"
            >
              PayPal
            </Button>
          </div>

          {activeProvider === 'stripe' ? (
            <>
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <h4 className="font-medium text-sm">How to get your Stripe keys:</h4>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Go to <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Stripe Dashboard</a></li>
                  <li>Click on "Developers" in the top right</li>
                  <li>Go to "API keys" section</li>
                  <li>Copy your publishable key (starts with pk_) and secret key (starts with sk_)</li>
                </ol>
              </div>

              <div className="space-y-2">
                <Label htmlFor="publishable-key">Publishable Key</Label>
                <Input
                  id="publishable-key"
                  placeholder="pk_test_..."
                  value={settings.stripe_publishable_key || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, stripe_publishable_key: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="secret-key">Secret Key</Label>
                <div className="relative">
                  <Input
                    id="secret-key"
                    type={showSecretKey ? 'text' : 'password'}
                    placeholder="sk_test_..."
                    value={settings.stripe_secret_key || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, stripe_secret_key: e.target.value }))}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowSecretKey(!showSecretKey)}
                  >
                    {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <h4 className="font-medium text-sm">How to get your PayPal credentials:</h4>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Go to <a href="https://developer.paypal.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">PayPal Developer</a></li>
                  <li>Log in and navigate to "My Apps & Credentials"</li>
                  <li>Create a new app or select existing one</li>
                  <li>Copy your Client ID and find your Merchant ID in account settings</li>
                </ol>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paypal-client-id">PayPal Client ID</Label>
                <Input
                  id="paypal-client-id"
                  placeholder="Your PayPal Client ID"
                  value={settings.paypal_client_id_custom || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, paypal_client_id_custom: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paypal-merchant-id">PayPal Merchant ID</Label>
                <div className="relative">
                  <Input
                    id="paypal-merchant-id"
                    type={showPayPalSecret ? 'text' : 'password'}
                    placeholder="Your PayPal Merchant ID"
                    value={settings.paypal_merchant_id || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, paypal_merchant_id: e.target.value }))}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPayPalSecret(!showPayPalSecret)}
                  >
                    {showPayPalSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </>
          )}

          <Button onClick={handleSaveSettings} disabled={loading}>
            {loading ? 'Saving...' : `Save ${activeProvider === 'stripe' ? 'Stripe' : 'PayPal'} Settings`}
          </Button>

          {(isStripeConfigured || isPayPalConfigured) && (
            <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Next Steps:</h4>
              <p className="text-sm text-muted-foreground">
                You can now generate payment links from your proposals using {isStripeConfigured && 'Stripe'}{isStripeConfigured && isPayPalConfigured && ' and '}{isPayPalConfigured && 'PayPal'}. 
                When viewing a proposal, you'll see an option to create a payment link that you can share with your clients.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
