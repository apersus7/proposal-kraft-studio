-- Add PayPal fields to user_payment_settings table
ALTER TABLE public.user_payment_settings
ADD COLUMN IF NOT EXISTS paypal_merchant_id TEXT,
ADD COLUMN IF NOT EXISTS paypal_client_id_custom TEXT;

-- Add PayPal fields to payment_links table
ALTER TABLE public.payment_links
ADD COLUMN IF NOT EXISTS paypal_order_id TEXT,
ADD COLUMN IF NOT EXISTS payment_provider TEXT NOT NULL DEFAULT 'stripe';