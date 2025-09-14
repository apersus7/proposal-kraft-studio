-- Security Fix 1: Allow recipients to access shared proposals
-- Add policy for proposal_shares recipients to view shared proposals
CREATE POLICY "Email recipients can view shared proposals" 
ON public.proposals 
FOR SELECT 
USING (
  id IN (
    SELECT proposal_id 
    FROM proposal_shares 
    WHERE shared_with_email = auth.email() 
    AND (expires_at IS NULL OR expires_at > now())
  )
);

-- Security Fix 2: Allow commenters to manage their own comments
-- Drop and recreate comment policies with proper access control
DROP POLICY IF EXISTS "Commenters can view their own comments" ON public.proposal_comments;
DROP POLICY IF EXISTS "Commenters can update their own comments" ON public.proposal_comments;
DROP POLICY IF EXISTS "Commenters can delete their own comments" ON public.proposal_comments;

CREATE POLICY "Comment authors can view their own comments" 
ON public.proposal_comments 
FOR SELECT 
USING (user_email = auth.email());

CREATE POLICY "Comment authors can update their own comments" 
ON public.proposal_comments 
FOR UPDATE 
USING (user_email = auth.email());

CREATE POLICY "Comment authors can delete their own comments" 
ON public.proposal_comments 
FOR DELETE 
USING (user_email = auth.email());

-- Allow authenticated users to insert comments on accessible proposals
CREATE POLICY "Authenticated users can comment on accessible proposals" 
ON public.proposal_comments 
FOR INSERT 
WITH CHECK (
  auth.email() IS NOT NULL AND
  (
    -- Can comment on own proposals
    proposal_id IN (
      SELECT id FROM proposals WHERE user_id = auth.uid()
    ) OR
    -- Can comment on proposals shared with them
    proposal_id IN (
      SELECT proposal_id 
      FROM proposal_shares 
      WHERE shared_with_email = auth.email() 
      AND (expires_at IS NULL OR expires_at > now())
    ) OR
    -- Can comment on token-shared proposals
    proposal_id IN (
      SELECT proposal_id 
      FROM secure_proposal_shares 
      WHERE share_token = ((current_setting('request.jwt.claims'::text, true))::json ->> 'share_token'::text)
      AND (expires_at IS NULL OR expires_at > now())
    )
  )
);

-- Security Fix 3: Allow signers to view and manage their own signatures
CREATE POLICY "Signature authors can view their own signatures" 
ON public.proposal_signatures 
FOR SELECT 
USING (signer_email = auth.email());

-- Allow signers to update their own signatures (for signing process)
CREATE POLICY "Signature authors can update their own signatures" 
ON public.proposal_signatures 
FOR UPDATE 
USING (signer_email = auth.email() AND status = 'pending');

-- Allow authenticated users to sign accessible proposals
CREATE POLICY "Authenticated users can sign accessible proposals" 
ON public.proposal_signatures 
FOR INSERT 
WITH CHECK (
  auth.email() IS NOT NULL AND
  signer_email = auth.email() AND
  (
    -- Can sign own proposals
    proposal_id IN (
      SELECT id FROM proposals WHERE user_id = auth.uid()
    ) OR
    -- Can sign proposals shared with them
    proposal_id IN (
      SELECT proposal_id 
      FROM proposal_shares 
      WHERE shared_with_email = auth.email() 
      AND (expires_at IS NULL OR expires_at > now())
    ) OR
    -- Can sign token-shared proposals
    proposal_id IN (
      SELECT proposal_id 
      FROM secure_proposal_shares 
      WHERE share_token = ((current_setting('request.jwt.claims'::text, true))::json ->> 'share_token'::text)
      AND (expires_at IS NULL OR expires_at > now())
    )
  )
);

-- Security Enhancement: Update analytics policy to include email-shared proposals
DROP POLICY IF EXISTS "Authenticated analytics insert" ON public.proposal_analytics;

CREATE POLICY "Enhanced analytics insert policy" 
ON public.proposal_analytics 
FOR INSERT 
WITH CHECK (
  (
    -- Public proposals
    proposal_id IN (
      SELECT id FROM proposals WHERE sharing_enabled = true
    ) OR
    -- Token-shared proposals
    proposal_id IN (
      SELECT proposal_id 
      FROM secure_proposal_shares 
      WHERE share_token = ((current_setting('request.jwt.claims'::text, true))::json ->> 'share_token'::text)
      AND (expires_at IS NULL OR expires_at > now())
    ) OR
    -- Email-shared proposals (authenticated users only)
    (
      auth.email() IS NOT NULL AND
      proposal_id IN (
        SELECT proposal_id 
        FROM proposal_shares 
        WHERE shared_with_email = auth.email() 
        AND (expires_at IS NULL OR expires_at > now())
      )
    )
  )
);