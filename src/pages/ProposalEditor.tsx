import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Save, Send, Eye, Download, Sparkles, Building, Edit3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { CompanyResearch } from '@/components/CompanyResearch';
import DragDropEditor from '@/components/ProposalEditor/DragDropEditor';
import ExportDialog from '@/components/ProposalEditor/ExportDialog';
import ProposalSharing from '@/components/ProposalSharing';
import PaymentLinks from '@/components/PaymentLinks';
import ProposalAnalytics from '@/components/ProposalAnalytics';
import ESignatureFlow from '@/components/ESignature/ESignatureFlow';

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
  const [generatingAI, setGeneratingAI] = useState<string | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [editMode, setEditMode] = useState<'form' | 'drag'>('form');

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

  const getContentValue = (sectionType: string, field: string) => {
    if (!proposal?.content?.sections) return '';
    const section = proposal.content.sections.find((s: any) => s.type === sectionType);
    return section ? section[field] : '';
  };

  const getContentArray = (sectionType: string, field: string) => {
    if (!proposal?.content?.sections) return [];
    const section = proposal.content.sections.find((s: any) => s.type === sectionType);
    const value = section ? section[field] : null;
    return Array.isArray(value) ? value : [];
  };

  const updateContentValue = (sectionType: string, field: string, value: any) => {
    if (!proposal) return;
    
    const updatedSections = proposal.content?.sections?.map((section: any) => {
      if (section.type === sectionType) {
        return { ...section, [field]: value };
      }
      return section;
    }) || [];

    // If section doesn't exist, create it
    if (!updatedSections.some((s: any) => s.type === sectionType)) {
      updatedSections.push({ type: sectionType, [field]: value });
    }
    
    setProposal(prev => prev ? {
      ...prev,
      content: { ...prev.content, sections: updatedSections }
    } : null);
  };

  const updateTimelinePhase = (phaseIndex: number, field: string, value: string) => {
    if (!proposal) return;
    
    const scopeSection = proposal.content?.sections?.find((s: any) => s.type === 'scope_of_work');
    const currentPhases = scopeSection?.timeline || [];
    const updatedPhases = [...currentPhases];
    
    if (updatedPhases[phaseIndex]) {
      updatedPhases[phaseIndex] = { ...updatedPhases[phaseIndex], [field]: value };
    } else {
      updatedPhases[phaseIndex] = { [field]: value };
    }
    
    updateContentValue('scope_of_work', 'timeline', updatedPhases);
  };

  const addScopeTimelinePhase = () => {
    const currentPhases = getContentValue('scope_of_work', 'timeline') || [];
    const newPhases = [...currentPhases, { phase: '', duration: '', description: '' }];
    updateContentValue('scope_of_work', 'timeline', newPhases);
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

  const generateAIContent = async (section: string, context?: string) => {
    if (!proposal) return;
    
    setGeneratingAI(section);
    try {
      const { data, error } = await supabase.functions.invoke('generate-proposal-content', {
        body: { 
          section,
          context: context || `${proposal.client_name} - ${proposal.title}`
        }
      });

      if (error) throw error;

      if (data?.content) {
        updateContentValue(section, 'content', data.content);
        toast({
          title: "AI Content Generated",
          description: "Content has been generated and added to your proposal"
        });
      }
    } catch (error) {
      console.error('Error generating AI content:', error);
      toast({
        title: "Error",
        description: "Failed to generate AI content",
        variant: "destructive"
      });
    } finally {
      setGeneratingAI(null);
    }
  };

  const convertToSections = () => {
    if (!proposal?.content?.sections) return [];
    
    return proposal.content.sections.map((section: any, index: number) => ({
      id: section.id || `section-${index}`,
      type: section.type,
      title: section.type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
      content: { text: section.content },
      order: index
    }));
  };

  const updateSectionsFromDragDrop = (sections: any[]) => {
    const updatedSections = sections.map(section => ({
      type: section.type,
      content: section.content.text,
      id: section.id,
      timeline: section.type === 'scope_of_work' ? getContentValue('scope_of_work', 'timeline') : undefined
    }));

    setProposal(prev => prev ? {
      ...prev,
      content: { ...prev.content, sections: updatedSections }
    } : null);
  };

  const [searchParams] = useSearchParams();
  const goTarget = searchParams.get('go');
  const defaultTab = goTarget === 'signatures' ? 'signatures' : 'editor';

  if (!user || !proposal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center">
        <div className="text-center">
          <img src={logo} alt="ProposalKraft" className="h-12 mx-auto mb-4 animate-pulse" />
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
                <img src={logo} alt="ProposalKraft" className="h-8" />
                <span className="text-xl font-bold text-primary">ProposalKraft</span>
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
                <ExportDialog proposal={proposal} defaultOpen={goTarget === 'export'} />
                <ProposalSharing 
                  proposalId={proposal.id} 
                  proposalTitle={proposal.title} 
                />
                <PaymentLinks 
                  proposalId={proposal.id}
                  proposalAmount={proposal.content?.pricing}
                  proposalCurrency={proposal.content?.currency}
                  defaultOpen={goTarget === 'payment'}
                />
                <ProposalAnalytics 
                  proposalId={proposal.id}
                  proposalTitle={proposal.title}
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setEditMode(editMode === 'form' ? 'drag' : 'form')}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  {editMode === 'form' ? 'Advanced Editor' : 'Form Editor'}
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
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="editor">Proposal Editor</TabsTrigger>
            <TabsTrigger value="research">
              <Building className="h-4 w-4 mr-2" />
              Company Research
            </TabsTrigger>
            <TabsTrigger value="signatures">
              <Edit3 className="h-4 w-4 mr-2" />
              E-Signatures
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="editor">
            {editMode === 'drag' ? (
              <DragDropEditor 
                sections={convertToSections()} 
                onSectionsUpdate={updateSectionsFromDragDrop}
              />
            ) : (
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
                   <Label htmlFor="cover_tagline">Cover Page Tagline</Label>
                   <Input
                     id="cover_tagline"
                     value={getContentValue('cover_page', 'tagline')}
                     onChange={(e) => updateContentValue('cover_page', 'tagline', e.target.value)}
                     placeholder={`Helping ${proposal.client_name} achieve success with innovative solutions`}
                   />
                 </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="executive_summary">Executive Summary</Label>
                      <Button 
                        onClick={() => generateAIContent('executive_summary')}
                        disabled={generatingAI === 'executive_summary'}
                        variant="outline" 
                        size="sm"
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        {generatingAI === 'executive_summary' ? 'Generating...' : 'AI Generate'}
                      </Button>
                    </div>
                    <Textarea
                      id="executive_summary"
                      value={getContentValue('executive_summary', 'content')}
                      onChange={(e) => updateContentValue('executive_summary', 'content', e.target.value)}
                      placeholder="Provide a high-level overview tailored to the client's main challenge and results you aim to deliver..."
                      className="min-h-[100px]"
                    />
                  </div>

                 <div className="space-y-2">
                   <Label htmlFor="client_problem">Client's Problem / Needs</Label>
                   <Textarea
                     id="client_problem"
                     value={getContentValue('client_problem', 'content')}
                     onChange={(e) => updateContentValue('client_problem', 'content', e.target.value)}
                     placeholder="Restate the client's pain points to show you understand them..."
                     className="min-h-[100px]"
                   />
                 </div>

                 <div className="space-y-2">
                   <Label htmlFor="proposed_solution">Proposed Solution</Label>
                   <Textarea
                     id="proposed_solution"
                     value={getContentValue('proposed_solution', 'content')}
                     onChange={(e) => updateContentValue('proposed_solution', 'content', e.target.value)}
                     placeholder="Describe your approach, process, methodology, and why this solution fits their specific situation..."
                     className="min-h-[120px]"
                   />
                 </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="scope_of_work">Scope of Work (Deliverables)</Label>
                      <Button 
                        onClick={() => generateAIContent('scope_of_work')}
                        disabled={generatingAI === 'scope_of_work'}
                        variant="outline" 
                        size="sm"
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        {generatingAI === 'scope_of_work' ? 'Generating...' : 'AI Generate'}
                      </Button>
                    </div>
                    <Textarea
                      id="scope_of_work"
                      value={getContentValue('scope_of_work', 'content')}
                      onChange={(e) => updateContentValue('scope_of_work', 'content', e.target.value)}
                      placeholder="Detailed breakdown of deliverables and activities..."
                      className="min-h-[120px]"
                    />
                  </div>

                 <div className="space-y-2">
                   <Label>Timeline / Milestones</Label>
                   <div className="space-y-3">
                      {getContentArray('scope_of_work', 'timeline').map((phase: any, index: number) => (
                       <div key={index} className="grid grid-cols-3 gap-2">
                          <Input
                            value={phase.phase || ''}
                            onChange={(e) => updateTimelinePhase(index, 'phase', e.target.value)}
                            placeholder="Phase name"
                          />
                          <Input
                            value={phase.duration || ''}
                            onChange={(e) => updateTimelinePhase(index, 'duration', e.target.value)}
                            placeholder="Duration"
                          />
                          <Input
                            value={phase.description || ''}
                            onChange={(e) => updateTimelinePhase(index, 'description', e.target.value)}
                            placeholder="Description"
                          />
                       </div>
                     )) || (
                       <p className="text-muted-foreground text-sm">No timeline phases found</p>
                     )}
                     <Button onClick={addScopeTimelinePhase} variant="outline" size="sm">
                       Add Phase
                     </Button>
                   </div>
                 </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="pricing_total">Pricing & Packages</Label>
                      <Button 
                        onClick={() => generateAIContent('pricing')}
                        disabled={generatingAI === 'pricing'}
                        variant="outline" 
                        size="sm"
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        {generatingAI === 'pricing' ? 'Generating...' : 'AI Generate'}
                      </Button>
                    </div>
                    <Textarea
                      id="pricing_content"
                      value={getContentValue('pricing', 'content')}
                      onChange={(e) => updateContentValue('pricing', 'content', e.target.value)}
                      placeholder="Detailed pricing breakdown and packages..."
                      className="min-h-[120px]"
                    />
                  </div>
                 
                 <div className="space-y-2">
                   <Label htmlFor="payment_terms">Payment Terms</Label>
                   <Textarea
                     id="payment_terms"
                     value={getContentValue('pricing', 'payment_terms') || ''}
                     onChange={(e) => updateContentValue('pricing', 'payment_terms', e.target.value)}
                     placeholder="Payment schedule, invoicing terms, etc..."
                     className="min-h-[80px]"
                   />
                 </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="value_proposition">Value Proposition / Why Us</Label>
                      <Button 
                        onClick={() => generateAIContent('about_us')}
                        disabled={generatingAI === 'about_us'}
                        variant="outline" 
                        size="sm"
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        {generatingAI === 'about_us' ? 'Generating...' : 'AI Generate'}
                      </Button>
                    </div>
                    <Textarea
                      id="value_proposition"
                      value={getContentValue('about_us', 'content')}
                      onChange={(e) => updateContentValue('about_us', 'content', e.target.value)}
                      placeholder="Your unique advantages, case studies, testimonials, team expertise..."
                      className="min-h-[100px]"
                    />
                  </div>

                 <div className="space-y-2">
                   <Label htmlFor="terms_conditions">Terms & Conditions</Label>
                   <Textarea
                     id="terms_conditions"
                     value={getContentValue('terms_conditions', 'content') || ''}
                     onChange={(e) => updateContentValue('terms_conditions', 'content', e.target.value)}
                     placeholder="Confidentiality, revisions, cancellation, ownership of work, etc..."
                     className="min-h-[80px]"
                   />
                 </div>

                 <div className="space-y-2">
                   <Label htmlFor="call_to_action">Call to Action & Next Steps</Label>
                   <Textarea
                     id="call_to_action"
                     value={getContentValue('call_to_action', 'next_steps') || ''}
                     onChange={(e) => updateContentValue('call_to_action', 'next_steps', e.target.value)}
                     placeholder="Sign below, book a kickoff call, contact details, etc..."
                     className="min-h-[80px]"
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
                  {/* Cover Page */}
                  <div className="text-center mb-8 border-b pb-6">
                    <h1 className="text-3xl font-bold mb-2">{proposal.title}</h1>
                    <p className="text-lg text-gray-600 mb-2">Prepared for {proposal.client_name}</p>
                    <p className="text-gray-500 mb-3">
                      {new Date().toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                    <p className="text-sm text-gray-600 italic">
                      {getContentValue('cover_page', 'tagline') || `Helping ${proposal.client_name} achieve success with innovative solutions`}
                    </p>
                  </div>
                  
                  <div className="space-y-6">
                     <section>
                       <h2 className="text-xl font-semibold mb-3 text-primary border-b border-gray-200 pb-2">
                         Executive Summary
                       </h2>
                       <p className="text-gray-700 leading-relaxed">
                         {getContentValue('executive_summary', 'content') || 
                          'This proposal outlines our comprehensive approach to delivering exceptional results for your project, tailored to your specific needs and challenges.'}
                       </p>
                     </section>
                     
                     <section>
                       <h2 className="text-xl font-semibold mb-3 text-primary border-b border-gray-200 pb-2">
                         Understanding Your Needs
                       </h2>
                       <p className="text-gray-700 leading-relaxed">
                         {getContentValue('client_problem', 'content') || 
                          'We understand the challenges you\'re facing and are committed to addressing your specific pain points with tailored solutions.'}
                       </p>
                     </section>
                     
                     <section>
                       <h2 className="text-xl font-semibold mb-3 text-primary border-b border-gray-200 pb-2">
                         Our Proposed Solution
                       </h2>
                       <p className="text-gray-700 leading-relaxed">
                         {getContentValue('proposed_solution', 'content') || 
                          'Our proven methodology and strategic approach will deliver measurable results through careful planning, expert execution, and continuous optimization.'}
                       </p>
                     </section>
                     
                     <section>
                       <h2 className="text-xl font-semibold mb-3 text-primary border-b border-gray-200 pb-2">
                         Scope of Work & Deliverables
                       </h2>
                       <ul className="list-disc list-inside text-gray-700 space-y-2 leading-relaxed">
                         {getContentArray('scope_of_work', 'deliverables').map((item: string, index: number) => (
                           <li key={index}>{item}</li>
                         )) || (
                           <>
                             <li>Initial consultation and comprehensive requirements gathering</li>
                             <li>Strategic planning and project roadmap development</li>
                             <li>Design and development phase with regular checkpoints</li>
                             <li>Testing, quality assurance, and refinement</li>
                             <li>Deployment, launch, and post-launch support</li>
                           </>
                         )}
                       </ul>
                     </section>
                     
                     <section>
                       <h2 className="text-xl font-semibold mb-3 text-primary border-b border-gray-200 pb-2">
                         Timeline & Milestones
                       </h2>
                       <div className="text-gray-700 space-y-2">
                         {getContentArray('scope_of_work', 'timeline').map((phase: any, index: number) => (
                           <p key={index}>
                             <strong>{phase.phase}:</strong> {phase.description} ({phase.duration})
                           </p>
                         )) || (
                           <>
                             <p><strong>Phase 1:</strong> Discovery & Planning (2 weeks)</p>
                             <p><strong>Phase 2:</strong> Design & Development (6-8 weeks)</p>
                             <p><strong>Phase 3:</strong> Testing & Launch (2 weeks)</p>
                           </>
                         )}
                       </div>
                     </section>
                     
                     <section>
                       <h2 className="text-xl font-semibold mb-3 text-primary border-b border-gray-200 pb-2">
                         Pricing & Investment
                       </h2>
                       <div className="text-gray-700">
                         <p className="text-lg font-medium mb-2">
                           Total Project Investment: {getContentValue('pricing', 'total') || '$XX,XXX'}
                         </p>
                         <p className="text-sm">
                           {getContentValue('pricing', 'payment_terms') || 
                            'Payment terms: 50% upon contract signing, 25% at project midpoint, 25% upon completion.'}
                         </p>
                       </div>
                     </section>
                     
                     <section>
                       <h2 className="text-xl font-semibold mb-3 text-primary border-b border-gray-200 pb-2">
                         Why Choose Us
                       </h2>
                       <ul className="list-disc list-inside text-gray-700 space-y-2">
                         {getContentArray('value_proposition', 'advantages').map((advantage: string, index: number) => (
                           <li key={index}>{advantage}</li>
                         )) || (
                           <>
                             <li>Proven track record with similar projects</li>
                             <li>Expert team with specialized skills</li>
                             <li>Transparent communication and regular updates</li>
                             <li>Commitment to delivering exceptional results</li>
                           </>
                         )}
                       </ul>
                     </section>
                     
                     <section>
                       <h2 className="text-xl font-semibold mb-3 text-primary border-b border-gray-200 pb-2">
                         Terms & Conditions
                       </h2>
                       <p className="text-gray-700 text-sm leading-relaxed">
                         {getContentValue('terms_conditions', 'content') || 
                          'This proposal is valid for 30 days. All work is subject to our standard terms and conditions, including confidentiality agreements and revision policies.'}
                       </p>
                     </section>
                     
                     <section>
                       <h2 className="text-xl font-semibold mb-3 text-primary border-b border-gray-200 pb-2">
                         Next Steps
                       </h2>
                       <p className="text-gray-700 leading-relaxed">
                         {getContentValue('call_to_action', 'next_steps') || 
                          'Ready to get started? Please review this proposal and let us know if you have any questions. To proceed, simply sign below and return this document. We\'ll then schedule a kickoff call to begin transforming your vision into reality.'}
                       </p>
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
            )}
        </TabsContent>
       
        <TabsContent value="research" className="space-y-6">
          <CompanyResearch 
            onResearchComplete={(data) => {
              console.log('Research completed:', data);
              toast({
                title: "Research Complete",
                description: `Analysis completed for ${data.companyName}`,
              });
            }}
          />
        </TabsContent>

        <TabsContent value="signatures" className="space-y-6">
          <ESignatureFlow 
            proposalId={proposal.id}
            signers={[]}
            onSignersUpdate={(signers) => {
              console.log('Signers updated:', signers);
            }}
            isOwner={true}
          />
        </TabsContent>
      </Tabs>
   </div>
 </div>
);
}