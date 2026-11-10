import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, session } from '../api'
export default function Auth({ signup }) {
  const nav = useNavigate(), [f, setF] = useState({ name: '', email: '', password: '' }), [err, setErr] = useState(''), [busy, setBusy] = useState(false), [slow, setSlow] = useState(false)
  const set = k => e => setF({ ...f, [k]: e.target.value })
  async function submit(e) {
    e.preventDefault(); setErr('')
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return setErr('Enter a valid email.')
    if (f.password.length < 6) return setErr('Password must be at least 6 characters.')
    setBusy(true); const timer = setTimeout(() => setSlow(true), 6000)
    try { if (signup) await api.register(f); session.save(await api.login({ email: f.email, password: f.password })); nav('/') } catch (x) { setErr(x.message) } finally { clearTimeout(timer); setSlow(false); setBusy(false) }
  }
  return <form onSubmit={submit} className="card p-6 max-w-md mx-auto grid gap-4" noValidate>
    <h1 className="text-3xl font-extrabold">{signup ? 'Create your account' : 'Welcome back'}</h1>
    {signup && <label>Name<input className="input mt-1" required value={f.name} onChange={set('name')} autoComplete="name" /></label>}
    <label>Email<input className="input mt-1" type="email" required value={f.email} onChange={set('email')} autoComplete="email" /></label>
    <label>Password<input className="input mt-1" type="password" required value={f.password} onChange={set('password')} autoComplete={signup ? 'new-password' : 'current-password'} /></label>
    {slow && <p className="mut text-sm" role="status">{signup ? 'Creating your account' : 'Signing you in'}… thanks for your patience, this is taking a little longer than usual.</p>}
    {err && <p role="alert" style={{ color: 'var(--bad)' }}>{err}</p>}
    <button className="btn" disabled={busy}>{busy ? (signup ? 'Creating account…' : 'Signing in…') : signup ? 'Sign up' : 'Log in'}</button>
    <p className="mut text-sm">{signup ? <>Have an account? <Link to="/login" className="underline">Log in</Link></> : <>New here? <Link to="/signup" className="underline">Sign up</Link></>}</p>
    <p className="mut text-xs">Password reset isn’t supported by the API yet.</p></form>
}
