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
    <div className="w-full relative pb-12">
      {/* Hero Banner */}
      <section className="relative w-full h-[300px] md:h-[400px] lg:h-[500px] rounded-[32px] overflow-hidden shadow-[0px_20px_40px_rgba(0,0,0,0.1)] mb-8">
        <img
          src={trip.cover_photo ? `${baseUrl}${trip.cover_photo}` : getCityImage(trip.title)}
          alt={trip.title}
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => { e.currentTarget.style.display='none'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-8 lg:p-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="text-white z-10 flex-1">
            <div className="flex items-center gap-3 mb-3">
              <span className={`px-3 py-1 rounded-full font-label-md text-[12px] uppercase tracking-wider backdrop-blur-md font-bold ${trip.status === 'upcoming' ? 'bg-primary-container/80 text-on-primary-container' : trip.status === 'ongoing' ? 'bg-[#10b981]/80 text-white' : 'bg-surface-variant/80 text-on-surface'}`}>{trip.status}</span>
              {trip.is_public && <span className="px-3 py-1 rounded-full text-[12px] font-bold uppercase tracking-wider bg-white/20 text-white backdrop-blur-md">Public</span>}
              <span className="text-white/90 font-label-md text-sm flex items-center gap-2">
                <Calendar size={16} />
                {formatDate(trip.start_date)} – {formatDate(trip.end_date)}
              </span>
            </div>
            <h1 className="font-display-lg text-[32px] md:text-[40px] lg:text-[48px] text-white mb-2 font-bold leading-tight shadow-sm drop-shadow-md">{trip.title}</h1>
            {trip.description && <p className="font-body-lg text-[16px] lg:text-[18px] text-white/90 max-w-2xl drop-shadow-sm">{trip.description}</p>}
          </div>
          
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-xl border border-white/30 rounded-full p-2 z-10 shadow-[0px_20px_40px_rgba(0,0,0,0.1)]">
            <button className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors" onClick={() => setEditOpen(true)} title="Edit">
              <Edit2 size={18} />
            </button>
            <button className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors" onClick={handleVisibility} title={trip.is_public ? "Make Private" : "Make Public"}>
              {trip.is_public ? <Lock size={18} /> : <Globe size={18} />}
            </button>
            {trip.is_public && (
              <button className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors" onClick={() => navigate('/community')} title="Share">
                <Users size={18} />
              </button>
            )}
            <div className="w-px h-6 bg-white/30 mx-1"></div>
            <button className="w-10 h-10 rounded-full flex items-center justify-center text-[#ffdad6] hover:bg-error/30 transition-colors" onClick={() => setDeleteOpen(true)} title="Delete">
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </section>

      <div className="w-full relative z-20">
        {/* Segmented Tab Navigation */}
        <div className="bg-surface/80 backdrop-blur-xl border border-outline-variant/30 rounded-2xl p-2 flex overflow-x-auto hide-scrollbar shadow-[0px_10px_30px_rgba(59,130,246,0.05)] mb-8 max-w-fit mx-auto relative">
          <nav aria-label="Trip Detail Tabs" className="flex gap-2 min-w-max relative">
            {tabs.map((tab) => {
              const isActive = location.pathname === tab.path;
              return (
                <button 
                  key={tab.path} 
                  onClick={() => navigate(tab.path)}
                  className={`relative z-10 font-label-md text-[14px] px-6 py-2.5 rounded-xl flex items-center gap-2 justify-center transition-all duration-300 ${isActive ? 'bg-white shadow-sm border border-outline-variant/20 text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/30 font-semibold'}`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Summary Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Stops Card */}
          <div className="bg-surface-container-lowest rounded-[24px] p-6 border border-outline-variant/20 shadow-[0px_4px_20px_rgba(59,130,246,0.04)] hover:shadow-[0px_20px_40px_rgba(59,130,246,0.12)] transition-shadow duration-300 flex flex-col justify-between group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <MapPin size={24} />
              </div>
              <span className="font-label-md text-[14px] font-bold text-on-surface-variant uppercase tracking-wider">Stops</span>
            </div>
            <div>
              <h3 className="font-headline-lg text-[32px] font-bold text-on-surface leading-tight">{trip.stops?.length || 0}</h3>
              <p className="font-body-md text-[14px] text-on-surface-variant mt-1">Destinations Planned</p>
            </div>
          </div>
          
          {/* Budget Card */}
          <div className="bg-surface-container-lowest rounded-[24px] p-6 border border-outline-variant/20 shadow-[0px_4px_20px_rgba(59,130,246,0.04)] hover:shadow-[0px_20px_40px_rgba(59,130,246,0.12)] transition-shadow duration-300 md:col-span-2 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1", fontSize: 24}}>pie_chart</span>
                </div>
                <div>
                  <h3 className="font-headline-md text-[24px] font-bold text-on-surface leading-tight">
                    {formatCurrency(trip.total_spent || 0)} <span className="text-on-surface-variant text-[16px] font-normal">/ {formatCurrency(trip.total_budget)}</span>
                  </h3>
                  <p className="font-label-md text-[14px] font-semibold text-on-surface-variant">Total Budget</p>
                </div>
              </div>
              {(() => {
                const perc = trip.total_budget > 0 ? ((trip.total_spent || 0) / trip.total_budget) * 100 : 0;
                let statusInfo = perc > 100 ? { label: 'Over Budget', classes: 'text-error bg-error-container/50' } : perc > 85 ? { label: 'Nearing Limit', classes: 'text-[#b75b00] bg-[#ffdcc6]/50' } : { label: 'On Track', classes: 'text-[#10b981] bg-[#10b981]/10' };
                return <span className={`font-label-md text-[12px] font-bold px-3 py-1 rounded-full ${statusInfo.classes}`}>{statusInfo.label}</span>;
              })()}
            </div>
            {/* Progress Bar */}
            <div className="mt-4">
              {(() => {
                const perc = trip.total_budget > 0 ? Math.min(((trip.total_spent || 0) / trip.total_budget) * 100, 100) : 0;
                return (
                  <>
                    <div className="flex justify-between font-label-md font-semibold text-[12px] text-on-surface-variant mb-2">
                      <span>Spent: {Math.round(perc)}%</span>
                      <span>{formatCurrency(Math.max(0, trip.total_budget - (trip.total_spent || 0)))} Remaining</span>
                    </div>
                    <div className="w-full h-3 bg-surface-variant rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-1000 ease-out ${perc > 100 ? 'bg-error' : perc > 85 ? 'bg-tertiary-container' : 'bg-primary'}`} style={{ width: `${perc}%` }}></div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
        
        {/* Content Outlet */}
        <div className="w-full min-h-[400px]">
          <Outlet />
        </div>
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
