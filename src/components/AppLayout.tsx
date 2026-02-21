import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import LeftSidebar from './LeftSidebar';
import ChatPanel from './ChatPanel';
import ProposalPanel from './ProposalPanel';
import OnboardingScreen from './OnboardingScreen';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export interface CompanyProfile {
  company_name: string;
  logo_url: string;
  bio: string;
  services: string;
  website: string;
  phone: string;
  address: string;
  case_studies: string;
  stripe_key: string;
  paypal_key: string;
  razorpay_key: string;
}

export interface Proposal {
  id: string;
  title: string;
  client_name: string;
  status: string;
  worth: number;
  created_at: string;
  content?: any;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const defaultProfile: CompanyProfile = {
  company_name: '',
  logo_url: '',
  bio: '',
  services: '',
  website: '',
  phone: '',
  address: '',
  case_studies: '',
  stripe_key: '',
  paypal_key: '',
  razorpay_key: '',
};

export default function AppLayout() {
  const { user, signOut } = useAuth();

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [profile, setProfile] = useState<CompanyProfile>(defaultProfile);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [activeProposalId, setActiveProposalId] = useState<string | null>(null);
  const [proposalPanelOpen, setProposalPanelOpen] = useState(false);
  const [activeProposalData, setActiveProposalData] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! 👋 I'm your AI assistant. I can help you:\n\n• **Create proposals** — just tell me the client and project\n• **Write your About Us** — I'll study your business and craft it\n• **Generate case studies** — based on your services and work\n\nJust tell me what you need!",
      timestamp: new Date(),
    }
  ]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingProposals, setLoadingProposals] = useState(true);

  useEffect(() => {
    if (user) {
      checkOnboarding();
      fetchProposals();
    }
  }, [user]);

  const checkOnboarding = async () => {
    try {
      const { data } = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (!data || !data.company_name) {
        setShowOnboarding(true);
      } else {
        setProfile({
          company_name: data.company_name || '',
          logo_url: data.logo_url || data.avatar_url || '',
          bio: data.bio || '',
          services: data.services || '',
          website: data.website || '',
          phone: data.phone || '',
          address: data.address || '',
          case_studies: data.case_studies || '',
          stripe_key: data.stripe_key || '',
          paypal_key: data.paypal_key || '',
          razorpay_key: data.razorpay_key || '',
        });
      }
    } catch {
      setShowOnboarding(true);
    }
  };

  const fetchProposals = async () => {
    setLoadingProposals(true);
    try {
      const { data } = await (supabase as any)
        .from('proposals')
        .select('id, title, client_name, status, worth, created_at, content')
        .order('created_at', { ascending: false });
      setProposals(data || []);
    } catch {
      // ignore
    } finally {
      setLoadingProposals(false);
    }
  };

  const saveProfile = async (newProfile: CompanyProfile) => {
    if (!user) return;
    try {
      await (supabase as any)
        .from('profiles')
        .upsert({
          user_id: user.id,
          company_name: newProfile.company_name,
          avatar_url: newProfile.logo_url,
          logo_url: newProfile.logo_url,
          bio: newProfile.bio,
          services: newProfile.services,
          website: newProfile.website,
          phone: newProfile.phone,
          address: newProfile.address,
          case_studies: newProfile.case_studies,
          stripe_key: newProfile.stripe_key,
          paypal_key: newProfile.paypal_key,
          razorpay_key: newProfile.razorpay_key,
          email: user.email,
        }, { onConflict: 'user_id' });
      setProfile(newProfile);
      toast({ title: 'Profile saved!' });
    } catch (err) {
      toast({ title: 'Error saving profile', variant: 'destructive' });
    }
  };

  const handleOnboardingComplete = async (data: CompanyProfile) => {
    await saveProfile(data);
    setShowOnboarding(false);
  };

  const openProposal = async (proposalId: string) => {
    const found = proposals.find(p => p.id === proposalId);
    if (found) {
      setActiveProposalData(found);
      setActiveProposalId(proposalId);
      setProposalPanelOpen(true);
    }
  };

  const createNewChat = () => {
    setMessages([{
      id: Date.now().toString(),
      role: 'assistant',
      content: "Hi! 👋 I'm your AI assistant. I can help you:\n\n• **Create proposals** — just tell me the client and project\n• **Write your About Us** — I'll study your business and craft it\n• **Generate case studies** — based on your services and work\n\nJust tell me what you need!",
      timestamp: new Date(),
    }]);
    setActiveProposalId(null);
    setProposalPanelOpen(false);
    setActiveProposalData(null);
    setSidebarOpen(false);
  };

  if (showOnboarding) {
    return (
      <OnboardingScreen
        onComplete={handleOnboardingComplete}
        userEmail={user?.email || ''}
      />
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <LeftSidebar
          proposals={proposals}
          profile={profile}
          loadingProposals={loadingProposals}
          onNewChat={createNewChat}
          onOpenProposal={openProposal}
          onSaveProfile={saveProfile}
          onSignOut={signOut}
          activeProposalId={activeProposalId}
          user={user}
        />
      </div>

      {/* Main Area */}
      <div className="flex flex-col flex-1 min-w-0 h-full">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b bg-card">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <LeftSidebar
                proposals={proposals}
                profile={profile}
                loadingProposals={loadingProposals}
                onNewChat={createNewChat}
                onOpenProposal={openProposal}
                onSaveProfile={saveProfile}
                onSignOut={signOut}
                activeProposalId={activeProposalId}
                user={user}
                mobile
              />
            </SheetContent>
          </Sheet>
          <span className="font-bold text-primary text-sm">Craft Proposal</span>
          <div className="w-9" />
        </div>

        {/* Chat + Proposal panels */}
        <div className="flex flex-1 min-h-0">
          <ChatPanel
            messages={messages}
            setMessages={setMessages}
            profile={profile}
            onProposalCreated={(proposal) => {
              setActiveProposalData(proposal);
              setActiveProposalId(proposal.id || null);
              setProposalPanelOpen(true);
              fetchProposals();
            }}
            proposalPanelOpen={proposalPanelOpen}
            user={user}
          />
          <ProposalPanel
            open={proposalPanelOpen}
            onClose={() => setProposalPanelOpen(false)}
            proposalData={activeProposalData}
            profile={profile}
            onSave={(updated) => {
              setActiveProposalData(updated);
              fetchProposals();
            }}
            user={user}
          />
        </div>
      </div>
    </div>
  );
}
