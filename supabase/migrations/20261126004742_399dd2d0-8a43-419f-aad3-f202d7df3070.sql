ALTER FUNCTION public.submit_signup(text, text, boolean, text, text, text) SECURITY INVOKER;
ALTER FUNCTION public.subscribe_email(text) SECURITY INVOKER;
REVOKE EXECUTE ON FUNCTION public.submit_signup(text, text, boolean, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.subscribe_email(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_signup(text, text, boolean, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.subscribe_email(text) TO service_role;