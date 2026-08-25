import { useState, useEffect, useCallback } from 'react';
import { DollarSign, Plus, Search, Trash2, Edit2, Calendar, CreditCard, Tag } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { getExpenses, createExpense, updateExpense, deleteExpense, EXPENSE_CATEGORIES, PAYMENT_METHODS } from '../services/expenseService';
import { useToast } from '../context/ToastContext';
import EmptyState from '../components/EmptyState';

const COLORS = [
  '#6366f1', // Indigo
  '#0ea5e9', // Blue/Cyan
  '#d946ef', // Pink/Violet
  '#10b981', // Emerald
  '#f59e0b', // Amber/Orange
  '#ef4444', // Rose/Red
  '#84cc16', // Lime
  '#a855f7', // Purple
  '#64748b', // Slate
];

const Expenses = () => {
  const { showToast } = useToast();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  const [form, setForm] = useState({
    amount: '',
    category: 'Food',
    description: '',
    date: '',
    paymentMethod: 'Card',
  });

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getExpenses({
        search: search || undefined,
        category: category !== 'all' ? category : undefined,
      });
      setExpenses(data.data.expenses);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load expenses', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, category, showToast]);

  useEffect(() => {
    const timer = setTimeout(fetchExpenses, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchExpenses, search]);

  const handleOpenModal = (expense = null) => {
    if (expense) {
      setEditingExpense(expense);
      setForm({
        amount: expense.amount || '',
        category: expense.category || 'Food',
        description: expense.description || '',
        date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : '',
        paymentMethod: expense.paymentMethod || 'Card',
      });
    } else {
      setEditingExpense(null);
      setForm({
        amount: '',
        category: 'Food',
        description: '',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'Card',
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingExpense(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || !form.category || !form.description) {
      showToast('Amount, Category, and Description are required', 'error');
      return;
    }

    if (Number(form.amount) <= 0) {
      showToast('Amount must be greater than zero', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        amount: Number(form.amount),
        date: form.date || new Date().toISOString(),
      };

      if (editingExpense) {
        await updateExpense(editingExpense._id, payload);
        showToast('Expense updated successfully');
      } else {
        await createExpense(payload);
        showToast('Expense added successfully');
      }
      handleCloseModal();
      fetchExpenses();
    } catch (err) {
      showToast(err.response?.data?.message || 'Operation failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (expense) => {
    if (!window.confirm(`Delete "${expense.description}" of ${formatCurrency(expense.amount)}?`)) return;
    try {
      await deleteExpense(expense._id);
      showToast('Expense deleted');
      fetchExpenses();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete expense', 'error');
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  // Calculate stats
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyTotal = expenses
    .filter((exp) => {
      const d = new Date(exp.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, exp) => sum + exp.amount, 0);

  const grandTotal = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Group by category for pie chart
  const categoryData = EXPENSE_CATEGORIES.map((cat) => {
    const total = expenses
      .filter((exp) => exp.category === cat.value)
      .reduce((sum, exp) => sum + exp.amount, 0);
    return { name: cat.label, value: total };
  }).filter((item) => item.value > 0);

  // Group by month for bar chart (last 6 months)
  const getMonthlyTimelineData = () => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(now.getMonth() - i);
      months.push({
        label: d.toLocaleDateString('en-IN', { month: 'short' }),
        monthNum: d.getMonth(),
        yearNum: d.getFullYear(),
        amount: 0,
      });
    }

    expenses.forEach((exp) => {
      const expDate = new Date(exp.date);
      const mIdx = months.findIndex(
        (m) => m.monthNum === expDate.getMonth() && m.yearNum === expDate.getFullYear()
      );
      if (mIdx !== -1) {
        months[mIdx].amount += exp.amount;
      }
    });

    return months;
  };

  const barChartData = getMonthlyTimelineData();

  return (
    <div className="page">
      <div className="page-header page-header--row">
        <div>
          <h1 className="page-title">Expenses</h1>
          <p className="page-subtitle">
            Organize and review your spending habits
            {expenses.length > 0 && ` · ${expenses.length} records`}
          </p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => handleOpenModal()}>
          <Plus size={18} />
          Add Expense
        </button>
      </div>

      {/* Analytics Panels */}
      {!loading && expenses.length > 0 && (
        <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', marginBottom: '1.5rem' }}>
          <div className="stat-card stat-card--primary">
            <div className="stat-card__icon">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="stat-card__label">Monthly Spend ({now.toLocaleDateString('en-IN', { month: 'long' })})</p>
              <p className="stat-card__value">{formatCurrency(monthlyTotal)}</p>
            </div>
          </div>

          <div className="stat-card stat-card--secondary">
            <div className="stat-card__icon">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="stat-card__label">Total Recorded Spend</p>
              <p className="stat-card__value">{formatCurrency(grandTotal)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Charts panel */}
      {!loading && expenses.length > 0 && (
        <div className="dashboard-panels" style={{ marginBottom: '1.5rem' }}>
          <div className="dashboard-card">
            <div className="dashboard-card__header">
              <h2>Spending Trend (Last 6 Months)</h2>
            </div>
            <div style={{ width: '100%', height: '240px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip
                    formatter={(val) => [formatCurrency(val), 'Amount']}
                    contentStyle={{
                      background: '#1a1a2e',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 8,
                      color: '#f1f5f9',
                    }}
                  />
                  <Bar dataKey="amount" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="dashboard-card__header">
              <h2>Category Breakdown</h2>
            </div>
            {categoryData.length > 0 ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
                <div style={{ width: '50%', height: '200px', position: 'relative' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val) => formatCurrency(val)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ width: '50%', display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '1rem', fontSize: '0.85rem' }}>
                  {categoryData.slice(0, 5).map((entry, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: COLORS[idx % COLORS.length], display: 'inline-block' }} />
                      <span style={{ flex: 1, color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.name}</span>
                      <span style={{ fontWeight: 600 }}>{formatCurrency(entry.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="ai-insight-card__empty">No data to display</p>
            )}
          </div>
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="documents-toolbar">
        <div className="search-bar">
          <Search size={18} className="search-bar__icon" />
          <input
            type="text"
            className="search-bar__input"
            placeholder="Search expenses by description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="category-filters">
          <button
            type="button"
            className={`filter-btn ${category === 'all' ? 'filter-btn--active' : ''}`}
            onClick={() => setCategory('all')}
          >
            All
          </button>
          {EXPENSE_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              className={`filter-btn ${category === cat.value ? 'filter-btn--active' : ''}`}
              onClick={() => setCategory(cat.value)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Expense List */}
      {loading ? (
        <div className="documents-grid" style={{ gridTemplateColumns: '1fr' }}>
          <div className="document-card skeleton-card" style={{ height: '80px' }} />
          <div className="document-card skeleton-card" style={{ height: '80px' }} />
          <div className="document-card skeleton-card" style={{ height: '80px' }} />
        </div>
      ) : expenses.length === 0 ? (
        <EmptyState
          icon={DollarSign}
          title="No expenses found"
          description={search || category !== 'all' ? 'Try adjusting your filters.' : 'Track your expenses to see analytics charts immediately.'}
          action={
            !(search || category !== 'all') && (
              <button type="button" className="btn btn--primary" onClick={() => handleOpenModal()}>
                <Plus size={18} />
                Add Expense
              </button>
            )
          }
        />
      ) : (
        <div style={{ background: 'var(--color-bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="expenses-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: '1rem', color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Description</th>
                  <th style={{ padding: '1rem', color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Category</th>
                  <th style={{ padding: '1rem', color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Date</th>
                  <th style={{ padding: '1rem', color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Method</th>
                  <th style={{ padding: '1rem', color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600, textAlign: 'right' }}>Amount</th>
                  <th style={{ padding: '1rem', color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center', width: '100px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp) => (
                  <tr key={exp._id} className="table-row-hover" style={{ borderBottom: '1px solid var(--color-border)', transition: 'background var(--transition-fast)' }}>
                    <td style={{ padding: '1rem', fontWeight: 500 }}>{exp.description}</td>
                    <td style={{ padding: '1rem' }}>
                      <span className={`category-badge category-badge--${exp.category.toLowerCase()}`} style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                        {exp.category}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                      {new Date(exp.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{exp.paymentMethod}</td>
                    <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-success)', textAlign: 'right' }}>
                      {formatCurrency(exp.amount)}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          type="button"
                          className="document-card__action"
                          onClick={() => handleOpenModal(exp)}
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          className="document-card__action document-card__action--danger"
                          onClick={() => handleDelete(exp)}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expense Modal Form */}
      {modalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>{editingExpense ? 'Edit Expense' : 'Add Expense'}</h2>
              <button type="button" className="modal__close" onClick={handleCloseModal}>
                <Plus size={20} style={{ transform: 'rotate(45deg)' }} />
              </button>
            </div>

            <form className="modal__form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="description">Description *</label>
                <input
                  id="description"
                  name="description"
                  type="text"
                  className="form-input"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="e.g. Weekly Groceries, Gas Bill"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="amount">Amount (₹) *</label>
                  <input
                    id="amount"
                    name="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    className="form-input"
                    value={form.amount}
                    onChange={handleChange}
                    placeholder="e.g. 1500"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="category">Category *</label>
                  <select
                    id="category"
                    name="category"
                    className="form-input"
                    value={form.category}
                    onChange={handleChange}
                    required
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="date">Date *</label>
                  <input
                    id="date"
                    name="date"
                    type="date"
                    className="form-input"
                    value={form.date}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="paymentMethod">Payment Method</label>
                  <select
                    id="paymentMethod"
                    name="paymentMethod"
                    className="form-input"
                    value={form.paymentMethod}
                    onChange={handleChange}
                  >
                    {PAYMENT_METHODS.map((pm) => (
                      <option key={pm.value} value={pm.value}>
                        {pm.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal__actions">
                <button type="button" className="btn btn--ghost" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editingExpense ? 'Save Changes' : 'Add Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
