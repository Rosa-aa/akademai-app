// localStorage helper. Keys are namespaced and versioned (v2) so the old stage-1 data is ignored.
const P = 'akademai:v2:'
export const load = (key, fallback) => {
  try { const v = localStorage.getItem(P + key); return v ? JSON.parse(v) : fallback } catch { return fallback }
}
export const save = (key, value) => {
  try { localStorage.setItem(P + key, JSON.stringify(value)) } catch { /* storage full or blocked */ }
}
export const clearAll = () => {
  try { Object.keys(localStorage).filter((k) => k.startsWith('akademai:')).forEach((k) => localStorage.removeItem(k)) } catch { /* ignore */ }
}
