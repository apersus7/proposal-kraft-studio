-- Ensure templates table has RLS enabled and proper policies for everyone to see public templates
-- First check if RLS is enabled
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Public templates are viewable by authenticated users" ON public.templates;
DROP POLICY IF EXISTS "Users can create templates" ON public.templates;
DROP POLICY IF EXISTS "Users can update their own templates" ON public.templates;

-- Create policies that allow access to public templates for everyone, not just authenticated users
CREATE POLICY "Public templates are viewable by everyone" 
ON public.templates 
FOR SELECT 
USING (is_public = true OR (auth.uid() IS NOT NULL AND created_by = auth.uid()));

CREATE POLICY "Authenticated users can create templates" 
ON public.templates 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = created_by);

CREATE POLICY "Users can update their own templates" 
ON public.templates 
FOR UPDATE 
USING (auth.uid() IS NOT NULL AND auth.uid() = created_by);