import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { CheckCircle, AlertCircle, CreditCard, DollarSign } from 'lucide-react';

const paymentProviders = [
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Accept credit card payments with industry-leading security',
    icon: <CreditCard className="h-6 w-6" />,
    status: 'available',
    fields: [
      { name: 'publishableKey', label: 'Publishable Key', placeholder: 'pk_live_xxx' },
      { name: 'secretKey', label: 'Secret Key', type: 'password', placeholder: 'sk_live_xxx' },
      { name: 'webhookSecret', label: 'Webhook Secret', type: 'password', placeholder: 'whsec_xxx' }
    ]
  },
  {
    id: 'square',
    name: 'Square',
    description: 'Accept payments with Square platform',
    icon: <CreditCard className="h-6 w-6" />,
    status: 'available',
    fields: [
      { name: 'applicationId', label: 'Application ID', placeholder: 'Square Application ID' },
      { name: 'accessToken', label: 'Access Token', type: 'password', placeholder: 'Square Access Token' },
      { name: 'locationId', label: 'Location ID', placeholder: 'Square Location ID' }
    ]
  }
];

export default function PaymentIntegration() {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [testMode, setTestMode] = useState(true);

  const handleConnect = async (providerId: string) => {
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Success",
        description: `${paymentProviders.find(p => p.id === providerId)?.name} connected successfully!`,
      });
      
      setSelectedProvider(null);
      setFormData({});
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect payment provider. Please check your credentials.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (providerId: string) => {
    toast({
      title: "Payment Provider Disconnected",
      description: `${paymentProviders.find(p => p.id === providerId)?.name} has been disconnected.`,
    });
  };

  const testConnection = async (providerId: string) => {
    setLoading(true);
    
    try {
      // Simulate test transaction
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Test Successful",
        description: `${paymentProviders.find(p => p.id === providerId)?.name} connection test passed!`,
      });
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "Connection test failed. Please check your configuration.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <CreditCard className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge variant="default">Connected</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Available</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        {paymentProviders.map((provider) => (
          <Card key={provider.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(provider.status)}
                  <div className="flex items-center space-x-2">
                    {provider.icon}
                    <div>
                      <CardTitle className="text-lg">{provider.name}</CardTitle>
                      <CardDescription>{provider.description}</CardDescription>
                    </div>
                  </div>
                </div>
                {getStatusBadge(provider.status)}
              </div>
            </CardHeader>
            <CardContent>
              {selectedProvider === provider.id ? (
                <div className="space-y-4">
                  <Separator />
                  <div className="flex items-center space-x-2 mb-4">
                    <input
                      type="checkbox"
                      id="testMode"
                      checked={testMode}
                      onChange={(e) => setTestMode(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="testMode">Test Mode (Use sandbox credentials)</Label>
                  </div>
                  
                  <div className="grid gap-4">
                    {provider.fields.map((field) => (
                      <div key={field.name} className="space-y-2">
                        <Label htmlFor={field.name}>{field.label}</Label>
                        <Input
                          id={field.name}
                          type={field.type || 'text'}
                          placeholder={field.placeholder}
                          value={formData[field.name] || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            [field.name]: e.target.value
                          }))}
                        />
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={() => handleConnect(provider.id)}
                      disabled={loading}
                    >
                      {loading ? 'Connecting...' : 'Connect'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => testConnection(provider.id)}
                      disabled={loading}
                    >
                      Test Connection
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedProvider(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  {provider.status === 'connected' ? (
                    <>
                      <Button 
                        variant="outline" 
                        onClick={() => setSelectedProvider(provider.id)}
                      >
                        Reconfigure
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => testConnection(provider.id)}
                      >
                        Test
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={() => handleDisconnect(provider.id)}
                      >
                        Disconnect
                      </Button>
                    </>
                  ) : (
                    <Button 
                      onClick={() => setSelectedProvider(provider.id)}
                    >
                      Connect
                    </Button>
                  )}
                </div>
              )}
              
              {provider.status === 'connected' && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-700">
                    ✓ Ready to accept payments through this provider
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Webhook Configuration</CardTitle>
          <CardDescription>
            Configure webhook endpoints for payment notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="webhookUrl">Webhook URL</Label>
            <Input
              id="webhookUrl"
              placeholder="https://yoursite.com/api/webhooks/payment"
              defaultValue={`${window.location.origin}/api/webhooks/payment`}
            />
            <p className="text-xs text-muted-foreground">
              This URL will receive payment status updates from your payment providers
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="webhookSecret">Webhook Secret</Label>
            <Input
              id="webhookSecret"
              type="password"
              placeholder="Enter a secure webhook secret"
            />
            <p className="text-xs text-muted-foreground">
              Used to verify webhook authenticity
            </p>
          </div>
          
          <Button>Save Webhook Configuration</Button>
        </CardContent>
      </Card>
    </div>
  );
}