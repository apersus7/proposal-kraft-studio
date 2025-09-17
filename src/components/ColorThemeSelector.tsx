import { Check, Palette } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ColorTheme {
  id: string;
  name: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  preview: {
    background: string;
    text: string;
    card: string;
  };
}

const colorThemes: ColorTheme[] = [
  {
    id: 'modern',
    name: 'Modern Blue',
    description: 'Professional blue theme perfect for tech and business',
    primaryColor: '#3b82f6',
    secondaryColor: '#1e40af',
    accentColor: '#60a5fa',
    preview: { background: '#f8fafc', text: '#1e293b', card: '#ffffff' }
  },
  {
    id: 'creative',
    name: 'Creative Purple',
    description: 'Vibrant purple theme for creative and design agencies',
    primaryColor: '#8b5cf6',
    secondaryColor: '#7c3aed',
    accentColor: '#a78bfa',
    preview: { background: '#faf5ff', text: '#581c87', card: '#ffffff' }
  },
  {
    id: 'professional',
    name: 'Professional Gray',
    description: 'Sophisticated gray theme for consulting and finance',
    primaryColor: '#64748b',
    secondaryColor: '#475569',
    accentColor: '#94a3b8',
    preview: { background: '#f8fafc', text: '#1e293b', card: '#ffffff' }
  },
  {
    id: 'healthcare',
    name: 'Healthcare Green',
    description: 'Calming green theme for healthcare and wellness',
    primaryColor: '#10b981',
    secondaryColor: '#059669',
    accentColor: '#34d399',
    preview: { background: '#f0fdf4', text: '#064e3b', card: '#ffffff' }
  },
  {
    id: 'energy',
    name: 'Energy Orange',
    description: 'Bold orange theme for energy and construction',
    primaryColor: '#f97316',
    secondaryColor: '#ea580c',
    accentColor: '#fb923c',
    preview: { background: '#fff7ed', text: '#9a3412', card: '#ffffff' }
  },
  {
    id: 'minimal',
    name: 'Minimal Black',
    description: 'Clean monochrome theme for minimal design',
    primaryColor: '#1f2937',
    secondaryColor: '#111827',
    accentColor: '#6b7280',
    preview: { background: '#f9fafb', text: '#1f2937', card: '#ffffff' }
  }
];

interface ColorThemeSelectorProps {
  selectedTheme: string;
  onThemeSelect: (themeId: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const ColorThemeSelector = ({ selectedTheme, onThemeSelect, onNext, onBack }: ColorThemeSelectorProps) => {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Choose Your Color Theme</h1>
        <p className="text-muted-foreground">
          Select a color theme that best represents your brand and industry
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {colorThemes.map((theme) => (
          <Card 
            key={theme.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedTheme === theme.id 
                ? 'ring-2 ring-primary ring-offset-2 shadow-lg' 
                : 'hover:shadow-md'
            }`}
            onClick={() => onThemeSelect(theme.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    {theme.name}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {theme.description}
                  </CardDescription>
                </div>
                {selectedTheme === theme.id && (
                  <Badge variant="default" className="bg-primary">
                    <Check className="h-3 w-3 mr-1" />
                    Selected
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {/* Theme Preview */}
              <div 
                className="rounded-lg p-4 border" 
                style={{ backgroundColor: theme.preview.background }}
              >
                <div 
                  className="rounded-md p-3 mb-2" 
                  style={{ backgroundColor: theme.preview.card }}
                >
                  <div 
                    className="h-3 rounded mb-2" 
                    style={{ backgroundColor: theme.primaryColor, width: '70%' }}
                  />
                  <div 
                    className="h-2 rounded mb-1" 
                    style={{ backgroundColor: theme.secondaryColor, width: '90%' }}
                  />
                  <div 
                    className="h-2 rounded" 
                    style={{ backgroundColor: theme.accentColor, width: '60%' }}
                  />
                </div>
                
                {/* Color Palette */}
                <div className="flex gap-2 mt-3">
                  <div 
                    className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: theme.primaryColor }}
                    title="Primary Color"
                  />
                  <div 
                    className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: theme.secondaryColor }}
                    title="Secondary Color"
                  />
                  <div 
                    className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: theme.accentColor }}
                    title="Accent Color"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-4">
        <Button variant="outline" onClick={onBack}>
          Back to Templates
        </Button>
        <Button 
          onClick={onNext}
          disabled={!selectedTheme}
          className="flex items-center gap-2"
        >
          Continue to Details
        </Button>
      </div>
    </div>
  );
};