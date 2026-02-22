import React, { useState, useRef, useEffect, useMemo } from 'react';
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

type ConversationState =
  | 'idle'
  | 'awaiting_details'
  | 'generating';

interface PendingProposal {
  clientName: string;
  projectType: string;
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
  const [convState, setConvState] = useState<ConversationState>('idle');
  const [pendingProposal, setPendingProposal] = useState<PendingProposal | null>(null);
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

  const parseDetailsFromMessage = (msg: string) => {
    // Extract timeline and pricing from a combined message
    // Try currency symbol first
    const currencyMatch = msg.match(/[\$€£₹]\s?[\d,]+(?:\.\d+)?/);
    if (currencyMatch) {
      const pricing = currencyMatch[0];
      const timeline = msg.replace(pricing, '').replace(/[,.]?\s*$/, '').trim() || 'To be discussed';
      return { timeline, pricing };
    }
    // Try bare number (last number in the message, likely the price)
    const numbers = [...msg.matchAll(/\b[\d,]+(?:\.\d+)?\b/g)];
    if (numbers.length > 0) {
      const lastNumber = numbers[numbers.length - 1][0];
      const pricing = `$${lastNumber}`;
      const timeline = msg.replace(lastNumber, '').replace(/[,.]?\s*$/, '').trim() || 'To be discussed';
      return { timeline, pricing };
    }
    return { timeline: msg, pricing: '$0' };
  };

  const generateProposal = async (info: PendingProposal, details: string) => {
    if (!user) return;
    setConvState('generating');
    addMessage('assistant', '✨ Generating your proposal now... This will take a moment!');

    const { timeline, pricing } = parseDetailsFromMessage(details);

    try {
      const { data } = await supabase.functions.invoke('generate-proposal-content', {
        body: {
          section: 'full_proposal',
          clientName: info.clientName,
          projectName: info.projectType,
          proposalTitle: `${info.projectType} Proposal for ${info.clientName}`,
          projectWorth: pricing.replace(/[^0-9.]/g, ''),
          timeline,
          companyName: profile.company_name,
          companyBio: profile.bio,
          services: profile.services,
          caseStudies: profile.case_studies,
        }
      });

      const aiContent = data?.content || '';

      const proposalPayload = {
        user_id: user.id,
        title: `${info.projectType} Proposal for ${info.clientName}`,
        client_name: info.clientName,
        status: 'draft',
        worth: parseFloat(pricing.replace(/[^0-9.]/g, '')) || 0,
        content: {
          summary: aiContent,
          timeline,
          pricing,
          project_type: info.projectType,
          company_name: profile.company_name,
          company_logo: profile.logo_url,
          company_bio: profile.bio,
          company_services: profile.services,
          case_studies: profile.case_studies,
          deliverables: '',
          next_steps: 'Please sign the proposal and make the initial payment to get started.',
          sections: [
            { type: 'cover_page', title: `${info.projectType} Proposal`, company_name: profile.company_name, company_logo: profile.logo_url },
            { type: 'executive_summary', content: aiContent },
            { type: 'timeline', content: timeline },
            { type: 'pricing', content: pricing },
            { type: 'about', content: profile.bio || 'About our company...' },
            { type: 'case_studies', content: profile.case_studies || 'Our previous work...' },
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

      addMessage('assistant', `🎉 Your proposal is ready! I've created a **${info.projectType}** proposal for **${info.clientName}** worth **${pricing}**. The proposal panel is now open — you can edit any section directly.`);

      onProposalCreated(savedProposal);
      setConvState('idle');
      setPendingProposal(null);
    } catch (err: any) {
      console.error('Error generating proposal:', err);
      addMessage('assistant', 'Sorry, I had trouble generating the proposal. Please try again!');
      setConvState('idle');
      toast({ title: 'Error generating proposal', variant: 'destructive' });
    }
  };

  const handleAIResponse = async (userMessage: string) => {
    // Build conversation history for AI (last 10 messages for context)
    const recentMessages = messages.slice(-10).map(m => ({
      role: m.role,
      content: m.content,
    }));
    recentMessages.push({ role: 'user', content: userMessage });

    // Exclude logo_url from profile to avoid huge base64 payloads
    const { logo_url, ...profileForAI } = profile;
    const { data, error } = await supabase.functions.invoke('chat-assistant', {
      body: {
        messages: recentMessages,
        companyProfile: profileForAI,
      }
    });

    if (error) throw error;

    const { intent, client_name, project_type, response, generated_content } = data;

    switch (intent) {
      case 'create_proposal':
        setPendingProposal({
          clientName: client_name || 'Client',
          projectType: project_type || 'project',
        });
        setConvState('awaiting_details');
        addMessage('assistant', response || `Great! I'll create a proposal for **${client_name}** for **${project_type}**.\n\nPlease share the **timeline** and **pricing** for this project (e.g., "2 weeks, $2,500").`);
        break;

      case 'write_about_us':
        addMessage('assistant', response || 'Here\'s a professional About Us section for your company:');
        if (generated_content) {
          await (supabase as any)
            .from('profiles')
            .update({ bio: generated_content })
            .eq('user_id', user?.id);
          onProfileUpdated({ bio: generated_content });
          addMessage('assistant', `📝 **Generated About Us:**\n\n${generated_content}\n\nI've saved this to your company profile. You can edit it anytime in Settings.`);
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
          addMessage('assistant', `📝 **Generated Case Study:**\n\n${generated_content}\n\nI've saved this to your company profile. You can edit it in Settings.`);
        }
        break;

      case 'general_chat':
      default:
        addMessage('assistant', response || "I'm here to help! You can ask me to create proposals, write your About Us section, or generate case studies.");
        break;
    }
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    setInput('');
    addMessage('user', trimmed);
    setLoading(true);

    try {
      if (convState === 'awaiting_details') {
        if (pendingProposal) {
          await generateProposal(pendingProposal, trimmed);
        }
      } else {
        // Use AI to understand user intent
        await handleAIResponse(trimmed);
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
              placeholder={
                convState === 'awaiting_details'
                  ? "Enter timeline and pricing (e.g. 2 weeks, $2,500)..."
                  : "Ask me anything — create proposals, write About Us, generate case studies..."
              }
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
