import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Eye, DollarSign, User, Search, FileText, Zap, Shield, Users, Settings, Crown, LogOut, Menu, Loader2, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Footer from '@/components/Footer';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const logo = '/lovable-uploads/22b8b905-b997-42da-85df-b966b4616f6e.png';

// Intersection observer hook for scroll animations
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}
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
  const {
    user,
    loading,
    signOut
  } = useAuth();
  const navigate = useNavigate();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [filteredProposals, setFilteredProposals] = useState<Proposal[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingProposals, setLoadingProposals] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Intersection observers for scroll animations (must be before early returns)
  const heroSection = useInView();
  const featuresSection = useInView();
  const pricingSection = useInView();
  const ctaSection = useInView();
  const handleStartTrial = useCallback(async () => {
    if (!user) { navigate('/auth'); return; }
    setCheckoutLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('dodo-checkout', {
        body: { return_url: window.location.origin + '/' },
      });
      if (error) throw error;
      if (data?.checkout_url) window.location.href = data.checkout_url;
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
      setCheckoutLoading(false);
    }
  }, [user, navigate]);
  
  useEffect(() => {
    if (user) {
      fetchProposals();
    }
  }, [user]);
  useEffect(() => {
    if (searchQuery) {
      const filtered = proposals.filter(proposal => proposal.title.toLowerCase().includes(searchQuery.toLowerCase()) || proposal.client_name.toLowerCase().includes(searchQuery.toLowerCase()));
      setFilteredProposals(filtered);
    } else {
      setFilteredProposals(proposals);
    }
  }, [searchQuery, proposals]);
  const fetchProposals = async () => {
    setLoadingProposals(true);
    try {
      const {
        data,
        error
      } = await supabase.from('proposals').select('*').order('updated_at', {
        ascending: false
      });
      const normalized = (data || []).map((p: any) => ({
        ...p,
        worth: (p?.worth ?? Number(p?.content?.pricing)) || 0
      }));
      setProposals(normalized);
    } catch (error) {
      console.error('Error fetching proposals:', error);
    } finally {
      setLoadingProposals(false);
    }
  };
  const handleCreateProposal = () => {
    navigate('/create-proposal');
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

  // Show loading spinner while auth is loading
  if (loading) {
    return null; // AuthProvider will handle loading state
  }

  // If user is authenticated, show proposals dashboard
  if (user) {
    return <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
        {/* Header */}
        <header className="border-b bg-card/80 backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <img src={logo} alt="Craft Proposal" className="h-8" />
                <h1 className="text-xl font-bold text-primary">Craft Proposal</h1>
              </div>
              <div className="flex items-center space-x-3">
                <Button onClick={handleCreateProposal} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Proposal
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full">
                      <User className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/settings')}>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut}>
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
                Manage and track your business proposals
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6 flex items-center space-x-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input type="text" placeholder="Search proposals by title or client..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
          </div>

          {loadingProposals ? <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map(i => <Card key={i} className="animate-pulse">
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
                </Card>)}
            </div> : filteredProposals.length === 0 ? <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Plus className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No proposals yet</h3>
                <p className="text-muted-foreground text-center max-w-sm mb-6">
                  Get started by creating your first proposal. Choose from our professional templates.
                </p>
                <Button onClick={handleCreateProposal}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Proposal
                </Button>
              </CardContent>
            </Card> : <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredProposals.map(proposal => <Card key={proposal.id} className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]" onClick={() => navigate(`/proposal/${proposal.id}`)}>
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
                </Card>)}
            </div>}
        </main>
      </div>;
  }




  // If user is not authenticated, show landing page
  return <div className="min-h-screen bg-background overflow-hidden">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-3 group">
              <img src={logo} alt="Craft Proposal" className="h-8 transition-transform duration-300 group-hover:scale-110" />
              <span className="text-xl font-bold text-gradient">Craft Proposal</span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-2">
              <Link to="/features">
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground transition-colors">Features</Button>
              </Link>
              <Link to="/solutions">
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground transition-colors">Solutions</Button>
              </Link>
              <Button variant="outline" className="border-primary/30 hover:border-primary/60 hover:bg-primary/5 transition-all" onClick={() => window.open('https://calendly.com/craftproposal/demo', '_blank')}>
                Request Demo
              </Button>
              <Button onClick={() => navigate('/auth')} className="group">
                Get Started
                <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>

            {/* Mobile Navigation */}
            <Sheet>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px]">
                <nav className="flex flex-col space-y-4 mt-8">
                  <Link to="/features" className="w-full">
                    <Button variant="ghost" className="w-full justify-start">Features</Button>
                  </Link>
                  <Link to="/solutions" className="w-full">
                    <Button variant="ghost" className="w-full justify-start">Solutions</Button>
                  </Link>
                  <Button className="w-full justify-start" variant="outline" onClick={() => window.open('https://calendly.com/craftproposal/demo', '_blank')}>
                    Request Demo
                  </Button>
                  <Button className="w-full" onClick={() => navigate('/auth')}>
                    Get Started
                  </Button>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section ref={heroSection.ref} className="relative py-16 sm:py-24 lg:py-36 gradient-hero">
        {/* Decorative grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(hsl(151 100% 37%) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className={`transition-all duration-700 ${heroSection.inView ? 'animate-fade-in' : 'opacity-0'}`}>
            <Badge variant="outline" className="mb-6 border-primary/30 bg-primary/5 text-primary px-4 py-1.5 text-sm">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              AI-Powered Proposal Generator
            </Badge>
          </div>
          
          <div className={`transition-all duration-700 ${heroSection.inView ? 'animate-fade-in delay-100' : 'opacity-0'}`}>
            <img src={logo} alt="Craft Proposal" className="h-16 sm:h-20 mx-auto mb-6 animate-float" />
          </div>
          
          <h1 className={`text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1] transition-all duration-700 ${heroSection.inView ? 'animate-fade-in delay-200' : 'opacity-0'}`}>
            Craft Professional
            <span className="text-gradient block mt-2">Business Proposals</span>
            <span className="block text-2xl sm:text-3xl lg:text-4xl font-medium text-muted-foreground mt-4">Powered by AI</span>
          </h1>
          
          <p className={`text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 px-4 transition-all duration-700 ${heroSection.inView ? 'animate-fade-in delay-300' : 'opacity-0'}`}>
            Create stunning, professional proposals that win clients. AI-powered generation, custom branding, and seamless delivery — all in one platform.
          </p>
          
          <div className={`flex flex-col sm:flex-row gap-4 justify-center px-4 transition-all duration-700 ${heroSection.inView ? 'animate-fade-in delay-400' : 'opacity-0'}`}>
            <Button size="lg" onClick={() => navigate('/auth')} className="text-base sm:text-lg px-8 py-6 group animate-glow-pulse">
              Start Closing Deals
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button size="lg" variant="outline" className="text-base sm:text-lg px-8 py-6 border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all" onClick={() => window.open('https://calendly.com/craftproposal/demo', '_blank')}>
              Request Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section ref={featuresSection.ref} className="relative py-16 sm:py-24 gradient-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-14 sm:mb-18 transition-all duration-700 ${featuresSection.inView ? 'animate-fade-in' : 'opacity-0'}`}>
            <Badge variant="outline" className="mb-4 border-primary/20 bg-primary/5 text-primary">
              Features
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">Everything You Need</h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Professional proposal creation made simple and powerful
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {[
              { icon: FileText, title: 'Beautiful Templates', desc: 'Choose from professional templates designed to impress clients and win business.' },
              { icon: Zap, title: 'Quick Creation', desc: 'Create proposals in seconds using our efficient AI proposal generator.' },
              { icon: Shield, title: 'Custom Branding', desc: 'Add your logo, colors, and branding to make every proposal uniquely yours.' },
              { icon: Users, title: 'Client Management', desc: 'Keep track of all your proposals and client communications in one place.' },
            ].map((feature, i) => (
              <Card key={feature.title} className={`gradient-card border-glow hover:scale-[1.03] transition-all duration-300 group ${featuresSection.inView ? 'animate-fade-in' : 'opacity-0'} delay-${(i + 1) * 100}`}>
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-7 w-7 text-primary" />
                  </div>
                  <CardTitle className="text-lg sm:text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-sm leading-relaxed">{feature.desc}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section ref={pricingSection.ref} className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-14 transition-all duration-700 ${pricingSection.inView ? 'animate-fade-in' : 'opacity-0'}`}>
            <Badge variant="outline" className="mb-4 border-primary/20 bg-primary/5 text-primary">
              Pricing
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-lg sm:text-xl text-muted-foreground">
              Start with a free trial. No credit card required.
            </p>
          </div>

          <div className={`max-w-md mx-auto transition-all duration-700 ${pricingSection.inView ? 'animate-scale-in delay-200' : 'opacity-0'}`}>
            <Card className="relative overflow-hidden border-glow animate-glow-pulse">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
              <CardHeader className="text-center pb-2 pt-8">
                <Badge className="mx-auto mb-4 bg-primary/10 text-primary hover:bg-primary/10 border-primary/20">
                  Most Popular
                </Badge>
                <CardTitle className="text-2xl sm:text-3xl">Pro Plan</CardTitle>
                <CardDescription className="text-base mt-2">Everything you need to win more clients</CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-6 pb-8">
                <div>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl sm:text-6xl font-bold text-gradient">$19</span>
                    <span className="text-muted-foreground text-lg">/month</span>
                  </div>
                  <p className="text-primary font-medium mt-2">7-day free trial included</p>
                </div>

                <ul className="text-left space-y-3 mx-auto max-w-xs">
                  {[
                    'Unlimited AI-generated proposals',
                    'Custom branding & templates',
                    'E-signatures & payments',
                    'Client analytics & tracking',
                    'PDF & link sharing',
                    'Priority support',
                  ].map((feature) => (
                    <li key={feature} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button size="lg" className="w-full text-base py-6 group" onClick={handleStartTrial} disabled={checkoutLoading}>
                  {checkoutLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing...</> : <>Start 7-Day Free Trial <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" /></>}
                </Button>
                <p className="text-xs text-muted-foreground">No credit card required · Cancel anytime</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section ref={ctaSection.ref} className="relative py-16 sm:py-24 gradient-cta">
        <div className={`max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 transition-all duration-700 ${ctaSection.inView ? 'animate-fade-in' : 'opacity-0'}`}>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Ready to Create Your
            <span className="text-gradient"> First Proposal?</span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Join thousands of businesses creating winning proposals with Craft Proposal.
          </p>
          <Button size="lg" onClick={() => navigate('/auth')} className="text-base sm:text-lg px-8 py-6 group animate-glow-pulse">
            Get Started Today
            <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </section>

      <Footer />
    </div>;
};
export default Index;