import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, Calendar, DollarSign, Building2, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import PaymentLinks from '@/components/PaymentLinks';

interface ProposalData {
  id: string;
  title: string;
  client_name: string;
  client_email: string;
  content: any;
  worth: number;
  created_at: string;
  status: string;
}

interface ShareData {
  id: string;
  proposal_id: string;
  expires_at: string | null;
  permissions: string;
}

export default function SharedProposal() {
  const { token } = useParams<{ token: string }>();
  const [proposal, setProposal] = useState<ProposalData | null>(null);
  const [shareData, setShareData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchSharedProposal();
    }
  }, [token]);

  const fetchSharedProposal = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      
      // First, verify the share token and check if it's valid
      const { data: shareInfo, error: shareError } = await supabase
        .from('secure_proposal_shares')
        .select('*')
        .eq('share_token', token)
        .single();

      if (shareError || !shareInfo) {
        setError('Invalid or expired share link.');
        return;
      }

      // Check if the share has expired
      if (shareInfo.expires_at && new Date(shareInfo.expires_at) < new Date()) {
        setError('This share link has expired.');
        return;
      }

      setShareData(shareInfo);

      // Fetch the proposal data
      const { data: proposalData, error: proposalError } = await supabase
        .from('proposals')
        .select('id, title, client_name, client_email, content, worth, created_at, status')
        .eq('id', shareInfo.proposal_id)
        .single();

      if (proposalError || !proposalData) {
        setError('Proposal not found.');
        return;
      }

      setProposal(proposalData);

      // Track the view (if analytics tracking is enabled)
      const permissions = typeof shareInfo.permissions === 'string' 
        ? JSON.parse(shareInfo.permissions) 
        : shareInfo.permissions;

      if (permissions?.trackViews) {
        await supabase
          .from('proposal_analytics')
          .insert({
            proposal_id: shareInfo.proposal_id,
            viewer_ip: 'shared-link',
            section_viewed: 'full-proposal'
          });
      }

    } catch (error: any) {
      console.error('Error fetching shared proposal:', error);
      setError('Failed to load proposal. Please check the link and try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading proposal...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Unable to Load Proposal</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!proposal) {
    return null;
  }

  const renderContent = (content: any) => {
    if (!content || typeof content !== 'object') {
      return <p className="text-muted-foreground">No content available.</p>;
    }

    return Object.entries(content).map(([section, data]: [string, any]) => {
      if (!data || typeof data !== 'object') return null;

      const sectionTitle = section.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');

      return (
        <div key={section} className="mb-8">
          <h3 className="text-lg font-semibold mb-4 text-primary">
            {sectionTitle}
          </h3>
          <div className="space-y-3">
            {Object.entries(data).map(([key, value]: [string, any]) => {
              if (!value) return null;
              
              const fieldName = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
              
              return (
                <div key={key} className="border-l-2 border-primary/20 pl-4">
                  <h4 className="font-medium text-foreground mb-1">{fieldName}</h4>
                  <p className="text-muted-foreground">{value.toString()}</p>
                </div>
              );
            })}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <Card className="mb-8">
            <CardContent className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-foreground mb-2">
                    {proposal.title}
                  </h1>
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      <span>{proposal.client_name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(proposal.created_at)}</span>
                    </div>
                    {proposal.worth > 0 && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        <span>{formatCurrency(proposal.worth)}</span>
                      </div>
                    )}
                  </div>
                </div>
                <Badge variant="secondary" className="ml-4">
                  <Eye className="h-3 w-3 mr-1" />
                  Shared Proposal
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Content */}
          <Card>
            <CardContent className="p-8">
              <div className="prose prose-slate max-w-none">
                {renderContent(proposal.content)}
              </div>
            </CardContent>
          </Card>

          {/* Payment Links */}
          {proposal.worth > 0 && (
            <Card className="mt-6">
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Ready to Get Started?
                  </h3>
                  <p className="text-muted-foreground">
                    Secure payment options for your project
                  </p>
                </div>
                <PaymentLinks 
                  proposalId={proposal.id}
                  proposalAmount={proposal.worth.toString()}
                  proposalCurrency="USD"
                  defaultOpen={false}
                />
              </CardContent>
            </Card>
          )}

          {/* Footer */}
          <div className="mt-8 text-center text-muted-foreground">
            <p>This proposal was shared securely via ProposalKraft</p>
            {shareData?.expires_at && (
              <p className="text-sm mt-1">
                Link expires on {formatDate(shareData.expires_at)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}