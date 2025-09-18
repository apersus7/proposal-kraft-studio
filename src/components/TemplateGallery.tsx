import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, FileText, Star, Briefcase, Building, Code, Heart, Palette, TrendingUp, Users, Zap, Globe, ShoppingCart, Calendar, GraduationCap, Monitor, Rocket, Settings, Leaf, Scale, Camera, Utensils, Dumbbell, Plane, Music, Paintbrush, Smartphone, Video, Gift, Eye } from 'lucide-react';
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
  business: <Briefcase className="h-4 w-4" />
};

const starterTemplates = [
  {
    name: 'Creative Portfolio Showcase',
    description: 'Stunning visual portfolio design for creative professionals and agencies',
    category: 'creative',
    industry: 'creative',
    tags: ['portfolio', 'design', 'visual'],
    template_data: {
      sections: [
        { type: 'hero', content: 'Bringing your creative vision to life with award-winning design and storytelling that captivates your audience.' },
        { type: 'portfolio_showcase', items: ['Brand identity design collection', 'Digital art and illustrations', 'Photography and visual storytelling', 'Interactive web experiences', 'Motion graphics and animations'] },
        { type: 'creative_process', phases: [
          { phase: 'Inspiration & Concept', duration: '1-2 weeks', description: 'Creative exploration and mood boarding' },
          { phase: 'Design & Development', duration: '3-4 weeks', description: 'Visual creation and refinement' },
          { phase: 'Launch & Promotion', duration: '1 week', description: 'Portfolio launch and social media rollout' }
        ]},
        { type: 'investment', total: '$5,000 - $15,000', payment_terms: 'Creative retainer: 50% to start, 50% on completion' }
      ]
    }
  },
  {
    name: 'Social Media Campaign',
    description: 'Eye-catching social media strategy with vibrant visuals and engaging content',
    category: 'marketing',
    industry: 'marketing',
    tags: ['social media', 'content', 'viral'],
    template_data: {
      sections: [
        { type: 'campaign_vision', content: 'Create scroll-stopping content that builds community, drives engagement, and transforms followers into loyal brand advocates.' },
        { type: 'content_strategy', items: ['Instagram story templates & highlights', 'TikTok video concepts & trends', 'LinkedIn carousel designs', 'Pinterest pin collections', 'YouTube thumbnail designs'] },
        { type: 'content_calendar', phases: [
          { phase: 'Content Planning', duration: '1 week', description: 'Strategy development and content calendar creation' },
          { phase: 'Creative Production', duration: '2-3 weeks', description: 'Visual content creation and copywriting' },
          { phase: 'Campaign Launch', duration: 'Ongoing', description: 'Content publishing and community management' }
        ]},
        { type: 'investment', total: '$3,000 - $8,000', payment_terms: 'Monthly subscription: $1,500-2,500/month' }
      ]
    }
  },
  {
    name: 'Event Experience Design',
    description: 'Memorable event branding and experience design for unforgettable celebrations',
    category: 'events',
    industry: 'events',
    tags: ['events', 'branding', 'experience'],
    template_data: {
      sections: [
        { type: 'event_vision', content: 'Design an immersive event experience that tells your story through every detail, from invitation to farewell gift.' },
        { type: 'design_elements', items: ['Custom invitation suite design', 'Event branding and signage', 'Instagram-worthy photo backdrops', 'Digital touchpoints and apps', 'Gift and merchandise design'] },
        { type: 'event_timeline', phases: [
          { phase: 'Concept & Design', duration: '2-4 weeks', description: 'Theme development and visual identity creation' },
          { phase: 'Production & Setup', duration: '1-2 weeks', description: 'Material production and venue styling' },
          { phase: 'Event Day', duration: '1 day', description: 'Setup, coordination, and breakdown' }
        ]},
        { type: 'investment', total: '$8,000 - $25,000', payment_terms: 'Event payment plan: 40% booking, 40% production, 20% completion' }
      ]
    }
  },
  {
    name: 'Food & Restaurant Branding',
    description: 'Delicious visual identity and marketing for culinary experiences',
    category: 'food',
    industry: 'food',
    tags: ['restaurant', 'branding', 'culinary'],
    template_data: {
      sections: [
        { type: 'brand_story', content: 'Craft a mouthwatering brand identity that makes customers crave your culinary creations before they even taste them.' },
        { type: 'brand_deliverables', items: ['Logo design and brand identity', 'Menu design and food photography', 'Restaurant interior design concepts', 'Social media content templates', 'Packaging and takeout branding'] },
        { type: 'brand_development', phases: [
          { phase: 'Brand Discovery', duration: '1-2 weeks', description: 'Culinary concept and brand positioning' },
          { phase: 'Visual Identity', duration: '2-3 weeks', description: 'Logo, colors, and brand system creation' },
          { phase: 'Brand Application', duration: '2-4 weeks', description: 'Menu, signage, and marketing materials' }
        ]},
        { type: 'investment', total: '$10,000 - $30,000', payment_terms: 'Brand package: 30% start, 40% concepts, 30% final delivery' }
      ]
    }
  },
  {
    name: 'Fitness & Wellness Brand',
    description: 'Energizing brand design for fitness studios, trainers, and wellness coaches',
    category: 'fitness',
    industry: 'fitness',
    tags: ['fitness', 'wellness', 'health'],
    template_data: {
      sections: [
        { type: 'wellness_vision', content: 'Build a motivating brand that inspires transformation and creates a community around health, fitness, and personal growth.' },
        { type: 'brand_system', items: ['Logo and fitness brand identity', 'Workout gear and apparel design', 'Mobile app UI/UX design', 'Social media content strategy', 'Class promotional materials'] },
        { type: 'launch_strategy', phases: [
          { phase: 'Brand Foundation', duration: '2 weeks', description: 'Brand strategy and visual identity development' },
          { phase: 'Digital Presence', duration: '3 weeks', description: 'Website, app, and social media setup' },
          { phase: 'Community Launch', duration: '2 weeks', description: 'Grand opening campaign and member onboarding' }
        ]},
        { type: 'investment', total: '$7,500 - $20,000', payment_terms: 'Fitness brand package: 50% upfront, 50% at launch' }
      ]
    }
  },
  {
    name: 'Fashion Brand Launch',
    description: 'Trendy fashion brand identity with lookbooks and e-commerce design',
    category: 'fashion',
    industry: 'fashion',
    tags: ['fashion', 'lookbook', 'ecommerce'],
    template_data: {
      sections: [
        { type: 'fashion_story', content: 'Create a fashion brand that defines trends, tells stories through style, and builds a loyal community of fashion-forward customers.' },
        { type: 'brand_collection', items: ['Fashion brand identity and logo', 'Lookbook and campaign photography', 'E-commerce website design', 'Social media aesthetic', 'Packaging and label design'] },
        { type: 'collection_launch', phases: [
          { phase: 'Brand Development', duration: '3-4 weeks', description: 'Brand identity and visual direction' },
          { phase: 'Collection Shoot', duration: '1-2 weeks', description: 'Professional photography and content creation' },
          { phase: 'Launch Campaign', duration: '2-3 weeks', description: 'Website launch and promotional campaign' }
        ]},
        { type: 'investment', total: '$15,000 - $40,000', payment_terms: 'Fashion launch package: 40% brand, 30% shoot, 30% launch' }
      ]
    }
  },
  {
    name: 'Travel & Adventure Brand',
    description: 'Wanderlust-inspiring travel brand with stunning destination marketing',
    category: 'travel',
    industry: 'travel',
    tags: ['travel', 'adventure', 'destinations'],
    template_data: {
      sections: [
        { type: 'travel_vision', content: 'Inspire wanderlust and create unforgettable travel experiences through captivating storytelling and breathtaking visual content.' },
        { type: 'travel_content', items: ['Destination brand identity', 'Travel photography and videography', 'Interactive travel guides', 'Social media travel content', 'Travel app design concepts'] },
        { type: 'content_journey', phases: [
          { phase: 'Destination Research', duration: '1-2 weeks', description: 'Location scouting and story development' },
          { phase: 'Content Creation', duration: '2-4 weeks', description: 'Photography, videography, and content production' },
          { phase: 'Campaign Launch', duration: '1-2 weeks', description: 'Multi-platform content distribution' }
        ]},
        { type: 'investment', total: '$12,000 - $35,000', payment_terms: 'Travel campaign: 30% pre-production, 50% production, 20% delivery' }
      ]
    }
  },
  {
    name: 'Music Artist Promotion',
    description: 'Creative music promotion package with album artwork and social presence',
    category: 'music',
    industry: 'music',
    tags: ['music', 'album', 'promotion'],
    template_data: {
      sections: [
        { type: 'artist_story', content: 'Amplify your musical story with visually stunning artwork and strategic promotion that connects with fans and builds your fanbase.' },
        { type: 'music_package', items: ['Album artwork and cover design', 'Music video visual concepts', 'Social media content strategy', 'Fan merchandise design', 'Concert poster and promotional materials'] },
        { type: 'promotion_timeline', phases: [
          { phase: 'Visual Identity', duration: '2-3 weeks', description: 'Album artwork and brand development' },
          { phase: 'Content Creation', duration: '3-4 weeks', description: 'Promotional materials and social content' },
          { phase: 'Release Campaign', duration: '4-6 weeks', description: 'Multi-platform promotion and fan engagement' }
        ]},
        { type: 'investment', total: '$6,000 - $18,000', payment_terms: 'Music promotion: 40% creative, 40% production, 20% campaign' }
      ]
    }
  },
  {
    name: 'Tech Startup Pitch Deck',
    description: 'Modern, investor-ready pitch deck design with stunning data visualization',
    category: 'business',
    industry: 'technology',
    tags: ['startup', 'pitch deck', 'investors'],
    template_data: {
      sections: [
        { type: 'startup_vision', content: 'Tell your startup story with a compelling pitch deck that captures investor attention and communicates your vision with clarity and impact.' },
        { type: 'pitch_elements', items: ['Investor pitch deck design', 'Data visualization and infographics', 'Product mockups and prototypes', 'Financial projection graphics', 'Demo video and presentation'] },
        { type: 'pitch_development', phases: [
          { phase: 'Story Development', duration: '1-2 weeks', description: 'Narrative structure and key messaging' },
          { phase: 'Design & Visuals', duration: '2-3 weeks', description: 'Slide design and visual storytelling' },
          { phase: 'Pitch Preparation', duration: '1 week', description: 'Presentation coaching and final refinements' }
        ]},
        { type: 'investment', total: '$5,000 - $15,000', payment_terms: 'Pitch package: 50% strategy, 50% design completion' }
      ]
    }
  },
  {
    name: 'Lifestyle Brand Identity',
    description: 'Aspirational lifestyle brand with curated aesthetic and premium feel',
    category: 'lifestyle',
    industry: 'lifestyle',
    tags: ['lifestyle', 'premium', 'aesthetic'],
    template_data: {
      sections: [
        { type: 'lifestyle_vision', content: 'Create an aspirational lifestyle brand that resonates with your target audience and embodies the premium experience you provide.' },
        { type: 'brand_experience', items: ['Premium brand identity design', 'Lifestyle photography direction', 'Packaging and product design', 'Curated social media aesthetic', 'Brand storytelling and content'] },
        { type: 'brand_journey', phases: [
          { phase: 'Brand Strategy', duration: '2-3 weeks', description: 'Brand positioning and visual direction' },
          { phase: 'Identity Creation', duration: '3-4 weeks', description: 'Logo, typography, and brand system' },
          { phase: 'Brand Application', duration: '2-3 weeks', description: 'Touchpoint design and brand guidelines' }
        ]},
        { type: 'investment', total: '$12,000 - $28,000', payment_terms: 'Lifestyle brand: 35% strategy, 40% design, 25% applications' }
      ]
    }
  },
  {
    name: 'Photography Portfolio',
    description: 'Stunning photography portfolio with elegant galleries and client presentation',
    category: 'creative',
    industry: 'photography',
    tags: ['photography', 'portfolio', 'gallery'],
    template_data: {
      sections: [
        { type: 'portfolio_vision', content: 'Showcase your photographic artistry with a stunning portfolio that tells stories, captures emotions, and attracts dream clients.' },
        { type: 'portfolio_features', items: ['Custom portfolio website design', 'Professional photo editing and retouching', 'Client gallery and delivery system', 'Print portfolio and presentation materials', 'Social media photography strategy'] },
        { type: 'portfolio_development', phases: [
          { phase: 'Portfolio Curation', duration: '1-2 weeks', description: 'Image selection and story development' },
          { phase: 'Design & Development', duration: '3-4 weeks', description: 'Website design and gallery creation' },
          { phase: 'Launch & Promotion', duration: '1-2 weeks', description: 'Portfolio launch and marketing strategy' }
        ]},
        { type: 'investment', total: '$4,500 - $12,000', payment_terms: 'Photography package: 40% start, 40% design, 20% launch' }
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
          preview_image_url: `https://images.unsplash.com/photo-${getPreviewImageId(template.industry)}?w=400&h=300&fit=crop&auto=format`,
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

  // Generate preview image IDs based on template type
  const getPreviewImageId = (industry: string) => {
    const imageMap: { [key: string]: string } = {
      creative: '1561070791-2526d30994c5',
      photography: '1606107557083-e25fb8945fb3', 
      events: '1511795409834-ef04bbd61622',
      food: '1565958011703-acc6394b145e',
      fitness: '1571019613454-1cb2f99b2d8b',
      travel: '1469474968028-56623f02e42e',
      music: '1493225457124-a3eb161ffa5f',
      fashion: '1445205170230-053b83016050',
      technology: '1519389950473-47ba0277781c',
      marketing: '1557804506-7e78cb52d225',
      lifestyle: '1512541471553-ac74c8b5e722',
      business: '1507003211169-0a1dd7bf7020'
    };
    return imageMap[industry] || '1507003211169-0a1dd7bf7020';
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="group relative overflow-hidden rounded-xl border bg-card animate-pulse">
            <div className="aspect-[4/5] bg-gradient-to-br from-muted to-muted/50"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted/60 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-background/50 backdrop-blur border-border/50"
          />
        </div>
        <div className="flex gap-3">
          <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
            <SelectTrigger className="w-40 bg-background/50 backdrop-blur border-border/50">
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
            <SelectTrigger className="w-40 bg-background/50 backdrop-blur border-border/50">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTemplates.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <div className="relative">
              <FileText className="h-16 w-16 text-muted-foreground/50 mx-auto mb-6" />
              <div className="absolute -top-2 -right-2 h-6 w-6 bg-primary/20 rounded-full animate-ping" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No templates found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filters to discover templates
            </p>
          </div>
        ) : (
          filteredTemplates.map((template) => {
            const isSelected = selectedTemplate?.id === template.id;
            const isStarter = template.id.startsWith('starter-');
            
            return (
              <div 
                key={template.id}
                className={`group relative overflow-hidden rounded-xl border bg-card cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-2 ${
                  isSelected ? 'ring-2 ring-primary shadow-lg shadow-primary/20' : 'hover:border-primary/50'
                }`}
                onClick={() => onSelectTemplate(template)}
              >
                {/* Template Preview */}
                <div className="aspect-[4/5] relative overflow-hidden bg-gradient-to-br from-primary/5 to-secondary/5">
                  {template.preview_image_url ? (
                    <>
                      <img 
                        src={template.preview_image_url} 
                        alt={template.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300" />
                    </>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 flex items-center justify-center">
                      <FileText className="h-16 w-16 text-muted-foreground/30" />
                    </div>
                  )}
                  
                  {/* Overlay Content */}
                  <div className="absolute inset-0 p-4 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      {isStarter && (
                        <Badge className="bg-primary/90 text-primary-foreground backdrop-blur-sm border-0">
                          <Star className="h-3 w-3 mr-1 fill-current" />
                          Starter
                        </Badge>
                      )}
                      <div className="bg-background/80 backdrop-blur-sm rounded-full p-2 ml-auto">
                        {industryIcons[template.industry as keyof typeof industryIcons] || (
                          <FileText className="h-4 w-4 text-foreground" />
                        )}
                      </div>
                    </div>
                    
                    {/* Template Info */}
                    <div className="space-y-2">
                      <h3 className="text-background font-semibold text-lg leading-tight drop-shadow-sm">
                        {template.name}
                      </h3>
                      <p className="text-background/90 text-sm line-clamp-2 drop-shadow-sm">
                        {template.description}
                      </p>
                      
                      {/* Tags */}
                      {template.tags && template.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {template.tags.slice(0, 2).map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs bg-background/20 text-background backdrop-blur-sm border-0">
                              {tag}
                            </Badge>
                          ))}
                          {template.tags.length > 2 && (
                            <Badge className="text-xs bg-background/20 text-background backdrop-blur-sm border-0">
                              +{template.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="absolute top-3 left-3">
                      <div className="bg-primary text-primary-foreground rounded-full p-1.5">
                        <Eye className="h-4 w-4" />
                      </div>
                    </div>
                  )}
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <Button 
                      size="sm" 
                      variant={isSelected ? "default" : "secondary"}
                      className="shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300"
                    >
                      {isSelected ? 'Selected' : 'Use Template'}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}