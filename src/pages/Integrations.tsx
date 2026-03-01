import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, CheckCircle2, CreditCard, Key, ExternalLink, Save, Plus, Trash2, Globe, Webhook, KeyRound } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface Keys {
  stripe_key: string;
  paypal_key: string;
  razorpay_key: string;
}

interface CustomIntegration {
  id: string;
  name: string;
  type: 'webhook' | 'api_key' | 'payment_gateway';
  value: string;
  endpoint?: string;
}

export default function Integrations() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [keys, setKeys] = useState<Keys>({ stripe_key: '', paypal_key: '', razorpay_key: '' });
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [customIntegrations, setCustomIntegrations] = useState<CustomIntegration[]>([]);
  const [newCustom, setNewCustom] = useState<CustomIntegration>({ id: '', name: '', type: 'webhook', value: '', endpoint: '' });

  useEffect(() => {
    if (user) fetchKeys();
  }, [user]);

  const fetchKeys = async () => {
    // Don't fetch secret keys back to the client - only check if they exist
    // Keys are write-only from client side for security
    const { data } = await (supabase as any)
      .from('profiles')
      .select('stripe_key, paypal_key, razorpay_key')
      .eq('user_id', user?.id)
      .single();
    if (data) {
      // Only show that keys are configured, not their values
      setKeys({
        stripe_key: data.stripe_key ? '••••••••' : '',
        paypal_key: data.paypal_key ? '••••••••' : '',
        razorpay_key: data.razorpay_key ? '••••••••' : '',
      });
    }
    setLoaded(true);
  };

  const handleSave = async () => {
    setSaving(true);
    // Only send keys that were actually changed (not masked placeholder values)
    const updateData: Record<string, string> = { user_id: user?.id };
    if (keys.stripe_key && keys.stripe_key !== '••••••••') updateData.stripe_key = keys.stripe_key;
    if (keys.paypal_key && keys.paypal_key !== '••••••••') updateData.paypal_key = keys.paypal_key;
    if (keys.razorpay_key && keys.razorpay_key !== '••••••••') updateData.razorpay_key = keys.razorpay_key;
    
    const { error } = await (supabase as any)
      .from('profiles')
      .upsert(updateData, { onConflict: 'user_id' });
    if (error) {
      toast({ title: 'Failed to save keys', variant: 'destructive' });
    } else {
      toast({ title: 'Integration keys saved!' });
    }
    setSaving(false);
  };

  const addCustomIntegration = () => {
    if (!newCustom.name.trim() || !newCustom.value.trim()) {
      toast({ title: 'Please fill in name and value', variant: 'destructive' });
      return;
    }
    setCustomIntegrations(prev => [...prev, { ...newCustom, id: crypto.randomUUID() }]);
    setNewCustom({ id: '', name: '', type: 'webhook', value: '', endpoint: '' });
    toast({ title: 'Custom integration added!' });
  };

  const removeCustomIntegration = (id: string) => {
    setCustomIntegrations(prev => prev.filter(i => i.id !== id));
    toast({ title: 'Integration removed' });
  };

  const gateways = [
    {
      id: 'stripe',
      name: 'Stripe',
      description: 'Accept credit cards, Apple Pay, Google Pay and more.',
      logo: (
        <div className="w-10 h-10 rounded-xl bg-[#635BFF] flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-white" />
        </div>
      ),
      docsUrl: 'https://dashboard.stripe.com/apikeys',
      field: 'stripe_key' as keyof Keys,
      placeholder: 'pk_live_...',
      label: 'Publishable Key',
    },
    {
      id: 'paypal',
      name: 'PayPal',
      description: 'Let clients pay via PayPal, Venmo, and credit cards.',
      logo: (
        <div className="w-10 h-10 rounded-xl bg-[#003087] flex items-center justify-center">
          <span className="text-white text-sm font-bold">PP</span>
        </div>
      ),
      docsUrl: 'https://developer.paypal.com/dashboard/applications',
      field: 'paypal_key' as keyof Keys,
      placeholder: 'AXxxxxxxxx...',
      label: 'Client ID',
    },
    {
      id: 'razorpay',
      name: 'Razorpay',
      description: 'Accept payments in INR and international currencies.',
      logo: (
        <div className="w-10 h-10 rounded-xl bg-[#072654] flex items-center justify-center">
          <Key className="w-5 h-5 text-white" />
        </div>
      ),
      docsUrl: 'https://dashboard.razorpay.com/app/keys',
      field: 'razorpay_key' as keyof Keys,
      placeholder: 'rzp_live_...',
      label: 'Key ID',
    },
  ];

  const typeIcon = { webhook: <Webhook className="h-4 w-4" />, api_key: <KeyRound className="h-4 w-4" />, payment_gateway: <Globe className="h-4 w-4" /> };
  const typeLabel = { webhook: 'Webhook', api_key: 'API Key', payment_gateway: 'Payment Gateway' };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-lg font-bold">Integrations</h1>
          <p className="text-xs text-muted-foreground">Connect payment gateways and custom integrations</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <Tabs defaultValue="gateways">
          <TabsList className="w-full mb-6">
            <TabsTrigger value="gateways" className="flex-1">Payment Gateways</TabsTrigger>
            <TabsTrigger value="custom" className="flex-1">Custom Integrations</TabsTrigger>
          </TabsList>

          {/* Payment Gateways Tab */}
          <TabsContent value="gateways" className="space-y-6">
            {gateways.map((gw) => {
              const isConnected = !!keys[gw.field];
              return (
                <div key={gw.id} className="rounded-2xl border border-border bg-card p-6 space-y-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      {gw.logo}
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-semibold text-base">{gw.name}</h2>
                          {isConnected && (
                            <span className="flex items-center gap-1 text-xs text-primary font-medium">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Connected
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5 max-w-md">{gw.description}</p>
                      </div>
                    </div>
                    <a href={gw.docsUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 shrink-0 mt-1">
                      Get key <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">{gw.label}</Label>
                    <Input value={keys[gw.field]} onChange={e => setKeys(prev => ({ ...prev, [gw.field]: e.target.value }))} placeholder={gw.placeholder} type="password" className="mt-1 font-mono text-sm" />
                  </div>
                </div>
              );
            })}
            <Button onClick={handleSave} disabled={saving} className="w-full h-11 text-sm font-semibold">
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save All Keys'}
            </Button>
          </TabsContent>

          {/* Custom Integrations Tab */}
          <TabsContent value="custom" className="space-y-6">
            {/* Add new */}
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <h2 className="font-semibold text-base">Add Custom Integration</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Name</Label>
                  <Input value={newCustom.name} onChange={e => setNewCustom(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g. My CRM Webhook" className="mt-1 text-sm" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Type</Label>
                  <Select value={newCustom.type} onValueChange={(val) => setNewCustom(prev => ({ ...prev, type: val as CustomIntegration['type'] }))}>
                    <SelectTrigger className="mt-1 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="webhook">Webhook URL</SelectItem>
                      <SelectItem value="api_key">API Key</SelectItem>
                      <SelectItem value="payment_gateway">Payment Gateway</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  {newCustom.type === 'webhook' ? 'Webhook URL' : newCustom.type === 'api_key' ? 'API Key' : 'API Key / Token'}
                </Label>
                <Input
                  value={newCustom.value}
                  onChange={e => setNewCustom(prev => ({ ...prev, value: e.target.value }))}
                  placeholder={newCustom.type === 'webhook' ? 'https://hooks.example.com/...' : 'sk_...'}
                  type={newCustom.type !== 'webhook' ? 'password' : 'text'}
                  className="mt-1 font-mono text-sm"
                />
              </div>
              {newCustom.type === 'payment_gateway' && (
                <div>
                  <Label className="text-xs text-muted-foreground">Endpoint URL</Label>
                  <Input value={newCustom.endpoint || ''} onChange={e => setNewCustom(prev => ({ ...prev, endpoint: e.target.value }))} placeholder="https://api.gateway.com/v1/charge" className="mt-1 font-mono text-sm" />
                </div>
              )}
              <Button onClick={addCustomIntegration} className="w-full h-10 text-sm font-semibold">
                <Plus className="h-4 w-4 mr-2" /> Add Integration
              </Button>
            </div>

            {/* List */}
            {customIntegrations.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">Your Custom Integrations</h3>
                {customIntegrations.map((ci) => (
                  <div key={ci.id} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                        {typeIcon[ci.type]}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{ci.name}</p>
                        <p className="text-xs text-muted-foreground">{typeLabel[ci.type]} · {ci.type === 'webhook' ? ci.value.slice(0, 40) + '...' : '••••••••'}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => removeCustomIntegration(ci.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {customIntegrations.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No custom integrations yet. Add one above to get started.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
