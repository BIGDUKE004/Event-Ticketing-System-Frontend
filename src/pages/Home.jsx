import { Link } from 'react-router-dom'
import { api } from '../api'
import { useLoad, Skel, Err, Empty, EventCard } from '../ui'
export default function Home() {
  const { data, loading, error } = useLoad(api.events)
  return <>
    <section className="py-16 sm:py-28 max-w-4xl">
      <h1 className="text-5xl sm:text-8xl font-extrabold leading-[1.02]">Tickets to the <span style={{ color: 'var(--acc)' }}>good stuff.</span></h1>
      <p className="mut text-xl mt-6 max-w-2xl">Find an event, grab your tickets in seconds, walk in with a QR code. Hosting? Set up tiers and watch sales come in.</p>
      <div className="mt-8 flex gap-3"><Link className="btn" to="/events">Browse events</Link><Link className="btn ghost" to="/signup">Start hosting</Link></div>
    </section>
    <h2 className="text-2xl font-extrabold mb-4">Upcoming events</h2>
    {loading ? <Skel n={3} /> : error ? <Err msg={error} /> : !data.length ? <Empty>No events yet. Check back soon.</Empty> :
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{data.slice(0, 6).map(e => <EventCard key={e.id} e={e} Link={Link} />)}</div>}
    <section className="grid gap-5 sm:grid-cols-3 mt-16">{[['1', 'Discover', 'Search events by keyword.'], ['2', 'Book', 'Pick your tier and pay.'], ['3', 'Scan in', 'Show your QR at the door.']].map(([n, t, d]) =>
      <div key={n} className="card p-6"><span className="disp text-4xl font-extrabold" style={{ color: 'var(--acc)' }}>{n}</span><h3 className="font-extrabold text-lg mt-2">{t}</h3><p className="mut">{d}</p></div>)}</section>
  </>
}
