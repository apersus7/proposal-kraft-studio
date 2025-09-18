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
    name: 'One-Page Sales Proposal Template',
    description: 'Concise sales proposal perfect for quick client decisions',
    category: 'sales',
    industry: 'business',
    tags: ['sales', 'one-page', 'quick'],
    preview_color: 'from-slate-100 to-gray-200',
    preview_type: 'document',
    template_data: {
      sections: [
        { type: 'header', content: 'Executive Summary' },
        { type: 'problem', content: 'Challenge identification and impact analysis' },
        { type: 'solution', content: 'Our proven approach to solving your challenges' },
        { type: 'pricing', content: 'Transparent pricing with clear value proposition' }
      ]
    }
  },
  {
    name: 'Business Proposal Template',
    description: 'Comprehensive business proposal for complex projects',
    category: 'business', 
    industry: 'business',
    tags: ['business', 'comprehensive', 'professional'],
    preview_color: 'from-green-50 to-green-100',
    preview_type: 'document',
    template_data: {
      sections: [
        { type: 'cover', content: 'Professional cover page with company branding' },
        { type: 'executive_summary', content: 'Executive overview and key benefits' },
        { type: 'scope', content: 'Detailed project scope and deliverables' },
        { type: 'timeline', content: 'Project timeline and milestones' }
      ]
    }
  },
  {
    name: 'Digital Marketing Proposal',
    description: 'Modern marketing proposal for digital campaigns',
    category: 'marketing',
    industry: 'marketing', 
    tags: ['digital', 'marketing', 'campaigns'],
    preview_color: 'from-blue-50 to-blue-100',
    preview_type: 'document',
    template_data: {
      sections: [
        { type: 'strategy', content: 'Digital marketing strategy and objectives' },
        { type: 'channels', content: 'Multi-channel approach and tactics' },
        { type: 'metrics', content: 'KPIs and success measurements' },
        { type: 'budget', content: 'Campaign budget and ROI projections' }
      ]
    }
  },
  {
    name: 'Conversion Rate Optimization Proposal', 
    description: 'Data-driven CRO proposal with analytics insights',
    category: 'optimization',
    industry: 'marketing',
    tags: ['CRO', 'analytics', 'optimization'],
    preview_color: 'from-purple-50 to-purple-100',
    preview_type: 'document',
    template_data: {
      sections: [
        { type: 'analysis', content: 'Current performance analysis' },
        { type: 'opportunities', content: 'Optimization opportunities identified' },
        { type: 'testing_plan', content: 'A/B testing strategy and timeline' },
        { type: 'projections', content: 'Expected conversion improvements' }
      ]
    }
  },
  {
    name: 'HVAC Proposal Template',
    description: 'Professional HVAC service proposal template',
    category: 'services',
    industry: 'construction',
    tags: ['HVAC', 'construction', 'services'],
    preview_color: 'from-yellow-50 to-yellow-100', 
    preview_type: 'document',
    template_data: {
      sections: [
        { type: 'assessment', content: 'System assessment and recommendations' },
        { type: 'equipment', content: 'Equipment specifications and benefits' },
        { type: 'installation', content: 'Installation process and timeline' },
        { type: 'warranty', content: 'Service warranty and maintenance plans' }
      ]
    }
  },
  {
    name: 'Advertising Sales Proposal Template',
    description: 'Media and advertising sales proposal',
    category: 'advertising',
    industry: 'media',
    tags: ['advertising', 'media', 'sales'],
    preview_color: 'from-cyan-50 to-cyan-100',
    preview_type: 'document', 
    template_data: {
      sections: [
        { type: 'audience', content: 'Target audience analysis and reach' },
        { type: 'packages', content: 'Advertising packages and options' },
        { type: 'creative', content: 'Creative services and support' },
        { type: 'reporting', content: 'Campaign reporting and analytics' }
      ]
    }
  },
  {
    name: 'Mortgage Proposal Template',
    description: 'Professional mortgage and lending proposal',
    category: 'financial',
    industry: 'finance',
    tags: ['mortgage', 'lending', 'financial'],
    preview_color: 'from-orange-50 to-orange-100',
    preview_type: 'document',
    template_data: {
      sections: [
        { type: 'loan_options', content: 'Available loan products and rates' },
        { type: 'qualification', content: 'Qualification requirements and process' },
        { type: 'timeline', content: 'Approval and closing timeline' },
        { type: 'benefits', content: 'Benefits of choosing our services' }
      ]
    }
  },
  {
    name: 'Investor Proposal Template', 
    description: 'Professional investor pitch and funding proposal',
    category: 'investment',
    industry: 'finance',
    tags: ['investor', 'funding', 'pitch'],
    preview_color: 'from-gray-900 to-gray-800',
    preview_type: 'document',
    template_data: {
      sections: [
        { type: 'opportunity', content: 'Investment opportunity overview' },
        { type: 'market', content: 'Market analysis and potential' },
        { type: 'financials', content: 'Financial projections and returns' },
        { type: 'team', content: 'Management team and expertise' }
      ]
    }
  },
  {
    name: 'Android App Development Template',
    description: 'Mobile app development proposal template',
    category: 'technology',
    industry: 'technology',
    tags: ['mobile', 'android', 'development'], 
    preview_color: 'from-blue-500 to-blue-600',
    preview_type: 'document',
    template_data: {
      sections: [
        { type: 'app_concept', content: 'App concept and user experience' },
        { type: 'features', content: 'Core features and functionality' },
        { type: 'development', content: 'Development process and timeline' },
        { type: 'launch', content: 'App store launch and marketing' }
      ]
    }
  },
  {
    name: 'Printing Services Proposal Template',
    description: 'Commercial printing services proposal',
    category: 'services', 
    industry: 'printing',
    tags: ['printing', 'commercial', 'services'],
    preview_color: 'from-amber-50 to-amber-100',
    preview_type: 'document',
    template_data: {
      sections: [
        { type: 'services', content: 'Available printing services and capabilities' },
        { type: 'materials', content: 'Paper stocks and finishing options' },
        { type: 'pricing', content: 'Competitive pricing structure' },
        { type: 'turnaround', content: 'Production timeline and delivery' }
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {/* Blank Document Option */}
        <Card 
          className="group relative overflow-hidden rounded-lg border-2 border-dashed border-muted-foreground/30 bg-background hover:border-primary/50 hover:bg-accent/5 transition-all duration-300 cursor-pointer"
          onClick={() => onSelectTemplate({
            id: 'blank',
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
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
              <svg className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-background">
            <h3 className="font-medium text-sm text-foreground text-center">Blank document</h3>
          </div>
        </Card>

        {filteredTemplates.length === 0 ? (
          <div className="col-span-full text-center py-20">
            <FileText className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2 text-foreground">No templates found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filters to discover templates
            </p>
          </div>
        ) : (
          filteredTemplates.map((template) => {
            const isSelected = selectedTemplate?.id === template.id;
            
            return (
              <Card 
                key={template.id}
                className={`group relative overflow-hidden rounded-lg border transition-all duration-300 cursor-pointer hover:shadow-lg ${
                  isSelected ? 'ring-2 ring-primary shadow-lg' : 'hover:border-primary/30'
                }`}
                onClick={() => onSelectTemplate(template)}
              >
                {/* Document Preview */}
                <div className="aspect-[3/4] relative overflow-hidden bg-white">
                  {template.preview_image_url ? (
                    <img 
                      src={template.preview_image_url} 
                      alt={template.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className={`w-full h-full ${template.preview_color || 'bg-white'} p-3 flex flex-col`}>
                      {/* Document Header */}
                      <div className="mb-3">
                        <div className="h-1 bg-primary/60 w-12 mb-2 rounded-full"></div>
                        <div className="h-3 bg-foreground/80 w-3/4 mb-1 rounded-sm"></div>
                        <div className="h-2 bg-foreground/40 w-1/2 rounded-sm"></div>
                      </div>
                      
                      {/* Document Content Lines */}
                      <div className="space-y-2 flex-1">
                        <div className="space-y-1">
                          <div className="h-1.5 bg-foreground/60 w-full rounded-full"></div>
                          <div className="h-1.5 bg-foreground/60 w-5/6 rounded-full"></div>
                          <div className="h-1.5 bg-foreground/60 w-4/5 rounded-full"></div>
                        </div>
                        
                        {/* Section Divider */}
                        <div className="py-2">
                          <div className="h-2 bg-primary/20 w-16 rounded-sm"></div>
                        </div>
                        
                        {/* More Content */}
                        <div className="space-y-1">
                          <div className="h-1.5 bg-foreground/40 w-full rounded-full"></div>
                          <div className="h-1.5 bg-foreground/40 w-3/4 rounded-full"></div>
                          <div className="h-1.5 bg-foreground/40 w-2/3 rounded-full"></div>
                        </div>
                        
                        {/* Charts/Visual Elements */}
                        {(template.category === 'investment' || template.category === 'business') && (
                          <div className="mt-3 flex gap-1">
                            <div className="w-4 h-6 bg-primary/40 rounded-sm"></div>
                            <div className="w-4 h-4 bg-primary/60 rounded-sm mt-2"></div>
                            <div className="w-4 h-8 bg-primary/80 rounded-sm"></div>
                          </div>
                        )}
                      </div>
                      
                      {/* Footer */}
                      <div className="mt-auto pt-2">
                        <div className="h-1 bg-foreground/20 w-full rounded-full"></div>
                      </div>
                    </div>
                  )}
                  
                  {/* Industry Icon Badge */}
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow-sm">
                    <div className="text-primary">
                      {industryIcons[template.industry as keyof typeof industryIcons] || <FileText className="h-3 w-3" />}
                    </div>
                  </div>
                  
                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="absolute top-2 left-2 bg-primary text-primary-foreground rounded-full p-1">
                      <Eye className="h-3 w-3" />
                    </div>
                  )}
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <Button 
                      size="sm" 
                      variant={isSelected ? "default" : "secondary"}
                      className="shadow-md transform scale-90 group-hover:scale-100 transition-transform duration-200"
                    >
                      {isSelected ? 'Selected' : 'Use Template'}
                    </Button>
                  </div>
                </div>
                
                {/* Template Info */}
                <div className="p-3 bg-background">
                  <h3 className="font-medium text-sm text-foreground line-clamp-2 leading-tight">
                    {template.name}
                  </h3>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}