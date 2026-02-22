import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Loader2, LogOut } from 'lucide-react';

const logo = '/lovable-uploads/22b8b905-b997-42da-85df-b966b4616f6e.png';

export default function Pricing() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const handleStartTrial = useCallback(async () => {
    if (!user) { navigate('/auth'); return; }
    setCheckoutLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('dodo-checkout', {
        body: { return_url: window.location.origin + '/dashboard' },
      });
      if (error) throw error;
      if (data?.checkout_url) window.location.href = data.checkout_url;
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
      setCheckoutLoading(false);
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex flex-col">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img src={logo} alt="Craft Proposal" className="h-8" />
              <h1 className="text-xl font-bold text-primary">Craft Proposal</h1>
            </div>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Pricing Content */}
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-3">Choose Your Plan</h2>
            <p className="text-muted-foreground text-lg">
              Subscribe to start creating professional proposals
            </p>
          </div>

          <Card className="relative overflow-hidden border-primary/50">
            <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
            <CardHeader className="text-center pb-2 pt-8">
              <Badge className="mx-auto mb-4 bg-primary/10 text-primary hover:bg-primary/10 border-primary/20">
                Most Popular
              </Badge>
              <CardTitle className="text-2xl sm:text-3xl">Pro Plan</CardTitle>
              <CardDescription className="text-base mt-2">
                Everything you need to win more clients
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-6 pb-8">
              <div>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl sm:text-5xl font-bold text-primary">$19</span>
                  <span className="text-muted-foreground text-lg">/month</span>
                </div>
                <p className="text-primary font-medium mt-2">7-day free trial included</p>
              </div>

              <ul className="text-left space-y-3 mx-auto max-w-xs">
                {[
                  'Unlimited AI-generated proposals',
                  'Custom branding & templates',
                  'E-signatures & payments',
                  'Client analytics & tracking',
                  'PDF & link sharing',
                  'Priority support',
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="h-4 w-4 text-primary flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                size="lg"
                className="w-full text-base"
                onClick={handleStartTrial}
                disabled={checkoutLoading}
              >
                {checkoutLoading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing...</>
                ) : (
                  'Start 7-Day Free Trial'
                )}
              </Button>
              <p className="text-xs text-muted-foreground">Cancel anytime</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
