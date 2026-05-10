import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, BarChart2, Map, CheckCircle, Clock } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import TripCard from '../components/trips/TripCard';
import { getCityImage, HERO_IMAGE } from '../utils/cityImages';

function SkeletonCard() {
  return <div className="skeleton skeleton-card" />;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cities, setCities] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/search/cities/popular'),
      api.get('/trips', { params: { sort: 'created_at' } }),
    ]).then(([citRes, trRes]) => {
      setCities(citRes.data.data);
      setTrips(trRes.data.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: 'Total Trips', value: trips.length, icon: <Map size={22} />, color: '#2563EB' },
    { label: 'Upcoming',    value: trips.filter(t => t.status === 'upcoming').length,  icon: <Clock size={22} />,       color: '#F59E0B' },
    { label: 'Ongoing',     value: trips.filter(t => t.status === 'ongoing').length,   icon: <BarChart2 size={22} />,   color: '#10B981' },
    { label: 'Completed',   value: trips.filter(t => t.status === 'completed').length, icon: <CheckCircle size={22} />, color: '#8B5CF6' },
  ];

  const baseUrl = (import.meta.env.VITE_API_URL || '').replace('/api', '');

  return (
    <div>
      {/* Hero */}
      <div
        className="hero-banner"
        style={{
          backgroundImage: `url(${HERO_IMAGE})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div style={{ display:'flex', flexDirection:'column', gap:8, maxWidth:540 }}>
          <h1 className="hero-title">Welcome back, {user?.first_name}! ✈️</h1>
          <p className="hero-subtitle">Ready to plan your next adventure?</p>
          <div>
            <button className="btn btn-primary" onClick={() => navigate('/trips/create')} style={{ marginTop:8 }}>
              <Plus size={16} /> Plan New Trip
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 32 }}>
        {stats.map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: `${s.color}22` }}>
              <span style={{ color: s.color }}>{s.icon}</span>
            </div>
            <div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <form onSubmit={e => { e.preventDefault(); navigate(`/explore?q=${search}`); }} style={{ marginBottom: 32 }}>
        <div className="search-bar-wrap">
          <Search size={18} className="search-bar-icon" />
          <input className="form-input search-bar-input" placeholder="Search destinations, activities…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </form>

      {/* Popular Destinations */}
      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>🌍 Popular Destinations</h2>
        {loading ? (
          <div style={{ display: 'flex', gap: 16 }}>
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ width: 180, height: 170, borderRadius: 12, flexShrink: 0 }} />)}
          </div>
        ) : (
          <div className="dest-scroll">
            {cities.slice(0, 8).map(city => (
              <div key={city.id} className="dest-card" onClick={() => navigate(`/explore?city_id=${city.id}`)}>
                <img
                  className="dest-card-img"
                  src={getCityImage(city.name, city.image_url)}
                  alt={city.name}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <div className="dest-card-body">
                  <div className="dest-card-name">{city.name}</div>
                  <div className="dest-card-country">{city.country}</div>
                  {city.region && <span className="badge badge-blue" style={{ marginTop: 4 }}>{city.region}</span>}
                  <div className="dest-card-cost">~{formatCurrency(city.avg_daily_cost)}/day</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent Trips */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>🗺️ Recent Trips</h2>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/trips')}>View All</button>
        </div>
        {loading ? (
          <div className="grid-3"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
        ) : trips.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Map size={28} /></div>
            <div className="empty-title">No trips yet</div>
            <div className="empty-desc">Start planning your first adventure!</div>
            <button className="btn btn-primary" onClick={() => navigate('/trips/create')}><Plus size={16} /> Plan New Trip</button>
          </div>
        ) : (
          <div className="grid-3">
            {trips.slice(0, 3).map(t => <TripCard key={t.id} trip={t} />)}
          </div>
        )}
      </section>
    </div>
  );
}
