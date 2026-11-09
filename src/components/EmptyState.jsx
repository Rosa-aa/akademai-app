import Icon from './Icon'
export default function EmptyState({ icon = 'Inbox', title, text, action }) {
  return <div className="empty-state"><Icon name={icon} size={32} /><b>{title}</b>{text && <p>{text}</p>}{action}</div>
}
