import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Plus, Plane, Calendar, Wallet, Globe, ArrowLeft } from 'lucide-react';
import api, { getApiError } from '../api/axios';
import { useToast } from '../hooks/useToast';
import { validateRequired, validateDateOrder, validatePositiveNumber } from '../utils/validators';
import Spinner from '../components/ui/Spinner';

const TAGS = ['Weekend Getaway', 'International', 'Road Trip', 'Beach Holiday', 'Mountain Trek', 'City Break'];

const STEPS = [
  { icon: <Plane size={18} />,    label: 'Trip Details' },
  { icon: <Calendar size={18} />, label: 'Dates & Budget' },
  { icon: <Globe size={18} />,    label: 'Destinations' },
];

export default function CreateTripPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [form, setForm] = useState({ title: '', description: '', start_date: '', end_date: '', total_budget: '', is_public: false });
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
    if (!validateRequired(form.title)) e.title = 'Trip title is required';
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
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      {/* Back button */}
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => navigate('/trips')}
        style={{ marginBottom: 20, gap: 6, color: 'var(--cl-on-surface-variant)', paddingLeft: 0 }}
      >
        <ArrowLeft size={16} /> Back to My Trips
      </button>

      {/* Hero quote banner */}
      <div className="form-hero-banner" style={{ marginBottom: 28 }}>
        <div className="form-hero-icon">✈️</div>
        <div>
          <h1 className="form-hero-title">Plan New Trip</h1>
          <p className="form-hero-quote">"The world is yours to explore — one trip at a time."</p>
        </div>
      </div>

      {/* Steps progress */}
      <div className="form-steps" style={{ marginBottom: 24 }}>
        {STEPS.map((s, i) => (
          <div key={s.label} className="form-step">
            <div className="form-step-dot">{s.icon}</div>
            <span className="form-step-label">{s.label}</span>
            {i < STEPS.length - 1 && <div className="form-step-line" />}
          </div>
        ))}
      </div>

      {/* Form card */}
      <div className="card card-p form-card">
        <form onSubmit={handleSubmit} noValidate>

          {/* Section 1 — Trip Details */}
          <div className="form-section-header">
            <Plane size={16} />
            Trip Details
          </div>

          <div className="form-group">
            <label className="form-label">Trip Title *</label>
            <input
              className={`form-input${errors.title ? ' input-error' : ''}`}
              value={form.title}
              onChange={set('title')}
              placeholder="e.g. My Goa Adventure 🏖️"
            />
            {errors.title && <span className="form-error">{errors.title}</span>}
          </div>

          {/* Quick tags */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
            {TAGS.map(tag => (
              <button
                key={tag}
                type="button"
                className="form-tag-chip"
                onClick={() => setForm(f => ({ ...f, title: tag }))}
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="form-group">
            <label className="form-label">
              Description
              <span className="form-label-hint">— Tell your story</span>
            </label>
            <textarea
              className="form-textarea"
              value={form.description}
              onChange={set('description')}
              placeholder="What's this trip about? Any special plans, bucket list items, or goals? ✍️"
              rows={3}
            />
          </div>

          <div className="form-section-divider" />

          {/* Section 2 — Dates & Budget */}
          <div className="form-section-header">
            <Calendar size={16} />
            Dates & Budget
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Start Date *</label>
              <input
                className={`form-input${errors.start_date ? ' input-error' : ''}`}
                type="date"
                value={form.start_date}
                onChange={set('start_date')}
              />
              {errors.start_date && <span className="form-error">{errors.start_date}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">End Date *</label>
              <input
                className={`form-input${errors.end_date ? ' input-error' : ''}`}
                type="date"
                value={form.end_date}
                onChange={set('end_date')}
              />
              {errors.end_date && <span className="form-error">{errors.end_date}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                <Wallet size={14} style={{ display: 'inline', marginRight: 5 }} />
                Total Budget (₹) *
              </label>
              <input
                className={`form-input${errors.total_budget ? ' input-error' : ''}`}
                type="number"
                min="0"
                value={form.total_budget}
                onChange={set('total_budget')}
                placeholder="50,000"
              />
              {errors.total_budget && <span className="form-error">{errors.total_budget}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Visibility</label>
              <label className="form-toggle-label">
                <input
                  type="checkbox"
                  className="form-toggle-check"
                  checked={form.is_public}
                  onChange={e => setForm(f => ({ ...f, is_public: e.target.checked }))}
                />
                <div className="form-toggle-track">
                  <div className="form-toggle-thumb" />
                </div>
                <span className="form-toggle-text">Make trip public</span>
              </label>
              <p className="form-hint">Public trips appear in the community feed</p>
            </div>
          </div>

          <div className="form-section-divider" />

          {/* Section 3 — Destinations */}
          <div className="form-section-header">
            <Globe size={16} />
            Add Destinations
          </div>

          <div className="form-group">
            <label className="form-label">Search Cities</label>
            <div className="autocomplete-wrap">
              <div className="input-wrapper">
                <Search size={16} className="input-icon-left-icon" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--cl-on-surface-variant)', pointerEvents: 'none' }} />
                <input
                  className="form-input"
                  style={{ paddingLeft: 42 }}
                  value={cityQuery}
                  onChange={e => searchCities(e.target.value)}
                  placeholder="Search cities… e.g. Goa, Paris, Tokyo"
                />
              </div>
              {citySuggestions.length > 0 && (
                <div className="autocomplete-dropdown">
                  {citySuggestions.map(c => (
                    <div key={c.id} className="autocomplete-item" onClick={() => addCity(c)}>
                      <Globe size={14} style={{ flexShrink: 0, opacity: 0.5 }} />
                      {c.name}, {c.country}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedCities.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                {selectedCities.map(c => (
                  <span key={c.id} className="chip">
                    <Globe size={12} />
                    {c.name}
                    <button type="button" className="chip-remove" onClick={() => removeCity(c.id)}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div style={{ marginTop: 8 }}>
            <button
              className="btn btn-primary btn-full btn-lg"
              type="submit"
              disabled={loading}
              style={{ height: 52, fontSize: '1rem', letterSpacing: '0.02em' }}
            >
              {loading
                ? <><Spinner size={18} color="#fff" /> Creating your trip…</>
                : <><Plus size={18} /> Create Trip & Start Planning</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
