import { Link } from 'react-router-dom'
import Icon from './Icon'
export default function StatCard({ label, value, sub, icon, tone = 'violet', to }) {
  const body = (
    <>
      <span className={`ico t-${tone}`}><Icon name={icon} size={20} /></span>
      <small>{label}</small>
      <b>{value}</b>
      {sub && <em>{sub}</em>}
    </>
  )
  return to ? <Link to={to} className="stat">{body}</Link> : <div className="stat">{body}</div>
}
