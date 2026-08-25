import Chat from '../models/Chat.js';
import { generateGroundedAnswer, generateDashboardInsights, smartSearch, getDashboardStats } from '../services/insightService.js';

/**
 * POST /api/ai/chat
 * body: { message: string, chatId?: string }
 *
 * Always scoped to req.user._id (from JWT) — never trusts a userId
 * from the request body. Creates a new chat if chatId is omitted.
 */
export const sendChatMessage = async (req, res, next) => {
  try {
    const { message, chatId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    let chat;
    if (chatId) {
      chat = await Chat.findOne({ _id: chatId, userId: req.user._id });
      if (!chat) {
        return res.status(404).json({ success: false, message: 'Chat not found' });
      }
    } else {
      chat = await Chat.create({
        userId: req.user._id,
        title: message.trim().slice(0, 60),
        messages: [],
      });
    }

    chat.messages.push({ role: 'user', content: message.trim(), timestamp: new Date() });

    const answer = await generateGroundedAnswer(req.user._id, message.trim(), chat.messages);

    chat.messages.push({ role: 'assistant', content: answer, timestamp: new Date() });
    await chat.save();

    res.status(200).json({
      success: true,
      data: {
        chatId: chat._id,
        title: chat.title,
        answer,
        messages: chat.messages,
      },
    });
  } catch (error) {
    next(error);
  }
};

/** GET /api/ai/chats */
export const listChats = async (req, res, next) => {
  try {
    const chats = await Chat.find({ userId: req.user._id })
      .sort({ updatedAt: -1 })
      .select('title messages createdAt updatedAt');

    const summarized = chats.map((chat) => ({
      _id: chat._id,
      title: chat.title,
      messageCount: chat.messages.length,
      lastMessage: chat.messages[chat.messages.length - 1]?.content || '',
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    }));

    res.status(200).json({ success: true, data: { chats: summarized } });
  } catch (error) {
    next(error);
  }
};

/** GET /api/ai/chats/:id */
export const getChat = async (req, res, next) => {
  try {
    const chat = await Chat.findOne({ _id: req.params.id, userId: req.user._id });
    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }
    res.status(200).json({ success: true, data: { chat } });
  } catch (error) {
    next(error);
  }
};

/** DELETE /api/ai/chats/:id */
export const deleteChat = async (req, res, next) => {
  try {
    const chat = await Chat.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }
    res.status(200).json({ success: true, message: 'Chat deleted' });
  } catch (error) {
    next(error);
  }
};

/** GET /api/ai/insights */
export const getInsights = async (req, res, next) => {
  try {
    const result = await generateDashboardInsights(req.user._id);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/** GET /api/ai/search?q=... */
export const search = async (req, res, next) => {
  try {
    const { q } = req.query;
    const results = await smartSearch(req.user._id, q);
    res.status(200).json({ success: true, data: { results, query: q || '' } });
  } catch (error) {
    next(error);
  }
};

/** GET /api/ai/dashboard-stats */
export const dashboardStats = async (req, res, next) => {
  try {
    const stats = await getDashboardStats(req.user._id);
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};
