import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { api, session } from '../api'
import { useLoad, Skel, Err, Empty, cover } from '../ui'
function Qr({ value }) { const [src, set] = useState(''); useEffect(() => { QRCode.toDataURL(value, { margin: 1, width: 240 }).then(set) }, [value]); return src ? <img src={src} alt={`QR code for ticket ${value}`} className="w-44 h-44 rounded-lg bg-white p-1" /> : <div className="skel w-44 h-44" /> }
async function load(uid) {
  const bookings = (await api.bookings(uid)).filter(b => b.status === 'successful' || b.status === 'pending')
  const out = []
  for (const b of bookings) for (const t of await api.tickets(b.id)) { const tier = await api.tier(t.ticket_type_id); const ev = await api.event(tier.event_id).catch(() => null); out.push({ ...t, tier, ev }) }
  return out
}
export default function MyTickets() {
  const { data, loading, error } = useLoad(() => load(session.user.id))
  if (loading) return <Skel n={2} />
  if (error) return <Err msg={error} />
  return <><h1 className="text-4xl font-extrabold mb-6">My tickets</h1>
    {!data.length ? <Empty>No tickets yet. Find an event to get started.</Empty> :
      <div className="grid gap-5 md:grid-cols-2">{data.map(t => <article key={t.id} className="card overflow-hidden">
        <div className="p-4 text-white" style={cover(t.ev?.id || t.id)}><h2 className="font-extrabold text-xl">{t.ev?.name || 'Event'}</h2><p className="text-sm opacity-90">{t.ev?.location} · {t.tier.name}</p></div>
        <div className="p-5 flex flex-col items-center gap-3"><Qr value={t.id} /><p className="font-mono font-bold tracking-widest">{t.ticket_code}</p>
          <button className="btn ghost" onClick={async () => { const a = document.createElement('a'); a.href = await QRCode.toDataURL(t.id, { width: 600 }); a.download = `ticket-${t.ticket_code}.png`; a.click() }}>Download QR</button></div></article>)}</div>}</>
}
