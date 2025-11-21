import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, Briefcase, Users, Zap, Target, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import Footer from '@/components/Footer';

const logo = '/lovable-uploads/22b8b905-b997-42da-85df-b966b4616f6e.png';

const Solutions = () => {
  const solutions = [
    {
      icon: Briefcase,
      title: 'Freelancers & Consultants',
      description: 'Perfect for independent professionals who need to create impressive proposals quickly',
      benefits: [
        'Professional templates that build credibility',
        'Quick turnaround to beat competitors',
        'Custom branding to stand out',
        'Client management in one place'
      ],
      cta: 'Start Winning More Projects'
    },
    {
      icon: Building,
      title: 'Small & Medium Businesses',
      description: 'Scale your proposal process and close more deals with streamlined workflows',
      benefits: [
        'Team collaboration features',
        'Consistent branding across all proposals',
        'Analytics to track success rates',
        'Integration with existing tools'
      ],
      cta: 'Grow Your Business'
    },
    {
      icon: Users,
      title: 'Enterprise Teams',
      description: 'Enterprise-grade solution for large organizations with complex proposal needs',
      benefits: [
        'Advanced workflow management',
        'Custom integrations and APIs',
        'White-label options',
        'Dedicated support and training'
      ],
      cta: 'Contact Sales Team'
    }
  ];

  const industries = [
    {
      name: 'Marketing Agencies',
      description: 'Create compelling proposals for campaigns, strategies, and creative services'
    },
    {
      name: 'IT Services',
      description: 'Professional proposals for software development, IT consulting, and support'
    },
    {
      name: 'Construction',
      description: 'Detailed project proposals with timelines, materials, and cost breakdowns'
    },
    {
      name: 'Legal Services',
      description: 'Professional service agreements and legal consultation proposals'
    },
    {
      name: 'Healthcare',
      description: 'Medical service proposals and healthcare consulting agreements'
    },
    {
      name: 'Financial Services',
      description: 'Investment proposals, financial planning, and advisory service agreements'
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
              Solutions for Every
              <span className="text-primary block">Business Size</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
              From solo freelancers to enterprise teams, ProposalKraft adapts to your business needs 
              and helps you win more deals.
            </p>
            <Link to="/auth">
              <Button size="lg" className="text-lg px-8 py-3">
                Find Your Solution
              </Button>
            </Link>
          </div>
        </section>

        {/* Solutions Grid */}
        <section className="py-20 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-3 gap-8">
              {solutions.map((solution, index) => (
                <Card key={index} className="text-center h-full flex flex-col">
                  <CardHeader className="flex-shrink-0">
                    <solution.icon className="h-16 w-16 text-primary mx-auto mb-4" />
                    <CardTitle className="text-2xl">{solution.title}</CardTitle>
                    <CardDescription className="text-base">
                      {solution.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow flex flex-col justify-between">
                    <ul className="space-y-3 mb-8 text-left">
                      {solution.benefits.map((benefit, benefitIndex) => (
                        <li key={benefitIndex} className="flex items-start">
                          <Target className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                    <Button className="w-full mt-auto">
                      {solution.cta}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Industries Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">Industry Solutions</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Tailored templates and features for every industry
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {industries.map((industry, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="h-5 w-5 text-primary mr-2" />
                      {industry.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{industry.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">Proven Results</h2>
              <p className="text-xl text-muted-foreground">
                See how ProposalKraft helps businesses win more deals
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-primary mb-2">85%</div>
                <p className="text-muted-foreground">Higher acceptance rate</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary mb-2">3x</div>
                <p className="text-muted-foreground">Faster proposal creation</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary mb-2">50K+</div>
                <p className="text-muted-foreground">Proposals created monthly</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              Ready to Transform Your Proposal Process?
            </h2>
            <p className="text-xl text-muted-foreground mb-10">
              Join thousands of businesses already using ProposalKraft to win more deals and grow faster.
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

export default Solutions;