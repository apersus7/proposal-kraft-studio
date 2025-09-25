import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Eye, DollarSign, User, Search, FileText, Zap, Shield, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Footer from '@/components/Footer';

const logo = '/lovable-uploads/22b8b905-b997-42da-85df-b966b4616f6e.png';

interface Proposal {
  id: string;
  title: string;
  client_name: string;
  status: string;
  worth: number;
  view_count: number;
  last_viewed_at: string | null;
  payment_status: string;
  created_at: string;
  updated_at: string;
}

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [filteredProposals, setFilteredProposals] = useState<Proposal[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingProposals, setLoadingProposals] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProposals();
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
    setLoadingProposals(true);
    try {
      const { data, error } = await supabase
        .from('proposals')
        .select('*')
        .order('updated_at', { ascending: false });

      const normalized = (data || []).map((p: any) => ({
        ...p,
        worth: (p?.worth ?? Number(p?.content?.pricing)) || 0,
      }));
      setProposals(normalized);
    } catch (error) {
      console.error('Error fetching proposals:', error);
    } finally {
      setLoadingProposals(false);
    }
  };

  const getStatusBadge = (proposal: Proposal) => {
    if (proposal.payment_status === 'paid') {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Payment Done</Badge>;
    }
    
    if (proposal.status === 'sent' && proposal.view_count > 0) {
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Opened</Badge>;
    }
    
    if (proposal.status === 'sent') {
      return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Sent</Badge>;
    }
    
    if (proposal.status === 'draft') {
      return <Badge variant="secondary">Draft</Badge>;
    }
    
    if (proposal.status === 'accepted') {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Accepted</Badge>;
    }
    
    return <Badge variant="outline">{proposal.status}</Badge>;
  };

  // If user is authenticated, show proposals dashboard
  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
        {/* Header */}
        <header className="border-b bg-card/80 backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <img src={logo} alt="ProposalKraft" className="h-8" />
                <h1 className="text-xl font-bold text-primary">ProposalKraft</h1>
              </div>
              <div className="flex items-center space-x-4">
                <Button variant="outline" onClick={() => navigate('/settings')}>
                  Settings
                </Button>
                <Button onClick={() => navigate('/create-proposal')}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Proposal
                </Button>
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
                Manage and track your business proposals
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6 flex items-center space-x-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search proposals by title or client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loadingProposals ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="pb-3">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-muted rounded w-full"></div>
                      <div className="h-3 bg-muted rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredProposals.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Plus className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No proposals yet</h3>
                <p className="text-muted-foreground text-center max-w-sm mb-6">
                  Get started by creating your first proposal. Choose from our professional templates.
                </p>
                <Button onClick={() => navigate('/create-proposal')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Proposal
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredProposals.map((proposal) => (
                <Card 
                  key={proposal.id} 
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]" 
                  onClick={() => navigate(`/proposal/${proposal.id}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg line-clamp-2 flex-1 mr-2">
                        {proposal.title}
                      </CardTitle>
                      {getStatusBadge(proposal)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Worth */}
                    <div className="flex items-center space-x-2 text-lg font-semibold">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      <span className="text-green-600">
                        {(proposal.worth ?? 0).toLocaleString()}
                      </span>
                    </div>
                    
                    {/* Client Name */}
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground font-medium">
                        {proposal.client_name}
                      </span>
                    </div>
                    
                    {/* View Stats */}
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Eye className="h-4 w-4" />
                        <span>{proposal.view_count || 0} views</span>
                      </div>
                      <span>
                        {new Date(proposal.updated_at).toLocaleDateString()}
                      </span>
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

  // If user is not authenticated, show landing page
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-3">
              <img src={logo} alt="ProposalKraft" className="h-8" />
              <span className="text-xl font-bold text-primary">ProposalKraft</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link to="/features">
                <Button variant="ghost">Features</Button>
              </Link>
              <Link to="/pricing">
                <Button variant="ghost">Pricing</Button>
              </Link>
              <Link to="/solutions">
                <Button variant="ghost">Solutions</Button>
              </Link>
              <Button variant="ghost" onClick={() => navigate('/auth')}>
                Sign In
              </Button>
              <Button onClick={() => navigate('/auth')}>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <img src={logo} alt="ProposalKraft" className="h-20 mx-auto mb-6" />
          </div>
          <h1 className="text-4xl lg:text-6xl font-bold tracking-tight mb-6">
            Craft Professional
            <span className="text-primary block">Business Proposals</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
            Create stunning, professional proposals that win clients. Choose from beautiful templates, 
            customize with your branding, and send proposals that make an impact.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/auth')} className="text-lg px-8 py-3">
              Start Creating Free
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-3">
              View Templates
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Everything You Need</h2>
            <p className="text-xl text-muted-foreground">
              Professional proposal creation made simple
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card>
              <CardHeader className="text-center">
                <FileText className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Beautiful Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Choose from professional templates designed to impress clients and win business.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Quick Creation</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Create proposals in minutes, not hours. Our streamlined process gets you results fast.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Custom Branding</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Add your logo, colors, and branding to make every proposal uniquely yours.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Client Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Keep track of all your proposals and client communications in one place.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            Ready to Create Your First Proposal?
          </h2>
          <p className="text-xl text-muted-foreground mb-10">
            Join thousands of businesses creating winning proposals with ProposalKraft.
          </p>
          <Button size="lg" onClick={() => navigate('/auth')} className="text-lg px-8 py-3">
            Get Started Today
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;