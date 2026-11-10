import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api, session } from '../api'
import { useLoad, Skel, Err, cover, money } from '../ui'
export default function EventPage() {
  const { id } = useParams(), nav = useNavigate(), [qty, setQty] = useState({})
  const { data: e, loading, error } = useLoad(() => api.event(id), [id])
  if (loading) return <Skel n={1} />
  if (error) return <Err msg={error} />
  const picked = (e.ticket_types ?? []).filter(t => qty[t.id] > 0), total = picked.reduce((a, t) => a + t.price * qty[t.id], 0), count = picked.reduce((a, t) => a + qty[t.id], 0)
  const go = () => session.user ? nav('/checkout', { state: { event: e, items: picked.map(t => ({ ticket_type_id: t.id, name: t.name, quantity: qty[t.id], total_amount: t.price * qty[t.id] })) } }) : nav('/login')
  return <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
    <div><div className="h-64 sm:h-80 rounded-2xl p-6 flex items-end" style={cover(e.id)}><h1 className="text-4xl sm:text-6xl font-extrabold text-white">{e.name}</h1></div>
      <p className="mut mt-4 font-medium">📍 {e.location}</p><h2 className="text-xl font-extrabold mt-6 mb-2">About</h2><p className="whitespace-pre-line leading-relaxed">{e.description}</p></div>
    <aside className="lg:sticky lg:top-24 self-start card p-5" aria-label="Tickets"><h2 className="font-extrabold text-xl mb-3">Tickets</h2>
      {!(e.ticket_types ?? []).length && <p className="mut">No tickets on sale yet.</p>}
      {(e.ticket_types ?? []).map(t => <div key={t.id} className="flex items-center justify-between py-3" style={{ borderTop: '1px solid var(--line)' }}>
        <div><p className="font-bold">{t.name}</p><p className="mut text-sm">{money(t.price)} · {t.sold_out ? 'Sold out' : `${t.available_quantity} left`}</p></div>
        <div className="flex items-center gap-2"><button className="btn ghost !px-3" aria-label={`Fewer ${t.name}`} disabled={!qty[t.id]} onClick={() => setQty({ ...qty, [t.id]: qty[t.id] - 1 })}>−</button>
          <span className="w-5 text-center" aria-live="polite">{qty[t.id] || 0}</span>
          <button className="btn ghost !px-3" aria-label={`More ${t.name}`} disabled={t.sold_out || (qty[t.id] || 0) >= Math.min(8, t.available_quantity)} onClick={() => setQty({ ...qty, [t.id]: (qty[t.id] || 0) + 1 })}>+</button></div></div>)}
      <button className="btn w-full mt-3" disabled={!count} onClick={go}>{count ? `Get tickets · ${money(total)}` : 'Select tickets'}</button></aside></div>
}
