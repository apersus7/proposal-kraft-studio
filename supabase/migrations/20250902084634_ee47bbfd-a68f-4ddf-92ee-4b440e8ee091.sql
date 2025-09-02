-- Enhanced proposal system with all advanced features

-- Brand kits table for company branding
CREATE TABLE public.brand_kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  primary_color TEXT DEFAULT '#22c55e',
  secondary_color TEXT DEFAULT '#16a34a',
  accent_color TEXT DEFAULT '#f59e0b',
  logo_url TEXT,
  font_primary TEXT DEFAULT 'Inter',
  font_secondary TEXT DEFAULT 'Inter',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.brand_kits ENABLE ROW LEVEL SECURITY;

-- Brand kit policies
CREATE POLICY "Users can manage their own brand kits"
  ON public.brand_kits FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Content snippets for reusable elements
CREATE TABLE public.content_snippets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content JSONB NOT NULL,
  category TEXT NOT NULL,
  is_global BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.content_snippets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their content snippets"
  ON public.content_snippets FOR ALL
  USING (auth.uid() = user_id OR is_global = true)
  WITH CHECK (auth.uid() = user_id);

-- E-signatures table
CREATE TABLE public.proposal_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  signer_name TEXT NOT NULL,
  signer_email TEXT NOT NULL,
  signature_data TEXT,
  signed_at TIMESTAMPTZ,
  ip_address INET,
  user_agent TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.proposal_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage signatures for their proposals"
  ON public.proposal_signatures FOR ALL
  USING (
    proposal_id IN (
      SELECT id FROM public.proposals WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    proposal_id IN (
      SELECT id FROM public.proposals WHERE user_id = auth.uid()
    )
  );

-- Comments system for collaboration
CREATE TABLE public.proposal_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  comment TEXT NOT NULL,
  section_id TEXT,
  position_x FLOAT,
  position_y FLOAT,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.proposal_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage comments on their proposals"
  ON public.proposal_comments FOR ALL
  USING (
    proposal_id IN (
      SELECT id FROM public.proposals WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    proposal_id IN (
      SELECT id FROM public.proposals WHERE user_id = auth.uid()
    )
  );

-- Analytics tracking
CREATE TABLE public.proposal_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'view', 'section_view', 'download', 'sign', 'share'
  section_id TEXT,
  visitor_id TEXT,
  ip_address INET,
  user_agent TEXT,
  duration INTEGER, -- in seconds for section views
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.proposal_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view analytics for their proposals"
  ON public.proposal_analytics FOR SELECT
  USING (
    proposal_id IN (
      SELECT id FROM public.proposals WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can insert analytics"
  ON public.proposal_analytics FOR INSERT
  WITH CHECK (true);

-- User roles system
CREATE TYPE public.user_role AS ENUM ('admin', 'editor', 'viewer');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own role"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Shared proposals for collaboration
CREATE TABLE public.proposal_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  shared_with_email TEXT NOT NULL,
  permissions TEXT NOT NULL DEFAULT 'view', -- 'view', 'comment', 'edit'
  expires_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.proposal_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage shares for their proposals"
  ON public.proposal_shares FOR ALL
  USING (
    proposal_id IN (
      SELECT id FROM public.proposals WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    proposal_id IN (
      SELECT id FROM public.proposals WHERE user_id = auth.uid()
    )
  );

-- Add new columns to existing tables
ALTER TABLE public.proposals ADD COLUMN brand_kit_id UUID REFERENCES public.brand_kits(id);
ALTER TABLE public.proposals ADD COLUMN variables JSONB DEFAULT '{}';
ALTER TABLE public.proposals ADD COLUMN sharing_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.proposals ADD COLUMN public_link TEXT;
ALTER TABLE public.proposals ADD COLUMN requires_signature BOOLEAN DEFAULT false;

-- Add industry and category to templates
ALTER TABLE public.templates ADD COLUMN category TEXT DEFAULT 'business';
ALTER TABLE public.templates ADD COLUMN industry TEXT DEFAULT 'general';
ALTER TABLE public.templates ADD COLUMN tags TEXT[] DEFAULT '{}';

-- Create indexes for performance
CREATE INDEX idx_proposal_analytics_proposal_id ON public.proposal_analytics(proposal_id);
CREATE INDEX idx_proposal_analytics_event_type ON public.proposal_analytics(event_type);
CREATE INDEX idx_proposal_analytics_created_at ON public.proposal_analytics(created_at);
CREATE INDEX idx_proposal_comments_proposal_id ON public.proposal_comments(proposal_id);
CREATE INDEX idx_proposal_signatures_proposal_id ON public.proposal_signatures(proposal_id);

-- Update function for timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers
CREATE TRIGGER update_brand_kits_updated_at
  BEFORE UPDATE ON public.brand_kits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default brand kit for existing users
INSERT INTO public.brand_kits (user_id, name, is_default)
SELECT id, 'Default Brand Kit', true
FROM auth.users
WHERE id NOT IN (SELECT DISTINCT user_id FROM public.brand_kits WHERE is_default = true);