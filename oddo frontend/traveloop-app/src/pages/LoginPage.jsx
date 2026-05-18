import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Plane, Compass, Map, Globe } from 'lucide-react';
import api, { getApiError } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import { validateEmail, validatePassword } from '../utils/validators';
import Spinner from '../components/ui/Spinner';

const QUOTES = [
  { text: "The world is a book, and those who do not travel read only one page.", author: "Saint Augustine" },
  { text: "Life is either a daring adventure or nothing at all.", author: "Helen Keller" },
  { text: "Travel is the only thing you buy that makes you richer.", author: "Anonymous" },
  { text: "Not all those who wander are lost.", author: "J.R.R. Tolkien" },
];
const QUOTE = QUOTES[Math.floor(Math.random() * QUOTES.length)];

export default function LoginPage() {
  const { login, user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => { if (user) navigate('/dashboard', { replace: true }); }, [user]);

  const validate = () => {
    const e = {};
    if (!validateEmail(email)) e.email = 'Enter a valid email';
    if (!validatePassword(password)) e.password = 'Password must be at least 8 characters';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const { data: res } = await api.post('/auth/login', { email, password });
      login(res.data.token, res.data.user);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      addToast(getApiError(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" style={{ padding: 0, alignItems: 'stretch' }}>
      {/* Left panel — branding & quote */}
      <div className="auth-left-panel">
        <div className="auth-left-inner">
          <div className="auth-brand">
            <div className="sidebar-logo-icon" style={{ width: 48, height: 48 }}>
              <Plane size={22} color="#fff" />
            </div>
            <span style={{ fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>Traveloop</span>
          </div>

          <div className="auth-left-quote">
            <div className="auth-quote-mark">"</div>
            <p className="auth-quote-text">{QUOTE.text}</p>
            <p className="auth-quote-author">— {QUOTE.author}</p>
          </div>

          <div className="auth-left-features">
            {[
              { icon: <Map size={18} />, label: 'Plan itineraries in minutes' },
              { icon: <Compass size={18} />, label: 'Explore top destinations' },
              { icon: <Globe size={18} />, label: 'Share trips with the world' },
            ].map(f => (
              <div key={f.label} className="auth-feature-item">
                <div className="auth-feature-icon">{f.icon}</div>
                <span>{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="auth-right-panel">
        <div className="auth-form-wrap">
          {/* Mobile brand */}
          <div className="auth-logo auth-logo-mobile">
            <div className="sidebar-logo-icon"><Plane size={18} color="#fff" /></div>
            <span style={{ fontSize: 22, fontWeight: 800 }}>Traveloop</span>
          </div>

          <h1 className="auth-title">Welcome back 👋</h1>
          <p className="auth-subtitle">Sign in to continue planning your adventures</p>

          <form onSubmit={handleSubmit} noValidate style={{ marginTop: 28 }}>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input
                id="login-email"
                className={`form-input${errors.email ? ' input-error' : ''}`}
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <label className="form-label" style={{ margin: 0 }}>Password</label>
              </div>
              <div className="input-wrapper">
                <input
                  id="login-password"
                  className={`form-input${errors.password ? ' input-error' : ''}`}
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  autoComplete="current-password"
                />
                <button type="button" className="input-icon-right" onClick={() => setShowPw(v => !v)}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <span className="form-error">{errors.password}</span>}
            </div>

            <button
              id="login-submit"
              className="btn btn-primary btn-full btn-lg"
              type="submit"
              disabled={loading}
              style={{ marginTop: 20, height: 48 }}
            >
              {loading ? <><Spinner size={18} color="#fff" /> Signing in…</> : 'Sign In'}
            </button>
          </form>

          <div className="auth-divider"><span>Don't have an account?</span></div>

          <Link to="/register" className="btn btn-secondary btn-full" style={{ textAlign: 'center' }}>
            Create a free account
          </Link>
        </div>
      </div>
    </div>
  );
}
