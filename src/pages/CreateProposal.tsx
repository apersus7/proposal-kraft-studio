import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, Upload, Eye, Save, Star, Zap, Shield, Briefcase, Palette, Sparkles, CreditCard, PenTool, Download } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
const sb = supabase as any;
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
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [step, setStep] = useState<'details' | 'theme' | 'template' | 'content'>('details');
  const [selectedColorTheme, setSelectedColorTheme] = useState<string>('modern');
  const [primaryColor, setPrimaryColor] = useState<string>('#3b82f6');
  const [secondaryColor, setSecondaryColor] = useState<string>('#1e40af');
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

  // Helpers to update content sections in local state
  const getContentValue = (sectionType: string, field?: string) => {
    if (!proposalData.content?.sections) {
      if (!field) return {};
      // Return appropriate defaults for array fields
      const arrayFields = ['timeline', 'deliverables', 'included', 'excluded', 'tools', 'advantages', 'case_studies', 'testimonials', 'team', 'packages'];
      return arrayFields.includes(field) ? [] : '';
    }
    
    const section = proposalData.content.sections.find((s: any) => s.type === sectionType);
    if (!section) {
      if (!field) return {};
      // Return appropriate defaults for array fields
      const arrayFields = ['timeline', 'deliverables', 'included', 'excluded', 'tools', 'advantages', 'case_studies', 'testimonials', 'team', 'packages'];
      return arrayFields.includes(field) ? [] : '';
    }
    
    if (!field) return section;
    
    const value = section[field];
    if (value === undefined || value === null) {
      // Return appropriate defaults for array fields
      const arrayFields = ['timeline', 'deliverables', 'included', 'excluded', 'tools', 'advantages', 'case_studies', 'testimonials', 'team', 'packages'];
      return arrayFields.includes(field) ? [] : '';
    }
    
    return value;
  };

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

  const addScopeTimelinePhase = () => {
    const currentPhases = getContentValue('scope_of_work', 'timeline') || [];
    const newPhases = [...currentPhases, { phase: '', duration: '', description: '' }];
    updateSectionValue('scope_of_work', 'timeline', newPhases);
  };

  const updateTimelinePhase = (phaseIndex: number, field: string, value: string) => {
    const currentPhases = getContentValue('scope_of_work', 'timeline') || [];
    const updatedPhases = [...currentPhases];
    
    if (updatedPhases[phaseIndex]) {
      updatedPhases[phaseIndex] = { ...updatedPhases[phaseIndex], [field]: value };
    } else {
      updatedPhases[phaseIndex] = { [field]: value };
    }
    
    updateSectionValue('scope_of_work', 'timeline', updatedPhases);
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
    setStep('content');
  };

  const handleTemplateUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await sb.storage
        .from('templates')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data, error } = await sb
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
    return createProposalAndNavigate();
  };

  const createProposalAndNavigate = async (go?: 'export' | 'payment' | 'signatures') => {
    if (!user) return;

    // Validate required fields
    if (!proposalData.title?.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a proposal title",
        variant: "destructive"
      });
      return;
    }

    if (!proposalData.client_name?.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter client name",
        variant: "destructive"
      });
      return;
    }

    if (!proposalData.client_email?.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter client email",
        variant: "destructive"
      });
      return;
    }

    if (!proposalData.project_name?.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter service to be delivered",
        variant: "destructive"
      });
      return;
    }

    if (!proposalData.pricing || proposalData.pricing <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid project value",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const proposalToInsert = {
        user_id: user.id,
        title: proposalData.title.trim(),
        client_name: proposalData.client_name.trim(),
        client_email: proposalData.client_email?.trim() || null,
        content: {
          sections: proposalData.content?.sections || [],
          project_name: proposalData.project_name.trim(),
          pricing: proposalData.pricing,
          currency: proposalData.currency || 'USD',
          primaryColor: primaryColor,
          secondaryColor: secondaryColor
        },
        template_id: selectedTemplate?.id || null,
        status: 'draft'
      };

      console.log('Creating proposal with data:', proposalToInsert);

      const { data, error } = await sb
        .from('proposals')
        .insert(proposalToInsert)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: "Proposal created successfully!"
      });

      const suffix = go ? `?go=${go}` : '';
      navigate(`/proposal/${data.id}${suffix}`);
      return data.id;
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
              <Badge variant="outline">Step {step === 'details' ? '1' : step === 'theme' ? '2' : step === 'template' ? '3' : '4'} of 4</Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {step === 'details' && (
          <div>
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">Project Details</h1>
              <p className="text-muted-foreground">
                Let's start with the basic information about your project and client
              </p>
            </div>

            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Project Information
                </CardTitle>
                <CardDescription>
                  Tell us about your project and who you're creating this proposal for
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Project Title *</Label>
                  <Input
                    id="title"
                    value={proposalData.title}
                    onChange={(e) => setProposalData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Website Redesign Project"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project_name">Service to be Delivered *</Label>
                  <Textarea
                    id="project_name"
                    value={proposalData.project_name}
                    onChange={(e) => setProposalData(prev => ({ ...prev, project_name: e.target.value }))}
                    placeholder="e.g., Complete website redesign with modern UI/UX, responsive design, and content management system"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pricing">Total Project Value *</Label>
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

                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Client Information
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="client_name">Client Name *</Label>
                      <Input
                        id="client_name"
                        value={proposalData.client_name}
                        onChange={(e) => setProposalData(prev => ({ ...prev, client_name: e.target.value }))}
                        placeholder="e.g., Acme Corporation or John Smith"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="client_email">Client Email *</Label>
                      <Input
                        id="client_email"
                        type="email"
                        value={proposalData.client_email}
                        onChange={(e) => {
                          const email = e.target.value;
                          if (email === '' || /^[a-zA-Z0-9._%+-]*@?[a-zA-Z0-9.-]*\.?[a-zA-Z]*$/.test(email)) {
                            setProposalData(prev => ({ ...prev, client_email: email }));
                          }
                        }}
                        placeholder="contact@acme.com"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <Button variant="outline" onClick={() => navigate('/dashboard')}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => setStep('theme')}
                    disabled={!proposalData.title || !proposalData.client_name || !proposalData.client_email || !proposalData.project_name || !proposalData.pricing}
                    className="flex-1"
                  >
                    Continue to Theme Selection
                    <Palette className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 'theme' && (
          <div>
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">Theme & Template Selection</h1>
              <p className="text-muted-foreground">
                Customize your proposal colors and choose a professional template
              </p>
            </div>

            {/* Color Selection Section */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Choose Your Colors
                </CardTitle>
                <CardDescription>
                  Select your brand colors to personalize your proposal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="primary-color">Primary Color</Label>
                    <div className="flex items-center gap-3">
                      <input
                        id="primary-color"
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-16 h-16 border-2 border-border rounded-lg cursor-pointer"
                      />
                      <div className="flex-1">
                        <Input
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          placeholder="#3b82f6"
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          Used for headings and key elements
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="secondary-color">Secondary Color</Label>
                    <div className="flex items-center gap-3">
                      <input
                        id="secondary-color"
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="w-16 h-16 border-2 border-border rounded-lg cursor-pointer"
                      />
                      <div className="flex-1">
                        <Input
                          value={secondaryColor}
                          onChange={(e) => setSecondaryColor(e.target.value)}
                          placeholder="#1e40af"
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          Used for accents and highlights
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Color Preview */}
                <div className="border rounded-lg p-6 bg-muted/20">
                  <h3 className="text-lg font-medium mb-4">Color Preview</h3>
                  <div className="space-y-3">
                    <div 
                      className="h-4 rounded"
                      style={{ backgroundColor: primaryColor, width: '70%' }}
                    />
                    <div 
                      className="h-3 rounded"
                      style={{ backgroundColor: secondaryColor, width: '85%' }}
                    />
                    <div className="flex gap-2">
                      <div 
                        className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: primaryColor }}
                      />
                      <div 
                        className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: secondaryColor }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Template Selection Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Choose Template
                </CardTitle>
                <CardDescription>
                  Select a professional template for your proposal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TemplateGallery 
                  onSelectTemplate={(template) => {
                    setSelectedTemplate(template);
                    setProposalData(prev => ({ ...prev, content: template.template_data }));
                  }}
                  selectedTemplate={selectedTemplate}
                />
              </CardContent>
            </Card>

            <div className="flex gap-4 mt-8">
              <Button variant="outline" onClick={() => setStep('details')}>
                Back to Details
              </Button>
              <Button 
                onClick={() => setStep('content')}
                disabled={!selectedTemplate}
                className="flex-1"
              >
                Continue to Content
                <PenTool className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {step === 'template' && (
          <div>
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">Choose a Template</h1>
              <p className="text-muted-foreground">
                Select a professional template designed for your industry and needs
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

            <div className="mt-8">
              <TemplateGallery onSelectTemplate={handleTemplateSelect} selectedTemplate={selectedTemplate} />
            </div>
          </div>
        )}

        {step === 'content' && (
          <div>
            <div className="mb-8 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Customize Content</h1>
                <p className="text-muted-foreground">
                  Edit and customize every section of your proposal
                </p>
              </div>
              <Button variant="outline" onClick={() => setStep('details')}>
                Edit Basic Information
              </Button>
            </div>

            <div className="mb-8">
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

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Content Editor */}
              <div className="space-y-6">
                {/* Cover Page Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Cover Page
                      <Badge variant="secondary">Required</Badge>
                    </CardTitle>
                    <CardDescription>
                      The first impression of your proposal
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="cover-tagline">Tagline</Label>
                      <Input
                        id="cover-tagline"
                        value={getContentValue('cover_page', 'tagline')}
                        onChange={(e) => updateSectionValue('cover_page', 'tagline', e.target.value)}
                        placeholder={`Helping ${proposalData.client_name} achieve success with innovative solutions`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cover-company">Your Company Name</Label>
                      <Input
                        id="cover-company"
                        value={getContentValue('cover_page', 'company_name')}
                        onChange={(e) => updateSectionValue('cover_page', 'company_name', e.target.value)}
                        placeholder="Your Company Name"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Executive Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Executive Summary
                      <Button 
                        onClick={() => generateAIContent('executive_summary', `${proposalData.client_name} - ${proposalData.project_name}`)}
                        disabled={generatingAI === 'executive_summary'}
                        variant="outline" 
                        size="sm"
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        {generatingAI === 'executive_summary' ? 'Generating...' : 'AI Generate'}
                      </Button>
                    </CardTitle>
                    <CardDescription>
                      A high-level overview of your proposal
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={getContentValue('executive_summary', 'content')}
                      onChange={(e) => updateSectionValue('executive_summary', 'content', e.target.value)}
                      placeholder="Provide a high-level overview tailored to the client's main challenge and results you aim to deliver..."
                      className="min-h-[120px]"
                    />
                  </CardContent>
                </Card>

                {/* Problem Statement */}
                <Card>
                  <CardHeader>
                    <CardTitle>Problem Statement</CardTitle>
                    <CardDescription>
                      Describe the client's challenges and needs
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={getContentValue('client_problem', 'content')}
                      onChange={(e) => updateSectionValue('client_problem', 'content', e.target.value)}
                      placeholder="Identify and describe the specific challenges your client is facing..."
                      className="min-h-[100px]"
                    />
                  </CardContent>
                </Card>

                {/* Proposed Solution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Proposed Solution
                      <Button 
                        onClick={() => generateAIContent('proposed_solution', proposalData.project_name)}
                        disabled={generatingAI === 'proposed_solution'}
                        variant="outline" 
                        size="sm"
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        {generatingAI === 'proposed_solution' ? 'Generating...' : 'AI Generate'}
                      </Button>
                    </CardTitle>
                    <CardDescription>
                      Your approach and methodology
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Solution Overview</Label>
                      <Textarea
                        value={getContentValue('proposed_solution', 'content')}
                        onChange={(e) => updateSectionValue('proposed_solution', 'content', e.target.value)}
                        placeholder="Describe your approach, process, methodology, and why this solution fits their specific situation..."
                        className="min-h-[120px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Why This Solution Fits</Label>
                      <Textarea
                        value={getContentValue('proposed_solution', 'why_fits')}
                        onChange={(e) => updateSectionValue('proposed_solution', 'why_fits', e.target.value)}
                        placeholder="Explain why your solution is the perfect fit for their specific needs..."
                        className="min-h-[80px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tools & Technologies</Label>
                      <Input
                        value={getContentValue('proposed_solution', 'tools')?.join(', ') || ''}
                        onChange={(e) => updateSectionValue('proposed_solution', 'tools', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))}
                        placeholder="React, Node.js, AWS, Figma"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Scope of Work */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Scope of Work
                      <Button 
                        onClick={() => generateAIContent('scope_of_work', proposalData.project_name)}
                        disabled={generatingAI === 'scope_of_work'}
                        variant="outline" 
                        size="sm"
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        {generatingAI === 'scope_of_work' ? 'Generating...' : 'AI Generate'}
                      </Button>
                    </CardTitle>
                    <CardDescription>
                      Detailed breakdown of deliverables and activities
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Deliverables Overview</Label>
                      <Textarea
                        value={getContentValue('scope_of_work', 'content')}
                        onChange={(e) => updateSectionValue('scope_of_work', 'content', e.target.value)}
                        placeholder="Detailed breakdown of deliverables and activities..."
                        className="min-h-[120px]"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Key Deliverables</Label>
                      <Textarea
                        value={getContentValue('scope_of_work', 'deliverables')?.join('\n') || ''}
                        onChange={(e) => updateSectionValue('scope_of_work', 'deliverables', e.target.value.split('\n').filter(Boolean))}
                        placeholder="Complete website redesign&#10;Mobile-responsive implementation&#10;SEO optimization&#10;Content management system"
                        className="min-h-[100px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>What's Included</Label>
                      <Textarea
                        value={getContentValue('scope_of_work', 'included')?.join('\n') || ''}
                        onChange={(e) => updateSectionValue('scope_of_work', 'included', e.target.value.split('\n').filter(Boolean))}
                        placeholder="Initial consultation&#10;Design mockups&#10;Development&#10;Testing & QA"
                        className="min-h-[80px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>What's Not Included</Label>
                      <Textarea
                        value={getContentValue('scope_of_work', 'excluded')?.join('\n') || ''}
                        onChange={(e) => updateSectionValue('scope_of_work', 'excluded', e.target.value.split('\n').filter(Boolean))}
                        placeholder="Content creation&#10;Third-party integrations&#10;Ongoing maintenance"
                        className="min-h-[60px]"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Timeline & Milestones */}
                <Card>
                  <CardHeader>
                    <CardTitle>Timeline & Milestones</CardTitle>
                    <CardDescription>
                      Project phases and delivery schedule
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Array.isArray(getContentValue('scope_of_work', 'timeline')) ? getContentValue('scope_of_work', 'timeline').map((phase: any, index: number) => (
                      <div key={index} className="grid grid-cols-3 gap-3 p-3 border rounded-lg">
                        <div className="space-y-1">
                          <Label className="text-xs">Phase</Label>
                          <Input
                            value={phase.phase || ''}
                            onChange={(e) => updateTimelinePhase(index, 'phase', e.target.value)}
                            placeholder="Discovery"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Duration</Label>
                          <Input
                            value={phase.duration || ''}
                            onChange={(e) => updateTimelinePhase(index, 'duration', e.target.value)}
                            placeholder="2 weeks"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Description</Label>
                          <Input
                            value={phase.description || ''}
                            onChange={(e) => updateTimelinePhase(index, 'description', e.target.value)}
                            placeholder="Requirements gathering"
                          />
                        </div>
                      </div>
                    )) : []}
                    <Button onClick={addScopeTimelinePhase} variant="outline" size="sm">
                      Add Phase
                    </Button>
                  </CardContent>
                </Card>

                {/* Pricing */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Investment & Pricing
                      <Button 
                        onClick={() => generateAIContent('pricing', proposalData.project_name)}
                        disabled={generatingAI === 'pricing'}
                        variant="outline" 
                        size="sm"
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        {generatingAI === 'pricing' ? 'Generating...' : 'AI Generate'}
                      </Button>
                    </CardTitle>
                    <CardDescription>
                      Payment terms and pricing breakdown
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Payment Terms</Label>
                      <Textarea
                        value={getContentValue('pricing', 'payment_terms')}
                        onChange={(e) => updateSectionValue('pricing', 'payment_terms', e.target.value)}
                        placeholder="50% upfront, 50% on completion"
                        className="min-h-[60px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Value Breakdown (Optional)</Label>
                      <Textarea
                        value={getContentValue('pricing', 'breakdown')}
                        onChange={(e) => updateSectionValue('pricing', 'breakdown', e.target.value)}
                        placeholder="Design: $5,000&#10;Development: $8,000&#10;Testing: $2,000"
                        className="min-h-[80px]"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* About Us / Team */}
                <Card>
                  <CardHeader>
                    <CardTitle>About Us</CardTitle>
                    <CardDescription>
                      Your company background and team
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Company Overview</Label>
                      <Textarea
                        value={getContentValue('about_us', 'content')}
                        onChange={(e) => updateSectionValue('about_us', 'content', e.target.value)}
                        placeholder="Brief overview of your company, mission, and expertise..."
                        className="min-h-[100px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Why Choose Us</Label>
                      <Textarea
                        value={getContentValue('value_proposition', 'advantages')?.join('\n') || ''}
                        onChange={(e) => updateSectionValue('value_proposition', 'advantages', e.target.value.split('\n').filter(Boolean))}
                        placeholder="5+ years experience&#10;100+ successful projects&#10;Dedicated support team"
                        className="min-h-[80px]"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Terms & Conditions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Terms & Conditions</CardTitle>
                    <CardDescription>
                      Legal terms and project conditions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={getContentValue('terms_conditions', 'content')}
                      onChange={(e) => updateSectionValue('terms_conditions', 'content', e.target.value)}
                      placeholder="Project terms, conditions, and legal requirements..."
                      className="min-h-[120px]"
                    />
                  </CardContent>
                </Card>

                {/* Call to Action */}
                <Card>
                  <CardHeader>
                    <CardTitle>Next Steps</CardTitle>
                    <CardDescription>
                      Clear call to action for the client
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Next Steps</Label>
                      <Textarea
                        value={getContentValue('call_to_action', 'next_steps')}
                        onChange={(e) => updateSectionValue('call_to_action', 'next_steps', e.target.value)}
                        placeholder="Ready to get started? Let's schedule a kickoff call to begin transforming your vision into reality."
                        className="min-h-[60px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Contact Details</Label>
                      <Textarea
                        value={getContentValue('call_to_action', 'contact_details')}
                        onChange={(e) => updateSectionValue('call_to_action', 'contact_details', e.target.value)}
                        placeholder="Email: contact@yourcompany.com&#10;Phone: (555) 123-4567&#10;Schedule: calendly.com/yourname"
                        className="min-h-[60px]"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Live Preview */}
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Live Preview</CardTitle>
                  <CardDescription>
                    See your changes in real-time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-[8.5/11] bg-white border rounded-lg p-4 text-xs text-black overflow-auto max-h-[600px]">
                    {/* Cover Page */}
                    <div className="text-center mb-6 border-b pb-4">
                      <div className="text-xs text-gray-500 mb-1">
                        {getContentValue('cover_page', 'company_name') || 'Your Company'}
                      </div>
                      <h1 className="text-lg font-bold mb-2">{proposalData.title}</h1>
                      <p className="text-sm text-gray-600 mb-1">Project: {proposalData.project_name}</p>
                      <p className="text-gray-600 text-sm">Prepared for {proposalData.client_name}</p>
                      <p className="text-gray-500 text-xs mt-2">
                        {getContentValue('cover_page', 'tagline') || `Helping ${proposalData.client_name} achieve success with innovative solutions`}
                      </p>
                    </div>
                    
                    {/* Executive Summary */}
                    {getContentValue('executive_summary', 'content') && (
                      <section className="mb-4">
                        <h2 className="text-sm font-semibold mb-2 text-primary border-b border-gray-200 pb-1">
                          Executive Summary
                        </h2>
                        <p className="text-xs text-gray-700 leading-relaxed">
                          {getContentValue('executive_summary', 'content')}
                        </p>
                      </section>
                    )}
                    
                    {/* Problem Statement */}
                    {getContentValue('client_problem', 'content') && (
                      <section className="mb-4">
                        <h2 className="text-sm font-semibold mb-2 text-primary border-b border-gray-200 pb-1">
                          Problem Statement
                        </h2>
                        <p className="text-xs text-gray-700 leading-relaxed">
                          {getContentValue('client_problem', 'content')}
                        </p>
                      </section>
                    )}
                    
                    {/* Proposed Solution */}
                    {(getContentValue('proposed_solution', 'content') || getContentValue('proposed_solution', 'why_fits')) && (
                      <section className="mb-4">
                        <h2 className="text-sm font-semibold mb-2 text-primary border-b border-gray-200 pb-1">
                          Proposed Solution
                        </h2>
                        {getContentValue('proposed_solution', 'content') && (
                          <p className="text-xs text-gray-700 leading-relaxed mb-2">
                            {getContentValue('proposed_solution', 'content')}
                          </p>
                        )}
                        {getContentValue('proposed_solution', 'why_fits') && (
                          <div className="mb-2">
                            <p className="text-xs font-medium text-gray-800 mb-1">Why This Solution Fits:</p>
                            <p className="text-xs text-gray-700 leading-relaxed">
                              {getContentValue('proposed_solution', 'why_fits')}
                            </p>
                          </div>
                        )}
                        {getContentValue('proposed_solution', 'tools')?.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-gray-800 mb-1">Tools & Technologies:</p>
                            <p className="text-xs text-gray-600">
                              {getContentValue('proposed_solution', 'tools').join(', ')}
                            </p>
                          </div>
                        )}
                      </section>
                    )}
                    
                    {/* Scope of Work */}
                    {(getContentValue('scope_of_work', 'content') || getContentValue('scope_of_work', 'deliverables')?.length > 0) && (
                      <section className="mb-4">
                        <h2 className="text-sm font-semibold mb-2 text-primary border-b border-gray-200 pb-1">
                          Scope of Work
                        </h2>
                        {getContentValue('scope_of_work', 'content') && (
                          <p className="text-xs text-gray-700 leading-relaxed mb-2">
                            {getContentValue('scope_of_work', 'content')}
                          </p>
                        )}
                        {getContentValue('scope_of_work', 'deliverables')?.length > 0 && (
                          <div className="mb-2">
                            <p className="text-xs font-medium text-gray-800 mb-1">Key Deliverables:</p>
                            <ul className="list-disc list-inside text-xs text-gray-700 space-y-0.5">
                              {getContentValue('scope_of_work', 'deliverables').map((item: string, idx: number) => (
                                <li key={idx}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {getContentValue('scope_of_work', 'timeline')?.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-gray-800 mb-1">Timeline:</p>
                            <div className="space-y-1">
                              {Array.isArray(getContentValue('scope_of_work', 'timeline')) ? getContentValue('scope_of_work', 'timeline').map((phase: any, idx: number) => (
                                <div key={idx} className="text-xs text-gray-700">
                                  <span className="font-medium">{phase.phase}:</span> {phase.duration} - {phase.description}
                                </div>
                              )) : []}
                            </div>
                          </div>
                        )}
                      </section>
                    )}
                    
                    {/* Investment */}
                    <section className="mb-4">
                      <h2 className="text-sm font-semibold mb-2 text-primary border-b border-gray-200 pb-1">
                        Investment
                      </h2>
                      <p className="text-sm font-medium text-gray-800 mb-1">
                        Total Project Investment: {proposalData.currency === 'EUR' ? '€' : proposalData.currency === 'GBP' ? '£' : '$'}{proposalData.pricing || 'XX,XXX'}
                      </p>
                      {getContentValue('pricing', 'payment_terms') && (
                        <p className="text-xs text-gray-700">
                          Payment Terms: {getContentValue('pricing', 'payment_terms')}
                        </p>
                      )}
                    </section>
                    
                    {/* Next Steps */}
                    {getContentValue('call_to_action', 'next_steps') && (
                      <section className="mb-4">
                        <h2 className="text-sm font-semibold mb-2 text-primary border-b border-gray-200 pb-1">
                          Next Steps
                        </h2>
                        <p className="text-xs text-gray-700 leading-relaxed">
                          {getContentValue('call_to_action', 'next_steps')}
                        </p>
                        {getContentValue('call_to_action', 'contact_details') && (
                          <div className="mt-2 text-xs text-gray-600">
                            {getContentValue('call_to_action', 'contact_details').split('\n').map((line: string, idx: number) => (
                              <div key={idx}>{line}</div>
                            ))}
                          </div>
                        )}
                      </section>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex justify-between">
              <Button variant="outline" onClick={() => setStep('details')}>
                Edit Basic Information
              </Button>
              <div className="flex flex-wrap gap-3">
                <Button 
                  onClick={handleCreateProposal} 
                  disabled={loading}
                  variant="outline"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Creating...' : 'Save as Draft'}
                </Button>
                <Button 
                  onClick={handleCreateProposal} 
                  disabled={loading}
                  variant="secondary"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {loading ? 'Creating...' : 'Create Proposal'}
                </Button>
                <Button 
                  onClick={() => createProposalAndNavigate('export')} 
                  disabled={loading}
                  variant="outline"
                  className="bg-blue-50 hover:bg-blue-100 border-blue-200"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {loading ? 'Creating...' : 'Create & Export'}
                </Button>
                <Button 
                  onClick={() => createProposalAndNavigate('payment')} 
                  disabled={loading}
                  variant="outline"
                  className="bg-green-50 hover:bg-green-100 border-green-200"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {loading ? 'Creating...' : 'Create & Payment Link'}
                </Button>
                <Button 
                  onClick={() => createProposalAndNavigate('signatures')} 
                  disabled={loading}
                  variant="outline"
                  className="bg-purple-50 hover:bg-purple-100 border-purple-200"
                >
                  <PenTool className="h-4 w-4 mr-2" />
                  {loading ? 'Creating...' : 'Create & E‑Sign'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}