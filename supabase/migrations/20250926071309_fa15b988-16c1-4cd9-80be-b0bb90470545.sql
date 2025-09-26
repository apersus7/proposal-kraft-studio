-- Allow unauthenticated users to sign proposals (update their signature status)
-- This is needed for shared proposals where clients can sign without logging in
CREATE POLICY "Anyone can sign signatures for shared proposals" 
ON proposal_signatures 
FOR UPDATE 
USING (true)
WITH CHECK (
  -- Only allow updating signature-related fields when signing
  status = 'signed' AND 
  signature_data IS NOT NULL AND 
  signed_at IS NOT NULL
);