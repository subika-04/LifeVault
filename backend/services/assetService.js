import Asset from '../models/Asset.js';

export const getAssets = async (userId, { category, search } = {}) => {
  const query = { user: userId };

  if (category && category !== 'all') {
    query.category = category;
  }

  if (search) {
    const regex = new RegExp(search, 'i');
    query.$or = [
      { name: regex },
      { brand: regex },
      { model: regex },
      { notes: regex },
      { serialNumber: regex },
    ];
  }

  return await Asset.find(query).sort({ createdAt: -1 });
};

export const getAssetById = async (userId, assetId) => {
  const asset = await Asset.findOne({ _id: assetId, user: userId });
  if (!asset) {
    const error = new Error('Asset not found');
    error.statusCode = 404;
    throw error;
  }
  return asset;
};

export const createAsset = async (userId, assetData) => {
  const asset = await Asset.create({
    user: userId,
    name: assetData.name,
    category: assetData.category,
    brand: assetData.brand || '',
    model: assetData.model || '',
    purchaseDate: assetData.purchaseDate || null,
    purchasePrice: assetData.purchasePrice || 0,
    warrantyExpiry: assetData.warrantyExpiry || null,
    serialNumber: assetData.serialNumber || '',
    notes: assetData.notes || '',
  });
  return asset;
};

export const updateAsset = async (userId, assetId, assetData) => {
  const asset = await getAssetById(userId, assetId);

  if (assetData.name !== undefined) asset.name = assetData.name;
  if (assetData.category !== undefined) asset.category = assetData.category;
  if (assetData.brand !== undefined) asset.brand = assetData.brand;
  if (assetData.model !== undefined) asset.model = assetData.model;
  if (assetData.purchaseDate !== undefined) asset.purchaseDate = assetData.purchaseDate || null;
  if (assetData.purchasePrice !== undefined) asset.purchasePrice = assetData.purchasePrice || 0;
  if (assetData.warrantyExpiry !== undefined) asset.warrantyExpiry = assetData.warrantyExpiry || null;
  if (assetData.serialNumber !== undefined) asset.serialNumber = assetData.serialNumber;
  if (assetData.notes !== undefined) asset.notes = assetData.notes;

  await asset.save();
  return asset;
};

export const deleteAsset = async (userId, assetId) => {
  const asset = await getAssetById(userId, assetId);
  await asset.deleteOne();
  return asset;
};
