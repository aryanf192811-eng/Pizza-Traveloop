import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, MapPin, Activity, Plus } from 'lucide-react';
import api from '../api/axios';
import { formatCurrency } from '../utils/formatters';
import { getCityImage } from '../utils/cityImages';
import Spinner from '../components/ui/Spinner';
import Modal from '../components/ui/Modal';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [cities, setCities] = useState([]);
  const [activities, setActivities] = useState([]);
  const [popular, setPopular] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState('');
  const debounceRef = useRef(null);

  useEffect(() => {
    api.get('/search/cities/popular').then(({ data: res }) => setPopular(res.data)).catch(() => {});
    api.get('/trips').then(({ data: res }) => setTrips(res.data)).catch(() => {});
    const cityId = searchParams.get('city_id');
    if (cityId) loadActivitiesForCity(cityId);
    else if (query) doSearch(query);
  }, []);

  const doSearch = async (q) => {
    if (!q.trim()) { setCities([]); setActivities([]); return; }
    setLoading(true);
    try {
      const [cRes, aRes] = await Promise.all([
        api.get('/search/cities', { params: { q } }),
        api.get('/search/activities', { params: { q } }),
      ]);
      setCities(cRes.data.data); setActivities(aRes.data.data);
    } catch {} finally { setLoading(false); }
  };

  const loadActivitiesForCity = async (cityId) => {
    setLoading(true);
    try { const { data: res } = await api.get('/search/activities', { params: { city_id: cityId } }); setActivities(res.data); }
    catch {} finally { setLoading(false); }
  };

  const handleSearch = (val) => {
    setQuery(val); setSearchParams(val ? { q: val } : {});
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 400);
  };

  const handleCityClick = (city) => {
    setSearchParams({ city_id: city.id }); loadActivitiesForCity(city.id);
  };

  const handleAddToTrip = (act) => { setSelectedActivity(act); setAddModal(true); };

  const confirmAdd = async () => {
    if (!selectedTrip || !selectedActivity) return;
    try {
      await api.post(`/trips/${selectedTrip}/stops`, { city_id: selectedActivity.city_id, start_date: new Date().toISOString().split('T')[0], end_date: new Date().toISOString().split('T')[0], budget: 0, section_type: 'activity' });
      setAddModal(false); navigate(`/trips/${selectedTrip}/itinerary`);
    } catch {}
  };

  const isSearching = query.trim().length > 0;

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Explore</h1></div>

      <div className="search-bar-wrap">
        <Search size={18} className="search-bar-icon" />
        <input className="form-input search-bar-input" value={query} onChange={e => handleSearch(e.target.value)} placeholder="Search cities, activities…" autoFocus />
      </div>

      {loading && <div style={{ textAlign:'center', padding:32 }}><Spinner size={32}/></div>}

      {!isSearching && !loading && (
        <section style={{ marginBottom:32 }}>
          <h2 style={{ fontSize:18, fontWeight:700, marginBottom:16 }}>🌍 Popular Destinations</h2>
          <div className="dest-scroll">
            {popular.slice(0,8).map(city => (
              <div key={city.id} className="dest-card" onClick={() => handleCityClick(city)}>
                <img
                  className="dest-card-img"
                  src={getCityImage(city.name, city.image_url)}
                  alt={city.name}
                  onError={(e) => { e.currentTarget.style.display='none'; }}
                />
                <div className="dest-card-body">
                  <div className="dest-card-name">{city.name}</div>
                  <div className="dest-card-country">{city.country}</div>
                  <div className="dest-card-cost">~{formatCurrency(city.avg_daily_cost)}/day</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {isSearching && !loading && (
        <div className="grid-2">
          <div>
            <h2 style={{ fontSize:16, fontWeight:700, marginBottom:12 }}>Cities ({cities.length})</h2>
            {cities.length === 0 ? <div style={{ color:'var(--text-muted)', fontSize:14 }}>No cities found</div> :
              cities.map(city => (
                <div key={city.id} className="card card-sm" style={{ marginBottom:8, cursor:'pointer' }} onClick={() => handleCityClick(city)}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div><div style={{ fontWeight:700 }}>{city.name}</div><div style={{ fontSize:13, color:'var(--text-muted)' }}>{city.country}</div></div>
                    <span className="dest-card-cost">{formatCurrency(city.avg_daily_cost)}/day</span>
                  </div>
                </div>
              ))
            }
          </div>
          <div>
            <h2 style={{ fontSize:16, fontWeight:700, marginBottom:12 }}>Activities ({activities.length})</h2>
            {activities.length === 0 ? <div style={{ color:'var(--text-muted)', fontSize:14 }}>No activities found</div> :
              activities.map(a => (
                <div key={a.id} className="card card-sm" style={{ marginBottom:8 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div>
                      <div style={{ fontWeight:700 }}>{a.name}</div>
                      <div style={{ fontSize:12, color:'var(--text-muted)' }}>{a.city_name} · {a.duration_hrs}h</div>
                      <div style={{ display:'flex', gap:6, marginTop:4 }}><span className="badge badge-purple">{a.category}</span></div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div className="mono" style={{ fontSize:14 }}>{formatCurrency(a.estimated_cost)}</div>
                      <button className="btn btn-primary btn-sm" style={{ marginTop:8 }} onClick={() => handleAddToTrip(a)}>Add to Trip</button>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {!isSearching && activities.length > 0 && (
        <div>
          <h2 style={{ fontSize:18, fontWeight:700, marginBottom:16 }}>Activities in this City</h2>
          <div className="grid-2">
            {activities.map(a => (
              <div key={a.id} className="card card-sm">
                <div style={{ fontWeight:700, marginBottom:4 }}>{a.name}</div>
                <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:8 }}>{a.duration_hrs}h · {formatCurrency(a.estimated_cost)}</div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span className="badge badge-purple">{a.category}</span>
                  <button className="btn btn-primary btn-sm" onClick={() => handleAddToTrip(a)}>Add to Trip</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Add to Trip" size="sm">
        {/* Activity info */}
        <div style={{ background:'var(--cl-primary-fixed,#d8e2ff)', borderRadius:12, padding:'12px 16px', marginBottom:20, display:'flex', gap:12, alignItems:'center' }}>
          <div style={{ width:40, height:40, borderRadius:10, background:'var(--cl-primary)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <MapPin size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight:700, fontSize:15, color:'var(--color-text-primary)' }}>{selectedActivity?.name}</div>
            <div style={{ fontSize:12, color:'var(--color-text-muted)', marginTop:2 }}>{selectedActivity?.city_name} · {selectedActivity?.duration_hrs}h · {formatCurrency(selectedActivity?.estimated_cost)}</div>
          </div>
        </div>

        <div className="form-group" style={{ marginBottom:20 }}>
          <label className="form-label">Select Trip</label>
          <select className="form-select" value={selectedTrip} onChange={e => setSelectedTrip(e.target.value)}>
            <option value="">Choose a trip…</option>
            {trips.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
          {trips.length === 0 && <span style={{ fontSize:12, color:'var(--color-text-muted)', marginTop:6, display:'block' }}>No trips yet — <a href="/trips/create" style={{ color:'var(--color-primary)' }}>create one first</a></span>}
        </div>

        <div style={{ display:'flex', gap:10 }}>
          <button className="btn btn-secondary" style={{ flex:1 }} onClick={() => setAddModal(false)}>Cancel</button>
          <button className="btn btn-primary" style={{ flex:2 }} onClick={confirmAdd} disabled={!selectedTrip}>
            <Plus size={16} /> Add to Itinerary
          </button>
        </div>
      </Modal>
    </div>
  );
}
