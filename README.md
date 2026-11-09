# AkademAI (stage 2)

Student portal built with React 18, Vite, React Router and Recharts.

## Deploy (GitHub + Vercel)
Framework: Vite · Build command: `npm run build` · Output directory: `dist` · Node 18+.
`vercel.json` rewrites every path to `index.html`, so direct links and page refreshes (e.g. `/grades`) work with React Router.
The existing sections need no environment variables. The **Course Materials** section needs `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (see `SUPABASE_SETUP.md`). Optional: `VITE_AI_API_URL` (see `.env.example`); never commit `.env` files or secret keys.

## Run locally
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

## Colour theme (Navy / White / Light Gray)
All colours are CSS variables at the top of `src/index.css` (`:root` = light, `[data-theme=dark]` = dark). Change the palette there only.
`--brand #142B49` (sidebar, headings) · `--primary #24466B` (buttons, toggles) · `--surface #FFFFFF` · `--bg #F1F4F8` · `--tint #DCE7F2` (active menu, selected) · `--text #263445` · `--line #E1E6ED` · `--muted #5F6F82` (secondary text).
Course colours are in `src/data/index.js`; badge tones are `.t-*` in `index.css`.

## Structure
- `src/data/index.js` central demo data (courses, instructors, timetable, exams, assignments, studies, attendance, notifications). Everything references `courseId`.
- `src/store/AppStore.jsx` state + localStorage persistence + derived data (statuses, grades, unread counts).
- `src/utils/` dates, academic calculations, IndexedDB file store, text extraction.
- `src/services/aiService.js` AI entry point; `mockAI.js` is the offline engine.
- `src/pages/` one file per sidebar section.

## Languages (AZ / EN / RU)
Azerbaijani is the default. On the first visit a welcome screen asks for the language; after that the AZ / EN / RU switcher in the top bar and the Language setting change it at any time. The choice is saved in localStorage (`akademai:v2:lang`) and survives refreshes and "Reset demo data".
- `src/i18n/translations.js` collects the dictionaries in `src/i18n/locales/<az|en|ru>/` (`ui.js` = interface texts, `content.js` = course names, assignment and study texts, exam notes, student info). **Edit texts there only.**
- Components call `const { t } = useI18n()` then `t('nav.grades')`; plain helpers (dates, notifications, AI engine) use `translate()` from `src/i18n`. Plural entries use `{ one, few, many, other }`, placeholders look like `{name}`.
- Statuses, types and categories (`New`, `Midterm`, `Homework` …) stay stable keys in the data and in localStorage; only their labels are translated.
- Notifications are stored as text keys plus ids, so they switch language too. Person names (student, instructors) are data and are not translated.
- `npm run check:i18n` verifies that all three languages have the same keys and that every `t('key')` used in the code exists.
- The AI Teacher offline engine understands requests in all three languages and answers in the interface language. For a real LLM backend the language is sent as `context.language`.

## Course Materials (Dərs Materialları)
Sidebar section `/materials`: teachers upload syllabi, lecture notes, presentations, PDF/DOCX/PPTX files (with description, subject, groups, academic year), replace files and delete their own materials; students browse, search, filter, preview (PDF pages, DOCX text, PPTX slide text) and download. Administrators manage everything.
Backed by **Supabase** (Auth + Postgres + private Storage bucket) with Row Level Security; no browser-only storage. Setup, roles, sample PDFs, Vercel steps: **`SUPABASE_SETUP.md`**. SQL: `supabase/schema.sql`.
Code: `src/pages/Materials.jsx`, `src/components/Material*.jsx`, `src/services/materials.js`, `src/store/AuthStore.jsx`, `src/lib/supabase.js`. Texts: `src/i18n/locales/*/materials.js`.

## Persistence
localStorage (keys `akademai:v2:*`): task status/answers/file metadata, notifications, profile, preferences, AI chats and file metadata.
Binary files and extracted text are in IndexedDB. Settings > Reset demo data clears both.

## AI Teacher
PDF, DOCX, PPTX and TXT text is extracted in the browser. `.doc` (legacy) and scanned PDFs cannot be read and are reported as such.
Without configuration an offline keyword engine answers (summary, key topics, fill-in-the-blank questions, study plan, passage search). It is not an LLM.
To connect a real model set `VITE_AI_API_URL` (see `.env.example`) to your own backend. Contract: POST `{message, history, documents:[{name,text}], context}` (context includes `language`: `az` | `en` | `ru`) returns `{reply}`. Keep API keys on the server.

## Needs a backend / external service
Real AI answers, authentication for the other sections and password change, email notifications, server-side storage of student submissions (course materials are already server-side), grades/schedule from a university system, OCR for scanned PDFs, legacy `.doc` parsing.
