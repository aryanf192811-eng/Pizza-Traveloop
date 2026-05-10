import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Trash2, ChevronUp, ChevronDown, Save } from 'lucide-react';
import api, { getApiError } from '../api/axios';
import { useToast } from '../hooks/useToast';
import { formatDate, formatCurrency, formatDateInput } from '../utils/formatters';
import { SECTION_TYPES } from '../utils/validators';
import Spinner from '../components/ui/Spinner';

const EMPTY_STOP = { city_id: null, custom_city: '', start_date: '', end_date: '', section_type: 'general', budget: 0, notes: '' };

export default function ItineraryBuilderPage() {
  const { id } = useParams();
  const { addToast } = useToast();
  const [stops, setStops] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_STOP);
  const [activities, setActivities] = useState([]);
  const [actSearch, setActSearch] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cityQuery, setCityQuery] = useState('');
  const [citySugg, setCitySugg] = useState([]);
  const debounceRef = useRef(null);

  const loadStops = async () => {
    try {
      const { data: res } = await api.get(`/trips/${id}/stops`);
      setStops(res.data);
    } catch { addToast('Failed to load stops', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadStops(); }, [id]);

  const selectStop = (stop) => {
    setSelected(stop);
    setForm({ ...stop, start_date: formatDateInput(stop.start_date), end_date: formatDateInput(stop.end_date) });
    setActivities(stop.activities || []);
    setCityQuery(stop.city_name || stop.custom_city || '');
  };

  const newStop = () => { setSelected(null); setForm(EMPTY_STOP); setActivities([]); setCityQuery(''); };

  const searchCities = (q) => {
    setCityQuery(q);
    setForm(f => ({ ...f, city_id: null, custom_city: q }));
    clearTimeout(debounceRef.current);
    if (!q.trim()) { setCitySugg([]); return; }
    debounceRef.current = setTimeout(async () => {
      try { const { data: res } = await api.get('/search/cities', { params: { q } }); setCitySugg(res.data); } catch {}
    }, 300);
  };

  const pickCity = (c) => { setForm(f => ({ ...f, city_id: c.id, custom_city: undefined })); setCityQuery(`${c.name}, ${c.country}`); setCitySugg([]); };

  const saveStop = async (ev) => {
    ev.preventDefault(); setSaving(true);
    try {
      const body = {
        city_id: form.city_id || undefined,
        custom_city: !form.city_id ? (form.custom_city || cityQuery) : undefined,
        start_date: form.start_date, end_date: form.end_date,
        section_type: form.section_type, budget: parseFloat(form.budget) || 0,
        notes: form.notes || undefined,
      };
      if (selected) {
        await api.put(`/trips/${id}/stops/${selected.id}`, body);
        addToast('Stop updated', 'success');
      } else {
        await api.post(`/trips/${id}/stops`, body);
        addToast('Stop added', 'success');
      }
      await loadStops(); newStop();
    } catch (err) { addToast(getApiError(err), 'error'); }
    finally { setSaving(false); }
  };

  const deleteStop = async (stopId) => {
    try { await api.delete(`/trips/${id}/stops/${stopId}`); await loadStops(); if (selected?.id === stopId) newStop(); }
    catch (err) { addToast(getApiError(err), 'error'); }
  };

  const reorder = async (stopId, dir) => {
    const idx = stops.findIndex(s => s.id === stopId);
    if ((dir === -1 && idx === 0) || (dir === 1 && idx === stops.length - 1)) return;
    const newStops = [...stops];
    [newStops[idx], newStops[idx + dir]] = [newStops[idx + dir], newStops[idx]];
    const order = newStops.map((s, i) => ({ id: s.id, stop_order: i + 1 }));
    try { await api.patch(`/trips/${id}/stops/reorder`, { order }); setStops(newStops); }
    catch (err) { addToast(getApiError(err), 'error'); }
  };

  const loadActivities = async (cityId) => {
    if (!cityId) return;
    try { const { data: res } = await api.get('/search/activities', { params: { city_id: cityId } }); setActSearch(res.data); }
    catch {}
  };

  const addActivity = async (stopId, activityId, cost) => {
    try {
      await api.post(`/trips/${id}/stops/${stopId}/activities`, { activity_id: activityId, cost: parseFloat(cost) || 0 });
      await loadStops(); const updated = stops.find(s => s.id === stopId); if (updated) selectStop(updated);
    } catch (err) { addToast(getApiError(err), 'error'); }
  };

  const deleteActivity = async (stopId, actId) => {
    try { await api.delete(`/trips/${id}/stops/${stopId}/activities/${actId}`); await loadStops(); }
    catch (err) { addToast(getApiError(err), 'error'); }
  };

  if (loading) return <Spinner size={32} />;

  return (
    <div className="itinerary-layout">
      {/* Left: stop list */}
      <div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <span style={{ fontWeight:700, fontSize:15 }}>Stops</span>
          <button className="btn btn-primary btn-sm" onClick={newStop}><Plus size={14}/> Add Stop</button>
        </div>
        {stops.length === 0 && <div style={{ color:'var(--text-muted)', fontSize:14, padding:16 }}>No stops yet. Add your first!</div>}
        {stops.map((stop, idx) => (
          <div key={stop.id} className={`stop-list-item${selected?.id === stop.id ? ' active' : ''}`} onClick={() => { selectStop(stop); loadActivities(stop.city_id); }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <div className="stop-city">{stop.city_name || stop.custom_city}</div>
                <div className="stop-dates">{formatDate(stop.start_date)} – {formatDate(stop.end_date)}</div>
                <div style={{ display:'flex', gap:6, marginTop:4 }}>
                  <span className="badge badge-blue">{stop.section_type}</span>
                  <span style={{ fontSize:12, color:'var(--text-muted)' }}>{formatCurrency(stop.budget)}</span>
                </div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:2 }} onClick={e => e.stopPropagation()}>
                <button className="btn btn-ghost btn-icon" onClick={() => reorder(stop.id, -1)}><ChevronUp size={14}/></button>
                <button className="btn btn-ghost btn-icon" onClick={() => reorder(stop.id, 1)}><ChevronDown size={14}/></button>
                <button className="btn btn-danger btn-icon" onClick={() => deleteStop(stop.id)}><Trash2 size={14}/></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Right: stop form + activities */}
      <div>
        <div className="card card-p" style={{ marginBottom:20 }}>
          <h3 style={{ fontWeight:700, marginBottom:16 }}>{selected ? 'Edit Stop' : 'New Stop'}</h3>
          <form onSubmit={saveStop} noValidate>
            <div className="form-group">
              <label className="form-label">City</label>
              <div className="autocomplete-wrap">
                <input className="form-input" value={cityQuery} onChange={e => searchCities(e.target.value)} placeholder="Search or type custom city" />
                {citySugg.length > 0 && (
                  <div className="autocomplete-dropdown">
                    {citySugg.map(c => <div key={c.id} className="autocomplete-item" onClick={() => pickCity(c)}>{c.name}, {c.country}</div>)}
                  </div>
                )}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input className="form-input" type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">End Date</label>
                <input className="form-input" type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Section Type</label>
                <select className="form-select" value={form.section_type} onChange={e => setForm(f => ({ ...f, section_type: e.target.value }))}>
                  {SECTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Budget (₹)</label>
                <input className="form-input" type="number" min="0" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-textarea" rows={3} value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? <Spinner size={16} color="#fff" /> : <><Save size={14}/> {selected ? 'Update Stop' : 'Add Stop'}</>}
            </button>
          </form>
        </div>

        {/* Activities */}
        {selected && (
          <div className="card card-p">
            <h3 style={{ fontWeight:700, marginBottom:12 }}>Activities</h3>
            {activities.map(a => (
              <div key={a.id} className="activity-row">
                <span style={{ flex:1, fontSize:14 }}>{a.custom_name || a.name}</span>
                <span className="badge badge-purple">{a.category}</span>
                <span className="mono" style={{ fontSize:13 }}>{formatCurrency(a.cost)}</span>
                <button className="btn btn-danger btn-icon btn-sm" onClick={() => deleteActivity(selected.id, a.id)}><Trash2 size={12}/></button>
              </div>
            ))}
            {actSearch.length > 0 && (
              <div style={{ marginTop:12 }}>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--text-muted)', marginBottom:8 }}>Available Activities</div>
                {actSearch.slice(0,5).map(a => (
                  <div key={a.id} className="activity-row" style={{ cursor:'pointer' }} onClick={() => addActivity(selected.id, a.id, a.estimated_cost)}>
                    <span style={{ flex:1, fontSize:14 }}>{a.name}</span>
                    <span className="badge badge-blue">{a.category}</span>
                    <span className="mono" style={{ fontSize:13 }}>{formatCurrency(a.estimated_cost)}</span>
                    <Plus size={14} color="var(--blue)" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
