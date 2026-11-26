CREATE TABLE IF NOT EXISTS public.signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL CHECK (char_length(trim(full_name)) BETWEEN 2 AND 120),
  email text NOT NULL CHECK (char_length(trim(email)) BETWEEN 3 AND 320),
  working_on_project boolean NOT NULL,
  project_role text,
  membership_type text NOT NULL CHECK (membership_type IN ('founder', 'general_member')),
  referral_source text NOT NULL CHECK (char_length(trim(referral_source)) BETWEEN 1 AND 80),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT signups_project_role_check CHECK (
    (working_on_project = true AND project_role IN ('founder', 'team_member'))
    OR (working_on_project = false AND project_role IS NULL)
  )
);

CREATE TABLE IF NOT EXISTS public.email_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL CHECK (char_length(trim(email)) BETWEEN 3 AND 320),
  created_at timestamptz NOT NULL DEFAULT now(),
  unsubscribed_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS email_subscribers_email_lower_key
  ON public.email_subscribers (lower(trim(email)));

CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(trim(title)) BETWEEN 2 AND 160),
  description text,
  event_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  timezone text NOT NULL DEFAULT 'America/Los_Angeles',
  location text,
  registration_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT events_time_order_check CHECK (end_time > start_time)
);

CREATE TABLE IF NOT EXISTS public.officers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 2 AND 120),
  role text NOT NULL CHECK (char_length(trim(role)) BETWEEN 2 AND 120),
  bio text,
  photo_url text,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(trim(title)) BETWEEN 2 AND 160),
  description text,
  status text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.officer_access (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS events_touch_updated_at ON public.events;
CREATE TRIGGER events_touch_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
DROP TRIGGER IF EXISTS projects_touch_updated_at ON public.projects;
CREATE TRIGGER projects_touch_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

GRANT SELECT ON public.events, public.officers, public.projects TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.events, public.officers, public.projects TO authenticated;
GRANT SELECT ON public.signups, public.email_subscribers TO authenticated;
GRANT SELECT ON public.officer_access TO authenticated;
GRANT ALL ON public.signups, public.email_subscribers, public.events, public.officers, public.projects, public.officer_access TO service_role;

ALTER TABLE public.signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.officer_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read events" ON public.events;
CREATE POLICY "Public can read events" ON public.events FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Officers can create events" ON public.events;
CREATE POLICY "Officers can create events" ON public.events FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.officer_access WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Officers can update events" ON public.events;
CREATE POLICY "Officers can update events" ON public.events FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.officer_access WHERE user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.officer_access WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Officers can delete events" ON public.events;
CREATE POLICY "Officers can delete events" ON public.events FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.officer_access WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Public can read officers" ON public.officers;
CREATE POLICY "Public can read officers" ON public.officers FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Officers can create officers" ON public.officers;
CREATE POLICY "Officers can create officers" ON public.officers FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.officer_access WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Officers can update officers" ON public.officers;
CREATE POLICY "Officers can update officers" ON public.officers FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.officer_access WHERE user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.officer_access WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Officers can delete officers" ON public.officers;
CREATE POLICY "Officers can delete officers" ON public.officers FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.officer_access WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Public can read projects" ON public.projects;
CREATE POLICY "Public can read projects" ON public.projects FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Officers can create projects" ON public.projects;
CREATE POLICY "Officers can create projects" ON public.projects FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.officer_access WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Officers can update projects" ON public.projects;
CREATE POLICY "Officers can update projects" ON public.projects FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.officer_access WHERE user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.officer_access WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Officers can delete projects" ON public.projects;
CREATE POLICY "Officers can delete projects" ON public.projects FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.officer_access WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Officers can read signups" ON public.signups;
CREATE POLICY "Officers can read signups" ON public.signups FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.officer_access WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Officers can read subscribers" ON public.email_subscribers;
CREATE POLICY "Officers can read subscribers" ON public.email_subscribers FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.officer_access WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Users can read own officer access" ON public.officer_access;
CREATE POLICY "Users can read own officer access" ON public.officer_access FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.submit_signup(
  p_full_name text,
  p_email text,
  p_working_on_project boolean,
  p_project_role text,
  p_membership_type text,
  p_referral_source text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_full_name IS NULL OR char_length(trim(p_full_name)) NOT BETWEEN 2 AND 120
    OR p_email IS NULL OR char_length(trim(p_email)) NOT BETWEEN 3 AND 320
    OR p_membership_type NOT IN ('founder', 'general_member')
    OR p_referral_source IS NULL OR char_length(trim(p_referral_source)) NOT BETWEEN 1 AND 80
    OR (p_working_on_project AND p_project_role NOT IN ('founder', 'team_member'))
    OR (NOT p_working_on_project AND p_project_role IS NOT NULL)
  THEN
    RAISE EXCEPTION 'Invalid signup';
  END IF;

  INSERT INTO public.signups (full_name, email, working_on_project, project_role, membership_type, referral_source)
  VALUES (trim(p_full_name), lower(trim(p_email)), p_working_on_project, p_project_role, p_membership_type, trim(p_referral_source));
END;
$$;

CREATE OR REPLACE FUNCTION public.subscribe_email(p_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_email IS NULL OR char_length(trim(p_email)) NOT BETWEEN 3 AND 320 OR position('@' IN p_email) < 2 THEN
    RAISE EXCEPTION 'Invalid email';
  END IF;

  INSERT INTO public.email_subscribers (email)
  VALUES (lower(trim(p_email)))
  ON CONFLICT ((lower(trim(email)))) DO UPDATE SET unsubscribed_at = NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.submit_signup(text, text, boolean, text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.subscribe_email(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_signup(text, text, boolean, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.subscribe_email(text) TO anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;