-- Create brand_kits table
CREATE TABLE public.brand_kits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  primary_color TEXT NOT NULL DEFAULT '#3B82F6',
  secondary_color TEXT NOT NULL DEFAULT '#6B7280',
  accent_color TEXT NOT NULL DEFAULT '#F59E0B',
  font_primary TEXT NOT NULL DEFAULT 'Inter',
  font_secondary TEXT NOT NULL DEFAULT 'Inter',
  logo_url TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create proposals table
CREATE TABLE public.proposals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT,
  content JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create proposal_signatures table
CREATE TABLE public.proposal_signatures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  signer_name TEXT NOT NULL,
  signer_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  signature_data TEXT,
  signed_at TIMESTAMP WITH TIME ZONE,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create proposal_analytics table
CREATE TABLE public.proposal_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  viewer_ip TEXT,
  viewer_location TEXT,
  device_type TEXT,
  section_viewed TEXT,
  time_spent INTEGER DEFAULT 0,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create secure_proposal_shares table
CREATE TABLE public.secure_proposal_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'base64'),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  permissions TEXT NOT NULL DEFAULT 'view',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.brand_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secure_proposal_shares ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for brand_kits
CREATE POLICY "Users can view their own brand kits" ON public.brand_kits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own brand kits" ON public.brand_kits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own brand kits" ON public.brand_kits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own brand kits" ON public.brand_kits FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for proposals
CREATE POLICY "Users can view their own proposals" ON public.proposals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own proposals" ON public.proposals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own proposals" ON public.proposals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own proposals" ON public.proposals FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for proposal_signatures
CREATE POLICY "Users can view signatures for their proposals" ON public.proposal_signatures FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.proposals WHERE proposals.id = proposal_signatures.proposal_id AND proposals.user_id = auth.uid())
);
CREATE POLICY "Users can create signatures for their proposals" ON public.proposal_signatures FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.proposals WHERE proposals.id = proposal_signatures.proposal_id AND proposals.user_id = auth.uid())
);
CREATE POLICY "Users can update signatures for their proposals" ON public.proposal_signatures FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.proposals WHERE proposals.id = proposal_signatures.proposal_id AND proposals.user_id = auth.uid())
);

-- Create RLS policies for proposal_analytics
CREATE POLICY "Users can view analytics for their proposals" ON public.proposal_analytics FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.proposals WHERE proposals.id = proposal_analytics.proposal_id AND proposals.user_id = auth.uid())
);
CREATE POLICY "Anyone can insert analytics" ON public.proposal_analytics FOR INSERT WITH CHECK (true);

-- Create RLS policies for secure_proposal_shares
CREATE POLICY "Users can view their own shares" ON public.secure_proposal_shares FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "Users can create shares for their proposals" ON public.secure_proposal_shares FOR INSERT WITH CHECK (
  auth.uid() = created_by AND EXISTS (SELECT 1 FROM public.proposals WHERE proposals.id = secure_proposal_shares.proposal_id AND proposals.user_id = auth.uid())
);
CREATE POLICY "Users can update their own shares" ON public.secure_proposal_shares FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete their own shares" ON public.secure_proposal_shares FOR DELETE USING (auth.uid() = created_by);

-- Add triggers for updated_at
CREATE TRIGGER update_brand_kits_updated_at BEFORE UPDATE ON public.brand_kits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_proposals_updated_at BEFORE UPDATE ON public.proposals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();