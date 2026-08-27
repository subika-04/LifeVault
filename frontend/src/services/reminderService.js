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

// Part 9 — the single, explicit action point for resolving a bill
// reminder. payload: { amount, category, paymentMethod, date } — all
// optional; the backend falls back to the reminder's/document's own
// data for anything omitted.
export const markReminderPaid = (id, payload = {}) =>
  api.post(`/reminders/${id}/mark-paid`, payload);
