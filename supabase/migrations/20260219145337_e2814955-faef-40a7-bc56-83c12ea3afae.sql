-- Fix the overly permissive analytics insert policy
DROP POLICY IF EXISTS "Anyone can insert analytics" ON public.proposal_analytics;

-- Replace with a more specific policy: allow insert only for shared proposals
CREATE POLICY "Anyone can insert analytics for shared proposals"
ON public.proposal_analytics FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.proposals
    WHERE proposals.id = proposal_analytics.proposal_id
    AND proposals.status = 'shared'
  )
);
