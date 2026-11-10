// Single API client. Base URL comes from VITE_API_URL.
// Dev: requests go through Vite's /api proxy (no CORS). Production: VITE_API_URL.
const BASE = import.meta.env.DEV ? '/api' : (import.meta.env.VITE_API_URL || '')
export const session = {
  get token() { return localStorage.getItem('ep_t') },
  get user() { try { return JSON.parse(localStorage.getItem('ep_u')) } catch { return null } },
  save(d) { localStorage.setItem('ep_t', d.access_token); localStorage.setItem('ep_u', JSON.stringify({ id: d.id, name: d.name, email: d.email, role: d.role })) },
  clear() { localStorage.removeItem('ep_t'); localStorage.removeItem('ep_u') },
}
async function req(path, { method = 'GET', body } = {}) {
  const r = await fetch(BASE + path, { method, headers: { 'Content-Type': 'application/json', ...(session.token && { Authorization: `Bearer ${session.token}` }) }, body: body && JSON.stringify(body) })
  if (r.status === 401) session.clear()
  if (!r.ok) { let m = r.statusText; try { const j = await r.json(); m = typeof j.detail === 'string' ? j.detail : j.detail?.[0]?.msg || m } catch {} throw new Error(m) }
  return r.status === 204 ? null : r.json()
}
const arr = x => (Array.isArray(x) ? x : [])
const ev = e => (e && typeof e === 'object' ? { ...e, ticket_types: arr(e.ticket_types) } : e)
export const api = {
  register: b => req('/auth/register', { method: 'POST', body: b }),
  login: b => req('/auth/login', { method: 'POST', body: b }),
  events: async () => arr(await req('/events/')).filter(Boolean).map(ev),
  search: async k => arr(await req('/events/search?keyword=' + encodeURIComponent(k))).filter(Boolean).map(ev),
  event: async id => ev(await req('/events/' + id)),
  sold: id => req(`/events/${id}/tickets_sold`),
  made: id => req(`/events/${id}/amount_made`),
  createEvent: (b, uid) => req('/events/?user_id=' + uid, { method: 'POST', body: b }),
  deleteEvent: id => req('/events/' + id, { method: 'DELETE' }),
  createTier: b => req('/ticket-types/', { method: 'POST', body: b }),
  tier: id => req('/ticket-types/' + id),
  book: b => req('/booking/register_booking', { method: 'POST', body: b }),
  bookings: async uid => arr(await req('/booking/user/' + uid)),
  pay: b => req('/payments/', { method: 'POST', body: b }),
  issue: b => req('/tickets/', { method: 'POST', body: b }),
  tickets: async bid => arr(await req('/tickets/booking/' + bid)),
  ticket: id => req('/tickets/' + id),
}
