import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useLanguage } from './LanguageContext';

const API = import.meta.env.VITE_API_URL;

const STATUS_MAP = { 1: 'open', 2: 'assigned', 3: 'inprogress', 4: 'resolved', 5: 'closed' };
const PRIORITY_MAP = { 1: 'verylow', 2: 'low', 3: 'normal', 4: 'high', 5: 'critical' };

const CONVERSATION_STATUS_MAP = {
  0: 'noMessages', 1: 'waitingAgent', 2: 'waitingUser',
  'NoMessages': 'noMessages', 'WaitingForAgent': 'waitingAgent', 'WaitingForRequester': 'waitingUser',
};
const CONV_STYLE_GRAY = { bg: '#f1f5f9', color: '#64748b', border: '#cbd5e1' };
const CONV_STYLE_ORANGE = { bg: '#fef3c7', color: '#92400e', border: '#fcd34d' };
const CONV_STYLE_BLUE = { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd' };
const conversationStatusStyle = (status) => ({
  0: CONV_STYLE_GRAY, 1: CONV_STYLE_ORANGE, 2: CONV_STYLE_BLUE,
  'NoMessages': CONV_STYLE_GRAY, 'WaitingForAgent': CONV_STYLE_ORANGE, 'WaitingForRequester': CONV_STYLE_BLUE,
}[status] || CONV_STYLE_GRAY);

const statusStyle = (s) => ({
  open: { bg: '#fff8e1', color: '#b45309', border: '#fde68a' },
  assigned: { bg: '#ede9fe', color: '#5b21b6', border: '#c4b5fd' },
  inprogress: { bg: '#dbeafe', color: '#1d4ed8', border: '#93c5fd' },
  resolved: { bg: '#dcfce7', color: '#166534', border: '#86efac' },
  closed: { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' },
}[s] || { bg: '#f8f9fa', color: '#6c757d', border: '#dee2e6' });

const priorityStyle = (p) => ({
  verylow: { bg: '#f0fdf4', color: '#166534', border: '#86efac' },
  low: { bg: '#dcfce7', color: '#166534', border: '#86efac' },
  normal: { bg: '#fef9c3', color: '#854d0e', border: '#fde68a' },
  high: { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
  critical: { bg: '#450a0a', color: '#fef2f2', border: '#991b1b' },
}[p] || { bg: '#f8f9fa', color: '#6c757d', border: '#dee2e6' });

const S = {
  badge: (style) => ({
    display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px',
    fontWeight: '700', backgroundColor: style.bg, color: style.color,
    border: `1px solid ${style.border}`,
  }),
  th: {
    padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700',
    color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px',
    borderBottom: '2px solid #e2e8f0', backgroundColor: '#f8fafc'
  },
  td: { padding: '13px 16px', borderBottom: '1px solid #f1f5f9', fontSize: '13px', color: '#334155', verticalAlign: 'middle' },
  btn: (variant = 'primary', sm = false) => {
    const colors = {
      primary: { bg: '#3b82f6', text: '#fff' },
      success: { bg: '#10b981', text: '#fff' },
      danger: { bg: '#ef4444', text: '#fff' },
      warning: { bg: '#f59e0b', text: '#fff' },
      ghost: { bg: '#f1f5f9', text: '#475569' },
      purple: { bg: '#8b5cf6', text: '#fff' },
    };
    const c = colors[variant] || colors.primary;
    return {
      padding: sm ? '5px 12px' : '9px 18px', borderRadius: '7px', border: 'none',
      backgroundColor: c.bg, color: c.text, fontWeight: '600',
      fontSize: sm ? '12px' : '13px', cursor: 'pointer',
      transition: 'background-color 0.15s ease',
    };
  },
  input: (hasError = false) => ({
    width: '100%', padding: '9px 12px', borderRadius: '8px',
    border: `1px solid ${hasError ? '#ef4444' : '#e2e8f0'}`,
    fontSize: '13px', color: '#334155', outline: 'none', backgroundColor: '#fff',
    boxSizing: 'border-box',
  }),
  label: {
    display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569',
    marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.4px'
  },
};

const parseErrors = (e) => {
  const data = e.response?.data;
  if (data?.errors) return data.errors;
  if (data?.message) return { general: [data.message] };
  return { general: [t('common.error')] };
};

const FieldError = ({ errors, field }) => {
  const key = Object.keys(errors).find(k => k.toLowerCase() === field.toLowerCase());
  if (!key) return null;
  return (
    <div style={{ marginTop: '4px' }}>
      {errors[key].map((msg, i) => (
        <div key={i} style={{ fontSize: '11px', color: '#ef4444', fontWeight: '600' }}>⚠ {msg}</div>
      ))}
    </div>
  );
};

const GeneralError = ({ errors }) => {
  if (!errors.general) return null;
  return (
    <div style={{
      backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px',
      padding: '10px 12px', marginBottom: '12px', fontSize: '12px', color: '#991b1b', fontWeight: '600'
    }}>
      ⚠ {errors.general[0]}
    </div>
  );
};

const Modal = ({ title, onClose, children, wide = false }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-container" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>{title}</h3>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', fontSize: '22px',
          cursor: 'pointer', color: '#94a3b8', lineHeight: 1, padding: '2px 6px'
        }}>x</button>
      </div>
      <div className="modal-body">{children}</div>
    </div>
  </div>
);

const FormGroup = ({ label, children }) => (
  <div style={{ marginBottom: '16px' }}>
    <label style={S.label}>{label}</label>
    {children}
  </div>
);

export default function AdminDashboard() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [departments, setDepts] = useState([]);
  const [agents, setAgents] = useState([]);
  const [tickets, setTickets] = useState([]);

  const [userModal, setUserModal] = useState(false);
  const [deptModal, setDeptModal] = useState(false);
  const [deptMgmt, setDeptMgmt] = useState(false);
  const [agentModal, setAgentModal] = useState(false);
  const [assignModal, setAssignModal] = useState(false);
  const [detailModal, setDetailModal] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [ticketFilter, setTF] = useState('all');

  const [userForm, setUserForm] = useState({ id: 0, name: '', surname: '', email: '', password: '', role: 3 });
  const [deptForm, setDeptForm] = useState({ id: 0, name: '', description: '' });
  const [agentForm, setAgentForm] = useState({ id: 0, name: '', surname: '', email: '', passwordHash: '', departmentId: '' });
  const [selTicket, setSelTicket] = useState(null);
  const [ticketDetail, setTD] = useState(null);
  const [assignId, setAssignId] = useState('');

  const [userErrors, setUserErrors] = useState({});
  const [deptErrors, setDeptErrors] = useState({});
  const [agentErrors, setAgentErrors] = useState({});

  const [isAssigning, setIsAssigning] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isUpdatingPriority, setIsUpdatingPriority] = useState(false);
  const [searchId, setSearchId] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const [messages, setMessages] = useState([]);
  const [isLoadingMsg, setLoadingMsg] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState('detail');

  const cfg = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('userToken')}` } });

  const fetchAll = async () => {
    try {
      const [u, d, a] = await Promise.all([
        axios.get(`${API}/api/AdminUser/all-users`, cfg()),
        axios.get(`${API}/api/AdminDepartment/all-departments`, cfg()),
        axios.get(`${API}/api/AdminServiceAgent/get-all-service-agents`, cfg()),
      ]);
      setUsers(u.data); setDepts(d.data); setAgents(a.data);
    } catch (e) { console.error(e); }
  };

  const fetchTickets = async () => {
    try {
      const r = await axios.get(`${API}/api/Ticket/get-all-tickets`, cfg());
      setTickets(r.data);
    } catch (e) { console.error(e); }
  };

  const fetchMessages = async (ticketId) => {
    setLoadingMsg(true);
    try {
      const r = await axios.get(`${API}/api/TicketConversation/${ticketId}`, cfg());
      setMessages(Array.isArray(r.data) ? r.data : []);
    } catch (e) {
      setMessages([]);
    } finally {
      setLoadingMsg(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { if (tab === 'tickets' || tab === 'settings') fetchTickets(); }, [tab]);

  const openDetail = async (id) => {
    setDetailModal(true);
    setIsFetching(true);
    setTD(null);

    setActiveModalTab('detail');
    setMessages([]);

    try {
      const r = await axios.get(`${API}/api/Ticket/get-ticket-by-id/${id}`, cfg());
      setTD(r.data);
      fetchMessages(id);
    } catch (e) {
      console.error(e);
      alert('Detay yüklenemedi');
      setDetailModal(false);
    } finally {
      setIsFetching(false);
    }
  };

  const handleCloseTicket = async (ticketId) => {
    if (!ticketId) { alert('Ticket ID alınamadı.'); return; }
    setIsClosing(true);
    try {
      await axios.patch(`${API}/api/Ticket/${ticketId}/next-status`, {}, cfg());
      const r = await axios.get(`${API}/api/Ticket/get-ticket-by-id/${ticketId}`, cfg());
      setTD(r.data);
      fetchTickets();
    } catch (e) { console.error(e); alert('Durum güncellenemedi.'); }
    finally { setIsClosing(false); }
  };

  const handleUpdatePriority = async (newPriority) => {
    if (!ticketDetail) return;
    setIsUpdatingPriority(true);
    try {
      await axios.patch(`${API}/api/Ticket/${ticketDetail.id}/update-priority`, { priority: newPriority }, cfg());
      setTD(prev => ({ ...prev, priority: newPriority }));
      fetchTickets();
    } catch (e) { console.error(e); alert('Öncelik güncellenemedi.'); }
    finally { setIsUpdatingPriority(false); }
  };

  const openAssign = (ticket) => {
    setSelTicket(ticket);
    const deptId = ticket.departmentID ?? ticket.departmentId;
    const same = agents.filter(a => String(a.departmentId) === String(deptId));
    const assignedId = ticket.assignedToId ?? ticket.assignedAgentId;
    setAssignId(assignedId ? String(assignedId) : same.length > 0 ? String(same[0].id) : '');
    setAssignModal(true);
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!assignId) return alert('Lütfen bir ajan seçin.');
    setIsAssigning(true);
    try {
      await axios.patch(`${API}/api/Ticket/assign-agent`, { ticketId: selTicket.id, agentId: parseInt(assignId) }, cfg());
      const sl = STATUS_MAP[selTicket.status] || String(selTicket.status);
      if (sl !== 'Closed') await axios.patch(`${API}/api/Ticket/${selTicket.id}/next-status`, {}, cfg());
      setAssignModal(false); setSelTicket(null);
      fetchTickets();
    } catch (e) { console.error(e); alert('Atama başarısız.'); }
    finally { setIsAssigning(false); }
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setUserErrors({});
    try {
      if (isEditing) await axios.post(`${API}/api/AdminUser/update-user`, userForm, cfg());
      else { const { id, ...d } = userForm; await axios.post(`${API}/api/AdminUser/create-user`, d, cfg()); }
      setUserModal(false); fetchAll();
    } catch (e) {
      setUserErrors(parseErrors(e));
    }
  };

  const openUserModal = (u = null) => {
    setIsEditing(!!u);
    setUserErrors({});
    setUserForm(u ? { id: u.id, name: u.name, surname: u.surname || '', email: u.email, role: u.role || 3, password: '' }
      : { id: 0, name: '', surname: '', email: '', password: '', role: 3 });
    setUserModal(true);
  };
  const toggleUser = async (id) => { try { await axios.post(`${API}/api/AdminUser/toggle-user-status/${id}`, {}, cfg()); fetchAll(); } catch (e) { } };
  const deleteUser = async (id) => {
    if (!confirm('Kullanıcı silinsin mi?')) return;
    try { await axios.delete(`${API}/api/AdminUser/delete-user/${id}`, cfg()); fetchAll(); } catch (e) { }
  };
  const searchUser = async () => {
    if (!searchId.trim()) { setIsSearching(false); fetchAll(); return; }
    try {
      const r = await axios.get(`${API}/api/AdminUser/user-by-id/${searchId.trim()}`, cfg());
      setUsers(r.data ? [r.data] : []); setIsSearching(true);
    } catch (e) { setUsers([]); setIsSearching(true); }
  };

  const handleDeptSubmit = async (e) => {
    e.preventDefault();
    setDeptErrors({});
    try {
      if (isEditing) await axios.post(`${API}/api/AdminDepartment/update-department`, deptForm, cfg());
      else await axios.post(`${API}/api/AdminDepartment/create-department`, { name: deptForm.name, description: deptForm.description }, cfg());
      setDeptModal(false); fetchAll();
    } catch (e) {
      setDeptErrors(parseErrors(e));
    }
  };

  const openDeptModal = (d = null) => {
    setIsEditing(!!d);
    setDeptErrors({});
    setDeptForm(d ? { id: d.id, name: d.name, description: d.description || '' } : { id: 0, name: '', description: '' });
    setDeptModal(true);
  };
  const deleteDept = async (id) => {
    if (!confirm('Departman silinsin mi?')) return;
    try { await axios.delete(`${API}/api/AdminDepartment/delete-department/${id}`, cfg()); fetchAll(); } catch (e) { }
  };

  const handleAgentSubmit = async (e) => {
    e.preventDefault();
    setAgentErrors({});
    try {
      const payload = { ...agentForm, departmentId: parseInt(agentForm.departmentId) };
      if (isEditing) await axios.put(`${API}/api/AdminServiceAgent/update-service-agent/${agentForm.id}`, payload, cfg());
      else await axios.post(`${API}/api/AdminServiceAgent/create-service-agent`, payload, cfg());
      setAgentModal(false); fetchAll();
    } catch (e) {
      setAgentErrors(parseErrors(e));
    }
  };

  const openAgentModal = (a = null) => {
    setIsEditing(!!a);
    setAgentErrors({});
    setAgentForm(a ? { id: a.id, name: a.name, surname: a.surname, email: a.email, passwordHash: '', departmentId: a.departmentId }
      : { id: 0, name: '', surname: '', email: '', passwordHash: '', departmentId: departments[0]?.id || '' });
    setAgentModal(true);
  };
  const deleteAgent = async (id) => {
    if (!confirm('Ajan silinsin mi?')) return;
    try { await axios.delete(`${API}/api/AdminServiceAgent/delete-service-agent/${id}`, cfg()); fetchAll(); } catch (e) { }
  };

  const handleLogout = () => { localStorage.removeItem('userToken'); navigate('/'); };

  const filtered = tickets.filter(t => {
    if (ticketFilter === 'unassigned') return !(t.assignedToId ?? t.assignedAgentId);
    if (ticketFilter === 'assigned') return !!(t.assignedToId ?? t.assignedAgentId);
    return true;
  });

  const stats = [
    { label: t('admin.stats.users'), value: users.length, icon: '', color: '#3b82f6' },
    { label: t('admin.stats.depts'), value: departments.length, icon: '', color: '#8b5cf6' },
    { label: t('admin.stats.agents'), value: agents.length, icon: '', color: '#10b981' },
    { label: t('admin.stats.openTickets'), value: tickets.filter(t => (STATUS_MAP[t.status] || t.status) === 'open').length, icon: '', color: '#f59e0b' },
  ];

  return (
    <div className="admin-layout">
      <div className="admin-sidebar">
        <div style={{ padding: '28px 20px 20px', borderBottom: '1px solid #1e293b' }}>
          <div style={{ fontSize: '10px', color: '#475569', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '6px' }}>{t('admin.sidebar.title')}</div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#f8fafc', letterSpacing: '-0.3px' }}>{t('admin.sidebar.panel')}</div>
        </div>
        <nav style={{ padding: '16px 12px', flex: 1 }}>
          {[
            { key: 'dashboard', icon: 'fa-solid fa-chart-simple', label: t('admin.sidebar.summary') },
            { key: 'users', icon: 'fa-solid fa-user', label: t('admin.sidebar.users') },
            { key: 'departments', icon: 'fa-solid fa-building', label: t('admin.sidebar.departments') },
            { key: 'tickets', icon: 'fa-solid fa-ticket-simple', label: t('admin.sidebar.tickets') },
          ].map(item => (
            <button key={item.key} onClick={() => {
              if (item.key === 'dashboard') navigate('/admin-dashboard');
              else setTab(item.key);
            }} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              marginBottom: '4px', textAlign: 'left', fontSize: '13px', fontWeight: '600',
              backgroundColor: tab === item.key ? '#3b82f6' : 'transparent',
              color: tab === item.key ? '#fff' : '#94a3b8',
              transition: 'all 0.15s ease',
            }}>
              <i className={item.icon}></i>
              {item.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: '16px 12px', borderTop: '1px solid #1e293b' }}>
          <button onClick={handleLogout} style={{
            width: '100%', padding: '10px', borderRadius: '8px', border: 'none',
            backgroundColor: '#dc2626', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
          }}>
            <i className="fa-solid fa-right-from-bracket"></i>
            {t('admin.sidebar.logout')}
          </button>
        </div>
      </div>

      <div className="admin-main">
        <div style={{
          backgroundColor: '#fff', padding: '16px 28px', borderBottom: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)', flexShrink: 0
        }}>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>
            {{
              users: t('admin.headers.userMgmt'),
              departments: t('admin.headers.deptMgmt'),
              tickets: t('admin.headers.ticketMgmt'),
            }[tab]}
          </h1>
          <div style={{ display: 'flex', gap: '12px', marginRight: '80px' }}>
            {stats.map(s => (
              <div key={s.label} style={{
                textAlign: 'center', padding: '6px 14px', borderRadius: '8px',
                backgroundColor: '#f8fafc', border: '1px solid #e2e8f0'
              }}>
                <div style={{ fontSize: '16px', fontWeight: '800', color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div key={tab} className="admin-content" style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>

          {tab === 'users' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input value={searchId} onChange={e => setSearchId(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && searchUser()}
                    placeholder={t('admin.placeholders.searchUser')} style={{ ...S.input(), width: '220px' }} />
                  <button onClick={searchUser} style={S.btn('primary', true)}>{t('admin.actions.search')}</button>
                  {isSearching && <button onClick={() => { setSearchId(''); setIsSearching(false); fetchAll(); }} style={S.btn('ghost', true)}>{t('admin.actions.clear')}</button>}
                </div>
                <button onClick={() => openUserModal()} style={S.btn('success')}>{t('admin.actions.newUser')}</button>
              </div>
              <div className="table-container" style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>{[t('common.id'), t('common.nameSurname'), t('common.email'), t('common.role'), t('common.status'), t('common.actions')].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fafafa'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <td style={S.td}><span style={{ fontWeight: '700', color: '#94a3b8' }}>#{u.id}</span></td>
                        <td style={S.td}><span style={{ fontWeight: '600', color: '#1e293b' }}>{u.name} {u.surname}</span></td>
                        <td style={S.td}><span style={{ color: '#64748b' }}>{u.email}</span></td>
                        <td style={S.td}>
                          <span style={S.badge(
                            u.role == 1 || u.role === 'Admin' ? { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' } :
                              u.role == 2 || u.role === 'SupportAgent' ? { bg: '#ede9fe', color: '#5b21b6', border: '#c4b5fd' } :
                                { bg: '#dcfce7', color: '#166534', border: '#86efac' })}>
                            {u.role == 1 || u.role === 'Admin' ? 'Admin' : u.role == 2 || u.role === 'SupportAgent' ? 'Support Agent' : 'Requester'}
                          </span>
                        </td>
                        <td style={S.td}>
                          <span style={S.badge(u.isActive ? { bg: '#dcfce7', color: '#166534', border: '#86efac' } : { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' })}>
                            {u.isActive ? t('common.status_active') : t('common.status_passive')}
                          </span>
                        </td>
                        <td style={S.td}>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => toggleUser(u.id)} style={S.btn('ghost', true)}>{t('admin.actions.status')}</button>
                            <button onClick={() => openUserModal(u)} style={S.btn('primary', true)}>{t('admin.actions.edit')}</button>
                            <button onClick={() => deleteUser(u.id)} style={S.btn('danger', true)}>{t('admin.actions.delete')}</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>{t('admin.placeholders.noUsers')}</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'departments' && (
            <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>{t('admin.placeholders.agentList')}</h2>
                  <button onClick={() => openAgentModal()} style={S.btn('success')}>{t('admin.actions.newAgent')}</button>
                </div>
                <div className="table-container" style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>{[t('common.id'), t('common.nameSurname'), t('common.email'), t('admin.placeholders.deptList'), t('common.actions')].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {agents.map(a => (
                        <tr key={a.id}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fafafa'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                          <td style={S.td}><span style={{ fontWeight: '700', color: '#94a3b8' }}>#{a.id}</span></td>
                          <td style={{ ...S.td, fontWeight: '600', color: '#1e293b' }}>{a.name} {a.surname}</td>
                          <td style={{ ...S.td, color: '#64748b' }}>{a.email}</td>
                          <td style={S.td}><span style={S.badge({ bg: '#ede9fe', color: '#5b21b6', border: '#c4b5fd' })}>{a.departmentName || `Dept #${a.departmentId}`}</span></td>
                          <td style={S.td}>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button onClick={() => openAgentModal(a)} style={S.btn('primary', true)}>{t('admin.actions.edit')}</button>
                              <button onClick={() => deleteAgent(a.id)} style={S.btn('danger', true)}>{t('admin.actions.delete')}</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {agents.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>{t('admin.placeholders.noAgents')}</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
              <div style={{ width: '190px', flexShrink: 0 }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('admin.placeholders.deptList')}</div>
                <button onClick={() => setDeptMgmt(true)} style={{
                  width: '100%', padding: '20px 16px', borderRadius: '12px', border: '2px dashed #e2e8f0',
                  backgroundColor: '#fff', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s ease'
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.backgroundColor = '#eff6ff'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.backgroundColor = '#fff'; }}>
                  <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '13px', marginBottom: '4px' }}>{departments.length} {t('admin.placeholders.deptList')}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>{t('admin.placeholders.manageDept')}</div>
                </button>
              </div>
            </div>
          )}

          {tab === 'tickets' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[
                    { key: 'all', label: `${t('admin.actions.all')} (${tickets.length})` },
                    { key: 'unassigned', label: `${t('admin.actions.unassigned')} (${tickets.filter(t => !(t.assignedToId ?? t.assignedAgentId)).length})` },
                    { key: 'assigned', label: `${t('admin.actions.assigned')} (${tickets.filter(t => !!(t.assignedToId ?? t.assignedAgentId)).length})` },
                  ].map(f => (
                    <button key={f.key} onClick={() => setTF(f.key)} style={{
                      padding: '7px 16px', borderRadius: '8px', border: '1px solid',
                      borderColor: ticketFilter === f.key ? '#3b82f6' : '#e2e8f0',
                      backgroundColor: ticketFilter === f.key ? '#3b82f6' : '#fff',
                      color: ticketFilter === f.key ? '#fff' : '#64748b',
                      fontWeight: '600', fontSize: '13px', cursor: 'pointer', transition: 'all 0.15s ease',
                    }}>{f.label}</button>
                  ))}
                </div>
                <button onClick={fetchTickets} style={S.btn('ghost')}>{t('admin.actions.refresh')}</button>
              </div>
              <div className="table-container" style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>{[t('common.id'), t('admin.placeholders.title'), t('admin.placeholders.priority'), t('admin.placeholders.status'), t('admin.placeholders.msgStatus'), t('admin.placeholders.deptList'), t('admin.placeholders.assignedAgent'), t('common.actions')].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 && <tr><td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>{t('admin.placeholders.noTickets')}</td></tr>}
                    {filtered.map(ticket => {
                      const sl = STATUS_MAP[ticket.status] || String(ticket.status);
                      const pl = PRIORITY_MAP[ticket.priority] || String(ticket.priority);
                      const ss = statusStyle(sl); const ps = priorityStyle(pl);
                      const deptId = ticket.departmentID ?? ticket.departmentId;
                      const dept = departments.find(d => String(d.id) === String(deptId));
                      const assignedId = ticket.assignedToId ?? ticket.assignedAgentId;
                      const agent = agents.find(a => String(a.id) === String(assignedId));
                      return (
                        <tr key={ticket.id} onClick={() => openDetail(ticket.id)}
                          style={{ cursor: 'pointer', transition: 'background 0.1s' }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                          <td style={S.td}><span style={{ fontWeight: '700', color: '#94a3b8' }}>#{ticket.id}</span></td>
                          <td style={{ ...S.td, maxWidth: '200px' }}>
                            <div style={{ fontWeight: '600', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ticket.title}</div>
                            {ticket.description && <div style={{ fontSize: '11px', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ticket.description}</div>}
                          </td>
                          <td style={S.td}><span style={S.badge(ps)}>{t(`priority.${pl}`)}</span></td>
                          <td style={S.td}><span style={S.badge(ss)}>{t(`status.${sl}`)}</span></td>
                          <td style={S.td}><span style={S.badge(conversationStatusStyle(ticket.conversationStatus))}>{t(`convStatus.${CONVERSATION_STATUS_MAP[ticket.conversationStatus] || 'noMessages'}`)}</span></td>
                          <td style={S.td}>{deptId ? <span style={S.badge({ bg: '#ede9fe', color: '#5b21b6', border: '#c4b5fd' })}>{dept?.name || `#${deptId}`}</span> : <span style={{ color: '#cbd5e1' }}>-</span>}</td>
                          <td style={S.td}>
                            {assignedId
                              ? <span style={{ fontWeight: '600', color: '#166534', fontSize: '13px' }}>{agent ? `${agent.name} ${agent.surname}` : `#${assignedId}`}</span>
                              : <span style={S.badge({ bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' })}>{t('admin.actions.unassigned')}</span>}
                          </td>
                          <td style={S.td}>
                            <button onClick={e => { e.stopPropagation(); openAssign(ticket); }}
                              style={S.btn(assignedId ? 'ghost' : 'warning', true)}>
                              {assignedId ? t('admin.actions.reassign') : t('admin.actions.assign')}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'settings' && (() => {
            const byDept = departments.map(d => ({
              name: d.name,
              count: tickets.filter(t => String(t.departmentID ?? t.departmentId) === String(d.id)).length,
            })).filter(d => d.count > 0);

            const byStatus = Object.entries(STATUS_MAP).map(([k, v]) => ({
              name: v,
              count: tickets.filter(t => {
                const s = t.status ?? t.Status;
                return (typeof s === 'number' ? STATUS_MAP[s] : s) === v;
              }).length,
            })).filter(s => s.count > 0);

            const statusColors = { Open: '#f59e0b', Assigned: '#8b5cf6', InProgress: '#3b82f6', Resolved: '#10b981', Closed: '#94a3b8' };

            const byAgent = agents.map(a => ({
              name: `${a.name} ${a.surname}`,
              count: tickets.filter(t => {
                const assignedId = t.assignedToId ?? t.assignedAgentId;
                const s = typeof t.status === 'number' ? STATUS_MAP[t.status] : t.status;
                return String(assignedId) === String(a.id) && (s === 'Resolved' || s === 'Closed');
              }).length,
            })).sort((a, b) => b.count - a.count);

            const Card = ({ title, children }) => (
              <div style={{
                backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0',
                padding: '20px 24px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)'
              }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', marginBottom: '20px' }}>{title}</div>
                {children}
              </div>
            );

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              </div>
            );
          })()}
        </div>
      </div>

      {detailModal && (
        <Modal title={t('admin.actions.details')} onClose={() => { setDetailModal(false); setTD(null); }} wide>
          {isFetching ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>{t('common.loading')}</div>
          ) : ticketDetail && (() => {
            const tDetail = ticketDetail;
            const tid = tDetail.id ?? tDetail.Id ?? tDetail.ID;
            const rawStatus = tDetail.status ?? tDetail.Status;
            const sl = typeof rawStatus === 'number' ? (STATUS_MAP[rawStatus] || String(rawStatus)) : String(rawStatus);
            const pl = PRIORITY_MAP[tDetail.priority ?? tDetail.Priority] || String(tDetail.priority ?? tDetail.Priority);
            const ss = statusStyle(sl);
            const ps = priorityStyle(pl);
            const deptId = tDetail.departmentID ?? tDetail.departmentId;
            const dept = departments.find(d => String(d.id) === String(deptId));
            const assignedId = tDetail.assignedToId ?? tDetail.assignedAgentId;
            const agent = agents.find(a => String(a.id) === String(assignedId));
            const isResolved = sl === 'Resolved';

            return (
              <div>
                <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', marginBottom: '20px', borderRadius: '8px' }}>
                  {[
                    { key: 'detail', label: `📋 ${t('admin.actions.details')}` },
                    { key: 'messages', label: `💬 ${t('admin.actions.messages')} ${messages.length > 0 ? `(${messages.length})` : ''}` },
                  ].map(tabBtn => (
                    <button key={tabBtn.key} onClick={() => setActiveModalTab(tabBtn.key)} style={{
                      padding: '12px 20px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                      backgroundColor: 'transparent',
                      color: activeModalTab === tabBtn.key ? '#3b82f6' : '#64748b',
                      borderBottom: activeModalTab === tabBtn.key ? '2px solid #3b82f6' : '2px solid transparent',
                    }}>{tabBtn.label}</button>
                  ))}
                </div>

                {activeModalTab === 'detail' && (
                  <div>
                    <div style={{ backgroundColor: '#f8fafc', borderRadius: '10px', padding: '16px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', marginBottom: '4px' }}>#{tid}</div>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '10px', lineHeight: '1.4' }}>{tDetail.title}</div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={S.badge(ss)}>{t(`status.${sl}`)}</span>
                        <span style={S.badge(ps)}>{t(`priority.${pl}`)}</span>
                        <select
                          value={tDetail.priority ?? tDetail.Priority ?? ''}
                          onChange={e => handleUpdatePriority(parseInt(e.target.value))}
                          disabled={isUpdatingPriority}
                          style={{
                            marginLeft: '8px', padding: '3px 8px', borderRadius: '6px',
                            border: '1px solid #e2e8f0', fontSize: '12px', color: '#334155',
                            cursor: 'pointer', backgroundColor: '#fff'
                          }}>
                          {[{ v: 1, l: t('priority.verylow') }, { v: 2, l: t('priority.low') }, { v: 3, l: t('priority.normal') }, { v: 4, l: t('priority.high') }, { v: 5, l: t('priority.critical') }]
                            .map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                        </select>
                        {isUpdatingPriority && <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '6px' }}>{t('admin.placeholders.saving')}</span>}
                      </div>
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>{t('admin.placeholders.description')}</div>
                      <div style={{
                        backgroundColor: '#f8fafc', borderRadius: '8px', padding: '12px', border: '1px solid #e2e8f0',
                        fontSize: '13px', color: tDetail.description ? '#334155' : '#cbd5e1', lineHeight: '1.6', minHeight: '50px'
                      }}>
                        {tDetail.description || t('admin.placeholders.noDescription')}
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                      <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>{t('admin.headers.dept')}</div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>{deptId ? (dept?.name || `#${deptId}`) : '-'}</div>
                      </div>
                      <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>{t('agent.detail.requester')}</div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>
                          {(tDetail.requesterId ?? tDetail.RequesterId ?? tDetail.RequestId) ? `#${tDetail.requesterId ?? tDetail.RequesterId ?? tDetail.RequestId}` : '-'}
                        </div>
                      </div>
                      <div style={{
                        backgroundColor: assignedId ? '#f0fdf4' : '#fef2f2', padding: '12px', borderRadius: '8px',
                        border: `1px solid ${assignedId ? '#bbf7d0' : '#fecaca'}`, gridColumn: '1 / -1'
                      }}>
                        <div style={{ fontSize: '10px', fontWeight: '700', color: assignedId ? '#166534' : '#991b1b', textTransform: 'uppercase', marginBottom: '4px' }}>{t('admin.headers.assignedAgent')}</div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: assignedId ? '#166534' : '#991b1b' }}>
                          {assignedId ? (agent ? `${agent.name} ${agent.surname} (${agent.email})` : `Ajan #${assignedId}`) : t('admin.actions.unassigned')}
                        </div>
                      </div>
                    </div>
                    {isResolved && (
                      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginTop: '16px' }}>
                        <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>
                          {t('admin.placeholders.status_confirm_close')}
                        </div>
                        <button
                          onClick={() => { if (tid) handleCloseTicket(tid); else alert('Ticket ID bulunamadı'); }}
                          disabled={isClosing}
                          style={{ ...S.btn('purple'), opacity: isClosing ? 0.7 : 1 }}>
                          {isClosing ? t('common.loading') : t('admin.actions.close')}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {activeModalTab === 'messages' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#fafafa', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    {isLoadingMsg ? (
                      <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>⏳ {t('common.loading')}</div>
                    ) : messages.length === 0 ? (
                      <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>
                        <div style={{ fontSize: '28px', marginBottom: '8px' }}>💬</div>
                        <div style={{ fontSize: '13px' }}>{t('agent.chat.noMessages')}</div>
                      </div>
                    ) : messages.map(msg => {
                      const isRight = msg.senderRole === 1 || msg.senderRole === 'Admin' || msg.senderRole === 2 || msg.senderRole === 'SupportAgent';
                      const roleLabel = (msg.senderRole === 1 || msg.senderRole === 'Admin') ? 'Admin' : (msg.senderRole === 2 || msg.senderRole === 'SupportAgent') ? 'Support Agent' : 'Requester';
                      return (
                        <div key={msg.id} style={{ display: 'flex', flexDirection: isRight ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: '8px' }}>
                          <div style={{
                            width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
                            backgroundColor: isRight ? '#8b5cf6' : '#3b82f6',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800', color: '#fff'
                          }}>
                            {msg.senderName?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div style={{ maxWidth: '80%' }}>
                            <div style={{ fontSize: '10px', fontWeight: '700', marginBottom: '3px', color: isRight ? '#8b5cf6' : '#3b82f6', textAlign: isRight ? 'right' : 'left' }}>
                              {msg.senderName}
                              <span style={{ color: '#94a3b8', fontWeight: '400', marginLeft: '6px' }}>· {roleLabel}</span>
                            </div>
                            <div style={{
                              padding: '10px 14px',
                              borderRadius: isRight ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                              backgroundColor: isRight ? '#8b5cf6' : '#fff',
                              color: isRight ? '#fff' : '#1e293b',
                              fontSize: '13px', lineHeight: '1.6',
                              border: isRight ? 'none' : '1px solid #e2e8f0',
                              whiteSpace: 'pre-wrap', wordBreak: 'break-word'
                            }}>
                              {msg.message}
                            </div>
                            <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '3px', textAlign: isRight ? 'right' : 'left' }}>
                              {new Date(msg.createdDate).toLocaleString(t('lang') === 'en' ? 'en-US' : 'tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}
        </Modal>
      )}

      {userModal && (
        <Modal title={isEditing ? t('admin.actions.edit') : t('admin.actions.newUser')}
          onClose={() => { setUserModal(false); setUserErrors({}); }}>
          <div>
            <GeneralError errors={userErrors} />
            <FormGroup label={t('common.name')}>
              <input style={S.input(!!userErrors['Name'])} value={userForm.name}
                onChange={e => setUserForm({ ...userForm, name: e.target.value })} />
              <FieldError errors={userErrors} field="Name" />
            </FormGroup>
            <FormGroup label={t('common.surname')}>
              <input style={S.input(!!userErrors['Surname'])} value={userForm.surname}
                onChange={e => setUserForm({ ...userForm, surname: e.target.value })} />
              <FieldError errors={userErrors} field="Surname" />
            </FormGroup>
            <FormGroup label={t('common.email')}>
              <input style={S.input(!!userErrors['Email'])} type="email" value={userForm.email}
                onChange={e => setUserForm({ ...userForm, email: e.target.value })} />
              <FieldError errors={userErrors} field="Email" />
            </FormGroup>
            {!isEditing && (
              <FormGroup label={t('common.password')}>
                <input style={S.input(!!userErrors['Password'])} type="password" value={userForm.password}
                  onChange={e => setUserForm({ ...userForm, password: e.target.value })} />
                <FieldError errors={userErrors} field="Password" />
              </FormGroup>
            )}
            {isEditing && (
              <FormGroup label={t('common.role')}>
                <select style={S.input()} value={userForm.role}
                  onChange={e => setUserForm({ ...userForm, role: parseInt(e.target.value) })}>
                  <option value={1}>Admin</option>
                  <option value={2}>Support Agent</option>
                  <option value={3}>Requester</option>
                </select>
              </FormGroup>
            )}
            <button onClick={handleUserSubmit} style={{ ...S.btn('success'), width: '100%', marginTop: '4px' }}>{t('admin.actions.save')}</button>
          </div>
        </Modal>
      )}

      {deptMgmt && (
        <Modal title={t('admin.headers.deptMgmt')} onClose={() => setDeptMgmt(false)} wide>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
            <button onClick={() => { setDeptMgmt(false); openDeptModal(); }} style={S.btn('success')}>{t('admin.actions.newDept')}</button>
          </div>
          <div style={{ backgroundColor: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{[t('common.id'), t('admin.placeholders.deptName'), t('admin.placeholders.description'), t('common.actions')].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>
                {departments.map(d => (
                  <tr key={d.id}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={S.td}><span style={{ fontWeight: '700', color: '#94a3b8' }}>#{d.id}</span></td>
                    <td style={{ ...S.td, fontWeight: '600', color: '#1e293b' }}>{d.name}</td>
                    <td style={{ ...S.td, color: '#64748b' }}>{d.description || '-'}</td>
                    <td style={S.td}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => { setDeptMgmt(false); openDeptModal(d); }} style={S.btn('primary', true)}>{t('admin.actions.edit')}</button>
                        <button onClick={() => deleteDept(d.id)} style={S.btn('danger', true)}>{t('admin.actions.delete')}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modal>
      )}

      {deptModal && (
        <Modal title={isEditing ? t('admin.actions.edit') : t('admin.actions.newDept')}
          onClose={() => { setDeptModal(false); setDeptErrors({}); }}>
          <div>
            <GeneralError errors={deptErrors} />
            <FormGroup label={t('admin.placeholders.deptName')}>
              <input style={S.input(!!deptErrors['Name'])} value={deptForm.name}
                onChange={e => setDeptForm({ ...deptForm, name: e.target.value })} />
              <FieldError errors={deptErrors} field="Name" />
            </FormGroup>
            <FormGroup label={t('admin.placeholders.description')}>
              <input style={S.input(!!deptErrors['Description'])} value={deptForm.description}
                onChange={e => setDeptForm({ ...deptForm, description: e.target.value })} />
              <FieldError errors={deptErrors} field="Description" />
            </FormGroup>
            <button onClick={handleDeptSubmit} style={{ ...S.btn('success'), width: '100%' }}>{t('admin.actions.save')}</button>
          </div>
        </Modal>
      )}

      {agentModal && (
        <Modal title={isEditing ? t('admin.actions.edit') : t('admin.actions.newAgent')}
          onClose={() => { setAgentModal(false); setAgentErrors({}); }}>
          <div>
            <GeneralError errors={agentErrors} />
            <FormGroup label={t('common.name')}>
              <input style={S.input(!!agentErrors['Name'])} value={agentForm.name}
                onChange={e => setAgentForm({ ...agentForm, name: e.target.value })} />
              <FieldError errors={agentErrors} field="Name" />
            </FormGroup>
            <FormGroup label={t('common.surname')}>
              <input style={S.input(!!agentErrors['Surname'])} value={agentForm.surname}
                onChange={e => setAgentForm({ ...agentForm, surname: e.target.value })} />
              <FieldError errors={agentErrors} field="Surname" />
            </FormGroup>
            <FormGroup label={t('common.email')}>
              <input style={S.input(!!agentErrors['Email'])} type="email" value={agentForm.email}
                onChange={e => setAgentForm({ ...agentForm, email: e.target.value })} />
              <FieldError errors={agentErrors} field="Email" />
            </FormGroup>
            <FormGroup label={isEditing ? t('admin.placeholders.new_password_hint') : t('common.password')}>
              <input style={S.input(!!agentErrors['PasswordHash'])} type="password" value={agentForm.passwordHash}
                onChange={e => setAgentForm({ ...agentForm, passwordHash: e.target.value })} />
              <FieldError errors={agentErrors} field="PasswordHash" />
            </FormGroup>
            <FormGroup label={t('admin.headers.dept')}>
              <select style={S.input(!!agentErrors['DepartmentId'])} value={agentForm.departmentId}
                onChange={e => setAgentForm({ ...agentForm, departmentId: e.target.value })}>
                <option value="" disabled>{t('admin.placeholders.dept_select') || 'Select Department'}</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <FieldError errors={agentErrors} field="DepartmentId" />
            </FormGroup>
            <button onClick={handleAgentSubmit} style={{ ...S.btn('success'), width: '100%' }}>{t('admin.actions.save')}</button>
          </div>
        </Modal>
      )}

      {assignModal && selTicket && (
        <Modal title={`${t('admin.actions.assign')} - #${selTicket.id}`} onClose={() => { setAssignModal(false); setSelTicket(null); }}>
          <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '12px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>{selTicket.title}</div>
            {selTicket.description && <div style={{ fontSize: '12px', color: '#64748b' }}>{selTicket.description}</div>}
          </div>
          <FormGroup label={t('admin.placeholders.assignedAgent')}>
            <select style={S.input()} value={assignId} onChange={e => setAssignId(e.target.value)}>
              <option value="" disabled>{t('admin.placeholders.select_agent')}</option>
              {(() => {
                const deptId = selTicket.departmentID ?? selTicket.departmentId;
                const same = agents.filter(a => String(a.departmentId) === String(deptId));
                const other = agents.filter(a => String(a.departmentId) !== String(deptId));
                return (<>
                  {same.length > 0 && <optgroup label={t('admin.placeholders.same_dept')}>{same.map(a => <option key={a.id} value={a.id}>{a.name} {a.surname} - {a.email}</option>)}</optgroup>}
                  {other.length > 0 && <optgroup label={t('admin.placeholders.other_agents')}>{other.map(a => <option key={a.id} value={a.id}>{a.name} {a.surname} - {departments.find(d => d.id === a.departmentId)?.name || `Dept #${a.departmentId}`}</option>)}</optgroup>}
                </>);
              })()}
            </select>
          </FormGroup>
          <button onClick={handleAssign} disabled={isAssigning} style={{ ...S.btn('success'), width: '100%', opacity: isAssigning ? 0.7 : 1 }}>
            {isAssigning ? t('common.loading') : t('admin.actions.assign')}
          </button>
        </Modal>
      )}

    </div>
  );
}