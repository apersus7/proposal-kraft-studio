-- Add worth field to proposals table
ALTER TABLE public.proposals ADD COLUMN worth DECIMAL(10,2) DEFAULT 0.00;

-- Add more detailed status tracking
ALTER TABLE public.proposals ADD COLUMN view_count INTEGER DEFAULT 0;
ALTER TABLE public.proposals ADD COLUMN last_viewed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.proposals ADD COLUMN payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'overdue'));