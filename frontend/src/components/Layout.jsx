import { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Menu, Search, FileText, Loader2, Wallet, DollarSign, Clock } from 'lucide-react';
import Sidebar from './Sidebar';
import { smartSearch } from '../services/aiService';

const GlobalSearch = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  const runSearch = useCallback(async (q) => {
    if (!q.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data } = await smartSearch(q);
      setResults(data.data.results);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => runSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, runSearch]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const goToResult = (result) => {
    setOpen(false);
    setQuery('');
    if (result.type === 'asset') {
      navigate(`/assets?search=${encodeURIComponent(result.title)}`);
    } else if (result.type === 'expense') {
      navigate(`/expenses?search=${encodeURIComponent(result.title)}`);
    } else if (result.type === 'reminder') {
      navigate(`/reminders`);
    } else {
      navigate(`/documents?search=${encodeURIComponent(result.title)}`);
    }
  };

  const getResultIcon = (type) => {
    if (type === 'asset') return <Wallet size={15} style={{ color: 'var(--color-secondary-500)' }} />;
    if (type === 'expense') return <DollarSign size={15} style={{ color: 'var(--color-success)' }} />;
    if (type === 'reminder') return <Clock size={15} style={{ color: 'var(--color-accent-500)' }} />;
    return <FileText size={15} style={{ color: 'var(--color-primary-500)' }} />;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price || 0);
  };

  return (
    <div className="global-search" ref={containerRef}>
      <div className="global-search__input">
        <Search size={16} />
        <input
          type="text"
          placeholder="Search documents, assets, expenses, reminders..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
        {loading && <Loader2 size={14} className="spin" />}
      </div>

      {open && query.trim() && (
        <div className="global-search__dropdown">
          {loading ? (
            <p className="global-search__empty">Searching…</p>
          ) : results.length === 0 ? (
            <p className="global-search__empty">No matches in your LifeVault.</p>
          ) : (
            results.map((r) => (
              <button
                type="button"
                key={r.id}
                className="global-search__result"
                onClick={() => goToResult(r)}
              >
                {getResultIcon(r.type)}
                <span className="global-search__result-main">
                  <span className="global-search__result-title">{r.title}</span>
                  {r.subtitle && (
                    <span className="global-search__result-subtitle">{r.subtitle}</span>
                  )}
                </span>
                {r.amount != null && (
                  <span className="global-search__result-amount">
                    {formatPrice(r.amount)}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="layout__main">
        <header className="layout__header">
          <button
            type="button"
            className="layout__menu-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          <div className="layout__header-title">
            <span className="layout__header-badge">LifeVault</span>
          </div>
          <GlobalSearch />
        </header>

        <main className="layout__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
