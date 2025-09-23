-- Create templates table for Canva-like template system
CREATE TABLE public.templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'business',
  industry TEXT NOT NULL DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  preview_image_url TEXT,
  preview_color TEXT DEFAULT 'from-white to-gray-50',
  template_data JSONB NOT NULL DEFAULT '{}',
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Create policies for templates
CREATE POLICY "Public templates are viewable by everyone" 
ON public.templates 
FOR SELECT 
USING (is_public = true);

CREATE POLICY "Users can create templates" 
ON public.templates 
FOR INSERT 
WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "Users can update their own templates" 
ON public.templates 
FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own templates" 
ON public.templates 
FOR DELETE 
USING (auth.uid() = created_by);

-- Create storage bucket for template assets
INSERT INTO storage.buckets (id, name, public) VALUES ('templates', 'templates', true);

-- Create storage policies for template assets
CREATE POLICY "Template assets are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'templates');

CREATE POLICY "Authenticated users can upload template assets" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'templates' AND auth.role() = 'authenticated');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON public.templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some beautiful starter templates
INSERT INTO public.templates (name, description, category, industry, tags, preview_color, template_data, is_public) VALUES
(
  'Modern Tech Proposal',
  'Clean, minimalist design perfect for technology companies',
  'technology',
  'technology',
  ARRAY['modern', 'minimal', 'tech', 'clean'],
  'from-blue-50 via-indigo-50 to-purple-50',
  '{
    "sections": [
      {
        "type": "cover_page",
        "title": "Technology Solutions Proposal",
        "tagline": "Innovation Meets Excellence",
        "layout": "centered",
        "style": {
          "titleColor": "#1e40af",
          "taglineColor": "#6366f1",
          "background": "gradient"
        }
      },
      {
        "type": "executive_summary",
        "title": "Executive Summary",
        "content": "Our cutting-edge technology solutions are designed to transform your business operations and drive growth.",
        "layout": "standard",
        "style": {
          "accentColor": "#3b82f6"
        }
      },
      {
        "type": "services",
        "title": "Our Services",
        "items": [
          "Custom Software Development",
          "Cloud Migration & Management", 
          "AI & Machine Learning Solutions",
          "Cybersecurity Implementation"
        ],
        "layout": "grid"
      },
      {
        "type": "pricing",
        "title": "Investment",
        "packages": [
          {
            "name": "Starter Package",
            "price": 15000,
            "features": ["Basic Implementation", "Training", "3 Months Support"]
          },
          {
            "name": "Professional Package", 
            "price": 35000,
            "features": ["Full Implementation", "Advanced Training", "12 Months Support", "Custom Integrations"]
          }
        ]
      }
    ]
  }',
  true
),
(
  'Creative Agency Proposal',
  'Bold and vibrant design for creative agencies and studios',
  'creative',
  'creative',
  ARRAY['creative', 'bold', 'agency', 'design'],
  'from-purple-400 via-pink-500 to-red-500',
  '{
    "sections": [
      {
        "type": "cover_page",
        "title": "Creative Vision Proposal", 
        "tagline": "Where Ideas Come to Life",
        "layout": "creative",
        "style": {
          "titleColor": "#ffffff",
          "taglineColor": "#fbbf24",
          "background": "gradient",
          "overlay": true
        }
      },
      {
        "type": "portfolio_showcase",
        "title": "Our Creative Portfolio",
        "description": "Explore our award-winning creative work",
        "layout": "gallery"
      },
      {
        "type": "creative_process",
        "title": "Our Creative Process",
        "steps": [
          "Discovery & Research",
          "Ideation & Concept Development",
          "Design & Execution", 
          "Launch & Optimization"
        ],
        "layout": "timeline"
      }
    ]
  }',
  true
),
(
  'Corporate Business Proposal',
  'Professional corporate design for enterprise clients',
  'corporate',
  'business',
  ARRAY['corporate', 'professional', 'enterprise', 'business'],
  'from-slate-900 via-gray-800 to-zinc-900',
  '{
    "sections": [
      {
        "type": "cover_page",
        "title": "Strategic Business Proposal",
        "tagline": "Excellence in Every Detail",
        "layout": "executive",
        "style": {
          "titleColor": "#ffffff",
          "taglineColor": "#e5e7eb",
          "background": "corporate"
        }
      },
      {
        "type": "company_overview",
        "title": "About Our Organization", 
        "content": "With over 20 years of experience, we deliver strategic solutions that drive measurable business results.",
        "layout": "professional"
      },
      {
        "type": "methodology",
        "title": "Our Proven Methodology",
        "description": "A systematic approach to delivering exceptional results",
        "layout": "framework"
      }
    ]
  }',
  true
);