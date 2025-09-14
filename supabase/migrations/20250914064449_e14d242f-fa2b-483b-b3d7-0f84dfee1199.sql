-- Drop the existing broad policy
DROP POLICY IF EXISTS "Users can manage signatures for their proposals" ON public.proposal_signatures;

-- Create more specific policies for better security
CREATE POLICY "Proposal owners can view signatures" 
ON public.proposal_signatures 
FOR SELECT 
USING (proposal_id IN (
  SELECT id FROM public.proposals 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Proposal owners can insert signatures" 
ON public.proposal_signatures 
FOR INSERT 
WITH CHECK (proposal_id IN (
  SELECT id FROM public.proposals 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Proposal owners can update signatures" 
ON public.proposal_signatures 
FOR UPDATE 
USING (proposal_id IN (
  SELECT id FROM public.proposals 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Proposal owners can delete signatures" 
ON public.proposal_signatures 
FOR DELETE 
USING (proposal_id IN (
  SELECT id FROM public.proposals 
  WHERE user_id = auth.uid()
));