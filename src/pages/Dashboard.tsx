import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, FileText, Settings, LogOut, Eye, DollarSign, TrendingUp, Users, User, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';
const logo = '/lovable-uploads/22b8b905-b997-42da-85df-b966b4616f6e.png';

interface Proposal {
  id: string;
  title: string;
  client_name: string;
  status: string;
  created_at: string;
  updated_at: string;
  allSignaturesSigned?: boolean;
}

interface Profile {
  company_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  email: string | null;
}

export default function Dashboard() {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [filteredProposals, setFilteredProposals] = useState<Proposal[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);


  useEffect(() => {
    if (user) {
      fetchProposals();
      fetchProfile();
    }
  }, [user]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = proposals.filter(proposal => 
        proposal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        proposal.client_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProposals(filtered);
    } else {
      setFilteredProposals(proposals);
    }
  }, [searchQuery, proposals]);

  const fetchProposals = async () => {
    try {
      const { data, error } = await supabase
        .from('proposals')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      // Check signature status for each proposal
      const proposalsWithSignatures = await Promise.all(
        (data || []).map(async (proposal) => {
          const { data: signatures } = await supabase
            .from('proposal_signatures')
            .select('status')
            .eq('proposal_id', proposal.id);
          
          const allSignaturesSigned = 
            signatures && 
            signatures.length > 0 && 
            signatures.every(sig => sig.status === 'signed');
          
          return { ...proposal, allSignaturesSigned };
        })
      );
      
      setProposals(proposalsWithSignatures);
    } catch (error) {
      console.error('Error fetching proposals:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('company_name, display_name, avatar_url, email')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const getStatusStyle = (status: string) => {
    const s = (status || '').toString().trim().toLowerCase();
    if (s === 'draft') return { backgroundColor: '#000000', color: '#ffffff' };
    if (s === 'shared' || s === 'signed') return { backgroundColor: '#22c55e', color: '#000000' };
    return { backgroundColor: '#e5e7eb', color: '#000000' };
  };

  const getDisplayStatus = (proposal: Proposal) => {
    if (proposal.allSignaturesSigned) {
      return 'signed';
    }
    return proposal.status;
  };

  const handleCreateProposal = async () => {
    navigate('/create-proposal');
  };
  const handleSignOut = async () => {
    await signOut();
    // Don't navigate immediately - let the auth state change handle the redirect
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <img src={logo} alt="ProposalKraft" className="h-12 mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img src={logo} alt="ProposalKraft" className="h-8" />
              <h1 className="text-xl font-bold text-primary">ProposalKraft</h1>
            </div>
             <div className="flex items-center space-x-3">
               <Button onClick={handleCreateProposal} size="sm">
                 <Plus className="h-4 w-4 mr-2" />
                 New Proposal
               </Button>
               <DropdownMenu>
                 <DropdownMenuTrigger asChild>
                   <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                     <User className="h-4 w-4" />
                     <span className="text-sm max-w-32 truncate">
                       {profile?.company_name || user.email}
                     </span>
                   </Button>
                 </DropdownMenuTrigger>
                 <DropdownMenuContent align="end" className="w-56">
                   <DropdownMenuLabel>
                     <div className="flex flex-col">
                       <span>My Account</span>
                       <span className="text-xs font-normal text-muted-foreground truncate">
                         {user.email}
                       </span>
                     </div>
                   </DropdownMenuLabel>
                   <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/settings')}>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                   <DropdownMenuItem onClick={handleSignOut}>
                     <LogOut className="mr-2 h-4 w-4" />
                     Sign Out
                   </DropdownMenuItem>
                 </DropdownMenuContent>
               </DropdownMenu>
             </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Your Proposals</h2>
            <p className="text-muted-foreground mt-2">
              Create and manage professional business proposals
            </p>
          </div>
          <Button onClick={handleCreateProposal} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Create Proposal
          </Button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <Input
            type="text"
            placeholder="Search proposals by title or client name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>

        {loadingData ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-3 bg-muted rounded w-full mb-2"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : proposals.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No proposals yet</h3>
              <p className="text-muted-foreground text-center max-w-sm mb-6">
                Get started by creating your first proposal. Choose from our professional templates.
              </p>
              <Button onClick={handleCreateProposal}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Proposal
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProposals.map((proposal) => (
              <Card key={proposal.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate(`/proposal/${proposal.id}`)}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg line-clamp-1">{proposal.title}</CardTitle>
                    <span 
                      className="inline-flex items-center rounded-full border-transparent px-2.5 py-0.5 text-xs font-semibold"
                      style={getStatusStyle(getDisplayStatus(proposal))}
                    >
                      {getDisplayStatus(proposal)}
                    </span>
                  </div>
                  <CardDescription>Client: {proposal.client_name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <p>Created: {new Date(proposal.created_at).toLocaleDateString()}</p>
                    <p>Updated: {new Date(proposal.updated_at).toLocaleDateString()}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}