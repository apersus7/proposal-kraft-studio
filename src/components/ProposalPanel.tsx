import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  X, ChevronDown, ChevronUp,
  Building2, CreditCard, FileText, Clock, DollarSign, BookOpen,
  ArrowRight, ExternalLink, Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CompanyProfile } from './AppLayout';
import { User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();

  if (!open || !proposalData) return null;

  const getFieldValue = (field: string): string => {
    const content = proposalData?.content || {};
    if (field === 'about') return content.company_bio || profile.bio || '';
    if (field === 'case_studies') return content.case_studies || profile.case_studies || '';
    return content[field] || '';
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
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => navigate(`/proposal/${proposalData.id}`)}
          >
            <ExternalLink className="h-3 w-3" /> View Full Proposal
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

      {/* Sections (read-only preview) */}
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
                    <div className="pt-2">
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                        {value || `No ${section.label.toLowerCase()} content yet.`}
                      </p>
                    </div>
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
