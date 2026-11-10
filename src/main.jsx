import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link, NavLink, Navigate, useNavigate } from 'react-router-dom'
import { session } from './api'
import { Skel } from './ui'
import './index.css'
const Home = lazy(() => import('./pages/Home')), Events = lazy(() => import('./pages/Events')), EventPage = lazy(() => import('./pages/EventPage'))
const Checkout = lazy(() => import('./pages/Checkout')), MyTickets = lazy(() => import('./pages/MyTickets')), Auth = lazy(() => import('./pages/Auth'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
function Guard({ children, organizer }) { const u = session.user; if (!u) return <Navigate to="/login" replace />; if (organizer && u.role !== 'organizer') return <Navigate to="/" replace />; return children }
function Nav() {
  const u = session.user, nav = useNavigate()
  return <header className="sticky top-0 z-10 backdrop-blur" style={{ background: 'color-mix(in srgb,var(--bg) 80%,transparent)', borderBottom: '1px solid var(--line)' }}>
    <nav aria-label="Main" className="mx-auto max-w-6xl px-4 h-16 flex items-center gap-5">
      <Link to="/" className="disp text-2xl font-extrabold" style={{ color: 'var(--acc)' }}>EventPad</Link>
      <NavLink to="/events" className="mut font-medium">Events</NavLink>
      {u && <NavLink to="/tickets" className="mut font-medium">My tickets</NavLink>}
      {u?.role === 'organizer' && <NavLink to="/dashboard" className="mut font-medium">Dashboard</NavLink>}
      <span className="flex-1" />
      {u ? <button className="btn ghost" onClick={() => { session.clear(); nav('/') }}>Log out</button> : <Link className="btn" to="/login">Log in</Link>}
    </nav></header>
}
createRoot(document.getElementById('root')).render(<StrictMode><BrowserRouter><Nav />
  <main className="mx-auto max-w-6xl px-4 py-8"><Suspense fallback={<Skel n={3} />}><Routes>
    <Route path="/" element={<Home />} /><Route path="/events" element={<Events />} /><Route path="/events/:id" element={<EventPage />} />
    <Route path="/checkout" element={<Guard><Checkout /></Guard>} /><Route path="/tickets" element={<Guard><MyTickets /></Guard>} />
    <Route path="/login" element={<Auth />} /><Route path="/signup" element={<Auth signup />} />
    <Route path="/dashboard" element={<Guard organizer><Dashboard /></Guard>} />
  </Routes></Suspense></main>
  <footer className="mut text-sm text-center py-10">© EventPad</footer></BrowserRouter></StrictMode>)
