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

// Beautiful Canva-inspired templates
const starterTemplates = [
  {
    name: 'Modern Minimalist',
    description: 'Clean, minimal design perfect for tech and consulting',
    category: 'business',
    industry: 'technology',
    tags: ['minimal', 'clean', 'modern'],
    preview_color: 'from-slate-50 via-white to-blue-50',
    template_data: {
      sections: [
        { type: 'cover_page', title: 'Project Proposal', tagline: 'Innovative Solutions for Modern Challenges' },
        { type: 'executive_summary', content: 'Executive overview with key value propositions' },
        { type: 'scope_of_work', deliverables: ['Strategy Development', 'Implementation Plan'] },
        { type: 'pricing', packages: [{ name: 'Complete Solution', price: 15000 }] }
      ]
    }
  },
  {
    name: 'Creative Studio',
    description: 'Bold, creative design for agencies and designers',
    category: 'creative',
    industry: 'creative',
    tags: ['creative', 'bold', 'colorful'],
    preview_color: 'from-purple-400 via-pink-500 to-red-500',
    template_data: {
      sections: [
        { type: 'cover_page', title: 'Creative Proposal', tagline: 'Where Ideas Come to Life' },
        { type: 'value_proposition', advantages: ['Unique Creative Vision', 'Award-Winning Team'] }
      ]
    }
  },
  {
    name: 'Corporate Elite',
    description: 'Professional corporate design for enterprise clients',
    category: 'corporate',
    industry: 'business',
    tags: ['corporate', 'professional', 'enterprise'],
    preview_color: 'from-gray-900 via-gray-700 to-blue-900',
    template_data: {
      sections: [
        { type: 'cover_page', title: 'Strategic Proposal', tagline: 'Excellence in Every Detail' }
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

      setTemplates([...starter, ...dbTemplates]);
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
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {/* Blank Document */}
        <Card 
          className="group relative overflow-hidden rounded-lg border-2 border-dashed border-muted-foreground/30 bg-background hover:border-primary/50 transition-all duration-300 cursor-pointer"
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