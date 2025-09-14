-- Security Fix 1: Allow recipients to access shared proposals
-- Add policy for proposal_shares recipients to view shared proposals
CREATE POLICY "Recipients can view shared proposals" 
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

-- Add policy for secure_proposal_shares recipients to view shared proposals
CREATE POLICY "Token recipients can view shared proposals" 
ON public.proposals 
FOR SELECT 
USING (
  id IN (
    SELECT proposal_id 
    FROM secure_proposal_shares 
    WHERE share_token = ((current_setting('request.jwt.claims'::text, true))::json ->> 'share_token'::text)
    AND (expires_at IS NULL OR expires_at > now())
  )
);

-- Security Fix 2: Allow commenters to manage their own comments
CREATE POLICY "Commenters can view their own comments" 
ON public.proposal_comments 
FOR SELECT 
USING (user_email = auth.email());

CREATE POLICY "Commenters can update their own comments" 
ON public.proposal_comments 
FOR UPDATE 
USING (user_email = auth.email());

CREATE POLICY "Commenters can delete their own comments" 
ON public.proposal_comments 
FOR DELETE 
USING (user_email = auth.email());

-- Allow authenticated users to insert comments on shared proposals
CREATE POLICY "Users can comment on accessible proposals" 
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

-- Security Fix 3: Allow signers to view their own signatures
CREATE POLICY "Signers can view their own signatures" 
ON public.proposal_signatures 
FOR SELECT 
USING (signer_email = auth.email());

-- Allow signers to update their own signatures (for signing process)
CREATE POLICY "Signers can update their own signatures" 
ON public.proposal_signatures 
FOR UPDATE 
USING (signer_email = auth.email() AND status = 'pending');

-- Allow authenticated users to sign accessible proposals
CREATE POLICY "Users can sign accessible proposals" 
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

-- Security Enhancement: Allow recipients to view analytics for shared proposals
CREATE POLICY "Recipients can insert analytics for shared proposals" 
ON public.proposal_analytics 
FOR INSERT 
WITH CHECK (
  (
    -- Existing policy conditions
    proposal_id IN (
      SELECT id FROM proposals WHERE sharing_enabled = true
    ) OR
    proposal_id IN (
      SELECT proposal_id 
      FROM secure_proposal_shares 
      WHERE share_token = ((current_setting('request.jwt.claims'::text, true))::json ->> 'share_token'::text)
      AND (expires_at IS NULL OR expires_at > now())
    )
  ) OR
  -- New condition: Allow analytics for email-shared proposals
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