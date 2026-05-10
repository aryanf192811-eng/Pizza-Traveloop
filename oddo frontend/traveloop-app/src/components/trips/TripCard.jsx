import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar } from 'lucide-react';
import { formatDate, getStatusColor } from '../../utils/formatters';
import BudgetBar from './BudgetBar';
import { getCityImage } from '../../utils/cityImages';

export default function TripCard({ trip }) {
  const navigate = useNavigate();
  const baseUrl = (import.meta.env.VITE_API_URL || '').replace('/api', '');

  return (
    <div className="trip-card" onClick={() => navigate(`/trips/${trip.id}`)}>
      <div
        className="trip-card-cover"
        style={{
          backgroundImage: `url(${trip.cover_photo ? `${baseUrl}${trip.cover_photo}` : getCityImage(trip.title)})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="trip-card-body">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <h3 className="trip-card-title">{trip.title}</h3>
          <span className={`badge ${getStatusColor(trip.status)}`}>{trip.status}</span>
        </div>
        <div className="trip-card-meta">
          <Calendar size={12} />
          {formatDate(trip.start_date)} – {formatDate(trip.end_date)}
          {trip.stop_count != null && (
            <><MapPin size={12} />{trip.stop_count} stop{trip.stop_count !== 1 ? 's' : ''}</>
          )}
        </div>
        <BudgetBar budget={trip.total_budget} spent={trip.total_spent} />
      </div>
    </div>
  );
}
