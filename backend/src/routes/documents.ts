import { Router } from 'express';
import multer from 'multer';
import { documentController } from '../controllers/documents';
import { authenticateToken } from '../middleware/auth';
import { Config } from '../config';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: Config.MAX_FILE_SIZE
  },
  fileFilter: (req, file, cb) => {
    // Add file type validation if needed
    cb(null, true);
  }
});

// All document routes require authentication
router.use(authenticateToken);

router.post('/upload', upload.single('document'), documentController.uploadDocument.bind(documentController));
router.get('/', documentController.getAllDocuments.bind(documentController));
router.get('/my', documentController.getUserDocuments.bind(documentController));
router.get('/search', documentController.searchDocuments.bind(documentController));
router.get('/:id', documentController.downloadDocument.bind(documentController));
router.delete('/:id', documentController.deleteDocument.bind(documentController));

export default router;