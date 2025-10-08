-- Create function to check if a user has an active subscription
CREATE OR REPLACE FUNCTION public.user_has_active_subscription(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.subscriptions s
    WHERE s.user_id = _user_id
      AND s.status = 'active'
      AND (s.current_period_end IS NULL OR s.current_period_end > now())
    ORDER BY s.created_at DESC
    LIMIT 1
  );
$$;

-- Tighten RLS on proposals to require an active subscription for creating and updating
DO $$
BEGIN
  -- Drop existing INSERT policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'proposals' AND policyname = 'Users can create their own proposals'
  ) THEN
    EXECUTE 'DROP POLICY "Users can create their own proposals" ON public.proposals';
  END IF;

  -- Create stricter INSERT policy
  EXECUTE 'CREATE POLICY "Users with active subscription can create proposals" 
  ON public.proposals
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND public.user_has_active_subscription(auth.uid())
  )';

  -- Drop existing UPDATE policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'proposals' AND policyname = 'Users can update their own proposals'
  ) THEN
    EXECUTE 'DROP POLICY "Users can update their own proposals" ON public.proposals';
  END IF;

  -- Create stricter UPDATE policy
  EXECUTE 'CREATE POLICY "Users with active subscription can update proposals" 
  ON public.proposals
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND public.user_has_active_subscription(auth.uid())
  )
  WITH CHECK (
    auth.uid() = user_id
    AND public.user_has_active_subscription(auth.uid())
  )';
END $$;
