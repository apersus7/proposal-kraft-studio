import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Share2, Copy, Calendar as CalendarIcon, Link, Eye, Clock, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
const sb = supabase as any;

interface ProposalSharingProps {
  proposalId: string;
  proposalTitle: string;
}

export default function ProposalSharing({ proposalId, proposalTitle }: ProposalSharingProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shareSettings, setShareSettings] = useState({
    requiresPassword: false,
    password: '',
    expiresAt: null as Date | null,
    allowComments: true,
    trackViews: true,
    requireSignature: false
  });
  const [shareLinks, setShareLinks] = useState<any[]>([]);
  const [emailShare, setEmailShare] = useState('');

  const generateSecureLink = async () => {
    setLoading(true);
    try {
      // Set default expiration to 30 days from now if no expiration is set
      const expirationDate = shareSettings.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      
      const { data, error } = await supabase
        .from('secure_proposal_shares')
        .insert({
          proposal_id: proposalId,
          created_by: (await sb.auth.getUser()).data.user?.id,
          expires_at: expirationDate.toISOString(),
          permissions: JSON.stringify({
            allowComments: shareSettings.allowComments,
            trackViews: shareSettings.trackViews,
            requireSignature: shareSettings.requireSignature
          })
        })
        .select()
        .single();

      if (error) throw error;

      const shareUrl = `${window.location.origin}/shared/${data.share_token}`;
      
      await navigator.clipboard.writeText(shareUrl);
      
      toast({
        title: "Secure Link Generated",
        description: "Link copied to clipboard"
      });

      fetchShareLinks();
    } catch (error) {
      console.error('Error generating secure link:', error);
      toast({
        title: "Error",
        description: "Failed to generate secure link",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const shareViaEmail = async () => {
    if (!emailShare) return;
    
    setLoading(true);
    try {
      // Create a secure share token first (like the generate secure link does)
      const expirationDate = shareSettings.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      
      const { data: secureShare, error: secureError } = await supabase
        .from('secure_proposal_shares')
        .insert({
          proposal_id: proposalId,
          created_by: (await sb.auth.getUser()).data.user?.id,
          expires_at: expirationDate.toISOString(),
          permissions: JSON.stringify({
            allowComments: shareSettings.allowComments,
            trackViews: shareSettings.trackViews,
            requireSignature: shareSettings.requireSignature
          })
        })
        .select()
        .single();

      if (secureError) throw secureError;

      // Also create an email share record for tracking
      const { data, error } = await sb
        .from('proposal_shares')
        .insert({
          proposal_id: proposalId,
          shared_with_email: emailShare,
          created_by: (await sb.auth.getUser()).data.user?.id,
          expires_at: shareSettings.expiresAt?.toISOString(),
          permissions: 'view'
        })
        .select()
        .single();

      if (error) throw error;

      // Send email notification via edge function
      const { data: user } = await sb.auth.getUser();
      const { data: profile } = await sb
        .from('profiles')
        .select('display_name')
        .eq('user_id', user.user?.id)
        .single();
      
      // Use the secure share URL that doesn't require authentication
      const shareUrl = `${window.location.origin}/shared/${secureShare.share_token}`;
      
      await sb.functions.invoke('send-proposal-email', {
        body: {
          proposalId,
          recipientEmail: emailShare,
          proposalTitle,
          senderName: profile?.display_name || 'Someone',
          shareUrl
        }
      });

      toast({
        title: "Proposal Shared",
        description: `Proposal shared with ${emailShare} via email`
      });

      setEmailShare('');
      fetchShareLinks();
    } catch (error) {
      console.error('Error sharing proposal:', error);
      toast({
        title: "Error", 
        description: "Failed to share proposal",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchShareLinks = async () => {
    try {
      const [secureShares, emailShares] = await Promise.all([
        sb
          .from('secure_proposal_shares')
          .select('*')
          .eq('proposal_id', proposalId),
        sb
          .from('proposal_shares')
          .select('*')
          .eq('proposal_id', proposalId)
      ]);

      setShareLinks([
        ...(secureShares.data || []).map(s => ({ ...s, type: 'secure' })),
        ...(emailShares.data || []).map(s => ({ ...s, type: 'email' }))
      ]);
    } catch (error) {
      console.error('Error fetching share links:', error);
    }
  };

  const revokeAccess = async (shareId: string, type: 'secure' | 'email') => {
    try {
      const table = type === 'secure' ? 'secure_proposal_shares' : 'proposal_shares';
      const { error } = await sb
        .from(table)
        .delete()
        .eq('id', shareId);

      if (error) throw error;

      toast({
        title: "Access Revoked",
        description: "Share link has been deactivated"
      });

      fetchShareLinks();
    } catch (error) {
      console.error('Error revoking access:', error);
      toast({
        title: "Error",
        description: "Failed to revoke access",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="bg-green-600 hover:bg-green-700 text-white border-green-600 hover:border-green-700"
          onClick={() => {
            setIsOpen(true);
            fetchShareLinks();
          }}
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share Proposal
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Share "{proposalTitle}"</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Share Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Share Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="track-views">Track Views</Label>
                <Switch
                  id="track-views"
                  checked={shareSettings.trackViews}
                  onCheckedChange={(checked) => 
                    setShareSettings(prev => ({ ...prev, trackViews: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="allow-comments">Allow Comments</Label>
                <Switch
                  id="allow-comments"
                  checked={shareSettings.allowComments}
                  onCheckedChange={(checked) => 
                    setShareSettings(prev => ({ ...prev, allowComments: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="require-signature">Require Signature</Label>
                <Switch
                  id="require-signature"
                  checked={shareSettings.requireSignature}
                  onCheckedChange={(checked) => 
                    setShareSettings(prev => ({ ...prev, requireSignature: checked }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Expiration Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {shareSettings.expiresAt ? format(shareSettings.expiresAt, "PPP") : "No expiration"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={shareSettings.expiresAt || undefined}
                      onSelect={(date) => setShareSettings(prev => ({ ...prev, expiresAt: date || null }))}
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>
          </Card>

          {/* Email Share */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Share via Email</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  type="email"
                  value={emailShare}
                  onChange={(e) => setEmailShare(e.target.value)}
                  placeholder="client@company.com"
                />
                <Button onClick={shareViaEmail} disabled={loading || !emailShare}>
                  Share
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Generate Secure Link */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Generate Secure Link</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={generateSecureLink} disabled={loading} className="w-full">
                <Link className="h-4 w-4 mr-2" />
                Generate Secure Link
              </Button>
            </CardContent>
          </Card>

          {/* Active Shares */}
          {shareLinks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Active Shares</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {shareLinks.map((share) => (
                  <div key={share.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {share.type === 'secure' ? <Link className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                      <div>
                        <p className="text-sm font-medium">
                          {share.type === 'secure' ? 'Secure Link' : share.shared_with_email}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          {share.accessed_count !== undefined && (
                            <span className="flex items-center">
                              <Eye className="h-3 w-3 mr-1" />
                              {share.accessed_count} views
                            </span>
                          )}
                          {share.expires_at && (
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              Expires {format(new Date(share.expires_at), "MMM d")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {share.type === 'secure' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const url = `${window.location.origin}/shared/${share.share_token}`;
                            navigator.clipboard.writeText(url);
                            toast({ title: "Copied", description: "Link copied to clipboard" });
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => revokeAccess(share.id, share.type)}
                      >
                        Revoke
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}