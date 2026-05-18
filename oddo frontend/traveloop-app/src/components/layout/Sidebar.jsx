import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Map, Compass, Users, User, Shield, ChevronLeft, ChevronRight, LogOut, Plane, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../utils/formatters';

const NAV = [
  { to: '/dashboard', icon: Home,    label: 'Dashboard' },
  { to: '/trips',     icon: Map,     label: 'My Trips' },
  { to: '/explore',   icon: Compass, label: 'Explore' },
  { to: '/community', icon: Users,   label: 'Community' },
  { to: '/profile',   icon: User,    label: 'Profile' },
  { to: '/admin',     icon: Shield,  label: 'Admin', adminOnly: true },
];

export default function Sidebar({ mobileOpen, onMobileClose, onCollapse }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar_collapsed') === 'true');

  const toggle = () => {
    setCollapsed(v => {
      const next = !v;
      localStorage.setItem('sidebar_collapsed', next);
      onCollapse?.(next);
      return next;
    });
  };

  const links = NAV.filter(n => !n.adminOnly || user?.role === 'admin');

  return (
    <>
      {mobileOpen && <div className="sidebar-overlay" onClick={onMobileClose} />}
      <aside className={`sidebar${collapsed ? ' collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`}>

        {/* Collapse toggle button — always visible */}
        <button
          className="sidebar-collapse-btn"
          onClick={toggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Brand / Logo row */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon" style={{ fontSize: '18px' }}>T</div>
          <div style={{ overflow: 'hidden' }}>
            <span className="sidebar-logo-text">Traveloop</span>
            {!collapsed && (
              <div className="sidebar-brand-subtitle">Premium Planner</div>
            )}
          </div>
        </div>

        {/* Nav links */}
        <nav className="sidebar-nav">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              onClick={onMobileClose}
            >
              <Icon size={20} />
              <span className="nav-link-label">{label}</span>
              {collapsed && <span className="nav-tooltip">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="sidebar-bottom">
          {/* New Trip CTA */}
          {!collapsed && (
            <button
              className="sidebar-new-trip-btn"
              onClick={() => { navigate('/trips/create'); onMobileClose?.(); }}
              style={{ marginBottom: '12px' }}
            >
              <Plus size={18} />
              New Trip
            </button>
          )}

          {/* User row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 4px' }}>
            <div className="avatar-btn" style={{ flexShrink: 0 }}>
              {user?.photo_url
                ? <img src={user.photo_url} alt="avatar" />
                : getInitials(user?.first_name, user?.last_name)
              }
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.first_name} {user?.last_name}</div>
              <div className="sidebar-user-role">{user?.role}</div>
            </div>
            <button className="btn btn-ghost btn-icon" onClick={logout} title="Logout" style={{ flexShrink: 0 }}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
