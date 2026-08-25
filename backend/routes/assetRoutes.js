import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import {
  listAssets,
  getAsset,
  createAssetHandler,
  updateAssetHandler,
  deleteAssetHandler,
} from '../controllers/assetController.js';

const router = Router();

router.use(protect);

router.get('/', listAssets);
router.get('/:id', getAsset);
router.post('/', createAssetHandler);
router.put('/:id', updateAssetHandler);
router.delete('/:id', deleteAssetHandler);

export default router;
