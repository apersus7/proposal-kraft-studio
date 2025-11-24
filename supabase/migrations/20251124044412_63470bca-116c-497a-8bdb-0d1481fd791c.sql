-- Drop the existing restrictive policies
DROP POLICY IF EXISTS "Users with active subscription can create proposals" ON public.proposals;
DROP POLICY IF EXISTS "Users with active subscription can update proposals" ON public.proposals;

-- Create new policies without subscription checks
CREATE POLICY "Users can create their own proposals"
ON public.proposals
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own proposals"
ON public.proposals
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);