import mongoose from 'mongoose';

export const ASSET_CATEGORIES = [
  'electronics',
  'furniture',
  'vehicle',
  'appliance',
  'jewelry',
  'property',
  'investment',
  'other',
];

const assetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Asset name is required'],
      trim: true,
      maxlength: [100, 'Asset name cannot exceed 100 characters'],
    },
    category: {
      type: String,
      enum: {
        values: ASSET_CATEGORIES,
        message: '{VALUE} is not a valid category',
      },
      required: [true, 'Category is required'],
    },
    brand: {
      type: String,
      trim: true,
      default: '',
    },
    model: {
      type: String,
      trim: true,
      default: '',
    },
    purchaseDate: {
      type: Date,
      default: null,
    },
    purchasePrice: {
      type: Number,
      min: [0, 'Purchase price cannot be negative'],
      default: 0,
    },
    warrantyExpiry: {
      type: Date,
      default: null,
    },
    serialNumber: {
      type: String,
      trim: true,
      default: '',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

assetSchema.index({ user: 1, category: 1 });

const Asset = mongoose.model('Asset', assetSchema);

export default Asset;
