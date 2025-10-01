import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, Calendar, DollarSign, Building2, Eye, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import PaymentLinks from '@/components/PaymentLinks';
import ESignatureFlow from '@/components/ESignature/ESignatureFlow';

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
  const [signers, setSigners] = useState<any[]>([]);

  useEffect(() => {
    if (token) {
      fetchSharedProposal();
    }
  }, [token]);

  const fetchSharedProposal = async () => {
    if (!token) return;
    try {
      setLoading(true);
      // Robust token normalization: decode, fix spaces/URL-safe chars, and restore padding
      let normalizedToken = decodeURIComponent(token);
      normalizedToken = normalizedToken.replace(/\s/g, '+').replace(/-/g, '+').replace(/_/g, '/');
      const pad = normalizedToken.length % 4;
      if (pad) normalizedToken = normalizedToken + '='.repeat(4 - pad);
      const { data, error } = await supabase.functions.invoke('get-shared-proposal', {
        body: { token: normalizedToken },
      });

      if (error) {
        console.error('get-shared-proposal error:', error);
        setError(typeof error.message === 'string' ? error.message : 'Unable to load shared proposal.');
        return;
      }

      if (!data) {
        setError('Unable to load shared proposal.');
        return;
      }

      setShareData({
        id: data.share.id,
        proposal_id: data.share.proposal_id,
        expires_at: data.share.expires_at,
        permissions: data.share.permissions,
      });
      setProposal(data.proposal);
      setSigners(data.signers || []);

      // Attempt to track a view (best-effort)
      try {
        const permissions = typeof data.share.permissions === 'string' ? JSON.parse(data.share.permissions) : data.share.permissions;
        if (permissions?.trackViews) {
          await supabase.from('proposal_analytics').insert({
            proposal_id: data.share.proposal_id,
            viewer_ip: 'shared-link',
            section_viewed: 'full-proposal',
          });
        }
      } catch (e) {
        console.warn('analytics insert skipped:', e);
      }
    } catch (err) {
      console.error('Unexpected error loading shared proposal:', err);
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

    // Check if content is an array of sections (new format)
    if (Array.isArray(content)) {
      return content.map((section: any) => {
        if (!section || typeof section !== 'object') return null;

        return (
          <div key={section.id} className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-primary">
              {section.title}
            </h3>
            {section.type === 'payment_link' ? (
              <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 rounded-lg border">
                <div className="text-center">
                  <h4 className="font-semibold mb-2">Ready to proceed?</h4>
                  <p className="text-muted-foreground mb-4">{section.content?.text}</p>
                  {section.content?.paymentUrl ? (
                    <Button 
                      asChild 
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <a 
                        href={section.content.paymentUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        {section.content?.buttonText || 'Pay Now'} 
                        {section.content?.amount && ` - $${section.content.amount}`}
                      </a>
                    </Button>
                  ) : (
                    <div className="text-muted-foreground text-sm">
                      Payment link will be available soon
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="prose prose-slate max-w-none">
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {section.content?.text || 'No content available.'}
                </p>
              </div>
            )}
          </div>
        );
      });
    }

    // Legacy format support
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
                  isSharedView={true}
                />
              </CardContent>
            </Card>
          )}

          {/* E-Signature Section */}
          {signers.length > 0 && (
            <Card className="mt-6">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Electronic Signatures Required
                </h3>
                <ESignatureFlow
                  proposalId={proposal.id}
                  signers={signers}
                  onSignersUpdate={setSigners}
                  isOwner={false}
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