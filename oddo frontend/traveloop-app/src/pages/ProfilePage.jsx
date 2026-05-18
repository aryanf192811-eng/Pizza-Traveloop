import { useState, useEffect, useRef } from 'react';
import { Upload, Save, User, Phone, MapPin, Key, Mail } from 'lucide-react';
import api, { getApiError } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import { getInitials } from '../utils/formatters';
import Spinner from '../components/ui/Spinner';

export default function ProfilePage() {
  const { updateUser } = useAuth();
  const { addToast } = useToast();
  const fileRef = useRef(null);
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', city: '', country: '', gemini_key: '' });
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const baseUrl = (import.meta.env.VITE_API_URL || '').replace('/api', '');

  useEffect(() => {
    api.get('/auth/me').then(({ data: res }) => {
      const u = res.data;
      setForm({ first_name: u.first_name || '', last_name: u.last_name || '', email: u.email || '', phone: u.phone || '', city: u.city || '', country: u.country || '', gemini_key: u.gemini_key || '' });
      if (u.photo_url) {
        const url = u.photo_url.startsWith('http') ? u.photo_url : `${baseUrl}${u.photo_url}`;
        setPreview(url);
      }
    }).catch(() => addToast('Failed to load profile', 'error'));
  }, []);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handlePhoto = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setPhoto(f); setPreview(URL.createObjectURL(f));
  };

  const handleSave = async (ev) => {
    ev.preventDefault(); setSaving(true);
    try {
      const fd = new FormData();
      fd.append('first_name', form.first_name);
      fd.append('last_name', form.last_name);
      fd.append('phone', form.phone);
      fd.append('city', form.city);
      fd.append('country', form.country);
      fd.append('gemini_key', form.gemini_key);
      if (photo) fd.append('photo', photo);
      const { data: res } = await api.put('/auth/profile', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const saved = res.data;
      updateUser(saved);
      if (saved.photo_url) {
        const resolved = saved.photo_url.startsWith('http') ? saved.photo_url : `${baseUrl}${saved.photo_url}`;
        setPreview(resolved);
      }
      setPhoto(null);
      addToast('Profile updated!', 'success');
    } catch (err) { addToast(getApiError(err), 'error'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      {/* Hero banner */}
      <div className="form-hero-banner" style={{ marginBottom: 28 }}>
        <div className="form-hero-icon">🧳</div>
        <div>
          <h1 className="form-hero-title">Your Profile</h1>
          <p className="form-hero-quote">"The journey of a thousand miles begins with a single step." — Lao Tzu</p>
        </div>
      </div>

      <div className="card card-p form-card">
        {/* Avatar section */}
        <div className="profile-avatar-section">
          <div className="profile-avatar-wrap" onClick={() => fileRef.current?.click()}>
            <div className="profile-avatar">
              {preview
                ? <img src={preview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span>{getInitials(form.first_name, form.last_name)}</span>
              }
            </div>
            <div className="profile-avatar-upload-btn">
              <Upload size={13} color="#fff" />
            </div>
          </div>
          <div>
            <div className="profile-avatar-name">{form.first_name} {form.last_name}</div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => fileRef.current?.click()}
              style={{ marginTop: 8 }}
            >
              <Upload size={13} /> Change Photo
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
        </div>

        <div className="form-section-divider" style={{ margin: '20px 0' }} />

        <form onSubmit={handleSave} noValidate>
          {/* Personal Info */}
          <div className="form-section-header">
            <User size={16} /> Personal Information
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input className="form-input" value={form.first_name} onChange={set('first_name')} placeholder="Jane" />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input className="form-input" value={form.last_name} onChange={set('last_name')} placeholder="Doe" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              <Mail size={14} style={{ display: 'inline', marginRight: 5 }} />
              Email address
              <span className="form-label-badge">Read-only</span>
            </label>
            <input
              className="form-input"
              value={form.email}
              readOnly
              style={{ opacity: 0.6, cursor: 'not-allowed', background: 'var(--cl-surface-variant, #e8e9f3)' }}
            />
          </div>

          <div className="form-section-divider" />

          {/* Location */}
          <div className="form-section-header">
            <MapPin size={16} /> Location
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                <Phone size={14} style={{ display: 'inline', marginRight: 5 }} />
                Phone
              </label>
              <input className="form-input" value={form.phone} onChange={set('phone')} placeholder="+91 99999 99999" />
            </div>
            <div className="form-group">
              <label className="form-label">City</label>
              <input className="form-input" value={form.city} onChange={set('city')} placeholder="Mumbai" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Country</label>
            <input className="form-input" value={form.country} onChange={set('country')} placeholder="India" />
          </div>

          <div className="form-section-divider" />

          {/* AI Settings */}
          <div className="form-section-header">
            <Key size={16} /> AI Settings
          </div>

          <div className="form-group">
            <label className="form-label">
              Gemini API Key
              <span className="form-label-hint">— powers AI packing lists</span>
            </label>
            <input
              className="form-input"
              type="password"
              value={form.gemini_key}
              onChange={set('gemini_key')}
              placeholder="AIzaSy…"
              autoComplete="off"
            />
            <div className="form-hint" style={{ marginTop: 6 }}>
              🔑 Get a free key at{' '}
              <a href="https://aistudio.google.com" target="_blank" rel="noreferrer"
                style={{ color: 'var(--cl-primary)', fontWeight: 600 }}>
                aistudio.google.com
              </a>
            </div>
          </div>

          <button
            className="btn btn-primary btn-full"
            type="submit"
            disabled={saving}
            style={{ marginTop: 20, height: 48 }}
          >
            {saving ? <Spinner size={16} color="#fff" /> : <><Save size={15} /> Save Changes</>}
          </button>
        </form>
      </div>
    </div>
  );
}
