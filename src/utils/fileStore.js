// Binary files (and extracted text) live in IndexedDB; only small metadata goes to localStorage.
const DB = 'akademai-files', STORE = 'files'
let dbp
const open = () => (dbp ??= new Promise((res, rej) => {
  if (typeof indexedDB === 'undefined') return rej(new Error('IndexedDB unavailable'))
  const r = indexedDB.open(DB, 1)
  r.onupgradeneeded = () => r.result.createObjectStore(STORE)
  r.onsuccess = () => res(r.result)
  r.onerror = () => rej(r.error)
}))
const run = async (mode, fn) => {
  const db = await open()
  return new Promise((res, rej) => {
    const t = db.transaction(STORE, mode); const rq = fn(t.objectStore(STORE))
    t.oncomplete = () => res(rq.result); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error)
  })
}
const mem = new Map() // fallback when IndexedDB is blocked (files then last until reload)
export const newId = () => `f_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
export async function putRecord(id, rec) { try { await run('readwrite', (s) => s.put(rec, id)) } catch { mem.set(id, rec) } }
export async function getRecord(id) { try { return (await run('readonly', (s) => s.get(id))) ?? mem.get(id) } catch { return mem.get(id) } }
export async function deleteRecord(id) { mem.delete(id); try { await run('readwrite', (s) => s.delete(id)) } catch { /* ignore */ } }
export async function clearFiles() { mem.clear(); try { await run('readwrite', (s) => s.clear()) } catch { /* ignore */ } }
export async function downloadFile(id, name) {
  const rec = await getRecord(id)
  if (!rec?.blob) return false
  const url = URL.createObjectURL(rec.blob)
  const a = Object.assign(document.createElement('a'), { href: url, download: name })
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000)
  return true
}
export const extOf = (name) => (name.includes('.') ? name.split('.').pop().toLowerCase() : '')
