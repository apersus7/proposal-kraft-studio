import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, FileText, Star, Briefcase, Building, Code, Heart, Palette, TrendingUp, Users, Zap, Globe, ShoppingCart, Calendar, GraduationCap, Monitor, Rocket, Settings, Leaf, Scale, Camera, Utensils, Dumbbell, Plane, Music, Paintbrush, Smartphone, Video, Gift } from 'lucide-react';
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