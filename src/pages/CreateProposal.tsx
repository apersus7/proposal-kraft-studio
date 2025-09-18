import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, Upload, Eye, Save, Star, Zap, Shield, Briefcase, Palette, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ColorThemeSelector } from '@/components/ColorThemeSelector';
import { CompanyResearch } from '@/components/CompanyResearch';
import TemplateGallery from '@/components/TemplateGallery';

const logo = '/lovable-uploads/22b8b905-b997-42da-85df-b966b4616f6e.png';

interface Template {
  id: string;
  name: string;
  description: string;
  preview_image_url: string | null;
  template_data: any;
  is_public: boolean;
  category: string;
  industry: string;
  tags: string[];
}

export default function CreateProposal() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  // templates state removed
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [step, setStep] = useState<'template' | 'theme' | 'details' | 'content'>('template');
  const [selectedColorTheme, setSelectedColorTheme] = useState<string>('modern');
  const [generatingAI, setGeneratingAI] = useState<string | null>(null);
  
  const [proposalData, setProposalData] = useState<any>({
    title: '',
    client_name: '',
    client_email: '',
    project_name: '',
    pricing: '',
    currency: 'USD',
    content: {
      sections: [
        { type: 'cover_page', title: '', tagline: '', company_name: '', company_logo: '' },
        { type: 'executive_summary', content: '' },
        { type: 'client_problem', content: '' },
        { type: 'proposed_solution', content: '', approach: '', tools: [], why_fits: '' },
        { type: 'scope_of_work', deliverables: [], timeline: [], included: [], excluded: [] },
        { type: 'pricing', packages: [], payment_terms: '', total: '' },
        { type: 'value_proposition', advantages: [], case_studies: [], testimonials: [], team: [] },
        { type: 'terms_conditions', content: '' },
        { type: 'call_to_action', next_steps: '', contact_details: '' }
      ]
    },
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
  }, [user, navigate]);

  // fetchTemplates removed

  // Helpers to update content sections in local state
  const updateSectionValue = (sectionType: string, field: string, value: any) => {
    setProposalData(prev => {
      const sections = Array.isArray(prev.content?.sections) ? [...prev.content.sections] : [];
      const idx = sections.findIndex((s: any) => s.type === sectionType);
      if (idx >= 0) {
        sections[idx] = { ...sections[idx], [field]: value };
      } else {
        sections.push({ type: sectionType, [field]: value });
      }
      return { ...prev, content: { ...prev.content, sections } };
    });
  };

  const generateAIContent = async (section: string, context?: string) => {
    setGeneratingAI(section);
    try {
      const { data, error } = await supabase.functions.invoke('generate-proposal-content', {
        body: { section, context }
      });
      if (error) throw error;
      if (data?.content) {
        updateSectionValue(section, 'content', data.content);
        toast({ title: 'AI Content Generated', description: `${section.replace('_', ' ')} updated` });
      }
    } catch (err) {
      console.error('Error generating AI content:', err);
      toast({ title: 'Error', description: 'Failed to generate content', variant: 'destructive' });
    } finally {
      setGeneratingAI(null);
    }
  };

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    setProposalData(prev => ({ ...prev, content: template.template_data }));
    setStep('theme');
  };
  const handleTemplateUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setLoading(true);
    try {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('templates')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Create template record
      const { data, error } = await supabase
        .from('templates')
        .insert({
          name: file.name.replace(/\.[^/.]+$/, ""),
          description: 'Custom uploaded template',
          created_by: user.id,
          is_public: false,
          template_data: { type: 'custom', file_path: fileName }
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success", 
        description: "Template uploaded successfully!"
      });
    } catch (error) {
      console.error('Error uploading template:', error);
      toast({
        title: "Error",
        description: "Failed to upload template",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
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
          content: {
            ...proposalData.content,
            project_name: proposalData.project_name,
            pricing: proposalData.pricing,
            currency: proposalData.currency,
            colorTheme: selectedColorTheme
          },
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
                <img src={logo} alt="ProposalKraft" className="h-8" />
                <span className="text-xl font-bold text-primary">ProposalKraft</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">Step {step === 'template' ? '1' : step === 'theme' ? '2' : step === 'details' ? '3' : '4'} of 4</Badge>
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
                Select a professional template designed for your industry and needs
              </p>
            </div>

            {/* Upload a custom template */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow border-dashed border-2 border-primary/30 bg-primary/5">
                <CardContent className="p-6 text-center">
                  <Upload className="h-12 w-12 text-primary mx-auto mb-4" />
                  <CardTitle className="mb-2">Upload Custom Template</CardTitle>
                  <CardDescription>
                    Upload your own template design
                  </CardDescription>
                  <input
                    type="file"
                    accept=".json,.pdf,.doc,.docx"
                    className="hidden"
                    id="template-upload"
                    onChange={handleTemplateUpload}
                  />
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => document.getElementById('template-upload')?.click()}
                  >
                    Upload Template
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Canva-like template gallery */}
            <div className="mt-8">
              <TemplateGallery onSelectTemplate={handleTemplateSelect} selectedTemplate={selectedTemplate} />
            </div>
          </div>
        )}

        {step === 'theme' && (
          <ColorThemeSelector
            selectedTheme={selectedColorTheme}
            onThemeSelect={setSelectedColorTheme}
            onNext={() => setStep('details')}
            onBack={() => setStep('template')}
          />
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
                    onChange={(e) => {
                      const email = e.target.value;
                      // Only allow valid email characters
                      if (email === '' || /^[a-zA-Z0-9._%+-]*@?[a-zA-Z0-9.-]*\.?[a-zA-Z]*$/.test(email)) {
                        setProposalData(prev => ({ ...prev, client_email: email }));
                      }
                    }}
                    placeholder="contact@acme.com"
                    pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project_name">Service to be Delivered</Label>
                  <Input
                    id="project_name"
                    value={proposalData.project_name}
                    onChange={(e) => setProposalData(prev => ({ ...prev, project_name: e.target.value }))}
                    placeholder="Website Redesign & Development"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pricing">Total Project Value</Label>
                  <div className="flex space-x-2">
                    <Select
                      value={proposalData.currency}
                      onValueChange={(value) => setProposalData(prev => ({ ...prev, currency: value }))}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                        <SelectItem value="CAD">CAD ($)</SelectItem>
                        <SelectItem value="AUD">AUD ($)</SelectItem>
                        <SelectItem value="JPY">JPY (¥)</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      id="pricing"
                      type="number"
                      min="0"
                      step="0.01"
                      value={proposalData.pricing}
                      onChange={(e) => setProposalData(prev => ({ ...prev, pricing: e.target.value }))}
                      placeholder="15000"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button variant="outline" onClick={() => setStep('theme')}>
                    Back
                  </Button>
                  <Button 
                    onClick={() => setStep('content')}
                    disabled={!proposalData.title || !proposalData.client_name || !proposalData.project_name || !proposalData.pricing}
                  >
                    Continue to Content
                  </Button>
                </div>
              </CardContent>
              </Card>

              <div className="mt-8">
                <Card className="max-w-3xl">
                  <CardHeader>
                    <CardTitle>Company Research & Analysis</CardTitle>
                    <CardDescription>
                      Analyze the client's company to extract pain points and opportunities
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CompanyResearch 
                      onResearchComplete={(data) => {
                        const bullets = data.painPoints.map((p: string) => `• ${p}`).join('\n');
                        updateSectionValue('client_problem', 'content', `Key pain points for ${data.companyName}:\n${bullets}`);
                        toast({ 
                          title: 'Analysis added', 
                          description: 'Pain points inserted into client needs section' 
                        });
                      }}
                    />
                  </CardContent>
                </Card>
              </div>
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
                    {/* Cover Page */}
                    <div className="text-center mb-8 border-b pb-6">
                      <h1 className="text-3xl font-bold mb-2">{proposalData.title}</h1>
                      <p className="text-lg text-gray-600 mb-2">Project: {proposalData.project_name}</p>
                      <p className="text-gray-600">Prepared for {proposalData.client_name}</p>
                      <p className="text-gray-500 text-sm mt-2">
                        Helping {proposalData.client_name} achieve success with innovative solutions
                      </p>
                    </div>
                    
                    <div className="space-y-6">
                      <section>
                        <h2 className="text-xl font-semibold mb-3 text-primary border-b border-gray-200 pb-2">
                          Executive Summary
                        </h2>
                        <p className="text-gray-700">
                          This proposal outlines our comprehensive approach to delivering exceptional results for your {proposalData.project_name || 'project'}.
                        </p>
                      </section>
                      
                      <section>
                        <h2 className="text-xl font-semibold mb-3 text-primary border-b border-gray-200 pb-2">
                          Understanding Your Needs
                        </h2>
                        <p className="text-gray-700">
                          We understand the challenges you're facing and are committed to providing tailored solutions.
                        </p>
                      </section>
                      
                      <section>
                        <h2 className="text-xl font-semibold mb-3 text-primary border-b border-gray-200 pb-2">
                          Our Solution
                        </h2>
                        <p className="text-gray-700">
                          Our proven methodology and cutting-edge approach will deliver measurable results.
                        </p>
                      </section>
                      
                      <section>
                        <h2 className="text-xl font-semibold mb-3 text-primary border-b border-gray-200 pb-2">
                          Scope of Work
                        </h2>
                        <ul className="list-disc list-inside text-gray-700 space-y-1">
                          <li>Initial consultation and requirements gathering</li>
                          <li>Strategic planning and design phase</li>
                          <li>Development and implementation</li>
                          <li>Testing, refinement, and launch</li>
                        </ul>
                      </section>
                      
                      <section>
                        <h2 className="text-xl font-semibold mb-3 text-primary border-b border-gray-200 pb-2">
                          Investment
                        </h2>
                        <p className="text-lg font-medium text-gray-800">
                          Total Project Investment: {proposalData.pricing || '$XX,XXX'}
                        </p>
                      </section>
                      
                      <section>
                        <h2 className="text-xl font-semibold mb-3 text-primary border-b border-gray-200 pb-2">
                          Next Steps
                        </h2>
                        <p className="text-gray-700">
                          Ready to get started? Let's schedule a kickoff call to begin transforming your vision into reality.
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
                    <CardTitle>AI Assistant</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      onClick={() => generateAIContent('executive_summary', `${proposalData.client_name} - ${proposalData.project_name}`)}
                      disabled={generatingAI === 'executive_summary'}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      {generatingAI === 'executive_summary' ? 'Generating...' : 'Generate Executive Summary'}
                    </Button>

                    <Button 
                      onClick={() => generateAIContent('scope_of_work', proposalData.project_name)}
                      disabled={generatingAI === 'scope_of_work'}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      {generatingAI === 'scope_of_work' ? 'Generating...' : 'Generate Scope of Work'}
                    </Button>

                    <Button 
                      onClick={() => generateAIContent('timeline', proposalData.project_name)}
                      disabled={generatingAI === 'timeline'}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      {generatingAI === 'timeline' ? 'Generating...' : 'Generate Timeline'}
                    </Button>

                    <Button 
                      onClick={() => generateAIContent('pricing', proposalData.pricing)}
                      disabled={generatingAI === 'pricing'}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      {generatingAI === 'pricing' ? 'Generating...' : 'Generate Pricing'}
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