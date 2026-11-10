import { Component, StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link, NavLink, Navigate, useNavigate } from 'react-router-dom'
import { session } from './api'
import { Skel } from './ui'
import './index.css'
const Home = lazy(() => import('./pages/Home')), Events = lazy(() => import('./pages/Events')), EventPage = lazy(() => import('./pages/EventPage'))
const Checkout = lazy(() => import('./pages/Checkout')), MyTickets = lazy(() => import('./pages/MyTickets')), Auth = lazy(() => import('./pages/Auth'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
class Boundary extends Component {
  state = { e: null }
  static getDerivedStateFromError(e) { return { e } }
  render() { return this.state.e ? <div role="alert" className="card p-6 max-w-xl mx-auto"><h1 className="text-2xl font-extrabold">Something went wrong</h1><pre className="mut text-sm whitespace-pre-wrap mt-3">{String(this.state.e.message || this.state.e)}</pre><button className="btn mt-4" onClick={() => { this.setState({ e: null }); location.href = '/' }}>Back to home</button></div> : this.props.children }
}
function Guard({ children, organizer }) { const u = session.user; if (!u) return <Navigate to="/login" replace />; if (organizer && u.role !== 'organizer') return <Navigate to="/" replace />; return children }
function Nav() {
  const u = session.user, nav = useNavigate()
  return <header className="sticky top-0 z-10 backdrop-blur" style={{ background: 'color-mix(in srgb,var(--bg) 80%,transparent)', borderBottom: '1px solid var(--line)' }}>
    <nav aria-label="Main" className="mx-auto max-w-7xl px-5 sm:px-8 h-20 flex items-center gap-5">
      <Link to="/" className="disp text-2xl font-extrabold" style={{ color: 'var(--acc)' }}>EventPad</Link>
      <NavLink to="/events" className="mut font-medium">Events</NavLink>
      {u && <NavLink to="/tickets" className="mut font-medium">My tickets</NavLink>}
      {u?.role === 'organizer' && <NavLink to="/dashboard" className="mut font-medium">Dashboard</NavLink>}
      <span className="flex-1" />
      {u ? <button className="btn ghost" onClick={() => { session.clear(); nav('/') }}>Log out</button> : <Link className="btn" to="/login">Log in</Link>}
    </nav></header>
}
createRoot(document.getElementById('root')).render(<StrictMode><BrowserRouter><div className="min-h-screen flex flex-col"><Nav />
  <main className="flex-1 w-full mx-auto max-w-7xl px-5 sm:px-8 py-10"><Boundary><Suspense fallback={<Skel n={3} />}><Routes>
    <Route path="/" element={<Home />} /><Route path="/events" element={<Events />} /><Route path="/events/:id" element={<EventPage />} />
    <Route path="/checkout" element={<Guard><Checkout /></Guard>} /><Route path="/tickets" element={<Guard><MyTickets /></Guard>} />
    <Route path="/login" element={<Auth />} /><Route path="/signup" element={<Auth signup />} />
    <Route path="/dashboard" element={<Guard organizer><Dashboard /></Guard>} />
  </Routes></Suspense></Boundary></main>
  <footer style={{ borderTop: '1px solid var(--line)' }}><div className="mx-auto max-w-7xl px-5 sm:px-8 py-12 grid gap-8 sm:grid-cols-3">
    <div><p className="disp text-2xl font-extrabold" style={{ color: 'var(--acc)' }}>EventPad</p><p className="mut mt-2 max-w-xs">Tickets to the good stuff. Discover events, book in seconds, walk in with a QR code.</p></div>
    <nav aria-label="Explore" className="grid gap-2 content-start"><p className="font-bold">Explore</p><Link className="mut" to="/events">Browse events</Link><Link className="mut" to="/tickets">My tickets</Link><Link className="mut" to="/signup">Start hosting</Link></nav>
    <nav aria-label="Account" className="grid gap-2 content-start"><p className="font-bold">Account</p><Link className="mut" to="/login">Log in</Link><Link className="mut" to="/signup">Sign up</Link></nav></div>
    <p className="mut text-sm text-center pb-8">© {new Date().getFullYear()} EventPad. All rights reserved.</p></footer></div></BrowserRouter></StrictMode>)
