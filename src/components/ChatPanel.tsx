import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Message, CompanyProfile } from './AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface Props {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  profile: CompanyProfile;
  onProposalCreated: (proposal: any) => void;
  onProfileUpdated: (updates: Partial<CompanyProfile>) => void;
  proposalPanelOpen: boolean;
  user: SupabaseUser | null;
}

function renderMarkdown(text: string) {
  return text
    .replace(/^### (.*$)/gm, '<h3 class="text-sm font-semibold mt-2 mb-1">$1</h3>')
    .replace(/^## (.*$)/gm, '<h3 class="text-sm font-semibold mt-2 mb-1">$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>');
}

export default function ChatPanel({
  messages, setMessages, profile, onProposalCreated, onProfileUpdated, proposalPanelOpen, user
}: Props) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (role: 'user' | 'assistant', content: string) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date(),
    }]);
  };

  const generateProposal = async (proposalInfo: {
    client_name: string;
    project_type: string;
    deliverables: string;
    timeline?: string;
    pricing: string;
    payment_terms?: string;
    special_requirements?: string;
    response: string;
  }) => {
    if (!user) return;

    addMessage('assistant', '✨ Generating your proposal now... This will take a moment!');

    const pricing = proposalInfo.pricing || '$0';

    try {
      const { data } = await supabase.functions.invoke('generate-proposal-content', {
        body: {
          section: 'full_proposal',
          clientName: proposalInfo.client_name,
          projectName: proposalInfo.project_type,
          proposalTitle: `${proposalInfo.project_type} Proposal for ${proposalInfo.client_name}`,
          projectWorth: pricing.replace(/[^0-9.]/g, ''),
          timeline: proposalInfo.timeline || 'To be discussed',
          deliverables: proposalInfo.deliverables,
          paymentTerms: proposalInfo.payment_terms || '',
          specialRequirements: proposalInfo.special_requirements || '',
          companyName: profile.company_name,
          companyBio: profile.bio,
          services: profile.services,
          caseStudies: profile.case_studies,
        }
      });

      const aiContent = data?.content || '';

      const proposalPayload = {
        user_id: user.id,
        title: `${proposalInfo.project_type} Proposal for ${proposalInfo.client_name}`,
        client_name: proposalInfo.client_name,
        status: 'draft',
        worth: parseFloat(pricing.replace(/[^0-9.]/g, '')) || 0,
        content: {
          summary: aiContent,
          timeline: proposalInfo.timeline || 'To be discussed',
          pricing,
          deliverables: proposalInfo.deliverables,
          payment_terms: proposalInfo.payment_terms || 'To be discussed',
          special_requirements: proposalInfo.special_requirements || '',
          project_type: proposalInfo.project_type,
          company_name: profile.company_name,
          company_logo: profile.logo_url,
          company_bio: profile.bio,
          company_services: profile.services,
          next_steps: 'Please sign the proposal and make the initial payment to get started.',
          sections: [
            { type: 'cover_page', title: `${proposalInfo.project_type} Proposal`, company_name: profile.company_name, company_logo: profile.logo_url },
            { type: 'executive_summary', content: aiContent },
            { type: 'deliverables', content: proposalInfo.deliverables },
            { type: 'timeline', content: proposalInfo.timeline || 'To be discussed' },
            { type: 'pricing', content: pricing },
            { type: 'payment_terms', content: proposalInfo.payment_terms || 'To be discussed' },
            { type: 'about', content: profile.bio || 'About our company...' },
            { type: 'next_steps', content: 'Please sign the proposal and make the initial payment to get started.' },
          ]
        }
      };

      const { data: savedProposal, error: saveError } = await (supabase as any)
        .from('proposals')
        .insert(proposalPayload)
        .select()
        .single();

      if (saveError) throw saveError;

      addMessage('assistant', proposalInfo.response || `🎉 Your proposal is ready! I've created a **${proposalInfo.project_type}** proposal for **${proposalInfo.client_name}** worth **${pricing}**. The proposal panel is now open — you can edit any section directly.`);

      onProposalCreated(savedProposal);
    } catch (err: any) {
      console.error('Error generating proposal:', err);
      addMessage('assistant', 'Sorry, I had trouble generating the proposal. Please try again!');
      toast({ title: 'Error generating proposal', variant: 'destructive' });
    }
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    setInput('');
    addMessage('user', trimmed);
    setLoading(true);

    try {
      // Build conversation history for AI (last 20 messages for better context)
      const recentMessages = messages.slice(-20).map(m => ({
        role: m.role,
        content: m.content,
      }));
      recentMessages.push({ role: 'user', content: trimmed });

      const { logo_url, ...profileForAI } = profile;
      const { data, error } = await supabase.functions.invoke('chat-assistant', {
        body: {
          messages: recentMessages,
          companyProfile: profileForAI,
        }
      });

      if (error) throw error;

      const { intent, response, generated_content, client_name, project_type,
              deliverables, timeline, pricing, payment_terms, special_requirements } = data;

      switch (intent) {
        case 'generate_proposal':
          await generateProposal({
            client_name: client_name || 'Client',
            project_type: project_type || 'Project',
            deliverables: deliverables || '',
            timeline,
            pricing: pricing || '$0',
            payment_terms,
            special_requirements,
            response: response || '',
          });
          break;

        case 'create_proposal':
          // AI acknowledged the intent and is asking follow-up questions
          addMessage('assistant', response || `I'd love to help create a proposal! Let me ask a few questions to make it great.`);
          break;

        case 'write_about_us':
          addMessage('assistant', response || 'Here\'s a professional About Us section for your company:');
          if (generated_content) {
            await (supabase as any)
              .from('profiles')
              .update({ bio: generated_content })
              .eq('user_id', user?.id);
            onProfileUpdated({ bio: generated_content });
            addMessage('assistant', `📝 **Generated About Us:**\n\n${generated_content}\n\nI've saved this to your company profile.`);
          }
          break;

        case 'write_case_study':
          addMessage('assistant', response || 'Here\'s a case study for your company:');
          if (generated_content) {
            await (supabase as any)
              .from('profiles')
              .update({ case_studies: generated_content })
              .eq('user_id', user?.id);
            onProfileUpdated({ case_studies: generated_content });
            addMessage('assistant', `📝 **Generated Case Study:**\n\n${generated_content}\n\nI've saved this to your company profile.`);
          }
          break;

        case 'general_chat':
        default:
          addMessage('assistant', response || "I'm here to help! You can ask me to create proposals, write your About Us section, or generate case studies.");
          break;
      }
    } catch (err) {
      console.error('Chat error:', err);
      addMessage('assistant', "Sorry, I couldn't process that. Please try again!");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full transition-all duration-300 ease-in-out",
        proposalPanelOpen ? "flex-1 min-w-0" : "flex-1"
      )}
    >
      {/* Chat Header */}
      <div className="border-b bg-card px-6 py-3 flex items-center gap-3">
        <img src="/lovable-uploads/22b8b905-b997-42da-85df-b966b4616f6e.png" alt="Craft Proposal" className="w-8 h-8 rounded-full object-contain" />
        <div>
          <p className="text-sm font-semibold">Craft Proposal</p>
          <p className="text-xs text-muted-foreground">AI-powered • Always ready</p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-4 scrollbar-thin">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-3 animate-fade-in",
                msg.role === 'user' ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                msg.role === 'user' ? "bg-primary" : "bg-muted"
              )}>
                {msg.role === 'user'
                  ? <User className="w-3.5 h-3.5 text-primary-foreground" />
                  : <img src="/lovable-uploads/22b8b905-b997-42da-85df-b966b4616f6e.png" alt="CP" className="w-3.5 h-3.5 object-contain" />}
              </div>
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  msg.role === 'user'
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-card border text-foreground rounded-tl-sm shadow-sm"
                )}
                dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
              />
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                <img src="/lovable-uploads/22b8b905-b997-42da-85df-b966b4616f6e.png" alt="CP" className="w-3.5 h-3.5 object-contain" />
              </div>
              <div className="bg-card border rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t bg-card px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <div className="flex gap-2 items-end">
            <Textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything — create proposals, write About Us, generate case studies..."
              className="min-h-[44px] max-h-[120px] resize-none text-sm"
              disabled={loading}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="h-11 w-11 shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5 text-center">
            Press Enter to send • Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
