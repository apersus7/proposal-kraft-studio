import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, FileText, Star, Briefcase, Building, Code, Heart, Palette, TrendingUp, Users, Zap, Globe, ShoppingCart, Calendar, GraduationCap, Monitor, Rocket, Settings, Leaf, Scale } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Template {
  id: string;
  name: string;
  description: string;
  preview_image_url: string | null;
  template_data: any;
  is_public: boolean;
  category: string;
  industry: string;
  tags: string[];
}

interface TemplateGalleryProps {
  onSelectTemplate: (template: Template) => void;
  selectedTemplate?: Template | null;
}

const industryIcons = {
  technology: <Code className="h-4 w-4" />,
  healthcare: <Heart className="h-4 w-4" />,
  finance: <TrendingUp className="h-4 w-4" />,
  consulting: <Users className="h-4 w-4" />,
  marketing: <Palette className="h-4 w-4" />,
  'real-estate': <Building className="h-4 w-4" />,
  startup: <Zap className="h-4 w-4" />,
  general: <Globe className="h-4 w-4" />,
  business: <Briefcase className="h-4 w-4" />
};

const starterTemplates = [
  {
    name: 'Technology Consulting Proposal',
    description: 'Perfect for IT consulting and software development projects',
    category: 'consulting',
    industry: 'technology',
    tags: ['software', 'development', 'consulting'],
    template_data: {
      sections: [
        { type: 'executive_summary', content: 'We propose a comprehensive technology solution that will transform your digital infrastructure and accelerate your business growth.' },
        { type: 'scope_of_work', items: ['Technical assessment and analysis', 'System architecture design', 'Development and implementation', 'Testing and quality assurance', 'Deployment and go-live support'] },
        { type: 'timeline', phases: [
          { phase: 'Discovery & Planning', duration: '2 weeks', description: 'Requirements gathering and technical architecture' },
          { phase: 'Development', duration: '8-12 weeks', description: 'Core system development and integration' },
          { phase: 'Testing & Launch', duration: '2-3 weeks', description: 'Quality assurance and deployment' }
        ]},
        { type: 'investment', total: '$75,000 - $125,000', payment_terms: 'Payment schedule: 30% upfront, 40% at milestone completion, 30% upon delivery' }
      ]
    }
  },
  {
    name: 'Healthcare Services Proposal',
    description: 'Tailored for healthcare consulting and medical technology projects',
    category: 'healthcare',
    industry: 'healthcare',
    tags: ['medical', 'healthcare', 'compliance'],
    template_data: {
      sections: [
        { type: 'executive_summary', content: 'Our healthcare solution ensures compliance with industry regulations while improving patient outcomes and operational efficiency.' },
        { type: 'scope_of_work', items: ['HIPAA compliance assessment', 'Medical workflow optimization', 'EHR system integration', 'Staff training and support', 'Ongoing maintenance and updates'] },
        { type: 'timeline', phases: [
          { phase: 'Compliance Review', duration: '1-2 weeks', description: 'HIPAA and regulatory compliance assessment' },
          { phase: 'Implementation', duration: '6-10 weeks', description: 'System setup and integration' },
          { phase: 'Training & Support', duration: '2-4 weeks', description: 'Staff training and go-live support' }
        ]},
        { type: 'investment', total: '$50,000 - $95,000', payment_terms: 'Milestone-based payments with 25% upfront, 50% at implementation, 25% post-training' }
      ]
    }
  },
  {
    name: 'Marketing Strategy Proposal',
    description: 'Comprehensive marketing and brand development proposals',
    category: 'marketing',
    industry: 'marketing',
    tags: ['branding', 'digital marketing', 'strategy'],
    template_data: {
      sections: [
        { type: 'executive_summary', content: 'Transform your brand presence with our data-driven marketing strategy that delivers measurable ROI and sustainable growth.' },
        { type: 'scope_of_work', items: ['Brand audit and competitive analysis', 'Marketing strategy development', 'Content creation and campaigns', 'Social media management', 'Performance tracking and optimization'] },
        { type: 'timeline', phases: [
          { phase: 'Research & Strategy', duration: '2-3 weeks', description: 'Market analysis and strategy development' },
          { phase: 'Campaign Creation', duration: '4-6 weeks', description: 'Content development and campaign setup' },
          { phase: 'Launch & Optimize', duration: 'Ongoing', description: 'Campaign launch and continuous optimization' }
        ]},
        { type: 'investment', total: '$25,000 - $60,000', payment_terms: 'Monthly retainer: 50% upfront, remaining balance in monthly installments' }
      ]
    }
  },
  {
    name: 'Financial Advisory Proposal',
    description: 'Professional financial consulting and advisory services',
    category: 'consulting',
    industry: 'finance',
    tags: ['financial planning', 'investment', 'advisory'],
    template_data: {
      sections: [
        { type: 'executive_summary', content: 'Our financial advisory services provide strategic guidance to optimize your investment portfolio and achieve long-term financial goals.' },
        { type: 'scope_of_work', items: ['Financial portfolio analysis', 'Risk assessment and management', 'Investment strategy development', 'Regulatory compliance review', 'Ongoing advisory support'] },
        { type: 'timeline', phases: [
          { phase: 'Assessment', duration: '1-2 weeks', description: 'Comprehensive financial analysis' },
          { phase: 'Strategy Development', duration: '2-3 weeks', description: 'Investment strategy and recommendations' },
          { phase: 'Implementation', duration: 'Ongoing', description: 'Portfolio management and monitoring' }
        ]},
        { type: 'investment', total: '$15,000 - $45,000', payment_terms: 'Annual fee structure with quarterly payments' }
      ]
    }
  },
  {
    name: 'Real Estate Development Proposal',
    description: 'Commercial and residential real estate project proposals',
    category: 'real-estate',
    industry: 'real-estate',
    tags: ['property', 'development', 'construction'],
    template_data: {
      sections: [
        { type: 'executive_summary', content: 'Partner with us for a comprehensive real estate development solution that maximizes value and minimizes risk throughout the project lifecycle.' },
        { type: 'scope_of_work', items: ['Site analysis and feasibility study', 'Design and planning services', 'Permit acquisition and approvals', 'Construction management', 'Marketing and sales support'] },
        { type: 'timeline', phases: [
          { phase: 'Planning & Permits', duration: '3-6 months', description: 'Design development and regulatory approvals' },
          { phase: 'Construction', duration: '12-18 months', description: 'Site preparation and building construction' },
          { phase: 'Marketing & Sales', duration: '6-12 months', description: 'Property marketing and sales completion' }
        ]},
        { type: 'investment', total: '$500,000 - $2,500,000', payment_terms: 'Phased investment schedule aligned with project milestones' }
      ]
    }
  },
  {
    name: 'Startup Business Plan',
    description: 'Comprehensive business plans for startups and new ventures',
    category: 'business',
    industry: 'startup',
    tags: ['business plan', 'funding', 'startup'],
    template_data: {
      sections: [
        { type: 'executive_summary', content: 'Our innovative startup solution addresses a significant market opportunity with a scalable business model and strong competitive advantages.' },
        { type: 'scope_of_work', items: ['Market research and validation', 'Business model development', 'Financial projections', 'Go-to-market strategy', 'Investor presentation creation'] },
        { type: 'timeline', phases: [
          { phase: 'Research & Validation', duration: '4-6 weeks', description: 'Market analysis and business model validation' },
          { phase: 'Development', duration: '8-12 weeks', description: 'Product development and testing' },
          { phase: 'Launch', duration: '4-8 weeks', description: 'Market launch and customer acquisition' }
        ]},
        { type: 'investment', total: '$100,000 - $500,000', payment_terms: 'Seed funding with milestone-based releases' }
      ]
    }
  }
];

export default function TemplateGallery({ onSelectTemplate, selectedTemplate }: TemplateGalleryProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Combine fetched templates with starter templates
      const combinedTemplates = [
        ...starterTemplates.map(template => ({
          id: `starter-${Math.random().toString(36).substr(2, 9)}`,
          ...template,
          preview_image_url: null,
          is_public: true
        })),
        ...(data || [])
      ];

      setTemplates(combinedTemplates);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesIndustry = selectedIndustry === 'all' || template.industry === selectedIndustry;
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    
    return matchesSearch && matchesIndustry && matchesCategory;
  });

  const industries = Array.from(new Set(templates.map(t => t.industry))).filter(Boolean);
  const categories = Array.from(new Set(templates.map(t => t.category))).filter(Boolean);

  if (loading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="animate-pulse">
            <div className="aspect-video bg-muted rounded-t-lg"></div>
            <CardContent className="p-4">
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-3 bg-muted rounded w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="All Industries" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Industries</SelectItem>
            {industries.map((industry) => (
              <SelectItem key={industry} value={industry}>
                <div className="flex items-center space-x-2">
                  {industryIcons[industry as keyof typeof industryIcons]}
                  <span className="capitalize">{industry.replace('-', ' ')}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                <span className="capitalize">{category}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} found
        </p>
        {searchTerm && (
          <Button variant="ghost" size="sm" onClick={() => setSearchTerm('')}>
            Clear search
          </Button>
        )}
      </div>

      {/* Template Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card 
            key={template.id} 
            className={`cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${
              selectedTemplate?.id === template.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => onSelectTemplate(template)}
          >
            <div className="aspect-video bg-gradient-to-br from-primary/10 to-accent/10 rounded-t-lg flex items-center justify-center relative overflow-hidden">
              {template.preview_image_url ? (
                <img 
                  src={template.preview_image_url} 
                  alt={template.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center">
                  {industryIcons[template.industry as keyof typeof industryIcons] || <FileText className="h-12 w-12 text-primary mb-2" />}
                  <p className="text-xs text-muted-foreground font-medium">{template.industry.replace('-', ' ').toUpperCase()}</p>
                </div>
              )}
              {template.id.startsWith('starter-') && (
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary" className="text-xs">
                    <Star className="h-3 w-3 mr-1" />
                    Starter
                  </Badge>
                </div>
              )}
            </div>
            <CardContent className="p-4">
              <CardTitle className="text-lg mb-2 line-clamp-1">{template.name}</CardTitle>
              <CardDescription className="line-clamp-2 mb-3">{template.description}</CardDescription>
              <div className="flex flex-wrap gap-1 mb-3">
                {template.tags?.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
              <Button className="w-full" variant={selectedTemplate?.id === template.id ? "default" : "outline"}>
                <FileText className="h-4 w-4 mr-2" />
                {selectedTemplate?.id === template.id ? 'Selected' : 'Use This Template'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No templates found</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Try adjusting your search terms or filters to find the perfect template for your proposal.
          </p>
        </div>
      )}
    </div>
  );
}