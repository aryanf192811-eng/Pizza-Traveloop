import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, SlidersHorizontal } from 'lucide-react';
import api from '../api/axios';
import { useToast } from '../hooks/useToast';
import { TRIP_STATUSES, SORT_OPTIONS } from '../utils/validators';
import TripCard from '../components/trips/TripCard';

function SkeletonCard() {
  return <div className="skeleton skeleton-card" />;
}

export default function TripsPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeStatus, setActiveStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('created_at');
  const debounceRef = useRef(null);

  const load = async (status, q, s) => {
    setLoading(true); setError('');
    try {
      const { data: res } = await api.get('/trips', {
        params: { status: status !== 'all' ? status : undefined, search: q || undefined, sort: s }
      });
      setTrips(res.data);
    } catch {
      setError('Failed to load trips. Try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(activeStatus, search, sort); }, [activeStatus, sort]);

  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(activeStatus, val, sort), 400);
  };

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">My Trips</h1></div>
        <button className="btn btn-primary" onClick={() => navigate('/trips/create')}><Plus size={16} /> Plan New Trip</button>
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="status-tabs">
          {['all', ...TRIP_STATUSES].map(s => (
            <button key={s} className={`status-tab${activeStatus === s ? ' active' : ''}`} onClick={() => setActiveStatus(s)}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div className="input-wrapper" style={{ flex: 1, maxWidth: 300 }}>
          <input className="form-input" placeholder="Search trips…" value={search} onChange={e => handleSearch(e.target.value)} />
          <span className="input-icon-right"><Search size={14} /></span>
        </div>
        <select className="form-select" style={{ width: 140 }} value={sort} onChange={e => setSort(e.target.value)}>
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* States */}
      {error ? (
        <div className="empty-state">
          <div className="empty-title" style={{ color: 'var(--red)' }}>{error}</div>
          <button className="btn btn-secondary" onClick={() => load(activeStatus, search, sort)}>Retry</button>
        </div>
      ) : loading ? (
        <div className="grid-3"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
      ) : trips.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><SlidersHorizontal size={28} /></div>
          <div className="empty-title">No trips found</div>
          <div className="empty-desc">Start planning your next adventure!</div>
          <button className="btn btn-primary" onClick={() => navigate('/trips/create')}><Plus size={16} /> Plan New Trip</button>
        </div>
      ) : (
        <div className="grid-3">
          {trips.map(t => <TripCard key={t.id} trip={t} />)}
        </div>
      )}
    </div>
  );
}
