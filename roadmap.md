# Supabase migration

- [x] Inspect the current backend, data, authentication, forms, and admin access.
- [x] Export the six requested tables, schema, relationships, indexes, RLS policies, and functions; verify the downloadable archive.
- [x] Remove Lovable Cloud with user approval and connect the existing Foothill Startup Club Supabase project `kobdcztkdldgjjqdclds`.
- [x] Recreate missing tables, functions, grants, RLS policies, and officer access without overwriting existing Supabase data; all six source CSVs contained zero records.
- [x] Point `src/services/clubData.ts` and authentication at external Supabase; preserve all frontend UI and behavior.
- [x] Remove Cloud/Bolt runtime dependencies and references that are not platform-owned.
- [ ] Create and verify the first officer account (waiting for the user's officer email).
- [ ] Verify public reads, forms, authentication, officer permissions, RLS, TypeScript, tests, and production build.
- [ ] Report verification results and remaining user actions; do not publish.
