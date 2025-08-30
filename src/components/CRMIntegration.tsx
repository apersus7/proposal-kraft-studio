import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { CheckCircle, AlertCircle, Settings } from 'lucide-react';

const integrations = [
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'Industry-leading CRM platform',
    status: 'available',
    fields: [
      { name: 'instanceUrl', label: 'Instance URL', placeholder: 'https://yourcompany.salesforce.com' },
      { name: 'clientId', label: 'Client ID', placeholder: 'OAuth Client ID' },
      { name: 'clientSecret', label: 'Client Secret', type: 'password' }
    ]
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'All-in-one marketing, sales, and service platform',
    status: 'available',
    fields: [
      { name: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Your HubSpot API Key' },
      { name: 'portalId', label: 'Portal ID', placeholder: 'Your HubSpot Portal ID' }
    ]
  },
  {
    id: 'pipedrive',
    name: 'Pipedrive',
    description: 'Simple and effective sales CRM',
    status: 'connected',
    fields: [
      { name: 'apiToken', label: 'API Token', type: 'password', placeholder: 'Your Pipedrive API Token' },
      { name: 'companyDomain', label: 'Company Domain', placeholder: 'yourcompany.pipedrive.com' }
    ]
  },
  {
    id: 'zoho',
    name: 'Zoho CRM',
    description: 'Complete customer relationship management',
    status: 'available',
    fields: [
      { name: 'clientId', label: 'Client ID', placeholder: 'Zoho OAuth Client ID' },
      { name: 'clientSecret', label: 'Client Secret', type: 'password' },
      { name: 'refreshToken', label: 'Refresh Token', type: 'password' }
    ]
  }
];

export default function CRMIntegration() {
  const [selectedCRM, setSelectedCRM] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});

  const handleConnect = async (crmId: string) => {
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Success",
        description: `${integrations.find(i => i.id === crmId)?.name} connected successfully!`,
      });
      
      setSelectedCRM(null);
      setFormData({});
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect CRM. Please check your credentials.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (crmId: string) => {
    toast({
      title: "CRM Disconnected",
      description: `${integrations.find(i => i.id === crmId)?.name} has been disconnected.`,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Settings className="h-4 w-4 text-muted-foreground" />;
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
        {integrations.map((integration) => (
          <Card key={integration.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(integration.status)}
                  <div>
                    <CardTitle className="text-lg">{integration.name}</CardTitle>
                    <CardDescription>{integration.description}</CardDescription>
                  </div>
                </div>
                {getStatusBadge(integration.status)}
              </div>
            </CardHeader>
            <CardContent>
              {selectedCRM === integration.id ? (
                <div className="space-y-4">
                  <Separator />
                  <div className="grid gap-4">
                    {integration.fields.map((field) => (
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
                      onClick={() => handleConnect(integration.id)}
                      disabled={loading}
                    >
                      {loading ? 'Connecting...' : 'Connect'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedCRM(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  {integration.status === 'connected' ? (
                    <>
                      <Button 
                        variant="outline" 
                        onClick={() => setSelectedCRM(integration.id)}
                      >
                        Reconfigure
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={() => handleDisconnect(integration.id)}
                      >
                        Disconnect
                      </Button>
                    </>
                  ) : (
                    <Button 
                      onClick={() => setSelectedCRM(integration.id)}
                    >
                      Connect
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}