import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import { useLanguage } from './LanguageContext';
import './SupportAgentDashboard.css';

const API_URL = `${import.meta.env.VITE_API_URL}/api`;

function getAgentInfoFromToken() {
  try {
    const token = localStorage.getItem('userToken');
    if (!token) return null;
    const decoded = jwtDecode(token);
    const id =
      decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] ||
      decoded["sub"] || decoded["id"] || decoded["nameid"];
    const name =
      decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ||
      decoded["unique_name"] || decoded["name"] || "Agent";
    return { id: parseInt(id), name };
  } catch {
    return null;
  }
}

const STATUS_MAP   = { 1: 'open', 2: 'assigned', 3: 'inprogress', 4: 'resolved', 5: 'closed' };
const PRIORITY_MAP = { 1:'priority.verylow', 2:'priority.low', 3:'priority.medium', 4:'priority.high', 5:'priority.critical' };

const CONVERSATION_STATUS_MAP = {
  0:'convStatus.noMessages', 1:'convStatus.waitingUser', 2:'convStatus.waitingAgent',
  'NoMessages':'convStatus.noMessages', 'WaitingForAgent':'convStatus.waitingUser', 'WaitingForRequester':'convStatus.waitingAgent',
};
const CONV_STYLE_GRAY   = { bg:'#f1f5f9', color:'#64748b' };
const CONV_STYLE_ORANGE = { bg:'#fef3c7', color:'#92400e' };
const CONV_STYLE_BLUE   = { bg:'#dbeafe', color:'#1e40af' };
const conversationStatusStyle = (status) => ({
  0: CONV_STYLE_GRAY, 1: CONV_STYLE_ORANGE, 2: CONV_STYLE_BLUE,
  'NoMessages': CONV_STYLE_GRAY, 'WaitingForAgent': CONV_STYLE_ORANGE, 'WaitingForRequester': CONV_STYLE_BLUE,
}[status] || CONV_STYLE_GRAY);

const statusStyle = (status) => {
  const map = {
    'open':       { bg: '#fff3cd', color: '#856404' },
    'assigned':   { bg: '#e0d7ff', color: '#4c1d95' },
    'inprogress': { bg: '#cfe2ff', color: '#084298' },
    'resolved':   { bg: '#d1e7dd', color: '#0f5132' },
    'closed':     { bg: '#e2e3e5', color: '#41464b' },
  };
  return map[status] || { bg: '#f8f9fa', color: '#495057' };
};

const priorityStyle = (p) => {
  const map = {
    1: { bg: '#f0fdf4', color: '#166534' }, // Very Low
    2: { bg: '#d1e7dd', color: '#0f5132' }, // Low
    3: { bg: '#fff3cd', color: '#856404' }, // Medium
    4: { bg: '#f8d7da', color: '#842029' }, // High
    5: { bg: '#450a0a', color: '#fef2f2' }, // Critical
  };
  return map[p] || { bg: '#f8f9fa', color: '#495057' };
};

export default function SupportAgentDashboard() {
  const { t } = useLanguage();
  const navigate  = useNavigate();
  const agentInfo = getAgentInfoFromToken();

  const [tickets,            setTickets]            = useState([]);
  const [isLoading,          setIsLoading]          = useState(true);
  const [error,              setError]              = useState(null);
  const [filter,             setFilter]             = useState('all');
  const [selectedTicket,     setSelectedTicket]     = useState(null);
  const [isStarting,         setIsStarting]         = useState(false);
  const [isUpdatingPriority, setIsUpdatingPriority] = useState(false);
  const [isClosing,          setIsClosing]          = useState(false);
  const [messages,           setMessages]           = useState([]);
  const [newMessage,         setNewMessage]         = useState('');
  const [isSending,          setIsSending]          = useState(false);
  const [isLoadingMsg,       setLoadingMsg]         = useState(false);
  const [msgError,           setMsgError]           = useState(null);
  const [activeTab,          setActiveTab]          = useState('detail');
  const messagesEndRef = useRef(null);

  const [showAssignModal,  setShowAssignModal]  = useState(false);
  const [agents,           setAgents]           = useState([]);
  const [agentsLoading,    setAgentsLoading]    = useState(false);
  const [agentSearch,      setAgentSearch]      = useState('');
  const [isRequesting,     setIsRequesting]     = useState(false);
  const [requestSuccess,   setRequestSuccess]   = useState(false);

  const [pendingRequests,  setPendingRequests]  = useState([]);
  const [pendingAction,    setPendingAction]    = useState({});
  const [toastVisible,     setToastVisible]     = useState(true);

  const token  = localStorage.getItem('userToken');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  const fetchMessages = async (ticketId) => {
    if (!ticketId) { console.warn('[Conv] fetchMessages called with no ticketId'); return; }
    console.log('[Conv] fetching ticketId:', ticketId);
    setLoadingMsg(true);
    setMsgError(null);
    try {
      const r = await axios.get(`${API_URL}/TicketConversation/${ticketId}`, config);
      const raw = r.data;
      const list = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.$values)
          ? raw.$values
          : [];
      console.log('[Conv] response status:', r.status, '| count:', list.length, '| raw:', raw);
      setMessages(list);
    } catch(e) {
      const errMsg = e.response
        ? `HTTP ${e.response.status}: ${JSON.stringify(e.response.data)}`
        : e.message || t('common.error');
      console.error('[Conv] fetch error:', errMsg, e);
      setMsgError(errMsg);
      setMessages([]);
    } finally {
      setLoadingMsg(false);
    }
  };

  const sendMessage = async (ticketId) => {
    if (!newMessage.trim()) return;
    setIsSending(true);
    try {
      await axios.post(`${API_URL}/TicketConversation/send`,
        { ticketId, message: newMessage }, config);
      setNewMessage('');
      await fetchMessages(ticketId);
    } catch(e) { console.error(e); alert(t('common.error')); }
    finally { setIsSending(false); }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket) return;
    setIsClosing(true);
    try {
      await axios.patch(`${API_URL}/Ticket/${selectedTicket.id}/close`, {}, config);
      await fetchTickets(selectedTicket.id);
    } catch(e) { console.error(e); alert(t('common.error')); }
    finally { setIsClosing(false); }
  };

  const fetchTickets = async (keepSelected = null) => {
    if (!agentInfo?.id) { setError(t('common.error')); setIsLoading(false); return; }
    setIsLoading(true); setError(null);
    try {
      const res = await axios.get(`${API_URL}/Ticket/get-by-asseigment-id/${agentInfo.id}`, config);
      const fresh = Array.isArray(res.data) ? res.data : [];
      setTickets(fresh);
      if (keepSelected) {
        const updated = fresh.find(t => t.id === keepSelected);
        if (updated) setSelectedTicket(updated);
      }
    } catch (err) {
      if (err.response?.status === 404) setTickets([]);
      else { setError(t('agent.list.error')); console.error(err); }
    } finally { setIsLoading(false); }
  };

  const fetchAgents = async () => {
    setAgentsLoading(true);
    try {
      const r = await axios.get(`${API_URL}/AdminServiceAgent/get-all-service-agents`, config);
      setAgents(Array.isArray(r.data) ? r.data : []);
    } catch(e) { console.error('Ajanlar yüklenemedi:', e); setAgents([]); }
    finally { setAgentsLoading(false); }
  };

  const fetchPendingRequests = async () => {
    if (!agentInfo?.id) return;
    try {
      const r = await axios.get(`${API_URL}/Ticket/pending-assignments/${agentInfo.id}`, config);
      const data = Array.isArray(r.data) ? r.data : [];

      if (data.length > pendingRequests.length) setToastVisible(true);
      setPendingRequests(data);
    } catch (e) { console.error('Bekleyen atamalar alınamadı:', e); setPendingRequests([]); }
  };

  useEffect(() => {
    fetchTickets();
    fetchPendingRequests();
    const interval = setInterval(fetchPendingRequests, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (activeTab === 'messages' && selectedTicket) {
      fetchMessages(selectedTicket.id);
    }
  }, [activeTab, selectedTicket?.id]);

  useEffect(() => {
    if (!selectedTicket) return;
    const interval = setInterval(() => fetchMessages(selectedTicket.id), 10000);
    return () => clearInterval(interval);
  }, [selectedTicket?.id]);

  const handleStartTicket = async () => {
    setIsStarting(true);
    try {
      await axios.patch(`${API_URL}/Ticket/${selectedTicket.id}/next-status`, {}, config);
      await fetchTickets(selectedTicket.id);
    } catch (err) { console.error(err); alert(t('common.error')); }
    finally { setIsStarting(false); }
  };

  const handleUpdatePriority = async (newPriority) => {
    setIsUpdatingPriority(true);
    try {
      await axios.patch(`${API_URL}/Ticket/${selectedTicket.id}/update-priority`, { priority: newPriority }, config);
      await fetchTickets(selectedTicket.id);
    } catch(err) { console.error(err); alert(t('common.error')); }
    finally { setIsUpdatingPriority(false); }
  };

  const handleRequestAssignment = async (targetAgentId, targetAgentName) => {
    setIsRequesting(true); setRequestSuccess(false);
    try {
      await axios.post(`${API_URL}/Ticket/request-assignment`,
        { ticketId: selectedTicket.id, targetAgentId }, config);
      setRequestSuccess(true);
      setTimeout(() => { setRequestSuccess(false); setShowAssignModal(false); setAgentSearch(''); }, 2000);
    } catch(e) { console.error(e); alert(`${t('common.error')}: ${e.response?.data?.message || e.message}`); }
    finally { setIsRequesting(false); }
  };

  const handleAcceptAssignment = async (ticketId) => {
    setPendingAction(p => ({ ...p, [ticketId]: 'accepting' }));
    try {
      await axios.post(`${API_URL}/Ticket/accept-assignment`,
        { ticketId, agentId: agentInfo.id }, config);
      setPendingRequests(prev => prev.filter(r => r.id !== ticketId));
      await fetchTickets();
    } catch(e) { console.error(e); alert(`${t('common.error')}: ${e.response?.data?.message || e.message}`); }
    finally { setPendingAction(p => ({ ...p, [ticketId]: null })); }
  };

  const handleRejectAssignment = async (ticketId) => {
    setPendingAction(p => ({ ...p, [ticketId]: 'rejecting' }));
    try {
      await axios.post(`${API_URL}/Ticket/reject-assignment`,
        { ticketId, agentId: agentInfo.id }, config);
      setPendingRequests(prev => prev.filter(r => r.id !== ticketId));
    } catch(e) { console.error(e); alert(`${t('common.error')}: ${e.response?.data?.message || e.message}`); }
    finally { setPendingAction(p => ({ ...p, [ticketId]: null })); }
  };

  const handleToastTicketClick = (ticket) => {
    setSelectedTicket(ticket);
    setMessages([]);
    setNewMessage('');
    setActiveTab('detail');
    fetchMessages(ticket.id);
  };

  const handleLogout = () => { localStorage.removeItem('userToken'); navigate('/'); };

  const filteredTickets = tickets.filter(t =>
    filter === 'all' || (STATUS_MAP[t.status] || String(t.status)) === filter
  );

  const getLabels = (t_obj) => ({
    statusLabel:   STATUS_MAP[t_obj.status]     || String(t_obj.status),
    priorityLabel: t(PRIORITY_MAP[t_obj.priority]) || String(t_obj.priority),
  });

  const filteredAgents = agents.filter(a =>
    a.id !== agentInfo?.id &&
    (a.name || a.fullName || '').toLowerCase().includes(agentSearch.toLowerCase())
  );

  return (
    <div className="admin-layout">
      <div className="admin-sidebar">

        <div style={{ padding: '24px 20px', borderBottom: '1px solid #334155' }}>
          <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>{t('agent.sidebar.title')}</div>
          <div style={{ fontSize: '16px', fontWeight: '700', color: '#f1f5f9' }}>🧑‍💼 {t('agent.sidebar.panel')}</div>
        </div>

        <div style={{ padding: '16px 20px', borderBottom: '1px solid #334155', backgroundColor: '#0f172a' }}>
          <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>{t('agent.sidebar.welcome')},</div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#38bdf8' }}>{agentInfo?.name || t('user')}</div>
          <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>ID: #{agentInfo?.id}</div>
        </div>

        <div style={{ padding: '16px 20px', borderBottom: '1px solid #334155' }}>
          <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('admin.headers.summary')}</div>
          {[
            { label: t('admin.stats.totalTickets'),   count: tickets.length, color: '#94a3b8' },
            { label: t('status.open'),     count: tickets.filter(t => (STATUS_MAP[t.status]||t.status) === 'open').length,       color: '#fbbf24' },
            { label: t('status.assigned'),   count: tickets.filter(t => (STATUS_MAP[t.status]||t.status) === 'assigned').length,   color: '#7c3aed' },
            { label: t('status.inprogress'),  count: tickets.filter(t => (STATUS_MAP[t.status]||t.status) === 'inprogress').length, color: '#60a5fa' },
            { label: t('status.resolved'), count: tickets.filter(t => (STATUS_MAP[t.status]||t.status) === 'resolved').length,   color: '#34d399' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', color: '#94a3b8' }}>{s.label}</span>
              <span style={{ fontSize: '14px', fontWeight: '700', color: s.color }}>{s.count}</span>
            </div>
          ))}
        </div>

        <div style={{ padding: '16px 20px', flexGrow: 1 }}>
          <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('common.filter')}</div>
          {[
            { key: 'all',        label: `📋 ${t('admin.placeholders.all')}` },
            { key: 'open',       label: `🟡 ${t('status.open')}` },
            { key: 'assigned',   label: `🟣 ${t('status.assigned')}` },
            { key: 'inprogress', label: `🔵 ${t('status.inprogress')}` },
            { key: 'resolved',   label: `🟢 ${t('status.resolved')}` },
            { key: 'closed',     label: `⚫ ${t('status.closed')}` },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              width: '100%', textAlign: 'left', padding: '8px 12px', borderRadius: '6px',
              border: 'none', cursor: 'pointer', marginBottom: '4px', fontSize: '13px',
              fontWeight:      filter === f.key ? '700' : '400',
              backgroundColor: filter === f.key ? '#3b82f6' : 'transparent',
              color:           filter === f.key ? '#fff'   : '#94a3b8',
            }}>{f.label}</button>
          ))}
        </div>

        <div style={{ padding: '16px 20px', borderTop: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button onClick={() => { fetchTickets(selectedTicket?.id); fetchPendingRequests(); }} style={{ padding: '9px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#94a3b8', cursor: 'pointer', fontSize: '13px' }}>🔄 {t('common.refresh')}</button>
          <button onClick={handleLogout} style={{ padding: '9px', borderRadius: '6px', border: 'none', backgroundColor: '#dc2626', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>🚪 {t('admin.sidebar.logout')}</button>
        </div>
      </div>

      <div className="admin-main">
        <div className="admin-content">
          <div className="ticket-list-area">

        <div style={{ backgroundColor: '#fff', padding: '16px 28px', borderBottom: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>{t('admin.headers.ticketMgmt')}</h1>
          <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#94a3b8' }}>{filteredTickets.length} {t('common.tickets')}</p>
        </div>

            {isLoading && <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}><div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div><div>{t('common.loading')}</div></div>}
            {!isLoading && error && <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '20px', textAlign: 'center', color: '#dc2626' }}><div style={{ fontSize: '24px', marginBottom: '8px' }}>⚠️</div><div>{error}</div></div>}
            {!isLoading && !error && filteredTickets.length === 0 && <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}><div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div><div style={{ fontSize: '16px', fontWeight: '600', color: '#64748b' }}>{t('agent.tickets.empty')}</div></div>}
            {!isLoading && !error && filteredTickets.map((ticket) => {
              const { statusLabel, priorityLabel } = getLabels(ticket);
              const ss = statusStyle(statusLabel);
              const ps = priorityStyle(ticket.priority);
              const isSelected = selectedTicket?.id === ticket.id;
              return (
                <div key={ticket.id} onClick={() => { setSelectedTicket(ticket); setMessages([]); setNewMessage(''); setActiveTab('detail'); fetchMessages(ticket.id); }}
                  style={{ backgroundColor: '#fff', borderRadius: '10px', padding: '16px', marginBottom: '12px', cursor: 'pointer', border: isSelected ? '2px solid #3b82f6' : '1px solid #e2e8f0', boxShadow: isSelected ? '0 4px 12px rgba(59,130,246,0.15)' : '0 1px 4px rgba(0,0,0,0.06)', transition: 'all 0.15s ease' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8' }}>#{ticket.id}</span>
                    <span style={{ padding: '2px 9px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', backgroundColor: ps.bg, color: ps.color }}>{priorityLabel}</span>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '6px', lineHeight: '1.4' }}>{ticket.title}</div>
                  {ticket.description && <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ticket.description}</div>}
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', backgroundColor: ss.bg, color: ss.color }}>{t(statusLabel)}</span>
                    <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', backgroundColor: conversationStatusStyle(ticket.conversationStatus).bg, color: conversationStatusStyle(ticket.conversationStatus).color }}>{t(CONVERSATION_STATUS_MAP[ticket.conversationStatus])}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {selectedTicket && (() => {
            const { statusLabel, priorityLabel } = getLabels(selectedTicket);
            const ss = statusStyle(statusLabel);
            const ps = priorityStyle(selectedTicket.priority);
            const isOpen       = statusLabel === 'open';
            const isAssigned   = statusLabel === 'assigned';
            const isInProgress = statusLabel === 'inprogress';
            const isResolved   = statusLabel === 'resolved';
            const isClosed     = statusLabel === 'closed';
            return (
              <div className="ticket-detail-area">
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700', marginBottom: '4px' }}>#{selectedTicket.id}</div>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '10px', lineHeight: '1.4' }}>{selectedTicket.title}</div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '700', backgroundColor: ss.bg, color: ss.color }}>{t(statusLabel)}</span>
                      <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '700', backgroundColor: ps.bg, color: ps.color }}>{t(priorityLabel)}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    {!isClosed && !isResolved && (
                      <button onClick={() => { setShowAssignModal(true); fetchAgents(); setAgentSearch(''); setRequestSuccess(false); }}
                        style={{ padding: '7px 14px', borderRadius: '6px', border: '1px solid #e0d7ff', backgroundColor: '#f5f3ff', color: '#7c3aed', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#ede9fe'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f5f3ff'}>
                        🔀 {t('admin.placeholders.reassign')}
                      </button>
                    )}
                    <button onClick={() => setSelectedTicket(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}>×</button>
                  </div>
                </div>

                <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                  {[{ key: 'detail', label: t('admin.tabs.details'), icon: 'fa-solid fa-clipboard-list' }, { key: 'messages', label: t('admin.tabs.chat'), icon: 'fa-solid fa-comment', count: messages.length }].map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ padding: '12px 20px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', backgroundColor: 'transparent', color: activeTab === tab.key ? '#3b82f6' : '#64748b', borderBottom: activeTab === tab.key ? '2px solid #3b82f6' : '2px solid transparent', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className={tab.icon}></i>
                      {tab.label}
                      {tab.count > 0 && <span>({tab.count})</span>}
                    </button>
                  ))}
                </div>

                {activeTab === 'detail' && (
                  <>
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>{t('admin.placeholders.description')}</div>
                      <div style={{ fontSize: '14px', color: selectedTicket.description ? '#334155' : '#cbd5e1', lineHeight: '1.6', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        {selectedTicket.description || t('admin.placeholders.noDescription')}
                      </div>
                    </div>

                    <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      {[
                        { label: t('requester.tickets.ticketId'), icon: 'fa-solid fa-id-card',    value: `#${selectedTicket.id}` },
                        { label: t('admin.placeholders.requester'), icon: 'fa-solid fa-user',  value: selectedTicket.requesterId ? `#${selectedTicket.requesterId}` : '—' },
                        { label: t('admin.headers.priority'), icon: 'fa-solid fa-bolt', value: (
                          <select value={selectedTicket.priority || ''} onChange={e => handleUpdatePriority(parseInt(e.target.value))} disabled={isUpdatingPriority}
                            style={{ padding: '3px 6px', borderRadius: '5px', border: '1px solid #e2e8f0', fontSize: '12px', color: '#334155', cursor: 'pointer', backgroundColor: '#fff' }}>
                            {[{v:1,l:t('priority.verylow')},{v:2,l:t('priority.low')},{v:3,l:t('priority.medium')},{v:4,l:t('priority.high')},{v:5,l:t('priority.critical')}].map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                          </select>
                        )},
                        { label: t('admin.headers.status'), icon: 'fa-solid fa-chart-simple', value: t(statusLabel) },
                      ].map(item => (
                        <div key={item.label} style={{ backgroundColor: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <i className={item.icon} style={{ color: '#6366f1' }}></i>
                            {item.label}
                          </div>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>{item.value}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ padding: '20px 24px', flex: 1 }}>
                      {(isOpen || isAssigned) && (
                        <div style={{ marginBottom: '16px' }}>
                          <button onClick={handleStartTicket} disabled={isStarting}
                            style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', backgroundColor: isStarting ? '#94a3b8' : '#f59e0b', color: '#fff', fontWeight: '700', fontSize: '12px', cursor: isStarting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {isStarting ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-play"></i>}
                            {isStarting ? t('common.loading') : `${t('admin.placeholders.start')} → InProgress`}
                          </button>
                        </div>
                      )}
                      {isInProgress && (
                        <div style={{ marginBottom: '16px' }}>
                          <button onClick={() => { if(window.confirm(t('confirm.resolve'))) handleStartTicket(); }} disabled={isStarting}
                            style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', backgroundColor: isStarting ? '#94a3b8' : '#10b981', color: '#fff', fontWeight: '700', fontSize: '12px', cursor: isStarting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {isStarting ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-circle-check"></i>}
                            {isStarting ? t('common.loading') : `${t('admin.placeholders.resolve')} → Resolved`}
                          </button>
                        </div>
                      )}
                      {isResolved && (
                        <div style={{ marginBottom: '16px' }}>
                          <button onClick={handleCloseTicket} disabled={isClosing}
                            style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', backgroundColor: isClosing ? '#94a3b8' : '#ef4444', color: '#fff', fontWeight: '700', fontSize: '12px', cursor: isClosing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {isClosing ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-lock"></i>}
                            {isClosing ? t('common.loading') : t('admin.actions.close')}
                          </button>
                        </div>
                      )}
                      {isClosed && <div style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '14px', color: '#64748b', fontSize: '13px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><i className="fa-solid fa-lock"></i> {t('requester.detail.closed_info')}</div>}
                    </div>
                  </>
                )}

                {activeTab === 'messages' && (
                  <div className="admin-chat-area">
                    <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#f8fafc' }}>
                      {isLoadingMsg ? (
                        <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px', fontSize: '13px' }}><i className="fa-solid fa-circle-notch fa-spin" style={{ marginRight: '8px' }}></i> {t('common.loading')}</div>
                      ) : msgError ? (
                        <div style={{ margin: '20px', padding: '14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', color: '#dc2626', fontSize: '12px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                          <strong>{t('common.apiError')}:</strong><br/>{msgError}<br/><br/>
                          <strong>Ticket ID:</strong> {selectedTicket?.id}<br/>
                          <strong>URL:</strong> ${API_URL}/TicketConversation/{selectedTicket?.id}
                        </div>
                      ) : messages.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>
                          <div style={{ fontSize: '32px', marginBottom: '10px' }}><i className="fa-solid fa-comment-slash"></i></div>
                          <div style={{ fontSize: '13px', fontWeight: '600' }}>{t('agent.chat.noMessages')}</div>
                        </div>
                      ) : (
                        messages.map(msg => {
                          const isMe = msg.senderId === agentInfo.id;
                          const roleLabel = (msg.senderRole === 1 || msg.senderRole === 'Admin') ? 'Admin' : (msg.senderRole === 2 || msg.senderRole === 'SupportAgent') ? 'Agent' : 'Requester';
                          return (
                            <div key={msg.id} style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: '8px' }}>
                              <div style={{ width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0, backgroundColor: isMe ? '#3b82f6' : '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800', color: '#fff' }}>
                                {msg.senderName?.charAt(0).toUpperCase() || '?'}
                              </div>
                              <div style={{ maxWidth: '75%' }}>
                                <div style={{ fontSize: '10px', fontWeight: '700', marginBottom: '3px', color: isMe ? '#3b82f6' : '#8b5cf6', textAlign: isMe ? 'right' : 'left' }}>
                                  {isMe ? t('admin.placeholders.you') : msg.senderName}
                                  <span style={{ color: '#94a3b8', fontWeight: '400', marginLeft: '6px' }}>· {roleLabel}</span>
                                </div>
                                <div style={{ padding: '8px 12px', borderRadius: isMe ? '12px 12px 4px 12px' : '12px 12px 12px 4px', backgroundColor: isMe ? '#3b82f6' : '#fff', color: isMe ? '#fff' : '#1e293b', fontSize: '13px', lineHeight: '1.5', border: isMe ? 'none' : '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                  {msg.message}
                                </div>
                                <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '3px', textAlign: isMe ? 'right' : 'left' }}>
                                  {new Date(msg.createdDate).toLocaleString(t('lang') === 'en' ? 'en-US' : 'tr-TR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                    <div style={{ padding: '16px 20px', borderTop: '1px solid #e2e8f0', backgroundColor: '#fff' }}>
                      {isClosed ? (
                        <div style={{ textAlign: 'center', fontSize: '13px', color: '#94a3b8', fontWeight: '600' }}>🔒 {t('requester.detail.closed_info')}</div>
                      ) : (
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                          <textarea value={newMessage} onChange={e => setNewMessage(e.target.value)}
                            placeholder={t('agent.chat.placeholder')}
                            rows={2} style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', color: '#1e293b', outline: 'none', resize: 'none', fontFamily: "'Segoe UI', sans-serif" }} />
                          <button onClick={() => sendMessage(selectedTicket.id)} disabled={isSending || !newMessage.trim()}
                            style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', backgroundColor: isSending || !newMessage.trim() ? '#e2e8f0' : '#3b82f6', color: isSending || !newMessage.trim() ? '#94a3b8' : '#fff', fontWeight: '700', fontSize: '13px', cursor: isSending || !newMessage.trim() ? 'not-allowed' : 'pointer' }}>
                            {isSending ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-paper-plane"></i>}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {pendingRequests.length > 0 && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px', maxWidth: '340px' }}>

          <button
            onClick={() => setToastVisible(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 14px', borderRadius: '20px', border: 'none',
              backgroundColor: '#dc2626', color: '#fff',
              fontSize: '13px', fontWeight: '700', cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(220,38,38,0.4)',
              transition: 'all 0.2s',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#fff', color: '#dc2626', fontSize: '11px', fontWeight: '800' }}>
              {pendingRequests.length}
            </span>
            {t('agent.notifications.title')}
            <span style={{ fontSize: '10px', opacity: 0.8 }}>{toastVisible ? '▼' : '▲'}</span>
          </button>

          {toastVisible && pendingRequests.map((req, index) => (
            <div
              key={req.id}
              style={{
                width: '320px',
                backgroundColor: '#1e293b',
                borderRadius: '12px',
                border: '1px solid #2563eb',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                overflow: 'hidden',
                animation: 'slideIn 0.25s ease',
              }}
            >
              <div
                onClick={() => handleToastTicketClick(req)}
                style={{
                  padding: '14px 16px', cursor: 'pointer',
                  backgroundColor: '#0f172a',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1e3a5f'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#0f172a'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#60a5fa' }}>#{req.id} · {t('agent.transfer.title')}</span>
                  <span style={{ fontSize: '10px', color: '#475569' }}>{t('admin.actions.details')} →</span>
                </div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {req.title}
                </div>
                {req.description && (
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {req.description}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0', borderTop: '1px solid #1e3a5f' }}>
                <button
                  onClick={() => handleAcceptAssignment(req.id)}
                  disabled={!!pendingAction[req.id]}
                  style={{
                    flex: 1, padding: '10px', border: 'none',
                    backgroundColor: pendingAction[req.id] ? '#374151' : '#16a34a',
                    color: '#fff', fontWeight: '700', fontSize: '12px',
                    cursor: pendingAction[req.id] ? 'not-allowed' : 'pointer',
                    borderBottomLeftRadius: '12px',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (!pendingAction[req.id]) e.currentTarget.style.backgroundColor = '#15803d'; }}
                  onMouseLeave={e => { if (!pendingAction[req.id]) e.currentTarget.style.backgroundColor = '#16a34a'; }}
                >
                  {pendingAction[req.id] === 'accepting' ? t('agent.notifications.accepting') : t('agent.notifications.accept')}
                </button>
                <button
                  onClick={() => handleRejectAssignment(req.id)}
                  disabled={!!pendingAction[req.id]}
                  style={{
                    flex: 1, padding: '10px', border: 'none',
                    borderLeft: '1px solid #1e3a5f',
                    backgroundColor: pendingAction[req.id] ? '#374151' : '#dc2626',
                    color: '#fff', fontWeight: '700', fontSize: '12px',
                    cursor: pendingAction[req.id] ? 'not-allowed' : 'pointer',
                    borderBottomRightRadius: '12px',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (!pendingAction[req.id]) e.currentTarget.style.backgroundColor = '#b91c1c'; }}
                  onMouseLeave={e => { if (!pendingAction[req.id]) e.currentTarget.style.backgroundColor = '#dc2626'; }}
                >
                  {pendingAction[req.id] === 'rejecting' ? t('agent.notifications.rejecting') : t('agent.notifications.reject')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {showAssignModal && (
        <div onClick={(e) => { if (e.target === e.currentTarget) { setShowAssignModal(false); setAgentSearch(''); setRequestSuccess(false); } }}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(2px)' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '14px', width: '420px', maxHeight: '560px', boxShadow: '0 24px 64px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>{t('agent.transfer.title')}</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  <span style={{ fontWeight: '700', color: '#475569' }}>#{selectedTicket?.id}</span> — {selectedTicket?.title}
                </div>
              </div>
              <button onClick={() => { setShowAssignModal(false); setAgentSearch(''); setRequestSuccess(false); }}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8', padding: '4px', lineHeight: 1 }}>×</button>
            </div>

            {requestSuccess && (
              <div style={{ margin: '16px 24px 0', padding: '12px 16px', backgroundColor: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: '8px', color: '#065f46', fontSize: '13px', fontWeight: '600', textAlign: 'center' }}>
                {t('agent.transfer.success')}
              </div>
            )}

            {!requestSuccess && (
              <div style={{ padding: '16px 24px 8px' }}>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', pointerEvents: 'none' }}>🔍</span>
                  <input type="text" placeholder={t('agent.transfer.searchPlaceholder')} value={agentSearch} onChange={e => setAgentSearch(e.target.value)} autoFocus
                    style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', color: '#334155', outline: 'none', boxSizing: 'border-box', backgroundColor: '#f8fafc' }}
                    onFocus={e => e.target.style.borderColor = '#7c3aed'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                </div>
              </div>
            )}

            {!requestSuccess && (
              <div style={{ flex: 1, overflowY: 'auto', padding: '8px 24px 20px' }}>
                {agentsLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}><div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div><div style={{ fontSize: '13px' }}>{t('common.loading')}</div></div>
                ) : filteredAgents.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}><div style={{ fontSize: '24px', marginBottom: '8px' }}>🔍</div><div style={{ fontSize: '13px' }}>{t('agent.transfer.noAgents')}</div></div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {filteredAgents.map(agent => {
                      const displayName = agent.name || agent.fullName || agent.userName || `Ajan #${agent.id}`;
                      const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];
                      const avatarColor = colors[agent.id % colors.length];
                      return (
                        <button key={agent.id} onClick={() => handleRequestAssignment(agent.id, displayName)} disabled={isRequesting}
                          style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: isRequesting ? 'not-allowed' : 'pointer', textAlign: 'left', transition: 'all 0.15s', opacity: isRequesting ? 0.6 : 1 }}
                          onMouseEnter={e => { if (!isRequesting) { e.currentTarget.style.backgroundColor = '#f5f3ff'; e.currentTarget.style.borderColor = '#c4b5fd'; } }}
                          onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.borderColor = '#e2e8f0'; }}>
                          <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: avatarColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: '800', flexShrink: 0 }}>{displayName.charAt(0).toUpperCase()}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px' }}>ID: #{agent.id}</div>
                          </div>
                          <div style={{ fontSize: '16px', color: '#7c3aed', flexShrink: 0 }}>{isRequesting ? '⏳' : '→'}</div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {!requestSuccess && !agentsLoading && filteredAgents.length > 0 && (
              <div style={{ padding: '12px 24px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>{t('agent.transfer.hint')}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}