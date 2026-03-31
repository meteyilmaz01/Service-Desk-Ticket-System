import { useEffect, useState } from 'react';
import axios from 'axios';
import { useLanguage } from './LanguageContext';
import './PublicDashboard.css';

const API_URL = `${import.meta.env.VITE_API_URL}/api`;

export default function PublicDashboard() {
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API_URL}/Dashboard/public`);
        setData(res.data);
      } catch (e) {
        setError(t('common.error'));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [t]);

  if (loading) return <div className="public-dashboard loading">{t('common.loading')}</div>;
  if (error) return <div className="public-dashboard error">{error}</div>;

  const { resolvedThisMonth, averageResolutionHours, activeDepartmentCount, activeAgentCount, systemStatus } = data;

  const cards = [
    { label: t('public.stats.resolved'), value: resolvedThisMonth, icon: '✅' },
    { label: t('public.stats.avg_time'), value: Math.abs(averageResolutionHours).toFixed(1), icon: '⏱️' },
    { label: t('public.stats.active_dept'), value: activeDepartmentCount, icon: '🏢' },
    { label: t('public.stats.active_agent'), value: activeAgentCount, icon: '👤' },
  ];

  return (
    <div className="public-dashboard">
      <section className="hero">
        <h1>{t('public.welcome')}</h1>
        <p>{t('public.hero_sub')}</p>
        <button className="cta" onClick={() => window.location.href = '/login'}>{t('public.cta_button')}</button>
      </section>

      <section className="stats">
        {cards.map((c, i) => (
          <div key={i} className="stat-card">
            <div className="icon">{c.icon}</div>
            <div className="value">{c.value}</div>
            <div className="label">{c.label}</div>
          </div>
        ))}
      </section>

      {systemStatus === 'Operational' && (
        <section className="system-status">
          <span className="status-badge">{t('public.system_status')}</span>
        </section>
      )}
    </div>
  );
}
