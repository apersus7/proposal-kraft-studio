import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, Calendar, DollarSign, Building2, Eye, CreditCard, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
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

  // Extract theme from proposal content
  const getTheme = () => {
    if (!proposal?.content) return {};
    const content = proposal.content;
    return {
      backgroundColor: content.backgroundColor || '#ffffff',
      textColor: content.textColor || '#000000',
      headingColor: content.headingColor || '#000000',
      primaryColor: content.primaryColor || '#3B82F6',
      secondaryColor: content.secondaryColor || '#6B7280',
      selectedFont: content.selectedFont || 'Inter'
    };
  };

  useEffect(() => {
    if (token) {
      fetchSharedProposal();
    }
  }, [token]);

  // Load custom font if specified
  useEffect(() => {
    if (proposal?.content?.selectedFont) {
      const font = proposal.content.selectedFont;
      if (font && font !== 'Inter') {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/ /g, '+')}:wght@400;500;600;700&display=swap`;
        document.head.appendChild(link);
      }
    }
  }, [proposal]);

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
        const status = (error as any)?.context?.status;
        console.error('get-shared-proposal error:', { status, error });
        if (status === 404) setError('This share link is invalid. Please ask the sender for a new link.');
        else if (status === 410) setError('This share link has expired. Please ask the sender to generate a new one.');
        else setError('Unable to load shared proposal. Please try again.');
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

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    const locale = currency === 'INR' ? 'en-IN' : currency === 'EUR' ? 'de-DE' : currency === 'GBP' ? 'en-GB' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
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

  const renderContent = (rawContent: any) => {
    // Parse if string
    let content = rawContent;
    if (typeof content === 'string') {
      try { content = JSON.parse(content); } catch {}
    }

    if (!content || typeof content !== 'object') {
      return <p className="text-muted-foreground">No content available.</p>;
    }

    // Normalize sections if present
    let normalizedSections: any[] | null = null;
    const maybeSections = (content as any).sections ?? (content as any).Sections;
    if (typeof maybeSections !== 'undefined') {
      let sectionsCandidate: any = maybeSections;
      if (typeof sectionsCandidate === 'string') {
        try { sectionsCandidate = JSON.parse(sectionsCandidate); } catch {}
      }
      if (sectionsCandidate && typeof sectionsCandidate === 'object' && !Array.isArray(sectionsCandidate)) {
        // Convert numeric-keyed object to array
        const keys = Object.keys(sectionsCandidate);
        if (keys.every(k => /^\d+$/.test(k))) {
          sectionsCandidate = keys.sort((a,b)=>Number(a)-Number(b)).map(k => (sectionsCandidate as any)[k]);
        } else {
          // Fallback to object values order if not purely numeric keys
          sectionsCandidate = Object.values(sectionsCandidate);
        }
      }
      if (Array.isArray(sectionsCandidate)) normalizedSections = sectionsCandidate;
    }

    // New structured format with `sections`
    if (normalizedSections) {
      const getCurrencySymbol = (currency: string) => {
        const symbols: Record<string, string> = {
          'USD': '$',
          'EUR': '€',
          'GBP': '£',
          'INR': '₹',
          'CAD': '$',
          'AUD': '$',
          'JPY': '¥'
        };
        return symbols[currency] || '$';
      };

      return normalizedSections.map((sec, idx) => {
        if (!sec || typeof sec !== 'object') return null;
        const type = (sec.type || '').toString();

        const titleByType: Record<string, string> = {
          cover_page: 'Cover',
          objective: 'Objective',
          proposed_solution: 'Proposed Solution',
          scope_of_work: 'Scope of Work',
          pricing: 'Pricing',
          value_proposition: 'Value Proposition',
          call_to_action: 'Next Steps',
        };

        const heading = sec.title || titleByType[type] || `Section ${idx + 1}`;
        const text = typeof sec.content === 'string' ? sec.content : sec.content?.text;

        // Pricing section
        if (type === 'pricing') {
          return (
            <div key={idx} className="mb-8">
              <h3 className="text-lg font-semibold mb-4" style={{ color: getTheme().headingColor }}>{heading}</h3>
              <div className="bg-gradient-to-br from-primary/5 to-secondary/5 p-6 rounded-lg border" style={{ borderColor: `${getTheme().primaryColor}20` }}>
                <p className="text-xl font-bold mb-2" style={{ color: getTheme().primaryColor }}>
                  Total Project Investment: {getCurrencySymbol(rawContent.currency || 'USD')}{rawContent.pricing || proposal?.worth || 'XX,XXX'}
                </p>
                {sec.payment_terms && (
                  <p className="mb-2" style={{ color: getTheme().textColor }}><strong>Payment Terms:</strong> {sec.payment_terms}</p>
                )}
                {sec.breakdown && (
                  <p className="mb-2" style={{ color: getTheme().textColor }}><strong>Breakdown:</strong> {sec.breakdown}</p>
                )}
                {Array.isArray(sec.milestones) && sec.milestones.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2" style={{ color: getTheme().headingColor }}>Payment Milestones</h4>
                    <ul className="list-disc pl-6" style={{ color: getTheme().textColor }}>
                      {sec.milestones.map((m: any, i: number) => (
                        <li key={i}>{m?.milestone ? `${m.milestone} — ${getCurrencySymbol(rawContent.currency || 'USD')}${m.amount || ''}` : ''}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          );
        }

        // Call to action section
        if (type === 'call_to_action') {
          const nextStepsContent = sec.next_steps;
          const contactDetails = sec.contact_details || sec.contact_info;
          
          return (
            <div key={idx} className="mb-8">
              <h3 className="text-lg font-semibold mb-4" style={{ color: getTheme().headingColor }}>{heading}</h3>
              <div className="bg-gradient-to-br from-primary/10 to-secondary/10 p-6 rounded-lg border-2" style={{ borderColor: getTheme().primaryColor }}>
                {text && (
                  <p className="whitespace-pre-wrap mb-4" style={{ color: getTheme().textColor }}>{text}</p>
                )}
                {nextStepsContent && (
                  Array.isArray(nextStepsContent) ? (
                    <ul className="list-decimal pl-6 mb-4" style={{ color: getTheme().textColor }}>
                      {nextStepsContent.map((step: any, i: number) => (
                        <li key={i} className="mb-2">{step}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mb-4" style={{ color: getTheme().textColor }}>
                      <strong>Next Steps:</strong> {nextStepsContent}
                    </p>
                  )
                )}
                {contactDetails && (
                  <p className="font-medium" style={{ color: getTheme().textColor }}>
                    <strong>Contact:</strong> {contactDetails}
                  </p>
                )}
              </div>
            </div>
          );
        }

        return (
          <div key={idx} className="mb-8">
            <h3 className="text-lg font-semibold mb-3" style={{ color: getTheme().headingColor }}>{heading}</h3>

            {type === 'cover_page' && (
              <div className="flex items-center gap-4 mb-3">
                {sec.company_logo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={sec.company_logo} alt={`${sec.company_name || 'Company'} logo`} className="h-12 w-12 object-contain rounded" loading="lazy" />
                )}
                <div>
                  {sec.company_name && <p className="font-medium" style={{ color: getTheme().textColor }}>{sec.company_name}</p>}
                  {sec.tagline && <p style={{ color: getTheme().textColor, opacity: 0.7 }}>{sec.tagline}</p>}
                </div>
              </div>
            )}

            {text && (
              <div className="prose prose-slate max-w-none">
                <p className="whitespace-pre-wrap" style={{ color: getTheme().textColor }}>{text}</p>
              </div>
            )}

            {Array.isArray(sec.timeline) && sec.timeline.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2" style={{ color: getTheme().headingColor }}>Timeline</h4>
                <ul className="list-disc pl-6" style={{ color: getTheme().textColor }}>
                  {sec.timeline.map((t: any, i: number) => (
                    <li key={i}>{t?.phase ? `${t.phase} — ${t.duration || ''}` : ''}</li>
                  ))}
                </ul>
              </div>
            )}

            {Array.isArray(sec.testimonials) && sec.testimonials.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2" style={{ color: getTheme().headingColor }}>Testimonials</h4>
                <ul className="list-disc pl-6" style={{ color: getTheme().textColor }}>
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
            <h3 className="text-lg font-semibold mb-4" style={{ color: getTheme().headingColor }}>{section.title}</h3>
            <div className="prose max-w-none">
              <p className="whitespace-pre-wrap" style={{ color: getTheme().textColor }}>{section.content?.text || ''}</p>
            </div>
          </div>
        );
      });
    }

    // Fallback legacy object map: show JSON for objects to avoid [object Object]
    return Object.entries(content)
      .filter(([_, v]) => v != null)
      .map(([section, data]: [string, any]) => {
        const sectionTitle = section
          .split('_')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        const isRenderableText = typeof data === 'string' || typeof data === 'number';
        const display = isRenderableText ? String(data) : JSON.stringify(data, null, 2);
        return (
          <div key={section} className="mb-8">
            <h3 className="text-lg font-semibold mb-4" style={{ color: getTheme().headingColor }}>{sectionTitle}</h3>
            <pre className="text-sm p-3 rounded overflow-auto" style={{ color: getTheme().textColor, backgroundColor: `${getTheme().backgroundColor}dd` }}>{display}</pre>
          </div>
        );
      });
  };

  const theme = getTheme();
  const allSigned = signers.length > 0 && signers.every(s => s.status === 'signed');

  return (
    <div 
      className="min-h-screen" 
      style={{ 
        backgroundColor: theme.backgroundColor,
        fontFamily: `'${theme.selectedFont}', sans-serif`
      }}
    >
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
                        <span>{formatCurrency(proposal.worth, proposal.content?.currency || 'USD')}</span>
                      </div>
                    )}
                  </div>
                </div>
                <Badge variant={allSigned ? "default" : "secondary"} className="ml-4">
                  {allSigned ? (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  ) : (
                    <Eye className="h-3 w-3 mr-1" />
                  )}
                  {allSigned ? 'Signed' : 'Shared Proposal'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Content */}
          <Card style={{ backgroundColor: 'white' }}>
            <CardContent className="p-8">
              <div className="prose max-w-none" style={{
                ['--tw-prose-body' as any]: theme.textColor,
                ['--tw-prose-headings' as any]: theme.headingColor,
                ['--tw-prose-links' as any]: theme.primaryColor,
                ['--tw-prose-bold' as any]: theme.headingColor,
                ['--tw-prose-quotes' as any]: theme.textColor,
              }}>
                {renderContent(proposal.content)}
              </div>
            </CardContent>
          </Card>


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