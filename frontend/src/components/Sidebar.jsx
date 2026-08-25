import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Vault,
  FileText,
  Wallet,
  Receipt,
  Bell,
  Clock,
  Sparkles,
  User,
  LogOut,
  X,
  Shield,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/vault', label: 'Vault', icon: Vault },
  { to: '/documents', label: 'Documents', icon: FileText },
  { to: '/assets', label: 'Assets', icon: Wallet },
  { to: '/expenses', label: 'Expenses', icon: Receipt },
  { to: '/reminders', label: 'Reminders', icon: Bell },
  { to: '/timeline', label: 'Timeline', icon: Clock },
  { to: '/ai', label: 'AI Assistant', icon: Sparkles },
  { to: '/profile', label: 'Profile', icon: User },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <div
        className={`sidebar-overlay ${isOpen ? 'sidebar-overlay--visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar__header">
          <div className="sidebar__brand">
            <div className="sidebar__logo">
              <Shield size={22} />
            </div>
            <div>
              <h1 className="sidebar__title">LifeVault</h1>
              <p className="sidebar__subtitle">Secure Life Hub</p>
            </div>
          </div>
          <button
            type="button"
            className="sidebar__close"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar__nav">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
              }
              onClick={onClose}
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__user">
            <div className="sidebar__avatar">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="sidebar__user-info">
              <p className="sidebar__user-name">{user?.name || 'User'}</p>
              <p className="sidebar__user-email">{user?.email || ''}</p>
            </div>
          </div>
          <button type="button" className="sidebar__logout" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
