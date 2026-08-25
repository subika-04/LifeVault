import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Vault,
  FileText,
  HardDrive,
  AlertTriangle,
  ArrowRight,
  Fingerprint,
  DollarSign,
  HeartPulse,
  Scale,
  Shield,
  GraduationCap,
  FolderOpen,
  Wallet,
  Clock,
} from 'lucide-react';
import CategoryBadge from '../components/CategoryBadge';
import EmptyState from '../components/EmptyState';
import { useToast } from '../context/ToastContext';
import { getVaultSummary, formatFileSize } from '../services/documentService';

const CATEGORY_ICONS = {
  identity: Fingerprint,
  financial: DollarSign,
  medical: HeartPulse,
  legal: Scale,
  insurance: Shield,
  education: GraduationCap,
  other: FolderOpen,
};

const VaultPage = () => {
  const { showToast } = useToast();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const { data } = await getVaultSummary();
        setSummary(data.data.summary);
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to load vault summary', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [showToast]);

  if (loading) {
    return (
      <div className="page">
        <div className="page-loading">
          <div className="loading-spinner" />
          <p>Loading vault...</p>
        </div>
      </div>
    );
  }

  const categories = summary
    ? Object.entries(summary.countsByCategory).filter(([, count]) => count > 0)
    : [];

  const isVaultEmpty =
    (summary?.totalDocuments ?? 0) === 0 &&
    (summary?.totalAssets ?? 0) === 0 &&
    (summary?.totalExpenses ?? 0) === 0 &&
    (summary?.totalReminders ?? 0) === 0;

  return (
    <div className="page">
      <div className="page-header page-header--row">
        <div>
          <h1 className="page-title">Vault</h1>
          <p className="page-subtitle">Your secure digital vault for important life data</p>
        </div>
        <Link to="/documents" className="btn btn--primary">
          <FileText size={18} />
          Manage Documents
        </Link>
      </div>

      <div className="dashboard-grid">
        <div className="stat-card stat-card--primary">
          <div className="stat-card__icon">
            <FileText size={24} />
          </div>
          <div>
            <p className="stat-card__label">Documents</p>
            <p className="stat-card__value">{summary?.totalDocuments ?? 0}</p>
            <p className="stat-card__sub" style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              {formatFileSize(summary?.totalStorage ?? 0)} storage
            </p>
          </div>
        </div>

        <div className="stat-card stat-card--secondary">
          <div className="stat-card__icon">
            <Wallet size={24} />
          </div>
          <div>
            <p className="stat-card__label">Assets</p>
            <p className="stat-card__value">{summary?.totalAssets ?? 0}</p>
            <p className="stat-card__sub" style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              Valuables tracked
            </p>
          </div>
        </div>

        <div className="stat-card stat-card--accent">
          <div className="stat-card__icon">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="stat-card__label">Expenses</p>
            <p className="stat-card__value">{summary?.totalExpenses ?? 0}</p>
            <p className="stat-card__sub" style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              Recorded costs
            </p>
          </div>
        </div>

        <div className="stat-card stat-card--cyan">
          <div className="stat-card__icon">
            <Clock size={24} />
          </div>
          <div>
            <p className="stat-card__label">Active Reminders</p>
            <p className="stat-card__value">{summary?.totalReminders ?? 0}</p>
            <p className="stat-card__sub" style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              Pending schedules
            </p>
          </div>
        </div>
      </div>

      {isVaultEmpty ? (
        <EmptyState
          icon={Vault}
          title="Your vault is empty"
          description="Start by uploading your important documents like IDs, insurance policies, or adding physical assets."
          action={
            <div style={{ display: 'flex', gap: '10px' }}>
              <Link to="/documents" className="btn btn--primary">
                <FileText size={18} />
                Upload Documents
              </Link>
              <Link to="/assets" className="btn btn--ghost">
                <Wallet size={18} />
                Add Asset
              </Link>
            </div>
          }
        />
      ) : (
        <>
          {/* Quick Shortcuts Grid */}
          <section className="vault-section">
            <h2 className="vault-section__title">Vault Categories</h2>
            <div className="vault-categories">
              {/* Document categories */}
              {Object.entries(summary.countsByCategory).map(([cat, count]) => {
                const Icon = CATEGORY_ICONS[cat] || FolderOpen;
                return (
                  <Link
                    key={cat}
                    to={`/documents?category=${cat}`}
                    className={`vault-category-card ${count === 0 ? 'vault-category-card--empty' : ''}`}
                  >
                    <div className="vault-category-card__icon">
                      <Icon size={22} />
                    </div>
                    <div className="vault-category-card__info">
                      <CategoryBadge category={cat} />
                      <span className="vault-category-card__count">
                        {count} document{count !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <ArrowRight size={16} className="vault-category-card__arrow" />
                  </Link>
                );
              })}

              {/* Assets shortcut */}
              <Link to="/assets" className="vault-category-card">
                <div className="vault-category-card__icon" style={{ color: 'var(--color-secondary-500)', background: 'rgba(14, 165, 233, 0.1)' }}>
                  <Wallet size={22} />
                </div>
                <div className="vault-category-card__info">
                  <span className="category-badge category-badge--other">Assets</span>
                  <span className="vault-category-card__count">
                    {summary.totalAssets} asset{summary.totalAssets !== 1 ? 's' : ''} tracked
                  </span>
                </div>
                <ArrowRight size={16} className="vault-category-card__arrow" />
              </Link>

              {/* Expenses shortcut */}
              <Link to="/expenses" className="vault-category-card">
                <div className="vault-category-card__icon" style={{ color: 'var(--color-success)', background: 'rgba(16, 185, 129, 0.1)' }}>
                  <DollarSign size={22} />
                </div>
                <div className="vault-category-card__info">
                  <span className="category-badge category-badge--financial">Expenses</span>
                  <span className="vault-category-card__count">
                    {summary.totalExpenses} transactions logged
                  </span>
                </div>
                <ArrowRight size={16} className="vault-category-card__arrow" />
              </Link>

              {/* Reminders shortcut */}
              <Link to="/reminders" className="vault-category-card">
                <div className="vault-category-card__icon" style={{ color: 'var(--color-accent-500)', background: 'rgba(217, 70, 239, 0.1)' }}>
                  <Clock size={22} />
                </div>
                <div className="vault-category-card__info">
                  <span className="category-badge category-badge--medical">Reminders</span>
                  <span className="vault-category-card__count">
                    {summary.totalReminders} pending tasks
                  </span>
                </div>
                <ArrowRight size={16} className="vault-category-card__arrow" />
              </Link>
            </div>
          </section>

          {/* Expiring Soon Section */}
          {summary.expiringSoon?.length > 0 && (
            <section className="vault-section">
              <h2 className="vault-section__title">
                <AlertTriangle size={20} />
                Documents expiring in the next {summary.expiringSoonDays} days
              </h2>
              <div className="expiring-list">
                {summary.expiringSoon.map((doc) => (
                  <div key={doc._id} className="expiring-item">
                    <div>
                      <p className="expiring-item__title">{doc.title}</p>
                      <CategoryBadge category={doc.category} />
                    </div>
                    <span className="expiring-item__date">
                      {new Date(doc.expiryDate).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default VaultPage;
