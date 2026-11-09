Permission tests for `schema.sql`, run on a plain PostgreSQL 16 (not Supabase):
```
createdb t && psql -d t -f supabase-stubs.sql   # minimal stand-ins for Supabase's auth/storage schemas and roles
psql -d t -f ../schema.sql && psql -d t -f rls_test.sql
```
Each line prints what a student / teacher / admin / anonymous user is allowed or denied (tables and Storage objects).
Note: `supabase-stubs.sql` reads the user id from `request.jwt.claim.sub`; real Supabase also supports `request.jwt.claims`.
