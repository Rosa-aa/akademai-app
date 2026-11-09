# Course Materials — Supabase setup (AkademAI)

The existing app had **no login and no server** (data lived in the browser). The new **Dərs Materialları** section therefore adds Supabase:
**Auth** (sign-in, roles), **Postgres** (metadata) and **Storage** (the files, in a *private* bucket). Everything else in AkademAI works as before and does not depend on Supabase.

## 1. Create the Supabase project (5 min)
1. supabase.com → New project (any region; save the database password).
2. **SQL Editor → New query** → paste the whole of `supabase/schema.sql` → **Run**. (Safe to run again.) It creates tables, roles, Row Level Security, the private bucket `course-materials` (25 MB limit; PDF/DOC/DOCX/PPT/PPTX only) and a catalog: faculty, 4 departments, groups AM-31/32/33, 8 subjects. Edit the catalog in **Table Editor** (`faculties`, `departments`, `study_groups`, `subjects`).
3. **Authentication → Providers → Email**: for a quick demo switch **off** "Confirm email" (otherwise new users must click the emailed link before signing in; the app shows that message).
4. **Project Settings → API**: copy the **Project URL** and the **anon public** key.

## 2. Environment variables
| Variable | Where | Secret? |
|---|---|---|
| `VITE_SUPABASE_URL` | `.env.local` and Vercel | no (public) |
| `VITE_SUPABASE_ANON_KEY` | `.env.local` and Vercel | no (public; protected by RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | **only** your computer, for `npm run seed` | **YES – never in Vercel/GitHub** |

Local: `cp .env.example .env.local`, fill the two `VITE_` values, `npm install`, `npm run dev`.

## 3. Roles
| Role | Can |
|---|---|
| student (default for every sign-up) | browse, search, filter, preview, download |
| teacher | all of the above + upload, edit, replace file, delete **own** materials |
| admin | manage **all** materials and the catalog, change roles |

The role is **never** taken from the sign-up form (a database trigger always creates a student; another trigger blocks role changes by non-admins).
Promote someone: sign up in the app, then in **SQL Editor**:
```sql
update public.profiles set role = 'teacher' where id = (select id from auth.users where email = 'name@university.edu');
-- or 'admin'. Put a student into a group (enables the "my group only" filter):
update public.profiles set study_group_id = (select id from public.study_groups where name = 'AM-32') where id = (select id from auth.users where email = 'student@university.edu');
```

## 4. Sample PDFs (5 Azerbaijani documents, labelled NÜMUNƏ MATERİAL / SAMPLE MATERIAL)
Files: `public/sample-materials/` (regenerate: `pip install reportlab && npm run samples:pdf`). Subject "Verilənlər bazası sistemləri", group AM-32.
Load them into persistent storage — either:
- **In the app (easiest):** sign in as a teacher or admin → empty list shows **"Nümunə materialları yüklə"**. It uploads the 5 PDFs through the normal upload path (Storage + database), owned by you. Re-clicking never duplicates them.
- **Script:** `SUPABASE_SERVICE_ROLE_KEY=… SEED_DEMO_USERS=true npm run seed` (creates admin@/teacher@/student@akademai.demo with a printed random password, then loads the PDFs). Without demo users: `SEED_TEACHER_EMAIL=you@… npm run seed`. Delete demo users before going live.

## 5. Deploy on Vercel (manual steps)
1. Push the project to GitHub (`.env*` files are git-ignored; never commit the service-role key).
2. vercel.com → Add New → Project → import the repo (Framework: Vite; build `npm run build`; output `dist`; `vercel.json` is included).
3. **Settings → Environment Variables**: add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (Production, Preview, Development) **before** deploying. These are baked in at build time — after changing them, **Redeploy**.
4. Supabase → **Authentication → URL Configuration**: set *Site URL* to your Vercel URL (needed only if you keep email confirmation on).
5. Open `https://<your-app>.vercel.app/materials`, sign up, promote yourself to teacher/admin (section 3), load the samples.

## 6. How it works / limits
- Files live at `course-materials/<teacher-id>/<material-id>/<timestamp>-<name>`; the bucket is private. Download uses a 2-minute signed URL; preview downloads the file through your session (Storage policies apply).
- Preview: PDF page by page (pdf.js, works on phones), DOCX as text/HTML (sanitised), PPTX as slide text; `.doc`/`.ppt` are download-only.
- Replacing a file uploads the new one first and removes the old only after the database update succeeds.
- Students can read every material (filter by group, or tick "My group only"). Tell me if you want strict per-group visibility — it is one RLS policy change.
- Supabase free tier pauses inactive projects after about a week; first request afterwards may be slow.
- Troubleshooting: *"Database not connected"* → env vars missing at build time (redeploy). *"Profile not found"* → `schema.sql` not run before the user signed up (insert a row into `profiles`, or delete the user and sign up again). *"Fakültə, fənn və qrup siyahısı boşdur"* → catalog seed missing.

## 7. What was tested
See the summary delivered with this project: schema + RLS tested on PostgreSQL 16 (`supabase/tests`), and the full UI flow in headless Chromium against real Postgres + PostgREST with a local stand-in for Supabase's Auth/Storage HTTP APIs. **Not** tested against a live supabase.co project — do one smoke test after step 5 (sign up, promote, load samples, preview, download).
