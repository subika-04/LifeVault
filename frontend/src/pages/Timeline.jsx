import { useState, useEffect } from 'react';
import { Calendar, FileText, Wallet, DollarSign, Clock, AlertTriangle, Shield, Archive } from 'lucide-react';
import { getVaultTimeline } from '../services/documentService';
import { useToast } from '../context/ToastContext';
import EmptyState from '../components/EmptyState';

const EVENT_TYPE_STYLES = {
  document: {
    color: 'var(--color-primary-500)',
    bg: 'rgba(99, 102, 241, 0.1)',
    icon: FileText,
  },
  expiry: {
    color: 'var(--color-error)',
    bg: 'rgba(239, 68, 68, 0.1)',
    icon: AlertTriangle,
  },
  asset: {
    color: 'var(--color-secondary-500)',
    bg: 'rgba(14, 165, 233, 0.1)',
    icon: Wallet,
  },
  warranty: {
    color: 'var(--color-warning)',
    bg: 'rgba(245, 158, 11, 0.1)',
    icon: Shield,
  },
  expense: {
    color: 'var(--color-success)',
    bg: 'rgba(16, 185, 129, 0.1)',
    icon: DollarSign,
  },
  reminder: {
    color: 'var(--color-accent-500)',
    bg: 'rgba(217, 70, 239, 0.1)',
    icon: Clock,
  },
};

const Timeline = () => {
  const { showToast } = useToast();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        const { data } = await getVaultTimeline();
        setEvents(data.data.timeline);
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to load timeline events', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchTimeline();
  }, [showToast]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const getEventDateString = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Group events by Month and Year (e.g. "August 2026")
  const getGroupedEvents = () => {
    const groups = {};
    events.forEach((event) => {
      const d = new Date(event.date);
      const groupKey = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(event);
    });
    return Object.entries(groups);
  };

  const grouped = getGroupedEvents();

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Timeline</h1>
          <p className="page-subtitle">A chronological journal of your life documents, purchases, expenses, and reminders</p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '1rem' }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="document-card skeleton-card" style={{ height: '100px' }} />
          ))}
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Timeline is empty"
          description="Timeline brings together purchases, expenses, warranties, document creations, and reminders chronologically. Start adding data to see your timeline build."
        />
      ) : (
        <div className="timeline-container" style={{ position: 'relative', paddingLeft: '1.5rem', marginLeft: '0.75rem' }}>
          {/* Vertical line connector */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: '1rem',
              bottom: '1rem',
              width: '2px',
              background: 'linear-gradient(to bottom, var(--color-primary-500) 0%, var(--color-accent-500) 100%)',
              opacity: 0.3,
            }}
          />

          {grouped.map(([monthYear, monthEvents]) => (
            <div key={monthYear} style={{ marginBottom: '2.5rem' }}>
              {/* Group Header */}
              <div
                style={{
                  position: 'relative',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {/* Node on vertical line */}
                <div
                  style={{
                    position: 'absolute',
                    left: '-1.85rem',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: 'var(--color-primary-500)',
                    border: '3px solid var(--color-bg)',
                    boxShadow: '0 0 10px var(--color-primary-500)',
                  }}
                />
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-primary-300)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {monthYear}
                </h2>
              </div>

              {/* Events in month */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {monthEvents.map((event) => {
                  const style = EVENT_TYPE_STYLES[event.type] || {
                    color: 'var(--color-text-muted)',
                    bg: 'rgba(255,255,255,0.05)',
                    icon: Archive,
                  };
                  const Icon = style.icon;

                  return (
                    <div
                      key={event.id}
                      className="document-card table-row-hover"
                      style={{
                        position: 'relative',
                        display: 'flex',
                        gap: '1rem',
                        alignItems: 'flex-start',
                        padding: '1.25rem',
                        marginLeft: '0.25rem',
                        transition: 'transform var(--transition-base), box-shadow var(--transition-base)',
                      }}
                    >
                      {/* Event icon circle */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: style.bg,
                          color: style.color,
                          flexShrink: 0,
                          boxShadow: `0 0 15px ${style.bg}`,
                        }}
                      >
                        <Icon size={18} />
                      </div>

                      {/* Event content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap' }}>
                          <h4 style={{ margin: 0, fontSize: '0.975rem', fontWeight: 600 }}>{event.title}</h4>
                          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                            {getEventDateString(event.date)}
                          </span>
                        </div>
                        {event.subtitle && (
                          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {event.subtitle}
                          </p>
                        )}
                        {event.amount != null && (
                          <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-success)' }}>
                              {formatPrice(event.amount)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Quick formatting helper for price inside timeline
const formatPrice = (price) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price || 0);
};

export default Timeline;
