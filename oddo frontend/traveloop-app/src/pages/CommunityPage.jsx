import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, ChevronDown } from 'lucide-react';
import api, { getApiError } from '../api/axios';
import { useToast } from '../hooks/useToast';
import { formatDate, getInitials } from '../utils/formatters';
import { getCityImage } from '../utils/cityImages';
import Spinner from '../components/ui/Spinner';
import Modal from '../components/ui/Modal';

export default function CommunityPage() {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [myTrips, setMyTrips] = useState([]);
  const [shareForm, setShareForm] = useState({ trip_id: '', caption: '' });
  const [sharing, setSharing] = useState(false);
  const baseUrl = (import.meta.env.VITE_API_URL || '').replace('/api', '');

  const loadPosts = async (page = 1, append = false) => {
    try {
      const { data: res } = await api.get('/community', { params: { page, limit: 10 } });
      setPosts(prev => append ? [...prev, ...res.data] : res.data);
      setMeta(res.meta);
    } catch { addToast('Failed to load community posts', 'error'); }
    finally { setLoading(false); setLoadingMore(false); }
  };

  useEffect(() => { loadPosts(); }, []);

  const openShare = async () => {
    try {
      const { data: res } = await api.get('/trips');
      setMyTrips((res.data || []).filter(t => t.is_public));
    } catch {}
    setShareOpen(true);
  };

  const handleShare = async (ev) => {
    ev.preventDefault();
    if (!shareForm.trip_id) { addToast('Select a trip', 'error'); return; }
    setSharing(true);
    try {
      await api.post('/community', { trip_id: parseInt(shareForm.trip_id), caption: shareForm.caption });
      addToast('Trip shared to community!', 'success');
      setShareOpen(false); setShareForm({ trip_id: '', caption: '' }); await loadPosts();
    } catch (err) {
      const msg = getApiError(err);
      addToast(err.response?.status === 409 ? 'Already shared this trip' : msg, 'error');
    } finally { setSharing(false); }
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Community</h1>
          <div className="page-subtitle">See what other travelers are up to</div>
        </div>
        <button className="btn btn-primary" onClick={openShare}><Plus size={16}/> Share Trip</button>
      </div>

      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton skeleton-card" />)}
        </div>
      ) : posts.length === 0 ? (
        <div className="empty-state"><div className="empty-icon"><Users size={28}/></div><div className="empty-title">No posts yet</div><div className="empty-desc">Be the first to share a trip!</div></div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {posts.map(post => {
            const avatarUrl = post.photo_url
              ? (post.photo_url.startsWith('http') ? post.photo_url : `${baseUrl}${post.photo_url}`)
              : null;
            const tripUrl = post.trip_id ? `/trips/${post.trip_id}` : null;
            return (
              <div
                key={post.id}
                className="community-card"
                style={{ cursor: tripUrl ? 'pointer' : 'default' }}
                onClick={() => tripUrl && navigate(tripUrl)}
              >
                {/* Banner image */}
                <div style={{ height:170, overflow:'hidden', background:'linear-gradient(135deg,#d8e2ff,#e6e7f2)', position:'relative' }}>
                  <img
                    src={getCityImage(post.title)}
                    alt={post.title}
                    style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
                    onError={(e) => { e.currentTarget.style.display='none'; }}
                  />
                  <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(25,27,35,0.45) 0%, transparent 60%)' }} />
                </div>

                {/* Body */}
                <div style={{ padding:'16px 18px' }}>
                  {/* User row */}
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                    <div style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,#0058be,#2170e4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'#fff', overflow:'hidden', flexShrink:0 }}>
                      {avatarUrl ? <img src={avatarUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : getInitials(post.first_name, post.last_name)}
                    </div>
                    <div>
                      <div style={{ fontSize:14, fontWeight:700, color:'#191b23' }}>{post.first_name} {post.last_name}</div>
                      <div style={{ fontSize:12, color:'#727785' }}>{formatDate(post.created_at)}</div>
                    </div>
                  </div>

                  {/* Trip title */}
                  <div style={{ fontSize:15, fontWeight:700, color:'#0058be', marginBottom:post.caption ? 6 : 0 }}>✈ {post.title}</div>
                  {post.caption && <div style={{ fontSize:13, color:'#424754', lineHeight:1.5, marginBottom:8 }}>{post.caption}</div>}

                  {/* Badges */}
                  {(post.stop_count > 0 || post.expense_count > 0) && (
                    <div style={{ display:'flex', gap:8, marginTop:10 }}>
                      {post.stop_count > 0 && <span className="badge badge-blue">{post.stop_count} stops</span>}
                      {post.expense_count > 0 && <span className="badge badge-gray">{post.expense_count} expenses</span>}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {meta.page < meta.pages && (
            <button className="btn btn-secondary btn-full" onClick={() => { setLoadingMore(true); loadPosts(meta.page + 1, true); }} disabled={loadingMore}>
              {loadingMore ? <Spinner size={16}/> : <><ChevronDown size={16}/> Load More</>}
            </button>
          )}
        </div>
      )}

      {/* Share Modal */}
      <Modal isOpen={shareOpen} onClose={() => setShareOpen(false)} title="Share Trip" size="sm">
        {myTrips.length === 0 ? (
          <div>
            <p style={{ color:'var(--text-secondary)', marginBottom:16 }}>No public trips found. Make a trip public first (Edit trip → toggle Public).</p>
            <button className="btn btn-primary btn-sm" onClick={() => { setShareOpen(false); navigate('/trips'); }}>Go to My Trips</button>
          </div>
        ) : (
          <form onSubmit={handleShare} noValidate>
            <div className="form-group">
              <label className="form-label">Select Trip</label>
              <select className="form-select" value={shareForm.trip_id} onChange={e => setShareForm(f => ({ ...f, trip_id: e.target.value }))}>
                <option value="">Choose a trip…</option>
                {myTrips.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Caption (optional)</label>
              <textarea className="form-textarea" rows={3} maxLength={500} value={shareForm.caption} onChange={e => setShareForm(f => ({ ...f, caption: e.target.value }))} placeholder="Tell everyone about this trip…" />
              <span style={{ fontSize:11, color:'var(--text-muted)' }}>{shareForm.caption.length}/500</span>
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShareOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={sharing}>{sharing ? <Spinner size={16} color="#fff"/> : 'Share'}</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
