-- Clean up all existing policies to fix infinite recursion and duplicates

-- Drop all proposals policies
DROP POLICY IF EXISTS "Proposal access policy" ON public.proposals;
DROP POLICY IF EXISTS "Comprehensive proposal access" ON public.proposals;
DROP POLICY IF EXISTS "Recipients can view shared proposals" ON public.proposals;
DROP POLICY IF EXISTS "Token recipients can view shared proposals" ON public.proposals;
DROP POLICY IF EXISTS "Token-based proposal access" ON public.proposals;
DROP POLICY IF EXISTS "Users can view their own proposals" ON public.proposals;

-- Drop all proposal_analytics policies
DROP POLICY IF EXISTS "Analytics insert policy" ON public.proposal_analytics;
DROP POLICY IF EXISTS "Comprehensive analytics insert" ON public.proposal_analytics;
DROP POLICY IF EXISTS "Enhanced analytics insert policy" ON public.proposal_analytics;
DROP POLICY IF EXISTS "Authenticated analytics insert" ON public.proposal_analytics;
DROP POLICY IF EXISTS "Recipients can insert analytics for shared proposals" ON public.proposal_analytics;

-- Drop all proposal_comments policies
DROP POLICY IF EXISTS "Users can comment on accessible proposals" ON public.proposal_comments;
DROP POLICY IF EXISTS "Authenticated users can comment on accessible proposals" ON public.proposal_comments;
DROP POLICY IF EXISTS "Commenters can view their own comments" ON public.proposal_comments;
DROP POLICY IF EXISTS "Commenters can update their own comments" ON public.proposal_comments;
DROP POLICY IF EXISTS "Commenters can delete their own comments" ON public.proposal_comments;
DROP POLICY IF EXISTS "Comment authors can view their own comments" ON public.proposal_comments;
DROP POLICY IF EXISTS "Comment authors can update their own comments" ON public.proposal_comments;
DROP POLICY IF EXISTS "Comment authors can delete their own comments" ON public.proposal_comments;

-- Drop all proposal_signatures policies
DROP POLICY IF EXISTS "Signers can view their own signatures" ON public.proposal_signatures;
DROP POLICY IF EXISTS "Signers can update their own signatures" ON public.proposal_signatures;
DROP POLICY IF EXISTS "Users can sign accessible proposals" ON public.proposal_signatures;

-- Recreate clean policies without recursion

-- PROPOSALS: Single comprehensive access policy
CREATE POLICY "proposals_select_policy" 
ON public.proposals 
FOR SELECT 
USING (
  auth.uid() = user_id OR
  id IN (
    SELECT proposal_id 
    FROM secure_proposal_shares 
    WHERE share_token = ((current_setting('request.jwt.claims'::text, true))::json ->> 'share_token'::text)
    AND (expires_at IS NULL OR expires_at > now())
  ) OR
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

-- PROPOSAL_ANALYTICS: Clean insert policy
CREATE POLICY "analytics_insert_policy" 
ON public.proposal_analytics 
FOR INSERT 
WITH CHECK (
  proposal_id IN (
    SELECT id FROM proposals WHERE sharing_enabled = true
  ) OR
  proposal_id IN (
    SELECT proposal_id 
    FROM secure_proposal_shares 
    WHERE share_token = ((current_setting('request.jwt.claims'::text, true))::json ->> 'share_token'::text)
    AND (expires_at IS NULL OR expires_at > now())
  ) OR
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

-- PROPOSAL_COMMENTS: Clean policies for commenters
CREATE POLICY "comments_select_own" 
ON public.proposal_comments 
FOR SELECT 
USING (user_email = auth.email());

CREATE POLICY "comments_update_own" 
ON public.proposal_comments 
FOR UPDATE 
USING (user_email = auth.email());

CREATE POLICY "comments_delete_own" 
ON public.proposal_comments 
FOR DELETE 
USING (user_email = auth.email());

CREATE POLICY "comments_insert_on_accessible" 
ON public.proposal_comments 
FOR INSERT 
WITH CHECK (
  auth.email() IS NOT NULL AND
  (
    proposal_id IN (
      SELECT id FROM proposals WHERE user_id = auth.uid()
    ) OR
    proposal_id IN (
      SELECT proposal_id 
      FROM proposal_shares 
      WHERE shared_with_email = auth.email() 
      AND (expires_at IS NULL OR expires_at > now())
    ) OR
    proposal_id IN (
      SELECT proposal_id 
      FROM secure_proposal_shares 
      WHERE share_token = ((current_setting('request.jwt.claims'::text, true))::json ->> 'share_token'::text)
      AND (expires_at IS NULL OR expires_at > now())
    )
  )
);

-- PROPOSAL_SIGNATURES: Clean policies for signers  
CREATE POLICY "signatures_select_own" 
ON public.proposal_signatures 
FOR SELECT 
USING (signer_email = auth.email());

CREATE POLICY "signatures_update_own" 
ON public.proposal_signatures 
FOR UPDATE 
USING (signer_email = auth.email() AND status = 'pending');

CREATE POLICY "signatures_insert_accessible" 
ON public.proposal_signatures 
FOR INSERT 
WITH CHECK (
  auth.email() IS NOT NULL AND
  signer_email = auth.email() AND
  (
    proposal_id IN (
      SELECT id FROM proposals WHERE user_id = auth.uid()
    ) OR
    proposal_id IN (
      SELECT proposal_id 
      FROM proposal_shares 
      WHERE shared_with_email = auth.email() 
      AND (expires_at IS NULL OR expires_at > now())
    ) OR
    proposal_id IN (
      SELECT proposal_id 
      FROM secure_proposal_shares 
      WHERE share_token = ((current_setting('request.jwt.claims'::text, true))::json ->> 'share_token'::text)
      AND (expires_at IS NULL OR expires_at > now())
    )
  )
);