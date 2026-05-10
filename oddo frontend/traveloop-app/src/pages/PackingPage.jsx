import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Trash2, RotateCcw } from 'lucide-react';
import api, { getApiError } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import { getDayCount } from '../utils/formatters';
import { generatePackingList } from '../utils/gemini';
import Spinner from '../components/ui/Spinner';
import Modal from '../components/ui/Modal';

export default function PackingPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [packedCount, setPackedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [fallbackUsed, setFallbackUsed] = useState(false);
  const [noKeyModal, setNoKeyModal] = useState(false);
  const [newItem, setNewItem] = useState({ item_name: '', category: 'Misc' });
  const [adding, setAdding] = useState(false);

  const load = async () => {
    try {
      const { data: res } = await api.get(`/trips/${id}/packing`);
      setItems(res.data.items); setTotal(res.data.total); setPackedCount(res.data.packed_count);
    } catch { addToast('Failed to load packing list', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const handleToggle = async (itemId) => {
    try {
      const { data: res } = await api.patch(`/trips/${id}/packing/${itemId}/toggle`);
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, ...res.data } : i));
      setPackedCount(prev => res.data.is_packed ? prev + 1 : prev - 1);
    } catch (err) { addToast(getApiError(err), 'error'); }
  };

  const handleDelete = async (itemId) => {
    try { await api.delete(`/trips/${id}/packing/${itemId}`); await load(); }
    catch (err) { addToast(getApiError(err), 'error'); }
  };

  const handleAdd = async (ev) => {
    ev.preventDefault();
    if (!newItem.item_name.trim()) return;
    setAdding(true);
    try {
      await api.post(`/trips/${id}/packing`, { item_name: newItem.item_name, category: newItem.category });
      setNewItem({ item_name: '', category: 'Misc' }); await load();
    } catch (err) { addToast(getApiError(err), 'error'); }
    finally { setAdding(false); }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setFallbackUsed(false);
    try {
      const [stopsRes, tripRes] = await Promise.all([api.get(`/trips/${id}/stops`), api.get(`/trips/${id}`)]);
      const destinations = stopsRes.data.data.map(s => s.city_name || s.custom_city || '').filter(Boolean);
      const trip = tripRes.data.data;
      const tripDays = getDayCount(trip.start_date, trip.end_date);
      const apiKey = user?.gemini_key || import.meta.env.VITE_GEMINI_KEY || '';

      const { items, usedFallback } = await generatePackingList(destinations, tripDays, apiKey);
      setFallbackUsed(usedFallback);

      // Use bulk endpoint — single request, correct per API contract
      const { data: bulkRes } = await api.post(`/trips/${id}/packing/bulk`, { items });
      await load();
      const inserted = bulkRes.data?.inserted ?? items.length;
      if (usedFallback) {
        addToast(`AI unavailable — ${inserted} offline recommendations added.`, 'warn');
      } else {
        addToast(`Smart list added! ${inserted} items generated.`, 'success');
      }
    } catch (err) { addToast(getApiError(err), 'error'); }
    finally { setGenerating(false); }
  };

  const handleReset = async () => {
    if (!confirm('Mark all items as unpacked?')) return;
    try { await api.post(`/trips/${id}/packing/reset`); await load(); addToast('All items marked unpacked', 'info'); }
    catch (err) { addToast(getApiError(err), 'error'); }
  };

  // Group by category
  const grouped = items.reduce((acc, item) => {
    acc[item.category] = acc[item.category] || [];
    acc[item.category].push(item);
    return acc;
  }, {});

  if (loading) return <Spinner size={32} />;

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h2 style={{ fontWeight:700, fontSize:20 }}>Packing List</h2>
          <div style={{ fontSize:13, color:'var(--text-secondary)' }}>{packedCount} of {total} items packed</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn btn-secondary btn-sm" onClick={handleReset}><RotateCcw size={14}/> Reset</button>
          <button className="btn btn-ai btn-sm" onClick={handleGenerate} disabled={generating}>
            {generating ? <Spinner size={14} color="#fff"/> : '✨'} Generate Smart List
          </button>
        </div>
      </div>
      {fallbackUsed && (
        <div className="ai-fallback-banner">
          <span>⚡</span>
          AI unavailable — showing offline smart recommendations based on your destination.
        </div>
      )}

      {/* Progress */}
      <div className="packing-progress-wrap">
        <div className="packing-progress-track">
          <div className="packing-progress-fill" style={{ width: total > 0 ? `${(packedCount/total)*100}%` : '0%' }} />
        </div>
      </div>

      {/* Add item */}
      <form onSubmit={handleAdd} style={{ display:'flex', gap:8, marginBottom:24, flexWrap:'wrap' }}>
        <input className="form-input" style={{ flex:1, minWidth:180 }} placeholder="Item name" value={newItem.item_name} onChange={e => setNewItem(f => ({ ...f, item_name: e.target.value }))} />
        <input className="form-input" style={{ width:140 }} placeholder="Category" value={newItem.category} onChange={e => setNewItem(f => ({ ...f, category: e.target.value }))} />
        <button className="btn btn-primary" type="submit" disabled={adding}>{adding ? <Spinner size={16} color="#fff"/> : <><Plus size={14}/> Add</>}</button>
      </form>

      {/* Groups */}
      {Object.keys(grouped).length === 0 && (
        <div className="empty-state"><div className="empty-title">No items yet</div><div className="empty-desc">Add items manually or use the AI generator.</div></div>
      )}
      {Object.entries(grouped).map(([cat, catItems]) => (
        <div key={cat} style={{ marginBottom:24 }}>
          <div className="packing-category-header">{cat} ({catItems.filter(i => i.is_packed).length}/{catItems.length})</div>
          {catItems.map(item => (
            <div key={item.id} className={`packing-item${item.is_packed ? ' packed' : ''}`}>
              <input type="checkbox" checked={item.is_packed} onChange={() => handleToggle(item.id)} style={{ accentColor:'var(--blue)', width:16, height:16, cursor:'pointer' }} />
              <span className="packing-item-name">{item.item_name}</span>
              {item.ai_generated && <span className="ai-badge">AI</span>}
              <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(item.id)}><Trash2 size={12}/></button>
            </div>
          ))}
        </div>
      ))}

      <Modal isOpen={noKeyModal} onClose={() => setNoKeyModal(false)} title="Gemini API Key Required" size="sm">
        <p style={{ color:'var(--text-secondary)', marginBottom:16 }}>Add your Gemini API key in Profile settings to use AI generation.</p>
        <p style={{ fontSize:13, color:'var(--text-muted)' }}>Get your free key at <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" style={{ color:'var(--blue)' }}>aistudio.google.com</a></p>
        <button className="btn btn-secondary" style={{ marginTop:16 }} onClick={() => setNoKeyModal(false)}>Close</button>
      </Modal>
    </div>
  );
}
