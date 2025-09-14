import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';

const logo = '/lovable-uploads/22b8b905-b997-42da-85df-b966b4616f6e.png';

const Pricing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-3">
              <img src={logo} alt="Proposal kraft" className="h-8" />
              <span className="text-xl font-bold text-primary">Proposal kraft</span>
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
              Simple, Transparent
              <span className="text-primary block">Pricing</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
              Choose the perfect plan for your business. Start free and upgrade as you grow.
              No hidden fees, cancel anytime.
            </p>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Freelance Plan */}
              <Card className="relative border-border/50 hover:border-primary/50 transition-colors">
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl mb-2">Freelance</CardTitle>
                  <CardDescription className="text-muted-foreground mb-4">
                    Perfect for freelancers and small businesses
                  </CardDescription>
                  <div className="text-4xl font-bold text-primary mb-2">
                    $19
                    <span className="text-lg font-normal text-muted-foreground">/month</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Billed monthly</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-sm">5 proposals with watermark</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-sm">Unlimited templates</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-sm">Unlimited customisation</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-sm">Tracking</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-sm">E-signature</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-sm">Export in various formats</span>
                    </div>
                  </div>
                  <div className="pt-6">
                    <Button 
                      size="lg" 
                      className="w-full"
                      onClick={() => user ? navigate('/checkout?plan=freelance') : navigate('/auth')}
                    >
                      {user ? 'Get Started' : 'Sign Up to Subscribe'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Agency Plan */}
              <Card className="relative border-primary shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
                <CardHeader className="text-center pb-8 pt-8">
                  <CardTitle className="text-2xl mb-2">Agency</CardTitle>
                  <CardDescription className="text-muted-foreground mb-4">
                    Best for growing businesses and teams
                  </CardDescription>
                  <div className="text-4xl font-bold text-primary mb-2">
                    $49
                    <span className="text-lg font-normal text-muted-foreground">/month</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Billed monthly</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-sm">Unlimited proposal</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-sm">Unlimited templates</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-sm">Unlimited customisation</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-sm">Tracking</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-sm">E-signature</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-sm">Export in various formats</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-sm">CRM integration</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-sm">Upload custom template</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-sm">Reminders</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-sm">Team collaboration</span>
                    </div>
                  </div>
                  <div className="pt-6">
                    <Button 
                      size="lg" 
                      className="w-full"
                      onClick={() => user ? navigate('/checkout?plan=agency') : navigate('/auth')}
                    >
                      {user ? 'Start Free Trial' : 'Sign Up to Subscribe'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Enterprise Plan */}
              <Card className="relative border-border/50 hover:border-primary/50 transition-colors">
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl mb-2">Enterprise</CardTitle>
                  <CardDescription className="text-muted-foreground mb-4">
                    For large organizations with advanced needs
                  </CardDescription>
                  <div className="text-4xl font-bold text-primary mb-2">
                    $69
                    <span className="text-lg font-normal text-muted-foreground">/month</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Billed monthly</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-sm">Unlimited proposal</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-sm">Unlimited templates</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-sm">Unlimited customisation</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-sm">Tracking</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-sm">E-signature</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-sm">Export in various formats</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-sm">CRM integration</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-sm">Upload custom template</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-sm">Payment integration</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-sm">Reminders</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-sm">Team collaboration</span>
                    </div>
                  </div>
                  <div className="pt-6">
                    <Button 
                      size="lg" 
                      className="w-full"
                      onClick={() => user ? navigate('/checkout?plan=enterprise') : navigate('/auth')}
                    >
                      {user ? 'Get Enterprise' : 'Sign Up to Subscribe'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Feature Comparison Table */}
            <div className="mt-20">
              <h3 className="text-2xl font-bold text-center mb-10">Compare Plans</h3>
              <div className="overflow-x-auto">
                <table className="w-full border border-border rounded-lg">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left p-4 font-semibold">Features</th>
                      <th className="text-center p-4 font-semibold">Freelance</th>
                      <th className="text-center p-4 font-semibold">Agency</th>
                      <th className="text-center p-4 font-semibold">Enterprise</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border">
                      <td className="p-4">Monthly proposals</td>
                      <td className="text-center p-4">5 (with watermark)</td>
                      <td className="text-center p-4">Unlimited</td>
                      <td className="text-center p-4">Unlimited</td>
                    </tr>
                    <tr className="border-b border-border bg-muted/10">
                      <td className="p-4">Templates</td>
                      <td className="text-center p-4">Unlimited</td>
                      <td className="text-center p-4">Unlimited</td>
                      <td className="text-center p-4">Unlimited</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="p-4">Customisation</td>
                      <td className="text-center p-4">Unlimited</td>
                      <td className="text-center p-4">Unlimited</td>
                      <td className="text-center p-4">Unlimited</td>
                    </tr>
                    <tr className="border-b border-border bg-muted/10">
                      <td className="p-4">Tracking</td>
                      <td className="text-center p-4"><CheckCircle className="h-4 w-4 text-primary mx-auto" /></td>
                      <td className="text-center p-4"><CheckCircle className="h-4 w-4 text-primary mx-auto" /></td>
                      <td className="text-center p-4"><CheckCircle className="h-4 w-4 text-primary mx-auto" /></td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="p-4">E-signature</td>
                      <td className="text-center p-4"><CheckCircle className="h-4 w-4 text-primary mx-auto" /></td>
                      <td className="text-center p-4"><CheckCircle className="h-4 w-4 text-primary mx-auto" /></td>
                      <td className="text-center p-4"><CheckCircle className="h-4 w-4 text-primary mx-auto" /></td>
                    </tr>
                    <tr className="border-b border-border bg-muted/10">
                      <td className="p-4">Export formats</td>
                      <td className="text-center p-4"><CheckCircle className="h-4 w-4 text-primary mx-auto" /></td>
                      <td className="text-center p-4"><CheckCircle className="h-4 w-4 text-primary mx-auto" /></td>
                      <td className="text-center p-4"><CheckCircle className="h-4 w-4 text-primary mx-auto" /></td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="p-4">CRM integration</td>
                      <td className="text-center p-4"><X className="h-4 w-4 text-muted-foreground mx-auto" /></td>
                      <td className="text-center p-4"><CheckCircle className="h-4 w-4 text-primary mx-auto" /></td>
                      <td className="text-center p-4"><CheckCircle className="h-4 w-4 text-primary mx-auto" /></td>
                    </tr>
                    <tr className="border-b border-border bg-muted/10">
                      <td className="p-4">Upload custom template</td>
                      <td className="text-center p-4"><X className="h-4 w-4 text-muted-foreground mx-auto" /></td>
                      <td className="text-center p-4"><CheckCircle className="h-4 w-4 text-primary mx-auto" /></td>
                      <td className="text-center p-4"><CheckCircle className="h-4 w-4 text-primary mx-auto" /></td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="p-4">Reminders</td>
                      <td className="text-center p-4"><X className="h-4 w-4 text-muted-foreground mx-auto" /></td>
                      <td className="text-center p-4"><CheckCircle className="h-4 w-4 text-primary mx-auto" /></td>
                      <td className="text-center p-4"><CheckCircle className="h-4 w-4 text-primary mx-auto" /></td>
                    </tr>
                    <tr className="border-b border-border bg-muted/10">
                      <td className="p-4">Team collaboration</td>
                      <td className="text-center p-4"><X className="h-4 w-4 text-muted-foreground mx-auto" /></td>
                      <td className="text-center p-4"><CheckCircle className="h-4 w-4 text-primary mx-auto" /></td>
                      <td className="text-center p-4"><CheckCircle className="h-4 w-4 text-primary mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="p-4">Payment integration</td>
                      <td className="text-center p-4"><X className="h-4 w-4 text-muted-foreground mx-auto" /></td>
                      <td className="text-center p-4"><X className="h-4 w-4 text-muted-foreground mx-auto" /></td>
                      <td className="text-center p-4"><CheckCircle className="h-4 w-4 text-primary mx-auto" /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-muted/30">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-lg mb-2">Can I change plans anytime?</h3>
                <p className="text-muted-foreground">Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Is there a free trial?</h3>
                <p className="text-muted-foreground">Yes, all paid plans come with a 14-day free trial. No credit card required to start.</p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">What payment methods do you accept?</h3>
                <p className="text-muted-foreground">We accept all major credit cards and bank transfers for annual plans.</p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Do you offer refunds?</h3>
                <p className="text-muted-foreground">Yes, we offer a 30-day money-back guarantee for all paid plans.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              Ready to Start Creating?
            </h2>
            <p className="text-xl text-muted-foreground mb-10">
              Join thousands of professionals already using Proposal kraft to win more business.
            </p>
            <Link to="/auth">
              <Button size="lg" className="text-lg px-8 py-3">
                Start Your Free Trial
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Pricing;