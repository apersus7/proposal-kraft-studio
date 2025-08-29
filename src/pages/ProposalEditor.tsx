import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Send, Eye, Download } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const logo = '/lovable-uploads/22b8b905-b997-42da-85df-b966b4616f6e.png';

interface Proposal {
  id: string;
  title: string;
  client_name: string;
  client_email: string;
  content: any;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function ProposalEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [proposal, setProposal] = useState<Proposal | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (id) {
      fetchProposal();
    }
  }, [user, navigate, id]);

  const fetchProposal = async () => {
    if (!id || !user) return;

    try {
      const { data, error } = await supabase
        .from('proposals')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setProposal(data);
    } catch (error) {
      console.error('Error fetching proposal:', error);
      toast({
        title: "Error",
        description: "Failed to load proposal",
        variant: "destructive"
      });
      navigate('/dashboard');
    }
  };

  const handleSave = async () => {
    if (!proposal || !user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('proposals')
        .update({
          title: proposal.title,
          client_name: proposal.client_name,
          client_email: proposal.client_email,
          content: proposal.content,
          updated_at: new Date().toISOString(),
        })
        .eq('id', proposal.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Proposal saved successfully"
      });
    } catch (error) {
      console.error('Error saving proposal:', error);
      toast({
        title: "Error",
        description: "Failed to save proposal",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!proposal || !user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('proposals')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', proposal.id);

      if (error) throw error;

      setProposal(prev => prev ? { ...prev, status: 'sent' } : null);
      toast({
        title: "Success",
        description: "Proposal sent to client!"
      });
    } catch (error) {
      console.error('Error sending proposal:', error);
      toast({
        title: "Error",
        description: "Failed to send proposal",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user || !proposal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center">
        <div className="text-center">
          <img src={logo} alt="Proposal kraft" className="h-12 mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading proposal...</p>
        </div>
      </div>
    );
  }

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
                <img src={logo} alt="Proposal kraft" className="h-8" />
                <span className="text-xl font-bold text-primary">Proposal kraft</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant={proposal.status === 'sent' ? 'default' : 'secondary'}>
                {proposal.status}
              </Badge>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
                <Button onClick={handleSave} disabled={loading} size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                {proposal.status !== 'sent' && (
                  <Button onClick={handleSend} disabled={loading}>
                    <Send className="h-4 w-4 mr-2" />
                    Send to Client
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Editor */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Proposal Details</CardTitle>
                <CardDescription>
                  Edit the basic information for your proposal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={proposal.title}
                    onChange={(e) => setProposal(prev => prev ? { ...prev, title: e.target.value } : null)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_name">Client Name</Label>
                  <Input
                    id="client_name"
                    value={proposal.client_name}
                    onChange={(e) => setProposal(prev => prev ? { ...prev, client_name: e.target.value } : null)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_email">Client Email</Label>
                  <Input
                    id="client_email"
                    type="email"
                    value={proposal.client_email || ''}
                    onChange={(e) => setProposal(prev => prev ? { ...prev, client_email: e.target.value } : null)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Content Sections</CardTitle>
                <CardDescription>
                  Customize the content of your proposal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="executive_summary">Executive Summary</Label>
                  <Textarea
                    id="executive_summary"
                    placeholder="Provide a brief overview of your proposal..."
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scope_of_work">Scope of Work</Label>
                  <Textarea
                    id="scope_of_work"
                    placeholder="Detail the work to be performed..."
                    className="min-h-[150px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeline">Timeline</Label>
                  <Textarea
                    id="timeline"
                    placeholder="Outline the project timeline..."
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="investment">Investment</Label>
                  <Textarea
                    id="investment"
                    placeholder="Detail the pricing and payment terms..."
                    className="min-h-[100px]"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Live Preview</CardTitle>
                <CardDescription>
                  See how your proposal will look to clients
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-[8.5/11] bg-white border rounded-lg p-8 text-sm text-black overflow-auto">
                  <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2">{proposal.title}</h1>
                    <p className="text-gray-600 text-lg">Prepared for {proposal.client_name}</p>
                    <p className="text-gray-500">
                      {new Date().toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                  
                  <div className="space-y-6">
                    <section>
                      <h2 className="text-xl font-semibold mb-3 text-primary border-b border-gray-200 pb-2">
                        Executive Summary
                      </h2>
                      <p className="text-gray-700 leading-relaxed">
                        This proposal outlines our comprehensive approach to delivering exceptional results for your project. 
                        We bring years of experience and a proven track record of success to ensure your objectives are met 
                        and exceeded.
                      </p>
                    </section>
                    
                    <section>
                      <h2 className="text-xl font-semibold mb-3 text-primary border-b border-gray-200 pb-2">
                        Scope of Work
                      </h2>
                      <ul className="list-disc list-inside text-gray-700 space-y-2 leading-relaxed">
                        <li>Initial consultation and comprehensive requirements gathering</li>
                        <li>Strategic planning and project roadmap development</li>
                        <li>Design and development phase with regular checkpoints</li>
                        <li>Comprehensive testing and quality assurance</li>
                        <li>Deployment, launch, and post-launch support</li>
                      </ul>
                    </section>
                    
                    <section>
                      <h2 className="text-xl font-semibold mb-3 text-primary border-b border-gray-200 pb-2">
                        Timeline
                      </h2>
                      <div className="text-gray-700 space-y-2">
                        <p><strong>Phase 1:</strong> Discovery & Planning (2 weeks)</p>
                        <p><strong>Phase 2:</strong> Design & Development (6-8 weeks)</p>
                        <p><strong>Phase 3:</strong> Testing & Refinement (2 weeks)</p>
                        <p><strong>Phase 4:</strong> Launch & Support (1 week)</p>
                      </div>
                    </section>
                    
                    <section>
                      <h2 className="text-xl font-semibold mb-3 text-primary border-b border-gray-200 pb-2">
                        Investment
                      </h2>
                      <div className="text-gray-700">
                        <p className="text-lg font-medium mb-2">Total Project Investment: $XX,XXX</p>
                        <p className="text-sm">
                          Payment terms: 50% upon contract signing, 25% at project midpoint, 25% upon completion.
                        </p>
                      </div>
                    </section>

                    <section className="mt-8 pt-6 border-t border-gray-200">
                      <div className="text-center">
                        <p className="text-gray-600 mb-2">Ready to get started?</p>
                        <p className="text-sm text-gray-500">
                          Contact us at {proposal.client_email} to discuss next steps.
                        </p>
                      </div>
                    </section>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}