import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Zap, Shield, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
// Using uploaded logo directly
const logo = '/lovable-uploads/22b8b905-b997-42da-85df-b966b4616f6e.png';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img src={logo} alt="Proposal kraft" className="h-8" />
              <h1 className="text-xl font-bold text-primary">Proposal kraft</h1>
            </div>
            <div className="flex items-center space-x-4">
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
            <img src={logo} alt="Proposal kraft" className="h-20 mx-auto mb-6" />
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
            Join thousands of businesses creating winning proposals with Proposal kraft.
          </p>
          <Button size="lg" onClick={() => navigate('/auth')} className="text-lg px-8 py-3">
            Get Started Today
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
