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
    <div className="flex flex-col xl:flex-row gap-8 items-start w-full">
      {/* Left Panel: Timeline */}
      <div className="w-full xl:w-[400px] flex-shrink-0 flex flex-col bg-surface/80 backdrop-blur-xl rounded-[24px] border border-outline-variant/30 shadow-[0px_20px_40px_rgba(0,0,0,0.05)] overflow-hidden xl:sticky xl:top-8 max-h-[calc(100vh-2rem)]">
        <div className="p-6 border-b border-outline-variant/20 bg-surface/50 backdrop-blur-md flex justify-between items-center z-10">
          <h3 className="font-headline-md text-[20px] font-bold text-on-surface">Timeline</h3>
          <button className="w-10 h-10 bg-primary-container/50 text-primary rounded-full flex items-center justify-center hover:bg-primary-container transition-colors shadow-sm" onClick={newStop} title="Add Stop">
            <Plus size={20} />
          </button>
        </div>
        
        {stops.length === 0 ? (
          <div className="text-center py-12 text-on-surface-variant p-6">
            <div className="w-16 h-16 bg-surface-variant/50 rounded-full flex items-center justify-center mx-auto mb-4 text-on-surface-variant">
              <span className="material-symbols-outlined text-[32px]">signpost</span>
            </div>
            <p className="font-body-md text-[16px]">No stops yet. Add your first destination!</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 relative scrollbar-thin scrollbar-thumb-surface-variant">
            {/* Timeline Line */}
            <div className="absolute left-[42px] top-10 bottom-10 w-0.5 bg-outline-variant/30 -z-10 hidden sm:block"></div>
            
            {stops.map((stop, idx) => (
              <div key={stop.id} className="relative group/stop">
                <div className="sticky top-0 bg-surface/90 backdrop-blur-md py-2 z-10 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-label-md text-[14px] font-bold ring-4 ring-surface shadow-sm ${selected?.id === stop.id ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant group-hover/stop:bg-primary/20 group-hover/stop:text-primary transition-colors'}`}>
                    {idx + 1}
                  </div>
                  <span className={`font-label-md text-[16px] font-bold flex-1 truncate cursor-pointer transition-colors ${selected?.id === stop.id ? 'text-primary' : 'text-on-surface hover:text-primary'}`} onClick={() => selectStop(stop)}>
                    {formatDate(stop.start_date)} • {stop.city_name || stop.custom_city}
                  </span>
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    <button className="p-1.5 hover:bg-surface-variant rounded-md text-on-surface-variant transition-colors" onClick={() => reorder(stop.id, -1)}><ChevronUp size={16}/></button>
                    <button className="p-1.5 hover:bg-surface-variant rounded-md text-on-surface-variant transition-colors" onClick={() => reorder(stop.id, 1)}><ChevronDown size={16}/></button>
                  </div>
                </div>

                <div className="pl-14 pr-2 py-3 space-y-3">
                  <div 
                    className={`${selected?.id === stop.id ? 'bg-white shadow-[0px_8px_24px_rgba(59,130,246,0.12)] border-primary/30 scale-[1.02]' : 'bg-surface-container-lowest/50 border-outline-variant/30 hover:border-outline-variant hover:bg-white/80'} border rounded-2xl p-5 cursor-pointer transition-all duration-300 relative overflow-hidden`}
                    onClick={() => { selectStop(stop); loadActivities(stop.city_id); }}
                  >
                    {selected?.id === stop.id && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary"></div>}
                    
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selected?.id === stop.id ? 'bg-primary/10 text-primary' : 'bg-surface-variant/50 text-on-surface-variant'}`}>
                          <span className="material-symbols-outlined text-[20px]" style={selected?.id === stop.id ? {fontVariationSettings: "'FILL' 1"} : {}}>
                            {stop.section_type === 'flight' ? 'flight' : stop.section_type === 'hotel' ? 'hotel' : 'explore'}
                          </span>
                        </div>
                        <span className="font-headline-sm text-[18px] font-bold text-on-surface">{stop.city_name || stop.custom_city}</span>
                      </div>
                      <button className="opacity-0 group-hover/stop:opacity-100 p-2 hover:bg-error/10 rounded-full text-error transition-all" onClick={(e) => { e.stopPropagation(); deleteStop(stop.id); }}>
                        <Trash2 size={16}/>
                      </button>
                    </div>

                    <div className="flex justify-between items-center mt-4">
                      <span className={`px-3 py-1 rounded-full text-[12px] font-label-md font-bold uppercase tracking-wide ${stop.section_type === 'flight' ? 'bg-primary-container text-on-primary-container' : stop.section_type === 'hotel' ? 'bg-tertiary-container text-on-tertiary-container' : 'bg-surface-variant text-on-surface-variant'}`}>
                        {stop.section_type}
                      </span>
                      <span className="font-mono text-[14px] font-bold text-on-surface-variant">{formatCurrency(stop.budget)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Panel: Detail View */}
      <div className="flex-1 bg-surface/80 backdrop-blur-xl rounded-[24px] border border-outline-variant/30 shadow-[0px_20px_40px_rgba(0,0,0,0.05)] overflow-hidden relative min-h-[600px] w-full flex flex-col">
        {/* Background decorative element */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-tertiary/5 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="p-6 md:p-10 overflow-y-auto flex-1 z-10 scrollbar-thin scrollbar-thumb-surface-variant">
          {!selected && !form.section_type ? (
            <div className="text-center py-32 flex flex-col items-center justify-center h-full">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6 animate-pulse">
                <span className="material-symbols-outlined text-[48px]">explore</span>
              </div>
              <h3 className="font-display-sm text-[32px] font-bold mb-3 text-on-surface">Select a Stop</h3>
              <p className="font-body-lg text-[18px] text-on-surface-variant max-w-md">Choose a stop from your timeline to edit its details, manage budget, and add exciting activities.</p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-8">
              {/* Header Form */}
              <form onSubmit={saveStop} className="space-y-8 bg-white/60 backdrop-blur-md p-8 rounded-[24px] border border-outline-variant/20 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-tertiary to-primary opacity-50"></div>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary-container/50 flex items-center justify-center text-primary shadow-inner">
                      <span className="material-symbols-outlined text-[28px]">edit_location</span>
                    </div>
                    <div>
                      <h3 className="font-headline-lg text-[28px] font-bold text-on-surface">{selected ? 'Stop Details' : 'New Stop'}</h3>
                      <p className="font-body-md text-on-surface-variant">Manage destination info, dates, and budget</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 pt-2">
                  <div className="form-group mb-0">
                    <label className="font-label-md text-[13px] font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">Destination</label>
                    <div className="relative">
                      <div className="flex items-center gap-3 bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 focus-within:shadow-md transition-all">
                        <span className="material-symbols-outlined text-[20px] text-outline">search</span>
                        <input className="bg-transparent border-none p-0 focus:ring-0 text-on-surface font-body-lg text-[16px] w-full outline-none placeholder:text-outline/70" 
                               value={cityQuery} onChange={e => searchCities(e.target.value)} placeholder="Search city or type custom..." />
                      </div>
                      {citySugg.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-[0px_10px_30px_rgba(0,0,0,0.1)] z-50 overflow-hidden max-h-60 overflow-y-auto">
                          {citySugg.map(c => (
                            <div key={c.id} className="px-5 py-3 hover:bg-surface-bright cursor-pointer border-b border-outline-variant/10 last:border-0 transition-colors" onClick={() => pickCity(c)}>
                              <div className="font-bold text-[15px]">{c.name}</div>
                              <div className="text-[13px] text-on-surface-variant">{c.country}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="font-label-md text-[13px] font-bold text-on-surface-variant uppercase tracking-wider block">Start Date</label>
                      <div className="flex items-center gap-3 bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 focus-within:shadow-md transition-all">
                        <span className="material-symbols-outlined text-[20px] text-outline">calendar_today</span>
                        <input className="bg-transparent border-none p-0 focus:ring-0 text-on-surface font-body-lg text-[16px] w-full outline-none" 
                               type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="font-label-md text-[13px] font-bold text-on-surface-variant uppercase tracking-wider block">End Date</label>
                      <div className="flex items-center gap-3 bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 focus-within:shadow-md transition-all">
                        <span className="material-symbols-outlined text-[20px] text-outline">calendar_today</span>
                        <input className="bg-transparent border-none p-0 focus:ring-0 text-on-surface font-body-lg text-[16px] w-full outline-none" 
                               type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="font-label-md text-[13px] font-bold text-on-surface-variant uppercase tracking-wider block">Type</label>
                      <div className="flex items-center gap-3 bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 focus-within:shadow-md transition-all">
                        <span className="material-symbols-outlined text-[20px] text-outline">category</span>
                        <select className="bg-transparent border-none p-0 focus:ring-0 text-on-surface font-body-lg text-[16px] w-full outline-none appearance-none" 
                                value={form.section_type} onChange={e => setForm(f => ({ ...f, section_type: e.target.value }))}>
                          {SECTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="font-label-md text-[13px] font-bold text-on-surface-variant uppercase tracking-wider block">Allocated Budget (₹)</label>
                      <div className="flex items-center gap-3 bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 focus-within:shadow-md transition-all">
                        <span className="material-symbols-outlined text-[20px] text-outline">payments</span>
                        <input className="bg-transparent border-none p-0 focus:ring-0 text-on-surface font-mono text-[16px] w-full outline-none" 
                               type="number" min="0" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} placeholder="0.00" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="font-label-md text-[13px] font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">notes</span> Notes
                    </label>
                    <textarea className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-4 font-body-md text-[16px] text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 focus:shadow-md transition-all resize-none outline-none placeholder:text-outline/70" 
                              rows={3} value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Add flight info, hotel names, or things to remember..." />
                  </div>

                  <div className="flex justify-end pt-6 border-t border-outline-variant/20">
                    <button className="bg-primary text-on-primary px-8 py-3.5 rounded-full font-label-md text-[15px] font-bold flex items-center gap-2 hover:shadow-[0px_8px_20px_rgba(59,130,246,0.3)] hover:-translate-y-0.5 transition-all disabled:opacity-50" 
                            type="submit" disabled={saving}>
                      {saving ? <Spinner size={20} color="#fff" /> : <><Save size={18}/> {selected ? 'Save Changes' : 'Create Stop'}</>}
                    </button>
                  </div>
                </div>
              </form>

              {/* Activities Checklist */}
              {selected && (
                <div className="space-y-6 pt-6">
                  <div className="flex justify-between items-center bg-white/40 p-4 rounded-xl border border-white/50 shadow-sm backdrop-blur-md">
                    <h4 className="font-headline-sm text-[20px] font-bold text-on-surface flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-tertiary-container/50 flex items-center justify-center text-tertiary">
                        <span className="material-symbols-outlined text-[20px]">local_activity</span>
                      </div>
                      Activities & Experiences
                    </h4>
                  </div>
                  
                  {activities.length === 0 ? (
                    <div className="text-center py-8 text-on-surface-variant italic font-body-md text-[15px] border-2 border-dashed border-outline-variant/50 rounded-[20px] bg-white/50 backdrop-blur-sm">
                      No activities planned yet for this stop.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activities.map(a => (
                        <div key={a.id} className="flex items-center justify-between p-4 rounded-xl bg-white border border-outline-variant/30 hover:border-primary/40 hover:shadow-md transition-all group">
                          <div className="flex items-center gap-4">
                            <input type="checkbox" className="w-5 h-5 rounded text-primary border-outline-variant focus:ring-primary focus:ring-offset-0 bg-surface-container-lowest" />
                            <div className="flex flex-col">
                              <span className="font-body-lg text-[16px] font-bold text-on-surface">{a.custom_name || a.name}</span>
                              <span className="text-[11px] bg-tertiary-container/50 text-tertiary px-2 py-0.5 rounded-full w-fit mt-1 uppercase tracking-wider font-bold">{a.category}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-mono text-[14px] font-bold text-on-surface-variant bg-surface-container px-3 py-1 rounded-lg">{formatCurrency(a.cost)}</span>
                            <button className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error/10 opacity-0 group-hover:opacity-100 transition-all" onClick={() => deleteActivity(selected.id, a.id)}>
                              <Trash2 size={16}/>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Suggestions */}
                  {actSearch.length > 0 && (
                    <div className="mt-8 pt-8 border-t border-outline-variant/20">
                      <div className="font-label-md text-[13px] font-bold text-on-surface-variant uppercase tracking-wider mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[20px] text-secondary">recommend</span> Suggested for {selected.city_name}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {actSearch.slice(0,6).map(a => (
                          <div key={a.id} className="flex items-center justify-between p-4 rounded-xl border border-outline-variant/30 bg-white/80 hover:bg-white hover:border-primary/40 hover:shadow-md cursor-pointer transition-all group" onClick={() => addActivity(selected.id, a.id, a.estimated_cost)}>
                            <div className="flex flex-col flex-1 min-w-0 pr-4">
                              <span className="font-body-lg text-[15px] font-bold text-on-surface truncate">{a.name}</span>
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-[10px] bg-primary-container/50 text-primary px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">{a.category}</span>
                                <span className="text-[12px] font-mono font-semibold text-on-surface-variant">{formatCurrency(a.estimated_cost)}</span>
                              </div>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                              <Plus size={18} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
