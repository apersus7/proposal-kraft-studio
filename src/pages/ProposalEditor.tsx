import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Save, Send, Eye, Download, Sparkles, Building, Edit3, CreditCard, MoreHorizontal, BarChart3, Share, DollarSign } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
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
  const [sendEmailDialog, setSendEmailDialog] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [signers, setSigners] = useState<any[]>([]);

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
    setRecipientEmail(proposal.client_email || '');
    setSendEmailDialog(true);
  };

  const sendProposalEmail = async () => {
    if (!proposal || !user || !recipientEmail) return;

    setSendingEmail(true);
    try {
      // First create a secure share token
      const { data: shareData, error: shareError } = await supabase
        .from('secure_proposal_shares')
        .insert({
          proposal_id: proposal.id,
          created_by: user.id,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          permissions: JSON.stringify({
            allowComments: false,
            trackViews: true,
            requireSignature: false
          })
        })
        .select()
        .single();

      if (shareError) throw shareError;

      // Generate the secure share URL
      const shareUrl = `${window.location.origin}/shared/${encodeURIComponent(shareData.share_token)}`;

      // Update the proposal status to 'sent'
      const { error: updateError } = await supabase
        .from('proposals')
        .update({
          status: 'sent'
        })
        .eq('id', proposal.id);

      if (updateError) throw updateError;

      // Send the email with the secure share URL
      const { error: emailError } = await supabase.functions.invoke('send-proposal-email', {
        body: {
          proposalId: proposal.id,
          recipientEmail: recipientEmail,
          proposalTitle: proposal.title,
          senderName: user.user_metadata?.full_name || user.email,
          shareUrl
        }
      });

      if (emailError) throw emailError;

      setProposal(prev => prev ? { ...prev, status: 'sent' } : null);
      setSendEmailDialog(false);
      setRecipientEmail('');
      toast({
        title: "Success",
        description: `Proposal sent to ${recipientEmail}!`
      });
    } catch (error) {
      console.error('Error sending proposal:', error);
      toast({
        title: "Error",
        description: "Failed to send proposal",
        variant: "destructive"
      });
    } finally {
      setSendingEmail(false);
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
              
              {/* Primary Save Action */}
              <Button onClick={handleSave} disabled={loading} size="sm" variant="outline">
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>

              {/* Send Button (if not sent) */}
              {proposal.status !== 'sent' && (
                <Button onClick={handleSend} disabled={!proposal || sendingEmail} size="sm">
                  <Send className="h-4 w-4 mr-2" />
                  Send to Client
                </Button>
              )}

              {/* All Other Actions in Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4 mr-2" />
                    Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-background border shadow-lg">
                  <DropdownMenuLabel>View & Edit</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => window.open(`/preview/${proposal.id}`, '_blank')}>
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setEditMode(editMode === 'form' ? 'drag' : 'form')}>
                    <Edit3 className="mr-2 h-4 w-4" />
                    {editMode === 'form' ? 'Advanced Editor' : 'Form Editor'}
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Tools</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  <div className="p-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <ExportDialog proposal={proposal} defaultOpen={goTarget === 'export'} />
                    </div>
                    <div className="flex items-center justify-between">
                      <ProposalSharing 
                        proposalId={proposal.id} 
                        proposalTitle={proposal.title} 
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <PaymentLinks 
                        proposalId={proposal.id}
                        proposalAmount={proposal.content?.pricing}
                        proposalCurrency={proposal.content?.currency}
                        defaultOpen={goTarget === 'payment'}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <ProposalAnalytics 
                        proposalId={proposal.id}
                        proposalTitle={proposal.title}
                      />
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="editor">Proposal Editor</TabsTrigger>
            <TabsTrigger value="payment">
              <CreditCard className="h-4 w-4 mr-2" />
              Payment Links
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
                      <Label htmlFor="objective">Project Objective</Label>
                      <Button 
                        onClick={() => generateAIContent('objective')}
                        disabled={generatingAI === 'objective'}
                        variant="outline" 
                        size="sm"
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        {generatingAI === 'objective' ? 'Generating...' : 'AI Generate'}
                      </Button>
                    </div>
                    <Textarea
                      id="objective"
                      value={getContentValue('objective', 'content')}
                      onChange={(e) => updateContentValue('objective', 'content', e.target.value)}
                      placeholder="Describe the main objectives and goals of this project..."
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
                     <Label>Payment Links</Label>
                     <Card className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border-dashed">
                       <div className="text-center space-y-3">
                         <CreditCard className="h-8 w-8 mx-auto text-green-600" />
                         <div>
                           <h4 className="font-medium">Add Payment Links to Proposal</h4>
                           <p className="text-sm text-muted-foreground">
                             Create payment buttons that appear in your proposal
                           </p>
                         </div>
                         <Button 
                           variant="outline" 
                           size="sm"
                           onClick={() => setEditMode('drag')}
                           className="border-green-600 text-green-600 hover:bg-green-50"
                         >
                           <CreditCard className="h-4 w-4 mr-2" />
                           Use Advanced Editor to Add Payment Links
                         </Button>
                         <p className="text-xs text-muted-foreground">
                           Or use the Payment Links tab to create standalone payment links
                         </p>
                       </div>
                     </Card>
                   </div>

                   <div className="space-y-2">
                     <Label>E-Signatures</Label>
                     <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-dashed">
                       <div className="text-center space-y-3">
                         <Edit3 className="h-8 w-8 mx-auto text-purple-600" />
                         <div>
                           <h4 className="font-medium">Electronic Signatures</h4>
                           <p className="text-sm text-muted-foreground">
                             {signers.length > 0 ? `${signers.length} signer(s) configured` : 'No signers configured yet'}
                           </p>
                         </div>
                         <Button 
                           variant="outline" 
                           size="sm"
                           onClick={() => {
                             const tabs = document.querySelector('[role="tablist"]');
                             const signaturesTab = tabs?.querySelector('[value="signatures"]') as HTMLElement;
                             signaturesTab?.click();
                           }}
                           className="border-purple-600 text-purple-600 hover:bg-purple-50"
                         >
                           <Edit3 className="h-4 w-4 mr-2" />
                           Manage E-Signatures
                         </Button>
                       </div>
                     </Card>
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
                <div 
                  className="aspect-[8.5/11] border rounded-lg p-8 text-sm overflow-auto relative" 
                  style={{ 
                    backgroundColor: proposal.content?.backgroundColor || '#ffffff',
                    color: proposal.content?.backgroundColor === '#000000' ? '#ffffff' : '#000000',
                    fontFamily: proposal.content?.selectedFont || 'Inter'
                  }}
                >
                  {/* Logo in top-left corner */}
                  {proposal.content?.logoUrl && (
                    <div className="absolute top-4 left-4 z-10">
                      <img 
                        src={proposal.content.logoUrl} 
                        alt="Company Logo" 
                        className="h-10 w-auto object-contain"
                        onError={(e) => {
                          console.log('Logo failed to load:', proposal.content.logoUrl);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  {/* Cover Page */}
                  <div className="text-center mb-8 border-b pb-6 pt-16">
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
                         Project Objective
                       </h2>
                       <p className="text-gray-700 leading-relaxed">
                         {getContentValue('objective', 'content') || 
                          'This project aims to deliver measurable value by addressing your core business needs with strategic solutions and proven methodologies.'}
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

        <TabsContent value="payment" className="space-y-6">
           <div className="max-w-4xl mx-auto">
             <Card>
               <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <CreditCard className="h-5 w-5" />
                   Payment Links Management
                 </CardTitle>
                 <CardDescription>
                   Create and manage payment links for this proposal. Configure your payment providers in Settings if needed.
                 </CardDescription>
               </CardHeader>
               <CardContent>
                 <PaymentLinks 
                   proposalId={proposal.id}
                   proposalAmount={proposal.content?.pricing}
                   proposalCurrency={proposal.content?.currency}
                   defaultOpen={false}
                 />
               </CardContent>
             </Card>
           </div>
         </TabsContent>

          <TabsContent value="signatures" className="space-y-6">
            <ESignatureFlow 
              proposalId={proposal.id}
              signers={signers}
              onSignersUpdate={setSigners}
              isOwner={true}
            />
          </TabsContent>
      </Tabs>
      </div>

      {/* Send Email Dialog */}
      <Dialog open={sendEmailDialog} onOpenChange={setSendEmailDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Proposal to Client</DialogTitle>
            <DialogDescription>
              Enter the client's email address to send the proposal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipient-email">Client Email</Label>
              <Input
                id="recipient-email"
                type="email"
                placeholder="client@example.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setSendEmailDialog(false)}
              disabled={sendingEmail}
            >
              Cancel
            </Button>
            <Button 
              onClick={sendProposalEmail} 
              disabled={!recipientEmail || sendingEmail}
            >
              {sendingEmail ? 'Sending...' : 'Send Proposal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
);
}