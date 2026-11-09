// npm run seed — loads the 5 SAMPLE PDFs into Supabase Storage + Database, optionally creates demo accounts.
// Needs the SECRET service-role key (run it on your own computer only; never put it in Vercel or the browser):
//   SUPABASE_URL (or VITE_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY   — from .env.local or the shell
//   SEED_DEMO_USERS=true   — also creates admin / teacher / student demo users (password: SEED_PASSWORD or a random one that is printed)
//   SEED_TEACHER_EMAIL     — owner of the sample materials when SEED_DEMO_USERS is not used (must already be a teacher/admin)
import { readFileSync, existsSync } from 'node:fs'
import { randomUUID, randomBytes } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { SAMPLE_MATERIALS, SAMPLE_SUBJECT_CODE, SAMPLE_GROUP, SAMPLE_YEAR } from '../src/lib/sampleMaterials.js'

for (const f of ['.env.local', '.env']) if (existsSync(f)) for (const l of readFileSync(f, 'utf8').split(/\r?\n/)) { const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/); if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) { console.error('Set SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.'); process.exit(1) }
const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
const must = (r, what) => { if (r.error) { console.error(`${what}: ${r.error.message}`); process.exit(1) } return r.data }

async function ensureUser(email, fullName, role, password, groupName) {
  let id
  const created = await sb.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: fullName } })
  if (created.error) {
    if (!/already|registered|exists/i.test(created.error.message)) { console.error(`createUser ${email}: ${created.error.message}`); process.exit(1) }
    const list = must(await sb.auth.admin.listUsers({ page: 1, perPage: 1000 }), 'listUsers')
    id = list.users.find((u) => u.email === email)?.id
    console.log(`  = ${email} already exists (password unchanged)`)
  } else { id = created.data.user.id; console.log(`  + ${email} (${role})`) }
  const patch = { role, full_name: fullName }
  if (groupName) { const g = must(await sb.from('study_groups').select('id').eq('name', groupName).maybeSingle(), 'group'); if (g) patch.study_group_id = g.id }
  must(await sb.from('profiles').update(patch).eq('id', id), 'profile update')
  return id
}

let teacherId
if (process.env.SEED_DEMO_USERS === 'true') {
  const pw = process.env.SEED_PASSWORD || randomBytes(9).toString('base64url')
  console.log('Demo users:')
  await ensureUser('admin@akademai.demo', 'Administrator', 'admin', pw)
  teacherId = await ensureUser('teacher@akademai.demo', 'Kamran İsmayılov', 'teacher', pw)
  await ensureUser('student@akademai.demo', 'Turan Qəhrəmanov', 'student', pw, SAMPLE_GROUP)
  if (!process.env.SEED_PASSWORD) console.log(`  Password for all three demo users: ${pw}   (shown once — change or delete them before going live)`)
} else {
  const email = process.env.SEED_TEACHER_EMAIL
  if (!email) { console.error('Set SEED_DEMO_USERS=true, or SEED_TEACHER_EMAIL=<an existing teacher/admin account>.'); process.exit(1) }
  const list = must(await sb.auth.admin.listUsers({ page: 1, perPage: 1000 }), 'listUsers')
  teacherId = list.users.find((u) => u.email === email)?.id
  if (!teacherId) { console.error(`No user with email ${email}`); process.exit(1) }
}

const subject = must(await sb.from('subjects').select('id').eq('code', SAMPLE_SUBJECT_CODE).maybeSingle(), 'subject')
const group = must(await sb.from('study_groups').select('id').eq('name', SAMPLE_GROUP).maybeSingle(), 'group')
if (!subject || !group) { console.error('Catalog is empty — run supabase/schema.sql first.'); process.exit(1) }
const have = must(await sb.from('materials').select('file_name').eq('is_sample', true), 'existing').map((m) => m.file_name)

console.log('Sample materials:')
for (const s of SAMPLE_MATERIALS) {
  if (have.includes(s.file)) { console.log(`  = ${s.file} already loaded`); continue }
  const bytes = readFileSync(new URL(`../public/sample-materials/${s.file}`, import.meta.url))
  const id = randomUUID(), path = `${teacherId}/${id}/${Date.now()}-${s.file}`
  must(await sb.storage.from('course-materials').upload(path, bytes, { contentType: 'application/pdf', upsert: false }), `upload ${s.file}`)
  const ins = await sb.from('materials').insert({ id, title: s.title, description: s.description, category: s.category, subject_id: subject.id, academic_year: SAMPLE_YEAR, teacher_id: teacherId,
    file_path: path, file_name: s.file, file_ext: 'pdf', file_size: bytes.length, mime_type: 'application/pdf', is_sample: true })
  if (ins.error) { await sb.storage.from('course-materials').remove([path]); must(ins, `insert ${s.file}`) }
  must(await sb.from('material_groups').insert({ material_id: id, group_id: group.id }), 'group link')
  console.log(`  + ${s.file}`)
}
console.log('Done.')
