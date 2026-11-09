import { student } from '../data'

// Browsers that ran an earlier build of the app saved the previous demo student in localStorage.
// If that saved profile is still the untouched sample (name unchanged), replace it with the current
// sample student. A profile the user edited themselves is left alone. The literals below are the
// only place the previous sample name remains, on purpose.
const PREVIOUS = { firstName: 'Aysel', lastName: 'Məmmədova', email: 'aysel.mammadova@student.demo' }

export function migrateProfile(p) {
  if (!p || p.firstName !== PREVIOUS.firstName || p.lastName !== PREVIOUS.lastName) return p
  return { ...p, firstName: student.firstName, lastName: student.lastName, email: p.email === PREVIOUS.email ? student.email : p.email }
}
