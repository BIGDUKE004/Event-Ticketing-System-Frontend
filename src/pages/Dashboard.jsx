import { useState } from 'react'
import { api, session } from '../api'
import { useLoad, Skel, Err, Empty, Counter, money } from '../ui'
const Stat = ({ l, v, m }) => <div className="card p-5"><p className="mut text-sm">{l}</p><p className="disp text-3xl font-extrabold">{m && '₦'}<Counter to={v} /></p></div>
async function loadMine(uid) {
  const evs = (await api.events()).filter(e => e.organizer_id === uid)
  return Promise.all(evs.map(async e => ({ ...e, sold: await api.sold(e.id).catch(() => 0), made: await api.made(e.id).catch(() => 0) })))
}
function Validate() {
  const [id, setId] = useState(''), [r, setR] = useState(null)
  async function check(e) { e.preventDefault(); setR({ s: 'wait' }); try { const t = await api.ticket(id.trim()); setR({ s: 'ok', t }) } catch { setR({ s: 'bad' }) } }
  const ok = r?.s === 'ok'
  return <section className="card p-5"><h2 className="font-extrabold text-xl mb-3">Validate ticket</h2>
    <form onSubmit={check} className="flex gap-3"><input className="input" aria-label="Ticket ID from QR" placeholder="Scan or paste ticket ID" value={id} onChange={e => setId(e.target.value)} /><button className="btn">Check</button></form>
    {r && r.s !== 'wait' && <div role="status" className="mt-4 rounded-2xl p-8 text-center text-white font-extrabold text-4xl" style={{ background: ok ? 'var(--ok)' : 'var(--bad)' }}>{ok ? '✓ VALID' : '✕ INVALID'}{ok && <p className="text-base font-mono mt-2">{r.t.ticket_code}</p>}</div>}
    <p className="mut text-xs mt-3">Tip: a USB/Bluetooth QR scanner types the ID straight into this field.</p></section>
}
function CreateEvent({ onDone }) {
  const [f, setF] = useState({ name: '', description: '', location: '' }), [tiers, setT] = useState([{ name: 'Regular', price: '', quantity: '' }]), [err, setErr] = useState(''), [busy, setBusy] = useState(false)
  async function save(e) {
    e.preventDefault(); setErr(''); setBusy(true)
    try { const ev = await api.createEvent(f, session.user.id); for (const t of tiers.filter(t => t.name && +t.price > 0 && +t.quantity > 0)) await api.createTier({ event_id: ev.id, name: t.name, price: +t.price, quantity: +t.quantity }); onDone() } catch (x) { setErr(x.message) } finally { setBusy(false) }
  }
  const up = (i, k) => e => setT(tiers.map((t, j) => j === i ? { ...t, [k]: e.target.value } : t))
  return <form onSubmit={save} className="card p-5 grid gap-3"><h2 className="font-extrabold text-xl">Create event</h2>
    <input className="input" required placeholder="Event name" aria-label="Event name" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
    <input className="input" required placeholder="Location" aria-label="Location" value={f.location} onChange={e => setF({ ...f, location: e.target.value })} />
    <textarea className="input" required rows={3} placeholder="Description" aria-label="Description" value={f.description} onChange={e => setF({ ...f, description: e.target.value })} />
    {tiers.map((t, i) => <div key={i} className="grid grid-cols-3 gap-2"><input className="input" placeholder="Tier" aria-label="Tier name" value={t.name} onChange={up(i, 'name')} /><input className="input" type="number" min="1" placeholder="Price" aria-label="Price" value={t.price} onChange={up(i, 'price')} /><input className="input" type="number" min="1" placeholder="Qty" aria-label="Quantity" value={t.quantity} onChange={up(i, 'quantity')} /></div>)}
    <button type="button" className="btn ghost" onClick={() => setT([...tiers, { name: '', price: '', quantity: '' }])}>+ Add tier</button>
    {err && <p role="alert" style={{ color: 'var(--bad)' }}>{err}</p>}<button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Publish event'}</button></form>
}
export default function Dashboard() {
  const [k, setK] = useState(0), { data, loading, error } = useLoad(() => loadMine(session.user.id), [k])
  return <><h1 className="text-4xl font-extrabold mb-6">Dashboard</h1>
    {loading ? <Skel n={3} /> : error ? <Err msg={error} /> : <>
      <div className="grid gap-4 sm:grid-cols-3"><Stat l="Events" v={data.length} /><Stat l="Tickets sold" v={data.reduce((a, e) => a + e.sold, 0)} /><Stat l="Revenue" m v={data.reduce((a, e) => a + e.made, 0)} /></div>
      <div className="card mt-6 overflow-x-auto"><table className="w-full text-left"><thead className="mut text-sm"><tr><th className="p-3">Event</th><th>Sold</th><th>Revenue</th><th></th></tr></thead><tbody>
        {!data.length && <tr><td className="p-6 mut" colSpan="4">No events yet — create your first one below.</td></tr>}
        {data.map(e => <tr key={e.id} style={{ borderTop: '1px solid var(--line)' }}><td className="p-3 font-bold">{e.name}</td><td>{e.sold}</td><td>{money(e.made)}</td><td><button className="btn ghost" onClick={async () => { if (confirm('Delete this event?')) { await api.deleteEvent(e.id); setK(k + 1) } }}>Delete</button></td></tr>)}</tbody></table></div></>}
    <div className="grid gap-6 lg:grid-cols-2 mt-6"><CreateEvent onDone={() => setK(k + 1)} /><Validate /></div></>
}
