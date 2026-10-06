export const CUR = '₦' // currency symbol shown on prices
export function jwtDecode(t) { try { return JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) } catch { return {} } }
export const friendly = u => (!u || /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(u) || String(u).length > 28) ? 'Account' : String(u)
const tok = localStorage.epToken || ''
export const S = {base: 'https://event-ticketing-system-4noq.onrender.com', token: tok, uid: localStorage.epUid || (tok ? String((p => p.user_id ?? p.id ?? p.sub ?? '')(jwtDecode(tok))) : ''), spec: null, routes: [], R: {}, demo: false }

export const norm = s => String(s).toLowerCase().replace(/[^a-z]/g, '')
export const arr = j => Array.isArray(j) ? j : (j && (j.items || j.data || j.results || j.events || j.tickets || j.bookings)) || []
export const msg = j => !j ? '' : typeof j.detail === 'string' ? j.detail : Array.isArray(j.detail) ? j.detail.map(d => (d.loc ? d.loc.slice(-1) + ': ' : '') + d.msg).join('; ') : j.message || ''
export const money = n => (n == null || n === '' || +n === 0) ? 'Free' : CUR + (+n).toLocaleString()
export const fd = s => { const d = new Date(s); return isNaN(d) ? 'Date to be announced' : d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }) + ', ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) }
export const ev = { id: e => e.id ?? e.event_id, title: e => e.title || e.name || 'Untitled event', when: e => e.date || e.event_date || e.start_time || e.start_date || e.starts_at, where: e => e.location || e.venue || e.address || 'Venue to be announced', desc: e => e.description || '' }
const hue = id => { let x = 0; for (const c of String(id)) x = (x * 31 + c.charCodeAt(0)) % 360; return x }
export const grad = id => { const a = hue(id); return { '--c1': `hsl(${a} 78% 52%)`, '--c2': `hsl(${(a + 55) % 360} 80% 40%)` } }
export const barcode = (seed, dark) => { let s = [...String(seed)].reduce((a, c) => a * 31 + c.charCodeAt(0) | 0, 7), x = 0, o = ''; for (let i = 0; i < 26; i++) { s = (s * 1103515245 + 12345) & 0x7fffffff; const w = 1 + s % 3; if (i % 2 == 0) o += `<rect x="${x}" y="0" width="${w}" height="40" fill="${dark ? '#14101f' : '#fff'}"/>`; x += w + 1 } return `<svg viewBox="0 0 ${x} 40" preserveAspectRatio="none">${o}</svg>` }

export const demoEvents = [['Lagos Jazz Under the Stars', 'Terra Kulture, Victoria Island', 15000], ['Afrobeats Rooftop Sessions', 'The Ocean View, Lekki', 8000], ['Founders & Coffee Morning', 'Co-Creation Hub, Yaba', 0], ['Street Food Carnival', 'Muri Okunola Park', 3500], ['Comedy Night Live', 'Eko Hotel Convention Centre', 10000], ['Sunset Yoga & Brunch', 'Elegushi Beach', 6000]]
  .map((e, i) => ({ id: i + 1, title: e[0], location: e[1], price: e[2], date: new Date(Date.now() + 864e5 * (i * 3 + 4)).toISOString(), description: 'A great night out. Connect your API to see your own events here.' }))

export async function api(m, p, body) {
  const hd = {}; if (S.token) hd.Authorization = 'Bearer ' + S.token
  let b; if (body && m !== 'GET') { if (body instanceof URLSearchParams) b = body; else { hd['Content-Type'] = 'application/json'; b = JSON.stringify(body) } }
  let r; try { r = await fetch(S.base + p, { method: m, headers: hd, body: b }) } catch { throw new Error('Cannot reach the API. Check it is running and open EvenPad!! from http://127.0.0.1:5500') }
  let j = null; try { j = await r.json() } catch { }
  if (!r.ok) { if (r.status === 401) window.dispatchEvent(new Event('ep-401')); throw new Error(msg(j) || r.statusText) }
  return j
}

export const deref = s => { while (s && s.$ref) s = S.spec.components.schemas[s.$ref.split('/').pop()]; return s || {} }
export function find(m, inc, exc = []) {
  const c = S.routes.filter(r => r.m === m && inc.every(i => norm(r.p).includes(norm(i))) && !exc.some(e => r.p.toLowerCase().includes(e)))
  c.sort((a, b) => (a.p.split('{').length - b.p.split('{').length) || a.p.length - b.p.length); return c[0]
}
function mapRoutes() {
  S.routes = []
  for (const p in S.spec.paths) for (const m in S.spec.paths[p]) if (['get', 'post', 'put', 'patch', 'delete'].includes(m)) S.routes.push({ m: m.toUpperCase(), p, op: S.spec.paths[p][m] })
  const f = find, R = S.R = {}
  R.events = f('GET', ['event'], ['{', 'ticket', 'book', 'pay']); R.eventNew = f('POST', ['event'], ['{', 'ticket', 'book', 'pay'])
  R.login = f('POST', ['login']) || f('POST', ['token']); R.register = f('POST', ['register']) || f('POST', ['signup']) || f('POST', ['auth'], ['login', 'token'])
  R.types = f('GET', ['tickettype', 'event']) || f('GET', ['tickettype']); R.typeNew = f('POST', ['tickettype'], ['{'])
  R.book = f('POST', ['booking', 'register']) || f('POST', ['booking', 'create']) || f('POST', ['booking'], ['update', 'delete', '{']); R.books = f('GET', ['booking', 'user']) || f('GET', ['booking'], ['{'])
  R.ticketsByBooking = f('GET', ['ticket', 'booking'], ['type']); R.ticketNew = f('POST', ['ticket'], ['type', '{', 'booking'])
  R.pay = f('POST', ['payment'], ['webhook', 'callback']) || f('POST', ['pay']); R.payments = f('GET', ['payment'], ['{'])
}
/** Reads /openapi.json and maps endpoints. Returns true when falling back to demo mode. */
export async function connectApi() {
  try {
    const c = new AbortController(); setTimeout(() => c.abort(), 4000)
    S.spec = await (await fetch(S.base + '/openapi.json', { signal: c.signal })).json(); mapRoutes(); S.demo = false
  } catch (e) { if (globalThis.DEBUG) console.log(e); S.demo = true; S.R = {}; S.routes = [] }
  return S.demo
}
export function fieldsOf(route) {
  const out = []; (route.op.parameters || []).filter(p => p.in === 'path' || (p.in === 'query' && p.required)).forEach(p => out.push({ k: p.name, w: p.in, type: deref(p.schema).type || 'string', req: 1 }))
  const rb = route.op.requestBody
  if (rb) {
    const ct = rb.content['application/json'] ? 'application/json' : Object.keys(rb.content)[0]; route.ct = ct
    const sc = deref(rb.content[ct].schema)
    for (let [k, v] of Object.entries(sc.properties || {})) { v = deref(v); if (v.anyOf) v = deref(v.anyOf.find(x => x.type !== 'null') || v.anyOf[0]); out.push({ k, w: 'body', type: v.type, fmt: v.format, en: v.enum, req: (sc.required || []).includes(k), def: v.default }) }
  }
  return out
}

/* ---------- domain helpers shaped to the API's models ---------- */
export const whenLine = e => { const w = ev.when(e); if (w) return fd(w); return e.created_at ? 'Added ' + new Date(e.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '' }
export const priceOf = e => { const t = e.ticket_types || []; return t.length ? Math.min(...t.map(x => +x.price)) : e.price }
export const typeLeft = t => t.available_quantity ?? t.quantity_available ?? t.available ?? t.quantity
export function evByType(events, id) { for (const e of events || []) for (const t of e.ticket_types || []) if (t.id === id) return { e, t }; return {} }
/** item.total_amount is the unit price: the API multiplies it by quantity itself */
export const createBooking = (e, t, qty) => { const price = Number(t.price) || 0; return api('POST', S.R.book.p, { user_id: S.uid, event_id: ev.id(e), bookings: [{ ticket_type_id: t.id, quantity: qty, total_amount: price }], quantity: qty, total_amount: price * qty }) }
/** paying does not create tickets in this API, so issue one per seat */
export async function issueTickets(b) {
  let n = 0
  for (const it of b.bookings || []) for (let i = 0; i < it.quantity; i++) { await api('POST', S.R.ticketNew.p, { booking_id: b.id, ticket_type_id: it.ticket_type_id, ticket_code: 'EP-' + Math.random().toString(36).slice(2, 10).toUpperCase() }); n++ }
  return n
}
export async function loadBookings() {
  const [b, p] = await Promise.all([api('GET', S.R.books.p.replace(/\{[^}]+\}/g, S.uid)), S.R.payments ? api('GET', S.R.payments.p).catch(() => []) : []])
  const paid = new Set(arr(p).map(x => String(x.booking_id)))
  return arr(b).map(x => ({ ...x, _paid: paid.has(String(x.id)) })).sort((a, c) => String(c.booking_date).localeCompare(String(a.booking_date)))
}
export async function loadTickets() {
  const bs = await loadBookings()
  return (await Promise.all(bs.map(b => api('GET', S.R.ticketsByBooking.p.replace(/\{[^}]+\}/g, b.id)).then(arr).catch(() => [])))).flat()
}
