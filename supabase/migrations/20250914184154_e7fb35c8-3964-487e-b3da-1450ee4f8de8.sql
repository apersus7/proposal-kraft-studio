-- Remove PayPal-specific columns from subscribers table
ALTER TABLE public.subscribers 
DROP COLUMN IF EXISTS paypal_subscription_id;