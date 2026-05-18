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
    { label: 'Total Trips', value: trips.length,                                         icon: <Map size={22} />,        colorClass: 'blue' },
    { label: 'Upcoming',    value: trips.filter(t => t.status === 'upcoming').length,   icon: <Clock size={22} />,      colorClass: 'amber' },
    { label: 'Ongoing',     value: trips.filter(t => t.status === 'ongoing').length,    icon: <BarChart2 size={22} />,  colorClass: 'green' },
    { label: 'Completed',   value: trips.filter(t => t.status === 'completed').length,  icon: <CheckCircle size={22} />,colorClass: 'blue' },
  ];

  const baseUrl = (import.meta.env.VITE_API_URL || '').replace('/api', '');

  return (
    <div>
      {/* Hero */}
      <section style={{ position: 'relative', borderRadius: '24px', overflow: 'hidden', height: '400px', display: 'flex', alignItems: 'flex-end', padding: '32px 48px', boxShadow: '0px 20px 40px rgba(59,130,246,0.12)' }}>
        <img alt="Hero" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} src={HERO_IMAGE} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(25,27,35,0.8) 0%, rgba(25,27,35,0.2) 50%, transparent 100%)' }} />
        <div style={{ position: 'relative', zIndex: 10, width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '24px', flexWrap: 'wrap' }}>
          <div style={{ color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}>
            <h1 style={{ fontSize: '48px', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '8px' }}>Welcome back, {user?.first_name}!</h1>
            <p style={{ fontSize: '18px', opacity: 0.9 }}>Ready for your next adventure? Let's explore the world.</p>
          </div>
          <button className="glass-panel" onClick={() => navigate('/trips/create')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px 32px', borderRadius: '999px', color: 'var(--cl-on-surface)', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.2)', fontWeight: 600, boxShadow: '0px 8px 20px rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'transform 0.2s' }}>
            Plan New Trip
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_forward</span>
          </button>
        </div>
      </section>

      {/* Floating Search */}
      <div style={{ position: 'relative', marginTop: '-32px', zIndex: 20, margin: '-32px auto 32px', width: '100%', maxWidth: '672px', padding: '0 16px' }}>
        <form onSubmit={e => { e.preventDefault(); navigate(`/explore?q=${search}`); }}>
          <div style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', borderRadius: '999px', padding: '8px', display: 'flex', alignItems: 'center', boxShadow: '0px 20px 40px rgba(59,130,246,0.12)', border: '1px solid rgba(255,255,255,0.5)' }}>
            <div style={{ padding: '0 16px', color: 'var(--cl-primary)' }}>
              <Search size={20} />
            </div>
            <input 
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '16px', color: 'var(--cl-on-surface)', padding: '12px 0' }} 
              placeholder="Where do you want to go?" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
            <button type="submit" style={{ background: 'var(--cl-primary)', color: 'white', borderRadius: '999px', padding: '12px 24px', fontWeight: 600, border: 'none', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>Search</button>
          </div>
        </form>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        {stats.map((s, i) => {
          const colors = [
            { bg: 'var(--cl-primary-container)', text: 'var(--cl-primary)' },
            { bg: 'var(--cl-tertiary-fixed)', text: 'var(--cl-tertiary)' },
            { bg: 'var(--cl-secondary-container)', text: 'var(--cl-on-secondary-container)' },
            { bg: '#E6F4EA', text: '#1E8E3E' }
          ];
          const color = colors[i % colors.length];
          return (
            <div key={s.label} style={{ background: 'var(--cl-surface-lowest, #ffffff)', borderRadius: '24px', padding: '24px', border: '1px solid rgba(194,198,214,0.3)', boxShadow: '0px 4px 20px rgba(59,130,246,0.04)', transition: 'all 0.3s' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: color.bg, color: color.text, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                {s.icon}
              </div>
              <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--cl-on-surface)', lineHeight: 1.2, marginBottom: '4px' }}>{s.value}</div>
              <div style={{ fontSize: '16px', color: 'var(--cl-on-surface-variant)' }}>{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Popular Destinations */}
      <section style={{ marginBottom: 36 }}>
        <div className="section-title">🌍 Popular Destinations</div>
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
      <section className="dashboard-section">
        <div className="section-header">
          <div className="section-title">🗺️ Recent Trips</div>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/trips')}>View All</button>
        </div>
        {loading ? (
          <div className="trips-grid"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
        ) : trips.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Map size={28} /></div>
            <div className="empty-title">No trips yet</div>
            <div className="empty-desc">Start planning your first adventure!</div>
            <button className="btn btn-primary" onClick={() => navigate('/trips/create')}><Plus size={16} /> Plan New Trip</button>
          </div>
        ) : (
          <div className="trips-grid">
            {trips.slice(0, 3).map(t => <TripCard key={t.id} trip={t} />)}
          </div>
        )}
      </section>
    </div>
  );
}
