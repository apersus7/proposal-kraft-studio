-- Fix database function search paths for security
ALTER FUNCTION public.update_updated_at_column() SET search_path = 'public';
ALTER FUNCTION public.has_role(uuid, user_role) SET search_path = 'public';

-- Create secure proposal sharing system
CREATE TABLE IF NOT EXISTS public.secure_proposal_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID NOT NULL,
  share_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'base64url'),
  created_by UUID NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  permissions TEXT NOT NULL DEFAULT 'view',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accessed_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on secure_proposal_shares
ALTER TABLE public.secure_proposal_shares ENABLE ROW LEVEL SECURITY;

-- Create policies for secure_proposal_shares
CREATE POLICY "Users can manage shares for their proposals" 
ON public.secure_proposal_shares 
FOR ALL 
USING (proposal_id IN (
  SELECT id FROM public.proposals 
  WHERE user_id = auth.uid()
))
WITH CHECK (proposal_id IN (
  SELECT id FROM public.proposals 
  WHERE user_id = auth.uid()
));

-- Replace public proposal access with token-based access
DROP POLICY IF EXISTS "Public can view shared proposals" ON public.proposals;

CREATE POLICY "Token-based proposal access" 
ON public.proposals 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  id IN (
    SELECT proposal_id 
    FROM public.secure_proposal_shares 
    WHERE share_token = current_setting('request.jwt.claims', true)::json->>'share_token'
    AND (expires_at IS NULL OR expires_at > now())
  )
);

-- Fix analytics RLS to prevent data pollution
DROP POLICY IF EXISTS "Anyone can insert analytics" ON public.proposal_analytics;

CREATE POLICY "Authenticated analytics insert" 
ON public.proposal_analytics 
FOR INSERT 
WITH CHECK (
  proposal_id IN (
    SELECT id FROM public.proposals WHERE sharing_enabled = true
  ) OR 
  proposal_id IN (
    SELECT proposal_id 
    FROM public.secure_proposal_shares 
    WHERE share_token = current_setting('request.jwt.claims', true)::json->>'share_token'
    AND (expires_at IS NULL OR expires_at > now())
  )
);

-- Fix subscription creation to require authentication
DROP POLICY IF EXISTS "insert_subscription" ON public.subscribers;

CREATE POLICY "Authenticated subscription creation" 
ON public.subscribers 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR email = auth.email()));

-- Add validation trigger for subscription data
CREATE OR REPLACE FUNCTION public.validate_subscription_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate email format
  IF NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Validate subscription tier
  IF NEW.subscription_tier IS NOT NULL AND 
     NEW.subscription_tier NOT IN ('Basic', 'Premium', 'Enterprise') THEN
    RAISE EXCEPTION 'Invalid subscription tier';
  END IF;
  
  -- Validate PayPal subscription ID format if provided
  IF NEW.paypal_subscription_id IS NOT NULL AND 
     LENGTH(NEW.paypal_subscription_id) < 10 THEN
    RAISE EXCEPTION 'Invalid PayPal subscription ID format';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = 'public';

CREATE TRIGGER validate_subscription_before_insert
  BEFORE INSERT ON public.subscribers
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_subscription_data();

CREATE TRIGGER validate_subscription_before_update
  BEFORE UPDATE ON public.subscribers
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_subscription_data();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_secure_shares_token ON public.secure_proposal_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_secure_shares_proposal ON public.secure_proposal_shares(proposal_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON public.subscribers(email);
CREATE INDEX IF NOT EXISTS idx_subscribers_paypal_id ON public.subscribers(paypal_subscription_id);