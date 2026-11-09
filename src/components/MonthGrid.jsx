import { addDays, startOfWeek, toISO, weekdayShort, fmtLong } from '../utils/dates'
import { useI18n } from '../i18n/I18nProvider'

// Generic month grid. renderDay(iso) returns the chips shown inside a day cell.
export default function MonthGrid({ month, weekStart, selected, today, onSelect, renderDay }) {
  const { t } = useI18n()
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const start = startOfWeek(first, weekStart)
  const weeks = Math.ceil(((first.getDay() - weekStart + 7) % 7 + new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()) / 7)
  const cells = Array.from({ length: weeks * 7 }, (_, i) => addDays(start, i))
  const heads = Array.from({ length: 7 }, (_, i) => weekdayShort((weekStart + i) % 7))
  return (
    <div className="scroll-x">
      <div className="mg" role="grid" aria-label={t('cal.monthCalendar')}>
        {heads.map((h) => <div key={h} className="mg-head">{h}</div>)}
        {cells.map((d) => {
          const iso = toISO(d)
          const other = d.getMonth() !== month.getMonth()
          return (
            <div key={iso} role="gridcell" className={`mg-cell ${other ? 'other' : ''} ${iso === today ? 'today' : ''} ${iso === selected ? 'sel' : ''}`} onClick={() => onSelect(iso)}>
              <button className="mg-num" onClick={(e) => { e.stopPropagation(); onSelect(iso) }} aria-label={fmtLong(iso)}>{d.getDate()}</button>
              <div className="mg-items">{renderDay(iso)}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
