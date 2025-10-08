import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Trash2, Eye, EyeOff } from 'lucide-react';

interface Webhook {
  id: string;
  name: string;
  webhook_url: string;
  events: string[];
  secret: string | null;
  is_active: boolean;
}

const AVAILABLE_EVENTS = [
  { value: 'proposal.viewed', label: 'Proposal Viewed' },
  { value: 'proposal.signed', label: 'Proposal Signed' },
  { value: 'proposal.created', label: 'Proposal Created' },
  { value: 'payment.completed', label: 'Payment Completed' },
];

export default function WebhookIntegration() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewWebhook, setShowNewWebhook] = useState(false);
  const [showSecret, setShowSecret] = useState<string | null>(null);
  const [newWebhook, setNewWebhook] = useState({
    name: '',
    webhook_url: '',
    events: [] as string[],
    secret: '',
  });

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    try {
      const { data, error } = await supabase
        .from('webhook_configurations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWebhooks(data || []);
    } catch (error) {
      console.error('Error fetching webhooks:', error);
      toast({
        title: 'Error',
        description: 'Failed to load webhooks',
        variant: 'destructive',
      });
    }
  };

  const handleCreateWebhook = async () => {
    if (!newWebhook.name || !newWebhook.webhook_url || newWebhook.events.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('webhook_configurations')
        .insert({
          user_id: user.id,
          name: newWebhook.name,
          webhook_url: newWebhook.webhook_url,
          events: newWebhook.events,
          secret: newWebhook.secret || null,
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Webhook created successfully',
      });

      setNewWebhook({ name: '', webhook_url: '', events: [], secret: '' });
      setShowNewWebhook(false);
      fetchWebhooks();
    } catch (error) {
      console.error('Error creating webhook:', error);
      toast({
        title: 'Error',
        description: 'Failed to create webhook',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleWebhook = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('webhook_configurations')
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Webhook ${!isActive ? 'enabled' : 'disabled'}`,
      });

      fetchWebhooks();
    } catch (error) {
      console.error('Error toggling webhook:', error);
      toast({
        title: 'Error',
        description: 'Failed to update webhook',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;

    try {
      const { error } = await supabase
        .from('webhook_configurations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Webhook deleted successfully',
      });

      fetchWebhooks();
    } catch (error) {
      console.error('Error deleting webhook:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete webhook',
        variant: 'destructive',
      });
    }
  };

  const toggleEventSelection = (event: string) => {
    setNewWebhook(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Webhook Endpoints</h3>
          <p className="text-sm text-muted-foreground">
            Configure webhooks to receive real-time notifications
          </p>
        </div>
        <Button onClick={() => setShowNewWebhook(true)} disabled={showNewWebhook}>
          <Plus className="h-4 w-4 mr-2" />
          Add Webhook
        </Button>
      </div>

      {showNewWebhook && (
        <Card>
          <CardHeader>
            <CardTitle>New Webhook</CardTitle>
            <CardDescription>Configure a new webhook endpoint</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhook-name">Name</Label>
              <Input
                id="webhook-name"
                placeholder="My Webhook"
                value={newWebhook.name}
                onChange={(e) => setNewWebhook(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhook-url">Webhook URL</Label>
              <Input
                id="webhook-url"
                type="url"
                placeholder="https://your-domain.com/webhook"
                value={newWebhook.webhook_url}
                onChange={(e) => setNewWebhook(prev => ({ ...prev, webhook_url: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Events to Subscribe</Label>
              <div className="grid grid-cols-2 gap-2">
                {AVAILABLE_EVENTS.map(event => (
                  <div key={event.value} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={event.value}
                      checked={newWebhook.events.includes(event.value)}
                      onChange={() => toggleEventSelection(event.value)}
                      className="rounded border-input"
                    />
                    <Label htmlFor={event.value} className="font-normal cursor-pointer">
                      {event.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhook-secret">Secret (Optional)</Label>
              <Input
                id="webhook-secret"
                type="password"
                placeholder="webhook_secret_123"
                value={newWebhook.secret}
                onChange={(e) => setNewWebhook(prev => ({ ...prev, secret: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Used to verify webhook authenticity
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreateWebhook} disabled={loading}>
                {loading ? 'Creating...' : 'Create Webhook'}
              </Button>
              <Button variant="outline" onClick={() => setShowNewWebhook(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {webhooks.length === 0 && !showNewWebhook ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No webhooks configured yet. Click "Add Webhook" to create one.
            </CardContent>
          </Card>
        ) : (
          webhooks.map(webhook => (
            <Card key={webhook.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{webhook.name}</h4>
                      <Badge variant={webhook.is_active ? 'default' : 'secondary'}>
                        {webhook.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground font-mono">
                      {webhook.webhook_url}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {webhook.events.map(event => (
                        <Badge key={event} variant="outline" className="text-xs">
                          {AVAILABLE_EVENTS.find(e => e.value === event)?.label || event}
                        </Badge>
                      ))}
                    </div>
                    {webhook.secret && (
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {showSecret === webhook.id ? webhook.secret : '••••••••'}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowSecret(showSecret === webhook.id ? null : webhook.id)}
                        >
                          {showSecret === webhook.id ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={webhook.is_active}
                      onCheckedChange={() => handleToggleWebhook(webhook.id, webhook.is_active)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteWebhook(webhook.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
