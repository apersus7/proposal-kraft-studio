import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Palette, Plus, Trash2, Star, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface BrandKit {
  id: string;
  name: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  logo_url: string | null;
  font_primary: string;
  font_secondary: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface BrandKitManagerProps {
  onBrandKitSelect?: (brandKit: BrandKit) => void;
  selectedBrandKit?: BrandKit | null;
  embedded?: boolean;
}

const fontOptions = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Source Sans Pro',
  'Raleway', 'Nunito', 'Poppins', 'Playfair Display', 'Merriweather', 'Georgia'
];

export default function BrandKitManager({ onBrandKitSelect, selectedBrandKit, embedded = false }: BrandKitManagerProps) {
  const { user } = useAuth();
  const [brandKits, setBrandKits] = useState<BrandKit[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    primary_color: '#22c55e',
    secondary_color: '#16a34a',
    accent_color: '#f59e0b',
    font_primary: 'Inter',
    font_secondary: 'Inter',
  });

  useEffect(() => {
    if (user) {
      fetchBrandKits();
    }
  }, [user]);

  const fetchBrandKits = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('brand_kits')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });

      if (error) throw error;
      setBrandKits(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBrandKit = async () => {
    if (!user || !formData.name.trim()) return;
    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('brand_kits')
        .insert({
          user_id: user.id,
          name: formData.name.trim(),
          primary_color: formData.primary_color,
          secondary_color: formData.secondary_color,
          accent_color: formData.accent_color,
          font_primary: formData.font_primary,
          font_secondary: formData.font_secondary,
          is_default: brandKits.length === 0
        })
        .select()
        .single();

      if (error) throw error;
      setBrandKits(prev => [data, ...prev]);
      setFormData({
        name: '',
        primary_color: '#22c55e',
        secondary_color: '#16a34a',
        accent_color: '#f59e0b',
        font_primary: 'Inter',
        font_secondary: 'Inter',
      });

      toast({
        title: "Success",
        description: "Brand kit created successfully!"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create brand kit",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse">Loading brand kits...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Palette className="h-5 w-5" />
            <span>Create Brand Kit</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Brand Kit Name"
          />
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Primary</Label>
              <input
                type="color"
                value={formData.primary_color}
                onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                className="h-10 w-full border rounded cursor-pointer"
              />
            </div>
            <div className="space-y-2">
              <Label>Secondary</Label>
              <input
                type="color"
                value={formData.secondary_color}
                onChange={(e) => setFormData(prev => ({ ...prev, secondary_color: e.target.value }))}
                className="h-10 w-full border rounded cursor-pointer"
              />
            </div>
            <div className="space-y-2">
              <Label>Accent</Label>
              <input
                type="color"
                value={formData.accent_color}
                onChange={(e) => setFormData(prev => ({ ...prev, accent_color: e.target.value }))}
                className="h-10 w-full border rounded cursor-pointer"
              />
            </div>
          </div>
          <Button onClick={handleCreateBrandKit} disabled={creating || !formData.name.trim()}>
            <Plus className="h-4 w-4 mr-2" />
            {creating ? 'Creating...' : 'Create Brand Kit'}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Your Brand Kits</h3>
        {brandKits.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No brand kits yet. Create your first one above!
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {brandKits.map((kit) => (
              <Card 
                key={kit.id} 
                className={`cursor-pointer ${selectedBrandKit?.id === kit.id ? 'ring-2 ring-primary' : ''}`}
                onClick={() => onBrandKitSelect?.(kit)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex space-x-1">
                        <div 
                          className="h-6 w-6 rounded border" 
                          style={{ backgroundColor: kit.primary_color }}
                        />
                        <div 
                          className="h-6 w-6 rounded border" 
                          style={{ backgroundColor: kit.secondary_color }}
                        />
                        <div 
                          className="h-6 w-6 rounded border" 
                          style={{ backgroundColor: kit.accent_color }}
                        />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{kit.name}</h4>
                          {kit.is_default && (
                            <Badge>
                              <Star className="h-3 w-3 mr-1" />
                              Default
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{kit.font_primary}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}