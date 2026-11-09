import { translate as tr } from '../i18n'

// Room labels: '204' -> "Room 204" / "Otaq 204" / "Аудитория 204"; 'Hall A' -> "Hall A" / "Zal A" / "Зал A".
export function fmtRoom(room) {
  if (room == null) return ''
  const r = String(room)
  if (/^\d/.test(r)) return tr('common.roomN', { n: r })
  const hall = r.match(/^Hall (.+)$/)
  return hall ? tr('common.hallN', { n: hall[1] }) : r
}
