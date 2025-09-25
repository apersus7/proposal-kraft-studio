import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, Calendar, DollarSign, Building2, Eye, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
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

export default function ProposalPreview() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [proposal, setProposal] = useState<ProposalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signers, setSigners] = useState<any[]>([]);

  useEffect(() => {
    if (id && user) {
      fetchProposal();
    }
  }, [id, user]);

  const fetchProposal = async () => {
    if (!id || !user) return;
    
    try {
      setLoading(true);
      
      // Fetch the proposal data
      const { data: proposalData, error: proposalError } = await supabase
        .from('proposals')
        .select('id, title, client_name, client_email, content, worth, created_at, status')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

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

    // Check if content has sections array (new format)
    if (content.sections && Array.isArray(content.sections)) {
      return content.sections.map((section: any, index: number) => {
        if (!section || typeof section !== 'object') return null;

        // Handle different section types
        switch (section.type) {
          case 'cover_page':
            return (
              <div key={index} className="text-center mb-12 p-8 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg">
                <h1 className="text-4xl font-bold mb-4" style={{ color: section.style?.titleColor || 'inherit' }}>
                  {section.title}
                </h1>
                {section.tagline && (
                  <p className="text-xl text-muted-foreground" style={{ color: section.style?.taglineColor || 'inherit' }}>
                    {section.tagline}
                  </p>
                )}
              </div>
            );

          case 'executive_summary':
            return (
              <div key={index} className="mb-8">
                <h2 className="text-2xl font-semibold mb-4 text-primary">{section.title}</h2>
                <p className="text-muted-foreground">{section.content}</p>
              </div>
            );

          case 'services':
            return (
              <div key={index} className="mb-8">
                <h2 className="text-2xl font-semibold mb-4 text-primary">{section.title}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {section.items?.map((item: string, itemIndex: number) => (
                    <div key={itemIndex} className="flex items-center p-3 bg-secondary/50 rounded-lg">
                      <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            );

          case 'pricing':
            return (
              <div key={index} className="mb-8">
                <h2 className="text-2xl font-semibold mb-4 text-primary">{section.title}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {section.packages?.map((pkg: any, pkgIndex: number) => (
                    <Card key={pkgIndex} className="p-6">
                      <h3 className="text-xl font-semibold mb-2">{pkg.name}</h3>
                      <div className="text-3xl font-bold text-primary mb-4">
                        {formatCurrency(pkg.price)}
                      </div>
                      <ul className="space-y-2">
                        {pkg.features?.map((feature: string, featureIndex: number) => (
                          <li key={featureIndex} className="flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  ))}
                </div>
              </div>
            );

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
                <h2 className="text-2xl font-semibold mb-4 text-primary">{section.title}</h2>
                <div className="prose prose-slate max-w-none">
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {section.content?.text || section.content || 'No content available.'}
                  </p>
                </div>
              </div>
            );
        }
      });
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
                  Preview
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
                  isOwner={true}
                />
              </CardContent>
            </Card>
          )}

          {/* Footer */}
          <div className="mt-8 text-center text-muted-foreground">
            <p>Powered by ProposalKraft</p>
          </div>
        </div>
      </div>
    </div>
  );
}