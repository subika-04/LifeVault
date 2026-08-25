import api from './api';

const API_BASE = (import.meta.env.VITE_API_URL || 'https://lifevault-nzm0.onrender.com/api').replace(/\/api\/?$/, '');

export const getFileUrl = (fileUrl) => {
  if (!fileUrl) return '';
  if (fileUrl.startsWith('http')) return fileUrl;
  return `${API_BASE}${fileUrl}`;
};

export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
};

export const DOCUMENT_CATEGORIES = [
  { value: 'identity', label: 'Identity' },
  { value: 'financial', label: 'Financial' },
  { value: 'medical', label: 'Medical' },
  { value: 'legal', label: 'Legal' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'education', label: 'Education' },
  { value: 'other', label: 'Other' },
];

export const getDocuments = (params = {}) =>
  api.get('/documents', { params });

export const getDocument = (id) =>
  api.get(`/documents/${id}`);

export const createDocument = (formData) =>
  api.post('/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const updateDocument = (id, data) =>
  api.put(`/documents/${id}`, data);

export const deleteDocument = (id) =>
  api.delete(`/documents/${id}`);

export const analyzeDocument = (id) =>
  api.post(`/documents/${id}/analyze`);

export const getVaultSummary = () =>
  api.get('/vault/summary');

export const getVaultTimeline = () =>
  api.get('/vault/timeline');

export const updateProfile = (data) =>
  api.put('/auth/profile', data);
