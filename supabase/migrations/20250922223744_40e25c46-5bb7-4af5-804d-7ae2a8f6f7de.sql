-- Remove the admin role system
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP FUNCTION IF EXISTS public.has_role(UUID, app_role) CASCADE;
DROP TYPE IF EXISTS public.app_role CASCADE;