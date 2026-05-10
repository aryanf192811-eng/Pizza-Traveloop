import { useState, useEffect, useRef } from 'react';
import { Upload, Save } from 'lucide-react';
import api, { getApiError } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import { getInitials } from '../utils/formatters';
import Spinner from '../components/ui/Spinner';

export default function ProfilePage() {
  const { updateUser } = useAuth();
  const { addToast } = useToast();
  const fileRef = useRef(null);
  const [form, setForm] = useState({ first_name:'', last_name:'', email:'', phone:'', city:'', country:'', gemini_key:'' });
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const baseUrl = (import.meta.env.VITE_API_URL || '').replace('/api', '');

  useEffect(() => {
    api.get('/auth/me').then(({ data: res }) => {
      const u = res.data;
      setForm({ first_name: u.first_name||'', last_name: u.last_name||'', email: u.email||'', phone: u.phone||'', city: u.city||'', country: u.country||'', gemini_key: u.gemini_key||'' });
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
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <div className="page-header"><h1 className="page-title">Profile</h1></div>

      <div className="card card-p">
        {/* Avatar */}
        <div style={{ display:'flex', justifyContent:'center', marginBottom:28 }}>
          <div style={{ position:'relative' }}>
            <div
              onClick={() => fileRef.current?.click()}
              style={{ width:104, height:104, borderRadius:'50%', background:'linear-gradient(135deg,#0058be,#6d28d9)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:30, fontWeight:700, cursor:'pointer', overflow:'hidden', border:'4px solid #fff', boxShadow:'0 4px 20px rgba(0,88,190,0.25)', color:'#fff' }}
            >
              {preview ? <img src={preview} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : getInitials(form.first_name, form.last_name)}
            </div>
            <div
              style={{ position:'absolute', bottom:3, right:3, background:'#0058be', borderRadius:'50%', width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', boxShadow:'0 2px 8px rgba(0,88,190,0.4)', border:'2px solid #fff' }}
              onClick={() => fileRef.current?.click()}
            >
              <Upload size={12} color="#fff"/>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handlePhoto}/>
          </div>
        </div>

        <form onSubmit={handleSave} noValidate>
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
            <label className="form-label">Email (read-only)</label>
            <input className="form-input" value={form.email} readOnly style={{ opacity:0.6, cursor:'not-allowed' }} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Phone</label>
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

          <div className="form-group">
            <label className="form-label">
              Gemini API Key
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>for AI packing lists</span>
            </label>
            <input
              className="form-input"
              type="password"
              value={form.gemini_key}
              onChange={set('gemini_key')}
              placeholder="AIzaSy…"
              autoComplete="off"
            />
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
              Get a free key at{' '}
              <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" style={{ color: 'var(--blue)' }}>aistudio.google.com</a>
            </span>
          </div>

          <button className="btn btn-primary btn-full" type="submit" disabled={saving} style={{ marginTop:12 }}>
            {saving ? <Spinner size={16} color="#fff"/> : <><Save size={15}/> Save Changes</>}
          </button>
        </form>
      </div>
    </div>
  );
}
