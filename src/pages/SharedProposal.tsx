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

    // New structured format: top-level object with `sections: [...]`
    if (Array.isArray(content.sections)) {
      const sections = content.sections as any[];
      return sections.map((sec, idx) => {
        if (!sec || typeof sec !== 'object') return null;
        const type = (sec.type || '').toString();

        const titleByType: Record<string, string> = {
          cover_page: 'Cover',
          objective: 'Objective',
          proposed_solution: 'Proposed Solution',
          scope_of_work: 'Scope of Work',
          pricing: 'Pricing',
          value_proposition: 'Value Proposition',
          why_us: 'Why Us',
          terms_conditions: 'Terms & Conditions',
          call_to_action: 'Next Steps',
        };

        const heading = sec.title || titleByType[type] || `Section ${idx + 1}`;
        const text = typeof sec.content === 'string' ? sec.content : sec.content?.text;

        return (
          <div key={idx} className="mb-8">
            <h3 className="text-lg font-semibold mb-3 text-primary">{heading}</h3>

            {/* Cover page */}
            {type === 'cover_page' && (
              <div className="flex items-center gap-4 mb-3">
                {sec.company_logo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={sec.company_logo} alt={`${sec.company_name || 'Company'} logo`} className="h-12 w-12 object-contain rounded" loading="lazy" />
                )}
                <div>
                  {sec.company_name && <p className="font-medium">{sec.company_name}</p>}
                  {sec.tagline && <p className="text-muted-foreground">{sec.tagline}</p>}
                </div>
              </div>
            )}

            {/* Generic text content */}
            {text && (
              <div className="prose prose-slate max-w-none">
                <p className="whitespace-pre-wrap text-muted-foreground">{text}</p>
              </div>
            )}

            {/* Timeline (scope_of_work) */}
            {Array.isArray(sec.timeline) && sec.timeline.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Timeline</h4>
                <ul className="list-disc pl-6 text-muted-foreground">
                  {sec.timeline.map((t: any, i: number) => (
                    <li key={i}>{t?.phase ? `${t.phase} — ${t.duration || ''}` : ''}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Testimonials (value_proposition) */}
            {Array.isArray(sec.testimonials) && sec.testimonials.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Testimonials</h4>
                <ul className="list-disc pl-6 text-muted-foreground">
                  {sec.testimonials.map((t: any, i: number) => (
                    <li key={i}>{t?.name || t?.link}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      });
    }

    // Legacy array format (content is an array)
    if (Array.isArray(content)) {
      return content.map((section: any, i: number) => {
        if (!section || typeof section !== 'object') return null;
        return (
          <div key={section.id ?? i} className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-primary">{section.title}</h3>
            <div className="prose prose-slate max-w-none">
              <p className="text-muted-foreground whitespace-pre-wrap">{section.content?.text || ''}</p>
            </div>
          </div>
        );
      });
    }

    // Fallback legacy object map (exclude arrays to avoid [object Object])
    return Object.entries(content)
      .filter(([_, v]) => v && typeof v === 'object' && !Array.isArray(v))
      .map(([section, data]: [string, any]) => {
        const sectionTitle = section
          .split('_')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        return (
          <div key={section} className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-primary">{sectionTitle}</h3>
            <div className="space-y-3">
              {Object.entries(data).map(([key, value]: [string, any]) => (
                <div key={key} className="border-l-2 border-primary/20 pl-4">
                  <h4 className="font-medium text-foreground mb-1">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                  </h4>
                  <p className="text-muted-foreground">{String(value)}</p>
                </div>
              ))}
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