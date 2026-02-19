import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Plus, FileText, Building2, Plug2, LogOut, ChevronDown, ChevronRight,
  Sun, Moon, Upload, Save, Key, CreditCard
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { CompanyProfile, Proposal } from './AppLayout';
import { User } from '@supabase/supabase-js';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

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

type Section = 'proposals' | 'profile' | 'integrations';

export default function LeftSidebar({
  proposals, profile, loadingProposals, onNewChat, onOpenProposal,
  onSaveProfile, onSignOut, activeProposalId, user, mobile
}: Props) {
  const { theme, setTheme } = useTheme();
  const [openSection, setOpenSection] = useState<Section>('proposals');
  const [editProfile, setEditProfile] = useState<CompanyProfile>(profile);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    setEditProfile(profile);
  }, [profile]);

  const toggle = (s: Section) => setOpenSection(prev => prev === s ? 'proposals' : s);

  const handleSave = async () => {
    setSaving(true);
    await onSaveProfile(editProfile);
    setSaving(false);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setEditProfile(prev => ({ ...prev, logo_url: ev.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className={cn(
      "flex flex-col h-full border-r bg-sidebar",
      mobile ? "w-72" : "w-64"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <FileText className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-sm text-sidebar-foreground">ProposalKraft</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
        </Button>
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
          <button
            onClick={() => toggle('proposals')}
            className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors rounded"
          >
            <span>Proposals</span>
            {openSection === 'proposals' ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>
          {openSection === 'proposals' && (
            <div className="mt-1 space-y-0.5">
              {loadingProposals ? (
                <div className="px-2 py-2 text-xs text-muted-foreground">Loading...</div>
              ) : proposals.length === 0 ? (
                <div className="px-2 py-2 text-xs text-muted-foreground">No proposals yet</div>
              ) : (
                proposals.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onOpenProposal(p.id)}
                    className={cn(
                      "w-full text-left px-2 py-2 rounded-md text-sm transition-colors group",
                      activeProposalId === p.id
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-sidebar-accent text-sidebar-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium">{p.title || 'Untitled'}</p>
                        <p className="truncate text-xs text-muted-foreground">{p.client_name}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <Separator className="my-2" />

        {/* Company Profile */}
        <div className="mb-2">
          <button
            onClick={() => toggle('profile')}
            className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors rounded"
          >
            <span className="flex items-center gap-1.5"><Building2 className="h-3 w-3" />Company Profile</span>
            {openSection === 'profile' ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>
          {openSection === 'profile' && (
            <div className="mt-2 space-y-3 px-1">
              {/* Logo */}
              <div className="flex items-center gap-3">
                {editProfile.logo_url ? (
                  <img src={editProfile.logo_url} alt="Logo" className="h-10 w-10 rounded-lg object-cover border" />
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  <span className="text-xs text-primary hover:underline flex items-center gap-1">
                    <Upload className="h-3 w-3" /> Upload Logo
                  </span>
                </label>
              </div>
              <div>
                <Label className="text-xs">Company Name</Label>
                <Input
                  value={editProfile.company_name}
                  onChange={e => setEditProfile(p => ({ ...p, company_name: e.target.value }))}
                  placeholder="Acme Inc."
                  className="h-7 text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Bio / Tagline</Label>
                <Textarea
                  value={editProfile.bio}
                  onChange={e => setEditProfile(p => ({ ...p, bio: e.target.value }))}
                  placeholder="We build amazing digital products..."
                  className="text-xs mt-1 min-h-[60px] resize-none"
                />
              </div>
              <div>
                <Label className="text-xs">Services</Label>
                <Input
                  value={editProfile.services}
                  onChange={e => setEditProfile(p => ({ ...p, services: e.target.value }))}
                  placeholder="Web Design, SEO, Branding..."
                  className="h-7 text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Website</Label>
                <Input
                  value={editProfile.website}
                  onChange={e => setEditProfile(p => ({ ...p, website: e.target.value }))}
                  placeholder="https://yoursite.com"
                  className="h-7 text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Case Studies / Portfolio</Label>
                <Textarea
                  value={editProfile.case_studies}
                  onChange={e => setEditProfile(p => ({ ...p, case_studies: e.target.value }))}
                  placeholder="Redesigned ACME's site, increasing conversions by 40%..."
                  className="text-xs mt-1 min-h-[60px] resize-none"
                />
              </div>
              <Button size="sm" className="w-full h-7 text-xs" onClick={handleSave} disabled={saving}>
                <Save className="h-3 w-3 mr-1" />
                {saving ? 'Saving...' : 'Save Profile'}
              </Button>
            </div>
          )}
        </div>

        <Separator className="my-2" />

        {/* Integrations */}
        <div className="mb-2">
          <button
            onClick={() => toggle('integrations')}
            className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors rounded"
          >
            <span className="flex items-center gap-1.5"><Plug2 className="h-3 w-3" />Integrations</span>
            {openSection === 'integrations' ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>
          {openSection === 'integrations' && (
            <div className="mt-2 space-y-3 px-1">
              {/* Stripe */}
              <div className="p-2.5 rounded-lg border bg-card space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-[#635BFF] flex items-center justify-center">
                    <CreditCard className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-xs font-semibold">Stripe</span>
                </div>
                <div>
                  <Label className="text-xs">Publishable Key</Label>
                  <Input
                    value={editProfile.stripe_key}
                    onChange={e => setEditProfile(p => ({ ...p, stripe_key: e.target.value }))}
                    placeholder="pk_live_..."
                    className="h-7 text-xs mt-1 font-mono"
                    type="password"
                  />
                </div>
              </div>

              {/* PayPal */}
              <div className="p-2.5 rounded-lg border bg-card space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-[#003087] flex items-center justify-center">
                    <span className="text-white text-[8px] font-bold">PP</span>
                  </div>
                  <span className="text-xs font-semibold">PayPal</span>
                </div>
                <div>
                  <Label className="text-xs">Client ID</Label>
                  <Input
                    value={editProfile.paypal_key}
                    onChange={e => setEditProfile(p => ({ ...p, paypal_key: e.target.value }))}
                    placeholder="AX..."
                    className="h-7 text-xs mt-1 font-mono"
                    type="password"
                  />
                </div>
              </div>

              {/* Razorpay */}
              <div className="p-2.5 rounded-lg border bg-card space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-[#072654] flex items-center justify-center">
                    <Key className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-xs font-semibold">Razorpay</span>
                </div>
                <div>
                  <Label className="text-xs">Key ID</Label>
                  <Input
                    value={editProfile.razorpay_key}
                    onChange={e => setEditProfile(p => ({ ...p, razorpay_key: e.target.value }))}
                    placeholder="rzp_live_..."
                    className="h-7 text-xs mt-1 font-mono"
                    type="password"
                  />
                </div>
              </div>

              <Button size="sm" className="w-full h-7 text-xs" onClick={handleSave} disabled={saving}>
                <Save className="h-3 w-3 mr-1" />
                {saving ? 'Saving...' : 'Save Keys'}
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-3 py-3">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium text-sidebar-foreground truncate">
              {profile.company_name || user?.email?.split('@')[0] || 'Account'}
            </p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onSignOut}>
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
