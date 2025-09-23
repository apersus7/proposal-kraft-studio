import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  User, 
  Building, 
  CreditCard, 
  Zap, 
  Upload,
  Settings as SettingsIcon,
  Globe,
  Shield,
  Bell
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import CRMIntegration from '@/components/CRMIntegration';
import PaymentIntegration from '@/components/PaymentIntegration';
import { useSubscription } from '@/hooks/useSubscription';


const logo = '/lovable-uploads/22b8b905-b997-42da-85df-b966b4616f6e.png';

interface Profile {
  id: string;
  user_id: string;
  company_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}


export default function Settings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscription, loading: subscriptionLoading, refresh: refreshSubscription } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [subscriptionActionLoading, setSubscriptionActionLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchProfile();
  }, [user, navigate]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive"
      });
    }
  };

  const handleProfileUpdate = async (updates: Partial<Profile>) => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          ...profile,
          ...updates,
        });

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...updates } : null);
      toast({
        title: "Success",
        description: "Profile updated successfully"
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async () => {
    if (!logoFile || !user) return;

    setLoading(true);
    try {
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `${user.id}/logo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, logoFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('logos')
        .getPublicUrl(fileName);

      await handleProfileUpdate({ avatar_url: data.publicUrl });
      setLogoFile(null);
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: "Error",
        description: "Failed to upload logo",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };


  if (!user) return null;

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to subscribe to a plan.",
        variant: "destructive"
      });
      return;
    }

    setSubscriptionActionLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-paypal-subscription', {
        body: { planId }
      });

      if (error) {
        console.error('Subscription creation error:', error);
        throw new Error(error.message || 'Failed to create subscription');
      }

      if (data?.error) {
        console.error('PayPal error:', data.error);
        throw new Error(data.error);
      }

      if (data?.approvalUrl) {
        console.log('Redirecting to PayPal:', data.approvalUrl);
        // Redirect to PayPal for approval
        window.location.href = data.approvalUrl;
      } else {
        throw new Error('No approval URL received from PayPal');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: "Subscription Failed",
        description: error instanceof Error ? error.message : "Failed to create subscription. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubscriptionActionLoading(false);
      // Refresh subscription status after a delay
      setTimeout(() => refreshSubscription(), 2000);
    }
  };

  // Check for PayPal return parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paypalStatus = urlParams.get('paypal');
    
    if (paypalStatus === 'success') {
      toast({
        title: "Subscription Successful!",
        description: "Your PayPal subscription has been activated. It may take a few moments to update.",
      });
      // Clean up URL
      window.history.replaceState({}, document.title, '/settings');
    } else if (paypalStatus === 'cancelled') {
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription was cancelled. You can try again anytime.",
        variant: "destructive"
      });
      // Clean up URL
      window.history.replaceState({}, document.title, '/settings');
    }
  }, []);

  // Check for PayPal return parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paypalStatus = urlParams.get('paypal');
    
    if (paypalStatus === 'success') {
      toast({
        title: "Subscription Successful!",
        description: "Your PayPal subscription has been activated. Welcome aboard!",
      });
      // Clean up URL
      window.history.replaceState({}, document.title, '/settings');
    } else if (paypalStatus === 'cancelled') {
      toast({
        title: "Subscription Cancelled",
        description: "Your PayPal subscription was cancelled. You can try again anytime.",
        variant: "destructive"
      });
      // Clean up URL
      window.history.replaceState({}, document.title, '/settings');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="flex items-center space-x-3">
                <img src={logo} alt="ProposalKraft" className="h-8" />
                <span className="text-xl font-bold text-primary">ProposalKraft</span>
              </div>
            </div>
            <Badge variant="default">
              All Features Enabled
            </Badge>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account, company profile, and integrations
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="company" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Company
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Integrations
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4" />
              Preferences
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>
                  Update your personal account settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user.email || ''}
                    disabled
                  />
                  <p className="text-sm text-muted-foreground">
                    Contact support to change your email address
                  </p>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Security</h3>
                  <Button variant="outline">
                    <Shield className="h-4 w-4 mr-2" />
                    Change Password
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="company" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Company Profile</CardTitle>
                <CardDescription>
                  Manage your company information and branding
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company_name">Company Name</Label>
                    <Input
                      id="company_name"
                      value={profile?.company_name || ''}
                      onChange={(e) => setProfile(prev => prev ? { ...prev, company_name: e.target.value } : null)}
                      placeholder="Acme Corporation"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="display_name">Display Name</Label>
                    <Input
                      id="display_name"
                      value={profile?.display_name || ''}
                      onChange={(e) => setProfile(prev => prev ? { ...prev, display_name: e.target.value } : null)}
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Avatar</h3>
                  <div className="flex items-center space-x-4">
                    {profile?.avatar_url && (
                      <img 
                        src={profile.avatar_url} 
                        alt="Avatar" 
                        className="h-16 w-16 rounded-full object-cover border"
                      />
                    )}
                    <div className="space-y-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                      />
                      <Button 
                        onClick={handleLogoUpload} 
                        disabled={!logoFile || loading}
                        size="sm"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Avatar
                      </Button>
                    </div>
                  </div>
                </div>

                <Button onClick={() => handleProfileUpdate(profile || {})} disabled={loading}>
                  Save Company Profile
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Subscription & Billing</CardTitle>
                <CardDescription>
                  Manage your subscription and payment methods
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 border rounded-lg bg-accent/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">
                        Current Plan: {subscription.hasActiveSubscription 
                          ? `${subscription.planType?.charAt(0).toUpperCase()}${subscription.planType?.slice(1)} Plan`
                          : 'Free Access'
                        }
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {subscription.hasActiveSubscription
                          ? `Active until ${subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : 'N/A'}`
                          : 'All features enabled - No subscription required'
                        }
                      </p>
                      {subscriptionLoading && (
                        <p className="text-xs text-muted-foreground mt-1">Loading subscription status...</p>
                      )}
                    </div>
                    <Badge variant={subscription.hasActiveSubscription ? "default" : "secondary"}>
                      {subscription.hasActiveSubscription ? subscription.status : 'Free'}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Available Plans</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Freelance Plan */}
                    <Card className="relative">
                      <CardHeader>
                        <CardTitle className="text-lg">Freelance</CardTitle>
                        <div className="text-2xl font-bold">$19<span className="text-sm font-normal text-muted-foreground">/month</span></div>
                        <CardDescription>Perfect for freelancers and small businesses</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                            <span>5 proposals with watermark</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                            <span>Unlimited templates</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                            <span>Unlimited customisation</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                            <span>Tracking</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                            <span>E-signature</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                            <span>Export in various formats</span>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => handleSubscribe('freelance')}
                          disabled={subscriptionActionLoading || (subscription.hasActiveSubscription && subscription.planType === 'freelance')}
                        >
                          {subscriptionActionLoading ? 'Processing...' : 
                           (subscription.hasActiveSubscription && subscription.planType === 'freelance') ? 'Current Plan' : 'Subscribe'}
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Agency Plan */}
                    <Card className="relative border-primary">
                      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                        <Badge variant="default" className="px-3">Most Popular</Badge>
                      </div>
                      <CardHeader>
                        <CardTitle className="text-lg">Agency</CardTitle>
                        <div className="text-2xl font-bold">$49<span className="text-sm font-normal text-muted-foreground">/month</span></div>
                        <CardDescription>Best for growing businesses and teams</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                            <span>Unlimited proposals</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                            <span>Unlimited templates</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                            <span>Unlimited customisation</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                            <span>Tracking</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                            <span>E-signature</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                            <span>Export in various formats</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                            <span>CRM integration</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                            <span>Upload custom template</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                            <span>Reminders</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                            <span>Team collaboration</span>
                          </div>
                        </div>
                        <Button 
                          className="w-full"
                          onClick={() => handleSubscribe('agency')}
                          disabled={subscriptionActionLoading || (subscription.hasActiveSubscription && subscription.planType === 'agency')}
                        >
                          {subscriptionActionLoading ? 'Processing...' : 
                           (subscription.hasActiveSubscription && subscription.planType === 'agency') ? 'Current Plan' : 'Subscribe'}
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Enterprise Plan */}
                    <Card className="relative">
                      <CardHeader>
                        <CardTitle className="text-lg">Enterprise</CardTitle>
                        <div className="text-2xl font-bold">$69<span className="text-sm font-normal text-muted-foreground">/month</span></div>
                        <CardDescription>For large organizations with advanced needs</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                            <span>Unlimited proposals</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                            <span>Unlimited templates</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                            <span>Unlimited customisation</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                            <span>Tracking</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                            <span>E-signature</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                            <span>Export in various formats</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                            <span>CRM integration</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                            <span>Upload custom template</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                            <span>Payment integration</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                            <span>Reminders</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                            <span>Team collaboration</span>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => handleSubscribe('enterprise')}
                          disabled={subscriptionActionLoading || (subscription.hasActiveSubscription && subscription.planType === 'enterprise')}
                        >
                          {subscriptionActionLoading ? 'Processing...' : 
                           (subscription.hasActiveSubscription && subscription.planType === 'enterprise') ? 'Current Plan' : 'Subscribe'}
                        </Button>
                      </CardContent>
                    </Card>

                  </div>
                </div>

                <div className="text-center p-6 border rounded-lg border-dashed bg-muted/20">
                  <h3 className="font-medium mb-2">🎉 Special Access</h3>
                  <p className="text-sm text-muted-foreground">
                    You currently have complimentary access to all Professional features. Enjoy creating unlimited proposals with full functionality!
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>CRM Integration</CardTitle>
                <CardDescription>
                  Connect your favorite CRM to sync contacts and opportunities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CRMIntegration />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Integration</CardTitle>
                <CardDescription>
                  Connect payment gateways to accept payments directly through proposals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PaymentIntegration />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>
                  Manage how and when you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Email Notifications</h3>
                    <p className="text-sm text-muted-foreground">
                      Receive email updates about proposal activity
                    </p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Proposal Viewed</h3>
                    <p className="text-sm text-muted-foreground">
                      Get notified when clients view your proposals
                    </p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Proposal Accepted</h3>
                    <p className="text-sm text-muted-foreground">
                      Get notified when proposals are accepted
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Regional Settings</CardTitle>
                <CardDescription>
                  Configure your regional preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select defaultValue="usd">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="usd">USD ($)</SelectItem>
                        <SelectItem value="eur">EUR (€)</SelectItem>
                        <SelectItem value="gbp">GBP (£)</SelectItem>
                        <SelectItem value="cad">CAD (C$)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Time Zone</Label>
                    <Select defaultValue="america/new_york">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="america/new_york">Eastern Time</SelectItem>
                        <SelectItem value="america/chicago">Central Time</SelectItem>
                        <SelectItem value="america/denver">Mountain Time</SelectItem>
                        <SelectItem value="america/los_angeles">Pacific Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}