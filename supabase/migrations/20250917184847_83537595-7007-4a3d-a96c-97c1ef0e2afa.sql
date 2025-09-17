-- Fix the infinite recursion in proposals RLS policy
-- Drop the problematic SELECT policy and create a simple one
DROP POLICY IF EXISTS "proposals_select_policy" ON public.proposals;

-- Create a simple policy that only allows users to see their own proposals
CREATE POLICY "Users can view their own proposals" 
ON public.proposals 
FOR SELECT 
USING (auth.uid() = user_id);