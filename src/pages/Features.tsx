import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, FileText, Zap, Shield, Users, Palette, Download, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import Footer from '@/components/Footer';

const logo = '/lovable-uploads/22b8b905-b997-42da-85df-b966b4616f6e.png';

const Features = () => {
  const features = [
    {
      icon: FileText,
      title: 'Professional Templates',
      description: 'Choose from 50+ beautifully designed templates crafted by professionals',
      details: ['Industry-specific designs', 'Mobile-optimized layouts', 'Print-ready formats']
    },
    {
      icon: Palette,
      title: 'Custom Branding',
      description: 'Add your logo, colors, and fonts to match your brand perfectly',
      details: ['Logo integration', 'Color customization', 'Font selection']
    },
    {
      icon: Zap,
      title: 'Quick Creation',
      description: 'Create proposals in minutes with our intuitive drag-and-drop editor',
      details: ['Drag & drop interface', 'Auto-save functionality', 'Real-time preview']
    },
    {
      icon: Users,
      title: 'Client Management',
      description: 'Keep track of all your clients and proposal status in one place',
      details: ['Contact management', 'Proposal tracking', 'Communication history']
    },
    {
      icon: Download,
      title: 'Multiple Export Options',
      description: 'Export your proposals in various formats including PDF, Word, and PowerPoint',
      details: ['PDF export', 'Word documents', 'PowerPoint presentations']
    },
    {
      icon: Lock,
      title: 'Secure & Private',
      description: 'Your data is encrypted and secure with enterprise-grade security',
      details: ['256-bit encryption', 'Secure cloud storage', 'GDPR compliant']
    }
  ];

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
              <Link to="/solutions">
                <Button variant="ghost">Solutions</Button>
              </Link>
              <Link to="/templates">
                <Button variant="ghost">Templates</Button>
              </Link>
              <Link to="/auth">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link to="/auth">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="py-20 lg:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl lg:text-6xl font-bold tracking-tight mb-6">
              Powerful Features for
              <span className="text-primary block">Professional Proposals</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
              Everything you need to create, customize, and send winning proposals. 
              Built for professionals who demand excellence.
            </p>
            <Link to="/auth">
              <Button size="lg" className="text-lg px-8 py-3">
                Try All Features Free
              </Button>
            </Link>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="text-center">
                  <CardHeader>
                    <feature.icon className="h-12 w-12 text-primary mx-auto mb-4" />
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-4">
                      {feature.description}
                    </CardDescription>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {feature.details.map((detail, detailIndex) => (
                        <li key={detailIndex} className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-primary mr-2" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              Ready to Experience All Features?
            </h2>
            <p className="text-xl text-muted-foreground mb-10">
              Start your free trial today and see why thousands of professionals choose ProposalKraft.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="text-lg px-8 py-3">
                Start Free Trial
              </Button>
            </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Features;