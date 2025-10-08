import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, Link as LinkIcon, Copy, Check, ExternalLink } from 'lucide-react';

interface PaymentLinkGeneratorProps {
  proposalId: string;
  proposalWorth: number;
}

export default function PaymentLinkGenerator({ proposalId, proposalWorth }: PaymentLinkGeneratorProps) {
  const [amount, setAmount] = useState(proposalWorth.toString());
  const [currency, setCurrency] = useState('usd');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [isStripeConfigured, setIsStripeConfigured] = useState(false);
  const [isPayPalConfigured, setIsPayPalConfigured] = useState(false);
  const [copied, setCopied] = useState(false);
  const [existingLinks, setExistingLinks] = useState<any[]>([]);
  const [paymentProvider, setPaymentProvider] = useState<'stripe' | 'paypal'>('stripe');

  useEffect(() => {
    checkStripeConfiguration();
    fetchExistingLinks();
  }, []);

  const checkStripeConfiguration = async () => {
    try {
      const { data, error } = await supabase
        .from('user_payment_settings')
        .select('stripe_publishable_key, stripe_secret_key, paypal_client_id_custom, paypal_merchant_id')
        .maybeSingle();

      if (!error && data) {
        if (data.stripe_publishable_key && data.stripe_secret_key) {
          setIsStripeConfigured(true);
        }
        if (data.paypal_client_id_custom && data.paypal_merchant_id) {
          setIsPayPalConfigured(true);
        }
      }
    } catch (error) {
      console.error('Error checking payment configuration:', error);
    }
  };

  const fetchExistingLinks = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_links')
        .select('*')
        .eq('proposal_id', proposalId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setExistingLinks(data);
      }
    } catch (error) {
      console.error('Error fetching payment links:', error);
    }
  };

  const handleGenerateLink = async () => {
    const isConfigured = paymentProvider === 'stripe' ? isStripeConfigured : isPayPalConfigured;
    
    if (!isConfigured) {
      toast({
        title: `${paymentProvider === 'stripe' ? 'Stripe' : 'PayPal'} Not Configured`,
        description: `Please configure your ${paymentProvider === 'stripe' ? 'Stripe' : 'PayPal'} settings in the Settings page first.`,
        variant: 'destructive',
      });
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount greater than 0',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const functionName = paymentProvider === 'stripe' ? 'create-payment-link' : 'create-paypal-payment-link';
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: {
          amount: numericAmount,
          currency,
          description: description || `Payment for Proposal ${proposalId.slice(0, 8)}`,
          proposal_id: proposalId,
        },
      });

      if (error) throw error;

      if (data?.payment_link) {
        setGeneratedLink(data.payment_link);
        toast({
          title: 'Success',
          description: `${paymentProvider === 'stripe' ? 'Stripe' : 'PayPal'} payment link generated successfully`,
        });
        fetchExistingLinks();
      }
    } catch (error: any) {
      console.error('Error generating payment link:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate payment link',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'Payment link copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy link',
        variant: 'destructive',
      });
    }
  };

  if (!isStripeConfigured && !isPayPalConfigured) {
    return (
      <div className="space-y-4">
        <div className="bg-muted/50 p-6 rounded-lg border-2 border-dashed text-center">
          <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold mb-2">Payment Provider Not Configured</h3>
          <p className="text-sm text-muted-foreground mb-4">
            To generate payment links for your clients, configure Stripe or PayPal first.
          </p>
          <Button onClick={() => window.open('/settings', '_blank')}>
            Go to Settings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Generate Payment Link</h4>
          <p className="text-sm text-muted-foreground">
            Create a secure payment link to share with your client
          </p>
        </div>

        <div className="flex gap-2 mb-2">
          {isStripeConfigured && (
            <Button
              variant={paymentProvider === 'stripe' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPaymentProvider('stripe')}
            >
              Stripe
            </Button>
          )}
          {isPayPalConfigured && (
            <Button
              variant={paymentProvider === 'paypal' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPaymentProvider('paypal')}
            >
              PayPal
            </Button>
          )}
        </div>

        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usd">USD ($)</SelectItem>
                  <SelectItem value="eur">EUR (€)</SelectItem>
                  <SelectItem value="gbp">GBP (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Website Development Project - First Payment"
              rows={2}
            />
          </div>

          <Button onClick={handleGenerateLink} disabled={loading} className="w-full">
            {loading ? (
              <>Generating...</>
            ) : (
              <>
                <LinkIcon className="h-4 w-4 mr-2" />
                Generate Payment Link
              </>
            )}
          </Button>
        </div>

        {generatedLink && (
          <Card className="p-4 bg-primary/5 border-primary/20">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Generated Link:</Label>
                <Badge variant="default">New</Badge>
              </div>
              <div className="flex gap-2">
                <Input value={generatedLink} readOnly className="flex-1 font-mono text-sm" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyLink(generatedLink)}
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <a href={generatedLink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      {existingLinks.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium">Previous Payment Links</h4>
          <div className="space-y-2">
            {existingLinks.map((link) => (
              <Card key={link.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">
                        {currency === 'eur' ? '€' : currency === 'gbp' ? '£' : '$'}
                        {link.amount}
                      </span>
                      <Badge variant={link.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                        {link.status}
                      </Badge>
                    </div>
                    {link.description && (
                      <p className="text-sm text-muted-foreground truncate">{link.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Created {new Date(link.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Badge variant="outline" className="text-xs">
                      {link.payment_provider === 'paypal' ? 'PayPal' : 'Stripe'}
                    </Badge>
                    {(link.stripe_payment_link_id || link.paypal_order_id) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const url = link.payment_provider === 'paypal' 
                            ? `https://www.paypal.com/paypalme/${link.paypal_order_id}/${link.amount}${link.currency.toUpperCase()}`
                            : `https://buy.stripe.com/${link.stripe_payment_link_id}`;
                          handleCopyLink(url);
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
