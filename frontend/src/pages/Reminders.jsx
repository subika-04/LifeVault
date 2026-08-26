import { useState, useEffect, useCallback } from 'react';
import { Calendar, Plus, Trash2, Edit2, CheckSquare, Square, AlertCircle, Clock, RefreshCw } from 'lucide-react';
import { getReminders, createReminder, updateReminder, deleteReminder, reconcilePayments, PRIORITIES } from '../services/reminderService';
import { useToast } from '../context/ToastContext';
import EmptyState from '../components/EmptyState';

const Reminders = () => {
  const { showToast } = useToast();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [reconciling, setReconciling] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'Medium',
    amount: '',
  });

  const fetchReminders = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getReminders({
        priority: priorityFilter !== 'all' ? priorityFilter : undefined,
        isCompleted: statusFilter === 'Completed' ? 'true' : statusFilter === 'Active' ? 'false' : undefined,
      });
      setReminders(data.data.reminders);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load reminders', 'error');
    } finally {
      setLoading(false);
    }
  }, [priorityFilter, statusFilter, showToast]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  // Part 8 — Payment -> Reminder sync: if an expense recorded elsewhere in
  // the app auto-completed a reminder, refresh this list live instead of
  // requiring a manual reload.
  useEffect(() => {
    const handler = () => fetchReminders();
    window.addEventListener('lifevault:reminders-updated', handler);
    return () => window.removeEventListener('lifevault:reminders-updated', handler);
  }, [fetchReminders]);

  // Retroactively re-checks pending reminders against existing expenses —
  // covers a payment that was recorded before it could auto-match (e.g.
  // before this feature existed, or before a matching fix shipped).
  const handleReconcilePayments = async () => {
    setReconciling(true);
    try {
      const { data } = await reconcilePayments();
      showToast(data.message);
      if (data.data?.completedReminders?.length > 0) {
        fetchReminders();
        window.dispatchEvent(new CustomEvent('lifevault:reminders-updated'));
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to sync payments', 'error');
    } finally {
      setReconciling(false);
    }
  };

  const handleOpenModal = (reminder = null) => {
    if (reminder) {
      setEditingReminder(reminder);
      setForm({
        title: reminder.title || '',
        description: reminder.description || '',
        dueDate: reminder.dueDate ? new Date(reminder.dueDate).toISOString().split('T')[0] : '',
        priority: reminder.priority || 'Medium',
        amount: reminder.amount != null ? reminder.amount : '',
      });
    } else {
      setEditingReminder(null);
      setForm({
        title: '',
        description: '',
        dueDate: '',
        priority: 'Medium',
        amount: '',
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingReminder(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.dueDate) {
      showToast('Title and Due Date are required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        amount: form.amount === '' ? null : Number(form.amount),
      };

      if (editingReminder) {
        await updateReminder(editingReminder._id, payload);
        showToast('Reminder updated successfully');
      } else {
        await createReminder(payload);
        showToast('Reminder created successfully');
      }
      handleCloseModal();
      fetchReminders();
    } catch (err) {
      showToast(err.response?.data?.message || 'Operation failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleComplete = async (reminder) => {
    try {
      await updateReminder(reminder._id, {
        isCompleted: !reminder.isCompleted,
      });
      showToast(reminder.isCompleted ? 'Reminder active again' : 'Reminder completed! 🎉');
      fetchReminders();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update reminder', 'error');
    }
  };

  const handleDelete = async (reminder) => {
    if (!window.confirm(`Delete "${reminder.title}"?`)) return;
    try {
      await deleteReminder(reminder._id);
      showToast('Reminder deleted');
      fetchReminders();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete reminder', 'error');
    }
  };

  const getStatusDetails = (reminder) => {
    if (reminder.isCompleted) {
      return { label: 'Completed', class: 'badge--success', icon: null };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(reminder.dueDate);
    due.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: 'Overdue', class: 'badge--danger', icon: AlertCircle };
    } else if (diffDays === 0) {
      return { label: 'Due Today', class: 'badge--warning', icon: Clock };
    } else if (diffDays <= 3) {
      return { label: 'Due Soon', class: 'badge--warning', icon: Clock };
    } else {
      return { label: 'Upcoming', class: 'badge--primary', icon: null };
    }
  };

  return (
    <div className="page">
      <div className="page-header page-header--row">
        <div>
          <h1 className="page-title">Reminders</h1>
          <p className="page-subtitle">
            Never miss important bills, insurances, or tasks again
            {reminders.length > 0 && ` · ${reminders.length} total`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={handleReconcilePayments}
            disabled={reconciling}
            title="Re-check pending reminders against your existing expenses — useful if a payment didn't auto-match"
          >
            <RefreshCw size={18} className={reconciling ? 'spin' : ''} />
            {reconciling ? 'Syncing...' : 'Sync Payments'}
          </button>
          <button type="button" className="btn btn--primary" onClick={() => handleOpenModal()}>
            <Plus size={18} />
            Add Reminder
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="documents-toolbar" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Status:</span>
            <select
              className="form-input"
              style={{ width: '130px', padding: '0.4rem 0.6rem' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="Active">Active Only</option>
              <option value="Completed">Completed Only</option>
            </select>
          </div>

          <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Priority:</span>
            <select
              className="form-input"
              style={{ width: '130px', padding: '0.4rem 0.6rem' }}
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="all">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reminders List */}
      {loading ? (
        <div className="documents-grid" style={{ gridTemplateColumns: '1fr' }}>
          <div className="document-card skeleton-card" style={{ height: '70px' }} />
          <div className="document-card skeleton-card" style={{ height: '70px' }} />
          <div className="document-card skeleton-card" style={{ height: '70px' }} />
        </div>
      ) : reminders.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No reminders found"
          description="Create a reminder to get notified about warranties, bills, or insurance renewals."
          action={
            statusFilter === 'all' && priorityFilter === 'all' && (
              <button type="button" className="btn btn--primary" onClick={() => handleOpenModal()}>
                <Plus size={18} />
                Add Reminder
              </button>
            )
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {reminders.map((reminder) => {
            const status = getStatusDetails(reminder);
            const StatusIcon = status.icon;
            return (
              <div
                key={reminder._id}
                className={`document-card ${reminder.isCompleted ? 'reminder-completed' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1.25rem',
                  opacity: reminder.isCompleted ? 0.65 : 1,
                  transition: 'opacity var(--transition-base), transform var(--transition-base)',
                  flexDirection: 'row',
                }}
              >
                {/* Complete Checkbox */}
                <button
                  type="button"
                  style={{ color: 'var(--color-primary-400)', display: 'flex', alignItems: 'center' }}
                  onClick={() => handleToggleComplete(reminder)}
                  title={reminder.isCompleted ? 'Mark Active' : 'Mark Completed'}
                >
                  {reminder.isCompleted ? <CheckSquare size={22} /> : <Square size={22} />}
                </button>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <h3
                      className="document-card__title"
                      style={{
                        margin: 0,
                        fontSize: '1rem',
                        textDecoration: reminder.isCompleted ? 'line-through' : 'none',
                        color: reminder.isCompleted ? 'var(--color-text-muted)' : 'var(--color-text)',
                      }}
                    >
                      {reminder.title}
                    </h3>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <span className={`badge badge--${reminder.priority.toLowerCase()}`} style={{ fontSize: '0.7rem', padding: '1px 6px' }}>
                        {reminder.priority} Priority
                      </span>
                      <span className={`badge ${status.class}`} style={{ fontSize: '0.7rem', padding: '1px 6px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        {StatusIcon && <StatusIcon size={10} />}
                        {status.label}
                      </span>
                      {reminder.source === 'document' && (
                        <span
                          className="badge badge--primary"
                          style={{ fontSize: '0.7rem', padding: '1px 6px' }}
                          title="Automatically created from an analyzed document"
                        >
                          Auto · Document
                        </span>
                      )}
                      {reminder.isCompleted && reminder.completedByExpense && (
                        <span
                          className="badge badge--success"
                          style={{ fontSize: '0.7rem', padding: '1px 6px' }}
                          title="Automatically completed when a matching expense was recorded"
                        >
                          Auto · Paid
                        </span>
                      )}
                    </div>
                  </div>
                  {reminder.description && (
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                      {reminder.description}
                    </p>
                  )}
                </div>

                {/* Meta & Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  {reminder.amount != null && (
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)' }}>
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(reminder.amount)}
                    </span>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    <Calendar size={14} />
                    <span>
                      {new Date(reminder.dueDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <div style={{ display: 'inline-flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="document-card__action"
                      onClick={() => handleOpenModal(reminder)}
                      title="Edit"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      className="document-card__action document-card__action--danger"
                      onClick={() => handleDelete(reminder)}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reminder modal form */}
      {modalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>{editingReminder ? 'Edit Reminder' : 'Add Reminder'}</h2>
              <button type="button" className="modal__close" onClick={handleCloseModal}>
                <Plus size={20} style={{ transform: 'rotate(45deg)' }} />
              </button>
            </div>

            <form className="modal__form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="title">Title *</label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  className="form-input"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. Renew car insurance, Pay electricity bill"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  className="form-input form-textarea"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Optional details or instructions"
                  rows={3}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="dueDate">Due Date *</label>
                  <input
                    id="dueDate"
                    name="dueDate"
                    type="date"
                    className="form-input"
                    value={form.dueDate}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="priority">Priority</label>
                  <select
                    id="priority"
                    name="priority"
                    className="form-input"
                    value={form.priority}
                    onChange={handleChange}
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="amount">Bill Amount (₹) — optional</label>
                <input
                  id="amount"
                  name="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-input"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="e.g. 750 — lets LifeVault auto-match a future payment"
                />
              </div>

              <div className="modal__actions">
                <button type="button" className="btn btn--ghost" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editingReminder ? 'Save Changes' : 'Create Reminder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reminders;
