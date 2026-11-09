import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

// Supabase Auth session + the user's profile row (role: student | teacher | admin).
// Mounted only around the Course Materials page, so the rest of the app does not depend on Supabase.
const Ctx = createContext(null)
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const uid = session?.user?.id ?? null

  useEffect(() => {
    if (!supabase) return undefined
    let live = true
    supabase.auth.getSession().then(({ data }) => { if (live) { setSession(data.session); if (!data.session) setLoading(false) } })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { setSession(s); if (!s) { setProfile(null); setLoading(false) } })
    return () => { live = false; sub.subscription.unsubscribe() }
  }, [])

  // Loaded in a separate effect (calling Supabase inside onAuthStateChange can dead-lock).
  useEffect(() => {
    if (!supabase || !uid) return undefined
    let live = true
    setLoading(true)
    supabase.from('profiles').select('id, full_name, role, study_group_id').eq('id', uid).maybeSingle()
      .then(({ data }) => { if (live) { setProfile(data ?? null); setLoading(false) } })
    return () => { live = false }
  }, [uid])

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) throw error
  }, [])
  // New accounts are always students; an administrator promotes teachers (see SUPABASE_SETUP.md).
  const signUp = useCallback(async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { full_name: fullName.trim() } } })
    if (error) throw error
    return { needsConfirm: !data.session }
  }, [])
  const signOut = useCallback(() => supabase.auth.signOut(), [])

  const value = useMemo(() => ({ configured: isSupabaseConfigured, loading, session, user: session?.user ?? null, profile, role: profile?.role ?? null, signIn, signUp, signOut }),
    [loading, session, profile, signIn, signUp, signOut])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
