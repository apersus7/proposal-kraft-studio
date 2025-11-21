import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Search, FileText, Star, Zap, Building2, Briefcase, TrendingUp, Users, Sparkles, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const logo = '/lovable-uploads/22b8b905-b997-42da-85df-b966b4616f6e.png';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  industry: string;
  tags: string[];
  preview_image_url: string | null;
  preview_color: string | null;
  template_data: any;
  created_at: string;
}

const industries = [
  { value: 'all', label: 'All Industries', icon: Sparkles },
  { value: 'technology', label: 'Technology', icon: Zap },
  { value: 'consulting', label: 'Consulting', icon: Briefcase },
  { value: 'marketing', label: 'Marketing', icon: TrendingUp },
  { value: 'real-estate', label: 'Real Estate', icon: Building2 },
  { value: 'finance', label: 'Finance', icon: TrendingUp },
  { value: 'healthcare', label: 'Healthcare', icon: Users },
  { value: 'general', label: 'General', icon: FileText },
];

const categories = [
  { value: 'all', label: 'All Templates' },
  { value: 'business', label: 'Business' },
  { value: 'sales', label: 'Sales' },
  { value: 'service', label: 'Service' },
  { value: 'project', label: 'Project' },
];

export default function TemplateMarketplace() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [templates, searchQuery, selectedIndustry, selectedCategory]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load templates',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = [...templates];

    if (selectedIndustry !== 'all') {
      filtered = filtered.filter(t => t.industry === selectedIndustry);
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query) ||
        t.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    setFilteredTemplates(filtered);
  };

  const handleUseTemplate = async (template: Template) => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to use templates',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    navigate(`/create-proposal?template=${template.id}`);
  };

  const handlePreview = (template: Template) => {
    setSelectedTemplate(template);
    setPreviewOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => navigate(user ? '/dashboard' : '/')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Link to="/" className="flex items-center space-x-3">
                <img src={logo} alt="ProposalKraft" className="h-8" />
                <span className="text-xl font-bold text-primary">ProposalKraft</span>
              </Link>
            </div>
            <div className="flex items-center space-x-3">
              {user ? (
                <Button onClick={() => navigate('/dashboard')}>Dashboard</Button>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => navigate('/auth')}>Sign In</Button>
                  <Button onClick={() => navigate('/auth')}>Get Started</Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full mb-4">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Template Marketplace
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Browse professional proposal templates designed for your industry. Start winning deals faster with proven formats.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-6">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search templates by name, description, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12"
            />
          </div>

          {/* Industry Filter */}
          <div className="flex flex-wrap gap-2 justify-center">
            {industries.map((industry) => {
              const Icon = industry.icon;
              return (
                <Button
                  key={industry.value}
                  variant={selectedIndustry === industry.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedIndustry(industry.value)}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {industry.label}
                </Button>
              );
            })}
          </div>

          {/* Category Tabs */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
            <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-5">
              {categories.map((cat) => (
                <TabsTrigger key={cat.value} value={cat.value}>
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Results Count */}
        <div className="mb-6 text-center">
          <p className="text-muted-foreground">
            Showing {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Templates Grid */}
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse overflow-hidden">
                <div className="h-48 bg-gradient-to-br from-primary/20 to-accent/20"></div>
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-muted rounded w-full mb-2"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <div className="h-9 bg-muted rounded flex-1"></div>
                    <div className="h-9 bg-muted rounded flex-1"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredTemplates.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No templates found</h3>
              <p className="text-muted-foreground text-center max-w-sm mb-6">
                Try adjusting your filters or search query to find more templates.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedIndustry('all');
                  setSelectedCategory('all');
                }}
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.map((template) => (
              <Card
                key={template.id}
                className="group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border-2 hover:border-primary/50"
              >
                <div
                  className={`relative h-48 bg-gradient-to-br ${template.preview_color || 'from-primary/20 to-accent/20'} flex items-center justify-center overflow-hidden`}
                  onClick={() => handlePreview(template)}
                >
                  {template.preview_image_url ? (
                    <img
                      src={template.preview_image_url}
                      alt={template.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="relative w-full h-full flex items-center justify-center p-6">
                      <div className="absolute inset-0 bg-black/5"></div>
                      <div className="relative z-10 text-center space-y-2">
                        <FileText className="h-16 w-16 mx-auto text-white/90 drop-shadow-lg" />
                        <div className="text-white/90 font-bold text-lg drop-shadow-md">
                          {template.name}
                        </div>
                        <div className="text-white/70 text-sm font-medium drop-shadow">
                          {template.industry}
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-white/90 text-primary">
                      {template.category}
                    </Badge>
                  </div>
                </div>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <CardTitle className="text-xl line-clamp-2 group-hover:text-primary transition-colors font-bold">
                      {template.name}
                    </CardTitle>
                  </div>
                  <CardDescription className="line-clamp-3 text-base">
                    {template.description || 'Professional proposal template'}
                  </CardDescription>
                  {template.tags && template.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {template.tags.slice(0, 4).map((tag, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs font-medium">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="secondary" className="font-medium">
                      {template.industry}
                    </Badge>
                    <span>•</span>
                    <span className="font-medium">{template.category}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handlePreview(template)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-primary hover:bg-primary/90"
                      onClick={() => handleUseTemplate(template)}
                    >
                      <Zap className="h-4 w-4 mr-1" />
                      Use Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedTemplate?.name}</span>
              <Badge>{selectedTemplate?.industry}</Badge>
            </DialogTitle>
            <DialogDescription>
              {selectedTemplate?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {selectedTemplate?.preview_image_url && (
              <div className="rounded-lg overflow-hidden border">
                <img
                  src={selectedTemplate.preview_image_url}
                  alt={selectedTemplate.name}
                  className="w-full"
                />
              </div>
            )}
            
            <div>
              <h4 className="font-semibold mb-2">Template Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Category:</span>{' '}
                  <span className="font-medium">{selectedTemplate?.category}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Industry:</span>{' '}
                  <span className="font-medium">{selectedTemplate?.industry}</span>
                </div>
              </div>
            </div>

            {selectedTemplate?.tags && selectedTemplate.tags.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedTemplate.tags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setPreviewOpen(false)}
              >
                Close
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  setPreviewOpen(false);
                  if (selectedTemplate) handleUseTemplate(selectedTemplate);
                }}
              >
                Use This Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
