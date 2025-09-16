-- Remove duplicate policies causing infinite recursion
DROP POLICY IF EXISTS "Users can view their own proposals" ON public.proposals;
DROP POLICY IF EXISTS "Email recipients can view shared proposals" ON public.proposals;

-- Keep only the comprehensive policy
-- The "proposals_select_policy" already handles all the cases correctly