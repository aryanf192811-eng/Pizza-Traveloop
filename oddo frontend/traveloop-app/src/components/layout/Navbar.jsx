import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, Bell, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../utils/formatters';

export default function Navbar({ collapsed, onMenuClick, title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef(null);
  const baseUrl = (import.meta.env.VITE_API_URL || '').replace('/api', '');

  useEffect(() => {
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className={`navbar${collapsed ? ' collapsed' : ''} sticky top-0 z-50 bg-surface/70 backdrop-blur-xl shadow-[0px_4px_20px_rgba(59,130,246,0.04)] border-b border-outline-variant/20 transition-all duration-300`}>
      <div className="navbar-left">
        <button className="navbar-icon-btn hamburger" onClick={onMenuClick}><Menu size={18} /></button>
        {title && <span className="navbar-title">{title}</span>}
      </div>
      <div className="navbar-right">
        <button className="navbar-icon-btn" onClick={() => navigate('/explore')} title="Search"><Search size={16} /></button>
        <button className="navbar-icon-btn" title="Notifications"><Bell size={16} /></button>
        <div style={{ position: 'relative' }} ref={dropRef}>
          <button className="avatar-btn" onClick={() => setDropOpen(v => !v)}>
            {user?.photo_url
              ? <img src={user.photo_url} alt="avatar" />
              : getInitials(user?.first_name, user?.last_name)
            }
          </button>
          {dropOpen && (
            <div className="avatar-dropdown">
              <button className="dropdown-item" onClick={() => { navigate('/profile'); setDropOpen(false); }}>
                <span>Profile</span>
              </button>
              <button className="dropdown-item danger" onClick={logout}>
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
