import * as L from 'lucide-react'
export default function Icon({ name, size = 20, ...p }) {
  const C = L[name] || L.Circle
  return <C size={size} {...p} />
}
