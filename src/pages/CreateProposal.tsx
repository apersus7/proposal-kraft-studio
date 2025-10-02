import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, Upload, Eye, Save, Star, Zap, Shield, Briefcase, Palette, Sparkles, CreditCard, PenTool, Download, Globe, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
const sb = supabase as any;
import { toast } from '@/hooks/use-toast';
import { ColorThemeSelector } from '@/components/ColorThemeSelector';
import RichTextEditor from '@/components/RichTextEditor';


const logo = '/lovable-uploads/22b8b905-b997-42da-85df-b966b4616f6e.png';

export default function CreateProposal() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'details' | 'theme' | 'content'>('details');
  const [isEditing, setIsEditing] = useState(false);
  const [editingProposalId, setEditingProposalId] = useState<string | null>(null);
  const [selectedColorTheme, setSelectedColorTheme] = useState<string>('modern');
  const [primaryColor, setPrimaryColor] = useState<string>('#3b82f6');
  const [secondaryColor, setSecondaryColor] = useState<string>('#1e40af');
  const [backgroundColor, setBackgroundColor] = useState<string>('#ffffff');
  const [textColor, setTextColor] = useState<string>('#000000');
  const [headingColor, setHeadingColor] = useState<string>('#000000');
  const [selectedFont, setSelectedFont] = useState<string>('Inter');
  const [logoUrl, setLogoUrl] = useState<string>('');
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
        { type: 'objective', content: '' },
        { type: 'proposed_solution', content: '', approach: '', tools: [], why_fits: '' },
        { type: 'scope_of_work', deliverables: [], timeline: [], included: [], excluded: [] },
        { type: 'pricing', packages: [], payment_terms: '', total: '' },
        { type: 'value_proposition', advantages: [], case_studies: [], testimonials: [], team: [] },
        { type: 'call_to_action', next_steps: '' }
      ]
    },
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    // Check if we're editing an existing proposal
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');
    if (editId) {
      setIsEditing(true);
      setEditingProposalId(editId);
      loadProposalForEditing(editId);
    }
  }, [user, navigate]);

  const loadProposalForEditing = async (proposalId: string) => {
    if (!user) return;
    
    try {
      const { data, error } = await sb
        .from('proposals')
        .select('*')
        .eq('id', proposalId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error loading proposal:', error);
        toast({
          title: "Error",
          description: "Failed to load proposal for editing",
          variant: "destructive"
        });
        return;
      }

      if (data) {
        // Populate the form with existing data
        setProposalData({
          title: data.title,
          client_name: data.client_name,
          client_email: data.client_email,
          project_name: data.content?.project_name || '',
          pricing: data.worth || '',
          currency: data.content?.currency || 'USD',
          content: data.content
        });

        // Load theme data
        if (data.content?.primaryColor) setPrimaryColor(data.content.primaryColor);
        if (data.content?.secondaryColor) setSecondaryColor(data.content.secondaryColor);
        if (data.content?.backgroundColor) setBackgroundColor(data.content.backgroundColor);
        if (data.content?.textColor) setTextColor(data.content.textColor);
        if (data.content?.headingColor) setHeadingColor(data.content.headingColor);
        if (data.content?.selectedFont) setSelectedFont(data.content.selectedFont);
        if (data.content?.logoUrl) setLogoUrl(data.content.logoUrl);

        // Skip to content step for editing
        setStep('content');
      }
    } catch (error) {
      console.error('Error loading proposal:', error);
      toast({
        title: "Error",
        description: "Failed to load proposal for editing",
        variant: "destructive"
      });
    }
  };

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

  const addTestimonial = () => {
    const currentTestimonials = getContentValue('value_proposition', 'testimonials') || [];
    const newTestimonials = [...currentTestimonials, { name: '', link: '', content: '' }];
    updateSectionValue('value_proposition', 'testimonials', newTestimonials);
  };

  const updateTestimonial = (testimonialIndex: number, field: string, value: string) => {
    const currentTestimonials = getContentValue('value_proposition', 'testimonials') || [];
    const updatedTestimonials = [...currentTestimonials];
    
    if (updatedTestimonials[testimonialIndex]) {
      updatedTestimonials[testimonialIndex] = { ...updatedTestimonials[testimonialIndex], [field]: value };
    } else {
      updatedTestimonials[testimonialIndex] = { [field]: value };
    }
    
    updateSectionValue('value_proposition', 'testimonials', updatedTestimonials);
  };

  const removeTestimonial = (testimonialIndex: number) => {
    const currentTestimonials = getContentValue('value_proposition', 'testimonials') || [];
    const updatedTestimonials = currentTestimonials.filter((_: any, index: number) => index !== testimonialIndex);
    updateSectionValue('value_proposition', 'testimonials', updatedTestimonials);
  };

  const generateAIContent = async (section: string, context?: string) => {
    setGeneratingAI(section);
    try {
      // Gather comprehensive context about the client and project
      const comprehensiveContext = {
        section,
        clientName: proposalData.client_name,
        clientEmail: proposalData.client_email,
        projectName: proposalData.project_name,
        proposalTitle: proposalData.title,
        projectWorth: proposalData.pricing,
        currency: proposalData.currency || 'USD',
        // Include any existing content for context
        existingObjective: getContentValue('objective', 'content'),
        existingSolution: getContentValue('proposed_solution', 'content'),
        existingScopeOfWork: getContentValue('scope_of_work', 'content'),
        // Additional context hint
        contextHint: context
      };

      const { data, error } = await supabase.functions.invoke('generate-proposal-content', {
        body: comprehensiveContext
      });
      
      if (error) throw error;
      
      if (data?.content) {
        updateSectionValue(section, 'content', data.content);
        toast({ 
          title: 'AI Content Generated', 
          description: `${section.replace(/_/g, ' ')} section updated with tailored content` 
        });
      }
    } catch (err) {
      console.error('Error generating AI content:', err);
      toast({ 
        title: 'Error', 
        description: 'Failed to generate content. Please try again.', 
        variant: 'destructive' 
      });
    } finally {
      setGeneratingAI(null);
    }
  };

  const importFromWebsite = async (url: string, section: string) => {
    setGeneratingAI(section);
    try {
      // Simple fetch to get website content - you can enhance this to use Firecrawl
      const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`);
      const content = await response.text();
      
      // Extract basic text content (simplified)
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, 'text/html');
      const textContent = doc.body?.textContent?.slice(0, 500) || '';
      
      updateSectionValue(section, 'content', textContent);
      toast({ title: 'Content Imported', description: 'Website content imported successfully' });
    } catch (err) {
      console.error('Error importing website content:', err);
      toast({ title: 'Error', description: 'Failed to import website content', variant: 'destructive' });
    } finally {
      setGeneratingAI(null);
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
      const proposalData_to_save = {
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
          secondaryColor: secondaryColor,
          backgroundColor: backgroundColor,
          textColor: textColor,
          headingColor: headingColor,
          selectedFont: selectedFont,
          logoUrl: logoUrl
        },
        worth: Number(proposalData.pricing),
        template_id: null,
        status: 'draft'
      };

      console.log('Saving proposal with data:', proposalData_to_save);

      let result;
      if (isEditing && editingProposalId) {
        // Update existing proposal
        const { data, error } = await sb
          .from('proposals')
          .update(proposalData_to_save)
          .eq('id', editingProposalId)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }

        result = data;
        toast({
          title: "Success",
          description: "Proposal updated successfully!"
        });
      } else {
        // Create new proposal
        const { data, error } = await sb
          .from('proposals')
          .insert(proposalData_to_save)
          .select()
          .single();

        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }

        result = data;
        toast({
          title: "Success",
          description: "Proposal created successfully!"
        });
      }

      const suffix = go ? `?go=${go}` : '';
      navigate(`/proposal/${result.id}${suffix}`);
      return result.id;
    } catch (error) {
      console.error('Error saving proposal:', error);
      toast({
        title: "Error",
        description: isEditing ? "Failed to update proposal" : "Failed to create proposal",
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
              <Badge variant="outline">Step {step === 'details' ? '1' : step === 'theme' ? '2' : '3'} of 3</Badge>
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
                    Continue to Theme & Branding
                    <Palette className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 'theme' && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Theme Customization Panel */}
            <div>
              <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Theme & Branding</h1>
                <p className="text-muted-foreground">
                  Customize colors, fonts, and branding for your proposal
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Brand Customization
                  </CardTitle>
                  <CardDescription>
                    Personalize your proposal's appearance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Colors Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Colors</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="background-color">Background Color</Label>
                        <div className="flex items-center gap-2">
                          <input
                            id="background-color"
                            type="color"
                            value={backgroundColor}
                            onChange={(e) => setBackgroundColor(e.target.value)}
                            className="w-12 h-12 border-2 border-border rounded-lg cursor-pointer"
                          />
                          <Input
                            value={backgroundColor}
                            onChange={(e) => setBackgroundColor(e.target.value)}
                            placeholder="#ffffff"
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="text-color">Text Color</Label>
                        <div className="flex items-center gap-2">
                          <input
                            id="text-color"
                            type="color"
                            value={textColor}
                            onChange={(e) => setTextColor(e.target.value)}
                            className="w-12 h-12 border-2 border-border rounded-lg cursor-pointer"
                          />
                          <Input
                            value={textColor}
                            onChange={(e) => setTextColor(e.target.value)}
                            placeholder="#000000"
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="heading-color">Heading Color</Label>
                        <div className="flex items-center gap-2">
                          <input
                            id="heading-color"
                            type="color"
                            value={headingColor}
                            onChange={(e) => setHeadingColor(e.target.value)}
                            className="w-12 h-12 border-2 border-border rounded-lg cursor-pointer"
                          />
                          <Input
                            value={headingColor}
                            onChange={(e) => setHeadingColor(e.target.value)}
                            placeholder="#000000"
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Font Selection */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Typography</h3>
                    <div className="space-y-2">
                      <Label htmlFor="font-select">Primary Font</Label>
                      <Select value={selectedFont} onValueChange={setSelectedFont}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a font" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Inter">Inter (Modern & Clean)</SelectItem>
                          <SelectItem value="Roboto">Roboto (Professional)</SelectItem>
                          <SelectItem value="Open Sans">Open Sans (Friendly)</SelectItem>
                          <SelectItem value="Lato">Lato (Approachable)</SelectItem>
                          <SelectItem value="Montserrat">Montserrat (Bold & Strong)</SelectItem>
                          <SelectItem value="Poppins">Poppins (Contemporary)</SelectItem>
                          <SelectItem value="Nunito">Nunito (Rounded & Soft)</SelectItem>
                          <SelectItem value="Source Sans Pro">Source Sans Pro (Technical)</SelectItem>
                          <SelectItem value="Playfair Display">Playfair Display (Elegant & Serif)</SelectItem>
                          <SelectItem value="Merriweather">Merriweather (Readable Serif)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Logo Upload */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Upload className="h-5 w-5" />
                      <h3 className="text-lg font-medium">Company Logo</h3>
                    </div>
                    
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                      {logoUrl ? (
                        <div className="space-y-4">
                          <img 
                            src={logoUrl} 
                            alt="Company Logo" 
                            className="mx-auto h-16 object-contain"
                          />
                          <div className="flex gap-2 justify-center">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => document.getElementById('logo-upload')?.click()}
                            >
                              Change Logo
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setLogoUrl('')}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                          <div>
                            <p className="text-sm font-medium">Upload your company logo</p>
                            <p className="text-xs text-muted-foreground">PNG, JPG, SVG up to 5MB</p>
                          </div>
                          <Button 
                            variant="outline"
                            onClick={() => document.getElementById('logo-upload')?.click()}
                          >
                            Choose File
                          </Button>
                        </div>
                      )}
                      
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="logo-upload"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file || !user) return;

                          try {
                            setLoading(true);
                            const fileExt = file.name.split('.').pop();
                            const fileName = `${user.id}/logo-${Date.now()}.${fileExt}`;
                            
                            const { error: uploadError } = await sb.storage
                              .from('proposals')
                              .upload(fileName, file);

                            if (uploadError) throw uploadError;

                            const { data } = sb.storage
                              .from('proposals')
                              .getPublicUrl(fileName);

                            setLogoUrl(data.publicUrl);
                            updateSectionValue('cover_page', 'company_logo', data.publicUrl);
                            
                            toast({
                              title: "Success",
                              description: "Logo uploaded successfully!"
                            });
                          } catch (error) {
                            console.error('Error uploading logo:', error);
                            toast({
                              title: "Error",
                              description: "Failed to upload logo",
                              variant: "destructive"
                            });
                          } finally {
                            setLoading(false);
                          }
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-4 pt-6">
                    <Button variant="outline" onClick={() => setStep('details')}>
                      Back
                    </Button>
                    <Button 
                      onClick={() => setStep('content')}
                      className="flex-1"
                    >
                      Continue to Content
                      <FileText className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Live Preview Panel */}
            <div>
              <div className="mb-8">
                <h2 className="text-2xl font-bold tracking-tight">Live Preview</h2>
                <p className="text-muted-foreground">
                  See how your proposal will look
                </p>
              </div>

              <Card className="sticky top-8">
                <CardContent className="p-0">
                  <div 
                    className="relative min-h-[600px] p-6 rounded-lg"
                    style={{ 
                      backgroundColor: backgroundColor,
                      fontFamily: `'${selectedFont}', sans-serif`
                    }}
                  >
                    {/* Logo in top-left corner */}
                    {logoUrl && (
                      <div className="absolute top-4 left-4">
                        <img 
                          src={logoUrl} 
                          alt="Company Logo" 
                          className="h-12 object-contain"
                        />
                      </div>
                    )}

                    {/* Sample Proposal Content */}
                    <div className="space-y-6 mt-16">
                      {/* Title */}
                      <div className="text-center">
                        <h1 
                          className="text-4xl font-bold mb-2"
                          style={{ color: primaryColor }}
                        >
                          {proposalData.title || 'Your Proposal Title'}
                        </h1>
                        <p 
                          className="text-xl"
                          style={{ color: secondaryColor }}
                        >
                          Prepared for: {proposalData.client_name || 'Client Name'}
                        </p>
                      </div>

                      {/* Sample Content Sections */}
                      <div className="space-y-4">
                        <div className="border-l-4 pl-4" style={{ borderColor: primaryColor }}>
                          <h2 
                            className="text-2xl font-semibold mb-2"
                            style={{ color: primaryColor }}
                          >
                            Executive Summary
                          </h2>
                          <p className="text-gray-700 dark:text-gray-300">
                            This is a sample of how your proposal content will appear with the selected theme. 
                            The colors, fonts, and branding elements will be consistently applied throughout your proposal.
                          </p>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                          <h3 
                            className="text-lg font-medium mb-2"
                            style={{ color: secondaryColor }}
                          >
                            Project Details
                          </h3>
                          <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                            <li>• Service: {proposalData.project_name || 'Your service description'}</li>
                            <li>• Value: {proposalData.currency} {proposalData.pricing || '0'}</li>
                            <li>• Client: {proposalData.client_name || 'Client name'}</li>
                          </ul>
                        </div>

                        <div className="flex items-center gap-4 p-4 rounded-lg" style={{ backgroundColor: `${primaryColor}20` }}>
                          <div 
                            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                            style={{ backgroundColor: primaryColor }}
                          >
                            $
                          </div>
                          <div>
                            <h4 className="font-medium" style={{ color: primaryColor }}>Investment</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Total project value: {proposalData.currency} {proposalData.pricing || '0'}
                            </p>
                          </div>
                        </div>
                      </div>

                       {/* Color Swatches */}
                       <div className="flex gap-4 mt-8">
                         <div className="flex items-center gap-2">
                           <div 
                             className="w-6 h-6 rounded border-2 border-white shadow-sm"
                             style={{ backgroundColor: primaryColor }}
                           />
                           <span className="text-xs text-gray-500">Primary</span>
                         </div>
                         <div className="flex items-center gap-2">
                           <div 
                             className="w-6 h-6 rounded border-2 border-white shadow-sm"
                             style={{ backgroundColor: secondaryColor }}
                           />
                           <span className="text-xs text-gray-500">Secondary</span>
                         </div>
                         <div className="flex items-center gap-2">
                           <div 
                             className="w-6 h-6 rounded border-2 border-gray-300"
                             style={{ backgroundColor: backgroundColor }}
                           />
                           <span className="text-xs text-gray-500">Background</span>
                         </div>
                         <div className="flex items-center gap-2">
                           <div 
                             className="w-6 h-6 rounded border-2 border-gray-300"
                             style={{ backgroundColor: textColor }}
                           />
                           <span className="text-xs text-gray-500">Text</span>
                         </div>
                       </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
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

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Content Editor */}
              <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-4">
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

                {/* Project Objective */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Project Objective
                      <Button 
                        onClick={() => generateAIContent('objective', `${proposalData.client_name} - ${proposalData.project_name}`)}
                        disabled={generatingAI === 'objective'}
                        variant="outline" 
                        size="sm"
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        {generatingAI === 'objective' ? 'Generating...' : 'AI Generate'}
                      </Button>
                    </CardTitle>
                    <CardDescription>
                      Define the main objectives and goals of this project
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RichTextEditor
                      value={getContentValue('objective', 'content')}
                      onChange={(value) => updateSectionValue('objective', 'content', value)}
                      placeholder="Describe the main objectives and goals of this project..."
                      minHeight="120px"
                      style={{ color: textColor }}
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
                      <RichTextEditor
                        value={getContentValue('proposed_solution', 'content')}
                        onChange={(value) => updateSectionValue('proposed_solution', 'content', value)}
                        placeholder="Describe your approach, process, methodology, and why this solution fits their specific situation..."
                        minHeight="120px"
                        style={{ color: textColor }}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Why This Solution Fits</Label>
                        <Button 
                          onClick={() => generateAIContent('proposed_solution', proposalData.project_name)}
                          disabled={generatingAI === 'proposed_solution'}
                          variant="outline" 
                          size="sm"
                        >
                          <Sparkles className="h-3 w-3 mr-1" />
                          {generatingAI === 'proposed_solution' ? 'Generating...' : 'AI Generate'}
                        </Button>
                      </div>
                      <RichTextEditor
                        value={getContentValue('proposed_solution', 'why_fits')}
                        onChange={(value) => updateSectionValue('proposed_solution', 'why_fits', value)}
                        placeholder="Explain why your solution is the perfect fit for their specific needs..."
                        minHeight="80px"
                        style={{ color: textColor }}
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
                    <CardTitle>Scope of Work</CardTitle>
                    <CardDescription>
                      Detailed breakdown of deliverables and activities
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Deliverables Overview</Label>
                        <Button 
                          onClick={() => generateAIContent('scope_of_work', proposalData.project_name)}
                          disabled={generatingAI === 'scope_of_work'}
                          variant="outline" 
                          size="sm"
                        >
                          <Sparkles className="h-3 w-3 mr-1" />
                          {generatingAI === 'scope_of_work' ? 'Generating...' : 'AI Generate'}
                        </Button>
                      </div>
                      <RichTextEditor
                        value={getContentValue('scope_of_work', 'content')}
                        onChange={(value) => updateSectionValue('scope_of_work', 'content', value)}
                        placeholder="Detailed breakdown of deliverables and activities..."
                        minHeight="120px"
                        style={{ color: textColor }}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Key Deliverables</Label>
                        <Button 
                          onClick={() => generateAIContent('scope_of_work', proposalData.project_name)}
                          disabled={generatingAI === 'scope_of_work'}
                          variant="outline" 
                          size="sm"
                        >
                          <Sparkles className="h-3 w-3 mr-1" />
                          {generatingAI === 'scope_of_work' ? 'Generating...' : 'AI Generate'}
                        </Button>
                      </div>
                      <Textarea
                        value={getContentValue('scope_of_work', 'deliverables')?.join('\n') || ''}
                        onChange={(e) => updateSectionValue('scope_of_work', 'deliverables', e.target.value.split('\n').filter(Boolean))}
                        placeholder="Complete website redesign&#10;Mobile-responsive implementation&#10;SEO optimization&#10;Content management system"
                        className="min-h-[100px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>What's Included</Label>
                        <Button 
                          onClick={() => generateAIContent('scope_of_work', proposalData.project_name)}
                          disabled={generatingAI === 'scope_of_work'}
                          variant="outline" 
                          size="sm"
                        >
                          <Sparkles className="h-3 w-3 mr-1" />
                          {generatingAI === 'scope_of_work' ? 'Generating...' : 'AI Generate'}
                        </Button>
                      </div>
                      <Textarea
                        value={getContentValue('scope_of_work', 'included')?.join('\n') || ''}
                        onChange={(e) => updateSectionValue('scope_of_work', 'included', e.target.value.split('\n').filter(Boolean))}
                        placeholder="Initial consultation&#10;Design mockups&#10;Development&#10;Testing & QA"
                        className="min-h-[80px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>What's Not Included</Label>
                        <Button 
                          onClick={() => generateAIContent('scope_of_work', proposalData.project_name)}
                          disabled={generatingAI === 'scope_of_work'}
                          variant="outline" 
                          size="sm"
                        >
                          <Sparkles className="h-3 w-3 mr-1" />
                          {generatingAI === 'scope_of_work' ? 'Generating...' : 'AI Generate'}
                        </Button>
                      </div>
                      <Textarea
                        value={getContentValue('scope_of_work', 'excluded')?.join('\n') || ''}
                        onChange={(e) => updateSectionValue('scope_of_work', 'excluded', e.target.value.split('\n').filter(Boolean))}
                        placeholder="Content creation&#10;Third-party integrations&#10;Ongoing maintenance"
                        className="min-h-[60px]"
                        style={{ color: textColor }}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Timeline & Milestones */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Timeline & Milestones
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
                      Project phases and delivery schedule
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 pb-3 border-b">
                      <Label>Timeline Card Color</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={getContentValue('scope_of_work', 'timelineColor') || primaryColor}
                          onChange={(e) => updateSectionValue('scope_of_work', 'timelineColor', e.target.value)}
                          className="w-12 h-12 border-2 border-border rounded-lg cursor-pointer"
                        />
                        <Input
                          value={getContentValue('scope_of_work', 'timelineColor') || primaryColor}
                          onChange={(e) => updateSectionValue('scope_of_work', 'timelineColor', e.target.value)}
                          placeholder="#3b82f6"
                          className="flex-1"
                        />
                      </div>
                    </div>
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
                    <CardTitle>Investment & Pricing</CardTitle>
                    <CardDescription>
                      Payment terms and pricing breakdown
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 pb-3 border-b">
                      <Label>Pricing Highlight Color</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={getContentValue('pricing', 'highlightColor') || primaryColor}
                          onChange={(e) => updateSectionValue('pricing', 'highlightColor', e.target.value)}
                          className="w-12 h-12 border-2 border-border rounded-lg cursor-pointer"
                        />
                        <Input
                          value={getContentValue('pricing', 'highlightColor') || primaryColor}
                          onChange={(e) => updateSectionValue('pricing', 'highlightColor', e.target.value)}
                          placeholder="#3b82f6"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Payment Terms</Label>
                      <RichTextEditor
                        value={getContentValue('pricing', 'payment_terms')}
                        onChange={(value) => updateSectionValue('pricing', 'payment_terms', value)}
                        placeholder="50% upfront, 50% on completion"
                        minHeight="60px"
                        style={{ color: textColor }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Value Breakdown (Optional)</Label>
                      <RichTextEditor
                        value={getContentValue('pricing', 'breakdown')}
                        onChange={(value) => updateSectionValue('pricing', 'breakdown', value)}
                        placeholder="Design: $5,000&#10;Development: $8,000&#10;Testing: $2,000"
                        minHeight="80px"
                        style={{ color: textColor }}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Testimonials */}
                <Card>
                  <CardHeader>
                    <CardTitle>Testimonials</CardTitle>
                    <CardDescription>
                      Add client testimonials and references
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 pb-3 border-b">
                      <Label>Testimonial Card Color</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={getContentValue('value_proposition', 'testimonialColor') || primaryColor}
                          onChange={(e) => updateSectionValue('value_proposition', 'testimonialColor', e.target.value)}
                          className="w-12 h-12 border-2 border-border rounded-lg cursor-pointer"
                        />
                        <Input
                          value={getContentValue('value_proposition', 'testimonialColor') || primaryColor}
                          onChange={(e) => updateSectionValue('value_proposition', 'testimonialColor', e.target.value)}
                          placeholder="#3b82f6"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    {Array.isArray(getContentValue('value_proposition', 'testimonials')) ? getContentValue('value_proposition', 'testimonials').map((testimonial: any, index: number) => (
                      <div key={index} className="p-4 border rounded-lg space-y-3">
                        <div className="flex justify-between items-center">
                          <Label className="text-sm font-medium">Testimonial {index + 1}</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeTestimonial(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Remove
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Client Name</Label>
                            <Input
                              value={testimonial.name || ''}
                              onChange={(e) => updateTestimonial(index, 'name', e.target.value)}
                              placeholder="John Smith"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Link (Optional)</Label>
                            <Input
                              value={testimonial.link || ''}
                              onChange={(e) => updateTestimonial(index, 'link', e.target.value)}
                              placeholder="https://linkedin.com/in/johnsmith"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Testimonial Content</Label>
                          <RichTextEditor
                            value={testimonial.content || ''}
                            onChange={(value) => updateTestimonial(index, 'content', value)}
                            placeholder="Working with this team was amazing. They delivered exceptional results..."
                            minHeight="80px"
                            style={{ color: textColor }}
                          />
                        </div>
                      </div>
                    )) : []}
                    <Button onClick={addTestimonial} variant="outline" size="sm">
                      Add Testimonial
                    </Button>
                  </CardContent>
                </Card>

                {/* Call to Action */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Next Steps
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => generateAIContent('call_to_action', proposalData.project_name)}
                          disabled={generatingAI === 'call_to_action'}
                          variant="outline" 
                          size="sm"
                        >
                          <Sparkles className="h-3 w-3 mr-1" />
                          {generatingAI === 'call_to_action' ? 'Generating...' : 'AI Generate'}
                        </Button>
                        <Button 
                          onClick={() => {
                            const url = prompt('Enter website URL to import content from:');
                            if (url) importFromWebsite(url, 'call_to_action');
                          }}
                          disabled={generatingAI === 'call_to_action'}
                          variant="outline" 
                          size="sm"
                        >
                          <Globe className="h-3 w-3 mr-1" />
                          Import from Website
                        </Button>
                      </div>
                    </CardTitle>
                    <CardDescription>
                      Clear call to action for the client
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Next Steps</Label>
                      <RichTextEditor
                        value={getContentValue('call_to_action', 'next_steps')}
                        onChange={(value) => updateSectionValue('call_to_action', 'next_steps', value)}
                        placeholder="Ready to get started? Let's schedule a kickoff call to begin transforming your vision into reality."
                        minHeight="60px"
                        style={{ color: textColor }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Contact Details</Label>
                      <RichTextEditor
                        value={getContentValue('call_to_action', 'contact_details')}
                        onChange={(value) => updateSectionValue('call_to_action', 'contact_details', value)}
                        placeholder="Email: contact@yourcompany.com&#10;Phone: (555) 123-4567&#10;Schedule: calendly.com/yourname"
                        minHeight="60px"
                        style={{ color: textColor }}
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
                  <div 
                    className="aspect-[8.5/11] border rounded-lg p-4 text-xs overflow-auto max-h-[600px] relative" 
                    style={{ 
                      backgroundColor: backgroundColor || '#ffffff',
                      color: backgroundColor === '#000000' || backgroundColor === '#ffffff' ? '#000000' : '#ffffff',
                      fontFamily: selectedFont || 'Inter',
                      '--selected-primary': primaryColor, 
                      '--selected-secondary': secondaryColor 
                    } as React.CSSProperties}
                  >
                    {/* Logo in top-left corner */}
                    {logoUrl && (
                      <div className="absolute top-4 left-4 z-10">
                        <img 
                          src={logoUrl} 
                          alt="Company Logo" 
                          className="h-8 w-auto object-contain"
                          onError={(e) => {
                            console.log('Logo failed to load:', logoUrl);
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    
                    {/* Cover Page - With applied colors */}
                    <div className="text-center mb-6 pb-4 pt-16" style={{ borderBottom: `2px solid ${primaryColor}` }}>
                      <div className="text-xs mb-1" style={{ color: secondaryColor }}>
                        {getContentValue('cover_page', 'company_name') || 'Your Company'}
                      </div>
                      <h1 className="text-lg font-bold mb-2" style={{ color: primaryColor }}>{proposalData.title}</h1>
                      <p className="text-sm text-gray-600 mb-1">Project: {proposalData.project_name}</p>
                      <p className="text-gray-600 text-sm">Prepared for {proposalData.client_name}</p>
                      <p className="text-gray-500 text-xs mt-2">
                        {getContentValue('cover_page', 'tagline') || `Helping ${proposalData.client_name} achieve success with innovative solutions`}
                      </p>
                    </div>
                    
                    {/* Project Objective - With applied colors */}
                    {getContentValue('objective', 'content') && (
                      <section className="mb-4">
                        <h2 className="text-sm font-semibold mb-2 pb-1" style={{ color: primaryColor, borderBottom: `1px solid ${primaryColor}20` }}>
                          Project Objective
                        </h2>
                        <div className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">
                          {getContentValue('objective', 'content')
                            .split('\n')
                            .map((line: string, lineIndex: number) => {
                              if (line.trim().startsWith('•')) {
                                return (
                                  <div key={lineIndex} className="flex items-start mb-1">
                                    <span className="mr-2 mt-0.5">•</span>
                                    <span>{line.trim().substring(1).trim()}</span>
                                  </div>
                                );
                              }
                              return line.trim() ? <div key={lineIndex} className="mb-1">{line}</div> : null;
                            })}
                        </div>
                      </section>
                    )}
                    
                    {/* Proposed Solution - With applied colors */}
                    {(getContentValue('proposed_solution', 'content') || getContentValue('proposed_solution', 'why_fits')) && (
                      <section className="mb-4">
                        <h2 className="text-sm font-semibold mb-2 pb-1" style={{ color: primaryColor, borderBottom: `1px solid ${primaryColor}20` }}>
                          Proposed Solution
                        </h2>
                         {getContentValue('proposed_solution', 'content') && (
                           <div className="text-xs text-gray-700 leading-relaxed whitespace-pre-line mb-2">
                             {getContentValue('proposed_solution', 'content')
                               .split('\n')
                               .map((line: string, lineIndex: number) => {
                                 if (line.trim().startsWith('•')) {
                                   return (
                                     <div key={lineIndex} className="flex items-start mb-1">
                                       <span className="mr-2 mt-0.5">•</span>
                                       <span>{line.trim().substring(1).trim()}</span>
                                     </div>
                                   );
                                 }
                                 return line.trim() ? <div key={lineIndex} className="mb-1">{line}</div> : null;
                               })}
                           </div>
                         )}
                        {getContentValue('proposed_solution', 'why_fits') && (
                          <>
                            <div className="text-xs font-medium text-gray-800 mb-1">Why This Solution Fits:</div>
                            <div className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">
                              {getContentValue('proposed_solution', 'why_fits')
                                .split('\n')
                                .map((line: string, lineIndex: number) => {
                                  if (line.trim().startsWith('•')) {
                                    return (
                                      <div key={lineIndex} className="flex items-start mb-1">
                                        <span className="mr-2 mt-0.5">•</span>
                                        <span>{line.trim().substring(1).trim()}</span>
                                      </div>
                                    );
                                  }
                                  return line.trim() ? <div key={lineIndex} className="mb-1">{line}</div> : null;
                                })}
                            </div>
                          </>
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
                    
                    {/* Scope of Work - With applied colors */}
                    {(getContentValue('scope_of_work', 'content') || getContentValue('scope_of_work', 'deliverables')?.length > 0) && (
                      <section className="mb-4">
                        <h2 className="text-sm font-semibold mb-2 pb-1" style={{ color: primaryColor, borderBottom: `1px solid ${primaryColor}20` }}>
                          Scope of Work
                        </h2>
                        {getContentValue('scope_of_work', 'content') && (
                          <div className="text-xs text-gray-700 leading-relaxed whitespace-pre-line mb-2">
                            {getContentValue('scope_of_work', 'content')
                              .split('\n')
                              .map((line: string, lineIndex: number) => {
                                if (line.trim().startsWith('•')) {
                                  return (
                                    <div key={lineIndex} className="flex items-start mb-1">
                                      <span className="mr-2 mt-0.5">•</span>
                                      <span>{line.trim().substring(1).trim()}</span>
                                    </div>
                                  );
                                }
                                return line.trim() ? <div key={lineIndex} className="mb-1">{line}</div> : null;
                              })}
                          </div>
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
                    
                    {/* Investment - With applied colors */}
                    <section className="mb-4">
                      <h2 className="text-sm font-semibold mb-2 pb-1" style={{ color: primaryColor, borderBottom: `1px solid ${primaryColor}20` }}>
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
                    
                    {/* Testimonials - With applied colors */}
                    {getContentValue('value_proposition', 'testimonials')?.length > 0 && (
                      <section className="mb-4">
                        <h2 className="text-sm font-semibold mb-2 pb-1" style={{ color: primaryColor, borderBottom: `1px solid ${primaryColor}20` }}>
                          Client Testimonials
                        </h2>
                        <div className="space-y-2">
                          {getContentValue('value_proposition', 'testimonials').map((testimonial: any, idx: number) => (
                            <div key={idx} className="bg-gray-50 p-2 rounded text-xs">
                              {testimonial.content && (
                                <p className="text-gray-700 mb-1 italic">"{testimonial.content}"</p>
                              )}
                              <div className="flex items-center justify-between">
                                {testimonial.name && (
                                  <p className="font-medium text-gray-800">- {testimonial.name}</p>
                                )}
                                {testimonial.link && (
                                  <a 
                                    href={testimonial.link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 underline"
                                  >
                                    View Profile
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}
                    
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
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {loading ? 'Creating...' : 'Create Proposal'}
                </Button>
                <Button 
                  onClick={() => createProposalAndNavigate('export')} 
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {loading ? 'Creating...' : 'Create & Export'}
                </Button>
                <Button 
                  onClick={() => createProposalAndNavigate('payment')} 
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {loading ? 'Creating...' : 'Create & Payment Link'}
                </Button>
                <Button 
                  onClick={() => createProposalAndNavigate('signatures')} 
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 text-white"
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