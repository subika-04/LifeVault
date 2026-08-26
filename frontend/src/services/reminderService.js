import api from './api';

export const PRIORITIES = [
  { value: 'High', label: 'High' },
  { value: 'Medium', label: 'Medium' },
  { value: 'Low', label: 'Low' },
];

export const getReminders = (params = {}) =>
  api.get('/reminders', { params });

export const getReminder = (id) =>
  api.get(`/reminders/${id}`);

export const createReminder = (data) =>
  api.post('/reminders', data);

export const updateReminder = (id, data) =>
  api.put(`/reminders/${id}`, data);

export const deleteReminder = (id) =>
  api.delete(`/reminders/${id}`);

export const reconcilePayments = () =>
  api.post('/reminders/reconcile-payments');
