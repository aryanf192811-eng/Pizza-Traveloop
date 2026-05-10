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
    <div>
      {/* Filter by stop */}
      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        <select className="form-select" style={{ width:200 }} value={selectedStop} onChange={e => { setSelectedStop(e.target.value); loadNotes(e.target.value); }}>
          <option value="">All Stops</option>
          {stops.map(s => <option key={s.id} value={s.id}>{s.city_name || s.custom_city}</option>)}
        </select>
      </div>

      {/* Add note */}
      <div className="card card-p" style={{ marginBottom:24 }}>
        <h3 style={{ fontWeight:700, marginBottom:12 }}>Add Note</h3>
        <form onSubmit={handleAdd} noValidate>
          <div className="form-group">
            <textarea className="form-textarea" rows={3} value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="Write your note…" />
          </div>
          <div style={{ display:'flex', gap:10, alignItems:'flex-end' }}>
            <div className="form-group" style={{ flex:1, marginBottom:0 }}>
              <label className="form-label">Link to Stop (optional)</label>
              <select className="form-select" value={newStopId} onChange={e => setNewStopId(e.target.value)}>
                <option value="">None</option>
                {stops.map(s => <option key={s.id} value={s.id}>{s.city_name || s.custom_city}</option>)}
              </select>
            </div>
            <button className="btn btn-primary" type="submit" disabled={adding}>
              {adding ? <Spinner size={16} color="#fff"/> : <><Plus size={14}/> Save Note</>}
            </button>
          </div>
        </form>
      </div>

      {/* Notes list */}
      {loading ? <Spinner size={32} /> : notes.length === 0 ? (
        <div className="empty-state"><div className="empty-icon"><StickyNote size={28}/></div><div className="empty-title">No notes yet</div></div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {notes.map(note => (
            <div key={note.id} className="note-card">
              {editId === note.id ? (
                <>
                  <textarea className="form-textarea" rows={4} value={editContent} onChange={e => setEditContent(e.target.value)} style={{ marginBottom:10 }} />
                  <div style={{ display:'flex', gap:8 }}>
                    <button className="btn btn-primary btn-sm" onClick={() => handleEdit(note.id)}>Save</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setEditId(null)}>Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="note-content">{note.content}</div>
                  <div className="note-meta">
                    {note.stop_name && <span className="badge badge-blue">{note.stop_name}</span>}
                    <span>{formatDate(note.updated_at)}</span>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { setEditId(note.id); setEditContent(note.content); }}><Edit2 size={13}/></button>
                    <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(note.id)}><Trash2 size={13}/></button>
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
