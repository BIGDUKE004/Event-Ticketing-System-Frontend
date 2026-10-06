import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { S, api, arr, barcode, connectApi, createBooking, demoEvents, ev, evByType, fieldsOf, friendly, grad, issueTickets, jwtDecode, loadBookings, loadTickets, money, norm, priceOf, typeLeft, whenLine } from './lib.js'

const X = createContext(null)
const useX = () => useContext(X)

const Logo = ({ size = 38 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
    <defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#7b5cff" /><stop offset=".55" stopColor="#ff4f8b" /><stop offset="1" stopColor="#ffc65c" /></linearGradient></defs>
    <path d="M8 6h32a4 4 0 0 1 4 4v8a6 6 0 0 0 0 12v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-8a6 6 0 0 0 0-12v-8a4 4 0 0 1 4-4z" fill="url(#lg)" />
    <path d="M17 14h14M17 24h9M17 34h14M17 14v20" stroke="#0e0a18" strokeWidth="4.5" strokeLinecap="round" fill="none" />
    <circle cx="33" cy="24" r="2.4" fill="#0e0a18" />
  </svg>
)

/* ---------- schema-driven form: built from the API's own openapi.json ---------- */
const kindOf = f => { const n = norm(f.k); return f.en ? 'select' : f.type === 'boolean' ? 'check' : (f.type === 'integer' || f.type === 'number') ? 'number' : (f.fmt === 'date-time' || f.fmt === 'date' || /date|time|startat|endat/.test(n)) ? 'datetime-local' : /password/.test(n) ? 'password' : /email/.test(n) ? 'email' : /description|about|details/.test(n) ? 'area' : 'text' }

function SchemaForm({ route, pre = {}, cta, done }) {
  const { toast } = useX()
  // the signed-in user's id fills user_id style fields automatically
  const P = { ...(S.uid ? { userid: S.uid, ownerid: S.uid, organizerid: S.uid, creatorid: S.uid, customerid: S.uid, createdby: S.uid } : {}), ...pre }
  const fs = useMemo(() => fieldsOf(route), [route])
  const [vals, setVals] = useState(() => Object.fromEntries(fs.map(f => [f.k, f.def ?? (f.type === 'boolean' ? false : f.en ? f.en[0] : '')])))
  const [busy, setBusy] = useState(false)
  const set = (k, v) => setVals(s => ({ ...s, [k]: v }))
  async function submit(e) {
    e.preventDefault()
    if (S.demo) return toast('Start your API and reconnect in Settings to do this', true)
    let p = route.p; const body = {}; const qs = new URLSearchParams()
    for (const f of fs) {
      let v = P[norm(f.k)]
      if (v == null) { v = vals[f.k]; if (v === '' || v === undefined) continue; const k = kindOf(f); if (k === 'number') v = Number(v); else if (k === 'datetime-local') v = new Date(v).toISOString() }
      if (f.w === 'path') p = p.replace(`{${f.k}}`, v); else if (f.w === 'query') qs.set(f.k, v); else body[f.k] = v
    }
    if ([...qs].length) p += (p.includes('?') ? '&' : '?') + qs
    const payload = route.ct && route.ct.includes('urlencoded') ? new URLSearchParams(body) : (Object.keys(body).length ? body : null)
    setBusy(true)
    try { done(await api(route.m, p, payload), body) } catch (er) { toast(er.message, true) } finally { setBusy(false) }
  }
  return (
    <form onSubmit={submit}>
      {fs.filter(f => P[norm(f.k)] == null && !(f.type === 'boolean' && !f.req)).map(f => {
        const k = kindOf(f), id = 'f_' + f.k, common = { id, required: !!f.req }
        return (
          <div key={f.k}>
            <label htmlFor={id}>{f.k.replace(/_/g, ' ') + (f.req ? '' : ' (optional)')}</label>
            {k === 'select' ? <select {...common} value={vals[f.k]} onChange={e => set(f.k, e.target.value)}>{f.en.map(o => <option key={o}>{o}</option>)}</select>
              : k === 'check' ? <input id={id} type="checkbox" checked={!!vals[f.k]} onChange={e => set(f.k, e.target.checked)} />
              : k === 'area' ? <textarea {...common} rows={3} value={vals[f.k]} onChange={e => set(f.k, e.target.value)} />
              : <input {...common} type={k === 'number' ? 'number' : k} step={f.type === 'number' ? 'any' : undefined} value={vals[f.k]} autoComplete={k === 'password' ? 'current-password' : undefined} onChange={e => set(f.k, e.target.value)} />}
          </div>
        )
      })}
      <button className="btn pri" type="submit" disabled={busy}>{busy ? 'Working...' : cta}</button>
    </form>
  )
}

function Modal({ close, children }) {
  useEffect(() => { const f = e => e.key === 'Escape' && close(); addEventListener('keydown', f); return () => removeEventListener('keydown', f) }, [close])
  return <div className="ov" onClick={e => e.target === e.currentTarget && close()}><div className="md" role="dialog" aria-modal="true"><button className="x" onClick={close} aria-label="Close">×</button>{children}</div></div>
}

/* ---------- modals ---------- */
function AuthModal({ close }) {
  const { setSession, toast, bump } = useX(); const [tab, setTab] = useState('login'); const r = S.R[tab]
  return (<>
    <h2>Welcome to EvenPad!!</h2>
    <div className="tabs">{['login', 'register'].map(t => <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{t === 'login' ? 'Sign in' : 'Create account'}</button>)}</div>
    {r ? <SchemaForm key={tab} route={r} cta={tab === 'login' ? 'Sign in' : 'Create account'} done={(j, body) => {
      if (setSession(j, body && (body.email || body.username || body.name))) { close(); toast('You are in. Welcome!'); bump() }
      else if (tab === 'login') toast('Signed in but no token was returned', true)
      else { toast('Account created. Now sign in.'); setTab('login') }
    }} /> : <p className="meta">No {tab} endpoint detected.</p>}
  </>)
}
function EventModal({ e, close }) {
  const { book } = useX(); const id = ev.id(e); const [ts, setTs] = useState(e.ticket_types?.length ? e.ticket_types : null)
  useEffect(() => {
    (async () => {
      if (S.demo) return setTs([{ id: 1, name: 'General admission', price: e.price, available_quantity: 120 }, { id: 2, name: 'VIP', price: (e.price || 2000) * 3, available_quantity: 20 }])
      if (!S.R.types) return setTs(e.ticket_types || [])
      try { setTs(arr(await api('GET', S.R.types.p.replace(/\{[^}]+\}/, id))).filter(t => (t.event_id ?? id) == id)) } catch { setTs(e.ticket_types || []) }
    })()
  }, [])
  return (<>
    <div className="cover" style={{ ...grad(id), borderRadius: 16, margin: '8px 0 16px', height: 120 }}>{ev.title(e)[0]}</div>
    <h2>{ev.title(e)}</h2><div className="meta">{whenLine(e)}</div><div className="meta">{ev.where(e)}</div>
    <p style={{ marginTop: 12, color: 'var(--mu)' }}>{ev.desc(e)}</p>
    <h3 style={{ marginTop: 22 }}>Tickets</h3>
    {ts === null ? <div className="sk" style={{ height: 80, marginTop: 18 }} /> : !ts.length ? <div className="empty">No ticket types yet for this event.</div> :
      ts.map((t, i) => { const left = typeLeft(t), out = t.sold_out || left === 0; return (
        <div className="row" key={t.id ?? i}><div><b>{t.name || 'Ticket'}</b><div className="meta">{out ? 'Sold out' : left != null ? `${left} left` : ''}</div></div><div>{money(t.price)}</div><button className="btn pri sm" disabled={out} onClick={() => book(e, t, close)}>{out ? 'Sold out' : 'Get tickets'}</button></div>) })}
  </>)
}
function BookModal({ e, t, close, parentClose }) {
  const { toast, payFor } = useX(); const left = typeLeft(t), max = Math.max(1, Math.min(10, left ?? 10))
  const [qty, setQty] = useState(1), [busy, setBusy] = useState(false); const total = (Number(t.price) || 0) * qty
  async function confirm() {
    setBusy(true)
    try { const r = await createBooking(e, t, qty); close(); parentClose?.(); toast('Booked! Now complete your payment.'); payFor(r) } catch (er) { toast(er.message, true); setBusy(false) }
  }
  return (<>
    <h2>Book {ev.title(e)}</h2><p className="meta">{(t.name || 'Ticket') + ', ' + money(t.price) + ' each'}</p>
    <label>Tickets</label>
    <div className="qty"><button type="button" aria-label="Fewer" disabled={qty <= 1} onClick={() => setQty(q => q - 1)}>−</button><b>{qty}</b><button type="button" aria-label="More" disabled={qty >= max} onClick={() => setQty(q => q + 1)}>+</button></div>
    <div className="row" style={{ marginTop: 18 }}><div>Total</div><b>{money(total)}</b></div>
    <button className="btn pri" style={{ width: '100%', marginTop: 8 }} onClick={confirm} disabled={busy}>{busy ? 'Working...' : 'Confirm booking'}</button>
  </>)
}
function PayModal({ b, close }) {
  const { toast, go, bump } = useX(); const id = b.id ?? b.booking_id
  return (<>
    <h2>Complete payment</h2><p className="meta">Booking {String(id).slice(0, 8)}, {money(b.total_amount)}</p>
    <SchemaForm route={S.R.pay} cta={'Pay ' + money(b.total_amount)} pre={{ bookingid: id, amount: b.total_amount }} done={async () => {
      close()
      try { const n = S.R.ticketNew ? await issueTickets(b) : 0; toast(n ? `Payment successful. ${n} ticket${n > 1 ? 's' : ''} issued.` : 'Payment successful.') }
      catch (er) { toast('Paid, but issuing tickets failed: ' + er.message, true) }
      bump(); go('tickets')
    }} />
  </>)
}
function HostModal({ close }) {
  const { toast, reload, open } = useX()
  return (<>
    <h2>Host an event</h2><p className="meta">Tell people what, when and where.</p>
    <SchemaForm route={S.R.eventNew} cta="Publish event" done={async r => {
      close(); toast('Event published'); await reload(); const id = r && (r.id ?? r.event_id)
      if (id != null && S.R.typeNew) open(c => <TypeModal id={id} close={c} />)
    }} />
  </>)
}
function TypeModal({ id, close }) {
  const { toast } = useX()
  return (<><h2>Add tickets</h2><p className="meta">Create a ticket type so people can book.</p>
    <SchemaForm route={S.R.typeNew} pre={{ eventid: id }} cta="Add ticket type" done={() => { close(); toast('Ticket type added') }} /></>)
}
function SettingsModal({ close }) {
  const { connect } = useX(); const [url, setUrl] = useState(S.base)
  const rows = [['Events', 'events'], ['Create event', 'eventNew'], ['Sign in', 'login'], ['Register', 'register'], ['Ticket types', 'types'], ['Add ticket type', 'typeNew'], ['Create booking', 'book'], ['Bookings by user', 'books'], ['Tickets by booking', 'ticketsByBooking'], ['Issue ticket', 'ticketNew'], ['Payments list', 'payments'], ['Payment', 'pay']]
  return (<>
    <h2>API settings</h2><label htmlFor="u">API base URL</label><input id="u" value={url} onChange={e => setUrl(e.target.value)} />
    <button className="btn pri" style={{ marginTop: 22, width: '100%' }} onClick={() => { S.base = url.replace(/\/$/, ''); localStorage.epBase = S.base; close(); connect() }}>Save and reconnect</button>
    <h3 style={{ margin: '26px 0 6px' }}>Detected endpoints</h3>
    {rows.map(([n, k]) => <div className="ep" key={k}><span>{n}</span>{S.R[k] ? <code>{S.R[k].m} {S.R[k].p}</code> : <span className="meta">not found</span>}</div>)}
  </>)
}

/* ---------- views ---------- */
function Stage({ top }) {
  const { openEvent } = useX(); const box = useRef(), st = useRef()
  if (!top) return <div className="stage" />
  const id = ev.id(top)
  return (
    <div className="stage" ref={box} onPointerLeave={() => st.current.style.transform = ''}
      onPointerMove={e => { const r = box.current.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; st.current.style.transform = `rotateY(${x * 14}deg) rotateX(${-y * 14}deg)` }}>
      <div className="stub" ref={st} style={grad(id)} onClick={() => openEvent(top)}>
        <div className="l"><div><span className="tag">Up next</span><h3 style={{ marginTop: 12 }}>{ev.title(top)}</h3></div><div><div>{whenLine(top)}</div><div style={{ opacity: .8 }}>{ev.where(top)}</div></div></div>
        <div className="r" dangerouslySetInnerHTML={{ __html: barcode(id) }} />
      </div>
    </div>
  )
}
function Discover() {
  const { events, demo, q, setQ, openEvent, openHost } = useX(); const [draft, setDraft] = useState(q)
  const list = (events || []).filter(e => (ev.title(e) + ev.where(e) + ev.desc(e)).toLowerCase().includes(q.toLowerCase()))
  return (<>
    {demo && <div className="banner">Could not reach {S.base}. Showing demo events. Start your FastAPI server, serve this app from http://127.0.0.1:5500 and press Settings, then Save and reconnect.</div>}
    <section className="hero">
      <div><h1>Find the night.<br /><span>Keep the stub.</span></h1>
        <p>Browse what is on, book your spot in a few taps and carry every ticket in your pocket.</p>
        <div className="search"><input placeholder="Search events or venues" aria-label="Search events" value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && setQ(draft)} /><button className="btn pri sm" onClick={() => setQ(draft)}>Search</button></div></div>
      <Stage top={(events || [])[0]} />
    </section>
    <div className="sec"><h2>{q ? `Results for "${q}"` : 'What is on'}</h2><span className="meta">{events ? `${list.length} event${list.length === 1 ? '' : 's'}` : ''}</span></div>
    {events === null ? <div className="grid">{[...Array(6)].map((_, i) => <div className="sk" key={i} />)}</div>
      : !list.length ? <div className="empty">{q ? 'Nothing matches that search.' : 'No events yet.'}<br /><button className="btn pri" onClick={openHost}>Host the first one</button></div>
      : <div className="grid">{list.map(e => (
        <button key={ev.id(e)} className="card" style={grad(ev.id(e))} onClick={() => openEvent(e)}>
          <div className="cover">{ev.title(e).trim()[0] || 'E'}{e.sold_out ? <b>Sold out</b> : priceOf(e) != null && <b>{money(priceOf(e))}</b>}</div>
          <div className="cb"><h3>{ev.title(e)}</h3><div className="meta">{whenLine(e)}</div><div className="meta">{ev.where(e)}</div></div>
        </button>))}</div>}
  </>)
}
function BookRow({ b }) {
  const { payFor, events } = useX(); const st = b._paid ? 'paid' : String(b.status || 'pending')
  const first = (b.bookings || [])[0] || {}, evn = evByType(events, first.ticket_type_id).e
  const lines = (b.bookings || []).map(i => `${i.quantity} × ${evByType(events, i.ticket_type_id).t?.name || 'Ticket'}`).join(', ')
  return <div className="row"><div><b>{evn ? ev.title(evn) : 'Booking'}</b><div className="meta">{lines || `${b.quantity} ticket(s)`}</div></div><div><span className="tag">{st}</span></div><div>{money(b.total_amount)}</div>{!b._paid && S.R.pay && <button className="btn pri sm" onClick={() => payFor(b)}>Pay now</button>}</div>
}
function TickRow({ b: t }) {
  const { events } = useX(); const { e: evn, t: tt } = evByType(events, t.ticket_type_id)
  return <div className="tk"><div className="a"><h3>{evn ? ev.title(evn) : 'Event ticket'}</h3><div className="meta">{(tt?.name || 'Ticket') + (evn ? ', ' + ev.where(evn) : '')}</div><div className="meta">Code {t.ticket_code}</div><div style={{ marginTop: 10 }}><span className="tag">Valid</span></div></div><div className="b" dangerouslySetInnerHTML={{ __html: barcode(t.ticket_code, true) }} /></div>
}
function ListView({ load, ready, title, empty, Row }) {
  const { demo, user, openAuth, go, tick } = useX(); const [items, setItems] = useState(null); const [err, setErr] = useState('')
  useEffect(() => {
    if (demo || !S.token || !ready) return; setItems(null); setErr('')
    load().then(setItems).catch(e => setErr(e.message))
  }, [ready, demo, user, tick])
  let body
  if (demo) body = <div className="empty">Connect your API to see this.</div>
  else if (!S.token) body = <div className="empty">Sign in to see this.<br /><button className="btn pri" onClick={openAuth}>Sign in</button></div>
  else if (!ready) body = <div className="empty">No matching endpoint was found in your API.</div>
  else if (err) body = <div className="empty">{err}</div>
  else if (items === null) body = <div className="sk" style={{ height: 90 }} />
  else if (!items.length) body = <div className="empty">{empty}<br /><button className="btn pri" onClick={() => go('discover')}>Browse events</button></div>
  else body = items.map((b, i) => <Row key={b.id ?? i} b={b} />)
  return <><div className="sec"><h2>{title}</h2></div>{body}</>
}

/* ---------- every endpoint, auto-generated from openapi.json ---------- */
function RunModal({ r }) {
  const [res, setRes] = useState(null)
  return (<>
    <h2>{r.op.summary || r.p}</h2><p className="meta"><code>{r.m} {r.p}</code></p>
    {r.m === 'GET' && r.op.requestBody && <p className="meta">This GET expects a request body, which browsers cannot send. It needs to become a path or query parameter in the API.</p>}
    <SchemaForm route={r} cta="Send" done={j => setRes(j ?? { ok: true })} />
    {res && <pre className="out">{JSON.stringify(res, null, 2)}</pre>}
  </>)
}
function Explorer() {
  const { demo, open } = useX(); const [f, setF] = useState('')
  if (demo) return <div className="empty">Connect your API to see every endpoint.</div>
  const groups = {}
  S.routes.filter(r => !/openapi|docs|redoc/.test(r.p) && (r.p + (r.op.summary || '')).toLowerCase().includes(f.toLowerCase())).forEach(r => { (groups[(r.op.tags || ['other'])[0]] ??= []).push(r) })
  return (<>
    <div className="sec"><h2>All actions</h2><span className="meta">{S.routes.length} endpoints in your API</span></div>
    <div className="search" style={{ marginBottom: 12 }}><input placeholder="Filter endpoints" aria-label="Filter endpoints" value={f} onChange={e => setF(e.target.value)} /></div>
    {Object.entries(groups).map(([t, rs]) => <div key={t}><h3 style={{ margin: '22px 0 10px' }}>{t}</h3>
      {rs.map(r => <div className="row" key={r.m + r.p}><span className="tag">{r.m}</span><div><code>{r.p}</code><div className="meta">{r.op.summary || ''}</div></div>
        <button className="btn sm" onClick={() => open(c => <Modal close={c}><RunModal r={r} /></Modal>)}>Open</button></div>)}</div>)}
  </>)
}

/* ---------- app shell ---------- */
export default function App() {
  const [view, setView] = useState('discover'), [q, setQ] = useState(''), [events, setEvents] = useState(null)
  const [demo, setDemo] = useState(false), [connecting, setConnecting] = useState(true)
  const [user, setUser] = useState(S.token ? friendly(localStorage.epUser) : ''), [mods, setMods] = useState([]), [toasts, setToasts] = useState([]), [tick, force] = useState(0)
  const bump = () => force(n => n + 1)
  const toast = useCallback((m, err) => { const id = Math.random(); setToasts(t => [...t, { id, m, err }]); setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3800) }, [])
  const close = useCallback(id => setMods(m => m.filter(x => x.id !== id)), [])
  const open = useCallback(render => { const id = Math.random(); setMods(m => [...m, { id, render }]); return id }, [])
  const reload = useCallback(async () => {
    setEvents(null)
    if (S.demo) return setEvents(demoEvents)
    if (!S.R.events) return setEvents([])
    try { setEvents(arr(await api('GET', S.R.events.p))) } catch (e) { setEvents([]); toast(e.message, true) }
  }, [toast])
  const connect = useCallback(async () => { setConnecting(true); setDemo(await connectApi()); setConnecting(false); await reload() }, [reload])
  useEffect(() => { connect() }, [])

  const setSession = (j, hint) => {
    const t = j && (j.access_token || j.token || j.jwt || (j.data && j.data.access_token)); if (!t) return false
    S.token = t; localStorage.epToken = t; const p = jwtDecode(t)
    S.uid = String((j.user && j.user.id) ?? j.id ?? j.user_id ?? p.user_id ?? p.id ?? p.sub ?? ''); localStorage.epUid = S.uid
    const u = friendly((j.user && (j.user.name || j.user.full_name || j.user.email)) || j.name || j.email || hint || p.name || p.email || p.username)
    localStorage.epUser = u; setUser(u); return true
  }
  const logout = expired => { S.token = ''; S.uid = ''; setUser(''); delete localStorage.epToken; delete localStorage.epUser; delete localStorage.epUid; toast(expired ? 'Session expired. Please sign in again.' : 'Signed out', !!expired) }
  const openAuth = () => demo ? toast('Connect to your API first (Settings)', true) : open(c => <Modal close={c}><AuthModal close={c} /></Modal>)
  const openHost = () => demo ? toast('Connect your API to host events', true) : !S.token ? openAuth() : !S.R.eventNew ? toast('No create-event endpoint found. See Settings.', true) : open(c => <Modal close={c}><HostModal close={c} /></Modal>)
  const openEvent = e => open(c => <Modal close={c}><EventModal e={e} close={c} /></Modal>)
  const book = (e, t, parentClose) => demo ? toast('Connect your API to book tickets', true) : !S.token ? openAuth() : !S.R.book ? toast('No booking endpoint found. See Settings.', true) : open(c => <Modal close={c}><BookModal e={e} t={t} close={c} parentClose={parentClose} /></Modal>)
  const payFor = b => open(c => <Modal close={c}><PayModal b={b} close={c} /></Modal>)
  const go = v => { setView(v); scrollTo({ top: 0 }) }
  const latest = useRef(); latest.current = () => S.token ? logout(true) : openAuth()
  useEffect(() => { const f = () => latest.current(); addEventListener('ep-401', f); return () => removeEventListener('ep-401', f) }, [])

  const ctx = { tick, events, demo, user, q, setQ, setSession, toast, open, reload, connect, bump, openAuth, openHost, openEvent, book, payFor, go }
  const nav = [['discover', 'Discover'], ['bookings', 'My bookings'], ['tickets', 'My tickets'], ['api', 'All actions']]
  return (
    <X.Provider value={ctx}>
      <header>
        <div className="brand"><Logo /><span>EvenPad!!</span></div>
        <nav>{nav.map(([k, n]) => <button key={k} className={view === k ? 'on' : ''} onClick={() => go(k)}>{n}</button>)}</nav>
        <div className="sp" />
        <div className={'pill' + (demo && !connecting ? ' demo' : '')}><i /><span>{connecting ? 'Connecting' : demo ? 'Demo data' : 'Live API'}</span></div>
        <button className="btn" onClick={openHost}>Host an event</button>
        {user ? <div className="me"><span className="av">{user[0].toUpperCase()}</span><span className="nm">{user.includes('@') ? user.split('@')[0] : user}</span><button onClick={() => logout()}>Sign out</button></div>
          : <button className="btn pri" onClick={openAuth}>Sign in</button>}
        <button className="btn ic" aria-label="Settings" title="API settings" onClick={() => open(c => <Modal close={c}><SettingsModal close={c} /></Modal>)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1L7 17M17 7l2.1-2.1" /></svg>
        </button>
      </header>
      <main>
        {view === 'discover' && <Discover />}
        {view === 'bookings' && <ListView load={loadBookings} ready={!!S.R.books} title="My bookings" empty="No bookings yet." Row={BookRow} />}
        {view === 'api' && <Explorer />}
        {view === 'tickets' && <ListView load={loadTickets} ready={!!(S.R.books && S.R.ticketsByBooking)} title="My tickets" empty="No tickets yet. Book and pay for an event to get yours." Row={TickRow} />}
      </main>
      {mods.map(m => <div key={m.id}>{m.render(() => close(m.id))}</div>)}
      <div id="toasts" aria-live="polite">{toasts.map(t => <div key={t.id} className={'toast' + (t.err ? ' err' : '')}>{t.m}</div>)}</div>
    </X.Provider>
  )
}
