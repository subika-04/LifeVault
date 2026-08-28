import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import {
  listDocuments,
  getDocument,
  createDocumentHandler,
  updateDocumentHandler,
  deleteDocumentHandler,
  analyzeDocumentHandler,
  markDocumentPaidHandler,
} from '../controllers/documentController.js';

const router = Router();

router.use(protect);

router.get('/', listDocuments);
router.get('/:id', getDocument);
router.post('/', upload.single('file'), createDocumentHandler);
router.post('/:id/analyze', analyzeDocumentHandler);
router.post('/:id/mark-paid', markDocumentPaidHandler);
router.put('/:id', updateDocumentHandler);
router.delete('/:id', deleteDocumentHandler);

export default router;
