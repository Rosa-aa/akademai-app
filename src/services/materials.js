// Course Materials data layer: Supabase Database (metadata) + Supabase Storage (files). No browser-only storage.
import { supabase, BUCKET } from '../lib/supabase'
import { extOf } from '../utils/fileStore'
import { SAMPLE_MATERIALS, SAMPLE_SUBJECT_CODE, SAMPLE_GROUP, SAMPLE_YEAR } from '../lib/sampleMaterials'

export const MATERIAL_EXTS = ['pdf', 'docx', 'pptx', 'doc', 'ppt']
export const MAX_FILE_SIZE = 25 * 1048576
export const CATEGORIES = ['syllabus', 'lecture', 'presentation', 'seminar', 'exam_prep', 'other']
const MIME = {
  pdf: 'application/pdf', doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ppt: 'application/vnd.ms-powerpoint', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
}
export const academicYears = (now = new Date()) => { const y = now.getFullYear(); return [y - 2, y - 1, y, y + 1].map((a) => `${a}/${a + 1}`) }

// Error with a translation key (section materials.err) so messages follow the interface language.
export class MaterialError extends Error { constructor(key, detail) { super(detail || key); this.key = key; this.detail = detail } }
const fail = (error, fallback = 'generic') => {
  if (!error) return null
  const m = `${error.message ?? ''} ${error.error ?? ''}`.toLowerCase()
  if (error.code === '42501' || m.includes('row-level security') || m.includes('permission denied') || m.includes('not authorized') || error.statusCode === '403') return new MaterialError('permission')
  if (m.includes('failed to fetch') || m.includes('network')) return new MaterialError('network')
  if (m.includes('exceeded') || m.includes('too large') || error.statusCode === '413') return new MaterialError('tooLarge')
  if (m.includes('mime') || m.includes('not supported')) return new MaterialError('badType')
  return new MaterialError(fallback, error.message)
}
const need = () => { if (!supabase) throw new MaterialError('notConfigured') }

const SELECT = `id, title, description, category, academic_year, file_path, file_name, file_ext, file_size, mime_type, is_sample, created_at, updated_at, teacher_id,
  teacher:profiles(id, full_name),
  subject:subjects(id, name, code, department:departments(id, name, faculty:faculties(id, name))),
  material_groups(group:study_groups(id, name))`

const flat = (r) => ({
  ...r,
  teacherName: r.teacher?.full_name || '—',
  subjectId: r.subject?.id, subjectName: r.subject?.name ?? '—', subjectCode: r.subject?.code ?? '',
  departmentId: r.subject?.department?.id, departmentName: r.subject?.department?.name ?? '—',
  facultyId: r.subject?.department?.faculty?.id, facultyName: r.subject?.department?.faculty?.name ?? '—',
  groups: (r.material_groups ?? []).map((g) => g.group).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name)),
})

export async function fetchCatalog() {
  need()
  const [f, d, g, s] = await Promise.all([
    supabase.from('faculties').select('id, name').order('name'),
    supabase.from('departments').select('id, name, faculty_id').order('name'),
    supabase.from('study_groups').select('id, name, faculty_id').order('name'),
    supabase.from('subjects').select('id, name, code, department_id').order('name'),
  ])
  const err = f.error || d.error || g.error || s.error
  if (err) throw fail(err, 'load')
  return { faculties: f.data, departments: d.data, groups: g.data, subjects: s.data }
}

export async function fetchMaterials() {
  need()
  const { data, error } = await supabase.from('materials').select(SELECT).order('created_at', { ascending: false })
  if (error) throw fail(error, 'load')
  return data.map(flat)
}

const safeName = (n) => n.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w.\-]+/g, '_').replace(/^_+|_+$/g, '').slice(-120) || 'file'
const checkFile = (file) => {
  const ext = extOf(file.name)
  if (!MATERIAL_EXTS.includes(ext)) throw new MaterialError('badType')
  if (file.size === 0) throw new MaterialError('empty')
  if (file.size > MAX_FILE_SIZE) throw new MaterialError('tooLarge')
  return ext
}
async function putFile(folder, id, file, ext) {
  const path = `${folder}/${id}/${Date.now()}-${safeName(file.name)}`
  // Some systems report an empty/odd MIME type for .docx/.pptx; the bucket only accepts the real ones, so the type is set from the extension.
  const body = new File([file], file.name, { type: MIME[ext] })
  const { error } = await supabase.storage.from(BUCKET).upload(path, body, { contentType: MIME[ext], upsert: false, cacheControl: '3600' })
  if (error) throw fail(error, 'upload')
  return path
}
const removeObject = (path) => supabase.storage.from(BUCKET).remove([path]).catch(() => {})

// Uploads the file to Storage, then saves its metadata. If the database step fails the uploaded file is removed again.
export async function createMaterial({ file, title, description = '', category, subjectId, academicYear, groupIds = [], teacherId, isSample = false }) {
  need()
  const ext = checkFile(file)
  const id = crypto.randomUUID()
  const path = await putFile(teacherId, id, file, ext)
  const { error } = await supabase.from('materials').insert({
    id, title: title.trim(), description: description.trim(), category, subject_id: subjectId, academic_year: academicYear, teacher_id: teacherId,
    file_path: path, file_name: file.name, file_ext: ext, file_size: file.size, mime_type: MIME[ext], is_sample: isSample,
  })
  if (error) { await removeObject(path); throw fail(error, 'save') }
  if (groupIds.length) {
    const { error: ge } = await supabase.from('material_groups').insert(groupIds.map((g) => ({ material_id: id, group_id: g })))
    if (ge) { await supabase.from('materials').delete().eq('id', id); await removeObject(path); throw fail(ge, 'save') }
  }
  return id
}

// Edits the fields and groups; `file` (optional) replaces the stored file. The old file is removed only after the new one is saved.
export async function updateMaterial(material, { file, title, description, category, subjectId, academicYear, groupIds }) {
  need()
  const patch = { title: title.trim(), description: description.trim(), category, subject_id: subjectId, academic_year: academicYear }
  let newPath = null
  if (file) {
    const ext = checkFile(file)
    newPath = await putFile(material.teacher_id, material.id, file, ext)
    Object.assign(patch, { file_path: newPath, file_name: file.name, file_ext: ext, file_size: file.size, mime_type: MIME[ext] })
  }
  const { data, error } = await supabase.from('materials').update(patch).eq('id', material.id).select('id')
  if (error || !data?.length) { if (newPath) await removeObject(newPath); throw error ? fail(error, 'save') : new MaterialError('permission') }
  if (newPath) await removeObject(material.file_path)
  const have = new Set(material.groups.map((g) => g.id)), want = new Set(groupIds)
  const drop = [...have].filter((g) => !want.has(g)), add = [...want].filter((g) => !have.has(g))
  if (drop.length) { const { error: e } = await supabase.from('material_groups').delete().eq('material_id', material.id).in('group_id', drop); if (e) throw fail(e, 'save') }
  if (add.length) { const { error: e } = await supabase.from('material_groups').insert(add.map((g) => ({ material_id: material.id, group_id: g }))); if (e) throw fail(e, 'save') }
}

export async function deleteMaterial(material) {
  need()
  const { data, error } = await supabase.from('materials').delete().eq('id', material.id).select('id')
  if (error) throw fail(error, 'delete')
  if (!data?.length) throw new MaterialError('permission') // RLS hides rows the user may not delete
  await removeObject(material.file_path)
}

// Downloads go through a short-lived signed URL (the bucket is private).
export async function downloadMaterial(material) {
  need()
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(material.file_path, 120, { download: material.file_name })
  if (error) throw fail(error, 'download')
  const a = Object.assign(document.createElement('a'), { href: data.signedUrl, rel: 'noopener' })
  document.body.appendChild(a); a.click(); a.remove()
}
export async function fetchMaterialBlob(material) {
  need()
  const { data, error } = await supabase.storage.from(BUCKET).download(material.file_path)
  if (error) throw fail(error, 'preview')
  return data
}

// Uploads the 5 sample PDFs through the same code path as a normal upload (teacher/administrator only; skips files already loaded).
export async function installSamples({ catalog, teacherId, existing }) {
  need()
  const subject = catalog.subjects.find((s) => s.code === SAMPLE_SUBJECT_CODE)
  const group = catalog.groups.find((g) => g.name === SAMPLE_GROUP)
  if (!subject || !group) throw new MaterialError('catalogMissing')
  let added = 0
  for (const s of SAMPLE_MATERIALS) {
    if (existing.some((m) => m.is_sample && m.file_name === s.file)) continue
    const res = await fetch(`/sample-materials/${s.file}`)
    if (!res.ok) throw new MaterialError('sampleMissing', s.file)
    const file = new File([await res.blob()], s.file, { type: 'application/pdf' })
    await createMaterial({ file, title: s.title, description: s.description, category: s.category, subjectId: subject.id, academicYear: SAMPLE_YEAR, groupIds: [group.id], teacherId, isSample: true })
    added++
  }
  return added
}
