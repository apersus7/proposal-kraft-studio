-- Create table for user payment settings
CREATE TABLE public.user_payment_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  stripe_publishable_key TEXT,
  stripe_secret_key TEXT,
  paypal_client_id TEXT,
  paypal_client_secret TEXT,
  paypal_environment TEXT DEFAULT 'sandbox',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_payment_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own payment settings" 
ON public.user_payment_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payment settings" 
ON public.user_payment_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment settings" 
ON public.user_payment_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_payment_settings_updated_at
BEFORE UPDATE ON public.user_payment_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();