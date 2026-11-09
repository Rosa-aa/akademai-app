// Supabase client for the "Course Materials" section (auth, database, file storage).
// Configure it with two PUBLIC variables (see .env.example and SUPABASE_SETUP.md):
//   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
// The anon key is safe in the browser: every table and the storage bucket are protected by Row Level Security.
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && key)
export const supabase = isSupabaseConfigured
  ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'akademai:supabase-auth' } })
  : null
export const BUCKET = 'course-materials'
