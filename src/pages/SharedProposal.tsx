import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, Calendar, DollarSign, Building2, Eye, CreditCard, CheckCircle, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { supabase } from '@/integrations/supabase/client';
const sb = supabase as any;
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

  // Use app green as accent (matching ProposalPreview)
  const accentColor = 'hsl(151, 100%, 37%)';
  const accentColorFaded = 'hsla(151, 100%, 37%, 0.15)';

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
      const normalizedToken = decodeURIComponent(token);
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const response = await fetch(`${supabaseUrl}/functions/v1/get-shared-proposal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': anonKey,
        },
        body: JSON.stringify({ token: normalizedToken }),
      });
      
      if (!response.ok) {
        const status = response.status;
        if (status === 404) setError('This share link is invalid. Please ask the sender for a new link.');
        else if (status === 410) setError('This share link has expired. Please ask the sender to generate a new one.');
        else setError('Unable to load shared proposal. Please try again.');
        return;
      }
      
      const data = await response.json();

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

      // Track view (best-effort)
      try {
        const permissions = typeof data.share.permissions === 'string' ? JSON.parse(data.share.permissions) : data.share.permissions;
        if (permissions?.trackViews) {
          await sb.from('proposal_analytics').insert({
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

  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const downloadPdf = async () => {
    const element = document.getElementById('proposal-content');
    if (!element) return;
    setDownloadingPdf(true);
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = pdfHeight;
      let position = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft > 0) {
        position = -(pdfHeight - heightLeft);
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`${proposal?.title || 'proposal'}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
      toast({ title: 'Error', description: 'Failed to generate PDF', variant: 'destructive' });
    } finally {
      setDownloadingPdf(false);
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

  // Render content using the same approach as ProposalPreview
  const renderContent = (content: any) => {
    if (!content || typeof content !== 'object') {
      return <p className="text-muted-foreground">No content available.</p>;
    }

    const selectedFont = content.selectedFont || 'Inter';
    const logoUrl = content.logoUrl || content.company_logo || null;

    // Sections array format
    if (content.sections && Array.isArray(content.sections)) {
      return (
        <div style={{ fontFamily: selectedFont }} className="space-y-8">
          {content.sections.map((section: any, index: number) => {
            if (!section || typeof section !== 'object') return null;

            switch (section.type) {
              case 'cover_page':
                return (
                  <div key={index} className="text-center py-10 px-6 rounded-xl border border-border" style={{ background: `linear-gradient(135deg, ${accentColorFaded}, transparent)` }}>
                    {logoUrl && (
                      <div className="mb-5">
                        <img src={logoUrl} alt="Company Logo" className="h-14 w-auto mx-auto rounded" />
                      </div>
                    )}
                    <p className="text-sm font-medium tracking-widest uppercase mb-3" style={{ color: accentColor }}>
                      {section.company_name || content.company_name || 'Your Company'}
                    </p>
                    <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                      {proposal?.title}
                    </h1>
                    {content.project_name && (
                      <p className="text-base text-muted-foreground mb-1">Project: {content.project_name}</p>
                    )}
                    <p className="text-base text-muted-foreground">Prepared for {proposal?.client_name}</p>
                    {section.tagline && (
                      <p className="text-sm italic mt-3 text-muted-foreground">{section.tagline}</p>
                    )}
                  </div>
                );

              case 'objective':
                return section.content ? (
                  <div key={index}>
                    <h2 className="text-xl font-semibold text-foreground mb-3 pb-2 border-b border-border">
                      Project Objective
                    </h2>
                    <p className="whitespace-pre-line leading-relaxed text-muted-foreground">{section.content}</p>
                  </div>
                ) : null;

              case 'proposed_solution':
                return (section.content || section.why_fits || section.tools?.length > 0) ? (
                  <div key={index}>
                    <h2 className="text-xl font-semibold text-foreground mb-3 pb-2 border-b border-border">
                      Proposed Solution
                    </h2>
                    {section.content && (
                      <p className="whitespace-pre-line leading-relaxed text-muted-foreground mb-4">{section.content}</p>
                    )}
                    {section.why_fits && (
                      <div className="mb-4">
                        <h3 className="text-base font-medium text-foreground mb-1">Why This Solution Fits:</h3>
                        <p className="whitespace-pre-line leading-relaxed text-muted-foreground">{section.why_fits}</p>
                      </div>
                    )}
                    {section.tools?.length > 0 && (
                      <div>
                        <h3 className="text-base font-medium text-foreground mb-1">Tools & Technologies:</h3>
                        <p className="text-muted-foreground">{section.tools.join(', ')}</p>
                      </div>
                    )}
                  </div>
                ) : null;

              case 'scope_of_work':
                return (section.content || section.deliverables?.length > 0 || section.timeline?.length > 0) ? (
                  <div key={index}>
                    <h2 className="text-xl font-semibold text-foreground mb-3 pb-2 border-b border-border">
                      Scope of Work
                    </h2>
                    {section.content && (
                      <p className="whitespace-pre-line leading-relaxed text-muted-foreground mb-4">{section.content}</p>
                    )}
                    {section.deliverables?.length > 0 && (
                      <div className="mb-4">
                        <h3 className="text-base font-medium text-foreground mb-2">Key Deliverables:</h3>
                        <ul className="space-y-1.5 ml-1">
                          {section.deliverables.map((item: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2 text-muted-foreground">
                              <span className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: accentColor }} />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {section.timeline?.length > 0 && (
                      <div>
                        <h3 className="text-base font-medium text-foreground mb-3">Timeline:</h3>
                        <div className="relative pl-6 space-y-4">
                          <div className="absolute left-[7px] top-2 bottom-2 w-0.5 rounded" style={{ backgroundColor: accentColor, opacity: 0.3 }} />
                          {section.timeline.map((phase: any, idx: number) => (
                            <div key={idx} className="relative flex items-start gap-3">
                              <div className="absolute -left-6 top-1.5 h-3 w-3 rounded-full border-2 bg-background" style={{ borderColor: accentColor }} />
                              <div className="flex-1 rounded-lg p-3 border border-border" style={{ backgroundColor: accentColorFaded }}>
                                <span className="font-semibold text-foreground">{phase.phase}</span>
                                <span className="text-muted-foreground ml-2">— {phase.duration}</span>
                                {phase.description && (
                                  <p className="text-sm text-muted-foreground mt-1">{phase.description}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null;

              case 'pricing': {
                const getCurrencySymbol = (currency: string) => {
                  const symbols: Record<string, string> = { 'USD': '$', 'EUR': '€', 'GBP': '£', 'INR': '₹', 'CAD': '$', 'AUD': '$', 'JPY': '¥' };
                  return symbols[currency] || '$';
                };
                const rawPricing = content.pricing || proposal?.worth || 'XX,XXX';
                const pricingDisplay = typeof rawPricing === 'string' && rawPricing.startsWith('$')
                  ? rawPricing
                  : `${getCurrencySymbol(content.currency || 'USD')}${rawPricing}`;

                return (
                  <div key={index}>
                    <h2 className="text-xl font-semibold text-foreground mb-3 pb-2 border-b border-border">
                      Investment
                    </h2>
                    <div className="p-5 rounded-xl border border-border" style={{ backgroundColor: accentColorFaded }}>
                      <p className="text-lg font-bold mb-2" style={{ color: accentColor }}>
                        Total Project Investment: {pricingDisplay}
                      </p>
                      {section.payment_terms && (
                        <p className="text-muted-foreground"><strong className="text-foreground">Payment Terms:</strong> {section.payment_terms}</p>
                      )}
                      {section.breakdown && (
                        <div className="mt-3">
                          <h4 className="font-medium text-foreground mb-1">Value Breakdown:</h4>
                          <p className="whitespace-pre-line text-muted-foreground">{section.breakdown}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              case 'value_proposition':
                return section.testimonials?.length > 0 ? (
                  <div key={index}>
                    <h2 className="text-xl font-semibold text-foreground mb-3 pb-2 border-b border-border">
                      Client Testimonials
                    </h2>
                    <div className="space-y-3">
                      {section.testimonials.map((testimonial: any, idx: number) => (
                        <div key={idx} className="p-4 rounded-lg border-l-4" style={{ backgroundColor: accentColorFaded, borderLeftColor: accentColor }}>
                          {testimonial.content && (
                            <p className="italic text-muted-foreground mb-2">"{testimonial.content}"</p>
                          )}
                          <div className="flex items-center justify-between">
                            {testimonial.name && (
                              <p className="font-medium text-foreground">— {testimonial.name}</p>
                            )}
                            {testimonial.link && (
                              <a href={testimonial.link} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline" style={{ color: accentColor }}>
                                View Profile
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null;

              case 'call_to_action':
                return section.next_steps ? (
                  <div key={index}>
                    <h2 className="text-xl font-semibold text-foreground mb-3 pb-2 border-b border-border">
                      Next Steps
                    </h2>
                    <p className="whitespace-pre-line leading-relaxed text-muted-foreground mb-4">{section.next_steps}</p>
                    {section.contact_details && (
                      <div className="p-4 rounded-lg border border-border bg-card">
                        <h4 className="font-medium text-foreground mb-2">Contact Information:</h4>
                        <div className="whitespace-pre-line text-muted-foreground">{section.contact_details}</div>
                      </div>
                    )}
                  </div>
                ) : null;

              case 'payment_link':
                return (
                  <div key={index}>
                    <div className="p-6 rounded-xl border border-border" style={{ backgroundColor: accentColorFaded }}>
                      <h3 className="text-lg font-semibold text-foreground mb-2 text-center">{section.title}</h3>
                      <p className="text-muted-foreground mb-4 text-center text-sm">{section.content?.text}</p>
                      {section.content?.paymentUrl ? (
                        <div className="text-center">
                          <Button asChild style={{ backgroundColor: accentColor }}>
                            <a href={section.content.paymentUrl} target="_blank" rel="noopener noreferrer">
                              <CreditCard className="h-4 w-4 mr-2" />
                              {section.content?.buttonText || 'Pay Now'}
                              {section.content?.amount && ` - $${section.content.amount}`}
                            </a>
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground text-sm">
                          Payment link will be available soon
                        </div>
                      )}
                    </div>
                  </div>
                );

              default: {
                const sectionContent = typeof section.content === 'string' ? section.content : section.content?.text || '';
                const sectionLabel = section.title || section.type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());

                // Deliverables with bullet list
                if (section.type === 'deliverables' && typeof sectionContent === 'string' && sectionContent.includes('\n')) {
                  const items = sectionContent.split('\n').map((l: string) => l.replace(/^[\-\•]\s*/, '').trim()).filter(Boolean);
                  return (
                    <div key={index}>
                      <h2 className="text-xl font-semibold text-foreground mb-3 pb-2 border-b border-border">{sectionLabel}</h2>
                      <ul className="space-y-1.5 ml-1">
                        {items.map((item: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 text-muted-foreground">
                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: accentColor }} />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                }

                // Timeline with visual
                if (section.type === 'timeline' && sectionContent) {
                  return (
                    <div key={index}>
                      <h2 className="text-xl font-semibold text-foreground mb-3 pb-2 border-b border-border">{sectionLabel}</h2>
                      <div className="relative pl-6">
                        <div className="absolute left-[7px] top-2 bottom-2 w-0.5 rounded" style={{ backgroundColor: accentColor, opacity: 0.3 }} />
                        <div className="relative flex items-start gap-3">
                          <div className="absolute -left-6 top-1.5 h-3 w-3 rounded-full border-2 bg-background" style={{ borderColor: accentColor }} />
                          <div className="flex-1 rounded-lg p-3 border border-border" style={{ backgroundColor: accentColorFaded }}>
                            <span className="font-semibold text-foreground">Project Duration</span>
                            <span className="text-muted-foreground ml-2">— {sectionContent}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Pricing
                if (section.type === 'pricing' && sectionContent) {
                  const pricingDisplay = typeof sectionContent === 'string' && sectionContent.startsWith('$')
                    ? sectionContent
                    : `$${sectionContent}`;
                  return (
                    <div key={index}>
                      <h2 className="text-xl font-semibold text-foreground mb-3 pb-2 border-b border-border">Investment</h2>
                      <div className="p-5 rounded-xl border border-border" style={{ backgroundColor: accentColorFaded }}>
                        <p className="text-lg font-bold" style={{ color: accentColor }}>
                          Total Project Investment: {pricingDisplay}
                        </p>
                      </div>
                    </div>
                  );
                }

                // Generic section
                return (
                  <div key={index}>
                    <h2 className="text-xl font-semibold text-foreground mb-3 pb-2 border-b border-border">
                      {sectionLabel}
                    </h2>
                    <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
                      {sectionContent || 'No content available.'}
                    </p>
                  </div>
                );
              }
            }
          })}
        </div>
      );
    }

    // Legacy flat-key content format
    const legacyFields = [
      { key: 'summary', label: 'Executive Summary' },
      { key: 'deliverables', label: 'Deliverables' },
      { key: 'timeline', label: 'Timeline' },
      { key: 'pricing', label: 'Investment' },
      { key: 'payment_terms', label: 'Payment Terms' },
      { key: 'company_bio', label: 'About' },
      { key: 'next_steps', label: 'Next Steps' },
    ];

    const logoUrl2 = content.logoUrl || content.company_logo || null;

    return (
      <div className="space-y-8">
        {/* Cover */}
        <div className="text-center py-10 px-6 rounded-xl border border-border" style={{ background: `linear-gradient(135deg, ${accentColorFaded}, transparent)` }}>
          {logoUrl2 && (
            <div className="mb-5">
              <img src={logoUrl2} alt="Company Logo" className="h-14 w-auto mx-auto rounded" />
            </div>
          )}
          {content.company_name && (
            <p className="text-sm font-medium tracking-widest uppercase mb-3" style={{ color: accentColor }}>
              {content.company_name}
            </p>
          )}
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            {proposal?.title}
          </h1>
          <p className="text-base text-muted-foreground">Prepared for {proposal?.client_name}</p>
        </div>

        {/* Sections */}
        {legacyFields.map(({ key, label }) => {
          const value = content[key];
          if (!value) return null;

          if (key === 'timeline') {
            if (typeof value === 'string') {
              return (
                <div key={key}>
                  <h2 className="text-xl font-semibold text-foreground mb-3 pb-2 border-b border-border">{label}</h2>
                  <div className="relative pl-6">
                    <div className="absolute left-[7px] top-2 bottom-2 w-0.5 rounded" style={{ backgroundColor: accentColor, opacity: 0.3 }} />
                    <div className="relative flex items-start gap-3">
                      <div className="absolute -left-6 top-1.5 h-3 w-3 rounded-full border-2 bg-background" style={{ borderColor: accentColor }} />
                      <div className="flex-1 rounded-lg p-3 border border-border" style={{ backgroundColor: accentColorFaded }}>
                        <span className="font-semibold text-foreground">Project Duration</span>
                        <span className="text-muted-foreground ml-2">— {value}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          }

          if (key === 'pricing') {
            const rawPricing = value;
            const pricingDisplay = typeof rawPricing === 'string' && rawPricing.startsWith('$')
              ? rawPricing
              : `$${rawPricing}`;

            return (
              <div key={key}>
                <h2 className="text-xl font-semibold text-foreground mb-3 pb-2 border-b border-border">{label}</h2>
                <div className="p-5 rounded-xl border border-border" style={{ backgroundColor: accentColorFaded }}>
                  <p className="text-lg font-bold" style={{ color: accentColor }}>
                    Total Project Investment: {pricingDisplay}
                  </p>
                </div>
              </div>
            );
          }

          if (key === 'deliverables' && typeof value === 'string') {
            const items = value.split('\n').map((l: string) => l.replace(/^[\-\•]\s*/, '').trim()).filter(Boolean);
            return (
              <div key={key}>
                <h2 className="text-xl font-semibold text-foreground mb-3 pb-2 border-b border-border">{label}</h2>
                <ul className="space-y-1.5 ml-1">
                  {items.map((item: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-muted-foreground">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: accentColor }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          }

          return (
            <div key={key}>
              <h2 className="text-xl font-semibold text-foreground mb-3 pb-2 border-b border-border">{label}</h2>
              <p className="whitespace-pre-line leading-relaxed text-muted-foreground">{typeof value === 'string' ? value : JSON.stringify(value)}</p>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading proposal...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2 text-foreground">Unable to Load Proposal</h2>
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

  const allSigned = signers.length > 0 && signers.every(s => s.status === 'signed');

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        <div id="proposal-content" className="max-w-4xl mx-auto">
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
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadPdf}
                    disabled={downloadingPdf}
                  >
                    {downloadingPdf ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Download className="h-4 w-4 mr-1" />}
                    Download PDF
                  </Button>
                  <Badge variant={allSigned ? "default" : "secondary"}>
                    {allSigned ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <Eye className="h-3 w-3 mr-1" />
                    )}
                    {allSigned ? 'Signed' : 'Shared Proposal'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content */}
          <Card>
            <CardContent className="p-8">
              {renderContent(proposal.content)}
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
            <p>This proposal was shared securely via Craft Proposal</p>
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
