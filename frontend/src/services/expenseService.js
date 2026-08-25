import api from './api';

export const EXPENSE_CATEGORIES = [
  { value: 'Food', label: 'Food' },
  { value: 'Transport', label: 'Transport' },
  { value: 'Electronics', label: 'Electronics' },
  { value: 'Utilities', label: 'Utilities' },
  { value: 'Shopping', label: 'Shopping' },
  { value: 'Healthcare', label: 'Healthcare' },
  { value: 'Entertainment', label: 'Entertainment' },
  { value: 'Subscription', label: 'Subscription' },
  { value: 'Other', label: 'Other' },
];

export const PAYMENT_METHODS = [
  { value: 'Cash', label: 'Cash' },
  { value: 'Card', label: 'Card' },
  { value: 'UPI', label: 'UPI' },
  { value: 'Net Banking', label: 'Net Banking' },
  { value: 'Other', label: 'Other' },
];

export const getExpenses = (params = {}) =>
  api.get('/expenses', { params });

export const getExpense = (id) =>
  api.get(`/expenses/${id}`);

export const createExpense = (data) =>
  api.post('/expenses', data);

export const updateExpense = (id, data) =>
  api.put(`/expenses/${id}`, data);

export const deleteExpense = (id) =>
  api.delete(`/expenses/${id}`);
