import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { Edit2, Trash2, Globe, Lock, Calendar, MapPin, Users } from 'lucide-react';
import api, { getApiError } from '../api/axios';
import { useToast } from '../hooks/useToast';
import { formatDate, formatCurrency, getStatusColor, formatDateInput } from '../utils/formatters';
import { validateRequired, validateDateOrder, validatePositiveNumber, TRIP_STATUSES } from '../utils/validators';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import BudgetBar from '../components/trips/BudgetBar';
import { PageSpinner } from '../components/ui/Spinner';
import { getCityImage } from '../utils/cityImages';

export default function TripDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    api.get(`/trips/${id}`)
      .then(({ data: res }) => { setTrip(res.data); setEditForm({ ...res.data, start_date: formatDateInput(res.data.start_date), end_date: formatDateInput(res.data.end_date) }); })
      .catch(() => addToast('Failed to load trip', 'error'))
      .finally(() => setLoading(false));
  }, [id]);

  const tabs = [
    { label: 'Itinerary', path: `/trips/${id}/itinerary` },
    { label: 'Budget',    path: `/trips/${id}/budget` },
    { label: 'Packing',   path: `/trips/${id}/packing` },
    { label: 'Notes',     path: `/trips/${id}/notes` },
    { label: 'Invoice',   path: `/trips/${id}/invoice` },
  ];

  const handleEdit = async (ev) => {
    ev.preventDefault();
    setSaving(true);
    try {
      const { data: res } = await api.put(`/trips/${id}`, {
        title: editForm.title, description: editForm.description,
        start_date: editForm.start_date, end_date: editForm.end_date,
        total_budget: parseFloat(editForm.total_budget),
        status: editForm.status, is_public: Boolean(editForm.is_public),
      });
      setTrip(res.data); setEditOpen(false); addToast('Trip updated!', 'success');
    } catch (err) { addToast(getApiError(err), 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/trips/${id}`);
      addToast('Trip deleted', 'success');
      navigate('/trips');
    } catch (err) { addToast(getApiError(err), 'error'); }
    finally { setDeleting(false); setDeleteOpen(false); }
  };

  const handleVisibility = async () => {
    try {
      const { data: res } = await api.patch(`/trips/${id}/visibility`);
      setTrip(prev => ({ ...prev, is_public: res.data.is_public }));
      addToast(res.data.is_public ? 'Trip is now public' : 'Trip is now private', 'info');
    } catch (err) { addToast(getApiError(err), 'error'); }
  };

  if (loading) return <PageSpinner />;
  if (!trip) return null;

  const baseUrl = (import.meta.env.VITE_API_URL || '').replace('/api', '');

  return (
    <div>
      {/* Cover */}
      <div style={{ height:220, borderRadius:16, overflow:'hidden', marginBottom:24, position:'relative' }}>
        <img
          src={trip.cover_photo ? `${baseUrl}${trip.cover_photo}` : getCityImage(trip.title)}
          alt={trip.title}
          style={{ width:'100%', height:'100%', objectFit:'cover' }}
          onError={(e) => { e.currentTarget.style.display='none'; }}
        />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 60%)' }} />
      </div>

      {/* Header */}
      <div className="page-header">
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:6 }}>
            <h1 className="page-title" style={{ marginBottom:0 }}>{trip.title}</h1>
            <span className={`badge ${getStatusColor(trip.status)}`}>{trip.status}</span>
            {trip.is_public && <span className="badge badge-green">Public</span>}
          </div>
          <div style={{ display:'flex', gap:16, color:'var(--text-muted)', fontSize:14 }}>
            <span style={{ display:'flex', alignItems:'center', gap:6 }}><Calendar size={14}/>{formatDate(trip.start_date)} – {formatDate(trip.end_date)}</span>
            {trip.stops?.length != null && <span style={{ display:'flex', alignItems:'center', gap:6 }}><MapPin size={14}/>{trip.stops?.length || 0} stops</span>}
          </div>
          {trip.description && <p style={{ color:'var(--text-secondary)', marginTop:8, fontSize:14 }}>{trip.description}</p>}
        </div>
        <div style={{ display:'flex', gap:8, flexShrink:0, flexWrap:'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setEditOpen(true)}><Edit2 size={14}/> Edit</button>
          <button className="btn btn-secondary btn-sm" onClick={handleVisibility}>
            {trip.is_public ? <><Lock size={14}/> Make Private</> : <><Globe size={14}/> Make Public</>}
          </button>
          {trip.is_public && (
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/community')} style={{ color:'var(--color-primary)', borderColor:'var(--color-primary)' }}>
              <Users size={14}/> Share to Community
            </button>
          )}
          <button className="btn btn-danger btn-sm" onClick={() => setDeleteOpen(true)}><Trash2 size={14}/> Delete</button>
        </div>
      </div>

      <div className="card card-p" style={{ marginBottom:24 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
          <span style={{ color:'var(--text-secondary)', fontSize:14 }}>Budget Overview</span>
          <span className="mono" style={{ fontSize:14 }}>{formatCurrency(trip.total_budget)}</span>
        </div>
        <BudgetBar budget={trip.total_budget} spent={trip.total_spent || 0} />
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom:0 }}>
        {tabs.map(tab => (
          <button key={tab.path} className={`tab-btn${location.pathname === tab.path ? ' active' : ''}`} onClick={() => navigate(tab.path)}>
            {tab.label}
          </button>
        ))}
      </div>
      <div style={{ paddingTop:24 }}>
        <Outlet />
      </div>

      {/* Edit Modal */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Trip" size="md">
        <form onSubmit={handleEdit} noValidate>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input className="form-input" value={editForm.title || ''} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" rows={3} value={editForm.description || ''} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input className="form-input" type="date" value={editForm.start_date || ''} onChange={e => setEditForm(f => ({ ...f, start_date: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">End Date</label>
              <input className="form-input" type="date" value={editForm.end_date || ''} onChange={e => setEditForm(f => ({ ...f, end_date: e.target.value }))} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Budget (₹)</label>
              <input className="form-input" type="number" min="0" value={editForm.total_budget || ''} onChange={e => setEditForm(f => ({ ...f, total_budget: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={editForm.status || ''} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}>
                {TRIP_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <label style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20, cursor:'pointer' }}>
            <input type="checkbox" checked={!!editForm.is_public} onChange={e => setEditForm(f => ({ ...f, is_public: e.target.checked }))} />
            <span style={{ fontSize:14 }}>Make trip public</span>
          </label>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setEditOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <Spinner size={16} color="#fff" /> : 'Save Changes'}</button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Trip?" size="sm">
        <p style={{ color:'var(--text-secondary)', marginBottom:24 }}>This will permanently delete "{trip.title}" and all its data.</p>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button className="btn btn-secondary" onClick={() => setDeleteOpen(false)}>Cancel</button>
          <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? <Spinner size={16} color="#fff" /> : 'Delete Trip'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
