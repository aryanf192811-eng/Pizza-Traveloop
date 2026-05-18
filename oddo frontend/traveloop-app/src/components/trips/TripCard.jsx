import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar } from 'lucide-react';
import { formatDate, getStatusColor } from '../../utils/formatters';
import BudgetBar from './BudgetBar';
import { getCityImage } from '../../utils/cityImages';

const STATUS_DOT_COLOR = {
  upcoming:  'var(--cl-primary, #0058be)',
  ongoing:   '#10b981',
  completed: 'var(--cl-outline, #727785)',
};

export default function TripCard({ trip }) {
  const navigate = useNavigate();
  const baseUrl = (import.meta.env.VITE_API_URL || '').replace('/api', '');
  const dotColor = STATUS_DOT_COLOR[trip.status] || 'var(--cl-outline)';

  return (
    <div className="trip-card" onClick={() => navigate(`/trips/${trip.id}`)}>
      {/* Cover image */}
      <div
        className="trip-card-cover"
        style={{
          backgroundImage: `url(${trip.cover_photo ? `${baseUrl}${trip.cover_photo}` : getCityImage(trip.title)})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Status pill badge — Stitch style */}
        <div
          style={{
            position: 'absolute',
            top: 12, right: 12,
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 12px',
            borderRadius: 9999,
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(8px)',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--cl-on-surface)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            letterSpacing: '0.02em',
            zIndex: 2,
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
          {trip.status?.charAt(0).toUpperCase() + trip.status?.slice(1)}
        </div>
      </div>

      {/* Card body */}
      <div className="trip-card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 className="trip-card-title">{trip.title}</h3>
        <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--cl-on-surface-variant)', marginBottom: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', flex: 1 }}>
            <Calendar size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
            <span>{formatDate(trip.start_date)} - {formatDate(trip.end_date)}</span>
          </div>
          {trip.stop_count != null && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
              <MapPin size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span>{trip.stop_count}</span>
                <span>Stops</span>
              </div>
            </div>
          )}
        </div>
        <div style={{ marginTop: 'auto' }}>
          <BudgetBar budget={trip.total_budget} spent={trip.total_spent} />
        </div>
      </div>
    </div>
  );
}
