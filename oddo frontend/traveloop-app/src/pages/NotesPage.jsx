import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Edit2, Trash2, StickyNote } from 'lucide-react';
import api, { getApiError } from '../api/axios';
import { useToast } from '../hooks/useToast';
import { formatDate } from '../utils/formatters';
import Spinner from '../components/ui/Spinner';

export default function NotesPage() {
  const { id } = useParams();
  const { addToast } = useToast();
  const [notes, setNotes] = useState([]);
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStop, setSelectedStop] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newStopId, setNewStopId] = useState('');
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editContent, setEditContent] = useState('');

  const loadNotes = async (stopFilter) => {
    try {
      const { data: res } = await api.get(`/trips/${id}/notes`, { params: { stop_id: stopFilter || undefined } });
      setNotes(res.data);
    } catch { addToast('Failed to load notes', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    api.get(`/trips/${id}/stops`).then(({ data: res }) => setStops(res.data)).catch(() => {});
    loadNotes('');
  }, [id]);

  const handleAdd = async (ev) => {
    ev.preventDefault();
    if (!newContent.trim()) return;
    setAdding(true);
    try {
      await api.post(`/trips/${id}/notes`, { content: newContent, stop_id: newStopId ? parseInt(newStopId) : undefined });
      setNewContent(''); setNewStopId(''); await loadNotes(selectedStop);
    } catch (err) { addToast(getApiError(err), 'error'); }
    finally { setAdding(false); }
  };

  const handleEdit = async (noteId) => {
    try {
      await api.put(`/trips/${id}/notes/${noteId}`, { content: editContent });
      setEditId(null); await loadNotes(selectedStop); addToast('Note updated', 'success');
    } catch (err) { addToast(getApiError(err), 'error'); }
  };

  const handleDelete = async (noteId) => {
    if (!confirm('Delete this note?')) return;
    try { await api.delete(`/trips/${id}/notes/${noteId}`); setNotes(prev => prev.filter(n => n.id !== noteId)); }
    catch (err) { addToast(getApiError(err), 'error'); }
  };

  return (
    <div className="w-full pb-12 max-w-5xl mx-auto">
      {/* Header and Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display-lg text-[36px] tracking-tight font-bold text-on-surface mb-2">Trip Notes</h1>
          <p className="font-body-lg text-on-surface-variant m-0">Keep all your thoughts and details in one place.</p>
        </div>
        <div className="flex items-center gap-3 bg-surface-container-lowest p-2 rounded-xl border border-outline-variant/30 shadow-sm">
          <span className="material-symbols-outlined text-on-surface-variant pl-2">filter_list</span>
          <select className="bg-transparent border-none focus:ring-0 text-[15px] font-medium text-on-surface w-[180px] cursor-pointer" value={selectedStop} onChange={e => { setSelectedStop(e.target.value); loadNotes(e.target.value); }}>
            <option value="">All Stops</option>
            {stops.map(s => <option key={s.id} value={s.id}>{s.city_name || s.custom_city}</option>)}
          </select>
        </div>
      </div>

      {/* Add note */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-[24px] p-6 mb-10 shadow-[0px_4px_20px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[20px]">edit_note</span>
          </div>
          <h3 className="text-[20px] font-bold text-on-surface m-0">Add Note</h3>
        </div>
        <form onSubmit={handleAdd} noValidate>
          <div className="mb-4">
            <textarea className="w-full bg-surface border border-outline-variant/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-[16px] resize-y min-h-[100px]" value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="Write your note here..." />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
            <div className="flex-1 max-w-[300px]">
              <label className="block text-[13px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Link to Stop (optional)</label>
              <select className="w-full bg-surface border border-outline-variant/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-[15px]" value={newStopId} onChange={e => setNewStopId(e.target.value)}>
                <option value="">None</option>
                {stops.map(s => <option key={s.id} value={s.id}>{s.city_name || s.custom_city}</option>)}
              </select>
            </div>
            <button className="bg-primary text-white px-6 py-3 rounded-xl font-bold text-[15px] flex items-center justify-center gap-2 hover:shadow-[0px_8px_16px_rgba(59,130,246,0.3)] hover:-translate-y-0.5 transition-all h-[48px]" type="submit" disabled={adding}>
              {adding ? <Spinner size={16} color="#fff"/> : <><Plus size={18}/> Save Note</>}
            </button>
          </div>
        </form>
      </div>

      {/* Notes list */}
      {loading ? <div className="flex justify-center p-12"><Spinner size={32} /></div> : notes.length === 0 ? (
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-[24px] p-12 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-4">
            <StickyNote size={32}/>
          </div>
          <div className="font-display-sm text-[24px] font-bold text-on-surface mb-2">No notes yet</div>
          <div className="font-body-lg text-[16px] text-on-surface-variant">Your travel notes will appear here.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {notes.map(note => (
            <div key={note.id} className="bg-surface-container-lowest border border-outline-variant/30 rounded-[24px] p-6 shadow-sm hover:shadow-md transition-all group">
              {editId === note.id ? (
                <>
                  <textarea className="w-full bg-surface border border-primary/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-[16px] resize-y min-h-[120px] mb-4" value={editContent} onChange={e => setEditContent(e.target.value)} />
                  <div className="flex items-center gap-3">
                    <button className="bg-primary text-white px-5 py-2 rounded-lg font-bold text-[14px] hover:bg-primary/90 transition-colors" onClick={() => handleEdit(note.id)}>Save</button>
                    <button className="bg-surface border border-outline-variant text-on-surface-variant px-5 py-2 rounded-lg font-bold text-[14px] hover:bg-surface-variant transition-colors" onClick={() => setEditId(null)}>Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-[16px] text-on-surface leading-relaxed mb-6 whitespace-pre-wrap">{note.content}</div>
                  <div className="flex items-center justify-between border-t border-outline-variant/20 pt-4">
                    <div className="flex flex-wrap items-center gap-3">
                      {note.stop_name && <span className="bg-primary-container text-primary-dark text-[12px] font-bold px-3 py-1 rounded-full">{note.stop_name}</span>}
                      <span className="text-[13px] text-on-surface-variant font-medium flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">schedule</span>{formatDate(note.updated_at)}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 rounded-lg text-outline hover:text-primary hover:bg-primary/10 transition-colors" onClick={() => { setEditId(note.id); setEditContent(note.content); }}><Edit2 size={16}/></button>
                      <button className="p-2 rounded-lg text-outline hover:text-error hover:bg-error/10 transition-colors" onClick={() => handleDelete(note.id)}><Trash2 size={16}/></button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
