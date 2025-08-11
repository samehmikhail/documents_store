import { Router } from 'express';
import authRoutes from './auth';
import documentRoutes from './documents';

const router = Router();

router.use('/auth', authRoutes);
router.use('/documents', documentRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

export default router;