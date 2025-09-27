import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Mail, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
const logo = '/lovable-uploads/22b8b905-b997-42da-85df-b966b4616f6e.png';
const emailSchema = z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters");
const Footer = () => {
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const {
    toast
  } = useToast();
  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validatedEmail = emailSchema.parse(email);
      setIsSubscribing(true);
      const {
        error
      } = await supabase.functions.invoke('send-newsletter-email', {
        body: {
          email: validatedEmail
        }
      });
      if (error) throw error;
      toast({
        title: "Successfully subscribed!",
        description: "Thank you for subscribing to our newsletter."
      });
      setEmail('');
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Invalid email",
          description: error.errors[0].message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Subscription failed",
          description: "Please try again later.",
          variant: "destructive"
        });
      }
    } finally {
      setIsSubscribing(false);
    }
  };
  return <footer className="bg-card/50 border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <img src={logo} alt="ProposalKraft" className="h-8" />
              <span className="text-xl font-bold text-primary">ProposalKraft</span>
            </div>
            <p className="text-muted-foreground">
              Create stunning, professional proposals that win clients. The ultimate tool for business growth.
            </p>
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>support@Proposalkraft.com</span>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/features" className="text-muted-foreground hover:text-primary transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-muted-foreground hover:text-primary transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/solutions" className="text-muted-foreground hover:text-primary transition-colors">
                  Solutions
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-muted-foreground hover:text-primary transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Stay Updated</h3>
            <p className="text-muted-foreground mb-4">
              Get the latest tips for creating winning proposals.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-2">
              <Input type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} required maxLength={255} />
              <Button type="submit" size="sm" className="w-full" disabled={isSubscribing}>
                {isSubscribing ? 'Subscribing...' : 'Subscribe'}
              </Button>
            </form>
          </div>
        </div>

        <div className="border-t mt-12 pt-8 text-center text-muted-foreground">
          <p>© 2025 ProposalKraft. All rights reserved.</p>
        </div>
      </div>
    </footer>;
};
export default Footer;