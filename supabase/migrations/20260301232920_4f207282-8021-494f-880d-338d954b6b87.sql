ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS is_trial boolean NOT NULL DEFAULT false;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS is_paid boolean NOT NULL DEFAULT false;