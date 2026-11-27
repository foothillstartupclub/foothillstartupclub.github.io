BEGIN;

-- Backward-compatible: add nullable detail columns for custom "Other…" answers.
ALTER TABLE public.signups ADD COLUMN IF NOT EXISTS membership_other text;
ALTER TABLE public.signups ADD COLUMN IF NOT EXISTS referral_other text;

-- Widen the membership_type check to allow the "other" option.
ALTER TABLE public.signups DROP CONSTRAINT IF EXISTS signups_membership_type_check;
ALTER TABLE public.signups
  ADD CONSTRAINT signups_membership_type_check
  CHECK (membership_type = ANY (ARRAY['founder'::text, 'general_member'::text, 'other'::text]));

-- Replace the RPC with an overload that accepts the two new optional detail
-- params. Defaults keep older 6-argument callers working.
DROP FUNCTION IF EXISTS public.submit_signup(text, text, boolean, text, text, text);

CREATE OR REPLACE FUNCTION public.submit_signup(
  p_full_name text,
  p_email text,
  p_working_on_project boolean,
  p_project_role text,
  p_membership_type text,
  p_referral_source text,
  p_membership_other text DEFAULT NULL,
  p_referral_other text DEFAULT NULL
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'pg_catalog'
AS $function$
BEGIN
  IF p_full_name IS NULL OR char_length(trim(p_full_name)) NOT BETWEEN 2 AND 120
    OR p_email IS NULL OR char_length(trim(p_email)) NOT BETWEEN 3 AND 320
    OR p_membership_type NOT IN ('founder', 'general_member', 'other')
    OR p_referral_source IS NULL OR char_length(trim(p_referral_source)) NOT BETWEEN 1 AND 80
    OR (p_working_on_project AND p_project_role NOT IN ('founder', 'team_member'))
    OR (NOT p_working_on_project AND p_project_role IS NOT NULL)
    OR (p_membership_type = 'other'
        AND char_length(trim(coalesce(p_membership_other, ''))) NOT BETWEEN 1 AND 160)
    OR (p_membership_type <> 'other' AND trim(coalesce(p_membership_other, '')) <> '')
    OR (trim(coalesce(p_referral_other, '')) <> ''
        AND char_length(trim(p_referral_other)) NOT BETWEEN 1 AND 160)
  THEN
    RAISE EXCEPTION 'Invalid signup';
  END IF;

  INSERT INTO public.signups (
    full_name, email, working_on_project, project_role,
    membership_type, referral_source, membership_other, referral_other
  )
  VALUES (
    trim(p_full_name), lower(trim(p_email)), p_working_on_project, p_project_role,
    p_membership_type, trim(p_referral_source),
    nullif(trim(p_membership_other), ''), nullif(trim(p_referral_other), '')
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.submit_signup(text, text, boolean, text, text, text, text, text)
  FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.submit_signup(text, text, boolean, text, text, text, text, text)
  FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_signup(text, text, boolean, text, text, text, text, text)
  TO anon, authenticated;

COMMIT;