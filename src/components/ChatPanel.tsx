import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Loader2 } from 'lucide-react';
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
  proposalPanelOpen: boolean;
  user: SupabaseUser | null;
}

type ConversationState =
  | 'idle'
  | 'awaiting_timeline'
  | 'awaiting_pricing'
  | 'generating';

interface ExtractedProposalInfo {
  clientName: string;
  projectType: string;
  rawMessage: string;
}

function detectProposalRequest(msg: string): ExtractedProposalInfo | null {
  const lower = msg.toLowerCase();
  
  // Check for proposal-like words (handles typos like "proosal", "proposl", "propasal")
  const hasProposalIntent = /prop\w*s\w*l|proposal/i.test(lower) || 
    lower.includes('proposal') || lower.includes('proosal') || lower.includes('proposl') || lower.includes('propasal');
  
  if (!hasProposalIntent) return null;

  const patterns = [
    /(?:create|make|write|draft|generate|build|prepare)?\s*(?:a\s+)?(?:prop\w*s?\w*l?)\s+for\s+([a-zA-Z\s]+?)\s+(?:for|about|on|regarding)\s+(.+)$/i,
    /(?:prop\w*s?\w*l?)\s+for\s+([a-zA-Z\s]+?)\s+(?:for|about|on|regarding)\s+(.+)$/i,
    /(?:prop\w*s?\w*l?)\s+for\s+([a-zA-Z\s]+?)$/i,
  ];

  for (const pat of patterns) {
    const match = msg.match(pat);
    if (match) {
      return {
        clientName: match[1]?.trim() || 'Client',
        projectType: match[2]?.trim() || 'project',
        rawMessage: msg,
      };
    }
  }

  // Fallback: detected proposal intent but couldn't parse details
  return {
    clientName: 'Client',
    projectType: 'project',
    rawMessage: msg,
  };
}

function renderMarkdown(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>');
}

export default function ChatPanel({
  messages, setMessages, profile, onProposalCreated, proposalPanelOpen, user
}: Props) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [convState, setConvState] = useState<ConversationState>('idle');
  const [pendingProposal, setPendingProposal] = useState<ExtractedProposalInfo | null>(null);
  const [pendingTimeline, setPendingTimeline] = useState('');
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

  const generateProposal = async (info: ExtractedProposalInfo, timeline: string, pricing: string) => {
    if (!user) return;
    setConvState('generating');
    addMessage('assistant', '✨ Generating your proposal now... This will just take a moment!');

    try {
      const { data, error } = await supabase.functions.invoke('generate-proposal-content', {
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

      // Save proposal to DB
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

      addMessage('assistant', `🎉 Your proposal is ready! I've created a **${info.projectType}** proposal for **${info.clientName}** worth **${pricing}**. The proposal panel is now open on the right — you can edit any section directly.`);

      onProposalCreated(savedProposal);
      setConvState('idle');
      setPendingProposal(null);
      setPendingTimeline('');
    } catch (err: any) {
      console.error('Error generating proposal:', err);
      addMessage('assistant', `Sorry, I had trouble generating the proposal. Please try again!`);
      setConvState('idle');
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
      if (convState === 'idle') {
        const info = detectProposalRequest(trimmed);
        if (info) {
          setPendingProposal(info);
          setConvState('awaiting_timeline');
          addMessage('assistant', `Great! I'll create a proposal for **${info.clientName}** for **${info.projectType}**.\n\nFirst, what's the **timeline** for this project? *(e.g., "2 weeks", "1 month", "3 phases over 6 weeks")*`);
        } else {
          // General chat
          addMessage('assistant', `I can help you create professional proposals! Just tell me something like *"proposal for Sarah for logo design"* and I'll guide you through it step by step. 😊`);
        }
      } else if (convState === 'awaiting_timeline') {
        setPendingTimeline(trimmed);
        setConvState('awaiting_pricing');
        addMessage('assistant', `Got it — **${trimmed}** timeline. \n\nNow, what's the **pricing** for this project? *(e.g., "$2,500", "€5,000", "₹50,000")*`);
      } else if (convState === 'awaiting_pricing') {
        if (pendingProposal) {
          await generateProposal(pendingProposal, pendingTimeline, trimmed);
        }
      }
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
                convState === 'awaiting_timeline'
                  ? "Enter project timeline (e.g. 2 weeks, 1 month)..."
                  : convState === 'awaiting_pricing'
                  ? "Enter pricing (e.g. $2,500, €5,000)..."
                  : "Say something like 'proposal for John for web design'..."
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
