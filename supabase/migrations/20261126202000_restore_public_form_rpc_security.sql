BEGIN;

ALTER FUNCTION public.submit_signup(text, text, boolean, text, text, text)
  SECURITY DEFINER;
ALTER FUNCTION public.subscribe_email(text)
  SECURITY DEFINER;

ALTER FUNCTION public.submit_signup(text, text, boolean, text, text, text)
  SET search_path = pg_catalog;
ALTER FUNCTION public.subscribe_email(text)
  SET search_path = pg_catalog;

REVOKE EXECUTE ON FUNCTION public.submit_signup(text, text, boolean, text, text, text)
  FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.subscribe_email(text)
  FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION public.submit_signup(text, text, boolean, text, text, text)
  FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.subscribe_email(text)
  FROM anon, authenticated;

GRANT EXECUTE ON FUNCTION public.submit_signup(text, text, boolean, text, text, text)
  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.subscribe_email(text)
  TO anon, authenticated;

REVOKE ALL ON TABLE public.signups FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.email_subscribers FROM PUBLIC, anon;

COMMIT;
