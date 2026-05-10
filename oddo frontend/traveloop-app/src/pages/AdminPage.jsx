import { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import { formatCurrency, formatDate } from '../utils/formatters';
import { TRIP_STATUSES } from '../utils/validators';
import Spinner from '../components/ui/Spinner';
import { PageSpinner } from '../components/ui/Spinner';

const STATUS_COLORS = { upcoming:'#F59E0B', ongoing:'#10B981', completed:'#8B5CF6' };

export default function AdminPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('analytics');
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [userMeta, setUserMeta] = useState({ page:1, pages:1 });
  const [userSearch, setUserSearch] = useState('');
  const [adminTrips, setAdminTrips] = useState([]);
  const [tripMeta, setTripMeta] = useState({ page:1, pages:1 });
  const [tripStatus, setTripStatus] = useState('');
  const [loading, setLoading] = useState(false);

  // Hooks must all be declared before any conditional return
  useEffect(() => {
    if (activeTab === 'analytics') loadAnalytics();
    if (activeTab === 'users') loadUsers(1, userSearch);
    if (activeTab === 'trips') loadAdminTrips(1, tripStatus);
  }, [activeTab]);

  const loadAnalytics = async () => {
    setLoading(true);
    try { const { data: res } = await api.get('/admin/analytics'); setAnalytics(res.data); }
    catch { addToast('Failed to load analytics', 'error'); }
    finally { setLoading(false); }
  };

  const loadUsers = async (page=1, search='') => {
    setLoading(true);
    try {
      const { data: res } = await api.get('/admin/users', { params: { search, page, limit:20 } });
      setUsers(res.data); setUserMeta(res.meta);
    } catch { addToast('Failed to load users', 'error'); }
    finally { setLoading(false); }
  };

  const loadAdminTrips = async (page=1, status='') => {
    setLoading(true);
    try {
      const { data: res } = await api.get('/admin/trips', { params: { status: status||undefined, page, limit:20 } });
      setAdminTrips(res.data); setTripMeta(res.meta);
    } catch { addToast('Failed to load trips', 'error'); }
    finally { setLoading(false); }
  };

  const pieData = analytics?.trips_by_status?.map(r => ({ name: r.status, value: Number(r.count) })) || [];

  // Role guard after all hooks
  if (user && user.role !== 'admin') {
    return (
      <div className="empty-state">
        <div className="empty-icon" style={{ color: 'var(--red)' }}>🚫</div>
        <div className="empty-title">Access Denied</div>
        <div className="empty-desc">You need admin privileges to view this page.</div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="page-header"><h1 className="page-title">Admin Panel</h1></div>

      <div className="tabs" style={{ marginBottom:24 }}>
        {['analytics','users','trips'].map(t => (
          <button key={t} className={`tab-btn${activeTab===t?' active':''}`} onClick={() => setActiveTab(t)}>
            {t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      {/* ===== ANALYTICS ===== */}
      {activeTab === 'analytics' && (
        loading ? <PageSpinner /> : !analytics ? null : (
          <div>
            <div className="grid-4" style={{ marginBottom:28 }}>
              {[
                { label:'Total Users',     value: analytics.total_users },
                { label:'Total Trips',     value: analytics.total_trips },
                { label:'New Users (7d)',  value: analytics.new_users_7d },
                { label:'New Trips (7d)',  value: analytics.new_trips_7d },
                { label:'Community Posts', value: analytics.community_posts_count },
                { label:'Total Expenses',  value: formatCurrency(analytics.total_expenses) },
              ].map(s => (
                <div key={s.label} className="card card-p" style={{ textAlign:'center' }}>
                  <div style={{ fontSize:22, fontWeight:800, fontFamily:'JetBrains Mono' }}>{s.value}</div>
                  <div style={{ fontSize:12, color:'var(--text-secondary)', marginTop:4 }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div className="grid-2">
              <div className="card card-p">
                <h3 style={{ fontWeight:700, marginBottom:16 }}>Top Cities</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={analytics.top_cities || []}>
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" tick={{ fill:'rgba(255,255,255,0.6)', fontSize:11 }} />
                    <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fill:'rgba(255,255,255,0.6)', fontSize:11 }} />
                    <Tooltip contentStyle={{ background:'rgba(6,18,42,0.95)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8 }} />
                    <Bar dataKey="trips" fill="#2563EB" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="card card-p">
                <h3 style={{ fontWeight:700, marginBottom:16 }}>Trips by Status</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                      {pieData.map(entry => (
                        <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#64748B'} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background:'rgba(6,18,42,0.95)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8 }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )
      )}

      {/* ===== USERS ===== */}
      {activeTab === 'users' && (
        <div>
          <div style={{ display:'flex', gap:12, marginBottom:16 }}>
            <input className="form-input" style={{ maxWidth:280 }} placeholder="Search users…" value={userSearch} onChange={e => { setUserSearch(e.target.value); loadUsers(1, e.target.value); }} />
          </div>
          {loading ? <Spinner size={32}/> : (
            <div className="card table-wrap">
              <table>
                <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>City</th><th>Trips</th><th>Joined</th></tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td style={{ fontWeight:600 }}>{u.first_name} {u.last_name}</td>
                      <td>{u.email}</td>
                      <td><span className={`badge ${u.role==='admin'?'badge-red':'badge-blue'}`}>{u.role}</span></td>
                      <td>{u.city || '—'}</td>
                      <td className="mono">{u.trip_count}</td>
                      <td>{formatDate(u.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {userMeta.pages > 1 && (
            <div style={{ display:'flex', gap:8, marginTop:16 }}>
              {userMeta.page > 1 && <button className="btn btn-secondary btn-sm" onClick={() => loadUsers(userMeta.page-1, userSearch)}>Prev</button>}
              <span style={{ color:'var(--text-muted)', fontSize:13, padding:'6px 0' }}>Page {userMeta.page} of {userMeta.pages}</span>
              {userMeta.page < userMeta.pages && <button className="btn btn-secondary btn-sm" onClick={() => loadUsers(userMeta.page+1, userSearch)}>Next</button>}
            </div>
          )}
        </div>
      )}

      {/* ===== TRIPS ===== */}
      {activeTab === 'trips' && (
        <div>
          <div style={{ display:'flex', gap:12, marginBottom:16 }}>
            <select className="form-select" style={{ width:160 }} value={tripStatus} onChange={e => { setTripStatus(e.target.value); loadAdminTrips(1, e.target.value); }}>
              <option value="">All Statuses</option>
              {TRIP_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {loading ? <Spinner size={32}/> : (
            <div className="card table-wrap">
              <table>
                <thead><tr><th>Title</th><th>User</th><th>Status</th><th>Stops</th><th>Spent</th><th>Public</th><th>Date</th></tr></thead>
                <tbody>
                  {adminTrips.map(t => (
                    <tr key={t.id}>
                      <td style={{ fontWeight:600 }}>{t.title}</td>
                      <td>{t.user_name}</td>
                      <td><span className={`badge badge-${t.status==='upcoming'?'yellow':t.status==='ongoing'?'green':'gray'}`}>{t.status}</span></td>
                      <td className="mono">{t.stop_count}</td>
                      <td className="mono">{formatCurrency(t.total_spent)}</td>
                      <td>{t.is_public ? <span className="badge badge-green">Yes</span> : <span className="badge badge-gray">No</span>}</td>
                      <td>{formatDate(t.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {tripMeta.pages > 1 && (
            <div style={{ display:'flex', gap:8, marginTop:16 }}>
              {tripMeta.page > 1 && <button className="btn btn-secondary btn-sm" onClick={() => loadAdminTrips(tripMeta.page-1, tripStatus)}>Prev</button>}
              <span style={{ color:'var(--text-muted)', fontSize:13, padding:'6px 0' }}>Page {tripMeta.page} of {tripMeta.pages}</span>
              {tripMeta.page < tripMeta.pages && <button className="btn btn-secondary btn-sm" onClick={() => loadAdminTrips(tripMeta.page+1, tripStatus)}>Next</button>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
