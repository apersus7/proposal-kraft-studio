import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, FileText, Calendar, DollarSign, Building2, Eye, CreditCard, Edit, ArrowLeft, Share2, PenTool, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import ESignatureFlow from '@/components/ESignature/ESignatureFlow';
import PaymentLinks from '@/components/PaymentLinks';
import ProposalSharing from '@/components/ProposalSharing';
import ExportDialog from '@/components/ProposalEditor/ExportDialog';

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

export default function ProposalPreview() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [proposal, setProposal] = useState<ProposalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signers, setSigners] = useState<any[]>([]);

  useEffect(() => {
    // Redirect to auth if not logged in
    if (!user && !loading) {
      navigate('/auth');
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to view this proposal.',
        variant: 'destructive'
      });
      return;
    }
    
    if (id && user) {
      fetchProposal();
    }
  }, [id, user, navigate]);

  const fetchProposal = async () => {
    if (!id || !user) return;
    
    try {
      setLoading(true);
      console.log('Fetching proposal:', id);
      
      // Fetch the proposal data
      const { data: proposalData, error: proposalError } = await supabase
        .from('proposals')
        .select('id, title, client_name, client_email, content, worth, created_at, status')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      console.log('Proposal data:', proposalData);
      console.log('Proposal error:', proposalError);

      if (proposalError || !proposalData) {
        setError('Proposal not found or you do not have permission to view it.');
        return;
      }

      setProposal(proposalData);

      // Fetch signers for this proposal
      const { data: signersData } = await supabase
        .from('proposal_signatures')
        .select('*')
        .eq('proposal_id', id)
        .order('created_at', { ascending: true });
      
      if (signersData) {
        setSigners(signersData);
      }

    } catch (error: any) {
      console.error('Error fetching proposal:', error);
      setError('Failed to load proposal. Please try again.');
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

  const renderContent = (content: any) => {
    if (!content || typeof content !== 'object') {
      return <p className="text-muted-foreground">No content available.</p>;
    }

    const primaryColor = content.primaryColor || '#3b82f6';
    const secondaryColor = content.secondaryColor || '#1e40af';
    const backgroundColor = content.backgroundColor || '#ffffff';
    const textColor = content.textColor || '#000000';
    const headingColor = content.headingColor || '#000000';
    const selectedFont = content.selectedFont || 'Inter';

    // Check if content has sections array (new format)
    if (content.sections && Array.isArray(content.sections)) {
      return (
        <div style={{ fontFamily: selectedFont, backgroundColor: backgroundColor, color: textColor }} className="p-6 rounded-lg">
          {content.sections.map((section: any, index: number) => {
            if (!section || typeof section !== 'object') return null;

            // Handle different section types
            switch (section.type) {
              case 'cover_page':
                return (
                  <div key={index} className="text-center mb-12 p-8 rounded-lg border-2" style={{ borderColor: `${primaryColor}20` }}>
                    {content.logoUrl && (
                      <div className="mb-6">
                        <img src={content.logoUrl} alt="Company Logo" className="h-16 w-auto mx-auto" />
                      </div>
                    )}
                    <div className="text-sm mb-2" style={{ color: secondaryColor }}>
                      {section.company_name || 'Your Company'}
                    </div>
                    <h1 className="text-4xl font-bold mb-4" style={{ color: headingColor }}>
                      {proposal?.title}
                    </h1>
                    <p className="text-xl mb-2">Project: {content.project_name}</p>
                    <p className="text-lg mb-4">Prepared for {proposal?.client_name}</p>
                    {section.tagline && (
                      <p className="text-lg italic" style={{ color: secondaryColor }}>
                        {section.tagline}
                      </p>
                    )}
                  </div>
                );

              case 'objective':
                return section.content ? (
                  <div key={index} className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 pb-2 border-b-2" style={{ color: headingColor, borderColor: `${primaryColor}20` }}>
                      Project Objective
                    </h2>
                    <div className="prose max-w-none">
                      <p className="whitespace-pre-line leading-relaxed">{section.content}</p>
                    </div>
                  </div>
                ) : null;

              case 'proposed_solution':
                return (section.content || section.why_fits || section.tools?.length > 0) ? (
                  <div key={index} className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 pb-2 border-b-2" style={{ color: headingColor, borderColor: `${primaryColor}20` }}>
                      Proposed Solution
                    </h2>
                    {section.content && (
                      <div className="mb-4">
                        <p className="whitespace-pre-line leading-relaxed">{section.content}</p>
                      </div>
                    )}
                    {section.why_fits && (
                      <div className="mb-4">
                        <h3 className="text-lg font-medium mb-2">Why This Solution Fits:</h3>
                        <p className="whitespace-pre-line leading-relaxed">{section.why_fits}</p>
                      </div>
                    )}
                    {section.tools?.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium mb-2">Tools & Technologies:</h3>
                        <p>{section.tools.join(', ')}</p>
                      </div>
                    )}
                  </div>
                ) : null;

              case 'scope_of_work':
                return (section.content || section.deliverables?.length > 0 || section.timeline?.length > 0) ? (
                  <div key={index} className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 pb-2 border-b-2" style={{ color: headingColor, borderColor: `${primaryColor}20` }}>
                      Scope of Work
                    </h2>
                    {section.content && (
                      <div className="mb-4">
                        <p className="whitespace-pre-line leading-relaxed">{section.content}</p>
                      </div>
                    )}
                    {section.deliverables?.length > 0 && (
                      <div className="mb-4">
                        <h3 className="text-lg font-medium mb-2">Key Deliverables:</h3>
                        <ul className="list-disc list-inside space-y-1">
                          {section.deliverables.map((item: string, idx: number) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {section.timeline?.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium mb-2">Timeline:</h3>
                        <div className="space-y-2">
                          {section.timeline.map((phase: any, idx: number) => (
                            <div 
                              key={idx} 
                              className="p-3 rounded border-l-4" 
                              style={{ 
                                backgroundColor: section.timelineColor ? `${section.timelineColor}10` : '#f9fafb',
                                borderLeftColor: section.timelineColor || primaryColor
                              }}
                            >
                              <span className="font-medium">{phase.phase}:</span> {phase.duration}{phase.description ? ` - ${phase.description}` : ''}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null;

              case 'pricing':
                return (
                  <div key={index} className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 pb-2 border-b-2" style={{ color: headingColor, borderColor: `${primaryColor}20` }}>
                      Investment
                    </h2>
                    <div 
                      className="p-6 rounded-lg border-2" 
                      style={{ 
                        backgroundColor: section.highlightColor ? `${section.highlightColor}10` : '#f9fafb',
                        borderColor: section.highlightColor || primaryColor
                      }}
                    >
                      <p className="text-xl font-bold mb-2" style={{ color: section.highlightColor || primaryColor }}>
                        Total Project Investment: {content.currency === 'EUR' ? '€' : content.currency === 'GBP' ? '£' : '$'}{content.pricing || proposal?.worth || 'XX,XXX'}
                      </p>
                      {section.payment_terms && (
                        <p><strong>Payment Terms:</strong> {section.payment_terms}</p>
                      )}
                      {section.breakdown && (
                        <div className="mt-4">
                          <h4 className="font-medium mb-2">Value Breakdown:</h4>
                          <p className="whitespace-pre-line">{section.breakdown}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );

              case 'value_proposition':
                return section.testimonials?.length > 0 ? (
                  <div key={index} className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 pb-2 border-b-2" style={{ color: headingColor, borderColor: `${primaryColor}20` }}>
                      Client Testimonials
                    </h2>
                    <div className="space-y-4">
                      {section.testimonials.map((testimonial: any, idx: number) => (
                        <div 
                          key={idx} 
                          className="p-4 rounded-lg border-l-4" 
                          style={{ 
                            backgroundColor: section.testimonialColor ? `${section.testimonialColor}10` : '#f9fafb',
                            borderLeftColor: section.testimonialColor || primaryColor
                          }}
                        >
                          {testimonial.content && (
                            <p className="italic mb-2">"{testimonial.content}"</p>
                          )}
                          <div className="flex items-center justify-between">
                            {testimonial.name && (
                              <p className="font-medium"><span className="font-black">•</span> {testimonial.name}</p>
                            )}
                            {testimonial.link && (
                              <a 
                                href={testimonial.link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                View Profile
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null;

              case 'why_us':
                return (section.content || section.advantages?.length > 0 || section.differentiators?.length > 0) ? (
                  <div key={index} className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 pb-2 border-b-2" style={{ color: headingColor, borderColor: `${primaryColor}20` }}>
                      Why Choose Us
                    </h2>
                    {section.content && (
                      <div className="mb-4">
                        <p className="whitespace-pre-line leading-relaxed">{section.content}</p>
                      </div>
                    )}
                    {section.advantages?.length > 0 && (
                      <div className="mb-4">
                        <h3 className="text-lg font-medium mb-2">Key Advantages:</h3>
                        <ul className="list-disc list-inside space-y-1">
                          {section.advantages.map((item: string, idx: number) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {section.differentiators?.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium mb-2">What Sets Us Apart:</h3>
                        <ul className="list-disc list-inside space-y-1">
                          {section.differentiators.map((item: string, idx: number) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : null;

              case 'call_to_action':
                return section.next_steps ? (
                  <div key={index} className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 pb-2 border-b-2" style={{ color: headingColor, borderColor: `${primaryColor}20` }}>
                      Next Steps
                    </h2>
                    <p className="whitespace-pre-line leading-relaxed mb-4">{section.next_steps}</p>
                    {section.contact_details && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">Contact Information:</h4>
                        <div className="whitespace-pre-line">{section.contact_details}</div>
                      </div>
                    )}
                  </div>
                ) : null;

              case 'payment_link':
                return (
                  <div key={index} className="mb-8">
                    <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 rounded-lg border">
                      <h3 className="text-xl font-semibold mb-2 text-center">{section.title}</h3>
                      <p className="text-muted-foreground mb-4 text-center">{section.content?.text}</p>
                      {section.content?.paymentUrl ? (
                        <div className="text-center">
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
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground text-sm">
                          Payment link will be available soon
                        </div>
                      )}
                    </div>
                  </div>
                );

              default:
                return (
                  <div key={index} className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 pb-2 border-b-2" style={{ color: headingColor, borderColor: `${primaryColor}20` }}>
                      {section.title || section.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </h2>
                    <div className="prose max-w-none">
                      <p className="whitespace-pre-wrap">
                        {section.content?.text || section.content || 'No content available.'}
                      </p>
                    </div>
                  </div>
                );
            }
          })}
        </div>
      );
    }

    // Legacy content format support
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header with Action Buttons */}
          <Card className="mb-8">
            <CardContent className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4 flex-wrap">
                    <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Dashboard
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm" 
                      onClick={() => navigate(`/create-proposal?edit=${id}`)}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Proposal
                    </Button>
                    <ProposalSharing 
                      proposalId={proposal.id} 
                      proposalTitle={proposal.title}
                    />
                    <ExportDialog 
                      proposal={proposal}
                      trigger={
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                      }
                    />
                    <PaymentLinks 
                      proposalId={proposal.id}
                      proposalAmount={proposal.worth?.toString()}
                      proposalCurrency="USD"
                    />
                  </div>
                  <h1 className="text-3xl font-bold text-foreground mb-2">
                    {proposal.title}
                  </h1>
                  <div className="flex items-center gap-4 text-muted-foreground flex-wrap">
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
                  Proposal View
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Main Content with Tabs */}
          <Tabs defaultValue="preview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="preview">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="payment">
                <CreditCard className="h-4 w-4 mr-2" />
                Payment
              </TabsTrigger>
              <TabsTrigger value="signature">
                <PenTool className="h-4 w-4 mr-2" />
                E-Signature
              </TabsTrigger>
            </TabsList>

            <TabsContent value="preview">
              <Card>
                <CardContent className="p-8">
                  <div className="prose prose-slate max-w-none">
                    {renderContent(proposal.content)}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payment">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Payment Management
                  </h3>
                  <PaymentLinks 
                    proposalId={proposal.id}
                    proposalAmount={proposal.worth?.toString()}
                    proposalCurrency="USD"
                    defaultOpen={true}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="signature">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Electronic Signatures
                  </h3>
                  <ESignatureFlow
                    proposalId={proposal.id}
                    signers={signers}
                    onSignersUpdate={setSigners}
                    isOwner={true}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Footer */}
          <div className="mt-8 text-center text-muted-foreground">
            <p>Powered by ProposalKraft</p>
          </div>
        </div>
      </div>
    </div>
  );
}