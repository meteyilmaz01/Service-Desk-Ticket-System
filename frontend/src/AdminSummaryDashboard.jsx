import { useEffect, useState } from 'react';
import axios from 'axios';
import { useLanguage } from './LanguageContext';
import './AdminSummaryDashboard.css';

const API_URL = `${import.meta.env.VITE_API_URL}/api`;

export default function AdminSummaryDashboard() {
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAdminData = async () => {
      const token = localStorage.getItem('userToken');
      if (!token) {
        setError(t('login.error_msg'));
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(`${API_URL}/Dashboard/admin`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(res.data);
      } catch (err) {
        console.error(err);
        setError(t('common.error'));
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  if (loading) return <div className="admin-summary loading">{t('common.loading')}</div>;
  if (error) return <div className="admin-summary error">{error}</div>;
  if (!data) return null;

  const {
    totalTickets, openTickets, pendingTickets, todayTickets,
    waitingForAgent, waitingForRequester,
    byDepartment, byPriority, recentTickets, busyAgents, weeklyTrend
  } = data;

  const maxDeptCount = Math.max(...byDepartment.map(d => d.count), 1);
  const maxWeeklyCount = Math.max(...weeklyTrend.map(w => w.count), 1);

  const getPriorityLabel = (p) => {
    switch (p) {
      case 5: return t('priority.critical');
      case 4: return t('priority.high');
      case 3: return t('priority.normal');
      case 2: return t('priority.low');
      case 1: return t('priority.verylow');
      default: return t('priority.unspecified');
    }
  };

  const statusStyle = (s) => {
    const lower = s?.toLowerCase() || '';
    if (lower.includes('open')) return { backgroundColor: '#fef3c7', color: '#92400e' };
    if (lower.includes('assigned')) return { backgroundColor: '#e0e7ff', color: '#3730a3' };
    if (lower.includes('resolved')) return { backgroundColor: '#d1fae5', color: '#065f46' };
    if (lower.includes('closed')) return { backgroundColor: '#f1f5f9', color: '#475569' };
    if (lower.includes('progress')) return { backgroundColor: '#dbeafe', color: '#1e40af' };
    return { backgroundColor: '#f3f4f6', color: '#1f2937' };
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f1f5f9', overflow: 'hidden' }}>
      <div style={{
        width: '240px', flexShrink: 0, backgroundColor: '#0f172a',
        display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto'
      }}>
        <div style={{ padding: '28px 20px', borderBottom: '1px solid #1e293b' }}>
          <div style={{ fontSize: '10px', color: '#475569', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '6px' }}>{t('admin.sidebar.title')}</div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#f8fafc' }}>{t('admin.headers.summary')}</div>
        </div>
        <nav style={{ padding: '16px 12px', flex: 1 }}>
          {[
            { key: 'dashboard', icon: '📊', label: t('admin.sidebar.summary'), active: true },
            { key: 'admin', icon: '⚙️', label: t('admin.sidebar.panel') },
          ].map(item => (
            <button key={item.key} onClick={() => { if (item.key === 'admin') window.location.href='/admin'; }} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              marginBottom: '4px', textAlign: 'left', fontSize: '13px', fontWeight: '600',
              backgroundColor: item.active ? '#3b82f6' : 'transparent',
              color: item.active ? '#fff' : '#94a3b8',
              transition: 'all 0.15s ease',
            }}>
              <span>{item.icon}</span> {item.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: '16px 12px', borderTop: '1px solid #1e293b' }}>
          <button onClick={() => { localStorage.removeItem('userToken'); window.location.href='/'; }} style={{
            width: '100%', padding: '10px', borderRadius: '8px', border: 'none',
            backgroundColor: '#dc2626', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer'
          }}>
            {t('admin.sidebar.logout')}
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
        <h1>{t('admin.headers.summary')}</h1>

      <div className="dashboard-row">
        <div className="summary-card stat-item total-tickets">
          <span className="label">{t('admin.stats.totalTickets')}</span>
          <span className="value">{totalTickets}</span>
        </div>
        <div className="summary-card stat-item open-tickets">
          <span className="label">{t('admin.stats.openTickets')}</span>
          <span className="value">{openTickets}</span>
        </div>
        <div className="summary-card stat-item pending-tickets">
          <span className="label">{t('admin.stats.pendingTickets')}</span>
          <span className="value">{pendingTickets}</span>
        </div>
        <div className="summary-card stat-item today-tickets">
          <span className="label">{t('admin.stats.todayTickets')}</span>
          <span className="value">{todayTickets}</span>
        </div>
      </div>

      {}
      <div className="dashboard-row">
        <div className="summary-card half-width">
          <h3>{t('convStatus.title')}</h3>
          <div className="conv-stat-container">
            <div className="conv-stat-item">
              <span className="val">{waitingForAgent}</span>
              <span className="lbl">{t('convStatus.waitingAgent')}</span>
            </div>
            <div className="divider" style={{ borderLeft: '1px solid #e2e8f0', height: '40px' }} />
            <div className="conv-stat-item">
              <span className="val">{waitingForRequester}</span>
              <span className="lbl">{t('convStatus.waitingUser')}</span>
            </div>
          </div>
        </div>

        <div className="summary-card half-width">
          <h3>{t('admin.placeholders.dept_dist')}</h3>
          <div className="chart-container-h">
            {byDepartment.map((d, i) => (
              <div key={i} className="bar-row">
                <div className="bar-label" title={d.departmentName}>{d.departmentName}</div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(d.count / maxDeptCount) * 100}%` }} />
                </div>
                <div className="bar-count">{d.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {}
      <div className="dashboard-row">
        <div className="summary-card half-width">
          <h3>{t('admin.placeholders.priority_levels')}</h3>
          <div className="badge-list">
            {[5, 4, 3, 2, 1].map(p => {
              const item = byPriority.find(bp => bp.priority === p) || { count: 0 };
              return (
                <div key={p} className="priority-badge-row">
                  <span className={`badge-pill p-${p}`}>{getPriorityLabel(p)}</span>
                  <span style={{ fontWeight: 700 }}>{item.count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="summary-card half-width">
          <h3>{t('admin.placeholders.busy_agents')}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
            {busyAgents.map((a, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontWeight: 500 }}>{a.agentName}</span>
                <span className="badge-pill" style={{ background: '#e0e7ff', color: '#3730a3' }}>{a.ticketCount} {t('admin.headers.ticketMgmt')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {}
      <div className="dashboard-row">
        <div className="summary-card full-width">
          <h3>{t('admin.placeholders.weekly_trend')}</h3>
          <div className="chart-container-v">
            {weeklyTrend.map((w, i) => (
              <div key={i} className="v-bar-item">
                <div className="v-bar-track">
                  <div className="v-bar-fill" style={{ height: `${(w.count / maxWeeklyCount) * 100}%` }} />
                </div>
                <span className="v-bar-date">{new Date(w.date).toLocaleDateString(t('lang') === 'en' ? 'en-US' : 'tr-TR', { weekday: 'short', day: 'numeric' })}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {}
      <div className="dashboard-row">
        <div className="summary-card full-width" style={{ padding: 0, overflow: 'hidden' }}>
          <h3 style={{ padding: '1.5rem 1.5rem 0.5rem 1.5rem' }}>{t('admin.placeholders.recent_activities')}</h3>
          <table className="recent-table">
            <thead>
              <tr>
                <th>{t('common.id')}</th>
                <th>{t('admin.placeholders.title')}</th>
                <th>{t('admin.placeholders.status')}</th>
                <th>{t('admin.placeholders.priority')}</th>
                <th>{t('admin.placeholders.date')}</th>
              </tr>
            </thead>
            <tbody>
              {recentTickets.map((ticket, i) => (
                <tr key={i}>
                  <td>#{ticket.id}</td>
                  <td style={{ fontWeight: 600 }}>{ticket.title}</td>
                  <td>
                    <span className="status-badge" style={statusStyle(ticket.status)}>
                      {ticket.status ? t(`status.${ticket.status.toLowerCase()}`) : '-'}
                    </span>
                  </td>
                  <td>
                     <span className={`badge-pill p-${ticket.priority}`}>{getPriorityLabel(ticket.priority)}</span>
                  </td>
                  <td style={{ color: '#64748b' }}>
                    {new Date(ticket.createdAt).toLocaleDateString(t('lang') === 'en' ? 'en-US' : 'tr-TR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      </div>
    </div>
  );
}
