import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Eye, EyeOff, FileText, ExternalLink, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface ProposalRow {
  id: string;
  title: string;
  client_name: string;
  client_email: string | null;
  status: string;
  worth: number | null;
  view_count: number | null;
  last_viewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export default function ProposalsDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [proposals, setProposals] = useState<ProposalRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchProposals();
  }, [user]);

  const fetchProposals = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from('proposals')
      .select('id, title, client_name, client_email, status, worth, view_count, last_viewed_at, created_at, updated_at')
      .order('created_at', { ascending: false });
    setProposals(data || []);
    setLoading(false);
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'shared': return 'success';
      case 'draft': return 'secondary';
      case 'accepted': return 'default';
      default: return 'outline';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">All Proposals</h1>
            <Badge variant="outline" className="ml-2">{proposals.length}</Badge>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6">
        {loading ? (
          <div className="text-center py-16 text-muted-foreground">Loading proposals...</div>
        ) : proposals.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">No proposals yet. Go back and create one!</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {/* Table header */}
            <div className="hidden md:grid grid-cols-[2fr_1.5fr_100px_100px_140px_140px] gap-4 px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <span>Proposal</span>
              <span>Client</span>
              <span>Status</span>
              <span>Value</span>
              <span>Client Viewed</span>
              <span>Created</span>
            </div>

            {proposals.map((p) => (
              <div
                key={p.id}
                onClick={() => navigate(`/proposal/${p.id}`)}
                className="grid md:grid-cols-[2fr_1.5fr_100px_100px_140px_140px] gap-4 items-center px-4 py-3.5 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors"
              >
                {/* Title */}
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-4 w-4 shrink-0 text-primary" />
                  <span className="font-medium text-sm truncate text-foreground">{p.title || 'Untitled'}</span>
                </div>

                {/* Client */}
                <div className="min-w-0">
                  <p className="text-sm truncate text-foreground">{p.client_name || '—'}</p>
                  {p.client_email && (
                    <p className="text-xs truncate text-muted-foreground">{p.client_email}</p>
                  )}
                </div>

                {/* Status */}
                <div>
                  <Badge variant={statusColor(p.status) as any} className="text-xs capitalize">
                    {p.status}
                  </Badge>
                </div>

                {/* Value */}
                <div className="text-sm font-medium text-foreground">
                  {p.worth ? `$${Number(p.worth).toLocaleString()}` : '—'}
                </div>

                {/* Client Viewed */}
                <div className="flex items-center gap-1.5">
                  {p.view_count && p.view_count > 0 ? (
                    <>
                      <Eye className="h-3.5 w-3.5 text-primary" />
                      <div>
                        <span className="text-xs font-medium text-primary">{p.view_count} view{p.view_count > 1 ? 's' : ''}</span>
                        {p.last_viewed_at && (
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(p.last_viewed_at), 'MMM d, h:mm a')}
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-3.5 w-3.5 text-muted-foreground/50" />
                      <span className="text-xs text-muted-foreground">Not viewed</span>
                    </>
                  )}
                </div>

                {/* Created */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {format(new Date(p.created_at), 'MMM d, yyyy')}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
