import api from './api';

export const ASSET_CATEGORIES = [
  { value: 'electronics', label: 'Electronics' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'vehicle', label: 'Vehicle' },
  { value: 'appliance', label: 'Appliance' },
  { value: 'jewelry', label: 'Jewelry' },
  { value: 'property', label: 'Property' },
  { value: 'investment', label: 'Investment' },
  { value: 'other', label: 'Other' },
];

export const getAssets = (params = {}) =>
  api.get('/assets', { params });

export const getAsset = (id) =>
  api.get(`/assets/${id}`);

export const createAsset = (data) =>
  api.post('/assets', data);

export const updateAsset = (id, data) =>
  api.put(`/assets/${id}`, data);

export const deleteAsset = (id) =>
  api.delete(`/assets/${id}`);
