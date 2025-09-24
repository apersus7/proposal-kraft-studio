-- Create proposal_shares table for email-based sharing
CREATE TABLE public.proposal_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID NOT NULL,
  shared_with_email TEXT NOT NULL,
  created_by UUID NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  permissions TEXT NOT NULL DEFAULT 'view',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.proposal_shares ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for proposal_shares
CREATE POLICY "Users can create shares for their proposals" 
ON public.proposal_shares 
FOR INSERT 
WITH CHECK (
  auth.uid() = created_by AND 
  EXISTS (
    SELECT 1 FROM proposals 
    WHERE proposals.id = proposal_shares.proposal_id 
    AND proposals.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view their own shares" 
ON public.proposal_shares 
FOR SELECT 
USING (auth.uid() = created_by);

CREATE POLICY "Users can update their own shares" 
ON public.proposal_shares 
FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own shares" 
ON public.proposal_shares 
FOR DELETE 
USING (auth.uid() = created_by);

-- Add trigger for updated_at
CREATE TRIGGER update_proposal_shares_updated_at
  BEFORE UPDATE ON public.proposal_shares
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();