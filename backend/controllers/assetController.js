import {
  getAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
} from '../services/assetService.js';
import { ASSET_CATEGORIES } from '../models/Asset.js';

export const listAssets = async (req, res, next) => {
  try {
    const { category, search } = req.query;
    const assets = await getAssets(req.user._id, { category, search });

    res.status(200).json({
      success: true,
      data: { assets },
    });
  } catch (error) {
    next(error);
  }
};

export const getAsset = async (req, res, next) => {
  try {
    const asset = await getAssetById(req.user._id, req.params.id);

    res.status(200).json({
      success: true,
      data: { asset },
    });
  } catch (error) {
    next(error);
  }
};

export const createAssetHandler = async (req, res, next) => {
  try {
    const { name, category, brand, model, purchaseDate, purchasePrice, warrantyExpiry, serialNumber, notes } = req.body;

    if (!name || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide asset name and category',
      });
    }

    if (!ASSET_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid asset category',
      });
    }

    const asset = await createAsset(req.user._id, {
      name,
      category,
      brand,
      model,
      purchaseDate,
      purchasePrice,
      warrantyExpiry,
      serialNumber,
      notes,
    });

    res.status(201).json({
      success: true,
      data: { asset },
    });
  } catch (error) {
    next(error);
  }
};

export const updateAssetHandler = async (req, res, next) => {
  try {
    const { name, category, brand, model, purchaseDate, purchasePrice, warrantyExpiry, serialNumber, notes } = req.body;

    if (category && !ASSET_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid asset category',
      });
    }

    const asset = await updateAsset(req.user._id, req.params.id, {
      name,
      category,
      brand,
      model,
      purchaseDate,
      purchasePrice,
      warrantyExpiry,
      serialNumber,
      notes,
    });

    res.status(200).json({
      success: true,
      data: { asset },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAssetHandler = async (req, res, next) => {
  try {
    await deleteAsset(req.user._id, req.params.id);

    res.status(200).json({
      success: true,
      message: 'Asset deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
