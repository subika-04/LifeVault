import { getVaultSummary, getVaultTimeline } from '../services/vaultService.js';

export const getSummary = async (req, res, next) => {
  try {
    const summary = await getVaultSummary(req.user._id);

    res.status(200).json({
      success: true,
      data: { summary },
    });
  } catch (error) {
    next(error);
  }
};

export const getTimeline = async (req, res, next) => {
  try {
    const timeline = await getVaultTimeline(req.user._id);

    res.status(200).json({
      success: true,
      data: { timeline },
    });
  } catch (error) {
    next(error);
  }
};
