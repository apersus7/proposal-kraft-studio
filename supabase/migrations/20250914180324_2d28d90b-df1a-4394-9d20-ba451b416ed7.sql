-- Drop all existing SELECT policies on proposals to avoid conflicts
DROP POLICY IF EXISTS "Recipients can view shared proposals" ON public.proposals;
DROP POLICY IF EXISTS "Token recipients can view shared proposals" ON public.proposals;
DROP POLICY IF EXISTS "Token-based proposal access" ON public.proposals;
DROP POLICY IF EXISTS "Comprehensive proposal access" ON public.proposals;
DROP POLICY IF EXISTS "Users can view their own proposals" ON public.proposals;

-- Create a single comprehensive policy for proposal access
CREATE POLICY "Proposal access policy" 
ON public.proposals 
FOR SELECT 
USING (
  -- Users can view their own proposals
  auth.uid() = user_id OR
  -- Token-based access through secure_proposal_shares
  id IN (
    SELECT proposal_id 
    FROM secure_proposal_shares 
    WHERE share_token = ((current_setting('request.jwt.claims'::text, true))::json ->> 'share_token'::text)
    AND (expires_at IS NULL OR expires_at > now())
  ) OR
  -- Email-based access through proposal_shares  
  (
    auth.email() IS NOT NULL AND
    id IN (
      SELECT proposal_id 
      FROM proposal_shares 
      WHERE shared_with_email = auth.email() 
      AND (expires_at IS NULL OR expires_at > now())
    )
  )
);

-- Fix analytics policies
DROP POLICY IF EXISTS "Authenticated analytics insert" ON public.proposal_analytics;
DROP POLICY IF EXISTS "Recipients can insert analytics for shared proposals" ON public.proposal_analytics;

CREATE POLICY "Analytics insert policy" 
ON public.proposal_analytics 
FOR INSERT 
WITH CHECK (
  -- Public proposals with sharing enabled
  proposal_id IN (
    SELECT id FROM proposals WHERE sharing_enabled = true
  ) OR
  -- Token-based shared proposals
  proposal_id IN (
    SELECT proposal_id 
    FROM secure_proposal_shares 
    WHERE share_token = ((current_setting('request.jwt.claims'::text, true))::json ->> 'share_token'::text)
    AND (expires_at IS NULL OR expires_at > now())
  ) OR
  -- Email-based shared proposals
  (
    auth.email() IS NOT NULL AND
    proposal_id IN (
      SELECT proposal_id 
      FROM proposal_shares 
      WHERE shared_with_email = auth.email() 
      AND (expires_at IS NULL OR expires_at > now())
    )
  )
);

-- Fix function search paths for security compliance
ALTER FUNCTION public.validate_subscription_data() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;