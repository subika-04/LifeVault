import { useState, useEffect } from 'react';
import { User, Pencil, Check, X, Shield, Lock, FileText, Wallet, DollarSign, Clock, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { updateProfile } from '../services/documentService';
import { getDashboardStats } from '../services/aiService';

const calculateMemberDuration = (createdAt) => {
  if (!createdAt) return '';
  const createdDate = new Date(createdAt);
  const now = new Date();
  
  const diffTime = Math.abs(now - createdDate);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Joined today';
  if (diffDays === 1) return 'Joined yesterday';
  
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 0) return `${diffDays} days membership`;
  
  const diffYears = Math.floor(diffMonths / 12);
  if (diffYears === 0) return `${diffMonths} months membership`;
  
  return `${diffYears} years membership`;
};

const Profile = () => {
  const { user, loadUser } = useAuth();
  const { showToast } = useToast();
  
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await getDashboardStats();
        setStats(data.data);
      } catch (err) {
        console.error('Failed to load profile stats:', err);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const startEditing = () => {
    setName(user?.name || '');
    setPassword('');
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setName('');
    setPassword('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      const payload = { name: name.trim() };
      if (password.trim()) {
        if (password.length < 6) {
          showToast('Password must be at least 6 characters', 'error');
          setSaving(false);
          return;
        }
        payload.password = password;
      }
      
      await updateProfile(payload);
      await loadUser();
      showToast('Profile updated successfully');
      setEditing(false);
      setPassword('');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Profile Settings</h1>
          <p className="page-subtitle">Manage your account credentials and personal vault statistics</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        {/* Profile details */}
        <div className="profile-card" style={{ display: 'flex', flexDirection: 'column', mdDirection: 'row', gap: '1.5rem', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', width: '100%', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '1.5rem' }}>
            <div className="profile-card__avatar">
              <User size={40} />
            </div>
            <div className="profile-card__info" style={{ flex: 1 }}>
              {editing ? (
                <form className="profile-edit-form" onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '400px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Display Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      required
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>New Password (leave blank to keep current)</label>
                    <input
                      type="password"
                      className="form-input"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="New password"
                    />
                  </div>
                  <div className="profile-edit-form__actions" style={{ marginTop: '4px' }}>
                    <button type="submit" className="btn btn--primary btn--sm" disabled={saving}>
                      <Check size={16} />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button type="button" className="btn btn--ghost btn--sm" onClick={cancelEditing}>
                      <X size={16} />
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="profile-card__name-row">
                    <h2>{user?.name}</h2>
                    <button
                      type="button"
                      className="profile-card__edit-btn"
                      onClick={startEditing}
                      title="Edit Profile"
                    >
                      <Pencil size={16} />
                    </button>
                  </div>
                  <p style={{ color: 'var(--color-text-muted)' }}>{user?.email}</p>
                </>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={15} />
              <span>Joined: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Shield size={15} />
              <span>{calculateMemberDuration(user?.createdAt)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lock size={15} />
              <span>Security: Standard JWT</span>
            </div>
          </div>
        </div>

        {/* Vault Statistics Panel */}
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--color-primary-300)' }}>Account Statistics</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="stat-card stat-card--primary">
              <div className="stat-card__icon">
                <FileText size={22} />
              </div>
              <div>
                <p className="stat-card__label">Documents Uploaded</p>
                <p className="stat-card__value">{statsLoading ? '—' : stats?.documentsCount ?? 0}</p>
              </div>
            </div>

            <div className="stat-card stat-card--secondary">
              <div className="stat-card__icon">
                <Wallet size={22} />
              </div>
              <div>
                <p className="stat-card__label">Valuable Assets</p>
                <p className="stat-card__value">{statsLoading ? '—' : stats?.assetsCount ?? 0}</p>
              </div>
            </div>

            <div className="stat-card stat-card--accent">
              <div className="stat-card__icon">
                <DollarSign size={22} />
              </div>
              <div>
                <p className="stat-card__label">Monthly Spend</p>
                <p className="stat-card__value">
                  {statsLoading ? '—' : `₹${(stats?.monthlySpend ?? 0).toLocaleString('en-IN')}`}
                </p>
              </div>
            </div>

            <div className="stat-card stat-card--cyan">
              <div className="stat-card__icon">
                <Clock size={22} />
              </div>
              <div>
                <p className="stat-card__label">Urgent Expirations</p>
                <p className="stat-card__value">{statsLoading ? '—' : stats?.urgentCount ?? 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
