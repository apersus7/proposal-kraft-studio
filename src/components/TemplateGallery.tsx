import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, FileText, Star, Briefcase, Building, Code, Heart, Palette, TrendingUp, Users, Zap, Globe, ShoppingCart, Calendar, GraduationCap, Monitor, Rocket, Settings, Leaf, Scale, Camera, Utensils, Dumbbell, Plane, Music, Paintbrush, Smartphone, Video, Gift, Eye, Play } from 'lucide-react';
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

const starterTemplates = [
  {
    name: 'Creative Agency',
    description: 'Modern design proposal for creative agencies and studios',
    category: 'creative',
    industry: 'creative', 
    tags: ['design', 'branding', 'creative'],
    preview_color: 'from-purple-500 to-pink-500',
    template_data: {
      sections: [
        { type: 'hero', content: 'Transform your brand with creative excellence that captivates and converts.' },
        { type: 'services', items: ['Brand Identity Design', 'Digital Marketing', 'Creative Strategy', 'Visual Storytelling'] },
        { type: 'process', phases: [
          { phase: 'Discovery', duration: '1 week', description: 'Brand research and strategy' },
          { phase: 'Creative Development', duration: '2-3 weeks', description: 'Design and content creation' },
          { phase: 'Launch', duration: '1 week', description: 'Implementation and delivery' }
        ]},
        { type: 'investment', total: '$8,000 - $25,000', payment_terms: '50% upfront, 50% on completion' }
      ]
    }
  },
  {
    name: 'Marketing Campaign',
    description: 'High-converting marketing proposal for campaigns and strategy',
    category: 'marketing',
    industry: 'marketing',
    tags: ['marketing', 'campaigns', 'strategy'],
    preview_color: 'from-blue-500 to-cyan-500',
    template_data: {
      sections: [
        { type: 'campaign_vision', content: 'Drive measurable results with strategic marketing that converts.' },
        { type: 'strategy', items: ['Social Media Marketing', 'Content Creation', 'Paid Advertising', 'Analytics & Reporting'] },
        { type: 'timeline', phases: [
          { phase: 'Strategy', duration: '1 week', description: 'Campaign planning and setup' },
          { phase: 'Execution', duration: '4-8 weeks', description: 'Campaign launch and optimization' },
          { phase: 'Analysis', duration: '1 week', description: 'Performance review and reporting' }
        ]},
        { type: 'investment', total: '$5,000 - $15,000', payment_terms: '40% upfront, 60% on milestones' }
      ]
    }
  },
  {
    name: 'Web Development',
    description: 'Professional web development proposal for modern websites',
    category: 'technology',
    industry: 'technology',
    tags: ['website', 'development', 'tech'],
    preview_color: 'from-green-500 to-teal-500',
    template_data: {
      sections: [
        { type: 'project_vision', content: 'Build a cutting-edge website that drives business growth and user engagement.' },
        { type: 'deliverables', items: ['Responsive Web Design', 'Custom Development', 'Content Management', 'SEO Optimization'] },
        { type: 'development_phases', phases: [
          { phase: 'Planning', duration: '1-2 weeks', description: 'Requirements and architecture' },
          { phase: 'Development', duration: '4-8 weeks', description: 'Frontend and backend development' },
          { phase: 'Launch', duration: '1 week', description: 'Testing and deployment' }
        ]},
        { type: 'investment', total: '$10,000 - $30,000', payment_terms: '30% start, 50% development, 20% completion' }
      ]
    }
  },
  {
    name: 'Business Consulting',
    description: 'Strategic consulting proposal for business transformation',
    category: 'consulting',
    industry: 'business',
    tags: ['consulting', 'strategy', 'business'],
    preview_color: 'from-orange-500 to-red-500',
    template_data: {
      sections: [
        { type: 'consulting_approach', content: 'Transform your business with strategic insights and actionable solutions.' },
        { type: 'services', items: ['Business Strategy', 'Process Optimization', 'Digital Transformation', 'Performance Analytics'] },
        { type: 'engagement_phases', phases: [
          { phase: 'Assessment', duration: '2 weeks', description: 'Current state analysis' },
          { phase: 'Strategy Development', duration: '3-4 weeks', description: 'Solution design and planning' },
          { phase: 'Implementation', duration: '8-12 weeks', description: 'Execution and optimization' }
        ]},
        { type: 'investment', total: '$15,000 - $50,000', payment_terms: '25% engagement, 50% milestones, 25% completion' }
      ]
    }
  },
  {
    name: 'E-commerce Store',
    description: 'Complete e-commerce solution for online retail success',
    category: 'ecommerce',
    industry: 'retail',
    tags: ['ecommerce', 'online store', 'retail'],
    preview_color: 'from-indigo-500 to-purple-500',
    template_data: {
      sections: [
        { type: 'ecommerce_vision', content: 'Launch a profitable online store that converts visitors into customers.' },
        { type: 'features', items: ['Custom Store Design', 'Product Management', 'Payment Integration', 'Inventory System'] },
        { type: 'development_phases', phases: [
          { phase: 'Store Setup', duration: '2 weeks', description: 'Platform configuration and design' },
          { phase: 'Product Catalog', duration: '2-3 weeks', description: 'Product uploads and optimization' },
          { phase: 'Testing & Launch', duration: '1 week', description: 'Quality assurance and go-live' }
        ]},
        { type: 'investment', total: '$12,000 - $35,000', payment_terms: '40% start, 40% development, 20% launch' }
      ]
    }
  },
  {
    name: 'Mobile App Development',
    description: 'Native mobile app development for iOS and Android',
    category: 'technology',
    industry: 'technology',
    tags: ['mobile app', 'ios', 'android'],
    preview_color: 'from-pink-500 to-rose-500',
    template_data: {
      sections: [
        { type: 'app_vision', content: 'Create a powerful mobile app that engages users and drives business growth.' },
        { type: 'features', items: ['Native iOS/Android Development', 'User Interface Design', 'Backend Integration', 'App Store Optimization'] },
        { type: 'development_timeline', phases: [
          { phase: 'Design & Planning', duration: '2-3 weeks', description: 'UX/UI design and technical planning' },
          { phase: 'Development', duration: '8-16 weeks', description: 'Native app development and testing' },
          { phase: 'Launch', duration: '1-2 weeks', description: 'App store submission and marketing' }
        ]},
        { type: 'investment', total: '$25,000 - $75,000', payment_terms: '30% start, 50% milestones, 20% completion' }
      ]
    }
  },
  {
    name: 'Content Creation',
    description: 'Comprehensive content strategy and creation services',
    category: 'content',
    industry: 'marketing',
    tags: ['content', 'copywriting', 'social media'],
    preview_color: 'from-yellow-500 to-orange-500',
    template_data: {
      sections: [
        { type: 'content_strategy', content: 'Engage your audience with compelling content that drives results.' },
        { type: 'deliverables', items: ['Blog Content', 'Social Media Posts', 'Email Campaigns', 'Video Scripts'] },
        { type: 'content_timeline', phases: [
          { phase: 'Strategy', duration: '1 week', description: 'Content planning and calendar' },
          { phase: 'Creation', duration: '4-6 weeks', description: 'Content production and optimization' },
          { phase: 'Distribution', duration: 'Ongoing', description: 'Publishing and engagement' }
        ]},
        { type: 'investment', total: '$4,000 - $12,000', payment_terms: '50% upfront, 50% on delivery' }
      ]
    }
  },
  {
    name: 'Brand Identity',
    description: 'Complete brand identity design and style guide',
    category: 'creative',
    industry: 'branding',
    tags: ['branding', 'logo', 'identity'],
    preview_color: 'from-violet-500 to-purple-500',
    template_data: {
      sections: [
        { type: 'brand_vision', content: 'Build a memorable brand that stands out and connects with your audience.' },
        { type: 'deliverables', items: ['Logo Design', 'Brand Guidelines', 'Color Palette', 'Typography System'] },
        { type: 'brand_phases', phases: [
          { phase: 'Discovery', duration: '1 week', description: 'Brand research and positioning' },
          { phase: 'Design', duration: '2-3 weeks', description: 'Logo and identity creation' },
          { phase: 'Finalization', duration: '1 week', description: 'Guidelines and asset delivery' }
        ]},
        { type: 'investment', total: '$6,000 - $18,000', payment_terms: '50% start, 50% completion' }
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
        ...starterTemplates.map((template, index) => ({
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Card key={i} className="group relative overflow-hidden rounded-2xl border bg-card animate-pulse">
            <div className="aspect-[4/5] bg-gradient-to-br from-muted/50 to-muted"></div>
            <div className="absolute bottom-0 left-0 right-0 p-6 space-y-3">
              <div className="h-4 bg-muted-foreground/20 rounded-lg w-3/4"></div>
              <div className="h-3 bg-muted-foreground/10 rounded-lg w-1/2"></div>
            </div>
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
            className="pl-12 h-12 rounded-full border-border/20 bg-card/50 backdrop-blur-sm focus:bg-card transition-colors"
          />
        </div>
        <div className="flex gap-3">
          <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
            <SelectTrigger className="w-44 h-12 rounded-full border-border/20 bg-card/50 backdrop-blur-sm">
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
            <SelectTrigger className="w-44 h-12 rounded-full border-border/20 bg-card/50 backdrop-blur-sm">
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

      {/* Canva-Style Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredTemplates.length === 0 ? (
          <div className="col-span-full text-center py-20">
            <div className="relative">
              <FileText className="h-20 w-20 text-muted-foreground/30 mx-auto mb-6" />
              <div className="absolute -top-1 -right-1 h-6 w-6 bg-primary/20 rounded-full animate-pulse" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-foreground">No templates found</h3>
            <p className="text-muted-foreground text-lg">
              Try adjusting your search or filters to discover templates
            </p>
          </div>
        ) : (
          filteredTemplates.map((template) => {
            const isSelected = selectedTemplate?.id === template.id;
            const isStarter = template.id.startsWith('starter-');
            
            return (
              <Card 
                key={template.id}
                className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2 ${
                  isSelected ? 'ring-2 ring-primary shadow-xl shadow-primary/20 scale-105' : 'hover:border-primary/30'
                }`}
                onClick={() => onSelectTemplate(template)}
              >
                {/* Template Preview */}
                <div className="aspect-[4/5] relative overflow-hidden">
                  {template.preview_image_url ? (
                    <>
                      <img 
                        src={template.preview_image_url} 
                        alt={template.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-70 group-hover:opacity-50 transition-opacity duration-300" />
                    </>
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${template.preview_color || 'from-primary/20 to-secondary/20'} relative`}>
                      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      {/* Abstract shapes for visual interest */}
                      <div className="absolute top-6 right-6 w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm" />
                      <div className="absolute bottom-20 left-6 w-12 h-12 rounded-lg bg-white/15 backdrop-blur-sm rotate-12" />
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <div className="text-6xl text-white/20">
                          {industryIcons[template.industry as keyof typeof industryIcons] || <FileText />}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Top badges */}
                  <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                    {isStarter && (
                      <Badge className="bg-primary/90 text-primary-foreground backdrop-blur-sm border-0 rounded-full px-3 py-1">
                        <Star className="h-3 w-3 mr-1 fill-current" />
                        Popular
                      </Badge>
                    )}
                    <div className="bg-white/10 backdrop-blur-md rounded-full p-3 ml-auto border border-white/20">
                      <div className="text-white">
                        {industryIcons[template.industry as keyof typeof industryIcons] || <FileText className="h-4 w-4" />}
                      </div>
                    </div>
                  </div>
                  
                  {/* Content overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="space-y-3">
                      <h3 className="text-white font-bold text-xl leading-tight">
                        {template.name}
                      </h3>
                      <p className="text-white/90 text-sm line-clamp-2 leading-relaxed">
                        {template.description}
                      </p>
                      
                      {/* Tags */}
                      {template.tags && template.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {template.tags.slice(0, 2).map((tag, index) => (
                            <Badge key={index} className="text-xs bg-white/20 text-white backdrop-blur-sm border-0 rounded-full px-2 py-1">
                              {tag}
                            </Badge>
                          ))}
                          {template.tags.length > 2 && (
                            <Badge className="text-xs bg-white/20 text-white backdrop-blur-sm border-0 rounded-full px-2 py-1">
                              +{template.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Selection indicator */}
                  {isSelected && (
                    <div className="absolute top-4 left-4">
                      <div className="bg-primary text-primary-foreground rounded-full p-2 border-2 border-white/20">
                        <Eye className="h-4 w-4" />
                      </div>
                    </div>
                  )}
                  
                  {/* Hover preview button */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/20 backdrop-blur-sm">
                    <Button 
                      size="lg" 
                      variant={isSelected ? "default" : "secondary"}
                      className="shadow-xl transform scale-90 group-hover:scale-100 transition-transform duration-300 rounded-full px-6 py-3 font-semibold"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {isSelected ? 'Selected' : 'Use Template'}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}