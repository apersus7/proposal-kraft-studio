import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Plus, FileText, Building2, Plug2, LogOut, ChevronDown, ChevronRight,
  CreditCard, PanelLeftClose, PanelLeft, ChevronRight as Arrow
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CompanyProfile, Proposal } from './AppLayout';
import { User } from '@supabase/supabase-js';
import { cn } from '@/lib/utils';

interface Props {
  proposals: Proposal[];
  profile: CompanyProfile;
  loadingProposals: boolean;
  onNewChat: () => void;
  onOpenProposal: (id: string) => void;
  onSaveProfile: (p: CompanyProfile) => Promise<void>;
  onSignOut: () => void;
  activeProposalId: string | null;
  user: User | null;
  mobile?: boolean;
}

export default function LeftSidebar({
  proposals, profile, loadingProposals, onNewChat, onOpenProposal,
  onSignOut, activeProposalId, user, mobile
}: Props) {
  const navigate = useNavigate();
  const [proposalsOpen, setProposalsOpen] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  // Collapsed mini sidebar
  if (collapsed && !mobile) {
    return (
      <div className="flex flex-col h-full border-r bg-sidebar w-12 items-center py-3 gap-2 transition-all duration-300">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={() => setCollapsed(false)}
          title="Expand sidebar"
        >
          <PanelLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 bg-primary/20 text-primary hover:bg-primary/30"
          onClick={onNewChat}
          title="New Chat"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Separator className="bg-sidebar-border w-6" />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={() => navigate('/company-profile')}
          title="Company Profile"
        >
          <Building2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={() => navigate('/integrations')}
          title="Integrations"
        >
          <CreditCard className="h-4 w-4" />
        </Button>
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={onSignOut}
          title="Sign out"
        >
          <LogOut className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex flex-col h-full border-r bg-sidebar transition-all duration-300",
      mobile ? "w-72" : "w-64"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <img src="/lovable-uploads/22b8b905-b997-42da-85df-b966b4616f6e.png" alt="Craft Proposal" className="w-7 h-7 rounded-lg shrink-0 object-contain" />
          <span className="font-bold text-sm text-sidebar-foreground">Craft Proposal</span>
        </div>
        {!mobile && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={() => setCollapsed(true)}
            title="Collapse sidebar"
          >
            <PanelLeftClose className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* New Chat */}
      <div className="px-3 py-3">
        <Button
          onClick={onNewChat}
          className="w-full justify-start gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm h-9"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3 scrollbar-thin">
        {/* Proposals */}
        <div className="mb-2">
          <div className="flex items-center justify-between w-full px-2 py-1.5">
            <button
              onClick={() => setProposalsOpen(p => !p)}
              className="flex items-center gap-1 text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider hover:text-sidebar-foreground transition-colors"
            >
              <span>Proposals</span>
              {proposalsOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </button>
            <button
              onClick={() => navigate('/proposals')}
              className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
            >
              View All
            </button>
          </div>
          {proposalsOpen && (
            <div className="mt-1 space-y-0.5">
              {loadingProposals ? (
                <div className="px-2 py-2 text-xs text-sidebar-foreground/50">Loading...</div>
              ) : proposals.length === 0 ? (
                <div className="px-2 py-2 text-xs text-sidebar-foreground/50">No proposals yet</div>
              ) : (
                proposals.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onOpenProposal(p.id)}
                    className={cn(
                      "w-full text-left px-2 py-2 rounded-md text-sm transition-colors",
                      activeProposalId === p.id
                        ? "bg-primary/20 text-primary"
                        : "hover:bg-sidebar-accent text-sidebar-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-3.5 w-3.5 shrink-0 text-sidebar-foreground/40" />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium">{p.title || 'Untitled'}</p>
                        <p className="truncate text-xs text-sidebar-foreground/50">{p.client_name}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <Separator className="my-2 bg-sidebar-border" />

        {/* Company Profile nav link */}
        <button
          onClick={() => navigate('/company-profile')}
          className="flex items-center justify-between w-full px-2 py-2.5 rounded-md text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5" />
            Company Profile
          </span>
          <Arrow className="h-3 w-3" />
        </button>

        <Separator className="my-2 bg-sidebar-border" />

        {/* Integrations nav link */}
        <button
          onClick={() => navigate('/integrations')}
          className="flex items-center justify-between w-full px-2 py-2.5 rounded-md text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Plug2 className="h-3.5 w-3.5" />
            Integrations
          </span>
          <Arrow className="h-3 w-3" />
        </button>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-3 py-3">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium text-sidebar-foreground truncate">
              {profile.company_name || user?.email?.split('@')[0] || 'Account'}
            </p>
            <p className="text-xs text-sidebar-foreground/50 truncate">{user?.email}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-sidebar-foreground hover:bg-sidebar-accent" onClick={onSignOut}>
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
