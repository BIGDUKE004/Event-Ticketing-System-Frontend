import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { useLoad, Skel, Err, Empty, EventCard, tierInfo } from '../ui'
export default function Events() {
  const [q, setQ] = useState(''), [sort, setSort] = useState('new'), [hide, setHide] = useState(false)
  const { data, loading, error } = useLoad(() => q.trim() ? api.search(q.trim()) : api.events(), [q])
  const list = (data || []).filter(e => !hide || tierInfo(e).left > 0).sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name) : sort === 'price' ? (tierInfo(a).from ?? 1e12) - (tierInfo(b).from ?? 1e12) : new Date(b.created_at) - new Date(a.created_at))
  return <>
    <h1 className="text-4xl font-extrabold mb-5">Events</h1>
    <div className="flex flex-wrap gap-3 mb-6">
      <input className="input flex-1 min-w-52" type="search" aria-label="Search events" placeholder="Search events…" value={q} onChange={e => setQ(e.target.value)} />
      <select className="input w-auto" aria-label="Sort" value={sort} onChange={e => setSort(e.target.value)}><option value="new">Newest</option><option value="price">Lowest price</option><option value="name">Name</option></select>
      <label className="flex items-center gap-2"><input type="checkbox" checked={hide} onChange={e => setHide(e.target.checked)} />Hide sold out</label>
    </div>
    {loading ? <Skel /> : error ? <Err msg={error} /> : !list.length ? <Empty>No events match your search.</Empty> :
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{list.map(e => <EventCard key={e.id} e={e} Link={Link} />)}</div>}
  </>
}
