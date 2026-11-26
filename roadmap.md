# Supabase migration

- [x] Inspect the current backend, data, authentication, forms, and admin access.
- [x] Export the six requested tables, schema, relationships, indexes, RLS policies, and functions; verify the downloadable archive.
- [ ] Obtain approval to remove Lovable Cloud before destination verification (required before external Supabase can connect), then connect the existing Foothill Startup Club Supabase project `kobdcztkdldgjjqdclds`.
- [ ] Recreate missing tables, functions, grants, RLS policies, and officer access without overwriting existing Supabase data.
- [ ] Point `src/services/clubData.ts` and authentication at external Supabase; preserve all frontend UI and behavior.
- [ ] Remove Cloud/Bolt runtime dependencies and references that are not platform-owned.
- [ ] Verify public reads, forms, authentication, officer permissions, RLS, TypeScript, tests, and production build.
- [ ] Report verification results and remaining user actions; do not publish.
