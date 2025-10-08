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
}

export default function PaymentIntegration() {
  const [settings, setSettings] = useState<PaymentSettings>({
    stripe_publishable_key: null,
    stripe_secret_key: null,
  });
  const [loading, setLoading] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    fetchPaymentSettings();
  }, []);

  const fetchPaymentSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('user_payment_settings')
        .select('stripe_publishable_key, stripe_secret_key')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSettings({
          stripe_publishable_key: data.stripe_publishable_key,
          stripe_secret_key: data.stripe_secret_key,
        });
        setIsConfigured(!!(data.stripe_publishable_key && data.stripe_secret_key));
      }
    } catch (error) {
      console.error('Error fetching payment settings:', error);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings.stripe_publishable_key || !settings.stripe_secret_key) {
      toast({
        title: 'Validation Error',
        description: 'Please provide both publishable and secret keys',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_payment_settings')
        .upsert({
          user_id: user.id,
          stripe_publishable_key: settings.stripe_publishable_key,
          stripe_secret_key: settings.stripe_secret_key,
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Stripe settings saved successfully',
      });

      setIsConfigured(true);
    } catch (error) {
      console.error('Error saving payment settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save Stripe settings',
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
                Stripe Payment Configuration
              </CardTitle>
              <CardDescription>
                Configure Stripe to send payment links to your clients
              </CardDescription>
            </div>
            {isConfigured && (
              <Badge variant="default" className="flex items-center gap-1">
                <Check className="h-3 w-3" />
                Configured
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
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
            <p className="text-xs text-muted-foreground">
              Your Stripe publishable key (starts with pk_)
            </p>
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
                {showSecretKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Your Stripe secret key (starts with sk_) - keep this secure!
            </p>
          </div>

          <Button onClick={handleSaveSettings} disabled={loading}>
            {loading ? 'Saving...' : 'Save Stripe Settings'}
          </Button>

          {isConfigured && (
            <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Next Steps:</h4>
              <p className="text-sm text-muted-foreground">
                You can now generate payment links from your proposals. When viewing a proposal, 
                you'll see an option to create a payment link that you can share with your clients.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
