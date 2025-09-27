import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, FileText, Star, Briefcase, Building, Code, Heart, Palette, TrendingUp, Users, Zap, Globe, ShoppingCart, Calendar, GraduationCap, Monitor, Rocket, Settings, Leaf, Scale, Camera, Utensils, Dumbbell, Plane, Music, Paintbrush, Smartphone, Video, Gift, Eye, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
const sb = supabase as any;

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
  preview_color?: string;
}

interface TemplateGalleryProps {
  onSelectTemplate: (template: Template) => void;
  selectedTemplate?: Template | null;
}

const industryIcons = {
  creative: <Paintbrush className="h-4 w-4" />,
  photography: <Camera className="h-4 w-4" />,
  events: <Calendar className="h-4 w-4" />,
  food: <Utensils className="h-4 w-4" />,
  fitness: <Dumbbell className="h-4 w-4" />,
  travel: <Plane className="h-4 w-4" />,
  music: <Music className="h-4 w-4" />,
  fashion: <Heart className="h-4 w-4" />,
  technology: <Smartphone className="h-4 w-4" />,
  marketing: <Video className="h-4 w-4" />,
  lifestyle: <Gift className="h-4 w-4" />,
  business: <Briefcase className="h-4 w-4" />,
  consulting: <Users className="h-4 w-4" />,
  retail: <ShoppingCart className="h-4 w-4" />,
  ecommerce: <Globe className="h-4 w-4" />,
  content: <FileText className="h-4 w-4" />,
  branding: <Palette className="h-4 w-4" />
};

// Beautiful Canva-inspired templates with comprehensive content
const starterTemplates = [
  {
    name: 'Modern Tech Solutions',
    description: 'Clean, professional design perfect for software & tech consulting',
    category: 'business',
    industry: 'technology',
    tags: ['minimal', 'tech', 'modern', 'professional'],
    preview_color: 'from-blue-50 via-indigo-50 to-purple-50',
    template_data: {
      sections: [
        { 
          type: 'cover_page', 
          title: 'Digital Transformation Proposal',
          tagline: 'Empowering your business with cutting-edge technology solutions',
          company_name: 'TechForward Solutions'
        },
        { 
          type: 'objective', 
          content: 'Transform your business operations through strategic digital solutions that drive growth, improve efficiency, and create competitive advantages in today\'s digital marketplace.'
        },
        { 
          type: 'proposed_solution', 
          content: 'We propose a comprehensive digital transformation strategy that includes cloud migration, process automation, and data analytics implementation.',
          why_fits: 'Our solution aligns perfectly with your growth objectives and technical requirements, ensuring scalable and sustainable results.',
          tools: ['React', 'Node.js', 'AWS Cloud', 'MongoDB', 'Docker']
        },
        { 
          type: 'scope_of_work', 
          content: 'Complete end-to-end digital transformation including system analysis, architecture design, development, testing, and deployment.',
          deliverables: [
            'Technical Architecture Document',
            'Custom Web Application',
            'Cloud Infrastructure Setup',
            'Data Migration & Integration',
            'Staff Training & Documentation',
            '6 Months Technical Support'
          ],
          timeline: [
            { phase: 'Discovery & Planning', duration: '2 weeks', description: 'Requirements gathering and technical planning' },
            { phase: 'Development Phase 1', duration: '6 weeks', description: 'Core system development and integration' },
            { phase: 'Testing & Deployment', duration: '2 weeks', description: 'Quality assurance and production deployment' },
            { phase: 'Training & Support', duration: 'Ongoing', description: 'User training and technical support' }
          ]
        },
        {
          type: 'value_proposition',
          advantages: [
            '40% improvement in operational efficiency',
            'Scalable cloud-based infrastructure',
            'Real-time analytics and reporting',
            'Enhanced security and compliance',
            'Future-ready technology stack'
          ]
        }
      ]
    }
  },
  {
    name: 'Creative Agency Premium',
    description: 'Bold, vibrant design for creative agencies and design studios',
    category: 'creative',
    industry: 'creative',
    tags: ['creative', 'bold', 'premium', 'artistic'],
    preview_color: 'from-pink-100 via-purple-100 to-indigo-100',
    template_data: {
      sections: [
        { 
          type: 'cover_page', 
          title: 'Brand Identity & Design Proposal',
          tagline: 'Crafting exceptional brand experiences that captivate and convert',
          company_name: 'Visionary Creative Studio'
        },
        { 
          type: 'objective', 
          content: 'Create a compelling brand identity that resonates with your target audience, differentiates you from competitors, and drives meaningful engagement across all touchpoints.'
        },
        { 
          type: 'proposed_solution', 
          content: 'A comprehensive brand identity system including logo design, visual guidelines, marketing materials, and digital assets.',
          why_fits: 'Our creative approach combines strategic thinking with artistic excellence, perfectly suited for brands seeking to make a bold statement.',
          tools: ['Adobe Creative Suite', 'Figma', 'After Effects', 'Webflow', 'Principle']
        },
        { 
          type: 'scope_of_work', 
          content: 'Complete brand identity development from concept to implementation across all brand touchpoints.',
          deliverables: [
            'Brand Strategy & Positioning',
            'Logo Design (3 concepts + revisions)',
            'Brand Guidelines Document',
            'Business Card & Stationery Design',
            'Website Design Mockups',
            'Social Media Templates',
            'Brand Asset Library'
          ],
          timeline: [
            { phase: 'Brand Discovery', duration: '1 week', description: 'Brand audit and strategic positioning' },
            { phase: 'Concept Development', duration: '2 weeks', description: 'Logo concepts and initial designs' },
            { phase: 'Design Refinement', duration: '2 weeks', description: 'Refinements and brand system development' },
            { phase: 'Final Delivery', duration: '1 week', description: 'Asset creation and handover' }
          ]
        },
        {
          type: 'value_proposition',
          advantages: [
            'Award-winning creative team',
            'Proven track record with 200+ brands',
            'Strategic approach to design',
            'Unlimited revisions included',
            'Complete brand ecosystem development'
          ]
        }
      ]
    }
  },
  {
    name: 'Executive Business Proposal',
    description: 'Premium corporate design for C-suite and enterprise clients',
    category: 'corporate',
    industry: 'business',
    tags: ['corporate', 'executive', 'premium', 'enterprise'],
    preview_color: 'from-slate-100 via-gray-100 to-zinc-100',
    template_data: {
      sections: [
        { 
          type: 'cover_page', 
          title: 'Strategic Business Consulting Proposal',
          tagline: 'Driving sustainable growth through strategic excellence',
          company_name: 'Executive Partners Consulting'
        },
        { 
          type: 'objective', 
          content: 'Accelerate your organization\'s growth and operational excellence through strategic consulting that delivers measurable results and sustainable competitive advantages.'
        },
        { 
          type: 'proposed_solution', 
          content: 'Comprehensive business strategy development including market analysis, operational optimization, and growth planning.',
          why_fits: 'Our executive-level consulting approach provides the strategic insight and operational expertise needed to achieve your ambitious business goals.',
          tools: ['McKinsey Framework', 'BCG Matrix', 'SWOT Analysis', 'Financial Modeling', 'Market Research']
        },
        { 
          type: 'scope_of_work', 
          content: 'End-to-end strategic consulting engagement covering all aspects of business strategy and operational excellence.',
          deliverables: [
            'Comprehensive Business Assessment',
            'Strategic Roadmap & Implementation Plan',
            'Market Analysis & Competitive Intelligence',
            'Financial Projections & ROI Analysis',
            'Operational Excellence Framework',
            'Change Management Strategy',
            'Executive Presentation Materials'
          ],
          timeline: [
            { phase: 'Strategic Assessment', duration: '3 weeks', description: 'Business analysis and opportunity identification' },
            { phase: 'Strategy Development', duration: '4 weeks', description: 'Strategic planning and roadmap creation' },
            { phase: 'Implementation Planning', duration: '2 weeks', description: 'Detailed implementation and change management plans' },
            { phase: 'Executive Presentation', duration: '1 week', description: 'Board-ready presentation and handover' }
          ]
        },
        {
          type: 'value_proposition',
          advantages: [
            'C-suite expertise with Fortune 500 experience',
            'Proven methodology delivering 25%+ growth',
            'Comprehensive market intelligence',
            'Board-ready strategic documentation',
            'Ongoing strategic advisory support'
          ]
        }
      ]
    }
  },
  {
    name: 'Marketing Campaign Mastery',
    description: 'Dynamic design for marketing agencies and growth consultants',
    category: 'marketing',
    industry: 'marketing',
    tags: ['marketing', 'growth', 'campaigns', 'results-driven'],
    preview_color: 'from-orange-50 via-red-50 to-pink-50',
    template_data: {
      sections: [
        { 
          type: 'cover_page', 
          title: 'Integrated Marketing Campaign Proposal',
          tagline: 'Accelerating growth through data-driven marketing excellence',
          company_name: 'Growth Catalyst Marketing'
        },
        { 
          type: 'objective', 
          content: 'Launch a comprehensive marketing campaign that increases brand awareness, generates qualified leads, and drives measurable revenue growth across all key channels.'
        },
        { 
          type: 'proposed_solution', 
          content: 'Multi-channel marketing campaign combining digital advertising, content marketing, social media, and conversion optimization.',
          why_fits: 'Our data-driven approach ensures maximum ROI while building long-term brand equity and customer relationships.',
          tools: ['Google Ads', 'Facebook Ads Manager', 'HubSpot', 'Google Analytics', 'Hotjar', 'Mailchimp']
        },
        { 
          type: 'scope_of_work', 
          content: 'Complete marketing campaign development, execution, and optimization across all digital channels.',
          deliverables: [
            'Marketing Strategy & Campaign Plan',
            'Target Audience Research & Personas',
            'Creative Assets & Ad Designs',
            'Landing Page Development',
            'Email Marketing Sequences',
            'Social Media Content Calendar',
            'Performance Analytics Dashboard'
          ],
          timeline: [
            { phase: 'Strategy & Planning', duration: '1 week', description: 'Campaign strategy and audience research' },
            { phase: 'Creative Development', duration: '2 weeks', description: 'Asset creation and landing page build' },
            { phase: 'Campaign Launch', duration: '1 week', description: 'Multi-channel campaign deployment' },
            { phase: 'Optimization Period', duration: '8 weeks', description: 'Ongoing optimization and reporting' }
          ]
        },
        {
          type: 'value_proposition',
          advantages: [
            'Average 300% ROI on marketing spend',
            '50+ successful campaign launches',
            'Real-time performance tracking',
            'Multi-channel expertise',
            'Guaranteed lead generation results'
          ]
        }
      ]
    }
  },
  {
    name: 'E-commerce Growth Package',
    description: 'Results-focused design for online retailers and e-commerce brands',
    category: 'ecommerce',
    industry: 'retail',
    tags: ['ecommerce', 'growth', 'conversion', 'sales'],
    preview_color: 'from-green-50 via-emerald-50 to-teal-50',
    template_data: {
      sections: [
        { 
          type: 'cover_page', 
          title: 'E-commerce Growth & Optimization Proposal',
          tagline: 'Maximizing revenue through conversion optimization and strategic growth',
          company_name: 'E-commerce Accelerators'
        },
        { 
          type: 'objective', 
          content: 'Increase your e-commerce revenue by 40% through conversion rate optimization, user experience improvements, and strategic growth initiatives.'
        },
        { 
          type: 'proposed_solution', 
          content: 'Comprehensive e-commerce optimization including UX/UI improvements, conversion funnel optimization, and revenue growth strategies.',
          why_fits: 'Our proven e-commerce methodology has helped 100+ online stores achieve sustainable growth and improved profitability.',
          tools: ['Shopify Plus', 'Google Analytics 4', 'Hotjar', 'Klaviyo', 'Gorgias', 'ReCharge']
        },
        { 
          type: 'scope_of_work', 
          content: 'Complete e-commerce store optimization covering design, functionality, marketing, and customer experience.',
          deliverables: [
            'E-commerce Audit & Analysis Report',
            'Conversion Rate Optimization Strategy',
            'Store Design & UX Improvements',
            'Product Page Optimization',
            'Checkout Process Enhancement',
            'Email Marketing Automation',
            'Performance Tracking Dashboard'
          ],
          timeline: [
            { phase: 'Store Audit', duration: '1 week', description: 'Comprehensive analysis of current performance' },
            { phase: 'Optimization Implementation', duration: '4 weeks', description: 'UX improvements and conversion optimization' },
            { phase: 'Marketing Setup', duration: '2 weeks', description: 'Email automation and retention strategies' },
            { phase: 'Testing & Refinement', duration: '4 weeks', description: 'A/B testing and performance optimization' }
          ]
        },
        {
          type: 'value_proposition',
          advantages: [
            'Average 40% increase in conversion rates',
            '25% improvement in average order value',
            'Specialized e-commerce expertise',
            'Data-driven optimization approach',
            '90-day revenue growth guarantee'
          ]
        }
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
      const { data, error } = await sb
        .from('templates')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Combine database templates with any additional starter templates
      const starter = starterTemplates.map((template) => ({
        id: `starter-${Math.random().toString(36).substr(2, 9)}`,
        ...template,
        preview_image_url: null,
        is_public: true
      }));

      const dbTemplates: Template[] = ((data || []) as any[]).map((d) => ({
        id: d.id,
        name: d.name || 'Untitled',
        description: d.description || '',
        preview_image_url: d.preview_image_url ?? null,
        template_data: d.template_data ?? {},
        is_public: !!d.is_public,
        category: d.category || 'general',
        industry: d.industry || 'general',
        tags: Array.isArray(d.tags) ? d.tags : [],
        preview_color: d.preview_color,
      }));

      setTemplates([...dbTemplates, ...starter]);
    } catch (error) {
      console.error('Error loading templates:', error);
      
      // Fallback to starter templates if database fails
      const starter = starterTemplates.map((template) => ({
        id: `starter-${Math.random().toString(36).substr(2, 9)}`,
        ...template,
        preview_image_url: null,
        is_public: true
      }));
      setTemplates(starter);
      
      toast({
        title: "Templates loaded", 
        description: "Using default templates"
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Card key={i} className="group relative overflow-hidden rounded-2xl border bg-card animate-pulse">
            <div className="aspect-[4/5] bg-gradient-to-br from-muted/50 to-muted"></div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-12 rounded-full"
          />
        </div>
        <div className="flex gap-3">
          <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
            <SelectTrigger className="w-44 h-12 rounded-full">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Industries</SelectItem>
              {industries.map(industry => (
                <SelectItem key={industry} value={industry}>
                  <div className="flex items-center gap-2">
                    {industryIcons[industry as keyof typeof industryIcons]}
                    <span className="capitalize">{industry}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-44 h-12 rounded-full">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  <span className="capitalize">{category}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {/* Blank Document */}
        <Card 
          className="group relative overflow-hidden rounded-lg border-2 border-dashed border-muted-foreground/30 bg-background hover:border-primary/50 transition-all duration-300 cursor-pointer"
          onClick={() => onSelectTemplate({
            id: null,
            name: 'Blank document',
            description: 'Start with a blank proposal',
            category: 'blank',
            industry: 'general',
            tags: ['blank', 'custom'],
            preview_image_url: null,
            template_data: { sections: [] },
            is_public: true
          })}
        >
          <div className="aspect-[3/4] flex flex-col items-center justify-center p-6">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-background">
            <h3 className="font-medium text-sm text-foreground text-center">Blank document</h3>
          </div>
        </Card>

        {filteredTemplates.map((template) => {
          const isSelected = selectedTemplate?.id === template.id;
          
          return (
            <Card 
              key={template.id}
              className={`group relative overflow-hidden rounded-lg border transition-all duration-300 cursor-pointer hover:shadow-lg ${
                isSelected ? 'ring-2 ring-primary shadow-lg' : 'hover:border-primary/30'
              }`}
              onClick={() => onSelectTemplate(template)}
            >
              <div className="aspect-[3/4] relative overflow-hidden">
                <div className={`w-full h-full bg-gradient-to-br ${template.preview_color || 'from-white to-gray-50'} p-4 flex flex-col relative`}>
                  {/* Template Header */}
                  <div className="w-full h-6 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm flex items-center px-2 mb-3">
                    <div className="w-1.5 h-1.5 bg-red-400 rounded-full mr-1"></div>
                    <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mr-1"></div>
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2"></div>
                    <div className="w-12 h-1.5 bg-gray-300 rounded"></div>
                  </div>
                  
                  {/* Content Layout */}
                  <div className="bg-white/90 backdrop-blur rounded-lg p-2 mb-2 shadow-sm flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-2 bg-gray-800 rounded"></div>
                      <div className="w-6 h-1.5 bg-blue-500 rounded"></div>
                    </div>
                    <div className="space-y-1">
                      <div className="w-full h-1 bg-gray-400 rounded"></div>
                      <div className="w-3/4 h-1 bg-gray-300 rounded"></div>
                    </div>
                  </div>
                  
                  {/* Footer */}
                  <div className="bg-white/70 backdrop-blur rounded p-1.5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="w-6 h-1 bg-gray-600 rounded"></div>
                      <div className="w-8 h-1.5 bg-blue-500 rounded-full"></div>
                    </div>
                  </div>
                </div>
                
                {isSelected && (
                  <Badge className="absolute top-2 right-2 bg-primary">
                    <Eye className="h-3 w-3 mr-1" />
                    Selected
                  </Badge>
                )}
              </div>
              
              <div className="p-3 bg-background border-t">
                <h3 className="font-medium text-sm mb-1 truncate">{template.name}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">{template.description}</p>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}