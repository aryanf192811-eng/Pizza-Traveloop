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
    <div className="flex-1 max-w-[1280px] mx-auto w-full pt-8 pb-24 px-4 md:px-6">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="font-display-lg text-[48px] leading-[1.1] tracking-[-0.02em] font-bold text-on-surface mb-2">Community</h2>
          <p className="font-body-lg text-[18px] leading-[1.6] text-on-surface-variant">Discover inspiring journeys from fellow travelers.</p>
        </div>
        <button 
          className="hidden md:flex items-center gap-2 bg-primary/10 text-primary font-label-md text-[14px] font-bold px-6 py-3 rounded-full hover:bg-primary/20 transition-all hover:scale-[1.02]"
          onClick={openShare}
        >
          <Plus size={20} /> Share Your Journey
        </button>
      </div>

      {/* Mobile Share Button */}
      <button 
        className="md:hidden w-full flex items-center justify-center gap-2 bg-primary/10 text-primary font-label-md text-[14px] font-bold px-6 py-3 rounded-full hover:bg-primary/20 transition-all mb-8"
        onClick={openShare}
      >
        <Plus size={20} /> Share Your Journey
      </button>

      {/* Feed Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-surface-container-low rounded-xl h-[400px] animate-pulse" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 bg-surface-container-lowest rounded-xl border border-surface-variant shadow-sm">
          <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
            <Users size={32} />
          </div>
          <h3 className="font-headline-md text-[24px] font-bold text-on-surface mb-2">No posts yet</h3>
          <p className="font-body-md text-[16px] text-on-surface-variant">Be the first to share a trip!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {posts.map(post => {
            const avatarUrl = post.photo_url
              ? (post.photo_url.startsWith('http') ? post.photo_url : `${baseUrl}${post.photo_url}`)
              : null;
            const tripUrl = post.trip_id ? `/trips/${post.trip_id}` : null;
            return (
              <article
                key={post.id}
                onClick={() => tripUrl && navigate(tripUrl)}
                className="bg-surface-container-lowest rounded-xl overflow-hidden border border-surface-variant shadow-[0px_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0px_20px_40px_rgba(59,130,246,0.12)] hover:-translate-y-1 transition-all duration-300 group cursor-pointer flex flex-col"
              >
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={getCityImage(post.title)}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { e.currentTarget.style.display='none'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                    <div>
                      <h3 className="font-headline-md text-[24px] font-bold text-white leading-[1.3]">{post.title}</h3>
                      {post.caption && (
                        <p className="font-body-md text-[16px] text-white/90 line-clamp-1 mt-1">{post.caption}</p>
                      )}
                    </div>
                    {(post.stop_count > 0) && (
                      <div className="flex gap-2">
                        <span className="bg-white/20 backdrop-blur-md text-white font-label-md text-[14px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">location_on</span> {post.stop_count} Stops
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-sm font-bold text-white overflow-hidden shrink-0">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        getInitials(post.first_name, post.last_name)
                      )}
                    </div>
                    <div>
                      <p className="font-label-md text-[14px] font-bold text-on-surface">{post.first_name} {post.last_name}</p>
                      <p className="text-[14px] text-on-surface-variant font-medium">{formatDate(post.created_at)}</p>
                    </div>
                    {post.expense_count > 0 && (
                      <div className="ml-auto text-primary font-label-md text-[14px] font-bold bg-primary/10 px-3 py-1 rounded-full flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">receipt_long</span> {post.expense_count}
                      </div>
                    )}
                  </div>
                  {post.caption && (
                    <p className="font-body-md text-[16px] text-on-surface-variant line-clamp-2 leading-[1.5]">{post.caption}</p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Load More */}
      {meta.page < meta.pages && !loading && (
        <div className="mt-8 flex justify-center">
          <button 
            className="bg-surface text-primary border border-primary/20 font-label-md text-[14px] font-bold px-8 py-3 rounded-full hover:bg-primary/5 transition-all hover:shadow-[0px_4px_20px_rgba(59,130,246,0.08)] flex items-center gap-2" 
            onClick={() => { setLoadingMore(true); loadPosts(meta.page + 1, true); }} 
            disabled={loadingMore}
          >
            {loadingMore ? <Spinner size={20}/> : 'Discover More'}
          </button>
        </div>
      )}

      {/* Share Modal */}
      <Modal isOpen={shareOpen} onClose={() => setShareOpen(false)} title="Share Trip" size="md">
        {myTrips.length === 0 ? (
          <div className="text-center py-6">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
              <span className="material-symbols-outlined text-3xl">public_off</span>
            </div>
            <h3 className="text-xl font-bold text-on-surface mb-2">No public trips found</h3>
            <p className="text-on-surface-variant mb-6">Make a trip public first (Edit trip → toggle Public) to share it with the community.</p>
            <button className="bg-primary text-on-primary px-6 py-2.5 rounded-xl font-bold hover:shadow-[0px_8px_16px_rgba(59,130,246,0.2)] transition-all" onClick={() => { setShareOpen(false); navigate('/trips'); }}>Go to My Trips</button>
          </div>
        ) : (
          <form onSubmit={handleShare} noValidate className="flex flex-col gap-6 mt-4">
            <div className="form-group mb-0">
              <label className="block text-[12px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Select Trip</label>
              <select className="w-full bg-surface border border-outline-variant/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all appearance-none text-[14px]" value={shareForm.trip_id} onChange={e => setShareForm(f => ({ ...f, trip_id: e.target.value }))}>
                <option value="">Choose a trip…</option>
                {myTrips.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </div>
            <div className="form-group mb-0">
              <div className="flex justify-between mb-2">
                <label className="block text-[12px] font-bold text-on-surface-variant uppercase tracking-wider">Caption (optional)</label>
                <span className="text-xs font-bold text-outline">{shareForm.caption.length}/500</span>
              </div>
              <textarea 
                className="w-full bg-surface border border-outline-variant/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none text-[14px]" 
                rows={4} 
                maxLength={500} 
                value={shareForm.caption} 
                onChange={e => setShareForm(f => ({ ...f, caption: e.target.value }))} 
                placeholder="Tell everyone about this trip…" 
              />
            </div>
            <div className="flex gap-4 justify-end pt-4 border-t border-outline-variant/20">
              <button type="button" className="px-6 py-2 rounded-xl font-bold text-[14px] text-on-surface-variant hover:bg-surface-variant transition-colors" onClick={() => setShareOpen(false)}>Cancel</button>
              <button type="submit" className="bg-primary text-on-primary px-8 py-2 rounded-xl font-bold text-[14px] flex items-center justify-center min-w-[120px] hover:shadow-[0px_8px_16px_rgba(59,130,246,0.2)] transition-all" disabled={sharing}>
                {sharing ? <Spinner size={20} color="#fff"/> : 'Share Trip'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
