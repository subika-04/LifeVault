import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import {
  sendChatMessage,
  listChats,
  getChat,
  deleteChat,
  getInsights,
  search,
  dashboardStats,
} from '../controllers/aiController.js';

const router = Router();

router.use(protect);

router.post('/chat', sendChatMessage);
router.get('/chats', listChats);
router.get('/chats/:id', getChat);
router.delete('/chats/:id', deleteChat);

router.get('/insights', getInsights);
router.get('/search', search);
router.get('/dashboard-stats', dashboardStats);

export default router;
