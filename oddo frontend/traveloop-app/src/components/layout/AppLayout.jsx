import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const TITLES = {
  '/dashboard': 'Dashboard',
  '/trips': 'My Trips',
  '/trips/create': 'New Trip',
  '/explore': 'Explore',
  '/community': 'Community',
  '/profile': 'Profile',
  '/admin': 'Admin',
};

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar_collapsed') === 'true');
  const { pathname } = useLocation();
  const title = TITLES[pathname] || '';

  return (
    <div className="app-layout">
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className={`main-content${collapsed ? ' collapsed' : ''}`}>
        <Navbar
          collapsed={collapsed}
          onMenuClick={() => setMobileOpen(true)}
          title={title}
        />
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
