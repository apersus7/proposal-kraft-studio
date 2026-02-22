import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  X, Download, Link2, ChevronDown, ChevronUp, Edit3, Check,
  Building2, CreditCard, FileText, Clock, DollarSign, BookOpen,
  ArrowRight, Save
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CompanyProfile } from './AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { User } from '@supabase/supabase-js';

interface Props {
  open: boolean;
  onClose: () => void;
  proposalData: any;
  profile: CompanyProfile;
  onSave: (updated: any) => void;
  user: User | null;
}

interface Section {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  field: string;
}

const SECTIONS: Section[] = [
  { id: 'cover', label: 'Cover', icon: FileText, field: 'cover_content' },
  { id: 'summary', label: 'Executive Summary', icon: BookOpen, field: 'summary' },
  { id: 'deliverables', label: 'Deliverables', icon: Check, field: 'deliverables' },
  { id: 'timeline', label: 'Timeline', icon: Clock, field: 'timeline' },
  { id: 'pricing', label: 'Pricing', icon: DollarSign, field: 'pricing' },
  { id: 'payment_terms', label: 'Payment Terms', icon: CreditCard, field: 'payment_terms' },
  { id: 'about', label: 'About Us', icon: Building2, field: 'about' },
  { id: 'next_steps', label: 'Next Steps', icon: ArrowRight, field: 'next_steps' },
];

export default function ProposalPanel({ open, onClose, proposalData, profile, onSave, user }: Props) {
  const [expandedSection, setExpandedSection] = useState<string>('summary');
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  if (!open || !proposalData) return null;

  const getFieldValue = (field: string): string => {
    if (editValues[field] !== undefined) return editValues[field];
    const content = proposalData?.content || {};
    if (field === 'about') return content.company_bio || profile.bio || '';
    if (field === 'case_studies') return content.case_studies || profile.case_studies || '';
    return content[field] || '';
  };

  const setFieldValue = (field: string, value: string) => {
    setEditValues(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!user || !proposalData?.id) return;
    setSaving(true);
    try {
      const updatedContent = {
        ...proposalData.content,
        ...Object.fromEntries(
          Object.entries(editValues).map(([k, v]) => [k, v])
        ),
      };

      const { data, error } = await (supabase as any)
        .from('proposals')
        .update({ content: updatedContent })
        .eq('id', proposalData.id)
        .select()
        .single();

      if (error) throw error;
      onSave(data);
      toast({ title: 'Proposal saved!' });
    } catch {
      toast({ title: 'Error saving', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const getPublicBaseUrl = () => {
    const host = window.location.hostname;
    if (host === 'www.craftproposal.com' || host === 'craftproposal.com') {
      return window.location.origin;
    }
    return 'https://www.craftproposal.com';
  };

  const generateShortToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const arr = new Uint8Array(8);
    crypto.getRandomValues(arr);
    return Array.from(arr, b => chars[b % chars.length]).join('');
  };

  const handleExportLink = async () => {
    if (!user || !proposalData?.id) return;
    try {
      // Fetch proposal content for snapshot
      const { data: pData, error: pErr } = await (supabase as any)
        .from('proposals')
        .select('title, client_name, client_email, content, worth, created_at, status')
        .eq('id', proposalData.id)
        .single();
      if (pErr) throw pErr;

      const snapshot: any = {
        ...(typeof pData.content === 'object' && pData.content !== null ? pData.content : {}),
        title: pData.title,
        client_name: pData.client_name,
        client_email: pData.client_email,
        worth: pData.worth,
        created_at: pData.created_at,
        status: pData.status,
      };

      const { data, error } = await (supabase as any)
        .from('secure_proposal_shares')
        .insert({
          proposal_id: proposalData.id,
          share_token: generateShortToken(),
          created_by: user.id,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          content_snapshot: snapshot,
          permissions: JSON.stringify({ allowComments: true, trackViews: true }),
        })
        .select()
        .single();

      if (error) throw error;

      const shareUrl = `${getPublicBaseUrl()}/p/${data.share_token}`;
      await navigator.clipboard.writeText(shareUrl);
      toast({ title: 'Share link copied!', description: shareUrl });
    } catch {
      toast({ title: 'Error generating link', variant: 'destructive' });
    }
  };

  const handleExportPDF = async () => {
    if (!user || !proposalData?.id) return;
    try {
      // Check for existing share token or create one
      const { data: existing } = await (supabase as any)
        .from('secure_proposal_shares')
        .select('share_token')
        .eq('proposal_id', proposalData.id)
        .order('created_at', { ascending: false })
        .limit(1);

      let token = existing?.[0]?.share_token;

      if (!token) {
        const { data: pData } = await (supabase as any)
          .from('proposals')
          .select('title, client_name, client_email, content, worth, created_at, status')
          .eq('id', proposalData.id)
          .single();

        const snapshot: any = {
          ...(typeof pData.content === 'object' && pData.content !== null ? pData.content : {}),
          title: pData.title, client_name: pData.client_name, client_email: pData.client_email,
          worth: pData.worth, created_at: pData.created_at, status: pData.status,
        };

        const { data } = await (supabase as any)
          .from('secure_proposal_shares')
          .insert({
            proposal_id: proposalData.id,
            share_token: generateShortToken(),
            created_by: user.id,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            content_snapshot: snapshot,
            permissions: JSON.stringify({ allowComments: true, trackViews: true }),
          })
          .select()
          .single();
        token = data?.share_token;
      }

      if (token) {
        window.open(`/p/${token}`, '_blank');
      }
    } catch {
      toast({ title: 'Error opening PDF view', variant: 'destructive' });
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full border-l bg-panel-bg transition-all duration-300 ease-in-out overflow-hidden",
        open ? "w-full md:w-[480px] xl:w-[560px]" : "w-0"
      )}
      style={{ background: 'hsl(var(--card))' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-card shrink-0">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold truncate">
            {proposalData?.title || 'Proposal'}
          </h2>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant="outline" className="text-xs h-4 px-1.5">
              {proposalData?.status || 'draft'}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {proposalData?.client_name}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={handleExportLink}>
            <Link2 className="h-3 w-3" /> Share
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={handleExportPDF}>
            <Download className="h-3 w-3" /> PDF
          </Button>
          <Button size="sm" className="h-7 text-xs gap-1" onClick={handleSave} disabled={saving}>
            <Save className="h-3 w-3" /> {saving ? '...' : 'Save'}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Cover Preview */}
      <div
        className="mx-3 mt-3 rounded-xl p-4 text-white shrink-0"
        style={{ background: 'linear-gradient(135deg, hsl(151,100%,37%), hsl(151,80%,25%))' }}
      >
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            {profile.logo_url && (
              <img src={profile.logo_url} alt="Logo" className="h-8 mb-2 rounded" />
            )}
            <h3 className="font-bold text-base leading-tight">{proposalData?.title}</h3>
            <p className="text-sm opacity-80 mt-0.5">Prepared for {proposalData?.client_name}</p>
          </div>
          <div className="text-right shrink-0 ml-3">
            <p className="text-xl font-bold">${Number(proposalData?.worth || 0).toLocaleString()}</p>
            <p className="text-xs opacity-70">Project Value</p>
          </div>
        </div>
        <p className="text-xs opacity-70 mt-2">{profile.company_name || 'Your Company'}</p>
      </div>

      {/* Payment Button Placeholder */}
      {(profile.stripe_key || profile.paypal_key || profile.razorpay_key) && (
        <div className="mx-3 mt-2 shrink-0">
          <button
            className="w-full py-2 rounded-lg border-2 border-dashed border-primary/30 text-primary text-xs font-medium hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
            onClick={() => toast({ title: 'Payment integration coming soon!', description: 'Your payment keys are saved. Payment buttons will be included in the shared proposal.' })}
          >
            <CreditCard className="h-3.5 w-3.5" />
            Add Payment Button to Proposal
          </button>
        </div>
      )}

      {/* Sections */}
      <ScrollArea className="flex-1 px-3 py-2 scrollbar-thin">
        <div className="space-y-2 pb-4">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            const isExpanded = expandedSection === section.id;
            const value = getFieldValue(section.field);

            return (
              <div key={section.id} className="rounded-xl border bg-background overflow-hidden">
                <button
                  onClick={() => setExpandedSection(isExpanded ? '' : section.id)}
                  className="flex items-center justify-between w-full px-3 py-2.5 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                    <span className="text-sm font-medium">{section.label}</span>
                  </div>
                  {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                </button>

                {isExpanded && (
                  <div className="px-3 pb-3 border-t bg-card/50">
                    {section.id === 'cover' ? (
                      <div className="pt-2 space-y-2">
                        <div>
                          <Label className="text-xs">Proposal Title</Label>
                          <Input
                            value={getFieldValue('title') || proposalData?.title || ''}
                            onChange={e => setFieldValue('title', e.target.value)}
                            className="h-7 text-xs mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Tagline / Subtitle</Label>
                          <Input
                            value={getFieldValue('tagline')}
                            onChange={e => setFieldValue('tagline', e.target.value)}
                            placeholder="Transforming your vision into reality..."
                            className="h-7 text-xs mt-1"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="pt-2">
                        <div className="flex items-center justify-between mb-1">
                          <Label className="text-xs">{section.label} Content</Label>
                          <Edit3 className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <Textarea
                          value={value}
                          onChange={e => setFieldValue(section.field, e.target.value)}
                          placeholder={`Enter ${section.label.toLowerCase()} content...`}
                          className="text-xs min-h-[100px] resize-none"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
