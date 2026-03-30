import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { login } from './api';
import axios from 'axios';

import AdminDashboard from './AdminDashboard';
import RequesterDashboard from './RequesterDashboard';
import SupportAgentDashboard from './SupportAgentDashboard';
import PublicDashboard from './PublicDashboard';
import AdminSummaryDashboard from './AdminSummaryDashboard';
import LanguageSwitcher from './LanguageSwitcher';
import { LanguageProvider, useLanguage } from './LanguageContext';

const API = 'http://localhost:5035';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('userToken');
  if (!token) return <Navigate to="/login" replace />;
  try {
    const d = jwtDecode(token);
    if (d["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] !== "Admin")
      return <Navigate to="/login" replace />;
    return children;
  } catch { localStorage.removeItem('userToken'); return <Navigate to="/login" replace />; }
};

const RequesterRoute = ({ children }) => {
  const token = localStorage.getItem('userToken');
  if (!token) return <Navigate to="/login" replace />;
  try {
    const d = jwtDecode(token);
    if (d.exp < Date.now()/1000) { localStorage.removeItem('userToken'); return <Navigate to="/login" replace />; }
    const role = d["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
    if (role === "Admin") return <Navigate to="/admin" replace />;
    if (role === "SupportAgent") return <Navigate to="/agent" replace />;
    return children;
  } catch { localStorage.removeItem('userToken'); return <Navigate to="/login" replace />; }
};

const SupportAgentRoute = ({ children }) => {
  const token = localStorage.getItem('userToken');
  if (!token) return <Navigate to="/login" replace />;
  try {
    const d = jwtDecode(token);
    if (d.exp < Date.now()/1000) { localStorage.removeItem('userToken'); return <Navigate to="/login" replace />; }
    if (d["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] !== "SupportAgent")
      return <Navigate to="/login" replace />;
    return children;
  } catch { localStorage.removeItem('userToken'); return <Navigate to="/login" replace />; }
};

function LoginScreen() {
  const { t } = useLanguage();
  const [mode, setMode]         = useState('login');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [surname, setSurname]   = useState('');
  const [message, setMessage]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  const resetForm = () => { setEmail(''); setPassword(''); setName(''); setSurname(''); setMessage(null); };

  const switchMode = (m) => { setMode(m); resetForm(); };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await login(email, password);
      const token = localStorage.getItem('userToken');
      if (token) {
        const d = jwtDecode(token);
        const role = d["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
        setMessage({ text: t('login.success_msg'), type: 'success' });
        setTimeout(() => {
          if (role === "Admin") navigate('/admin');
          else if (role === "SupportAgent") navigate('/agent');
          else navigate('/requester');
        }, 800);
      }
    } catch(err) {
      setMessage({ text: t('login.error_msg'), type: 'error' });
    } finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await axios.post(`${API}/api/auth/register`, { name, surname, email, password });
      setMessage({ text: t('login.reg_success'), type: 'success' });
      setTimeout(() => switchMode('login'), 1500);
    } catch(err) {
      const msg = err.response?.data?.message || err.response?.data || t('login.reg_error');
      setMessage({ text: '❌ ' + msg, type: 'error' });
    } finally { setLoading(false); }
  };

  const inp = (focused) => ({
    width: '100%', padding: '12px 16px', borderRadius: '10px',
    border: `1.5px solid ${focused ? '#6366f1' : '#e2e8f0'}`,
    fontSize: '14px', color: '#1e293b', outline: 'none',
    backgroundColor: '#f8fafc', boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxShadow: focused ? '0 0 0 3px rgba(99,102,241,0.1)' : 'none',
    fontFamily: 'inherit',
  });

  const [focused, setFocused] = useState('');

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', fontFamily: "'Segoe UI', system-ui, sans-serif",
      backgroundColor: '#0f172a', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '600px', height: '600px',
          borderRadius: '50%', backgroundColor: 'rgba(99,102,241,0.08)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '700px', height: '700px',
          borderRadius: '50%', backgroundColor: 'rgba(16,185,129,0.06)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          width: '400px', height: '400px', borderRadius: '50%',
          backgroundColor: 'rgba(99,102,241,0.04)', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage:
          'linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px' }} />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '60px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '480px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '56px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px',
              backgroundColor: '#6366f1', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '20px' }}>🎫</div>
            <span style={{ fontSize: '18px', fontWeight: '800', color: '#f8fafc', letterSpacing: '-0.3px' }}>{t('common.title')}</span>
          </div>

          <h1 style={{ fontSize: '42px', fontWeight: '800', color: '#f8fafc',
            lineHeight: '1.15', marginBottom: '20px', letterSpacing: '-1px' }}>
            {t('login.hero_title')}<br />
            <span style={{ color: '#6366f1' }}>{t('login.hero_sub_color')}</span>
          </h1>
          <p style={{ fontSize: '16px', color: '#64748b', lineHeight: '1.7', marginBottom: '48px' }}>
            {t('login.hero_description')}
          </p>

          {t('login.features').map(f => (
            <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px',
                backgroundColor: 'rgba(99,102,241,0.15)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>
                {f.icon}
              </div>
              <span style={{ fontSize: '14px', color: '#94a3b8' }}>{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ width: '480px', flexShrink: 0, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '40px', position: 'relative', zIndex: 1 }}>
        <div style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.03)',
          borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)',
          padding: '40px', backdropFilter: 'blur(20px)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>

          <div style={{ display: 'flex', backgroundColor: 'rgba(255,255,255,0.05)',
            borderRadius: '10px', padding: '4px', marginBottom: '32px' }}>
            {[{key:'login',label:t('common.login')},{key:'register',label:t('common.register')}].map(t => (
              <button key={t.key} onClick={() => switchMode(t.key)} style={{
                flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
                cursor: 'pointer', fontSize: '14px', fontWeight: '600',
                transition: 'all 0.2s ease',
                backgroundColor: mode === t.key ? '#6366f1' : 'transparent',
                color: mode === t.key ? '#fff' : '#64748b',
              }}>{t.label}</button>
            ))}
          </div>

          <div style={{ marginBottom: '28px' }}>
            <h2 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: '700', color: '#f8fafc' }}>
              {mode === 'login' ? t('login.title') : t('login.register_title')}
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: '#475569' }}>
              {mode === 'login' ? t('login.sub') : t('login.register_sub')}
            </p>
          </div>

          <form onSubmit={mode === 'login' ? handleLogin : handleRegister}>
            {mode === 'register' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600',
                    color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('common.name')}</label>
                  <input value={name} onChange={e => setName(e.target.value)} required
                    placeholder={t('common.name')} style={inp(focused==='name')}
                    onFocus={() => setFocused('name')} onBlur={() => setFocused('')} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600',
                    color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('common.surname')}</label>
                  <input value={surname} onChange={e => setSurname(e.target.value)} required
                    placeholder={t('common.surname')} style={inp(focused==='surname')}
                    onFocus={() => setFocused('surname')} onBlur={() => setFocused('')} />
                </div>
              </div>
            )}

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600',
                color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('common.email')}</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="info@servicedesk.com" style={inp(focused==='email')}
                onFocus={() => setFocused('email')} onBlur={() => setFocused('')} />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600',
                color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('common.password')}</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="••••••••" style={inp(focused==='password')}
                onFocus={() => setFocused('password')} onBlur={() => setFocused('')} />
            </div>

            {message && (
              <div style={{ marginBottom: '16px', padding: '12px 14px', borderRadius: '10px',
                fontSize: '13px', fontWeight: '600',
                backgroundColor: message.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                color: message.type === 'success' ? '#34d399' : '#f87171',
                border: `1px solid ${message.type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
              }}>
                {message.text}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '13px', borderRadius: '10px', border: 'none',
              backgroundColor: loading ? '#4338ca' : '#6366f1',
              color: '#fff', fontSize: '15px', fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: loading ? 'none' : '0 4px 20px rgba(99,102,241,0.4)',
            }}
              onMouseEnter={e => { if(!loading) e.target.style.backgroundColor='#4f46e5'; }}
              onMouseLeave={e => { if(!loading) e.target.style.backgroundColor='#6366f1'; }}
            >
              {loading ? `⏳ ${t('common.loading')}` : (mode === 'login' ? `→ ${t('common.login')}` : `→ ${t('common.register')}`)}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#475569' }}>
            {mode === 'login' ? (
              <>{t('login.forgot_password')}{' '}
                <button onClick={() => switchMode('register')} style={{ background: 'none', border: 'none',
                  color: '#818cf8', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>
                </button>
              </>
            ) : (
              <>{t('login.already_have_account')}{' '}
                <button onClick={() => switchMode('login')} style={{ background: 'none', border: 'none',
                  color: '#818cf8', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>
                  {t('common.login')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <div key={location.pathname} className="page-transition" style={{ width: '100%', height: '100%' }}>
      <Routes location={location}>
        <Route path="/" element={<PublicDashboard />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin-dashboard" element={<ProtectedRoute><AdminSummaryDashboard /></ProtectedRoute>} />
        <Route path="/requester" element={<RequesterRoute><RequesterDashboard /></RequesterRoute>} />
        <Route path="/agent" element={<SupportAgentRoute><SupportAgentDashboard /></SupportAgentRoute>} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <Router>
        <LanguageSwitcher />
        <AnimatedRoutes />
      </Router>
    </LanguageProvider>
  );
}

export default App;