import { getDashboardStats } from '../services/insightService.js';

/**
 * GET /api/dashboard
 * 
 * Returns the aggregated statistics and data needed by the Dashboard UI,
 * scoped specifically to the authenticated user.
 */
export const getDashboardData = async (req, res, next) => {
  try {
    const stats = await getDashboardStats(req.user._id);
    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};
