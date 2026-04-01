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

const API = import.meta.env.VITE_API_URL;

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
    if (d.exp < Date.now() / 1000) { localStorage.removeItem('userToken'); return <Navigate to="/login" replace />; }
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
    if (d.exp < Date.now() / 1000) { localStorage.removeItem('userToken'); return <Navigate to="/login" replace />; }
    if (d["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] !== "SupportAgent")
      return <Navigate to="/login" replace />;
    return children;
  } catch { localStorage.removeItem('userToken'); return <Navigate to="/login" replace />; }
};

function LoginScreen() {
  const { t } = useLanguage();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
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
    } catch (err) {
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
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || t('login.reg_error');
      setMessage({ text: msg, type: 'error' });
    } finally { setLoading(false); }
  };

  const [focused, setFocused] = useState('');

  return (
    <div className="h-screen bg-[#0f172a] flex flex-col lg:flex-row relative overflow-hidden">
      {/* Arka plan efektleri */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -left-1/4 w-[600px] h-[600px] rounded-full bg-[#6366f1]/10 blur-[80px]" />
        <div className="absolute -bottom-1/4 -right-1/4 w-[700px] h-[700px] rounded-full bg-emerald-500/10 blur-[80px]" />
      </div>

      {/* HERO */}
      <div className="flex-1 flex items-center justify-center lg:justify-start px-8 py-8 lg:py-0 lg:px-16 relative z-10">
        <div className="max-w-md w-full">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-9 h-9 bg-[#6366f1] rounded-2xl flex items-center justify-center text-2xl text-white">
              <i className="fa-solid fa-ticket-simple"></i>
            </div>
            <span className="text-3xl font-semibold text-white tracking-tight">{t('common.title')}</span>
          </div>

          <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
            {t('login.hero_title')}<br />
            <span className="text-[#6366f1]">{t('login.hero_sub_color')}</span>
          </h1>
          <p className="text-base lg:text-lg text-slate-400 mb-8">
            {t('login.hero_description')}
          </p>

          <div className="space-y-5">
            {t('login.features').map(f => (
              <div key={f.text} className="flex items-center gap-4">
                <div className="w-8 h-8 bg-[#6366f1]/15 rounded-2xl flex items-center justify-center text-[#6366f1] flex-shrink-0 text-lg">
                  <i className={f.icon}></i>
                </div>
                <span className="text-slate-300 text-[15px]">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FORM - Kompakt */}
      <div className="lg:w-[400px] bg-white/10 backdrop-blur-2xl border border-white/10 rounded-3xl m-4 lg:m-8 p-6 lg:p-8 flex items-center relative z-10">
        <div className="w-full">
          <div className="flex bg-white/10 rounded-2xl p-1 mb-8">
            {[{ key: 'login', label: t('common.login') }, { key: 'register', label: t('common.register') }].map(tab => (
              <button
                key={tab.key}
                onClick={() => switchMode(tab.key)}
                className={`flex-1 py-3 rounded-xl font-semibold transition-all ${mode === tab.key ? 'bg-[#6366f1] text-white shadow-lg' : 'text-slate-300 hover:text-white'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">
            {mode === 'login' ? t('login.title') : t('login.register_title')}
          </h2>
          <p className="text-slate-400 text-sm mb-8">
            {mode === 'login' ? t('login.sub') : t('login.register_sub')}
          </p>

          <form onSubmit={mode === 'login' ? handleLogin : handleRegister}>
            {mode === 'register' && (
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-widest">{t('common.name')}</label>
                  <input value={name} onChange={e => setName(e.target.value)} required placeholder={t('common.name')}
                    className={`w-full px-5 py-3.5 rounded-2xl bg-white/10 border text-white placeholder:text-slate-400 focus:outline-none transition-all ${focused === 'name' ? 'border-[#6366f1]' : 'border-white/20'}`}
                    onFocus={() => setFocused('name')} onBlur={() => setFocused('')} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-widest">{t('common.surname')}</label>
                  <input value={surname} onChange={e => setSurname(e.target.value)} required placeholder={t('common.surname')}
                    className={`w-full px-5 py-3.5 rounded-2xl bg-white/10 border text-white placeholder:text-slate-400 focus:outline-none transition-all ${focused === 'surname' ? 'border-[#6366f1]' : 'border-white/20'}`}
                    onFocus={() => setFocused('surname')} onBlur={() => setFocused('')} />
                </div>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-widest">{t('common.email')}</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="info@servicedesk.com"
                className={`w-full px-5 py-3.5 rounded-2xl bg-white/10 border text-white placeholder:text-slate-400 focus:outline-none transition-all ${focused === 'email' ? 'border-[#6366f1]' : 'border-white/20'}`}
                onFocus={() => setFocused('email')} onBlur={() => setFocused('')} />
            </div>

            <div className="mb-8">
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-widest">{t('common.password')}</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
                className={`w-full px-5 py-3.5 rounded-2xl bg-white/10 border text-white placeholder:text-slate-400 focus:outline-none transition-all ${focused === 'password' ? 'border-[#6366f1]' : 'border-white/20'}`}
                onFocus={() => setFocused('password')} onBlur={() => setFocused('')} />
            </div>

            {message && (
              <div className={`mb-6 px-4 py-3 rounded-2xl text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                <i className={`fa-solid ${message.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}`}></i>
                {message.text}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3.5 bg-[#6366f1] hover:bg-[#4f46e5] disabled:bg-[#4338ca] text-white font-bold text-base rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-[#6366f1]/40">
              {loading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className={`fa-solid ${mode === 'login' ? 'fa-right-to-bracket' : 'fa-user-plus'}`}></i>}
              {mode === 'login' ? t('common.login') : t('common.register')}
            </button>
          </form>
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