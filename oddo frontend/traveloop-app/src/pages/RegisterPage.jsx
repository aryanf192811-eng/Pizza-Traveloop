import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Plane } from 'lucide-react';
import api, { getApiError } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import { validateEmail, validatePassword, validateRequired } from '../utils/validators';
import Spinner from '../components/ui/Spinner';

export default function RegisterPage() {
  const { login, user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '', confirm: '', phone: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => { if (user) navigate('/dashboard', { replace: true }); }, [user]);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!validateRequired(form.first_name)) e.first_name = 'Required';
    if (!validateRequired(form.last_name))  e.last_name  = 'Required';
    if (!validateEmail(form.email))         e.email      = 'Enter a valid email';
    if (!validatePassword(form.password))   e.password   = 'Min 8 characters';
    if (form.password !== form.confirm)     e.confirm    = 'Passwords do not match';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      // Only send the fields the backend /api/auth/register validates
      const { data: res } = await api.post('/auth/register', {
        first_name: form.first_name,
        last_name:  form.last_name,
        email:      form.email,
        password:   form.password,
        phone:      form.phone || undefined,
      });
      login(res.data.token, res.data.user);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (err.response?.status === 409) {
        setErrors(e => ({ ...e, email: 'Email already registered' }));
      } else {
        addToast(getApiError(err), 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 480 }}>
        <div className="auth-logo">
          <div className="sidebar-logo-icon"><Plane size={18} color="#fff" /></div>
          <span style={{ fontSize: 22, fontWeight: 800 }}>Traveloop</span>
        </div>
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Start planning your next adventure</p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">First Name *</label>
              <input className="form-input" value={form.first_name} onChange={set('first_name')} placeholder="Jane" />
              {errors.first_name && <span className="form-error">{errors.first_name}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Last Name *</label>
              <input className="form-input" value={form.last_name} onChange={set('last_name')} placeholder="Doe" />
              {errors.last_name && <span className="form-error">{errors.last_name}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email *</label>
            <input className="form-input" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Password *</label>
              <div className="input-wrapper">
                <input className="form-input" type={showPw ? 'text' : 'password'} value={form.password} onChange={set('password')} placeholder="Min 8 chars" />
                <button type="button" className="input-icon-right" onClick={() => setShowPw(v => !v)}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <span className="form-error">{errors.password}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password *</label>
              <input className="form-input" type="password" value={form.confirm} onChange={set('confirm')} placeholder="Repeat password" />
              {errors.confirm && <span className="form-error">{errors.confirm}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Phone <span style={{ fontSize: 12, opacity: 0.6 }}>(optional)</span></label>
            <input className="form-input" value={form.phone} onChange={set('phone')} placeholder="+91 9999 999999" />
          </div>

          <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? <><Spinner size={18} color="#fff" /> Creating account…</> : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  );
}
