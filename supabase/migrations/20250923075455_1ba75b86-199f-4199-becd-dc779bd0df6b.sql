-- Add template_id column to proposals table
ALTER TABLE public.proposals ADD COLUMN template_id UUID REFERENCES public.templates(id);