import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './hooks/useToast.jsx';
import AppLayout from './components/layout/AppLayout';
import PrivateRoute from './components/layout/PrivateRoute';
import ToastContainer from './components/ui/ToastContainer';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import TripsPage from './pages/TripsPage';
import CreateTripPage from './pages/CreateTripPage';
import TripDetailPage from './pages/TripDetailPage';
import ItineraryBuilderPage from './pages/ItineraryBuilderPage';
import BudgetPage from './pages/BudgetPage';
import PackingPage from './pages/PackingPage';
import NotesPage from './pages/NotesPage';
import InvoicePage from './pages/InvoicePage';
import CommunityPage from './pages/CommunityPage';
import SearchPage from './pages/SearchPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import './styles/globals.css';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login"    element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route element={<PrivateRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/trips"     element={<TripsPage />} />
                <Route path="/trips/create" element={<CreateTripPage />} />
                <Route path="/trips/:id" element={<TripDetailPage />}>
                  <Route path="itinerary" element={<ItineraryBuilderPage />} />
                  <Route path="budget"    element={<BudgetPage />} />
                  <Route path="packing"   element={<PackingPage />} />
                  <Route path="notes"     element={<NotesPage />} />
                  <Route path="invoice"   element={<InvoicePage />} />
                </Route>
                <Route path="/explore"   element={<SearchPage />} />
                <Route path="/community" element={<CommunityPage />} />
                <Route path="/profile"   element={<ProfilePage />} />
                <Route path="/admin"     element={<AdminPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          <ToastContainer />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
