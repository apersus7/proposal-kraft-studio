-- Tighten active subscription predicate to require a future end date
CREATE OR REPLACE FUNCTION public.user_has_active_subscription(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.subscriptions s
    WHERE s.user_id = _user_id
      AND s.status = 'active'
      AND s.current_period_end > now()
    ORDER BY s.created_at DESC
    LIMIT 1
  );
$function$;