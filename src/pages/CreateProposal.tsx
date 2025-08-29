import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, Upload, Eye, Save } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const logo = '/lovable-uploads/22b8b905-b997-42da-85df-b966b4616f6e.png';

interface Template {
  id: string;
  name: string;
  description: string;
  preview_image_url: string | null;
  template_data: any;
  is_public: boolean;
}

export default function CreateProposal() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [step, setStep] = useState<'template' | 'details' | 'content'>('template');
  
  const [proposalData, setProposalData] = useState({
    title: '',
    client_name: '',
    client_email: '',
    content: {},
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchTemplates();
  }, [user, navigate]);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive"
      });
    }
  };

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    setProposalData(prev => ({ ...prev, content: template.template_data }));
    setStep('details');
  };

  const handleCreateProposal = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('proposals')
        .insert({
          user_id: user.id,
          title: proposalData.title,
          client_name: proposalData.client_name,
          client_email: proposalData.client_email,
          content: proposalData.content,
          template_id: selectedTemplate?.id,
          status: 'draft'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Proposal created successfully!"
      });

      navigate(`/proposal/${data.id}`);
    } catch (error) {
      console.error('Error creating proposal:', error);
      toast({
        title: "Error",
        description: "Failed to create proposal",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

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
            <div className="flex items-center space-x-2">
              <Badge variant="outline">Step {step === 'template' ? '1' : step === 'details' ? '2' : '3'} of 3</Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {step === 'template' && (
          <div>
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">Choose a Template</h1>
              <p className="text-muted-foreground">
                Select a professional template to get started with your proposal
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow border-dashed border-2 border-primary/30 bg-primary/5">
                <CardContent className="p-6 text-center">
                  <Upload className="h-12 w-12 text-primary mx-auto mb-4" />
                  <CardTitle className="mb-2">Upload Custom Template</CardTitle>
                  <CardDescription>
                    Upload your own template design
                  </CardDescription>
                  <Button variant="outline" className="mt-4">
                    Upload Template
                  </Button>
                </CardContent>
              </Card>

              {templates.map((template) => (
                <Card key={template.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleTemplateSelect(template)}>
                  {template.preview_image_url && (
                    <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
                      <img 
                        src={template.preview_image_url} 
                        alt={template.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <CardTitle className="text-lg mb-2">{template.name}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                    <Button className="w-full mt-4">
                      <FileText className="h-4 w-4 mr-2" />
                      Use This Template
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {step === 'details' && (
          <div>
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">Proposal Details</h1>
              <p className="text-muted-foreground">
                Enter the basic information for your proposal
              </p>
            </div>

            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Fill in the details about your proposal and client
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Proposal Title</Label>
                  <Input
                    id="title"
                    value={proposalData.title}
                    onChange={(e) => setProposalData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Website Redesign Proposal"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_name">Client Name</Label>
                  <Input
                    id="client_name"
                    value={proposalData.client_name}
                    onChange={(e) => setProposalData(prev => ({ ...prev, client_name: e.target.value }))}
                    placeholder="Acme Corporation"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_email">Client Email</Label>
                  <Input
                    id="client_email"
                    type="email"
                    value={proposalData.client_email}
                    onChange={(e) => setProposalData(prev => ({ ...prev, client_email: e.target.value }))}
                    placeholder="contact@acme.com"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button variant="outline" onClick={() => setStep('template')}>
                    Back
                  </Button>
                  <Button 
                    onClick={() => setStep('content')}
                    disabled={!proposalData.title || !proposalData.client_name}
                  >
                    Continue to Content
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 'content' && (
          <div>
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">Customize Content</h1>
              <p className="text-muted-foreground">
                Review and customize your proposal content
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Proposal Preview</CardTitle>
                  <CardDescription>
                    This is how your proposal will look to clients
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-[8.5/11] bg-white border rounded-lg p-6 text-sm text-black overflow-auto">
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold mb-2">{proposalData.title}</h2>
                      <p className="text-gray-600">Prepared for {proposalData.client_name}</p>
                    </div>
                    
                    <div className="space-y-4">
                      <section>
                        <h3 className="text-lg font-semibold mb-2">Executive Summary</h3>
                        <p className="text-gray-700">
                          This proposal outlines our comprehensive approach to delivering exceptional results for your project.
                        </p>
                      </section>
                      
                      <section>
                        <h3 className="text-lg font-semibold mb-2">Scope of Work</h3>
                        <ul className="list-disc list-inside text-gray-700 space-y-1">
                          <li>Initial consultation and requirements gathering</li>
                          <li>Design and development phase</li>
                          <li>Testing and quality assurance</li>
                          <li>Deployment and launch</li>
                        </ul>
                      </section>
                      
                      <section>
                        <h3 className="text-lg font-semibold mb-2">Investment</h3>
                        <p className="text-gray-700">
                          Total project investment: $X,XXX
                        </p>
                      </section>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button 
                      onClick={handleCreateProposal} 
                      disabled={loading}
                      className="w-full"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? 'Creating...' : 'Save as Draft'}
                    </Button>
                    
                    <Button variant="outline" className="w-full">
                      <Eye className="h-4 w-4 mr-2" />
                      Preview Full Proposal
                    </Button>
                    
                    <Button variant="outline" onClick={() => setStep('details')}>
                      Back to Details
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Template Info</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium">{selectedTemplate?.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedTemplate?.description}</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}