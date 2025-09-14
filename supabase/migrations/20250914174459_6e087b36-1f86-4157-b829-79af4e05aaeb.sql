-- Fix function search path for the validation function
ALTER FUNCTION public.validate_subscription_data() SET search_path = 'public';

-- Enable leaked password protection (if possible via SQL)
-- Note: This might need to be done via Supabase dashboard
UPDATE auth.config SET leaked_password_protection = true WHERE id = 'global';

-- Adjust OTP expiry to recommended threshold (24 hours = 86400 seconds)
UPDATE auth.config SET otp_exp = 86400 WHERE id = 'global';