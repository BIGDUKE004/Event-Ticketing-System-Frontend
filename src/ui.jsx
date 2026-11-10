import { useEffect, useState } from 'react'
export const money = n => '₦' + Number(n).toLocaleString()
export const hue = s => [...s].reduce((a, c) => a + c.charCodeAt(0), 0) % 360
export const cover = id => ({ background: `linear-gradient(135deg,hsl(${hue(id)} 80% 45%),hsl(${(hue(id) + 60) % 360} 70% 25%))` })
export const Skel = ({ n = 6 }) => <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: n }, (_, i) => <div key={i} className="skel h-64" />)}</div>
export const Empty = ({ children }) => <div className="card p-10 text-center mut">{children}</div>
export const Err = ({ msg }) => <div role="alert" className="card p-4" style={{ color: 'var(--bad)' }}>{msg}</div>
export function useLoad(fn, deps = []) {
  const [s, set] = useState({ loading: true }); 
  useEffect(() => { let on = true; set({ loading: true }); fn().then(data => on && set({ data })).catch(e => on && set({ error: e.message })); return () => { on = false } }, deps)
  return s
}
export function Counter({ to }) {
  const [v, setV] = useState(0)
  useEffect(() => { const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches; if (reduce) return setV(to); let r, t0; const f = t => { t0 ??= t; const p = Math.min((t - t0) / 800, 1); setV(Math.round(to * p)); if (p < 1) r = requestAnimationFrame(f) }; r = requestAnimationFrame(f); return () => cancelAnimationFrame(r) }, [to])
  return <>{v.toLocaleString()}</>
}
export const tierInfo = e => { const t = e?.ticket_types ?? []; return { left: t.reduce((a, x) => a + x.available_quantity, 0), from: t.length ? Math.min(...t.map(x => x.price)) : null } }
export function EventCard({ e, Link }) {
  const { left, from } = tierInfo(e)
  return <Link to={`/events/${e.id}`} className="card overflow-hidden block">
    <div className="h-40 p-4 flex items-end" style={cover(e.id)}><span className="badge" style={{ background: '#fff', color: '#16141a' }}>{e.sold_out || left === 0 ? 'Sold out' : left < 20 ? `Only ${left} left` : `${left} left`}</span></div>
    <div className="p-4"><h3 className="text-lg font-extrabold">{e.name}</h3><p className="mut text-sm">{e.location}</p><p className="mt-2 font-bold">{from != null ? `From ${money(from)}` : 'Tickets soon'}</p></div></Link>
}
