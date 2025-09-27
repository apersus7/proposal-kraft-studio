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

// Professional business proposal templates based on industry-standard designs
const starterTemplates = [
  {
    name: 'Modern Digital Agency',
    description: 'Professional digital marketing proposal with comprehensive sections',
    category: 'business',
    industry: 'marketing',
    tags: ['digital', 'marketing', 'professional', 'comprehensive'],
    preview_color: 'from-blue-50 via-indigo-50 to-purple-50',
    template_data: {
      sections: [
        {
          type: 'cover_page',
          title: 'Digital Marketing Transformation Initiative',
          subtitle: 'Prepared for: [Client Name]',
          company: '[Your Agency Name]',
          date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        },
        {
          type: 'about_us',
          title: 'About Our Agency',
          content: 'We are a leading digital marketing agency with over 8 years of experience helping businesses transform their online presence. Our team of certified professionals specializes in SEO, social media marketing, content creation, and performance analytics to deliver exceptional results for our clients.',
          contact: {
            address: '123 Anywhere St., Any City, ST 12345',
            website: 'www.reallygreatsite.com',
            email: 'hello@reallygreatsite.com'
          }
        },
        {
          type: 'executive_summary',
          title: 'Executive Summary',
          content: 'The Digital Marketing Transformation Initiative aims to enhance your company\'s online presence, improve customer engagement, and drive higher conversion rates through a comprehensive strategy. This project will utilize data-driven approaches, cutting-edge tools, and targeted campaigns to achieve measurable results that align with your growth objectives.'
        },
        {
          type: 'what_we_do',
          title: 'What We Do',
          services: [
            { name: 'Strategic & Visual Branding', description: 'Comprehensive brand development and visual identity creation' },
            { name: 'Social Media Management', description: 'Full-service social media strategy and content creation' },
            { name: 'SEO & Content Marketing', description: 'Search engine optimization and high-quality content development' },
            { name: 'Digital Campaign & Ads', description: 'Targeted advertising campaigns across multiple platforms' }
          ]
        },
        {
          type: 'objectives',
          title: 'Project Objectives',
          items: [
            'Increase website traffic by 30% within six months',
            'Boost social media engagement rates by 25% in the next quarter',
            'Achieve a 20% improvement in lead conversion rates by the end of Q3',
            'Enhance brand visibility through SEO and content marketing strategies'
          ]
        },
        {
          type: 'scope_of_work',
          title: 'Scope of Work',
          content: 'Development and execution of comprehensive digital marketing strategy',
          inclusions: [
            'SEO optimization for company website',
            'Social media management and advertising',
            'Email marketing campaigns',
            'Content creation (blogs, videos, infographics)',
            'Performance analytics and monthly reporting'
          ],
          exclusions: [
            'Offline marketing activities',
            'Development of new software platforms',
            'Print media design and production'
          ]
        },
        {
          type: 'methodology',
          title: 'Our Methodology',
          phases: [
            { phase: '01 Planning', description: 'Conduct audit of current digital assets and identify opportunities' },
            { phase: '02 Strategy Development', description: 'Create tailored digital marketing plan based on audit findings' },
            { phase: '03 Execution', description: 'Implement SEO strategies, launch ad campaigns, and publish content' },
            { phase: '04 Monitoring', description: 'Track performance metrics and adjust strategies as needed' },
            { phase: '05 Evaluation', description: 'Assess project outcomes against predefined KPIs' }
          ]
        },
        {
          type: 'timeline',
          title: 'Project Timeline',
          phases: [
            { phase: 'Planning', duration: '2 weeks', milestones: 'Strategy audit complete' },
            { phase: 'Strategy Development', duration: '2 weeks', milestones: 'Marketing plan finalized' },
            { phase: 'Execution', duration: '16 weeks', milestones: 'Monthly performance reviews' },
            { phase: 'Monitoring & Optimization', duration: '4 weeks', milestones: 'Final report delivered' }
          ]
        },
        {
          type: 'meet_our_team',
          title: 'Meet Our Team',
          content: 'Our experienced team combines strategic thinking with creative execution to deliver exceptional results.',
          team_members: [
            { name: 'Sarah Johnson', role: 'Digital Strategy Director', description: 'Strategic planning and campaign optimization expert with 10+ years experience' },
            { name: 'Michael Chen', role: 'Creative Director', description: 'Award-winning designer specializing in brand identity and digital experiences' },
            { name: 'Emma Rodriguez', role: 'Analytics Manager', description: 'Data-driven marketer focused on performance optimization and ROI measurement' }
          ]
        },
        {
          type: 'investment',
          title: 'Investment',
          packages: [
            { name: 'Strategy & Setup', price: '$5,000', description: 'Initial audit and strategy development' },
            { name: 'Monthly Management', price: '$3,500', description: 'Ongoing campaign management and optimization' },
            { name: 'Content Creation', price: '$2,000', description: 'Monthly content and creative assets' }
          ],
          total: '$10,500/month'
        }
      ]
    }
  },
  {
    name: 'Corporate Consulting',
    description: 'Sophisticated template for business consulting and strategy projects',
    category: 'business',
    industry: 'consulting',
    tags: ['consulting', 'corporate', 'strategy', 'professional'],
    preview_color: 'from-slate-50 via-gray-50 to-zinc-50',
    template_data: {
      sections: [
        {
          type: 'cover_page',
          title: 'Business Strategy Consulting Proposal',
          subtitle: 'Strategic Growth Initiative',
          company: '[Consulting Firm Name]',
          date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        },
        {
          type: 'about_us',
          title: 'About Our Firm',
          content: 'We are a premier management consulting firm with 15+ years of experience helping Fortune 500 companies and growing businesses achieve breakthrough performance. Our team of senior consultants brings expertise across strategy, operations, and organizational transformation.',
          contact: {
            address: '123 Anywhere St., Any City, ST 12345',
            website: 'www.reallygreatsite.com',
            email: 'hello@reallygreatsite.com'
          }
        },
        {
          type: 'executive_summary',
          title: 'Executive Summary',
          content: 'Our comprehensive business strategy consulting engagement is designed to identify growth opportunities, optimize operational efficiency, and develop actionable strategies that drive sustainable competitive advantage. We combine deep industry expertise with proven methodologies to deliver transformational results.'
        },
        {
          type: 'what_we_do',
          title: 'Consulting Services',
          services: [
            { name: 'Market Analytics', description: 'Comprehensive market research and competitive intelligence' },
            { name: 'Business Planning', description: 'Strategic planning and roadmap development' },
            { name: 'Operations Optimization', description: 'Process improvement and efficiency enhancement' },
            { name: 'Change Management', description: 'Organizational transformation and change leadership' }
          ]
        },
        {
          type: 'objectives',
          title: 'Engagement Objectives',
          items: [
            'Develop comprehensive 3-year strategic plan',
            'Identify and quantify growth opportunities worth $10M+',
            'Optimize operational processes to reduce costs by 15%',
            'Build organizational capabilities for sustained growth',
            'Create implementation roadmap with clear milestones'
          ]
        },
        {
          type: 'methodology',
          title: 'Our Approach',
          phases: [
            { phase: '01 Discovery', description: 'Comprehensive assessment of current state and market position' },
            { phase: '02 Analysis', description: 'Deep dive into opportunities, challenges, and competitive landscape' },
            { phase: '03 Strategy Design', description: 'Develop strategic options and recommend optimal path forward' },
            { phase: '04 Planning', description: 'Create detailed implementation plan with timelines and resources' },
            { phase: '05 Implementation Support', description: 'Provide ongoing support during initial execution phase' }
          ]
        },
        {
          type: 'timeline',
          title: 'Project Timeline',
          phases: [
            { phase: 'Discovery & Assessment', duration: '3 weeks', milestones: 'Current state analysis complete' },
            { phase: 'Strategic Analysis', duration: '4 weeks', milestones: 'Opportunity assessment delivered' },
            { phase: 'Strategy Development', duration: '3 weeks', milestones: 'Strategic recommendations finalized' },
            { phase: 'Implementation Planning', duration: '2 weeks', milestones: 'Detailed roadmap completed' }
          ]
        },
        {
          type: 'meet_our_team',
          title: 'Meet Our Team',
          content: 'Our senior consultants bring decades of experience from leading consulting firms and Fortune 500 companies.',
          team_members: [
            { name: 'David Wilson', role: 'Managing Partner', description: 'Former McKinsey partner with 20+ years in strategic consulting' },
            { name: 'Lisa Park', role: 'Operations Director', description: 'Process optimization expert with extensive Six Sigma experience' },
            { name: 'Robert Taylor', role: 'Change Management Lead', description: 'Organizational transformation specialist with proven track record' }
          ]
        },
        {
          type: 'investment',
          title: 'Investment',
          packages: [
            { name: 'Discovery Phase', price: '$45,000', description: 'Comprehensive assessment and analysis' },
            { name: 'Strategy Development', price: '$65,000', description: 'Strategic planning and recommendations' },
            { name: 'Implementation Support', price: '$25,000', description: '3-month implementation guidance' }
          ],
          total: '$135,000'
        }
      ]
    }
  },
  {
    name: 'Creative Agency Premium',
    description: 'Vibrant template for creative and design agencies',
    category: 'creative',
    industry: 'design',
    tags: ['creative', 'design', 'branding', 'premium'],
    preview_color: 'from-purple-50 via-pink-50 to-rose-50',
    template_data: {
      sections: [
        {
          type: 'cover_page',
          title: 'Brand Identity & Creative Services Proposal',
          subtitle: 'Prepared for: [Client Name]',
          company: '[Creative Agency Name]',
          date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        },
        {
          type: 'about_us',
          title: 'About Our Agency',
          content: 'We are an award-winning creative agency with a passion for exceptional design and strategic brand development. Our diverse team of designers, strategists, and creative directors has helped over 200 brands establish their unique identity and achieve market success.',
          contact: {
            address: '123 Anywhere St., Any City, ST 12345',
            website: 'www.reallygreatsite.com',
            email: 'hello@reallygreatsite.com'
          }
        },
        {
          type: 'executive_summary',
          title: 'Creative Vision',
          content: 'We specialize in creating compelling brand identities that resonate with your target audience and drive business growth. Our comprehensive creative services combine strategic thinking with exceptional design to deliver memorable brand experiences across all touchpoints.'
        },
        {
          type: 'what_we_do',
          title: 'Creative Services',
          services: [
            { name: 'Brand Strategy & Identity', description: 'Complete brand development from strategy to visual identity' },
            { name: 'Logo & Visual Design', description: 'Distinctive logo design and comprehensive visual systems' },
            { name: 'Digital Design', description: 'Website design, UI/UX, and digital brand applications' },
            { name: 'Marketing Materials', description: 'Print and digital collateral, packaging, and promotional materials' }
          ]
        },
        {
          type: 'objectives',
          title: 'Project Goals',
          items: [
            'Develop distinctive brand identity that stands out in the market',
            'Create cohesive visual system across all brand touchpoints',
            'Design responsive website that converts visitors to customers',
            'Establish brand guidelines for consistent future applications',
            'Deliver launch-ready marketing materials and digital assets'
          ]
        },
        {
          type: 'methodology',
          title: 'Creative Process',
          phases: [
            { phase: '01 Discovery', description: 'Brand workshop, market research, and competitive analysis' },
            { phase: '02 Strategy', description: 'Brand positioning, messaging, and creative direction development' },
            { phase: '03 Design', description: 'Logo concepts, visual identity, and brand system creation' },
            { phase: '04 Application', description: 'Website design, marketing materials, and brand implementation' },
            { phase: '05 Launch', description: 'Final delivery, brand guidelines, and launch support' }
          ]
        },
        {
          type: 'timeline',
          title: 'Project Timeline',
          phases: [
            { phase: 'Discovery & Strategy', duration: '2 weeks', milestones: 'Brand strategy approved' },
            { phase: 'Logo & Identity Design', duration: '3 weeks', milestones: 'Final logo selected' },
            { phase: 'Brand System Development', duration: '2 weeks', milestones: 'Visual identity complete' },
            { phase: 'Website & Applications', duration: '4 weeks', milestones: 'All deliverables finalized' }
          ]
        },
        {
          type: 'meet_our_team',
          title: 'Meet Our Team',
          content: 'Our award-winning creative team combines artistic vision with strategic thinking to deliver exceptional brand experiences.',
          team_members: [
            { name: 'Jessica Martinez', role: 'Creative Director', description: 'Award-winning designer with 15+ years in brand identity and creative strategy' },
            { name: 'Alex Thompson', role: 'Brand Strategist', description: 'Strategic thinker specializing in brand positioning and market analysis' },
            { name: 'Maya Patel', role: 'Digital Designer', description: 'Expert in digital experiences, UI/UX design, and interactive brand applications' }
          ]
        },
        {
          type: 'investment',
          title: 'Creative Investment',
          packages: [
            { name: 'Brand Strategy & Logo', price: '$15,000', description: 'Complete brand development and logo design' },
            { name: 'Visual Identity System', price: '$10,000', description: 'Comprehensive brand guidelines and assets' },
            { name: 'Website Design', price: '$25,000', description: 'Custom website design and development' },
            { name: 'Marketing Materials', price: '$8,000', description: 'Business cards, brochures, and digital assets' }
          ],
          total: '$58,000'
        }
      ]
    }
  },
  {
    name: 'Technology Solutions',
    description: 'Modern template for software development and IT services',
    category: 'technology',
    industry: 'software',
    tags: ['technology', 'software', 'development', 'IT'],
    preview_color: 'from-green-50 via-emerald-50 to-teal-50',
    template_data: {
      sections: [
        {
          type: 'cover_page',
          title: 'Custom Software Development Proposal',
          subtitle: 'Digital Transformation Solution',
          company: '[Technology Company Name]',
          date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        },
        {
          type: 'about_us',
          title: 'About Our Company',
          content: 'We are a leading software development company specializing in custom applications, enterprise solutions, and digital transformation. With 12+ years of experience and over 500 successful projects, we help businesses leverage technology to achieve their strategic objectives.',
          contact: {
            address: '123 Anywhere St., Any City, ST 12345',
            website: 'www.reallygreatsite.com',
            email: 'hello@reallygreatsite.com'
          }
        },
        {
          type: 'executive_summary',
          title: 'Technical Overview',
          content: 'Our custom software development proposal outlines a comprehensive solution designed to streamline your business processes, improve operational efficiency, and provide scalable technology infrastructure. We leverage cutting-edge technologies and agile development methodologies to deliver robust, user-friendly applications.'
        },
        {
          type: 'what_we_do',
          title: 'Technology Services',
          services: [
            { name: 'Custom Application Development', description: 'Tailored software solutions built to your specifications' },
            { name: 'Enterprise Integration', description: 'Seamless integration with existing systems and workflows' },
            { name: 'Cloud Solutions', description: 'Scalable cloud-based applications and infrastructure' },
            { name: 'Mobile Development', description: 'Native and cross-platform mobile applications' }
          ]
        },
        {
          type: 'objectives',
          title: 'Technical Objectives',
          items: [
            'Develop custom CRM system to manage customer relationships',
            'Integrate with existing ERP and accounting systems',
            'Implement automated reporting and analytics dashboard',
            'Create mobile app for field team access and data collection',
            'Ensure scalable architecture supporting 10,000+ users'
          ]
        },
        {
          type: 'methodology',
          title: 'Development Methodology',
          phases: [
            { phase: '01 Requirements Analysis', description: 'Detailed requirements gathering and technical specification' },
            { phase: '02 System Design', description: 'Architecture design, database schema, and UI/UX mockups' },
            { phase: '03 Development', description: 'Agile development with bi-weekly sprints and demos' },
            { phase: '04 Testing & QA', description: 'Comprehensive testing, bug fixes, and performance optimization' },
            { phase: '05 Deployment', description: 'Production deployment, training, and ongoing support' }
          ]
        },
        {
          type: 'timeline',
          title: 'Development Timeline',
          phases: [
            { phase: 'Requirements & Design', duration: '4 weeks', milestones: 'Technical specifications approved' },
            { phase: 'Core Development', duration: '12 weeks', milestones: 'MVP ready for testing' },
            { phase: 'Testing & Refinement', duration: '3 weeks', milestones: 'All bugs resolved' },
            { phase: 'Deployment & Training', duration: '2 weeks', milestones: 'System live and team trained' }
          ]
        },
        {
          type: 'meet_our_team',
          title: 'Meet Our Team',
          content: 'Our technical team combines deep engineering expertise with business acumen to deliver solutions that drive results.',
          team_members: [
            { name: 'Thomas Zhang', role: 'Technical Director', description: 'Full-stack architect with expertise in scalable enterprise solutions' },
            { name: 'Rachel Green', role: 'Project Manager', description: 'Agile project management expert ensuring on-time, on-budget delivery' },
            { name: 'Kevin Liu', role: 'Lead Developer', description: 'Senior developer specializing in modern web technologies and cloud platforms' }
          ]
        },
        {
          type: 'investment',
          title: 'Development Investment',
          packages: [
            { name: 'Analysis & Design', price: '$25,000', description: 'Requirements analysis and system design' },
            { name: 'Core Development', price: '$85,000', description: 'Full application development and testing' },
            { name: 'Deployment & Support', price: '$15,000', description: 'Launch support and 3-month warranty' }
          ],
          total: '$125,000'
        }
      ]
    }
  },
  {
    name: 'Professional Services',
    description: 'Clean template for legal, accounting, and professional service firms',
    category: 'professional',
    industry: 'services',
    tags: ['legal', 'professional', 'consulting', 'services'],
    preview_color: 'from-gray-50 via-blue-50 to-slate-50',
    template_data: {
      sections: [
        {
          type: 'cover_page',
          title: 'Professional Services Engagement Proposal',
          subtitle: 'Comprehensive Legal Advisory Services',
          company: '[Professional Services Firm]',
          date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        },
        {
          type: 'about_us',
          title: 'About Our Firm',
          content: 'Established in 1995, we are a full-service professional services firm with deep expertise in corporate law, compliance, and business advisory services. Our team of partners and associates has successfully guided hundreds of companies through critical legal and business challenges.',
          contact: {
            address: '123 Anywhere St., Any City, ST 12345',
            website: 'www.reallygreatsite.com',
            email: 'hello@reallygreatsite.com'
          }
        },
        {
          type: 'executive_summary',
          title: 'Engagement Overview',
          content: 'We are pleased to present our proposal for comprehensive legal advisory services to support your business objectives. Our experienced team will provide strategic counsel, regulatory compliance support, and transactional expertise to help navigate complex legal challenges and opportunities.'
        },
        {
          type: 'what_we_do',
          title: 'Service Areas',
          services: [
            { name: 'Corporate Law', description: 'Entity formation, governance, and corporate transactions' },
            { name: 'Regulatory Compliance', description: 'Industry regulations, licensing, and compliance programs' },
            { name: 'Contract Management', description: 'Contract drafting, review, and negotiation services' },
            { name: 'Risk Management', description: 'Legal risk assessment and mitigation strategies' }
          ]
        },
        {
          type: 'objectives',
          title: 'Engagement Objectives',
          items: [
            'Provide ongoing legal counsel for business operations',
            'Ensure full compliance with industry regulations',
            'Support M&A activities and corporate transactions',
            'Develop comprehensive contract templates and policies',
            'Establish proactive legal risk management framework'
          ]
        },
        {
          type: 'methodology',
          title: 'Service Approach',
          phases: [
            { phase: '01 Assessment', description: 'Comprehensive review of current legal and compliance status' },
            { phase: '02 Strategy', description: 'Develop legal strategy aligned with business objectives' },
            { phase: '03 Implementation', description: 'Execute legal initiatives and compliance programs' },
            { phase: '04 Monitoring', description: 'Ongoing monitoring and advisory support' },
            { phase: '05 Optimization', description: 'Continuous improvement of legal processes and policies' }
          ]
        },
        {
          type: 'timeline',
          title: 'Engagement Timeline',
          phases: [
            { phase: 'Initial Assessment', duration: '2 weeks', milestones: 'Legal audit complete' },
            { phase: 'Strategy Development', duration: '1 week', milestones: 'Legal strategy finalized' },
            { phase: 'Ongoing Services', duration: 'Ongoing', milestones: 'Monthly progress reviews' },
            { phase: 'Quarterly Reviews', duration: 'Quarterly', milestones: 'Strategy updates and reporting' }
          ]
        },
        {
          type: 'meet_our_team',
          title: 'Meet Our Team',
          content: 'Our experienced legal professionals provide strategic counsel and practical solutions for complex business challenges.',
          team_members: [
            { name: 'Patricia Adams', role: 'Managing Partner', description: 'Corporate law expert with 25+ years experience in business transactions' },
            { name: 'James Foster', role: 'Compliance Director', description: 'Regulatory compliance specialist with deep industry knowledge' },
            { name: 'Maria Santos', role: 'Senior Associate', description: 'Contract and risk management expert with Fortune 500 experience' }
          ]
        },
        {
          type: 'investment',
          title: 'Professional Fees',
          packages: [
            { name: 'Initial Assessment', price: '$15,000', description: 'Comprehensive legal and compliance audit' },
            { name: 'Monthly Retainer', price: '$8,500', description: 'Ongoing legal counsel and support' },
            { name: 'Transactional Work', price: 'Hourly', description: 'M&A, contracts, and special projects at $450/hour' }
          ],
          total: '$8,500/month + project fees'
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