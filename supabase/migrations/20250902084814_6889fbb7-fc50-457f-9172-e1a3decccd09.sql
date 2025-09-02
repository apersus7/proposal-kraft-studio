-- Fix security warnings from linter

-- Fix search path for the has_role function
DROP FUNCTION IF EXISTS public.has_role(_user_id UUID, _role user_role);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
-- Set immutable search path
SET search_path FROM CURRENT
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;