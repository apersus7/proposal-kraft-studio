-- Fix the overly permissive subscription update policy
DROP POLICY IF EXISTS "update_own_subscription" ON public.subscribers;

-- Create a secure policy that only allows users to update their own subscriptions
CREATE POLICY "Users can only update their own subscription" 
ON public.subscribers 
FOR UPDATE 
USING ((user_id = auth.uid()) OR (email = auth.email()));