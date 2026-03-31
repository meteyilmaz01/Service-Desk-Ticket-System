import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import { useLanguage } from './LanguageContext';

const API = import.meta.env.VITE_API_URL;

const getStatus = (raw, t) => {
  if (raw == null) return { key: 'unspecified', label: t('status.unspecified'), bg:'#f1f5f9', color:'#64748b' };
  const k = String(raw).toLowerCase();
  const num = { '1':'open','2':'assigned','3':'inprogress','4':'resolved','5':'closed' }[k];
  const name = num || { open:'open',assigned:'assigned',inprogress:'inprogress',resolved:'resolved',closed:'closed' }[k] || String(raw);
  const map = {
    open:       { key: 'open',       label: t('status.open'),      bg:'#fff8e1', color:'#b45309', dot:'#f59e0b' },
    assigned:   { key: 'assigned',   label: t('status.assigned'),    bg:'#ede9fe', color:'#5b21b6', dot:'#8b5cf6' },
    inprogress: { key: 'inprogress', label: t('status.inprogress'),   bg:'#dbeafe', color:'#1d4ed8', dot:'#3b82f6' },
    resolved:   { key: 'resolved',   label: t('status.resolved'),   bg:'#dcfce7', color:'#166534', dot:'#10b981' },
    closed:     { key: 'closed',     label: t('status.closed'), bg:'#f1f5f9', color:'#475569', dot:'#94a3b8' },
  };
  return map[name] || { key: name, label: t(`status.${name}`) || name, bg:'#f1f5f9', color:'#64748b', dot:'#94a3b8' };
};

const getPriority = (p, t) => ({
  1: { label: t('priority.critical'),   bg:'#fee2e2', color:'#991b1b' },
  2: { label: t('priority.normal'), bg:'#fef9c3', color:'#854d0e' },
  3: { label: t('priority.low'),  bg:'#dcfce7', color:'#166534' },
}[p] || { label: t('priority.unspecified'), bg:'#f1f5f9', color:'#64748b' });

const Badge = ({ style, children }) => (
  <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', padding:'3px 10px',
    borderRadius:'20px', fontSize:'11px', fontWeight:'700',
    backgroundColor:style.bg, color:style.color }}>
    {style.dot && <span style={{ width:'6px', height:'6px', borderRadius:'50%', backgroundColor:style.dot, flexShrink:0 }} />}
    {children}
  </span>
);

export default function RequesterDashboard() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [userName,     setUserName]     = useState('');
  const [userInitials, setUserInitials] = useState('');
  const [userId,       setUserId]       = useState(0);
  const [view,         setView]         = useState('home');
  const [departments,  setDepts]        = useState([]);
  const [tickets,      setTickets]      = useState([]);
  const [selTicket,    setSelTicket]    = useState(null);
  const [isLoadingTickets, setLT]       = useState(false);
  const [isLoadingDetail,  setLD]       = useState(false);
  const [isSubmitting,     setSub]      = useState(false);
  const [ticketForm,   setForm]         = useState({ title:'', description:'', departmentId:'' });
  const [submitSuccess,setSuccess]      = useState(false);
  const [isClosing,    setIsClosing]    = useState(false);

  const [messages,     setMessages]     = useState([]);
  const [newMessage,   setNewMessage]   = useState('');
  const [isSending,    setIsSending]    = useState(false);
  const [isLoadingMsg, setLoadingMsg]   = useState(false);
  const messagesEndRef = useRef(null);

  const inputStyle = {
    width:'100%', padding:'11px 14px', borderRadius:'10px', border:'1px solid #e2e8f0',
    fontSize:'14px', color:'#1e293b', outline:'none', backgroundColor:'#fff',
    boxSizing:'border-box', transition:'border-color 0.15s',
    fontFamily:"'Segoe UI', sans-serif",
  };
  const labelStyle = {
    display:'block', fontSize:'12px', fontWeight:'700', color:'#64748b',
    marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.5px'
  };

  const cfg = () => ({ headers:{ Authorization:`Bearer ${localStorage.getItem('userToken')}` } });

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (!token) { navigate('/'); return; }
    try {
      const d = jwtDecode(token);
      const name = d["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] || d.name || t('user');
      setUserName(name);
      setUserInitials(name.charAt(0).toUpperCase());
      const id = d["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || d.nameid || d.sub;
      if (id) setUserId(parseInt(id));
      axios.get(`${API}/api/AdminDepartment/all-departments`, cfg())
        .then(r => setDepts(r.data)).catch(console.error);
    } catch { navigate('/'); }
  }, [navigate]);

  const fetchTickets = async () => {
    setLT(true);
    try {
      const r = await axios.get(`${API}/api/Ticket/my-tickets`, cfg());
      setTickets(r.data);
    } catch(e) { console.error(e); } finally { setLT(false); }
  };

  useEffect(() => { if (view === 'my-tickets' || view === 'home') fetchTickets(); }, [view]);

  const fetchMessages = async (ticketId) => {
    setLoadingMsg(true);
    try {
      const r = await axios.get(`${API}/api/TicketConversation/${ticketId}`, cfg());
      setMessages(r.data);
    } catch(e) {
      console.error(e);
      setMessages([]);
    } finally {
      setLoadingMsg(false);
    }
  };

  const sendMessage = async (ticketId) => {
    if (!newMessage.trim()) return;
    setIsSending(true);
    try {
      await axios.post(`${API}/api/TicketConversation/send`,
        { ticketId, message: newMessage }, cfg());
      setNewMessage('');
      await fetchMessages(ticketId);
    } catch(e) {
      console.error(e);
      alert(t('common.error'));
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [messages]);

  useEffect(() => {
    if (view !== 'detail' || !selTicket) return;
    const interval = setInterval(() => {
      fetchMessages(selTicket.id);
    }, 10000);
    return () => clearInterval(interval);
  }, [view, selTicket]);

  const openDetail = async (id) => {
    setView('detail');
    setLD(true);
    setSelTicket(null);
    setMessages([]);
    setNewMessage('');
    try {
      const r = await axios.get(`${API}/api/Ticket/get-ticket-by-id/${id}`, cfg());
      setSelTicket({ ...r.data, id });
      await fetchMessages(id);
    } catch {
      alert(t('common.error'));
      setView('my-tickets');
    } finally {
      setLD(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!selTicket) return;
    setIsClosing(true);
    try {
      await axios.patch(`${API}/api/Ticket/${selTicket.id}/close`, {}, cfg());

      const r = await axios.get(`${API}/api/Ticket/get-ticket-by-id/${selTicket.id}`, cfg());
      setSelTicket({ ...r.data, id: selTicket.id });
    } catch(e) { console.error(e); alert(t('common.error')); }
    finally { setIsClosing(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSub(true);
    try {
      const token = localStorage.getItem('userToken');
      await axios.post(`${API}/api/Ticket/create-ticket`, {
        title: ticketForm.title, description: ticketForm.description,
        requesterId: userId, departmentID: ticketForm.departmentId ? parseInt(ticketForm.departmentId) : null
      }, { headers:{ Authorization:`Bearer ${token}` } });
      setSuccess(true);
      setTimeout(() => { setSuccess(false); setForm({ title:'', description:'', departmentId:'' }); setView('my-tickets'); }, 1500);
    } catch(e) {
      const msg = e.response?.data?.errors ? JSON.stringify(e.response.data.errors, null,2) : JSON.stringify(e.response?.data||t('common.error'));
      alert(t('common.error') + ':\n'+msg);
    } finally { setSub(false); }
  };

  const handleLogout = () => { localStorage.removeItem('userToken'); navigate('/'); };

  const statsOpen     = tickets.filter(tk => { const s=getStatus(tk.status, t); return ['open','assigned','inprogress'].includes(s.key); }).length;
  const statsResolved = tickets.filter(tk => { const s=getStatus(tk.status, t); return ['resolved','closed'].includes(s.key); }).length;

  return (
    <div style={{ minHeight:'100vh', backgroundColor:'#f0f4f8', fontFamily:"'Segoe UI', sans-serif" }}>

      <nav style={{ backgroundColor:'#0f172a', padding:'0 32px', height:'60px',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        boxShadow:'0 2px 12px rgba(0,0,0,0.2)', position:'sticky', top:0, zIndex:100 }}>
        <div onClick={() => setView('home')} style={{ cursor:'pointer', display:'flex', alignItems:'center', gap:'10px' }}>
          <span style={{ fontSize:'20px' }}>🎫</span>
          <span style={{ color:'#f8fafc', fontWeight:'800', fontSize:'16px', letterSpacing:'-0.3px' }}>Service Desk</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <div style={{ width:'34px', height:'34px', borderRadius:'50%', backgroundColor:'#3b82f6',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:'14px', fontWeight:'800', color:'#fff' }}>{userInitials}</div>
            <span style={{ color:'#94a3b8', fontSize:'13px' }}>{t('requester.nav.welcome')} <strong style={{ color:'#f1f5f9' }}>{userName}</strong></span>
          </div>
          <button onClick={handleLogout} style={{ padding:'7px 16px', borderRadius:'8px', border:'1px solid #334155',
            backgroundColor:'transparent', color:'#94a3b8', fontSize:'12px', fontWeight:'600', cursor:'pointer' }}>
            {t('requester.nav.logout')}
          </button>
        </div>
      </nav>

      <div style={{ maxWidth:'900px', margin:'0 auto', padding:'32px 20px' }}>

        {view === 'home' && (
          <div>
            <div style={{ marginBottom:'32px' }}>
              <h1 style={{ margin:'0 0 6px', fontSize:'26px', fontWeight:'800', color:'#1e293b' }}>
                {t('requester.home.greeting').replace('{name}', userName)}
              </h1>
              <p style={{ margin:0, color:'#64748b', fontSize:'14px' }}>{t('requester.home.sub')}</p>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'16px', marginBottom:'32px' }}>
              {[
                { label: t('requester.home.stats.total'),  value:tickets.length, icon:'📋', color:'#3b82f6', bg:'#eff6ff' },
                { label: t('requester.home.stats.active'),   value:statsOpen,       icon:'⏳', color:'#f59e0b', bg:'#fffbeb' },
                { label: t('requester.home.stats.resolved'), value:statsResolved,   icon:'✅', color:'#10b981', bg:'#f0fdf4' },
              ].map(s => (
                <div key={s.label} style={{ backgroundColor:'#fff', borderRadius:'14px', padding:'20px',
                  border:'1px solid #e2e8f0', boxShadow:'0 1px 6px rgba(0,0,0,0.05)',
                  display:'flex', alignItems:'center', gap:'16px' }}>
                  <div style={{ width:'48px', height:'48px', borderRadius:'12px', backgroundColor:s.bg,
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', flexShrink:0 }}>
                    {s.icon}
                  </div>
                  <div>
                    <div style={{ fontSize:'24px', fontWeight:'800', color:s.color }}>{s.value}</div>
                    <div style={{ fontSize:'12px', color:'#94a3b8', fontWeight:'600' }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px' }}>
              {[
                { icon:'📂', title:t('requester.home.cards.myTickets'), desc:t('requester.home.cards.myTicketsDesc'), color:'#3b82f6', view:'my-tickets' },
                { icon:'➕', title:t('requester.home.cards.newTicket'), desc:t('requester.home.cards.newTicketDesc'), color:'#10b981', view:'create' },
              ].map(c => (
                <div key={c.view} onClick={() => setView(c.view)} style={{
                  backgroundColor:'#fff', borderRadius:'16px', padding:'28px 24px',
                  border:'1px solid #e2e8f0', cursor:'pointer', transition:'all 0.15s ease',
                  boxShadow:'0 1px 6px rgba(0,0,0,0.05)',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.1)'; e.currentTarget.style.borderColor=c.color; }}
                  onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 1px 6px rgba(0,0,0,0.05)'; e.currentTarget.style.borderColor='#e2e8f0'; }}>
                  <div style={{ fontSize:'36px', marginBottom:'14px' }}>{c.icon}</div>
                  <div style={{ fontSize:'17px', fontWeight:'700', color:'#1e293b', marginBottom:'6px' }}>{c.title}</div>
                  <div style={{ fontSize:'13px', color:'#94a3b8', lineHeight:'1.5' }}>{c.desc}</div>
                  <div style={{ marginTop:'16px', fontSize:'12px', fontWeight:'700', color:c.color }}>{t('requester.home.cards.continue')}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'create' && (
          <div>
            <button onClick={() => setView('home')} style={{ display:'flex', alignItems:'center', gap:'6px',
              background:'none', border:'none', color:'#64748b', fontSize:'13px', cursor:'pointer',
              fontWeight:'600', marginBottom:'24px', padding:0 }}>
              {t('requester.create.back')}
            </button>
            <div style={{ backgroundColor:'#fff', borderRadius:'16px', border:'1px solid #e2e8f0',
              boxShadow:'0 1px 6px rgba(0,0,0,0.05)', overflow:'hidden' }}>
              <div style={{ padding:'24px 28px', borderBottom:'1px solid #f1f5f9', backgroundColor:'#f8fafc' }}>
                <h2 style={{ margin:0, fontSize:'18px', fontWeight:'700', color:'#1e293b' }}>{t('requester.create.title')}</h2>
                <p style={{ margin:'4px 0 0', fontSize:'13px', color:'#94a3b8' }}>{t('requester.create.sub')}</p>
              </div>
              <div style={{ padding:'28px' }}>
                {submitSuccess && (
                  <div style={{ backgroundColor:'#dcfce7', border:'1px solid #86efac', borderRadius:'10px',
                    padding:'14px 16px', marginBottom:'20px', color:'#166534', fontSize:'14px', fontWeight:'600', textAlign:'center' }}>
                    {t('requester.create.success')}
                  </div>
                )}
                <div style={{ marginBottom:'18px' }}>
                  <label style={labelStyle}>{t('requester.create.deptLabel')}</label>
                  <select value={ticketForm.departmentId} onChange={e => setForm({...ticketForm, departmentId:e.target.value})} style={inputStyle}>
                    <option value="">{t('requester.create.deptPlaceholder')}</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom:'18px' }}>
                  <label style={labelStyle}>{t('requester.create.subjectLabel')}</label>
                  <input value={ticketForm.title} onChange={e => setForm({...ticketForm, title:e.target.value})}
                    placeholder={t('requester.create.subjectPlaceholder')} style={inputStyle} required />
                </div>
                <div style={{ marginBottom:'24px' }}>
                  <label style={labelStyle}>{t('requester.create.descLabel')}</label>
                  <textarea value={ticketForm.description} onChange={e => setForm({...ticketForm, description:e.target.value})}
                    placeholder={t('requester.create.descPlaceholder')} rows={6}
                    style={{ ...inputStyle, resize:'vertical', lineHeight:'1.6' }} required />
                </div>
                <button onClick={handleSubmit} disabled={isSubmitting || !ticketForm.title.trim() || !ticketForm.description.trim()} style={{
                  width:'100%', padding:'13px', borderRadius:'10px', border:'none',
                  backgroundColor: isSubmitting ? '#94a3b8' : '#3b82f6',
                  color:'#fff', fontSize:'15px', fontWeight:'700', cursor: isSubmitting ? 'not-allowed' : 'pointer',
                }}>
                  {isSubmitting ? t('requester.create.submitting') : t('requester.create.submit')}
                </button>
              </div>
            </div>
          </div>
        )}

        {view === 'my-tickets' && (
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'24px' }}>
              <div>
                <button onClick={() => setView('home')} style={{ display:'flex', alignItems:'center', gap:'6px',
                  background:'none', border:'none', color:'#64748b', fontSize:'13px', cursor:'pointer',
                  fontWeight:'600', marginBottom:'6px', padding:0 }}>
                  {t('requester.create.back')}
                </button>
                <h2 style={{ margin:0, fontSize:'20px', fontWeight:'700', color:'#1e293b' }}>{t('requester.list.title')}</h2>
              </div>
              <button onClick={fetchTickets} style={{ padding:'8px 16px', borderRadius:'8px', border:'1px solid #e2e8f0',
                backgroundColor:'#fff', color:'#64748b', fontSize:'13px', fontWeight:'600', cursor:'pointer' }}>
                {t('requester.list.refresh')}
              </button>
            </div>

            {isLoadingTickets ? (
              <div style={{ textAlign:'center', padding:'60px', color:'#94a3b8' }}>
                <div style={{ fontSize:'32px', marginBottom:'12px' }}>⏳</div>
                <div>{t('common.loading')}</div>
              </div>
            ) : tickets.length === 0 ? (
              <div style={{ textAlign:'center', padding:'60px', backgroundColor:'#fff',
                borderRadius:'16px', border:'1px solid #e2e8f0' }}>
                <div style={{ fontSize:'48px', marginBottom:'16px' }}>📭</div>
                <div style={{ fontSize:'16px', fontWeight:'600', color:'#475569', marginBottom:'8px' }}>{t('requester.list.noTickets')}</div>
                <div style={{ fontSize:'13px', color:'#94a3b8', marginBottom:'20px' }}>{t('requester.list.noTicketsSub')}</div>
                <button onClick={() => setView('create')} style={{ padding:'10px 24px', borderRadius:'10px', border:'none',
                  backgroundColor:'#3b82f6', color:'#fff', fontWeight:'700', cursor:'pointer', fontSize:'14px' }}>
                  {t('requester.list.createBtn')}
                </button>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                {tickets.map(ticket => {
                  const st = getStatus(ticket.status, t);
                  return (
                    <div key={ticket.id} onClick={() => openDetail(ticket.id)} style={{
                      backgroundColor:'#fff', borderRadius:'12px', border:'1px solid #e2e8f0',
                      padding:'16px 20px', cursor:'pointer', transition:'all 0.15s ease',
                      display:'flex', alignItems:'center', justifyContent:'space-between',
                      boxShadow:'0 1px 4px rgba(0,0,0,0.04)',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor='#3b82f6'; e.currentTarget.style.boxShadow='0 4px 12px rgba(59,130,246,0.1)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,0.04)'; }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
                        <div style={{ width:'38px', height:'38px', borderRadius:'10px', backgroundColor:st.bg,
                          display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <span style={{ width:'10px', height:'10px', borderRadius:'50%', backgroundColor:st.dot, display:'block' }} />
                        </div>
                        <div>
                          <div style={{ fontSize:'14px', fontWeight:'600', color:'#1e293b', marginBottom:'3px' }}>{ticket.title}</div>
                          <div style={{ fontSize:'11px', color:'#94a3b8', fontWeight:'600' }}>{t('requester.detail.id')} {ticket.id}</div>
                        </div>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                        <Badge style={st}>{st.label}</Badge>
                        <span style={{ color:'#cbd5e1', fontSize:'16px' }}>›</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {view === 'detail' && (
          <div>
            <button onClick={() => setView('my-tickets')} style={{ display:'flex', alignItems:'center', gap:'6px',
              background:'none', border:'none', color:'#64748b', fontSize:'13px', cursor:'pointer',
              fontWeight:'600', marginBottom:'24px', padding:0 }}>
              ← {t('requester.detail.back')}
            </button>

            {isLoadingDetail ? (
              <div style={{ textAlign:'center', padding:'80px', backgroundColor:'#fff',
                borderRadius:'16px', border:'1px solid #e2e8f0', color:'#94a3b8' }}>
                <div style={{ fontSize:'36px', marginBottom:'12px' }}>⏳</div>
                <div>{t('common.loading')}</div>
              </div>
            ) : selTicket ? (() => {
              const st = getStatus(selTicket.status ?? selTicket.Status, t);
              const pr = getPriority(selTicket.priority ?? selTicket.Priority, t);
              const deptId = selTicket.departmentID ?? selTicket.departmentId;
              const dept   = departments.find(d => String(d.id) === String(deptId));
              const isClosed = st.label === t('status.closed');

              return (
                <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>

                  <div style={{ backgroundColor:'#fff', borderRadius:'16px', border:'1px solid #e2e8f0',
                    boxShadow:'0 1px 6px rgba(0,0,0,0.05)', overflow:'hidden' }}>
                    <div style={{ padding:'24px 28px', borderBottom:'1px solid #f1f5f9', backgroundColor:'#f8fafc' }}>
                      <div style={{ fontSize:'11px', color:'#94a3b8', fontWeight:'700', marginBottom:'6px' }}>{t('requester.detail.id')} {selTicket.id}</div>
                      <div style={{ fontSize:'20px', fontWeight:'700', color:'#1e293b', marginBottom:'12px', lineHeight:'1.4' }}>{selTicket.title}</div>
                      <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                        <Badge style={st}>{st.label}</Badge>
                        <Badge style={pr}>{pr.label}</Badge>
                      </div>
                    </div>

                    <div style={{ padding:'28px', display:'flex', flexDirection:'column', gap:'20px' }}>
                      <div>
                        <div style={labelStyle}>{t('requester.detail.description')}</div>
                        <div style={{ backgroundColor:'#f8fafc', borderRadius:'10px', padding:'14px 16px',
                          border:'1px solid #e2e8f0', fontSize:'14px', color:'#334155', lineHeight:'1.7', minHeight:'60px' }}>
                          {selTicket.description || <span style={{ color:'#cbd5e1' }}>{t('requester.detail.noDescription')}</span>}
                        </div>
                      </div>

                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                        {[
                          { label:`🏢 ${t('requester.detail.dept')}`, value: deptId ? (dept?.name || `Dept #${deptId}`) : '—' },
                          { label:`⚡ ${t('requester.detail.priority')}`,   value: <Badge style={pr}>{pr.label}</Badge> },
                          { label:`🧑‍💼 ${t('requester.detail.assigned_agent')}`, value: selTicket.assignedToId
                            ? `#${selTicket.assignedToId} ${t('admin.placeholders.assigned_to')}`
                            : <span style={{ color:'#f59e0b', fontWeight:'600' }}>⏳ {t('requester.detail.agentNotAssigned')}</span> },
                          { label:`📊 ${t('requester.detail.status')}`, value: <Badge style={st}>{st.label}</Badge> },
                        ].map(item => (
                          <div key={item.label} style={{ backgroundColor:'#f8fafc', borderRadius:'10px',
                            padding:'14px 16px', border:'1px solid #e2e8f0' }}>
                            <div style={{ ...labelStyle, marginBottom:'6px' }}>{item.label}</div>
                            <div style={{ fontSize:'13px', fontWeight:'600', color:'#334155' }}>{item.value}</div>
                          </div>
                        ))}
                      </div>

                      <div>
                        <div style={labelStyle}>{t('requester.detail.timeline')}</div>
                        <style>{`
                          @keyframes ping-border {
                            0% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.4); }
                            70% { box-shadow: 0 0 0 8px rgba(249, 115, 22, 0); }
                            100% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0); }
                          }
                          @keyframes ping-border-cyan {
                            0% { box-shadow: 0 0 0 0 rgba(14, 165, 233, 0.4); }
                            70% { box-shadow: 0 0 0 8px rgba(14, 165, 233, 0); }
                            100% { box-shadow: 0 0 0 0 rgba(14, 165, 233, 0); }
                          }
                        `}</style>
                        <div style={{ display:'flex', alignItems:'center', padding:'24px 16px',
                          backgroundColor:'#f8fafc', borderRadius:'10px', border:'1px solid #e2e8f0', overflowX:'auto' }}>
                          {(() => {
                            const raw = selTicket.status ?? selTicket.Status;
                            const num = { 1:'Open',2:'Assigned',3:'InProgress',4:'Resolved',5:'Closed' }[raw] || String(raw);

                            const convRaw = selTicket.conversationStatus ?? selTicket.ConversationStatus;
                            const convStr = { 0:'no_messages', 1:'waiting_agent', 2:'waiting_user' }[convRaw] || String(convRaw);

                            const steps = [];
                            steps.push({ id:'Open', label: t('timeline.open'), color:'#f59e0b', done: true });

                            const passedAssigned = ['Assigned','InProgress','Resolved','Closed'].includes(num);
                            steps.push({ id:'Assigned', label: t('timeline.assigned'), color:'#8b5cf6', done: passedAssigned });

                            const passedInProgress = ['InProgress','Resolved','Closed'].includes(num);
                            steps.push({ id:'InProgress', label: t('timeline.inprogress'), color:'#3b82f6', done: passedInProgress });

                            const isFinished = num === 'Resolved' || num === 'Closed';
                            const isConvWait = convStr === 'waiting_agent' || convStr === 'waiting_user';

                            if (!isFinished && isConvWait) {
                               if (convStr === 'waiting_user') {
                                  steps.push({ id:'Conv', label: t('timeline.waiting_user'), color:'#f97316', done: false, activePulse: 'ping-border' });
                               } else {
                                  steps.push({ id:'Conv', label: t('timeline.waiting_agent'), color:'#0ea5e9', done: false, activePulse: 'ping-border-cyan' });
                               }
                            } else if (!isFinished) {

                               steps.push({ id:'Resolved', label: t('timeline.resolved'), color:'#10b981', done: false });
                            }

                            if (isFinished) {
                               steps.push({ id:'Resolved', label: t('timeline.resolved'), color:'#10b981', done: true });
                            }

                            const passedClosed = num === 'Closed';
                            steps.push({ id:'Closed', label: t('timeline.closed'), color:'#94a3b8', done: passedClosed });

                            return steps.map((step, i, arr) => {
                              const isLast = i === arr.length - 1;
                              const isActive = !step.done && (i===0 || steps[i-1].done);
                              const isPulse = step.activePulse && isActive;

                              const bgColor = step.done ? step.color : '#fff';
                              const borderColor = step.done || isActive ? step.color : '#e2e8f0';

                              return (
                                <div key={step.id + i} style={{ display:'flex', alignItems:'center', flex: isLast ? 'none' : 1 }}>
                                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'8px', position:'relative' }}>
                                    <div style={{
                                      width:'32px', height:'32px', borderRadius:'50%',
                                      backgroundColor: bgColor,
                                      border: `2px solid ${borderColor}`,
                                      display:'flex', alignItems:'center', justifyContent:'center',
                                      boxShadow: isPulse ? 'none' : (isActive ? `0 0 0 4px ${step.color}22` : 'none'),
                                      animation: isPulse ? `${step.activePulse} 1.5s infinite` : 'none',
                                      zIndex: 2,
                                      transition: 'all 0.3s ease'
                                    }}>
                                      {step.done && <span style={{ color:'#fff', fontSize:'14px', fontWeight:'800' }}>✓</span>}
                                      {isActive && !step.done && <span style={{ width:'10px', height:'10px', borderRadius:'50%', backgroundColor:step.color }} />}
                                    </div>
                                    <span style={{
                                      position:'absolute', top:'40px',
                                      fontSize:'10px', fontWeight:'800',
                                      color: step.done || isActive ? step.color : '#94a3b8',
                                      whiteSpace:'nowrap', letterSpacing:'0.5px'
                                    }}>
                                      {step.label}
                                    </span>
                                  </div>
                                  {!isLast && (
                                    <div style={{
                                      flex:1, height:'3px',
                                      backgroundColor: step.done ? step.color : '#e2e8f0',
                                      margin:'0 8px',
                                      transition: 'background-color 0.3s ease'
                                    }} />
                                  )}
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>

                      {!isClosed && (
                        <div style={{ borderTop:'1px solid #e2e8f0', paddingTop:'20px' }}>
                          <button onClick={handleCloseTicket} disabled={isClosing}
                            style={{ padding:'10px 20px', borderRadius:'10px', border:'none',
                              backgroundColor: isClosing ? '#94a3b8' : '#ef4444',
                              color:'#fff', fontWeight:'700', fontSize:'13px',
                              cursor: isClosing ? 'not-allowed' : 'pointer' }}>
                            {isClosing ? t('common.loading') : `🔒 ${t('admin.actions.close')}`}
                          </button>
                        </div>
                      )}
                      {isClosed && (
                        <div style={{ borderTop:'1px solid #e2e8f0', paddingTop:'20px' }}>
                          <div style={{ backgroundColor:'#f1f5f9', border:'1px solid #cbd5e1', borderRadius:'10px',
                            padding:'14px', color:'#64748b', fontSize:'13px', textAlign:'center', fontWeight:'600' }}>
                            ⚫ {t('requester.detail.closed_info')}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ backgroundColor:'#fff', borderRadius:'16px', border:'1px solid #e2e8f0',
                    boxShadow:'0 1px 6px rgba(0,0,0,0.05)', overflow:'hidden' }}>

                    <div style={{ padding:'16px 24px', borderBottom:'1px solid #f1f5f9', backgroundColor:'#f8fafc',
                      display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                        <div style={{ width:'36px', height:'36px', borderRadius:'10px', backgroundColor:'#eff6ff',
                          display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' }}>💬</div>
                        <div>
                          <div style={{ fontSize:'14px', fontWeight:'700', color:'#1e293b' }}>{t('requester.detail.support_chat')}</div>
                          <div style={{ fontSize:'11px', color:'#94a3b8' }}>
                            {messages.length > 0 ? `${messages.length} ${t('admin.actions.messages').toLowerCase()}` : t('agent.chat.noMessages')}
                          </div>
                        </div>
                      </div>
                      <button onClick={() => fetchMessages(selTicket.id)}
                        style={{ padding:'6px 12px', borderRadius:'8px', border:'1px solid #e2e8f0',
                          backgroundColor:'#fff', color:'#64748b', fontSize:'12px', fontWeight:'600', cursor:'pointer' }}>
                        🔄 {t('common.refresh')}
                      </button>
                    </div>

                    <div style={{ height:'360px', overflowY:'auto', padding:'20px',
                      display:'flex', flexDirection:'column', gap:'12px', backgroundColor:'#fafafa' }}>

                      {isLoadingMsg ? (
                        <div style={{ textAlign:'center', color:'#94a3b8', padding:'40px', fontSize:'13px' }}>
                          ⏳ {t('common.loading')}
                        </div>
                      ) : messages.length === 0 ? (
                        <div style={{ textAlign:'center', color:'#94a3b8', padding:'40px' }}>
                          <div style={{ fontSize:'32px', marginBottom:'10px' }}>💬</div>
                          <div style={{ fontSize:'13px', fontWeight:'600' }}>{t('agent.chat.noMessages')}</div>
                          <div style={{ fontSize:'12px', marginTop:'4px' }}>
                            {isClosed ? t('requester.detail.closed_info') : t('requester.detail.support_chat')}
                          </div>
                        </div>
                      ) : (
                        messages.map(msg => {
                          const isMe = msg.senderId === userId;
                          const roleLabel = (msg.senderRole === 1 || msg.senderRole === 'Admin') ? t('common.role_admin') : (msg.senderRole === 2 || msg.senderRole === 'SupportAgent') ? t('common.role_agent') : t('common.role_requester');
                          return (
                            <div key={msg.id} style={{
                              display:'flex',
                              flexDirection: isMe ? 'row-reverse' : 'row',
                              alignItems:'flex-end',
                              gap:'8px',
                            }}>
                              <div style={{
                                width:'32px', height:'32px', borderRadius:'50%', flexShrink:0,
                                backgroundColor: isMe ? '#3b82f6' : '#8b5cf6',
                                display:'flex', alignItems:'center', justifyContent:'center',
                                fontSize:'12px', fontWeight:'800', color:'#fff',
                              }}>
                                {msg.senderName?.charAt(0).toUpperCase() || '?'}
                              </div>

                              <div style={{ maxWidth:'65%' }}>
                                <div style={{
                                  fontSize:'10px', fontWeight:'700', marginBottom:'4px',
                                  color: isMe ? '#3b82f6' : '#8b5cf6',
                                  textAlign: isMe ? 'right' : 'left',
                                }}>
                                  {isMe ? t('admin.placeholders.you') : msg.senderName}
                                  <span style={{ color:'#94a3b8', fontWeight:'400', marginLeft:'6px' }}>
                                    · {roleLabel}
                                  </span>
                                </div>
                                <div style={{
                                  padding:'10px 14px', borderRadius: isMe ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                                  backgroundColor: isMe ? '#3b82f6' : '#fff',
                                  color: isMe ? '#fff' : '#1e293b',
                                  fontSize:'13px', lineHeight:'1.6',
                                  border: isMe ? 'none' : '1px solid #e2e8f0',
                                  boxShadow:'0 1px 4px rgba(0,0,0,0.06)',
                                  whiteSpace:'pre-wrap', wordBreak:'break-word',
                                }}>
                                  {msg.message}
                                </div>
                                <div style={{
                                  fontSize:'10px', color:'#94a3b8', marginTop:'4px',
                                  textAlign: isMe ? 'right' : 'left',
                                }}>
                                  {new Date(msg.createdDate).toLocaleString(t('lang') === 'en' ? 'en-US' : 'tr-TR', {
                                    day:'2-digit', month:'2-digit', year:'numeric',
                                    hour:'2-digit', minute:'2-digit'
                                  })}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    <div style={{ padding:'16px 20px', borderTop:'1px solid #f1f5f9', backgroundColor:'#fff' }}>
                      {isClosed ? (
                        <div style={{ textAlign:'center', padding:'12px', backgroundColor:'#f8fafc',
                          borderRadius:'10px', border:'1px solid #e2e8f0',
                          fontSize:'13px', color:'#94a3b8', fontWeight:'600' }}>
                          🔒 {t('requester.detail.closed_info')}
                        </div>
                      ) : (
                        <div style={{ display:'flex', gap:'10px', alignItems:'flex-end' }}>
                          <textarea
                            value={newMessage}
                            onChange={e => setNewMessage(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                sendMessage(selTicket.id);
                              }
                            }}
                            placeholder={t('agent.chat.placeholder')}
                            rows={2}
                            style={{
                              flex:1, padding:'10px 14px', borderRadius:'10px',
                              border:'1px solid #e2e8f0', fontSize:'13px', color:'#1e293b',
                              outline:'none', resize:'none', fontFamily:"'Segoe UI', sans-serif",
                              lineHeight:'1.5', boxSizing:'border-box',
                            }}
                          />
                          <button
                            onClick={() => sendMessage(selTicket.id)}
                            disabled={isSending || !newMessage.trim()}
                            style={{
                              padding:'10px 20px', borderRadius:'10px', border:'none',
                              backgroundColor: isSending || !newMessage.trim() ? '#e2e8f0' : '#3b82f6',
                              color: isSending || !newMessage.trim() ? '#94a3b8' : '#fff',
                              fontWeight:'700', fontSize:'13px', cursor: isSending || !newMessage.trim() ? 'not-allowed' : 'pointer',
                              transition:'all 0.15s ease', whiteSpace:'nowrap', flexShrink:0,
                              height:'fit-content',
                            }}>
                            {isSending ? '⏳' : t('common.send')}
                          </button>
                        </div>
                      )}
                      {!isClosed && (
                        <div style={{ fontSize:'11px', color:'#94a3b8', marginTop:'6px' }}>
                          {t('admin.placeholders.chat_hint')}
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              );
            })() : null}
          </div>
        )}

      </div>
    </div>
  );
}