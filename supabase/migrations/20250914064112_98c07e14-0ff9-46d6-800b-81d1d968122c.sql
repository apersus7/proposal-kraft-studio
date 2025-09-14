-- Add RLS policy to allow public access to shared proposals
CREATE POLICY "Public can view shared proposals" 
ON public.proposals 
FOR SELECT 
USING (sharing_enabled = true);