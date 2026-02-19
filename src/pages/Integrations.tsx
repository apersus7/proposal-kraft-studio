import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CheckCircle2, CreditCard, Key, ExternalLink, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface Keys {
  stripe_key: string;
  paypal_key: string;
  razorpay_key: string;
}

export default function Integrations() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [keys, setKeys] = useState<Keys>({ stripe_key: '', paypal_key: '', razorpay_key: '' });
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (user) fetchKeys();
  }, [user]);

  const fetchKeys = async () => {
    const { data } = await (supabase as any)
      .from('profiles')
      .select('stripe_key, paypal_key, razorpay_key')
      .eq('user_id', user?.id)
      .single();
    if (data) {
      setKeys({
        stripe_key: data.stripe_key || '',
        paypal_key: data.paypal_key || '',
        razorpay_key: data.razorpay_key || '',
      });
    }
    setLoaded(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await (supabase as any)
      .from('profiles')
      .upsert({ user_id: user?.id, ...keys }, { onConflict: 'user_id' });
    if (error) {
      toast({ title: 'Failed to save keys', variant: 'destructive' });
    } else {
      toast({ title: 'Integration keys saved!' });
    }
    setSaving(false);
  };

  const gateways = [
    {
      id: 'stripe',
      name: 'Stripe',
      description: 'Accept credit cards, Apple Pay, Google Pay and more. Add your publishable key to generate payment links inside proposals.',
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
      description: 'Let clients pay via PayPal, Venmo, and credit cards. Add your Client ID to embed PayPal checkout in proposals.',
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
      description: 'Accept payments in INR and international currencies. Add your Key ID to enable Razorpay checkout in proposals.',
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-lg font-bold">Integrations</h1>
          <p className="text-xs text-muted-foreground">Connect payment gateways to embed checkout links in your proposals</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {gateways.map((gw) => {
          const isConnected = !!keys[gw.field];
          return (
            <div
              key={gw.id}
              className="rounded-2xl border border-border bg-card p-6 space-y-5"
            >
              {/* Gateway header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  {gw.logo}
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-base">{gw.name}</h2>
                      {isConnected && (
                        <span className="flex items-center gap-1 text-xs text-primary font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Connected
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5 max-w-md">{gw.description}</p>
                  </div>
                </div>
                <a
                  href={gw.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1 shrink-0 mt-1"
                >
                  Get key <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              {/* Key input */}
              <div>
                <Label className="text-xs text-muted-foreground">{gw.label}</Label>
                <Input
                  value={keys[gw.field]}
                  onChange={e => setKeys(prev => ({ ...prev, [gw.field]: e.target.value }))}
                  placeholder={gw.placeholder}
                  type="password"
                  className="mt-1 font-mono text-sm"
                />
              </div>
            </div>
          );
        })}

        <Button onClick={handleSave} disabled={saving} className="w-full h-11 text-sm font-semibold">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save All Keys'}
        </Button>
      </div>
    </div>
  );
}
