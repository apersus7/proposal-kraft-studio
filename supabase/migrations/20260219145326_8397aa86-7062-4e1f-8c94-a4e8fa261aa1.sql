
-- Create proposal_signatures table
CREATE TABLE IF NOT EXISTS public.proposal_signatures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID NOT NULL,
  signer_name TEXT,
  signer_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  signature_data TEXT,
  signed_at TIMESTAMP WITH TIME ZONE,
  order_index INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.proposal_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage signatures for their proposals"
ON public.proposal_signatures FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.proposals
    WHERE proposals.id = proposal_signatures.proposal_id
    AND proposals.user_id = auth.uid()
  )
);

CREATE POLICY "Anyone can view signatures for shared proposals"
ON public.proposal_signatures FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.proposals
    WHERE proposals.id = proposal_signatures.proposal_id
    AND proposals.status = 'shared'
  )
);

CREATE POLICY "Anyone can update pending signatures"
ON public.proposal_signatures FOR UPDATE
USING (status = 'pending');

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'none',
  plan_type TEXT,
  current_period_end TIMESTAMP WITH TIME ZONE,
  whop_membership_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions"
ON public.subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions"
ON public.subscriptions FOR ALL
USING (auth.uid() = user_id);

-- Create proposal_analytics table
CREATE TABLE IF NOT EXISTS public.proposal_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID NOT NULL,
  viewer_ip TEXT,
  section_viewed TEXT,
  time_spent INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.proposal_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view analytics for their proposals"
ON public.proposal_analytics FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.proposals
    WHERE proposals.id = proposal_analytics.proposal_id
    AND proposals.user_id = auth.uid()
  )
);

CREATE POLICY "Anyone can insert analytics"
ON public.proposal_analytics FOR INSERT
WITH CHECK (true);

-- Create secure_proposal_shares table
CREATE TABLE IF NOT EXISTS public.secure_proposal_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID NOT NULL,
  share_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_by UUID,
  expires_at TIMESTAMP WITH TIME ZONE,
  content_snapshot JSONB,
  permissions JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.secure_proposal_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own shares"
ON public.secure_proposal_shares FOR ALL
USING (auth.uid() = created_by);

CREATE POLICY "Anyone can view shares by token"
ON public.secure_proposal_shares FOR SELECT
USING (true);

-- Create payment_links table
CREATE TABLE IF NOT EXISTS public.payment_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID,
  user_id UUID,
  provider TEXT NOT NULL,
  link_url TEXT NOT NULL,
  amount NUMERIC,
  currency TEXT DEFAULT 'USD',
  description TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own payment links"
ON public.payment_links FOR ALL
USING (auth.uid() = user_id);

-- Create user_payment_settings table
CREATE TABLE IF NOT EXISTS public.user_payment_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  stripe_publishable_key TEXT,
  stripe_secret_key TEXT,
  paypal_client_id_custom TEXT,
  paypal_merchant_id TEXT,
  razorpay_key_id TEXT,
  razorpay_key_secret TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_payment_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own payment settings"
ON public.user_payment_settings FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create proposal_shares table (for email sharing)
CREATE TABLE IF NOT EXISTS public.proposal_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID NOT NULL,
  shared_with_email TEXT,
  created_by UUID,
  expires_at TIMESTAMP WITH TIME ZONE,
  permissions TEXT DEFAULT 'view',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.proposal_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own proposal shares"
ON public.proposal_shares FOR ALL
USING (auth.uid() = created_by);
