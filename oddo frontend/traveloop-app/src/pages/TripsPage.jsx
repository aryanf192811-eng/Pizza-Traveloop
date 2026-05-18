import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Map } from 'lucide-react';
import api from '../api/axios';
import { useToast } from '../hooks/useToast';
import { TRIP_STATUSES, SORT_OPTIONS } from '../utils/validators';
import TripCard from '../components/trips/TripCard';

function SkeletonCard() {
  return <div className="skeleton skeleton-card" />;
}

export default function TripsPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeStatus, setActiveStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('created_at');
  const debounceRef = useRef(null);

  const load = async (status, q, s) => {
    setLoading(true); setError('');
    try {
      const { data: res } = await api.get('/trips', {
        params: { status: status !== 'all' ? status : undefined, search: q || undefined, sort: s }
      });
      setTrips(res.data);
    } catch {
      setError('Failed to load trips. Try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(activeStatus, search, sort); }, [activeStatus, sort]);

  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(activeStatus, val, sort), 400);
  };

  return (
    <div className="w-full max-w-[1280px] mx-auto pb-12 pt-4 px-4 md:px-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="font-headline-lg text-[32px] font-bold text-on-surface">My Trips</h1>
          <p className="font-body-md text-[16px] text-on-surface-variant mt-2">Manage and view all your planned adventures.</p>
        </div>
        <button className="bg-primary text-on-primary font-label-md text-[14px] px-6 py-3 rounded-full flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform duration-300 shadow-[0px_4px_20px_rgba(59,130,246,0.2)] whitespace-nowrap w-full md:w-auto" onClick={() => navigate('/trips/create')}>
          <Plus size={18} /> Plan New Trip
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-surface-container-lowest/80 backdrop-blur-xl rounded-xl p-2 mb-8 flex flex-col lg:flex-row justify-between items-center gap-4 shadow-[0px_4px_20px_rgba(59,130,246,0.04)] border border-outline-variant/30">
        <div className="flex gap-1 bg-surface-variant/30 p-1 rounded-lg w-full lg:w-auto overflow-x-auto hide-scrollbar">
          {['all', ...TRIP_STATUSES].map(s => {
            const isActive = activeStatus === s;
            return (
              <button
                key={s}
                onClick={() => setActiveStatus(s)}
                className={`px-4 py-2 rounded-md font-label-md text-[14px] transition-colors whitespace-nowrap ${isActive ? 'bg-surface-container-lowest text-primary shadow-sm font-bold' : 'text-on-surface-variant hover:bg-surface-variant/50'}`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)} {s === 'all' && 'Trips'}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline"><Search size={18} /></span>
            <input
              className="w-full bg-[#EEF6FF] focus:bg-surface-container-lowest border-transparent focus:border-primary text-on-surface font-body-md text-[14px] rounded-lg pl-10 pr-4 py-2 transition-colors placeholder:text-outline focus:ring-1 focus:outline-none"
              placeholder="Search trips..."
              value={search}
              onChange={e => handleSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* States */}
      {error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-error font-headline-md mb-4">{error}</div>
          <button className="bg-surface-variant text-on-surface-variant px-6 py-2 rounded-full hover:bg-outline-variant transition-colors" onClick={() => load(activeStatus, search, sort)}>Retry</button>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      ) : trips.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-48 h-48 mb-6 rounded-full bg-[#EEF6FF] flex items-center justify-center">
            <Map size={64} className="text-primary-fixed-dim" />
          </div>
          <h2 className="font-headline-lg text-[32px] font-bold text-on-surface mb-2">No trips yet</h2>
          <p className="font-body-lg text-[18px] text-on-surface-variant mb-6 max-w-md">Your itinerary is a blank canvas. Start planning your next great adventure.</p>
          <button className="bg-primary text-on-primary font-label-md text-[14px] px-8 py-3 rounded-full flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform duration-300 shadow-[0px_4px_20px_rgba(59,130,246,0.2)]" onClick={() => navigate('/trips/create')}>
            Start Planning
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map(t => <TripCard key={t.id} trip={t} />)}
        </div>
      )}
    </div>
  );
}
