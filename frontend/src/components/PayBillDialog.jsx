import { useState, useEffect } from 'react';
import { Plus, CheckCircle2 } from 'lucide-react';
import { EXPENSE_CATEGORIES } from '../services/expenseService';

// Mirrors billPaymentService.mapToExpenseCategory on the backend — only
// used to pre-fill the dialog nicely; the backend re-derives this itself
// if the category is left blank, so this never needs to be authoritative.
const CATEGORY_RULES = [
  { category: 'Utilities', keywords: ['electric', 'power', 'current', 'water', 'gas', 'lpg', 'cylinder', 'internet', 'wifi', 'broadband', 'isp', 'phone', 'mobile', 'recharge', 'telecom', 'utility', 'utilities', 'dth', 'cable'] },
  { category: 'Subscription', keywords: ['subscription', 'netflix', 'prime', 'hotstar', 'spotify', 'ott', 'membership'] },
  { category: 'Healthcare', keywords: ['health', 'medical', 'hospital', 'pharmacy', 'clinic', 'doctor'] },
  { category: 'Electronics', keywords: ['electronics', 'laptop', 'gadget', 'appliance', 'warranty'] },
  { category: 'Transport', keywords: ['transport', 'travel', 'fuel', 'cab', 'taxi', 'flight', 'vehicle', 'car'] },
  { category: 'Shopping', keywords: ['shopping', 'purchase', 'order', 'retail'] },
  { category: 'Food', keywords: ['food', 'restaurant', 'grocery', 'grocer'] },
];
const guessCategory = (bill) => {
  const haystack = `${bill?.title || ''} ${bill?.description || ''}`.toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((kw) => haystack.includes(kw))) return rule.category;
  }
  return 'Other';
};

/**
 * "I Have Paid This Bill" confirmation dialog — shared between the
 * Reminders page (paying via a Reminder) and the Dashboard's Needs Your
 * Attention card (paying via a Document, when no active Reminder exists
 * for it). Purely presentational: the caller supplies `bill` (needs
 * `title`, `dueDate`, optionally `amount`/`description`) and receives
 * the confirmed `{ amount, date, category }` via `onConfirm` — it never
 * calls the API itself, so either caller can wire it to whichever
 * backend entry point (reminder- or document-based) fits.
 */
const PayBillDialog = ({ bill, onConfirm, onClose, confirming }) => {
  const [form, setForm] = useState({ amount: '', date: '', category: '' });

  useEffect(() => {
    if (bill) {
      setForm({
        amount: bill.amount != null ? bill.amount : '',
        date: new Date().toISOString().split('T')[0],
        category: guessCategory(bill),
      });
    }
  }, [bill]);

  if (!bill) return null;

  const handleConfirm = () => {
    if (!form.amount || Number(form.amount) <= 0) return;
    onConfirm({
      amount: Number(form.amount),
      date: form.date,
      category: form.category || undefined,
    });
  };

  return (
    <div className="modal-overlay" onClick={confirming ? undefined : onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <div className="modal__header">
          <h2>Have you paid this bill?</h2>
          <button type="button" className="modal__close" onClick={onClose} disabled={confirming}>
            <Plus size={20} style={{ transform: 'rotate(45deg)' }} />
          </button>
        </div>

        <div style={{ padding: '0 1.5rem 1.5rem' }}>
          <div
            style={{
              background: 'var(--color-bg-input)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              marginBottom: '1.25rem',
            }}
          >
            <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '1rem' }}>{bill.title}</p>
            {bill.dueDate && (
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                Due {new Date(bill.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="payAmount">Amount Paid (₹) *</label>
            <input
              id="payAmount"
              type="number"
              min="0.01"
              step="0.01"
              className="form-input"
              value={form.amount}
              onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label htmlFor="payDate">Payment Date</label>
              <input
                id="payDate"
                type="date"
                className="form-input"
                value={form.date}
                onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label htmlFor="payCategory">Category</label>
              <select
                id="payCategory"
                className="form-input"
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <ul style={{ margin: '1rem 0 0', paddingLeft: '1.1rem', fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
            <li>The bill will be marked as <strong>PAID</strong></li>
            <li>An expense will be created</li>
            <li>Any related reminder will be removed</li>
            <li>The AI assistant will reflect the updated status</li>
          </ul>
        </div>

        <div className="modal__actions">
          <button type="button" className="btn btn--ghost" onClick={onClose} disabled={confirming}>
            Cancel
          </button>
          <button type="button" className="btn btn--primary" onClick={handleConfirm} disabled={confirming}>
            <CheckCircle2 size={16} />
            {confirming ? 'Recording...' : 'Yes, I Paid It'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PayBillDialog;
