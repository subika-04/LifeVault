import { useState, useEffect, useCallback } from 'react';
import { FileText, TrendingUp, AlertTriangle, Sparkles, RefreshCw, Wallet, Clock, ArrowRight, IndianRupee, RotateCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getDashboardStats, getInsights } from '../services/aiService';
import { markReminderPaid } from '../services/reminderService';
import { createDocument, markDocumentPaid } from '../services/documentService';
import PayBillDialog from '../components/PayBillDialog';
import UploadDocumentModal from '../components/UploadDocumentModal';

const CATEGORY_LABELS = {
  identity: 'Identity',
  financial: 'Financial',
  medical: 'Medical',
  legal: 'Legal',
  insurance: 'Insurance',
  education: 'Education',
  other: 'Other',
};

const formatCurrency = (value, currency = 'INR') => {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value || 0);
  } catch {
    return `₹${(value || 0).toLocaleString('en-IN')}`;
  }
};

const Dashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const firstName = user?.name?.split(' ')[0] || 'there';

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [insights, setInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(true);

  // "I Have Paid This Bill" from the Needs Your Attention card — works
  // for both reminder-sourced and document-sourced bill alerts.
  const [payingItem, setPayingItem] = useState(null);
  const [payConfirming, setPayConfirming] = useState(false);

  // "Renew" a plain expiring document (not a bill) from the same card.
  const [renewingItem, setRenewingItem] = useState(null);
  const [renewSubmitting, setRenewSubmitting] = useState(false);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const { data } = await getDashboardStats();
      setStats(data.data);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load dashboard stats', 'error');
    } finally {
      setStatsLoading(false);
    }
  }, [showToast]);

  const loadInsights = useCallback(async () => {
    setInsightsLoading(true);
    try {
      const { data } = await getInsights();
      setInsights(data.data);
    } catch {
      setInsights({ status: 'unavailable', insights: [], message: 'AI insights are temporarily unavailable.' });
    } finally {
      setInsightsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
    loadInsights();
  }, [loadStats, loadInsights]);

  // Part 8 — Payment -> Reminder sync: keep dashboard counts (urgent
  // alerts, Needs Your Attention) live without a manual page reload.
  useEffect(() => {
    const handler = () => loadStats();
    window.addEventListener('lifevault:reminders-updated', handler);
    return () => window.removeEventListener('lifevault:reminders-updated', handler);
  }, [loadStats]);

  const chartData = (stats?.categoryBreakdown || []).map((c) => ({
    name: CATEGORY_LABELS[c.category] || c.category,
    count: c.count,
  }));

  const getAttentionBadgeClass = (priority) => {
    if (priority === 'Overdue') return 'badge--danger';
    if (priority === 'Urgent') return 'badge--warning';
    return 'badge--primary';
  };

  const handleOpenPay = (item) => setPayingItem(item);
  const handleClosePay = () => setPayingItem(null);

  const handleConfirmPay = async (payload) => {
    if (!payingItem) return;
    setPayConfirming(true);
    try {
      const { data } =
        payingItem.sourceType === 'reminder'
          ? await markReminderPaid(payingItem.id, payload)
          : await markDocumentPaid(payingItem.id, payload);

      showToast(
        data.data?.alreadyPaid
          ? data.message
          : 'Payment recorded — bill marked paid, expense added, reminder cleared.'
      );
      setPayingItem(null);
      loadStats();
      window.dispatchEvent(new CustomEvent('lifevault:reminders-updated'));
    } catch (err) {
      showToast(
        err.response?.data?.message ||
          "We couldn't record this payment. Nothing was changed. Please try again.",
        'error'
      );
    } finally {
      setPayConfirming(false);
    }
  };

  const handleOpenRenew = (item) => setRenewingItem(item);
  const handleCloseRenew = () => setRenewingItem(null);

  const handleRenewSubmit = async (formData) => {
    setRenewSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('title', formData.title);
      fd.append('category', formData.category);
      fd.append('description', formData.description || '');
      if (formData.expiryDate) fd.append('expiryDate', formData.expiryDate);
      if (formData.tags) fd.append('tags', formData.tags);
      fd.append('renewsDocumentId', formData.renewsDocumentId);
      fd.append('file', formData.file);
      await createDocument(fd);
      showToast('Renewal uploaded — old document archived');
      setRenewingItem(null);
      loadStats();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to upload renewal', 'error');
    } finally {
      setRenewSubmitting(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Hello, {firstName}! 👋</h1>
          <p className="page-subtitle">Welcome to your LifeVault dashboard</p>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="stat-card stat-card--primary">
          <div className="stat-card__icon">
            <FileText size={24} />
          </div>
          <div>
            <p className="stat-card__label">Documents</p>
            <p className="stat-card__value">{statsLoading ? '—' : stats?.documentsCount ?? 0}</p>
          </div>
        </div>

        <div className="stat-card stat-card--secondary">
          <div className="stat-card__icon">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="stat-card__label">Monthly Spend</p>
            <p className="stat-card__value">
              {statsLoading ? '—' : formatCurrency(stats?.monthlySpend)}
            </p>
          </div>
        </div>

        <div className="stat-card stat-card--accent">
          <div className="stat-card__icon">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="stat-card__label">Urgent Alerts</p>
            <p className="stat-card__value">{statsLoading ? '—' : stats?.urgentCount ?? 0}</p>
          </div>
        </div>

        <div className="stat-card stat-card--cyan">
          <div className="stat-card__icon">
            <Wallet size={24} />
          </div>
          <div>
            <p className="stat-card__label">Assets Tracked</p>
            <p className="stat-card__value">
              {statsLoading ? '—' : stats?.assetsCount ?? 0}
            </p>
          </div>
        </div>
      </div>

      <div className="dashboard-panels">
        {/* AI Insight Card */}
        <div className="dashboard-card ai-insight-card">
          <div className="dashboard-card__header">
            <h2>
              <Sparkles size={18} /> AI Insight
            </h2>
            <button
              type="button"
              className="dashboard-card__refresh"
              onClick={loadInsights}
              disabled={insightsLoading}
              title="Refresh insights"
            >
              <RefreshCw size={15} className={insightsLoading ? 'spin' : ''} />
            </button>
          </div>

          {insightsLoading ? (
            <p className="ai-insight-card__loading">✨ AI is analyzing your LifeVault…</p>
          ) : insights?.status === 'ok' && insights.insights.length > 0 ? (
            <ul className="ai-insight-card__list">
              {insights.insights.map((text, i) => (
                <li key={i}>{text}</li>
              ))}
            </ul>
          ) : (
            <p className="ai-insight-card__empty">
              {insights?.message || 'Not enough data yet to generate insights.'}
            </p>
          )}
        </div>

        {/* Needs Your Attention Card */}
        <div className="dashboard-card">
          <div className="dashboard-card__header">
            <h2>
              <AlertTriangle size={18} className="text-warning" /> Needs Your Attention
            </h2>
          </div>
          {statsLoading ? (
            <p className="ai-insight-card__loading">Loading alerts…</p>
          ) : !stats?.needsAttention || stats.needsAttention.length === 0 ? (
            <p className="ai-insight-card__empty">Everything is up to date! No urgent items found.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {stats.needsAttention.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 12px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '8px',
                    borderLeft: `4px solid ${
                      item.priority === 'Overdue'
                        ? 'var(--color-error)'
                        : item.priority === 'Urgent'
                        ? 'var(--color-warning)'
                        : 'var(--color-primary-500)'
                    }`,
                  }}
                >
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>{item.title}</p>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      {item.type}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`badge ${getAttentionBadgeClass(item.priority)}`} style={{ fontSize: '0.7rem' }}>
                      {item.priority === 'Overdue'
                        ? 'Overdue'
                        : item.daysLeft === 0
                        ? 'Due Today'
                        : item.daysLeft === 1
                        ? 'Due tomorrow'
                        : `Expires in ${item.daysLeft} days`}
                    </span>
                    {item.isBill && (
                      <button
                        type="button"
                        className="btn btn--primary btn--sm"
                        onClick={() => handleOpenPay(item)}
                      >
                        <IndianRupee size={13} />
                        I Have Paid This Bill
                      </button>
                    )}
                    {item.isRenewable && (
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => handleOpenRenew(item)}
                      >
                        <RotateCw size={13} />
                        Renew
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category breakdown Card */}
        <div className="dashboard-card" style={{ gridColumn: 'span 2' }}>
          <div className="dashboard-card__header" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h2>Documents by Category</h2>
            <Link to="/vault" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
              Vault Summary <ArrowRight size={14} />
            </Link>
          </div>
          {statsLoading ? (
            <p className="ai-insight-card__loading">Loading…</p>
          ) : chartData.length === 0 ? (
            <p className="ai-insight-card__empty">Upload documents to see category breakdown.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: '#1a1a2e',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 8,
                    color: '#f1f5f9',
                  }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* "I Have Paid This Bill" — from a Needs Your Attention bill alert */}
      <PayBillDialog
        bill={
          payingItem
            ? { title: payingItem.title, dueDate: payingItem.dueDate, amount: payingItem.amount }
            : null
        }
        confirming={payConfirming}
        onConfirm={handleConfirmPay}
        onClose={payConfirming ? undefined : handleClosePay}
      />

      {/* "Renew" — upload a fresh copy of an expiring (non-bill) document */}
      <UploadDocumentModal
        isOpen={Boolean(renewingItem)}
        onClose={renewSubmitting ? undefined : handleCloseRenew}
        onSubmit={handleRenewSubmit}
        document={null}
        renewsDocument={
          renewingItem
            ? { _id: renewingItem.id, title: renewingItem.title.replace(/ \(Warranty\)$/, '') }
            : null
        }
        loading={renewSubmitting}
      />
    </div>
  );
};

export default Dashboard;
