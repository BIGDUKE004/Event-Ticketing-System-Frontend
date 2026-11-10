import { useState } from 'react'
import { useLocation, Link, Navigate } from 'react-router-dom'
import { api, session } from '../api'
import { money } from '../ui'
const code = () => crypto.randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase()
export default function Checkout() {
  const { state } = useLocation(), u = session.user
  const [step, setStep] = useState(0), [card, setCard] = useState({ num: '', exp: '', cvc: '' }), [err, setErr] = useState(''), [busy, setBusy] = useState(false)
  if (!state) return <Navigate to="/events" replace />
  const { event, items } = state, total = items.reduce((a, i) => a + i.total_amount, 0), qty = items.reduce((a, i) => a + i.quantity, 0)
  const valid = card.num.replace(/\s/g, '').length >= 12 && /^\d\d\/\d\d$/.test(card.exp) && card.cvc.length >= 3
  async function pay() {
    setBusy(true); setErr('')
    try {
      const b = await api.book({ user_id: u.id, event_id: event.id, bookings: items.map(({ ticket_type_id, quantity, total_amount }) => ({ ticket_type_id, quantity, total_amount })), quantity: qty, total_amount: total })
      await api.pay({ booking_id: b.id, amount: total })
      for (const i of items) for (let n = 0; n < i.quantity; n++) await api.issue({ booking_id: b.id, ticket_type_id: i.ticket_type_id, ticket_code: code() })
      setStep(3)
    } catch (x) { setErr(x.message) } finally { setBusy(false) }
  }
  const steps = ['Review', 'Details', 'Payment', 'Done']
  return <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
    <div><ol className="flex gap-2 mb-6 text-sm font-bold" aria-label="Progress">{steps.map((s, i) => <li key={s} aria-current={i === step ? 'step' : undefined} className="badge" style={i <= step ? { background: 'var(--acc)', color: 'var(--accfg)' } : {}}>{i + 1}. {s}</li>)}</ol>
      {step === 0 && <div className="card p-6"><h1 className="text-2xl font-extrabold">Review your tickets</h1>{items.map(i => <p key={i.ticket_type_id} className="mt-3">{i.quantity} × {i.name} — {money(i.total_amount)}</p>)}<button className="btn mt-5" onClick={() => setStep(1)}>Continue</button></div>}
      {step === 1 && <div className="card p-6 grid gap-3"><h1 className="text-2xl font-extrabold">Your details</h1><p>{u.name}<br /><span className="mut">{u.email}</span></p><p className="mut text-sm">Tickets are tied to your account.</p><div className="flex gap-3"><button className="btn ghost" onClick={() => setStep(0)}>Back</button><button className="btn" onClick={() => setStep(2)}>Continue</button></div></div>}
      {step === 2 && <div className="card p-6 grid gap-3"><h1 className="text-2xl font-extrabold">Payment</h1>
        <p className="mut text-sm">Demo payment: the API records a simulated payment and doesn’t charge a card.</p>
        <label>Card number<input className="input mt-1" inputMode="numeric" value={card.num} onChange={e => setCard({ ...card, num: e.target.value })} placeholder="4242 4242 4242 4242" /></label>
        <div className="grid grid-cols-2 gap-3"><label>Expiry<input className="input mt-1" placeholder="MM/YY" value={card.exp} onChange={e => setCard({ ...card, exp: e.target.value })} /></label><label>CVC<input className="input mt-1" inputMode="numeric" value={card.cvc} onChange={e => setCard({ ...card, cvc: e.target.value })} /></label></div>
        {err && <p role="alert" style={{ color: 'var(--bad)' }}>{err}</p>}
        <div className="flex gap-3"><button className="btn ghost" onClick={() => setStep(1)}>Back</button><button className="btn" disabled={!valid || busy} onClick={pay}>{busy ? 'Processing…' : `Pay ${money(total)}`}</button></div></div>}
      {step === 3 && <div className="card p-8 text-center"><p className="text-5xl" aria-hidden>🎉</p><h1 className="text-3xl font-extrabold mt-2">You’re in!</h1><p className="mut mt-2">Your tickets are ready.</p><Link className="btn mt-5" to="/tickets">View my tickets</Link></div>}</div>
    <aside className="card p-5 self-start"><h2 className="font-extrabold">{event.name}</h2><p className="mut text-sm">{event.location}</p><hr className="my-3" style={{ borderColor: 'var(--line)' }} /><p className="flex justify-between font-bold"><span>Total ({qty})</span><span>{money(total)}</span></p></aside></div>
}
