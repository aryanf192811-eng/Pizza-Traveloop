import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Plus } from 'lucide-react';
import api, { getApiError } from '../api/axios';
import { useToast } from '../hooks/useToast';
import { validateRequired, validateDateOrder, validatePositiveNumber } from '../utils/validators';
import Spinner from '../components/ui/Spinner';

const TAGS = ['Weekend Getaway', 'International', 'Road Trip', 'Beach Holiday'];

export default function CreateTripPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [form, setForm] = useState({ title:'', description:'', start_date:'', end_date:'', total_budget:'', is_public: false });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [cityQuery, setCityQuery] = useState('');
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [selectedCities, setSelectedCities] = useState([]);
  const debounceRef = useRef(null);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const searchCities = (q) => {
    setCityQuery(q);
    clearTimeout(debounceRef.current);
    if (!q.trim()) { setCitySuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const { data: res } = await api.get('/search/cities', { params: { q } });
        setCitySuggestions(res.data);
      } catch {}
    }, 300);
  };

  const addCity = (city) => {
    if (!selectedCities.find(c => c.id === city.id)) setSelectedCities(p => [...p, city]);
    setCityQuery(''); setCitySuggestions([]);
  };

  const removeCity = (id) => setSelectedCities(p => p.filter(c => c.id !== id));

  const validate = () => {
    const e = {};
    if (!validateRequired(form.title)) e.title = 'Title is required';
    if (!form.start_date) e.start_date = 'Start date required';
    if (!form.end_date) e.end_date = 'End date required';
    if (form.start_date && form.end_date && !validateDateOrder(form.start_date, form.end_date)) e.end_date = 'End date must be ≥ start date';
    if (!validatePositiveNumber(form.total_budget)) e.total_budget = 'Enter a valid budget (≥ 0)';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const { data: res } = await api.post('/trips', {
        title: form.title, description: form.description,
        start_date: form.start_date, end_date: form.end_date,
        total_budget: parseFloat(form.total_budget),
        is_public: Boolean(form.is_public),
        status: 'upcoming',
      });
      const tripId = res.data.id;
      await Promise.all(selectedCities.map(city =>
        api.post(`/trips/${tripId}/stops`, {
          city_id: city.id, start_date: form.start_date,
          end_date: form.end_date, budget: 0, section_type: 'general',
        })
      ));
      addToast('Trip created!', 'success');
      navigate(`/trips/${tripId}`);
    } catch (err) {
      addToast(getApiError(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title">Plan New Trip</h1>
      </div>

      <div className="card card-p">
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" value={form.title} onChange={set('title')} placeholder="My Goa Adventure" />
            {errors.title && <span className="form-error">{errors.title}</span>}
          </div>

          {/* Quick tags */}
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
            {TAGS.map(tag => (
              <button key={tag} type="button" className="badge badge-blue" style={{ cursor:'pointer' }} onClick={() => setForm(f => ({ ...f, title: tag }))}>
                {tag}
              </button>
            ))}
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={form.description} onChange={set('description')} placeholder="What's this trip about?" rows={3} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Start Date *</label>
              <input className="form-input" type="date" value={form.start_date} onChange={set('start_date')} />
              {errors.start_date && <span className="form-error">{errors.start_date}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">End Date *</label>
              <input className="form-input" type="date" value={form.end_date} onChange={set('end_date')} />
              {errors.end_date && <span className="form-error">{errors.end_date}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Total Budget (₹) *</label>
              <input className="form-input" type="number" min="0" value={form.total_budget} onChange={set('total_budget')} placeholder="50000" />
              {errors.total_budget && <span className="form-error">{errors.total_budget}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Visibility</label>
              <label style={{ display:'flex', alignItems:'center', gap:10, marginTop:10, cursor:'pointer' }}>
                <input type="checkbox" checked={form.is_public} onChange={e => setForm(f => ({ ...f, is_public: e.target.checked }))} />
                <span style={{ fontSize:14 }}>Make trip public</span>
              </label>
            </div>
          </div>

          {/* City search */}
          <div className="form-group">
            <label className="form-label">Add Destinations</label>
            <div className="autocomplete-wrap">
              <input className="form-input" value={cityQuery} onChange={e => searchCities(e.target.value)} placeholder="Search cities…" />
              {citySuggestions.length > 0 && (
                <div className="autocomplete-dropdown">
                  {citySuggestions.map(c => (
                    <div key={c.id} className="autocomplete-item" onClick={() => addCity(c)}>
                      {c.name}, {c.country}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {selectedCities.length > 0 && (
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:10 }}>
                {selectedCities.map(c => (
                  <span key={c.id} className="chip">
                    {c.name}
                    <button type="button" className="chip-remove" onClick={() => removeCity(c.id)}><X size={12} /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading}>
            {loading ? <><Spinner size={18} color="#fff" /> Creating…</> : <><Plus size={16} /> Create Trip</>}
          </button>
        </form>
      </div>
    </div>
  );
}
