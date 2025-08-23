-- Create profiles table for company information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT,
  company_logo_url TEXT,
  company_address TEXT,
  company_phone TEXT,
  company_email TEXT,
  company_website TEXT,
  brand_color_primary TEXT DEFAULT '#22c55e',
  brand_color_secondary TEXT DEFAULT '#16a34a',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create templates table for proposal templates
CREATE TABLE public.templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  preview_image_url TEXT,
  template_data JSONB NOT NULL,
  is_public BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create proposals table
CREATE TABLE public.proposals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.templates(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT,
  content JSONB NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for templates (public templates viewable by all, user templates only by creator)
CREATE POLICY "Public templates are viewable by authenticated users" 
ON public.templates FOR SELECT 
TO authenticated
USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can create templates" 
ON public.templates FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own templates" 
ON public.templates FOR UPDATE 
TO authenticated
USING (auth.uid() = created_by);

-- RLS Policies for proposals
CREATE POLICY "Users can view their own proposals" 
ON public.proposals FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own proposals" 
ON public.proposals FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own proposals" 
ON public.proposals FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own proposals" 
ON public.proposals FOR DELETE 
USING (auth.uid() = user_id);

-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('templates', 'templates', false);

-- Storage policies for logos (public)
CREATE POLICY "Logo images are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'logos');

CREATE POLICY "Users can upload their own logo" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own logo" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for templates (private)
CREATE POLICY "Users can view their own template files" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'templates' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own template files" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'templates' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON public.templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_proposals_updated_at
  BEFORE UPDATE ON public.proposals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, company_name, company_email)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'company_name', ''), 
    COALESCE(NEW.email, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert some default templates
INSERT INTO public.templates (name, description, preview_image_url, template_data, is_public) VALUES
('Modern Business Proposal', 'Clean and professional template for business proposals', null, '{"sections": [{"type": "cover", "title": "Business Proposal", "subtitle": "Presented by {{company_name}}"}, {"type": "about", "title": "About Us", "content": "{{company_description}}"}, {"type": "services", "title": "Our Services", "content": "{{services_list}}"}, {"type": "pricing", "title": "Investment", "content": "{{pricing_table}}"}, {"type": "contact", "title": "Next Steps", "content": "{{contact_info}}"}]}', true),
('Creative Agency Proposal', 'Perfect for creative agencies and design studios', null, '{"sections": [{"type": "hero", "title": "Creative Partnership Proposal", "subtitle": "Let us create something amazing together"}, {"type": "portfolio", "title": "Our Work", "content": "{{portfolio_items}}"}, {"type": "approach", "title": "Our Approach", "content": "{{methodology}}"}, {"type": "timeline", "title": "Project Timeline", "content": "{{project_phases}}"}, {"type": "investment", "title": "Investment & Terms", "content": "{{pricing_breakdown}}"}]}', true),
('Consulting Proposal', 'Ideal for consulting services and professional advice', null, '{"sections": [{"type": "executive_summary", "title": "Executive Summary", "content": "{{summary}}"}, {"type": "problem", "title": "Challenge Definition", "content": "{{problem_statement}}"}, {"type": "solution", "title": "Proposed Solution", "content": "{{solution_details}}"}, {"type": "methodology", "title": "Methodology", "content": "{{approach}}"}, {"type": "deliverables", "title": "Deliverables", "content": "{{deliverables_list}}"}, {"type": "terms", "title": "Terms & Conditions", "content": "{{terms}}"}]}', true);