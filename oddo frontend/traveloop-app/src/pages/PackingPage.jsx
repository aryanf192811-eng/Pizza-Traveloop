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
    <div className="w-full pb-12">
      {/* Hero Section */}
      <section className="mb-10">
        <div className="relative bg-surface-container-lowest rounded-[32px] border border-outline-variant/30 shadow-[0px_4px_20px_rgba(59,130,246,0.04)] overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8 md:p-12 items-center">
            <div className="flex flex-col gap-6">
              <div>
                <h1 className="font-display-lg text-[48px] tracking-tight font-bold text-on-surface mb-2 leading-[1.1]">Packing List</h1>
                <p className="font-body-lg text-[18px] text-on-surface-variant m-0">Your smart packing list to stay organized.</p>
              </div>
              <div className="flex items-center gap-6 bg-surface p-6 rounded-2xl border border-primary/10">
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path className="text-surface-variant" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3"></path>
                    <path className="text-[#14B8A6]" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray={`${total > 0 ? (packedCount / total) * 100 : 0}, 100`} strokeWidth="3"></path>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[14px] font-bold text-primary">{total > 0 ? Math.round((packedCount / total) * 100) : 0}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-[24px] font-bold text-on-surface m-0">{packedCount} of {total}</p>
                  <p className="text-[16px] text-on-surface-variant m-0">Items packed</p>
                </div>
              </div>
              <div className="flex gap-3 flex-wrap">
                <button 
                  onClick={handleGenerate} disabled={generating}
                  className={`relative flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-primary-container text-white px-8 py-4 rounded-full text-[14px] font-bold shadow-[0px_8px_20px_rgba(59,130,246,0.2)] transition-all ${generating ? 'cursor-default opacity-70' : 'cursor-pointer hover:-translate-y-0.5'}`}>
                  {generating ? <Spinner size={16} color="#fff" /> : '✨'} Generate Smart List
                </button>
                <button onClick={handleReset} className="flex items-center justify-center gap-2 px-6 py-4 rounded-full border border-outline-variant text-on-surface-variant hover:bg-surface-variant transition-colors min-h-[52px]">
                  <RotateCcw size={16}/> Reset
                </button>
              </div>
              {fallbackUsed && (
                <p className="text-[14px] text-on-surface-variant flex items-center gap-1.5 italic m-0">
                  <span className="text-[16px]">⚠️</span> AI unavailable. Using offline recommendations.
                </p>
              )}
            </div>
            <div className="relative h-full min-h-[300px] rounded-2xl overflow-hidden flex items-center justify-center bg-surface-container-low shadow-inner">
              <img alt="Luggage" className="w-full h-full object-cover opacity-90 mix-blend-multiply" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBZkAjQst1P9k7tUfqC7f1HZdmUm0tvcVK8Hzl9VoZQyLnaas_u42_n4i8d4f9vRTmz50BYjSlUzUnOtFQa0cTgcIyExzovZhgiisfBA6_cJGPMm8vNouDLu8cqhOroQOiqbutlaIZXc-JrSmiNqCT2Onb1PtnWQqXD-cnH4PJSBle_4ftqX37azjTCzano2D9AfB7TxhC20zyhZN9XUPSHOHExcGHvlBxaZwNqJ65x5ZgSj_8lIndzz3rvQFjk1xV-DcqEQbUkhu2o" />
            </div>
          </div>
        </div>
      </section>

      {/* Add item form */}
      <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3 mb-8 bg-surface p-6 rounded-[24px] border border-outline-variant/30 shadow-sm">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[13px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Item Name</label>
          <input className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-[16px]" placeholder="e.g., Passport" value={newItem.item_name} onChange={e => setNewItem(f => ({ ...f, item_name: e.target.value }))} />
        </div>
        <div className="w-[180px]">
          <label className="block text-[13px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Category</label>
          <input className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-[16px]" placeholder="Category" value={newItem.category} onChange={e => setNewItem(f => ({ ...f, category: e.target.value }))} />
        </div>
        <button className="bg-primary text-white px-6 py-3.5 rounded-xl font-bold text-[15px] flex items-center justify-center gap-2 hover:shadow-[0px_8px_16px_rgba(59,130,246,0.3)] hover:-translate-y-0.5 transition-all h-[52px]" type="submit" disabled={adding}>
          {adding ? <Spinner size={16} color="#fff"/> : <><Plus size={18}/> Add Item</>}
        </button>
      </form>

      {/* Checklist Categories */}
      {Object.keys(grouped).length === 0 && (
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-[24px] p-12 text-center">
          <div className="font-display-sm text-[24px] font-bold text-on-surface mb-2">No items yet</div>
          <div className="font-body-lg text-[16px] text-on-surface-variant">Add items manually or use the AI generator.</div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {Object.entries(grouped).map(([cat, catItems]) => (
          <div key={cat} className="bg-surface-container-lowest rounded-[24px] p-7 shadow-[0px_4px_20px_rgba(0,0,0,0.04)] border border-outline-variant/20 hover:border-outline-variant/50 transition-colors">
            <div className="flex items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[20px]">category</span>
                </div>
                <h2 className="text-[22px] font-bold text-on-surface m-0">{cat}</h2>
              </div>
              <span className="text-[13px] font-bold text-on-surface-variant bg-surface px-3 py-1 rounded-full">{catItems.filter(i => i.is_packed).length}/{catItems.length}</span>
            </div>
            
            <div className="flex flex-col gap-3">
              {catItems.map(item => (
                <div key={item.id} className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer group ${item.is_packed ? 'bg-[#14B8A6]/10 border-[#14B8A6]/30' : 'bg-surface border-outline-variant/30 hover:border-outline-variant/60'}`} onClick={() => handleToggle(item.id)}>
                  <div className={`shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center text-white transition-all ${item.is_packed ? 'border-[#14B8A6] bg-[#14B8A6]' : 'border-outline-variant bg-transparent'}`}>
                    {item.is_packed && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                  </div>
                  <span className={`flex-1 text-[16px] ${item.is_packed ? 'text-on-surface/60 line-through' : 'text-on-surface'}`}>
                    {item.item_name}
                  </span>
                  {item.ai_generated && (
                    <span className="bg-primary-container text-white text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-full flex items-center gap-1">
                      ✨ Smart
                    </span>
                  )}
                  <button className="p-2 w-auto h-auto rounded-lg text-outline opacity-0 group-hover:opacity-100 hover:text-error hover:bg-error/10 transition-all" onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={noKeyModal} onClose={() => setNoKeyModal(false)} title="Gemini API Key Required" size="sm">
        <p style={{ color:'var(--text-secondary)', marginBottom:16 }}>Add your Gemini API key in Profile settings to use AI generation.</p>
        <p style={{ fontSize:13, color:'var(--text-muted)' }}>Get your free key at <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" style={{ color:'var(--blue)' }}>aistudio.google.com</a></p>
        <button className="btn btn-secondary" style={{ marginTop:16 }} onClick={() => setNoKeyModal(false)}>Close</button>
      </Modal>
    </div>
  );
}
