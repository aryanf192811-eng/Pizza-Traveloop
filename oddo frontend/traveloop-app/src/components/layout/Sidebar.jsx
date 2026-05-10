import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Map, Compass, Users, User, Shield, ChevronLeft, ChevronRight, LogOut, Plane } from 'lucide-react';
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

export default function Sidebar({ mobileOpen, onMobileClose }) {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar_collapsed') === 'true');
  const baseUrl = (import.meta.env.VITE_API_URL || '').replace('/api', '');

  const toggle = () => {
    setCollapsed(v => { localStorage.setItem('sidebar_collapsed', !v); return !v; });
  };

  const links = NAV.filter(n => !n.adminOnly || user?.role === 'admin');

  return (
    <>
      {mobileOpen && <div className="sidebar-overlay" onClick={onMobileClose} />}
      <aside className={`sidebar${collapsed ? ' collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon"><Plane size={18} color="#fff" /></div>
          <span className="sidebar-logo-text">Traveloop</span>
        </div>

        <nav className="sidebar-nav">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={onMobileClose}>
              <Icon size={20} />
              <span className="nav-link-label">{label}</span>
              {collapsed && <span className="nav-tooltip">{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
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

        <button className="sidebar-collapse-btn" onClick={toggle}>
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>
    </>
  );
}
