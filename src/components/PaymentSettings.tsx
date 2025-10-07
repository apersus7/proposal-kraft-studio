import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CreditCard, Shield, Eye, EyeOff } from 'lucide-react';

interface PaymentSettings {
  stripe_publishable_key?: string;
  stripe_secret_key?: string;
  paypal_client_id?: string;
  paypal_client_secret?: string;
  paypal_environment: 'sandbox' | 'live';
}

export default function PaymentSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<PaymentSettings>({
    paypal_environment: 'sandbox'
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState({
    stripe_secret: false,
    paypal_secret: false
  });

  useEffect(() => {
    if (user) {
      loadPaymentSettings();
    }
  }, [user]);

  const loadPaymentSettings = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_payment_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings({
          stripe_publishable_key: data.stripe_publishable_key || '',
          stripe_secret_key: data.stripe_secret_key || '',
          paypal_client_id: data.paypal_client_id || '',
          paypal_client_secret: data.paypal_client_secret || '',
          paypal_environment: (data.paypal_environment as 'sandbox' | 'live') || 'sandbox'
        });
      }
    } catch (error) {
      console.error('Error loading payment settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payment settings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const savePaymentSettings = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_payment_settings')
        .upsert({
          user_id: user.id,
          ...settings
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Payment settings saved successfully'
      });
    } catch (error) {
      console.error('Error saving payment settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save payment settings',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof PaymentSettings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const toggleSecretVisibility = (field: 'stripe_secret' | 'paypal_secret') => {
    setShowSecrets(prev => ({ ...prev, [field]: !prev[field] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CreditCard className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Payment Settings</h2>
          <p className="text-muted-foreground">Configure your payment processing accounts</p>
        </div>
      </div>

      {/* Stripe Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#635BFF] rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">S</span>
            </div>
            Stripe Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stripe_publishable_key">Publishable Key</Label>
              <Input
                id="stripe_publishable_key"
                placeholder="pk_test_..."
                value={settings.stripe_publishable_key || ''}
                onChange={(e) => updateSetting('stripe_publishable_key', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Your Stripe publishable key (starts with pk_)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="stripe_secret_key">Secret Key</Label>
              <div className="relative">
                <Input
                  id="stripe_secret_key"
                  type={showSecrets.stripe_secret ? 'text' : 'password'}
                  placeholder="sk_test_..."
                  value={settings.stripe_secret_key || ''}
                  onChange={(e) => updateSetting('stripe_secret_key', e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => toggleSecretVisibility('stripe_secret')}
                >
                  {showSecrets.stripe_secret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Your Stripe secret key (starts with sk_)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PayPal Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#0070BA] rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">PP</span>
            </div>
            PayPal Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="paypal_environment">Environment</Label>
            <Select
              value={settings.paypal_environment}
              onValueChange={(value: 'sandbox' | 'live') => setSettings(prev => ({ ...prev, paypal_environment: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                <SelectItem value="live">Live (Production)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paypal_client_id">Client ID</Label>
              <Input
                id="paypal_client_id"
                placeholder="Your PayPal Client ID"
                value={settings.paypal_client_id || ''}
                onChange={(e) => updateSetting('paypal_client_id', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paypal_client_secret">Client Secret</Label>
              <div className="relative">
                <Input
                  id="paypal_client_secret"
                  type={showSecrets.paypal_secret ? 'text' : 'password'}
                  placeholder="Your PayPal Client Secret"
                  value={settings.paypal_client_secret || ''}
                  onChange={(e) => updateSetting('paypal_client_secret', e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => toggleSecretVisibility('paypal_secret')}
                >
                  {showSecrets.paypal_secret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-medium text-amber-800">Security Notice</h4>
              <p className="text-sm text-amber-700">
                Your payment credentials are encrypted and stored securely. They are only used to process payments for your proposals and are never shared with third parties.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={savePaymentSettings} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}