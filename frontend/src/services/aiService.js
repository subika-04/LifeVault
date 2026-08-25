import api from './api';

export const sendChatMessage = (message, chatId) =>
  api.post('/ai/chat', { message, chatId });

export const getChats = () => api.get('/ai/chats');

export const getChat = (id) => api.get(`/ai/chats/${id}`);

export const deleteChat = (id) => api.delete(`/ai/chats/${id}`);

export const getInsights = () => api.get('/ai/insights');

export const smartSearch = (query) =>
  api.get('/ai/search', { params: { q: query } });

export const getDashboardStats = () => api.get('/dashboard');

export const SUGGESTED_QUESTIONS = [
  'Which warranties expire soon?',
  'How much have I spent in total?',
  'What documents do I have?',
  'Show me everything related to insurance.',
];
